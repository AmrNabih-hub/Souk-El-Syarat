/**
 * 🚀 Advanced Cache Management Service
 * Souk El-Syarat - Multi-Layer Caching Strategy
 */

import { db } from '@/config/firebase.config';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  version: string;
  tags?: string[];
}

interface CacheConfig {
  ttl?: number; // Time to live in milliseconds
  version?: string;
  tags?: string[];
  persistent?: boolean;
}

export class CacheManager {
  private static instance: CacheManager;
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_MEMORY_ITEMS = 100;
  private readonly CACHE_VERSION = '1.0.0';

  private constructor() {
    this.initializeCache();
    this.startCacheCleanup();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Initialize cache system
   */
  private initializeCache(): void {
    // Load persistent cache from localStorage
    this.loadPersistentCache();

    // Setup storage event listener for cross-tab sync
    window.addEventListener('storage', (event) => {
      if (event.key?.startsWith('cache:')) {
        this.handleStorageChange(event);
      }
    });

    console.log('✅ Cache manager initialized');
  }

  /**
   * Start periodic cache cleanup
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      this.cleanExpiredCache();
    }, 60000); // Run every minute
  }

  /**
   * Set cache entry
   */
  public set<T>(
    key: string,
    data: T,
    config: CacheConfig = {}
  ): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: config.ttl || this.DEFAULT_TTL,
      version: config.version || this.CACHE_VERSION,
      tags: config.tags
    };

    // Store in memory cache
    this.memoryCache.set(key, entry);
    this.enforceMemoryLimit();

    // Store in localStorage if persistent
    if (config.persistent) {
      this.setPersistent(key, entry);
    }

    console.log(`💾 Cached: ${key}`);
  }

  /**
   * Get cache entry
   */
  public get<T>(key: string): T | null {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && this.isValid(memoryEntry)) {
      console.log(`🎯 Memory cache hit: ${key}`);
      return memoryEntry.data as T;
    }

    // Check persistent cache
    const persistentEntry = this.getPersistent<T>(key);
    if (persistentEntry && this.isValid(persistentEntry)) {
      // Promote to memory cache
      this.memoryCache.set(key, persistentEntry);
      console.log(`📦 Persistent cache hit: ${key}`);
      return persistentEntry.data;
    }

    console.log(`❌ Cache miss: ${key}`);
    return null;
  }

  /**
   * Get or set cache entry
   */
  public async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig = {}
  ): Promise<T> {
    // Check if exists in cache
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    try {
      const data = await fetcher();
      this.set(key, data, config);
      return data;
    } catch (error) {
      console.error(`Failed to fetch and cache ${key}:`, error);
      throw error;
    }
  }

  /**
   * Invalidate cache entry
   */
  public invalidate(key: string): void {
    this.memoryCache.delete(key);
    localStorage.removeItem(`cache:${key}`);
    console.log(`🗑️ Invalidated cache: ${key}`);
  }

  /**
   * Invalidate cache by tags
   */
  public invalidateByTags(tags: string[]): void {
    const keysToInvalidate: string[] = [];

    // Check memory cache
    this.memoryCache.forEach((entry, key) => {
      if (entry.tags?.some(tag => tags.includes(tag))) {
        keysToInvalidate.push(key);
      }
    });

    // Check persistent cache
    Object.keys(localStorage).forEach(storageKey => {
      if (storageKey.startsWith('cache:')) {
        try {
          const entry = JSON.parse(localStorage.getItem(storageKey) || '{}');
          if (entry.tags?.some((tag: string) => tags.includes(tag))) {
            keysToInvalidate.push(storageKey.replace('cache:', ''));
          }
        } catch (error) {
          // Invalid cache entry, remove it
          localStorage.removeItem(storageKey);
        }
      }
    });

    // Invalidate all matching keys
    keysToInvalidate.forEach(key => this.invalidate(key));
    console.log(`🗑️ Invalidated ${keysToInvalidate.length} cache entries by tags`);
  }

  /**
   * Clear all cache
   */
  public clear(): void {
    this.memoryCache.clear();
    
    // Clear persistent cache
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cache:')) {
        localStorage.removeItem(key);
      }
    });

    console.log('🗑️ All cache cleared');
  }

  /**
   * Check if cache entry is valid
   */
  private isValid(entry: CacheEntry<any>): boolean {
    const now = Date.now();
    const age = now - entry.timestamp;
    
    // Check TTL
    if (age > entry.ttl) {
      return false;
    }

    // Check version
    if (entry.version !== this.CACHE_VERSION) {
      return false;
    }

    return true;
  }

  /**
   * Set persistent cache entry
   */
  private setPersistent<T>(key: string, entry: CacheEntry<T>): void {
    try {
      localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
    } catch (error) {
      console.error(`Failed to persist cache ${key}:`, error);
      // Clear some space if quota exceeded
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.clearOldestPersistentCache();
        // Retry
        try {
          localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
        } catch (retryError) {
          console.error('Failed to persist cache after cleanup:', retryError);
        }
      }
    }
  }

  /**
   * Get persistent cache entry
   */
  private getPersistent<T>(key: string): CacheEntry<T> | null {
    try {
      const data = localStorage.getItem(`cache:${key}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error(`Failed to get persistent cache ${key}:`, error);
      // Remove corrupted entry
      localStorage.removeItem(`cache:${key}`);
    }
    return null;
  }

  /**
   * Load persistent cache into memory
   */
  private loadPersistentCache(): void {
    let loaded = 0;
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cache:') && loaded < this.MAX_MEMORY_ITEMS) {
        const cacheKey = key.replace('cache:', '');
        const entry = this.getPersistent(cacheKey);
        if (entry && this.isValid(entry)) {
          this.memoryCache.set(cacheKey, entry);
          loaded++;
        }
      }
    });
    console.log(`📦 Loaded ${loaded} persistent cache entries`);
  }

  /**
   * Handle storage change event for cross-tab sync
   */
  private handleStorageChange(event: StorageEvent): void {
    if (!event.key) return;
    
    const cacheKey = event.key.replace('cache:', '');
    
    if (event.newValue) {
      // Cache updated in another tab
      try {
        const entry = JSON.parse(event.newValue);
        if (this.isValid(entry)) {
          this.memoryCache.set(cacheKey, entry);
          console.log(`🔄 Cache synced from another tab: ${cacheKey}`);
        }
      } catch (error) {
        console.error('Failed to sync cache from storage event:', error);
      }
    } else {
      // Cache deleted in another tab
      this.memoryCache.delete(cacheKey);
      console.log(`🔄 Cache invalidated from another tab: ${cacheKey}`);
    }
  }

  /**
   * Enforce memory cache size limit
   */
  private enforceMemoryLimit(): void {
    if (this.memoryCache.size > this.MAX_MEMORY_ITEMS) {
      // Remove oldest entries
      const sortedEntries = Array.from(this.memoryCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = sortedEntries.slice(0, this.memoryCache.size - this.MAX_MEMORY_ITEMS);
      toRemove.forEach(([key]) => {
        this.memoryCache.delete(key);
      });
      
      console.log(`🧹 Removed ${toRemove.length} old cache entries`);
    }
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredCache(): void {
    let cleaned = 0;
    
    // Clean memory cache
    this.memoryCache.forEach((entry, key) => {
      if (!this.isValid(entry)) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    });

    // Clean persistent cache
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cache:')) {
        const entry = this.getPersistent(key.replace('cache:', ''));
        if (entry && !this.isValid(entry)) {
          localStorage.removeItem(key);
          cleaned++;
        }
      }
    });

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
  }

  /**
   * Clear oldest persistent cache entries
   */
  private clearOldestPersistentCache(): void {
    const cacheEntries: Array<[string, CacheEntry<any>]> = [];
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cache:')) {
        const entry = this.getPersistent(key.replace('cache:', ''));
        if (entry) {
          cacheEntries.push([key, entry]);
        }
      }
    });

    // Sort by timestamp (oldest first)
    cacheEntries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 25%
    const toRemove = Math.ceil(cacheEntries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      localStorage.removeItem(cacheEntries[i][0]);
    }
    
    console.log(`🧹 Cleared ${toRemove} oldest persistent cache entries`);
  }

  /**
   * Get cache statistics
   */
  public getStats(): {
    memoryEntries: number;
    persistentEntries: number;
    totalSize: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  } {
    let oldestTimestamp = Infinity;
    let newestTimestamp = 0;
    let totalSize = 0;
    let persistentCount = 0;

    // Count persistent entries and calculate size
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cache:')) {
        persistentCount++;
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length * 2; // Approximate bytes (UTF-16)
          try {
            const entry = JSON.parse(value);
            oldestTimestamp = Math.min(oldestTimestamp, entry.timestamp);
            newestTimestamp = Math.max(newestTimestamp, entry.timestamp);
          } catch (error) {
            // Ignore invalid entries
          }
        }
      }
    });

    // Check memory cache timestamps
    this.memoryCache.forEach(entry => {
      oldestTimestamp = Math.min(oldestTimestamp, entry.timestamp);
      newestTimestamp = Math.max(newestTimestamp, entry.timestamp);
    });

    return {
      memoryEntries: this.memoryCache.size,
      persistentEntries: persistentCount,
      totalSize: totalSize / 1024, // Convert to KB
      oldestEntry: oldestTimestamp === Infinity ? null : new Date(oldestTimestamp),
      newestEntry: newestTimestamp === 0 ? null : new Date(newestTimestamp)
    };
  }

  /**
   * Preload critical data into cache
   */
  public async preloadCriticalData(): Promise<void> {
    console.log('📦 Preloading critical data...');
    
    const criticalKeys = [
      'categories',
      'featured-products',
      'top-vendors',
      'user-preferences'
    ];

    for (const key of criticalKeys) {
      if (!this.get(key)) {
        // Trigger data fetching (implementation depends on your data layer)
        console.log(`📥 Preloading: ${key}`);
      }
    }
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();