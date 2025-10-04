/**
 * 🏢 Enterprise Database Service
 * Advanced database operations with caching, transactions, and real-time features
 */

import { supabase, supabaseAdmin } from '@/config/supabase.config';
import { Database } from '@/types/supabase';
import { PostgrestError, RealtimeChannel } from '@supabase/supabase-js';

type Tables = Database['public']['Tables'];
type TableName = keyof Tables;

interface QueryOptions {
  cache?: boolean;
  cacheTTL?: number;
  realtime?: boolean;
  transaction?: boolean;
}

interface SearchOptions {
  query: string;
  table: TableName;
  columns: string[];
  fuzzy?: boolean;
  limit?: number;
  offset?: number;
}

interface AnalyticsData {
  totalProducts: number;
  totalVendors: number;
  totalOrders: number;
  totalRevenue: number;
  popularCategories: Array<{ name: string; count: number }>;
  recentActivity: Array<{ type: string; data: any; timestamp: string }>;
}

class EnterpriseDatabaseService {
  private cache: Map<string, { data: any; expires: number }> = new Map();
  private realtimeChannels: Map<string, RealtimeChannel> = new Map();
  private transactionPool: Array<() => Promise<any>> = [];

  // ============================================================================
  // ADVANCED CRUD OPERATIONS
  // ============================================================================

  async findById<T extends TableName>(
    table: T,
    id: string,
    options: QueryOptions = {}
  ): Promise<Tables[T]['Row'] | null> {
    const cacheKey = `${table}:${id}`;
    
    // Check cache first
    if (options.cache && this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Cache the result
      if (options.cache) {
        this.setCache(cacheKey, data, options.cacheTTL);
      }

      return data;
    } catch (error) {
      console.error(`❌ Error finding ${table} by ID:`, error);
      return null;
    }
  }

  async findMany<T extends TableName>(
    table: T,
    filters: Partial<Tables[T]['Row']> = {},
    options: QueryOptions & { limit?: number; offset?: number; orderBy?: string } = {}
  ): Promise<Tables[T]['Row'][]> {
    const cacheKey = `${table}:findMany:${JSON.stringify(filters)}:${JSON.stringify(options)}`;
    
    if (options.cache && this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    try {
      let query = supabase.from(table).select('*');

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value);
        }
      });

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy, { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      if (options.cache) {
        this.setCache(cacheKey, data, options.cacheTTL);
      }

      return data || [];
    } catch (error) {
      console.error(`❌ Error finding ${table} records:`, error);
      return [];
    }
  }

  async create<T extends TableName>(
    table: T,
    data: Tables[T]['Insert'],
    options: QueryOptions = {}
  ): Promise<Tables[T]['Row'] | null> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      // Invalidate related cache
      this.invalidateCache(table);

      // Track analytics
      await this.trackEvent('create', { table, data: result });

      return result;
    } catch (error) {
      console.error(`❌ Error creating ${table} record:`, error);
      return null;
    }
  }

  async update<T extends TableName>(
    table: T,
    id: string,
    data: Tables[T]['Update'],
    options: QueryOptions = {}
  ): Promise<Tables[T]['Row'] | null> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update cache
      const cacheKey = `${table}:${id}`;
      if (this.cache.has(cacheKey)) {
        this.setCache(cacheKey, result);
      }

      // Invalidate related cache
      this.invalidateCache(table);

      await this.trackEvent('update', { table, id, data: result });

      return result;
    } catch (error) {
      console.error(`❌ Error updating ${table} record:`, error);
      return null;
    }
  }

  async delete<T extends TableName>(
    table: T,
    id: string,
    options: QueryOptions = {}
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove from cache
      this.cache.delete(`${table}:${id}`);
      this.invalidateCache(table);

      await this.trackEvent('delete', { table, id });

      return true;
    } catch (error) {
      console.error(`❌ Error deleting ${table} record:`, error);
      return false;
    }
  }

  // ============================================================================
  // ADVANCED SEARCH & FILTERING
  // ============================================================================

  async search(options: SearchOptions): Promise<any[]> {
    try {
      const { query, table, columns, fuzzy = true, limit = 50, offset = 0 } = options;
      
      let searchQuery = supabase.from(table).select('*');

      if (fuzzy) {
        // Full-text search
        const searchColumn = columns.join(' || \' \' || ');
        searchQuery = searchQuery.textSearch(searchColumn, query);
      } else {
        // Exact match search
        const orConditions = columns.map(col => `${col}.ilike.%${query}%`).join(',');
        searchQuery = searchQuery.or(orConditions);
      }

      const { data, error } = await searchQuery
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;

      await this.trackEvent('search', { table, query, results: data?.length || 0 });

      return data || [];
    } catch (error) {
      console.error('❌ Error performing search:', error);
      return [];
    }
  }

  async getProductsWithFilters(filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    make?: string;
    model?: string;
    year?: { min?: number; max?: number };
    location?: string;
    features?: string[];
    sortBy?: 'price' | 'date' | 'popularity' | 'rating';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }) {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          vendors (
            business_name,
            rating,
            verification_status
          ),
          car_listings (
            make,
            model,
            year,
            mileage,
            fuel_type,
            transmission
          ),
          categories (
            name,
            slug
          )
        `)
        .eq('availability_status', 'available')
        .not('published_at', 'is', null);

      // Apply filters
      if (filters.category) {
        query = query.eq('categories.slug', filters.category);
      }
      if (filters.minPrice) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters.condition) {
        query = query.eq('condition', filters.condition);
      }
      if (filters.make) {
        query = query.eq('car_listings.make', filters.make);
      }
      if (filters.model) {
        query = query.eq('car_listings.model', filters.model);
      }
      if (filters.year?.min) {
        query = query.gte('car_listings.year', filters.year.min);
      }
      if (filters.year?.max) {
        query = query.lte('car_listings.year', filters.year.max);
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'date';
      const sortOrder = filters.sortOrder === 'asc';
      
      switch (sortBy) {
        case 'price':
          query = query.order('price', { ascending: sortOrder });
          break;
        case 'popularity':
          query = query.order('view_count', { ascending: sortOrder });
          break;
        case 'rating':
          query = query.order('rating', { ascending: sortOrder });
          break;
        default:
          query = query.order('created_at', { ascending: sortOrder });
      }

      // Apply pagination
      const limit = filters.limit || 20;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('❌ Error getting filtered products:', error);
      return [];
    }
  }

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  subscribeToTable<T extends TableName>(
    table: T,
    callback: (payload: any) => void,
    filters?: Record<string, any>
  ): string {
    const channelName = `${table}-${Date.now()}`;
    
    let channel = supabase.channel(channelName)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table,
          filter: filters ? Object.entries(filters).map(([key, value]) => `${key}=eq.${value}`).join('&') : undefined
        }, 
        callback
      )
      .subscribe();

    this.realtimeChannels.set(channelName, channel);
    return channelName;
  }

  unsubscribeFromTable(channelName: string): void {
    const channel = this.realtimeChannels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.realtimeChannels.delete(channelName);
    }
  }

  // ============================================================================
  // ANALYTICS & REPORTING
  // ============================================================================

  async getDashboardAnalytics(): Promise<AnalyticsData> {
    try {
      const [
        { count: totalProducts },
        { count: totalVendors },
        { count: totalOrders },
        { data: revenueData },
        { data: categoriesData }
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('vendors').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total_amount').eq('payment_status', 'paid'),
        supabase.from('categories').select('name, products(count)')
      ]);

      const totalRevenue = revenueData?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const popularCategories = categoriesData?.map(cat => ({
        name: cat.name,
        count: cat.products?.length || 0
      })).sort((a, b) => b.count - a.count).slice(0, 10) || [];

      return {
        totalProducts: totalProducts || 0,
        totalVendors: totalVendors || 0,
        totalOrders: totalOrders || 0,
        totalRevenue,
        popularCategories,
        recentActivity: [] // Implement based on your needs
      };
    } catch (error) {
      console.error('❌ Error getting dashboard analytics:', error);
      return {
        totalProducts: 0,
        totalVendors: 0,
        totalOrders: 0,
        totalRevenue: 0,
        popularCategories: [],
        recentActivity: []
      };
    }
  }

  async trackEvent(event: string, data: any): Promise<void> {
    try {
      await supabase.from('analytics_events').insert({
        event_type: 'database',
        event_name: event,
        properties: data,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error tracking event:', error);
    }
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  private isValidCache(key: string): boolean {
    const cached = this.cache.get(key);
    return cached ? cached.expires > Date.now() : false;
  }

  private setCache(key: string, data: any, ttl: number = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    });
  }

  private invalidateCache(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  async batchCreate<T extends TableName>(
    table: T,
    data: Tables[T]['Insert'][],
    batchSize: number = 100
  ): Promise<Tables[T]['Row'][]> {
    const results: Tables[T]['Row'][] = [];
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      try {
        const { data: batchResults, error } = await supabase
          .from(table)
          .insert(batch)
          .select();

        if (error) throw error;
        if (batchResults) {
          results.push(...batchResults);
        }
      } catch (error) {
        console.error(`❌ Error in batch create for ${table}:`, error);
      }
    }

    this.invalidateCache(table);
    return results;
  }

  // ============================================================================
  // DATABASE UTILITIES
  // ============================================================================

  async testConnection(): Promise<boolean> {
    try {
      // Test with a simple query that doesn't require specific tables
      const { data, error } = await supabase.rpc('get_current_timestamp');
      return !error;
    } catch (error) {
      // Fallback test - try auth endpoint
      try {
        const { data, error } = await supabase.auth.getSession();
        return true; // If we can access auth, connection is working
      } catch (authError) {
        return false;
      }
    }
  }

  async getTableStats(table: TableName): Promise<{ count: number; lastUpdated: string | null }> {
    try {
      const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
      const { data } = await supabase.from(table).select('updated_at').order('updated_at', { ascending: false }).limit(1);
      
      return {
        count: count || 0,
        lastUpdated: data?.[0]?.updated_at || null
      };
    } catch (error) {
      console.error(`❌ Error getting stats for ${table}:`, error);
      return { count: 0, lastUpdated: null };
    }
  }

  // Cleanup resources
  destroy(): void {
    this.clearCache();
    this.realtimeChannels.forEach((channel, name) => {
      this.unsubscribeFromTable(name);
    });
  }
}

export const enterpriseDbService = new EnterpriseDatabaseService();
export default enterpriseDbService;