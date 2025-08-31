#!/usr/bin/env node

const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'souk-el-syarat',
  databaseURL: 'https://souk-el-syarat-default-rtdb.firebaseio.com'
});

const db = admin.firestore();
const auth = admin.auth();
const realtimeDb = admin.database();

// Egyptian data
const egyptianCities = ['Cairo', 'Alexandria', 'Giza', 'Port Said', 'Luxor'];
const carBrands = ['Toyota', 'Nissan', 'Hyundai', 'Kia', 'Chevrolet'];
const carCategories = ['sedan', 'suv', 'hatchback', 'pickup', 'van'];

async function createTestData() {
  console.log('🚀 Creating test data...\n');
  
  try {
    // 1. Create test users
    console.log('Creating users...');
    const users = [];
    
    // Admin
    try {
      const admin1 = await auth.createUser({
        email: 'admin@test.com',
        password: 'Admin@123',
        displayName: 'Admin User',
        emailVerified: true
      });
      await auth.setCustomUserClaims(admin1.uid, { role: 'admin' });
      await db.collection('users').doc(admin1.uid).set({
        email: 'admin@test.com',
        displayName: 'Admin User',
        role: 'admin',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      users.push(admin1);
      console.log('✅ Created admin');
    } catch (e) {
      console.log('Admin exists');
    }
    
    // Vendors
    for (let i = 1; i <= 3; i++) {
      try {
        const vendor = await auth.createUser({
          email: `vendor${i}@test.com`,
          password: 'Test@123',
          displayName: `Vendor ${i}`,
          emailVerified: true
        });
        await auth.setCustomUserClaims(vendor.uid, { role: 'vendor' });
        await db.collection('users').doc(vendor.uid).set({
          email: `vendor${i}@test.com`,
          displayName: `Vendor ${i}`,
          role: 'vendor',
          vendorProfile: {
            companyName: `Car Dealer ${i}`,
            verified: true,
            rating: 4.5
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        users.push(vendor);
        console.log(`✅ Created vendor${i}`);
      } catch (e) {
        console.log(`Vendor${i} exists`);
      }
    }
    
    // Customers
    for (let i = 1; i <= 5; i++) {
      try {
        const customer = await auth.createUser({
          email: `customer${i}@test.com`,
          password: 'Test@123',
          displayName: `Customer ${i}`,
          emailVerified: false
        });
        await auth.setCustomUserClaims(customer.uid, { role: 'customer' });
        await db.collection('users').doc(customer.uid).set({
          email: `customer${i}@test.com`,
          displayName: `Customer ${i}`,
          role: 'customer',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        users.push(customer);
        console.log(`✅ Created customer${i}`);
      } catch (e) {
        console.log(`Customer${i} exists`);
      }
    }
    
    // 2. Create products
    console.log('\nCreating products...');
    const vendors = users.filter(u => u.customClaims?.role === 'vendor');
    const products = [];
    
    for (const vendor of vendors) {
      for (let i = 0; i < 5; i++) {
        const brand = carBrands[Math.floor(Math.random() * carBrands.length)];
        const product = {
          vendorId: vendor.uid,
          vendorName: vendor.displayName,
          title: `${2020 + i} ${brand} Model ${i + 1}`,
          description: 'Excellent condition car for sale',
          brand,
          year: 2020 + i,
          category: carCategories[Math.floor(Math.random() * carCategories.length)],
          price: 100000 + (i * 50000),
          currency: 'EGP',
          images: [`https://via.placeholder.com/400x300?text=${brand}`],
          specifications: {
            mileage: 10000 + (i * 5000),
            fuelType: 'Gasoline',
            transmission: 'Automatic',
            color: 'Black'
          },
          inventory: 1,
          views: 0,
          likes: 0,
          active: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await db.collection('products').add(product);
        products.push({ id: docRef.id, ...product });
        
        // Add to real-time inventory
        await realtimeDb.ref(`inventory/${docRef.id}`).set(1);
        
        console.log(`✅ Created product: ${product.title}`);
      }
    }
    
    // 3. Create sample orders
    console.log('\nCreating orders...');
    const customers = users.filter(u => u.customClaims?.role === 'customer');
    
    for (const customer of customers.slice(0, 2)) {
      const product = products[Math.floor(Math.random() * products.length)];
      const order = {
        customerId: customer.uid,
        customerName: customer.displayName,
        items: [{
          productId: product.id,
          productName: product.title,
          price: product.price,
          quantity: 1
        }],
        total: product.price,
        status: 'pending',
        paymentMethod: 'cod',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      const orderRef = await db.collection('orders').add(order);
      await realtimeDb.ref(`orders/${orderRef.id}`).set({
        status: 'pending',
        updatedAt: Date.now()
      });
      
      console.log(`✅ Created order for ${customer.displayName}`);
    }
    
    // 4. Create categories
    console.log('\nCreating categories...');
    for (const category of carCategories) {
      await db.collection('categories').doc(category).set({
        id: category,
        name: category.charAt(0).toUpperCase() + category.slice(1),
        count: products.filter(p => p.category === category).length
      });
      console.log(`✅ Created category: ${category}`);
    }
    
    // 5. Update statistics
    await realtimeDb.ref('statistics').set({
      totalUsers: users.length,
      totalProducts: products.length,
      totalOrders: 2,
      lastUpdated: Date.now()
    });
    
    console.log('\n🎉 Test data created successfully!');
    console.log('\n📝 Test Accounts:');
    console.log('Admin: admin@test.com / Admin@123');
    console.log('Vendor: vendor1@test.com / Test@123');
    console.log('Customer: customer1@test.com / Test@123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

createTestData();