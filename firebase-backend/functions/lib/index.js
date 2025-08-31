"use strict";
/**
 * Simple Firebase Cloud Function for Souk El-Syarat
 * This is a minimal backend to get started
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
exports.onUserCreated = exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}
// Simple HTTP endpoint
exports.api = functions
    .https.onRequest((request, response) => {
    // Enable CORS
    response.set('Access-Control-Allow-Origin', '*');
    response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    // Handle preflight
    if (request.method === 'OPTIONS') {
        response.status(204).send('');
        return;
    }
    // Basic routing
    const path = request.path;
    if (path === '/' || path === '/health') {
        response.json({
            status: 'healthy',
            message: 'Souk El-Syarat Backend is running!',
            timestamp: new Date().toISOString(),
            project: 'souk-el-syarat',
            version: '1.0.0'
        });
    }
    else if (path === '/api/products') {
        // Mock products for now
        response.json({
            success: true,
            products: [
                {
                    id: '1',
                    title: 'Toyota Camry 2023',
                    price: 850000,
                    category: 'sedan',
                    image: 'https://via.placeholder.com/300'
                },
                {
                    id: '2',
                    title: 'Honda Civic 2023',
                    price: 650000,
                    category: 'sedan',
                    image: 'https://via.placeholder.com/300'
                }
            ]
        });
    }
    else if (path === '/api/vendors') {
        // Mock vendors
        response.json({
            success: true,
            vendors: [
                {
                    id: '1',
                    name: 'Premium Auto',
                    rating: 4.5,
                    products: 25
                },
                {
                    id: '2',
                    name: 'Elite Motors',
                    rating: 4.8,
                    products: 18
                }
            ]
        });
    }
    else {
        response.status(404).json({
            error: 'Not Found',
            path: request.path
        });
    }
});
// Simple Firestore trigger for new users
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
    const db = admin.firestore();
    // Create user profile
    await db.collection('users').doc(user.uid).set({
        email: user.email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        role: 'customer',
        verified: false
    });
    console.log('User profile created for:', user.email);
});
console.log('Simple backend initialized');
//# sourceMappingURL=index.js.map