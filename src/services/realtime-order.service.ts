/**
 * 🚀 REAL-TIME ORDER MANAGEMENT SERVICE
 * Souk El-Sayarat - Professional Order Operations
 * 
 * This service handles all real-time order operations
 * with instant status updates and notifications
 */

import { 
  ref, 
  set, 
  update,
  onValue,
  DataSnapshot,
  Unsubscribe
} from 'firebase/database';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp as firestoreTimestamp
} from 'firebase/firestore';
import { db, realtimeDb } from '@/config/firebase.config';
import { realtimeInfrastructure } from './realtime-infrastructure.service';
import { realtimeProductService } from './realtime-product.service';

// Order interfaces
export interface OrderItem {
  productId: string;
  productName: string;
  productNameAr: string;
  vendorId: string;
  vendorName: string;
  quantity: number;
  price: number;
  subtotal: number;
  image: string;
  specifications?: Record<string, any>;
}

export interface OrderAddress {
  fullName: string;
  phone: string;
  email?: string;
  street: string;
  building: string;
  floor?: string;
  apartment?: string;
  city: string;
  region: string;
  postalCode?: string;
  landmark?: string;
  coordinates?: { lat: number; lng: number };
}

export interface OrderPayment {
  method: 'cash' | 'card' | 'wallet' | 'bank_transfer';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  amount: number;
  currency: 'EGP' | 'USD';
  paidAt?: number;
  refundedAt?: number;
  refundAmount?: number;
}

export interface OrderShipping {
  method: 'standard' | 'express' | 'pickup';
  carrier?: string;
  trackingNumber?: string;
  cost: number;
  estimatedDelivery?: number;
  actualDelivery?: number;
  status: 'pending' | 'processing' | 'shipped' | 'in_transit' | 'delivered' | 'returned';
}

export interface OrderStatus {
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  timestamp: number;
  note?: string;
  updatedBy: string;
}

export interface RealtimeOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vendorIds: string[];
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: OrderShipping;
  discount: number;
  discountCode?: string;
  total: number;
  address: OrderAddress;
  payment: OrderPayment;
  status: OrderStatus['status'];
  statusHistory: OrderStatus[];
  notes?: string;
  customerNotes?: string;
  vendorNotes?: Record<string, string>;
  rating?: number;
  review?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  cancelledAt?: number;
  metadata?: Record<string, any>;
}

export interface OrderFilter {
  customerId?: string;
  vendorId?: string;
  status?: OrderStatus['status'];
  paymentStatus?: OrderPayment['status'];
  shippingStatus?: OrderShipping['status'];
  dateFrom?: number;
  dateTo?: number;
  minAmount?: number;
  maxAmount?: number;
  orderNumber?: string;
}

export interface OrderAnalytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
  ordersByDay: Array<{ date: string; count: number; revenue: number }>;
  topProducts: Array<{ productId: string; productName: string; quantity: number; revenue: number }>;
  topCustomers: Array<{ customerId: string; customerName: string; orders: number; revenue: number }>;
  conversionRate: number;
  fulfillmentRate: number;
  averageDeliveryTime: number;
}

/**
 * Real-Time Order Management Service
 */
export class RealtimeOrderService {
  private static instance: RealtimeOrderService;
  private listeners: Map<string, Unsubscribe> = new Map();
  private ordersRef = ref(realtimeDb, 'orders');
  private analyticsRef = ref(realtimeDb, 'orderAnalytics');

  private constructor() {}

  static getInstance(): RealtimeOrderService {
    if (!RealtimeOrderService.instance) {
      RealtimeOrderService.instance = new RealtimeOrderService();
    }
    return RealtimeOrderService.instance;
  }

  // ============= ORDER CRUD OPERATIONS =============

  /**
   * Create a new order
   */
  async createOrder(orderData: Omit<RealtimeOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'statusHistory'>): Promise<string> {
    try {
      // Generate order ID and number
      const orderId = doc(collection(db, 'orders')).id;
      const orderNumber = this.generateOrderNumber();
      
      // Prepare order data
      const order: RealtimeOrder = {
        ...orderData,
        id: orderId,
        orderNumber,
        status: 'pending',
        statusHistory: [{
          status: 'pending',
          timestamp: Date.now(),
          note: 'Order created',
          updatedBy: orderData.customerId
        }],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Validate stock availability
      for (const item of order.items) {
        const product = await realtimeProductService.getProduct(item.productId);
        if (!product || product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product: ${item.productName}`);
        }
      }

      // Save to Firestore (primary database)
      await setDoc(doc(db, 'orders', orderId), {
        ...order,
        createdAt: firestoreTimestamp(),
        updatedAt: firestoreTimestamp()
      });

      // Save to Realtime Database for instant updates
      await set(ref(realtimeDb, `orders/${orderId}`), order);

      // Update product stock
      for (const item of order.items) {
        await realtimeProductService.updateProduct(item.productId, {
          stock: -item.quantity // Decrement stock
        });
      }

      // Send notifications
      await this.sendOrderNotifications(order, 'created');

      // Track activity
      await realtimeInfrastructure.trackUserActivity(
        order.customerId,
        'order_created',
        { orderId, orderNumber, total: order.total }
      );

      // Update analytics
      await this.updateOrderAnalytics('created', order);

      console.log('✅ Order created successfully:', orderId);
      return orderId;
    } catch (error) {
      console.error('❌ Error creating order:', error);
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string, 
    newStatus: OrderStatus['status'], 
    updatedBy: string, 
    note?: string
  ): Promise<void> {
    try {
      // Get current order
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }
      
      const order = orderDoc.data() as RealtimeOrder;
      
      // Validate status transition
      if (!this.isValidStatusTransition(order.status, newStatus)) {
        throw new Error(`Invalid status transition from ${order.status} to ${newStatus}`);
      }

      // Prepare status update
      const statusUpdate: OrderStatus = {
        status: newStatus,
        timestamp: Date.now(),
        note: note || `Status changed to ${newStatus}`,
        updatedBy
      };

      // Update status history
      const updatedStatusHistory = [...order.statusHistory, statusUpdate];

      // Prepare order updates
      const updates: Partial<RealtimeOrder> = {
        status: newStatus,
        statusHistory: updatedStatusHistory,
        updatedAt: Date.now()
      };

      // Add completion/cancellation timestamps
      if (newStatus === 'delivered') {
        updates.completedAt = Date.now();
      } else if (newStatus === 'cancelled') {
        updates.cancelledAt = Date.now();
        
        // Restore product stock for cancelled orders
        for (const item of order.items) {
          await realtimeProductService.updateProduct(item.productId, {
            stock: item.quantity // Restore stock
          });
        }
      }

      // Update in Firestore
      await updateDoc(doc(db, 'orders', orderId), {
        ...updates,
        updatedAt: firestoreTimestamp()
      });

      // Update in Realtime Database
      await update(ref(realtimeDb, `orders/${orderId}`), updates);

      // Send notifications
      await this.sendOrderNotifications(order, 'status_updated', newStatus);

      // Track activity
      await realtimeInfrastructure.trackUserActivity(
        updatedBy,
        'order_status_updated',
        { orderId, orderNumber: order.orderNumber, oldStatus: order.status, newStatus }
      );

      // Update analytics
      await this.updateOrderAnalytics('status_updated', { ...order, ...updates });

      console.log('✅ Order status updated:', orderId, newStatus);
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    orderId: string,
    paymentStatus: OrderPayment['status'],
    transactionId?: string
  ): Promise<void> {
    try {
      const updates: any = {
        'payment.status': paymentStatus,
        'payment.transactionId': transactionId,
        updatedAt: Date.now()
      };

      if (paymentStatus === 'completed') {
        updates['payment.paidAt'] = Date.now();
      }

      // Update in Firestore
      await updateDoc(doc(db, 'orders', orderId), {
        ...updates,
        updatedAt: firestoreTimestamp()
      });

      // Update in Realtime Database
      await update(ref(realtimeDb, `orders/${orderId}`), updates);

      console.log('✅ Payment status updated:', orderId, paymentStatus);
    } catch (error) {
      console.error('❌ Error updating payment status:', error);
      throw error;
    }
  }

  /**
   * Update shipping status
   */
  async updateShippingStatus(
    orderId: string,
    shippingStatus: OrderShipping['status'],
    trackingNumber?: string,
    carrier?: string
  ): Promise<void> {
    try {
      const updates: any = {
        'shipping.status': shippingStatus,
        updatedAt: Date.now()
      };

      if (trackingNumber) updates['shipping.trackingNumber'] = trackingNumber;
      if (carrier) updates['shipping.carrier'] = carrier;
      
      if (shippingStatus === 'delivered') {
        updates['shipping.actualDelivery'] = Date.now();
      }

      // Update in Firestore
      await updateDoc(doc(db, 'orders', orderId), {
        ...updates,
        updatedAt: firestoreTimestamp()
      });

      // Update in Realtime Database
      await update(ref(realtimeDb, `orders/${orderId}`), updates);

      console.log('✅ Shipping status updated:', orderId, shippingStatus);
    } catch (error) {
      console.error('❌ Error updating shipping status:', error);
      throw error;
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, cancelledBy: string, reason: string): Promise<void> {
    try {
      await this.updateOrderStatus(orderId, 'cancelled', cancelledBy, reason);
      
      // Process refund if payment was completed
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      const order = orderDoc.data() as RealtimeOrder;
      
      if (order.payment.status === 'completed') {
        await this.processRefund(orderId, order.total, reason);
      }

      console.log('✅ Order cancelled:', orderId);
    } catch (error) {
      console.error('❌ Error cancelling order:', error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  async processRefund(orderId: string, amount: number, reason: string): Promise<void> {
    try {
      const updates = {
        'payment.status': 'refunded',
        'payment.refundedAt': Date.now(),
        'payment.refundAmount': amount,
        updatedAt: Date.now()
      };

      // Update in Firestore
      await updateDoc(doc(db, 'orders', orderId), {
        ...updates,
        updatedAt: firestoreTimestamp()
      });

      // Update in Realtime Database
      await update(ref(realtimeDb, `orders/${orderId}`), updates);

      // Track refund
      await realtimeInfrastructure.trackUserActivity(
        'system',
        'order_refunded',
        { orderId, amount, reason }
      );

      console.log('✅ Refund processed:', orderId, amount);
    } catch (error) {
      console.error('❌ Error processing refund:', error);
      throw error;
    }
  }

  // ============= ORDER RETRIEVAL =============

  /**
   * Get a single order
   */
  async getOrder(orderId: string): Promise<RealtimeOrder | null> {
    try {
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      if (!orderDoc.exists()) {
        return null;
      }
      return orderDoc.data() as RealtimeOrder;
    } catch (error) {
      console.error('❌ Error getting order:', error);
      throw error;
    }
  }

  /**
   * Get orders with filters
   */
  async getOrders(filter: OrderFilter = {}, limitCount: number = 20): Promise<RealtimeOrder[]> {
    try {
      let q = query(collection(db, 'orders'));

      // Apply filters
      if (filter.customerId) {
        q = query(q, where('customerId', '==', filter.customerId));
      }
      if (filter.vendorId) {
        q = query(q, where('vendorIds', 'array-contains', filter.vendorId));
      }
      if (filter.status) {
        q = query(q, where('status', '==', filter.status));
      }
      if (filter.paymentStatus) {
        q = query(q, where('payment.status', '==', filter.paymentStatus));
      }
      if (filter.dateFrom) {
        q = query(q, where('createdAt', '>=', filter.dateFrom));
      }
      if (filter.dateTo) {
        q = query(q, where('createdAt', '<=', filter.dateTo));
      }

      // Add ordering and limit
      q = query(q, orderBy('createdAt', 'desc'), limit(limitCount));

      const querySnapshot = await getDocs(q);
      const orders: RealtimeOrder[] = [];

      querySnapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() } as RealtimeOrder);
      });

      return orders;
    } catch (error) {
      console.error('❌ Error getting orders:', error);
      throw error;
    }
  }

  // ============= REAL-TIME SUBSCRIPTIONS =============

  /**
   * Subscribe to a single order
   */
  subscribeToOrder(orderId: string, callback: (order: RealtimeOrder | null) => void): Unsubscribe {
    const orderRef = ref(realtimeDb, `orders/${orderId}`);
    
    const unsubscribe = onValue(orderRef, (snapshot) => {
      const order = snapshot.val() as RealtimeOrder;
      callback(order || null);
    });

    this.listeners.set(`order-${orderId}`, unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to customer orders
   */
  subscribeToCustomerOrders(customerId: string, callback: (orders: RealtimeOrder[]) => void): Unsubscribe {
    const unsubscribe = onValue(this.ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const orders = Object.values(data) as RealtimeOrder[];
        const customerOrders = orders
          .filter(o => o.customerId === customerId)
          .sort((a, b) => b.createdAt - a.createdAt);
        callback(customerOrders);
      } else {
        callback([]);
      }
    });

    this.listeners.set(`customer-orders-${customerId}`, unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to vendor orders
   */
  subscribeToVendorOrders(vendorId: string, callback: (orders: RealtimeOrder[]) => void): Unsubscribe {
    const unsubscribe = onValue(this.ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const orders = Object.values(data) as RealtimeOrder[];
        const vendorOrders = orders
          .filter(o => o.vendorIds.includes(vendorId))
          .sort((a, b) => b.createdAt - a.createdAt);
        callback(vendorOrders);
      } else {
        callback([]);
      }
    });

    this.listeners.set(`vendor-orders-${vendorId}`, unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to order analytics
   */
  subscribeToOrderAnalytics(callback: (analytics: OrderAnalytics) => void): Unsubscribe {
    const unsubscribe = onValue(this.analyticsRef, (snapshot) => {
      const analytics = snapshot.val() as OrderAnalytics;
      if (analytics) {
        callback(analytics);
      }
    });

    this.listeners.set('order-analytics', unsubscribe);
    return unsubscribe;
  }

  // ============= HELPER METHODS =============

  /**
   * Generate order number
   */
  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  /**
   * Validate status transition
   */
  private isValidStatusTransition(currentStatus: OrderStatus['status'], newStatus: OrderStatus['status']): boolean {
    const validTransitions: Record<OrderStatus['status'], OrderStatus['status'][]> = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered', 'cancelled'],
      'delivered': ['refunded'],
      'cancelled': [],
      'refunded': []
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  /**
   * Send order notifications
   */
  private async sendOrderNotifications(
    order: RealtimeOrder, 
    event: 'created' | 'status_updated' | 'cancelled' | 'delivered',
    newStatus?: OrderStatus['status']
  ): Promise<void> {
    try {
      // Notify customer
      const customerTitle = this.getNotificationTitle(event, newStatus);
      const customerBody = this.getNotificationBody(event, order, newStatus);
      
      await realtimeInfrastructure.sendNotification({
        userId: order.customerId,
        type: 'order',
        title: customerTitle,
        body: customerBody,
        priority: event === 'created' || event === 'delivered' ? 'high' : 'normal',
        data: { orderId: order.id, orderNumber: order.orderNumber }
      });

      // Notify vendors
      for (const vendorId of order.vendorIds) {
        await realtimeInfrastructure.sendNotification({
          userId: vendorId,
          type: 'order',
          title: event === 'created' ? 'طلب جديد' : customerTitle,
          body: event === 'created' 
            ? `لديك طلب جديد #${order.orderNumber} بقيمة ${order.total} جنيه`
            : customerBody,
          priority: event === 'created' ? 'urgent' : 'normal',
          data: { orderId: order.id, orderNumber: order.orderNumber }
        });
      }
    } catch (error) {
      console.error('❌ Error sending order notifications:', error);
    }
  }

  /**
   * Get notification title
   */
  private getNotificationTitle(event: string, newStatus?: string): string {
    switch (event) {
      case 'created': return 'تم استلام طلبك';
      case 'status_updated': 
        switch (newStatus) {
          case 'confirmed': return 'تم تأكيد طلبك';
          case 'processing': return 'جاري تجهيز طلبك';
          case 'shipped': return 'تم شحن طلبك';
          case 'delivered': return 'تم تسليم طلبك';
          default: return 'تحديث حالة الطلب';
        }
      case 'cancelled': return 'تم إلغاء الطلب';
      case 'delivered': return 'تم تسليم طلبك بنجاح';
      default: return 'تحديث الطلب';
    }
  }

  /**
   * Get notification body
   */
  private getNotificationBody(event: string, order: RealtimeOrder, newStatus?: string): string {
    switch (event) {
      case 'created': 
        return `تم استلام طلبك #${order.orderNumber} بنجاح وسيتم معالجته قريباً`;
      case 'status_updated':
        return `تم تحديث حالة طلبك #${order.orderNumber} إلى: ${this.getStatusText(newStatus || order.status)}`;
      case 'cancelled':
        return `تم إلغاء طلبك #${order.orderNumber}. سيتم استرداد المبلغ خلال 3-5 أيام عمل`;
      case 'delivered':
        return `شكراً لك! تم تسليم طلبك #${order.orderNumber} بنجاح`;
      default:
        return `تم تحديث طلبك #${order.orderNumber}`;
    }
  }

  /**
   * Get status text in Arabic
   */
  private getStatusText(status: OrderStatus['status']): string {
    const statusMap: Record<OrderStatus['status'], string> = {
      'pending': 'قيد الانتظار',
      'confirmed': 'مؤكد',
      'processing': 'قيد التجهيز',
      'shipped': 'تم الشحن',
      'delivered': 'تم التسليم',
      'cancelled': 'ملغي',
      'refunded': 'مسترد'
    };
    return statusMap[status] || status;
  }

  /**
   * Update order analytics
   */
  private async updateOrderAnalytics(event: string, order: RealtimeOrder): Promise<void> {
    try {
      const analyticsRef = ref(realtimeDb, 'orderAnalytics');
      const snapshot = await new Promise<DataSnapshot>((resolve) => {
        onValue(analyticsRef, resolve, { onlyOnce: true });
      });
      
      const currentAnalytics = snapshot.val() as OrderAnalytics || {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        ordersByStatus: {},
        ordersByDay: [],
        topProducts: [],
        topCustomers: [],
        conversionRate: 0,
        fulfillmentRate: 0,
        averageDeliveryTime: 0
      };

      // Update analytics based on event
      if (event === 'created') {
        currentAnalytics.totalOrders++;
        currentAnalytics.totalRevenue += order.total;
        currentAnalytics.averageOrderValue = currentAnalytics.totalRevenue / currentAnalytics.totalOrders;
      }

      // Update status counts
      currentAnalytics.ordersByStatus[order.status] = (currentAnalytics.ordersByStatus[order.status] || 0) + 1;

      await set(analyticsRef, currentAnalytics);
    } catch (error) {
      console.error('❌ Error updating order analytics:', error);
    }
  }

  // ============= CLEANUP =============

  /**
   * Clean up all listeners
   */
  cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
    console.log('✅ Real-time order service cleaned up');
  }
}

// Export singleton instance
export const realtimeOrderService = RealtimeOrderService.getInstance();