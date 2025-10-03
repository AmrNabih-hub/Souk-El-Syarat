/**
 * ⚡ APPWRITE REALTIME SERVICE
 * Real-time updates via WebSocket
 */

import { client, appwriteConfig } from '@/config/appwrite.config';
import { RealtimeResponseEvent } from 'appwrite';

export type RealtimeChannel = 
  | 'documents'
  | 'files'
  | 'account'
  | string;

export type RealtimeEventCallback = (payload: RealtimeResponseEvent<any>) => void;

export class AppwriteRealtimeService {
  private subscriptions: Map<string, () => void> = new Map();

  /**
   * 📡 SUBSCRIBE TO COLLECTION
   * Subscribe to real-time updates for a specific collection
   */
  subscribeToCollection(
    collectionId: string,
    callback: RealtimeEventCallback
  ): () => void {
    const channel = `databases.${appwriteConfig.databaseId}.collections.${collectionId}.documents`;
    
    console.log('📡 Subscribing to channel:', channel);

    const unsubscribe = client.subscribe(channel, (response) => {
      console.log('🔔 Real-time event received:', {
        event: response.events,
        payload: response.payload,
      });
      callback(response);
    });

    // Store subscription
    const subscriptionId = `collection-${collectionId}-${Date.now()}`;
    this.subscriptions.set(subscriptionId, unsubscribe);

    // Return unsubscribe function
    return () => {
      console.log('📴 Unsubscribing from channel:', channel);
      unsubscribe();
      this.subscriptions.delete(subscriptionId);
    };
  }

  /**
   * 📡 SUBSCRIBE TO DOCUMENT
   * Subscribe to real-time updates for a specific document
   */
  subscribeToDocument(
    collectionId: string,
    documentId: string,
    callback: RealtimeEventCallback
  ): () => void {
    const channel = `databases.${appwriteConfig.databaseId}.collections.${collectionId}.documents.${documentId}`;
    
    console.log('📡 Subscribing to document:', channel);

    const unsubscribe = client.subscribe(channel, (response) => {
      console.log('🔔 Document update received:', {
        event: response.events,
        payload: response.payload,
      });
      callback(response);
    });

    // Store subscription
    const subscriptionId = `document-${collectionId}-${documentId}-${Date.now()}`;
    this.subscriptions.set(subscriptionId, unsubscribe);

    // Return unsubscribe function
    return () => {
      console.log('📴 Unsubscribing from document:', channel);
      unsubscribe();
      this.subscriptions.delete(subscriptionId);
    };
  }

  /**
   * 📡 SUBSCRIBE TO ACCOUNT
   * Subscribe to current user account updates
   */
  subscribeToAccount(callback: RealtimeEventCallback): () => void {
    const channel = 'account';
    
    console.log('📡 Subscribing to account updates');

    const unsubscribe = client.subscribe(channel, (response) => {
      console.log('🔔 Account update received:', {
        event: response.events,
        payload: response.payload,
      });
      callback(response);
    });

    // Store subscription
    const subscriptionId = `account-${Date.now()}`;
    this.subscriptions.set(subscriptionId, unsubscribe);

    // Return unsubscribe function
    return () => {
      console.log('📴 Unsubscribing from account');
      unsubscribe();
      this.subscriptions.delete(subscriptionId);
    };
  }

  /**
   * 📡 SUBSCRIBE TO MULTIPLE CHANNELS
   * Subscribe to multiple channels at once
   */
  subscribeToChannels(
    channels: string[],
    callback: RealtimeEventCallback
  ): () => void {
    console.log('📡 Subscribing to multiple channels:', channels);

    const unsubscribe = client.subscribe(channels, (response) => {
      console.log('🔔 Multi-channel event received:', {
        event: response.events,
        payload: response.payload,
        channels: response.channels,
      });
      callback(response);
    });

    // Store subscription
    const subscriptionId = `multi-${Date.now()}`;
    this.subscriptions.set(subscriptionId, unsubscribe);

    // Return unsubscribe function
    return () => {
      console.log('📴 Unsubscribing from multiple channels');
      unsubscribe();
      this.subscriptions.delete(subscriptionId);
    };
  }

  /**
   * 📴 UNSUBSCRIBE ALL
   * Clean up all subscriptions
   */
  unsubscribeAll(): void {
    console.log('📴 Unsubscribing from all channels...');
    
    this.subscriptions.forEach((unsubscribe, id) => {
      try {
        unsubscribe();
      } catch (error) {
        console.warn(`Failed to unsubscribe from ${id}:`, error);
      }
    });
    
    this.subscriptions.clear();
    console.log('✅ All subscriptions cleared');
  }

  /**
   * 📊 GET SUBSCRIPTION COUNT
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * 🔍 IS SUBSCRIBED
   */
  isSubscribed(subscriptionId: string): boolean {
    return this.subscriptions.has(subscriptionId);
  }
}

// Export singleton instance
export const realtimeService = new AppwriteRealtimeService();

export default realtimeService;

