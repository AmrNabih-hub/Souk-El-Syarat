/**
 * Push Notification Service for Souk El-Sayarat
 * Handles Firebase Cloud Messaging for real-time notifications
 */

import { getToken, onMessage, Messaging } from 'firebase/messaging';
import { messaging } from '../config/firebase.config';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase.config';

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export class PushNotificationService {
  private static vapidKey =
    'BK8Q9r7Z3X4m2p1N6v5s8t9u0w1x2y3z4a5b6c7d8e9f0g1h2i3j4k5l6m7n8o9p0q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d8e9f0g1h2i3j4k5l6m7n8o9p0q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6';

  // Initialize push notifications
  static async initialize(userId: string): Promise<string | null> {
    try {
      if (!messaging) {
        // console.warn('Firebase Messaging not available');
        return null;
      }

      // Request notification permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        // console.warn('Notification permission denied');
        return null;
      }

      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: this.vapidKey,
      });

      if (token) {
        // Save token to user document
        await this.saveTokenToUser(userId, token);

        // Set up foreground message listener
        this.setupForegroundListener();

        // console.log('🔔 Push notifications initialized successfully');
        return token;
      } else {
        // console.warn('No FCM token available');
        return null;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error initializing push notifications:', error);
      return null;
    }
  }

  // Request notification permission
  static async requestPermission(): Promise<NotificationPermission> {
    try {
      if (!('Notification' in window)) {
        // console.warn('This browser does not support notifications');
        return 'denied';
      }

      if (Notification.permission === 'granted') {
        return 'granted';
      }

      if (Notification.permission === 'denied') {
        return 'denied';
      }

      // Request permission
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  // Save FCM token to user document
  private static async saveTokenToUser(userId: string, token: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        fcmToken: token,
        fcmTokenUpdatedAt: new Date(),
        pushNotificationsEnabled: true,
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error saving FCM token:', error);
    }
  }

  // Set up foreground message listener
  private static setupForegroundListener(): void {
    if (!messaging) return;

    onMessage(messaging, payload => {
      // console.log('📱 Foreground message received:', payload);

      const { notification, data } = payload;

      if (notification) {
        this.showNotification({
          title: notification.title || 'Souk El-Sayarat',
          body: notification.body || '',
          icon: notification.icon || '/icon-192x192.png',
          image: notification.image,
          data: data || {},
        });
      }
    });
  }

  // Show browser notification
  static async showNotification(payload: PushNotificationPayload): Promise<void> {
    try {
      if (!('serviceWorker' in navigator) || !('Notification' in window)) {
        // console.warn('Browser does not support notifications');
        return;
      }

      if (Notification.permission !== 'granted') {
        // console.warn('Notification permission not granted');
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      await registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon-192x192.png',
        badge: payload.badge || '/icon-72x72.png',
        // image: payload.image, // Not supported in all browsers
        data: payload.data || {},
        // actions: payload.actions || [], // Not supported in basic Notification API
        tag: payload.data?.type || 'general',
        // renotify: true, // Not supported in basic Notification API
        requireInteraction: payload.data?.priority === 'high',
        silent: false,
        // vibrate: [200, 100, 200], // Not supported in basic Notification API
        // timestamp: Date.now(), // Not supported in basic Notification API
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error showing notification:', error);
    }
  }

  // Show local notification (fallback)
  static showLocalNotification(payload: PushNotificationPayload): void {
    try {
      if (Notification.permission !== 'granted') {
        // console.warn('Notification permission not granted');
        return;
      }

      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon-192x192.png',
        badge: payload.badge || '/icon-72x72.png',
        // image: payload.image, // Not supported in all browsers
        data: payload.data || {},
        tag: payload.data?.type || 'general',
        // renotify: true, // Not supported in basic Notification API
        requireInteraction: payload.data?.priority === 'high',
        silent: false,
        // vibrate: [200, 100, 200], // Not supported in basic Notification API
        // timestamp: Date.now(), // Not supported in basic Notification API
      });

      // Handle notification click
      notification.onclick = event => {
        event.preventDefault();
        window.focus();
        notification.close();

        // Handle navigation based on notification data
        if (payload.data?.url) {
          window.location.href = payload.data.url;
        }
      };

      // Auto close after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error showing local notification:', error);
    }
  }

  // Subscribe to topic (for broadcast notifications)
  static async subscribeToTopic(userId: string, topic: string): Promise<void> {
    try {
      // This would typically be handled by the backend
      // For now, we'll save the subscription to the user document
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        [`subscriptions.${topic}`]: true,
        subscriptionsUpdatedAt: new Date(),
      });

      // console.log(`📢 Subscribed to topic: ${topic}`);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error(`Error subscribing to topic ${topic}:`, error);
    }
  }

  // Unsubscribe from topic
  static async unsubscribeFromTopic(userId: string, topic: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        [`subscriptions.${topic}`]: false,
        subscriptionsUpdatedAt: new Date(),
      });

      // console.log(`📢 Unsubscribed from topic: ${topic}`);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error(`Error unsubscribing from topic ${topic}:`, error);
    }
  }

  // Update notification preferences
  static async updateNotificationPreferences(
    userId: string,
    preferences: {
      orders?: boolean;
      messages?: boolean;
      promotions?: boolean;
      system?: boolean;
    }
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        'preferences.notifications.push': preferences,
        'preferences.updatedAt': new Date(),
      });

      // console.log('🔔 Notification preferences updated');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error updating notification preferences:', error);
    }
  }

  // Disable push notifications
  static async disablePushNotifications(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        pushNotificationsEnabled: false,
        fcmToken: null,
        fcmTokenUpdatedAt: new Date(),
      });

      // console.log('🔕 Push notifications disabled');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error disabling push notifications:', error);
    }
  }

  // Get notification history
  static getNotificationHistory(): any[] {
    // This would typically come from IndexedDB or localStorage
    const history = localStorage.getItem('notification_history');
    return history ? JSON.parse(history) : [];
  }

  // Clear notification history
  static clearNotificationHistory(): void {
    localStorage.removeItem('notification_history');
  }

  // Handle notification click actions
  static handleNotificationAction(action: string, data: unknown): void {
    switch (action) {
      case 'view_order':
        window.location.href = `/orders/${data.orderId}`;
        break;
      case 'view_message':
        window.location.href = `/messages/${data.senderId}`;
        break;
      case 'view_product':
        window.location.href = `/products/${data.productId}`;
        break;
      case 'dismiss':
        // Just close the notification
        break;
      default:
        // console.log('Unknown notification action:', action);
    }
  }

  // Check if notifications are supported
  static isSupported(): boolean {
    return 'serviceWorker' in navigator && 'Notification' in window && 'PushManager' in window;
  }

  // Get current permission status
  static getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  // Test notification (for debugging)
  static async testNotification(): Promise<void> {
    await this.showNotification({
      title: '🧪 Test Notification',
      body: 'This is a test notification from Souk El-Sayarat',
      icon: '/icon-192x192.png',
      data: { type: 'test' },
    });
  }
}

// Notification types for different events
export const NotificationTemplates = {
  ORDER_PLACED: (customerName: string, orderId: string) => ({
    title: '🛒 طلب جديد',
    body: `طلب جديد من ${customerName}`,
    data: { type: 'order', orderId, action: 'view_order' },
    actions: [
      { action: 'view_order', title: 'عرض الطلب', icon: '/icons/view.png' },
      { action: 'dismiss', title: 'إغلاق', icon: '/icons/close.png' },
    ],
  }),

  ORDER_STATUS_UPDATED: (status: string, orderId: string) => ({
    title: '📦 تحديث حالة الطلب',
    body: `تم تحديث حالة طلبك إلى: ${status}`,
    data: { type: 'order_update', orderId, action: 'view_order' },
    actions: [{ action: 'view_order', title: 'عرض الطلب', icon: '/icons/view.png' }],
  }),

  NEW_MESSAGE: (senderName: string, senderId: string) => ({
    title: '💬 رسالة جديدة',
    body: `رسالة جديدة من ${senderName}`,
    data: { type: 'message', senderId, action: 'view_message' },
    actions: [
      { action: 'view_message', title: 'عرض الرسالة', icon: '/icons/message.png' },
      { action: 'dismiss', title: 'إغلاق', icon: '/icons/close.png' },
    ],
  }),

  PRODUCT_APPROVED: (productName: string, productId: string) => ({
    title: '✅ تم قبول المنتج',
    body: `تم قبول منتجك: ${productName}`,
    data: { type: 'product_approval', productId, action: 'view_product' },
    actions: [{ action: 'view_product', title: 'عرض المنتج', icon: '/icons/product.png' }],
  }),

  VENDOR_APPLICATION_STATUS: (status: string) => ({
    title: status === 'approved' ? '🎉 تم قبول طلبك' : '❌ تم رفض طلبك',
    body:
      status === 'approved'
        ? 'مبروك! تم قبول طلبك لتصبح تاجر معتمد'
        : 'نأسف لإبلاغك بأنه تم رفض طلب التاجر',
    data: { type: 'vendor_application', status },
  }),
};
