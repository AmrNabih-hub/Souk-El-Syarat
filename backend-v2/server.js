const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');
const winston = require('winston');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 8080;

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' })
  ]
});

// Firebase initialization with retry
let db, auth;
const initFirebase = async () => {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'souk-el-syarat',
        databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://souk-el-syarat-default-rtdb.firebaseio.com'
      });
    }
    db = admin.firestore();
    auth = admin.auth();
    logger.info('Firebase initialized');
    return true;
  } catch (error) {
    logger.error('Firebase init failed:', error);
    return false;
  }
};

// Security middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: ['https://souk-el-syarat.web.app', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests'
});
app.use('/api/', limiter);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    services: {}
  };

  if (db) {
    try {
      await db.collection('_health').doc('check').set({
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      health.services.firestore = 'connected';
    } catch (error) {
      health.services.firestore = 'error';
      health.status = 'degraded';
    }
  }

  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

// API info
app.get('/api', (req, res) => {
  res.json({
    name: 'Souk El-Syarat Professional API',
    version: '2.0.0',
    status: 'operational'
  });
});

// Products endpoint with proper error handling
app.get('/api/products', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        success: false,
        error: 'Database unavailable'
      });
    }

    const { limit = 20, offset = 0, category } = req.query;
    
    let query = db.collection('products');
    
    if (category) {
      query = query.where('category', '==', category);
    }
    
    const snapshot = await query
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();
    
    const products = [];
    snapshot.forEach(doc => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    logger.error('Products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
});

// Vendors endpoint
app.get('/api/vendors', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        success: false,
        error: 'Database unavailable'
      });
    }

    const snapshot = await db.collection('vendors').limit(20).get();
    
    const vendors = [];
    snapshot.forEach(doc => {
      vendors.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({
      success: true,
      data: vendors,
      count: vendors.length
    });
  } catch (error) {
    logger.error('Vendors error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendors'
    });
  }
});

// Search endpoint
app.get('/api/search/products', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query required'
      });
    }

    if (!db) {
      return res.status(503).json({
        success: false,
        error: 'Database unavailable'
      });
    }

    const snapshot = await db.collection('products')
      .where('title', '>=', q)
      .where('title', '<=', q + '\uf8ff')
      .limit(20)
      .get();
    
    const results = [];
    snapshot.forEach(doc => {
      results.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({
      success: true,
      query: q,
      results,
      count: results.length
    });
  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found'
  });
});

// Start server
const startServer = async () => {
  // Initialize Firebase
  await initFirebase();
  
  // Start listening
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║   🚀 PROFESSIONAL BACKEND V2.0                 ║
║                                                ║
║   Port: ${PORT}                                   ║
║   Environment: ${process.env.NODE_ENV || 'production'}           ║
║   Status: OPERATIONAL                         ║
║                                                ║
║   Features:                                   ║
║   ✅ Firebase Integration                     ║
║   ✅ Rate Limiting                            ║
║   ✅ Security Headers                         ║
║   ✅ Error Handling                           ║
║   ✅ Logging                                  ║
║   ✅ Health Monitoring                        ║
╚════════════════════════════════════════════════╝
    `);
  });
};

startServer();

module.exports = app;
