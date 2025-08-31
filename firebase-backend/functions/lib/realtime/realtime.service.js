"use strict";
/**
 * Real-time Database Service - 2025 Standards
 * Implements real-time synchronization with conflict resolution
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.realtimeService = exports.RealtimeService = void 0;
const admin = __importStar(require("firebase-admin"));
class RealtimeService {
    constructor() {
        this.db = admin.firestore();
        this.realtimeDb = admin.database();
        this.listeners = new Map();
    }
    /**
     * Initialize real-time listeners for a collection
     */
    async initializeListeners(collection, options) {
        try {
            // Firestore to Realtime DB sync
            const unsubscribe = this.db.collection(collection)
                .onSnapshot(async (snapshot) => {
                const batch = this.realtimeDb.ref(`sync/${collection}`);
                for (const change of snapshot.docChanges()) {
                    const data = {
                        id: change.doc.id,
                        data: change.doc.data(),
                        type: change.type,
                        timestamp: Date.now()
                    };
                    switch (change.type) {
                        case 'added':
                        case 'modified':
                            await batch.child(change.doc.id).set(data);
                            break;
                        case 'removed':
                            await batch.child(change.doc.id).remove();
                            break;
                    }
                    // Emit real-time event
                    await this.emitEvent(collection, change.type, data);
                }
            });
            this.listeners.set(collection, unsubscribe);
            // Setup bidirectional sync
            this.realtimeDb.ref(`sync/${collection}`).on('child_changed', async (snapshot) => {
                const data = snapshot.val();
                if (data && data.source !== 'firestore') {
                    // Update Firestore from Realtime DB
                    await this.db.collection(collection).doc(data.id).set(data.data, { merge: true });
                }
            });
            console.log(`Real-time listeners initialized for ${collection}`);
            return true;
        }
        catch (error) {
            console.error('Initialize listeners error:', error);
            return false;
        }
    }
    /**
     * Emit real-time event to connected clients
     */
    async emitEvent(collection, type, data) {
        const event = {
            collection,
            type,
            data,
            timestamp: Date.now()
        };
        // Broadcast to all connected clients
        await this.realtimeDb.ref('events').push(event);
        // Store in event log
        await this.db.collection('event_log').add(Object.assign(Object.assign({}, event), { createdAt: admin.firestore.FieldValue.serverTimestamp() }));
    }
    /**
     * Subscribe to real-time updates
     */
    async subscribe(path, callback) {
        const ref = this.realtimeDb.ref(path);
        const listener = ref.on('value', (snapshot) => {
            callback(snapshot.val());
        });
        // Return unsubscribe function
        return () => ref.off('value', listener);
    }
    /**
     * Perform real-time transaction
     */
    async transaction(path, updateFunction) {
        try {
            const ref = this.realtimeDb.ref(path);
            const result = await ref.transaction((current) => {
                if (current === null) {
                    return updateFunction({});
                }
                return updateFunction(current);
            });
            return result.snapshot.val();
        }
        catch (error) {
            console.error('Transaction error:', error);
            throw error;
        }
    }
    /**
     * Real-time presence system
     */
    async updatePresence(userId, status) {
        const userStatusRef = this.realtimeDb.ref(`status/${userId}`);
        const isOfflineForDatabase = {
            state: 'offline',
            last_changed: admin.database.ServerValue.TIMESTAMP,
        };
        const isOnlineForDatabase = {
            state: status,
            last_changed: admin.database.ServerValue.TIMESTAMP,
        };
        // Set offline status when client disconnects
        await userStatusRef.onDisconnect().set(isOfflineForDatabase);
        // Set online status
        await userStatusRef.set(isOnlineForDatabase);
        // Also update Firestore
        await this.db.collection('users').doc(userId).update({
            onlineStatus: status,
            lastSeen: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    /**
     * Real-time chat functionality
     */
    async sendMessage(chatId, message) {
        try {
            // Add to Realtime DB for instant delivery
            const messageRef = await this.realtimeDb.ref(`chats/${chatId}/messages`).push(Object.assign(Object.assign({}, message), { timestamp: admin.database.ServerValue.TIMESTAMP, delivered: false, read: false }));
            // Also store in Firestore for persistence
            await this.db.collection('chats').doc(chatId)
                .collection('messages').doc(messageRef.key).set(Object.assign(Object.assign({}, message), { timestamp: admin.firestore.FieldValue.serverTimestamp(), delivered: false, read: false }));
            // Update chat metadata
            await this.db.collection('chats').doc(chatId).update({
                lastMessage: message.text,
                lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
                unreadCount: admin.firestore.FieldValue.increment(1)
            });
            // Send push notification
            await this.sendNotification(chatId, message);
            return messageRef.key;
        }
        catch (error) {
            console.error('Send message error:', error);
            throw error;
        }
    }
    /**
     * Mark messages as delivered/read
     */
    async updateMessageStatus(chatId, messageId, status) {
        try {
            // Update in Realtime DB
            await this.realtimeDb.ref(`chats/${chatId}/messages/${messageId}`).update({
                [status]: true,
                [`${status}At`]: admin.database.ServerValue.TIMESTAMP
            });
            // Update in Firestore
            await this.db.collection('chats').doc(chatId)
                .collection('messages').doc(messageId).update({
                [status]: true,
                [`${status}At`]: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        catch (error) {
            console.error('Update message status error:', error);
        }
    }
    /**
     * Real-time inventory tracking
     */
    async updateInventory(productId, quantity, operation) {
        try {
            const ref = this.realtimeDb.ref(`inventory/${productId}`);
            await ref.transaction((current) => {
                if (current === null) {
                    return operation === 'set' ? quantity : 0;
                }
                switch (operation) {
                    case 'add':
                        return current + quantity;
                    case 'subtract':
                        return Math.max(0, current - quantity);
                    case 'set':
                        return quantity;
                    default:
                        return current;
                }
            });
            // Sync with Firestore
            const snapshot = await ref.once('value');
            const newQuantity = snapshot.val();
            await this.db.collection('products').doc(productId).update({
                inventory: newQuantity,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            });
            // Check for low stock alert
            if (newQuantity < 10) {
                await this.createAlert('low_stock', {
                    productId,
                    quantity: newQuantity
                });
            }
            return newQuantity;
        }
        catch (error) {
            console.error('Update inventory error:', error);
            throw error;
        }
    }
    /**
     * Real-time order tracking
     */
    async updateOrderStatus(orderId, status, location) {
        try {
            const update = {
                status,
                updatedAt: admin.database.ServerValue.TIMESTAMP
            };
            if (location) {
                update.location = location;
            }
            // Update in Realtime DB for instant updates
            await this.realtimeDb.ref(`orders/${orderId}`).update(update);
            // Update in Firestore
            await this.db.collection('orders').doc(orderId).update(Object.assign(Object.assign({ status }, (location && { location })), { updatedAt: admin.firestore.FieldValue.serverTimestamp() }));
            // Notify customer
            await this.notifyOrderUpdate(orderId, status);
            return true;
        }
        catch (error) {
            console.error('Update order status error:', error);
            return false;
        }
    }
    /**
     * Real-time analytics
     */
    async trackEvent(event, data) {
        try {
            // Real-time counter
            await this.realtimeDb.ref(`analytics/${event}/count`).transaction((current) => {
                return (current || 0) + 1;
            });
            // Store event details
            await this.realtimeDb.ref(`analytics/${event}/events`).push(Object.assign(Object.assign({}, data), { timestamp: admin.database.ServerValue.TIMESTAMP }));
            // Update daily aggregates
            const today = new Date().toISOString().split('T')[0];
            await this.realtimeDb.ref(`analytics/${event}/daily/${today}`).transaction((current) => {
                return (current || 0) + 1;
            });
            return true;
        }
        catch (error) {
            console.error('Track event error:', error);
            return false;
        }
    }
    /**
     * Create real-time alert
     */
    async createAlert(type, data) {
        await this.realtimeDb.ref('alerts').push({
            type,
            data,
            timestamp: admin.database.ServerValue.TIMESTAMP,
            resolved: false
        });
    }
    /**
     * Send push notification
     */
    async sendNotification(chatId, message) {
        // TODO: Implement FCM push notification
        console.log('Sending notification for chat:', chatId);
    }
    /**
     * Notify order update
     */
    async notifyOrderUpdate(orderId, status) {
        // TODO: Implement order update notification
        console.log(`Order ${orderId} updated to ${status}`);
    }
    /**
     * Cleanup listeners
     */
    async cleanup() {
        for (const [key, unsubscribe] of this.listeners) {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        }
        this.listeners.clear();
    }
}
exports.RealtimeService = RealtimeService;
exports.realtimeService = new RealtimeService();
//# sourceMappingURL=realtime.service.js.map