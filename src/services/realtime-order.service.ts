/**
 * Enterprise Real-time Order Tracking Service
 * Professional implementation with WebSocket, Firebase Realtime DB, and advanced features
 */

import { 
  ref, 
  onValue, 
  off, 
  set, 
  update, 
  push, 
  serverTimestamp,
  query,
  orderByChild,
  equalTo,
  limitToLast
} from 'firebase/database';
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  increment 
} from 'firebase/firestore';
import { realtimeDb, db } from '@/config/firebase.config';
import { Order, OrderStatus, OrderTrackingEvent, User } from '@/types';

export interface RealTimeOrderData {
  orderId: string;
  status: OrderStatus;
  lastUpdated: Date;
  trackingEvents: OrderTrackingEvent[];
  estimatedDelivery?: Date;
  currentLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
  assignedDriver?: {
    id: string;
    name: string;
    phone: string;
    vehicle: string;
  };
  notifications: {
    customer: boolean;
    vendor: boolean;
    admin: boolean;
  };
}

export interface OrderTrackingEvent {
  id: string;
  status: OrderStatus;
  timestamp: Date;
  location?: string;
  description: string;
  actor: {
    type: 'system' | 'customer' | 'vendor' | 'admin' | 'driver';
    id: string;
    name: string;
  };
  metadata?: Record<string, any>;
}

export interface OrderTrackingSubscription {
  orderId: string;
  unsubscribe: () => void;
  lastEvent?: OrderTrackingEvent;
}

export class RealTimeOrderService {
  private static instance: RealTimeOrderService;
  private subscriptions: Map<string, OrderTrackingSubscription> = new Map();
  private eventListeners: Map<string, (event: OrderTrackingEvent) => void> = new Map();
  private isConnected = false;
  private connectionRetryCount = 0;
  private maxRetries = 5;

  static getInstance(): RealTimeOrderService {
    if (!RealTimeOrderService.instance) {
      RealTimeOrderService.instance = new RealTimeOrderService();
    }
    return RealTimeOrderService.instance;
  }

  /**
   * Initialize real-time connection with professional error handling
   */
  async initialize(): Promise<void> {
    try {
      // Test connection
      const testRef = ref(realtimeDb, '.info/connected');
      onValue(testRef, (snapshot) => {
        this.isConnected = snapshot.val() === true;
        if (this.isConnected) {
          console.log('✅ Real-time order tracking connected');
          this.connectionRetryCount = 0;
        } else {
          console.warn('⚠️ Real-time order tracking disconnected');
          this.handleConnectionLoss();
        }
      });

      // Set up connection monitoring
      this.monitorConnection();
    } catch (error) {
      console.error('❌ Failed to initialize real-time order tracking:', error);
      throw new Error('Real-time order tracking initialization failed');
    }
  }

  /**
   * Subscribe to real-time order tracking with professional error handling
   */
  async subscribeToOrderTracking(
    orderId: string,
    onUpdate: (orderData: RealTimeOrderData) => void,
    onError?: (error: Error) => void
  ): Promise<OrderTrackingSubscription> {
    try {
      if (!this.isConnected) {
        throw new Error('Real-time connection not available');
      }

      const orderRef = ref(realtimeDb, `orders/${orderId}`);
      
      const unsubscribe = onValue(orderRef, (snapshot) => {
        try {
          const data = snapshot.val();
          if (data) {
            const orderData: RealTimeOrderData = {
              orderId,
              status: data.status,
              lastUpdated: new Date(data.lastUpdated),
              trackingEvents: data.trackingEvents || [],
              estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : undefined,
              currentLocation: data.currentLocation,
              assignedDriver: data.assignedDriver,
              notifications: data.notifications || { customer: false, vendor: false, admin: false }
            };
            onUpdate(orderData);
          }
        } catch (error) {
          console.error('Error processing order update:', error);
          onError?.(error as Error);
        }
      }, (error) => {
        console.error('Real-time order tracking error:', error);
        onError?.(error);
      });

      const subscription: OrderTrackingSubscription = {
        orderId,
        unsubscribe
      };

      this.subscriptions.set(orderId, subscription);
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to order tracking:', error);
      throw error;
    }
  }

  /**
   * Update order status with real-time synchronization
   */
  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    actor: { type: 'system' | 'customer' | 'vendor' | 'admin' | 'driver'; id: string; name: string },
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const timestamp = new Date();
      const trackingEvent: OrderTrackingEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: newStatus,
        timestamp,
        description: this.getStatusDescription(newStatus),
        actor,
        metadata
      };

      // Update Firestore (primary database)
      const orderDocRef = doc(db, 'orders', orderId);
      await updateDoc(orderDocRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        lastStatusUpdate: serverTimestamp()
      });

      // Update Realtime Database for real-time tracking
      const orderRef = ref(realtimeDb, `orders/${orderId}`);
      await update(orderRef, {
        status: newStatus,
        lastUpdated: timestamp.toISOString(),
        trackingEvents: arrayUnion(trackingEvent)
      });

      // Add tracking event to Firestore
      const trackingEventRef = doc(db, 'orders', orderId, 'trackingEvents', trackingEvent.id);
      await set(trackingEventRef, trackingEvent);

      // Trigger real-time notifications
      await this.triggerOrderNotifications(orderId, trackingEvent);

      console.log(`✅ Order ${orderId} status updated to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update order status:', error);
      throw error;
    }
  }

  /**
   * Add custom tracking event
   */
  async addTrackingEvent(
    orderId: string,
    event: Omit<OrderTrackingEvent, 'id' | 'timestamp'>
  ): Promise<void> {
    try {
      const trackingEvent: OrderTrackingEvent = {
        ...event,
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      };

      // Update Realtime Database
      const orderRef = ref(realtimeDb, `orders/${orderId}/trackingEvents`);
      await push(orderRef, trackingEvent);

      // Add to Firestore
      const trackingEventRef = doc(db, 'orders', orderId, 'trackingEvents', trackingEvent.id);
      await set(trackingEventRef, trackingEvent);

      // Trigger notifications
      await this.triggerOrderNotifications(orderId, trackingEvent);
    } catch (error) {
      console.error('Failed to add tracking event:', error);
      throw error;
    }
  }

  /**
   * Update order location (for delivery tracking)
   */
  async updateOrderLocation(
    orderId: string,
    location: { lat: number; lng: number; address: string },
    driverId?: string
  ): Promise<void> {
    try {
      const orderRef = ref(realtimeDb, `orders/${orderId}`);
      await update(orderRef, {
        currentLocation: location,
        lastLocationUpdate: new Date().toISOString()
      });

      // Add location update event
      await this.addTrackingEvent(orderId, {
        status: 'shipped' as OrderStatus,
        description: `Location updated: ${location.address}`,
        actor: {
          type: 'driver',
          id: driverId || 'system',
          name: 'Delivery Driver'
        },
        metadata: { location }
      });
    } catch (error) {
      console.error('Failed to update order location:', error);
      throw error;
    }
  }

  /**
   * Assign driver to order
   */
  async assignDriver(
    orderId: string,
    driver: { id: string; name: string; phone: string; vehicle: string }
  ): Promise<void> {
    try {
      const orderRef = ref(realtimeDb, `orders/${orderId}`);
      await update(orderRef, {
        assignedDriver: driver,
        driverAssignedAt: new Date().toISOString()
      });

      // Add driver assignment event
      await this.addTrackingEvent(orderId, {
        status: 'processing' as OrderStatus,
        description: `Driver assigned: ${driver.name} (${driver.vehicle})`,
        actor: {
          type: 'admin',
          id: 'system',
          name: 'System Admin'
        },
        metadata: { driver }
      });
    } catch (error) {
      console.error('Failed to assign driver:', error);
      throw error;
    }
  }

  /**
   * Get order tracking history
   */
  async getOrderTrackingHistory(orderId: string): Promise<OrderTrackingEvent[]> {
    try {
      const trackingEventsRef = ref(realtimeDb, `orders/${orderId}/trackingEvents`);
      const snapshot = await new Promise((resolve, reject) => {
        onValue(trackingEventsRef, resolve, reject, { onlyOnce: true });
      });

      const events: OrderTrackingEvent[] = [];
      if (snapshot.val()) {
        Object.values(snapshot.val()).forEach((event: any) => {
          events.push({
            ...event,
            timestamp: new Date(event.timestamp)
          });
        });
      }

      return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Failed to get order tracking history:', error);
      throw error;
    }
  }

  /**
   * Subscribe to multiple orders (for vendor/admin dashboards)
   */
  async subscribeToMultipleOrders(
    orderIds: string[],
    onUpdate: (updates: Map<string, RealTimeOrderData>) => void,
    onError?: (error: Error) => void
  ): Promise<() => void> {
    try {
      const unsubscribers: (() => void)[] = [];
      const orderUpdates = new Map<string, RealTimeOrderData>();

      for (const orderId of orderIds) {
        const subscription = await this.subscribeToOrderTracking(
          orderId,
          (orderData) => {
            orderUpdates.set(orderId, orderData);
            onUpdate(new Map(orderUpdates));
          },
          onError
        );
        unsubscribers.push(subscription.unsubscribe);
      }

      return () => {
        unsubscribers.forEach(unsubscribe => unsubscribe());
      };
    } catch (error) {
      console.error('Failed to subscribe to multiple orders:', error);
      throw error;
    }
  }

  /**
   * Get real-time order statistics
   */
  async getRealTimeOrderStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
  }> {
    try {
      const ordersRef = ref(realtimeDb, 'orders');
      const snapshot = await new Promise((resolve, reject) => {
        onValue(ordersRef, resolve, reject, { onlyOnce: true });
      });

      const orders = snapshot.val() || {};
      const stats = {
        totalOrders: 0,
        pendingOrders: 0,
        processingOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0
      };

      Object.values(orders).forEach((order: any) => {
        stats.totalOrders++;
        switch (order.status) {
          case 'pending':
            stats.pendingOrders++;
            break;
          case 'processing':
            stats.processingOrders++;
            break;
          case 'shipped':
            stats.shippedOrders++;
            break;
          case 'delivered':
            stats.deliveredOrders++;
            break;
          case 'cancelled':
            stats.cancelledOrders++;
            break;
        }
      });

      return stats;
    } catch (error) {
      console.error('Failed to get real-time order stats:', error);
      throw error;
    }
  }

  /**
   * Cleanup subscriptions
   */
  unsubscribeFromOrder(orderId: string): void {
    const subscription = this.subscriptions.get(orderId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(orderId);
    }
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup(): void {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
    this.eventListeners.clear();
  }

  // Private helper methods

  private getStatusDescription(status: OrderStatus): string {
    const descriptions: Record<OrderStatus, string> = {
      pending: 'Order placed and awaiting confirmation',
      confirmed: 'Order confirmed by vendor',
      processing: 'Order is being prepared',
      shipped: 'Order has been shipped',
      delivered: 'Order has been delivered',
      cancelled: 'Order has been cancelled',
      refunded: 'Order has been refunded',
      disputed: 'Order is under dispute'
    };
    return descriptions[status] || 'Status updated';
  }

  private async triggerOrderNotifications(
    orderId: string,
    event: OrderTrackingEvent
  ): Promise<void> {
    try {
      // This would integrate with the notification service
      // For now, we'll just log the notification trigger
      console.log(`🔔 Notification triggered for order ${orderId}: ${event.description}`);
    } catch (error) {
      console.error('Failed to trigger order notifications:', error);
    }
  }

  private handleConnectionLoss(): void {
    if (this.connectionRetryCount < this.maxRetries) {
      this.connectionRetryCount++;
      console.log(`🔄 Attempting to reconnect (${this.connectionRetryCount}/${this.maxRetries})`);
      setTimeout(() => {
        this.initialize();
      }, 2000 * this.connectionRetryCount);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  private monitorConnection(): void {
    setInterval(() => {
      if (!this.isConnected) {
        console.warn('⚠️ Real-time connection lost, attempting reconnection...');
        this.handleConnectionLoss();
      }
    }, 30000); // Check every 30 seconds
  }
}

export default RealTimeOrderService;