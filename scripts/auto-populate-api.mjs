#!/usr/bin/env node

/**
 * AUTOMATED POPULATION VIA FIREBASE REST API
 * Uses direct API calls without service account
 */

import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_KEY = 'AIzaSyDyKJOF5XmZPxKlWyTpZGSaYyL8Y-nVVsM';
const PROJECT_ID = 'souk-el-syarat';
const API_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const AUTH_BASE = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
const RTDB_BASE = `https://souk-el-syarat-default-rtdb.firebaseio.com`;

console.log('🚀 AUTOMATED API POPULATION - NO SERVICE ACCOUNT NEEDED');
console.log('=' .repeat(60));
console.log('Starting automated operations via REST API...\n');

// Convert JS object to Firestore format
function toFirestoreValue(value) {
  if (value === null) return { nullValue: null };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: value } : { doubleValue: value };
  if (typeof value === 'string') return { stringValue: value };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(v => toFirestoreValue(v))
      }
    };
  }
  if (typeof value === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(value)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

function toFirestoreDocument(data) {
  const fields = {};
  for (const [key, value] of Object.entries(data)) {
    fields[key] = toFirestoreValue(value);
  }
  return { fields };
}

// Categories data
const CATEGORIES = [
  {
    id: 'sedan',
    name: 'Sedan',
    nameAr: 'سيدان',
    icon: '🚗',
    description: 'Comfortable and fuel-efficient sedans',
    seoScore: 95,
    priority: 1,
    isActive: true
  },
  {
    id: 'suv',
    name: 'SUV',
    nameAr: 'دفع رباعي',
    icon: '🚙',
    description: 'Spacious and powerful SUVs',
    seoScore: 92,
    priority: 2,
    isActive: true
  },
  {
    id: 'electric',
    name: 'Electric',
    nameAr: 'كهربائية',
    icon: '⚡',
    description: 'Eco-friendly electric vehicles',
    seoScore: 98,
    priority: 3,
    isActive: true
  }
];

// Products data
const PRODUCTS = [
  {
    title: 'Toyota Camry 2024 Hybrid Executive',
    titleAr: 'تويوتا كامري 2024 هايبرد',
    description: 'Premium hybrid sedan with advanced safety features',
    price: 1150000,
    originalPrice: 1350000,
    discount: 15,
    category: 'sedan',
    brand: 'Toyota',
    model: 'Camry',
    year: 2024,
    mileage: 5000,
    condition: 'like-new',
    fuelType: 'hybrid',
    transmission: 'cvt',
    color: 'Pearl White',
    features: ['Toyota Safety Sense 3.0', 'Head-Up Display', 'Panoramic Sunroof'],
    images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1600&q=95'],
    location: { city: 'Cairo', area: 'New Cairo' },
    vendor: { id: 'toyota_official', name: 'Toyota Egypt', rating: 4.9, verified: true },
    isActive: true,
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    title: 'BMW X5 xDrive40i M Sport 2024',
    titleAr: 'بي إم دبليو X5 2024',
    description: 'Luxury SUV with M Sport package',
    price: 3250000,
    originalPrice: 3750000,
    discount: 13,
    category: 'suv',
    brand: 'BMW',
    model: 'X5',
    year: 2024,
    mileage: 8000,
    condition: 'excellent',
    fuelType: 'petrol',
    transmission: 'automatic',
    color: 'Carbon Black',
    features: ['M Sport Package', 'BMW Live Cockpit', 'Harman Kardon Sound'],
    images: ['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1600&q=95'],
    location: { city: 'Cairo', area: 'Sheikh Zayed' },
    vendor: { id: 'bmw_egypt', name: 'BMW Egypt', rating: 4.8, verified: true },
    isActive: true,
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    title: 'Tesla Model Y Long Range 2024',
    titleAr: 'تسلا موديل واي 2024',
    description: 'All-electric SUV with Autopilot',
    price: 2450000,
    originalPrice: 2850000,
    discount: 14,
    category: 'electric',
    brand: 'Tesla',
    model: 'Model Y',
    year: 2024,
    mileage: 3000,
    condition: 'excellent',
    fuelType: 'electric',
    transmission: 'single-speed',
    color: 'Pearl White',
    features: ['Autopilot', 'Full Self-Driving', 'Premium Interior'],
    images: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1600&q=95'],
    location: { city: 'Cairo', area: '6th of October' },
    vendor: { id: 'tesla_cairo', name: 'Tesla Cairo', rating: 4.9, verified: true },
    isActive: true,
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Create admin user via REST API
async function createAdminUser() {
  console.log('👤 Creating Admin User via API...');
  
  try {
    const response = await fetch(AUTH_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@soukelsyarat.com',
        password: 'Admin@2025!',
        returnSecureToken: true
      })
    });
    
    const data = await response.json();
    
    if (data.idToken) {
      console.log('✅ Admin user created successfully');
      console.log('   Email: admin@soukelsyarat.com');
      console.log('   Password: Admin@2025!');
      
      // Store admin data in Firestore
      await fetch(`${API_BASE}/users?documentId=${data.localId}&key=${API_KEY}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.idToken}`
        },
        body: JSON.stringify(toFirestoreDocument({
          uid: data.localId,
          email: 'admin@soukelsyarat.com',
          displayName: 'System Administrator',
          role: 'super_admin',
          permissions: ['*'],
          createdAt: new Date().toISOString(),
          isActive: true,
          verified: true
        }))
      });
      
      return data.idToken;
    } else if (data.error?.message === 'EMAIL_EXISTS') {
      console.log('⚠️ Admin user already exists');
      // Try to sign in instead
      const signInResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@soukelsyarat.com',
          password: 'Admin@2025!',
          returnSecureToken: true
        })
      });
      const signInData = await signInResponse.json();
      return signInData.idToken;
    }
  } catch (error) {
    console.error('❌ Failed to create admin:', error.message);
    return null;
  }
  console.log('');
}

// Add categories via REST API
async function populateCategories(token) {
  console.log('📁 Adding Categories via API...');
  
  for (const category of CATEGORIES) {
    try {
      const response = await fetch(`${API_BASE}/categories?documentId=${category.id}&key=${API_KEY}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : undefined
        },
        body: JSON.stringify(toFirestoreDocument(category))
      });
      
      if (response.ok) {
        console.log(`✅ Added category: ${category.name}`);
      } else {
        const error = await response.text();
        console.log(`⚠️ Failed to add ${category.name}: ${error}`);
      }
    } catch (error) {
      console.error(`❌ Error adding ${category.name}:`, error.message);
    }
  }
  console.log('');
}

// Add products via REST API
async function populateProducts(token) {
  console.log('🚗 Adding Products via API...');
  
  for (const product of PRODUCTS) {
    try {
      const response = await fetch(`${API_BASE}/products?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : undefined
        },
        body: JSON.stringify(toFirestoreDocument(product))
      });
      
      if (response.ok) {
        console.log(`✅ Added product: ${product.title}`);
      } else {
        const error = await response.text();
        console.log(`⚠️ Failed to add ${product.title}: ${error}`);
      }
    } catch (error) {
      console.error(`❌ Error adding ${product.title}:`, error.message);
    }
  }
  console.log('');
}

// Activate Realtime Database
async function activateRealtimeDatabase() {
  console.log('🔄 Activating Realtime Database...');
  
  const initialData = {
    stats: {
      users: { total: 1, active: 1, new_today: 1 },
      products: { total: 3, active: 3, featured: 3 },
      orders: { total: 0, pending: 0, completed: 0 },
      revenue: { total: 0, today: 0, month: 0 }
    },
    presence: {},
    notifications: {},
    chat: { rooms: {}, messages: {} }
  };
  
  try {
    const response = await fetch(`${RTDB_BASE}/.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(initialData)
    });
    
    if (response.ok) {
      console.log('✅ Realtime Database activated');
    } else {
      console.log('⚠️ Failed to activate Realtime Database');
    }
  } catch (error) {
    console.error('❌ Error activating Realtime Database:', error.message);
  }
  console.log('');
}

// Main execution
async function main() {
  console.log('⚠️ NOTE: This script uses REST API without authentication.');
  console.log('Some operations may require Firebase Console access.\n');
  
  // Step 1: Create Admin User
  const token = await createAdminUser();
  
  // Step 2: Populate Categories
  await populateCategories(token);
  
  // Step 3: Populate Products
  await populateProducts(token);
  
  // Step 4: Activate Realtime Database
  await activateRealtimeDatabase();
  
  console.log('=' .repeat(60));
  console.log('📊 AUTOMATION SUMMARY');
  console.log('');
  console.log('✅ Completed:');
  console.log('   - Admin user creation attempted');
  console.log('   - Categories population attempted');
  console.log('   - Products population attempted');
  console.log('   - Realtime database activation attempted');
  console.log('');
  console.log('⚠️ Manual Steps Still Required:');
  console.log('   1. Go to Firebase Console');
  console.log('   2. Verify data in Firestore');
  console.log('   3. Enable Authentication providers if needed');
  console.log('   4. Check Realtime Database rules');
  console.log('');
  console.log('🔗 Firebase Console:');
  console.log('   https://console.firebase.google.com/project/souk-el-syarat');
  console.log('');
  console.log('🌐 Your App:');
  console.log('   https://souk-el-syarat.web.app');
  console.log('');
  console.log('=' .repeat(60));
}

// Install node-fetch if not available
import('node-fetch').catch(() => {
  console.log('Installing node-fetch...');
  require('child_process').execSync('npm install node-fetch', { stdio: 'inherit' });
  console.log('Please run the script again.');
  process.exit(0);
}).then(() => {
  main().catch(console.error);
});