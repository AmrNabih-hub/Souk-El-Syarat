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
if (!admin.apps.length) {
    admin.initializeApp();
}
const app = (0, express_1.default)();
// CRITICAL: Block malicious origins FIRST
app.use((req, res, next) => {
    const origin = req.headers.origin || req.headers.referer;
    const allowedOrigins = [
        'https://souk-el-syarat.web.app',
        'https://souk-el-syarat.firebaseapp.com',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174'
    ];
    // If origin exists and is not allowed, BLOCK IT
    if (origin) {
        const isAllowed = allowedOrigins.some(allowed => origin.startsWith(allowed));
        if (!isAllowed) {
            console.warn(`BLOCKED: Malicious origin ${origin}`);
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Origin not allowed'
            });
        }
        // Set CORS for allowed origins
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    // Security headers
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Request-ID', `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
        return res.status(204).end();
    }
    next();
});
app.use(express_1.default.json({ limit: '10mb' }));
// Health endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: '7.0.0-secure',
        timestamp: new Date().toISOString()
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
    res.status(404).json({ error: 'Not found' });
});
exports.api = functions.https.onRequest(app);
//# sourceMappingURL=index-secure.js.map