"use strict";
/**
 * Firebase Cloud Functions - Production Backend
 * Souk El-Sayarat Real Backend Server
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
exports.getUploadUrl = exports.dailyAnalytics = exports.onVendorApplication = exports.onOrderCreated = exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();
const realtimeDb = admin.database();
// ============================================
// EXPRESS APP CONFIGURATION
// ============================================
const app = (0, express_1.default)();
// CORS configuration for your domain
const corsOptions = {
    origin: [
        'https://souk-el-syarat.web.app',
        'https://souk-el-syarat.firebaseapp.com',
        'http://localhost:5173',
        'http://localhost:3000',
    ],
    credentials: true,
    optionsSuccessStatus: 200,
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// ============================================
// API ROUTES
// ============================================
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        project: 'souk-el-syarat',
        environment: 'production',
        services: {
            firestore: 'active',
            auth: 'active',
            storage: 'active',
            realtimeDb: 'active',
        },
    });
});
// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, role } = req.body;
        // Create user in Firebase Auth
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: `${firstName} ${lastName}`,
        });
        // Create user profile in Firestore
        await db.collection('users').doc(userRecord.uid).set({
            email,
            firstName,
            lastName,
            role: role || 'customer',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            verified: false,
        });
        res.status(201).json({
            success: true,
            userId: userRecord.uid,
            message: 'User registered successfully',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
// ============================================
// VENDOR ENDPOINTS
// ============================================
app.post('/api/vendors/apply', async (req, res) => {
    try {
        const { userId, businessInfo, documents } = req.body;
        // Create vendor application
        const applicationRef = await db.collection('vendor_applications').add({
            userId,
            businessInfo,
            documents,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Update real-time dashboard
        await realtimeDb.ref(`admin_dashboard/pending_vendors`).push({
            applicationId: applicationRef.id,
            userId,
            businessName: businessInfo.businessName,
            timestamp: Date.now(),
        });
        res.status(201).json({
            success: true,
            applicationId: applicationRef.id,
            message: 'Application submitted successfully',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
app.get('/api/vendors', async (req, res) => {
    try {
        const vendorsSnapshot = await db.collection('vendors')
            .where('approved', '==', true)
            .limit(20)
            .get();
        const vendors = vendorsSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        res.json({
            success: true,
            vendors,
            total: vendors.length,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// ============================================
// PRODUCT ENDPOINTS
// ============================================
app.get('/api/products', async (req, res) => {
    try {
        const { category, minPrice, maxPrice, search } = req.query;
        let query = db.collection('products').where('active', '==', true);
        if (category) {
            query = query.where('category', '==', category);
        }
        if (minPrice) {
            query = query.where('price', '>=', Number(minPrice));
        }
        if (maxPrice) {
            query = query.where('price', '<=', Number(maxPrice));
        }
        const productsSnapshot = await query.limit(50).get();
        let products = productsSnapshot.docs.map(doc => {
            const data = doc.data();
            return Object.assign({ id: doc.id, title: data.title || '', description: data.description || '', price: data.price || 0, category: data.category || '' }, data);
        });
        // Simple search filter (in production, use Algolia or Elasticsearch)
        if (search) {
            const searchLower = String(search).toLowerCase();
            products = products.filter(p => p.title.toLowerCase().includes(searchLower) ||
                p.description.toLowerCase().includes(searchLower));
        }
        res.json({
            success: true,
            products,
            total: products.length,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
app.post('/api/products', async (req, res) => {
    try {
        const productData = req.body;
        // Add product to Firestore
        const productRef = await db.collection('products').add(Object.assign(Object.assign({}, productData), { active: true, createdAt: admin.firestore.FieldValue.serverTimestamp() }));
        res.status(201).json({
            success: true,
            productId: productRef.id,
            message: 'Product created successfully',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
// ============================================
// ORDER ENDPOINTS
// ============================================
app.post('/api/orders', async (req, res) => {
    try {
        const { customerId, items, shippingAddress, paymentMethod } = req.body;
        // Calculate total
        let total = 0;
        for (const item of items) {
            const productDoc = await db.collection('products').doc(item.productId).get();
            if (productDoc.exists) {
                total += productDoc.data().price * item.quantity;
            }
        }
        // Create order
        const orderRef = await db.collection('orders').add({
            customerId,
            items,
            shippingAddress,
            paymentMethod,
            total,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Update real-time order tracking
        await realtimeDb.ref(`orders_realtime/${orderRef.id}`).set({
            orderId: orderRef.id,
            customerId,
            status: 'pending',
            total,
            timestamp: Date.now(),
        });
        res.status(201).json({
            success: true,
            orderId: orderRef.id,
            total,
            message: 'Order created successfully',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
// ============================================
// SEARCH ENDPOINT
// ============================================
app.get('/api/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            res.json({ success: true, results: [] });
            return;
        }
        // Simple search implementation
        // In production, use Algolia or Elasticsearch
        const searchTerm = String(q).toLowerCase();
        // Search products
        const productsSnapshot = await db.collection('products')
            .where('active', '==', true)
            .limit(20)
            .get();
        const results = productsSnapshot.docs
            .map(doc => {
            const data = doc.data();
            return Object.assign({ id: doc.id, type: 'product', title: data.title || '', description: data.description || '', category: data.category || '' }, data);
        })
            .filter(item => item.title.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm));
        res.json({
            success: true,
            query: q,
            results,
            total: results.length,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// ============================================
// REAL-TIME CHAT ENDPOINTS
// ============================================
app.post('/api/chat/send', async (req, res) => {
    try {
        const { conversationId, senderId, receiverId, message } = req.body;
        // Save message to Realtime Database for instant delivery
        const messageRef = await realtimeDb.ref(`chats/${conversationId}/messages`).push({
            senderId,
            receiverId,
            message,
            timestamp: Date.now(),
            read: false,
        });
        // Also save to Firestore for persistence
        await db.collection('conversations').doc(conversationId)
            .collection('messages').add({
            senderId,
            receiverId,
            message,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            read: false,
        });
        res.status(201).json({
            success: true,
            messageId: messageRef.key,
            message: 'Message sent successfully',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
// ============================================
// PAYMENT ENDPOINTS (InstaPay)
// ============================================
app.post('/api/payments/instapay/initiate', async (req, res) => {
    try {
        const { orderId, amount } = req.body;
        // Generate InstaPay payment reference
        const paymentRef = `SOUK-${orderId}-${Date.now()}`;
        // Save payment record
        await db.collection('payments').doc(paymentRef).set({
            orderId,
            amount,
            method: 'instapay',
            status: 'pending',
            merchantIPA: 'SOUKSAYARAT@CIB',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.json({
            success: true,
            paymentReference: paymentRef,
            merchantIPA: 'SOUKSAYARAT@CIB',
            amount,
            instructions: 'Please transfer the amount to the merchant IPA and use the payment reference',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
// ============================================
// ADMIN ENDPOINTS
// ============================================
app.get('/api/admin/dashboard', async (req, res) => {
    try {
        // Get statistics
        const [usersSnapshot, ordersSnapshot, productsSnapshot, vendorsSnapshot] = await Promise.all([
            db.collection('users').count().get(),
            db.collection('orders').count().get(),
            db.collection('products').where('active', '==', true).count().get(),
            db.collection('vendors').where('approved', '==', true).count().get(),
        ]);
        res.json({
            success: true,
            stats: {
                totalUsers: usersSnapshot.data().count,
                totalOrders: ordersSnapshot.data().count,
                totalProducts: productsSnapshot.data().count,
                totalVendors: vendorsSnapshot.data().count,
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Error handling middleware
app.use((err, req, res, _next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error',
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl,
    });
});
// ============================================
// FIREBASE CLOUD FUNCTIONS EXPORTS
// ============================================
// Main API function
exports.api = functions
    .region('us-central1')
    .runWith({
    timeoutSeconds: 60,
    memory: '1GB',
})
    .https.onRequest(app);
// ============================================
// DATABASE TRIGGERS
// ============================================
// Trigger when new order is created
exports.onOrderCreated = functions
    .region('us-central1')
    .firestore
    .document('orders/{orderId}')
    .onCreate(async (snapshot, context) => {
    const order = snapshot.data();
    const { orderId } = context.params;
    // Update vendor dashboard
    if (order.vendorId) {
        await realtimeDb.ref(`vendor_dashboard/${order.vendorId}/new_orders`).push({
            orderId,
            amount: order.total,
            timestamp: Date.now(),
        });
    }
    // Update admin dashboard
    await realtimeDb.ref('admin_dashboard/recent_orders').push({
        orderId,
        customerId: order.customerId,
        total: order.total,
        timestamp: Date.now(),
    });
    console.log('New order processed:', orderId);
});
// Trigger when vendor application is submitted
exports.onVendorApplication = functions
    .region('us-central1')
    .firestore
    .document('vendor_applications/{applicationId}')
    .onCreate(async (snapshot, context) => {
    var _a;
    const application = snapshot.data();
    const { applicationId } = context.params;
    // Notify admin via real-time database
    await realtimeDb.ref('admin_dashboard/notifications').push({
        type: 'new_vendor_application',
        applicationId,
        businessName: (_a = application.businessInfo) === null || _a === void 0 ? void 0 : _a.businessName,
        timestamp: Date.now(),
        read: false,
    });
    console.log('New vendor application:', applicationId);
});
// ============================================
// SCHEDULED FUNCTIONS
// ============================================
// Daily analytics aggregation
exports.dailyAnalytics = functions
    .region('us-central1')
    .pubsub
    .schedule('0 2 * * *') // Run at 2 AM daily
    .timeZone('Africa/Cairo')
    .onRun(async (_context) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const today = new Date(yesterday);
    today.setDate(today.getDate() + 1);
    // Count yesterday's orders
    const ordersSnapshot = await db.collection('orders')
        .where('createdAt', '>=', yesterday)
        .where('createdAt', '<', today)
        .get();
    // Save analytics
    await db.collection('analytics').doc(yesterday.toISOString().split('T')[0]).set({
        date: yesterday,
        orders: {
            count: ordersSnapshot.size,
            total: ordersSnapshot.docs.reduce((sum, doc) => sum + (doc.data().total || 0), 0),
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('Daily analytics completed for:', yesterday.toISOString().split('T')[0]);
});
// ============================================
// CALLABLE FUNCTIONS
// ============================================
// Callable function for file upload URL generation
exports.getUploadUrl = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { fileName, fileType, folder } = data;
    // Generate signed URL for direct upload
    const bucket = storage.bucket();
    const file = bucket.file(`${folder}/${context.auth.uid}/${fileName}`);
    const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: fileType,
    });
    return {
        uploadUrl: url,
        filePath: file.name,
    };
});
console.log('🚀 Firebase Cloud Functions initialized for Souk El-Syarat');
//# sourceMappingURL=index.js.map