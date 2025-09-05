/**
 * Security Testing Script
 * Tests all security implementations to ensure they work correctly
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getDatabase, ref, get, set } from 'firebase/database';

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const realtimeDb = getDatabase(app);

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(testName, passed, message) {
  testResults.tests.push({ testName, passed, message });
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}: ${message}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}: ${message}`);
  }
}

async function testFirestoreSecurityRules() {
  console.log('\n🔒 Testing Firestore Security Rules...');
  
  try {
    // Test 1: Unauthenticated access should be denied
    try {
      await getDoc(doc(db, 'users', 'test-user'));
      logTest('Firestore Unauthenticated Access', false, 'Should be denied but was allowed');
    } catch (error) {
      if (error.code === 'permission-denied') {
        logTest('Firestore Unauthenticated Access', true, 'Correctly denied');
      } else {
        logTest('Firestore Unauthenticated Access', false, `Unexpected error: ${error.message}`);
      }
    }

    // Test 2: Create test user and test authenticated access
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      const user = userCredential.user;
      
      // Create user document
      await setDoc(doc(db, 'users', user.uid), {
        email: testEmail,
        displayName: 'Test User',
        role: 'customer',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Test 3: User can read their own document
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          logTest('Firestore Own User Access', true, 'User can read their own document');
        } else {
          logTest('Firestore Own User Access', false, 'User document not found');
        }
      } catch (error) {
        logTest('Firestore Own User Access', false, `Error: ${error.message}`);
      }

      // Test 4: User cannot read other user's document
      try {
        await getDoc(doc(db, 'users', 'other-user-id'));
        logTest('Firestore Other User Access', false, 'Should be denied but was allowed');
      } catch (error) {
        if (error.code === 'permission-denied') {
          logTest('Firestore Other User Access', true, 'Correctly denied access to other user');
        } else {
          logTest('Firestore Other User Access', false, `Unexpected error: ${error.message}`);
        }
      }

      // Clean up
      await user.delete();
      
    } catch (error) {
      logTest('Firestore Test User Creation', false, `Error creating test user: ${error.message}`);
    }

  } catch (error) {
    logTest('Firestore Security Rules', false, `General error: ${error.message}`);
  }
}

async function testRealtimeDatabaseSecurityRules() {
  console.log('\n🔒 Testing Realtime Database Security Rules...');
  
  try {
    // Test 1: Unauthenticated access should be denied
    try {
      await get(ref(realtimeDb, 'test'));
      logTest('Realtime DB Unauthenticated Access', false, 'Should be denied but was allowed');
    } catch (error) {
      if (error.code === 'PERMISSION_DENIED') {
        logTest('Realtime DB Unauthenticated Access', true, 'Correctly denied');
      } else {
        logTest('Realtime DB Unauthenticated Access', false, `Unexpected error: ${error.message}`);
      }
    }

    // Test 2: Create test user and test authenticated access
    const testEmail = `test-rtdb-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      const user = userCredential.user;
      
      // Test 3: User can write to their own presence
      try {
        await set(ref(realtimeDb, `presence/${user.uid}`), {
          isOnline: true,
          lastSeen: new Date().toISOString()
        });
        logTest('Realtime DB Own Presence Access', true, 'User can write to their own presence');
      } catch (error) {
        logTest('Realtime DB Own Presence Access', false, `Error: ${error.message}`);
      }

      // Test 4: User cannot write to other user's presence
      try {
        await set(ref(realtimeDb, 'presence/other-user-id'), {
          isOnline: true,
          lastSeen: new Date().toISOString()
        });
        logTest('Realtime DB Other Presence Access', false, 'Should be denied but was allowed');
      } catch (error) {
        if (error.code === 'PERMISSION_DENIED') {
          logTest('Realtime DB Other Presence Access', true, 'Correctly denied access to other user presence');
        } else {
          logTest('Realtime DB Other Presence Access', false, `Unexpected error: ${error.message}`);
        }
      }

      // Clean up
      await user.delete();
      
    } catch (error) {
      logTest('Realtime DB Test User Creation', false, `Error creating test user: ${error.message}`);
    }

  } catch (error) {
    logTest('Realtime Database Security Rules', false, `General error: ${error.message}`);
  }
}

async function testAuthenticationSecurity() {
  console.log('\n🔒 Testing Authentication Security...');
  
  try {
    // Test 1: Weak password should be rejected
    const weakPassword = '123';
    const testEmail = `test-auth-${Date.now()}@example.com`;
    
    try {
      await createUserWithEmailAndPassword(auth, testEmail, weakPassword);
      logTest('Authentication Weak Password', false, 'Should be rejected but was allowed');
    } catch (error) {
      if (error.code === 'auth/weak-password') {
        logTest('Authentication Weak Password', true, 'Correctly rejected weak password');
      } else {
        logTest('Authentication Weak Password', false, `Unexpected error: ${error.message}`);
      }
    }

    // Test 2: Invalid email should be rejected
    const invalidEmail = 'invalid-email';
    const validPassword = 'ValidPassword123!';
    
    try {
      await createUserWithEmailAndPassword(auth, invalidEmail, validPassword);
      logTest('Authentication Invalid Email', false, 'Should be rejected but was allowed');
    } catch (error) {
      if (error.code === 'auth/invalid-email') {
        logTest('Authentication Invalid Email', true, 'Correctly rejected invalid email');
      } else {
        logTest('Authentication Invalid Email', false, `Unexpected error: ${error.message}`);
      }
    }

    // Test 3: Valid credentials should work
    const validEmail = `test-valid-${Date.now()}@example.com`;
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, validEmail, validPassword);
      logTest('Authentication Valid Credentials', true, 'Valid credentials accepted');
      
      // Clean up
      await userCredential.user.delete();
    } catch (error) {
      logTest('Authentication Valid Credentials', false, `Error: ${error.message}`);
    }

  } catch (error) {
    logTest('Authentication Security', false, `General error: ${error.message}`);
  }
}

async function runAllSecurityTests() {
  console.log('🚀 Starting Security Tests...\n');
  
  await testFirestoreSecurityRules();
  await testRealtimeDatabaseSecurityRules();
  await testAuthenticationSecurity();
  
  console.log('\n📊 Security Test Results:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All security tests passed! The app is secure.');
  } else {
    console.log('\n⚠️ Some security tests failed. Please review the issues above.');
  }
  
  return testResults;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllSecurityTests().catch(console.error);
}

export { runAllSecurityTests, testResults };