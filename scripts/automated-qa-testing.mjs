#!/usr/bin/env node

/**
 * AUTOMATED QA TESTING SUITE
 * Professional testing for production deployment
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getDatabase, ref, set, get, remove } from 'firebase/database';
import fetch from 'node-fetch';
import chalk from 'chalk';

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const realtimeDb = getDatabase(app);

// Test results
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResults = [];

// Helper function for testing
async function runTest(name, testFn) {
  totalTests++;
  process.stdout.write(`Testing ${name}... `);
  
  try {
    await testFn();
    passedTests++;
    console.log(chalk.green('✓ PASSED'));
    testResults.push({ name, status: 'PASSED', error: null });
    return true;
  } catch (error) {
    failedTests++;
    console.log(chalk.red('✗ FAILED'));
    console.log(chalk.red(`  Error: ${error.message}`));
    testResults.push({ name, status: 'FAILED', error: error.message });
    return false;
  }
}

// Test Suite
async function runTestSuite() {
  console.log(chalk.blue('\n═══════════════════════════════════════'));
  console.log(chalk.blue('   AUTOMATED QA TESTING SUITE'));
  console.log(chalk.blue('═══════════════════════════════════════\n'));

  // 1. AUTHENTICATION TESTS
  console.log(chalk.yellow('\n📝 AUTHENTICATION TESTS'));
  console.log(chalk.gray('------------------------'));
  
  let currentUser = null;
  
  await runTest('User Login', async () => {
    const userCred = await signInWithEmailAndPassword(
      auth,
      'customer@souk-elsayarat.com',
      'Customer@123456'
    );
    if (!userCred.user) throw new Error('Login failed');
    currentUser = userCred.user;
  });
  
  await runTest('User Session', async () => {
    if (!auth.currentUser) throw new Error('No active session');
    if (auth.currentUser.uid !== currentUser.uid) throw new Error('Session mismatch');
  });
  
  await runTest('User Logout', async () => {
    await signOut(auth);
    if (auth.currentUser) throw new Error('Logout failed');
  });
  
  // Login again for further tests
  await signInWithEmailAndPassword(auth, 'customer@souk-elsayarat.com', 'Customer@123456');

  // 2. FIRESTORE DATABASE TESTS
  console.log(chalk.yellow('\n📝 FIRESTORE DATABASE TESTS'));
  console.log(chalk.gray('---------------------------'));
  
  await runTest('Read Products', async () => {
    const snapshot = await getDocs(collection(db, 'products'));
    if (snapshot.empty) throw new Error('No products found');
    if (snapshot.size < 5) throw new Error(`Only ${snapshot.size} products found`);
  });
  
  await runTest('Read Categories', async () => {
    const snapshot = await getDocs(collection(db, 'categories'));
    if (snapshot.empty) throw new Error('No categories found');
  });
  
  let testDocId = null;
  
  await runTest('Create Document', async () => {
    const docRef = await addDoc(collection(db, 'test_collection'), {
      name: 'QA Test',
      timestamp: new Date(),
      status: 'active'
    });
    if (!docRef.id) throw new Error('Document creation failed');
    testDocId = docRef.id;
  });
  
  await runTest('Read Document', async () => {
    const docSnap = await getDoc(doc(db, 'test_collection', testDocId));
    if (!docSnap.exists()) throw new Error('Document not found');
    if (docSnap.data().name !== 'QA Test') throw new Error('Data mismatch');
  });
  
  await runTest('Update Document', async () => {
    await updateDoc(doc(db, 'test_collection', testDocId), {
      status: 'updated',
      updatedAt: new Date()
    });
    const docSnap = await getDoc(doc(db, 'test_collection', testDocId));
    if (docSnap.data().status !== 'updated') throw new Error('Update failed');
  });
  
  await runTest('Delete Document', async () => {
    await deleteDoc(doc(db, 'test_collection', testDocId));
    const docSnap = await getDoc(doc(db, 'test_collection', testDocId));
    if (docSnap.exists()) throw new Error('Delete failed');
  });

  // 3. REALTIME DATABASE TESTS
  console.log(chalk.yellow('\n📝 REALTIME DATABASE TESTS'));
  console.log(chalk.gray('--------------------------'));
  
  await runTest('Write to Realtime DB', async () => {
    const testRef = ref(realtimeDb, 'qa_test/data');
    await set(testRef, {
      message: 'QA Test',
      timestamp: Date.now(),
      status: 'active'
    });
  });
  
  await runTest('Read from Realtime DB', async () => {
    const testRef = ref(realtimeDb, 'qa_test/data');
    const snapshot = await get(testRef);
    if (!snapshot.exists()) throw new Error('Data not found');
    if (snapshot.val().message !== 'QA Test') throw new Error('Data mismatch');
  });
  
  await runTest('Update Realtime DB', async () => {
    const testRef = ref(realtimeDb, 'qa_test/data');
    await set(testRef, {
      message: 'QA Test Updated',
      timestamp: Date.now(),
      status: 'updated'
    });
    const snapshot = await get(testRef);
    if (snapshot.val().status !== 'updated') throw new Error('Update failed');
  });
  
  await runTest('Delete from Realtime DB', async () => {
    const testRef = ref(realtimeDb, 'qa_test');
    await remove(testRef);
    const snapshot = await get(testRef);
    if (snapshot.exists()) throw new Error('Delete failed');
  });

  // 4. API ENDPOINT TESTS
  console.log(chalk.yellow('\n📝 API ENDPOINT TESTS'));
  console.log(chalk.gray('---------------------'));
  
  const API_BASE = 'https://us-central1-souk-el-syarat.cloudfunctions.net/api/api';
  
  await runTest('API Health Check', async () => {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const data = await response.json();
    if (data.status !== 'healthy') throw new Error('API unhealthy');
  });
  
  await runTest('Products API', async () => {
    const response = await fetch(`${API_BASE}/products`);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error('API returned error');
    if (!data.products || data.products.length === 0) throw new Error('No products');
  });
  
  await runTest('Search API', async () => {
    const response = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'Toyota' })
    });
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error('Search failed');
  });

  // 5. FRONTEND TESTS
  console.log(chalk.yellow('\n📝 FRONTEND TESTS'));
  console.log(chalk.gray('-----------------'));
  
  await runTest('Website Accessibility', async () => {
    const response = await fetch('https://souk-el-syarat.web.app');
    if (!response.ok) throw new Error(`Status: ${response.status}`);
  });
  
  await runTest('Manifest File', async () => {
    const response = await fetch('https://souk-el-syarat.web.app/manifest.webmanifest');
    if (!response.ok) throw new Error(`Status: ${response.status}`);
  });
  
  await runTest('Service Worker', async () => {
    const response = await fetch('https://souk-el-syarat.web.app/sw.js');
    if (!response.ok) throw new Error(`Status: ${response.status}`);
  });

  // 6. PERFORMANCE TESTS
  console.log(chalk.yellow('\n📝 PERFORMANCE TESTS'));
  console.log(chalk.gray('--------------------'));
  
  await runTest('API Response Time', async () => {
    const start = Date.now();
    await fetch(`${API_BASE}/health`);
    const duration = Date.now() - start;
    if (duration > 2000) throw new Error(`Slow response: ${duration}ms`);
  });
  
  await runTest('Database Query Speed', async () => {
    const start = Date.now();
    await getDocs(collection(db, 'products'));
    const duration = Date.now() - start;
    if (duration > 3000) throw new Error(`Slow query: ${duration}ms`);
  });

  // Cleanup
  await signOut(auth);

  // RESULTS SUMMARY
  console.log(chalk.blue('\n═══════════════════════════════════════'));
  console.log(chalk.blue('   TEST RESULTS SUMMARY'));
  console.log(chalk.blue('═══════════════════════════════════════\n'));
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(chalk.green(`Passed: ${passedTests}`));
  console.log(chalk.red(`Failed: ${failedTests}`));
  console.log(`Success Rate: ${((passedTests/totalTests)*100).toFixed(1)}%`);
  
  if (failedTests > 0) {
    console.log(chalk.red('\n❌ FAILED TESTS:'));
    testResults.filter(r => r.status === 'FAILED').forEach(r => {
      console.log(chalk.red(`  - ${r.name}: ${r.error}`));
    });
  }
  
  // QA VERDICT
  console.log(chalk.blue('\n═══════════════════════════════════════'));
  console.log(chalk.blue('   QA ENGINEER VERDICT'));
  console.log(chalk.blue('═══════════════════════════════════════\n'));
  
  if (failedTests === 0) {
    console.log(chalk.green('✅ PRODUCTION READY'));
    console.log(chalk.green('All tests passed. System is ready for production deployment.'));
    console.log('\n' + chalk.yellow('Recommendations:'));
    console.log('1. Monitor system performance in production');
    console.log('2. Set up error tracking (Sentry)');
    console.log('3. Enable analytics');
    console.log('4. Schedule regular backups');
  } else if (failedTests <= 2) {
    console.log(chalk.yellow('⚠️ CONDITIONALLY READY'));
    console.log(chalk.yellow('Minor issues detected. Fix before production deployment.'));
  } else {
    console.log(chalk.red('❌ NOT READY FOR PRODUCTION'));
    console.log(chalk.red('Critical issues detected. Major fixes required.'));
  }
  
  console.log(chalk.blue('\n═══════════════════════════════════════\n'));
  
  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run the test suite
runTestSuite().catch(error => {
  console.error(chalk.red('\n❌ Test suite failed to run:'), error);
  process.exit(1);
});