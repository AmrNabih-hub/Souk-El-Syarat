/**
 * Simple Firebase Cloud Function for Souk El-Syarat
 * This is a minimal backend to get started
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Simple HTTP endpoint
export const api = functions
  .https.onRequest((request, response) => {
    // Enable CORS
    response.set('Access-Control-Allow-Origin', '*');
    response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight
    if (request.method === 'OPTIONS') {
      response.status(204).send('');
      return;
    }
    
    // Basic routing
    const path = request.path;
    
    if (path === '/' || path === '/health') {
      response.json({
        status: 'healthy',
        message: 'Souk El-Syarat Backend is running!',
        timestamp: new Date().toISOString(),
        project: 'souk-el-syarat',
        version: '1.0.0'
      });
    } else if (path === '/api/products') {
      // Mock products for now
      response.json({
        success: true,
        products: [
          {
            id: '1',
            title: 'Toyota Camry 2023',
            price: 850000,
            category: 'sedan',
            image: 'https://via.placeholder.com/300'
          },
          {
            id: '2', 
            title: 'Honda Civic 2023',
            price: 650000,
            category: 'sedan',
            image: 'https://via.placeholder.com/300'
          }
        ]
      });
    } else if (path === '/api/vendors') {
      // Mock vendors
      response.json({
        success: true,
        vendors: [
          {
            id: '1',
            name: 'Premium Auto',
            rating: 4.5,
            products: 25
          },
          {
            id: '2',
            name: 'Elite Motors',
            rating: 4.8,
            products: 18
          }
        ]
      });
    } else {
      response.status(404).json({
        error: 'Not Found',
        path: request.path
      });
    }
  });

// Simple Firestore trigger for new users
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const db = admin.firestore();
  
  // Create user profile
  await db.collection('users').doc(user.uid).set({
    email: user.email,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    role: 'customer',
    verified: false
  });
  
  console.log('User profile created for:', user.email);
});

console.log('Simple backend initialized');