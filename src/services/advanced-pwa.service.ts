/**
 * Advanced PWA Service
 * Offline-first architecture, background sync, and advanced PWA features
 */

import { logger } from '@/utils/logger';

export interface PWACapabilities {
  offlineSupport: boolean;
  backgroundSync: boolean;
  pushNotifications: boolean;
  installable: boolean;
  shareable: boolean;
  camera: boolean;
  geolocation: boolean;
  storage: boolean;
}

export interface OfflineData {
  products: any[];
  userData: any;
  cart: any[];
  favorites: any[];
  lastSync: Date;
  pendingActions: any[];
}

export interface BackgroundSyncTask {
  id: string;
  type: 'sync_cart' | 'sync_favorites' | 'sync_orders' | 'upload_images';
  data: any;
  priority: 'low' | 'medium' | 'high';
  retries: number;
  maxRetries: number;
  createdAt: Date;
  lastAttempt?: Date;
}

export interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export interface PWAConfig {
  enableOfflineMode: boolean;
  enableBackgroundSync: boolean;
  enablePushNotifications: boolean;
  enableInstallPrompt: boolean;
  cacheStrategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
  maxCacheSize: number;
  syncInterval: number;
}

export class AdvancedPWAService {
  private static instance: AdvancedPWAService;
  private config: PWAConfig;
  private capabilities: PWACapabilities;
  private offlineData: OfflineData;
  private backgroundSyncTasks: Map<string, BackgroundSyncTask> = new Map();
  private serviceWorker: ServiceWorker | null = null;
  private isOnline: boolean = navigator.onLine;

  public static getInstance(): AdvancedPWAService {
    if (!AdvancedPWAService.instance) {
      AdvancedPWAService.instance = new AdvancedPWAService();
    }
    return AdvancedPWAService.instance;
  }

  constructor() {
    this.config = {
      enableOfflineMode: true,
      enableBackgroundSync: true,
      enablePushNotifications: true,
      enableInstallPrompt: true,
      cacheStrategy: 'stale-while-revalidate',
      maxCacheSize: 50 * 1024 * 1024, // 50MB
      syncInterval: 30000 // 30 seconds
    };

    this.capabilities = {
      offlineSupport: false,
      backgroundSync: false,
      pushNotifications: false,
      installable: false,
      shareable: false,
      camera: false,
      geolocation: false,
      storage: false
    };

    this.offlineData = {
      products: [],
      userData: {},
      cart: [],
      favorites: [],
      lastSync: new Date(),
      pendingActions: []
    };
  }

  /**
   * Initialize advanced PWA features
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing advanced PWA service', {}, 'PWA');
      
      // Check PWA capabilities
      await this.checkPWACapabilities();
      
      // Initialize service worker
      await this.initializeServiceWorker();
      
      // Initialize offline support
      if (this.config.enableOfflineMode) {
        await this.initializeOfflineSupport();
      }
      
      // Initialize background sync
      if (this.config.enableBackgroundSync) {
        await this.initializeBackgroundSync();
      }
      
      // Initialize push notifications
      if (this.config.enablePushNotifications) {
        await this.initializePushNotifications();
      }
      
      // Initialize install prompt
      if (this.config.enableInstallPrompt) {
        await this.initializeInstallPrompt();
      }
      
      // Start background sync
      this.startBackgroundSync();
      
      logger.info('Advanced PWA service initialized', {}, 'PWA');
    } catch (error) {
      logger.error('Failed to initialize PWA service', error, 'PWA');
      throw error;
    }
  }

  /**
   * Check PWA capabilities
   */
  async checkPWACapabilities(): Promise<PWACapabilities> {
    try {
      logger.info('Checking PWA capabilities', {}, 'PWA');
      
      // Check offline support
      this.capabilities.offlineSupport = 'serviceWorker' in navigator;
      
      // Check background sync
      this.capabilities.backgroundSync = 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype;
      
      // Check push notifications
      this.capabilities.pushNotifications = 'Notification' in window && 'PushManager' in window;
      
      // Check installable
      this.capabilities.installable = this.checkInstallability();
      
      // Check shareable
      this.capabilities.shareable = 'share' in navigator;
      
      // Check camera
      this.capabilities.camera = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
      
      // Check geolocation
      this.capabilities.geolocation = 'geolocation' in navigator;
      
      // Check storage
      this.capabilities.storage = 'indexedDB' in window;
      
      logger.info('PWA capabilities checked', this.capabilities, 'PWA');
      return this.capabilities;
    } catch (error) {
      logger.error('Failed to check PWA capabilities', error, 'PWA');
      return this.capabilities;
    }
  }

  /**
   * Cache data for offline use
   */
  async cacheData(key: string, data: any): Promise<void> {
    try {
      logger.info('Caching data for offline use', { key }, 'PWA');
      
      // Store in IndexedDB
      await this.storeInIndexedDB(key, data);
      
      // Update offline data
      this.offlineData.lastSync = new Date();
      
      logger.info('Data cached successfully', { key }, 'PWA');
    } catch (error) {
      logger.error('Failed to cache data', error, 'PWA');
      throw error;
    }
  }

  /**
   * Get cached data
   */
  async getCachedData(key: string): Promise<any> {
    try {
      // Try to get from IndexedDB
      const data = await this.getFromIndexedDB(key);
      return data;
    } catch (error) {
      logger.error('Failed to get cached data', error, 'PWA');
      return null;
    }
  }

  /**
   * Add background sync task
   */
  async addBackgroundSyncTask(task: Omit<BackgroundSyncTask, 'id' | 'createdAt'>): Promise<string> {
    try {
      const taskId = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const syncTask: BackgroundSyncTask = {
        id: taskId,
        createdAt: new Date(),
        ...task
      };
      
      this.backgroundSyncTasks.set(taskId, syncTask);
      
      // Register with service worker if available
      if (this.serviceWorker && 'sync' in window.ServiceWorkerRegistration.prototype) {
        await navigator.serviceWorker.ready;
        // Note: Background sync is not widely supported yet
        // await navigator.serviceWorker.sync.register(taskId);
      }
      
      logger.info('Background sync task added', { taskId, type: task.type }, 'PWA');
      return taskId;
    } catch (error) {
      logger.error('Failed to add background sync task', error, 'PWA');
      throw error;
    }
  }

  /**
   * Send push notification
   */
  async sendPushNotification(notification: PushNotification): Promise<void> {
    try {
      if (!this.capabilities.pushNotifications) {
        throw new Error('Push notifications not supported');
      }
      
      // Request permission if not granted
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }
      
      // Send notification
      const notificationInstance = new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/icon-192x192.png',
        badge: notification.badge || '/icon-192x192.png',
        data: notification.data,
        // actions: notification.actions // Not widely supported yet
      });
      
      // Auto-close after 5 seconds
      setTimeout(() => {
        notificationInstance.close();
      }, 5000);
      
      logger.info('Push notification sent', { title: notification.title }, 'PWA');
    } catch (error) {
      logger.error('Failed to send push notification', error, 'PWA');
      throw error;
    }
  }

  /**
   * Install PWA
   */
  async installPWA(): Promise<boolean> {
    try {
      if (!this.capabilities.installable) {
        throw new Error('PWA is not installable');
      }
      
      // Check if already installed
      if (window.matchMedia('(display-mode: standalone)').matches) {
        return true; // Already installed
      }
      
      // Show install prompt
      let deferredPrompt = (window as any).deferredPrompt;
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        (window as any).deferredPrompt = null;
        
        return outcome === 'accepted';
      }
      
      return false;
    } catch (error) {
      logger.error('Failed to install PWA', error, 'PWA');
      return false;
    }
  }

  /**
   * Share content
   */
  async shareContent(shareData: {
    title: string;
    text: string;
    url: string;
  }): Promise<boolean> {
    try {
      if (!this.capabilities.shareable) {
        throw new Error('Web Share API not supported');
      }
      
      await navigator.share(shareData);
      logger.info('Content shared successfully', shareData, 'PWA');
      return true;
    } catch (error) {
      logger.error('Failed to share content', error, 'PWA');
      return false;
    }
  }

  /**
   * Get offline status
   */
  getOfflineStatus(): {
    isOnline: boolean;
    lastSync: Date;
    pendingActions: number;
    cacheSize: number;
  } {
    return {
      isOnline: this.isOnline,
      lastSync: this.offlineData.lastSync,
      pendingActions: this.offlineData.pendingActions.length,
      cacheSize: this.getCacheSize()
    };
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    try {
      logger.info('Clearing PWA cache', {}, 'PWA');
      
      // Clear IndexedDB
      await this.clearIndexedDB();
      
      // Clear service worker cache
      if (this.serviceWorker) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // Reset offline data
      this.offlineData = {
        products: [],
        userData: {},
        cart: [],
        favorites: [],
        lastSync: new Date(),
        pendingActions: []
      };
      
      logger.info('PWA cache cleared', {}, 'PWA');
    } catch (error) {
      logger.error('Failed to clear cache', error, 'PWA');
      throw error;
    }
  }

  private async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        this.serviceWorker = registration.active;
        logger.info('Service worker registered', {}, 'PWA');
      } catch (error) {
        logger.error('Failed to register service worker', error, 'PWA');
      }
    }
  }

  private async initializeOfflineSupport(): Promise<void> {
    logger.info('Initializing offline support', {}, 'PWA');
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineData();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private async initializeBackgroundSync(): Promise<void> {
    logger.info('Initializing background sync', {}, 'PWA');
  }

  private async initializePushNotifications(): Promise<void> {
    logger.info('Initializing push notifications', {}, 'PWA');
    
    // Request notification permission
    if (this.capabilities.pushNotifications) {
      const permission = await Notification.requestPermission();
      logger.info('Notification permission', { permission }, 'PWA');
    }
  }

  private async initializeInstallPrompt(): Promise<void> {
    logger.info('Initializing install prompt', {}, 'PWA');
    
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      this.capabilities.installable = true;
    });
  }

  private startBackgroundSync(): void {
    if (this.config.enableBackgroundSync) {
      setInterval(() => {
        this.processBackgroundSyncTasks();
      }, this.config.syncInterval);
    }
  }

  private async processBackgroundSyncTasks(): Promise<void> {
    for (const [taskId, task] of this.backgroundSyncTasks) {
      try {
        if (task.retries >= task.maxRetries) {
          this.backgroundSyncTasks.delete(taskId);
          continue;
        }
        
        task.lastAttempt = new Date();
        task.retries++;
        
        // Simulate task processing
        await this.processSyncTask(task);
        
        // Remove completed task
        this.backgroundSyncTasks.delete(taskId);
        
        logger.info('Background sync task completed', { taskId, type: task.type }, 'PWA');
      } catch (error) {
        logger.error('Background sync task failed', { taskId, error: error.message }, 'PWA');
      }
    }
  }

  private async processSyncTask(task: BackgroundSyncTask): Promise<void> {
    // Simulate task processing based on type
    switch (task.type) {
      case 'sync_cart':
        await this.syncCartData(task.data);
        break;
      case 'sync_favorites':
        await this.syncFavoritesData(task.data);
        break;
      case 'sync_orders':
        await this.syncOrdersData(task.data);
        break;
      case 'upload_images':
        await this.uploadImages(task.data);
        break;
    }
  }

  private async syncOfflineData(): Promise<void> {
    logger.info('Syncing offline data', {}, 'PWA');
    
    // Process pending actions
    for (const action of this.offlineData.pendingActions) {
      try {
        await this.processPendingAction(action);
      } catch (error) {
        logger.error('Failed to process pending action', error, 'PWA');
      }
    }
    
    this.offlineData.pendingActions = [];
    this.offlineData.lastSync = new Date();
  }

  private async processPendingAction(action: any): Promise<void> {
    // Process pending action based on type
    logger.info('Processing pending action', { type: action.type }, 'PWA');
  }

  private checkInstallability(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window as any).deferredPrompt !== undefined;
  }

  private async storeInIndexedDB(key: string, data: any): Promise<void> {
    // Simulate IndexedDB storage
    localStorage.setItem(`pwa-cache-${key}`, JSON.stringify(data));
  }

  private async getFromIndexedDB(key: string): Promise<any> {
    // Simulate IndexedDB retrieval
    const data = localStorage.getItem(`pwa-cache-${key}`);
    return data ? JSON.parse(data) : null;
  }

  private async clearIndexedDB(): Promise<void> {
    // Simulate IndexedDB clearing
    const keys = Object.keys(localStorage).filter(key => key.startsWith('pwa-cache-'));
    keys.forEach(key => localStorage.removeItem(key));
  }

  private getCacheSize(): number {
    // Calculate cache size
    let size = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        size += localStorage[key].length;
      }
    }
    return size;
  }

  private async syncCartData(data: any): Promise<void> {
    logger.info('Syncing cart data', {}, 'PWA');
  }

  private async syncFavoritesData(data: any): Promise<void> {
    logger.info('Syncing favorites data', {}, 'PWA');
  }

  private async syncOrdersData(data: any): Promise<void> {
    logger.info('Syncing orders data', {}, 'PWA');
  }

  private async uploadImages(data: any): Promise<void> {
    logger.info('Uploading images', {}, 'PWA');
  }
}

export const advancedPWAService = AdvancedPWAService.getInstance();
