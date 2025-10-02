/**
 * Chat Type Definitions
 * Types for messaging system
 */

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  attachments?: string[];
  timestamp: string;
  read: boolean;
  delivered: boolean;
  readAt?: string;
  deletedAt?: string;
}

export interface ChatConversation {
  id: string;
  participants: string[]; // User IDs
  messages: ChatMessage[];
  lastMessage: ChatMessage | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  archivedBy?: string[];
  blockedBy?: string[];
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  timestamp: string;
}

export interface ChatNotification {
  id: string;
  userId: string;
  conversationId: string;
  message: string;
  timestamp: string;
  read: boolean;
}
