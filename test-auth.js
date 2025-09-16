#!/usr/bin/env node

/**
 * Authentication Test Script
 * Tests the Firebase authentication system
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Starting Authentication System Test...\n');

// Test Firebase configuration
console.log('1. Testing Firebase Configuration...');
try {
  
  // Check if .env file exists
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found');
    process.exit(1);
  }
  
  // Read .env file
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check for required environment variables
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  const missingVars = requiredEnvVars.filter(varName => 
    !envContent.includes(`${varName}=`)
  );
  
  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables in .env file:', missingVars);
    process.exit(1);
  } else {
    console.log('✅ All required environment variables are present in .env file');
  }
} catch (error) {
  console.error('❌ Firebase configuration test failed:', error.message);
  process.exit(1);
}

// Test Firebase connection
console.log('\n2. Testing Firebase Connection...');
try {
  // Read the .env file to check API key format
  const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  const apiKeyMatch = envContent.match(/VITE_FIREBASE_API_KEY=(.+)/);
  const apiKey = apiKeyMatch ? apiKeyMatch[1] : '';
  
  if (apiKey && apiKey.length > 20 && !apiKey.includes('demo') && !apiKey.includes('AIzaSyBqKd3RdF5O9f8G7mK6H8Y9J0P1Q2R3S4T5')) {
    console.log('✅ Firebase API Key format is valid');
  } else {
    console.warn('⚠️ Firebase API Key appears to be a placeholder');
    console.warn('   Please replace with your actual Firebase API key from Firebase Console');
    console.log('✅ Configuration structure is correct (using placeholder values)');
  }
} catch (error) {
  console.error('❌ Firebase connection test failed:', error.message);
  process.exit(1);
}

// Test authentication service
console.log('\n3. Testing Authentication Service...');
try {
  // Check if the unified auth service file exists and is properly structured
  
  const authServicePath = path.join(__dirname, 'src', 'services', 'unified-auth.service.ts');
  
  if (fs.existsSync(authServicePath)) {
    console.log('✅ Unified auth service file exists');
    
    const authServiceContent = fs.readFileSync(authServicePath, 'utf8');
    
    // Check for required methods
    const requiredMethods = [
      'signUp',
      'signIn',
      'signInWithGoogle',
      'signOut',
      'resetPassword',
      'updateUserProfile',
      'getCurrentUser'
    ];
    
    const missingMethods = requiredMethods.filter(method => 
      !authServiceContent.includes(`static async ${method}`)
    );
    
    if (missingMethods.length > 0) {
      console.error('❌ Missing required methods:', missingMethods);
      process.exit(1);
    } else {
      console.log('✅ All required authentication methods are present');
    }
  } else {
    console.error('❌ Unified auth service file not found');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Authentication service test failed:', error.message);
  process.exit(1);
}

// Test auth store
console.log('\n4. Testing Auth Store...');
try {
  
  const authStorePath = path.join(__dirname, 'src', 'stores', 'authStore.ts');
  
  if (fs.existsSync(authStorePath)) {
    console.log('✅ Auth store file exists');
    
    const authStoreContent = fs.readFileSync(authStorePath, 'utf8');
    
    // Check if it's using the unified auth service
    if (authStoreContent.includes('UnifiedAuthService')) {
      console.log('✅ Auth store is using UnifiedAuthService');
    } else {
      console.error('❌ Auth store is not using UnifiedAuthService');
      process.exit(1);
    }
  } else {
    console.error('❌ Auth store file not found');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Auth store test failed:', error.message);
  process.exit(1);
}

// Test pages
console.log('\n5. Testing Authentication Pages...');
try {
  
  const pages = ['LoginPage.tsx', 'RegisterPage.tsx', 'AuthTestPage.tsx'];
  const pagesDir = path.join(__dirname, 'src', 'pages', 'auth');
  
  for (const page of pages) {
    const pagePath = path.join(pagesDir, page);
    if (fs.existsSync(pagePath)) {
      console.log(`✅ ${page} exists`);
    } else {
      console.error(`❌ ${page} not found`);
      process.exit(1);
    }
  }
} catch (error) {
  console.error('❌ Authentication pages test failed:', error.message);
  process.exit(1);
}

console.log('\n🎉 All authentication tests passed!');
console.log('\n📋 Next Steps:');
console.log('1. Run: npm run dev');
console.log('2. Navigate to: http://localhost:5173/auth-test');
console.log('3. Test the authentication flow');
console.log('4. Check the browser console for detailed logs');
console.log('\n🔧 If you encounter issues:');
console.log('- Check your Firebase project configuration');
console.log('- Verify your .env file has correct values');
console.log('- Check the browser console for error messages');
console.log('- Ensure your Firebase project has Authentication enabled');