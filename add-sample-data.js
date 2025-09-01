/**
 * Script to add sample data to Firestore
 * This will help fix the 500 errors on products endpoint
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
console.log('🚀 Initializing Firebase Admin...');
admin.initializeApp({
  projectId: 'souk-el-syarat',
  databaseURL: 'https://souk-el-syarat-default-rtdb.firebaseio.com'
});

const db = admin.firestore();

async function addSampleData() {
  console.log('📦 Adding sample products...');
  
  // Sample products
  const products = [
    {
      title: 'Toyota Corolla 2022',
      description: 'Excellent condition, low mileage, one owner',
      price: 450000,
      category: 'sedan',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2022,
      condition: 'new',
      mileage: 15000,
      color: 'Silver',
      transmission: 'automatic',
      fuel: 'petrol',
      active: true,
      featured: true,
      images: [
        'https://example.com/toyota-corolla-1.jpg',
        'https://example.com/toyota-corolla-2.jpg'
      ],
      seller: {
        name: 'Ahmed Motors',
        phone: '+201234567890',
        location: 'Cairo'
      },
      viewCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      title: 'Honda Civic 2021',
      description: 'Perfect condition, full options',
      price: 420000,
      category: 'sedan',
      brand: 'Honda',
      model: 'Civic',
      year: 2021,
      condition: 'used',
      mileage: 35000,
      color: 'Black',
      transmission: 'automatic',
      fuel: 'petrol',
      active: true,
      featured: false,
      images: [
        'https://example.com/honda-civic-1.jpg'
      ],
      seller: {
        name: 'Premium Cars',
        phone: '+201234567891',
        location: 'Alexandria'
      },
      viewCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      title: 'BMW X5 2023',
      description: 'Luxury SUV, fully loaded',
      price: 1200000,
      category: 'suv',
      brand: 'BMW',
      model: 'X5',
      year: 2023,
      condition: 'new',
      mileage: 5000,
      color: 'White',
      transmission: 'automatic',
      fuel: 'diesel',
      active: true,
      featured: true,
      images: [
        'https://example.com/bmw-x5-1.jpg'
      ],
      seller: {
        name: 'Elite Motors',
        phone: '+201234567892',
        location: 'Cairo'
      },
      viewCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      title: 'Mercedes-Benz C200 2020',
      description: 'Executive sedan, pristine condition',
      price: 850000,
      category: 'sedan',
      brand: 'Mercedes-Benz',
      model: 'C200',
      year: 2020,
      condition: 'used',
      mileage: 45000,
      color: 'Gray',
      transmission: 'automatic',
      fuel: 'petrol',
      active: true,
      featured: false,
      images: [],
      seller: {
        name: 'Luxury Auto',
        phone: '+201234567893',
        location: 'Giza'
      },
      viewCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      title: 'Nissan Sunny 2019',
      description: 'Economic car, great for daily use',
      price: 250000,
      category: 'sedan',
      brand: 'Nissan',
      model: 'Sunny',
      year: 2019,
      condition: 'used',
      mileage: 80000,
      color: 'Blue',
      transmission: 'manual',
      fuel: 'petrol',
      active: true,
      featured: false,
      images: [],
      seller: {
        name: 'City Cars',
        phone: '+201234567894',
        location: 'Cairo'
      },
      viewCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
  ];

  // Add products
  for (const product of products) {
    try {
      const docRef = await db.collection('products').add(product);
      console.log(`✅ Added product: ${product.title} (ID: ${docRef.id})`);
    } catch (error) {
      console.error(`❌ Error adding product ${product.title}:`, error.message);
    }
  }

  console.log('\n📂 Adding sample categories...');
  
  // Sample categories
  const categories = [
    { name: 'Sedan', slug: 'sedan', icon: '🚗', order: 1, active: true },
    { name: 'SUV', slug: 'suv', icon: '🚙', order: 2, active: true },
    { name: 'Hatchback', slug: 'hatchback', icon: '🚗', order: 3, active: true },
    { name: 'Truck', slug: 'truck', icon: '🚚', order: 4, active: true },
    { name: 'Van', slug: 'van', icon: '🚐', order: 5, active: true },
    { name: 'Motorcycle', slug: 'motorcycle', icon: '🏍️', order: 6, active: true }
  ];

  // Add categories
  for (const category of categories) {
    try {
      const docRef = await db.collection('categories').add(category);
      console.log(`✅ Added category: ${category.name} (ID: ${docRef.id})`);
    } catch (error) {
      console.error(`❌ Error adding category ${category.name}:`, error.message);
    }
  }

  console.log('\n👤 Adding sample users...');
  
  // Sample user profiles (for existing auth users)
  const users = [
    {
      uid: 'sample_customer_1',
      email: 'customer1@example.com',
      displayName: 'محمد أحمد',
      role: 'customer',
      phoneNumber: '+201000000001',
      isActive: true,
      emailVerified: true,
      preferences: {
        language: 'ar',
        currency: 'EGP',
        notifications: {
          email: true,
          sms: false,
          push: true
        }
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      uid: 'sample_vendor_1',
      email: 'vendor1@example.com',
      displayName: 'Elite Motors',
      role: 'vendor',
      phoneNumber: '+201000000002',
      isActive: true,
      emailVerified: true,
      businessInfo: {
        name: 'Elite Motors Co.',
        registrationNumber: '123456789',
        address: 'Cairo, Egypt'
      },
      preferences: {
        language: 'en',
        currency: 'EGP',
        notifications: {
          email: true,
          sms: true,
          push: true
        }
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      uid: 'sample_admin_1',
      email: 'admin@souk-el-syarat.com',
      displayName: 'System Admin',
      role: 'admin',
      phoneNumber: '+201000000000',
      isActive: true,
      emailVerified: true,
      preferences: {
        language: 'ar',
        currency: 'EGP',
        notifications: {
          email: true,
          sms: true,
          push: true
        }
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
  ];

  // Add user profiles
  for (const user of users) {
    try {
      await db.collection('users').doc(user.uid).set(user);
      console.log(`✅ Added user profile: ${user.displayName} (${user.role})`);
    } catch (error) {
      console.error(`❌ Error adding user ${user.displayName}:`, error.message);
    }
  }

  console.log('\n✨ Sample data added successfully!');
  console.log('\n📊 Summary:');
  console.log(`  - ${products.length} products added`);
  console.log(`  - ${categories.length} categories added`);
  console.log(`  - ${users.length} user profiles added`);
  
  console.log('\n🧪 Test your API now:');
  console.log('  curl https://souk-el-sayarat-backend--souk-el-syarat.europe-west4.hosted.app/api/products');
  console.log('  curl https://souk-el-sayarat-backend--souk-el-syarat.europe-west4.hosted.app/api/categories');
}

// Run the script
addSampleData()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });