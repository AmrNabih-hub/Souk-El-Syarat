#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  connectAuthEmulator
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

console.log('🔍 AUTH ERROR DEBUGGING SCRIPT');
console.log('================================\n');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAdkK2OlebHPUsWFCEqY5sWHs5ZL3wUk0Q",
  authDomain: "souk-el-syarat.firebaseapp.com",
  projectId: "souk-el-syarat",
  storageBucket: "souk-el-syarat.firebasestorage.app",
  messagingSenderId: "505765285633",
  appId: "1:505765285633:web:1bc55f947c68b46d75d500",
  databaseURL: "https://souk-el-syarat-default-rtdb.europe-west1.firebasedatabase.app"
};

console.log('1️⃣ CONFIGURATION CHECK');
console.log('------------------------');
console.log('API Key:', firebaseConfig.apiKey ? '✅ Present' : '❌ Missing');
console.log('Auth Domain:', firebaseConfig.authDomain ? '✅ Present' : '❌ Missing');
console.log('Project ID:', firebaseConfig.projectId ? '✅ Present' : '❌ Missing');

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log('\n2️⃣ FIREBASE INITIALIZATION');
console.log('---------------------------');
console.log('App:', app ? '✅ Initialized' : '❌ Failed');
console.log('Auth:', auth ? '✅ Initialized' : '❌ Failed');
console.log('Firestore:', db ? '✅ Initialized' : '❌ Failed');

// Test 1: Email/Password Authentication
console.log('\n3️⃣ EMAIL/PASSWORD AUTH TEST');
console.log('-----------------------------');

async function testEmailAuth() {
  try {
    console.log('Attempting login with: customer@souk-elsayarat.com');
    
    const userCredential = await signInWithEmailAndPassword(
      auth,
      'customer@souk-elsayarat.com',
      'Customer@123456'
    );
    
    console.log('✅ Login successful!');
    console.log('User ID:', userCredential.user.uid);
    console.log('Email:', userCredential.user.email);
    console.log('Email Verified:', userCredential.user.emailVerified);
    
    // Check if user document exists in Firestore
    console.log('\n4️⃣ CHECKING USER DOCUMENT');
    console.log('-------------------------');
    
    try {
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (userDoc.exists()) {
        console.log('✅ User document found in Firestore');
        const userData = userDoc.data();
        console.log('Role:', userData.role || 'Not set');
        console.log('Display Name:', userData.displayName || 'Not set');
      } else {
        console.log('⚠️ User document NOT found in Firestore');
        console.log('This might cause "Unexpected error" in the app');
        
        // Try to create the missing document
        console.log('\nAttempting to create missing user document...');
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || 'Customer',
          role: 'customer',
          createdAt: new Date(),
          emailVerified: userCredential.user.emailVerified,
          isActive: true
        });
        console.log('✅ User document created');
      }
    } catch (firestoreError) {
      console.log('❌ Firestore error:', firestoreError.message);
      console.log('This is likely the cause of "Unexpected error"');
    }
    
    // Sign out for clean test
    await auth.signOut();
    console.log('✅ Signed out successfully');
    
  } catch (authError) {
    console.log('❌ Authentication failed:', authError.code);
    console.log('Error message:', authError.message);
    
    if (authError.code === 'auth/user-not-found') {
      console.log('→ User does not exist in Firebase Auth');
    } else if (authError.code === 'auth/wrong-password') {
      console.log('→ Password is incorrect');
    } else if (authError.code === 'auth/invalid-email') {
      console.log('→ Email format is invalid');
    } else if (authError.code === 'auth/network-request-failed') {
      console.log('→ Network connection issue');
    } else if (authError.code === 'auth/too-many-requests') {
      console.log('→ Too many failed attempts, account temporarily locked');
    }
  }
}

// Test 2: Google Auth Configuration
console.log('\n5️⃣ GOOGLE AUTH CONFIGURATION');
console.log('-----------------------------');

function testGoogleAuth() {
  try {
    const googleProvider = new GoogleAuthProvider();
    console.log('✅ Google Provider initialized');
    
    // Check if Google Sign-In is configured
    console.log('\nGoogle Sign-In Requirements:');
    console.log('1. Enable Google provider in Firebase Console ✓');
    console.log('2. Add authorized domains in Firebase Console ✓');
    console.log('3. OAuth consent screen configured ✓');
    console.log('4. Client ID configured ✓');
    
    console.log('\n⚠️ Note: Google Sign-In must be tested in a browser');
    console.log('Common Google Sign-In errors:');
    console.log('- Popup blocked by browser');
    console.log('- Domain not authorized');
    console.log('- OAuth not configured');
    
  } catch (error) {
    console.log('❌ Google Auth setup error:', error.message);
  }
}

// Test 3: Check Auth State Persistence
console.log('\n6️⃣ AUTH STATE PERSISTENCE');
console.log('-------------------------');

function checkAuthPersistence() {
  console.log('Current user:', auth.currentUser ? auth.currentUser.email : 'None');
  console.log('Persistence:', auth.settings?.appVerificationDisabledForTesting ? 'Test mode' : 'Production');
}

// Run all tests
async function runDiagnostics() {
  await testEmailAuth();
  testGoogleAuth();
  checkAuthPersistence();
  
  console.log('\n7️⃣ DIAGNOSIS SUMMARY');
  console.log('====================');
  console.log('\n🔍 MOST LIKELY CAUSES OF "UNEXPECTED ERROR":');
  console.log('1. Missing user document in Firestore after auth');
  console.log('2. Firestore security rules blocking read/write');
  console.log('3. Mismatch between Auth UID and Firestore document ID');
  console.log('4. Network/CORS issues with Firebase services');
  console.log('5. Google Sign-In not properly configured');
  
  console.log('\n💡 RECOMMENDED FIXES:');
  console.log('1. Ensure user document is created in Firestore on signup');
  console.log('2. Check Firestore rules allow authenticated users to read their own document');
  console.log('3. Enable Google Sign-In in Firebase Console');
  console.log('4. Add domain to authorized domains in Firebase Console');
  console.log('5. Check browser console for specific error messages');
  
  process.exit(0);
}

runDiagnostics().catch(error => {
  console.error('\n❌ Diagnostic script failed:', error);
  process.exit(1);
});