/**
 * DIRECT FIRESTORE SEEDER
 * Adds data directly to Firestore
 */

const admin = require('firebase-admin');

// Initialize with application default credentials
admin.initializeApp({
  projectId: 'souk-el-syarat',
  databaseURL: 'https://souk-el-syarat-default-rtdb.firebaseio.com'
});

const db = admin.firestore();
const auth = admin.auth();
const realtimeDb = admin.database();

async function seedDatabase() {
  console.log('🚀 URGENT: Adding real data to database...\n');

  try {
    // 1. CREATE CATEGORIES
    console.log('📂 Creating categories...');
    const categories = [
      { id: 'sedan', name: 'Sedan', nameAr: 'سيدان', icon: '🚗' },
      { id: 'suv', name: 'SUV', nameAr: 'دفع رباعي', icon: '🚙' },
      { id: 'hatchback', name: 'Hatchback', nameAr: 'هاتشباك', icon: '🚗' },
      { id: 'coupe', name: 'Coupe', nameAr: 'كوبيه', icon: '🏎️' },
      { id: 'electric', name: 'Electric', nameAr: 'كهربائية', icon: '⚡' },
      { id: 'van', name: 'Van', nameAr: 'فان', icon: '🚐' }
    ];

    for (const cat of categories) {
      await db.collection('categories').doc(cat.id).set(cat);
    }
    console.log(`✅ Created ${categories.length} categories`);

    // 2. CREATE PRODUCTS
    console.log('\n📦 Creating products...');
    const products = [
      {
        title: 'Toyota Camry 2023 - Like New',
        titleAr: 'تويوتا كامري 2023 - كالجديدة',
        description: 'Excellent condition, single owner, full service history, warranty valid',
        price: 950000,
        originalPrice: 1100000,
        discount: 13,
        category: 'sedan',
        brand: 'Toyota',
        model: 'Camry',
        year: 2023,
        mileage: 15000,
        condition: 'excellent',
        fuelType: 'petrol',
        transmission: 'automatic',
        color: 'Pearl White',
        features: ['Leather Seats', 'Sunroof', 'Navigation', 'Backup Camera'],
        image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800',
        images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800'],
        location: 'Cairo, Nasr City',
        vendorId: 'system',
        vendorName: 'Souk El-Syarat',
        isActive: true,
        isFeatured: true,
        views: 245,
        likes: 18,
        stock: 1,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        title: 'Honda Civic 2023 Sport',
        titleAr: 'هوندا سيفيك 2023 سبورت',
        description: 'Sport edition with turbo engine, low mileage, perfect for young professionals',
        price: 750000,
        originalPrice: 850000,
        discount: 12,
        category: 'sedan',
        brand: 'Honda',
        model: 'Civic',
        year: 2023,
        mileage: 8000,
        condition: 'excellent',
        fuelType: 'petrol',
        transmission: 'automatic',
        color: 'Sonic Gray',
        features: ['Sport Mode', 'Apple CarPlay', 'Android Auto', 'Lane Assist'],
        image: 'https://images.unsplash.com/photo-1606611013016-969c19ba1be3?w=800',
        images: ['https://images.unsplash.com/photo-1606611013016-969c19ba1be3?w=800'],
        location: 'Cairo, Heliopolis',
        vendorId: 'system',
        vendorName: 'Souk El-Syarat',
        isActive: true,
        isFeatured: true,
        views: 189,
        likes: 22,
        stock: 2,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        title: 'BMW X5 2023 M Sport',
        titleAr: 'بي إم دبليو X5 2023 إم سبورت',
        description: 'Premium SUV with M Sport package, 7 seats, perfect family car',
        price: 2950000,
        originalPrice: 3400000,
        discount: 13,
        category: 'suv',
        brand: 'BMW',
        model: 'X5',
        year: 2023,
        mileage: 12000,
        condition: 'excellent',
        fuelType: 'petrol',
        transmission: 'automatic',
        color: 'Alpine White',
        features: ['M Sport Package', '7 Seats', 'Panoramic Roof', 'Harman Kardon'],
        image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800',
        images: ['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800'],
        location: 'Cairo, Zamalek',
        vendorId: 'system',
        vendorName: 'Souk El-Syarat',
        isActive: true,
        isFeatured: true,
        views: 567,
        likes: 89,
        stock: 1,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        title: 'Mercedes-Benz C200 2022',
        titleAr: 'مرسيدس بنز C200 2022',
        description: 'Luxury sedan with AMG package, full options, pristine condition',
        price: 1850000,
        originalPrice: 2200000,
        discount: 16,
        category: 'sedan',
        brand: 'Mercedes-Benz',
        model: 'C200',
        year: 2022,
        mileage: 25000,
        condition: 'excellent',
        fuelType: 'petrol',
        transmission: 'automatic',
        color: 'Obsidian Black',
        features: ['AMG Package', 'Burmester Audio', 'Ambient Lighting', 'Digital Cockpit'],
        image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800',
        images: ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800'],
        location: 'Cairo, New Cairo',
        vendorId: 'system',
        vendorName: 'Souk El-Syarat',
        isActive: true,
        isFeatured: true,
        views: 412,
        likes: 45,
        stock: 1,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        title: 'Tesla Model 3 2023',
        titleAr: 'تسلا موديل 3 2023',
        description: 'Full self-driving capability, long range battery, zero emissions',
        price: 1950000,
        originalPrice: 2300000,
        discount: 15,
        category: 'electric',
        brand: 'Tesla',
        model: 'Model 3',
        year: 2023,
        mileage: 5000,
        condition: 'excellent',
        fuelType: 'electric',
        transmission: 'automatic',
        color: 'Pearl White',
        features: ['Autopilot', 'Full Self-Driving', 'Premium Interior', 'Glass Roof'],
        image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800',
        images: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800'],
        location: 'Cairo, 6th October',
        vendorId: 'system',
        vendorName: 'Souk El-Syarat',
        isActive: true,
        isFeatured: true,
        views: 892,
        likes: 156,
        stock: 1,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        title: 'Nissan Sunny 2022',
        titleAr: 'نيسان صني 2022',
        description: 'Economical and reliable, perfect first car or daily commuter',
        price: 380000,
        originalPrice: 420000,
        discount: 10,
        category: 'sedan',
        brand: 'Nissan',
        model: 'Sunny',
        year: 2022,
        mileage: 45000,
        condition: 'good',
        fuelType: 'petrol',
        transmission: 'automatic',
        color: 'Silver',
        features: ['Air Conditioning', 'Power Windows', 'Central Lock', 'ABS'],
        image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800',
        images: ['https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800'],
        location: 'Cairo, Shobra',
        vendorId: 'system',
        vendorName: 'Souk El-Syarat',
        isActive: true,
        isFeatured: false,
        views: 89,
        likes: 12,
        stock: 3,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        title: 'Volkswagen Golf GTI 2023',
        titleAr: 'فولكس فاجن جولف GTI 2023',
        description: 'Hot hatch icon, perfect balance of performance and practicality',
        price: 850000,
        originalPrice: 950000,
        discount: 11,
        category: 'hatchback',
        brand: 'Volkswagen',
        model: 'Golf GTI',
        year: 2023,
        mileage: 10000,
        condition: 'excellent',
        fuelType: 'petrol',
        transmission: 'automatic',
        color: 'Tornado Red',
        features: ['Sport Seats', 'Digital Cockpit', 'Ambient Lighting', 'Performance Monitor'],
        image: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800',
        images: ['https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800'],
        location: 'Cairo, Sheikh Zayed',
        vendorId: 'system',
        vendorName: 'Souk El-Syarat',
        isActive: true,
        isFeatured: false,
        views: 145,
        likes: 28,
        stock: 1,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        title: 'Toyota Land Cruiser 2022',
        titleAr: 'تويوتا لاند كروزر 2022',
        description: 'The ultimate off-road vehicle, V8 engine, ready for any adventure',
        price: 3200000,
        originalPrice: 3600000,
        discount: 11,
        category: 'suv',
        brand: 'Toyota',
        model: 'Land Cruiser',
        year: 2022,
        mileage: 35000,
        condition: 'very-good',
        fuelType: 'petrol',
        transmission: 'automatic',
        color: 'Desert Sand',
        features: ['4WD', 'Crawl Control', 'Multi-Terrain Monitor', 'Cooled Box'],
        image: 'https://images.unsplash.com/photo-1519641766711-708ef5a01e5d?w=800',
        images: ['https://images.unsplash.com/photo-1519641766711-708ef5a01e5d?w=800'],
        location: 'Cairo, Maadi',
        vendorId: 'system',
        vendorName: 'Souk El-Syarat',
        isActive: true,
        isFeatured: false,
        views: 234,
        likes: 34,
        stock: 1,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];

    const batch = db.batch();
    products.forEach(product => {
      const ref = db.collection('products').doc();
      batch.set(ref, product);
    });
    await batch.commit();
    console.log(`✅ Created ${products.length} products`);

    // 3. CREATE USERS
    console.log('\n👥 Creating test users...');
    const users = [
      {
        email: 'admin@soukelsyarat.com',
        password: 'Admin@123456',
        displayName: 'System Admin',
        role: 'admin'
      },
      {
        email: 'vendor@test.com',
        password: 'Vendor@123456',
        displayName: 'Test Vendor',
        role: 'vendor'
      },
      {
        email: 'customer@test.com',
        password: 'Customer@123456',
        displayName: 'Test Customer',
        role: 'customer'
      }
    ];

    for (const userData of users) {
      try {
        const userRecord = await auth.createUser({
          email: userData.email,
          password: userData.password,
          displayName: userData.displayName,
          emailVerified: true
        });

        await db.collection('users').doc(userRecord.uid).set({
          email: userData.email,
          displayName: userData.displayName,
          role: userData.role,
          isActive: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Created user: ${userData.email}`);
      } catch (error) {
        if (error.code === 'auth/email-already-exists') {
          console.log(`⚠️ User ${userData.email} already exists`);
        }
      }
    }

    // 4. ACTIVATE REAL-TIME
    console.log('\n🔄 Activating real-time features...');
    await realtimeDb.ref('stats').set({
      users: { total: 3, online: 0 },
      products: { total: products.length, active: products.length },
      orders: { total: 0, pending: 0 },
      lastUpdate: admin.database.ServerValue.TIMESTAMP
    });
    console.log('✅ Real-time database activated');

    console.log('\n' + '='.repeat(50));
    console.log('🎉 DATABASE POPULATED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('\n📝 Test Accounts:');
    console.log('Admin: admin@soukelsyarat.com / Admin@123456');
    console.log('Vendor: vendor@test.com / Vendor@123456');
    console.log('Customer: customer@test.com / Customer@123456');
    console.log('\n📦 Products: 8 cars added');
    console.log('📂 Categories: 6 created');
    console.log('🔄 Real-time: ACTIVATED');
    console.log('\n✅ Your database is now ready for testing!');

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit();
}

// Run immediately
seedDatabase();