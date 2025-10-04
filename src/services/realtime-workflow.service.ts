/**
 * Real-Time Workflow Service
 * Handles real-time updates for workflows
 * Professional Supabase Realtime integration
 */

import { supabase } from '@/config/supabase.config';
import { RealtimeChannel } from '@supabase/supabase-js';

export type WorkflowEvent = 'vendor_application' | 'car_listing' | 'notification';

export interface WorkflowCallback {
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
}

export class RealtimeWorkflowService {
  private static channels: Map<string, RealtimeChannel> = new Map();

  /**
   * Subscribe to vendor applications (Admin dashboard)
   * Gets notified when new applications are submitted
   */
  static subscribeToVendorApplications(callbacks: WorkflowCallback): () => void {
    console.log('[RealtimeWorkflow] Subscribing to vendor applications...');

    const channel = supabase
      .channel('vendor_applications_realtime')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'vendor_applications' 
        },
        (payload) => {
          console.log('[RealtimeWorkflow] New vendor application:', payload);
          callbacks.onInsert?.(payload.new);
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'vendor_applications' 
        },
        (payload) => {
          console.log('[RealtimeWorkflow] Vendor application updated:', payload);
          callbacks.onUpdate?.(payload.new);
        }
      )
      .subscribe((status) => {
        console.log('[RealtimeWorkflow] Vendor applications subscription status:', status);
      });

    this.channels.set('vendor_applications', channel);

    // Return unsubscribe function
    return () => {
      console.log('[RealtimeWorkflow] Unsubscribing from vendor applications');
      channel.unsubscribe();
      this.channels.delete('vendor_applications');
    };
  }

  /**
   * Subscribe to car listings (Admin dashboard)
   * Gets notified when new listings are submitted
   */
  static subscribeToCarListings(callbacks: WorkflowCallback): () => void {
    console.log('[RealtimeWorkflow] Subscribing to car listings...');

    const channel = supabase
      .channel('car_listings_realtime')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'car_listings' 
        },
        (payload) => {
          console.log('[RealtimeWorkflow] New car listing:', payload);
          callbacks.onInsert?.(payload.new);
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'car_listings' 
        },
        (payload) => {
          console.log('[RealtimeWorkflow] Car listing updated:', payload);
          callbacks.onUpdate?.(payload.new);
        }
      )
      .subscribe((status) => {
        console.log('[RealtimeWorkflow] Car listings subscription status:', status);
      });

    this.channels.set('car_listings', channel);

    return () => {
      console.log('[RealtimeWorkflow] Unsubscribing from car listings');
      channel.unsubscribe();
      this.channels.delete('car_listings');
    };
  }

  /**
   * Subscribe to user's notifications
   * Real-time notification delivery
   */
  static subscribeToUserNotifications(userId: string, callbacks: WorkflowCallback): () => void {
    console.log('[RealtimeWorkflow] Subscribing to notifications for user:', userId);

    const channel = supabase
      .channel(`user_notifications_${userId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('[RealtimeWorkflow] New notification:', payload);
          callbacks.onInsert?.(payload.new);
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('[RealtimeWorkflow] Notification updated:', payload);
          callbacks.onUpdate?.(payload.new);
        }
      )
      .subscribe((status) => {
        console.log('[RealtimeWorkflow] Notifications subscription status:', status);
      });

    this.channels.set(`notifications_${userId}`, channel);

    return () => {
      console.log('[RealtimeWorkflow] Unsubscribing from notifications');
      channel.unsubscribe();
      this.channels.delete(`notifications_${userId}`);
    };
  }

  /**
   * Subscribe to user's vendor application status
   * User gets notified when admin approves/rejects
   */
  static subscribeToUserVendorApplication(userId: string, callbacks: WorkflowCallback): () => void {
    console.log('[RealtimeWorkflow] Subscribing to vendor application for user:', userId);

    const channel = supabase
      .channel(`user_vendor_app_${userId}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'vendor_applications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('[RealtimeWorkflow] Your vendor application updated:', payload);
          callbacks.onUpdate?.(payload.new);
        }
      )
      .subscribe((status) => {
        console.log('[RealtimeWorkflow] User vendor app subscription status:', status);
      });

    this.channels.set(`vendor_app_${userId}`, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(`vendor_app_${userId}`);
    };
  }

  /**
   * Subscribe to user's car listings status
   * User gets notified when admin approves/rejects
   */
  static subscribeToUserCarListings(userId: string, callbacks: WorkflowCallback): () => void {
    console.log('[RealtimeWorkflow] Subscribing to car listings for user:', userId);

    const channel = supabase
      .channel(`user_car_listings_${userId}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'car_listings',
          filter: `customer_id=eq.${userId}`
        },
        (payload) => {
          console.log('[RealtimeWorkflow] Your car listing updated:', payload);
          callbacks.onUpdate?.(payload.new);
        }
      )
      .subscribe((status) => {
        console.log('[RealtimeWorkflow] User car listings subscription status:', status);
      });

    this.channels.set(`car_listings_${userId}`, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(`car_listings_${userId}`);
    };
  }

  /**
   * Unsubscribe from all channels
   */
  static unsubscribeAll(): void {
    console.log('[RealtimeWorkflow] Unsubscribing from all channels...');
    this.channels.forEach((channel) => {
      channel.unsubscribe();
    });
    this.channels.clear();
  }
}
