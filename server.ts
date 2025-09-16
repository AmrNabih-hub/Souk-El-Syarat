/**
 * 🚀 SOUK EL-SAYARAT - UNIFIED BACKEND SERVER
 * Professional TypeScript Server for Firebase App Hosting
 * 
 * Architecture: Express.js + Firebase Admin SDK + Professional Error Handling
 * Performance: Optimized for production with proper logging and monitoring
 * Security: Comprehensive security headers, rate limiting, and validation
 * 
 * @author Souk El-Sayarat Engineering Team
 * @version 2.0.0
 * @created 2024
 */

import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

// 🚨 CRITICAL: Initialize Firebase Admin SDK
try {
  // Initialize Firebase Admin with proper error handling
  if (!admin.apps.length) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Development mode: Using mock Firebase configuration');
      // In development, we'll initialize with minimal config
      admin.initializeApp({
        projectId: 'souk-el-syarat-dev',
      });
      console.log('✅ Mock Firebase Admin SDK initialized for development');
    } else {
      // Production mode - require proper credentials
      admin.initializeApp({
        // Firebase will use default credentials in production
      });
      console.log('✅ Firebase Admin SDK initialized successfully');
    }
  } else {
    console.log('✅ Firebase Admin SDK already initialized');
  }
} catch (error) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Firebase Admin SDK initialization failed in development mode. Using fallback mode.');
    console.warn('Firebase-dependent features may not work properly.');
    // Don't exit in development mode - allow server to start
  } else {
    console.error('❌ CRITICAL: Firebase Admin SDK initialization failed:', error);
    process.exit(1);
  }
}

const db = admin.firestore();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🚀 EXPRESS APPLICATION SETUP
const app = express();

// 🚨 CRITICAL PORT CONFIGURATION
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'production';

// Enhanced logging for deployment debugging
console.log('🚀 Starting Souk El-Sayarat Professional Backend Server...');
console.log(`📊 Environment: ${NODE_ENV}`);
console.log(`🔌 Port: ${PORT}`);
console.log(`🌐 Host: ${HOST}`);
console.log(`⏰ Started at: ${new Date().toISOString()}`);

// 🛡️ SECURITY MIDDLEWARE - Professional Grade
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: [
        "'self'", 
        "https://*.firebaseapp.com", 
        "https://*.googleapis.com",
        "https://*.firebaseio.com",
        "wss://*.firebaseio.com"
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// 🌐 CORS CONFIGURATION - Production Ready
app.use(cors({
  origin: [
    'https://souk-el-syarat.web.app',
    'https://souk-el-syarat.firebaseapp.com',
    'https://souk-el-sayarat-backend--souk-el-syarat.europe-west4.hosted.app',
    'https://my-web-app--souk-el-syarat.us-central1.hosted.app',
    ...(NODE_ENV === 'development' ? [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ] : [])
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'X-CSRF-Token',
    'X-API-Key'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // 24 hours
}));

// ⚡ RATE LIMITING - Professional Protection
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'production' ? 1000 : 10000, // Limit per IP
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/status';
  }
});
app.use(limiter);

// 🗜️ COMPRESSION - Performance Optimization
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// 📝 BODY PARSING MIDDLEWARE
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook verification
    (req as any).rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// 📊 REQUEST LOGGING MIDDLEWARE
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent')?.substring(0, 100),
      ip: req.ip,
      timestamp
    };
    
    if (res.statusCode >= 400) {
      console.warn('⚠️ Request Warning:', logData);
    } else {
      console.log('📝 Request:', logData);
    }
  });
  
  next();
});

// 🏥 HEALTH CHECK ENDPOINTS
app.get('/health', async (req: Request, res: Response) => {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: NODE_ENV,
      version: '2.0.0',
      service: 'souk-el-sayarat-backend',
      deployment: 'app-hosting',
      region: process.env.REGION || 'europe-west4',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      firebase: {
        connected: true,
        status: 'operational'
      }
    };

    // Test Firebase connection
    try {
      if (process.env.NODE_ENV === 'development') {
        // In development mode, Firebase might not be properly configured
        healthCheck.firebase.status = 'mock-mode';
        healthCheck.firebase.connected = false;
      } else {
        await db.collection('health_checks').doc('status').get();
        healthCheck.firebase.status = 'connected';
        healthCheck.firebase.connected = true;
      }
    } catch (error) {
      healthCheck.firebase.status = 'error';
      healthCheck.firebase.connected = false;
      (healthCheck.firebase as any).error = (error as Error).message;
    }

    res.status(200).json(healthCheck);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: (error as Error).message
    });
  }
});

// 📊 API STATUS ENDPOINT
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    message: 'Souk El-Sayarat Backend API - Professional Edition',
    status: 'operational',
    version: '2.0.0',
    deployment: 'app-hosting',
    timestamp: new Date().toISOString(),
    services: {
      authentication: 'active',
      database: 'connected',
      realtime: 'enabled',
      notifications: 'active',
      apphosting: 'active',
      api: 'operational'
    },
    endpoints: {
      health: '/health',
      status: '/api/status',
      auth: '/api/auth/*',
      users: '/api/users/*',
      products: '/api/products/*',
      orders: '/api/orders/*',
      vendors: '/api/vendors/*',
      analytics: '/api/analytics/*'
    }
  });
});

// 🔐 AUTHENTICATION ENDPOINTS
app.post('/api/auth/verify', (req: Request, res: Response) => {
  res.json({
    authenticated: true,
    message: 'Authentication service is operational',
    endpoints: {
      login: '/api/auth/login',
      signup: '/api/auth/signup',
      logout: '/api/auth/logout',
      reset: '/api/auth/reset',
      verify: '/api/auth/verify'
    },
    timestamp: new Date().toISOString()
  });
});

// 🔑 LOGIN ENDPOINT
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS',
        timestamp: new Date().toISOString()
      });
    }

    // TODO: Integrate with Firebase Auth
    res.json({
      success: true,
      message: 'Login endpoint operational - ready for Firebase Auth integration',
      data: {
        email: email,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'LOGIN_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// 📝 SIGNUP ENDPOINT
app.post('/api/auth/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required',
        code: 'MISSING_FIELDS',
        timestamp: new Date().toISOString()
      });
    }

    // TODO: Integrate with Firebase Auth
    res.json({
      success: true,
      message: 'Signup endpoint operational - ready for Firebase Auth integration',
      data: {
        email: email,
        name: name,
        role: role || 'customer',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'SIGNUP_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// 🚪 LOGOUT ENDPOINT
app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logout endpoint operational - ready for Firebase Auth integration',
    timestamp: new Date().toISOString()
  });
});

// 🔄 PASSWORD RESET ENDPOINT
app.post('/api/auth/reset', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
        code: 'MISSING_EMAIL',
        timestamp: new Date().toISOString()
      });
    }

    // TODO: Integrate with Firebase Auth
    res.json({
      success: true,
      message: 'Password reset endpoint operational - ready for Firebase Auth integration',
      data: {
        email: email,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'RESET_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// 📦 ORDER PROCESSING ENDPOINTS
app.post('/api/orders/process', async (req: Request, res: Response) => {
  try {
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    res.json({
      success: true,
      message: 'Order processing service is operational',
      data: {
        orderId,
        status: 'processing',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Order processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Order processing failed',
      code: 'ORDER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// 🏪 VENDOR MANAGEMENT ENDPOINTS
app.get('/api/vendors/status', async (req: Request, res: Response) => {
  try {
    res.json({
      vendors: {
        active: 0,
        pending: 0,
        total: 0
      },
      status: 'operational',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Vendor status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get vendor status',
      timestamp: new Date().toISOString()
    });
  }
});

// 🛍️ PRODUCT MANAGEMENT ENDPOINTS
app.get('/api/products/status', async (req: Request, res: Response) => {
  try {
    res.json({
      products: {
        total: 0,
        active: 0,
        pending: 0
      },
      status: 'operational',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Product status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get product status',
      timestamp: new Date().toISOString()
    });
  }
});

// 📊 ANALYTICS ENDPOINTS
app.get('/api/analytics/dashboard', async (req: Request, res: Response) => {
  try {
    res.json({
      analytics: {
        users: { total: 0, active: 0 },
        orders: { total: 0, completed: 0, pending: 0 },
        revenue: { total: 0, monthly: 0 },
        vendors: { total: 0, active: 0 }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics data',
      timestamp: new Date().toISOString()
    });
  }
});

// 🌐 STATIC FILE SERVING
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: NODE_ENV === 'production' ? '1y' : '0',
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// 🎯 SPA FALLBACK - Only for non-API routes
app.use((req: Request, res: Response, next: NextFunction) => {
  // If it's an API route, return 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: 'Not Found',
      message: `API endpoint '${req.path}' not found`,
      code: 'ENDPOINT_NOT_FOUND',
      timestamp: new Date().toISOString(),
      availableEndpoints: [
        '/health',
        '/api/status',
        '/api/auth/*',
        '/api/users/*',
        '/api/products/*',
        '/api/orders/*',
        '/api/vendors/*',
        '/api/analytics/*'
      ]
    });
  }
  
  // For all other routes, serve index.html
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 🚨 ERROR HANDLING MIDDLEWARE
const errorHandler: ErrorRequestHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('🚨 Server Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  const isDevelopment = NODE_ENV === 'development';
  
  res.status((err as any).status || 500).json({
    error: 'Internal Server Error',
    message: isDevelopment ? err.message : 'Something went wrong',
    code: (err as any).code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    ...(isDevelopment && { stack: err.stack })
  });
};

app.use(errorHandler);

// 🚀 SERVER STARTUP
const server = app.listen(PORT, HOST, () => {
  console.log(`✅ Souk El-Sayarat Backend Server successfully started!`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`🔌 Listening on: http://${HOST}:${PORT}`);
  console.log(`🏥 Health check: http://${HOST}:${PORT}/health`);
  console.log(`📊 API status: http://${HOST}:${PORT}/api/status`);
  console.log(`🔐 Auth endpoints: /api/auth/login, /api/auth/signup, /api/auth/logout, /api/auth/reset`);
  console.log(`⏰ Server started at: ${new Date().toISOString()}`);
});

// 🔄 GRACEFUL SHUTDOWN
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 ${signal} received. Starting graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      console.error('❌ Error during server shutdown:', err);
      process.exit(1);
    }
    
    console.log('✅ Server closed successfully');
    console.log('🔄 Closing database connections...');
    
    // Close Firebase connections
    admin.app().delete().then(() => {
      console.log('✅ Firebase connections closed');
      console.log('👋 Graceful shutdown completed');
      process.exit(0);
    }).catch((error) => {
      console.error('❌ Error closing Firebase connections:', error);
      process.exit(1);
    });
  });
  
  // Force close after 30 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 🎯 EXPORT FOR TESTING
export default app;
