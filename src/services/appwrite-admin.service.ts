/**
 * 👨‍💼 ADMIN SERVICE WITH REAL-TIME DASHBOARD
 * Complete admin operations with real-time monitoring
 */

import {
  VendorApplicationService,
  CarListingService,
  ProductService,
  OrderService,
  UserProfileService,
  NotificationService,
} from './appwrite-database.service';
import { realtimeService } from './appwrite-realtime.service';
import { appwriteConfig } from '@/config/appwrite.config';

export interface AdminDashboardStats {
  totalUsers: number;
  totalCustomers: number;
  totalVendors: number;
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  pendingVendorApplications: number;
  pendingCarListings: number;
  totalRevenue: number;
  recentOrders: any[];
  recentVendorApplications: any[];
  recentCarListings: any[];
}

/**
 * Admin Service Class
 */
export class AppwriteAdminService {
  /**
   * 📊 GET COMPREHENSIVE DASHBOARD STATS
   */
  static async getDashboardStats(): Promise<AdminDashboardStats> {
    try {
      console.log('📊 Loading admin dashboard stats...');

      // Get all users
      const allUsers = await UserProfileService.listDocuments(
        UserProfileService.collectionId
      );
      const customers = allUsers.documents.filter((u: any) => u.role === 'customer');
      const vendors = allUsers.documents.filter((u: any) => u.role === 'vendor');

      // Get products
      const products = await ProductService.listDocuments(
        ProductService.collectionId
      );
      const activeProducts = products.documents.filter(
        (p: any) => p.status === 'active'
      );

      // Get orders
      const orders = await OrderService.listDocuments(
        OrderService.collectionId
      );
      const pendingOrders = orders.documents.filter(
        (o: any) => o.status === 'pending'
      );

      // Calculate total revenue
      const totalRevenue = orders.documents.reduce(
        (sum: number, order: any) => sum + (order.totalAmount || 0),
        0
      );

      // Get pending vendor applications
      const vendorApplications = await VendorApplicationService.listPendingApplications();

      // Get pending car listings
      const carListings = await CarListingService.listPendingCarListings();

      // Get recent data
      const recentOrders = orders.documents.slice(0, 10);
      const recentVendorApplications = vendorApplications.documents.slice(0, 10);
      const recentCarListings = carListings.documents.slice(0, 10);

      console.log('✅ Admin dashboard stats loaded');

      return {
        totalUsers: allUsers.total,
        totalCustomers: customers.length,
        totalVendors: vendors.length,
        totalProducts: products.total,
        activeProducts: activeProducts.length,
        totalOrders: orders.total,
        pendingOrders: pendingOrders.length,
        pendingVendorApplications: vendorApplications.total,
        pendingCarListings: carListings.total,
        totalRevenue,
        recentOrders,
        recentVendorApplications,
        recentCarListings,
      };
    } catch (error: any) {
      console.error('❌ Failed to load admin dashboard stats:', error);
      throw error;
    }
  }

  /**
   * 🔔 SUBSCRIBE TO ADMIN REAL-TIME UPDATES
   */
  static subscribeToAdminUpdates(callbacks: {
    onNewVendorApplication?: (application: any) => void;
    onNewCarListing?: (listing: any) => void;
    onNewOrder?: (order: any) => void;
    onNewUser?: (user: any) => void;
    onOrderUpdate?: (order: any) => void;
  }): () => void {
    console.log('🔔 Setting up real-time admin subscriptions...');

    const unsubscribers: Array<() => void> = [];

    // Subscribe to vendor applications
    if (callbacks.onNewVendorApplication) {
      const applicationsUnsubscribe = realtimeService.subscribeToCollection(
        appwriteConfig.collections.vendorApplications,
        (response) => {
          if (response.events.includes('databases.*.collections.*.documents.*.create')) {
            callbacks.onNewVendorApplication?.(response.payload);
          }
        }
      );
      unsubscribers.push(applicationsUnsubscribe);
    }

    // Subscribe to car listings
    if (callbacks.onNewCarListing) {
      const carListingsUnsubscribe = realtimeService.subscribeToCollection(
        appwriteConfig.collections.carListings,
        (response) => {
          if (response.events.includes('databases.*.collections.*.documents.*.create')) {
            callbacks.onNewCarListing?.(response.payload);
          }
        }
      );
      unsubscribers.push(carListingsUnsubscribe);
    }

    // Subscribe to orders
    if (callbacks.onNewOrder || callbacks.onOrderUpdate) {
      const ordersUnsubscribe = realtimeService.subscribeToCollection(
        appwriteConfig.collections.orders,
        (response) => {
          if (response.events.includes('databases.*.collections.*.documents.*.create')) {
            callbacks.onNewOrder?.(response.payload);
          } else if (response.events.includes('databases.*.collections.*.documents.*.update')) {
            callbacks.onOrderUpdate?.(response.payload);
          }
        }
      );
      unsubscribers.push(ordersUnsubscribe);
    }

    // Subscribe to users
    if (callbacks.onNewUser) {
      const usersUnsubscribe = realtimeService.subscribeToCollection(
        appwriteConfig.collections.users,
        (response) => {
          if (response.events.includes('databases.*.collections.*.documents.*.create')) {
            callbacks.onNewUser?.(response.payload);
          }
        }
      );
      unsubscribers.push(usersUnsubscribe);
    }

    console.log('✅ Real-time admin subscriptions active');

    // Return cleanup function
    return () => {
      console.log('🔴 Cleaning up admin subscriptions...');
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }

  /**
   * ✅ APPROVE VENDOR APPLICATION
   */
  static async approveVendorApplication(
    applicationId: string,
    adminId: string,
    notes?: string
  ) {
    try {
      console.log('✅ Approving vendor application...');

      const application: any = await VendorApplicationService.getDocument(
        VendorApplicationService.collectionId,
        applicationId
      );

      // Approve application
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

      console.log('✅ Vendor application approved with real-time notification');
    } catch (error: any) {
      console.error('❌ Failed to approve vendor application:', error);
      throw error;
    }
  }

  /**
   * ❌ REJECT VENDOR APPLICATION
   */
  static async rejectVendorApplication(
    applicationId: string,
    adminId: string,
    notes: string
  ) {
    try {
      console.log('❌ Rejecting vendor application...');

      const application: any = await VendorApplicationService.getDocument(
        VendorApplicationService.collectionId,
        applicationId
      );

      // Reject application
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

      console.log('✅ Vendor application rejected with real-time notification');
    } catch (error: any) {
      console.error('❌ Failed to reject vendor application:', error);
      throw error;
    }
  }

  /**
   * ✅ APPROVE CAR LISTING
   */
  static async approveCarListing(listingId: string) {
    try {
      console.log('✅ Approving car listing...');

      const listing: any = await CarListingService.getDocument(
        CarListingService.collectionId,
        listingId
      );

      // Approve listing
      await CarListingService.approveCarListing(listingId);

      // Send congratulations notification to customer
      await NotificationService.createNotification(listing.userId, {
        title: '🎉 تهانينا! سيارتك الآن في سوق السيارات!',
        message: `تم قبول طلب بيع سيارتك ${listing.brand} ${listing.model}. يمكن للعملاء الآن مشاهدتها!`,
        type: 'success',
        actionUrl: '/marketplace',
      });

      console.log('✅ Car listing approved with congratulations message');
    } catch (error: any) {
      console.error('❌ Failed to approve car listing:', error);
      throw error;
    }
  }

  /**
   * ❌ REJECT CAR LISTING
   */
  static async rejectCarListing(listingId: string, reason: string) {
    try {
      console.log('❌ Rejecting car listing...');

      const listing: any = await CarListingService.getDocument(
        CarListingService.collectionId,
        listingId
      );

      // Reject listing
      await CarListingService.rejectCarListing(listingId, reason);

      // Send notification to customer
      await NotificationService.createNotification(listing.userId, {
        title: 'طلب بيع السيارة مرفوض',
        message: `تم رفض طلب بيع سيارتك. السبب: ${reason}`,
        type: 'error',
        actionUrl: '/customer/sell-car',
      });

      console.log('✅ Car listing rejected');
    } catch (error: any) {
      console.error('❌ Failed to reject car listing:', error);
      throw error;
    }
  }

  /**
   * 📋 GET PENDING VENDOR APPLICATIONS
   */
  static async getPendingVendorApplications() {
    try {
      return await VendorApplicationService.listPendingApplications();
    } catch (error: any) {
      console.error('❌ Failed to get pending vendor applications:', error);
      throw error;
    }
  }

  /**
   * 📋 GET PENDING CAR LISTINGS
   */
  static async getPendingCarListings() {
    try {
      return await CarListingService.listPendingCarListings();
    } catch (error: any) {
      console.error('❌ Failed to get pending car listings:', error);
      throw error;
    }
  }

  /**
   * 👥 GET ALL USERS
   */
  static async getAllUsers() {
    try {
      return await UserProfileService.listDocuments(
        UserProfileService.collectionId
      );
    } catch (error: any) {
      console.error('❌ Failed to get all users:', error);
      throw error;
    }
  }

  /**
   * 👥 GET USERS BY ROLE
   */
  static async getUsersByRole(role: string) {
    try {
      return await UserProfileService.getUsersByRole(role);
    } catch (error: any) {
      console.error('❌ Failed to get users by role:', error);
      throw error;
    }
  }

  /**
   * 🚗 GET ALL PRODUCTS
   */
  static async getAllProducts() {
    try {
      return await ProductService.listDocuments(
        ProductService.collectionId
      );
    } catch (error: any) {
      console.error('❌ Failed to get all products:', error);
      throw error;
    }
  }

  /**
   * 📦 GET ALL ORDERS
   */
  static async getAllOrders() {
    try {
      return await OrderService.listDocuments(
        OrderService.collectionId
      );
    } catch (error: any) {
      console.error('❌ Failed to get all orders:', error);
      throw error;
    }
  }

  /**
   * 🗑️ DELETE PRODUCT (Admin override)
   */
  static async deleteProduct(productId: string) {
    try {
      return await ProductService.deleteProduct(productId);
    } catch (error: any) {
      console.error('❌ Failed to delete product:', error);
      throw error;
    }
  }

  /**
   * 🔄 UPDATE USER STATUS
   */
  static async updateUserStatus(userId: string, isActive: boolean) {
    try {
      return await UserProfileService.updateUserProfile(userId, {
        isActive,
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('❌ Failed to update user status:', error);
      throw error;
    }
  }
}

export default AppwriteAdminService;

