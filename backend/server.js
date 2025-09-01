/**
 * Souk El-Syarat Professional Backend Server
 * Complete backend with authentication, real-time, and all services
 * Production-ready with error handling and monitoring
 */

const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

// Initialize Firebase Admin SDK with automatic credentials
console.log('🚀 Initializing Firebase Admin SDK...');
try {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'souk-el-syarat',
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://souk-el-syarat-default-rtdb.firebaseio.com',
  });
  console.log('✅ Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('❌ Firebase Admin initialization error:', error);
  process.exit(1);
}

// Create Express app
const app = express();
const PORT = process.env.PORT || 8080;

// Trust proxy for App Hosting
app.set('trust proxy', true);

// Compression middleware
app.use(compression());

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
  crossOriginEmbedderPolicy: false
}));

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS configuration for production
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://souk-el-syarat.web.app',
      'https://souk-el-syarat.firebaseapp.com',
      /^https:\/\/.*--souk-el-syarat\.web\.app$/,
      /^https:\/\/souk-el-syarat--.*\.web\.app$/
    ];
    
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    // Check exact matches
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      }
      return allowed.test(origin);
    });
    
    // In development, allow localhost
    if (process.env.NODE_ENV !== 'production') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  maxAge: 86400 // Cache preflight for 24 hours
};

app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Request ID middleware
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  res.setHeader('X-Response-Time', Date.now());
  next();
});

// Custom security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ============= HELPER FUNCTIONS =============

// Verify Firebase Auth token
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'No valid authentication token provided'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    req.userId = decodedToken.uid;
    
    // Get user data from Firestore
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(decodedToken.uid)
      .get();
    
    if (userDoc.exists) {
      req.userData = userDoc.data();
      req.userRole = userDoc.data().role || 'customer';
    }
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }
}

// Check admin role
function requireAdmin(req, res, next) {
  if (req.userRole !== 'admin' && req.userRole !== 'super_admin') {
    return res.status(403).json({ 
      error: 'Forbidden',
      message: 'Admin access required'
    });
  }
  next();
}

// Send email via Firestore mail collection
async function sendEmail(to, subject, html, template = null) {
  try {
    const emailData = {
      to: Array.isArray(to) ? to : [to],
      message: {
        subject: subject,
        html: html,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (template) {
      emailData.template = template;
    }
    
    await admin.firestore().collection('mail').add(emailData);
    console.log(`📧 Email queued: ${subject} to ${to}`);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}

// ============= API ENDPOINTS =============

// Health check endpoint
app.get('/health', async (req, res) => {
  const startTime = Date.now();
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {}
  };
  
  try {
    // Check Firestore
    const testDoc = await admin.firestore().collection('_health').doc('test').get();
    health.services.firestore = 'connected';
    
    // Check Auth
    const users = await admin.auth().listUsers(1);
    health.services.authentication = 'active';
    
    // Check Realtime Database
    const snapshot = await admin.database().ref('_health/test').once('value');
    health.services.realtimeDatabase = 'connected';
    
    // Check Storage
    const [buckets] = await admin.storage().bucket().getMetadata();
    health.services.storage = 'connected';
    
    health.responseTime = `${Date.now() - startTime}ms`;
    res.json(health);
  } catch (error) {
    health.status = 'unhealthy';
    health.error = error.message;
    health.services.error = error.message;
    res.status(503).json(health);
  }
});

// User Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, displayName, phoneNumber, role = 'customer' } = req.body;
    
    // Validation
    if (!email || !password || !displayName) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Email, password, and display name are required'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Password must be at least 6 characters'
      });
    }
    
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
      phoneNumber,
      emailVerified: false
    });
    
    // Create user profile in Firestore
    const userData = {
      uid: userRecord.uid,
      email,
      displayName,
      phoneNumber: phoneNumber || null,
      photoURL: null,
      role,
      isActive: true,
      emailVerified: false,
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
      },
      metadata: {
        lastLogin: null,
        loginCount: 0,
        registrationIP: req.ip,
        registrationUserAgent: req.headers['user-agent']
      }
    };
    
    await admin.firestore().collection('users').doc(userRecord.uid).set(userData);
    
    // Create real-time database entry
    await admin.database().ref(`users/${userRecord.uid}`).set({
      displayName,
      role,
      isOnline: false,
      lastSeen: admin.database.ServerValue.TIMESTAMP
    });
    
    // Send welcome email
    await sendEmail(email, 'مرحباً بك في سوق السيارات', `
      <div dir="rtl" style="font-family: Arial, sans-serif;">
        <h1>مرحباً ${displayName}!</h1>
        <p>شكراً لانضمامك إلى سوق السيارات، أكبر منصة لبيع وشراء السيارات في مصر.</p>
        <p>يمكنك الآن:</p>
        <ul>
          <li>تصفح آلاف السيارات المعروضة</li>
          <li>التواصل مع البائعين مباشرة</li>
          <li>حفظ السيارات المفضلة</li>
          <li>نشر إعلانك مجاناً</li>
        </ul>
        <p>مع تحيات فريق سوق السيارات</p>
      </div>
    `);
    
    // Generate custom token for immediate login
    const customToken = await admin.auth().createCustomToken(userRecord.uid);
    
    res.status(201).json({ 
      success: true,
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      role,
      customToken,
      message: 'User registered successfully'
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ 
        error: 'Conflict',
        message: 'Email already registered'
      });
    }
    
    res.status(400).json({ 
      error: 'Registration Failed',
      message: error.message
    });
  }
});

// Get Products
app.get('/api/products', async (req, res) => {
  try {
    const { 
      category, 
      minPrice, 
      maxPrice, 
      brand,
      year,
      condition,
      limit = 20, 
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    let query = admin.firestore().collection('products').where('active', '==', true);
    
    // Apply filters
    if (category) {
      query = query.where('category', '==', category);
    }
    
    if (brand) {
      query = query.where('brand', '==', brand);
    }
    
    if (condition) {
      query = query.where('condition', '==', condition);
    }
    
    if (year) {
      query = query.where('year', '==', parseInt(year));
    }
    
    // Price range filter (Firestore limitation: can only use range on one field)
    if (minPrice && maxPrice) {
      query = query.where('price', '>=', parseFloat(minPrice))
                   .where('price', '<=', parseFloat(maxPrice));
    } else if (minPrice) {
      query = query.where('price', '>=', parseFloat(minPrice));
    } else if (maxPrice) {
      query = query.where('price', '<=', parseFloat(maxPrice));
    }
    
    // Apply sorting
    query = query.orderBy(sortBy, sortOrder);
    
    // Apply pagination
    const snapshot = await query
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();
    
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));
    
    // Get total count for pagination
    const countSnapshot = await admin.firestore()
      .collection('products')
      .where('active', '==', true)
      .count()
      .get();
    
    res.json({ 
      success: true,
      products,
      pagination: {
        total: countSnapshot.data().count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: products.length === parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ 
      error: 'Server Error',
      message: 'Failed to fetch products'
    });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const doc = await admin.firestore()
      .collection('products')
      .doc(req.params.id)
      .get();
    
    if (!doc.exists) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Product not found'
      });
    }
    
    const product = {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    };
    
    // Increment view count
    await doc.ref.update({
      viewCount: admin.firestore.FieldValue.increment(1)
    });
    
    res.json({ 
      success: true,
      product
    });
    
  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({ 
      error: 'Server Error',
      message: 'Failed to fetch product'
    });
  }
});

// Create Order (Protected)
app.post('/api/orders', verifyToken, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod = 'cash', notes } = req.body;
    
    // Validation
    if (!items || !items.length) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Order must contain at least one item'
      });
    }
    
    if (!shippingAddress) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Shipping address is required'
      });
    }
    
    // Calculate total and validate products
    let total = 0;
    const orderItems = [];
    
    for (const item of items) {
      const productDoc = await admin.firestore()
        .collection('products')
        .doc(item.productId)
        .get();
      
      if (!productDoc.exists) {
        return res.status(400).json({ 
          error: 'Validation Error',
          message: `Product ${item.productId} not found`
        });
      }
      
      const product = productDoc.data();
      const itemTotal = product.price * item.quantity;
      total += itemTotal;
      
      orderItems.push({
        productId: item.productId,
        productName: product.title,
        price: product.price,
        quantity: item.quantity,
        total: itemTotal
      });
    }
    
    // Create order
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    const orderData = {
      orderNumber,
      userId: req.userId,
      userEmail: req.user.email,
      userName: req.userData?.displayName || 'Customer',
      items: orderItems,
      shippingAddress,
      paymentMethod,
      notes,
      subtotal: total,
      tax: total * 0.14, // 14% VAT in Egypt
      shipping: 50, // Fixed shipping cost
      total: total + (total * 0.14) + 50,
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        note: 'Order placed'
      }],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const orderRef = await admin.firestore().collection('orders').add(orderData);
    
    // Update real-time database
    await admin.database().ref(`orders/${orderRef.id}`).set({
      orderNumber,
      userId: req.userId,
      status: 'pending',
      total: orderData.total,
      timestamp: admin.database.ServerValue.TIMESTAMP
    });
    
    // Send order confirmation email
    await sendEmail(req.user.email, `تأكيد الطلب #${orderNumber}`, `
      <div dir="rtl" style="font-family: Arial, sans-serif;">
        <h1>تم استلام طلبك بنجاح!</h1>
        <p>عزيزي ${req.userData?.displayName || 'العميل'},</p>
        <p>تم استلام طلبك رقم <strong>${orderNumber}</strong> بنجاح.</p>
        
        <h3>تفاصيل الطلب:</h3>
        <ul>
          <li>المجموع الفرعي: ${total} جنيه</li>
          <li>الضريبة: ${(total * 0.14).toFixed(2)} جنيه</li>
          <li>الشحن: 50 جنيه</li>
          <li><strong>المجموع الكلي: ${orderData.total.toFixed(2)} جنيه</strong></li>
        </ul>
        
        <p>طريقة الدفع: ${paymentMethod === 'cash' ? 'الدفع عند الاستلام' : paymentMethod}</p>
        <p>عنوان الشحن: ${shippingAddress}</p>
        
        <p>سنقوم بإشعارك عند شحن طلبك.</p>
        <p>شكراً لتسوقك من سوق السيارات!</p>
      </div>
    `);
    
    res.status(201).json({ 
      success: true,
      orderId: orderRef.id,
      orderNumber,
      total: orderData.total,
      message: 'Order created successfully'
    });
    
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ 
      error: 'Server Error',
      message: 'Failed to create order'
    });
  }
});

// Get User Orders (Protected)
app.get('/api/orders', verifyToken, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    
    let query = admin.firestore()
      .collection('orders')
      .where('userId', '==', req.userId);
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();
    
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));
    
    res.json({ 
      success: true,
      orders,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: orders.length === parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ 
      error: 'Server Error',
      message: 'Failed to fetch orders'
    });
  }
});

// Categories
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
    res.status(500).json({ 
      error: 'Server Error',
      message: 'Failed to fetch categories'
    });
  }
});

// Search
app.post('/api/search', async (req, res) => {
  try {
    const { query, filters = {} } = req.body;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Search query must be at least 2 characters'
      });
    }
    
    // Get all active products (in production, use Algolia or ElasticSearch)
    const snapshot = await admin.firestore()
      .collection('products')
      .where('active', '==', true)
      .limit(100)
      .get();
    
    const searchTerm = query.toLowerCase();
    const results = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(product => {
        const searchableText = `${product.title} ${product.description} ${product.brand} ${product.model}`.toLowerCase();
        return searchableText.includes(searchTerm);
      })
      .slice(0, 20); // Limit results
    
    res.json({ 
      success: true,
      results,
      total: results.length,
      query
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Server Error',
      message: 'Search failed'
    });
  }
});

// Vendor Application
app.post('/api/vendor/apply', verifyToken, async (req, res) => {
  try {
    const { businessName, businessType, nationalId, commercialRegister, taxCard } = req.body;
    
    // Check if already applied
    const existing = await admin.firestore()
      .collection('vendorApplications')
      .where('userId', '==', req.userId)
      .where('status', 'in', ['pending', 'approved'])
      .get();
    
    if (!existing.empty) {
      return res.status(409).json({ 
        error: 'Conflict',
        message: 'You already have a pending or approved vendor application'
      });
    }
    
    const applicationData = {
      userId: req.userId,
      userEmail: req.user.email,
      businessName,
      businessType,
      nationalId,
      commercialRegister,
      taxCard,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const appRef = await admin.firestore().collection('vendorApplications').add(applicationData);
    
    // Notify admins
    await admin.database().ref('notifications/admin').push({
      type: 'vendor_application',
      applicationId: appRef.id,
      userId: req.userId,
      businessName,
      timestamp: admin.database.ServerValue.TIMESTAMP
    });
    
    res.status(201).json({ 
      success: true,
      applicationId: appRef.id,
      message: 'Vendor application submitted successfully'
    });
    
  } catch (error) {
    console.error('Vendor application error:', error);
    res.status(500).json({ 
      error: 'Server Error',
      message: 'Failed to submit vendor application'
    });
  }
});

// Admin: Get all users (Protected)
app.get('/api/admin/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { role, limit = 50, pageToken } = req.query;
    
    // Get users from Auth
    const listUsersResult = await admin.auth().listUsers(parseInt(limit), pageToken);
    
    // Get additional data from Firestore
    const userIds = listUsersResult.users.map(u => u.uid);
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where(admin.firestore.FieldPath.documentId(), 'in', userIds)
      .get();
    
    const usersData = {};
    usersSnapshot.docs.forEach(doc => {
      usersData[doc.id] = doc.data();
    });
    
    const users = listUsersResult.users.map(user => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      phoneNumber: user.phoneNumber,
      emailVerified: user.emailVerified,
      disabled: user.disabled,
      createdAt: user.metadata.creationTime,
      lastSignIn: user.metadata.lastSignInTime,
      role: usersData[user.uid]?.role || 'customer',
      isActive: usersData[user.uid]?.isActive !== false
    }));
    
    // Filter by role if specified
    const filteredUsers = role 
      ? users.filter(u => u.role === role)
      : users;
    
    res.json({ 
      success: true,
      users: filteredUsers,
      pageToken: listUsersResult.pageToken,
      hasMore: !!listUsersResult.pageToken
    });
    
  } catch (error) {
    console.error('Admin users fetch error:', error);
    res.status(500).json({ 
      error: 'Server Error',
      message: 'Failed to fetch users'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origin not allowed',
      origin: req.headers.origin
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
});

// Response time logging
app.use((req, res, next) => {
  const startTime = res.getHeader('X-Response-Time');
  if (startTime) {
    const responseTime = Date.now() - parseInt(startTime);
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${responseTime}ms`);
  }
  next();
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     🚀 Souk El-Syarat Backend Server Started              ║
║                                                            ║
║     Environment: ${process.env.NODE_ENV || 'development'}                             ║
║     Port: ${PORT}                                         ║
║     Time: ${new Date().toISOString()}          ║
║                                                            ║
║     Services:                                              ║
║     ✅ Firebase Admin SDK                                 ║
║     ✅ Firestore Database                                 ║
║     ✅ Realtime Database                                  ║
║     ✅ Authentication                                     ║
║     ✅ Cloud Storage                                      ║
║     ✅ Email Service                                      ║
║                                                            ║
║     Endpoints:                                             ║
║     GET  /health                                           ║
║     POST /api/auth/register                               ║
║     GET  /api/products                                    ║
║     GET  /api/products/:id                                ║
║     POST /api/orders (auth required)                      ║
║     GET  /api/orders (auth required)                      ║
║     GET  /api/categories                                  ║
║     POST /api/search                                      ║
║     POST /api/vendor/apply (auth required)                ║
║     GET  /api/admin/users (admin required)                ║
║                                                            ║
║     Ready to serve requests!                              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  app.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;