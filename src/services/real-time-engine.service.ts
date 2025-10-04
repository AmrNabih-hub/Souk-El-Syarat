/**
 * 🚀 Real-Time Engine Service
 * Enterprise-grade real-time features with WebSocket, push notifications, and live updates
 */

import { supabase } from '@/config/supabase.config';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface RealtimeSubscription {
  id: string;
  channel: RealtimeChannel;
  callback: (data: any) => void;
  filters?: Record<string, any>;
}

interface NotificationPayload {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
  metadata?: Record<string, any>;
}

interface LiveUpdateEvent {
  type: 'order_status' | 'new_message' | 'product_update' | 'vendor_application' | 'system_alert';
  data: any;
  timestamp: string;
  userId?: string;
  vendorId?: string;
}

class RealTimeEngineService {
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private eventListeners: Map<string, Array<(event: LiveUpdateEvent) => void>> = new Map();
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.initializeConnection();
    this.setupGlobalChannels();
  }

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  private initializeConnection(): void {
    supabase.realtime.onOpen(() => {
      console.log('✅ Real-time connection opened');
      this.connectionStatus = 'connected';
      this.reconnectAttempts = 0;
      this.emit('connection', { status: 'connected' });
    });

    supabase.realtime.onClose(() => {
      console.log('❌ Real-time connection closed');
      this.connectionStatus = 'disconnected';
      this.handleReconnection();
      this.emit('connection', { status: 'disconnected' });
    });

    supabase.realtime.onError((error) => {
      console.error('❌ Real-time connection error:', error);
      this.emit('connection', { status: 'error', error });
    });
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      
      console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connectionStatus = 'connecting';
        // Reestablish subscriptions
        this.reestablishSubscriptions();
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached');
      this.emit('connection', { status: 'failed', attempts: this.reconnectAttempts });
    }
  }

  private reestablishSubscriptions(): void {
    this.subscriptions.forEach((subscription, id) => {
      // Recreate subscription
      this.unsubscribe(id);
      // Re-subscribe with same parameters would need to be implemented based on use case
    });
  }

  private setupGlobalChannels(): void {
    // Global system events channel
    this.subscribeToChannel('system_events', 
      (payload) => this.handleSystemEvent(payload),
      { event: '*', schema: 'public' }
    );

    // User presence channel
    this.subscribeToPresence('user_presence');
  }

  // ============================================================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================================================

  subscribeToTable(
    table: string,
    callback: (payload: RealtimePostgresChangesPayload<any>) => void,
    filters?: { event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'; filter?: string }
  ): string {
    const subscriptionId = `${table}_${Date.now()}_${Math.random()}`;
    
    const channel = supabase
      .channel(subscriptionId)
      .on(
        'postgres_changes',
        {
          event: filters?.event || '*',
          schema: 'public',
          table,
          filter: filters?.filter
        },
        (payload) => {
          console.log(`📡 Real-time update for ${table}:`, payload);
          callback(payload);
          this.handleTableChange(table, payload);
        }
      )
      .subscribe((status) => {
        console.log(`🔌 Subscription status for ${table}:`, status);
      });

    this.subscriptions.set(subscriptionId, {
      id: subscriptionId,
      channel,
      callback,
      filters
    });

    return subscriptionId;
  }

  subscribeToChannel(
    channelName: string,
    callback: (payload: any) => void,
    config?: any
  ): string {
    const subscriptionId = `${channelName}_${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: '*' }, callback)
      .subscribe();

    this.subscriptions.set(subscriptionId, {
      id: subscriptionId,
      channel,
      callback
    });

    return subscriptionId;
  }

  subscribeToPresence(channelName: string): string {
    const subscriptionId = `presence_${channelName}_${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        this.emit('presence_sync', { channel: channelName, state });
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        this.emit('presence_join', { channel: channelName, key, presences: newPresences });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        this.emit('presence_leave', { channel: channelName, key, presences: leftPresences });
      })
      .subscribe();

    this.subscriptions.set(subscriptionId, {
      id: subscriptionId,
      channel,
      callback: () => {} // Presence doesn't use direct callbacks
    });

    return subscriptionId;
  }

  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      supabase.removeChannel(subscription.channel);
      this.subscriptions.delete(subscriptionId);
      return true;
    }
    return false;
  }

  unsubscribeAll(): void {
    this.subscriptions.forEach((subscription, id) => {
      this.unsubscribe(id);
    });
    this.subscriptions.clear();
  }

  // ============================================================================
  // LIVE FEATURES
  // ============================================================================

  // Live Order Tracking
  subscribeToOrderUpdates(orderId: string, callback: (order: any) => void): string {
    return this.subscribeToTable(
      'orders',
      (payload) => {
        if (payload.new && (payload.new as any).id === orderId) {
          callback(payload.new);
          this.sendNotification({
            title: 'Order Update',
            message: `Your order status has been updated to ${(payload.new as any).status}`,
            type: 'info',
            actionUrl: `/orders/${orderId}`
          });
        }
      },
      { filter: `id=eq.${orderId}` }
    );
  }

  // Live Chat
  subscribeToChat(roomId: string, callback: (message: any) => void): string {
    return this.subscribeToTable(
      'chat_messages',
      (payload) => {
        if (payload.eventType === 'INSERT' && (payload.new as any).room_id === roomId) {
          callback(payload.new);
        }
      },
      { event: 'INSERT', filter: `room_id=eq.${roomId}` }
    );
  }

  // Live Product Updates
  subscribeToProductUpdates(vendorId: string, callback: (product: any) => void): string {
    return this.subscribeToTable(
      'products',
      (payload) => {
        if ((payload.new as any)?.vendor_id === vendorId || (payload.old as any)?.vendor_id === vendorId) {
          callback(payload.new || payload.old);
        }
      },
      { filter: `vendor_id=eq.${vendorId}` }
    );
  }

  // Live Inventory Updates
  subscribeToInventoryUpdates(callback: (update: any) => void): string {
    return this.subscribeToTable(
      'products',
      (payload) => {
        if (payload.eventType === 'UPDATE') {
          const oldStock = (payload.old as any)?.stock_quantity || 0;
          const newStock = (payload.new as any)?.stock_quantity || 0;
          
          if (oldStock !== newStock) {
            callback({
              productId: (payload.new as any).id,
              oldStock,
              newStock,
              productName: (payload.new as any).name
            });

            // Send low stock alert
            if (newStock <= ((payload.new as any).min_stock_level || 5)) {
              this.sendNotification({
                title: 'Low Stock Alert',
                message: `${(payload.new as any).name} is running low on stock (${newStock} remaining)`,
                type: 'warning'
              });
            }
          }
        }
      }
    );
  }

  // ============================================================================
  // REAL-TIME NOTIFICATIONS
  // ============================================================================

  async sendNotification(payload: NotificationPayload, userId?: string): Promise<void> {
    try {
      if (userId) {
        // Send to specific user
        await supabase.from('notifications').insert({
          user_id: userId,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          action_url: payload.actionUrl,
          metadata: payload.metadata || {}
        });
      }

      // Broadcast to real-time channel
      const channel = supabase.channel('notifications');
      await channel.send({
        type: 'broadcast',
        event: 'notification',
        payload: {
          ...payload,
          userId,
          timestamp: new Date().toISOString()
        }
      });

      // Send push notification if supported
      await this.sendPushNotification(payload, userId);

    } catch (error) {
      console.error('❌ Error sending notification:', error);
    }
  }

  private async sendPushNotification(payload: NotificationPayload, userId?: string): Promise<void> {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration.pushManager) {
          // Implementation would depend on your push service setup
          console.log('📱 Push notification would be sent:', payload);
        }
      } catch (error) {
        console.error('❌ Error sending push notification:', error);
      }
    }
  }

  // Subscribe to notifications for current user
  subscribeToNotifications(userId: string, callback: (notification: any) => void): string {
    const channelName = `notifications_${userId}`;
    
    // Subscribe to database changes
    const dbSubscription = this.subscribeToTable(
      'notifications',
      (payload) => {
        if (payload.eventType === 'INSERT' && (payload.new as any).user_id === userId) {
          callback(payload.new);
        }
      },
      { event: 'INSERT', filter: `user_id=eq.${userId}` }
    );

    // Subscribe to real-time broadcasts
    const broadcastSubscription = this.subscribeToChannel(
      'notifications',
      (payload) => {
        if (!payload.userId || payload.userId === userId) {
          callback(payload);
        }
      }
    );

    return dbSubscription; // Return one of the subscriptions for cleanup
  }

  // ============================================================================
  // EVENT SYSTEM
  // ============================================================================

  on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // ============================================================================
  // SPECIALIZED HANDLERS
  // ============================================================================

  private handleTableChange(table: string, payload: RealtimePostgresChangesPayload<any>): void {
    const event: LiveUpdateEvent = {
      type: this.mapTableToEventType(table),
      data: payload.new || payload.old,
      timestamp: new Date().toISOString()
    };

    this.emit('table_change', { table, event, payload });

    // Handle specific business logic
    switch (table) {
      case 'orders':
        this.handleOrderChange(payload);
        break;
      case 'products':
        this.handleProductChange(payload);
        break;
      case 'vendors':
        this.handleVendorChange(payload);
        break;
      case 'chat_messages':
        this.handleChatMessage(payload);
        break;
    }
  }

  private handleSystemEvent(payload: any): void {
    console.log('🔔 System event received:', payload);
    this.emit('system_event', payload);
  }

  private handleOrderChange(payload: RealtimePostgresChangesPayload<any>): void {
    if (payload.eventType === 'UPDATE') {
      const oldStatus = (payload.old as any)?.status;
      const newStatus = (payload.new as any)?.status;
      
      if (oldStatus !== newStatus) {
        this.emit('order_status_change', {
          orderId: (payload.new as any).id,
          oldStatus,
          newStatus,
          customerId: (payload.new as any).customer_id
        });
      }
    }
  }

  private handleProductChange(payload: RealtimePostgresChangesPayload<any>): void {
    if (payload.eventType === 'INSERT') {
      this.emit('new_product', payload.new);
    } else if (payload.eventType === 'UPDATE') {
      this.emit('product_updated', {
        product: payload.new,
        changes: this.getChanges(payload.old, payload.new)
      });
    }
  }

  private handleVendorChange(payload: RealtimePostgresChangesPayload<any>): void {
    if (payload.eventType === 'UPDATE') {
      const oldStatus = (payload.old as any)?.verification_status;
      const newStatus = (payload.new as any)?.verification_status;
      
      if (oldStatus !== newStatus) {
        this.emit('vendor_verification_change', {
          vendorId: (payload.new as any).id,
          oldStatus,
          newStatus,
          userId: (payload.new as any).user_id
        });
      }
    }
  }

  private handleChatMessage(payload: RealtimePostgresChangesPayload<any>): void {
    if (payload.eventType === 'INSERT') {
      this.emit('new_chat_message', payload.new);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private mapTableToEventType(table: string): LiveUpdateEvent['type'] {
    const mapping: Record<string, LiveUpdateEvent['type']> = {
      'orders': 'order_status',
      'chat_messages': 'new_message',
      'products': 'product_update',
      'vendors': 'vendor_application'
    };
    return mapping[table] || 'system_alert';
  }

  private getChanges(oldData: any, newData: any): Record<string, { old: any; new: any }> {
    const changes: Record<string, { old: any; new: any }> = {};
    
    Object.keys(newData || {}).forEach(key => {
      if (oldData?.[key] !== newData?.[key]) {
        changes[key] = {
          old: oldData?.[key],
          new: newData?.[key]
        };
      }
    });
    
    return changes;
  }

  // ============================================================================
  // STATUS & MONITORING
  // ============================================================================

  getConnectionStatus(): string {
    return this.connectionStatus;
  }

  getActiveSubscriptions(): Array<{ id: string; filters?: any }> {
    return Array.from(this.subscriptions.values()).map(sub => ({
      id: sub.id,
      filters: sub.filters
    }));
  }

  getStatistics(): {
    activeSubscriptions: number;
    connectionStatus: string;
    reconnectAttempts: number;
    eventListeners: number;
  } {
    return {
      activeSubscriptions: this.subscriptions.size,
      connectionStatus: this.connectionStatus,
      reconnectAttempts: this.reconnectAttempts,
      eventListeners: Array.from(this.eventListeners.values()).reduce((sum, listeners) => sum + listeners.length, 0)
    };
  }

  // Cleanup method
  destroy(): void {
    this.unsubscribeAll();
    this.eventListeners.clear();
    console.log('🧹 Real-time engine cleaned up');
  }
}

// Create singleton instance
export const realTimeEngine = new RealTimeEngineService();
export default realTimeEngine;