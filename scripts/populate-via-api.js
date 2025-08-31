#!/usr/bin/env node

/**
 * Populate database via API endpoints
 */

const API_URL = 'https://us-central1-souk-el-syarat.cloudfunctions.net/api/api';

// Test data
const testUsers = [
  { email: 'admin@souk.com', password: 'Admin@123456', role: 'admin' },
  { email: 'vendor1@souk.com', password: 'Vendor@123456', role: 'vendor' },
  { email: 'vendor2@souk.com', password: 'Vendor@123456', role: 'vendor' },
  { email: 'customer1@souk.com', password: 'Customer@123456', role: 'customer' },
  { email: 'customer2@souk.com', password: 'Customer@123456', role: 'customer' }
];

const testProducts = [
  {
    title: '2023 Toyota Corolla',
    description: 'Excellent condition, low mileage, one owner',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2023,
    category: 'sedan',
    price: 450000,
    inventory: 1,
    images: ['https://via.placeholder.com/400x300?text=Toyota+Corolla'],
    specifications: {
      mileage: 15000,
      fuelType: 'Gasoline',
      transmission: 'Automatic',
      color: 'Silver'
    }
  },
  {
    title: '2022 Nissan Qashqai',
    description: 'Family SUV, spacious and fuel efficient',
    brand: 'Nissan',
    model: 'Qashqai',
    year: 2022,
    category: 'suv',
    price: 580000,
    inventory: 2,
    images: ['https://via.placeholder.com/400x300?text=Nissan+Qashqai'],
    specifications: {
      mileage: 25000,
      fuelType: 'Gasoline',
      transmission: 'CVT',
      color: 'Blue'
    }
  },
  {
    title: '2021 Hyundai Elantra',
    description: 'Sporty sedan with modern features',
    brand: 'Hyundai',
    model: 'Elantra',
    year: 2021,
    category: 'sedan',
    price: 380000,
    inventory: 1,
    images: ['https://via.placeholder.com/400x300?text=Hyundai+Elantra'],
    specifications: {
      mileage: 35000,
      fuelType: 'Gasoline',
      transmission: 'Automatic',
      color: 'Black'
    }
  },
  {
    title: '2023 Kia Sportage',
    description: 'Premium SUV with advanced safety features',
    brand: 'Kia',
    model: 'Sportage',
    year: 2023,
    category: 'suv',
    price: 720000,
    inventory: 1,
    images: ['https://via.placeholder.com/400x300?text=Kia+Sportage'],
    specifications: {
      mileage: 8000,
      fuelType: 'Hybrid',
      transmission: 'Automatic',
      color: 'White'
    }
  },
  {
    title: '2020 Chevrolet Tahoe',
    description: 'Large SUV perfect for families',
    brand: 'Chevrolet',
    model: 'Tahoe',
    year: 2020,
    category: 'suv',
    price: 950000,
    inventory: 1,
    images: ['https://via.placeholder.com/400x300?text=Chevrolet+Tahoe'],
    specifications: {
      mileage: 45000,
      fuelType: 'Gasoline',
      transmission: 'Automatic',
      color: 'Gray'
    }
  }
];

async function createUsers() {
  console.log('📝 Creating users...\n');
  
  for (const user of testUsers) {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          password: user.password,
          role: user.role,
          profile: {
            displayName: user.email.split('@')[0],
            phoneNumber: '+201234567890'
          }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Created ${user.role}: ${user.email}`);
      } else {
        console.log(`⚠️ ${user.email}: ${data.error || 'Already exists'}`);
      }
    } catch (error) {
      console.log(`❌ Error creating ${user.email}: ${error.message}`);
    }
  }
}

async function createProducts() {
  console.log('\n📦 Creating products...\n');
  
  // First, we need to get vendor tokens
  const vendorTokens = [];
  
  for (const user of testUsers.filter(u => u.role === 'vendor')) {
    try {
      // For demo, we'll use a mock token
      console.log(`⚠️ Note: Products need authentication. Please add manually via Firebase Console.`);
      break;
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

async function testAPI() {
  console.log('🔍 Testing API endpoints...\n');
  
  try {
    // Test health endpoint
    const healthResponse = await fetch(`${API_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ API Health:', healthData);
    
    // Test products endpoint
    const productsResponse = await fetch(`${API_URL}/products`);
    const productsData = await productsResponse.json();
    console.log(`✅ Products endpoint: ${productsData.success ? 'Working' : 'Error'}`);
    
  } catch (error) {
    console.log(`❌ API Test Error: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Starting database population via API...\n');
  
  await testAPI();
  await createUsers();
  await createProducts();
  
  console.log('\n🎉 Population complete!');
  console.log('\n📝 Test Accounts:');
  console.log('Admin: admin@souk.com / Admin@123456');
  console.log('Vendor: vendor1@souk.com / Vendor@123456');
  console.log('Customer: customer1@souk.com / Customer@123456');
  
  console.log('\n⚠️ Note: To add products, please:');
  console.log('1. Go to Firebase Console');
  console.log('2. Navigate to Firestore Database');
  console.log('3. Add products manually to the "products" collection');
  console.log('   OR');
  console.log('4. Use the vendor dashboard after logging in as a vendor');
}

main();