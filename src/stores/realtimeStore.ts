/**
 * Real-time Store for Souk El-Sayarat
 * Manages real-time data using Zustand with Firebase integration
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { PushNotificationService } from '@/services/push-notification.service';
import { RealtimeService } from '@/services/realtime.service';
import { AuthService } from '@/services/auth.service';
import { 
  realtimeInfrastructure, 
  RealtimePresence, 
  RealtimeMessage, 
  RealtimeNotification,
  RealtimeOrder,
  RealtimeProduct,
  RealtimeAnalytics
} from '@/services/realtime-infrastructure.service';

import { UserPresence, ChatMessage, Order, Product, Notification } from '@/types';
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

  // Enhanced real-time infrastructure
  realtimePresence: RealtimePresence[];
  realtimeMessages: Record<string, RealtimeMessage[]>;
  realtimeNotifications: RealtimeNotification[];
  realtimeOrders: RealtimeOrder[];
  realtimeProducts: RealtimeProduct[];
  realtimeAnalytics: RealtimeAnalytics | null;

  // Actions
  initialize: (userId: string, userRole?: 'customer' | 'vendor' | 'admin') => Promise<void>;
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
    
    // Enhanced real-time infrastructure state
    realtimePresence: [],
    realtimeMessages: {},
    realtimeNotifications: [],
    realtimeOrders: [],
    realtimeProducts: [],
    realtimeAnalytics: null,
    orderUpdates: {},
    vendorProducts: [],
    productUpdates: {},
    liveAnalytics: null,
    activityFeed: [],
    isConnected: false,
    isInitialized: false,
    listeners: new Map(),

    // Initialize real-time services with enhanced infrastructure
    initialize: async (userId: string, userRole: 'customer' | 'vendor' | 'admin' = 'customer') => {
      try {
        console.log('🚀 Initializing enhanced real-time infrastructure for user:', userId);

        // Initialize the enhanced real-time infrastructure
        await realtimeInfrastructure.initializeUserPresence(userId, {
          role: userRole,
          currentPage: window.location.pathname
        });

        // Initialize Firebase real-time services (legacy support)
        await RealtimeService.initializeForUser(userId);

        // Initialize push notifications
        await PushNotificationService.initialize(userId);

        // Set up presence tracking
        await get().setUserOnline(userId, window.location.pathname);

        // Subscribe to online users with enhanced infrastructure
        const onlineUsersListener = realtimeInfrastructure.subscribeToOnlineUsers((users) => {
          set({ realtimePresence: users });
          // Convert to legacy format for backward compatibility
          const legacyUsers: Record<string, UserPresence> = {};
          users.forEach(user => {
            legacyUsers[user.userId] = {
              userId: user.userId,
              status: user.status === 'online' ? 'online' : user.status === 'offline' ? 'offline' : 'away',
              lastSeen: new Date(user.lastSeen),
              currentPage: user.currentPage,
              isTyping: false
            } as UserPresence;
          });
          set({ onlineUsers: legacyUsers });
        });
        get().listeners.set('onlineUsers', onlineUsersListener);

        // Subscribe to notifications with enhanced infrastructure
        const notificationsListener = realtimeInfrastructure.subscribeToNotifications(
          userId,
          (notifications) => {
            set({ realtimeNotifications: notifications });
            const unreadCount = notifications.filter(n => !n.read).length;
            // Convert to legacy format for backward compatibility
            const legacyNotifications: Notification[] = notifications.map(n => ({
              id: n.id,
              userId: n.userId,
              type: n.type,
              title: n.title,
              message: n.body,
              read: n.read,
              createdAt: new Date(n.timestamp),
              data: n.data
            } as Notification));
            set({
              notifications: legacyNotifications,
              unreadNotifications: unreadCount,
            });
          }
        );
        get().listeners.set('notifications', notificationsListener);

        // Subscribe to orders based on user role
        const ordersListener = realtimeInfrastructure.subscribeToOrders(
          userId,
          userRole,
          (orders) => {
            set({ realtimeOrders: orders });
            // Convert to legacy format for backward compatibility
            const legacyOrders: Order[] = orders.map(o => ({
              id: o.id,
              customerId: o.customerId,
              vendorId: o.vendorId,
              items: o.products.map(p => ({
                productId: p.productId,
                quantity: p.quantity,
                price: p.price,
                name: '',
                image: ''
              })),
              status: o.status,
              totalAmount: o.totalAmount,
              createdAt: new Date(o.timestamp),
              updatedAt: new Date(o.timestamp)
            } as Order));
            set({ orders: legacyOrders });
          }
        );
        get().listeners.set('orders', ordersListener);

        // Subscribe to analytics for admin users
        if (userRole === 'admin') {
          const analyticsListener = realtimeInfrastructure.subscribeToAnalytics((analytics) => {
            set({ 
              realtimeAnalytics: analytics,
              liveAnalytics: analytics 
            });
          });
          get().listeners.set('analytics', analyticsListener);
        }

        // Subscribe to vendor products for vendor users
        if (userRole === 'vendor') {
          const productsListener = realtimeInfrastructure.subscribeToVendorProducts(
            userId,
            (products) => {
              set({ realtimeProducts: products });
              // Convert to legacy format
              const legacyProducts: Product[] = products.map(p => ({
                id: p.id,
                vendorId: p.vendorId,
                name: p.name,
                description: p.description,
                price: p.price,
                stock: p.stock,
                category: p.category,
                images: p.images,
                isAvailable: p.isAvailable,
                createdAt: new Date(p.timestamp),
                updatedAt: new Date(p.lastUpdated)
              } as Product));
              set({ vendorProducts: legacyProducts });
            }
          );
          get().listeners.set('vendorProducts', productsListener);
        }

        // Subscribe to activity feed (legacy)
        const activityListener = RealtimeService.listenToActivityFeed(activities => {
          set({ activityFeed: activities });
        });
        get().listeners.set('activity', activityListener);

        set({
          isInitialized: true,
          isConnected: true,
        });

        console.log('✅ Enhanced real-time infrastructure initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize real-time infrastructure:', error);
        set({ isConnected: false });
      }
    },

    // Cleanup all listeners
    cleanup: () => {
      console.log('🧹 Cleaning up real-time services');

      // Clean up enhanced infrastructure
      realtimeInfrastructure.cleanup();

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
