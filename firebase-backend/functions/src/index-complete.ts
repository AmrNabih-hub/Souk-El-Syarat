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
