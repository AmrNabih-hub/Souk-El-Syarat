/**
 * Enhanced Notification Service for Souk El-Sayarat
 * Handles all types of notifications with real-time delivery
 */

import { db } from '@/config/firebase.config';
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
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import type { Notification, NotificationType, User, Vendor, Order } from '@/types';

export class NotificationService {
  private static instance: NotificationService;
  private notificationsCollection = collection(db, 'notifications');

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Create notification
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(this.notificationsCollection, {
        ...notification,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  // Get user notifications
  async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const q = query(
        this.notificationsCollection,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw new Error('Failed to get user notifications');
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const docRef = doc(this.notificationsCollection, notificationId);
      await updateDoc(docRef, {
        read: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  // Mark all notifications as read for user
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const q = query(
        this.notificationsCollection,
        where('userId', '==', userId),
        where('read', '==', false)
      );
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          read: true,
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const docRef = doc(this.notificationsCollection, notificationId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Failed to delete notification');
    }
  }

  // Subscribe to user notifications (real-time)
  subscribeToUserNotifications(userId: string, callback: (notifications: Notification[]) => void) {
    const q = query(
      this.notificationsCollection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      callback(notifications);
    });
  }

  // Subscribe to unread count (real-time)
  subscribeToUnreadCount(userId: string, callback: (count: number) => void) {
    const q = query(
      this.notificationsCollection,
      where('userId', '==', userId),
      where('read', '==', false)
    );
    
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.size);
    });
  }

  // Send templated notification
  async sendTemplatedNotification(
    userId: string, 
    template: string, 
    language: 'en' | 'ar', 
    data: Record<string, any>
  ): Promise<string> {
    const templates = {
      order_confirmed: {
        en: 'Your order has been confirmed! Order ID: {orderId}',
        ar: 'تم تأكيد طلبك! رقم الطلب: {orderId}'
      },
      order_shipped: {
        en: 'Your order has been shipped! Tracking: {trackingNumber}',
        ar: 'تم شحن طلبك! رقم التتبع: {trackingNumber}'
      },
      order_delivered: {
        en: 'Your order has been delivered!',
        ar: 'تم تسليم طلبك!'
      },
      vendor_approved: {
        en: 'Congratulations! Your vendor application has been approved!',
        ar: 'تهانينا! تمت الموافقة على طلب البائع الخاص بك!'
      },
      vendor_rejected: {
        en: 'Your vendor application has been reviewed. Please check for updates.',
        ar: 'تم مراجعة طلب البائع الخاص بك. يرجى التحقق من التحديثات.'
      }
    };

    const templateText = templates[template as keyof typeof templates]?.[language] || template;
    let message = templateText;
    
    // Replace placeholders with actual data
    Object.entries(data).forEach(([key, value]) => {
      message = message.replace(`{${key}}`, value);
    });

    return this.createNotification({
      userId,
      type: 'system' as NotificationType,
      title: language === 'ar' ? 'إشعار النظام' : 'System Notification',
      message,
      read: false,
      data
    });
  }

  // Get notification by ID
  async getNotification(notificationId: string): Promise<Notification | null> {
    try {
      const docRef = doc(this.notificationsCollection, notificationId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Notification;
      }
      return null;
    } catch (error) {
      console.error('Error getting notification:', error);
      throw new Error('Failed to get notification');
    }
  }

  // Get notifications by type
  async getNotificationsByType(userId: string, type: NotificationType): Promise<Notification[]> {
    try {
      const q = query(
        this.notificationsCollection,
        where('userId', '==', userId),
        where('type', '==', type),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
    } catch (error) {
      console.error('Error getting notifications by type:', error);
      throw new Error('Failed to get notifications by type');
    }
  }

  // Get recent notifications
  async getRecentNotifications(userId: string, limitCount: number = 10): Promise<Notification[]> {
    try {
      const q = query(
        this.notificationsCollection,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
    } catch (error) {
      console.error('Error getting recent notifications:', error);
      throw new Error('Failed to get recent notifications');
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();

// Export types
export type { Notification, NotificationType };
