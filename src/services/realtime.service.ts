/**
 * 🔄 REAL-TIME SERVICE
 * Core service for managing all real-time operations and WebSocket connections
 * Singleton pattern ensures only one instance exists throughout the app
 */

import { 
  getDatabase, 
  ref, 
  set, 
  onValue, 
  onDisconnect,
  push,
  update,
  serverTimestamp as rtdbServerTimestamp 
} from 'firebase/database';
import { 
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db } from '@/config/firebase.config';
import { UserPresence, ChatMessage } from '@/types';

const realtimeDb = getDatabase();

export class RealtimeService {
  private static instance: RealtimeService;
  private listeners: Map<string, () => void> = new Map();

  private constructor() {
    // Private constructor ensures singleton
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 RealtimeService initialized');
    }
  }

  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  // Set user online status
  async setUserOnline(userId: string, currentPage: string): Promise<void> {
    try {
      const userPresenceRef = ref(realtimeDb, `presence/${userId}`);
      const presenceData = {
        status: 'online',
        lastSeen: rtdbServerTimestamp(),
        currentPage,
        isTyping: false,
      };

      await set(userPresenceRef, presenceData);

      // Set up disconnect handler
      onDisconnect(userPresenceRef).set({
        status: 'offline',
        lastSeen: rtdbServerTimestamp(),
        isTyping: false,
      });
    } catch (error) {
      console.error('❌ Error setting user online:', error);
    }
  }

  // Set user offline
  async setUserOffline(userId: string): Promise<void> {
    try {
      const userPresenceRef = ref(realtimeDb, `presence/${userId}`);
      await set(userPresenceRef, {
        status: 'offline',
        lastSeen: rtdbServerTimestamp(),
        isTyping: false,
      });
    } catch (error) {
      console.error('❌ Error setting user offline:', error);
    }
  }

  // Listen to specific user's presence
  listenToUserPresence(userId: string, callback: (presence: UserPresence) => void) {
    const userPresenceRef = ref(realtimeDb, `presence/${userId}`);
    return onValue(userPresenceRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        callback({
          userId,
          status: data.status || 'offline',
          lastSeen: new Date(data.lastSeen || Date.now()),
          currentPage: data.currentPage,
          isTyping: data.isTyping,
        });
      }
    });
  }

  // Listen to all users presence
  listenToAllUsersPresence(callback: (presenceList: UserPresence[]) => void) {
    const presenceRef = ref(realtimeDb, 'presence');
    return onValue(presenceRef, snapshot => {
      const data = snapshot.val() || {};
      const presenceList: UserPresence[] = [];
      Object.keys(data).forEach(userId => {
        presenceList.push({
          userId,
          status: data[userId].status || 'offline',
          lastSeen: new Date(data[userId].lastSeen || Date.now()),
          currentPage: data[userId].currentPage,
          isTyping: data[userId].isTyping,
        });
      });
      callback(presenceList);
    });
  }

  // Update user presence
  async updateUserPresence(userId: string, updates: Partial<UserPresence>): Promise<void> {
    try {
      const userPresenceRef = ref(realtimeDb, `presence/${userId}`);
      await update(userPresenceRef, updates);
    } catch (error) {
      console.error('❌ Error updating user presence:', error);
    }
  }

  // Send message
  async sendMessage(senderId: string, receiverId: string, message: string, type: string = 'text'): Promise<string> {
    try {
      const messagesRef = ref(realtimeDb, 'messages');
      const newMessageRef = push(messagesRef);
      const messageData: ChatMessage = {
        id: newMessageRef.key!,
        senderId,
        receiverId,
        message,
        timestamp: new Date(),
        read: false,
        type: type as 'text' | 'image' | 'file',
      };
      await set(newMessageRef, messageData);
      return newMessageRef.key!;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  }

  // Mark message as read
  async markMessageAsRead(currentUserId: string, senderId: string, messageId: string): Promise<void> {
    try {
      const messageRef = ref(realtimeDb, `messages/${messageId}`);
      await update(messageRef, { read: true });
    } catch (error) {
      console.error('❌ Error marking message as read:', error);
    }
  }

  // Listen to chat messages
  listenToChatMessages(senderId: string, receiverId: string, callback: (messages: ChatMessage[]) => void) {
    const messagesRef = ref(realtimeDb, 'messages');
    return onValue(messagesRef, snapshot => {
      const data = snapshot.val() || {};
      const messages: ChatMessage[] = [];
      Object.keys(data).forEach(key => {
        const msg = data[key];
        if ((msg.senderId === senderId && msg.receiverId === receiverId) ||
            (msg.senderId === receiverId && msg.receiverId === senderId)) {
          messages.push({
            ...msg,
            id: key,
            timestamp: new Date(msg.timestamp),
          });
        }
      });
      messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      callback(messages);
    });
  }

  // Listen to user notifications
  listenToUserNotifications(userId: string, callback: (notifications: any[]) => void) {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, snapshot => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
      callback(notifications);
    });
  }

  // Send notification
  async sendNotification(userId: string, notification: any): Promise<void> {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId,
        ...notification,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('❌ Error sending notification:', error);
    }
  }

  // Listen to user orders
  listenToUserOrders(userId: string, userRole: string, callback: (orders: unknown[]) => void) {
    const q = userRole === 'vendor'
      ? query(collection(db, 'orders'), where('vendorId', '==', userId), orderBy('createdAt', 'desc'))
      : query(collection(db, 'orders'), where('customerId', '==', userId), orderBy('createdAt', 'desc'));

    return onSnapshot(q, snapshot => {
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(orders);
    });
  }

  // Listen to vendor products
  listenToVendorProducts(vendorId: string, callback: (products: unknown[]) => void) {
    const q = query(collection(db, 'products'), where('vendorId', '==', vendorId));

    return onSnapshot(q, snapshot => {
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(products);
    });
  }

  // Listen to analytics
  listenToAnalytics(callback: (analytics: unknown) => void) {
    const analyticsRef = ref(realtimeDb, 'analytics');
    return onValue(analyticsRef, snapshot => {
      callback(snapshot.val() || {});
    });
  }

  // Add activity
  async addActivity(userId: string, type: string, data: unknown): Promise<void> {
    try {
      const activitiesRef = collection(db, 'activities');
      await addDoc(activitiesRef, {
        userId,
        type,
        data,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('❌ Error adding activity:', error);
    }
  }

  // Cleanup real-time listeners
  cleanup(): void {
    // This method is called when the service is no longer needed
    // Individual listeners should be cleaned up by the components using them
    if (process.env.NODE_ENV === 'development') {
      console.log('🧹 Realtime service cleanup completed');
    }
  }
}

export default RealtimeService;