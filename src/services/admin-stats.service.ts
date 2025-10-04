/**
 * Admin Statistics Service
 * Fetches REAL platform-wide data from Supabase
 * NO MOCK DATA - Production Ready
 */

import { supabase } from '@/config/supabase.config';

export interface AdminStats {
  totalUsers: number;
  totalVendors: number;
  totalProducts: number;
  totalOrders: number;
  pendingVendorApplications: number;
  pendingCarListings: number;
  monthlyRevenue: number;
}

export class AdminStatsService {
  /**
   * Get real platform statistics from database
   */
  static async getPlatformStats(): Promise<AdminStats> {
    try {
      console.log('[AdminStats] Fetching real platform data...');

      // Get REAL total users count
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get REAL total vendors count
      const { count: vendorsCount } = await supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true })
        .eq('verified', true);

      // Get REAL total products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Get REAL total orders count
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Get REAL pending vendor applications
      const { count: pendingVendorsCount } = await supabase
        .from('vendor_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get REAL pending car listings
      const { count: pendingCarsCount } = await supabase
        .from('car_listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Calculate REAL monthly revenue (current month)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthlyOrders } = await supabase
        .from('orders')
        .select('total')
        .eq('status', 'delivered')
        .gte('created_at', startOfMonth.toISOString());

      const monthlyRevenue = monthlyOrders?.reduce((sum, order) => 
        sum + (order.total || 0), 0
      ) || 0;

      const stats = {
        totalUsers: usersCount || 0,
        totalVendors: vendorsCount || 0,
        totalProducts: productsCount || 0,
        totalOrders: ordersCount || 0,
        pendingVendorApplications: pendingVendorsCount || 0,
        pendingCarListings: pendingCarsCount || 0,
        monthlyRevenue
      };

      console.log('[AdminStats] Real stats loaded:', stats);
      return stats;

    } catch (error) {
      console.error('[AdminStats] Error fetching stats:', error);
      // Return zeros on error (not mock data)
      return {
        totalUsers: 0,
        totalVendors: 0,
        totalProducts: 0,
        totalOrders: 0,
        pendingVendorApplications: 0,
        pendingCarListings: 0,
        monthlyRevenue: 0
      };
    }
  }
}
