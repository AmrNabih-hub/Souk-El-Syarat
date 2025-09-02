/**
 * Fixed Backend Server with Embedded Configuration
 * Temporary solution while environment variables are being fixed
 */

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 8080;

// Embedded configuration (temporary)
const config = {
  firebase: {
    projectId: 'souk-el-syarat',
    databaseURL: 'https://souk-el-syarat-default-rtdb.firebaseio.com',
    storageBucket: 'souk-el-syarat.firebasestorage.app'
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'temporary-secret-replace-in-production',
    apiKey: process.env.API_KEY || 'temporary-key-replace-in-production'
  }
};

// Initialize Firebase Admin
const admin = require('firebase-admin');
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: config.firebase.projectId,
      databaseURL: config.firebase.databaseURL
    });
    console.log('✅ Firebase Admin initialized');
  }
} catch (error) {
  console.error('Firebase init error:', error);
}

// Middleware
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://souk-el-syarat.web.app',
      'https://souk-el-syarat.firebaseapp.com',
      'http://localhost:5173',
      'http://localhost:3000'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests'
});
app.use('/api/', limiter);

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.1-fixed',
    services: {
      firebase: admin.apps.length > 0 ? 'connected' : 'disconnected'
    }
  });
});

// API Routes
app.get('/api', (req, res) => {
  res.json({
    message: 'Souk El-Syarat API',
    version: '1.0.1',
    endpoints: [
      '/health',
      '/api/products',
      '/api/vendors',
      '/api/search/products'
    ]
  });
});

// Products endpoint
app.get('/api/products', async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('products').limit(20).get();
    
    const products = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });
    
    res.json({
      success: true,
      products,
      count: products.length
    });
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      message: error.message
    });
  }
});

// Vendors endpoint
app.get('/api/vendors', async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('vendors').limit(20).get();
    
    const vendors = [];
    snapshot.forEach(doc => {
      vendors.push({ id: doc.id, ...doc.data() });
    });
    
    res.json({
      success: true,
      vendors,
      count: vendors.length
    });
  } catch (error) {
    console.error('Vendors error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendors',
      message: error.message
    });
  }
});

// Search endpoint
app.get('/api/search/products', async (req, res) => {
  try {
    const { q } = req.query;
    const db = admin.firestore();
    
    let query = db.collection('products');
    
    if (q) {
      // Simple search implementation
      query = query.where('name', '>=', q).where('name', '<=', q + '\uf8ff');
    }
    
    const snapshot = await query.limit(20).get();
    
    const products = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });
    
    res.json({
      success: true,
      query: q,
      products,
      count: products.length
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error.message
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║     🚀 BACKEND SERVER - FIXED VERSION      ║
║                                            ║
║     Port: ${PORT}                             ║
║     Environment: ${process.env.NODE_ENV || 'production'}       ║
║     Time: ${new Date().toISOString()}  ║
║                                            ║
║     ✅ Ready for requests                 ║
╚════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
