/**
 * 🚀 ENHANCED REAL-TIME INFRASTRUCTURE SERVICE
 * Souk El-Sayarat - Professional Real-Time Operations
 * 
 * This service provides the foundation for all real-time features
 * following the architectural diagram and professional standards
 */

import { 
  ref, 
  set, 
  onValue, 
  push, 
  update, 
  serverTimestamp,
  onDisconnect,
  DataSnapshot,
  DatabaseReference,
  Unsubscribe
} from 'firebase/database';
import { realtimeDb } from '@/config/firebase.config';

// Type definitions for real-time data structures
export interface RealtimeUser {
  id: string;
  email: string;
  displayName: string;
  role: 'customer' | 'vendor' | 'admin';
  photoURL?: string;
  lastSeen: number;
  isOnline: boolean;
  currentPage?: string;
  metadata?: Record<string, any>;
}

export interface RealtimePresence {
  userId: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: number;
  currentPage?: string;
  device?: string;
  location?: string;
}

export interface RealtimeMessage {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'product' | 'order';
  metadata?: Record<string, any>;
  timestamp: number;
  read: boolean;
  delivered: boolean;
  edited?: boolean;
  editedAt?: number;
}

export interface RealtimeNotification {
  id: string;
  userId: string;
  type: 'order' | 'message' | 'system' | 'promotion' | 'alert';
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  timestamp: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actionUrl?: string;
}

export interface RealtimeOrder {
  id: string;
  customerId: string;
  vendorId: string;
  products: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  timestamp: number;
  updates: Array<{
    status: string;
    timestamp: number;
    note?: string;
  }>;
}

export interface RealtimeProduct {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  isAvailable: boolean;
  views: number;
  likes: number;
  timestamp: number;
  lastUpdated: number;
}

export interface RealtimeAnalytics {
  activeUsers: number;
  totalOrders: number;
  totalRevenue: number;
  conversionRate: number;
  topProducts: Array<{ productId: string; sales: number }>;
  userActivity: Array<{ userId: string; action: string; timestamp: number }>;
  timestamp: number;
}

/**
 * Main Real-Time Infrastructure Service
 */
export class RealtimeInfrastructureService {
  private static instance: RealtimeInfrastructureService;
  private listeners: Map<string, Unsubscribe> = new Map();
  private presenceRef: DatabaseReference;
  private messagesRef: DatabaseReference;
  private notificationsRef: DatabaseReference;
  private ordersRef: DatabaseReference;
  private productsRef: DatabaseReference;
  private analyticsRef: DatabaseReference;
  private currentUserId: string | null = null;

  private constructor() {
    // Initialize database references
    this.presenceRef = ref(realtimeDb, 'presence');
    this.messagesRef = ref(realtimeDb, 'messages');
    this.notificationsRef = ref(realtimeDb, 'notifications');
    this.ordersRef = ref(realtimeDb, 'orders');
    this.productsRef = ref(realtimeDb, 'products');
    this.analyticsRef = ref(realtimeDb, 'analytics');
  }

  static getInstance(): RealtimeInfrastructureService {
    if (!RealtimeInfrastructureService.instance) {
      RealtimeInfrastructureService.instance = new RealtimeInfrastructureService();
    }
    return RealtimeInfrastructureService.instance;
  }

  // ============= USER PRESENCE MANAGEMENT =============

  /**
   * Initialize user presence tracking
   */
  async initializeUserPresence(userId: string, userData: Partial<RealtimeUser>): Promise<void> {
    this.currentUserId = userId;
    const userPresenceRef = ref(realtimeDb, `presence/${userId}`);
    
    const presence: RealtimePresence = {
      userId,
      status: 'online',
      lastSeen: Date.now(),
      currentPage: userData.currentPage || '/',
      device: this.getDeviceType(),
      location: await this.getUserLocation()
    };

    // Set user online
    await set(userPresenceRef, presence);

    // Set up disconnect handler
    const disconnectRef = onDisconnect(userPresenceRef);
    await disconnectRef.update({
      status: 'offline',
      lastSeen: serverTimestamp()
    });

    console.log('✅ User presence initialized:', userId);
  }

  /**
   * Update user presence status
   */
  async updateUserPresence(userId: string, status: RealtimePresence['status'], currentPage?: string): Promise<void> {
    const userPresenceRef = ref(realtimeDb, `presence/${userId}`);
    await update(userPresenceRef, {
      status,
      lastSeen: serverTimestamp(),
      ...(currentPage && { currentPage })
    });
  }

  /**
   * Listen to all online users
   */
  subscribeToOnlineUsers(callback: (users: RealtimePresence[]) => void): Unsubscribe {
    const unsubscribe = onValue(this.presenceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const users = Object.values(data) as RealtimePresence[];
        const onlineUsers = users.filter(user => user.status === 'online');
        callback(onlineUsers);
      } else {
        callback([]);
      }
    });

    this.listeners.set('onlineUsers', unsubscribe);
    return unsubscribe;
  }

  // ============= REAL-TIME MESSAGING =============

  /**
   * Send a real-time message
   */
  async sendMessage(message: Omit<RealtimeMessage, 'id' | 'timestamp' | 'delivered'>): Promise<string> {
    const newMessageRef = push(this.messagesRef);
    const messageId = newMessageRef.key!;
    
    const fullMessage: RealtimeMessage = {
      ...message,
      id: messageId,
      timestamp: Date.now(),
      delivered: false
    };

    await set(newMessageRef, fullMessage);

    // Send notification to receiver
    await this.sendNotification({
      userId: message.receiverId,
      type: 'message',
      title: 'رسالة جديدة',
      body: message.content,
      priority: 'normal',
      data: { messageId, senderId: message.senderId }
    });

    return messageId;
  }

  /**
   * Subscribe to chat messages
   */
  subscribeToChatMessages(chatId: string, callback: (messages: RealtimeMessage[]) => void): Unsubscribe {
    const chatMessagesRef = ref(realtimeDb, `messages`);
    
    const unsubscribe = onValue(chatMessagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messages = Object.values(data) as RealtimeMessage[];
        const chatMessages = messages
          .filter(msg => msg.chatId === chatId)
          .sort((a, b) => a.timestamp - b.timestamp);
        callback(chatMessages);
      } else {
        callback([]);
      }
    });

    this.listeners.set(`chat-${chatId}`, unsubscribe);
    return unsubscribe;
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string): Promise<void> {
    const messageRef = ref(realtimeDb, `messages/${messageId}`);
    await update(messageRef, {
      read: true,
      delivered: true
    });
  }

  // ============= REAL-TIME NOTIFICATIONS =============

  /**
   * Send a notification
   */
  async sendNotification(notification: Omit<RealtimeNotification, 'id' | 'timestamp' | 'read'>): Promise<string> {
    const newNotificationRef = push(ref(realtimeDb, `notifications/${notification.userId}`));
    const notificationId = newNotificationRef.key!;
    
    const fullNotification: RealtimeNotification = {
      ...notification,
      id: notificationId,
      timestamp: Date.now(),
      read: false
    };

    await set(newNotificationRef, fullNotification);
    return notificationId;
  }

  /**
   * Subscribe to user notifications
   */
  subscribeToNotifications(userId: string, callback: (notifications: RealtimeNotification[]) => void): Unsubscribe {
    const userNotificationsRef = ref(realtimeDb, `notifications/${userId}`);
    
    const unsubscribe = onValue(userNotificationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const notifications = Object.values(data) as RealtimeNotification[];
        const sortedNotifications = notifications.sort((a, b) => b.timestamp - a.timestamp);
        callback(sortedNotifications);
      } else {
        callback([]);
      }
    });

    this.listeners.set(`notifications-${userId}`, unsubscribe);
    return unsubscribe;
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    const notificationRef = ref(realtimeDb, `notifications/${userId}/${notificationId}`);
    await update(notificationRef, { read: true });
  }

  // ============= REAL-TIME ORDERS =============

  /**
   * Create a new order
   */
  async createOrder(order: Omit<RealtimeOrder, 'id' | 'timestamp' | 'updates'>): Promise<string> {
    const newOrderRef = push(this.ordersRef);
    const orderId = newOrderRef.key!;
    
    const fullOrder: RealtimeOrder = {
      ...order,
      id: orderId,
      timestamp: Date.now(),
      updates: [{
        status: 'pending',
        timestamp: Date.now(),
        note: 'Order created'
      }]
    };

    await set(newOrderRef, fullOrder);

    // Notify vendor
    await this.sendNotification({
      userId: order.vendorId,
      type: 'order',
      title: 'طلب جديد',
      body: `لديك طلب جديد بقيمة ${order.totalAmount} جنيه`,
      priority: 'high',
      data: { orderId }
    });

    return orderId;
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: RealtimeOrder['status'], note?: string): Promise<void> {
    const orderRef = ref(realtimeDb, `orders/${orderId}`);
    const orderSnapshot = await new Promise<DataSnapshot>((resolve) => {
      onValue(orderRef, resolve, { onlyOnce: true });
    });
    
    const order = orderSnapshot.val() as RealtimeOrder;
    if (order) {
      const updates = [...order.updates, {
        status,
        timestamp: Date.now(),
        note
      }];

      await update(orderRef, { status, updates });

      // Notify customer
      await this.sendNotification({
        userId: order.customerId,
        type: 'order',
        title: 'تحديث الطلب',
        body: `تم تحديث حالة طلبك إلى: ${this.getStatusText(status)}`,
        priority: 'normal',
        data: { orderId, status }
      });
    }
  }

  /**
   * Subscribe to orders
   */
  subscribeToOrders(userId: string, role: 'customer' | 'vendor' | 'admin', callback: (orders: RealtimeOrder[]) => void): Unsubscribe {
    const unsubscribe = onValue(this.ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        let orders = Object.values(data) as RealtimeOrder[];
        
        // Filter based on role
        if (role === 'customer') {
          orders = orders.filter(order => order.customerId === userId);
        } else if (role === 'vendor') {
          orders = orders.filter(order => order.vendorId === userId);
        }
        // Admin sees all orders
        
        const sortedOrders = orders.sort((a, b) => b.timestamp - a.timestamp);
        callback(sortedOrders);
      } else {
        callback([]);
      }
    });

    this.listeners.set(`orders-${userId}`, unsubscribe);
    return unsubscribe;
  }

  // ============= REAL-TIME PRODUCTS =============

  /**
   * Update product in real-time
   */
  async updateProduct(productId: string, updates: Partial<RealtimeProduct>): Promise<void> {
    const productRef = ref(realtimeDb, `products/${productId}`);
    await update(productRef, {
      ...updates,
      lastUpdated: serverTimestamp()
    });
  }

  /**
   * Subscribe to product updates
   */
  subscribeToProduct(productId: string, callback: (product: RealtimeProduct) => void): Unsubscribe {
    const productRef = ref(realtimeDb, `products/${productId}`);
    
    const unsubscribe = onValue(productRef, (snapshot) => {
      const product = snapshot.val() as RealtimeProduct;
      if (product) {
        callback(product);
      }
    });

    this.listeners.set(`product-${productId}`, unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to vendor products
   */
  subscribeToVendorProducts(vendorId: string, callback: (products: RealtimeProduct[]) => void): Unsubscribe {
    const unsubscribe = onValue(this.productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const products = Object.values(data) as RealtimeProduct[];
        const vendorProducts = products.filter(product => product.vendorId === vendorId);
        callback(vendorProducts);
      } else {
        callback([]);
      }
    });

    this.listeners.set(`vendor-products-${vendorId}`, unsubscribe);
    return unsubscribe;
  }

  // ============= REAL-TIME ANALYTICS =============

  /**
   * Update analytics data
   */
  async updateAnalytics(analytics: Partial<RealtimeAnalytics>): Promise<void> {
    await update(this.analyticsRef, {
      ...analytics,
      timestamp: serverTimestamp()
    });
  }

  /**
   * Subscribe to analytics
   */
  subscribeToAnalytics(callback: (analytics: RealtimeAnalytics) => void): Unsubscribe {
    const unsubscribe = onValue(this.analyticsRef, (snapshot) => {
      const analytics = snapshot.val() as RealtimeAnalytics;
      if (analytics) {
        callback(analytics);
      }
    });

    this.listeners.set('analytics', unsubscribe);
    return unsubscribe;
  }

  /**
   * Track user activity
   */
  async trackUserActivity(userId: string, action: string, metadata?: Record<string, any>): Promise<void> {
    const activityRef = push(ref(realtimeDb, 'activity'));
    await set(activityRef, {
      userId,
      action,
      metadata,
      timestamp: serverTimestamp()
    });
  }

  // ============= UTILITY METHODS =============

  /**
   * Clean up all listeners
   */
  cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
    
    if (this.currentUserId) {
      this.updateUserPresence(this.currentUserId, 'offline');
    }
    
    console.log('✅ Real-time infrastructure cleaned up');
  }

  /**
   * Get device type
   */
  private getDeviceType(): string {
    const userAgent = navigator.userAgent;
    if (/mobile/i.test(userAgent)) return 'mobile';
    if (/tablet/i.test(userAgent)) return 'tablet';
    return 'desktop';
  }

  /**
   * Get user location (placeholder)
   */
  private async getUserLocation(): Promise<string> {
    // This would normally use geolocation API
    return 'Egypt';
  }

  /**
   * Get status text in Arabic
   */
  private getStatusText(status: RealtimeOrder['status']): string {
    const statusMap: Record<RealtimeOrder['status'], string> = {
      pending: 'قيد الانتظار',
      processing: 'قيد المعالجة',
      shipped: 'تم الشحن',
      delivered: 'تم التسليم',
      cancelled: 'ملغي'
    };
    return statusMap[status] || status;
  }
}

// Export singleton instance
export const realtimeInfrastructure = RealtimeInfrastructureService.getInstance();