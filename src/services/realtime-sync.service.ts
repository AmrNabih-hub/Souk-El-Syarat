/**
 * Real-Time Synchronization Service
 * Ensures all state updates happen in real-time without page refresh
 */

import { logger } from '@/utils/logger';
import { realtimeWebSocketService } from './realtime-websocket.service';
import type { User, VendorApplication, CarListing } from '@/types';

export class RealTimeSyncService {
  private static instance: RealTimeSyncService;
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();

  private constructor() {
    this.initializeSync();
  }

  static getInstance(): RealTimeSyncService {
    if (!RealTimeSyncService.instance) {
      RealTimeSyncService.instance = new RealTimeSyncService();
    }
    return RealTimeSyncService.instance;
  }

  /**
   * Initialize real-time synchronization
   */
  private initializeSync(): void {
    logger.info('Initializing real-time synchronization', {}, 'REALTIME');

    // Subscribe to vendor approval events
    realtimeWebSocketService.subscribe('VENDOR_APPROVED', (data) => {
      this.handleVendorApproval(data);
    });

    realtimeWebSocketService.subscribe('VENDOR_REJECTED', (data) => {
      this.handleVendorRejection(data);
    });

    // Subscribe to car listing events
    realtimeWebSocketService.subscribe('CAR_LISTING_APPROVED', (data) => {
      this.handleCarListingApproval(data);
    });

    realtimeWebSocketService.subscribe('CAR_LISTING_REJECTED', (data) => {
      this.handleCarListingRejection(data);
    });

    // Subscribe to order updates
    realtimeWebSocketService.subscribe('ORDER_STATUS_UPDATED', (data) => {
      this.handleOrderUpdate(data);
    });

    logger.info('Real-time synchronization initialized', {}, 'REALTIME');
  }

  /**
   * Handle vendor approval - Update user state in real-time
   */
  private handleVendorApproval(data: any): void {
    logger.info('Vendor approved - Syncing state', data, 'REALTIME');

    // Notify all subscribers
    this.notifySubscribers('vendor-status-change', {
      userId: data.vendorId,
      status: 'approved',
      timestamp: new Date().toISOString(),
    });

    // Update user role in auth store
    this.updateUserRole(data.vendorId, 'vendor');

    // Show congratulations notification
    this.showNotification({
      title: 'تهانينا! تم الموافقة على طلبك',
      message: 'أصبحت الآن تاجراً معتمداً في سوق السيارات',
      type: 'success',
      action: {
        label: 'انتقل إلى لوحة التحكم',
        url: '/vendor/dashboard',
      },
    });
  }

  /**
   * Handle vendor rejection
   */
  private handleVendorRejection(data: any): void {
    logger.info('Vendor rejected - Syncing state', data, 'REALTIME');

    this.notifySubscribers('vendor-status-change', {
      userId: data.vendorId,
      status: 'rejected',
      reason: data.reason,
      timestamp: new Date().toISOString(),
    });

    this.showNotification({
      title: 'نأسف، تم رفض طلبك',
      message: `السبب: ${data.reason}`,
      type: 'error',
      action: {
        label: 'إعادة التقديم',
        url: '/vendor/apply',
      },
    });
  }

  /**
   * Handle car listing approval
   */
  private handleCarListingApproval(data: any): void {
    logger.info('Car listing approved', data, 'REALTIME');

    this.notifySubscribers('car-listing-status', {
      listingId: data.listingId,
      status: 'approved',
      timestamp: new Date().toISOString(),
    });

    // Show congratulations notification
    this.showNotification({
      title: '🎉 تهانينا!',
      message: 'سيارتك الآن في سوق السيارات! سيتمكن المشترون من مشاهدتها',
      type: 'success',
      action: {
        label: 'شاهد إعلانك',
        url: `/product/${data.listingId}`,
      },
      duration: 10000, // 10 seconds
    });

    // Auto-refresh marketplace to show new listing
    this.triggerMarketplaceRefresh();
  }

  /**
   * Handle car listing rejection
   */
  private handleCarListingRejection(data: any): void {
    logger.info('Car listing rejected', data, 'REALTIME');

    this.notifySubscribers('car-listing-status', {
      listingId: data.listingId,
      status: 'rejected',
      reason: data.reason,
      timestamp: new Date().toISOString(),
    });

    this.showNotification({
      title: 'تم رفض الإعلان',
      message: `السبب: ${data.reason || 'لم يستوفي المتطلبات'}`,
      type: 'warning',
      action: {
        label: 'تعديل الإعلان',
        url: '/my-listings',
      },
    });
  }

  /**
   * Handle order status updates
   */
  private handleOrderUpdate(data: any): void {
    logger.info('Order status updated', data, 'REALTIME');

    this.notifySubscribers('order-status', {
      orderId: data.orderId,
      status: data.newStatus,
      timestamp: new Date().toISOString(),
    });

    const statusMessages = {
      confirmed: 'تم تأكيد طلبك',
      processing: 'جاري تجهيز طلبك',
      shipped: 'تم شحن طلبك',
      delivered: 'تم توصيل طلبك',
    };

    const message = statusMessages[data.newStatus as keyof typeof statusMessages] || 'تم تحديث حالة الطلب';

    this.showNotification({
      title: 'تحديث الطلب',
      message,
      type: 'info',
      action: {
        label: 'عرض الطلب',
        url: `/orders/${data.orderId}`,
      },
    });
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(event: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }

    this.subscribers.get(event)!.add(callback);

    logger.debug('Subscribed to real-time event', { event }, 'REALTIME');

    // Return unsubscribe function
    return () => {
      this.subscribers.get(event)?.delete(callback);
    };
  }

  /**
   * Notify subscribers of state change
   */
  private notifySubscribers(event: string, data: any): void {
    const callbacks = this.subscribers.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error('Error in subscriber callback', error, 'REALTIME');
        }
      });
    }
  }

  /**
   * Update user role in auth store
   */
  private async updateUserRole(userId: string, role: 'vendor' | 'customer' | 'admin'): Promise<void> {
    // Dynamically import to avoid circular dependencies
    const { useAuthStore } = await import('@/stores/authStore');
    const { user, setUser } = useAuthStore.getState();

    if (user && user.id === userId) {
      setUser({ ...user, role });
      logger.info('User role updated in real-time', { userId, role }, 'REALTIME');
    }
  }

  /**
   * Show toast notification
   */
  private showNotification(notification: {
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    action?: { label: string; url: string };
    duration?: number;
  }): void {
    // Dynamically import toast to avoid issues
    import('react-hot-toast').then(({ default: toast }) => {
      const { title, message, type, duration = 5000 } = notification;

      const toastMessage = `${title}: ${message}`;

      switch (type) {
        case 'success':
          toast.success(toastMessage, { duration });
          break;
        case 'error':
          toast.error(toastMessage, { duration });
          break;
        case 'warning':
          toast(toastMessage, { duration, icon: '⚠️' });
          break;
        case 'info':
          toast(toastMessage, { duration, icon: 'ℹ️' });
          break;
      }
    });
  }

  /**
   * Trigger marketplace refresh
   */
  private triggerMarketplaceRefresh(): void {
    this.notifySubscribers('marketplace-refresh', {
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Verify real-time connection health
   */
  async verifyConnection(): Promise<boolean> {
    try {
      const isConnected = realtimeWebSocketService.isConnected();
      logger.info('Real-time connection status', { isConnected }, 'REALTIME');
      return isConnected;
    } catch (error) {
      logger.error('Failed to verify connection', error, 'REALTIME');
      return false;
    }
  }

  /**
   * Force sync all data
   */
  async forceSyncAll(userId: string): Promise<void> {
    logger.info('Force syncing all data', { userId }, 'REALTIME');

    // Trigger sync for all relevant data
    this.notifySubscribers('force-sync', { userId });

    // Refresh user data
    // Refresh orders
    // Refresh products
    // Refresh notifications
  }
}

// Export singleton
export const realTimeSyncService = RealTimeSyncService.getInstance();
