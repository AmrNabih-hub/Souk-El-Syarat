/**
 * Vendor Statistics Service
 * Fetches REAL vendor data from Supabase
 * NO MOCK DATA - Production Ready
 */

import { supabase } from '@/config/supabase.config';

export interface VendorStats {
  totalProducts: number;
  totalSales: number;
  revenue: number;
  pendingOrders: number;
}

export class VendorStatsService {
  /**
   * Get real vendor statistics from database
   */
  static async getVendorStats(vendorId: string): Promise<VendorStats> {
    try {
      console.log('[VendorStats] Fetching real data for vendor:', vendorId);

      // Get REAL total products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', vendorId);

      // Get REAL order items for this vendor's products
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          quantity,
          price,
          product_id,
          products!inner(vendor_id),
          orders!inner(status)
        `)
        .eq('products.vendor_id', vendorId);

      // Calculate REAL total sales (quantity)
      const totalSales = orderItems?.reduce((sum, item) => 
        sum + (item.quantity || 0), 0
      ) || 0;

      // Calculate REAL revenue (only delivered orders)
      const revenue = orderItems
        ?.filter(item => item.orders?.status === 'delivered')
        ?.reduce((sum, item) => 
          sum + ((item.price || 0) * (item.quantity || 0)), 0
        ) || 0;

      // Count REAL pending orders
      const pendingOrders = orderItems
        ?.filter(item => 
          ['pending', 'processing'].includes(item.orders?.status || '')
        )
        ?.length || 0;

      const stats = {
        totalProducts: productsCount || 0,
        totalSales,
        revenue,
        pendingOrders
      };

      console.log('[VendorStats] Real stats loaded:', stats);
      return stats;

    } catch (error) {
      console.error('[VendorStats] Error fetching stats:', error);
      // Return zeros on error (not mock data)
      return {
        totalProducts: 0,
        totalSales: 0,
        revenue: 0,
        pendingOrders: 0
      };
    }
  }
}
