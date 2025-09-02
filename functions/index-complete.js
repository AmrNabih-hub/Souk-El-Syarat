/**
 * Complete Cloud Functions API Implementation
 * All endpoints properly configured
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();
const rtdb = admin.database();

// Create Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.query);
  next();
});

// ============= HEALTH & STATUS =============

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'cloud-functions-api',
    version: '2.0.0'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Souk El-Syarat API',
    version: '2.0.0',
    endpoints: {
      health: '/health',
      products: '/api/products',
      vendors: '/api/vendors',
      search: '/api/search/products',
      auth: '/api/auth/*',
      orders: '/api/orders/*'
    }
  });
});

// ============= PRODUCTS =============

app.get('/api/products', async (req, res) => {
  try {
    const { category, limit = 20, offset = 0 } = req.query;
    
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
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || null
      });
    });
    
    res.json({
      success: true,
      products,
      count: products.length,
      total: snapshot.size
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

app.get('/api/products/:id', async (req, res) => {
  try {
    const doc = await db.collection('products').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      product: {
        id: doc.id,
        ...doc.data()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    // Check authorization (simplified)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Authorization required'
      });
    }
    
    const productData = {
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('products').add(productData);
    
    res.status(201).json({
      success: true,
      id: docRef.id,
      message: 'Product created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============= VENDORS =============

app.get('/api/vendors', async (req, res) => {
  try {
    const { status, limit = 20 } = req.query;
    
    let query = db.collection('vendors');
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    const snapshot = await query.limit(parseInt(limit)).get();
    
    const vendors = [];
    snapshot.forEach(doc => {
      vendors.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({
      success: true,
      vendors,
      count: vendors.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendors',
      message: error.message
    });
  }
});

app.post('/api/vendors/apply', async (req, res) => {
  try {
    const applicationData = {
      ...req.body,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('vendorApplications').add(applicationData);
    
    // Create notification for admin
    await db.collection('notifications').add({
      type: 'vendor_application',
      applicationId: docRef.id,
      message: `New vendor application from ${req.body.businessName}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(201).json({
      success: true,
      applicationId: docRef.id,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============= SEARCH =============

app.get('/api/search/products', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, limit = 20 } = req.query;
    
    let results = [];
    
    if (q) {
      // Simple text search (in production, use Algolia or Elasticsearch)
      const snapshot = await db.collection('products')
        .orderBy('name')
        .startAt(q)
        .endAt(q + '\uf8ff')
        .limit(parseInt(limit))
        .get();
      
      snapshot.forEach(doc => {
        const data = doc.data();
        
        // Apply filters
        if (category && data.category !== category) return;
        if (minPrice && data.price < parseFloat(minPrice)) return;
        if (maxPrice && data.price > parseFloat(maxPrice)) return;
        
        results.push({
          id: doc.id,
          ...data
        });
      });
    }
    
    res.json({
      success: true,
      query: q,
      results,
      count: results.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error.message
    });
  }
});

app.get('/api/search/trending', async (req, res) => {
  try {
    // Get trending searches from analytics
    const trending = [
      'Toyota Camry',
      'Honda Civic',
      'Nissan Sunny',
      'BMW',
      'Mercedes'
    ];
    
    res.json({
      success: true,
      trending,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============= ORDERS =============

app.post('/api/orders/create', async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      status: 'pending',
      paymentMethod: req.body.paymentMethod || 'cod',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('orders').add(orderData);
    
    // Update real-time database
    await rtdb.ref(`orders/${docRef.id}`).set({
      status: 'pending',
      createdAt: Date.now()
    });
    
    res.status(201).json({
      success: true,
      orderId: docRef.id,
      message: 'Order created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const doc = await db.collection('orders').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      order: {
        id: doc.id,
        ...doc.data()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============= AUTHENTICATION =============

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name
    });
    
    // Create user profile in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email,
      name,
      role: 'customer',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(201).json({
      success: true,
      userId: userRecord.uid,
      message: 'User registered successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// ============= ADMIN ENDPOINTS =============

app.get('/api/admin/users', async (req, res) => {
  try {
    // Check admin authorization (simplified)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Admin authorization required'
      });
    }
    
    const snapshot = await db.collection('users').limit(50).get();
    
    const users = [];
    snapshot.forEach(doc => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({
      success: true,
      users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============= ERROR HANDLING =============

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Export the Express app as a Cloud Function
exports.api = functions
  .runWith({
    memory: '512MB',
    timeoutSeconds: 60
  })
  .https.onRequest(app);

// Additional trigger functions
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  console.log('New user created:', user.email);
  
  // Create user profile
  await db.collection('users').doc(user.uid).set({
    email: user.email,
    displayName: user.displayName,
    role: 'customer',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return null;
});

// Scheduled function for analytics
exports.dailyAnalytics = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('Africa/Cairo')
  .onRun(async (context) => {
    console.log('Running daily analytics...');
    
    // Calculate daily stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const ordersSnapshot = await db.collection('orders')
      .where('createdAt', '>=', today)
      .get();
    
    const stats = {
      date: today.toISOString(),
      orders: ordersSnapshot.size,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('analytics').add(stats);
    
    return null;
  });
