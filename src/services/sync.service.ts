/**
 * 🔄 REAL-TIME SYNCHRONIZATION SERVICE
 * Ensures data consistency across all devices, browsers, and users
 */

import { 
  auth, 
  db, 
  realtimeDb 
} from '@/config/firebase.config';
import {
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  DocumentSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import {
  ref,
  onValue,
  set,
  onDisconnect,
  serverTimestamp as rtServerTimestamp,
  DataSnapshot,
  off
} from 'firebase/database';
import { User } from 'firebase/auth';

interface SyncConfig {
  enableOfflineSupport: boolean;
  syncInterval: number;
  conflictResolution: 'lastWrite' | 'merge' | 'manual';
  maxRetries: number;
  retryDelay: number;
}

interface SyncState {
  userId: string;
  deviceId: string;
  sessionId: string;
  lastSync: Date;
  pendingChanges: any[];
  isOnline: boolean;
  activeSessions: Map<string, SessionInfo>;
}

interface SessionInfo {
  deviceId: string;
  browser: string;
  os: string;
  lastActive: Date;
  isActive: boolean;
  location?: string;
}

interface SyncableData {
  cart: any[];
  wishlist: any[];
  preferences: any;
  notifications: any[];
  orders: any[];
  addresses: any[];
  recentViews: any[];
}

class SyncService {
  private static instance: SyncService;
  private config: SyncConfig;
  private syncState: SyncState | null = null;
  private listeners: Map<string, Unsubscribe> = new Map();
  private realtimeListeners: Map<string, any> = new Map();
  private syncQueue: Map<string, any> = new Map();
  private conflictQueue: Map<string, any> = new Map();
  private reconnectAttempts = 0;

  private constructor() {
    this.config = {
      enableOfflineSupport: true,
      syncInterval: 5000, // 5 seconds
      conflictResolution: 'merge',
      maxRetries: 3,
      retryDelay: 1000
    };

    this.initializeSync();
    this.setupNetworkMonitoring();
    this.setupCrossTabSync();
  }

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  /**
   * Initialize synchronization
   */
  private async initializeSync() {
    // Listen for auth changes
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        await this.setupUserSync(user);
      } else {
        this.cleanup();
      }
    });

    // Setup periodic sync
    setInterval(() => {
      this.performSync();
    }, this.config.syncInterval);
  }

  /**
   * Setup user-specific synchronization
   */
  private async setupUserSync(user: User) {
    const deviceId = this.getDeviceId();
    const sessionId = this.generateSessionId();

    this.syncState = {
      userId: user.uid,
      deviceId,
      sessionId,
      lastSync: new Date(),
      pendingChanges: [],
      isOnline: navigator.onLine,
      activeSessions: new Map()
    };

    // Setup real-time listeners
    await this.setupRealtimeListeners(user.uid);
    
    // Setup session management
    await this.setupSessionManagement(user.uid);
    
    // Initial sync
    await this.performInitialSync(user.uid);
    
    // Setup presence system
    await this.setupPresenceSystem(user.uid);
  }

  /**
   * Setup real-time listeners for user data
   */
  private async setupRealtimeListeners(userId: string) {
    // Cart sync
    const cartListener = onSnapshot(
      doc(db, 'carts', userId),
      (snapshot) => {
        this.handleDataSync('cart', snapshot);
      },
      (error) => {
        console.error('Cart sync error:', error);
        this.handleSyncError('cart', error);
      }
    );
    this.listeners.set('cart', cartListener);

    // Wishlist sync
    const wishlistListener = onSnapshot(
      doc(db, 'wishlists', userId),
      (snapshot) => {
        this.handleDataSync('wishlist', snapshot);
      }
    );
    this.listeners.set('wishlist', wishlistListener);

    // Orders sync
    const ordersListener = onSnapshot(
      query(collection(db, 'orders'), where('userId', '==', userId)),
      (snapshot) => {
        const orders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        this.handleCollectionSync('orders', orders);
      }
    );
    this.listeners.set('orders', ordersListener);

    // User preferences sync
    const preferencesListener = onSnapshot(
      doc(db, 'users', userId),
      (snapshot) => {
        this.handleDataSync('preferences', snapshot);
      }
    );
    this.listeners.set('preferences', preferencesListener);

    // Notifications sync
    const notificationsRef = ref(realtimeDb, `notifications/${userId}`);
    onValue(notificationsRef, (snapshot) => {
      this.handleRealtimeSync('notifications', snapshot);
    });

    // Real-time inventory updates for viewed products
    this.setupInventorySync();
  }

  /**
   * Setup inventory synchronization
   */
  private setupInventorySync() {
    // Listen to inventory changes for products in cart/recently viewed
    const inventoryRef = ref(realtimeDb, 'inventory');
    onValue(inventoryRef, (snapshot) => {
      const inventory = snapshot.val();
      if (inventory) {
        this.updateLocalInventory(inventory);
      }
    });
  }

  /**
   * Handle data synchronization
   */
  private handleDataSync(type: string, snapshot: DocumentSnapshot) {
    const data = snapshot.exists() ? snapshot.data() : null;
    
    // Check for conflicts
    if (this.hasConflict(type, data)) {
      this.resolveConflict(type, data);
    } else {
      // Update local state
      this.updateLocalState(type, data);
      
      // Notify all tabs
      this.broadcastUpdate(type, data);
    }
  }

  /**
   * Handle collection synchronization
   */
  private handleCollectionSync(type: string, data: any[]) {
    // Update local state
    this.updateLocalState(type, data);
    
    // Notify all tabs
    this.broadcastUpdate(type, data);
  }

  /**
   * Handle real-time database sync
   */
  private handleRealtimeSync(type: string, snapshot: DataSnapshot) {
    const data = snapshot.val();
    if (data) {
      this.updateLocalState(type, data);
      this.broadcastUpdate(type, data);
    }
  }

  /**
   * Check for conflicts
   */
  private hasConflict(type: string, remoteData: any): boolean {
    const localData = this.getLocalData(type);
    if (!localData || !remoteData) return false;

    // Check timestamps
    const localTimestamp = localData.updatedAt?.toMillis?.() || 0;
    const remoteTimestamp = remoteData.updatedAt?.toMillis?.() || 0;

    // If local has unsynced changes newer than remote
    return localTimestamp > remoteTimestamp && this.hasPendingChanges(type);
  }

  /**
   * Resolve conflicts based on strategy
   */
  private async resolveConflict(type: string, remoteData: any) {
    const localData = this.getLocalData(type);
    
    switch (this.config.conflictResolution) {
      case 'lastWrite':
        // Remote wins
        this.updateLocalState(type, remoteData);
        break;
        
      case 'merge':
        // Merge changes
        const mergedData = this.mergeData(localData, remoteData);
        await this.syncToFirebase(type, mergedData);
        break;
        
      case 'manual':
        // Queue for manual resolution
        this.conflictQueue.set(type, {
          local: localData,
          remote: remoteData,
          timestamp: new Date()
        });
        this.notifyConflict(type);
        break;
    }
  }

  /**
   * Merge data intelligently
   */
  private mergeData(local: any, remote: any): any {
    // For arrays (cart, wishlist), merge unique items
    if (Array.isArray(local) && Array.isArray(remote)) {
      const merged = [...local];
      remote.forEach(item => {
        const exists = merged.find(i => 
          i.id === item.id || i.productId === item.productId
        );
        if (!exists) {
          merged.push(item);
        } else {
          // Update quantities for cart items
          if (item.quantity !== undefined) {
            exists.quantity = Math.max(exists.quantity, item.quantity);
          }
        }
      });
      return merged;
    }

    // For objects, merge properties
    return {
      ...local,
      ...remote,
      updatedAt: serverTimestamp()
    };
  }

  /**
   * Setup session management across devices
   */
  private async setupSessionManagement(userId: string) {
    const sessionRef = ref(realtimeDb, `sessions/${userId}/${this.syncState?.sessionId}`);
    
    // Register this session
    await set(sessionRef, {
      deviceId: this.syncState?.deviceId,
      browser: this.getBrowserInfo(),
      os: this.getOSInfo(),
      startTime: rtServerTimestamp(),
      lastActive: rtServerTimestamp(),
      isActive: true
    });

    // Setup disconnect handler
    onDisconnect(sessionRef).update({
      isActive: false,
      endTime: rtServerTimestamp()
    });

    // Listen to all user sessions
    const allSessionsRef = ref(realtimeDb, `sessions/${userId}`);
    onValue(allSessionsRef, (snapshot) => {
      const sessions = snapshot.val();
      if (sessions) {
        this.updateActiveSessions(sessions);
      }
    });
  }

  /**
   * Setup presence system
   */
  private async setupPresenceSystem(userId: string) {
    const presenceRef = ref(realtimeDb, `presence/${userId}`);
    
    // Set online status
    await set(presenceRef, {
      status: 'online',
      lastSeen: rtServerTimestamp(),
      deviceId: this.syncState?.deviceId,
      sessionId: this.syncState?.sessionId
    });

    // Setup disconnect handler
    onDisconnect(presenceRef).update({
      status: 'offline',
      lastSeen: rtServerTimestamp()
    });

    // Update presence periodically
    setInterval(async () => {
      if (this.syncState?.isOnline) {
        await set(presenceRef, {
          status: 'online',
          lastSeen: rtServerTimestamp(),
          deviceId: this.syncState?.deviceId,
          sessionId: this.syncState?.sessionId
        });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Setup network monitoring
   */
  private setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      console.log('Network restored, syncing...');
      this.handleNetworkRestore();
    });

    window.addEventListener('offline', () => {
      console.log('Network lost, entering offline mode...');
      this.handleNetworkLoss();
    });
  }

  /**
   * Handle network restoration
   */
  private async handleNetworkRestore() {
    if (this.syncState) {
      this.syncState.isOnline = true;
      
      // Sync pending changes
      await this.syncPendingChanges();
      
      // Refresh all data
      await this.performFullSync();
      
      // Reset reconnect attempts
      this.reconnectAttempts = 0;
    }
  }

  /**
   * Handle network loss
   */
  private handleNetworkLoss() {
    if (this.syncState) {
      this.syncState.isOnline = false;
      
      // Switch to local storage
      this.enableOfflineMode();
    }
  }

  /**
   * Setup cross-tab synchronization
   */
  private setupCrossTabSync() {
    // Use BroadcastChannel for cross-tab communication
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('souk-sync');
      
      channel.onmessage = (event) => {
        this.handleCrossTabMessage(event.data);
      };
      
      // Store channel reference
      (window as any).syncChannel = channel;
    } else {
      // Fallback to localStorage events
      window.addEventListener('storage', (event) => {
        if (event.key?.startsWith('sync-')) {
          this.handleStorageSync(event);
        }
      });
    }
  }

  /**
   * Broadcast update to all tabs
   */
  private broadcastUpdate(type: string, data: any) {
    if ('BroadcastChannel' in window) {
      const channel = (window as any).syncChannel;
      channel?.postMessage({
        type: 'sync-update',
        dataType: type,
        data,
        timestamp: new Date().toISOString(),
        sessionId: this.syncState?.sessionId
      });
    } else {
      // Fallback to localStorage
      localStorage.setItem(`sync-${type}`, JSON.stringify({
        data,
        timestamp: new Date().toISOString()
      }));
    }
  }

  /**
   * Handle cross-tab messages
   */
  private handleCrossTabMessage(message: any) {
    if (message.type === 'sync-update' && 
        message.sessionId !== this.syncState?.sessionId) {
      // Update from another tab
      this.updateLocalState(message.dataType, message.data);
    }
  }

  /**
   * Sync pending changes to Firebase
   */
  private async syncPendingChanges() {
    if (!this.syncState?.pendingChanges.length) return;

    for (const change of this.syncState.pendingChanges) {
      try {
        await this.syncToFirebase(change.type, change.data);
        
        // Remove from pending
        this.syncState.pendingChanges = this.syncState.pendingChanges.filter(
          c => c !== change
        );
      } catch (error) {
        console.error('Failed to sync change:', error);
        
        if (this.reconnectAttempts < this.config.maxRetries) {
          this.reconnectAttempts++;
          setTimeout(() => this.syncPendingChanges(), this.config.retryDelay);
        }
      }
    }
  }

  /**
   * Sync data to Firebase
   */
  private async syncToFirebase(type: string, data: any) {
    if (!this.syncState) return;

    const userId = this.syncState.userId;

    switch (type) {
      case 'cart':
        await setDoc(doc(db, 'carts', userId), {
          items: data,
          updatedAt: serverTimestamp()
        });
        break;
        
      case 'wishlist':
        await setDoc(doc(db, 'wishlists', userId), {
          items: data,
          updatedAt: serverTimestamp()
        });
        break;
        
      case 'preferences':
        await updateDoc(doc(db, 'users', userId), {
          preferences: data,
          updatedAt: serverTimestamp()
        });
        break;
    }
  }

  /**
   * Perform full synchronization
   */
  private async performFullSync() {
    if (!this.syncState) return;

    console.log('Performing full sync...');
    
    try {
      // Sync all data types
      await Promise.all([
        this.syncCart(),
        this.syncWishlist(),
        this.syncOrders(),
        this.syncPreferences(),
        this.syncNotifications()
      ]);

      this.syncState.lastSync = new Date();
      console.log('Full sync completed');
    } catch (error) {
      console.error('Full sync failed:', error);
    }
  }

  /**
   * Perform periodic sync
   */
  private async performSync() {
    if (!this.syncState?.isOnline) return;
    
    // Check for pending changes
    if (this.syncState.pendingChanges.length > 0) {
      await this.syncPendingChanges();
    }
    
    // Update last sync time
    this.syncState.lastSync = new Date();
  }

  /**
   * Initial sync on login
   */
  private async performInitialSync(userId: string) {
    console.log('Performing initial sync...');
    
    // Load all user data
    await this.loadUserData(userId);
    
    // Setup local storage
    this.setupLocalStorage();
    
    console.log('Initial sync completed');
  }

  /**
   * Load user data from Firebase
   */
  private async loadUserData(userId: string) {
    // Implementation for loading all user data
    // This would fetch cart, wishlist, orders, etc.
  }

  /**
   * Setup local storage for offline support
   */
  private setupLocalStorage() {
    if (this.config.enableOfflineSupport) {
      // Setup IndexedDB for offline storage
      this.initIndexedDB();
    }
  }

  /**
   * Initialize IndexedDB
   */
  private async initIndexedDB() {
    // Implementation for IndexedDB setup
  }

  /**
   * Enable offline mode
   */
  private enableOfflineMode() {
    console.log('Offline mode enabled');
    // Switch to local storage operations
  }

  /**
   * Update local state
   */
  private updateLocalState(type: string, data: any) {
    // Update Zustand stores
    const event = new CustomEvent('sync-update', {
      detail: { type, data }
    });
    window.dispatchEvent(event);
  }

  /**
   * Get local data
   */
  private getLocalData(type: string): any {
    // Get from local storage or state
    return localStorage.getItem(`local-${type}`);
  }

  /**
   * Check for pending changes
   */
  private hasPendingChanges(type: string): boolean {
    return this.syncState?.pendingChanges.some(c => c.type === type) || false;
  }

  /**
   * Update active sessions
   */
  private updateActiveSessions(sessions: any) {
    this.syncState?.activeSessions.clear();
    
    Object.entries(sessions).forEach(([sessionId, info]: [string, any]) => {
      if (info.isActive) {
        this.syncState?.activeSessions.set(sessionId, info);
      }
    });
  }

  /**
   * Notify about conflicts
   */
  private notifyConflict(type: string) {
    const event = new CustomEvent('sync-conflict', {
      detail: { type, conflict: this.conflictQueue.get(type) }
    });
    window.dispatchEvent(event);
  }

  /**
   * Handle sync error
   */
  private handleSyncError(type: string, error: any) {
    console.error(`Sync error for ${type}:`, error);
    
    // Queue for retry
    if (this.syncState) {
      this.syncState.pendingChanges.push({
        type,
        data: this.getLocalData(type),
        error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Handle storage sync (fallback)
   */
  private handleStorageSync(event: StorageEvent) {
    if (event.newValue) {
      const data = JSON.parse(event.newValue);
      const type = event.key?.replace('sync-', '');
      if (type) {
        this.updateLocalState(type, data.data);
      }
    }
  }

  /**
   * Update local inventory
   */
  private updateLocalInventory(inventory: any) {
    // Update product quantities in real-time
    const event = new CustomEvent('inventory-update', {
      detail: inventory
    });
    window.dispatchEvent(event);
  }

  /**
   * Sync cart
   */
  private async syncCart() {
    // Implementation
  }

  /**
   * Sync wishlist
   */
  private async syncWishlist() {
    // Implementation
  }

  /**
   * Sync orders
   */
  private async syncOrders() {
    // Implementation
  }

  /**
   * Sync preferences
   */
  private async syncPreferences() {
    // Implementation
  }

  /**
   * Sync notifications
   */
  private async syncNotifications() {
    // Implementation
  }

  /**
   * Get device ID
   */
  private getDeviceId(): string {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get browser info
   */
  private getBrowserInfo(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf('Chrome') > -1) return 'Chrome';
    if (userAgent.indexOf('Safari') > -1) return 'Safari';
    if (userAgent.indexOf('Firefox') > -1) return 'Firefox';
    if (userAgent.indexOf('Edge') > -1) return 'Edge';
    return 'Unknown';
  }

  /**
   * Get OS info
   */
  private getOSInfo(): string {
    const platform = navigator.platform;
    if (platform.indexOf('Win') > -1) return 'Windows';
    if (platform.indexOf('Mac') > -1) return 'macOS';
    if (platform.indexOf('Linux') > -1) return 'Linux';
    if (platform.indexOf('Android') > -1) return 'Android';
    if (platform.indexOf('iOS') > -1) return 'iOS';
    return 'Unknown';
  }

  /**
   * Cleanup on logout
   */
  private cleanup() {
    // Clear all listeners
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
    
    // Clear realtime listeners
    this.realtimeListeners.forEach((listener, key) => {
      const [path] = key.split('-');
      off(ref(realtimeDb, path));
    });
    this.realtimeListeners.clear();
    
    // Clear state
    this.syncState = null;
    this.syncQueue.clear();
    this.conflictQueue.clear();
  }

  /**
   * Public API
   */
  
  public async forceSync() {
    await this.performFullSync();
  }

  public getConflicts() {
    return Array.from(this.conflictQueue.entries());
  }

  public async resolveConflictManually(type: string, resolution: 'local' | 'remote') {
    const conflict = this.conflictQueue.get(type);
    if (conflict) {
      const data = resolution === 'local' ? conflict.local : conflict.remote;
      await this.syncToFirebase(type, data);
      this.conflictQueue.delete(type);
    }
  }

  public getActiveSessions() {
    return Array.from(this.syncState?.activeSessions.values() || []);
  }

  public getLastSyncTime() {
    return this.syncState?.lastSync;
  }

  public isOnline() {
    return this.syncState?.isOnline || false;
  }

  public getPendingChangesCount() {
    return this.syncState?.pendingChanges.length || 0;
  }
}

export const syncService = SyncService.getInstance();