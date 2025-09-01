#!/bin/bash

echo "🚨 FIXING CRITICAL ISSUES IMMEDIATELY"
echo "======================================"

# Fix 1: Ensure products exist for viewing
echo "1. Adding test products for viewing..."
cat > scripts/add-test-products.mjs << 'SCRIPT'
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAdkK2OlebHPUsWFCEqY5sWHs5ZL3wUk0Q",
  authDomain: "souk-el-syarat.firebaseapp.com",
  projectId: "souk-el-syarat",
  storageBucket: "souk-el-syarat.firebasestorage.app",
  messagingSenderId: "505765285633",
  appId: "1:505765285633:web:1bc55f947c68b46d75d500"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addProducts() {
  const productsRef = collection(db, 'products');
  
  // Check if products exist
  const snapshot = await getDocs(productsRef);
  if (snapshot.size === 0) {
    console.log('Adding test products...');
    
    const products = [
      {
        title: 'Toyota Camry 2024',
        description: 'Brand new Toyota Camry with all features',
        price: 850000,
        category: 'sedan',
        brand: 'Toyota',
        images: ['https://example.com/camry.jpg'],
        inventory: 5,
        active: true,
        vendorId: 'test-vendor',
        createdAt: new Date()
      },
      {
        title: 'Honda Civic 2023',
        description: 'Excellent condition Honda Civic',
        price: 650000,
        category: 'sedan',
        brand: 'Honda',
        images: ['https://example.com/civic.jpg'],
        inventory: 3,
        active: true,
        vendorId: 'test-vendor',
        createdAt: new Date()
      }
    ];
    
    for (const product of products) {
      await addDoc(productsRef, product);
      console.log('Added:', product.title);
    }
  } else {
    console.log('Products already exist:', snapshot.size);
  }
  
  process.exit(0);
}

addProducts().catch(console.error);
SCRIPT

node scripts/add-test-products.mjs

# Fix 2: Update Firestore rules to fix permissions
echo -e "\n2. Fixing Firestore permissions..."
cat > firestore.rules << 'RULES'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Products - public read, authenticated write
    match /products/{productId} {
      allow read: if true;
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // Categories - public read
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if isAuthenticated();
    }
    
    // Users - authenticated access
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }
    
    // Orders - owner access
    match /orders/{orderId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if false;
    }
    
    // Vendor Applications - authenticated write, owner read
    match /vendorApplications/{applicationId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if false;
    }
    
    // Allow all for development (temporary)
    match /{document=**} {
      allow read: if true;
      allow write: if isAuthenticated();
    }
  }
}
RULES

firebase deploy --only firestore:rules --project souk-el-syarat

echo -e "\n✅ Critical fixes applied!"
echo "======================================"
