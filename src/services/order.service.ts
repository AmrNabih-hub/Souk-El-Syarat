/**
 * 📦 Order Service
 * Professional order management with Supabase integration
 */

import { supabase } from '@/config/supabase.config';
import type { Order, OrderStatus, CreateOrderData, UpdateOrderData } from '@/types';

export type OrderStatus =
  | 'pending' // Order placed, waiting for vendor confirmation
  | 'confirmed' // Vendor confirmed the order
  | 'payment_pending' // Waiting for payment
  | 'paid' // Payment completed
  | 'processing' // Order being prepared
  | 'shipped' // Order shipped
  | 'delivered' // Order delivered
  | 'cancelled' // Order cancelled
  | 'refunded' // Order refunded
  | 'disputed'; // Order under dispute

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'disputed';

export type PaymentMethod =
  | 'cash_on_delivery'
  | 'bank_transfer'
  | 'credit_card'
  | 'mobile_wallet'
  | 'installment';

export interface CreateOrderData {
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    vendorId: string;
  }>;
  totalAmount: number;
  currency: string;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    governorate: string;
    postalCode: string;
    phone: string;
  };
  paymentMethod: PaymentMethod;
  notes?: string;
}

/**
 * Appwrite Order Service
 * Complete order management using Appwrite Cloud
 */
export class OrderService {
  /**
   * Create a new order
   */
  static async createOrder(orderData: CreateOrderData): Promise<string> {
    try {
      const order = await appwriteDatabaseService.createOrder(orderData);
      return order?.id || '';
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Failed to create order');
    }
  }

  /**
   * Get order by ID
   */
  static async getOrder(orderId: string): Promise<any> {
    try {
      return await appwriteDatabaseService.getOrder(orderId);
    } catch (error) {
      console.error('Error getting order:', error);
      return null;
    }
  }

  /**
   * Get orders for user
   */
  static async getUserOrders(
    userId: string,
    limit: number = 25,
    offset: number = 0
  ): Promise<{ orders: any[]; total: number }> {
    try {
      return await appwriteDatabaseService.getUserOrders(userId, limit, offset);
    } catch (error) {
      console.error('Error getting user orders:', error);
      return { orders: [], total: 0 };
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(orderId: string, status: OrderStatus): Promise<boolean> {
    try {
      const order = await appwriteDatabaseService.updateOrder(orderId, { status });
      return order !== null;
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  }

  /**
   * Update payment status
   */
  static async updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus): Promise<boolean> {
    try {
      const order = await appwriteDatabaseService.updateOrder(orderId, { paymentStatus });
      return order !== null;
    } catch (error) {
      console.error('Error updating payment status:', error);
      return false;
    }
  }

  /**
   * Cancel order
   */
  static async cancelOrder(orderId: string, reason?: string): Promise<boolean> {
    try {
      const order = await appwriteDatabaseService.updateOrder(orderId, { 
        status: 'cancelled',
        notes: reason ? `Cancelled: ${reason}` : 'Order cancelled'
      });
      return order !== null;
    } catch (error) {
      console.error('Error cancelling order:', error);
      return false;
    }
  }

  /**
   * Get orders by status
   */
  static async getOrdersByStatus(
    status: OrderStatus,
    limit: number = 25,
    offset: number = 0
  ): Promise<{ orders: any[]; total: number }> {
    try {
      // This would need to be implemented in the database service
      // For now, get all orders and filter
      const allOrders = await appwriteDatabaseService.getUserOrders('', 1000, 0);
      const filteredOrders = allOrders.orders.filter(order => order.status === status);
      
      return {
        orders: filteredOrders.slice(offset, offset + limit),
        total: filteredOrders.length
      };
    } catch (error) {
      console.error('Error getting orders by status:', error);
      return { orders: [], total: 0 };
    }
  }

  /**
   * Get orders by vendor
   */
  static async getVendorOrders(
    vendorId: string,
    limit: number = 25,
    offset: number = 0
  ): Promise<{ orders: any[]; total: number }> {
    try {
      // This would need to be implemented in the database service
      // For now, get all orders and filter by vendor
      const allOrders = await appwriteDatabaseService.getUserOrders('', 1000, 0);
      const vendorOrders = allOrders.orders.filter(order => 
        order.items.some((item: any) => item.vendorId === vendorId)
      );
      
      return {
        orders: vendorOrders.slice(offset, offset + limit),
        total: vendorOrders.length
      };
    } catch (error) {
      console.error('Error getting vendor orders:', error);
      return { orders: [], total: 0 };
    }
  }

  /**
   * Get order statistics
   */
  static async getOrderStats(vendorId?: string): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    totalRevenue: number;
  }> {
    try {
      const allOrders = await appwriteDatabaseService.getUserOrders('', 1000, 0);
      
      let orders = allOrders.orders;
      if (vendorId) {
        orders = orders.filter(order => 
          order.items.some((item: any) => item.vendorId === vendorId)
        );
      }

      const stats = {
        total: orders.length,
        pending: 0,
        confirmed: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        totalRevenue: 0
      };

      orders.forEach(order => {
        switch (order.status) {
          case 'pending':
            stats.pending++;
            break;
          case 'confirmed':
            stats.confirmed++;
            break;
          case 'shipped':
            stats.shipped++;
            break;
          case 'delivered':
            stats.delivered++;
            break;
          case 'cancelled':
            stats.cancelled++;
            break;
        }
        
        if (order.status === 'delivered') {
          stats.totalRevenue += order.totalAmount || 0;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting order stats:', error);
      return {
        total: 0,
        pending: 0,
        confirmed: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        totalRevenue: 0
      };
    }
  }

  /**
   * Get recent orders
   */
  static async getRecentOrders(limit: number = 10): Promise<any[]> {
    try {
      const result = await appwriteDatabaseService.getUserOrders('', limit, 0);
      return result.orders;
    } catch (error) {
      console.error('Error getting recent orders:', error);
      return [];
    }
  }

  /**
   * Search orders
   */
  static async searchOrders(query: string, limit: number = 25, offset: number = 0): Promise<{ orders: any[]; total: number }> {
    try {
      // This would need to be implemented in the database service
      // For now, get all orders and filter
      const allOrders = await appwriteDatabaseService.getUserOrders('', 1000, 0);
      const filteredOrders = allOrders.orders.filter(order => 
        order.id.includes(query) || 
        order.customerId.includes(query) ||
        order.items.some((item: any) => item.productId.includes(query))
      );
      
      return {
        orders: filteredOrders.slice(offset, offset + limit),
        total: filteredOrders.length
      };
    } catch (error) {
      console.error('Error searching orders:', error);
      return { orders: [], total: 0 };
    }
  }

  /**
   * Generate order number
   */
  static generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp.slice(-6)}-${random}`;
  }

  /**
   * Calculate order total
   */
  static calculateOrderTotal(items: Array<{ price: number; quantity: number }>): number {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  /**
   * Validate order data
   */
  static validateOrderData(orderData: CreateOrderData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!orderData.customerId) {
      errors.push('Customer ID is required');
    }

    if (!orderData.items || orderData.items.length === 0) {
      errors.push('Order must contain at least one item');
    }

    if (!orderData.shippingAddress) {
      errors.push('Shipping address is required');
    }

    if (!orderData.paymentMethod) {
      errors.push('Payment method is required');
    }

    if (orderData.totalAmount <= 0) {
      errors.push('Total amount must be greater than 0');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
