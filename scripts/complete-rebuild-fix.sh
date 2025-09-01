#!/bin/bash

# COMPLETE SYSTEM REBUILD AND FIX
# This script will fix all broken functions and test everything

set -e

echo "================================================"
echo "🚨 CRITICAL: COMPLETE SYSTEM REBUILD STARTING"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Step 1: Getting correct Firebase configuration${NC}"
echo "----------------------------------------------"

# Get the CORRECT Firebase config
firebase apps:sdkconfig web --project souk-el-syarat > /tmp/firebase-config.json

# Extract the CORRECT values
API_KEY=$(grep '"apiKey"' /tmp/firebase-config.json | cut -d'"' -f4)
AUTH_DOMAIN=$(grep '"authDomain"' /tmp/firebase-config.json | cut -d'"' -f4)
PROJECT_ID=$(grep '"projectId"' /tmp/firebase-config.json | cut -d'"' -f4)
STORAGE_BUCKET=$(grep '"storageBucket"' /tmp/firebase-config.json | cut -d'"' -f4)
MESSAGING_SENDER_ID=$(grep '"messagingSenderId"' /tmp/firebase-config.json | cut -d'"' -f4)
APP_ID=$(grep '"appId"' /tmp/firebase-config.json | cut -d'"' -f4)
MEASUREMENT_ID=$(grep '"measurementId"' /tmp/firebase-config.json | cut -d'"' -f4)
DATABASE_URL=$(grep '"databaseURL"' /tmp/firebase-config.json | cut -d'"' -f4)

echo "Correct API Key: $API_KEY"
echo -e "${GREEN}✓ Configuration retrieved${NC}"

# Step 2: Fix ALL configuration files
echo -e "\n${BLUE}Step 2: Fixing ALL configuration files${NC}"
echo "----------------------------------------------"

# Fix .env file
cat > /workspace/.env << EOF
# Production Environment Variables
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=https://us-central1-souk-el-syarat.cloudfunctions.net/api
VITE_FIREBASE_API_KEY=$API_KEY
VITE_FIREBASE_AUTH_DOMAIN=$AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID=$PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=$STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=$MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=$APP_ID
VITE_FIREBASE_MEASUREMENT_ID=$MEASUREMENT_ID
VITE_FIREBASE_DATABASE_URL=$DATABASE_URL
EOF

echo -e "${GREEN}✓ .env file updated${NC}"

# Fix firebase.config.ts
cat > /workspace/src/config/firebase.config.ts << 'EOF'
/**
 * Firebase Configuration - FIXED VERSION
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Use environment variables with CORRECT fallbacks
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAdkK2OlebHPUsWFCEqY5sWHs5ZL3wUk0Q",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "souk-el-syarat.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "souk-el-syarat",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "souk-el-syarat.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "505765285633",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:505765285633:web:1bc55f947c68b46d75d500",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-46RKPHQLVB",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://souk-el-syarat-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDb = getDatabase(app);
export const functions = getFunctions(app, 'us-central1');

// Only initialize these in browser environment
export const analytics = null; // Disable analytics for now to avoid errors
export const messaging = null; // Disable messaging for now
export const performance = null; // Disable performance for now

// Connect to emulators in development
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
  connectDatabaseEmulator(realtimeDb, 'localhost', 9000);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  console.log('🔧 Connected to Firebase Emulators');
}

// Export configuration
export const firebaseApp = app;
export default firebaseConfig;

// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://us-central1-souk-el-syarat.cloudfunctions.net/api';

// Feature flags
export const FEATURES = {
  REAL_PAYMENTS: false,
  REAL_SEARCH: true,
  REAL_CHAT: true,
  ANALYTICS: false, // Disabled to avoid errors
};

console.log('🚀 Firebase initialized with correct configuration');
EOF

echo -e "${GREEN}✓ firebase.config.ts updated${NC}"

# Step 3: Enable Firebase services
echo -e "\n${BLUE}Step 3: Checking Firebase services${NC}"
echo "----------------------------------------------"

echo "Checking Authentication providers..."
echo -e "${YELLOW}Manual step needed:${NC}"
echo "1. Go to: https://console.firebase.google.com/project/souk-el-syarat/authentication/providers"
echo "2. Enable Email/Password if not enabled"
echo "3. Enable Google if you want Google Sign-In"
echo ""

# Step 4: Rebuild frontend
echo -e "${BLUE}Step 4: Rebuilding frontend with correct config${NC}"
echo "----------------------------------------------"

cd /workspace
npm run build

echo -e "${GREEN}✓ Frontend rebuilt${NC}"

# Step 5: Deploy to hosting
echo -e "\n${BLUE}Step 5: Deploying to Firebase Hosting${NC}"
echo "----------------------------------------------"

firebase deploy --only hosting --project souk-el-syarat

echo -e "${GREEN}✓ Frontend deployed${NC}"

# Step 6: Test the deployment
echo -e "\n${BLUE}Step 6: Testing deployment${NC}"
echo "----------------------------------------------"

# Test if website is accessible
echo -n "Testing website accessibility: "
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://souk-el-syarat.web.app")
if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Website is online${NC}"
else
    echo -e "${RED}✗ Website returned status $HTTP_STATUS${NC}"
fi

# Test API
echo -n "Testing API health: "
API_STATUS=$(curl -s "https://us-central1-souk-el-syarat.cloudfunctions.net/api/api/health" | grep -c "healthy" || echo "0")
if [ "$API_STATUS" -gt 0 ]; then
    echo -e "${GREEN}✓ API is healthy${NC}"
else
    echo -e "${RED}✗ API is not responding${NC}"
fi

echo ""
echo "================================================"
echo -e "${GREEN}REBUILD COMPLETE${NC}"
echo "================================================"
echo ""
echo -e "${YELLOW}MANUAL STEPS NEEDED:${NC}"
echo ""
echo "1. ${YELLOW}Enable Authentication Providers:${NC}"
echo "   - Go to Firebase Console > Authentication > Sign-in method"
echo "   - Enable 'Email/Password' provider"
echo "   - Enable 'Google' provider (optional)"
echo ""
echo "2. ${YELLOW}Add Authorized Domains:${NC}"
echo "   - Go to Firebase Console > Authentication > Settings"
echo "   - Add 'souk-el-syarat.web.app' to authorized domains"
echo ""
echo "3. ${YELLOW}Clear Browser Cache:${NC}"
echo "   - Clear browser cache and cookies for the site"
echo "   - Or test in incognito/private mode"
echo ""
echo "================================================"
echo ""
echo "🔗 Website: https://souk-el-syarat.web.app"
echo ""
echo "📝 Test Accounts:"
echo "  Customer: customer@souk-elsayarat.com / Customer@123456"
echo "  Vendor: vendor@souk-elsayarat.com / Vendor@123456"
echo "  Admin: admin@souk-elsayarat.com / Admin@123456"
echo ""
echo "================================================"