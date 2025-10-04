/**
 * 🔗 Supabase Connection Service
 * Professional connection testing and health monitoring
 */

import { supabase } from '@/config/supabase.config';

class SupabaseConnectionService {
  /**
   * Test database connection without requiring specific tables
   */
  async testConnection(): Promise<boolean> {
    try {
      // Method 1: Test auth endpoint (always available)
      const { data, error } = await supabase.auth.getSession();
      if (!error) return true;

      // Method 2: Test with a built-in function if available
      try {
        await supabase.rpc('get_current_timestamp');
        return true;
      } catch (rpcError) {
        // Method 3: Test profiles table (most common)
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .select('count')
            .limit(1);
          return !profileError;
        } catch (profileTestError) {
          return false;
        }
      }
    } catch (error) {
      console.warn('⚠️ Supabase connection test failed:', error);
      return false;
    }
  }

  /**
   * Get connection health status
   */
  async getHealthStatus(): Promise<{
    connected: boolean;
    latency?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const isConnected = await this.testConnection();
      const latency = Date.now() - startTime;
      
      return {
        connected: isConnected,
        latency,
      };
    } catch (error: any) {
      return {
        connected: false,
        error: error.message,
      };
    }
  }

  /**
   * Test specific table access
   */
  async testTableAccess(tableName: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(tableName)
        .select('count')
        .limit(1);
      
      return !error;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<{
    tables: Record<string, { accessible: boolean; count?: number }>;
    storage: { accessible: boolean };
    functions: { accessible: boolean };
  }> {
    const stats = {
      tables: {},
      storage: { accessible: false },
      functions: { accessible: false },
    };

    // Test common tables
    const commonTables = ['profiles', 'products', 'vendors', 'orders'];
    
    for (const table of commonTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        stats.tables[table] = {
          accessible: !error,
          count: data?.length || 0,
        };
      } catch (error) {
        stats.tables[table] = { accessible: false };
      }
    }

    // Test storage
    try {
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
      stats.storage.accessible = !storageError;
    } catch (error) {
      stats.storage.accessible = false;
    }

    // Test functions
    try {
      // Try a simple RPC if available
      await supabase.rpc('get_current_timestamp');
      stats.functions.accessible = true;
    } catch (error) {
      stats.functions.accessible = false;
    }

    return stats;
  }
}

export const connectionService = new SupabaseConnectionService();
export default connectionService;