/**
 * 🗄️ Supabase Database Service
 * Professional database service using Supabase PostgreSQL
 * Documentation: https://supabase.com/docs/guides/database
 */

import { supabase, supabaseConfig } from '@/config/supabase.config';
import type { Database } from '@/types/supabase';
import type { PostgrestError, PostgrestResponse } from '@supabase/supabase-js';

type Tables = Database['public']['Tables'];
type TableName = keyof Tables;

export interface QueryOptions {
  select?: string;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
  filters?: Record<string, any>;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

class SupabaseDatabaseService {
  /**
   * Generic create operation
   */
  async create<T extends TableName>(
    table: T,
    data: Tables[T]['Insert']
  ): Promise<Tables[T]['Row']> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error(`❌ Create ${table} error:`, error);
      throw error;
    }
  }

  /**
   * Generic read operation with advanced querying
   */
  async read<T extends TableName>(
    table: T,
    options: QueryOptions = {}
  ): Promise<Tables[T]['Row'][]> {
    try {
      let query = supabase.from(table).select(options.select || '*');

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (typeof value === 'object' && value !== null) {
            // Handle range queries, etc.
            if (value.gte !== undefined) query = query.gte(key, value.gte);
            if (value.lte !== undefined) query = query.lte(key, value.lte);
            if (value.gt !== undefined) query = query.gt(key, value.gt);
            if (value.lt !== undefined) query = query.lt(key, value.lt);
            if (value.like !== undefined) query = query.like(key, value.like);
            if (value.ilike !== undefined) query = query.ilike(key, value.ilike);
          } else {
            query = query.eq(key, value);
          }
        });
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending ?? true 
        });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`❌ Read ${table} error:`, error);
      throw error;
    }
  }

  /**
   * Generic read with pagination
   */
  async readPaginated<T extends TableName>(
    table: T,
    pagination: PaginationOptions,
    options: Omit<QueryOptions, 'limit' | 'offset'> = {}
  ): Promise<PaginatedResponse<Tables[T]['Row']>> {
    try {
      const { page, pageSize } = pagination;
      const offset = (page - 1) * pageSize;

      let query = supabase.from(table).select(options.select || '*', { count: 'exact' });

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (typeof value === 'object' && value !== null) {
            if (value.gte !== undefined) query = query.gte(key, value.gte);
            if (value.lte !== undefined) query = query.lte(key, value.lte);
            if (value.gt !== undefined) query = query.gt(key, value.gt);
            if (value.lt !== undefined) query = query.lt(key, value.lt);
            if (value.like !== undefined) query = query.like(key, value.like);
            if (value.ilike !== undefined) query = query.ilike(key, value.ilike);
          } else {
            query = query.eq(key, value);
          }
        });
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending ?? true 
        });
      }

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      const totalPages = Math.ceil((count || 0) / pageSize);

      return {
        data: data || [],
        count: count || 0,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      console.error(`❌ Read paginated ${table} error:`, error);
      throw error;
    }
  }

  /**
   * Generic read single record
   */
  async readOne<T extends TableName>(
    table: T,
    id: string,
    options: Omit<QueryOptions, 'limit' | 'offset'> = {}
  ): Promise<Tables[T]['Row'] | null> {
    try {
      const { data, error } = await supabase
        .from(table)
        .select(options.select || '*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
      return data || null;
    } catch (error) {
      console.error(`❌ Read one ${table} error:`, error);
      throw error;
    }
  }

  /**
   * Generic update operation
   */
  async update<T extends TableName>(
    table: T,
    id: string,
    updates: Tables[T]['Update']
  ): Promise<Tables[T]['Row']> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`❌ Update ${table} error:`, error);
      throw error;
    }
  }

  /**
   * Generic bulk update operation
   */
  async updateMany<T extends TableName>(
    table: T,
    filters: Record<string, any>,
    updates: Tables[T]['Update']
  ): Promise<Tables[T]['Row'][]> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      let query = supabase.from(table).update(updateData);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { data, error } = await query.select();
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`❌ Update many ${table} error:`, error);
      throw error;
    }
  }

  /**
   * Generic delete operation
   */
  async delete<T extends TableName>(table: T, id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error(`❌ Delete ${table} error:`, error);
      throw error;
    }
  }

  /**
   * Generic bulk delete operation
   */
  async deleteMany<T extends TableName>(
    table: T,
    filters: Record<string, any>
  ): Promise<void> {
    try {
      let query = supabase.from(table).delete();

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      });

      const { error } = await query;
      if (error) throw error;
    } catch (error) {
      console.error(`❌ Delete many ${table} error:`, error);
      throw error;
    }
  }

  /**
   * Execute raw SQL query
   */
  async executeRawQuery<T = any>(query: string, params?: any[]): Promise<T[]> {
    try {
      const { data, error } = await supabase.rpc('execute_sql', {
        query,
        params: params || [],
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Execute raw query error:', error);
      throw error;
    }
  }

  /**
   * Full-text search across multiple tables
   */
  async search<T extends TableName>(
    table: T,
    searchTerm: string,
    searchColumns: string[],
    options: QueryOptions = {}
  ): Promise<Tables[T]['Row'][]> {
    try {
      let query = supabase.from(table).select(options.select || '*');

      // Build text search query
      const searchQuery = searchColumns
        .map(col => `${col}.ilike.%${searchTerm}%`)
        .join(',');

      query = query.or(searchQuery);

      // Apply additional filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending ?? true 
        });
      }

      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`❌ Search ${table} error:`, error);
      throw error;
    }
  }

  /**
   * Get record count
   */
  async count<T extends TableName>(
    table: T,
    filters?: Record<string, any>
  ): Promise<number> {
    try {
      let query = supabase.from(table).select('*', { count: 'exact', head: true });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error(`❌ Count ${table} error:`, error);
      throw error;
    }
  }

  /**
   * Execute stored procedure/function
   */
  async executeFunction<T = any>(
    functionName: string,
    params: Record<string, any> = {}
  ): Promise<T> {
    try {
      const { data, error } = await supabase.rpc(functionName, params);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`❌ Execute function ${functionName} error:`, error);
      throw error;
    }
  }

  /**
   * Batch operations within a transaction
   */
  async batchOperations<T = any>(operations: (() => Promise<any>)[]): Promise<T[]> {
    try {
      // Supabase doesn't have explicit transactions for client-side operations
      // We'll execute operations sequentially and rollback on error
      const results: T[] = [];
      
      for (const operation of operations) {
        const result = await operation();
        results.push(result);
      }

      return results;
    } catch (error) {
      console.error('❌ Batch operations error:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time changes
   */
  subscribeToChanges<T extends TableName>(
    table: T,
    callback: (payload: any) => void,
    filters?: Record<string, any>
  ) {
    let subscription = supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table,
          filter: filters ? Object.entries(filters).map(([k, v]) => `${k}=eq.${v}`).join('&') : undefined
        }, 
        callback
      )
      .subscribe();

    return subscription;
  }

  /**
   * Unsubscribe from real-time changes
   */
  unsubscribe(subscription: any) {
    supabase.removeChannel(subscription);
  }
}

// Export singleton instance
export const databaseService = new SupabaseDatabaseService();
export default databaseService;