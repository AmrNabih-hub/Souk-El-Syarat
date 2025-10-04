/**
 * Notification Service
 * Manages in-app notifications
 * Real-time delivery and tracking
 */

import { supabase } from '@/config/supabase.config';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
  read_at?: string;
  metadata?: any;
}

export class NotificationService {
  /**
   * Get user's notifications
   */
  static async getUserNotifications(userId: string, limit: number = 20): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[Notifications] Error fetching:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[Notifications] Error:', error);
      return [];
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        console.error('[Notifications] Error fetching count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('[Notifications] Error:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId);

      if (error) {
        console.error('[Notifications] Error marking as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Notifications] Error:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        console.error('[Notifications] Error marking all as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Notifications] Error:', error);
      return false;
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('[Notifications] Error deleting:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Notifications] Error:', error);
      return false;
    }
  }

  /**
   * Create notification manually (if needed)
   */
  static async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    metadata?: any;
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          link: data.link,
          metadata: data.metadata || {},
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('[Notifications] Error creating:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Notifications] Error:', error);
      return false;
    }
  }
}
