/**
 * Live Chat Service
 * Real-time messaging between customers and vendors
 */

import { logger } from '@/utils/logger';
import type { ChatMessage, ChatConversation, User } from '@/types';

export class ChatService {
  private static instance: ChatService;
  private conversations: Map<string, ChatConversation> = new Map();
  private listeners: Map<string, ((message: ChatMessage) => void)[]> = new Map();

  private constructor() {
    this.initializeRealTimeConnection();
  }

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  /**
   * Initialize real-time connection for chat
   */
  private initializeRealTimeConnection(): void {
    if (import.meta.env.VITE_ENABLE_REAL_TIME === 'true') {
      logger.info('Initializing real-time chat connection', {}, 'CHAT');
      // WebSocket or AppSync subscription would go here
    } else {
      logger.info('Chat running in mock mode', {}, 'CHAT');
    }
  }

  /**
   * Send a message
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    recipientId: string,
    content: string,
    attachments?: string[]
  ): Promise<ChatMessage> {
    logger.debug('Sending message', { conversationId, senderId }, 'CHAT');

    const message: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      senderId,
      recipientId,
      content,
      attachments: attachments || [],
      timestamp: new Date().toISOString(),
      read: false,
      delivered: true,
    };

    // In production, send to AWS AppSync or WebSocket
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      // Mock implementation
      this.notifyListeners(conversationId, message);
      return message;
    }

    // Real implementation would be:
    // await this.sendToAppSync(message);
    // await this.sendViaWebSocket(message);

    this.notifyListeners(conversationId, message);
    return message;
  }

  /**
   * Get conversation between two users
   */
  async getConversation(userId1: string, userId2: string): Promise<ChatConversation> {
    const conversationId = this.generateConversationId(userId1, userId2);
    
    let conversation = this.conversations.get(conversationId);

    if (!conversation) {
      conversation = {
        id: conversationId,
        participants: [userId1, userId2],
        messages: [],
        lastMessage: null,
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.conversations.set(conversationId, conversation);
    }

    return conversation;
  }

  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId: string): Promise<ChatConversation[]> {
    logger.debug('Fetching conversations for user', { userId }, 'CHAT');

    // In production, fetch from AWS AppSync
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      return Array.from(this.conversations.values()).filter(conv =>
        conv.participants.includes(userId)
      );
    }

    // Real implementation:
    // return await this.fetchFromAppSync(userId);
    
    return Array.from(this.conversations.values()).filter(conv =>
      conv.participants.includes(userId)
    );
  }

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId: string, userId: string): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return;

    conversation.messages.forEach(msg => {
      if (msg.recipientId === userId && !msg.read) {
        msg.read = true;
        msg.readAt = new Date().toISOString();
      }
    });

    conversation.unreadCount = 0;
    conversation.updatedAt = new Date().toISOString();

    this.conversations.set(conversationId, conversation);
  }

  /**
   * Get unread message count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const conversations = await this.getUserConversations(userId);
    return conversations.reduce((total, conv) => total + conv.unreadCount, 0);
  }

  /**
   * Subscribe to new messages
   */
  subscribeToMessages(
    conversationId: string,
    callback: (message: ChatMessage) => void
  ): () => void {
    if (!this.listeners.has(conversationId)) {
      this.listeners.set(conversationId, []);
    }

    this.listeners.get(conversationId)!.push(callback);

    logger.debug('Subscribed to conversation', { conversationId }, 'CHAT');

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(conversationId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(conversationId: string, userId: string): Promise<void> {
    logger.debug('User typing', { conversationId, userId }, 'CHAT');
    
    // Broadcast typing status via WebSocket or AppSync subscription
    // this.broadcastTyping(conversationId, userId);
  }

  /**
   * Upload attachment (image, file)
   */
  async uploadAttachment(file: File): Promise<string> {
    logger.debug('Uploading attachment', { filename: file.name, size: file.size }, 'CHAT');

    // In production, upload to S3
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      // Mock: return fake URL
      return URL.createObjectURL(file);
    }

    // Real implementation:
    // return await Storage.put(file.name, file);
    
    return URL.createObjectURL(file);
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: string, conversationId: string): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return;

    conversation.messages = conversation.messages.filter(msg => msg.id !== messageId);
    this.conversations.set(conversationId, conversation);

    logger.info('Message deleted', { messageId }, 'CHAT');
  }

  /**
   * Block user
   */
  async blockUser(userId: string, blockedUserId: string): Promise<void> {
    logger.info('User blocked', { userId, blockedUserId }, 'CHAT');
    
    // In production, update user's blocked list in database
    // await this.updateBlockedList(userId, blockedUserId);
  }

  /**
   * Report conversation
   */
  async reportConversation(
    conversationId: string,
    reporterId: string,
    reason: string
  ): Promise<void> {
    logger.warn('Conversation reported', { conversationId, reporterId, reason }, 'CHAT');
    
    // In production, send to admin moderation queue
    // await this.createModerationTicket({ conversationId, reporterId, reason });
  }

  // Private helper methods

  private generateConversationId(userId1: string, userId2: string): string {
    // Sort user IDs to ensure consistent conversation ID
    const sorted = [userId1, userId2].sort();
    return `conv-${sorted[0]}-${sorted[1]}`;
  }

  private notifyListeners(conversationId: string, message: ChatMessage): void {
    const callbacks = this.listeners.get(conversationId);
    if (callbacks) {
      callbacks.forEach(callback => callback(message));
    }
  }

  /**
   * Get conversation messages with pagination
   */
  async getMessages(
    conversationId: string,
    limit: number = 50,
    before?: string
  ): Promise<ChatMessage[]> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return [];

    let messages = conversation.messages;

    if (before) {
      const beforeDate = new Date(before).getTime();
      messages = messages.filter(msg => 
        new Date(msg.timestamp).getTime() < beforeDate
      );
    }

    return messages
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Search messages in conversation
   */
  async searchMessages(conversationId: string, query: string): Promise<ChatMessage[]> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return [];

    return conversation.messages.filter(msg =>
      msg.content.toLowerCase().includes(query.toLowerCase())
    );
  }
}

// Export singleton
export const chatService = ChatService.getInstance();
