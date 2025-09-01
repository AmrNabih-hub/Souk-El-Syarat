#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit
} from 'firebase/firestore';
import { 
  getDatabase, 
  ref, 
  set, 
  get,
  remove
} from 'firebase/database';
import fetch from 'node-fetch';

console.log('🧪 TESTING ALL WORKFLOWS');
console.log('========================\n');

// CORRECT Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAdkK2OlebHPUsWFCEqY5sWHs5ZL3wUk0Q",
  authDomain: "souk-el-syarat.firebaseapp.com",
  projectId: "souk-el-syarat",
  storageBucket: "souk-el-syarat.firebasestorage.app",
  messagingSenderId: "505765285633",
  appId: "1:505765285633:web:1bc55f947c68b46d75d500",
  measurementId: "G-46RKPHQLVB",
  databaseURL: "https://souk-el-syarat-default-rtdb.europe-west1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const realtimeDb = getDatabase(app);

let testResults = {
  passed: 0,
  failed: 0,
  workflows: []
};

async function testWorkflow(name, testFn) {
  process.stdout.write(`Testing ${name}... `);
  try {
    await testFn();
    console.log('✅ PASSED');
    testResults.passed++;
    testResults.workflows.push({ name, status: 'PASSED' });
    return true;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testResults.failed++;
    testResults.workflows.push({ name, status: 'FAILED', error: error.message });
    return false;
  }
}

async function runAllTests() {
  console.log('📋 WORKFLOW TESTS\n');
  
  // 1. Authentication Workflow
  console.log('1️⃣ AUTHENTICATION WORKFLOWS');
  console.log('----------------------------');
  
  let currentUser = null;
  
  await testWorkflow('Customer Login', async () => {
    const cred = await signInWithEmailAndPassword(
      auth,
      'customer@souk-elsayarat.com',
      'Customer@123456'
    );
    if (!cred.user) throw new Error('Login failed');
    currentUser = cred.user;
  });
  
  await testWorkflow('Check User Profile', async () => {
    if (!currentUser) throw new Error('No user logged in');
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (!userDoc.exists()) throw new Error('User profile not found');
    const data = userDoc.data();
    if (!data.email) throw new Error('User data incomplete');
  });
  
  await testWorkflow('Logout', async () => {
    await signOut(auth);
    if (auth.currentUser) throw new Error('Logout failed');
  });
  
  // 2. Product Workflows
  console.log('\n2️⃣ PRODUCT WORKFLOWS');
  console.log('--------------------');
  
  await testWorkflow('Browse Products', async () => {
    const snapshot = await getDocs(query(collection(db, 'products'), limit(10)));
    if (snapshot.empty) throw new Error('No products found');
    if (snapshot.size < 5) throw new Error(`Only ${snapshot.size} products available`);
  });
  
  await testWorkflow('View Product Details', async () => {
    const snapshot = await getDocs(query(collection(db, 'products'), limit(1)));
    if (snapshot.empty) throw new Error('No products to view');
    const product = snapshot.docs[0];
    const data = product.data();
    if (!data.title || !data.price) throw new Error('Product data incomplete');
  });
  
  await testWorkflow('Search Products', async () => {
    const response = await fetch('https://us-central1-souk-el-syarat.cloudfunctions.net/api/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'Toyota' })
    });
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error('Search failed');
  });
  
  // 3. Category Workflows
  console.log('\n3️⃣ CATEGORY WORKFLOWS');
  console.log('---------------------');
  
  await testWorkflow('View Categories', async () => {
    const snapshot = await getDocs(collection(db, 'categories'));
    if (snapshot.empty) throw new Error('No categories found');
    if (snapshot.size < 3) throw new Error(`Only ${snapshot.size} categories available`);
  });
  
  // 4. Cart Workflows (Simulated)
  console.log('\n4️⃣ CART WORKFLOWS');
  console.log('-----------------');
  
  await testWorkflow('Add to Cart (Simulated)', async () => {
    // Since cart is local storage based, we just verify the product exists
    const snapshot = await getDocs(query(collection(db, 'products'), limit(1)));
    if (snapshot.empty) throw new Error('No products to add to cart');
  });
  
  // 5. Vendor Workflows
  console.log('\n5️⃣ VENDOR WORKFLOWS');
  console.log('-------------------');
  
  await testWorkflow('Vendor Login', async () => {
    const cred = await signInWithEmailAndPassword(
      auth,
      'vendor@souk-elsayarat.com',
      'Vendor@123456'
    );
    if (!cred.user) throw new Error('Vendor login failed');
    currentUser = cred.user;
  });
  
  await testWorkflow('Check Vendor Profile', async () => {
    if (!currentUser) throw new Error('No vendor logged in');
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (!userDoc.exists()) throw new Error('Vendor profile not found');
    const data = userDoc.data();
    if (data.role !== 'vendor') throw new Error('User is not a vendor');
  });
  
  await signOut(auth);
  
  // 6. Admin Workflows
  console.log('\n6️⃣ ADMIN WORKFLOWS');
  console.log('------------------');
  
  await testWorkflow('Admin Login', async () => {
    const cred = await signInWithEmailAndPassword(
      auth,
      'admin@souk-elsayarat.com',
      'Admin@123456'
    );
    if (!cred.user) throw new Error('Admin login failed');
    currentUser = cred.user;
  });
  
  await testWorkflow('Check Admin Profile', async () => {
    if (!currentUser) throw new Error('No admin logged in');
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (!userDoc.exists()) throw new Error('Admin profile not found');
    const data = userDoc.data();
    if (data.role !== 'admin') throw new Error('User is not an admin');
  });
  
  await signOut(auth);
  
  // 7. API Workflows
  console.log('\n7️⃣ API WORKFLOWS');
  console.log('----------------');
  
  await testWorkflow('Health Check', async () => {
    const response = await fetch('https://us-central1-souk-el-syarat.cloudfunctions.net/api/api/health');
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const data = await response.json();
    if (data.status !== 'healthy') throw new Error('API unhealthy');
  });
  
  await testWorkflow('Products API', async () => {
    const response = await fetch('https://us-central1-souk-el-syarat.cloudfunctions.net/api/api/products');
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const data = await response.json();
    if (!data.success || !data.products) throw new Error('Products API failed');
  });
  
  // 8. Real-time Database Workflows
  console.log('\n8️⃣ REALTIME DATABASE WORKFLOWS');
  console.log('-------------------------------');
  
  await testWorkflow('Write to Realtime DB', async () => {
    const testRef = ref(realtimeDb, 'test/workflow');
    await set(testRef, {
      test: 'data',
      timestamp: Date.now()
    });
  });
  
  await testWorkflow('Read from Realtime DB', async () => {
    const testRef = ref(realtimeDb, 'test/workflow');
    const snapshot = await get(testRef);
    if (!snapshot.exists()) throw new Error('Data not found');
    if (snapshot.val().test !== 'data') throw new Error('Data mismatch');
  });
  
  await testWorkflow('Clean up Realtime DB', async () => {
    const testRef = ref(realtimeDb, 'test');
    await remove(testRef);
  });
  
  // Results Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED WORKFLOWS:');
    testResults.workflows
      .filter(w => w.status === 'FAILED')
      .forEach(w => console.log(`  - ${w.name}: ${w.error}`));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🎯 WORKFLOW STATUS');
  console.log('='.repeat(50));
  
  const criticalWorkflows = [
    'Customer Login',
    'Browse Products',
    'View Product Details',
    'View Categories',
    'Health Check'
  ];
  
  const criticalPassed = testResults.workflows
    .filter(w => criticalWorkflows.includes(w.name) && w.status === 'PASSED')
    .length;
  
  if (criticalPassed === criticalWorkflows.length) {
    console.log('✅ ALL CRITICAL WORKFLOWS WORKING');
    console.log('The application is functional for users!');
  } else {
    console.log('⚠️ SOME CRITICAL WORKFLOWS FAILING');
    console.log('The application needs fixes before use.');
  }
  
  console.log('\n' + '='.repeat(50));
  
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});