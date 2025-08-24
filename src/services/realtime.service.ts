/**
 * Real-time Service for Souk El-Sayarat
 * Handles real-time updates using Firebase Realtime Database
 */

import { db, realtimeDb } from '@/config/firebase.config';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { 
  ref, 
  set, 
  push, 
  onValue, 
  off, 
  get,
  update,
  remove
} from 'firebase/database';
import type { User, Vendor, Order, Product } from '@/types';

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'text' | 'image' | 'file';
  data?: Record<string, any>;
}

export interface UserPresence {
  userId: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
  currentPage?: string;
  isTyping?: boolean;
}

export class RealtimeService {
  private static instance: RealtimeService;
  private presenceRef = ref(realtimeDb, 'presence');
  private chatRef = ref(realtimeDb, 'chat');
  private activityRef = ref(realtimeDb, 'activity');

  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  // Initialize real-time services for a user
  async initializeForUser(userId: string): Promise<void> {
    try {
      // Set initial presence
      await this.setUserOnline(userId, 'dashboard');
      console.log('✅ Realtime services initialized for user:', userId);
    } catch (error) {
      console.error('❌ Error initializing realtime services:', error);
      throw error;
    }
  }

  // Listen to user presence
  listenToUserPresence(userId: string, callback: (presence: UserPresence) => void) {
    const userPresenceRef = ref(realtimeDb, `presence/${userId}`);
    
    const unsubscribe = onValue(userPresenceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        callback({
          userId,
          status: data.status || 'offline',
          lastSeen: new Date(data.lastSeen || Date.now()),
          currentPage: data.currentPage,
          isTyping: data.isTyping || false
        });
      }
    });

    return unsubscribe;
  }

  // Listen to all users presence
  listenToAllUsersPresence(callback: (presenceList: UserPresence[]) => void) {
    const unsubscribe = onValue(this.presenceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const presenceList: UserPresence[] = Object.entries(data).map(([userId, userData]: [string, any]) => ({
          userId,
          status: userData.status || 'offline',
          lastSeen: new Date(userData.lastSeen || Date.now()),
          currentPage: userData.currentPage,
          isTyping: userData.isTyping || false
        }));
        callback(presenceList);
      } else {
        callback([]);
      }
    });

    return unsubscribe;
  }

  // Listen to user notifications
  listenToUserNotifications(userId: string, callback: (notifications: any[]) => void) {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(notifications);
    });
  }

  // Listen to activity feed
  listenToActivityFeed(callback: (activities: any[]) => void) {
    const q = query(
      collection(db, 'activities'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    return onSnapshot(q, (snapshot) => {
      const activities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(activities);
    });
  }

  // Set user online status
  async setUserOnline(userId: string, currentPage: string = 'dashboard'): Promise<void> {
    try {
      const userPresenceRef = ref(realtimeDb, `presence/${userId}`);
      await set(userPresenceRef, {
        status: 'online',
        lastSeen: Date.now(),
        currentPage,
        isTyping: false
      });
    } catch (error) {
      console.error('❌ Error setting user online:', error);
      throw error;
    }
  }

  // Set user offline status
  async setUserOffline(userId: string): Promise<void> {
    try {
      const userPresenceRef = ref(realtimeDb, `presence/${userId}`);
      await update(userPresenceRef, {
        status: 'offline',
        lastSeen: Date.now()
      });
    } catch (error) {
      console.error('❌ Error setting user offline:', error);
      throw error;
    }
  }

  // Send chat message
  async sendMessage(
    senderId: string,
    receiverId: string,
    message: string,
    type: 'text' | 'image' | 'file' = 'text',
    data?: Record<string, any>
  ): Promise<string> {
    try {
      const chatRef = ref(realtimeDb, `chat/${this.getChatId(senderId, receiverId)}`);
      const newMessageRef = push(chatRef);
      
      const messageData: Omit<ChatMessage, 'id'> = {
        senderId,
        receiverId,
        message,
        timestamp: new Date(),
        read: false,
        type,
        data: data || {}
      };

      await set(newMessageRef, messageData);
      return newMessageRef.key || '';
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  }

  // Mark message as read
  async markMessageAsRead(senderId: string, receiverId: string, messageId: string): Promise<void> {
    try {
      const messageRef = ref(realtimeDb, `chat/${this.getChatId(senderId, receiverId)}/${messageId}`);
      await update(messageRef, {
        read: true
      });
    } catch (error) {
      console.error('❌ Error marking message as read:', error);
      throw error;
    }
  }

  // Listen to chat messages
  listenToChatMessages(senderId: string, receiverId: string, callback: (messages: ChatMessage[]) => void) {
    const chatRef = ref(realtimeDb, `chat/${this.getChatId(senderId, receiverId)}`);
    
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messages: ChatMessage[] = Object.entries(data).map(([id, messageData]: [string, any]) => ({
          id,
          senderId: messageData.senderId,
          receiverId: messageData.receiverId,
          message: messageData.message,
          timestamp: new Date(messageData.timestamp),
          read: messageData.read || false,
          type: messageData.type || 'text',
          data: messageData.data || {}
        }));
        
        // Sort by timestamp
        messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        callback(messages);
      } else {
        callback([]);
      }
    });

    return unsubscribe;
  }

  // Listen to user orders
  listenToUserOrders(userId: string, userRole: string, callback: (orders: any[]) => void) {
    let q;
    
    if (userRole === 'vendor') {
      q = query(
        collection(db, 'orders'),
        where('vendorId', '==', userId),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'orders'),
        where('customerId', '==', userId),
        orderBy('createdAt', 'desc')
      );
    }
    
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(orders);
    });
  }

  // Listen to vendor products
  listenToVendorProducts(vendorId: string, callback: (products: any[]) => void) {
    const q = query(
      collection(db, 'products'),
      where('vendorId', '==', vendorId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(products);
    });
  }

  // Listen to analytics
  listenToAnalytics(callback: (analytics: any) => void) {
    const analyticsRef = ref(realtimeDb, 'analytics');
    
    const unsubscribe = onValue(analyticsRef, (snapshot) => {
      const data = snapshot.val();
      callback(data || {});
    });

    return unsubscribe;
  }

  // Add activity
  async addActivity(userId: string, type: string, data: Record<string, any>): Promise<void> {
    try {
      const activityRef = ref(realtimeDb, `activity/${userId}`);
      const newActivityRef = push(activityRef);
      
      await set(newActivityRef, {
        type,
        data,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('❌ Error adding activity:', error);
      throw error;
    }
  }

  // Update user typing status
  async updateTypingStatus(userId: string, isTyping: boolean): Promise<void> {
    try {
      const userPresenceRef = ref(realtimeDb, `presence/${userId}`);
      await update(userPresenceRef, {
        isTyping,
        lastSeen: Date.now()
      });
    } catch (error) {
      console.error('❌ Error updating typing status:', error);
      throw error;
    }
  }

  // Get chat ID for two users
  private getChatId(userId1: string, userId2: string): string {
    // Sort user IDs to ensure consistent chat ID
    const sortedIds = [userId1, userId2].sort();
    return `${sortedIds[0]}_${sortedIds[1]}`;
  }

  // Cleanup real-time listeners
  cleanup(): void {
    // This method is called when the service is no longer needed
    // Individual listeners should be cleaned up by the components using them
    console.log('🧹 Realtime service cleanup completed');
  }
}

// Export singleton instance
export const realtimeService = RealtimeService.getInstance();
