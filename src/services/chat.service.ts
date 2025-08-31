/**
 * Real-time Chat Service
 * WebSocket-based chat with offline support and encryption
 */

import { io, Socket } from 'socket.io-client';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
// import { ref, push, set, onValue, off } from 'firebase/database';
import { cacheService } from './cache.service';

// Chat interfaces
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'product' | 'location' | 'voice';
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  attachments?: MessageAttachment[];
  replyTo?: string;
  editedAt?: Date;
  deletedAt?: Date;
  reactions?: MessageReaction[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageAttachment {
  id: string;
  url: string;
  type: 'image' | 'file' | 'video' | 'audio';
  name: string;
  size: number;
  mimeType: string;
  thumbnail?: string;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantDetails: Map<string, ParticipantInfo>;
  type: 'direct' | 'group' | 'support';
  name?: string;
  avatar?: string;
  lastMessage?: ChatMessage;
  lastActivity: Date;
  unreadCount: Map<string, number>;
  isTyping: Map<string, boolean>;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParticipantInfo {
  id: string;
  name: string;
  avatar?: string;
  role: 'member' | 'admin' | 'moderator';
  joinedAt: Date;
  lastSeen: Date;
  isOnline: boolean;
}

export interface ChatEvent {
  type: 'message' | 'typing' | 'presence' | 'reaction' | 'read' | 'delete' | 'edit';
  data: any;
  timestamp: Date;
}

// Chat configuration
interface ChatConfig {
  serverUrl: string;
  reconnectAttempts: number;
  reconnectDelay: number;
  messageRetryAttempts: number;
  encryptMessages: boolean;
  maxFileSize: number; // in bytes
  supportedFileTypes: string[];
}

export class ChatService {
  private static instance: ChatService;
  private socket: Socket | null = null;
  private config: ChatConfig;
  private messageQueue: ChatMessage[] = [];
  private conversations: Map<string, Conversation> = new Map();
  private activeListeners: Map<string, () => void> = new Map();
  private typingTimers: Map<string, NodeJS.Timeout> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnected = false;
  private currentUserId: string | null = null;

  private constructor() {
    this.config = {
      serverUrl: import.meta.env.VITE_CHAT_SERVER_URL || 'wss://chat.souk-el-sayarat.com',
      reconnectAttempts: 5,
      reconnectDelay: 3000,
      messageRetryAttempts: 3,
      encryptMessages: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      supportedFileTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
    };
  }

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  /**
   * Initialize chat service for a user
   */
  async initialize(userId: string): Promise<void> {
    this.currentUserId = userId;
    
    // Connect to WebSocket server
    await this.connectWebSocket();
    
    // Load conversations from cache/database
    await this.loadConversations();
    
    // Set up offline message sync
    this.setupOfflineSync();
    
    // Listen for new messages
    this.listenForMessages();
    
    // console.log('✅ Chat service initialized');
  }

  /**
   * Connect to WebSocket server
   */
  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.config.serverUrl, {
          auth: {
            userId: this.currentUserId,
            token: useAuthStore.getState().user?.token,
          },
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: this.config.reconnectAttempts,
          reconnectionDelay: this.config.reconnectDelay,
        });

        this.socket.on('connect', () => {
          // console.log('✅ WebSocket connected');
          this.isConnected = true;
          this.flushMessageQueue();
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          // console.log('❌ WebSocket disconnected:', reason);
          this.isConnected = false;
          this.handleDisconnect();
        });

        this.socket.on('error', (error) => {
          // console.error('WebSocket error:', error);
          reject(error);
        });

        // Set up message handlers
        this.setupSocketHandlers();
      } catch (error) {
        // console.error('Failed to connect WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Set up WebSocket event handlers
   */
  private setupSocketHandlers(): void {
    if (!this.socket) return;

    // Incoming message
    this.socket.on('message', (data: ChatMessage) => {
      this.handleIncomingMessage(data);
    });

    // Typing indicator
    this.socket.on('typing', (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      this.handleTypingIndicator(data);
    });

    // Message status updates
    this.socket.on('message_status', (data: { messageId: string; status: string }) => {
      this.updateMessageStatus(data.messageId, data.status as any);
    });

    // User presence
    this.socket.on('presence', (data: { userId: string; isOnline: boolean }) => {
      this.updateUserPresence(data.userId, data.isOnline);
    });

    // Message reactions
    this.socket.on('reaction', (data: { messageId: string; reaction: MessageReaction }) => {
      this.handleMessageReaction(data);
    });
  }

  /**
   * Send a message
   */
  async sendMessage(
    conversationId: string,
    content: string,
    type: ChatMessage['type'] = 'text',
    attachments?: MessageAttachment[],
    replyTo?: string
  ): Promise<ChatMessage> {
    const message: ChatMessage = {
      id: this.generateMessageId(),
      conversationId,
      senderId: this.currentUserId!,
      senderName: useAuthStore.getState().user?.displayName || 'User',
      senderAvatar: useAuthStore.getState().user?.photoURL,
      receiverId: this.getReceiverIdFromConversation(conversationId),
      content: this.config.encryptMessages ? await this.encryptMessage(content) : content,
      type,
      status: 'sending',
      attachments,
      replyTo,
      reactions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add to local state immediately for optimistic UI
    this.addMessageToConversation(conversationId, message);

    if (this.isConnected && this.socket) {
      // Send via WebSocket
      this.socket.emit('message', message, (ack: any) => {
        if (ack.success) {
          message.status = 'sent';
          message.id = ack.messageId;
          this.updateMessageInConversation(conversationId, message);
        } else {
          this.handleMessageFailure(message);
        }
      });
    } else {
      // Queue for later sending
      this.messageQueue.push(message);
      await this.saveMessageOffline(message);
    }

    // Also save to Firestore for persistence
    await this.saveMessageToFirestore(message);

    return message;
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(conversationId: string, isTyping: boolean): void {
    if (!this.socket || !this.isConnected) return;

    this.socket.emit('typing', {
      conversationId,
      userId: this.currentUserId,
      isTyping,
    });

    // Auto-stop typing after 5 seconds
    if (isTyping) {
      const existingTimer = this.typingTimers.get(conversationId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        this.sendTypingIndicator(conversationId, false);
        this.typingTimers.delete(conversationId);
      }, 5000);

      this.typingTimers.set(conversationId, timer);
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId: string, messageIds: string[]): Promise<void> {
    if (this.socket && this.isConnected) {
      this.socket.emit('mark_read', { conversationId, messageIds });
    }

    // Update local state
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.unreadCount.set(this.currentUserId!, 0);
    }

    // Update in Firestore
    const batch = db.batch();
    messageIds.forEach(messageId => {
      const messageRef = doc(db, 'messages', messageId);
      batch.update(messageRef, {
        status: 'read',
        readAt: serverTimestamp(),
      });
    });
    await batch.commit();
  }

  /**
   * React to a message
   */
  async addReaction(messageId: string, emoji: string): Promise<void> {
    const reaction: MessageReaction = {
      userId: this.currentUserId!,
      emoji,
      timestamp: new Date(),
    };

    if (this.socket && this.isConnected) {
      this.socket.emit('reaction', { messageId, reaction });
    }

    // Update in Firestore
    const messageRef = doc(db, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);
    if (messageDoc.exists()) {
      const reactions = messageDoc.data().reactions || [];
      reactions.push(reaction);
      await setDoc(messageRef, { reactions }, { merge: true });
    }
  }

  /**
   * Edit a message
   */
  async editMessage(messageId: string, newContent: string): Promise<void> {
    if (this.socket && this.isConnected) {
      this.socket.emit('edit_message', { messageId, newContent });
    }

    // Update in Firestore
    await setDoc(
      doc(db, 'messages', messageId),
      {
        content: this.config.encryptMessages ? await this.encryptMessage(newContent) : newContent,
        editedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    if (this.socket && this.isConnected) {
      this.socket.emit('delete_message', { messageId });
    }

    // Soft delete in Firestore
    await setDoc(
      doc(db, 'messages', messageId),
      {
        deletedAt: serverTimestamp(),
        content: '[Message deleted]',
      },
      { merge: true }
    );
  }

  /**
   * Load conversations for the current user
   */
  private async loadConversations(): Promise<void> {
    // Check cache first
    const cached = await cacheService.get<Conversation[]>(`conversations:${this.currentUserId}`);
    if (cached) {
      cached.forEach(conv => this.conversations.set(conv.id, conv));
    }

    // Load from Firestore
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', this.currentUserId),
      orderBy('lastActivity', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    const conversations: Conversation[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const conversation: Conversation = {
        id: doc.id,
        participants: data.participants,
        participantDetails: new Map(Object.entries(data.participantDetails || {})),
        type: data.type,
        name: data.name,
        avatar: data.avatar,
        lastMessage: data.lastMessage,
        lastActivity: data.lastActivity?.toDate() || new Date(),
        unreadCount: new Map(Object.entries(data.unreadCount || {})),
        isTyping: new Map(),
        isPinned: data.isPinned || false,
        isMuted: data.isMuted || false,
        isArchived: data.isArchived || false,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
      
      this.conversations.set(doc.id, conversation);
      conversations.push(conversation);
    });

    // Cache conversations
    await cacheService.set(`conversations:${this.currentUserId}`, conversations, 300);
  }

  /**
   * Listen for new messages
   */
  private listenForMessages(): void {
    // Listen to Firestore for message updates
    const q = query(
      collection(db, 'messages'),
      where('receiverId', '==', this.currentUserId),
      where('status', 'in', ['sent', 'delivered']),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const message = {
            id: change.doc.id,
            ...change.doc.data(),
            createdAt: change.doc.data().createdAt?.toDate(),
            updatedAt: change.doc.data().updatedAt?.toDate(),
          } as ChatMessage;
          
          this.handleIncomingMessage(message);
        }
      });
    });

    this.activeListeners.set('messages', unsubscribe);
  }

  /**
   * Handle incoming message
   */
  private async handleIncomingMessage(message: ChatMessage): Promise<void> {
    // Decrypt if needed
    if (this.config.encryptMessages) {
      message.content = await this.decryptMessage(message.content);
    }

    // Add to conversation
    this.addMessageToConversation(message.conversationId, message);

    // Update conversation's last message
    const conversation = this.conversations.get(message.conversationId);
    if (conversation) {
      conversation.lastMessage = message;
      conversation.lastActivity = message.createdAt;
      
      // Increment unread count if not from current user
      if (message.senderId !== this.currentUserId) {
        const currentUnread = conversation.unreadCount.get(this.currentUserId!) || 0;
        conversation.unreadCount.set(this.currentUserId!, currentUnread + 1);
      }
    }

    // Emit event for UI updates
    window.dispatchEvent(new CustomEvent('chat:message', { detail: message }));

    // Show notification if app is not focused
    if (document.hidden && message.senderId !== this.currentUserId) {
      this.showNotification(message);
    }
  }

  /**
   * Handle typing indicator
   */
  private handleTypingIndicator(data: { conversationId: string; userId: string; isTyping: boolean }): void {
    const conversation = this.conversations.get(data.conversationId);
    if (conversation) {
      conversation.isTyping.set(data.userId, data.isTyping);
      
      // Emit event for UI updates
      window.dispatchEvent(new CustomEvent('chat:typing', { detail: data }));
    }
  }

  /**
   * Update message status
   */
  private updateMessageStatus(messageId: string, status: ChatMessage['status']): void {
    // Find and update message in conversations
    this.conversations.forEach(conversation => {
      // This would need to search through conversation messages
      // Implementation depends on how messages are stored in conversation
    });

    // Emit event for UI updates
    window.dispatchEvent(new CustomEvent('chat:status', { detail: { messageId, status } }));
  }

  /**
   * Update user presence
   */
  private updateUserPresence(userId: string, isOnline: boolean): void {
    this.conversations.forEach(conversation => {
      const participant = conversation.participantDetails.get(userId);
      if (participant) {
        participant.isOnline = isOnline;
        participant.lastSeen = new Date();
      }
    });

    // Emit event for UI updates
    window.dispatchEvent(new CustomEvent('chat:presence', { detail: { userId, isOnline } }));
  }

  /**
   * Handle message reaction
   */
  private handleMessageReaction(data: { messageId: string; reaction: MessageReaction }): void {
    // Update message reactions in local state
    // Implementation depends on how messages are stored

    // Emit event for UI updates
    window.dispatchEvent(new CustomEvent('chat:reaction', { detail: data }));
  }

  /**
   * Setup offline message sync
   */
  private setupOfflineSync(): void {
    window.addEventListener('online', () => {
      // console.log('📡 Back online, syncing messages...');
      this.flushMessageQueue();
    });
  }

  /**
   * Flush message queue when connection is restored
   */
  private async flushMessageQueue(): Promise<void> {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift()!;
      await this.sendMessage(
        message.conversationId,
        message.content,
        message.type,
        message.attachments,
        message.replyTo
      );
    }
  }

  /**
   * Save message offline for later sync
   */
  private async saveMessageOffline(message: ChatMessage): Promise<void> {
    const offlineMessages = await cacheService.get<ChatMessage[]>('offline_messages') || [];
    offlineMessages.push(message);
    await cacheService.set('offline_messages', offlineMessages, 86400); // 24 hours
  }

  /**
   * Save message to Firestore
   */
  private async saveMessageToFirestore(message: ChatMessage): Promise<void> {
    await setDoc(doc(db, 'messages', message.id), {
      ...message,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Handle disconnection
   */
  private handleDisconnect(): void {
    // Try to reconnect
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        this.connectWebSocket();
        this.reconnectTimer = null;
      }, this.config.reconnectDelay);
    }
  }

  /**
   * Handle message failure
   */
  private handleMessageFailure(message: ChatMessage): void {
    message.status = 'failed';
    this.updateMessageInConversation(message.conversationId, message);
    
    // Add to retry queue
    this.messageQueue.push(message);
  }

  /**
   * Show notification for new message
   */
  private showNotification(message: ChatMessage): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(`New message from ${message.senderName}`, {
        body: message.content,
        icon: message.senderAvatar || '/icon-192.png',
        badge: '/badge-72.png',
        tag: message.id,
        renotify: true,
      });

      notification.onclick = () => {
        window.focus();
        // Navigate to conversation
        window.location.href = `/chat/${message.conversationId}`;
      };
    }
  }

  /**
   * Encrypt message content
   */
  private async encryptMessage(content: string): Promise<string> {
    // Implement encryption logic
    // For now, return as-is
    return content;
  }

  /**
   * Decrypt message content
   */
  private async decryptMessage(content: string): Promise<string> {
    // Implement decryption logic
    // For now, return as-is
    return content;
  }

  /**
   * Helper methods
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getReceiverIdFromConversation(conversationId: string): string {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      return conversation.participants.find(id => id !== this.currentUserId) || '';
    }
    return '';
  }

  private addMessageToConversation(conversationId: string, message: ChatMessage): void {
    // Implementation depends on how messages are stored in conversation
    // This would typically update a messages array or map
  }

  private updateMessageInConversation(conversationId: string, message: ChatMessage): void {
    // Implementation depends on how messages are stored in conversation
  }

  /**
   * Public methods for UI components
   */
  getConversations(): Conversation[] {
    return Array.from(this.conversations.values());
  }

  getConversation(id: string): Conversation | undefined {
    return this.conversations.get(id);
  }

  async createConversation(participantIds: string[], type: Conversation['type'] = 'direct'): Promise<Conversation> {
    const conversationId = this.generateConversationId();
    
    const conversation: Conversation = {
      id: conversationId,
      participants: [this.currentUserId!, ...participantIds],
      participantDetails: new Map(),
      type,
      lastActivity: new Date(),
      unreadCount: new Map(),
      isTyping: new Map(),
      isPinned: false,
      isMuted: false,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to Firestore
    await setDoc(doc(db, 'conversations', conversationId), {
      ...conversation,
      participantDetails: Object.fromEntries(conversation.participantDetails),
      unreadCount: Object.fromEntries(conversation.unreadCount),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    this.conversations.set(conversationId, conversation);
    return conversation;
  }

  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    // Close WebSocket connection
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    // Clear timers
    this.typingTimers.forEach(timer => clearTimeout(timer));
    this.typingTimers.clear();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Unsubscribe from listeners
    this.activeListeners.forEach(unsubscribe => unsubscribe());
    this.activeListeners.clear();

    // Clear local state
    this.conversations.clear();
    this.messageQueue = [];
    this.isConnected = false;
    this.currentUserId = null;
  }
}

// Export singleton instance
export const chatService = ChatService.getInstance();
