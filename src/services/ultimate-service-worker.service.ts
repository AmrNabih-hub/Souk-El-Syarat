/**
 * Ultimate Service Worker Service
 * Advanced service worker implementation for caching, offline support, and performance
 */

export interface ServiceWorkerConfig {
  enabled: boolean;
  version: string;
  scope: string;
  strategies: {
    [route: string]: CachingStrategy;
  };
  precaching: {
    enabled: boolean;
    assets: string[];
    exclude: string[];
  };
  runtimeCaching: {
    enabled: boolean;
    strategies: RuntimeCachingStrategy[];
  };
  backgroundSync: {
    enabled: boolean;
    queues: string[];
  };
  pushNotifications: {
    enabled: boolean;
    vapidKey: string;
  };
  offline: {
    enabled: boolean;
    fallback: string;
    strategies: OfflineStrategy[];
  };
}

export interface CachingStrategy {
  name: string;
  type: 'cacheFirst' | 'networkFirst' | 'staleWhileRevalidate' | 'networkOnly' | 'cacheOnly';
  cacheName: string;
  options: {
    maxEntries?: number;
    maxAgeSeconds?: number;
    maxAge?: number;
    purgeOnQuotaError?: boolean;
    plugins?: any[];
  };
  matcher: (request: Request) => boolean;
  handler: (request: Request) => Promise<Response>;
}

export interface RuntimeCachingStrategy {
  urlPattern: RegExp;
  handler: CachingStrategy;
  options: {
    cacheName: string;
    expiration: {
      maxEntries: number;
      maxAgeSeconds: number;
    };
  };
}

export interface OfflineStrategy {
  type: 'page' | 'image' | 'api' | 'asset';
  pattern: RegExp;
  fallback: string;
  cacheName: string;
}

export interface CacheMetrics {
  totalCaches: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  requestsServed: number;
  requestsCached: number;
  requestsFailed: number;
  offlineRequests: number;
  backgroundSyncEvents: number;
  pushNotificationsSent: number;
  cacheEfficiency: number;
  storageUsed: number;
  storageQuota: number;
}

export interface BackgroundSyncEvent {
  id: string;
  queue: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export class UltimateServiceWorkerService {
  private static instance: UltimateServiceWorkerService;
  private config: ServiceWorkerConfig;
  private metrics: CacheMetrics;
  private backgroundSyncEvents: Map<string, BackgroundSyncEvent>;
  private isInitialized: boolean = false;
  private registration: ServiceWorkerRegistration | null = null;

  // Default caching strategies
  private defaultStrategies: { [key: string]: CachingStrategy } = {
    staticAssets: {
      name: 'Static Assets',
      type: 'cacheFirst',
      cacheName: 'static-assets-v1',
      options: {
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        purgeOnQuotaError: true
      },
      matcher: (request) => {
        return request.destination === 'image' || 
               request.destination === 'style' || 
               request.destination === 'script' ||
               request.destination === 'font';
      },
      handler: async (request) => {
        const cache = await caches.open('static-assets-v1');
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      }
    },
    apiResponses: {
      name: 'API Responses',
      type: 'networkFirst',
      cacheName: 'api-responses-v1',
      options: {
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
        purgeOnQuotaError: true
      },
      matcher: (request) => {
        return request.url.includes('/api/');
      },
      handler: async (request) => {
        const cache = await caches.open('api-responses-v1');
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          const cachedResponse = await cache.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          throw error;
        }
      }
    },
    pages: {
      name: 'Pages',
      type: 'staleWhileRevalidate',
      cacheName: 'pages-v1',
      options: {
        maxEntries: 20,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
        purgeOnQuotaError: true
      },
      matcher: (request) => {
        return request.destination === 'document';
      },
      handler: async (request) => {
        const cache = await caches.open('pages-v1');
        const cachedResponse = await cache.match(request);
        
        const fetchPromise = fetch(request).then(networkResponse => {
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        });
        
        return cachedResponse || fetchPromise;
      }
    },
    images: {
      name: 'Images',
      type: 'cacheFirst',
      cacheName: 'images-v1',
      options: {
        maxEntries: 200,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        purgeOnQuotaError: true
      },
      matcher: (request) => {
        return request.destination === 'image';
      },
      handler: async (request) => {
        const cache = await caches.open('images-v1');
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      }
    }
  };

  // Default configuration
  private defaultConfig: ServiceWorkerConfig = {
    enabled: true,
    version: '1.0.0',
    scope: '/',
    strategies: this.defaultStrategies,
    precaching: {
      enabled: true,
      assets: [
        '/',
        '/static/js/vendor.js',
        '/static/css/main.css',
        '/static/images/logo.png',
        '/static/images/placeholder.jpg'
      ],
      exclude: [
        '/api/',
        '/admin/',
        '/.well-known/'
      ]
    },
    runtimeCaching: {
      enabled: true,
      strategies: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
          handler: this.defaultStrategies.staticAssets,
          options: {
            cacheName: 'google-fonts-v1',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 30 * 24 * 60 * 60
            }
          }
        },
        {
          urlPattern: /^https:\/\/cdn\.jsdelivr\.net\//,
          handler: this.defaultStrategies.staticAssets,
          options: {
            cacheName: 'cdn-assets-v1',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 7 * 24 * 60 * 60
            }
          }
        }
      ]
    },
    backgroundSync: {
      enabled: true,
      queues: ['api-requests', 'form-submissions', 'analytics']
    },
    pushNotifications: {
      enabled: false,
      vapidKey: ''
    },
    offline: {
      enabled: true,
      fallback: '/offline.html',
      strategies: [
        {
          type: 'page',
          pattern: /^\/$/,
          fallback: '/offline.html',
          cacheName: 'pages-v1'
        },
        {
          type: 'image',
          pattern: /\.(jpg|jpeg|png|gif|webp)$/,
          fallback: '/static/images/placeholder.jpg',
          cacheName: 'images-v1'
        },
        {
          type: 'api',
          pattern: /^\/api\//,
          fallback: '/api/offline',
          cacheName: 'api-responses-v1'
        }
      ]
    }
  };

  static getInstance(): UltimateServiceWorkerService {
    if (!UltimateServiceWorkerService.instance) {
      UltimateServiceWorkerService.instance = new UltimateServiceWorkerService();
    }
    return UltimateServiceWorkerService.instance;
  }

  constructor() {
    this.config = { ...this.defaultConfig };
    this.metrics = {
      totalCaches: 0,
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      requestsServed: 0,
      requestsCached: 0,
      requestsFailed: 0,
      offlineRequests: 0,
      backgroundSyncEvents: 0,
      pushNotificationsSent: 0,
      cacheEfficiency: 0,
      storageUsed: 0,
      storageQuota: 0
    };
    this.backgroundSyncEvents = new Map();
  }

  // Initialize the service
  async initialize(): Promise<void> {
    console.log('🔧 Initializing service worker service...');
    
    try {
      // Check if service workers are supported
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service workers are not supported in this browser');
      }
      
      // Register service worker
      await this.registerServiceWorker();
      
      // Initialize caching strategies
      await this.initializeCachingStrategies();
      
      // Initialize background sync
      if (this.config.backgroundSync.enabled) {
        await this.initializeBackgroundSync();
      }
      
      // Initialize push notifications
      if (this.config.pushNotifications.enabled) {
        await this.initializePushNotifications();
      }
      
      // Start monitoring
      this.startMonitoring();
      
      this.isInitialized = true;
      console.log('✅ Service worker service initialized');
    } catch (error) {
      console.error('❌ Service worker service initialization failed:', error);
      throw error;
    }
  }

  // Register service worker
  private async registerServiceWorker(): Promise<void> {
    console.log('📝 Registering service worker...');
    
    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: this.config.scope
      });
      
      console.log('✅ Service worker registered successfully');
      
      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New service worker available');
              this.handleServiceWorkerUpdate();
            }
          });
        }
      });
    } catch (error) {
      console.error('❌ Service worker registration failed:', error);
      throw error;
    }
  }

  // Handle service worker update
  private handleServiceWorkerUpdate(): void {
    if (confirm('A new version of the app is available. Reload to update?')) {
      window.location.reload();
    }
  }

  // Initialize caching strategies
  private async initializeCachingStrategies(): Promise<void> {
    console.log('🗄️ Initializing caching strategies...');
    
    // Create caches for each strategy
    for (const [name, strategy] of Object.entries(this.config.strategies)) {
      await caches.open(strategy.cacheName);
      console.log(`✅ Cache created: ${strategy.cacheName}`);
    }
    
    // Precache assets if enabled
    if (this.config.precaching.enabled) {
      await this.precacheAssets();
    }
    
    console.log('✅ Caching strategies initialized');
  }

  // Precache assets
  private async precacheAssets(): Promise<void> {
    console.log('📦 Precaching assets...');
    
    const cache = await caches.open('precache-v1');
    const assetsToCache = this.config.precaching.assets.filter(asset => 
      !this.config.precaching.exclude.some(exclude => asset.includes(exclude))
    );
    
    for (const asset of assetsToCache) {
      try {
        const response = await fetch(asset);
        if (response.ok) {
          await cache.put(asset, response);
          console.log(`✅ Precached: ${asset}`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to precache ${asset}:`, error);
      }
    }
    
    console.log(`✅ Precached ${assetsToCache.length} assets`);
  }

  // Initialize background sync
  private async initializeBackgroundSync(): Promise<void> {
    console.log('🔄 Initializing background sync...');
    
    // Register background sync for each queue
    for (const queue of this.config.backgroundSync.queues) {
      try {
        await this.registerBackgroundSync(queue);
        console.log(`✅ Background sync registered for queue: ${queue}`);
      } catch (error) {
        console.warn(`⚠️ Failed to register background sync for queue ${queue}:`, error);
      }
    }
    
    console.log('✅ Background sync initialized');
  }

  // Register background sync
  private async registerBackgroundSync(queue: string): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(queue);
    }
  }

  // Initialize push notifications
  private async initializePushNotifications(): Promise<void> {
    console.log('🔔 Initializing push notifications...');
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.config.pushNotifications.vapidKey
      });
      
      console.log('✅ Push notifications initialized');
      return subscription;
    } catch (error) {
      console.warn('⚠️ Push notifications initialization failed:', error);
    }
  }

  // Add to background sync queue
  async addToBackgroundSync(queue: string, data: any): Promise<string> {
    if (!this.config.backgroundSync.enabled) {
      throw new Error('Background sync is not enabled');
    }
    
    const eventId = this.generateEventId();
    const event: BackgroundSyncEvent = {
      id: eventId,
      queue,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3,
      status: 'pending'
    };
    
    this.backgroundSyncEvents.set(eventId, event);
    this.metrics.backgroundSyncEvents++;
    
    // Register background sync
    await this.registerBackgroundSync(queue);
    
    console.log(`📝 Added to background sync queue ${queue}: ${eventId}`);
    return eventId;
  }

  // Process background sync event
  async processBackgroundSyncEvent(queue: string, event: any): Promise<void> {
    console.log(`🔄 Processing background sync event for queue: ${queue}`);
    
    const events = Array.from(this.backgroundSyncEvents.values())
      .filter(e => e.queue === queue && e.status === 'pending');
    
    for (const syncEvent of events) {
      try {
        syncEvent.status = 'processing';
        await this.executeBackgroundSyncEvent(syncEvent);
        syncEvent.status = 'completed';
        console.log(`✅ Background sync event completed: ${syncEvent.id}`);
      } catch (error) {
        syncEvent.retryCount++;
        if (syncEvent.retryCount >= syncEvent.maxRetries) {
          syncEvent.status = 'failed';
          console.error(`❌ Background sync event failed: ${syncEvent.id}`, error);
        } else {
          syncEvent.status = 'pending';
          console.warn(`⚠️ Background sync event retry ${syncEvent.retryCount}: ${syncEvent.id}`);
        }
      }
    }
  }

  // Execute background sync event
  private async executeBackgroundSyncEvent(event: BackgroundSyncEvent): Promise<void> {
    switch (event.queue) {
      case 'api-requests':
        await this.processAPIRequest(event.data);
        break;
      case 'form-submissions':
        await this.processFormSubmission(event.data);
        break;
      case 'analytics':
        await this.processAnalytics(event.data);
        break;
      default:
        console.warn(`⚠️ Unknown background sync queue: ${event.queue}`);
    }
  }

  // Process API request
  private async processAPIRequest(data: any): Promise<void> {
    console.log('🌐 Processing API request:', data);
    // Simulate API request processing
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Process form submission
  private async processFormSubmission(data: any): Promise<void> {
    console.log('📝 Processing form submission:', data);
    // Simulate form submission processing
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Process analytics
  private async processAnalytics(data: any): Promise<void> {
    console.log('📊 Processing analytics:', data);
    // Simulate analytics processing
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Cache request
  async cacheRequest(request: Request, response: Response, strategyName: string): Promise<void> {
    const strategy = this.config.strategies[strategyName];
    if (!strategy) {
      console.warn(`⚠️ Strategy ${strategyName} not found`);
      return;
    }
    
    if (strategy.matcher(request)) {
      const cache = await caches.open(strategy.cacheName);
      await cache.put(request, response.clone());
      this.metrics.requestsCached++;
      console.log(`✅ Request cached using strategy: ${strategyName}`);
    }
  }

  // Get cached response
  async getCachedResponse(request: Request, strategyName: string): Promise<Response | null> {
    const strategy = this.config.strategies[strategyName];
    if (!strategy) {
      return null;
    }
    
    if (strategy.matcher(request)) {
      const cache = await caches.open(strategy.cacheName);
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        this.metrics.requestsServed++;
        console.log(`✅ Cached response found for strategy: ${strategyName}`);
        return cachedResponse;
      }
    }
    
    return null;
  }

  // Clear cache
  async clearCache(cacheName?: string): Promise<void> {
    if (cacheName) {
      await caches.delete(cacheName);
      console.log(`🗑️ Cache cleared: ${cacheName}`);
    } else {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log(`🗑️ All caches cleared: ${cacheNames.length} caches`);
    }
  }

  // Get cache info
  async getCacheInfo(): Promise<{ name: string; size: number; entries: number }[]> {
    const cacheNames = await caches.keys();
    const cacheInfo = [];
    
    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      const size = await this.calculateCacheSize(cache);
      
      cacheInfo.push({
        name,
        size,
        entries: keys.length
      });
    }
    
    return cacheInfo;
  }

  // Calculate cache size
  private async calculateCacheSize(cache: Cache): Promise<number> {
    const keys = await cache.keys();
    let totalSize = 0;
    
    for (const key of keys) {
      const response = await cache.match(key);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
    
    return totalSize;
  }

  // Monitoring
  private startMonitoring(): void {
    setInterval(async () => {
      await this.updateMetrics();
    }, 30000); // Update every 30 seconds
  }

  private async updateMetrics(): Promise<void> {
    // Update cache metrics
    const cacheInfo = await this.getCacheInfo();
    this.metrics.totalCaches = cacheInfo.length;
    this.metrics.totalSize = cacheInfo.reduce((sum, cache) => sum + cache.size, 0);
    
    // Calculate hit rate
    const totalRequests = this.metrics.requestsServed + this.metrics.requestsFailed;
    this.metrics.hitRate = totalRequests > 0 ? (this.metrics.requestsServed / totalRequests) * 100 : 0;
    this.metrics.missRate = 100 - this.metrics.hitRate;
    
    // Calculate cache efficiency
    this.metrics.cacheEfficiency = this.metrics.requestsCached > 0 ? 
      (this.metrics.requestsServed / this.metrics.requestsCached) * 100 : 0;
    
    // Update storage usage
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      this.metrics.storageUsed = estimate.usage || 0;
      this.metrics.storageQuota = estimate.quota || 0;
    }
  }

  // Utility methods
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  getConfig(): ServiceWorkerConfig {
    return { ...this.config };
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  getBackgroundSyncEvents(): BackgroundSyncEvent[] {
    return Array.from(this.backgroundSyncEvents.values());
  }

  updateConfig(updates: Partial<ServiceWorkerConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log('📝 Service worker configuration updated');
  }

  // Health check
  async healthCheck(): Promise<{ status: string; metrics: CacheMetrics }> {
    return {
      status: this.isInitialized ? 'healthy' : 'stopped',
      metrics: this.metrics
    };
  }

  // Cleanup
  destroy(): void {
    this.backgroundSyncEvents.clear();
    this.isInitialized = false;
  }
}

export default UltimateServiceWorkerService;