"use strict";
/**
 * ENHANCED PROFESSIONAL BACKEND
 * Implements Latest Security Standards (August 2025)
 * OWASP Top 10 Compliant
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
exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
// Import professional middleware
const cors_config_1 = __importStar(require("./middleware/cors-config"));
const security_1 = require("./middleware/security");
// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}
// Initialize Express app
const app = (0, express_1.default)();
// Apply compression for better performance
app.use((0, compression_1.default)());
// Logging middleware (production-ready)
if (process.env.NODE_ENV === 'production') {
    app.use((0, morgan_1.default)('combined')); // Apache combined log format
}
else {
    app.use((0, morgan_1.default)('dev')); // Concise colored output for development
}
// Apply professional CORS configuration
app.use(cors_config_1.default);
app.use((0, cors_config_1.customCorsMiddleware)());
// Body parsing with size limits
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Apply comprehensive security suite
(0, security_1.applySecurity)(app);
// Request ID middleware for tracing
app.use((req, res, next) => {
    req.id = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    res.setHeader('X-Request-ID', req.id);
    next();
});
// Performance monitoring
app.use((req, res, next) => {
    req.startTime = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - req.startTime;
        if (duration > 1000) {
            console.warn(`Slow request: ${req.method} ${req.path} took ${duration}ms`);
        }
    });
    next();
});
// ============= HEALTH & MONITORING ENDPOINTS =============
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Souk El-Sayarat API',
        version: '3.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'production'
    });
});
app.get('/api/metrics', (req, res) => {
    res.json({
        timestamp: new Date().toISOString(),
        metrics: {
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            uptime: process.uptime(),
            version: process.version
        }
    });
});
// Handle preflight requests
app.options('*', cors_config_1.preflightHandler);
// ============= JWT VERIFICATION MIDDLEWARE =============
async function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'No authorization token provided',
            code: 'auth/no-token',
            requestId: req.id
        });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token, true);
        // Additional token validation
        const now = Math.floor(Date.now() / 1000);
        if (decodedToken.exp && decodedToken.exp < now) {
            return res.status(401).json({
                error: 'Token has expired',
                code: 'auth/token-expired',
                requestId: req.id
            });
        }
        // Attach user info to request
        req.user = decodedToken;
        req.userId = decodedToken.uid;
        req.userEmail = decodedToken.email;
        // Log authenticated request
        console.log(`Authenticated request: ${req.method} ${req.path} by ${req.userEmail}`);
        next();
    }
    catch (error) {
        console.error('Token verification error:', error);
        const errorResponse = {
            error: 'Authentication failed',
            code: error.code || 'auth/invalid-token',
            requestId: req.id
        };
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json(Object.assign(Object.assign({}, errorResponse), { error: 'Token has expired' }));
        }
        if (error.code === 'auth/id-token-revoked') {
            return res.status(401).json(Object.assign(Object.assign({}, errorResponse), { error: 'Token has been revoked' }));
        }
        return res.status(401).json(errorResponse);
    }
}
// ============= CATEGORIES ENDPOINTS =============
app.get('/api/categories', async (req, res) => {
    try {
        const cached = await getCachedData('categories');
        if (cached) {
            return res.json(cached);
        }
        const categoriesSnapshot = await admin.firestore()
            .collection('categories')
            .orderBy('order', 'asc')
            .get();
        const categories = categoriesSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        const response = {
            success: true,
            categories,
            total: categories.length,
            timestamp: new Date().toISOString()
        };
        await setCachedData('categories', response, 3600); // Cache for 1 hour
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch categories',
            message: error.message,
            requestId: req.id
        });
    }
});
// ============= PRODUCTS ENDPOINTS =============
app.get('/api/products', async (req, res) => {
    try {
        // Extract and validate query parameters
        const { category, minPrice = 0, maxPrice = Number.MAX_SAFE_INTEGER, search, limit = 20, offset = 0, sortBy = 'createdAt', order = 'desc' } = req.query;
        // Validate pagination
        const validatedLimit = Math.min(Math.max(1, parseInt(limit)), 100);
        const validatedOffset = Math.max(0, parseInt(offset));
        // Build Firestore query
        let query = admin.firestore().collection('products')
            .where('active', '==', true);
        // Apply filters
        if (category) {
            query = query.where('category', '==', category);
        }
        if (minPrice > 0) {
            query = query.where('price', '>=', parseFloat(minPrice));
        }
        if (maxPrice < Number.MAX_SAFE_INTEGER) {
            query = query.where('price', '<=', parseFloat(maxPrice));
        }
        // Execute query
        const snapshot = await query.get();
        let products = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        // Apply text search if provided
        if (search) {
            const searchTerm = search.toLowerCase();
            products = products.filter((product) => {
                const searchableText = `${product.title || ''} ${product.description || ''} ${product.brand || ''} ${product.model || ''}`.toLowerCase();
                return searchableText.includes(searchTerm);
            });
        }
        // Sort products
        products.sort((a, b) => {
            const aVal = a[sortBy] || 0;
            const bVal = b[sortBy] || 0;
            return order === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
        });
        // Apply pagination
        const paginatedProducts = products.slice(validatedOffset, validatedOffset + validatedLimit);
        // Prepare response
        const response = {
            success: true,
            products: paginatedProducts,
            pagination: {
                total: products.length,
                limit: validatedLimit,
                offset: validatedOffset,
                hasMore: validatedOffset + validatedLimit < products.length,
                page: Math.floor(validatedOffset / validatedLimit) + 1,
                totalPages: Math.ceil(products.length / validatedLimit)
            },
            filters: {
                category,
                minPrice: parseFloat(minPrice) || 0,
                maxPrice: parseFloat(maxPrice) || undefined,
                search
            },
            sort: {
                by: sortBy,
                order
            },
            timestamp: new Date().toISOString()
        };
        // Set pagination headers
        res.setHeader('X-Total-Count', products.length.toString());
        res.setHeader('X-Page-Count', response.pagination.totalPages.toString());
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch products',
            message: error.message,
            requestId: req.id
        });
    }
});
app.get('/api/products/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        // Validate product ID format
        if (!productId || productId.length < 10) {
            return res.status(400).json({
                success: false,
                error: 'Invalid product ID format',
                requestId: req.id
            });
        }
        const doc = await admin.firestore()
            .collection('products')
            .doc(productId)
            .get();
        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Product not found',
                code: 'product/not-found',
                requestId: req.id
            });
        }
        // Increment view count
        await doc.ref.update({
            views: admin.firestore.FieldValue.increment(1),
            lastViewed: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({
            success: true,
            product: Object.assign({ id: doc.id }, doc.data()),
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error fetching product:', error);
        if (error.code === 5 || error.code === 'invalid-argument') {
            return res.status(404).json({
                success: false,
                error: 'Product not found',
                code: 'product/invalid-id',
                requestId: req.id
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to fetch product',
            message: error.message,
            requestId: req.id
        });
    }
});
// ============= SEARCH ENDPOINT =============
app.post('/api/search', security_1.inputSanitizer, async (req, res) => {
    try {
        const { query, filters = {}, limit = 20, offset = 0 } = req.body;
        if (!query || query.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Search query is required',
                requestId: req.id
            });
        }
        // Log search query for analytics
        await logSearchQuery(query, req.userId);
        // Perform search
        const results = await performAdvancedSearch(query, filters, limit, offset);
        res.json({
            success: true,
            query,
            results: results.items,
            total: results.total,
            pagination: {
                limit,
                offset,
                hasMore: offset + limit < results.total
            },
            suggestions: results.suggestions,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            error: 'Search failed',
            message: error.message,
            requestId: req.id
        });
    }
});
// ============= ORDERS ENDPOINTS =============
app.post('/api/orders', verifyToken, security_1.strictRateLimiter, async (req, res) => {
    try {
        const orderData = req.body;
        // Validate order data
        const validation = validateOrderData(orderData);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: 'Invalid order data',
                details: validation.errors,
                requestId: req.id
            });
        }
        // Create order with transaction
        const orderId = await createOrderWithTransaction(orderData, req.userId);
        res.status(201).json({
            success: true,
            orderId,
            message: 'Order created successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create order',
            message: error.message,
            requestId: req.id
        });
    }
});
app.get('/api/orders', verifyToken, async (req, res) => {
    try {
        const { status, limit = 20, offset = 0 } = req.query;
        let query = admin.firestore()
            .collection('orders')
            .where('userId', '==', req.userId)
            .orderBy('createdAt', 'desc');
        if (status) {
            query = query.where('status', '==', status);
        }
        const snapshot = await query.get();
        const orders = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        // Apply pagination
        const paginatedOrders = orders.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
        res.json({
            success: true,
            orders: paginatedOrders,
            total: orders.length,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: parseInt(offset) + parseInt(limit) < orders.length
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch orders',
            message: error.message,
            requestId: req.id
        });
    }
});
// ============= HELPER FUNCTIONS =============
async function getCachedData(key) {
    // Implement Redis or Memcached in production
    // For now, return null to skip caching
    return null;
}
async function setCachedData(key, data, ttl) {
    // Implement Redis or Memcached in production
    return;
}
async function logSearchQuery(query, userId) {
    try {
        await admin.firestore().collection('search_logs').add({
            query,
            userId: userId || null,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    catch (error) {
        console.error('Failed to log search query:', error);
    }
}
async function performAdvancedSearch(query, filters, limit, offset) {
    // Implement advanced search logic
    const snapshot = await admin.firestore().collection('products').get();
    let products = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
    // Text search
    const searchTerm = query.toLowerCase();
    products = products.filter((product) => {
        const searchableText = `${product.title || ''} ${product.description || ''} ${product.brand || ''}`.toLowerCase();
        return searchableText.includes(searchTerm);
    });
    // Apply filters
    if (filters.category) {
        products = products.filter((p) => p.category === filters.category);
    }
    return {
        items: products.slice(offset, offset + limit),
        total: products.length,
        suggestions: [] // Implement search suggestions
    };
}
function validateOrderData(data) {
    const errors = [];
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        errors.push('Order must contain at least one item');
    }
    if (!data.shippingAddress) {
        errors.push('Shipping address is required');
    }
    if (!data.total || data.total <= 0) {
        errors.push('Order total must be greater than 0');
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
async function createOrderWithTransaction(orderData, userId) {
    const db = admin.firestore();
    return db.runTransaction(async (transaction) => {
        // Generate order ID
        const orderRef = db.collection('orders').doc();
        // Create order
        transaction.set(orderRef, Object.assign(Object.assign({}, orderData), { userId, status: 'pending', orderNumber: `ORD-${Date.now()}`, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }));
        // Update inventory for each item
        for (const item of orderData.items) {
            const productRef = db.collection('products').doc(item.productId);
            transaction.update(productRef, {
                inventory: admin.firestore.FieldValue.increment(-item.quantity)
            });
        }
        return orderRef.id;
    });
}
// ============= ERROR HANDLERS =============
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method,
        requestId: req.id,
        timestamp: new Date().toISOString()
    });
});
// CORS error handler
app.use(cors_config_1.corsErrorHandler);
// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || 'Internal server error';
    res.status(statusCode).json(Object.assign({ success: false, error: message, code: err.code || 'internal-error', requestId: req.id, timestamp: new Date().toISOString() }, (process.env.NODE_ENV !== 'production' && { stack: err.stack })));
});
// Export the Express app as a Cloud Function
exports.api = functions.https.onRequest(app);
//# sourceMappingURL=index-broken.js.map