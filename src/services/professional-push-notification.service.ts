/**
 * Professional Push Notification Service
 * Enterprise-level push notifications with Firebase Cloud Messaging
 */

import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { messaging } from '@/config/firebase.config';
import { db } from '@/config/firebase.config';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp: Date;
  read: boolean;
  category: NotificationCategory;
  priority: 'high' | 'normal' | 'low';
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export type NotificationCategory = 
  | 'order_update'
  | 'new_message'
  | 'vendor_application'
  | 'system_alert'
  | 'promotion'
  | 'security'
  | 'general';

export interface NotificationPreferences {
  orderUpdates: boolean;
  messages: boolean;
  vendorApplications: boolean;
  systemAlerts: boolean;
  promotions: boolean;
  securityAlerts: boolean;
  general: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
}

export interface NotificationSubscription {
  topic: string;
  subscribed: boolean;
  subscribedAt?: Date;
}

export class ProfessionalPushNotificationService {
  private static instance: ProfessionalPushNotificationService;
  private messaging: any;
  private fcmToken: string | null = null;
  private isSupported: boolean = false;
  private notificationHandlers: Map<string, (notification: PushNotification) => void> = new Map();

  static getInstance(): ProfessionalPushNotificationService {
    if (!ProfessionalPushNotificationService.instance) {
      ProfessionalPushNotificationService.instance = new ProfessionalPushNotificationService();
    }
    return ProfessionalPushNotificationService.instance;
  }

  /**
   * Initialize push notification service
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if messaging is supported
      if (!messaging) {
        console.warn('⚠️ Firebase Messaging not available');
        return false;
      }

      this.messaging = getMessaging();
      this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;

      if (!this.isSupported) {
        console.warn('⚠️ Push notifications not supported in this browser');
        return false;
      }

      // Request notification permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('⚠️ Notification permission denied');
        return false;
      }

      // Get FCM token
      await this.getFCMToken();

      // Set up message listener
      this.setupMessageListener();

      console.log('✅ Push notification service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize push notification service:', error);
      return false;
    }
  }

  /**
   * Request notification permission
   */
  private async requestPermission(): Promise<NotificationPermission> {
    try {
      if (!('Notification' in window)) {
        throw new Error('This browser does not support notifications');
      }

      let permission = Notification.permission;
      
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Get FCM token
   */
  private async getFCMToken(): Promise<void> {
    try {
      const vapidKey = process.env.VITE_FIREBASE_VAPID_KEY || 'your-vapid-key';
      this.fcmToken = await getToken(this.messaging, { vapidKey });
      
      if (this.fcmToken) {
        console.log('✅ FCM Token obtained:', this.fcmToken);
        // Store token in user document
        await this.updateUserFCMToken(this.fcmToken);
      } else {
        console.warn('⚠️ No FCM token available');
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
    }
  }

  /**
   * Set up message listener for foreground notifications
   */
  private setupMessageListener(): void {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload: MessagePayload) => {
      console.log('📱 Message received in foreground:', payload);
      
      const notification: PushNotification = {
        id: payload.messageId || `notification_${Date.now()}`,
        title: payload.notification?.title || 'New Notification',
        body: payload.notification?.body || '',
        icon: payload.notification?.icon,
        image: payload.notification?.image,
        data: payload.data,
        timestamp: new Date(),
        read: false,
        category: (payload.data?.category as NotificationCategory) || 'general',
        priority: (payload.data?.priority as 'high' | 'normal' | 'low') || 'normal'
      };

      // Show browser notification
      this.showBrowserNotification(notification);

      // Trigger custom handlers
      this.triggerNotificationHandlers(notification);
    });
  }

  /**
   * Show browser notification
   */
  private showBrowserNotification(notification: PushNotification): void {
    try {
      const browserNotification = new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/icon-192x192.png',
        image: notification.image,
        badge: notification.badge || '/badge-72x72.png',
        data: notification.data,
        requireInteraction: notification.requireInteraction,
        silent: notification.silent,
        tag: notification.id
      });

      // Handle notification click
      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
        this.handleNotificationClick(notification);
      };

      // Auto-close after 5 seconds if not requiring interaction
      if (!notification.requireInteraction) {
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }

  /**
   * Handle notification click
   */
  private handleNotificationClick(notification: PushNotification): void {
    try {
      // Mark as read
      this.markNotificationAsRead(notification.id);

      // Handle different notification types
      switch (notification.category) {
        case 'order_update':
          if (notification.data?.orderId) {
            window.location.href = `/orders/${notification.data.orderId}`;
          }
          break;
        case 'new_message':
          if (notification.data?.chatId) {
            window.location.href = `/chat/${notification.data.chatId}`;
          }
          break;
        case 'vendor_application':
          window.location.href = '/admin/vendor-applications';
          break;
        case 'system_alert':
          window.location.href = '/admin/alerts';
          break;
        default:
          // Default action - could be handled by the app
          break;
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  }

  /**
   * Subscribe to notification topic
   */
  async subscribeToTopic(topic: string): Promise<boolean> {
    try {
      // This would typically call a Firebase Function to subscribe to a topic
      console.log(`📢 Subscribing to topic: ${topic}`);
      
      // For now, we'll just log the subscription
      // In a real implementation, you'd call a Firebase Function
      return true;
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      return false;
    }
  }

  /**
   * Unsubscribe from notification topic
   */
  async unsubscribeFromTopic(topic: string): Promise<boolean> {
    try {
      console.log(`📢 Unsubscribing from topic: ${topic}`);
      return true;
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      return false;
    }
  }

  /**
   * Send local notification (for testing)
   */
  async sendLocalNotification(notification: Omit<PushNotification, 'id' | 'timestamp' | 'read'>): Promise<void> {
    try {
      const fullNotification: PushNotification = {
        ...notification,
        id: `local_${Date.now()}`,
        timestamp: new Date(),
        read: false
      };

      this.showBrowserNotification(fullNotification);
      this.triggerNotificationHandlers(fullNotification);
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  /**
   * Update user FCM token in Firestore
   */
  private async updateUserFCMToken(token: string): Promise<void> {
    try {
      // This would update the current user's FCM token
      // For now, we'll just log it
      console.log('📱 FCM Token updated for user:', token);
    } catch (error) {
      console.error('Error updating FCM token:', error);
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      // This would update the notification in Firestore
      console.log(`✅ Notification ${notificationId} marked as read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Get notification preferences
   */
  async getNotificationPreferences(): Promise<NotificationPreferences> {
    try {
      // This would fetch from Firestore
      // For now, return default preferences
      return {
        orderUpdates: true,
        messages: true,
        vendorApplications: true,
        systemAlerts: true,
        promotions: false,
        securityAlerts: true,
        general: true,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00'
        }
      };
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      // This would update in Firestore
      console.log('📱 Notification preferences updated:', preferences);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  }

  /**
   * Add notification handler
   */
  addNotificationHandler(
    category: NotificationCategory,
    handler: (notification: PushNotification) => void
  ): void {
    this.notificationHandlers.set(category, handler);
  }

  /**
   * Remove notification handler
   */
  removeNotificationHandler(category: NotificationCategory): void {
    this.notificationHandlers.delete(category);
  }

  /**
   * Trigger notification handlers
   */
  private triggerNotificationHandlers(notification: PushNotification): void {
    const handler = this.notificationHandlers.get(notification.category);
    if (handler) {
      handler(notification);
    }
  }

  /**
   * Check if notifications are supported
   */
  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Get FCM token
   */
  getFCMTokenValue(): string | null {
    return this.fcmToken;
  }

  /**
   * Test notification
   */
  async testNotification(): Promise<void> {
    await this.sendLocalNotification({
      title: 'Test Notification',
      body: 'This is a test notification from Souk El-Syarat',
      category: 'general',
      priority: 'normal'
    });
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.notificationHandlers.clear();
    this.fcmToken = null;
  }
}

export default ProfessionalPushNotificationService;