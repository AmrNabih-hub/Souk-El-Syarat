/**
 * Performance Optimization and Caching Service
 * Enterprise-level performance optimization with intelligent caching
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { 
  ref, 
  get, 
  set, 
  remove 
} from 'firebase/database';
import { db, realtimeDb } from '@/config/firebase.config';

export interface CacheItem<T = any> {
  key: string;
  data: T;
  timestamp: Date;
  expiresAt: Date;
  hits: number;
  size: number;
  tags: string[];
}

export interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  networkLatency: number;
  renderTime: number;
  bundleSize: number;
  imageOptimization: number;
}

export interface OptimizationConfig {
  enableCaching: boolean;
  cacheExpiration: number; // in milliseconds
  maxCacheSize: number; // in MB
  enableImageOptimization: boolean;
  enableLazyLoading: boolean;
  enableCodeSplitting: boolean;
  enableServiceWorker: boolean;
  enableCompression: boolean;
}

export class PerformanceOptimizationService {
  private static instance: PerformanceOptimizationService;
  private cache: Map<string, CacheItem> = new Map();
  private performanceMetrics: PerformanceMetrics = {
    pageLoadTime: 0,
    apiResponseTime: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
    networkLatency: 0,
    renderTime: 0,
    bundleSize: 0,
    imageOptimization: 0,
  };
  private config: OptimizationConfig = {
    enableCaching: true,
    cacheExpiration: 5 * 60 * 1000, // 5 minutes
    maxCacheSize: 50 * 1024 * 1024, // 50MB
    enableImageOptimization: true,
    enableLazyLoading: true,
    enableCodeSplitting: true,
    enableServiceWorker: true,
    enableCompression: true,
  };
  private cacheHits = 0;
  private cacheMisses = 0;
  private isInitialized = false;

  static getInstance(): PerformanceOptimizationService {
    if (!PerformanceOptimizationService.instance) {
      PerformanceOptimizationService.instance = new PerformanceOptimizationService();
    }
    return PerformanceOptimizationService.instance;
  }

  /**
   * Initialize performance optimization service
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      // Load configuration from localStorage or server
      await this.loadConfiguration();

      // Set up performance monitoring
      this.setupPerformanceMonitoring();

      // Set up cache management
      this.setupCacheManagement();

      // Set up image optimization
      if (this.config.enableImageOptimization) {
        this.setupImageOptimization();
      }

      // Set up lazy loading
      if (this.config.enableLazyLoading) {
        this.setupLazyLoading();
      }

      // Set up service worker
      if (this.config.enableServiceWorker) {
        await this.setupServiceWorker();
      }

      this.isInitialized = true;
      console.log('✅ Performance optimization service initialized');
    } catch (error) {
      console.error('Failed to initialize performance optimization service:', error);
    }
  }

  /**
   * Cache data with intelligent expiration and tagging
   */
  async cacheData<T>(
    key: string, 
    data: T, 
    options: {
      expiration?: number;
      tags?: string[];
      priority?: 'high' | 'medium' | 'low';
    } = {}
  ): Promise<void> {
    try {
      if (!this.config.enableCaching) return;

      const expiration = options.expiration || this.config.cacheExpiration;
      const tags = options.tags || [];
      const priority = options.priority || 'medium';

      const cacheItem: CacheItem<T> = {
        key,
        data,
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + expiration),
        hits: 0,
        size: this.calculateSize(data),
        tags,
      };

      // Check cache size and evict if necessary
      await this.manageCacheSize(cacheItem.size);

      // Store in memory cache
      this.cache.set(key, cacheItem);

      // Store in IndexedDB for persistence
      await this.storeInIndexedDB(key, cacheItem);

      // Store in Firebase for cross-device sync
      await this.storeInFirebase(key, cacheItem);

    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  /**
   * Get cached data
   */
  async getCachedData<T>(key: string): Promise<T | null> {
    try {
      if (!this.config.enableCaching) return null;

      // Check memory cache first
      let cacheItem = this.cache.get(key);
      
      if (!cacheItem) {
        // Check IndexedDB
        cacheItem = await this.getFromIndexedDB(key);
        
        if (!cacheItem) {
          // Check Firebase
          cacheItem = await this.getFromFirebase(key);
        }
      }

      if (!cacheItem) {
        this.cacheMisses++;
        return null;
      }

      // Check expiration
      if (new Date() > cacheItem.expiresAt) {
        await this.removeCachedData(key);
        this.cacheMisses++;
        return null;
      }

      // Update hit count
      cacheItem.hits++;
      this.cacheHits++;

      // Update cache hit rate
      this.performanceMetrics.cacheHitRate = this.cacheHits / (this.cacheHits + this.cacheMisses) * 100;

      return cacheItem.data as T;
    } catch (error) {
      console.error('Error getting cached data:', error);
      this.cacheMisses++;
      return null;
    }
  }

  /**
   * Remove cached data
   */
  async removeCachedData(key: string): Promise<void> {
    try {
      // Remove from memory cache
      this.cache.delete(key);

      // Remove from IndexedDB
      await this.removeFromIndexedDB(key);

      // Remove from Firebase
      await this.removeFromFirebase(key);

    } catch (error) {
      console.error('Error removing cached data:', error);
    }
  }

  /**
   * Clear cache by tags
   */
  async clearCacheByTags(tags: string[]): Promise<void> {
    try {
      const keysToRemove: string[] = [];

      for (const [key, item] of this.cache.entries()) {
        if (tags.some(tag => item.tags.includes(tag))) {
          keysToRemove.push(key);
        }
      }

      for (const key of keysToRemove) {
        await this.removeCachedData(key);
      }

    } catch (error) {
      console.error('Error clearing cache by tags:', error);
    }
  }

  /**
   * Optimize images
   */
  optimizeImage(
    imageUrl: string, 
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'jpeg' | 'png';
    } = {}
  ): string {
    try {
      if (!this.config.enableImageOptimization) return imageUrl;

      const { width, height, quality = 80, format = 'webp' } = options;

      // Use Firebase Storage image optimization
      let optimizedUrl = imageUrl;

      if (width || height) {
        const params = new URLSearchParams();
        if (width) params.append('w', width.toString());
        if (height) params.append('h', height.toString());
        params.append('q', quality.toString());
        params.append('f', format);

        optimizedUrl = `${imageUrl}?${params.toString()}`;
      }

      return optimizedUrl;
    } catch (error) {
      console.error('Error optimizing image:', error);
      return imageUrl;
    }
  }

  /**
   * Lazy load images
   */
  setupLazyLoading(): void {
    try {
      if (!this.config.enableLazyLoading) return;

      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            
            if (src) {
              img.src = src;
              img.classList.remove('lazy');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      // Observe all lazy images
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });

    } catch (error) {
      console.error('Error setting up lazy loading:', error);
    }
  }

  /**
   * Preload critical resources
   */
  async preloadResources(resources: Array<{
    href: string;
    as: 'script' | 'style' | 'image' | 'font';
    crossorigin?: boolean;
  }>): Promise<void> {
    try {
      for (const resource of resources) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource.href;
        link.as = resource.as;
        
        if (resource.crossorigin) {
          link.crossOrigin = 'anonymous';
        }

        document.head.appendChild(link);
      }
    } catch (error) {
      console.error('Error preloading resources:', error);
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(metrics: Partial<PerformanceMetrics>): void {
    this.performanceMetrics = { ...this.performanceMetrics, ...metrics };
  }

  /**
   * Get cache statistics
   */
  getCacheStatistics(): {
    size: number;
    items: number;
    hitRate: number;
    hits: number;
    misses: number;
  } {
    let totalSize = 0;
    for (const item of this.cache.values()) {
      totalSize += item.size;
    }

    return {
      size: totalSize,
      items: this.cache.size,
      hitRate: this.performanceMetrics.cacheHitRate,
      hits: this.cacheHits,
      misses: this.cacheMisses,
    };
  }

  /**
   * Optimize bundle size
   */
  async optimizeBundleSize(): Promise<void> {
    try {
      // This would integrate with webpack-bundle-analyzer or similar tools
      // For now, we'll just log the current bundle size
      const bundleSize = this.estimateBundleSize();
      this.performanceMetrics.bundleSize = bundleSize;

      console.log(`Bundle size: ${(bundleSize / 1024 / 1024).toFixed(2)} MB`);
    } catch (error) {
      console.error('Error optimizing bundle size:', error);
    }
  }

  // Private helper methods

  private async loadConfiguration(): Promise<void> {
    try {
      // Load from localStorage
      const savedConfig = localStorage.getItem('performance-config');
      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) };
      }

      // Load from server
      const serverConfig = await this.getServerConfiguration();
      if (serverConfig) {
        this.config = { ...this.config, ...serverConfig };
      }

    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  }

  private async getServerConfiguration(): Promise<Partial<OptimizationConfig> | null> {
    try {
      const configDoc = await getDoc(doc(db, 'config', 'performance'));
      return configDoc.exists() ? configDoc.data() : null;
    } catch (error) {
      console.error('Error getting server configuration:', error);
      return null;
    }
  }

  private setupPerformanceMonitoring(): void {
    // Monitor page load time
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      this.performanceMetrics.pageLoadTime = loadTime;
    });

    // Monitor memory usage
    setInterval(() => {
      if ((performance as any).memory) {
        this.performanceMetrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
      }
    }, 30000); // Every 30 seconds

    // Monitor API response times
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - start;
        this.performanceMetrics.apiResponseTime = duration;
        return response;
      } catch (error) {
        const duration = performance.now() - start;
        this.performanceMetrics.apiResponseTime = duration;
        throw error;
      }
    };
  }

  private setupCacheManagement(): void {
    // Clean up expired cache items every 5 minutes
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 5 * 60 * 1000);

    // Monitor cache size
    setInterval(() => {
      this.monitorCacheSize();
    }, 60000); // Every minute
  }

  private setupImageOptimization(): void {
    // Set up responsive images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.dataset.src) {
        img.src = this.optimizeImage(img.dataset.src, {
          width: img.width,
          height: img.height,
          quality: 80,
          format: 'webp'
        });
      }
    });
  }

  private async setupServiceWorker(): Promise<void> {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  private async manageCacheSize(newItemSize: number): Promise<void> {
    const currentSize = this.getCacheStatistics().size;
    
    if (currentSize + newItemSize > this.config.maxCacheSize) {
      // Evict least recently used items
      await this.evictLRUItems(newItemSize);
    }
  }

  private async evictLRUItems(requiredSpace: number): Promise<void> {
    const items = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime());

    let freedSpace = 0;
    for (const [key, item] of items) {
      if (freedSpace >= requiredSpace) break;
      
      await this.removeCachedData(key);
      freedSpace += item.size;
    }
  }

  private cleanupExpiredCache(): void {
    const now = new Date();
    const expiredKeys: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.removeCachedData(key));
  }

  private monitorCacheSize(): void {
    const stats = this.getCacheStatistics();
    const sizeInMB = stats.size / 1024 / 1024;
    
    if (sizeInMB > this.config.maxCacheSize / 1024 / 1024 * 0.8) {
      console.warn(`Cache size is getting large: ${sizeInMB.toFixed(2)} MB`);
    }
  }

  private calculateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch (error) {
      return 0;
    }
  }

  private async storeInIndexedDB(key: string, item: CacheItem): Promise<void> {
    try {
      // This would use IndexedDB for persistent storage
      // For now, we'll just log that we would store it
      console.log('Would store in IndexedDB:', key);
    } catch (error) {
      console.error('Error storing in IndexedDB:', error);
    }
  }

  private async getFromIndexedDB(key: string): Promise<CacheItem | null> {
    try {
      // This would retrieve from IndexedDB
      // For now, return null
      return null;
    } catch (error) {
      console.error('Error getting from IndexedDB:', error);
      return null;
    }
  }

  private async removeFromIndexedDB(key: string): Promise<void> {
    try {
      // This would remove from IndexedDB
      console.log('Would remove from IndexedDB:', key);
    } catch (error) {
      console.error('Error removing from IndexedDB:', error);
    }
  }

  private async storeInFirebase(key: string, item: CacheItem): Promise<void> {
    try {
      const cacheRef = ref(realtimeDb, `cache/${key}`);
      await set(cacheRef, {
        ...item,
        timestamp: item.timestamp.toISOString(),
        expiresAt: item.expiresAt.toISOString()
      });
    } catch (error) {
      console.error('Error storing in Firebase:', error);
    }
  }

  private async getFromFirebase(key: string): Promise<CacheItem | null> {
    try {
      const cacheRef = ref(realtimeDb, `cache/${key}`);
      const snapshot = await get(cacheRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        return {
          ...data,
          timestamp: new Date(data.timestamp),
          expiresAt: new Date(data.expiresAt)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting from Firebase:', error);
      return null;
    }
  }

  private async removeFromFirebase(key: string): Promise<void> {
    try {
      const cacheRef = ref(realtimeDb, `cache/${key}`);
      await remove(cacheRef);
    } catch (error) {
      console.error('Error removing from Firebase:', error);
    }
  }

  private estimateBundleSize(): number {
    // This is a rough estimate
    // In a real implementation, you'd use webpack-bundle-analyzer
    return 2 * 1024 * 1024; // 2MB estimate
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}

export default PerformanceOptimizationService;