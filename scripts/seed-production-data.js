/**
 * PRODUCTION DATA SEEDER
 * Adds real test data directly via API
 */

const axios = require('axios');

const API_BASE = 'https://us-central1-souk-el-syarat.cloudfunctions.net/api';

// Real test data
const testData = {
  users: [
    {
      email: 'admin@soukelsyarat.com',
      password: 'Admin@123456',
      firstName: 'System',
      lastName: 'Admin',
      phoneNumber: '+201000000001'
    },
    {
      email: 'vendor@cairmotors.com',
      password: 'Vendor@123456',
      firstName: 'Ahmed',
      lastName: 'Hassan',
      phoneNumber: '+201111111111'
    },
    {
      email: 'customer@gmail.com',
      password: 'Customer@123456',
      firstName: 'Mohamed',
      lastName: 'Ali',
      phoneNumber: '+201222222222'
    }
  ],
  
  products: [
    {
      title: 'Toyota Camry 2023 - Like New',
      description: 'Excellent condition, single owner, full service history',
      price: 950000,
      category: 'sedan',
      brand: 'Toyota',
      model: 'Camry',
      year: 2023,
      mileage: 15000,
      condition: 'excellent',
      image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800',
      images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800'],
      location: 'Cairo, Nasr City',
      vendorId: 'system',
      vendorName: 'Souk El-Syarat'
    },
    {
      title: 'Honda Civic 2023 Sport',
      description: 'Sport edition with turbo engine, low mileage',
      price: 750000,
      category: 'sedan',
      brand: 'Honda',
      model: 'Civic',
      year: 2023,
      mileage: 8000,
      condition: 'excellent',
      image: 'https://images.unsplash.com/photo-1606611013016-969c19ba1be3?w=800',
      images: ['https://images.unsplash.com/photo-1606611013016-969c19ba1be3?w=800'],
      location: 'Cairo, Heliopolis',
      vendorId: 'system',
      vendorName: 'Souk El-Syarat'
    },
    {
      title: 'BMW X5 2023 M Sport',
      description: 'Premium SUV with M Sport package, 7 seats',
      price: 2950000,
      category: 'suv',
      brand: 'BMW',
      model: 'X5',
      year: 2023,
      mileage: 12000,
      condition: 'excellent',
      image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800',
      images: ['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800'],
      location: 'Cairo, Zamalek',
      vendorId: 'system',
      vendorName: 'Souk El-Syarat'
    },
    {
      title: 'Mercedes-Benz C200 2022',
      description: 'Luxury sedan with AMG package, full options',
      price: 1850000,
      category: 'sedan',
      brand: 'Mercedes-Benz',
      model: 'C200',
      year: 2022,
      mileage: 25000,
      condition: 'excellent',
      image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800',
      images: ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800'],
      location: 'Cairo, New Cairo',
      vendorId: 'system',
      vendorName: 'Souk El-Syarat'
    },
    {
      title: 'Tesla Model 3 2023',
      description: 'Full self-driving capability, long range battery',
      price: 1950000,
      category: 'electric',
      brand: 'Tesla',
      model: 'Model 3',
      year: 2023,
      mileage: 5000,
      condition: 'excellent',
      image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800',
      images: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800'],
      location: 'Cairo, 6th October',
      vendorId: 'system',
      vendorName: 'Souk El-Syarat'
    }
  ]
};

async function seedData() {
  console.log('🌱 Starting data seeding...\n');

  // Test API health
  try {
    const health = await axios.get(`${API_BASE}/health`);
    console.log('✅ API is healthy:', health.data.message);
  } catch (error) {
    console.log('⚠️ API health check failed, continuing...');
  }

  // Register users
  console.log('\n👥 Creating users...');
  for (const user of testData.users) {
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, user);
      console.log(`✅ Created user: ${user.email}`);
    } catch (error) {
      console.log(`⚠️ User ${user.email} might already exist`);
    }
  }

  // Note: Products should be added via Firestore Console for now
  console.log('\n📦 Products need to be added via Firestore Console:');
  console.log('1. Go to: https://console.firebase.google.com/project/souk-el-syarat/firestore/data');
  console.log('2. Create "products" collection');
  console.log('3. Add the product data from this script');

  console.log('\n✅ Seeding process initiated!');
  console.log('\n📝 Test Accounts:');
  console.log('Admin: admin@soukelsyarat.com / Admin@123456');
  console.log('Vendor: vendor@cairmotors.com / Vendor@123456');
  console.log('Customer: customer@gmail.com / Customer@123456');
}

// Run seeder
seedData().catch(console.error);