/**
 * Firebase Cloud Functions - Main Backend Server
 * Production-ready backend services for Souk El-Sayarat
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize services
import { paymentRoutes } from './routes/payment.routes';
import { searchRoutes } from './routes/search.routes';
import { vendorRoutes } from './routes/vendor.routes';
import { orderRoutes } from './routes/order.routes';
import { authRoutes } from './routes/auth.routes';
import { analyticsRoutes } from './routes/analytics.routes';
import { notificationRoutes } from './routes/notification.routes';
import { adminRoutes } from './routes/admin.routes';

// Import middleware
import { authMiddleware } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/logging.middleware';
import { validateRequest } from './middleware/validation.middleware';

// Import scheduled functions
import { scheduledFunctions } from './scheduled';

// Import triggers
import { databaseTriggers } from './triggers/database.triggers';
import { storageTriggers } from './triggers/storage.triggers';
import { authTriggers } from './triggers/auth.triggers';

// ============================================
// EXPRESS APP CONFIGURATION
// ============================================

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = [
      'https://souk-elsayarat.com',
      'https://app.souk-elsayarat.com',
      'http://localhost:3000',
      'http://localhost:5173',
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Strict limit for sensitive operations
  message: 'Too many attempts, please try again later.',
});

app.use('/api/', limiter);
app.use('/api/auth/login', strictLimiter);
app.use('/api/payments/verify', strictLimiter);

// Body parsing and compression
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Logging
app.use(morgan('combined'));
app.use(requestLogger);

// ============================================
// API ROUTES
// ============================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Public routes (no auth required)
app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);

// Protected routes (auth required)
app.use('/api/payments', authMiddleware, paymentRoutes);
app.use('/api/vendors', authMiddleware, vendorRoutes);
app.use('/api/orders', authMiddleware, orderRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);

// Admin routes (admin auth required)
app.use('/api/admin', authMiddleware, adminRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist',
    path: req.originalUrl,
  });
});

// ============================================
// FIREBASE CLOUD FUNCTIONS EXPORTS
// ============================================

// HTTP Function - Main API
export const api = functions
  .region('us-central1', 'europe-west1') // Multi-region deployment
  .runWith({
    timeoutSeconds: 60,
    memory: '2GB',
    maxInstances: 100,
    minInstances: 2, // Keep warm instances
  })
  .https.onRequest(app);

// ============================================
// SCHEDULED FUNCTIONS
// ============================================

// Daily analytics aggregation
export const dailyAnalytics = functions
  .region('us-central1')
  .pubsub
  .schedule('0 2 * * *') // Run at 2 AM daily
  .timeZone('Africa/Cairo')
  .onRun(scheduledFunctions.aggregateAnalytics);

// Hourly order status check
export const orderStatusCheck = functions
  .region('us-central1')
  .pubsub
  .schedule('0 * * * *') // Run every hour
  .onRun(scheduledFunctions.checkPendingOrders);

// Weekly vendor payouts
export const vendorPayouts = functions
  .region('us-central1')
  .pubsub
  .schedule('0 10 * * 1') // Run Monday at 10 AM
  .timeZone('Africa/Cairo')
  .onRun(scheduledFunctions.processVendorPayouts);

// Daily backup
export const dailyBackup = functions
  .region('us-central1')
  .pubsub
  .schedule('0 3 * * *') // Run at 3 AM daily
  .timeZone('Africa/Cairo')
  .onRun(scheduledFunctions.performBackup);

// Clean expired sessions
export const cleanupSessions = functions
  .region('us-central1')
  .pubsub
  .schedule('*/30 * * * *') // Run every 30 minutes
  .onRun(scheduledFunctions.cleanExpiredSessions);

// ============================================
// DATABASE TRIGGERS
// ============================================

// New order trigger
export const onOrderCreated = functions
  .region('us-central1')
  .firestore
  .document('orders/{orderId}')
  .onCreate(databaseTriggers.handleNewOrder);

// Order status update trigger
export const onOrderUpdated = functions
  .region('us-central1')
  .firestore
  .document('orders/{orderId}')
  .onUpdate(databaseTriggers.handleOrderUpdate);

// New vendor application trigger
export const onVendorApplication = functions
  .region('us-central1')
  .firestore
  .document('vendor_applications/{vendorId}')
  .onCreate(databaseTriggers.handleVendorApplication);

// Product indexing trigger
export const onProductChange = functions
  .region('us-central1')
  .firestore
  .document('products/{productId}')
  .onWrite(databaseTriggers.indexProduct);

// Review aggregation trigger
export const onReviewAdded = functions
  .region('us-central1')
  .firestore
  .document('reviews/{reviewId}')
  .onCreate(databaseTriggers.aggregateReviews);

// ============================================
// STORAGE TRIGGERS
// ============================================

// Image optimization trigger
export const optimizeImage = functions
  .region('us-central1')
  .runWith({
    timeoutSeconds: 120,
    memory: '2GB',
  })
  .storage
  .object()
  .onFinalize(storageTriggers.processImage);

// Document verification trigger
export const verifyDocument = functions
  .region('us-central1')
  .storage
  .object()
  .onFinalize(storageTriggers.verifyDocument);

// ============================================
// AUTH TRIGGERS
// ============================================

// New user creation
export const onUserCreated = functions
  .region('us-central1')
  .auth
  .user()
  .onCreate(authTriggers.handleNewUser);

// User deletion
export const onUserDeleted = functions
  .region('us-central1')
  .auth
  .user()
  .onDelete(authTriggers.handleUserDeletion);

// ============================================
// CALLABLE FUNCTIONS
// ============================================

// Generate payment intent
export const createPaymentIntent = functions
  .region('us-central1')
  .runWith({
    enforceAppCheck: true, // Require App Check
  })
  .https
  .onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    try {
      const { amount, orderId, paymentMethod } = data;
      
      // Validate input
      if (!amount || !orderId || !paymentMethod) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Missing required parameters'
        );
      }

      // Process payment based on method
      let result;
      switch (paymentMethod) {
        case 'stripe':
          result = await processStripePayment(amount, orderId, context.auth.uid);
          break;
        case 'instapay':
          result = await processInstapayPayment(amount, orderId, context.auth.uid);
          break;
        default:
          throw new functions.https.HttpsError(
            'invalid-argument',
            'Invalid payment method'
          );
      }

      return result;
    } catch (error: any) {
      console.error('Payment creation failed:', error);
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Payment processing failed'
      );
    }
  });

// Send notification
export const sendNotification = functions
  .region('us-central1')
  .https
  .onCall(async (data, context) => {
    // Admin only
    if (!context.auth || !context.auth.token.admin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Admin access required'
      );
    }

    const { userId, title, message, type } = data;

    try {
      await sendPushNotification(userId, title, message, type);
      return { success: true };
    } catch (error: any) {
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

// ============================================
// HELPER FUNCTIONS
// ============================================

async function processStripePayment(
  amount: number,
  orderId: string,
  userId: string
): Promise<any> {
  // Implementation moved to payment service
  const { paymentService } = await import('./services/payment.service');
  return paymentService.createStripePayment(amount, orderId, userId);
}

async function processInstapayPayment(
  amount: number,
  orderId: string,
  userId: string
): Promise<any> {
  // Implementation moved to payment service
  const { paymentService } = await import('./services/payment.service');
  return paymentService.createInstapayPayment(amount, orderId, userId);
}

async function sendPushNotification(
  userId: string,
  title: string,
  message: string,
  type: string
): Promise<void> {
  // Implementation moved to notification service
  const { notificationService } = await import('./services/notification.service');
  await notificationService.sendPush(userId, { title, message, type });
}

// ============================================
// WEBSOCKET SERVER (Using Firebase Realtime Database)
// ============================================

// Handle real-time chat messages
export const onChatMessage = functions
  .region('us-central1')
  .database
  .ref('/chats/{conversationId}/messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    const message = snapshot.val();
    const { conversationId } = context.params;

    // Send push notification to recipient
    await sendPushNotification(
      message.recipientId,
      'New Message',
      message.content,
      'chat'
    );

    // Update conversation metadata
    await admin.database()
      .ref(`/conversations/${conversationId}`)
      .update({
        lastMessage: message,
        lastMessageTime: message.timestamp,
        [`unreadCount/${message.recipientId}`]: admin.database.ServerValue.increment(1),
      });
  });

// Handle presence updates
export const onPresenceUpdate = functions
  .region('us-central1')
  .database
  .ref('/presence/{userId}')
  .onUpdate(async (change, context) => {
    const { userId } = context.params;
    const before = change.before.val();
    const after = change.after.val();

    // Update user's online status in Firestore
    if (before.online !== after.online) {
      await admin.firestore()
        .collection('users')
        .doc(userId)
        .update({
          isOnline: after.online,
          lastSeen: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
  });

// ============================================
// MONITORING & LOGGING
// ============================================

// Custom metrics
export const recordMetric = functions
  .region('us-central1')
  .https
  .onCall(async (data, context) => {
    const { metric, value, labels } = data;
    
    // Log to Cloud Monitoring
    console.log('METRIC', {
      metric,
      value,
      labels,
      timestamp: new Date().toISOString(),
      userId: context.auth?.uid,
    });

    return { success: true };
  });

// Error reporting
export const reportError = functions
  .region('us-central1')
  .https
  .onCall(async (data, context) => {
    const { error, context: errorContext, severity } = data;
    
    // Log to Cloud Error Reporting
    console.error('CLIENT_ERROR', {
      error,
      context: errorContext,
      severity,
      userId: context.auth?.uid,
      timestamp: new Date().toISOString(),
    });

    return { logged: true };
  });

// ============================================
// INITIALIZATION
// ============================================

// Warm up function (keeps instances warm)
export const warmup = functions
  .region('us-central1')
  .pubsub
  .schedule('*/5 * * * *') // Every 5 minutes
  .onRun(async () => {
    console.log('Warming up instances...');
    // Make a simple database read to keep connection warm
    await admin.firestore().collection('_warmup').doc('ping').set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    return null;
  });

console.log('🚀 Firebase Cloud Functions initialized successfully');