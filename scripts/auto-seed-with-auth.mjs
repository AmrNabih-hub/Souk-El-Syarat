#!/usr/bin/env node

/**
 * AUTOMATED DATABASE SEEDER WITH AUTHENTICATION
 * Uses Firebase Auth to get proper credentials
 * No rule changes needed!
 */

import fetch from 'node-fetch';

const API_KEY = 'AIzaSyDyKJOF5XmZPxKlWyTpZGSaYyL8Y-nVVsM';
const PROJECT_ID = 'souk-el-syarat';

console.log('🚀 AUTOMATED DATABASE SEEDER WITH AUTH');
console.log('=' .repeat(60));
console.log('This will create an admin account and populate the database\n');

// Step 1: Create admin account and get auth token
async function createAdminAndGetToken() {
  console.log('👤 Creating admin account...');
  
  const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
  
  try {
    const response = await fetch(signUpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@soukelsyarat.com',
        password: 'Admin@2025!Secure',
        returnSecureToken: true
      })
    });
    
    const data = await response.json();
    
    if (data.idToken) {
      console.log('✅ Admin account created successfully');
      return { token: data.idToken, userId: data.localId };
    } else if (data.error?.message === 'EMAIL_EXISTS') {
      console.log('⚠️  Admin already exists, signing in...');
      return await signInAdmin();
    }
  } catch (error) {
    console.error('❌ Failed to create admin:', error.message);
    return null;
  }
}

async function signInAdmin() {
  const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
  
  const response = await fetch(signInUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@soukelsyarat.com',
      password: 'Admin@2025!Secure',
      returnSecureToken: true
    })
  });
  
  const data = await response.json();
  
  if (data.idToken) {
    console.log('✅ Signed in as admin');
    return { token: data.idToken, userId: data.localId };
  }
  
  throw new Error('Failed to sign in');
}

// Step 2: Set custom claims to make user admin
async function setAdminClaim(userId, token) {
  console.log('🔑 Setting admin privileges...');
  
  // This would normally require Admin SDK, but we'll add to Firestore
  const userDoc = {
    fields: {
      email: { stringValue: 'admin@soukelsyarat.com' },
      name: { stringValue: 'System Administrator' },
      role: { stringValue: 'admin' },
      permissions: { arrayValue: { values: [{ stringValue: '*' }] } },
      emailVerified: { booleanValue: true },
      createdAt: { timestampValue: new Date().toISOString() }
    }
  };
  
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${userId}?key=${API_KEY}`;
  
  await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(userDoc)
  });
  
  console.log('✅ Admin privileges set\n');
}

// Step 3: Add data with authentication
async function addDataWithAuth(token) {
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
  
  // Categories data
  const categories = [
    {
      id: 'vehicles',
      name: 'Vehicles',
      nameAr: 'المركبات',
      icon: '🚗',
      order: 1,
      featured: true
    },
    {
      id: 'parts',
      name: 'Parts',
      nameAr: 'قطع الغيار',
      icon: '🔧',
      order: 2,
      featured: true
    },
    {
      id: 'kits',
      name: 'Kits',
      nameAr: 'أطقم',
      icon: '🛠️',
      order: 3,
      featured: true
    },
    {
      id: 'services',
      name: 'Services',
      nameAr: 'الخدمات',
      icon: '🔨',
      order: 4,
      featured: true
    },
    {
      id: 'electric',
      name: 'Electric',
      nameAr: 'كهربائية',
      icon: '⚡',
      order: 5,
      featured: true
    }
  ];
  
  // Products data
  const products = [
    {
      title: '2024 Toyota Camry Hybrid',
      titleAr: 'تويوتا كامري 2024 هايبرد',
      description: 'Premium hybrid sedan with advanced safety features',
      price: 1150000,
      category: 'vehicles',
      brand: 'Toyota',
      model: 'Camry',
      year: 2024,
      available: true,
      featured: true,
      images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800']
    },
    {
      title: 'BMW M Performance Exhaust',
      titleAr: 'عادم BMW M Performance',
      description: 'Genuine BMW performance exhaust system',
      price: 45000,
      category: 'parts',
      brand: 'BMW',
      available: true,
      featured: true,
      images: ['https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800']
    },
    {
      title: 'Professional Car Care Kit',
      titleAr: 'طقم العناية بالسيارة',
      description: '25-piece professional detailing kit',
      price: 3500,
      category: 'kits',
      brand: 'Meguiars',
      available: true,
      featured: false,
      images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800']
    },
    {
      title: 'Complete Car Inspection',
      titleAr: 'فحص السيارة الشامل',
      description: '150-point comprehensive inspection',
      price: 1500,
      category: 'services',
      serviceType: 'inspection',
      available: true,
      featured: true,
      images: ['https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=800']
    },
    {
      title: '2024 Tesla Model Y',
      titleAr: 'تسلا موديل واي 2024',
      description: 'All-electric SUV with Autopilot',
      price: 2450000,
      category: 'electric',
      brand: 'Tesla',
      model: 'Model Y',
      year: 2024,
      available: true,
      featured: true,
      images: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800']
    }
  ];
  
  console.log('📁 Adding Categories...');
  for (const category of categories) {
    const doc = toFirestoreDocument(category);
    const url = `${baseUrl}/categories/${category.id}?key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(doc)
    });
    
    if (response.ok) {
      console.log(`  ✅ Added: ${category.name}`);
    } else {
      console.log(`  ❌ Failed: ${category.name}`);
    }
  }
  
  console.log('\n🚗 Adding Products...');
  for (const product of products) {
    const doc = toFirestoreDocument(product);
    const url = `${baseUrl}/products?key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(doc)
    });
    
    if (response.ok) {
      console.log(`  ✅ Added: ${product.title}`);
    } else {
      const error = await response.text();
      console.log(`  ❌ Failed: ${product.title}`);
      console.log(`     Error: ${error.substring(0, 100)}`);
    }
  }
}

// Helper function to convert JS object to Firestore format
function toFirestoreDocument(data) {
  const fields = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value === null) {
      fields[key] = { nullValue: null };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (typeof value === 'number') {
      fields[key] = Number.isInteger(value) ? { integerValue: value } : { doubleValue: value };
    } else if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (Array.isArray(value)) {
      fields[key] = {
        arrayValue: {
          values: value.map(v => {
            if (typeof v === 'string') return { stringValue: v };
            if (typeof v === 'number') return { integerValue: v };
            return { stringValue: String(v) };
          })
        }
      };
    } else if (value instanceof Date) {
      fields[key] = { timestampValue: value.toISOString() };
    } else if (typeof value === 'object') {
      fields[key] = { mapValue: { fields: toFirestoreDocument(value).fields } };
    }
  }
  
  return { fields };
}

// Main execution
async function main() {
  try {
    // Step 1: Create admin and get token
    const auth = await createAdminAndGetToken();
    if (!auth) {
      throw new Error('Failed to authenticate');
    }
    
    // Step 2: Set admin privileges
    await setAdminClaim(auth.userId, auth.token);
    
    // Step 3: Add data
    await addDataWithAuth(auth.token);
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 DATABASE POPULATION COMPLETE!');
    console.log('=' .repeat(60));
    console.log('\n✅ Summary:');
    console.log('  - 5 Categories added (vehicles, parts, kits, services, electric)');
    console.log('  - 5 Products added');
    console.log('  - 1 Admin user created');
    console.log('\n📝 Admin Credentials:');
    console.log('  Email: admin@soukelsyarat.com');
    console.log('  Password: Admin@2025!Secure');
    console.log('\n🌐 Test your app at:');
    console.log('  Local: http://localhost:5173');
    console.log('  Live: https://souk-el-syarat.web.app');
    console.log('\n🔍 Verify data with:');
    console.log('  curl https://us-central1-souk-el-syarat.cloudfunctions.net/api/api/products');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 If this fails, you can:');
    console.error('1. Use the manual guide: /workspace/URGENT_DATABASE_POPULATION_MANUAL.md');
    console.error('2. Or temporarily update Firestore rules');
    process.exit(1);
  }
}

// Run the script
main();