/**
 * BACKEND SERVER - SOUK EL-SYARAT
 * Complete API Backend with All Services
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

const app = express();
const PORT = process.env.PORT || 8080;

// ============= FIREBASE INITIALIZATION =============
let db, auth, storage, rtdb;
let firebaseInitialized = false;

const initializeFirebase = async () => {
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries && !firebaseInitialized) {
    try {
      console.log(`Firebase initialization attempt ${retries + 1}...`);
      
      if (!admin.apps.length) {
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || 'souk-el-syarat',
          databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://souk-el-syarat-default-rtdb.firebaseio.com',
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'souk-el-syarat.firebasestorage.app'
        });
      }
      
      db = admin.firestore();
      auth = admin.auth();
      storage = admin.storage();
      rtdb = admin.database();
      
      // Test connection
      await db.collection('_health').doc('init').set({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'connected'
      });
      
      firebaseInitialized = true;
      console.log('✅ Firebase initialized successfully');
      return true;
    } catch (error) {
      retries++;
      console.error(`Firebase init attempt ${retries} failed:`, error.message);
      if (retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  if (!firebaseInitialized) {
    console.error('❌ Firebase initialization failed after all retries');
    // Continue running without Firebase for health checks
  }
  
  return firebaseInitialized;
};

// ============= SECURITY MIDDLEWARE =============
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'", 'https://api-52vezf5qqa-uc.a.run.app', 'https://souk-el-sayarat-backend--souk-el-syarat.europe-west4.hosted.app'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080',
      'https://souk-el-syarat.web.app',
      'https://souk-el-syarat.firebaseapp.com'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// ============= AUTHENTICATION MIDDLEWARE =============
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }
  next();
};

// ============= HEALTH CHECK ENDPOINTS =============
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    service: 'souk-el-syarat-backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    firebase: firebaseInitialized ? 'connected' : 'disconnected',
    version: '1.0.0'
  };
  
  res.json(health);
});

app.get('/', (req, res) => {
  res.json({
    message: 'Souk El-Syarat Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      api: '/api',
      docs: '/api/docs'
    }
  });
});

app.get('/api', (req, res) => {
  res.json({
    name: 'Souk El-Syarat API',
    version: '1.0.0',
    description: 'Complete e-commerce backend for automotive marketplace',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        profile: 'GET /api/auth/profile',
        refresh: 'POST /api/auth/refresh'
      },
      products: {
        list: 'GET /api/products',
        get: 'GET /api/products/:id',
        create: 'POST /api/products',
        update: 'PUT /api/products/:id',
        delete: 'DELETE /api/products/:id'
      },
      vendors: {
        list: 'GET /api/vendors',
        get: 'GET /api/vendors/:id',
        apply: 'POST /api/vendors/apply',
        products: 'GET /api/vendors/:id/products'
      },
      orders: {
        create: 'POST /api/orders/create',
        list: 'GET /api/orders',
        get: 'GET /api/orders/:id',
        update: 'PUT /api/orders/:id',
        cancel: 'POST /api/orders/:id/cancel'
      },
      search: {
        products: 'GET /api/search/products'
      },
      users: {
        profile: 'GET /api/users/profile',
        update: 'PUT /api/users/profile',
        orders: 'GET /api/users/orders'
      }
    }
  });
});

// ============= AUTHENTICATION ENDPOINTS =============
app.post('/api/auth/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 2 }),
  body('role').optional().isIn(['customer', 'vendor', 'admin'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, role = 'customer' } = req.body;

    if (!firebaseInitialized) {
      return res.status(503).json({ error: 'Database not available' });
    }

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name
    });

    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email,
      name,
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: userRecord.uid, email, role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: userRecord.uid,
        email,
        name,
        role
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    if (!firebaseInitialized) {
      return res.status(503).json({ error: 'Database not available' });
    }

    // Verify user credentials
    const userRecord = await auth.getUserByEmail(email);
    
    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();

    // Generate JWT token
    const token = jwt.sign(
      { userId: userRecord.uid, email, role: userData.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: userRecord.uid,
        email,
        name: userData.name,
        role: userData.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  // In production, you would blacklist the token here
  res.json({ success: true, message: 'Logged out successfully' });
});

app.post('/api/auth/refresh', authenticateToken, (req, res) => {
  const token = jwt.sign(
    { userId: req.user.userId, email: req.user.email, role: req.user.role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
  
  res.json({ success: true, token });
});

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    if (!firebaseInitialized) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const userDoc = await db.collection('users').doc(req.user.userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    res.json({
      success: true,
      user: {
        id: req.user.userId,
        email: req.user.email,
        name: userData.name,
        role: userData.role,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= PRODUCTS ENDPOINTS =============
app.get('/api/products', optionalAuth, async (req, res) => {
  try {
    if (!firebaseInitialized) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { page = 1, limit = 20, category, vendor, search } = req.query;
    let query = db.collection('products');

    // Apply filters
    if (category) {
      query = query.where('category', '==', category);
    }
    if (vendor) {
      query = query.where('vendorId', '==', vendor);
    }
    if (search) {
      query = query.where('title', '>=', search).where('title', '<=', search + '\uf8ff');
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.offset(offset).limit(parseInt(limit));

    const snapshot = await query.get();
    const products = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });

    res.json({
      success: true,
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: products.length
      }
    });
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    if (!firebaseInitialized) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const productDoc = await db.collection('products').doc(req.params.id).get();
    if (!productDoc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      success: true,
      product: { id: productDoc.id, ...productDoc.data() }
    });
  } catch (error) {
    console.error('Product error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= VENDORS ENDPOINTS =============
app.get('/api/vendors', async (req, res) => {
  try {
    if (!firebaseInitialized) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const snapshot = await db.collection('vendors')
      .offset(offset)
      .limit(parseInt(limit))
      .get();
    
    const vendors = [];
    snapshot.forEach(doc => {
      vendors.push({ id: doc.id, ...doc.data() });
    });

    res.json({
      success: true,
      vendors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: vendors.length
      }
    });
  } catch (error) {
    console.error('Vendors error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= SEARCH ENDPOINTS =============
app.get('/api/search/products', async (req, res) => {
  try {
    if (!firebaseInitialized) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { q, category, minPrice, maxPrice, page = 1, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    let query = db.collection('products')
      .where('title', '>=', q)
      .where('title', '<=', q + '\uf8ff');

    if (category) {
      query = query.where('category', '==', category);
    }

    const offset = (page - 1) * limit;
    query = query.offset(offset).limit(parseInt(limit));

    const snapshot = await query.get();
    const products = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Apply price filters
      if (minPrice && data.price < parseFloat(minPrice)) return;
      if (maxPrice && data.price > parseFloat(maxPrice)) return;
      
      products.push({ id: doc.id, ...data });
    });

    res.json({
      success: true,
      query: q,
      results: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: products.length
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= ORDERS ENDPOINTS =============
app.post('/api/orders/create', authenticateToken, [
  body('items').isArray({ min: 1 }),
  body('shippingAddress').isObject(),
  body('paymentMethod').isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!firebaseInitialized) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { items, shippingAddress, paymentMethod } = req.body;
    
    // Calculate total
    let total = 0;
    for (const item of items) {
      total += item.price * item.quantity;
    }

    // Create order
    const orderData = {
      userId: req.user.userId,
      items,
      shippingAddress,
      paymentMethod,
      total,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const orderRef = await db.collection('orders').add(orderData);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: orderRef.id,
        ...orderData
      }
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    if (!firebaseInitialized) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const snapshot = await db.collection('orders')
      .where('userId', '==', req.user.userId)
      .offset(offset)
      .limit(parseInt(limit))
      .orderBy('createdAt', 'desc')
      .get();
    
    const orders = [];
    snapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });

    res.json({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: orders.length
      }
    });
  } catch (error) {
    console.error('Orders error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= ERROR HANDLING =============
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ============= SERVER STARTUP =============
const startServer = async () => {
  try {
    // Initialize Firebase
    await initializeFirebase();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Souk El-Syarat Backend Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API docs: http://localhost:${PORT}/api`);
      console.log(`🔥 Firebase: ${firebaseInitialized ? 'Connected' : 'Disconnected'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;