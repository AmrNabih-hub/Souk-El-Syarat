"use strict";
/**
 * GEN2 CLOUD FUNCTIONS - PROFESSIONAL IMPLEMENTATION
 * Enhanced Performance, Security, and Scalability
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
exports.processAsyncTask = exports.dailyReports = exports.processProductImage = exports.onProductCreated = exports.promoteUser = exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const storage_1 = require("firebase-functions/v2/storage");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const pubsub_1 = require("firebase-functions/v2/pubsub");
const options_1 = require("firebase-functions/v2/options");
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Import middleware
const rbac_middleware_1 = require("./middleware/rbac.middleware");
// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}
// Set global options for all Gen2 functions
(0, options_1.setGlobalOptions)({
    region: 'us-central1',
    memory: '1GiB',
    maxInstances: 100,
    minInstances: 1,
    timeoutSeconds: 60,
});
const db = admin.firestore();
const auth = admin.auth();
const realtimeDb = admin.database();
// ============================================
// EXPRESS APP WITH SECURITY
// ============================================
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
// Compression
app.use((0, compression_1.default)());
// CORS with specific origins
app.use((0, cors_1.default)({
    origin: [
        'https://souk-el-syarat.web.app',
        'https://souk-el-syarat.firebaseapp.com',
        'http://localhost:5173',
        'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));
// Body parsing with limits
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Request ID middleware
app.use((req, res, next) => {
    req['requestId'] = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    res.setHeader('X-Request-ID', req['requestId']);
    next();
});
// Global rate limiter
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', globalLimiter);
// Authentication middleware
const authenticateUser = async (req, res, next) => {
    var _a, _b;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'No token provided',
                requestId: req['requestId']
            });
        }
        const decodedToken = await auth.verifyIdToken(token);
        req.user = decodedToken;
        // Get user role
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        req.userRole = ((_b = userDoc.data()) === null || _b === void 0 ? void 0 : _b.role) || 'customer';
        next();
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Invalid token',
            requestId: req['requestId']
        });
    }
};
// ============================================
// SUPER ADMIN ENDPOINTS
// ============================================
// System configuration (Super Admin only)
app.get('/api/admin/system/config', authenticateUser, (0, rbac_middleware_1.requireRole)('super_admin'), rbac_middleware_1.auditLog, async (req, res) => {
    try {
        const config = await db.collection('system_config').doc('main').get();
        res.json({
            success: true,
            data: config.data(),
            requestId: req['requestId']
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            requestId: req['requestId']
        });
    }
});
// Manage other admins (Super Admin only)
app.post('/api/admin/users/promote', authenticateUser, (0, rbac_middleware_1.requireRole)('super_admin'), rbac_middleware_1.auditLog, async (req, res) => {
    try {
        const { userId, newRole } = req.body;
        // Update user role
        await db.collection('users').doc(userId).update({
            role: newRole,
            promotedBy: req.user.uid,
            promotedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Set custom claims
        await auth.setCustomUserClaims(userId, { role: newRole });
        // Log the action
        await db.collection('role_changes').add({
            userId,
            oldRole: 'unknown',
            newRole,
            changedBy: req.user.uid,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({
            success: true,
            message: `User promoted to ${newRole}`,
            requestId: req['requestId']
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            requestId: req['requestId']
        });
    }
});
// ============================================
// FINANCE MANAGER ENDPOINTS
// ============================================
// Financial dashboard (Finance Manager)
app.get('/api/finance/dashboard', authenticateUser, (0, rbac_middleware_1.requirePermission)('finance.view'), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        // Get financial data
        const ordersQuery = db.collection('orders')
            .where('createdAt', '>=', new Date(startDate))
            .where('createdAt', '<=', new Date(endDate));
        const orders = await ordersQuery.get();
        let totalRevenue = 0;
        let totalCommission = 0;
        let totalRefunds = 0;
        orders.forEach(doc => {
            const order = doc.data();
            totalRevenue += order.total || 0;
            totalCommission += (order.total || 0) * 0.1; // 10% commission
            if (order.status === 'refunded') {
                totalRefunds += order.total || 0;
            }
        });
        res.json({
            success: true,
            data: {
                totalRevenue,
                totalCommission,
                totalRefunds,
                netRevenue: totalRevenue - totalRefunds,
                orderCount: orders.size,
                period: { startDate, endDate }
            },
            requestId: req['requestId']
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            requestId: req['requestId']
        });
    }
});
// Process refund (Finance Manager)
app.post('/api/finance/refund', authenticateUser, (0, rbac_middleware_1.requirePermission)('refunds.process'), rbac_middleware_1.auditLog, async (req, res) => {
    try {
        const { orderId, amount, reason } = req.body;
        // Create refund record
        const refundRef = await db.collection('refunds').add({
            orderId,
            amount,
            reason,
            processedBy: req.user.uid,
            status: 'processing',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Update order status
        await db.collection('orders').doc(orderId).update({
            status: 'refunded',
            refundAmount: amount,
            refundId: refundRef.id
        });
        res.json({
            success: true,
            message: 'Refund processed',
            refundId: refundRef.id,
            requestId: req['requestId']
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            requestId: req['requestId']
        });
    }
});
// ============================================
// MODERATOR ENDPOINTS
// ============================================
// Review reported content (Moderator)
app.get('/api/moderation/reports', authenticateUser, (0, rbac_middleware_1.requirePermission)('reports.handle'), async (req, res) => {
    try {
        const reports = await db.collection('reports')
            .where('status', '==', 'pending')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
        const reportData = reports.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        res.json({
            success: true,
            data: reportData,
            requestId: req['requestId']
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            requestId: req['requestId']
        });
    }
});
// Suspend user (Moderator)
app.post('/api/moderation/suspend-user', authenticateUser, (0, rbac_middleware_1.requirePermission)('users.suspend'), rbac_middleware_1.auditLog, async (req, res) => {
    try {
        const { userId, reason, duration } = req.body;
        const suspendUntil = new Date();
        suspendUntil.setDate(suspendUntil.getDate() + (duration || 7));
        // Update user status
        await db.collection('users').doc(userId).update({
            suspended: true,
            suspendedUntil: suspendUntil,
            suspendReason: reason,
            suspendedBy: req.user.uid
        });
        // Disable auth account
        await auth.updateUser(userId, {
            disabled: true
        });
        res.json({
            success: true,
            message: `User suspended for ${duration} days`,
            requestId: req['requestId']
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            requestId: req['requestId']
        });
    }
});
// ============================================
// INSPECTOR ENDPOINTS
// ============================================
// Verify car condition (Inspector)
app.post('/api/inspector/verify-car', authenticateUser, (0, rbac_middleware_1.requirePermission)('cars.inspect'), rbac_middleware_1.auditLog, async (req, res) => {
    try {
        const { listingId, inspectionReport } = req.body;
        // Create inspection record
        const inspectionRef = await db.collection('inspections').add({
            listingId,
            inspectorId: req.user.uid,
            report: inspectionReport,
            status: 'completed',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Update listing with verification
        await db.collection('car_listings').doc(listingId).update({
            verified: true,
            verifiedBy: req.user.uid,
            inspectionId: inspectionRef.id,
            verificationDate: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({
            success: true,
            message: 'Car verified successfully',
            inspectionId: inspectionRef.id,
            requestId: req['requestId']
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            requestId: req['requestId']
        });
    }
});
// ============================================
// VENDOR MANAGER ENDPOINTS
// ============================================
// Set vendor commission rate (Vendor Manager)
app.put('/api/vendors/:vendorId/commission', authenticateUser, (0, rbac_middleware_1.requirePermission)('commissions.set'), rbac_middleware_1.auditLog, async (req, res) => {
    try {
        const { vendorId } = req.params;
        const { commissionRate, reason } = req.body;
        // Update vendor commission
        await db.collection('vendors').doc(vendorId).update({
            commissionRate,
            commissionUpdatedBy: req.user.uid,
            commissionUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Log the change
        await db.collection('commission_changes').add({
            vendorId,
            newRate: commissionRate,
            reason,
            changedBy: req.user.uid,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({
            success: true,
            message: `Commission rate updated to ${commissionRate}%`,
            requestId: req['requestId']
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            requestId: req['requestId']
        });
    }
});
// ============================================
// PREMIUM FEATURES
// ============================================
// Premium deals (Premium Customer)
app.get('/api/premium/deals', authenticateUser, (0, rbac_middleware_1.requirePermission)('premium_deals.access'), async (req, res) => {
    try {
        const deals = await db.collection('premium_deals')
            .where('active', '==', true)
            .where('expiresAt', '>', new Date())
            .get();
        const dealData = deals.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        res.json({
            success: true,
            data: dealData,
            requestId: req['requestId']
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            requestId: req['requestId']
        });
    }
});
// Bulk upload products (Verified Vendor)
app.post('/api/vendor/products/bulk', authenticateUser, (0, rbac_middleware_1.requirePermission)('products.bulk'), (0, rbac_middleware_1.rateLimitByRole)(), async (req, res) => {
    try {
        const { products } = req.body;
        const vendorId = req.user.uid;
        if (products.length > 100) {
            return res.status(400).json({
                success: false,
                error: 'Maximum 100 products per bulk upload',
                requestId: req['requestId']
            });
        }
        // Batch write
        const batch = db.batch();
        const productIds = [];
        products.forEach((product) => {
            const productRef = db.collection('products').doc();
            productIds.push(productRef.id);
            batch.set(productRef, Object.assign(Object.assign({}, product), { vendorId, createdAt: admin.firestore.FieldValue.serverTimestamp(), isActive: true }));
        });
        await batch.commit();
        res.json({
            success: true,
            message: `${products.length} products uploaded`,
            productIds,
            requestId: req['requestId']
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            requestId: req['requestId']
        });
    }
});
// ============================================
// ANALYTICS ENDPOINTS
// ============================================
// Advanced analytics (Analytics Viewer)
app.get('/api/analytics/advanced', authenticateUser, (0, rbac_middleware_1.requirePermission)('analytics.view'), async (req, res) => {
    try {
        const { metric, period = '7d' } = req.query;
        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        switch (period) {
            case '24h':
                startDate.setHours(startDate.getHours() - 24);
                break;
            case '7d':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(startDate.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(startDate.getDate() - 90);
                break;
        }
        // Get analytics data based on metric
        let data = {};
        switch (metric) {
            case 'revenue':
                const orders = await db.collection('orders')
                    .where('createdAt', '>=', startDate)
                    .where('createdAt', '<=', endDate)
                    .get();
                data = {
                    total: orders.docs.reduce((sum, doc) => sum + (doc.data().total || 0), 0),
                    count: orders.size,
                    average: orders.size > 0 ? orders.docs.reduce((sum, doc) => sum + (doc.data().total || 0), 0) / orders.size : 0
                };
                break;
            case 'users':
                const users = await db.collection('users')
                    .where('createdAt', '>=', startDate)
                    .where('createdAt', '<=', endDate)
                    .get();
                data = {
                    newUsers: users.size,
                    byRole: {}
                };
                users.forEach(doc => {
                    const role = doc.data().role || 'customer';
                    data.byRole[role] = (data.byRole[role] || 0) + 1;
                });
                break;
            case 'products':
                const products = await db.collection('products')
                    .where('createdAt', '>=', startDate)
                    .where('createdAt', '<=', endDate)
                    .get();
                data = {
                    newProducts: products.size,
                    byCategory: {}
                };
                products.forEach(doc => {
                    const category = doc.data().category;
                    if (category) {
                        data.byCategory[category] = (data.byCategory[category] || 0) + 1;
                    }
                });
                break;
        }
        res.json({
            success: true,
            metric,
            period,
            dateRange: { startDate, endDate },
            data,
            requestId: req['requestId']
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            requestId: req['requestId']
        });
    }
});
// ============================================
// HEALTH & MONITORING
// ============================================
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        message: 'Souk El-Syarat Gen2 API',
        version: '4.0.0',
        generation: 'gen2',
        timestamp: new Date().toISOString(),
        features: {
            roles: Object.keys(rbac_middleware_1.ROLE_HIERARCHY),
            security: 'advanced',
            rateLimit: 'role-based',
            audit: 'enabled',
            monitoring: 'active'
        },
        requestId: req['requestId']
    });
});
// ============================================
// GEN2 FUNCTION EXPORTS
// ============================================
// Main API with Gen2 configuration
exports.api = (0, https_1.onRequest)({
    region: 'us-central1',
    memory: '2GiB',
    cpu: 2,
    timeoutSeconds: 300,
    maxInstances: 100,
    minInstances: 2,
    concurrency: 1000,
    labels: {
        environment: 'production',
        version: 'gen2'
    }
}, app);
// Callable function for sensitive operations
exports.promoteUser = (0, https_1.onCall)({
    region: 'us-central1',
    memory: '512MiB',
    maxInstances: 10,
    enforceAppCheck: true, // Requires App Check
}, async (request) => {
    var _a, _b;
    // Verify super admin
    if (((_b = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.token) === null || _b === void 0 ? void 0 : _b.role) !== 'super_admin') {
        throw new Error('Unauthorized');
    }
    const { userId, newRole } = request.data;
    // Update role
    await db.collection('users').doc(userId).update({
        role: newRole,
        promotedBy: request.auth.uid,
        promotedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    await auth.setCustomUserClaims(userId, { role: newRole });
    return {
        success: true,
        message: `User promoted to ${newRole}`
    };
});
// Document triggers with Gen2
exports.onProductCreated = (0, firestore_1.onDocumentCreated)({
    document: 'products/{productId}',
    region: 'us-central1',
    memory: '256MiB',
}, async (event) => {
    var _a;
    const product = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    // Update vendor stats
    if (product === null || product === void 0 ? void 0 : product.vendorId) {
        await db.collection('vendors').doc(product.vendorId).update({
            totalProducts: admin.firestore.FieldValue.increment(1),
            lastProductAdded: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    // Update category stats
    if (product === null || product === void 0 ? void 0 : product.category) {
        await realtimeDb.ref(`stats/products/byCategory/${product.category}`)
            .transaction((current) => (current || 0) + 1);
    }
});
// Storage trigger for image processing
exports.processProductImage = (0, storage_1.onObjectFinalized)({
    bucket: 'souk-el-syarat.appspot.com',
    region: 'us-central1',
    memory: '1GiB',
    cpu: 1,
}, async (event) => {
    const filePath = event.data.name;
    // Only process product images
    if (!(filePath === null || filePath === void 0 ? void 0 : filePath.startsWith('products/'))) {
        return;
    }
    // Image processing logic here
    console.log('Processing image:', filePath);
});
// Scheduled function with Gen2
exports.dailyReports = (0, scheduler_1.onSchedule)({
    schedule: '0 2 * * *',
    timeZone: 'Africa/Cairo',
    region: 'us-central1',
    memory: '1GiB',
    maxInstances: 1,
}, async () => {
    // Generate daily reports
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    // Aggregate data
    const report = {
        date: yesterday.toISOString().split('T')[0],
        metrics: {},
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    await db.collection('daily_reports').doc(report.date).set(report);
    console.log('Daily report generated for:', report.date);
});
// PubSub for async processing
exports.processAsyncTask = (0, pubsub_1.onMessagePublished)({
    topic: 'async-tasks',
    region: 'us-central1',
    memory: '512MiB',
}, async (event) => {
    const message = event.data.message;
    const task = JSON.parse(Buffer.from(message.data, 'base64').toString());
    console.log('Processing async task:', task.type);
    switch (task.type) {
        case 'send_email':
            // Send email logic
            break;
        case 'generate_report':
            // Generate report logic
            break;
        case 'process_payment':
            // Process payment logic
            break;
    }
});
console.log('🚀 Gen2 Professional Backend with Advanced RBAC initialized');
//# sourceMappingURL=index.gen2.js.map