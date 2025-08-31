import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore';
import { getDatabase, ref, set, get } from 'firebase/database';

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

console.log('🔍 FINAL SERVICE VERIFICATION\n');
console.log('=====================================\n');

async function verify() {
  const results = [];

  // 1. Authentication
  console.log('1️⃣ AUTHENTICATION');
  try {
    const userCred = await signInWithEmailAndPassword(
      auth,
      'customer@souk-elsayarat.com',
      'Customer@123456'
    );
    console.log('✅ Working - User authenticated');
    results.push('✅ Authentication');
    await auth.signOut();
  } catch (error) {
    console.log('❌ Failed:', error.message);
    results.push('❌ Authentication');
  }

  // 2. Firestore (Public data)
  console.log('\n2️⃣ FIRESTORE DATABASE');
  try {
    const productsSnap = await getDocs(query(collection(db, 'products'), limit(5)));
    const categoriesSnap = await getDocs(collection(db, 'categories'));
    console.log(`✅ Working - ${productsSnap.size} products, ${categoriesSnap.size} categories`);
    results.push('✅ Firestore');
  } catch (error) {
    console.log('❌ Failed:', error.message);
    results.push('❌ Firestore');
  }

  // 3. Realtime Database
  console.log('\n3️⃣ REALTIME DATABASE');
  try {
    const testRef = ref(realtimeDb, 'test/verification');
    await set(testRef, {
      timestamp: Date.now(),
      status: 'active'
    });
    const snapshot = await get(testRef);
    if (snapshot.val()?.status === 'active') {
      console.log('✅ Working - Read/Write successful');
      results.push('✅ Realtime DB');
    } else {
      throw new Error('Read failed');
    }
  } catch (error) {
    console.log('❌ Failed:', error.message);
    results.push('❌ Realtime DB');
  }

  // 4. API Health
  console.log('\n4️⃣ BACKEND API');
  try {
    const response = await fetch('https://us-central1-souk-el-syarat.cloudfunctions.net/api/api/health');
    const data = await response.json();
    if (data.status === 'healthy') {
      console.log('✅ Working - API healthy');
      results.push('✅ Backend API');
    } else {
      throw new Error('Unhealthy');
    }
  } catch (error) {
    console.log('❌ Failed:', error.message);
    results.push('❌ Backend API');
  }

  // 5. Products API
  console.log('\n5️⃣ PRODUCTS ENDPOINT');
  try {
    const response = await fetch('https://us-central1-souk-el-syarat.cloudfunctions.net/api/api/products');
    const data = await response.json();
    if (data.success && data.products?.length > 0) {
      console.log(`✅ Working - ${data.products.length} products available`);
      results.push('✅ Products API');
    } else {
      throw new Error('No products');
    }
  } catch (error) {
    console.log('❌ Failed:', error.message);
    results.push('❌ Products API');
  }

  // Summary
  console.log('\n=====================================');
  console.log('📊 FINAL RESULTS');
  console.log('=====================================');
  
  results.forEach(r => console.log(r));
  
  const passed = results.filter(r => r.includes('✅')).length;
  const total = results.length;
  
  console.log(`\nScore: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 ALL SERVICES ARE WORKING PERFECTLY!');
    console.log('\n✅ CONFIRMED WORKING:');
    console.log('• Authentication with Firebase Auth');
    console.log('• Firestore database queries');
    console.log('• Realtime database read/write');
    console.log('• Backend API endpoints');
    console.log('• Products data available');
    
    console.log('\n👥 TEST ACCOUNTS:');
    console.log('• Admin: admin@souk-elsayarat.com / Admin@123456');
    console.log('• Vendor: vendor@souk-elsayarat.com / Vendor@123456');
    console.log('• Customer: customer@souk-elsayarat.com / Customer@123456');
    
    console.log('\n🔗 LIVE URL: https://souk-el-syarat.web.app');
  } else {
    console.log('\n⚠️ Some services need attention');
  }
  
  process.exit(passed === total ? 0 : 1);
}

verify().catch(console.error);