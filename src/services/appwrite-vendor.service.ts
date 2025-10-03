/**
 * 🏪 VENDOR SERVICE WITH REAL-TIME
 * Complete vendor management with real-time updates
 */

import {
  VendorApplicationService,
  ProductService,
  OrderService,
  NotificationService,
  UserProfileService,
} from './appwrite-database.service';
import { realtimeService } from './appwrite-realtime.service';
import { appwriteConfig } from '@/config/appwrite.config';

export interface VendorApplication {
  $id: string;
  userId: string;
  businessName: string;
  businessLicense?: string;
  phoneNumber: string;
  address: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewNotes?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorDashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  recentOrders: any[];
}

/**
 * Vendor Service Class
 */
export class AppwriteVendorService {
  /**
   * 📝 SUBMIT VENDOR APPLICATION
   */
  static async submitApplication(userId: string, applicationData: {
    businessName: string;
    businessLicense?: string;
    phoneNumber: string;
    address: string;
  }): Promise<VendorApplication> {
    try {
      console.log('📝 Submitting vendor application...');

      // Check if user already has an application
      const existing = await VendorApplicationService.getApplicationByUser(userId);
      if (existing) {
        throw new Error('You already have a pending vendor application');
      }

      const application = await VendorApplicationService.submitApplication(
        userId,
        applicationData
      );

      // Send notification to admin
      await NotificationService.createNotification('admin', {
        title: 'New Vendor Application',
        message: `New vendor application from ${applicationData.businessName}`,
        type: 'info',
        actionUrl: '/admin/vendor-applications',
      });

      console.log('✅ Vendor application submitted');
      return application as VendorApplication;
    } catch (error: any) {
      console.error('❌ Failed to submit vendor application:', error);
      throw error;
    }
  }

  /**
   * 👀 GET MY APPLICATION
   */
  static async getMyApplication(userId: string): Promise<VendorApplication | null> {
    try {
      const application = await VendorApplicationService.getApplicationByUser(userId);
      return application as VendorApplication | null;
    } catch (error: any) {
      console.error('❌ Failed to get application:', error);
      return null;
    }
  }

  /**
   * ✅ APPROVE APPLICATION (Admin only)
   */
  static async approveApplication(
    applicationId: string,
    adminId: string,
    notes?: string
  ): Promise<void> {
    try {
      console.log('✅ Approving vendor application...');

      const application = await VendorApplicationService.getDocument(
        VendorApplicationService.collectionId,
        applicationId
      ) as VendorApplication;

      // Update application status
      await VendorApplicationService.approveApplication(
        applicationId,
        adminId,
        notes
      );

      // Update user role to vendor
      await UserProfileService.updateUserProfile(application.userId, {
        role: 'vendor',
      });

      // Send notification to user
      await NotificationService.createNotification(application.userId, {
        title: '🎉 تهانينا! تم قبول طلبك',
        message: 'تم قبول طلبك كتاجر. يمكنك الآن البدء في إضافة منتجاتك!',
        type: 'success',
        actionUrl: '/vendor/dashboard',
      });

      console.log('✅ Vendor application approved');
    } catch (error: any) {
      console.error('❌ Failed to approve application:', error);
      throw error;
    }
  }

  /**
   * ❌ REJECT APPLICATION (Admin only)
   */
  static async rejectApplication(
    applicationId: string,
    adminId: string,
    notes: string
  ): Promise<void> {
    try {
      console.log('❌ Rejecting vendor application...');

      const application = await VendorApplicationService.getDocument(
        VendorApplicationService.collectionId,
        applicationId
      ) as VendorApplication;

      // Update application status
      await VendorApplicationService.rejectApplication(
        applicationId,
        adminId,
        notes
      );

      // Send notification to user
      await NotificationService.createNotification(application.userId, {
        title: 'طلب التاجر مرفوض',
        message: `تم رفض طلبك كتاجر. السبب: ${notes}`,
        type: 'error',
        actionUrl: '/vendor/apply',
      });

      console.log('✅ Vendor application rejected');
    } catch (error: any) {
      console.error('❌ Failed to reject application:', error);
      throw error;
    }
  }

  /**
   * 📊 GET VENDOR DASHBOARD STATS
   */
  static async getDashboardStats(vendorId: string): Promise<VendorDashboardStats> {
    try {
      console.log('📊 Loading vendor dashboard stats...');

      // Get products
      const products = await ProductService.listProducts({ vendorId });
      const activeProducts = products.documents.filter(
        (p: any) => p.status === 'active'
      );

      // Get orders
      const orders = await OrderService.listOrdersByVendor(vendorId);
      const pendingOrders = orders.documents.filter(
        (o: any) => o.status === 'pending'
      );

      // Calculate total revenue
      const totalRevenue = orders.documents.reduce(
        (sum: number, order: any) => sum + (order.totalAmount || 0),
        0
      );

      // Get recent orders
      const recentOrders = orders.documents.slice(0, 10);

      console.log('✅ Dashboard stats loaded');

      return {
        totalProducts: products.total,
        activeProducts: activeProducts.length,
        totalOrders: orders.total,
        pendingOrders: pendingOrders.length,
        totalRevenue,
        recentOrders,
      };
    } catch (error: any) {
      console.error('❌ Failed to load dashboard stats:', error);
      throw error;
    }
  }

  /**
   * 🔔 SUBSCRIBE TO VENDOR UPDATES (Real-time)
   */
  static subscribeToVendorUpdates(
    vendorId: string,
    callbacks: {
      onNewOrder?: (order: any) => void;
      onOrderUpdate?: (order: any) => void;
      onProductUpdate?: (product: any) => void;
      onNotification?: (notification: any) => void;
    }
  ): () => void {
    console.log('🔔 Setting up real-time vendor subscriptions...');

    const unsubscribers: Array<() => void> = [];

    // Subscribe to orders
    if (callbacks.onNewOrder || callbacks.onOrderUpdate) {
      const ordersUnsubscribe = realtimeService.subscribeToCollection(
        appwriteConfig.collections.orders,
        (response) => {
          const order = response.payload;
          
          // Check if order is for this vendor
          if (order.vendorId !== vendorId) return;

          if (response.events.includes('databases.*.collections.*.documents.*.create')) {
            callbacks.onNewOrder?.(order);
          } else if (response.events.includes('databases.*.collections.*.documents.*.update')) {
            callbacks.onOrderUpdate?.(order);
          }
        }
      );
      unsubscribers.push(ordersUnsubscribe);
    }

    // Subscribe to products
    if (callbacks.onProductUpdate) {
      const productsUnsubscribe = realtimeService.subscribeToCollection(
        appwriteConfig.collections.products,
        (response) => {
          const product = response.payload;
          
          // Check if product belongs to this vendor
          if (product.vendorId !== vendorId) return;

          callbacks.onProductUpdate?.(product);
        }
      );
      unsubscribers.push(productsUnsubscribe);
    }

    // Subscribe to notifications
    if (callbacks.onNotification) {
      const notificationsUnsubscribe = realtimeService.subscribeToCollection(
        appwriteConfig.collections.notifications,
        (response) => {
          const notification = response.payload;
          
          // Check if notification is for this vendor
          if (notification.userId !== vendorId) return;

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
      console.log('🔴 Cleaning up vendor subscriptions...');
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }

  /**
   * 🚗 ADD PRODUCT
   */
  static async addProduct(vendorId: string, productData: any) {
    try {
      console.log('🚗 Adding new product...');

      const product = await ProductService.createProduct(vendorId, productData);

      console.log('✅ Product added successfully');
      return product;
    } catch (error: any) {
      console.error('❌ Failed to add product:', error);
      throw error;
    }
  }

  /**
   * 📝 UPDATE PRODUCT
   */
  static async updateProduct(productId: string, productData: any) {
    try {
      console.log('📝 Updating product...');

      const product = await ProductService.updateProduct(productId, productData);

      console.log('✅ Product updated successfully');
      return product;
    } catch (error: any) {
      console.error('❌ Failed to update product:', error);
      throw error;
    }
  }

  /**
   * 🗑️ DELETE PRODUCT
   */
  static async deleteProduct(productId: string) {
    try {
      console.log('🗑️ Deleting product...');

      await ProductService.deleteProduct(productId);

      console.log('✅ Product deleted successfully');
    } catch (error: any) {
      console.error('❌ Failed to delete product:', error);
      throw error;
    }
  }

  /**
   * 📋 GET MY PRODUCTS
   */
  static async getMyProducts(vendorId: string) {
    try {
      return await ProductService.listProducts({ vendorId });
    } catch (error: any) {
      console.error('❌ Failed to get products:', error);
      throw error;
    }
  }

  /**
   * 📦 GET MY ORDERS
   */
  static async getMyOrders(vendorId: string) {
    try {
      return await OrderService.listOrdersByVendor(vendorId);
    } catch (error: any) {
      console.error('❌ Failed to get orders:', error);
      throw error;
    }
  }

  /**
   * 🔄 UPDATE ORDER STATUS
   */
  static async updateOrderStatus(
    orderId: string,
    status: string,
    customerId: string
  ) {
    try {
      console.log(`🔄 Updating order status to ${status}...`);

      await OrderService.updateOrderStatus(orderId, status);

      // Send notification to customer
      const statusMessages: Record<string, string> = {
        confirmed: 'تم تأكيد طلبك',
        shipped: 'تم شحن طلبك',
        delivered: 'تم توصيل طلبك',
        cancelled: 'تم إلغاء طلبك',
      };

      await NotificationService.createNotification(customerId, {
        title: 'تحديث الطلب',
        message: statusMessages[status] || 'تم تحديث حالة طلبك',
        type: status === 'cancelled' ? 'warning' : 'success',
        actionUrl: `/customer/orders/${orderId}`,
      });

      console.log('✅ Order status updated');
    } catch (error: any) {
      console.error('❌ Failed to update order status:', error);
      throw error;
    }
  }
}

export default AppwriteVendorService;

