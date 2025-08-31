"use strict";
/**
 * COMPLETE Firebase Cloud Functions Backend
 * Full implementation for Souk El-Syarat
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyAnalytics = exports.onOrderStatusUpdate = exports.onUserCreated = exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const auth = admin.auth();
const realtimeDb = admin.database();
// Create Express app
const app = (0, express_1.default)();
// Configure CORS
app.use((0, cors_1.default)({
    origin: true,
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================
// Register new user
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, phoneNumber, role = 'customer' } = req.body;
        // Create user in Firebase Auth
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: `${firstName} ${lastName}`,
            phoneNumber
        });
        // Create user profile in Firestore
        await db.collection('users').doc(userRecord.uid).set({
            email,
            firstName,
            lastName,
            phoneNumber,
            role,
            displayName: `${firstName} ${lastName}`,
            isActive: true,
            emailVerified: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            preferences: {
                language: 'ar',
                currency: 'EGP',
                notifications: {
                    email: true,
                    sms: false,
                    push: true
                }
            }
        });
        // Create custom token for immediate login
        const customToken = await auth.createCustomToken(userRecord.uid);
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                uid: userRecord.uid,
                email: userRecord.email,
                customToken
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
// Get user profile
app.get('/api/auth/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        res.json({
            success: true,
            data: Object.assign({ id: userDoc.id }, userDoc.data())
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// ============================================
// PRODUCT ENDPOINTS
// ============================================
// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const { category, minPrice, maxPrice, search, limit = 20, offset = 0 } = req.query;
        let query = db.collection('products').where('isActive', '==', true);
        if (category) {
            query = query.where('category', '==', category);
        }
        if (minPrice) {
            query = query.where('price', '>=', Number(minPrice));
        }
        if (maxPrice) {
            query = query.where('price', '<=', Number(maxPrice));
        }
        const snapshot = await query.limit(Number(limit)).offset(Number(offset)).get();
        const products = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        // Simple search filter
        let filteredProducts = products;
        if (search) {
            const searchLower = String(search).toLowerCase();
            filteredProducts = products.filter((p) => {
                var _a, _b;
                return ((_a = p.title) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(searchLower)) ||
                    ((_b = p.description) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(searchLower));
            });
        }
        res.json({
            success: true,
            data: filteredProducts,
            total: filteredProducts.length,
            limit: Number(limit),
            offset: Number(offset)
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Get single product
app.get('/api/products/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const productDoc = await db.collection('products').doc(productId).get();
        if (!productDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        res.json({
            success: true,
            data: Object.assign({ id: productDoc.id }, productDoc.data())
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Create product
app.post('/api/products', async (req, res) => {
    try {
        const productData = Object.assign(Object.assign({}, req.body), { isActive: true, views: 0, likes: 0, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        const productRef = await db.collection('products').add(productData);
        // Update real-time dashboard
        await realtimeDb.ref('stats/products/total').transaction(current => (current || 0) + 1);
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: Object.assign({ id: productRef.id }, productData)
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
// Update product
app.put('/api/products/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const updateData = Object.assign(Object.assign({}, req.body), { updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        await db.collection('products').doc(productId).update(updateData);
        res.json({
            success: true,
            message: 'Product updated successfully'
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
// Delete product
app.delete('/api/products/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        await db.collection('products').doc(productId).update({
            isActive: false,
            deletedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
// ============================================
// VENDOR ENDPOINTS
// ============================================
// Get all vendors
app.get('/api/vendors', async (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;
        const snapshot = await db.collection('vendors')
            .where('isApproved', '==', true)
            .limit(Number(limit))
            .offset(Number(offset))
            .get();
        const vendors = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        res.json({
            success: true,
            data: vendors,
            total: vendors.length
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Apply as vendor
app.post('/api/vendors/apply', async (req, res) => {
    try {
        const applicationData = Object.assign(Object.assign({}, req.body), { status: 'pending', isApproved: false, createdAt: admin.firestore.FieldValue.serverTimestamp() });
        const applicationRef = await db.collection('vendor_applications').add(applicationData);
        // Notify admin in real-time
        await realtimeDb.ref('admin/notifications').push({
            type: 'new_vendor_application',
            applicationId: applicationRef.id,
            businessName: applicationData.businessName,
            timestamp: Date.now()
        });
        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            data: {
                id: applicationRef.id
            }
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
// ============================================
// ORDER ENDPOINTS
// ============================================
// Create order
app.post('/api/orders', async (req, res) => {
    try {
        const { customerId, items, shippingAddress, paymentMethod } = req.body;
        // Calculate total
        let total = 0;
        for (const item of items) {
            const productDoc = await db.collection('products').doc(item.productId).get();
            if (productDoc.exists) {
                const product = productDoc.data();
                total += ((product === null || product === void 0 ? void 0 : product.price) || 0) * item.quantity;
            }
        }
        const orderData = {
            customerId,
            items,
            shippingAddress,
            paymentMethod,
            total,
            status: 'pending',
            orderNumber: `ORD-${Date.now()}`,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        const orderRef = await db.collection('orders').add(orderData);
        // Update real-time order tracking
        await realtimeDb.ref(`orders/${orderRef.id}`).set({
            orderId: orderRef.id,
            customerId,
            status: 'pending',
            total,
            timestamp: Date.now()
        });
        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: {
                id: orderRef.id,
                orderNumber: orderData.orderNumber,
                total
            }
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
// Get user orders
app.get('/api/orders/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const snapshot = await db.collection('orders')
            .where('customerId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();
        const orders = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        res.json({
            success: true,
            data: orders
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// ============================================
// CHAT ENDPOINTS
// ============================================
// Send message
app.post('/api/chat/send', async (req, res) => {
    try {
        const { conversationId, senderId, receiverId, message, type = 'text' } = req.body;
        // Save to Realtime Database for instant delivery
        const messageRef = await realtimeDb.ref(`chats/${conversationId}/messages`).push({
            senderId,
            receiverId,
            message,
            type,
            timestamp: Date.now(),
            read: false
        });
        // Also save to Firestore for persistence
        await db.collection('conversations').doc(conversationId)
            .collection('messages').add({
            senderId,
            receiverId,
            message,
            type,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            read: false
        });
        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: {
                messageId: messageRef.key
            }
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
// Get conversations
app.get('/api/chat/conversations/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const snapshot = await db.collection('conversations')
            .where('participants', 'array-contains', userId)
            .get();
        const conversations = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        res.json({
            success: true,
            data: conversations
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// ============================================
// SEARCH ENDPOINT
// ============================================
app.get('/api/search', async (req, res) => {
    try {
        const { q, type = 'all' } = req.query;
        if (!q) {
            return res.json({
                success: true,
                data: []
            });
        }
        const searchTerm = String(q).toLowerCase();
        const results = [];
        // Search products
        if (type === 'all' || type === 'products') {
            const productsSnapshot = await db.collection('products')
                .where('isActive', '==', true)
                .limit(10)
                .get();
            const products = productsSnapshot.docs
                .map(doc => (Object.assign({ id: doc.id, type: 'product' }, doc.data())))
                .filter((item) => {
                var _a, _b;
                return ((_a = item.title) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(searchTerm)) ||
                    ((_b = item.description) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(searchTerm));
            });
            results.push(...products);
        }
        // Search vendors
        if (type === 'all' || type === 'vendors') {
            const vendorsSnapshot = await db.collection('vendors')
                .where('isApproved', '==', true)
                .limit(10)
                .get();
            const vendors = vendorsSnapshot.docs
                .map(doc => (Object.assign({ id: doc.id, type: 'vendor' }, doc.data())))
                .filter((item) => {
                var _a, _b;
                return ((_a = item.businessName) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(searchTerm)) ||
                    ((_b = item.description) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(searchTerm));
            });
            results.push(...vendors);
        }
        res.json({
            success: true,
            query: q,
            data: results
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// ============================================
// DASHBOARD ENDPOINTS
// ============================================
// Get admin dashboard stats
app.get('/api/admin/dashboard', async (req, res) => {
    try {
        const [usersSnapshot, ordersSnapshot, productsSnapshot, vendorsSnapshot] = await Promise.all([
            db.collection('users').count().get(),
            db.collection('orders').count().get(),
            db.collection('products').where('isActive', '==', true).count().get(),
            db.collection('vendors').where('isApproved', '==', true).count().get()
        ]);
        // Get today's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrdersSnapshot = await db.collection('orders')
            .where('createdAt', '>=', today)
            .get();
        const todayRevenue = todayOrdersSnapshot.docs.reduce((sum, doc) => {
            return sum + (doc.data().total || 0);
        }, 0);
        res.json({
            success: true,
            data: {
                totalUsers: usersSnapshot.data().count,
                totalOrders: ordersSnapshot.data().count,
                totalProducts: productsSnapshot.data().count,
                totalVendors: vendorsSnapshot.data().count,
                todayOrders: todayOrdersSnapshot.size,
                todayRevenue,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        message: 'Souk El-Syarat Backend API is running',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        endpoints: {
            auth: [
                'POST /api/auth/register',
                'GET /api/auth/profile/:userId'
            ],
            products: [
                'GET /api/products',
                'GET /api/products/:id',
                'POST /api/products',
                'PUT /api/products/:id',
                'DELETE /api/products/:id'
            ],
            vendors: [
                'GET /api/vendors',
                'POST /api/vendors/apply'
            ],
            orders: [
                'POST /api/orders',
                'GET /api/orders/user/:userId'
            ],
            chat: [
                'POST /api/chat/send',
                'GET /api/chat/conversations/:userId'
            ],
            search: [
                'GET /api/search'
            ],
            admin: [
                'GET /api/admin/dashboard'
            ]
        }
    });
});
// Root endpoint
app.get('/', (req, res) => {
    res.redirect('/health');
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.path
    });
});
// ============================================
// FIREBASE FUNCTIONS EXPORTS
// ============================================
// Main API
exports.api = functions
    .region('us-central1')
    .runWith({
    timeoutSeconds: 60,
    memory: '1GB'
})
    .https.onRequest(app);
// User creation trigger
exports.onUserCreated = functions
    .region('us-central1')
    .auth.user()
    .onCreate(async (user) => {
    // Create user profile if not exists
    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
        await userRef.set({
            email: user.email,
            displayName: user.displayName || 'User',
            phoneNumber: user.phoneNumber,
            photoURL: user.photoURL,
            role: 'customer',
            isActive: true,
            emailVerified: user.emailVerified,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    // Update stats
    await realtimeDb.ref('stats/users/total').transaction(current => (current || 0) + 1);
    console.log('User profile created for:', user.email);
});
// Order status update trigger
exports.onOrderStatusUpdate = functions
    .region('us-central1')
    .firestore.document('orders/{orderId}')
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.status !== after.status) {
        // Update real-time tracking
        await realtimeDb.ref(`orders/${context.params.orderId}/status`).set(after.status);
        // Send notification
        await db.collection('notifications').add({
            userId: after.customerId,
            type: 'order_status',
            title: 'Order Status Updated',
            message: `Your order ${after.orderNumber} is now ${after.status}`,
            orderId: context.params.orderId,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
});
// Daily analytics
exports.dailyAnalytics = functions
    .region('us-central1')
    .pubsub.schedule('0 2 * * *')
    .timeZone('Africa/Cairo')
    .onRun(async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const today = new Date(yesterday);
    today.setDate(today.getDate() + 1);
    // Aggregate yesterday's data
    const ordersSnapshot = await db.collection('orders')
        .where('createdAt', '>=', yesterday)
        .where('createdAt', '<', today)
        .get();
    const stats = {
        date: yesterday.toISOString().split('T')[0],
        orders: ordersSnapshot.size,
        revenue: ordersSnapshot.docs.reduce((sum, doc) => sum + (doc.data().total || 0), 0),
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    await db.collection('analytics').doc(stats.date).set(stats);
    console.log('Daily analytics completed for:', stats.date);
});
console.log('🚀 Full Backend API initialized');
//# sourceMappingURL=index.old.js.map