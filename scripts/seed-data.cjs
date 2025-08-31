/**
 * Seed Initial Data Script
 * Run this to populate the database with test data
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = {
  // Add your service account key here or use environment variables
  projectId: "souk-el-syarat",
};

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "souk-el-syarat",
  databaseURL: "https://souk-el-syarat-default-rtdb.firebaseio.com"
});

const db = admin.firestore();
const auth = admin.auth();
const realtimeDb = admin.database();

async function seedData() {
  console.log('🚀 Starting data seeding...');

  try {
    // 1. Create Admin Users
    console.log('Creating admin users...');
    
    const admin1 = await auth.createUser({
      email: 'admin@souk-elsyarat.com',
      password: 'Admin@123456',
      displayName: 'System Admin',
      emailVerified: true
    });

    await db.collection('users').doc(admin1.uid).set({
      email: admin1.email,
      displayName: admin1.displayName,
      role: 'admin',
      firstName: 'System',
      lastName: 'Admin',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const admin2 = await auth.createUser({
      email: 'chat@souk-elsyarat.com',
      password: 'Chat@123456',
      displayName: 'Chat Support',
      emailVerified: true
    });

    await db.collection('users').doc(admin2.uid).set({
      email: admin2.email,
      displayName: admin2.displayName,
      role: 'admin2',
      firstName: 'Chat',
      lastName: 'Support',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Admin users created');

    // 2. Create Test Vendors
    console.log('Creating test vendors...');
    
    const vendor1 = await auth.createUser({
      email: 'vendor1@test.com',
      password: 'Vendor@123456',
      displayName: 'Cairo Motors',
      emailVerified: true
    });

    await db.collection('users').doc(vendor1.uid).set({
      email: vendor1.email,
      displayName: vendor1.displayName,
      role: 'vendor',
      firstName: 'Cairo',
      lastName: 'Motors',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await db.collection('vendors').doc(vendor1.uid).set({
      userId: vendor1.uid,
      businessName: 'Cairo Motors',
      businessType: 'dealership',
      nationalId: '29901011234567',
      commercialRegister: 'CR123456',
      taxNumber: 'TAX789012',
      businessAddress: '123 Tahrir Square, Cairo',
      bankAccount: 'IBAN1234567890',
      subscriptionPlan: 'monthly',
      subscriptionStatus: 'active',
      subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
      isVerified: true,
      rating: 4.5,
      totalSales: 0,
      totalProducts: 0,
      joinedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Test vendors created');

    // 3. Create Test Products
    console.log('Creating test products...');
    
    const products = [
      {
        title: 'Toyota Camry 2023',
        description: 'Excellent condition, low mileage, first owner',
        category: 'sedan',
        brand: 'Toyota',
        model: 'Camry',
        year: 2023,
        price: 850000,
        mileage: 15000,
        condition: 'excellent',
        vendorId: vendor1.uid,
        vendorName: 'Cairo Motors',
        images: [
          'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800',
          'https://images.unsplash.com/photo-1619976215249-0b68cef412e6?w=800'
        ],
        features: ['Leather Seats', 'Sunroof', 'Navigation', 'Backup Camera'],
        location: 'Cairo',
        isActive: true,
        isFeatured: true,
        views: 0,
        likes: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        title: 'Honda Civic 2023',
        description: 'Like new, warranty included, great fuel economy',
        category: 'sedan',
        brand: 'Honda',
        model: 'Civic',
        year: 2023,
        price: 650000,
        mileage: 8000,
        condition: 'excellent',
        vendorId: vendor1.uid,
        vendorName: 'Cairo Motors',
        images: [
          'https://images.unsplash.com/photo-1606611013016-969c19ba1be3?w=800',
          'https://images.unsplash.com/photo-1606220838315-056192d5e927?w=800'
        ],
        features: ['Apple CarPlay', 'Android Auto', 'Lane Assist', 'Adaptive Cruise'],
        location: 'Cairo',
        isActive: true,
        isFeatured: true,
        views: 0,
        likes: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        title: 'BMW X5 2022',
        description: 'Luxury SUV, fully loaded, pristine condition',
        category: 'suv',
        brand: 'BMW',
        model: 'X5',
        year: 2022,
        price: 2500000,
        mileage: 25000,
        condition: 'excellent',
        vendorId: vendor1.uid,
        vendorName: 'Cairo Motors',
        images: [
          'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800',
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800'
        ],
        features: ['Panoramic Roof', 'Premium Sound', 'Heated Seats', 'Night Vision'],
        location: 'Cairo',
        isActive: true,
        isFeatured: false,
        views: 0,
        likes: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        title: 'Mercedes-Benz C-Class 2023',
        description: 'Executive sedan, AMG package, low mileage',
        category: 'sedan',
        brand: 'Mercedes-Benz',
        model: 'C-Class',
        year: 2023,
        price: 1800000,
        mileage: 5000,
        condition: 'excellent',
        vendorId: vendor1.uid,
        vendorName: 'Cairo Motors',
        images: [
          'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800',
          'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800'
        ],
        features: ['AMG Package', 'Burmester Audio', 'Ambient Lighting', 'Digital Cockpit'],
        location: 'Cairo',
        isActive: true,
        isFeatured: true,
        views: 0,
        likes: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        title: 'Nissan Sunny 2022',
        description: 'Budget friendly, great for city driving',
        category: 'sedan',
        brand: 'Nissan',
        model: 'Sunny',
        year: 2022,
        price: 380000,
        mileage: 30000,
        condition: 'good',
        vendorId: vendor1.uid,
        vendorName: 'Cairo Motors',
        images: [
          'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800'
        ],
        features: ['Air Conditioning', 'Power Windows', 'Central Lock', 'ABS'],
        location: 'Cairo',
        isActive: true,
        isFeatured: false,
        views: 0,
        likes: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];

    for (const product of products) {
      const productRef = await db.collection('products').add(product);
      console.log(`✅ Product added: ${product.title} (${productRef.id})`);
    }

    // 4. Update Real-time Database Stats
    console.log('Updating real-time stats...');
    
    await realtimeDb.ref('stats').set({
      users: {
        total: 3,
        byRole: {
          admin: 1,
          admin2: 1,
          vendor: 1,
          customer: 0
        }
      },
      products: {
        total: 5,
        byCategory: {
          sedan: 4,
          suv: 1
        }
      },
      orders: {
        total: 0
      },
      messages: {
        total: 0
      }
    });

    console.log('✅ Real-time stats updated');

    // 5. Create Sample Categories
    console.log('Creating categories...');
    
    const categories = [
      { id: 'sedan', name: 'Sedan', nameAr: 'سيدان', icon: '🚗' },
      { id: 'suv', name: 'SUV', nameAr: 'دفع رباعي', icon: '🚙' },
      { id: 'hatchback', name: 'Hatchback', nameAr: 'هاتشباك', icon: '🚗' },
      { id: 'coupe', name: 'Coupe', nameAr: 'كوبيه', icon: '🏎️' },
      { id: 'truck', name: 'Truck', nameAr: 'شاحنة', icon: '🚚' },
      { id: 'van', name: 'Van', nameAr: 'فان', icon: '🚐' }
    ];

    for (const category of categories) {
      await db.collection('categories').doc(category.id).set(category);
    }

    console.log('✅ Categories created');

    // 6. Create Sample Brands
    console.log('Creating brands...');
    
    const brands = [
      'Toyota', 'Honda', 'Nissan', 'BMW', 'Mercedes-Benz', 
      'Audi', 'Volkswagen', 'Ford', 'Chevrolet', 'Hyundai',
      'Kia', 'Mazda', 'Mitsubishi', 'Peugeot', 'Renault'
    ];

    for (const brand of brands) {
      await db.collection('brands').add({
        name: brand,
        isActive: true
      });
    }

    console.log('✅ Brands created');

    console.log('\n🎉 Data seeding completed successfully!');
    console.log('\n📝 Test Accounts:');
    console.log('Admin: admin@souk-elsyarat.com / Admin@123456');
    console.log('Chat Support: chat@souk-elsyarat.com / Chat@123456');
    console.log('Vendor: vendor1@test.com / Vendor@123456');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    process.exit();
  }
}

// Run the seeding
seedData();