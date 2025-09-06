import { Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  compress?: boolean; // Whether to compress cached data
}

@Injectable()
export class CachingService {
  private readonly logger = new Logger(CachingService.name);
  private readonly cacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  };

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const startTime = Date.now();
      const result = await this.cacheManager.get<T>(key);
      const duration = Date.now() - startTime;

      if (result !== null && result !== undefined) {
        this.cacheStats.hits++;
        this.logger.debug(`Cache hit for key: ${key} (${duration}ms)`);
        return result;
      } else {
        this.cacheStats.misses++;
        this.logger.debug(`Cache miss for key: ${key} (${duration}ms)`);
        return null;
      }
    } catch (error) {
      this.logger.error(`Error getting cache for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Compress data if requested
      let dataToCache = value;
      if (options?.compress) {
        dataToCache = await this.compressData(value) as T;
      }

      await this.cacheManager.set(key, dataToCache, options?.ttl);
      this.cacheStats.sets++;
      
      const duration = Date.now() - startTime;
      this.logger.debug(`Cache set for key: ${key} (${duration}ms)`);
    } catch (error) {
      this.logger.error(`Error setting cache for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.cacheStats.deletes++;
      this.logger.debug(`Cache deleted for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting cache for key ${key}:`, error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      // This would require a Redis implementation
      // For now, we'll log the pattern
      this.logger.debug(`Cache pattern deletion requested: ${pattern}`);
    } catch (error) {
      this.logger.error(`Error deleting cache pattern ${pattern}:`, error);
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    try {
      // This would require a Redis implementation with tags
      // For now, we'll log the tag
      this.logger.debug(`Cache invalidation by tag requested: ${tag}`);
    } catch (error) {
      this.logger.error(`Error invalidating cache by tag ${tag}:`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.cacheManager.reset();
      this.logger.debug('Cache cleared');
    } catch (error) {
      this.logger.error('Error clearing cache:', error);
    }
  }

  async getStats(): Promise<any> {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = total > 0 ? (this.cacheStats.hits / total) * 100 : 0;

    return {
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses,
      sets: this.cacheStats.sets,
      deletes: this.cacheStats.deletes,
      hitRate: Math.round(hitRate * 100) / 100,
      total: total,
    };
  }

  async warmup<T>(key: string, dataLoader: () => Promise<T>, options?: CacheOptions): Promise<T> {
    try {
      // Check if data is already cached
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // Load data and cache it
      const data = await dataLoader();
      await this.set(key, data, options);
      
      this.logger.debug(`Cache warmed up for key: ${key}`);
      return data;
    } catch (error) {
      this.logger.error(`Error warming up cache for key ${key}:`, error);
      throw error;
    }
  }

  async getOrSet<T>(
    key: string,
    dataLoader: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // Load data and cache it
      const data = await dataLoader();
      await this.set(key, data, options);
      
      return data;
    } catch (error) {
      this.logger.error(`Error in getOrSet for key ${key}:`, error);
      throw error;
    }
  }

  private async compressData(data: any): Promise<Buffer> {
    try {
      const jsonString = JSON.stringify(data);
      const zlib = await import('zlib');
      return new Promise((resolve, reject) => {
        zlib.gzip(jsonString, (err, compressed) => {
          if (err) reject(err);
          else resolve(compressed);
        });
      });
    } catch (error) {
      this.logger.error('Error compressing data:', error);
      return Buffer.from(JSON.stringify(data));
    }
  }

  private async decompressData(compressedData: Buffer): Promise<any> {
    try {
      const zlib = await import('zlib');
      return new Promise((resolve, reject) => {
        zlib.gunzip(compressedData, (err, decompressed) => {
          if (err) reject(err);
          else resolve(JSON.parse(decompressed.toString()));
        });
      });
    } catch (error) {
      this.logger.error('Error decompressing data:', error);
      throw error;
    }
  }
}