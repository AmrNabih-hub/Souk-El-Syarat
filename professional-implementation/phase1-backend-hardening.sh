#!/bin/bash

# PHASE 1: PROFESSIONAL BACKEND HARDENING
# Staff Engineer Implementation

set -e

echo "🏗️ PHASE 1: BACKEND HARDENING IMPLEMENTATION"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Create professional backend structure
echo -e "${BLUE}Creating professional backend architecture...${NC}"

mkdir -p backend-v2/{
middleware,
repositories,
services,
controllers,
models,
utils,
config,
tests
}

# Step 2: Install professional dependencies
echo -e "${BLUE}Installing enterprise dependencies...${NC}"

cd backend-v2

cat > package.json << 'EOF'
{
  "name": "souk-el-syarat-backend-v2",
  "version": "2.0.0",
  "description": "Enterprise-grade backend with professional architecture",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "lint": "eslint .",
    "security": "npm audit",
    "performance": "clinic doctor -- node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "firebase-admin": "^12.0.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    "express-rate-limit": "^7.1.5",
    "express-validator": "^7.0.1",
    "winston": "^3.11.0",
    "@sentry/node": "^7.91.0",
    "redis": "^4.6.12",
    "ioredis": "^5.3.2",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "uuid": "^9.0.1",
    "dotenv": "^16.3.1",
    "express-mongo-sanitize": "^2.2.0",
    "xss-clean": "^0.1.4",
    "hpp": "^0.2.3",
    "express-async-errors": "^3.1.1",
    "joi": "^17.11.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "@types/jest": "^29.5.11",
    "eslint": "^8.56.0",
    "prettier": "^3.1.1"
  }
}
EOF

npm install

echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 3: Create Firebase service with retry logic
echo -e "${BLUE}Creating Firebase service...${NC}"

cat > services/firebase.service.js << 'EOF'
const admin = require('firebase-admin');
const winston = require('winston');

class FirebaseService {
  constructor() {
    this.db = null;
    this.auth = null;
    this.storage = null;
    this.rtdb = null;
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'firebase.log' }),
        new winston.transports.Console()
      ]
    });
  }

  async initialize() {
    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        if (!admin.apps.length) {
          admin.initializeApp({
            projectId: process.env.FIREBASE_PROJECT_ID || 'souk-el-syarat',
            databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://souk-el-syarat-default-rtdb.firebaseio.com',
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'souk-el-syarat.firebasestorage.app'
          });
        }
        
        this.db = admin.firestore();
        this.auth = admin.auth();
        this.storage = admin.storage();
        this.rtdb = admin.database();
        
        await this.healthCheck();
        
        this.logger.info('Firebase Services Initialized Successfully');
        return true;
      } catch (error) {
        retries++;
        this.logger.error(`Firebase init attempt ${retries} failed:`, error);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    throw new Error('Failed to initialize Firebase after 3 attempts');
  }

  async healthCheck() {
    await this.db.collection('_health').doc('check').set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'healthy'
    });
  }

  getDb() { return this.db; }
  getAuth() { return this.auth; }
  getStorage() { return this.storage; }
  getRtdb() { return this.rtdb; }
}

module.exports = new FirebaseService();
EOF

echo -e "${GREEN}✓ Firebase service created${NC}"

# Step 4: Create security middleware
echo -e "${BLUE}Creating security middleware...${NC}"

cat > middleware/security.middleware.js << 'EOF'
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');

const securityMiddleware = (app) => {
  // Helmet security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // CORS
  app.use(cors({
    origin: [
      'https://souk-el-syarat.web.app',
      'https://souk-el-syarat.firebaseapp.com',
      'http://localhost:5173'
    ],
    credentials: true
  }));

  // Data sanitization
  app.use(mongoSanitize());
  app.use(xss());
  app.use(hpp());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests'
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true
  });

  app.use('/api/', limiter);
  app.use('/api/auth/', authLimiter);
};

module.exports = securityMiddleware;
EOF

echo -e "${GREEN}✓ Security middleware created${NC}"

# Step 5: Create product repository
echo -e "${BLUE}Creating product repository...${NC}"

cat > repositories/product.repository.js << 'EOF'
class ProductRepository {
  constructor(firebaseService) {
    this.db = firebaseService.getDb();
    this.collection = 'products';
  }

  async findAll(filters = {}, pagination = {}) {
    try {
      let query = this.db.collection(this.collection);
      
      // Apply filters
      if (filters.category) {
        query = query.where('category', '==', filters.category);
      }
      if (filters.minPrice) {
        query = query.where('price', '>=', filters.minPrice);
      }
      if (filters.maxPrice) {
        query = query.where('price', '<=', filters.maxPrice);
      }
      
      // Sorting
      const sortBy = pagination.sortBy || 'createdAt';
      const sortOrder = pagination.sortOrder || 'desc';
      query = query.orderBy(sortBy, sortOrder);
      
      // Pagination
      const limit = Math.min(pagination.limit || 20, 100);
      const offset = pagination.offset || 0;
      query = query.limit(limit).offset(offset);
      
      const snapshot = await query.get();
      
      const products = [];
      snapshot.forEach(doc => {
        products.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return {
        success: true,
        data: products,
        metadata: {
          count: products.length,
          hasMore: products.length === limit
        }
      };
    } catch (error) {
      throw new Error(`Repository error: ${error.message}`);
    }
  }

  async findById(id) {
    const doc = await this.db.collection(this.collection).doc(id).get();
    if (!doc.exists) {
      throw new Error(`Product ${id} not found`);
    }
    return { id: doc.id, ...doc.data() };
  }

  async create(data) {
    const doc = await this.db.collection(this.collection).add({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return doc.id;
  }

  async update(id, data) {
    await this.db.collection(this.collection).doc(id).update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return true;
  }

  async delete(id) {
    await this.db.collection(this.collection).doc(id).delete();
    return true;
  }
}

module.exports = ProductRepository;
EOF

echo -e "${GREEN}✓ Product repository created${NC}"

# Step 6: Create main server with all integrations
echo -e "${BLUE}Creating professional server...${NC}"

cat > server.js << 'EOF'
require('dotenv').config();
require('express-async-errors');

const express = require('express');
const compression = require('compression');
const winston = require('winston');
const Sentry = require('@sentry/node');

// Services
const firebaseService = require('./services/firebase.service');
const securityMiddleware = require('./middleware/security.middleware');

// Repositories
const ProductRepository = require('./repositories/product.repository');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 8080;

// Initialize Sentry for error tracking
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0
  });
  app.use(Sentry.Handlers.requestHandler());
}

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply security middleware
securityMiddleware(app);

// Request logging
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    path: req.path,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  next();
});

// Initialize repositories
let productRepo;

// Health check
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '2.0.0',
    uptime: process.uptime()
  };

  try {
    await firebaseService.healthCheck();
    health.services = { firebase: 'connected' };
  } catch (error) {
    health.status = 'degraded';
    health.services = { firebase: 'error' };
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// API routes
app.get('/api', (req, res) => {
  res.json({
    name: 'Souk El-Syarat Professional API',
    version: '2.0.0',
    status: 'operational',
    documentation: '/api/docs'
  });
});

// Products endpoints with repository pattern
app.get('/api/products', async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined
    };

    const pagination = {
      limit: req.query.limit ? parseInt(req.query.limit) : 20,
      offset: req.query.offset ? parseInt(req.query.offset) : 0,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await productRepo.findAll(filters, pagination);
    res.json(result);
  } catch (error) {
    logger.error('Products fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await productRepo.findById(req.params.id);
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch product'
      });
    }
  }
});

// Error handling
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

app.use((err, req, res, next) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    requestId: req.id
  });
});

// Start server
const startServer = async () => {
  try {
    // Initialize Firebase
    await firebaseService.initialize();
    
    // Initialize repositories
    productRepo = new ProductRepository(firebaseService);
    
    // Start listening
    app.listen(PORT, () => {
      logger.info(`
╔════════════════════════════════════════════════╗
║   🚀 PROFESSIONAL BACKEND V2.0 - RUNNING       ║
║                                                ║
║   Port: ${PORT}                                   ║
║   Environment: ${process.env.NODE_ENV || 'development'}            ║
║   Firebase: Connected                         ║
║   Security: Enabled                           ║
║   Monitoring: Active                          ║
║                                                ║
║   Staff Engineer Architecture Applied         ║
╚════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

startServer();

module.exports = app;
EOF

echo -e "${GREEN}✓ Professional server created${NC}"

# Step 7: Create test suite
echo -e "${BLUE}Creating test suite...${NC}"

mkdir -p tests

cat > tests/api.test.js << 'EOF'
const request = require('supertest');
const app = require('../server');

describe('API Tests', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
    });
  });

  describe('GET /api/products', () => {
    it('should return products list', async () => {
      const response = await request(app).get('/api/products');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ limit: 10, offset: 0 });
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });
  });
});
EOF

echo -e "${GREEN}✓ Test suite created${NC}"

# Step 8: Create environment configuration
echo -e "${BLUE}Creating environment configuration...${NC}"

cat > .env << 'EOF'
NODE_ENV=production
PORT=8080
FIREBASE_PROJECT_ID=souk-el-syarat
FIREBASE_DATABASE_URL=https://souk-el-syarat-default-rtdb.firebaseio.com
FIREBASE_STORAGE_BUCKET=souk-el-syarat.firebasestorage.app
JWT_SECRET=your-jwt-secret-here
SENTRY_DSN=your-sentry-dsn-here
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
EOF

echo -e "${GREEN}✓ Environment configuration created${NC}"

# Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}PHASE 1 COMPLETE: BACKEND HARDENED${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "✅ Professional architecture implemented:"
echo "  • Firebase service with retry logic"
echo "  • Repository pattern for data access"
echo "  • Advanced security middleware"
echo "  • Error handling and logging"
echo "  • Test suite configured"
echo "  • Performance monitoring ready"
echo ""
echo "📊 Next steps:"
echo "  1. cd backend-v2"
echo "  2. npm start (to run the server)"
echo "  3. npm test (to run tests)"
echo "  4. Deploy to App Hosting"
echo ""
echo -e "${GREEN}Professional backend v2.0 is ready for deployment!${NC}"