/**
 * ⚡ Supabase Realtime Service
 * Professional real-time service using Supabase Realtime
 * Documentation: https://supabase.com/docs/guides/realtime
 */

import { supabase, supabaseConfig } from '@/config/supabase.config';
import type { RealtimeChannel, RealtimeChannelSendResponse } from '@supabase/supabase-js';

export interface RealtimeEvent<T = any> {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  old_record?: T;
  new_record?: T;
  errors?: string[];
}

export interface PresenceState {
  [key: string]: any;
}

export interface BroadcastMessage {
  type: string;
  payload: any;
  timestamp?: number;
}

class SupabaseRealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();

  /**
   * Subscribe to database changes for a specific table
   */
  subscribeToTable<T = any>(
    tableName: string,
    callback: (event: RealtimeEvent<T>) => void,
    options?: {
      event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
      schema?: string;
      filter?: string;
    }
  ): RealtimeChannel {
    const channelName = `table_${tableName}_${options?.event || 'all'}`;
    
    // Check if channel already exists
    if (this.channels.has(channelName)) {
      console.warn(`⚠️ Channel ${channelName} already exists`);
      return this.channels.get(channelName)!;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: options?.event || '*',
          schema: options?.schema || 'public',
          table: tableName,
          filter: options?.filter,
        },
        (payload) => {
          console.log(`🔄 Table ${tableName} changed:`, payload);
          callback({
            type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            table: payload.table,
            schema: payload.schema,
            old_record: payload.old,
            new_record: payload.new,
            errors: payload.errors,
          });
        }
      )
      .subscribe((status) => {
        console.log(`📡 Subscription status for ${tableName}:`, status);
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to specific record changes
   */
  subscribeToRecord<T = any>(
    tableName: string,
    recordId: string,
    callback: (event: RealtimeEvent<T>) => void,
    options?: {
      event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
      schema?: string;
    }
  ): RealtimeChannel {
    const filter = `id=eq.${recordId}`;
    const channelName = `record_${tableName}_${recordId}`;

    return this.subscribeToTable(tableName, callback, {
      ...options,
      filter,
    });
  }

  /**
   * Subscribe to user-specific changes (using user_id filter)
   */
  subscribeToUserData<T = any>(
    tableName: string,
    userId: string,
    callback: (event: RealtimeEvent<T>) => void,
    options?: {
      event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
      schema?: string;
    }
  ): RealtimeChannel {
    const filter = `user_id=eq.${userId}`;
    const channelName = `user_${tableName}_${userId}`;

    return this.subscribeToTable(tableName, callback, {
      ...options,
      filter,
    });
  }

  /**
   * Create a presence channel for tracking online users
   */
  createPresenceChannel(
    channelName: string,
    initialState: PresenceState,
    callbacks: {
      onJoin?: (key: string, currentPresences: PresenceState, newPresences: PresenceState) => void;
      onLeave?: (key: string, currentPresences: PresenceState, leftPresences: PresenceState) => void;
      onSync?: () => void;
    }
  ): RealtimeChannel {
    const fullChannelName = `presence_${channelName}`;

    // Check if channel already exists
    if (this.channels.has(fullChannelName)) {
      console.warn(`⚠️ Presence channel ${fullChannelName} already exists`);
      return this.channels.get(fullChannelName)!;
    }

    const channel = supabase
      .channel(fullChannelName, {
        config: {
          presence: {
            key: initialState.user_id || 'anonymous',
          },
        },
      })
      .on('presence', { event: 'sync' }, () => {
        console.log('👥 Presence synced');
        callbacks.onSync?.();
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('👋 User joined:', key);
        callbacks.onJoin?.(key, channel.presenceState(), newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('👋 User left:', key);
        callbacks.onLeave?.(key, channel.presenceState(), leftPresences);
      })
      .subscribe(async (status) => {
        console.log(`📡 Presence channel ${channelName} status:`, status);
        if (status === 'SUBSCRIBED') {
          // Track presence
          await channel.track(initialState);
        }
      });

    this.channels.set(fullChannelName, channel);
    return channel;
  }

  /**
   * Update presence state
   */
  async updatePresence(channelName: string, newState: PresenceState): Promise<void> {
    const fullChannelName = `presence_${channelName}`;
    const channel = this.channels.get(fullChannelName);

    if (!channel) {
      console.error(`❌ Presence channel ${fullChannelName} not found`);
      return;
    }

    try {
      await channel.track(newState);
      console.log('✅ Presence updated:', newState);
    } catch (error) {
      console.error('❌ Update presence error:', error);
    }
  }

  /**
   * Get current presence state
   */
  getPresenceState(channelName: string): PresenceState {
    const fullChannelName = `presence_${channelName}`;
    const channel = this.channels.get(fullChannelName);

    if (!channel) {
      console.error(`❌ Presence channel ${fullChannelName} not found`);
      return {};
    }

    return channel.presenceState();
  }

  /**
   * Create a broadcast channel for real-time messaging
   */
  createBroadcastChannel(
    channelName: string,
    callback: (message: BroadcastMessage) => void
  ): RealtimeChannel {
    const fullChannelName = `broadcast_${channelName}`;

    // Check if channel already exists
    if (this.channels.has(fullChannelName)) {
      console.warn(`⚠️ Broadcast channel ${fullChannelName} already exists`);
      return this.channels.get(fullChannelName)!;
    }

    const channel = supabase
      .channel(fullChannelName)
      .on('broadcast', { event: 'message' }, (payload) => {
        console.log('📨 Broadcast message received:', payload);
        callback({
          type: payload.type || 'message',
          payload: payload.payload,
          timestamp: payload.timestamp || Date.now(),
        });
      })
      .subscribe((status) => {
        console.log(`📡 Broadcast channel ${channelName} status:`, status);
      });

    this.channels.set(fullChannelName, channel);
    return channel;
  }

  /**
   * Send broadcast message
   */
  async sendBroadcast(
    channelName: string,
    message: Omit<BroadcastMessage, 'timestamp'>
  ): Promise<RealtimeChannelSendResponse> {
    const fullChannelName = `broadcast_${channelName}`;
    const channel = this.channels.get(fullChannelName);

    if (!channel) {
      throw new Error(`❌ Broadcast channel ${fullChannelName} not found`);
    }

    try {
      const response = await channel.send({
        type: 'broadcast',
        event: 'message',
        ...message,
        timestamp: Date.now(),
      });

      console.log('✅ Broadcast sent:', message);
      return response;
    } catch (error) {
      console.error('❌ Send broadcast error:', error);
      throw error;
    }
  }

  /**
   * Create a chat room channel
   */
  createChatChannel(
    roomId: string,
    userId: string,
    callbacks: {
      onMessage?: (message: any) => void;
      onUserJoin?: (user: any) => void;
      onUserLeave?: (user: any) => void;
      onTyping?: (data: { userId: string; isTyping: boolean }) => void;
    }
  ): RealtimeChannel {
    const channelName = `chat_${roomId}`;

    // Check if channel already exists
    if (this.channels.has(channelName)) {
      console.warn(`⚠️ Chat channel ${channelName} already exists`);
      return this.channels.get(channelName)!;
    }

    const channel = supabase
      .channel(channelName, {
        config: {
          presence: { key: userId },
        },
      })
      // Database changes for messages
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log('💬 New message:', payload.new);
          callbacks.onMessage?.(payload.new);
        }
      )
      // Presence for online users
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('👤 User joined chat:', key);
        callbacks.onUserJoin?.({ userId: key, ...newPresences[key] });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('👤 User left chat:', key);
        callbacks.onUserLeave?.({ userId: key, ...leftPresences[key] });
      })
      // Broadcast for typing indicators
      .on('broadcast', { event: 'typing' }, (payload) => {
        console.log('⌨️ Typing indicator:', payload);
        callbacks.onTyping?.(payload);
      })
      .subscribe(async (status) => {
        console.log(`📡 Chat channel ${roomId} status:`, status);
        if (status === 'SUBSCRIBED') {
          // Join the room
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          });
        }
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(roomId: string, userId: string, isTyping: boolean): Promise<void> {
    const channelName = `chat_${roomId}`;
    const channel = this.channels.get(channelName);

    if (!channel) {
      console.error(`❌ Chat channel ${channelName} not found`);
      return;
    }

    try {
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        userId,
        isTyping,
      });
    } catch (error) {
      console.error('❌ Send typing indicator error:', error);
    }
  }

  /**
   * Subscribe to order status changes for vendors/customers
   */
  subscribeToOrderUpdates(
    userId: string,
    userRole: 'customer' | 'vendor',
    callback: (order: any) => void
  ): RealtimeChannel {
    const filterField = userRole === 'customer' ? 'customer_id' : 'vendor_id';
    const channelName = `orders_${userRole}_${userId}`;

    return this.subscribeToTable('orders', callback, {
      event: 'UPDATE',
      filter: `${filterField}=eq.${userId}`,
    });
  }

  /**
   * Subscribe to notification updates
   */
  subscribeToNotifications(
    userId: string,
    callback: (notification: any) => void
  ): RealtimeChannel {
    const channelName = `notifications_${userId}`;

    return this.subscribeToTable('notifications', callback, {
      event: 'INSERT',
      filter: `user_id=eq.${userId}`,
    });
  }

  /**
   * Subscribe to analytics events (for admin dashboard)
   */
  subscribeToAnalytics(callback: (event: any) => void): RealtimeChannel {
    return this.subscribeToTable('analytics_events', callback, {
      event: 'INSERT',
    });
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
      console.log(`✅ Unsubscribed from channel: ${channelName}`);
    } else {
      console.warn(`⚠️ Channel ${channelName} not found`);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    this.channels.forEach((channel, name) => {
      supabase.removeChannel(channel);
      console.log(`✅ Unsubscribed from channel: ${name}`);
    });
    this.channels.clear();
  }

  /**
   * Get channel status
   */
  getChannelStatus(channelName: string): string | null {
    const channel = this.channels.get(channelName);
    return channel ? (channel as any).state : null;
  }

  /**
   * Get all active channels
   */
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  /**
   * Check if a channel is active
   */
  isChannelActive(channelName: string): boolean {
    const channel = this.channels.get(channelName);
    return channel ? (channel as any).state === 'joined' : false;
  }
}

// Export singleton instance
export const realtimeService = new SupabaseRealtimeService();
export default realtimeService;