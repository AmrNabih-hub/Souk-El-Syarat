/**
 * 🚨 EMERGENCY FIREBASE FUNCTIONS BACKEND
 * Simple, reliable backend using Firebase Functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// Initialize Firebase Admin
admin.initializeApp();

// Health check function
exports.health = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0-functions',
      uptime: process.uptime(),
      environment: 'production'
    });
  });
});

// Products API
exports.products = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const { category, limit = 20, offset = 0 } = req.query;
      
      let query = admin.firestore().collection('products').where('status', '==', 'active');
      
      if (category) {
        query = query.where('category', '==', category);
      }
      
      const snapshot = await query.limit(parseInt(limit)).offset(parseInt(offset)).get();
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      res.json({
        products,
        total: products.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('Products error:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });
});

// Vendors API
exports.vendors = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const { limit = 20, offset = 0 } = req.query;
      
      const snapshot = await admin.firestore().collection('vendors')
        .where('status', '==', 'active')
        .limit(parseInt(limit))
        .offset(parseInt(offset))
        .get();
      
      const vendors = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      res.json({
        vendors,
        total: vendors.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('Vendors error:', error);
      res.status(500).json({ error: 'Failed to fetch vendors' });
    }
  });
});

// Search API
exports.search = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const { q, type = 'all', limit = 20 } = req.query;
      
      if (!q) {
        return res.status(400).json({ error: 'Search query is required' });
      }
      
      // Simple search implementation
      const productsSnapshot = await admin.firestore().collection('products')
        .where('status', '==', 'active')
        .limit(parseInt(limit))
        .get();
      
      const products = productsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(product => 
          product.title?.toLowerCase().includes(q.toLowerCase()) ||
          product.description?.toLowerCase().includes(q.toLowerCase())
        );
      
      res.json({
        query: q,
        results: products,
        total: products.length,
        type
      });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  });
});

// User profile API
exports.profile = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }
      
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const userData = userDoc.data();
      res.json({
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role || 'customer',
        ...userData
      });
    } catch (error) {
      console.error('Profile error:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });
});

// Notifications API
exports.notifications = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }
      
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      const { limit = 20, offset = 0 } = req.query;
      
      const snapshot = await admin.firestore().collection('notifications')
        .where('userId', '==', decodedToken.uid)
        .orderBy('createdAt', 'desc')
        .limit(parseInt(limit))
        .offset(parseInt(offset))
        .get();
      
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      res.json({
        notifications,
        total: notifications.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('Notifications error:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });
});

// Mark notification as read
exports.markNotificationRead = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }
      
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      const { id } = req.params;
      
      await admin.firestore().collection('notifications').doc(id).update({
        read: true,
        readAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      console.error('Mark notification read error:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  });
});
