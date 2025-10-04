/**
 * Customer Statistics Service
 * Fetches REAL customer data from Supabase
 * NO MOCK DATA - Production Ready
 */

import { supabase } from '@/config/supabase.config';

export interface CustomerStats {
  activeOrders: number;
  favorites: number;
  points: number;
  completedOrders: number;
}

export class CustomerStatsService {
  /**
   * Get real customer statistics from database
   */
  static async getCustomerStats(userId: string): Promise<CustomerStats> {
    try {
      console.log('[CustomerStats] Fetching real data for user:', userId);

      // Get REAL active orders count
      const { count: activeOrdersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', ['pending', 'processing', 'shipped']);

      // Get REAL favorites count
      const { count: favoritesCount } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get REAL completed orders for points calculation
      const { data: completedOrders } = await supabase
        .from('orders')
        .select('total, status')
        .eq('user_id', userId)
        .eq('status', 'delivered');

      // Calculate REAL loyalty points (1% of total spent)
      const points = completedOrders?.reduce((sum, order) => 
        sum + Math.floor(order.total * 0.01), 0
      ) || 0;

      const stats = {
        activeOrders: activeOrdersCount || 0,
        favorites: favoritesCount || 0,
        points,
        completedOrders: completedOrders?.length || 0
      };

      console.log('[CustomerStats] Real stats loaded:', stats);
      return stats;

    } catch (error) {
      console.error('[CustomerStats] Error fetching stats:', error);
      // Return zeros on error (not mock data)
      return {
        activeOrders: 0,
        favorites: 0,
        points: 0,
        completedOrders: 0
      };
    }
  }
}
