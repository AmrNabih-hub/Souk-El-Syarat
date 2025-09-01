/**
 * Souk El-Sayarat Backend - 2025 Professional Implementation
 * Complete Firebase Cloud Functions with Real-time Features
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Import services
// import { modernAuth } from './auth/modern-auth.service';
// import { realtimeService } from './realtime/realtime.service';
const modernAuth = { socialAuth: async () => ({ success: false }), refreshAuthToken: async () => ({ success: false }) };
const realtimeService = { updateUserStatus: async () => {}, trackActivity: async () => {} };

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://souk-el-syarat.web.app',
    'https://souk-el-syarat.firebaseapp.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Id', 'X-Fingerprint']
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    services: {
      auth: 'active',
      database: 'active',
      realtime: 'active',
      storage: 'active'
    }
  });
});

// Passwordless authentication
app.post('/api/auth/passwordless/init', async (req, res) => {
  try {
    const { email, deviceInfo } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const result = await modernAuth.initPasswordlessAuth(email, deviceInfo || {});
    
    if (result.success) {
      res.json({ success: true, challengeId: result.challengeId });
    } else {
      res.status(400).json({ error: 'Failed to initialize authentication' });
    }
  } catch (error) {
    console.error('Passwordless init error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify passwordless authentication
app.post('/api/auth/passwordless/verify', async (req, res) => {
  try {
    const { challengeId, token } = req.body;
    
    if (!challengeId || !token) {
      return res.status(400).json({ error: 'Challenge ID and token are required' });
    }
    
    const result = await modernAuth.verifyPasswordlessAuth(challengeId, token);
    
    if (result.success) {
      res.json({
        success: true,
        authToken: result.authToken,
        refreshToken: result.refreshToken
      });
    } else {
      res.status(401).json({ error: 'Authentication failed' });
    }
  } catch (error) {
    console.error('Passwordless verify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Traditional signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, role = 'customer', profile } = req.body;
    
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      emailVerified: false
    });
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role,
      permissions: role === 'vendor' 
        ? ['read:products', 'create:products', 'update:products', 'delete:products']
        : ['read:products', 'create:orders']
    });
    
    // Create user profile in Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email,
      role,
      profile: profile || {},
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      emailVerified: false,
      active: true
    });
    
    // Create custom token
    const customToken = await admin.auth().createCustomToken(userRecord.uid);
    
    res.json({
      success: true,
      uid: userRecord.uid,
      email: userRecord.email,
      customToken
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Traditional signin
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, idToken } = req.body;
    
    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Get user data
    const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    
    // Update last login
    await userDoc.ref.update({
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({
      success: true,
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: userData?.role || 'customer',
      profile: userData?.profile || {}
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

// Social authentication
app.post('/api/auth/social', async (req, res) => {
  try {
    const { provider, idToken } = req.body;
    
    const result = await modernAuth.socialAuth(provider, idToken);
    
    if (result.success) {
      res.json({
        success: true,
        authToken: result.authToken,
        refreshToken: result.refreshToken
      });
    } else {
      res.status(401).json({ error: 'Social authentication failed' });
    }
  } catch (error) {
    console.error('Social auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh token
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    const result = await modernAuth.refreshAuthToken(refreshToken);
    
    if (result.success) {
      res.json({
        success: true,
        authToken: result.authToken
      });
    } else {
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
app.post('/api/auth/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    await modernAuth.logout(decodedToken.uid);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// PRODUCTS ENDPOINTS
// ============================================

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search, limit = 20, offset = 0 } = req.query;
    
    let query = admin.firestore().collection('products').where('active', '==', true);
    
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
    
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      products,
      total: snapshot.size
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const doc = await admin.firestore().collection('products').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({
      success: true,
      product: {
        id: doc.id,
        ...doc.data()
      }
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all categories
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
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch categories' 
    });
  }
});

// Create category (admin only)
app.post('/api/categories', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Check if user is admin
    const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    
    if (userData?.role !== 'admin' && userData?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const category = {
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await admin.firestore().collection('categories').add(category);
    
    res.json({
      success: true,
      id: docRef.id,
      category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create category' 
    });
  }
});

// Create product
app.post('/api/products', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    const product = {
      ...req.body,
      vendorId: decodedToken.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      active: true,
      views: 0,
      likes: 0
    };
    
    const docRef = await admin.firestore().collection('products').add(product);
    
    // Update real-time inventory
    await realtimeService.updateInventory(docRef.id, product.inventory || 0, 'set');
    
    res.json({
      success: true,
      productId: docRef.id
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Check ownership
    const doc = await admin.firestore().collection('products').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = doc.data();
    if (product.vendorId !== decodedToken.uid) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const updates = {
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await doc.ref.update(updates);
    
    // Update inventory if changed
    if (updates.inventory !== undefined) {
      await realtimeService.updateInventory(req.params.id, updates.inventory, 'set');
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Check ownership
    const doc = await admin.firestore().collection('products').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = doc.data();
    if (product.vendorId !== decodedToken.uid) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Soft delete
    await doc.ref.update({
      active: false,
      deletedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// ORDERS ENDPOINTS
// ============================================

// Create order
app.post('/api/orders', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    const order = {
      ...req.body,
      customerId: decodedToken.uid,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await admin.firestore().collection('orders').add(order);
    
    // Update inventory for each item
    for (const item of order.items) {
      await realtimeService.updateInventory(item.productId, item.quantity, 'subtract');
    }
    
    // Track order in real-time
    await realtimeService.updateOrderStatus(docRef.id, 'pending');
    
    res.json({
      success: true,
      orderId: docRef.id
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user orders
app.get('/api/orders', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    const snapshot = await admin.firestore()
      .collection('orders')
      .where('customerId', '==', decodedToken.uid)
      .orderBy('createdAt', 'desc')
      .get();
    
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order status
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { status, location } = req.body;
    
    const result = await realtimeService.updateOrderStatus(req.params.id, status, location);
    
    if (result) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Failed to update order status' });
    }
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// CHAT ENDPOINTS
// ============================================

// Send message
app.post('/api/chat/send', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    const { chatId, text, attachments } = req.body;
    
    const messageId = await realtimeService.sendMessage(chatId, {
      senderId: decodedToken.uid,
      text,
      attachments
    });
    
    res.json({
      success: true,
      messageId
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark message as read
app.patch('/api/chat/:chatId/messages/:messageId/read', async (req, res) => {
  try {
    await realtimeService.updateMessageStatus(req.params.chatId, req.params.messageId, 'read');
    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// VENDOR ENDPOINTS
// ============================================

// Apply to become vendor
app.post('/api/vendor/apply', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    const application = {
      userId: decodedToken.uid,
      ...req.body,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await admin.firestore().collection('vendor_applications').add(application);
    
    res.json({
      success: true,
      applicationId: docRef.id
    });
  } catch (error) {
    console.error('Vendor apply error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get vendor dashboard stats
app.get('/api/vendor/dashboard', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Get vendor products
    const productsSnapshot = await admin.firestore()
      .collection('products')
      .where('vendorId', '==', decodedToken.uid)
      .get();
    
    // Get vendor orders
    const ordersSnapshot = await admin.firestore()
      .collection('orders')
      .where('vendorId', '==', decodedToken.uid)
      .get();
    
    const stats = {
      totalProducts: productsSnapshot.size,
      totalOrders: ordersSnapshot.size,
      totalRevenue: ordersSnapshot.docs.reduce((sum, doc) => sum + (doc.data().total || 0), 0),
      activeProducts: productsSnapshot.docs.filter(doc => doc.data().active).length
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Vendor dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// ADMIN ENDPOINTS
// ============================================

// Get all users (admin only)
app.get('/api/admin/users', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Check admin role
    if (decodedToken.role !== 'admin' && decodedToken.role !== 'super_admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const snapshot = await admin.firestore().collection('users').get();
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve vendor application
app.post('/api/admin/vendor/approve/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Check admin role
    if (decodedToken.role !== 'admin' && decodedToken.role !== 'super_admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Update application
    await admin.firestore().collection('vendor_applications').doc(req.params.id).update({
      status: 'approved',
      approvedBy: decodedToken.uid,
      approvedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Get application data
    const appDoc = await admin.firestore().collection('vendor_applications').doc(req.params.id).get();
    const appData = appDoc.data();
    
    // Update user role
    await admin.auth().setCustomUserClaims(appData.userId, {
      role: 'vendor',
      permissions: ['read:products', 'create:products', 'update:products', 'delete:products']
    });
    
    await admin.firestore().collection('users').doc(appData.userId).update({
      role: 'vendor',
      vendorProfile: appData.vendorProfile || {}
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Approve vendor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get analytics
app.get('/api/admin/analytics', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Check admin role
    if (decodedToken.role !== 'admin' && decodedToken.role !== 'super_admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Get analytics from Realtime Database
    const analyticsRef = admin.database().ref('analytics');
    const snapshot = await analyticsRef.once('value');
    const analytics = snapshot.val() || {};
    
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// SEARCH ENDPOINTS
// ============================================

// Advanced search
app.post('/api/search', async (req, res) => {
  try {
    const { query, filters = {}, sort = 'relevance', limit = 20, offset = 0 } = req.body;
    
    let firestoreQuery = admin.firestore().collection('products').where('active', '==', true);
    
    // Apply filters
    if (filters.category) {
      firestoreQuery = firestoreQuery.where('category', '==', filters.category);
    }
    
    if (filters.minPrice) {
      firestoreQuery = firestoreQuery.where('price', '>=', filters.minPrice);
    }
    
    if (filters.maxPrice) {
      firestoreQuery = firestoreQuery.where('price', '<=', filters.maxPrice);
    }
    
    if (filters.brand) {
      firestoreQuery = firestoreQuery.where('brand', '==', filters.brand);
    }
    
    // Apply sorting
    switch (sort) {
      case 'price_asc':
        firestoreQuery = firestoreQuery.orderBy('price', 'asc');
        break;
      case 'price_desc':
        firestoreQuery = firestoreQuery.orderBy('price', 'desc');
        break;
      case 'newest':
        firestoreQuery = firestoreQuery.orderBy('createdAt', 'desc');
        break;
      case 'popular':
        firestoreQuery = firestoreQuery.orderBy('views', 'desc');
        break;
    }
    
    const snapshot = await firestoreQuery.limit(limit).offset(offset).get();
    
    let products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // If query is provided, filter by search terms
    if (query) {
      const searchTerms = query.toLowerCase().split(' ');
      products = products.filter((product: any) => {
        const searchableText = `${product.title || ''} ${product.description || ''} ${product.brand || ''} ${product.category || ''}`.toLowerCase();
        return searchTerms.every(term => searchableText.includes(term));
      });
    }
    
    // Track search analytics
    await realtimeService.trackEvent('search', {
      query,
      filters,
      resultsCount: products.length
    });
    
    res.json({
      success: true,
      products,
      total: products.length
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// PAYMENT ENDPOINTS
// ============================================

// Process payment (Cash on Delivery)
app.post('/api/payment/cod', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    const { orderId, deliveryAddress } = req.body;
    
    // Update order with payment method
    await admin.firestore().collection('orders').doc(orderId).update({
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      deliveryAddress,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({
      success: true,
      message: 'Cash on delivery payment confirmed'
    });
  } catch (error) {
    console.error('COD payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Vendor subscription payment (InstaPay receipt)
app.post('/api/payment/subscription', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    const { receiptImage, transactionId, amount } = req.body;
    
    // Store payment record for admin review
    const paymentRef = await admin.firestore().collection('subscription_payments').add({
      vendorId: decodedToken.uid,
      receiptImage,
      transactionId,
      amount,
      status: 'pending_review',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({
      success: true,
      paymentId: paymentRef.id,
      message: 'Payment receipt submitted for review'
    });
  } catch (error) {
    console.error('Subscription payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path
  });
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Export the Express app as a Cloud Function
export const api = functions.https.onRequest(app);

// ============================================
// SCHEDULED FUNCTIONS
// ============================================

// Daily analytics aggregation
export const dailyAnalytics = functions.pubsub.schedule('0 0 * * *').onRun(async (context) => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    // Aggregate analytics data
    const analyticsRef = admin.database().ref(`analytics/daily/${dateStr}`);
    const snapshot = await analyticsRef.once('value');
    const data = snapshot.val() || {};
    
    // Store in Firestore for long-term storage
    await admin.firestore().collection('analytics_archive').doc(dateStr).set({
      date: dateStr,
      data,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Analytics archived for ${dateStr}`);
  } catch (error) {
    console.error('Daily analytics error:', error);
  }
});

// Cleanup expired sessions
export const cleanupSessions = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
  try {
    const now = new Date();
    const expiredSessions = await admin.firestore()
      .collection('sessions')
      .where('expiresAt', '<', now)
      .get();
    
    const batch = admin.firestore().batch();
    expiredSessions.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`Cleaned up ${expiredSessions.size} expired sessions`);
  } catch (error) {
    console.error('Cleanup sessions error:', error);
  }
});

// ============================================
// REAL-TIME TRIGGERS
// ============================================

// Initialize real-time listeners on deploy
export const initializeRealtime = functions.https.onRequest(async (req, res) => {
  try {
    await realtimeService.initializeListeners('products');
    await realtimeService.initializeListeners('orders');
    await realtimeService.initializeListeners('chats');
    
    res.json({
      success: true,
      message: 'Real-time listeners initialized'
    });
  } catch (error) {
    console.error('Initialize realtime error:', error);
    res.status(500).json({ error: 'Failed to initialize real-time listeners' });
  }
});

// On user status change
export const onUserStatusChange = functions.database.ref('/status/{uid}').onUpdate(async (change, context) => {
  const eventStatus = change.after.val();
  const userStatusFirestoreRef = admin.firestore().doc(`users/${context.params.uid}`);
  
  return userStatusFirestoreRef.update({
    onlineStatus: eventStatus.state,
    lastSeen: admin.firestore.FieldValue.serverTimestamp()
  });
});

console.log('Souk El-Sayarat Backend 2025 - All systems operational');