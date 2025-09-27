import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { PushNotificationService } from '@/services/push-notification.service';
import { RealtimeService } from '@/services/realtime.service';
import { AuthService } from '@/services/auth.service';

import { UserPresence, ChatMessage, Order, Product, Notification } from '@/types';

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
  listeners: Map<string, () => void>;

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
      // TODO: Implement with Amplify
    },

    // Cleanup all listeners
    cleanup: () => {
      // TODO: Implement with Amplify
    },

    // Presence actions
    setUserOnline: async (userId: string, currentPage?: string) => {
      // TODO: Implement with Amplify
    },

    setUserOffline: async (userId: string) => {
      // TODO: Implement with Amplify
    },

    updateUserPresence: (userId: string, presence: Partial<UserPresence>) => {
      // TODO: Implement with Amplify
    },

    // Chat actions
    sendMessage: async (receiverId: string, message: string, type = 'text', metadata) => {
      // TODO: Implement with Amplify
    },

    markMessageAsRead: async (senderId: string, messageId: string) => {
      // TODO: Implement with Amplify
    },

    setTyping: async (chatId: string, isTyping: boolean) => {
      // TODO: Implement with Amplify
    },

    // Notification actions
    markNotificationAsRead: (notificationId: string) => {
      // TODO: Implement with Amplify
    },

    markAllNotificationsAsRead: () => {
      // TODO: Implement with Amplify
    },

    clearNotifications: () => {
      // TODO: Implement with Amplify
    },

    // Order actions
    subscribeToOrders: (userId: string, userRole: 'customer' | 'vendor' | 'admin') => {
      // TODO: Implement with Amplify
    },

    updateOrderStatus: (orderId: string, status: string) => {
      // TODO: Implement with Amplify
    },

    // Product actions
    subscribeToVendorProducts: (vendorId: string) => {
      // TODO: Implement with Amplify
    },

    updateProduct: (productId: string, updates: Partial<Product>) => {
      // TODO: Implement with Amplify
    },

    // Analytics actions (admin only)
    subscribeToAnalytics: () => {
      // TODO: Implement with Amplify
    },

    // Activity feed actions
    addActivity: async (type: string, data: unknown) => {
      // TODO: Implement with Amplify
    },
  }))
);

// Selectors for easy access to specific data
export const realtimeSelectors = {
  // Get online status of a specific user
  isUserOnline: (userId: string) => (state: RealtimeState) =>
    state.onlineUsers[userId]?.online || false,

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
  // TODO: Implement with Amplify
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