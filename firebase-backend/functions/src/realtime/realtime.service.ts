/**
 * Real-time Database Service - 2025 Standards
 * Implements real-time synchronization with conflict resolution
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

interface RealtimeUpdate {
  path: string;
  data: any;
  userId: string;
  timestamp: number;
  operation: 'create' | 'update' | 'delete';
  version: number;
}

interface ConflictResolution {
  strategy: 'last-write-wins' | 'merge' | 'manual';
  resolver?: (local: any, remote: any) => any;
}

export class RealtimeService {
  private db = admin.firestore();
  private realtimeDb = admin.database();
  private listeners = new Map<string, any>();
  
  /**
   * Initialize real-time listeners for a collection
   */
  async initializeListeners(collection: string, options?: { 
    conflictResolution?: ConflictResolution,
    syncInterval?: number 
  }) {
    try {
      // Firestore to Realtime DB sync
      const unsubscribe = this.db.collection(collection)
        .onSnapshot(async (snapshot) => {
          const batch = this.realtimeDb.ref(`sync/${collection}`);
          
          for (const change of snapshot.docChanges()) {
            const data = {
              id: change.doc.id,
              data: change.doc.data(),
              type: change.type,
              timestamp: Date.now()
            };
            
            switch (change.type) {
              case 'added':
              case 'modified':
                await batch.child(change.doc.id).set(data);
                break;
              case 'removed':
                await batch.child(change.doc.id).remove();
                break;
            }
            
            // Emit real-time event
            await this.emitEvent(collection, change.type, data);
          }
        });
      
      this.listeners.set(collection, unsubscribe);
      
      // Setup bidirectional sync
      this.realtimeDb.ref(`sync/${collection}`).on('child_changed', async (snapshot) => {
        const data = snapshot.val();
        if (data && data.source !== 'firestore') {
          // Update Firestore from Realtime DB
          await this.db.collection(collection).doc(data.id).set(data.data, { merge: true });
        }
      });
      
      console.log(`Real-time listeners initialized for ${collection}`);
      return true;
    } catch (error) {
      console.error('Initialize listeners error:', error);
      return false;
    }
  }
  
  /**
   * Emit real-time event to connected clients
   */
  private async emitEvent(collection: string, type: string, data: any) {
    const event = {
      collection,
      type,
      data,
      timestamp: Date.now()
    };
    
    // Broadcast to all connected clients
    await this.realtimeDb.ref('events').push(event);
    
    // Store in event log
    await this.db.collection('event_log').add({
      ...event,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  
  /**
   * Subscribe to real-time updates
   */
  async subscribe(path: string, callback: (data: any) => void): Promise<() => void> {
    const ref = this.realtimeDb.ref(path);
    
    const listener = ref.on('value', (snapshot) => {
      callback(snapshot.val());
    });
    
    // Return unsubscribe function
    return () => ref.off('value', listener);
  }
  
  /**
   * Perform real-time transaction
   */
  async transaction(path: string, updateFunction: (current: any) => any): Promise<any> {
    try {
      const ref = this.realtimeDb.ref(path);
      
      const result = await ref.transaction((current) => {
        if (current === null) {
          return updateFunction({});
        }
        return updateFunction(current);
      });
      
      return result.snapshot.val();
    } catch (error) {
      console.error('Transaction error:', error);
      throw error;
    }
  }
  
  /**
   * Real-time presence system
   */
  async updatePresence(userId: string, status: 'online' | 'away' | 'offline') {
    const userStatusRef = this.realtimeDb.ref(`status/${userId}`);
    
    const isOfflineForDatabase = {
      state: 'offline',
      last_changed: admin.database.ServerValue.TIMESTAMP,
    };
    
    const isOnlineForDatabase = {
      state: status,
      last_changed: admin.database.ServerValue.TIMESTAMP,
    };
    
    // Set offline status when client disconnects
    await userStatusRef.onDisconnect().set(isOfflineForDatabase);
    
    // Set online status
    await userStatusRef.set(isOnlineForDatabase);
    
    // Also update Firestore
    await this.db.collection('users').doc(userId).update({
      onlineStatus: status,
      lastSeen: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  
  /**
   * Real-time chat functionality
   */
  async sendMessage(chatId: string, message: {
    senderId: string;
    text: string;
    attachments?: any[];
  }) {
    try {
      // Add to Realtime DB for instant delivery
      const messageRef = await this.realtimeDb.ref(`chats/${chatId}/messages`).push({
        ...message,
        timestamp: admin.database.ServerValue.TIMESTAMP,
        delivered: false,
        read: false
      });
      
      // Also store in Firestore for persistence
      await this.db.collection('chats').doc(chatId)
        .collection('messages').doc(messageRef.key!).set({
          ...message,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          delivered: false,
          read: false
        });
      
      // Update chat metadata
      await this.db.collection('chats').doc(chatId).update({
        lastMessage: message.text,
        lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
        unreadCount: admin.firestore.FieldValue.increment(1)
      });
      
      // Send push notification
      await this.sendNotification(chatId, message);
      
      return messageRef.key;
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }
  
  /**
   * Mark messages as delivered/read
   */
  async updateMessageStatus(chatId: string, messageId: string, status: 'delivered' | 'read') {
    try {
      // Update in Realtime DB
      await this.realtimeDb.ref(`chats/${chatId}/messages/${messageId}`).update({
        [status]: true,
        [`${status}At`]: admin.database.ServerValue.TIMESTAMP
      });
      
      // Update in Firestore
      await this.db.collection('chats').doc(chatId)
        .collection('messages').doc(messageId).update({
          [status]: true,
          [`${status}At`]: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
      console.error('Update message status error:', error);
    }
  }
  
  /**
   * Real-time inventory tracking
   */
  async updateInventory(productId: string, quantity: number, operation: 'add' | 'subtract' | 'set') {
    try {
      const ref = this.realtimeDb.ref(`inventory/${productId}`);
      
      await ref.transaction((current) => {
        if (current === null) {
          return operation === 'set' ? quantity : 0;
        }
        
        switch (operation) {
          case 'add':
            return current + quantity;
          case 'subtract':
            return Math.max(0, current - quantity);
          case 'set':
            return quantity;
          default:
            return current;
        }
      });
      
      // Sync with Firestore
      const snapshot = await ref.once('value');
      const newQuantity = snapshot.val();
      
      await this.db.collection('products').doc(productId).update({
        inventory: newQuantity,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Check for low stock alert
      if (newQuantity < 10) {
        await this.createAlert('low_stock', {
          productId,
          quantity: newQuantity
        });
      }
      
      return newQuantity;
    } catch (error) {
      console.error('Update inventory error:', error);
      throw error;
    }
  }
  
  /**
   * Real-time order tracking
   */
  async updateOrderStatus(orderId: string, status: string, location?: { lat: number; lng: number }) {
    try {
      const update: any = {
        status,
        updatedAt: admin.database.ServerValue.TIMESTAMP
      };
      
      if (location) {
        update.location = location;
      }
      
      // Update in Realtime DB for instant updates
      await this.realtimeDb.ref(`orders/${orderId}`).update(update);
      
      // Update in Firestore
      await this.db.collection('orders').doc(orderId).update({
        status,
        ...(location && { location }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Notify customer
      await this.notifyOrderUpdate(orderId, status);
      
      return true;
    } catch (error) {
      console.error('Update order status error:', error);
      return false;
    }
  }
  
  /**
   * Real-time analytics
   */
  async trackEvent(event: string, data: any) {
    try {
      // Real-time counter
      await this.realtimeDb.ref(`analytics/${event}/count`).transaction((current) => {
        return (current || 0) + 1;
      });
      
      // Store event details
      await this.realtimeDb.ref(`analytics/${event}/events`).push({
        ...data,
        timestamp: admin.database.ServerValue.TIMESTAMP
      });
      
      // Update daily aggregates
      const today = new Date().toISOString().split('T')[0];
      await this.realtimeDb.ref(`analytics/${event}/daily/${today}`).transaction((current) => {
        return (current || 0) + 1;
      });
      
      return true;
    } catch (error) {
      console.error('Track event error:', error);
      return false;
    }
  }
  
  /**
   * Create real-time alert
   */
  private async createAlert(type: string, data: any) {
    await this.realtimeDb.ref('alerts').push({
      type,
      data,
      timestamp: admin.database.ServerValue.TIMESTAMP,
      resolved: false
    });
  }
  
  /**
   * Send push notification
   */
  private async sendNotification(chatId: string, message: any) {
    // TODO: Implement FCM push notification
    console.log('Sending notification for chat:', chatId);
  }
  
  /**
   * Notify order update
   */
  private async notifyOrderUpdate(orderId: string, status: string) {
    // TODO: Implement order update notification
    console.log(`Order ${orderId} updated to ${status}`);
  }
  
  /**
   * Cleanup listeners
   */
  async cleanup() {
    for (const [key, unsubscribe] of this.listeners) {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    }
    this.listeners.clear();
  }
}

export const realtimeService = new RealtimeService();