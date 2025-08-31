import { db } from '@/config/firebase.config';
import {
  collection,
  doc,
  updateDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction,
  arrayUnion,
} from 'firebase/firestore';

import { NotificationService } from './notification.service';

export type MessageType = 'text' | 'image' | 'file' | 'order_update' | 'system';
export type ConversationStatus = 'active' | 'closed' | 'archived';
export type ParticipantRole = 'customer' | 'vendor' | 'admin' | 'support';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: ParticipantRole;
  type: MessageType;
  content: string;
  metadata?: Record<string, any>;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  readBy: Array<{
    userId: string;
    readAt: Date;
  }>;
  replyTo?: string; // Message ID being replied to
  edited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  type: 'customer_support' | 'vendor_customer' | 'admin_vendor' | 'group';
  title?: string;
  participants: Array<{
    userId: string;
    userName: string;
    role: ParticipantRole;
    joinedAt: Date;
    lastReadAt?: Date;
    notifications: boolean;
  }>;
  status: ConversationStatus;
  lastMessage?: {
    content: string;
    senderId: string;
    senderName: string;
    timestamp: Date;
    type: MessageType;
  };
  unreadCount: Record<string, number>; // userId -> unread count
  metadata?: Record<string, any>;
  orderId?: string; // If conversation is related to an order
  productId?: string; // If conversation is related to a product
  vendorId?: string; // If conversation involves a vendor
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  assignedTo?: string; // For support conversations
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

export interface CreateConversationData {
  type: Conversation['type'];
  title?: string;
  participants: Array<{
    userId: string;
    userName: string;
    role: ParticipantRole;
  }>;
  orderId?: string;
  productId?: string;
  vendorId?: string;
  priority?: Conversation['priority'];
  tags?: string[];
  initialMessage?: {
    content: string;
    type: MessageType;
    metadata?: Record<string, any>;
  };
}

export interface SendMessageData {
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: ParticipantRole;
  type: MessageType;
  content: string;
  metadata?: Record<string, any>;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  replyTo?: string;
}

export class MessagingService {
  private static CONVERSATIONS_COLLECTION = 'conversations';
  private static MESSAGES_COLLECTION = 'messages';

  /**
   * Create a new conversation
   */
  static async createConversation(data: CreateConversationData): Promise<string> {
    try {
      return await runTransaction(db, async transaction => {
        const conversationDoc = doc(collection(db, this.CONVERSATIONS_COLLECTION));

        const participants = data.participants.map(p => ({
          ...(p as any),
          joinedAt: new Date(),
          notifications: true,
        }));

        const conversation: Omit<Conversation, 'id'> = {
          type: data.type,
          title: data.title,
          participants,
          status: 'active',
          unreadCount: {},
          orderId: data.orderId,
          productId: data.productId,
          vendorId: data.vendorId,
          priority: data.priority || 'medium',
          tags: data.tags || [],
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        transaction.set(conversationDoc, {
          ...conversation,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          participants: participants.map(p => ({
            ...(p as any),
            joinedAt: serverTimestamp(),
          })),
        });

        // Send initial message if provided
        if (data.initialMessage) {
          const messageDoc = doc(collection(db, this.MESSAGES_COLLECTION));
          const message: Omit<Message, 'id'> = {
            conversationId: conversationDoc.id,
            senderId: data.participants[0].userId,
            senderName: data.participants[0].userName,
            senderRole: data.participants[0].role,
            type: data.initialMessage.type,
            content: data.initialMessage.content,
            metadata: data.initialMessage.metadata,
            readBy: [
              {
                userId: data.participants[0].userId,
                readAt: new Date(),
              },
            ],
            edited: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          transaction.set(messageDoc, {
            ...message,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            readBy: [
              {
                userId: data.participants[0].userId,
                readAt: serverTimestamp(),
              },
            ],
          });

          // Update conversation with last message
          transaction.update(conversationDoc, {
            lastMessage: {
              content: data.initialMessage.content,
              senderId: data.participants[0].userId,
              senderName: data.participants[0].userName,
              timestamp: serverTimestamp(),
              type: data.initialMessage.type,
            },
            updatedAt: serverTimestamp(),
          });
        }

        return conversationDoc.id;
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') // console.error('Error creating conversation:', error);
      throw new Error('Failed to create conversation');
    }
  }

  /**
   * Send a message
   */
  static async sendMessage(data: SendMessageData): Promise<string> {
    try {
      return await runTransaction(db, async transaction => {
        const messageDoc = doc(collection(db, this.MESSAGES_COLLECTION));
        const conversationDoc = doc(db, this.CONVERSATIONS_COLLECTION, data.conversationId);

        // Get conversation to update unread counts
        const conversationSnapshot = await transaction.get(conversationDoc);
        if (!conversationSnapshot.exists()) {
          throw new Error('Conversation not found');
        }

        const conversationData = conversationSnapshot.data() as Conversation;

        // Create message
        const message: Omit<Message, 'id'> = {
          conversationId: data.conversationId,
          senderId: data.senderId,
          senderName: data.senderName,
          senderRole: data.senderRole,
          type: data.type,
          content: data.content,
          metadata: data.metadata,
          attachments: data.attachments?.map((att, index) => ({
            ...att,
            id: `${messageDoc.id}_${index}`,
          })),
          readBy: [
            {
              userId: data.senderId,
              readAt: new Date(),
            },
          ],
          replyTo: data.replyTo,
          edited: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        transaction.set(messageDoc, {
          ...message,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          readBy: [
            {
              userId: data.senderId,
              readAt: serverTimestamp(),
            },
          ],
        });

        // Update conversation
        const newUnreadCount = { ...conversationData.unreadCount };
        conversationData.participants.forEach(participant => {
          if (participant.userId !== data.senderId) {
            newUnreadCount[participant.userId] = (newUnreadCount[participant.userId] || 0) + 1;
          }
        });

        transaction.update(conversationDoc, {
          lastMessage: {
            content: data.content,
            senderId: data.senderId,
            senderName: data.senderName,
            timestamp: serverTimestamp(),
            type: data.type,
          },
          unreadCount: newUnreadCount,
          updatedAt: serverTimestamp(),
        });

        // Send notifications to other participants
        const otherParticipants = conversationData.participants.filter(
          p => p.userId !== data.senderId && p.notifications
        );

        for (const participant of otherParticipants) {
          await NotificationService.createNotification(
            participant.userId,
            'message',
            `رسالة جديدة من ${data.senderName}`,
            data.content.substring(0, 100),
            {
              conversationId: data.conversationId,
              senderId: data.senderId,
              senderName: data.senderName,
            },
            'medium'
          );
        }

        return messageDoc.id;
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') // console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      await runTransaction(db, async transaction => {
        // Update conversation unread count
        const conversationDoc = doc(db, this.CONVERSATIONS_COLLECTION, conversationId);
        const conversationSnapshot = await transaction.get(conversationDoc);

        if (conversationSnapshot.exists()) {
          const conversationData = conversationSnapshot.data() as Conversation;
          const newUnreadCount = { ...conversationData.unreadCount };
          newUnreadCount[userId] = 0;

          // Update participant's last read time
          const updatedParticipants = conversationData.participants.map(p =>
            p.userId === userId ? { ...(p as any), lastReadAt: new Date() } : p
          );

          transaction.update(conversationDoc, {
            unreadCount: newUnreadCount,
            participants: updatedParticipants.map(p => ({
              ...(p as any),
              lastReadAt: p.userId === userId ? serverTimestamp() : p.lastReadAt,
            })),
            updatedAt: serverTimestamp(),
          });
        }

        // Mark unread messages as read
        const unreadMessagesQuery = query(
          collection(db, this.MESSAGES_COLLECTION),
          where('conversationId', '==', conversationId),
          where('senderId', '!=', userId),
          orderBy('createdAt', 'desc'),
          limit(50)
        );

        const unreadMessagesSnapshot = await getDocs(unreadMessagesQuery);

        unreadMessagesSnapshot.docs.forEach(messageDoc => {
          const messageData = messageDoc.data() as Message;
          const isAlreadyRead = messageData.readBy?.some(r => r.userId === userId);

          if (!isAlreadyRead) {
            transaction.update(messageDoc.ref, {
              readBy: arrayUnion({
                userId,
                readAt: serverTimestamp(),
              }),
              updatedAt: serverTimestamp(),
            });
          }
        });
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') // console.error('Error marking messages as read:', error);
      throw new Error('Failed to mark messages as read');
    }
  }

  /**
   * Subscribe to user conversations with real-time updates
   */
  static subscribeToUserConversations(
    userId: string,
    callback: (conversations: Conversation[]) => void,
    limitCount: number = 50
  ): () => void {
    const q = query(
      collection(db, this.CONVERSATIONS_COLLECTION),
      where('participants', 'array-contains-any', [{ userId }]),
      orderBy('updatedAt', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(q, snapshot => {
      const conversations = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...(data as any),
          createdAt: data.createdAt.toDate() || new Date(),
          updatedAt: data.updatedAt.toDate() || new Date(),
          closedAt: data.closedAt.toDate() || new Date() || null,
          participants:
            data.participants?.map((p: unknown) => ({
              ...(p as any),
              joinedAt: p.joinedAt.toDate() || new Date(),
              lastReadAt: p.lastReadAt.toDate() || new Date() || null,
            })) || [],
          lastMessage: data.lastMessage
            ? {
                ...data.lastMessage,
                timestamp: data.lastMessage.timestamp.toDate() || new Date(),
              }
            : undefined,
        } as Conversation;
      });
      callback(conversations);
    });
  }

  /**
   * Subscribe to conversation messages with real-time updates
   */
  static subscribeToConversationMessages(
    conversationId: string,
    callback: (messages: Message[]) => void,
    limitCount: number = 100
  ): () => void {
    const q = query(
      collection(db, this.MESSAGES_COLLECTION),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'asc'),
      limit(limitCount)
    );

    return onSnapshot(q, snapshot => {
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...(data as any),
          createdAt: data.createdAt.toDate() || new Date(),
          updatedAt: data.updatedAt.toDate() || new Date(),
          editedAt: data.editedAt.toDate() || new Date() || null,
          readBy:
            data.readBy?.map((r: unknown) => ({
              ...(r as any),
              readAt: r.readAt.toDate() || new Date(),
            })) || [],
        } as Message;
      });
      callback(messages);
    });
  }

  /**
   * Get conversation by ID
   */
  static async getConversation(conversationId: string): Promise<Conversation | null> {
    try {
      const conversationDoc = await getDoc(doc(db, this.CONVERSATIONS_COLLECTION, conversationId));
      if (conversationDoc.exists()) {
        const data = conversationDoc.data();
        return {
          id: conversationDoc.id,
          ...(data as any),
          createdAt: data.createdAt.toDate() || new Date(),
          updatedAt: data.updatedAt.toDate() || new Date(),
          closedAt: data.closedAt.toDate() || new Date() || null,
          participants:
            data.participants?.map((p: unknown) => ({
              ...(p as any),
              joinedAt: p.joinedAt.toDate() || new Date(),
              lastReadAt: p.lastReadAt.toDate() || new Date() || null,
            })) || [],
          lastMessage: data.lastMessage
            ? {
                ...data.lastMessage,
                timestamp: data.lastMessage.timestamp.toDate() || new Date(),
              }
            : undefined,
        } as Conversation;
      }
      return null;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') // console.error('Error getting conversation:', error);
      throw new Error('Failed to get conversation');
    }
  }

  /**
   * Find or create conversation between users
   */
  static async findOrCreateConversation(
    participants: Array<{
      userId: string;
      userName: string;
      role: ParticipantRole;
    }>,
    type: Conversation['type'],
    orderId?: string,
    productId?: string
  ): Promise<string> {
    try {
      // Try to find existing conversation
      const participantIds = participants.map(p => p.userId).sort();

      const q = query(collection(db, this.CONVERSATIONS_COLLECTION), where('type', '==', type));

      const snapshot = await getDocs(q);

      for (const doc of snapshot.docs) {
        const data = doc.data() as Conversation;
        const existingParticipantIds = data.participants.map(p => p.userId).sort();

        if (JSON.stringify(participantIds) === JSON.stringify(existingParticipantIds)) {
          // Check if order/product matches if specified
          if (
            (orderId && data.orderId === orderId) ||
            (productId && data.productId === productId) ||
            (!orderId && !productId)
          ) {
            return doc.id;
          }
        }
      }

      // Create new conversation if not found
      return await this.createConversation({
        type,
        participants,
        orderId,
        productId,
        vendorId: participants.find(p => p.role === 'vendor')?.userId,
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') // console.error('Error finding or creating conversation:', error);
      throw new Error('Failed to find or create conversation');
    }
  }

  /**
   * Close conversation
   */
  static async closeConversation(conversationId: string, closedBy: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.CONVERSATIONS_COLLECTION, conversationId), {
        status: 'closed',
        closedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        metadata: {
          closedBy,
          closedAt: new Date(),
        },
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') // console.error('Error closing conversation:', error);
      throw new Error('Failed to close conversation');
    }
  }

  /**
   * Archive conversation
   */
  static async archiveConversation(conversationId: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.CONVERSATIONS_COLLECTION, conversationId), {
        status: 'archived',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') // console.error('Error archiving conversation:', error);
      throw new Error('Failed to archive conversation');
    }
  }

  /**
   * Add participant to conversation
   */
  static async addParticipant(
    conversationId: string,
    participant: {
      userId: string;
      userName: string;
      role: ParticipantRole;
    }
  ): Promise<void> {
    try {
      await updateDoc(doc(db, this.CONVERSATIONS_COLLECTION, conversationId), {
        participants: arrayUnion({
          ...participant,
          joinedAt: serverTimestamp(),
          notifications: true,
        }),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') // console.error('Error adding participant:', error);
      throw new Error('Failed to add participant');
    }
  }

  /**
   * Remove participant from conversation
   */
  static async removeParticipant(conversationId: string, userId: string): Promise<void> {
    try {
      const conversationDoc = await getDoc(doc(db, this.CONVERSATIONS_COLLECTION, conversationId));
      if (conversationDoc.exists()) {
        const data = conversationDoc.data() as Conversation;
        const updatedParticipants = data.participants.filter(p => p.userId !== userId);

        await updateDoc(conversationDoc.ref, {
          participants: updatedParticipants,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') // console.error('Error removing participant:', error);
      throw new Error('Failed to remove participant');
    }
  }

  /**
   * Edit message
   */
  static async editMessage(messageId: string, newContent: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.MESSAGES_COLLECTION, messageId), {
        content: newContent,
        edited: true,
        editedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') // console.error('Error editing message:', error);
      throw new Error('Failed to edit message');
    }
  }

  /**
   * Get unread conversations count
   */
  static subscribeToUnreadConversationsCount(
    userId: string,
    callback: (count: number) => void
  ): () => void {
    const q = query(
      collection(db, this.CONVERSATIONS_COLLECTION),
      where('participants', 'array-contains-any', [{ userId }]),
      where('status', '==', 'active')
    );

    return onSnapshot(q, snapshot => {
      let unreadCount = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data() as Conversation;
        const userUnreadCount = data.unreadCount[userId] || 0;
        if (userUnreadCount > 0) {
          unreadCount++;
        }
      });
      callback(unreadCount);
    });
  }
}
