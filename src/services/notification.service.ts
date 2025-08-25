import { doc, collection, addDoc, updateDoc, onSnapshot, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase.config';
import toast from 'react-hot-toast';

export interface Notification {
  id: string;
  userId: string;
  type: 'order' | 'booking' | 'payment' | 'general' | 'promotion';
  title: string;
  titleEn?: string;
  message: string;
  messageEn?: string;
  icon: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  metadata?: {
    orderId?: string;
    bookingId?: string;
    amount?: number;
    itemName?: string;
    [key: string]: any;
  };
  createdAt: Date;
  expiresAt?: Date;
}

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  orderUpdates: boolean;
  bookingReminders: boolean;
  promotions: boolean;
  newsletter: boolean;
}

class NotificationService {
  private static instance: NotificationService;
  private subscribers: Map<string, (notifications: Notification[]) => void> = new Map();

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Real-time notification listener
  subscribeToUserNotifications(userId: string, callback: (notifications: Notification[]) => void) {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications: Notification[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          userId: data.userId,
          type: data.type,
          title: data.title,
          titleEn: data.titleEn,
          message: data.message,
          messageEn: data.messageEn,
          icon: data.icon,
          isRead: data.isRead || false,
          priority: data.priority || 'medium',
          actionUrl: data.actionUrl,
          metadata: data.metadata,
          createdAt: data.createdAt?.toDate() || new Date(),
          expiresAt: data.expiresAt?.toDate()
        });
      });

      callback(notifications);

      // Show toast for new high priority notifications
      const newHighPriorityNotifications = notifications.filter(
        n => !n.isRead && (n.priority === 'high' || n.priority === 'urgent')
      );

      newHighPriorityNotifications.slice(0, 1).forEach(notification => {
        const toastOptions = {
          duration: notification.priority === 'urgent' ? 8000 : 5000,
          position: 'top-right' as const,
          style: {
            background: notification.priority === 'urgent' ? '#DC2626' : '#059669',
            color: 'white',
            fontFamily: 'Cairo, sans-serif'
          }
        };

        toast(`${notification.icon} ${notification.title}\n${notification.message}`, toastOptions);
      });
    });

    this.subscribers.set(userId, callback);
    return unsubscribe;
  }

  // Send notification
  async sendNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'notifications'), {
        ...notification,
        createdAt: Timestamp.now(),
        expiresAt: notification.expiresAt ? Timestamp.fromDate(notification.expiresAt) : null
      });

      // Send real-time notification for immediate display
      this.sendRealtimeNotification(notification);

      return docRef.id;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // Send real-time notification (in-app)
  private sendRealtimeNotification(notification: Omit<Notification, 'id' | 'createdAt'>) {
    // For immediate feedback without waiting for Firestore
    const callback = this.subscribers.get(notification.userId);
    if (callback) {
      // This would trigger the callback with updated notifications
      // In a real implementation, you might use WebSockets or Server-Sent Events
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        isRead: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('isRead', '==', false)
      );

      const snapshot = await q.get();
      const batch = db.batch();

      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { isRead: true });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Predefined notification templates
  static createOrderConfirmationNotification(userId: string, orderId: string, itemName: string, amount: number): Omit<Notification, 'id' | 'createdAt'> {
    return {
      userId,
      type: 'order',
      title: 'تم تأكيد طلبك',
      titleEn: 'Order Confirmed',
      message: `تم تأكيد طلبك ${orderId} بنجاح! ${itemName}`,
      messageEn: `Your order ${orderId} has been confirmed! ${itemName}`,
      icon: '✅',
      isRead: false,
      priority: 'high',
      actionUrl: `/order-success?orderId=${orderId}`,
      metadata: {
        orderId,
        itemName,
        amount
      }
    };
  }

  static createBookingConfirmationNotification(userId: string, bookingId: string, serviceName: string, date: string, time: string): Omit<Notification, 'id' | 'createdAt'> {
    return {
      userId,
      type: 'booking',
      title: 'تم تأكيد حجزك',
      titleEn: 'Booking Confirmed',
      message: `تم تأكيد حجز ${serviceName} في ${date} الساعة ${time}`,
      messageEn: `Your booking for ${serviceName} on ${date} at ${time} has been confirmed`,
      icon: '📅',
      isRead: false,
      priority: 'high',
      actionUrl: `/booking-success?bookingId=${bookingId}`,
      metadata: {
        bookingId,
        serviceName,
        date,
        time
      }
    };
  }

  static createBookingReminderNotification(userId: string, bookingId: string, serviceName: string): Omit<Notification, 'id' | 'createdAt'> {
    return {
      userId,
      type: 'booking',
      title: 'تذكير بموعدك',
      titleEn: 'Appointment Reminder',
      message: `لديك موعد ${serviceName} غداً`,
      messageEn: `You have an appointment for ${serviceName} tomorrow`,
      icon: '⏰',
      isRead: false,
      priority: 'medium',
      actionUrl: `/booking-success?bookingId=${bookingId}`,
      metadata: {
        bookingId,
        serviceName
      }
    };
  }

  static createOrderStatusUpdateNotification(userId: string, orderId: string, status: string, itemName: string): Omit<Notification, 'id' | 'createdAt'> {
    const statusMessages = {
      processing: { ar: 'جاري تجهيز طلبك', en: 'Your order is being processed' },
      shipped: { ar: 'تم شحن طلبك', en: 'Your order has been shipped' },
      delivered: { ar: 'تم توصيل طلبك', en: 'Your order has been delivered' },
      cancelled: { ar: 'تم إلغاء طلبك', en: 'Your order has been cancelled' }
    };

    const statusMessage = statusMessages[status] || { ar: 'تم تحديث حالة طلبك', en: 'Your order status has been updated' };

    return {
      userId,
      type: 'order',
      title: statusMessage.ar,
      titleEn: statusMessage.en,
      message: `${itemName} - ${statusMessage.ar}`,
      messageEn: `${itemName} - ${statusMessage.en}`,
      icon: status === 'delivered' ? '🚚' : status === 'cancelled' ? '❌' : '📦',
      isRead: false,
      priority: status === 'cancelled' ? 'high' : 'medium',
      actionUrl: `/order-success?orderId=${orderId}`,
      metadata: {
        orderId,
        itemName,
        status
      }
    };
  }

  static createPromotionNotification(userId: string, title: string, message: string, actionUrl?: string): Omit<Notification, 'id' | 'createdAt'> {
    return {
      userId,
      type: 'promotion',
      title,
      message,
      icon: '🎉',
      isRead: false,
      priority: 'low',
      actionUrl,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
  }

  // Get notification preferences
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const prefsRef = doc(db, 'notificationPreferences', userId);
      const prefsSnap = await prefsRef.get();
      
      if (prefsSnap.exists()) {
        return prefsSnap.data() as NotificationPreferences;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return null;
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(preferences: NotificationPreferences): Promise<void> {
    try {
      const prefsRef = doc(db, 'notificationPreferences', preferences.userId);
      await updateDoc(prefsRef, preferences);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  // Cleanup expired notifications
  async cleanupExpiredNotifications(): Promise<void> {
    try {
      const now = Timestamp.now();
      const q = query(
        collection(db, 'notifications'),
        where('expiresAt', '<=', now)
      );

      const snapshot = await q.get();
      const batch = db.batch();

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Cleaned up ${snapshot.size} expired notifications`);
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
    }
  }

  // Browser notification permission and display
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  async showBrowserNotification(notification: Notification): Promise<void> {
    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent'
      });

      browserNotification.onclick = () => {
        window.focus();
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
        browserNotification.close();
      };

      // Auto close after 5 seconds for non-urgent notifications
      if (notification.priority !== 'urgent') {
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }
    }
  }

  // Unsubscribe from notifications
  unsubscribe(userId: string): void {
    this.subscribers.delete(userId);
  }
}

export default NotificationService;