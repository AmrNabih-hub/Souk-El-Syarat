import React, { useState, useCallback, useEffect } from 'react';

import { NotificationService } from '@/services/notification.service';
import { OrderService } from '@/services/order.service';
import { AnalyticsService } from '@/services/analytics.service';
import { MessagingService } from '@/services/messaging.service';
import { ProcessOrchestratorService } from '@/services/process-orchestrator.service';
import { useAuthStore } from '@/stores/authStore';
import { Notification, Order, Conversation as AppConversation, BusinessMetrics as AppBusinessMetrics, RealTimeStats as AppRealTimeStats } from '@/types';

// Helpers: convert model shapes (from DataStore/GraphQL) into app domain types
function mapConversationModelToApp(model: any): AppConversation {
  const participantsRaw = model.participants;
  let participants: string[] = [];
  try {
    if (Array.isArray(participantsRaw)) participants = participantsRaw;
    else if (typeof participantsRaw === 'string') {
      // Try to parse JSON array, otherwise split by comma
      try {
        const parsed = JSON.parse(participantsRaw);
        participants = Array.isArray(parsed) ? parsed : [String(parsed)];
      } catch (_) {
        participants = participantsRaw ? participantsRaw.split(',').map(s => s.trim()) : [];
      }
    }
  } catch (err) {
    participants = [];
  }

  return {
    id: model.id,
    participants,
    title: model.title || undefined,
    type: model.type || 'private',
    status: model.status || 'open',
    lastMessage: model.lastMessage || undefined,
    unreadCount: parseInt(model.unreadCount || '0', 10) || 0,
    metadata: model.metadata ? (typeof model.metadata === 'string' ? model.metadata : JSON.stringify(model.metadata)) : undefined,
    orderId: model.orderId || undefined,
    productId: model.productId || undefined,
    vendorId: model.vendorId || undefined,
    priority: model.priority || 'normal',
    tags: Array.isArray(model.tags) ? model.tags : (model.tags ? String(model.tags).split(',').map((t:any)=>String(t).trim()) : []),
    assignedTo: model.assignedTo || undefined,
    createdAt: model.createdAt ? new Date(model.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: model.updatedAt ? new Date(model.updatedAt).toISOString() : new Date().toISOString(),
    closedAt: model.closedAt ? new Date(model.closedAt).toISOString() : undefined,
    messages: [], // Add empty messages array as required by Conversation interface
  } as AppConversation;
}

function mapRealTimeStatsModelToApp(model: any): AppRealTimeStats {
  return {
    pendingOrders: model.pendingOrders || 0,
    processingOrders: model.processingOrders || 0,
    recentOrders: model.recentOrders || '',
    recentSignups: model.recentSignups || '',
    onlineUsers: model.onlineUsers || 0,
    activeVendors: model.activeVendors || 0,
    systemHealth: model.systemHealth || '',
    lastUpdated: model.lastUpdated ? new Date(model.lastUpdated) : undefined,
  } as AppRealTimeStats;
}

function mapBusinessMetricsModelToApp(model: any): AppBusinessMetrics {
  return {
    totalUsers: model.totalUsers || 0,
    totalVendors: model.totalVendors || 0,
    totalProducts: model.totalProducts || 0,
    totalOrders: model.totalOrders || 0,
    totalRevenue: model.totalRevenue || 0,
    activeUsers: model.activeUsers || 0,
    activeVendors: model.activeVendors || 0,
    topCategories: model.topCategories || [],
    topProducts: model.topProducts || [],
  } as AppBusinessMetrics;
}

export interface DashboardData {
  notifications: Notification[];
  unreadNotificationCount: number;
  orders: Order[];
  conversations: AppConversation[];
  unreadConversationCount: number;
  businessMetrics: AppBusinessMetrics | null;
  realTimeStats: AppRealTimeStats | null;
  isLoading: boolean;
  error: string | null;
}

export interface DashboardActions {
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: string, notes?: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  markMessagesAsRead: (conversationId: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

export const useRealTimeDashboard = (): DashboardData & DashboardActions => {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData>({
    notifications: [],
    unreadNotificationCount: 0,
    orders: [],
    conversations: [],
    unreadConversationCount: 0,
    businessMetrics: null,
    realTimeStats: null,
    isLoading: true,
    error: null,
  });

  // Subscription cleanup functions
  const [unsubscribeFunctions, setUnsubscribeFunctions] = useState<(() => void)[]>([]);

  /**
   * Initialize real-time subscriptions
   */
  const initializeSubscriptions = useCallback(() => {
    if (!user) return;

    const newUnsubscribeFunctions: (() => void)[] = [];

    try {
      // Subscribe to notifications
      const notificationsUnsubscribe = NotificationService.subscribeToUserNotifications(
        user.id,
        notifications => {
          // Notifications from the service may be model shapes; coerce to app Notification shape if needed
          const mappedNotifications = notifications.map((n: any) => ({
            id: n.id,
            userId: n.userId,
            title: n.title,
            message: n.message,
            type: n.type,
            data: n.data,
            read: !!n.read,
            createdAt: n.createdAt ? new Date(n.createdAt) : new Date(),
          } as Notification));
          setData(prev => ({ ...prev, notifications: mappedNotifications, isLoading: false }));
        }
      );
      newUnsubscribeFunctions.push(notificationsUnsubscribe);

      // Subscribe to unread notification count
      const unreadNotificationsUnsubscribe = NotificationService.subscribeToUnreadCount(
        user.id,
        count => {
          setData(prev => ({
            ...prev,
            unreadNotificationCount: count,
          }));
        }
      );
      newUnsubscribeFunctions.push(unreadNotificationsUnsubscribe);

      // Subscribe to orders based on user role
      let ordersUnsubscribe: () => void;
      if (user.role === 'admin') {
        ordersUnsubscribe = OrderService.subscribeToAllOrders(orders => {
          setData(prev => ({
            ...prev,
            orders,
          }));
        });
      } else if (user.role === 'vendor') {
        ordersUnsubscribe = OrderService.subscribeToVendorOrders(user.id, orders => {
          setData(prev => ({
            ...prev,
            orders,
          }));
        });
      } else {
        ordersUnsubscribe = OrderService.subscribeToCustomerOrders(user.id, orders => {
          setData(prev => ({
            ...prev,
            orders,
          }));
        });
      }
      newUnsubscribeFunctions.push(ordersUnsubscribe);

      // Subscribe to conversations
      const conversationsUnsubscribe = MessagingService.subscribeToUserConversations(user.id, conversations => {
        const mapped = (conversations || []).map((c: any) => mapConversationModelToApp(c));
        setData(prev => ({ ...prev, conversations: mapped }));
      });
      newUnsubscribeFunctions.push(conversationsUnsubscribe);

      // Subscribe to unread conversation count
      const unreadConversationsUnsubscribe = MessagingService.subscribeToUnreadConversationsCount(
        user.id,
        count => {
          setData(prev => ({
            ...prev,
            unreadConversationCount: count,
          }));
        }
      );
      newUnsubscribeFunctions.push(unreadConversationsUnsubscribe);

      // Subscribe to business metrics (admin only)
      if (user.role === 'admin') {
        const businessMetricsUnsubscribe = AnalyticsService.subscribeToBusinessMetrics(metrics => {
          setData(prev => ({ ...prev, businessMetrics: mapBusinessMetricsModelToApp(metrics) }));
        });
        newUnsubscribeFunctions.push(businessMetricsUnsubscribe);

        // Subscribe to real-time stats (admin only)
        const realTimeStatsUnsubscribe = AnalyticsService.subscribeToRealTimeStats(stats => {
          setData(prev => ({ ...prev, realTimeStats: mapRealTimeStatsModelToApp(stats) }));
        });
        newUnsubscribeFunctions.push(realTimeStatsUnsubscribe);
      }

      setUnsubscribeFunctions(newUnsubscribeFunctions);
    } catch (error) {
      if (process.env.NODE_ENV === 'development')
        if (process.env.NODE_ENV === 'development')
          console.error('Error initializing dashboard subscriptions:', error);
      setData(prev => ({
        ...prev,
        error: 'Failed to initialize real-time connections',
        isLoading: false,
      }));
    }
  }, [user]);

  /**
   * Clean up subscriptions
   */
  const cleanupSubscriptions = useCallback(() => {
    unsubscribeFunctions.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        if (process.env.NODE_ENV === 'development')
          if (process.env.NODE_ENV === 'development')
            console.error('Error cleaning up subscription:', error);
      }
    });
    setUnsubscribeFunctions([]);
  }, [unsubscribeFunctions]);

  /**
   * Initialize process orchestrator (admin only)
   */
  useEffect(() => {
    if (user?.role === 'admin') {
      try {
        ProcessOrchestratorService.getInstance();
        // if (process.env.NODE_ENV === 'development') console.log('Process orchestrator initialized');
      } catch (error) {
        if (process.env.NODE_ENV === 'development')
          if (process.env.NODE_ENV === 'development')
            console.error('Error initializing process orchestrator:', error);
      }
    }
  }, [user?.role]);

  /**
   * Set up subscriptions when user changes
   */
  useEffect(() => {
    cleanupSubscriptions();
    if (user) {
      initializeSubscriptions();
    }

    return cleanupSubscriptions;
  }, [user, initializeSubscriptions, cleanupSubscriptions]);

  /**
   * Mark notification as read
   */
  const markNotificationAsRead = useCallback(async (notificationId: string): Promise<void> => {
    try {
      await NotificationService.markAsRead(notificationId);
    } catch (error) {
      if (process.env.NODE_ENV === 'development')
        if (process.env.NODE_ENV === 'development')
          console.error('Error marking notification as read:', error);
      setData(prev => ({
        ...prev,
        error: 'Failed to mark notification as read',
      }));
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllNotificationsAsRead = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      await NotificationService.markAllAsRead(user.id);
    } catch (error) {
      if (process.env.NODE_ENV === 'development')
        if (process.env.NODE_ENV === 'development')
          console.error('Error marking all notifications as read:', error);
      setData(prev => ({
        ...prev,
        error: 'Failed to mark all notifications as read',
      }));
    }
  }, [user]);

  /**
   * Update order status
   */
  const updateOrderStatus = useCallback(
    async (orderId: string, status: string, notes?: string): Promise<void> => {
      if (!user) return;

      try {
        // pass status through as-is (OrderService expects its own OrderStatus shape); use string for flexibility
        await OrderService.updateOrderStatus(orderId, String(status), user.id, notes);

        // Track analytics
        await AnalyticsService.trackEvent({
          type: 'user_action',
          userId: user.id,
          sessionId: 'dashboard',
          orderId,
          action: 'order_status_updated',
          label: status,
          metadata: { notes },
        });
      } catch (error) {
        if (process.env.NODE_ENV === 'development')
          if (process.env.NODE_ENV === 'development')
            console.error('Error updating order status:', error);
        setData(prev => ({
          ...prev,
          error: 'Failed to update order status',
        }));
      }
    },
    [user]
  );

  /**
   * Send message
   */
  const sendMessage = useCallback(
    async (conversationId: string, content: string): Promise<void> => {
      if (!user) return;

      try {
        await MessagingService.sendMessage({
          conversationId,
          senderId: user.id,
          senderName: user.displayName || 'User',
          senderRole: user.role || 'customer',
          type: 'text',
          content,
        });

        // Track analytics
        await AnalyticsService.trackEvent({
          type: 'user_action',
          userId: user.id,
          sessionId: 'dashboard',
          action: 'message_sent',
          label: 'dashboard_chat',
          metadata: { conversationId },
        });
      } catch (error) {
        if (process.env.NODE_ENV === 'development')
          if (process.env.NODE_ENV === 'development')
            console.error('Error sending message:', error);
        setData(prev => ({
          ...prev,
          error: 'Failed to send message',
        }));
      }
    },
    [user]
  );

  /**
   * Mark messages as read
   */
  const markMessagesAsRead = useCallback(
    async (conversationId: string): Promise<void> => {
      if (!user) return;

      try {
        await MessagingService.markMessagesAsRead(conversationId, user.id);
      } catch (error) {
        if (process.env.NODE_ENV === 'development')
          if (process.env.NODE_ENV === 'development')
            console.error('Error marking messages as read:', error);
        setData(prev => ({
          ...prev,
          error: 'Failed to mark messages as read',
        }));
      }
    },
    [user]
  );

  /**
   * Refresh all data
   */
  const refreshData = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      // Refresh analytics data (admin only)
      if (user.role === 'admin') {
        await AnalyticsService.updateBusinessMetrics();
        await AnalyticsService.updateRealTimeStats();
      }

      // Track page view
      await AnalyticsService.trackPageView(user.id, 'dashboard_session', 'dashboard', {
        userRole: user.role,
      });

      setData(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      if (process.env.NODE_ENV === 'development')
        if (process.env.NODE_ENV === 'development')
          console.error('Error refreshing dashboard data:', error);
      setData(prev => ({
        ...prev,
        error: 'Failed to refresh dashboard data',
        isLoading: false,
      }));
    }
  }, [user]);

  /**
   * Auto-refresh data periodically
   */
  useEffect(() => {
    const interval = setInterval(
      () => {
        if (user?.role === 'admin') {
          // Refresh analytics data every 5 minutes for admin
          AnalyticsService.updateRealTimeStats().catch(console.error);
        }
      },
      5 * 60 * 1000
    ); // 5 minutes

    return () => clearInterval(interval);
  }, [user?.role]);

  /**
   * Track user activity
   */
  useEffect(() => {
    if (user) {
      // Track dashboard view
      AnalyticsService.trackPageView(user.id, 'dashboard_session', 'dashboard', {
        userRole: user.role,
      }).catch(console.error);

      // Track user as online
      AnalyticsService.trackEvent({
        type: 'user_action',
        userId: user.id,
        sessionId: 'dashboard_session',
        action: 'dashboard_opened',
        label: user.role || 'customer',
      }).catch(console.error);
    }
  }, [user]);

  return {
    ...data,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    updateOrderStatus,
    sendMessage,
    markMessagesAsRead,
    refreshData,
  };
};

export default useRealTimeDashboard;
