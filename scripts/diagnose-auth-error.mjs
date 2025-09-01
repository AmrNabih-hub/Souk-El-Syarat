#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import fetch from 'node-fetch';

console.log('🔍 AUTHENTICATION DIAGNOSTICS');
console.log('==============================\n');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAdkK2OlebHPUsWFCEqY5sWHs5ZL3wUk0Q",
  authDomain: "souk-el-syarat.firebaseapp.com",
  projectId: "souk-el-syarat",
  storageBucket: "souk-el-syarat.firebasestorage.app",
  messagingSenderId: "505765285633",
  appId: "1:505765285633:web:1bc55f947c68b46d75d500"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testAuthEndpoint() {
  console.log('1️⃣ Testing Firebase Auth REST API directly...');
  
  try {
    // Test if API key is valid
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@test.com',
          password: 'test123',
          returnSecureToken: true
        })
      }
    );
    
    const data = await response.json();
    
    if (response.status === 400) {
      if (data.error?.message === 'API key not valid. Please pass a valid API key.') {
        console.log('❌ API Key is INVALID!');
        console.log('   The API key is not accepted by Firebase Auth');
        return false;
      } else if (data.error?.message === 'EMAIL_NOT_FOUND' || data.error?.message === 'INVALID_PASSWORD') {
        console.log('✅ API Key is VALID (auth endpoint responding)');
        return true;
      }
    }
    
    console.log('Response:', data);
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
    return false;
  }
}

async function testProjectConfig() {
  console.log('\n2️⃣ Testing Firebase Project Configuration...');
  
  try {
    const response = await fetch(
      `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=${firebaseConfig.apiKey}`
    );
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Project configuration retrieved');
      console.log('   Project ID:', data.projectId);
      console.log('   Authorized domains:', data.authorizedDomains?.join(', '));
      return true;
    } else {
      console.log('❌ Failed to get project config');
      console.log('   Error:', data.error?.message);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
    return false;
  }
}

async function testEmailAuth() {
  console.log('\n3️⃣ Testing Email/Password Authentication...');
  
  try {
    // Try to check if email exists
    const methods = await fetchSignInMethodsForEmail(auth, 'customer@souk-elsayarat.com');
    console.log('✅ Email check successful');
    console.log('   Sign-in methods for customer@souk-elsayarat.com:', methods.join(', ') || 'None');
    
    // Try actual sign in
    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        'customer@souk-elsayarat.com',
        'Customer@123456'
      );
      console.log('✅ Sign in successful!');
      console.log('   User ID:', cred.user.uid);
      await auth.signOut();
      return true;
    } catch (signInError) {
      console.log('⚠️ Sign in failed:', signInError.code, signInError.message);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Email auth error:', error.code, error.message);
    return false;
  }
}

async function checkGoogleProvider() {
  console.log('\n4️⃣ Checking Google Provider Configuration...');
  
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    
    console.log('✅ Google provider initialized');
    console.log('   Note: Popup sign-in can only be tested in browser');
    return true;
    
  } catch (error) {
    console.log('❌ Google provider error:', error.message);
    return false;
  }
}

async function runDiagnostics() {
  console.log('Starting diagnostics...\n');
  
  const results = {
    apiKey: await testAuthEndpoint(),
    projectConfig: await testProjectConfig(),
    emailAuth: await testEmailAuth(),
    googleProvider: await checkGoogleProvider()
  };
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 DIAGNOSTIC RESULTS');
  console.log('='.repeat(50));
  
  console.log(`API Key Valid: ${results.apiKey ? '✅' : '❌'}`);
  console.log(`Project Config: ${results.projectConfig ? '✅' : '❌'}`);
  console.log(`Email Auth: ${results.emailAuth ? '✅' : '❌'}`);
  console.log(`Google Provider: ${results.googleProvider ? '✅' : '❌'}`);
  
  console.log('\n' + '='.repeat(50));
  console.log('🔧 RECOMMENDED ACTIONS');
  console.log('='.repeat(50));
  
  if (!results.apiKey) {
    console.log('\n❌ CRITICAL: API Key is invalid!');
    console.log('Actions:');
    console.log('1. Go to Firebase Console > Project Settings');
    console.log('2. Under "Your apps" section, find your Web app');
    console.log('3. Copy the correct API key');
    console.log('4. Update all configuration files');
  }
  
  if (!results.projectConfig) {
    console.log('\n⚠️ Project configuration issue');
    console.log('Actions:');
    console.log('1. Verify project exists in Firebase Console');
    console.log('2. Check if billing is enabled (if required)');
    console.log('3. Ensure Authentication service is enabled');
  }
  
  if (!results.emailAuth) {
    console.log('\n⚠️ Email authentication not working');
    console.log('Actions:');
    console.log('1. Go to Firebase Console > Authentication > Sign-in method');
    console.log('2. Disable and re-enable Email/Password provider');
    console.log('3. Check if user accounts exist in Authentication > Users');
  }
  
  if (results.apiKey && results.projectConfig && results.emailAuth) {
    console.log('\n✅ Authentication system is properly configured!');
    console.log('The issue might be:');
    console.log('1. Browser cache - Clear cache and cookies');
    console.log('2. Service worker - Unregister old service workers');
    console.log('3. Local storage - Clear site data');
  }
  
  console.log('\n' + '='.repeat(50));
  
  process.exit(0);
}

// Run diagnostics
runDiagnostics().catch(error => {
  console.error('Diagnostic error:', error);
  process.exit(1);
});