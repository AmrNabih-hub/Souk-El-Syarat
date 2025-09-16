/**
 * ⚡ PROFESSIONAL PERFORMANCE SERVICE
 * Advanced performance monitoring and optimization
 * Implements caching, lazy loading, and performance metrics
 */

import { performance } from 'perf_hooks';

// Performance metrics interface
export interface PerformanceMetrics {
  timestamp: number;
  operation: string;
  duration: number;
  memoryUsage: NodeJS.MemoryUsage;
  success: boolean;
  error?: string;
}

// Cache configuration
interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  checkPeriod: number; // Cleanup period in milliseconds
}

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

/**
 * Professional Cache Service
 * Implements LRU cache with TTL and performance monitoring
 */
export class CacheService<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize || 1000,
      ttl: config.ttl || 5 * 60 * 1000, // 5 minutes default
      checkPeriod: config.checkPeriod || 60 * 1000, // 1 minute cleanup
    };

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.checkPeriod);
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T): void {
    // If cache is full, remove least recently used item
    if (this.cache.size >= this.config.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
    };

    this.cache.set(key, entry);
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete key from cache
   */
  delete(key: string): boolean {
    if (!key || typeof key !== 'string') {
      console.warn('PerformanceService: Attempted to delete with invalid key:', key);
      return false;
    }
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    totalAccesses: number;
  } {
    let totalAccesses = 0;
    this.cache.forEach(entry => {
      totalAccesses += entry.accessCount;
    });

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: this.cache.size > 0 ? totalAccesses / this.cache.size : 0,
      totalAccesses,
    };
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.config.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Destroy cache and cleanup
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

/**
 * Professional Performance Monitor
 * Tracks and analyzes performance metrics
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 10000;

  /**
   * Start performance timing
   */
  startTiming(operation: string): () => void {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const endMemory = process.memoryUsage();
      const duration = endTime - startTime;

      this.recordMetric({
        timestamp: Date.now(),
        operation,
        duration,
        memoryUsage: endMemory,
        success: true,
      });
    };
  }

  /**
   * Record performance metric
   */
  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get performance statistics
   */
  getStats(timeWindow?: number): {
    totalOperations: number;
    averageDuration: number;
    slowestOperation: PerformanceMetrics | null;
    fastestOperation: PerformanceMetrics | null;
    errorRate: number;
    memoryUsage: {
      current: NodeJS.MemoryUsage;
      average: NodeJS.MemoryUsage;
      peak: NodeJS.MemoryUsage;
    };
  } {
    let relevantMetrics = this.metrics;

    if (timeWindow) {
      const cutoffTime = Date.now() - timeWindow;
      relevantMetrics = this.metrics.filter(m => m.timestamp > cutoffTime);
    }

    if (relevantMetrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        slowestOperation: null,
        fastestOperation: null,
        errorRate: 0,
        memoryUsage: {
          current: process.memoryUsage(),
          average: { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 },
          peak: { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 },
        },
      };
    }

    const successfulMetrics = relevantMetrics.filter(m => m.success);
    const failedMetrics = relevantMetrics.filter(m => !m.success);

    const durations = successfulMetrics.map(m => m.duration);
    const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;

    const slowestOperation = successfulMetrics.reduce((slowest, current) => 
      current.duration > slowest.duration ? current : slowest, successfulMetrics[0]);

    const fastestOperation = successfulMetrics.reduce((fastest, current) => 
      current.duration < fastest.duration ? current : fastest, successfulMetrics[0]);

    const errorRate = failedMetrics.length / relevantMetrics.length;

    // Calculate memory usage statistics
    const memoryUsages = relevantMetrics.map(m => m.memoryUsage);
    const averageMemory: NodeJS.MemoryUsage = {
      rss: memoryUsages.reduce((sum, m) => sum + m.rss, 0) / memoryUsages.length,
      heapTotal: memoryUsages.reduce((sum, m) => sum + m.heapTotal, 0) / memoryUsages.length,
      heapUsed: memoryUsages.reduce((sum, m) => sum + m.heapUsed, 0) / memoryUsages.length,
      external: memoryUsages.reduce((sum, m) => sum + m.external, 0) / memoryUsages.length,
      arrayBuffers: memoryUsages.reduce((sum, m) => sum + m.arrayBuffers, 0) / memoryUsages.length,
    };

    const peakMemory: NodeJS.MemoryUsage = {
      rss: Math.max(...memoryUsages.map(m => m.rss)),
      heapTotal: Math.max(...memoryUsages.map(m => m.heapTotal)),
      heapUsed: Math.max(...memoryUsages.map(m => m.heapUsed)),
      external: Math.max(...memoryUsages.map(m => m.external)),
      arrayBuffers: Math.max(...memoryUsages.map(m => m.arrayBuffers)),
    };

    return {
      totalOperations: relevantMetrics.length,
      averageDuration,
      slowestOperation,
      fastestOperation,
      errorRate,
      memoryUsage: {
        current: process.memoryUsage(),
        average: averageMemory,
        peak: peakMemory,
      },
    };
  }

  /**
   * Get operation-specific statistics
   */
  getOperationStats(operation: string, timeWindow?: number): {
    count: number;
    averageDuration: number;
    errorRate: number;
    recentMetrics: PerformanceMetrics[];
  } {
    let relevantMetrics = this.metrics.filter(m => m.operation === operation);

    if (timeWindow) {
      const cutoffTime = Date.now() - timeWindow;
      relevantMetrics = relevantMetrics.filter(m => m.timestamp > cutoffTime);
    }

    const successfulMetrics = relevantMetrics.filter(m => m.success);
    const failedMetrics = relevantMetrics.filter(m => !m.success);

    const averageDuration = successfulMetrics.length > 0 
      ? successfulMetrics.reduce((sum, m) => sum + m.duration, 0) / successfulMetrics.length 
      : 0;

    const errorRate = relevantMetrics.length > 0 
      ? failedMetrics.length / relevantMetrics.length 
      : 0;

    return {
      count: relevantMetrics.length,
      averageDuration,
      errorRate,
      recentMetrics: relevantMetrics.slice(-10), // Last 10 metrics
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }
}

/**
 * Lazy Loading Service
 * Implements lazy loading patterns for optimal performance
 */
export class LazyLoadingService {
  private loadedModules = new Map<string, any>();
  private loadingPromises = new Map<string, Promise<any>>();

  /**
   * Lazy load a module
   */
  async loadModule<T>(moduleName: string, loader: () => Promise<T>): Promise<T> {
    // Return cached module if already loaded
    if (this.loadedModules.has(moduleName)) {
      return this.loadedModules.get(moduleName);
    }

    // Return existing loading promise if currently loading
    if (this.loadingPromises.has(moduleName)) {
      return this.loadingPromises.get(moduleName);
    }

    // Start loading
    const loadingPromise = loader().then(module => {
      this.loadedModules.set(moduleName, module);
      this.loadingPromises.delete(moduleName);
      return module;
    });

    this.loadingPromises.set(moduleName, loadingPromise);
    return loadingPromise;
  }

  /**
   * Preload a module
   */
  async preloadModule<T>(moduleName: string, loader: () => Promise<T>): Promise<void> {
    if (!this.loadedModules.has(moduleName) && !this.loadingPromises.has(moduleName)) {
      await this.loadModule(moduleName, loader);
    }
  }

  /**
   * Check if module is loaded
   */
  isLoaded(moduleName: string): boolean {
    return this.loadedModules.has(moduleName);
  }

  /**
   * Get loaded modules
   */
  getLoadedModules(): string[] {
    return Array.from(this.loadedModules.keys());
  }

  /**
   * Unload a module
   */
  unloadModule(moduleName: string): boolean {
    return this.loadedModules.delete(moduleName);
  }
}

/**
 * Debounce Service
 * Implements debouncing for performance optimization
 */
export class DebounceService {
  private timeouts = new Map<string, NodeJS.Timeout>();

  /**
   * Debounce a function call
   */
  debounce<T extends (...args: any[]) => any>(
    key: string,
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      // Clear existing timeout
      const existingTimeout = this.timeouts.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout
      const timeout = setTimeout(() => {
        func(...args);
        this.timeouts.delete(key);
      }, delay);

      this.timeouts.set(key, timeout);
    };
  }

  /**
   * Cancel debounced function
   */
  cancel(key: string): void {
    const timeout = this.timeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(key);
    }
  }

  /**
   * Cancel all debounced functions
   */
  cancelAll(): void {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
  }
}

/**
 * Throttle Service
 * Implements throttling for performance optimization
 */
export class ThrottleService {
  private lastExecuted = new Map<string, number>();

  /**
   * Throttle a function call
   */
  throttle<T extends (...args: any[]) => any>(
    key: string,
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      const now = Date.now();
      const lastExecuted = this.lastExecuted.get(key) || 0;

      if (now - lastExecuted >= delay) {
        func(...args);
        this.lastExecuted.set(key, now);
      }
    };
  }

  /**
   * Reset throttle for a key
   */
  reset(key: string): void {
    this.lastExecuted.delete(key);
  }

  /**
   * Reset all throttles
   */
  resetAll(): void {
    this.lastExecuted.clear();
  }
}

// Create service instances
export const cacheService = new CacheService();
export const performanceMonitor = new PerformanceMonitor();
export const lazyLoadingService = new LazyLoadingService();
export const debounceService = new DebounceService();
export const throttleService = new ThrottleService();

// Performance decorator for automatic monitoring
export function PerformanceMonitorDecorator(operationName: string) {
  return function (_target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const endTiming = performanceMonitor.startTiming(`${operationName}.${propertyName}`);
      
      try {
        const result = await method.apply(this, args);
        endTiming();
        return result;
      } catch (error) {
        performanceMonitor.recordMetric({
          timestamp: Date.now(),
          operation: `${operationName}.${propertyName}`,
          duration: 0,
          memoryUsage: process.memoryUsage(),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    };

    return descriptor;
  };
}

// Export all services
export const performanceServices = {
  cache: cacheService,
  monitor: performanceMonitor,
  lazyLoading: lazyLoadingService,
  debounce: debounceService,
  throttle: throttleService,
};

