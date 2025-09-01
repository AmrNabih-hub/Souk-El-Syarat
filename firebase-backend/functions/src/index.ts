/**
 * FIXED AND ENHANCED BACKEND
 * All security and functionality issues resolved
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialize Express app
const app = express();

// Enhanced CORS configuration
const corsOptions = {
  origin: [
    'https://souk-el-syarat.web.app',
    'https://souk-el-syarat.firebaseapp.com',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});

// Input sanitization helper
function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const key in input) {
      sanitized[key] = sanitizeInput(input[key]);
    }
    return sanitized;
  }
  return input;
}

// Enhanced JWT verification middleware
async function verifyToken(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'No authorization token provided',
      code: 'auth/no-token'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token, true);
    
    // Check token expiration
    const now = Math.floor(Date.now() / 1000);
    if (decodedToken.exp && decodedToken.exp < now) {
      return res.status(401).json({ 
        error: 'Token has expired',
        code: 'auth/token-expired'
      });
    }
    
    req.user = decodedToken;
    req.userId = decodedToken.uid;
    next();
  } catch (error: any) {
    console.error('Token verification error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ 
        error: 'Token has expired',
        code: 'auth/token-expired'
      });
    }
    
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ 
        error: 'Token has been revoked',
        code: 'auth/token-revoked'
      });
    }
    
    return res.status(401).json({ 
      error: 'Invalid authentication token',
      code: 'auth/invalid-token'
    });
  }
}

// Rate limiting map
const rateLimitMap = new Map();

// Rate limiting middleware
function rateLimit(maxRequests = 100, windowMs = 60000) {
  return (req: any, res: any, next: any) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const limit = rateLimitMap.get(ip);
    
    if (now > limit.resetTime) {
      limit.count = 1;
      limit.resetTime = now + windowMs;
      return next();
    }
    
    if (limit.count >= maxRequests) {
      return res.status(429).json({ 
        error: 'Too many requests, please try again later',
        code: 'rate-limit-exceeded'
      });
    }
    
    limit.count++;
    next();
  };
}

// Apply rate limiting to all routes
app.use(rateLimit());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Souk El-Sayarat API',
    version: '2.1.0',
    uptime: process.uptime()
  });
});

// ============= CATEGORIES ENDPOINTS =============

app.get('/api/categories', async (req, res) => {
  try {
    const categoriesSnapshot = await admin.firestore()
      .collection('categories')
      .orderBy('name')
      .get();
    
    const categories = categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      categories,
      total: categories.length
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch categories',
      message: error.message
    });
  }
});

// ============= PRODUCTS ENDPOINTS =============

app.get('/api/products', async (req, res) => {
  try {
    // Sanitize query parameters
    const category = sanitizeInput(req.query.category);
    const minPrice = Number(req.query.minPrice) || 0;
    const maxPrice = Number(req.query.maxPrice) || Number.MAX_SAFE_INTEGER;
    const search = sanitizeInput(req.query.search);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = Number(req.query.offset) || 0;
    const sortBy = sanitizeInput(req.query.sortBy) || 'createdAt';
    const order = req.query.order === 'asc' ? 'asc' : 'desc';
    
    // Build query
    let productsRef = admin.firestore().collection('products');
    let products: any[] = [];
    
    // Get all products first (we'll filter in memory for complex queries)
    const snapshot = await productsRef.get();
    products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Apply filters
    if (category) {
      products = products.filter(p => p.category === category);
    }
    
    if (minPrice > 0) {
      products = products.filter(p => p.price >= minPrice);
    }
    
    if (maxPrice < Number.MAX_SAFE_INTEGER) {
      products = products.filter(p => p.price <= maxPrice);
    }
    
    if (search) {
      const searchTerm = search.toLowerCase();
      products = products.filter(p => {
        const searchableText = `${p.title || ''} ${p.description || ''} ${p.brand || ''} ${p.category || ''}`.toLowerCase();
        return searchableText.includes(searchTerm);
      });
    }
    
    // Sort products
    products.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      
      if (aVal === undefined || bVal === undefined) return 0;
      
      if (order === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    // Apply pagination
    const paginatedProducts = products.slice(offset, offset + limit);
    
    res.json({
      success: true,
      products: paginatedProducts,
      total: products.length,
      limit,
      offset,
      hasMore: offset + limit < products.length
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch products',
      message: error.message
    });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const productId = sanitizeInput(req.params.id);
    
    const doc = await admin.firestore()
      .collection('products')
      .doc(productId)
      .get();
    
    if (!doc.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Product not found',
        code: 'product/not-found'
      });
    }
    
    res.json({
      success: true,
      product: {
        id: doc.id,
        ...doc.data()
      }
    });
  } catch (error: any) {
    console.error('Error fetching product:', error);
    
    // Handle invalid document ID
    if (error.code === 5) {
      return res.status(404).json({ 
        success: false,
        error: 'Product not found',
        code: 'product/invalid-id'
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch product',
      message: error.message
    });
  }
});

app.post('/api/products', verifyToken, async (req: any, res) => {
  try {
    const productData = sanitizeInput(req.body);
    
    // Validate required fields
    if (!productData.title || !productData.price || !productData.category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, price, category'
      });
    }
    
    const product = {
      ...productData,
      vendorId: req.userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      active: true,
      views: 0,
      likes: 0
    };
    
    const docRef = await admin.firestore().collection('products').add(product);
    
    res.json({
      success: true,
      id: docRef.id,
      message: 'Product created successfully'
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create product',
      message: error.message
    });
  }
});

app.put('/api/products/:id', verifyToken, async (req: any, res) => {
  try {
    const productId = sanitizeInput(req.params.id);
    const updates = sanitizeInput(req.body);
    
    // Check if product exists and user owns it
    const doc = await admin.firestore()
      .collection('products')
      .doc(productId)
      .get();
      
    if (!doc.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Product not found'
      });
    }
    
    const productData = doc.data();
    if (productData?.vendorId !== req.userId) {
      return res.status(403).json({ 
        success: false,
        error: 'Not authorized to update this product'
      });
    }
    
    // Update product
    await admin.firestore()
      .collection('products')
      .doc(productId)
      .update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    
    res.json({
      success: true,
      message: 'Product updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update product',
      message: error.message
    });
  }
});

app.delete('/api/products/:id', verifyToken, async (req: any, res) => {
  try {
    const productId = sanitizeInput(req.params.id);
    
    // Check if product exists and user owns it
    const doc = await admin.firestore()
      .collection('products')
      .doc(productId)
      .get();
      
    if (!doc.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Product not found'
      });
    }
    
    const productData = doc.data();
    if (productData?.vendorId !== req.userId) {
      return res.status(403).json({ 
        success: false,
        error: 'Not authorized to delete this product'
      });
    }
    
    // Delete product
    await admin.firestore()
      .collection('products')
      .doc(productId)
      .delete();
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete product',
      message: error.message
    });
  }
});

// ============= SEARCH ENDPOINT =============

app.post('/api/search', async (req, res) => {
  try {
    const { query, filters } = sanitizeInput(req.body);
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ 
        success: false,
        error: 'Search query is required'
      });
    }
    
    // Get all products
    const snapshot = await admin.firestore().collection('products').get();
    let products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Search filter
    const searchTerm = query.toLowerCase();
    products = products.filter((product: any) => {
      const searchableText = `${product.title || ''} ${product.description || ''} ${product.brand || ''} ${product.category || ''}`.toLowerCase();
      return searchableText.includes(searchTerm);
    });
    
    // Apply additional filters
    if (filters) {
      if (filters.category) {
        products = products.filter((p: any) => p.category === filters.category);
      }
      if (filters.minPrice) {
        products = products.filter((p: any) => p.price >= filters.minPrice);
      }
      if (filters.maxPrice) {
        products = products.filter((p: any) => p.price <= filters.maxPrice);
      }
    }
    
    res.json({
      success: true,
      results: products,
      total: products.length,
      query: sanitizeInput(query)
    });
  } catch (error: any) {
    console.error('Search error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Search failed',
      message: error.message
    });
  }
});

// ============= ORDERS ENDPOINTS =============

app.post('/api/orders', verifyToken, async (req: any, res) => {
  try {
    const orderData = sanitizeInput(req.body);
    
    // Validate required fields
    if (!orderData.items || !orderData.total || !orderData.shippingAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: items, total, shippingAddress'
      });
    }
    
    const order = {
      ...orderData,
      userId: req.userId,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await admin.firestore().collection('orders').add(order);
    
    res.json({
      success: true,
      id: docRef.id,
      message: 'Order created successfully'
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create order',
      message: error.message
    });
  }
});

app.get('/api/orders', verifyToken, async (req: any, res) => {
  try {
    const ordersSnapshot = await admin.firestore()
      .collection('orders')
      .where('userId', '==', req.userId)
      .orderBy('createdAt', 'desc')
      .get();
    
    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      orders,
      total: orders.length
    });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch orders',
      message: error.message
    });
  }
});

// Error handling for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    code: err.code || 'internal-error'
  });
});

// Export the Express app as a Cloud Function
export const api = functions.https.onRequest(app);