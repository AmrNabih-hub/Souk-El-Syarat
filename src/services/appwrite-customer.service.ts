/**
 * 🛒 CUSTOMER SERVICE WITH REAL-TIME
 * Complete customer operations with real-time updates
 */

import {
  CarListingService,
  ProductService,
  OrderService,
  NotificationService,
} from './appwrite-database.service';
import { realtimeService } from './appwrite-realtime.service';
import { appwriteConfig } from '@/config/appwrite.config';

export interface CarListingSubmission {
  brand: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  condition: string;
  description: string;
  images: string[];
  contactPhone: string;
}

export interface CustomerDashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  carListings: number;
  pendingCarListings: number;
  approvedCarListings: number;
}

/**
 * Customer Service Class
 */
export class AppwriteCustomerService {
  /**
   * 🚙 SUBMIT CAR FOR SELLING ("بيع عربيتك")
   */
  static async submitCarListing(
    userId: string,
    carData: CarListingSubmission
  ): Promise<any> {
    try {
      console.log('🚙 Submitting car listing...');

      const listing = await CarListingService.submitCarListing(userId, carData);

      // Send notification to admin
      await NotificationService.createNotification('admin', {
        title: 'طلب بيع سيارة جديد',
        message: `طلب جديد لبيع ${carData.brand} ${carData.model} ${carData.year}`,
        type: 'info',
        actionUrl: '/admin/car-listings',
      });

      console.log('✅ Car listing submitted successfully');
      return listing;
    } catch (error: any) {
      console.error('❌ Failed to submit car listing:', error);
      throw error;
    }
  }

  /**
   * 📋 GET MY CAR LISTINGS
   */
  static async getMyCarListings(userId: string) {
    try {
      return await CarListingService.getCarListingsByUser(userId);
    } catch (error: any) {
      console.error('❌ Failed to get car listings:', error);
      throw error;
    }
  }

  /**
   * 🛒 PLACE ORDER
   */
  static async placeOrder(orderData: {
    customerId: string;
    vendorId: string;
    productId: string;
    totalAmount: number;
    paymentMethod: string;
    shippingAddress: string;
  }): Promise<any> {
    try {
      console.log('🛒 Placing order...');

      const order = await OrderService.createOrder(orderData);

      // Send notification to vendor
      await NotificationService.createNotification(orderData.vendorId, {
        title: 'طلب جديد',
        message: 'لديك طلب جديد!',
        type: 'success',
        actionUrl: `/vendor/orders/${order.$id}`,
      });

      // Send confirmation to customer
      await NotificationService.createNotification(orderData.customerId, {
        title: 'تم تأكيد الطلب',
        message: 'تم استلام طلبك وسيتم معالجته قريباً',
        type: 'success',
        actionUrl: `/customer/orders/${order.$id}`,
      });

      console.log('✅ Order placed successfully');
      return order;
    } catch (error: any) {
      console.error('❌ Failed to place order:', error);
      throw error;
    }
  }

  /**
   * 📦 GET MY ORDERS
   */
  static async getMyOrders(customerId: string) {
    try {
      return await OrderService.listOrdersByCustomer(customerId);
    } catch (error: any) {
      console.error('❌ Failed to get orders:', error);
      throw error;
    }
  }

  /**
   * 👀 GET ORDER DETAILS
   */
  static async getOrderDetails(orderId: string) {
    try {
      return await OrderService.getOrder(orderId);
    } catch (error: any) {
      console.error('❌ Failed to get order details:', error);
      throw error;
    }
  }

  /**
   * ❌ CANCEL ORDER
   */
  static async cancelOrder(orderId: string, customerId: string) {
    try {
      console.log('❌ Cancelling order...');

      await OrderService.updateOrderStatus(orderId, 'cancelled');

      // Send notification to customer
      await NotificationService.createNotification(customerId, {
        title: 'تم إلغاء الطلب',
        message: 'تم إلغاء طلبك بنجاح',
        type: 'info',
        actionUrl: `/customer/orders/${orderId}`,
      });

      console.log('✅ Order cancelled');
    } catch (error: any) {
      console.error('❌ Failed to cancel order:', error);
      throw error;
    }
  }

  /**
   * 📊 GET DASHBOARD STATS
   */
  static async getDashboardStats(customerId: string): Promise<CustomerDashboardStats> {
    try {
      console.log('📊 Loading customer dashboard stats...');

      // Get orders
      const orders = await OrderService.listOrdersByCustomer(customerId);
      const pendingOrders = orders.documents.filter(
        (o: any) => o.status === 'pending' || o.status === 'confirmed'
      );
      const completedOrders = orders.documents.filter(
        (o: any) => o.status === 'delivered'
      );

      // Get car listings
      const carListings = await CarListingService.getCarListingsByUser(customerId);
      const pendingCarListings = carListings.documents.filter(
        (c: any) => c.status === 'pending'
      );
      const approvedCarListings = carListings.documents.filter(
        (c: any) => c.status === 'approved'
      );

      console.log('✅ Dashboard stats loaded');

      return {
        totalOrders: orders.total,
        pendingOrders: pendingOrders.length,
        completedOrders: completedOrders.length,
        carListings: carListings.total,
        pendingCarListings: pendingCarListings.length,
        approvedCarListings: approvedCarListings.length,
      };
    } catch (error: any) {
      console.error('❌ Failed to load dashboard stats:', error);
      throw error;
    }
  }

  /**
   * 🔔 SUBSCRIBE TO CUSTOMER UPDATES (Real-time)
   */
  static subscribeToCustomerUpdates(
    customerId: string,
    callbacks: {
      onOrderUpdate?: (order: any) => void;
      onCarListingUpdate?: (listing: any) => void;
      onNotification?: (notification: any) => void;
    }
  ): () => void {
    console.log('🔔 Setting up real-time customer subscriptions...');

    const unsubscribers: Array<() => void> = [];

    // Subscribe to orders
    if (callbacks.onOrderUpdate) {
      const ordersUnsubscribe = realtimeService.subscribeToCollection(
        appwriteConfig.collections.orders,
        (response) => {
          const order = response.payload;
          
          // Check if order is for this customer
          if (order.customerId !== customerId) return;

          if (response.events.includes('databases.*.collections.*.documents.*.update')) {
            callbacks.onOrderUpdate?.(order);
          }
        }
      );
      unsubscribers.push(ordersUnsubscribe);
    }

    // Subscribe to car listings
    if (callbacks.onCarListingUpdate) {
      const carListingsUnsubscribe = realtimeService.subscribeToCollection(
        appwriteConfig.collections.carListings,
        (response) => {
          const listing = response.payload;
          
          // Check if listing belongs to this customer
          if (listing.userId !== customerId) return;

          if (response.events.includes('databases.*.collections.*.documents.*.update')) {
            callbacks.onCarListingUpdate?.(listing);
          }
        }
      );
      unsubscribers.push(carListingsUnsubscribe);
    }

    // Subscribe to notifications
    if (callbacks.onNotification) {
      const notificationsUnsubscribe = realtimeService.subscribeToCollection(
        appwriteConfig.collections.notifications,
        (response) => {
          const notification = response.payload;
          
          // Check if notification is for this customer
          if (notification.userId !== customerId) return;

          if (response.events.includes('databases.*.collections.*.documents.*.create')) {
            callbacks.onNotification?.(notification);
          }
        }
      );
      unsubscribers.push(notificationsUnsubscribe);
    }

    console.log('✅ Real-time subscriptions active');

    // Return cleanup function
    return () => {
      console.log('🔴 Cleaning up customer subscriptions...');
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }

  /**
   * 🔍 SEARCH PRODUCTS
   */
  static async searchProducts(searchTerm: string) {
    try {
      return await ProductService.searchProducts(searchTerm);
    } catch (error: any) {
      console.error('❌ Failed to search products:', error);
      throw error;
    }
  }

  /**
   * 📋 GET PRODUCTS BY CATEGORY
   */
  static async getProductsByCategory(category: string) {
    try {
      return await ProductService.listProducts({ category, status: 'active' });
    } catch (error: any) {
      console.error('❌ Failed to get products by category:', error);
      throw error;
    }
  }

  /**
   * ⭐ GET FEATURED PRODUCTS
   */
  static async getFeaturedProducts() {
    try {
      return await ProductService.getFeaturedProducts();
    } catch (error: any) {
      console.error('❌ Failed to get featured products:', error);
      throw error;
    }
  }

  /**
   * 👀 GET PRODUCT DETAILS
   */
  static async getProductDetails(productId: string) {
    try {
      const product: any = await ProductService.getProduct(productId);
      
      // Increment view count
      await ProductService.incrementViews(productId, product.views || 0);
      
      return product;
    } catch (error: any) {
      console.error('❌ Failed to get product details:', error);
      throw error;
    }
  }

  /**
   * 📋 GET ALL ACTIVE PRODUCTS
   */
  static async getAllProducts(limit: number = 25) {
    try {
      return await ProductService.listProducts({ status: 'active', limit });
    } catch (error: any) {
      console.error('❌ Failed to get products:', error);
      throw error;
    }
  }
}

export default AppwriteCustomerService;

