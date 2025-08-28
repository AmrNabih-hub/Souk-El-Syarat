/**
 * 📦 ORDER SERVICE
 * Manages order operations with real-time tracking
 */

import { db } from '@/config/firebase.config';
import { 
  collection,
  doc, 
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { Order, OrderStatus } from '@/types';

export class OrderService {
  private static ORDERS_COLLECTION = 'orders';

  /**
   * Create a new order
   */
  static async createOrder(orderData: any): Promise<Order | null> {
    try {
      const orderRef = await addDoc(collection(db, this.ORDERS_COLLECTION), {
        ...orderData,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const orderDoc = await getDoc(orderRef);
      if (orderDoc.exists()) {
        return {
          id: orderDoc.id,
          ...orderDoc.data(),
          createdAt: orderDoc.data().createdAt?.toDate() || new Date(),
          updatedAt: orderDoc.data().updatedAt?.toDate() || new Date()
        } as Order;
      }
      
      return null;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  /**
   * Get user's orders
   */
  static async getOrders(userId?: string): Promise<Order[]> {
    if (!userId) return [];

    try {
      const q = query(
        collection(db, this.ORDERS_COLLECTION),
        where('customerId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const orders: Order[] = [];

      querySnapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        } as Order);
      });

      return orders;
    } catch (error) {
      console.error('Error getting orders:', error);
      return [];
    }
  }

  /**
   * Get order by ID
   */
  static async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const orderDoc = await getDoc(doc(db, this.ORDERS_COLLECTION, orderId));
      
      if (orderDoc.exists()) {
        return {
          id: orderDoc.id,
          ...orderDoc.data(),
          createdAt: orderDoc.data().createdAt?.toDate() || new Date(),
          updatedAt: orderDoc.data().updatedAt?.toDate() || new Date()
        } as Order;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting order:', error);
      return null;
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(
    orderId: string, 
    status: OrderStatus,
    message?: string
  ): Promise<void> {
    try {
      const orderRef = doc(db, this.ORDERS_COLLECTION, orderId);
      
      // Get current order
      const orderDoc = await getDoc(orderRef);
      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }

      const currentData = orderDoc.data();
      const statusHistory = currentData.statusHistory || [];
      
      // Add to status history
      statusHistory.push({
        status,
        timestamp: new Date(),
        message
      });

      await updateDoc(orderRef, {
        status,
        statusHistory,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Cancel order
   */
  static async cancelOrder(orderId: string, reason?: string): Promise<void> {
    await this.updateOrderStatus(orderId, 'cancelled', reason);
  }

  /**
   * Track order in real-time
   */
  static async trackOrder(orderId: string): Promise<Order | null> {
    return this.getOrderById(orderId);
  }

  /**
   * Get vendor orders
   */
  static async getVendorOrders(vendorId: string): Promise<Order[]> {
    try {
      const q = query(
        collection(db, this.ORDERS_COLLECTION),
        where('vendorId', '==', vendorId),
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      const querySnapshot = await getDocs(q);
      const orders: Order[] = [];

      querySnapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        } as Order);
      });

      return orders;
    } catch (error) {
      console.error('Error getting vendor orders:', error);
      return [];
    }
  }

  /**
   * Get order statistics
   */
  static async getOrderStats(userId: string, role: 'customer' | 'vendor'): Promise<any> {
    try {
      const orders = role === 'vendor' 
        ? await this.getVendorOrders(userId)
        : await this.getOrders(userId);

      const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        processing: orders.filter(o => o.status === 'processing').length,
        shipped: orders.filter(o => o.status === 'shipped').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length,
        totalRevenue: orders
          .filter(o => o.status !== 'cancelled')
          .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
      };

      return stats;
    } catch (error) {
      console.error('Error getting order stats:', error);
      return null;
    }
  }
}

export const orderService = new OrderService();