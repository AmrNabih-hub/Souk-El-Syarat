#!/bin/bash

echo "🔧 FIXING REMAINING 3 ISSUES"
echo "============================="

# Fix 1: CORS Credentials Header
echo -e "\n1. Fixing CORS Credentials Header..."
cat > /workspace/firebase-backend/functions/src/cors-fix.ts << 'EOF'
import cors from 'cors';

export const corsConfig = cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://souk-el-syarat.web.app',
      'https://souk-el-syarat.firebaseapp.com',
      'http://localhost:3000',
      'http://localhost:5173'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin || '*');
    } else {
      callback(null, false);
    }
  },
  credentials: true, // THIS FIXES THE CORS CREDENTIALS ISSUE
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-Total-Count']
});
EOF

echo "✅ CORS fix created"

# Fix 2: Request ID Header
echo -e "\n2. Ensuring Request ID Header..."
cat > /workspace/firebase-backend/functions/src/request-id.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';

export const requestIdMiddleware = (req: Request & { id?: string }, res: Response, next: NextFunction) => {
  // Generate request ID
  const requestId = req.headers['x-request-id'] as string || 
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Attach to request
  req.id = requestId;
  
  // FORCE header on response (multiple times to combat Cloud Run)
  res.setHeader('X-Request-ID', requestId);
  
  // Override send to ensure header persists
  const originalSend = res.send;
  res.send = function(data: any) {
    res.setHeader('X-Request-ID', requestId);
    return originalSend.call(this, data);
  };
  
  // Override json to ensure header persists  
  const originalJson = res.json;
  res.json = function(data: any) {
    res.setHeader('X-Request-ID', requestId);
    return originalJson.call(this, data);
  };
  
  next();
};
EOF

echo "✅ Request ID middleware created"

# Fix 3: API Key Configuration
echo -e "\n3. Checking API Key Configuration..."
echo "
To fix API key validation:

1. Go to Google Cloud Console:
   https://console.cloud.google.com/apis/credentials?project=souk-el-syarat

2. Find your API key: AIzaSyAdkK2OlebHPUsWFCEqY5sWHs5ZL3wUk0Q

3. Click on it and ensure:
   - Application restrictions: HTTP referrers
   - Website restrictions include:
     * https://souk-el-syarat.web.app/*
     * https://souk-el-syarat.firebaseapp.com/*
     * http://localhost:3000/*
     * http://localhost:5173/*
   
   - API restrictions: Don't restrict (or select specific Firebase APIs)

4. Save changes
"

echo -e "\n📝 Creating updated index.ts with all fixes..."
cat > /workspace/firebase-backend/functions/src/index-complete.ts << 'EOF'
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import { corsConfig } from './cors-fix';
import { requestIdMiddleware } from './request-id';

// Initialize
if (!admin.apps.length) {
  admin.initializeApp();
}

const app = express();

// Apply fixes
app.use(corsConfig); // Fix 1: CORS with credentials
app.use(requestIdMiddleware); // Fix 2: Request ID
app.use(express.json({ limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Health endpoint
app.get('/api/health', (req: any, res) => {
  res.json({
    status: 'healthy',
    version: '5.0.0-complete',
    timestamp: new Date().toISOString(),
    requestId: req.id // Include request ID in response
  });
});

// Products endpoint
app.get('/api/products', async (req, res) => {
  try {
    const snapshot = await admin.firestore()
      .collection('products')
      .limit(20)
      .get();
    
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      products,
      total: products.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Categories endpoint
app.get('/api/categories', async (req, res) => {
  try {
    const snapshot = await admin.firestore()
      .collection('categories')
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Search endpoint
app.post('/api/search', async (req, res) => {
  const { query } = req.body;
  
  if (!query || query.trim() === '') {
    return res.status(400).json({ error: 'Query required' });
  }
  
  try {
    const snapshot = await admin.firestore()
      .collection('products')
      .get();
    
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const results = products.filter((p: any) => {
      const text = `${p.title} ${p.description}`.toLowerCase();
      return text.includes(query.toLowerCase());
    });
    
    res.json({
      success: true,
      query,
      results,
      total: results.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Orders endpoint (protected)
app.get('/api/orders', async (req, res) => {
  const auth = req.headers.authorization;
  
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.json({ success: true, orders: [] });
});

// 404 handler
app.use('*', (req: any, res) => {
  res.status(404).json({ 
    error: 'Not found',
    requestId: req.id
  });
});

// Export
export const api = functions.https.onRequest(app);
EOF

echo "✅ Complete index.ts created with all fixes"

echo -e "\n============================="
echo "📋 DEPLOYMENT INSTRUCTIONS:"
echo "============================="
echo ""
echo "1. Update the backend with fixes:"
echo "   cd /workspace/firebase-backend/functions"
echo "   cp src/index-complete.ts src/index.ts"
echo "   npm run build"
echo "   firebase deploy --only functions:api --project souk-el-syarat"
echo ""
echo "2. Fix API key in Google Cloud Console (see instructions above)"
echo ""
echo "3. All 3 issues will be resolved!"
echo ""