/**
 * Professional Live Chat Service
 * Enterprise-level real-time chat with Firebase Realtime Database
 */

import { 
  ref, 
  push, 
  onValue, 
  off, 
  update, 
  query, 
  orderByChild, 
  limitToLast,
  serverTimestamp,
  onDisconnect,
  set
} from 'firebase/database';
import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { realtimeDb, db } from '@/config/firebase.config';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'vendor' | 'admin' | 'support';
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  timestamp: Date;
  readBy: Record<string, Date>;
  edited: boolean;
  editedAt?: Date;
  replyTo?: string;
  metadata?: {
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    imageUrl?: string;
    imageThumbnail?: string;
  };
}

export interface ChatConversation {
  id: string;
  type: 'customer_support' | 'vendor_customer' | 'admin_vendor' | 'group';
  title: string;
  participants: ChatParticipant[];
  lastMessage?: ChatMessage;
  unreadCount: Record<string, number>;
  status: 'active' | 'closed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

export interface ChatParticipant {
  userId: string;
  userName: string;
  role: 'customer' | 'vendor' | 'admin' | 'support';
  joinedAt: Date;
  lastReadAt?: Date;
  isOnline: boolean;
  lastSeen?: Date;
  avatar?: string;
}

export interface ChatSubscription {
  conversationId: string;
  unsubscribe: () => void;
  messageHandler?: (message: ChatMessage) => void;
  typingHandler?: (typing: TypingIndicator) => void;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  isTyping: boolean;
  timestamp: Date;
}

export interface ChatStats {
  totalConversations: number;
  activeConversations: number;
  unreadMessages: number;
  averageResponseTime: number;
  customerSatisfaction: number;
}

export class ProfessionalChatService {
  private static instance: ProfessionalChatService;
  private subscriptions: Map<string, ChatSubscription> = new Map();
  private typingIndicators: Map<string, TypingIndicator> = new Map();
  private isOnline = false;
  private currentUserId: string | null = null;
  private presenceRef: any = null;

  static getInstance(): ProfessionalChatService {
    if (!ProfessionalChatService.instance) {
      ProfessionalChatService.instance = new ProfessionalChatService();
    }
    return ProfessionalChatService.instance;
  }

  /**
   * Initialize chat service
   */
  async initialize(userId: string): Promise<void> {
    try {
      this.currentUserId = userId;
      
      // Set up presence
      await this.setupPresence(userId);
      
      // Set up connection monitoring
      this.setupConnectionMonitoring();
      
      console.log('✅ Professional chat service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize chat service:', error);
      throw error;
    }
  }

  /**
   * Set up user presence
   */
  private async setupPresence(userId: string): Promise<void> {
    try {
      this.presenceRef = ref(realtimeDb, `presence/${userId}`);
      
      // Set user as online
      await set(this.presenceRef, {
        isOnline: true,
        lastSeen: serverTimestamp(),
        status: 'available'
      });

      // Set up disconnect handler
      onDisconnect(this.presenceRef).set({
        isOnline: false,
        lastSeen: serverTimestamp(),
        status: 'offline'
      });

      this.isOnline = true;
    } catch (error) {
      console.error('Error setting up presence:', error);
    }
  }

  /**
   * Create new conversation
   */
  async createConversation(
    type: ChatConversation['type'],
    participants: Omit<ChatParticipant, 'joinedAt' | 'isOnline' | 'lastSeen'>[],
    title?: string,
    priority: ChatConversation['priority'] = 'medium'
  ): Promise<string> {
    try {
      const conversationId = push(ref(realtimeDb, 'conversations')).key!;
      const now = new Date();

      const conversation: ChatConversation = {
        id: conversationId,
        type,
        title: title || this.generateConversationTitle(type, participants),
        participants: participants.map(p => ({
          ...p,
          joinedAt: now,
          isOnline: false,
          lastSeen: now
        })),
        unreadCount: {},
        status: 'active',
        priority,
        tags: [],
        createdAt: now,
        updatedAt: now
      };

      // Save to Realtime Database
      await set(ref(realtimeDb, `conversations/${conversationId}`), conversation);

      // Save to Firestore for persistence
      await setDoc(doc(db, 'conversations', conversationId), conversation);

      console.log(`✅ Conversation created: ${conversationId}`);
      return conversationId;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Send message
   */
  async sendMessage(
    conversationId: string,
    content: string,
    type: ChatMessage['type'] = 'text',
    metadata?: ChatMessage['metadata'],
    replyTo?: string
  ): Promise<string> {
    try {
      if (!this.currentUserId) {
        throw new Error('User not authenticated');
      }

      const messageId = push(ref(realtimeDb, `conversations/${conversationId}/messages`)).key!;
      const now = new Date();

      // Get user info
      const userInfo = await this.getUserInfo(this.currentUserId);
      
      const message: ChatMessage = {
        id: messageId,
        conversationId,
        senderId: this.currentUserId,
        senderName: userInfo.name,
        senderRole: userInfo.role,
        content,
        type,
        timestamp: now,
        readBy: { [this.currentUserId]: now },
        edited: false,
        replyTo,
        metadata
      };

      // Save message to Realtime Database
      await set(ref(realtimeDb, `conversations/${conversationId}/messages/${messageId}`), message);

      // Update conversation last message
      await update(ref(realtimeDb, `conversations/${conversationId}`), {
        lastMessage: message,
        updatedAt: now.toISOString()
      });

      // Save to Firestore for persistence
      await setDoc(doc(db, 'conversations', conversationId, 'messages', messageId), message);

      // Update unread count for other participants
      await this.updateUnreadCount(conversationId, this.currentUserId);

      console.log(`✅ Message sent: ${messageId}`);
      return messageId;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Subscribe to conversation messages
   */
  async subscribeToConversation(
    conversationId: string,
    onMessage: (message: ChatMessage) => void,
    onTyping?: (typing: TypingIndicator) => void
  ): Promise<ChatSubscription> {
    try {
      const messagesRef = ref(realtimeDb, `conversations/${conversationId}/messages`);
      const typingRef = ref(realtimeDb, `conversations/${conversationId}/typing`);

      // Subscribe to messages
      const messageUnsubscribe = onValue(messagesRef, (snapshot) => {
        const messages = snapshot.val();
        if (messages) {
          Object.values(messages).forEach((message: any) => {
            const chatMessage: ChatMessage = {
              ...message,
              timestamp: new Date(message.timestamp)
            };
            onMessage(chatMessage);
          });
        }
      });

      // Subscribe to typing indicators
      let typingUnsubscribe: (() => void) | undefined;
      if (onTyping) {
        typingUnsubscribe = onValue(typingRef, (snapshot) => {
          const typing = snapshot.val();
          if (typing) {
            Object.values(typing).forEach((indicator: any) => {
              const typingIndicator: TypingIndicator = {
                ...indicator,
                timestamp: new Date(indicator.timestamp)
              };
              onTyping(typingIndicator);
            });
          }
        });
      }

      const subscription: ChatSubscription = {
        conversationId,
        unsubscribe: () => {
          messageUnsubscribe();
          typingUnsubscribe?.();
        },
        messageHandler: onMessage,
        typingHandler: onTyping
      };

      this.subscriptions.set(conversationId, subscription);
      return subscription;
    } catch (error) {
      console.error('Error subscribing to conversation:', error);
      throw error;
    }
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(conversationId: string, messageId: string): Promise<void> {
    try {
      if (!this.currentUserId) return;

      const messageRef = ref(realtimeDb, `conversations/${conversationId}/messages/${messageId}/readBy/${this.currentUserId}`);
      await set(messageRef, new Date().toISOString());

      // Update unread count
      await this.updateUnreadCount(conversationId, this.currentUserId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  /**
   * Set typing indicator
   */
  async setTypingIndicator(conversationId: string, isTyping: boolean): Promise<void> {
    try {
      if (!this.currentUserId) return;

      const typingRef = ref(realtimeDb, `conversations/${conversationId}/typing/${this.currentUserId}`);
      
      if (isTyping) {
        const userInfo = await this.getUserInfo(this.currentUserId);
        await set(typingRef, {
          userId: this.currentUserId,
          userName: userInfo.name,
          isTyping: true,
          timestamp: new Date().toISOString()
        });

        // Auto-clear typing indicator after 3 seconds
        setTimeout(() => {
          this.clearTypingIndicator(conversationId);
        }, 3000);
      } else {
        await set(typingRef, null);
      }
    } catch (error) {
      console.error('Error setting typing indicator:', error);
    }
  }

  /**
   * Clear typing indicator
   */
  private async clearTypingIndicator(conversationId: string): Promise<void> {
    try {
      if (!this.currentUserId) return;

      const typingRef = ref(realtimeDb, `conversations/${conversationId}/typing/${this.currentUserId}`);
      await set(typingRef, null);
    } catch (error) {
      console.error('Error clearing typing indicator:', error);
    }
  }

  /**
   * Get conversation list
   */
  async getConversations(userId: string): Promise<ChatConversation[]> {
    try {
      const conversationsRef = ref(realtimeDb, 'conversations');
      const snapshot = await new Promise((resolve, reject) => {
        onValue(conversationsRef, resolve, reject, { onlyOnce: true });
      });

      const conversations: ChatConversation[] = [];
      const data = snapshot.val();

      if (data) {
        Object.values(data).forEach((conversation: any) => {
          // Check if user is participant
          const isParticipant = conversation.participants.some(
            (p: ChatParticipant) => p.userId === userId
          );

          if (isParticipant) {
            conversations.push({
              ...conversation,
              createdAt: new Date(conversation.createdAt),
              updatedAt: new Date(conversation.updatedAt),
              closedAt: conversation.closedAt ? new Date(conversation.closedAt) : undefined
            });
          }
        });
      }

      return conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw error;
    }
  }

  /**
   * Get conversation messages
   */
  async getConversationMessages(conversationId: string, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const messagesRef = query(
        ref(realtimeDb, `conversations/${conversationId}/messages`),
        orderByChild('timestamp'),
        limitToLast(limit)
      );

      const snapshot = await new Promise((resolve, reject) => {
        onValue(messagesRef, resolve, reject, { onlyOnce: true });
      });

      const messages: ChatMessage[] = [];
      const data = snapshot.val();

      if (data) {
        Object.values(data).forEach((message: any) => {
          messages.push({
            ...message,
            timestamp: new Date(message.timestamp)
          });
        });
      }

      return messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      throw error;
    }
  }

  /**
   * Get chat statistics
   */
  async getChatStats(): Promise<ChatStats> {
    try {
      // This would calculate real-time stats
      // For now, return mock data
      return {
        totalConversations: 0,
        activeConversations: 0,
        unreadMessages: 0,
        averageResponseTime: 0,
        customerSatisfaction: 0
      };
    } catch (error) {
      console.error('Error getting chat stats:', error);
      throw error;
    }
  }

  /**
   * Close conversation
   */
  async closeConversation(conversationId: string, reason?: string): Promise<void> {
    try {
      const conversationRef = ref(realtimeDb, `conversations/${conversationId}`);
      await update(conversationRef, {
        status: 'closed',
        closedAt: new Date().toISOString(),
        closeReason: reason
      });
    } catch (error) {
      console.error('Error closing conversation:', error);
      throw error;
    }
  }

  /**
   * Archive conversation
   */
  async archiveConversation(conversationId: string): Promise<void> {
    try {
      const conversationRef = ref(realtimeDb, `conversations/${conversationId}`);
      await update(conversationRef, {
        status: 'archived',
        archivedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error archiving conversation:', error);
      throw error;
    }
  }

  // Private helper methods

  private generateConversationTitle(
    type: ChatConversation['type'],
    participants: Omit<ChatParticipant, 'joinedAt' | 'isOnline' | 'lastSeen'>[]
  ): string {
    switch (type) {
      case 'customer_support':
        return 'Customer Support';
      case 'vendor_customer':
        return 'Vendor Communication';
      case 'admin_vendor':
        return 'Admin Communication';
      case 'group':
        return participants.map(p => p.userName).join(', ');
      default:
        return 'Chat';
    }
  }

  private async getUserInfo(userId: string): Promise<{ name: string; role: string }> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          name: userData.displayName || userData.name || 'Unknown User',
          role: userData.role || 'customer'
        };
      }
      return { name: 'Unknown User', role: 'customer' };
    } catch (error) {
      console.error('Error getting user info:', error);
      return { name: 'Unknown User', role: 'customer' };
    }
  }

  private async updateUnreadCount(conversationId: string, userId: string): Promise<void> {
    try {
      const conversationRef = ref(realtimeDb, `conversations/${conversationId}/unreadCount/${userId}`);
      await set(conversationRef, 0);
    } catch (error) {
      console.error('Error updating unread count:', error);
    }
  }

  private setupConnectionMonitoring(): void {
    const connectedRef = ref(realtimeDb, '.info/connected');
    onValue(connectedRef, (snapshot) => {
      this.isOnline = snapshot.val() === true;
      console.log(this.isOnline ? '🟢 Chat connected' : '🔴 Chat disconnected');
    });
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
    this.typingIndicators.clear();
    
    if (this.presenceRef) {
      off(this.presenceRef);
    }
  }
}

export default ProfessionalChatService;