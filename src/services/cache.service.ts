/**
 * Advanced Caching Service with multiple strategies
 * Handles in-memory, localStorage, and IndexedDB caching
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Cache database schema
interface CacheDB extends DBSchema {
  cache: {
    key: string;
    value: {
      key: string;
      data: any;
      timestamp: number;
      ttl: number;
      tags?: string[];
    };
    indexes: {
      'by-timestamp': number;
      'by-tags': string[];
    };
  };
  metadata: {
    key: string;
    value: {
      key: string;
      hits: number;
      lastAccess: number;
      size: number;
    };
  };
}

// Cache configuration
interface CacheConfig {
  maxSize?: number; // Maximum cache size in bytes
  defaultTTL?: number; // Default time-to-live in seconds
  gcInterval?: number; // Garbage collection interval in seconds
  strategy?: 'LRU' | 'LFU' | 'FIFO'; // Cache eviction strategy
}

// Cache entry interface
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  tags?: string[];
}

export class CacheService {
  private static instance: CacheService;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private db: IDBPDatabase<CacheDB> | null = null;
  private config: Required<CacheConfig>;
  private gcTimer: NodeJS.Timeout | null = null;
  private currentSize = 0;
  private accessCount: Map<string, number> = new Map();

  private constructor(config: CacheConfig = {}) {
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB default
      defaultTTL: 3600, // 1 hour default
      gcInterval: 300, // 5 minutes default
      strategy: 'LRU',
      ...config,
    };

    this.initializeDB();
    this.startGarbageCollection();
  }

  static getInstance(config?: CacheConfig): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService(config);
    }
    return CacheService.instance;
  }

  // Initialize IndexedDB
  private async initializeDB(): Promise<void> {
    try {
      this.db = await openDB<CacheDB>('SoukElSayaratCache', 1, {
        upgrade(db) {
          // Create cache store
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('by-timestamp', 'timestamp');
          cacheStore.createIndex('by-tags', 'tags', { multiEntry: true });

          // Create metadata store
          db.createObjectStore('metadata', { keyPath: 'key' });
        },
      });
    } catch (error) {
      // console.error('Failed to initialize IndexedDB:', error);
    }
  }

  // Start garbage collection
  private startGarbageCollection(): void {
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
    }

    this.gcTimer = setInterval(() => {
      this.garbageCollect();
    }, this.config.gcInterval * 1000);
  }

  // Garbage collection
  private async garbageCollect(): Promise<void> {
    const now = Date.now();

    // Clean memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry, now)) {
        this.memoryCache.delete(key);
        this.accessCount.delete(key);
      }
    }

    // Clean IndexedDB cache
    if (this.db) {
      const tx = this.db.transaction('cache', 'readwrite');
      const store = tx.objectStore('cache');
      const entries = await store.getAll();

      for (const entry of entries) {
        if (this.isExpired(entry, now)) {
          await store.delete(entry.key);
        }
      }

      await tx.complete;
    }

    // Evict if over size limit
    if (this.currentSize > this.config.maxSize) {
      await this.evict();
    }
  }

  // Check if entry is expired
  private isExpired(entry: CacheEntry, now: number = Date.now()): boolean {
    return entry.timestamp + entry.ttl * 1000 < now;
  }

  // Evict entries based on strategy
  private async evict(): Promise<void> {
    const targetSize = this.config.maxSize * 0.8; // Evict to 80% capacity

    switch (this.config.strategy) {
      case 'LRU':
        await this.evictLRU(targetSize);
        break;
      case 'LFU':
        await this.evictLFU(targetSize);
        break;
      case 'FIFO':
        await this.evictFIFO(targetSize);
        break;
    }
  }

  // LRU eviction
  private async evictLRU(targetSize: number): Promise<void> {
    if (!this.db) return;

    const tx = this.db.transaction(['cache', 'metadata'], 'readwrite');
    const cacheStore = tx.objectStore('cache');
    const metadataStore = tx.objectStore('metadata');

    const metadata = await metadataStore.getAll();
    metadata.sort((a, b) => a.lastAccess - b.lastAccess);

    for (const meta of metadata) {
      if (this.currentSize <= targetSize) break;

      await cacheStore.delete(meta.key);
      await metadataStore.delete(meta.key);
      this.currentSize -= meta.size;
    }

    await tx.complete;
  }

  // LFU eviction
  private async evictLFU(targetSize: number): Promise<void> {
    if (!this.db) return;

    const tx = this.db.transaction(['cache', 'metadata'], 'readwrite');
    const cacheStore = tx.objectStore('cache');
    const metadataStore = tx.objectStore('metadata');

    const metadata = await metadataStore.getAll();
    metadata.sort((a, b) => a.hits - b.hits);

    for (const meta of metadata) {
      if (this.currentSize <= targetSize) break;

      await cacheStore.delete(meta.key);
      await metadataStore.delete(meta.key);
      this.currentSize -= meta.size;
    }

    await tx.complete;
  }

  // FIFO eviction
  private async evictFIFO(targetSize: number): Promise<void> {
    if (!this.db) return;

    const tx = this.db.transaction('cache', 'readwrite');
    const store = tx.objectStore('cache');
    const index = store.index('by-timestamp');

    const cursor = await index.openCursor();
    while (cursor && this.currentSize > targetSize) {
      await cursor.delete();
      this.currentSize -= JSON.stringify(cursor.value.data).length;
      await cursor.continue();
    }

    await tx.complete;
  }

  // Get from cache
  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      this.updateAccessMetadata(key);
      return memoryEntry.data as T;
    }

    // Check IndexedDB
    if (this.db) {
      try {
        const entry = await this.db.get('cache', key);
        if (entry && !this.isExpired(entry)) {
          // Promote to memory cache
          this.memoryCache.set(key, entry);
          this.updateAccessMetadata(key);
          return entry.data as T;
        }
      } catch (error) {
        // console.error('Cache get error:', error);
      }
    }

    // Check localStorage as fallback
    try {
      const stored = localStorage.getItem(`cache_${key}`);
      if (stored) {
        const entry = JSON.parse(stored) as CacheEntry;
        if (!this.isExpired(entry)) {
          return entry.data as T;
        }
        localStorage.removeItem(`cache_${key}`);
      }
    } catch (error) {
      // console.error('LocalStorage get error:', error);
    }

    return null;
  }

  // Set in cache
  async set<T>(
    key: string,
    data: T,
    ttl: number = this.config.defaultTTL,
    tags?: string[]
  ): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      tags,
    };

    // Add to memory cache
    this.memoryCache.set(key, entry);

    // Add to IndexedDB
    if (this.db) {
      try {
        const tx = this.db.transaction(['cache', 'metadata'], 'readwrite');
        const cacheStore = tx.objectStore('cache');
        const metadataStore = tx.objectStore('metadata');

        await cacheStore.put({ key, ...entry });
        
        const size = JSON.stringify(data).length;
        await metadataStore.put({
          key,
          hits: 0,
          lastAccess: Date.now(),
          size,
        });

        this.currentSize += size;
        await tx.complete;
      } catch (error) {
        // console.error('Cache set error:', error);
      }
    }

    // Fallback to localStorage for critical data
    if (tags?.includes('critical')) {
      try {
        localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
      } catch (error) {
        // console.error('LocalStorage set error:', error);
      }
    }
  }

  // Delete from cache
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    this.accessCount.delete(key);

    if (this.db) {
      try {
        const tx = this.db.transaction(['cache', 'metadata'], 'readwrite');
        await tx.objectStore('cache').delete(key);
        await tx.objectStore('metadata').delete(key);
        await tx.complete;
      } catch (error) {
        // console.error('Cache delete error:', error);
      }
    }

    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      // console.error('LocalStorage delete error:', error);
    }
  }

  // Clear all cache
  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.accessCount.clear();
    this.currentSize = 0;

    if (this.db) {
      try {
        const tx = this.db.transaction(['cache', 'metadata'], 'readwrite');
        await tx.objectStore('cache').clear();
        await tx.objectStore('metadata').clear();
        await tx.complete;
      } catch (error) {
        // console.error('Cache clear error:', error);
      }
    }

    // Clear localStorage cache
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      // console.error('LocalStorage clear error:', error);
    }
  }

  // Clear by tags
  async clearByTags(tags: string[]): Promise<void> {
    if (!this.db) return;

    try {
      const tx = this.db.transaction('cache', 'readwrite');
      const store = tx.objectStore('cache');
      const index = store.index('by-tags');

      for (const tag of tags) {
        const keys = await index.getAllKeys(tag);
        for (const key of keys) {
          await store.delete(key);
          this.memoryCache.delete(key as string);
        }
      }

      await tx.complete;
    } catch (error) {
      // console.error('Clear by tags error:', error);
    }
  }

  // Update access metadata
  private async updateAccessMetadata(key: string): Promise<void> {
    const count = (this.accessCount.get(key) || 0) + 1;
    this.accessCount.set(key, count);

    if (this.db) {
      try {
        const tx = this.db.transaction('metadata', 'readwrite');
        const store = tx.objectStore('metadata');
        const metadata = await store.get(key);

        if (metadata) {
          metadata.hits++;
          metadata.lastAccess = Date.now();
          await store.put(metadata);
        }

        await tx.complete;
      } catch (error) {
        // console.error('Update metadata error:', error);
      }
    }
  }

  // Get cache statistics
  async getStats(): Promise<{
    memoryEntries: number;
    dbEntries: number;
    totalSize: number;
    hitRate: number;
  }> {
    let dbEntries = 0;
    if (this.db) {
      const count = await this.db.count('cache');
      dbEntries = count;
    }

    const totalHits = Array.from(this.accessCount.values()).reduce((a, b) => a + b, 0);
    const totalRequests = this.accessCount.size;
    const hitRate = totalRequests > 0 ? totalHits / totalRequests : 0;

    return {
      memoryEntries: this.memoryCache.size,
      dbEntries,
      totalSize: this.currentSize,
      hitRate,
    };
  }

  // Destroy cache service
  destroy(): void {
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
      this.gcTimer = null;
    }

    if (this.db) {
      this.db.close();
      this.db = null;
    }

    this.memoryCache.clear();
    this.accessCount.clear();
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();