/**
 * Enhanced Real-time Service for Souk El-Sayarat
 * Advanced real-time features with performance optimization and reliability
 */

import { db, realtimeDb } from '@/config/firebase.config';
import { getDatabase } from 'firebase/database';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import {
  ref,
  set,
  push,
  onValue,
  update,
  remove,
  onDisconnect,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  off,
} from 'firebase/database';

export interface EnhancedChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: Date;
  read: boolean;
  readBy: string[];
  type: 'text' | 'image' | 'file' | 'location' | 'contact';
  data?: Record<string, any>;
  edited?: boolean;
  editedAt?: Date;
  replyTo?: string;
  reactions?: Record<string, string[]>; // emoji -> userIds
  metadata?: {
    deviceInfo?: string;
    location?: { lat: number; lng: number };
    fileInfo?: {
      name: string;
      size: number;
      type: string;
      url: string;
    };
  };
}

export interface EnhancedUserPresence {
  userId: string;
  status: 'online' | 'offline' | 'away' | 'busy' | 'invisible';
  lastSeen: Date;
  currentPage?: string;
  isTyping?: boolean;
  typingIn?: string; // chatId where user is typing
  deviceInfo?: {
    platform: string;
    browser: string;
    version: string;
  };
  location?: {
    country?: string;
    city?: string;
  };
}

export interface LiveActivity {
  id: string;
  userId: string;
  type: 'login' | 'logout' | 'page_view' | 'purchase' | 'review' | 'message' | 'order_update';
  data: Record<string, any>;
  timestamp: Date;
  visibility: 'public' | 'friends' | 'private';
}

export interface RealtimeConnectionStatus {
  isConnected: boolean;
  lastConnectionTime: Date;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  retryCount: number;
  lastError?: string;
}

export class EnhancedRealtimeService {
  private static instance: EnhancedRealtimeService;
  private realtimeDb = getDatabase();
  private presenceRef = ref(this.realtimeDb, 'presence');
  private chatRef = ref(this.realtimeDb, 'chat');
  private activityRef = ref(this.realtimeDb, 'activity');
  private connectionsRef = ref(this.realtimeDb, 'connections');

  // Connection management
  private connectionStatus: RealtimeConnectionStatus = {
    isConnected: false,
    lastConnectionTime: new Date(),
    connectionQuality: 'offline',
    retryCount: 0,
  };

  // Active listeners and their cleanup functions
  private activeListeners: Map<string, () => void> = new Map();

  // Typing indicators
  private typingTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();

  // Message queues for offline support
  private messageQueue: EnhancedChatMessage[] = [];
  private activityQueue: LiveActivity[] = [];

  private constructor() {
    this.initializeConnectionMonitoring();
    this.setupOfflineSupport();
  }

  static getInstance(): EnhancedRealtimeService {
    if (!EnhancedRealtimeService.instance) {
      EnhancedRealtimeService.instance = new EnhancedRealtimeService();
    }
    return EnhancedRealtimeService.instance;
  }

  /**
   * Initialize connection monitoring
   */
  private initializeConnectionMonitoring(): void {
    const connectedRef = ref(this.realtimeDb, '.info/connected');

    onValue(connectedRef, (snapshot) => {
      const isConnected = snapshot.val() === true;
      this.updateConnectionStatus(isConnected);

      if (isConnected) {
        this.handleReconnection();
      }
    });
  }

  /**
   * Update connection status
   */
  private updateConnectionStatus(isConnected: boolean): void {
    const now = new Date();
    const timeDiff = now.getTime() - this.connectionStatus.lastConnectionTime.getTime();

    let quality: RealtimeConnectionStatus['connectionQuality'] = 'offline';

    if (isConnected) {
      if (timeDiff < 1000) quality = 'excellent';
      else if (timeDiff < 5000) quality = 'good';
      else quality = 'poor';
    }

    this.connectionStatus = {
      isConnected,
      lastConnectionTime: now,
      connectionQuality: quality,
      retryCount: isConnected ? 0 : this.connectionStatus.retryCount + 1,
    };

    // Notify connection status listeners
    this.notifyConnectionStatusChange();
  }

  /**
   * Handle reconnection - resync data
   */
  private async handleReconnection(): Promise<void> {
    try {
      // Send queued messages
      for (const message of this.messageQueue) {
        await this.sendQueuedMessage(message);
      }
      this.messageQueue = [];

      // Send queued activities
      for (const activity of this.activityQueue) {
        await this.sendQueuedActivity(activity);
      }
      this.activityQueue = [];

      console.log('✅ Reconnection sync completed');
    } catch (error) {
      console.error('❌ Reconnection sync failed:', error);
    }
  }

  /**
   * Setup offline support
   */
  private setupOfflineSupport(): void {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.updateConnectionStatus(true);
    });

    window.addEventListener('offline', () => {
      this.updateConnectionStatus(false);
    });

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handlePageHidden();
      } else {
        this.handlePageVisible();
      }
    });
  }

  /**
   * Handle page becoming hidden
   */
  private handlePageHidden(): void {
    // Update presence to away when page is hidden
    if (auth.currentUser) {
      this.setUserPresence(auth.currentUser.uid, 'away');
    }
  }

  /**
   * Handle page becoming visible
   */
  private handlePageVisible(): void {
    // Update presence to online when page is visible
    if (auth.currentUser) {
      this.setUserPresence(auth.currentUser.uid, 'online');
    }
  }

  /**
   * Enhanced user presence with device info
   */
  async setEnhancedUserPresence(
    userId: string,
    status: EnhancedUserPresence['status'],
    currentPage?: string,
    deviceInfo?: EnhancedUserPresence['deviceInfo']
  ): Promise<void> {
    try {
      const userPresenceRef = ref(realtimeDb, `presence/${userId}`);
      const presenceData: Omit<EnhancedUserPresence, 'userId'> = {
        status,
        lastSeen: new Date(),
        currentPage,
        isTyping: false,
        deviceInfo: deviceInfo || {
          platform: navigator.platform,
          browser: this.getBrowserInfo(),
          version: navigator.appVersion,
        },
      };

      await set(userPresenceRef, presenceData);

      // Setup disconnect handling
      onDisconnect(userPresenceRef).update({
        status: 'offline',
        lastSeen: new Date().toISOString(),
      });

    } catch (error) {
      console.error('❌ Error setting enhanced presence:', error);
      throw error;
    }
  }

  /**
   * Get browser information
   */
  private getBrowserInfo(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  /**
   * Listen to enhanced user presence
   */
  listenToEnhancedUserPresence(
    userId: string,
    callback: (presence: EnhancedUserPresence) => void
  ): () => void {
    const userPresenceRef = ref(realtimeDb, `presence/${userId}`);

    const unsubscribe = onValue(userPresenceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        callback({
          userId,
          status: data.status || 'offline',
          lastSeen: new Date(data.lastSeen || Date.now()),
          currentPage: data.currentPage,
          isTyping: data.isTyping || false,
          typingIn: data.typingIn,
          deviceInfo: data.deviceInfo,
          location: data.location,
        });
      }
    });

    const listenerId = `presence_${userId}`;
    this.activeListeners.set(listenerId, unsubscribe);

    return () => {
      unsubscribe();
      this.activeListeners.delete(listenerId);
    };
  }

  /**
   * Enhanced chat message sending
   */
  async sendEnhancedMessage(
    senderId: string,
    receiverId: string,
    message: string,
    type: EnhancedChatMessage['type'] = 'text',
    options?: {
      replyTo?: string;
      data?: Record<string, any>;
      metadata?: EnhancedChatMessage['metadata'];
    }
  ): Promise<string> {
    try {
      const chatId = this.getChatId(senderId, receiverId);
      const chatRef = ref(realtimeDb, `chat/${chatId}`);
      const newMessageRef = push(chatRef);

      const messageData: Omit<EnhancedChatMessage, 'id'> = {
        senderId,
        receiverId,
        message,
        timestamp: new Date(),
        read: false,
        readBy: [senderId],
        type,
        data: options?.data || {},
        replyTo: options?.replyTo,
        metadata: options?.metadata,
      };

      if (!this.connectionStatus.isConnected) {
        // Queue message for offline sending
        this.messageQueue.push({
          id: newMessageRef.key || `temp_${Date.now()}`,
          ...messageData,
        });
        console.log('📨 Message queued for offline sending');
        return newMessageRef.key || '';
      }

      await set(newMessageRef, messageData);

      // Update last message in chat metadata
      await this.updateChatMetadata(chatId, {
        lastMessage: message,
        lastMessageTime: new Date(),
        lastMessageSender: senderId,
      });

      return newMessageRef.key || '';

    } catch (error) {
      console.error('❌ Error sending enhanced message:', error);
      throw error;
    }
  }

  /**
   * Send queued message when back online
   */
  private async sendQueuedMessage(message: EnhancedChatMessage): Promise<void> {
    const chatId = this.getChatId(message.senderId, message.receiverId);
    const chatRef = ref(realtimeDb, `chat/${chatId}`);
    const newMessageRef = push(chatRef);

    await set(newMessageRef, {
      ...message,
      timestamp: new Date(),
    });
  }

  /**
   * Enhanced message reactions
   */
  async addMessageReaction(
    chatId: string,
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<void> {
    try {
      const messageRef = ref(realtimeDb, `chat/${chatId}/${messageId}/reactions/${emoji}`);
      const currentReactions = (await get(messageRef)).val() || [];
      const userIndex = currentReactions.indexOf(userId);

      if (userIndex === -1) {
        // Add reaction
        currentReactions.push(userId);
      } else {
        // Remove reaction
        currentReactions.splice(userIndex, 1);
      }

      await set(messageRef, currentReactions);

    } catch (error) {
      console.error('❌ Error updating message reaction:', error);
      throw error;
    }
  }

  /**
   * Enhanced typing indicators
   */
  async setTypingStatus(
    senderId: string,
    receiverId: string,
    isTyping: boolean
  ): Promise<void> {
    try {
      const chatId = this.getChatId(senderId, receiverId);
      const presenceRef = ref(realtimeDb, `presence/${senderId}`);

      if (isTyping) {
        await update(presenceRef, {
          isTyping: true,
          typingIn: chatId,
          lastSeen: Date.now(),
        });

        // Clear typing status after 3 seconds
        const timeoutKey = `${senderId}_${chatId}`;
        if (this.typingTimeouts.has(timeoutKey)) {
          clearTimeout(this.typingTimeouts.get(timeoutKey));
        }

        const timeout = setTimeout(async () => {
          await update(presenceRef, {
            isTyping: false,
            typingIn: null,
          });
          this.typingTimeouts.delete(timeoutKey);
        }, 3000);

        this.typingTimeouts.set(timeoutKey, timeout);

      } else {
        await update(presenceRef, {
          isTyping: false,
          typingIn: null,
        });
      }

    } catch (error) {
      console.error('❌ Error setting typing status:', error);
      throw error;
    }
  }

  /**
   * Listen to enhanced chat messages
   */
  listenToEnhancedChatMessages(
    senderId: string,
    receiverId: string,
    callback: (messages: EnhancedChatMessage[]) => void,
    options?: {
      includeMetadata?: boolean;
      realtimeOnly?: boolean;
    }
  ): () => void {
    const chatId = this.getChatId(senderId, receiverId);
    const chatRef = ref(this.realtimeDb, `chat/${chatId}`);

    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messages: EnhancedChatMessage[] = Object.entries(data)
          .filter(([, messageData]: [string, any]) => messageData.timestamp) // Filter out metadata
          .map(([id, messageData]: [string, any]) => ({
            id,
            senderId: messageData.senderId,
            receiverId: messageData.receiverId,
            message: messageData.message,
            timestamp: new Date(messageData.timestamp),
            read: messageData.read || false,
            readBy: messageData.readBy || [messageData.senderId],
            type: messageData.type || 'text',
            data: messageData.data || {},
            edited: messageData.edited || false,
            editedAt: messageData.editedAt ? new Date(messageData.editedAt) : undefined,
            replyTo: messageData.replyTo,
            reactions: messageData.reactions || {},
            metadata: options?.includeMetadata ? messageData.metadata : undefined,
          }));

        // Sort by timestamp
        messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        callback(messages);
      } else {
        callback([]);
      }
    });

    const listenerId = `chat_${chatId}`;
    this.activeListeners.set(listenerId, unsubscribe);

    return () => {
      unsubscribe();
      this.activeListeners.delete(listenerId);
    };
  }

  /**
   * Real-time activity feed
   */
  async addLiveActivity(
    userId: string,
    type: LiveActivity['type'],
    data: Record<string, any>,
    visibility: LiveActivity['visibility'] = 'public'
  ): Promise<void> {
    try {
      const activityRef = ref(this.realtimeDb, `activity/${userId}`);
      const newActivityRef = push(activityRef);

      const activity: Omit<LiveActivity, 'id'> = {
        userId,
        type,
        data,
        timestamp: new Date(),
        visibility,
      };

      if (!this.connectionStatus.isConnected) {
        // Queue activity for offline sending
        this.activityQueue.push({
          id: newActivityRef.key || `temp_${Date.now()}`,
          ...activity,
        });
        return;
      }

      await set(newActivityRef, activity);

    } catch (error) {
      console.error('❌ Error adding live activity:', error);
      throw error;
    }
  }

  /**
   * Send queued activity when back online
   */
  private async sendQueuedActivity(activity: LiveActivity): Promise<void> {
    const activityRef = ref(this.realtimeDb, `activity/${activity.userId}`);
    const newActivityRef = push(activityRef);

    await set(newActivityRef, {
      ...activity,
      timestamp: new Date(),
    });
  }

  /**
   * Listen to live activity feed
   */
  listenToLiveActivityFeed(
    userId: string,
    callback: (activities: LiveActivity[]) => void,
    options?: {
      includePrivate?: boolean;
      maxActivities?: number;
    }
  ): () => void {
    const activityRef = ref(this.realtimeDb, `activity/${userId}`);

    const unsubscribe = onValue(activityRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        let activities: LiveActivity[] = Object.entries(data)
          .map(([id, activityData]: [string, any]) => ({
            id,
            userId: activityData.userId,
            type: activityData.type,
            data: activityData.data,
            timestamp: new Date(activityData.timestamp),
            visibility: activityData.visibility || 'public',
          }));

        // Filter by visibility
        if (!options?.includePrivate) {
          activities = activities.filter(activity => activity.visibility === 'public');
        }

        // Sort by timestamp (most recent first)
        activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        // Limit results
        if (options?.maxActivities) {
          activities = activities.slice(0, options.maxActivities);
        }

        callback(activities);
      } else {
        callback([]);
      }
    });

    const listenerId = `activity_${userId}`;
    this.activeListeners.set(listenerId, unsubscribe);

    return () => {
      unsubscribe();
      this.activeListeners.delete(listenerId);
    };
  }

  /**
   * Real-time notifications system
   */
  listenToRealtimeNotifications(
    userId: string,
    callback: (notifications: any[]) => void
  ): () => void {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(notifications);
    });

    const listenerId = `notifications_${userId}`;
    this.activeListeners.set(listenerId, unsubscribe);

    return () => {
      unsubscribe();
      this.activeListeners.delete(listenerId);
    };
  }

  /**
   * Connection status monitoring
   */
  onConnectionStatusChange(callback: (status: RealtimeConnectionStatus) => void): () => void {
    callback(this.connectionStatus);

    const listenerId = 'connection_status';
    const wrappedCallback = () => callback(this.connectionStatus);
    this.activeListeners.set(listenerId, wrappedCallback);

    return () => {
      this.activeListeners.delete(listenerId);
    };
  }

  /**
   * Notify connection status change
   */
  private notifyConnectionStatusChange(): void {
    // This would notify any listeners about connection status changes
    // Implementation depends on how you want to handle this
  }

  /**
   * Update chat metadata
   */
  private async updateChatMetadata(chatId: string, updates: Record<string, any>): Promise<void> {
    try {
      const metadataRef = ref(realtimeDb, `chat/${chatId}/metadata`);
      await update(metadataRef, updates);
    } catch (error) {
      // Metadata update failure shouldn't break message sending
      console.warn('⚠️ Failed to update chat metadata:', error);
    }
  }

  /**
   * Get chat ID for two users
   */
  private getChatId(userId1: string, userId2: string): string {
    const sortedIds = [userId1, userId2].sort();
    return `${sortedIds[0]}_${sortedIds[1]}`;
  }

  /**
   * Cleanup all listeners and resources
   */
  cleanup(): void {
    // Clear all active listeners
    this.activeListeners.forEach(unsubscribe => unsubscribe());
    this.activeListeners.clear();

    // Clear typing timeouts
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();

    // Clear message and activity queues
    this.messageQueue = [];
    this.activityQueue = [];

    console.log('🧹 Enhanced realtime service cleanup completed');
  }
}

// Export singleton instance
export const enhancedRealtimeService = EnhancedRealtimeService.getInstance();
