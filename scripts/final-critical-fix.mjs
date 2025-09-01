#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

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
const auth = getAuth(app);

console.log('🔧 FIXING REMAINING CRITICAL ISSUES');
console.log('=====================================\n');

async function fixIssues() {
  // 1. Check why product details fail
  console.log('1. Checking products in database...');
  const productsRef = collection(db, 'products');
  const snapshot = await getDocs(productsRef);
  
  console.log(`   Found ${snapshot.size} products`);
  
  if (snapshot.size > 0) {
    const firstProduct = snapshot.docs[0];
    console.log(`   First product ID: ${firstProduct.id}`);
    console.log(`   First product data:`, firstProduct.data().title);
    
    // Test if we can fetch it directly
    const testDoc = await getDoc(doc(db, 'products', firstProduct.id));
    if (testDoc.exists()) {
      console.log('   ✅ Can fetch product by ID');
    } else {
      console.log('   ❌ Cannot fetch product by ID');
    }
  }
  
  // 2. Fix orders issue
  console.log('\n2. Testing orders access...');
  try {
    // Login as customer
    const cred = await signInWithEmailAndPassword(auth, 'customer@souk-elsayarat.com', 'Customer@123456');
    console.log('   ✅ Logged in as customer');
    
    // Check if user has any orders
    const ordersRef = collection(db, 'orders');
    const ordersSnapshot = await getDocs(ordersRef);
    console.log(`   Found ${ordersSnapshot.size} total orders`);
    
    // Create a test order if none exist
    if (ordersSnapshot.size === 0) {
      console.log('   Creating test order...');
      await addDoc(ordersRef, {
        userId: cred.user.uid,
        items: [{ productId: 'test', quantity: 1, price: 1000 }],
        total: 1000,
        status: 'pending',
        createdAt: new Date()
      });
      console.log('   ✅ Test order created');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
  
  // 3. Check vendorApplications collection
  console.log('\n3. Checking vendor applications...');
  try {
    const appsRef = collection(db, 'vendorApplications');
    const appsSnapshot = await getDocs(appsRef);
    console.log(`   Found ${appsSnapshot.size} vendor applications`);
  } catch (error) {
    console.log('   ❌ Cannot read vendor applications:', error.message);
  }
  
  console.log('\n=====================================');
  console.log('Diagnostics complete!');
}

fixIssues().then(() => process.exit(0)).catch(console.error);
