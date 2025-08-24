/**
 * Real-time Store for Souk El-Sayarat
 * Manages real-time data using Zustand with Firebase integration
 */

import { subscribeWithSelector } from 'zustand/middleware';

import { PushNotificationService } from '@/services/push-notification.service';

import { Unsubscribe } from 'firebase/firestore';

interface RealtimeState {
  // User presence
  currentUserPresence: UserPresence | null;
  onlineUsers: Record<string, UserPresence>;

  // Chat system
  activeChats: Record<string, ChatMessage[]>;
  unreadMessages: Record<string, number>;
  typingUsers: Record<string, string[]>; // chatId -> userIds

  // Notifications
  notifications: Notification[];
  unreadNotifications: number;

  // Orders (real-time updates)
  orders: Order[];
  orderUpdates: Record<string, Order>;

  // Products (real-time updates for vendors)
  vendorProducts: Product[];
  productUpdates: Record<string, Product>;

  // Analytics (for admin)
  liveAnalytics: unknown;

  // Activity feed
  activityFeed: unknown[];

  // Connection status
  isConnected: boolean;
  isInitialized: boolean;

  // Listeners management
  listeners: Map<string, Unsubscribe>;

  // Actions
  initialize: (userId: string) => Promise<void>;
  cleanup: () => void;

  // Presence actions
  setUserOnline: (userId: string, currentPage?: string) => Promise<void>;
  setUserOffline: (userId: string) => Promise<void>;
  updateUserPresence: (userId: string, presence: Partial<UserPresence>) => void;

  // Chat actions
  sendMessage: (
    receiverId: string,
    message: string,
    type?: 'text' | 'image' | 'file',
    metadata?: unknown
  ) => Promise<void>;
  markMessageAsRead: (senderId: string, messageId: string) => Promise<void>;
  setTyping: (chatId: string, isTyping: boolean) => void;

  // Notification actions
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;

  // Order actions
  subscribeToOrders: (userId: string, userRole: 'customer' | 'vendor' | 'admin') => void;
  updateOrderStatus: (orderId: string, status: string) => void;

  // Product actions
  subscribeToVendorProducts: (vendorId: string) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;

  // Analytics actions (admin only)
  subscribeToAnalytics: () => void;

  // Activity feed actions
  addActivity: (type: string, data: unknown) => Promise<void>;
}

export const useRealtimeStore = create<RealtimeState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentUserPresence: null,
    onlineUsers: {},
    activeChats: {},
    unreadMessages: {},
    typingUsers: {},
    notifications: [],
    unreadNotifications: 0,
    orders: [],
    orderUpdates: {},
    vendorProducts: [],
    productUpdates: {},
    liveAnalytics: null,
    activityFeed: [],
    isConnected: false,
    isInitialized: false,
    listeners: new Map(),

    // Initialize real-time services
    initialize: async (userId: string) => {
      try {
        // if (process.env.NODE_ENV === 'development') console.log('🔄 Initializing real-time services for user:', userId);

        // Initialize Firebase real-time services
        await RealtimeService.initializeForUser(userId);

        // Initialize push notifications
        await PushNotificationService.initialize(userId);

        // Set up presence
        await get().setUserOnline(userId, window.location.pathname);

        // Subscribe to user presence
        const presenceListener = RealtimeService.listenToUserPresence(userId, presence => {
          set({ currentUserPresence: presence });
        });
        get().listeners.set('userPresence', presenceListener);

        // Subscribe to all users presence
        const allPresenceListener = RealtimeService.listenToAllUsersPresence(presenceList => {
          set({ onlineUsers: presenceList });
        });
        get().listeners.set('allPresence', allPresenceListener);

        // Subscribe to notifications
        const notificationsListener = RealtimeService.listenToUserNotifications(
          userId,
          notifications => {
            const unreadCount = notifications.filter(n => !n.read).length;
            set({
              notifications,
              unreadNotifications: unreadCount,
            });
          }
        );
        get().listeners.set('notifications', notificationsListener);

        // Subscribe to activity feed
        const activityListener = RealtimeService.listenToActivityFeed(activities => {
          set({ activityFeed: activities });
        });
        get().listeners.set('activity', activityListener);

        set({
          isInitialized: true,
          isConnected: true,
        });

        // if (process.env.NODE_ENV === 'development') console.log('✅ Real-time services initialized successfully');
      } catch (error) {
        if (process.env.NODE_ENV === 'development')
          if (process.env.NODE_ENV === 'development')
            console.error('❌ Failed to initialize real-time services:', error);
        set({ isConnected: false });
      }
    },

    // Cleanup all listeners
    cleanup: () => {
      // if (process.env.NODE_ENV === 'development') console.log('🧹 Cleaning up real-time services');

      // Clean up all listeners
      get().listeners.forEach((unsubscribe, key) => {
        try {
          unsubscribe();
          // if (process.env.NODE_ENV === 'development') console.log(`✅ Cleaned up listener: ${key}`);
        } catch (error) {
          if (process.env.NODE_ENV === 'development')
            if (process.env.NODE_ENV === 'development')
              console.error(`❌ Error cleaning up listener ${key}:`, error);
        }
      });

      // Clear listeners map
      get().listeners.clear();

      // Clean up RealtimeService listeners
      RealtimeService.cleanup();

      // Reset state
      set({
        currentUserPresence: null,
        onlineUsers: {},
        activeChats: {},
        unreadMessages: {},
        typingUsers: {},
        notifications: [],
        unreadNotifications: 0,
        orders: [],
        orderUpdates: {},
        vendorProducts: [],
        productUpdates: {},
        liveAnalytics: null,
        activityFeed: [],
        isConnected: false,
        isInitialized: false,
      });
    },

    // Presence actions
    setUserOnline: async (userId: string, currentPage?: string) => {
      await RealtimeService.setUserOnline(userId, currentPage);
      set({ isConnected: true });
    },

    setUserOffline: async (userId: string) => {
      await RealtimeService.setUserOffline(userId);
      set({ isConnected: false });
    },

    updateUserPresence: (userId: string, presence: Partial<UserPresence>) => {
      set(state => ({
        onlineUsers: {
          ...state.onlineUsers,
          [userId]: { ...state.onlineUsers[userId], ...presence },
        },
      }));
    },

    // Chat actions
    sendMessage: async (receiverId: string, message: string, type = 'text', metadata) => {
      try {
        const currentUser = await AuthService.getCurrentUser();
        if (!currentUser) throw new Error('User not authenticated');

        const messageId = await RealtimeService.sendMessage(
          currentUser.id,
          receiverId,
          message,
          type,
          metadata
        );

        // Add activity
        await get().addActivity('message_sent', {
          receiverId,
          messageId,
          messageType: type,
        });

        // if (process.env.NODE_ENV === 'development') console.log('✅ Message sent successfully');
      } catch (error) {
        if (process.env.NODE_ENV === 'development')
          if (process.env.NODE_ENV === 'development')
            console.error('❌ Failed to send message:', error);
        throw error;
      }
    },

    markMessageAsRead: async (senderId: string, messageId: string) => {
      try {
        const currentUser = await AuthService.getCurrentUser();
        if (!currentUser) return;

        await RealtimeService.markMessageAsRead(currentUser.id, senderId, messageId);

        // Update unread count
        const chatId = [currentUser.id, senderId].sort().join('_');
        set(state => ({
          unreadMessages: {
            ...state.unreadMessages,
            [chatId]: Math.max(0, (state.unreadMessages[chatId] || 0) - 1),
          },
        }));
      } catch (error) {
        if (process.env.NODE_ENV === 'development')
          if (process.env.NODE_ENV === 'development')
            console.error('❌ Failed to mark message as read:', error);
      }
    },

    setTyping: async (chatId: string, isTyping: boolean) => {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) return;

      set(state => {
        const currentTyping = state.typingUsers[chatId] || [];
        const updatedTyping = isTyping
          ? [...currentTyping.filter(id => id !== currentUser.id), currentUser.id]
          : currentTyping.filter(id => id !== currentUser.id);

        return {
          typingUsers: {
            ...state.typingUsers,
            [chatId]: updatedTyping,
          },
        };
      });
    },

    // Notification actions
    markNotificationAsRead: (notificationId: string) => {
      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
        unreadNotifications: Math.max(0, state.unreadNotifications - 1),
      }));
    },

    markAllNotificationsAsRead: () => {
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadNotifications: 0,
      }));
    },

    clearNotifications: () => {
      set({
        notifications: [],
        unreadNotifications: 0,
      });
    },

    // Order actions
    subscribeToOrders: (userId: string, userRole: 'customer' | 'vendor' | 'admin') => {
      const ordersListener = RealtimeService.listenToUserOrders(userId, userRole, orders => {
        set({ orders });
      });
      get().listeners.set('orders', ordersListener);
    },

    updateOrderStatus: (orderId: string, status: string) => {
      set(state => ({
        orders: state.orders.map(order =>
          order.id === orderId ? { ...order, status: status as any } : order
        ),
        orderUpdates: {
          ...state.orderUpdates,
          [orderId]: { ...state.orderUpdates[orderId], status: status as any },
        },
      }));
    },

    // Product actions
    subscribeToVendorProducts: (vendorId: string) => {
      const productsListener = RealtimeService.listenToVendorProducts(vendorId, products => {
        set({ vendorProducts: products });
      });
      get().listeners.set('vendorProducts', productsListener);
    },

    updateProduct: (productId: string, updates: Partial<Product>) => {
      set(state => ({
        vendorProducts: state.vendorProducts.map(product =>
          product.id === productId ? { ...product, ...updates } : product
        ),
        productUpdates: {
          ...state.productUpdates,
          [productId]: { ...state.productUpdates[productId], ...updates },
        },
      }));
    },

    // Analytics actions (admin only)
    subscribeToAnalytics: () => {
      const analyticsListener = RealtimeService.listenToAnalytics(analytics => {
        set({ liveAnalytics: analytics });
      });
      get().listeners.set('analytics', analyticsListener);
    },

    // Activity feed actions
    addActivity: async (type: string, data: unknown) => {
      try {
        const currentUser = await AuthService.getCurrentUser();
        if (!currentUser) return;

        await RealtimeService.addActivity(currentUser.id, type as any, data);
      } catch (error) {
        if (process.env.NODE_ENV === 'development')
          if (process.env.NODE_ENV === 'development')
            console.error('❌ Failed to add activity:', error);
      }
    },
  }))
);

// Selectors for easy access to specific data
export const realtimeSelectors = {
  // Get online status of a specific user
  isUserOnline: (userId: string) => (state: RealtimeState) =>
    state.onlineUsers[userId]?.isOnline || false,

  // Get unread message count for a specific chat
  getUnreadCount: (chatId: string) => (state: RealtimeState) => state.unreadMessages[chatId] || 0,

  // Get typing users for a specific chat
  getTypingUsers: (chatId: string) => (state: RealtimeState) => state.typingUsers[chatId] || [],

  // Get messages for a specific chat
  getChatMessages: (chatId: string) => (state: RealtimeState) => state.activeChats[chatId] || [],

  // Get unread notifications
  getUnreadNotifications: () => (state: RealtimeState) => state.notifications.filter(n => !n.read),

  // Get orders by status
  getOrdersByStatus: (status: string) => (state: RealtimeState) =>
    state.orders.filter(order => order.status === status),

  // Get connection status
  getConnectionStatus: () => (state: RealtimeState) => ({
    isConnected: state.isConnected,
    isInitialized: state.isInitialized,
  }),
};

// Subscribe to chat messages for a specific conversation
export const subscribeToChatMessages = (senderId: string, receiverId: string) => {
  const chatId = [senderId, receiverId].sort().join('_');

  const listener = RealtimeService.listenToChatMessages(senderId, receiverId, messages => {
    useRealtimeStore.setState(state => ({
      activeChats: {
        ...state.activeChats,
        [chatId]: messages,
      },
      unreadMessages: {
        ...state.unreadMessages,
        [chatId]: messages.filter(m => !m.read && m.receiverId === senderId).length,
      },
    }));
  });

  // Store listener for cleanup
  useRealtimeStore.getState().listeners.set(`chat_${chatId}`, listener);

  return () => {
    listener();
    useRealtimeStore.getState().listeners.delete(`chat_${chatId}`);
  };
};

// Auto-initialize real-time services when user logs in
useRealtimeStore.subscribe(
  state => state.isInitialized,
  (isInitialized, previousIsInitialized) => {
    if (!isInitialized && previousIsInitialized) {
      // if (process.env.NODE_ENV === 'development') console.log('🔄 Re-initializing real-time services...');
      // Handle reconnection logic here if needed
    }
  }
);

export default useRealtimeStore;
