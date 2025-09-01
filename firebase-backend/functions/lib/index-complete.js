"use strict";
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
const cors_fix_1 = require("./cors-fix");
const request_id_1 = require("./request-id");
// Initialize
if (!admin.apps.length) {
    admin.initializeApp();
}
const app = (0, express_1.default)();
// Apply fixes
app.use(cors_fix_1.corsConfig); // Fix 1: CORS with credentials
app.use(request_id_1.requestIdMiddleware); // Fix 2: Request ID
app.use(express_1.default.json({ limit: '10mb' }));
// Security headers
app.use((req, res, next) => {
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});
// Health endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: '5.0.0-complete',
        timestamp: new Date().toISOString(),
        requestId: req.id // Include request ID in response
    });
});
// Products endpoint
app.get('/api/products', async (req, res) => {
    try {
        const snapshot = await admin.firestore()
            .collection('products')
            .limit(20)
            .get();
        const products = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        res.json({
            success: true,
            products,
            total: products.length
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Categories endpoint
app.get('/api/categories', async (req, res) => {
    try {
        const snapshot = await admin.firestore()
            .collection('categories')
            .get();
        const categories = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        res.json({
            success: true,
            categories,
            total: categories.length
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Search endpoint
app.post('/api/search', async (req, res) => {
    const { query } = req.body;
    if (!query || query.trim() === '') {
        return res.status(400).json({ error: 'Query required' });
    }
    try {
        const snapshot = await admin.firestore()
            .collection('products')
            .get();
        const products = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        const results = products.filter((p) => {
            const text = `${p.title} ${p.description}`.toLowerCase();
            return text.includes(query.toLowerCase());
        });
        res.json({
            success: true,
            query,
            results,
            total: results.length
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Orders endpoint (protected)
app.get('/api/orders', async (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json({ success: true, orders: [] });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not found',
        requestId: req.id
    });
});
// Export
exports.api = functions.https.onRequest(app);
//# sourceMappingURL=index-complete.js.map