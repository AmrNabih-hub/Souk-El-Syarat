const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { dbManager } = require('../config/database');

let db, auth;

// Initialize database connections
async function initializeConnections() {
  const connections = await dbManager.initialize();
  db = connections.db;
  auth = connections.auth;
}

// Middleware for authentication
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const connections = await dbManager.initialize();
    const decodedToken = await connections.auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// User registration
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('displayName').optional().trim().isLength({ min: 2, max: 50 }),
  body('role').optional().isIn(['customer', 'dealer', 'admin'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const connections = await dbManager.initialize();
    const { email, password, displayName, role = 'customer' } = req.body;

    // Check if user already exists
    const existingUser = await connections.auth.getUserByEmail(email).catch(() => null);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user
    const userRecord = await connections.auth.createUser({
      email,
      password,
      displayName: displayName || email.split('@')[0],
      emailVerified: false
    });

    // Store user profile
    await connections.db.collection('users').doc(userRecord.uid).set({
      email,
      displayName: displayName || email.split('@')[0],
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      profileComplete: false,
      isActive: true,
      preferences: {
        notifications: true,
        newsletter: false
      }
    });

    res.json({
      success: true,
      userId: userRecord.uid,
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// User login (verify token)
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const connections = await dbManager.initialize();
    const decodedToken = await connections.auth.verifyIdToken(token);
    const userDoc = await connections.db.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json({
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        ...userDoc.data()
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const connections = await dbManager.initialize();
    const userDoc = await connections.db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, profile: userDoc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('displayName').optional().trim().isLength({ min: 2, max: 50 }),
  body('phoneNumber').optional().isMobilePhone(),
  body('location').optional().isLength({ min: 2, max: 100 })
], async (req, res) => {
  try {
    const connections = await dbManager.initialize();
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = {
      ...req.body,
      updatedAt: new Date(),
      profileComplete: true
    };

    await connections.db.collection('users').doc(req.user.uid).update(updates);

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize connections on module load
initializeConnections().catch(console.error);

module.exports = { router, authenticateToken };