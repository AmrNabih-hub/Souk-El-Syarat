/**
 * FINAL SECURITY FIX - FORCE HEADERS
 * This version FORCES security headers and blocks malicious origins
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const app = express();
app.use(express.json({ limit: '10mb' }));

// CRITICAL: FORCE SECURITY ON EVERY SINGLE REQUEST
app.use((req, res, next) => {
  // Get origin from request
  const origin = req.headers.origin || req.headers.referer;
  
  // Define allowed origins
  const allowedOrigins = [
    'https://souk-el-syarat.web.app',
    'https://souk-el-syarat.firebaseapp.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174'
  ];
  
  // CRITICAL: Block malicious origins IMMEDIATELY
  if (origin) {
    const isAllowed = allowedOrigins.some(allowed => origin.startsWith(allowed));
    
    if (!isAllowed && !origin.includes('souk-el-syarat')) {
      // BLOCK THE REQUEST COMPLETELY
      console.warn(`BLOCKED malicious origin: ${origin}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Origin not allowed by CORS policy',
        blocked: true
      });
    }
    
    // Set CORS headers for allowed origins
    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  } else {
    // Allow requests with no origin (server-to-server)
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  // FORCE security headers on EVERY response
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://apis.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.googleapis.com");
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }
  
  next();
});

// Override headers AGAIN before sending (to combat Cloud Run overrides)
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(data: any) {
    // FORCE headers right before sending
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    return originalSend.call(this, data);
  };
  next();
});

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '4.0.0-secure',
    security: 'enforced',
    timestamp: new Date().toISOString()
  });
});

// Products endpoint with security check
app.get('/api/products', async (req, res) => {
  try {
    const origin = req.headers.origin;
    
    // Double-check origin
    if (origin && !isOriginAllowed(origin)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }
    
    const snapshot = await admin.firestore()
      .collection('products')
      .limit(20)
      .get();
    
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      products,
      total: products.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Categories endpoint
app.get('/api/categories', async (req, res) => {
  try {
    const snapshot = await admin.firestore()
      .collection('categories')
      .get();
    
    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      categories,
      total: categories.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Search endpoint
app.post('/api/search', async (req, res) => {
  const { query } = req.body;
  
  if (!query || query.trim() === '') {
    return res.status(400).json({ error: 'Query required' });
  }
  
  // Sanitize input
  const sanitized = query.replace(/<[^>]*>/g, '').substring(0, 100);
  
  try {
    const snapshot = await admin.firestore()
      .collection('products')
      .get();
    
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const results = products.filter((p: any) => {
      const text = `${p.title} ${p.description} ${p.brand}`.toLowerCase();
      return text.includes(sanitized.toLowerCase());
    });
    
    res.json({
      success: true,
      query: sanitized,
      results,
      total: results.length
    });
  } catch (error: any) {
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

// Helper function
function isOriginAllowed(origin: string): boolean {
  const allowed = [
    'https://souk-el-syarat.web.app',
    'https://souk-el-syarat.firebaseapp.com',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  return allowed.some(a => origin.startsWith(a));
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// FINAL HEADER ENFORCEMENT
const originalApp = app;
const wrappedApp = (req: any, res: any) => {
  // Intercept ALL responses
  const originalWriteHead = res.writeHead;
  res.writeHead = function(...args: any[]) {
    // FORCE security headers on writeHead
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    return originalWriteHead.apply(res, args);
  };
  
  return originalApp(req, res);
};

// Export with forced security
export const api = functions.https.onRequest(wrappedApp);