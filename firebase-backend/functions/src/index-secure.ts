import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';

if (!admin.apps.length) {
  admin.initializeApp();
}

const app = express();

// CRITICAL: Block malicious origins FIRST
app.use((req, res, next) => {
  const origin = req.headers.origin || req.headers.referer;
  
  const allowedOrigins = [
    'https://souk-el-syarat.web.app',
    'https://souk-el-syarat.firebaseapp.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174'
  ];
  
  // If origin exists and is not allowed, BLOCK IT
  if (origin) {
    const isAllowed = allowedOrigins.some(allowed => origin.startsWith(allowed));
    
    if (!isAllowed) {
      console.warn(`BLOCKED: Malicious origin ${origin}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Origin not allowed'
      });
    }
    
    // Set CORS for allowed origins
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  // Security headers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Request-ID', `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return res.status(204).end();
  }
  
  next();
});

app.use(express.json({ limit: '10mb' }));

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '7.0.0-secure',
    timestamp: new Date().toISOString()
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
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export const api = functions.https.onRequest(app);
