/**
 * Development Server with Firebase Emulators
 * This version connects to local Firebase emulators instead of production
 */

const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

// Set emulator environment variables
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8088';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIREBASE_DATABASE_EMULATOR_HOST = 'localhost:9000';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8080;

// Trust proxy
app.set('trust proxy', true);

// Middleware
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(morgan('dev'));

// CORS for development
app.use(cors({
  origin: true,
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests'
});
app.use('/api/', limiter);

// Request ID middleware
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Initialize Firebase Admin for emulators
console.log('🔥 Initializing Firebase Admin with Emulators...');
admin.initializeApp({
  projectId: 'souk-el-syarat',
  databaseURL: 'http://localhost:9000?ns=souk-el-syarat-default-rtdb'
});

const db = admin.firestore();
const auth = admin.auth();
const rtdb = admin.database();
const storage = admin.storage();

console.log('✅ Firebase Admin initialized with emulators');
console.log('📍 Firestore: http://localhost:8088');
console.log('📍 Auth: http://localhost:9099');
console.log('📍 Database: http://localhost:9000');
console.log('📍 Storage: http://localhost:9199');
console.log('📍 Emulator UI: http://localhost:4000');

// Health check endpoint
app.get('/health', async (req, res) => {
  const startTime = Date.now();
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: 'development-emulator',
    version: '1.0.0',
    emulators: {
      firestore: process.env.FIRESTORE_EMULATOR_HOST,
      auth: process.env.FIREBASE_AUTH_EMULATOR_HOST,
      database: process.env.FIREBASE_DATABASE_EMULATOR_HOST,
      storage: process.env.FIREBASE_STORAGE_EMULATOR_HOST
    },
    services: {}
  };

  // Test Firestore
  try {
    await db.collection('_health').doc('check').set({ 
      timestamp: admin.firestore.FieldValue.serverTimestamp() 
    });
    health.services.firestore = 'active';
  } catch (error) {
    health.services.firestore = 'error';
    health.status = 'degraded';
  }

  // Test Auth
  try {
    await auth.getUserByEmail('test@example.com').catch(() => {});
    health.services.authentication = 'active';
  } catch (error) {
    health.services.authentication = 'error';
    health.status = 'degraded';
  }

  // Test Realtime Database
  try {
    await rtdb.ref('_health').set({ timestamp: Date.now() });
    health.services.realtimeDatabase = 'active';
  } catch (error) {
    health.services.realtimeDatabase = 'error';
    health.status = 'degraded';
  }

  health.responseTime = `${Date.now() - startTime}ms`;
  res.json(health);
});

// API Routes
app.get('/api/products', async (req, res) => {
  try {
    const snapshot = await db.collection('products').limit(20).get();
    const products = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });
    res.json({ products, count: products.length });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const product = {
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const docRef = await db.collection('products').add(product);
    res.status(201).json({ id: docRef.id, ...product });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.get('/api/vendors', async (req, res) => {
  try {
    const snapshot = await db.collection('vendors').limit(20).get();
    const vendors = [];
    snapshot.forEach(doc => {
      vendors.push({ id: doc.id, ...doc.data() });
    });
    res.json({ vendors, count: vendors.length });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// Seed data endpoint for testing
app.post('/api/seed', async (req, res) => {
  try {
    console.log('🌱 Seeding test data...');
    
    // Add sample products
    const products = [
      { name: 'Toyota Camry 2023', price: 35000, category: 'Sedan', brand: 'Toyota' },
      { name: 'Honda Civic 2023', price: 28000, category: 'Sedan', brand: 'Honda' },
      { name: 'Ford F-150 2023', price: 45000, category: 'Truck', brand: 'Ford' }
    ];
    
    for (const product of products) {
      await db.collection('products').add({
        ...product,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // Add sample vendor
    await db.collection('vendors').add({
      name: 'Test Auto Dealer',
      email: 'dealer@example.com',
      phone: '+1234567890',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ message: 'Test data seeded successfully' });
  } catch (error) {
    console.error('Error seeding data:', error);
    res.status(500).json({ error: 'Failed to seed data' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    requestId: req.id
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Server running at http://localhost:${PORT}
📊 Health check: http://localhost:${PORT}/health
🔥 Using Firebase Emulators
📍 Emulator UI: http://localhost:4000
  `);
});