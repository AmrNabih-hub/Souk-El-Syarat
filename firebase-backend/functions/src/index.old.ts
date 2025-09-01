/**
 * CLEAN BACKEND IMPLEMENTATION
 * Professional, working API with all essential endpoints
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialize Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Souk El-Sayarat API',
    version: '2.0.0'
  });
});

// ============= CATEGORIES ENDPOINTS =============

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const categoriesSnapshot = await admin.firestore()
      .collection('categories')
      .orderBy('name')
      .get();
    
    const categories = categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      categories,
      total: categories.length
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch categories',
      message: error.message
    });
  }
});

// Create category (admin only)
app.post('/api/categories', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Check if user is admin
    const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    
    if (userData?.role !== 'admin' && userData?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const category = {
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await admin.firestore().collection('categories').add(category);
    
    res.json({
      success: true,
      id: docRef.id,
      category
    });
  } catch (error: any) {
    console.error('Error creating category:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create category',
      message: error.message
    });
  }
});

// ============= PRODUCTS ENDPOINTS =============

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search, limit = 20, offset = 0, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    let query: any = admin.firestore().collection('products');
    
    // Apply filters
    if (category) {
      query = query.where('category', '==', category);
    }
    
    if (minPrice) {
      query = query.where('price', '>=', Number(minPrice));
    }
    
    if (maxPrice) {
      query = query.where('price', '<=', Number(maxPrice));
    }
    
    // Get all products first
    const snapshot = await query.get();
    let products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Apply search filter
    if (search) {
      const searchTerm = String(search).toLowerCase();
      products = products.filter((product: any) => {
        const searchableText = `${product.title || ''} ${product.description || ''} ${product.brand || ''} ${product.category || ''}`.toLowerCase();
        return searchableText.includes(searchTerm);
      });
    }
    
    // Sort products
    if (sortBy && products.length > 0) {
      products.sort((a: any, b: any) => {
        const aVal = a[String(sortBy)];
        const bVal = b[String(sortBy)];
        
        if (aVal === undefined || bVal === undefined) return 0;
        
        if (order === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }
    
    // Apply pagination
    const startIndex = Number(offset);
    const endIndex = startIndex + Number(limit);
    const paginatedProducts = products.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      products: paginatedProducts,
      total: products.length,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch products',
      message: error.message
    });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const doc = await admin.firestore().collection('products').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({
      success: true,
      product: {
        id: doc.id,
        ...doc.data()
      }
    });
  } catch (error: any) {
    console.error('Error fetching product:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch product',
      message: error.message
    });
  }
});

// Create product
app.post('/api/products', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    const product = {
      ...req.body,
      vendorId: decodedToken.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      active: true,
      views: 0,
      likes: 0
    };
    
    const docRef = await admin.firestore().collection('products').add(product);
    
    res.json({
      success: true,
      id: docRef.id,
      product
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create product',
      message: error.message
    });
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Check if product exists and user owns it
    const doc = await admin.firestore().collection('products').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const productData = doc.data();
    if (productData?.vendorId !== decodedToken.uid) {
      return res.status(403).json({ error: 'Not authorized to update this product' });
    }
    
    const updates = {
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await admin.firestore().collection('products').doc(req.params.id).update(updates);
    
    res.json({
      success: true,
      message: 'Product updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update product',
      message: error.message
    });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Check if product exists and user owns it
    const doc = await admin.firestore().collection('products').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const productData = doc.data();
    if (productData?.vendorId !== decodedToken.uid) {
      return res.status(403).json({ error: 'Not authorized to delete this product' });
    }
    
    await admin.firestore().collection('products').doc(req.params.id).delete();
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete product',
      message: error.message
    });
  }
});

// ============= SEARCH ENDPOINT =============

app.post('/api/search', async (req, res) => {
  try {
    const { query: searchQuery, filters = {} } = req.body;
    
    if (!searchQuery) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    // Search in products
    const productsSnapshot = await admin.firestore().collection('products').get();
    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Filter products based on search query
    const searchTerm = searchQuery.toLowerCase();
    const searchResults = products.filter((product: any) => {
      const searchableText = `${product.title || ''} ${product.description || ''} ${product.brand || ''} ${product.category || ''}`.toLowerCase();
      return searchableText.includes(searchTerm);
    });
    
    // Apply additional filters
    let filteredResults = searchResults;
    
    if (filters.category) {
      filteredResults = filteredResults.filter((p: any) => p.category === filters.category);
    }
    
    if (filters.minPrice) {
      filteredResults = filteredResults.filter((p: any) => p.price >= filters.minPrice);
    }
    
    if (filters.maxPrice) {
      filteredResults = filteredResults.filter((p: any) => p.price <= filters.maxPrice);
    }
    
    res.json({
      success: true,
      results: filteredResults,
      total: filteredResults.length,
      query: searchQuery
    });
  } catch (error: any) {
    console.error('Search error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Search failed',
      message: error.message
    });
  }
});

// ============= USER ENDPOINTS =============

// Get user profile
app.get('/api/users/:id', async (req, res) => {
  try {
    const doc = await admin.firestore().collection('users').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = doc.data();
    // Remove sensitive data
    delete userData?.password;
    
    res.json({
      success: true,
      user: {
        id: doc.id,
        ...userData
      }
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch user',
      message: error.message
    });
  }
});

// ============= ORDERS ENDPOINTS =============

// Create order
app.post('/api/orders', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    const order = {
      ...req.body,
      userId: decodedToken.uid,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await admin.firestore().collection('orders').add(order);
    
    res.json({
      success: true,
      id: docRef.id,
      order
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create order',
      message: error.message
    });
  }
});

// Get user orders
app.get('/api/orders', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    const ordersSnapshot = await admin.firestore()
      .collection('orders')
      .where('userId', '==', decodedToken.uid)
      .orderBy('createdAt', 'desc')
      .get();
    
    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      orders,
      total: orders.length
    });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch orders',
      message: error.message
    });
  }
});

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Export the Express app as a Cloud Function
export const api = functions.https.onRequest(app);