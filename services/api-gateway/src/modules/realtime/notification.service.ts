import { Injectable, Logger } from '@nestjs/common';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  data?: any;
  timestamp: Date;
  read: boolean;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly notifications: Map<string, Notification[]> = new Map();

  async storeNotification(notification: Notification): Promise<void> {
    try {
      const userNotifications = this.notifications.get(notification.userId) || [];
      userNotifications.push(notification);
      this.notifications.set(notification.userId, userNotifications);
      
      this.logger.debug(`Notification stored for user ${notification.userId}`);
    } catch (error) {
      this.logger.error('Error storing notification:', error);
    }
  }

  async getNotificationHistory(userId: string, limit: number = 50): Promise<Notification[]> {
    try {
      const userNotifications = this.notifications.get(userId) || [];
      return userNotifications
        .slice(-limit)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      this.logger.error(`Error getting notification history for user ${userId}:`, error);
      return [];
    }
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      const userNotifications = this.notifications.get(userId) || [];
      const notification = userNotifications.find(n => n.id === notificationId);
      
      if (notification) {
        notification.read = true;
        this.logger.debug(`Notification ${notificationId} marked as read for user ${userId}`);
      }
    } catch (error) {
      this.logger.error(`Error marking notification as read for user ${userId}:`, error);
    }
  }
}