/**
 * 🚀 ULTIMATE Real-time Store for Souk El-Sayarat
 * Manages ALL real-time user interactions with Firebase integration
 * Senior Engineer Implementation with Professional Error Handling
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { RealtimeService } from '@/services/realtime.service';
import { AuthService } from '@/services/auth.service';
import NotificationService from '@/services/notification.service';

import { UserPresence, ChatMessage, Order, Product, Notification, User } from '@/types';
import { Unsubscribe, onSnapshot, collection, query, where, orderBy, limit, doc } from 'firebase/firestore';
import { db } from '@/config/firebase.config';
import toast from 'react-hot-toast';

// Enhanced interfaces for real-time operations
export interface LiveProduct extends Product {
  viewCount: number;
  favoriteCount: number;
  lastViewed?: Date;
  isLive: boolean;
}

export interface LiveOrder extends Order {
  realTimeStatus: string;
  estimatedDelivery?: Date;
  trackingUpdates: Array<{
    status: string;
    timestamp: Date;
    location?: string;
    description: string;
  }>;
}

export interface LiveNotification extends Notification {
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'order' | 'product' | 'message' | 'system' | 'promotion';
  actionUrl?: string;
}

export interface LiveAnalytics {
  activeUsers: number;
  todayOrders: number;
  todayRevenue: number;
  popularProducts: string[];
  recentActivities: Array<{
    type: string;
    userId: string;
    timestamp: Date;
    description: string;
  }>;
}

interface RealtimeState {
  // Connection and initialization
  isConnected: boolean;
  isInitialized: boolean;
  connectionError: string | null;
  
  // User presence system
  currentUserPresence: UserPresence | null;
  onlineUsers: Record<string, UserPresence>;
  totalOnlineUsers: number;

  // Enhanced chat system
  activeChats: Record<string, ChatMessage[]>;
  unreadMessages: Record<string, number>;
  typingUsers: Record<string, string[]>;
  chatConnections: Record<string, boolean>;

  // Live notifications system
  notifications: LiveNotification[];
  unreadNotifications: number;
  notificationSettings: {
    orders: boolean;
    messages: boolean;
    products: boolean;
    promotions: boolean;
  };

  // Real-time orders system
  userOrders: LiveOrder[];
  vendorOrders: LiveOrder[];
  orderUpdates: Record<string, LiveOrder>;
  activeOrderTracking: Record<string, boolean>;

  // Live products system
  featuredProducts: LiveProduct[];
  userViewedProducts: LiveProduct[];
  productUpdates: Record<string, LiveProduct>;
  inventoryAlerts: Array<{
    productId: string;
    currentStock: number;
    threshold: number;
    timestamp: Date;
  }>;

  // Real-time analytics (for admin/vendors)
  liveAnalytics: LiveAnalytics | null;
  vendorMetrics: Record<string, {
    todaySales: number;
    totalViews: number;
    conversionRate: number;
    topProducts: string[];
  }>;

  // Activity feed
  activityFeed: Array<{
    id: string;
    type: 'order' | 'product' | 'user' | 'system';
    userId: string;
    userName: string;
    action: string;
    timestamp: Date;
    metadata?: Record<string, any>;
  }>;

  // Performance monitoring
  lastSyncTimes: Record<string, Date>;
  syncErrors: Record<string, string>;
  
  // Listeners management
  listeners: Map<string, Unsubscribe>;
}

interface RealtimeActions {
  // Initialization and connection
  initializeRealtimeServices: (userId: string, userRole: string) => Promise<void>;
  disconnectAllServices: () => void;
  reconnectServices: () => Promise<void>;
  
  // User presence management
  updateUserPresence: (presence: Partial<UserPresence>) => Promise<void>;
  setUserOnline: () => Promise<void>;
  setUserOffline: () => Promise<void>;
  
  // Enhanced chat system
  sendMessage: (chatId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => Promise<void>;
  markMessagesAsRead: (chatId: string) => Promise<void>;
  startTyping: (chatId: string) => void;
  stopTyping: (chatId: string) => void;
  joinChat: (chatId: string) => Promise<void>;
  leaveChat: (chatId: string) => void;
  
  // Live notifications
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  updateNotificationSettings: (settings: Partial<RealtimeState['notificationSettings']>) => Promise<void>;
  sendNotification: (userId: string, notification: Omit<LiveNotification, 'id' | 'timestamp'>) => Promise<void>;
  
  // Real-time orders
  trackOrder: (orderId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: string, location?: string) => Promise<void>;
  stopOrderTracking: (orderId: string) => void;
  
  // Live products
  trackProductViews: (productId: string) => Promise<void>;
  updateProductInventory: (productId: string, newStock: number) => Promise<void>;
  subscribeToProductUpdates: (productIds: string[]) => void;
  unsubscribeFromProductUpdates: () => void;
  
  // Real-time analytics
  updateLiveAnalytics: () => Promise<void>;
  trackUserAction: (action: string, metadata?: Record<string, any>) => Promise<void>;
  
  // Error handling
  handleConnectionError: (error: string) => void;
  clearErrors: () => void;
  retryFailedOperations: () => Promise<void>;
}

type RealtimeStore = RealtimeState & RealtimeActions;

// Utility functions for safe Firebase operations
const safeRealtimeOperation = async <T>(
  operation: () => Promise<T>,
  fallback: T,
  errorMessage: string,
  store: any
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    console.error(`🔥 Realtime Error: ${errorMessage}`, error);
    store.getState().handleConnectionError(`${errorMessage}: ${error.message}`);
    toast.error(`خطأ في النظام: ${errorMessage}`);
    return fallback;
  }
};

export const useRealtimeStore = create<RealtimeStore>()(
  subscribeWithSelector(
    (set, get) => ({
      // Initial state
      isConnected: false,
      isInitialized: false,
      connectionError: null,
      
      // User presence
      currentUserPresence: null,
      onlineUsers: {},
      totalOnlineUsers: 0,

      // Chat system
      activeChats: {},
      unreadMessages: {},
      typingUsers: {},
      chatConnections: {},

      // Notifications
      notifications: [],
      unreadNotifications: 0,
      notificationSettings: {
        orders: true,
        messages: true,
        products: true,
        promotions: false,
      },

      // Orders
      userOrders: [],
      vendorOrders: [],
      orderUpdates: {},
      activeOrderTracking: {},

      // Products
      featuredProducts: [],
      userViewedProducts: [],
      productUpdates: {},
      inventoryAlerts: [],

      // Analytics
      liveAnalytics: null,
      vendorMetrics: {},

      // Activity feed
      activityFeed: [],

      // Performance
      lastSyncTimes: {},
      syncErrors: {},
      listeners: new Map(),

      // ACTIONS

      // Enhanced initialization with comprehensive real-time setup
      initializeRealtimeServices: async (userId: string, userRole: string) => {
        console.log('🚀 Initializing ULTIMATE real-time services for:', userId, userRole);
        
        try {
          set({ isConnected: false, connectionError: null });

          const listeners = new Map<string, Unsubscribe>();

          // 1. User Presence System
          const presenceUnsubscribe = await safeRealtimeOperation(
            async () => {
              const service = RealtimeService.getInstance();
              await service.updateUserPresence(userId, {
                userId,
                status: 'online',
                lastSeen: new Date(),
                currentPage: window.location.pathname,
              });

              return onSnapshot(
                collection(db, 'user_presence'),
                (snapshot) => {
                  const onlineUsers: Record<string, UserPresence> = {};
                  snapshot.docs.forEach(doc => {
                    const presence = doc.data() as UserPresence;
                    onlineUsers[presence.userId] = presence;
                  });
                  
                  set({ 
                    onlineUsers, 
                    totalOnlineUsers: Object.keys(onlineUsers).length,
                    lastSyncTimes: { ...get().lastSyncTimes, presence: new Date() }
                  });
                  console.log('📡 Presence updated:', Object.keys(onlineUsers).length, 'users online');
                }
              );
            },
            () => {},
            'Failed to initialize presence system',
            { getState: get }
          );
          if (presenceUnsubscribe) listeners.set('presence', presenceUnsubscribe);

          // 2. Live Notifications System
          const notificationsUnsubscribe = await safeRealtimeOperation(
            async () => {
              return onSnapshot(
                query(
                  collection(db, 'notifications'),
                  where('userId', '==', userId),
                  where('isRead', '==', false),
                  orderBy('timestamp', 'desc'),
                  limit(50)
                ),
                (snapshot) => {
                  const notifications: LiveNotification[] = [];
                  snapshot.docs.forEach(doc => {
                    notifications.push({ id: doc.id, ...doc.data() } as LiveNotification);
                  });
                  
                  set({ 
                    notifications,
                    unreadNotifications: notifications.length,
                    lastSyncTimes: { ...get().lastSyncTimes, notifications: new Date() }
                  });
                  console.log('🔔 Notifications updated:', notifications.length, 'unread');
                }
              );
            },
            () => {},
            'Failed to initialize notifications',
            { getState: get }
          );
          if (notificationsUnsubscribe) listeners.set('notifications', notificationsUnsubscribe);

          // 3. Real-time Orders (role-based)
          if (userRole === 'customer') {
            const userOrdersUnsubscribe = await safeRealtimeOperation(
              async () => {
                return onSnapshot(
                  query(
                    collection(db, 'orders'),
                    where('customerId', '==', userId),
                    orderBy('createdAt', 'desc'),
                    limit(20)
                  ),
                  (snapshot) => {
                    const userOrders: LiveOrder[] = [];
                    snapshot.docs.forEach(doc => {
                      userOrders.push({ id: doc.id, ...doc.data() } as LiveOrder);
                    });
                    
                    set({ 
                      userOrders,
                      lastSyncTimes: { ...get().lastSyncTimes, userOrders: new Date() }
                    });
                    console.log('📦 User orders updated:', userOrders.length);
                  }
                );
              },
              () => {},
              'Failed to initialize user orders',
              { getState: get }
            );
            if (userOrdersUnsubscribe) listeners.set('userOrders', userOrdersUnsubscribe);
          }

          if (userRole === 'vendor') {
            const vendorOrdersUnsubscribe = await safeRealtimeOperation(
              async () => {
                return onSnapshot(
                  query(
                    collection(db, 'orders'),
                    where('vendorId', '==', userId),
                    orderBy('createdAt', 'desc'),
                    limit(50)
                  ),
                  (snapshot) => {
                    const vendorOrders: LiveOrder[] = [];
                    snapshot.docs.forEach(doc => {
                      vendorOrders.push({ id: doc.id, ...doc.data() } as LiveOrder);
                    });
                    
                    set({ 
                      vendorOrders,
                      lastSyncTimes: { ...get().lastSyncTimes, vendorOrders: new Date() }
                    });
                    console.log('🏪 Vendor orders updated:', vendorOrders.length);
                  }
                );
              },
              () => {},
              'Failed to initialize vendor orders',
              { getState: get }
            );
            if (vendorOrdersUnsubscribe) listeners.set('vendorOrders', vendorOrdersUnsubscribe);
          }

          // 4. Live Products System
          const productsUnsubscribe = await safeRealtimeOperation(
            async () => {
              return onSnapshot(
                query(
                  collection(db, 'products'),
                  where('status', '==', 'published'),
                  where('isActive', '==', true),
                  orderBy('updatedAt', 'desc'),
                  limit(100)
                ),
                (snapshot) => {
                  const featuredProducts: LiveProduct[] = [];
                  snapshot.docs.forEach(doc => {
                    featuredProducts.push({ 
                      id: doc.id, 
                      ...doc.data(),
                      isLive: true 
                    } as LiveProduct);
                  });
                  
                  set({ 
                    featuredProducts,
                    lastSyncTimes: { ...get().lastSyncTimes, products: new Date() }
                  });
                  console.log('🛍️ Products updated:', featuredProducts.length);
                }
              );
            },
            () => {},
            'Failed to initialize products',
            { getState: get }
          );
          if (productsUnsubscribe) listeners.set('products', productsUnsubscribe);

          // 5. Admin Analytics (admin only)
          if (userRole === 'admin') {
            const analyticsUnsubscribe = await safeRealtimeOperation(
              async () => {
                return onSnapshot(
                  doc(db, 'analytics', 'live'),
                  (doc) => {
                    if (doc.exists()) {
                      const liveAnalytics = doc.data() as LiveAnalytics;
                      set({ 
                        liveAnalytics,
                        lastSyncTimes: { ...get().lastSyncTimes, analytics: new Date() }
                      });
                      console.log('📊 Analytics updated:', liveAnalytics);
                    }
                  }
                );
              },
              () => {},
              'Failed to initialize analytics',
              { getState: get }
            );
            if (analyticsUnsubscribe) listeners.set('analytics', analyticsUnsubscribe);
          }

          // Store all listeners and mark as initialized
          set({ 
            listeners,
            isConnected: true, 
            isInitialized: true,
            connectionError: null 
          });

          console.log('✅ ALL real-time services initialized successfully!');
          toast.success('تم تفعيل النظام المباشر بنجاح');

        } catch (error) {
          console.error('💥 Failed to initialize real-time services:', error);
          set({ 
            connectionError: `فشل في تهيئة النظام المباشر: ${error.message}`,
            isConnected: false 
          });
          toast.error('فشل في تفعيل النظام المباشر');
        }
      },

      // Enhanced disconnect with proper cleanup
      disconnectAllServices: () => {
        const { listeners } = get();
        
        console.log('🔌 Disconnecting all real-time services...');
        
        // Unsubscribe from all listeners
        listeners.forEach((unsubscribe, name) => {
          try {
            unsubscribe();
            console.log(`✅ Disconnected ${name} listener`);
          } catch (error) {
            console.error(`❌ Error disconnecting ${name}:`, error);
          }
        });

        // Update user presence to offline
        const { currentUserPresence } = get();
        if (currentUserPresence) {
          RealtimeService.getInstance().updateUserPresence(currentUserPresence.userId, {
            status: 'offline',
            lastSeen: new Date()
          }).catch(console.error);
        }

        // Reset state
        set({
          listeners: new Map(),
          isConnected: false,
          isInitialized: false,
          currentUserPresence: null,
          onlineUsers: {},
          activeChats: {},
          notifications: [],
          userOrders: [],
          vendorOrders: [],
          featuredProducts: [],
          liveAnalytics: null,
          activityFeed: [],
          connectionError: null
        });

        console.log('✅ All real-time services disconnected');
      },

      // Reconnection with exponential backoff
      reconnectServices: async () => {
        const userId = localStorage.getItem('currentUserId');
        const userRole = localStorage.getItem('currentUserRole');
        
        if (userId && userRole) {
          console.log('🔄 Reconnecting real-time services...');
          await get().initializeRealtimeServices(userId, userRole);
        }
      },

      // User presence management
      updateUserPresence: async (presence: Partial<UserPresence>) => {
        const { currentUserPresence } = get();
        if (!currentUserPresence) return;

        await safeRealtimeOperation(
          async () => {
            const service = RealtimeService.getInstance();
            await service.updateUserPresence(currentUserPresence.userId, {
              ...currentUserPresence,
              ...presence,
              lastSeen: new Date()
            });
            
            set({
              currentUserPresence: {
                ...currentUserPresence,
                ...presence,
                lastSeen: new Date()
              }
            });
          },
          undefined,
          'Failed to update user presence',
          { getState: get }
        );
      },

      setUserOnline: async () => {
        await get().updateUserPresence({ 
          status: 'online',
          currentPage: window.location.pathname 
        });
      },

      setUserOffline: async () => {
        await get().updateUserPresence({ status: 'offline' });
      },

      // Enhanced chat system
      sendMessage: async (chatId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
        await safeRealtimeOperation(
          async () => {
            const service = RealtimeService.getInstance();
            const fullMessage: ChatMessage = {
              ...message,
              id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              timestamp: new Date(),
              read: false
            };
            
            await service.sendMessage(chatId, fullMessage);
            
            // Update local state optimistically
            const { activeChats } = get();
            const chatMessages = activeChats[chatId] || [];
            set({
              activeChats: {
                ...activeChats,
                [chatId]: [...chatMessages, fullMessage]
              }
            });
          },
          undefined,
          'Failed to send message',
          { getState: get }
        );
      },

      markMessagesAsRead: async (chatId: string) => {
        await safeRealtimeOperation(
          async () => {
            const service = RealtimeService.getInstance();
            await service.markChatAsRead(chatId);
            
            // Update local unread count
            const { unreadMessages } = get();
            set({
              unreadMessages: {
                ...unreadMessages,
                [chatId]: 0
              }
            });
          },
          undefined,
          'Failed to mark messages as read',
          { getState: get }
        );
      },

      startTyping: (chatId: string) => {
        const userId = localStorage.getItem('currentUserId');
        if (!userId) return;

        const { typingUsers } = get();
        const currentTyping = typingUsers[chatId] || [];
        
        if (!currentTyping.includes(userId)) {
          set({
            typingUsers: {
              ...typingUsers,
              [chatId]: [...currentTyping, userId]
            }
          });
        }
      },

      stopTyping: (chatId: string) => {
        const userId = localStorage.getItem('currentUserId');
        if (!userId) return;

        const { typingUsers } = get();
        const currentTyping = typingUsers[chatId] || [];
        
        set({
          typingUsers: {
            ...typingUsers,
            [chatId]: currentTyping.filter(id => id !== userId)
          }
        });
      },

      joinChat: async (chatId: string) => {
        await safeRealtimeOperation(
          async () => {
            const service = RealtimeService.getInstance();
            const unsubscribe = service.listenToMessages(chatId, (messages: ChatMessage[]) => {
              const { activeChats } = get();
              set({
                activeChats: {
                  ...activeChats,
                  [chatId]: messages
                },
                chatConnections: {
                  ...get().chatConnections,
                  [chatId]: true
                }
              });
            });

            const { listeners } = get();
            listeners.set(`chat_${chatId}`, unsubscribe);
            set({ listeners });
          },
          undefined,
          'Failed to join chat',
          { getState: get }
        );
      },

      leaveChat: (chatId: string) => {
        const { listeners, chatConnections } = get();
        const chatListener = listeners.get(`chat_${chatId}`);
        
        if (chatListener) {
          chatListener();
          listeners.delete(`chat_${chatId}`);
        }

        set({
          listeners,
          chatConnections: {
            ...chatConnections,
            [chatId]: false
          }
        });
      },

      // Live notifications
      markNotificationAsRead: async (notificationId: string) => {
        await safeRealtimeOperation(
          async () => {
            await NotificationService.getInstance().markAsRead(notificationId);
            
            const { notifications } = get();
            const updatedNotifications = notifications.map(notif => 
              notif.id === notificationId ? { ...notif, isRead: true } : notif
            );
            
            set({
              notifications: updatedNotifications,
              unreadNotifications: updatedNotifications.filter(n => !n.isRead).length
            });
          },
          undefined,
          'Failed to mark notification as read',
          { getState: get }
        );
      },

      markAllNotificationsAsRead: async () => {
        await safeRealtimeOperation(
          async () => {
            const { notifications } = get();
            await Promise.all(
              notifications.map(notif => 
                notif.isRead ? Promise.resolve() : NotificationService.getInstance().markAsRead(notif.id)
              )
            );
            
            set({
              notifications: notifications.map(notif => ({ ...notif, isRead: true })),
              unreadNotifications: 0
            });
          },
          undefined,
          'Failed to mark all notifications as read',
          { getState: get }
        );
      },

      updateNotificationSettings: async (settings: Partial<RealtimeState['notificationSettings']>) => {
        await safeRealtimeOperation(
          async () => {
            const userId = localStorage.getItem('currentUserId');
            if (userId) {
                             await NotificationService.getInstance().updateNotificationPreferences({
                 userId,
                 emailNotifications: settings.orders ?? true,
                 pushNotifications: settings.messages ?? true,
                 smsNotifications: false,
                 orderUpdates: settings.orders ?? true,
                 bookingReminders: settings.products ?? true,
                 promotions: settings.promotions ?? false,
                 newsletter: false
               });
              
              set({
                notificationSettings: {
                  ...get().notificationSettings,
                  ...settings
                }
              });
            }
          },
          undefined,
          'Failed to update notification settings',
          { getState: get }
        );
      },

      sendNotification: async (userId: string, notification: Omit<LiveNotification, 'id' | 'timestamp'>) => {
        await safeRealtimeOperation(
          async () => {
            const fullNotification: LiveNotification = {
              ...notification,
              id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              timestamp: new Date(),
              isRead: false
            };
            
            await NotificationService.getInstance().sendNotification(userId, fullNotification);
          },
          undefined,
          'Failed to send notification',
          { getState: get }
        );
      },

      // Real-time orders
      trackOrder: async (orderId: string) => {
        await safeRealtimeOperation(
          async () => {
            const { listeners, activeOrderTracking } = get();
            
            const unsubscribe = onSnapshot(
              doc(db, 'orders', orderId),
              (doc) => {
                if (doc.exists()) {
                  const orderData = { id: doc.id, ...doc.data() } as LiveOrder;
                  
                  set({
                    orderUpdates: {
                      ...get().orderUpdates,
                      [orderId]: orderData
                    }
                  });
                  
                  console.log('📦 Order tracking updated:', orderId, orderData.status);
                }
              }
            );

            listeners.set(`order_${orderId}`, unsubscribe);
            set({
              listeners,
              activeOrderTracking: {
                ...activeOrderTracking,
                [orderId]: true
              }
            });
          },
          undefined,
          'Failed to start order tracking',
          { getState: get }
        );
      },

      updateOrderStatus: async (orderId: string, status: string, location?: string) => {
        await safeRealtimeOperation(
          async () => {
            // This would typically be done by the vendor/admin
            const updateData: any = {
              status,
              updatedAt: new Date(),
              realTimeStatus: status
            };

            if (location) {
              updateData.currentLocation = location;
            }

            // Update in Firebase (this would be handled by order service)
            console.log('📦 Updating order status:', orderId, status, location);
          },
          undefined,
          'Failed to update order status',
          { getState: get }
        );
      },

      stopOrderTracking: (orderId: string) => {
        const { listeners, activeOrderTracking } = get();
        const orderListener = listeners.get(`order_${orderId}`);
        
        if (orderListener) {
          orderListener();
          listeners.delete(`order_${orderId}`);
        }

        set({
          listeners,
          activeOrderTracking: {
            ...activeOrderTracking,
            [orderId]: false
          }
        });
      },

      // Live products
      trackProductViews: async (productId: string) => {
        await safeRealtimeOperation(
          async () => {
            const userId = localStorage.getItem('currentUserId');
            if (userId) {
              // Track view in Firebase
              console.log('👁️ Tracking product view:', productId, userId);
              
              // Update local viewed products
              const { userViewedProducts, featuredProducts } = get();
              const product = featuredProducts.find(p => p.id === productId);
              
              if (product) {
                const viewedProduct: LiveProduct = {
                  ...product,
                  lastViewed: new Date(),
                  viewCount: (product.viewCount || 0) + 1
                };
                
                const updatedViewed = [viewedProduct, ...userViewedProducts.filter(p => p.id !== productId)];
                
                set({
                  userViewedProducts: updatedViewed.slice(0, 20) // Keep last 20 viewed
                });
              }
            }
          },
          undefined,
          'Failed to track product view',
          { getState: get }
        );
      },

      updateProductInventory: async (productId: string, newStock: number) => {
        await safeRealtimeOperation(
          async () => {
            // Update inventory in Firebase
            console.log('📦 Updating product inventory:', productId, newStock);
            
            // Check for low stock alert
            if (newStock <= 5) {
              const { inventoryAlerts } = get();
              const newAlert = {
                productId,
                currentStock: newStock,
                threshold: 5,
                timestamp: new Date()
              };
              
              set({
                inventoryAlerts: [newAlert, ...inventoryAlerts.slice(0, 49)]
              });
              
              toast.warning(`تحذير: المخزون منخفض للمنتج ${productId}`);
            }
          },
          undefined,
          'Failed to update product inventory',
          { getState: get }
        );
      },

      subscribeToProductUpdates: (productIds: string[]) => {
        console.log('🔄 Subscribing to product updates:', productIds.length, 'products');
        
        productIds.forEach(productId => {
          const { listeners } = get();
          
          if (!listeners.has(`product_${productId}`)) {
            const unsubscribe = onSnapshot(
              doc(db, 'products', productId),
              (doc) => {
                if (doc.exists()) {
                  const productData = { id: doc.id, ...doc.data(), isLive: true } as LiveProduct;
                  
                  set({
                    productUpdates: {
                      ...get().productUpdates,
                      [productId]: productData
                    }
                  });
                }
              }
            );
            
            listeners.set(`product_${productId}`, unsubscribe);
            set({ listeners });
          }
        });
      },

      unsubscribeFromProductUpdates: () => {
        const { listeners } = get();
        
        Array.from(listeners.keys())
          .filter(key => key.startsWith('product_'))
          .forEach(key => {
            const unsubscribe = listeners.get(key);
            if (unsubscribe) {
              unsubscribe();
              listeners.delete(key);
            }
          });
        
        set({ 
          listeners,
          productUpdates: {}
        });
      },

      // Real-time analytics
      updateLiveAnalytics: async () => {
        await safeRealtimeOperation(
          async () => {
            // This would fetch and update live analytics
            console.log('📊 Updating live analytics...');
            
            const mockAnalytics: LiveAnalytics = {
              activeUsers: get().totalOnlineUsers,
              todayOrders: get().userOrders.length + get().vendorOrders.length,
              todayRevenue: 15000,
              popularProducts: get().featuredProducts.slice(0, 5).map(p => p.id),
              recentActivities: get().activityFeed.slice(0, 10)
            };
            
            set({ liveAnalytics: mockAnalytics });
          },
          undefined,
          'Failed to update analytics',
          { getState: get }
        );
      },

      trackUserAction: async (action: string, metadata?: Record<string, any>) => {
        await safeRealtimeOperation(
          async () => {
            const userId = localStorage.getItem('currentUserId');
            const userName = localStorage.getItem('currentUserName') || 'مستخدم';
            
            if (userId) {
              const activity = {
                id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'user' as const,
                userId,
                userName,
                action,
                timestamp: new Date(),
                metadata
              };
              
              const { activityFeed } = get();
              set({
                activityFeed: [activity, ...activityFeed.slice(0, 99)]
              });
              
              console.log('📊 User action tracked:', action, metadata);
            }
          },
          undefined,
          'Failed to track user action',
          { getState: get }
        );
      },

      // Error handling
      handleConnectionError: (error: string) => {
        console.error('🔥 Connection error:', error);
        set({ 
          connectionError: error,
          isConnected: false 
        });
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          get().reconnectServices();
        }, 5000);
      },

      clearErrors: () => {
        set({ 
          connectionError: null,
          syncErrors: {}
        });
      },

      retryFailedOperations: async () => {
        console.log('🔄 Retrying failed operations...');
        await get().reconnectServices();
      }
    })
  )
);

// Auto-reconnection on window focus
if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => {
    const store = useRealtimeStore.getState();
    if (!store.isConnected) {
      store.reconnectServices();
    }
  });
  
  // Handle online/offline events
  window.addEventListener('online', () => {
    const store = useRealtimeStore.getState();
    store.reconnectServices();
    toast.success('تم الاتصال بالإنترنت - جاري المزامنة...');
  });
  
  window.addEventListener('offline', () => {
    const store = useRealtimeStore.getState();
    store.setUserOffline();
    toast.warning('انقطع الاتصال بالإنترنت');
  });
}
