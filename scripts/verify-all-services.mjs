import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getDatabase, ref, set, onValue } from 'firebase/database';

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

console.log('🔍 COMPREHENSIVE SERVICE VERIFICATION\n');
console.log('=====================================\n');

async function verifyServices() {
  let passed = 0;
  let failed = 0;

  // 1. Test Authentication
  console.log('1️⃣ AUTHENTICATION TEST');
  console.log('------------------------');
  try {
    const userCred = await signInWithEmailAndPassword(
      auth,
      'customer@souk-elsayarat.com',
      'Customer@123456'
    );
    console.log('✅ Authentication: WORKING');
    console.log(`   User ID: ${userCred.user.uid}`);
    console.log(`   Email: ${userCred.user.email}`);
    passed++;
    
    // Sign out for clean test
    await auth.signOut();
  } catch (error) {
    console.log('❌ Authentication: FAILED');
    console.log(`   Error: ${error.message}`);
    failed++;
  }

  // 2. Test Firestore Database
  console.log('\n2️⃣ FIRESTORE DATABASE TEST');
  console.log('---------------------------');
  try {
    const productsSnap = await getDocs(collection(db, 'products'));
    console.log('✅ Firestore: WORKING');
    console.log(`   Products found: ${productsSnap.size}`);
    
    const categoriesSnap = await getDocs(collection(db, 'categories'));
    console.log(`   Categories found: ${categoriesSnap.size}`);
    
    const usersSnap = await getDocs(collection(db, 'users'));
    console.log(`   Users found: ${usersSnap.size}`);
    passed++;
  } catch (error) {
    console.log('❌ Firestore: FAILED');
    console.log(`   Error: ${error.message}`);
    failed++;
  }

  // 3. Test Realtime Database
  console.log('\n3️⃣ REALTIME DATABASE TEST');
  console.log('--------------------------');
  try {
    // Write test data
    const testRef = ref(realtimeDb, 'test/verification');
    await set(testRef, {
      timestamp: Date.now(),
      message: 'Real-time test',
      status: 'active'
    });
    
    // Read test data
    await new Promise((resolve, reject) => {
      const unsubscribe = onValue(testRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.status === 'active') {
          console.log('✅ Realtime Database: WORKING');
          console.log(`   Write: SUCCESS`);
          console.log(`   Read: SUCCESS`);
          console.log(`   Real-time listeners: ACTIVE`);
          passed++;
          unsubscribe();
          resolve();
        } else {
          reject(new Error('Could not read data'));
        }
      }, reject);
      
      // Timeout after 5 seconds
      setTimeout(() => reject(new Error('Timeout')), 5000);
    });
  } catch (error) {
    console.log('❌ Realtime Database: FAILED');
    console.log(`   Error: ${error.message}`);
    failed++;
  }

  // 4. Test API Endpoints
  console.log('\n4️⃣ API ENDPOINTS TEST');
  console.log('----------------------');
  try {
    const response = await fetch('https://us-central1-souk-el-syarat.cloudfunctions.net/api/api/health');
    const data = await response.json();
    
    if (data.status === 'healthy') {
      console.log('✅ API Endpoints: WORKING');
      console.log(`   Health: ${data.status}`);
      console.log(`   Services: ${Object.keys(data.services).join(', ')}`);
      passed++;
    } else {
      throw new Error('API unhealthy');
    }
  } catch (error) {
    console.log('❌ API Endpoints: FAILED');
    console.log(`   Error: ${error.message}`);
    failed++;
  }

  // 5. Test Products API
  console.log('\n5️⃣ PRODUCTS API TEST');
  console.log('---------------------');
  try {
    const response = await fetch('https://us-central1-souk-el-syarat.cloudfunctions.net/api/api/products');
    const data = await response.json();
    
    if (data.success && data.products) {
      console.log('✅ Products API: WORKING');
      console.log(`   Products available: ${data.products.length}`);
      console.log(`   Sample: ${data.products[0]?.title || 'N/A'}`);
      passed++;
    } else {
      throw new Error('No products found');
    }
  } catch (error) {
    console.log('❌ Products API: FAILED');
    console.log(`   Error: ${error.message}`);
    failed++;
  }

  // Summary
  console.log('\n=====================================');
  console.log('📊 VERIFICATION SUMMARY');
  console.log('=====================================');
  console.log(`✅ Passed: ${passed}/5`);
  console.log(`❌ Failed: ${failed}/5`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL SERVICES ARE WORKING PERFECTLY!');
  } else {
    console.log('\n⚠️ Some services need attention');
  }
  
  console.log('\n📝 TEST ACCOUNTS:');
  console.log('Admin: admin@souk-elsayarat.com / Admin@123456');
  console.log('Vendor: vendor@souk-elsayarat.com / Vendor@123456');
  console.log('Customer: customer@souk-elsayarat.com / Customer@123456');
  
  console.log('\n🔗 LIVE URL: https://souk-el-syarat.web.app');
  
  process.exit(failed > 0 ? 1 : 0);
}

verifyServices().catch(console.error);