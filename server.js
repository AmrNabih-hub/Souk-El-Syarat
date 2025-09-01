/**
 * Souk El-Syarat Backend Server
 * Complete backend with authentication, real-time, and email services
 */

const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'souk-el-syarat',
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://souk-el-syarat-default-rtdb.firebaseio.com',
  });
}

const app = express();

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://souk-el-syarat.web.app',
      'https://souk-el-syarat.firebaseapp.com',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174'
    ];
    
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`Blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Request-ID', `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check Firebase services
    const db = admin.firestore();
    const auth = admin.auth();
    const rtdb = admin.database();
    
    // Test Firestore
    const testDoc = await db.collection('_health').doc('test').get();
    
    // Test Auth (list users with limit 1)
    const users = await auth.listUsers(1);
    
    // Test Realtime Database
    const snapshot = await rtdb.ref('_health/test').once('value');
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || 'v1',
      services: {
        firestore: 'connected',
        authentication: 'active',
        realtimeDatabase: 'connected',
        email: process.env.EMAIL_SERVICE ? 'configured' : 'not configured'
      },
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Authentication middleware
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    req.userId = decodedToken.uid;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token', details: error.message });
  }
};

// ============= EMAIL SERVICE =============

async function sendEmail(to, subject, html) {
  try {
    // Using Firebase Extensions for email (install firebase-send-email extension)
    // Or use Firebase Functions to trigger emails
    await admin.firestore().collection('mail').add({
      to: to,
      message: {
        subject: subject,
        html: html,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Email queued: ${subject} to ${to}`);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}

// ============= API ENDPOINTS =============

// User Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, displayName, role = 'customer' } = req.body;
    
    // Validate input
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
      emailVerified: false
    });
    
    // Save user profile to Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email,
      displayName,
      role,
      isActive: true,
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
    
    // Send welcome email
    await sendEmail(email, 'Welcome to Souk El-Syarat!', `
      <h1>Welcome ${displayName}!</h1>
      <p>Thank you for joining Souk El-Syarat, Egypt's premier automotive marketplace.</p>
      <p>You can now:</p>
      <ul>
        <li>Browse thousands of vehicles</li>
        <li>Contact sellers directly</li>
        <li>Save your favorite listings</li>
      </ul>
      <p>Best regards,<br>Souk El-Syarat Team</p>
    `);
    
    res.status(201).json({ 
      success: true, 
      uid: userRecord.uid,
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get Products
app.get('/api/products', async (req, res) => {
  try {
    const { category, limit = 20, offset = 0 } = req.query;
    
    let query = admin.firestore().collection('products').where('active', '==', true);
    
    if (category) {
      query = query.where('category', '==', category);
    }
    
    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();
    
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({ 
      success: true, 
      products,
      total: products.length,
      hasMore: products.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create Order
app.post('/api/orders', authenticate, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;
    
    // Validate input
    if (!items || !items.length || !shippingAddress) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Calculate total
    let total = 0;
    for (const item of items) {
      const productDoc = await admin.firestore()
        .collection('products')
        .doc(item.productId)
        .get();
      
      if (!productDoc.exists) {
        return res.status(400).json({ error: `Product ${item.productId} not found` });
      }
      
      const product = productDoc.data();
      total += product.price * item.quantity;
    }
    
    // Create order
    const orderData = {
      userId: req.userId,
      items,
      shippingAddress,
      paymentMethod: paymentMethod || 'cash',
      total,
      status: 'pending',
      orderNumber: `ORD-${Date.now()}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const orderRef = await admin.firestore().collection('orders').add(orderData);
    
    // Get user email for notification
    const user = await admin.auth().getUser(req.userId);
    
    // Send order confirmation email
    await sendEmail(user.email, `Order Confirmation #${orderData.orderNumber}`, `
      <h1>Order Confirmed!</h1>
      <p>Dear ${user.displayName || 'Customer'},</p>
      <p>Your order <strong>#${orderData.orderNumber}</strong> has been received.</p>
      <p><strong>Order Details:</strong></p>
      <ul>
        <li>Total Amount: ${total} EGP</li>
        <li>Payment Method: ${paymentMethod || 'Cash on Delivery'}</li>
        <li>Delivery Address: ${shippingAddress}</li>
      </ul>
      <p>We'll notify you when your order is shipped.</p>
      <p>Thank you for shopping with Souk El-Syarat!</p>
    `);
    
    // Real-time update
    if (process.env.ENABLE_REALTIME === 'true') {
      await admin.database().ref(`orders/${orderRef.id}`).set({
        orderId: orderRef.id,
        userId: req.userId,
        status: 'pending',
        total,
        timestamp: Date.now()
      });
    }
    
    res.status(201).json({ 
      success: true, 
      orderId: orderRef.id,
      orderNumber: orderData.orderNumber,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get User Orders
app.get('/api/orders', authenticate, async (req, res) => {
  try {
    const snapshot = await admin.firestore()
      .collection('orders')
      .where('userId', '==', req.userId)
      .orderBy('createdAt', 'desc')
      .get();
    
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({ 
      success: true, 
      orders,
      total: orders.length
    });
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Categories endpoint
app.get('/api/categories', async (req, res) => {
  try {
    const snapshot = await admin.firestore()
      .collection('categories')
      .orderBy('order', 'asc')
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
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search endpoint
app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    // Simple text search (in production, use Algolia or ElasticSearch)
    const snapshot = await admin.firestore()
      .collection('products')
      .where('active', '==', true)
      .get();
    
    const searchTerm = query.toLowerCase();
    const results = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(product => {
        const searchableText = `${product.title} ${product.description} ${product.brand}`.toLowerCase();
        return searchableText.includes(searchTerm);
      });
    
    res.json({ 
      success: true, 
      results,
      total: results.length,
      query
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`
    🚀 Souk El-Syarat Backend Server
    ================================
    Environment: ${process.env.NODE_ENV || 'development'}
    Port: ${PORT}
    Health: http://localhost:${PORT}/health
    
    Services:
    ✅ Firebase Auth
    ✅ Firestore Database
    ✅ Realtime Database
    ✅ Email Service
    
    Ready to serve requests!
  `);
});

module.exports = app;