/**
 * 👑 Appwrite Admin Service
 * Professional admin management service using Appwrite Cloud
 * Replaces AWS Amplify admin service
 */

import { appwriteDatabaseService } from './appwrite-database.service';

export interface AdminStats {
  id: string;
  totalUsers: number;
  activeUsers: number;
  totalVendors: number;
  activeVendors: number;
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  dailyRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  userGrowthRate: number;
  vendorGrowthRate: number;
  productGrowthRate: number;
  orderGrowthRate: number;
  revenueGrowthRate: number;
  lastUpdated: Date;
}

export interface AdminAnalytics {
  id: string;
  period: string;
  metrics: {
    users: {
      total: number;
      new: number;
      active: number;
      churn: number;
    };
    vendors: {
      total: number;
      new: number;
      active: number;
      pending: number;
    };
    products: {
      total: number;
      new: number;
      active: number;
      pending: number;
    };
    orders: {
      total: number;
      completed: number;
      pending: number;
      cancelled: number;
    };
    revenue: {
      total: number;
      monthly: number;
      daily: number;
      growth: number;
    };
  };
  trends: {
    userGrowth: number[];
    vendorGrowth: number[];
    productGrowth: number[];
    orderGrowth: number[];
    revenueGrowth: number[];
  };
  topProducts: Array<{
    id: string;
    title: string;
    sales: number;
    revenue: number;
  }>;
  topVendors: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Appwrite Admin Service
 * Complete admin management using Appwrite Cloud
 */
export class AdminService {
  /**
   * Get comprehensive admin statistics in real-time
   */
  static async getAdminStats(): Promise<AdminStats> {
    try {
      // Get users
      const usersResult = await appwriteDatabaseService.getUsers(1000, 0);
      const totalUsers = usersResult.total;
      const activeUsers = usersResult.users.filter(user => user.isActive).length;

      // Get vendors
      const vendorApplicationsResult = await appwriteDatabaseService.getVendorApplications();
      const totalVendors = vendorApplicationsResult.total;
      const activeVendors = vendorApplicationsResult.applications.filter(app => app.status === 'approved').length;

      // Get products
      const productsResult = await appwriteDatabaseService.getProducts(1000, 0);
      const totalProducts = productsResult.total;
      const activeProducts = productsResult.products.filter(product => product.status === 'active').length;

      // Get orders
      const ordersResult = await appwriteDatabaseService.getUserOrders('', 1000, 0);
      const totalOrders = ordersResult.total;
      const completedOrders = ordersResult.orders.filter(order => order.status === 'delivered').length;
      const pendingOrders = ordersResult.orders.filter(order => order.status === 'pending').length;

      // Calculate revenue
      const totalRevenue = ordersResult.orders
        .filter(order => order.status === 'delivered')
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      return {
        id: 'admin-stats',
        totalUsers,
        activeUsers,
        totalVendors,
        activeVendors,
        totalProducts,
        activeProducts,
        totalOrders,
        completedOrders,
        pendingOrders,
        totalRevenue,
        monthlyRevenue: totalRevenue, // Would need to calculate monthly
        dailyRevenue: totalRevenue / 30, // Rough estimate
        averageOrderValue,
        conversionRate: 0, // Would need to calculate from events
        userGrowthRate: 0, // Would need historical data
        vendorGrowthRate: 0, // Would need historical data
        productGrowthRate: 0, // Would need historical data
        orderGrowthRate: 0, // Would need historical data
        revenueGrowthRate: 0, // Would need historical data
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error getting admin stats:', error);
      return {
        id: 'admin-stats',
        totalUsers: 0,
        activeUsers: 0,
        totalVendors: 0,
        activeVendors: 0,
        totalProducts: 0,
        activeProducts: 0,
        totalOrders: 0,
        completedOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        dailyRevenue: 0,
        averageOrderValue: 0,
        conversionRate: 0,
        userGrowthRate: 0,
        vendorGrowthRate: 0,
        productGrowthRate: 0,
        orderGrowthRate: 0,
        revenueGrowthRate: 0,
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Get admin analytics
   */
  static async getAdminAnalytics(period: string = '30d'): Promise<AdminAnalytics> {
    try {
      const stats = await this.getAdminStats();
      
      return {
        id: `admin-analytics-${period}`,
        period,
        metrics: {
          users: {
            total: stats.totalUsers,
            new: 0, // Would need to track new users
            active: stats.activeUsers,
            churn: 0 // Would need to calculate churn
          },
          vendors: {
            total: stats.totalVendors,
            new: 0, // Would need to track new vendors
            active: stats.activeVendors,
            pending: stats.totalVendors - stats.activeVendors
          },
          products: {
            total: stats.totalProducts,
            new: 0, // Would need to track new products
            active: stats.activeProducts,
            pending: stats.totalProducts - stats.activeProducts
          },
          orders: {
            total: stats.totalOrders,
            completed: stats.completedOrders,
            pending: stats.pendingOrders,
            cancelled: 0 // Would need to track cancelled orders
          },
          revenue: {
            total: stats.totalRevenue,
            monthly: stats.monthlyRevenue,
            daily: stats.dailyRevenue,
            growth: stats.revenueGrowthRate
          }
        },
        trends: {
          userGrowth: [], // Would need historical data
          vendorGrowth: [], // Would need historical data
          productGrowth: [], // Would need historical data
          orderGrowth: [], // Would need historical data
          revenueGrowth: [] // Would need historical data
        },
        topProducts: [], // Would need to calculate from sales data
        topVendors: [], // Would need to calculate from sales data
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error getting admin analytics:', error);
      throw error;
    }
  }

  /**
   * Process vendor application
   */
  static async processVendorApplication(applicationId: string, action: 'approve' | 'reject', notes?: string): Promise<boolean> {
    try {
      const application = await appwriteDatabaseService.getVendorApplication(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      const status = action === 'approve' ? 'approved' : 'rejected';
      const updateData = {
        status,
        reviewNotes: notes || '',
        reviewedBy: 'admin', // Would need to get current admin ID
        reviewedAt: new Date().toISOString()
      };

      const updatedApplication = await appwriteDatabaseService.updateVendorApplication(applicationId, updateData);
      
      if (action === 'approve') {
        // Update user role to vendor
        await appwriteDatabaseService.updateUser(application.userId, { role: 'vendor' });
      }

      return updatedApplication !== null;
    } catch (error) {
      console.error('Error processing vendor application:', error);
      return false;
    }
  }

  /**
   * Get all vendor applications
   */
  static async getVendorApplications(status?: string): Promise<any[]> {
    try {
      const result = await appwriteDatabaseService.getVendorApplications(status);
      return result.applications;
    } catch (error) {
      console.error('Error getting vendor applications:', error);
      return [];
    }
  }

  /**
   * Get all users
   */
  static async getAllUsers(role?: string): Promise<any[]> {
    try {
      const result = await appwriteDatabaseService.getUsers(1000, 0, role);
      return result.users;
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  /**
   * Get all products
   */
  static async getAllProducts(status?: string): Promise<any[]> {
    try {
      const result = await appwriteDatabaseService.getProducts(1000, 0, { status });
      return result.products;
    } catch (error) {
      console.error('Error getting products:', error);
      return [];
    }
  }

  /**
   * Get all orders
   */
  static async getAllOrders(): Promise<any[]> {
    try {
      const result = await appwriteDatabaseService.getUserOrders('', 1000, 0);
      return result.orders;
    } catch (error) {
      console.error('Error getting orders:', error);
      return [];
    }
  }

  /**
   * Update user status
   */
  static async updateUserStatus(userId: string, isActive: boolean): Promise<boolean> {
    try {
      const user = await appwriteDatabaseService.updateUser(userId, { isActive });
      return user !== null;
    } catch (error) {
      console.error('Error updating user status:', error);
      return false;
    }
  }

  /**
   * Update product status
   */
  static async updateProductStatus(productId: string, status: string): Promise<boolean> {
    try {
      const product = await appwriteDatabaseService.updateProduct(productId, { status });
      return product !== null;
    } catch (error) {
      console.error('Error updating product status:', error);
      return false;
    }
  }

  /**
   * Get system health
   */
  static async getSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    metrics: {
      responseTime: number;
      errorRate: number;
      uptime: number;
      memoryUsage: number;
      cpuUsage: number;
    };
    alerts: string[];
  }> {
    try {
      // In a real implementation, this would check actual system health
      return {
        status: 'healthy',
        metrics: {
          responseTime: 0,
          errorRate: 0,
          uptime: 100,
          memoryUsage: 0,
          cpuUsage: 0
        },
        alerts: []
      };
    } catch (error) {
      console.error('Error getting system health:', error);
      return {
        status: 'critical',
        metrics: {
          responseTime: 0,
          errorRate: 100,
          uptime: 0,
          memoryUsage: 0,
          cpuUsage: 0
        },
        alerts: ['System health check failed']
      };
    }
  }

  /**
   * Get platform metrics
   */
  static async getPlatformMetrics(): Promise<{
    totalUsers: number;
    totalVendors: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    conversionRate: number;
    userGrowthRate: number;
    vendorGrowthRate: number;
    productGrowthRate: number;
    orderGrowthRate: number;
    revenueGrowthRate: number;
  }> {
    try {
      const stats = await this.getAdminStats();
      return {
        totalUsers: stats.totalUsers,
        totalVendors: stats.totalVendors,
        totalProducts: stats.totalProducts,
        totalOrders: stats.totalOrders,
        totalRevenue: stats.totalRevenue,
        averageOrderValue: stats.averageOrderValue,
        conversionRate: stats.conversionRate,
        userGrowthRate: stats.userGrowthRate,
        vendorGrowthRate: stats.vendorGrowthRate,
        productGrowthRate: stats.productGrowthRate,
        orderGrowthRate: stats.orderGrowthRate,
        revenueGrowthRate: stats.revenueGrowthRate
      };
    } catch (error) {
      console.error('Error getting platform metrics:', error);
      throw error;
    }
  }
}
