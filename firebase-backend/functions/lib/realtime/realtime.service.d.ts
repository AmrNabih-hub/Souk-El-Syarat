/**
 * Real-time Database Service - 2025 Standards
 * Implements real-time synchronization with conflict resolution
 */
interface ConflictResolution {
    strategy: 'last-write-wins' | 'merge' | 'manual';
    resolver?: (local: any, remote: any) => any;
}
export declare class RealtimeService {
    private db;
    private realtimeDb;
    private listeners;
    /**
     * Initialize real-time listeners for a collection
     */
    initializeListeners(collection: string, options?: {
        conflictResolution?: ConflictResolution;
        syncInterval?: number;
    }): Promise<boolean>;
    /**
     * Emit real-time event to connected clients
     */
    private emitEvent;
    /**
     * Subscribe to real-time updates
     */
    subscribe(path: string, callback: (data: any) => void): Promise<() => void>;
    /**
     * Perform real-time transaction
     */
    transaction(path: string, updateFunction: (current: any) => any): Promise<any>;
    /**
     * Real-time presence system
     */
    updatePresence(userId: string, status: 'online' | 'away' | 'offline'): Promise<void>;
    /**
     * Real-time chat functionality
     */
    sendMessage(chatId: string, message: {
        senderId: string;
        text: string;
        attachments?: any[];
    }): Promise<string>;
    /**
     * Mark messages as delivered/read
     */
    updateMessageStatus(chatId: string, messageId: string, status: 'delivered' | 'read'): Promise<void>;
    /**
     * Real-time inventory tracking
     */
    updateInventory(productId: string, quantity: number, operation: 'add' | 'subtract' | 'set'): Promise<any>;
    /**
     * Real-time order tracking
     */
    updateOrderStatus(orderId: string, status: string, location?: {
        lat: number;
        lng: number;
    }): Promise<boolean>;
    /**
     * Real-time analytics
     */
    trackEvent(event: string, data: any): Promise<boolean>;
    /**
     * Create real-time alert
     */
    private createAlert;
    /**
     * Send push notification
     */
    private sendNotification;
    /**
     * Notify order update
     */
    private notifyOrderUpdate;
    /**
     * Cleanup listeners
     */
    cleanup(): Promise<void>;
}
export declare const realtimeService: RealtimeService;
export {};
//# sourceMappingURL=realtime.service.d.ts.map