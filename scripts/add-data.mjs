import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAdkK2OlebHPUsWFCEqY5sWHs5ZL3wUk0Q",
  authDomain: "souk-el-syarat.firebaseapp.com",
  projectId: "souk-el-syarat",
  storageBucket: "souk-el-syarat.firebasestorage.app",
  messagingSenderId: "505765285633",
  appId: "1:505765285633:web:1bc55f947c68b46d75d500"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function populateData() {
  console.log('Starting data population...\n');
  
  try {
    // 1. Add Categories
    console.log('Adding categories...');
    const categories = [
      { id: 'sedan', name: 'Sedan', icon: '🚗', description: 'Comfortable family cars' },
      { id: 'suv', name: 'SUV', icon: '🚙', description: 'Sport Utility Vehicles' },
      { id: 'electric', name: 'Electric', icon: '⚡', description: 'Eco-friendly electric vehicles' },
      { id: 'luxury', name: 'Luxury', icon: '💎', description: 'Premium luxury vehicles' },
      { id: 'sports', name: 'Sports', icon: '🏎️', description: 'High-performance sports cars' }
    ];
    
    for (const cat of categories) {
      await setDoc(doc(db, 'categories', cat.id), {
        ...cat,
        productCount: 0,
        active: true,
        createdAt: serverTimestamp()
      });
      console.log(`  ✓ Added category: ${cat.name}`);
    }
    
    // 2. Add Products
    console.log('\nAdding products...');
    const products = [
      {
        title: '2024 Toyota Camry',
        description: 'Brand new Toyota Camry with advanced safety features and excellent fuel economy',
        brand: 'Toyota',
        model: 'Camry',
        year: 2024,
        category: 'sedan',
        price: 850000,
        originalPrice: 900000,
        currency: 'EGP',
        images: [
          'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800',
          'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800'
        ],
        specifications: {
          mileage: 0,
          fuelType: 'Hybrid',
          transmission: 'Automatic',
          color: 'Pearl White',
          engineSize: '2.5L',
          doors: 4,
          seats: 5
        },
        features: ['Adaptive Cruise Control', 'Lane Keeping Assist', 'Blind Spot Monitor', 'Wireless Charging'],
        condition: 'New',
        location: { city: 'Cairo', governorate: 'Cairo' },
        inventory: 3,
        vendorId: 'system',
        vendorName: 'Souk El-Sayarat',
        featured: true,
        active: true
      },
      {
        title: '2023 BMW X5',
        description: 'Luxury SUV with premium interior and powerful performance',
        brand: 'BMW',
        model: 'X5',
        year: 2023,
        category: 'suv',
        price: 2500000,
        originalPrice: 2800000,
        currency: 'EGP',
        images: [
          'https://images.unsplash.com/photo-1555215858-9dc80a29109d?w=800',
          'https://images.unsplash.com/photo-1606611013016-969c19ba29a0?w=800'
        ],
        specifications: {
          mileage: 15000,
          fuelType: 'Gasoline',
          transmission: 'Automatic',
          color: 'Black Sapphire',
          engineSize: '3.0L',
          doors: 5,
          seats: 7
        },
        features: ['Panoramic Roof', 'Harman Kardon Sound', 'Head-up Display', 'Night Vision'],
        condition: 'Like New',
        location: { city: 'Alexandria', governorate: 'Alexandria' },
        inventory: 1,
        vendorId: 'system',
        vendorName: 'Souk El-Sayarat',
        featured: true,
        active: true
      },
      {
        title: '2024 Tesla Model 3',
        description: 'Full electric sedan with autopilot and cutting-edge technology',
        brand: 'Tesla',
        model: 'Model 3',
        year: 2024,
        category: 'electric',
        price: 1800000,
        originalPrice: 1900000,
        currency: 'EGP',
        images: [
          'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800',
          'https://images.unsplash.com/photo-1571407921708-a7cc27900564?w=800'
        ],
        specifications: {
          mileage: 5000,
          fuelType: 'Electric',
          transmission: 'Automatic',
          color: 'Midnight Silver',
          range: '500km',
          doors: 4,
          seats: 5
        },
        features: ['Autopilot', 'Full Self-Driving', 'Premium Audio', 'Glass Roof'],
        condition: 'Excellent',
        location: { city: 'Giza', governorate: 'Giza' },
        inventory: 2,
        vendorId: 'system',
        vendorName: 'Souk El-Sayarat',
        featured: true,
        active: true
      },
      {
        title: '2023 Mercedes-Benz S-Class',
        description: 'Ultimate luxury sedan with unmatched comfort and technology',
        brand: 'Mercedes-Benz',
        model: 'S-Class',
        year: 2023,
        category: 'luxury',
        price: 4500000,
        originalPrice: 5000000,
        currency: 'EGP',
        images: [
          'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800',
          'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800'
        ],
        specifications: {
          mileage: 8000,
          fuelType: 'Gasoline',
          transmission: 'Automatic',
          color: 'Obsidian Black',
          engineSize: '3.0L',
          doors: 4,
          seats: 5
        },
        features: ['Massage Seats', 'Burmester 4D Sound', 'Rear Entertainment', 'Air Suspension'],
        condition: 'Like New',
        location: { city: 'Cairo', governorate: 'Cairo' },
        inventory: 1,
        vendorId: 'system',
        vendorName: 'Souk El-Sayarat',
        featured: true,
        active: true
      },
      {
        title: '2024 Porsche 911',
        description: 'Iconic sports car with thrilling performance and timeless design',
        brand: 'Porsche',
        model: '911 Carrera',
        year: 2024,
        category: 'sports',
        price: 6000000,
        originalPrice: 6500000,
        currency: 'EGP',
        images: [
          'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800',
          'https://images.unsplash.com/photo-1611859266238-8ecf5782de10?w=800'
        ],
        specifications: {
          mileage: 2000,
          fuelType: 'Gasoline',
          transmission: 'PDK',
          color: 'Guards Red',
          engineSize: '3.0L Twin-Turbo',
          doors: 2,
          seats: 4
        },
        features: ['Sport Chrono', 'PASM', 'Bose Sound', 'Sport Exhaust'],
        condition: 'New',
        location: { city: 'Cairo', governorate: 'Cairo' },
        inventory: 1,
        vendorId: 'system',
        vendorName: 'Souk El-Sayarat',
        featured: true,
        active: true
      }
    ];
    
    for (const product of products) {
      const docRef = await addDoc(collection(db, 'products'), {
        ...product,
        views: Math.floor(Math.random() * 1000),
        likes: Math.floor(Math.random() * 100),
        rating: (Math.random() * 2 + 3).toFixed(1),
        sold: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log(`  ✓ Added product: ${product.title}`);
    }
    
    // 3. Create admin user
    console.log('\nCreating admin user...');
    try {
      const adminCred = await createUserWithEmailAndPassword(
        auth,
        'admin@souk-elsayarat.com',
        'Admin@123456'
      );
      
      await setDoc(doc(db, 'users', adminCred.user.uid), {
        email: 'admin@souk-elsayarat.com',
        displayName: 'System Administrator',
        role: 'admin',
        phoneNumber: '+201234567890',
        emailVerified: true,
        active: true,
        createdAt: serverTimestamp()
      });
      console.log('  ✓ Admin user created: admin@souk-elsayarat.com');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('  ℹ Admin user already exists');
      } else {
        console.log('  ⚠ Could not create admin:', error.message);
      }
    }
    
    // 4. Create vendor user
    console.log('\nCreating vendor user...');
    try {
      const vendorCred = await createUserWithEmailAndPassword(
        auth,
        'vendor@souk-elsayarat.com',
        'Vendor@123456'
      );
      
      await setDoc(doc(db, 'users', vendorCred.user.uid), {
        email: 'vendor@souk-elsayarat.com',
        displayName: 'Premium Auto Dealer',
        role: 'vendor',
        phoneNumber: '+201234567891',
        vendorProfile: {
          companyName: 'Premium Auto Dealer',
          verified: true,
          rating: 4.8,
          totalSales: 150
        },
        emailVerified: true,
        active: true,
        createdAt: serverTimestamp()
      });
      console.log('  ✓ Vendor user created: vendor@souk-elsayarat.com');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('  ℹ Vendor user already exists');
      } else {
        console.log('  ⚠ Could not create vendor:', error.message);
      }
    }
    
    // 5. Create customer user
    console.log('\nCreating customer user...');
    try {
      const customerCred = await createUserWithEmailAndPassword(
        auth,
        'customer@souk-elsayarat.com',
        'Customer@123456'
      );
      
      await setDoc(doc(db, 'users', customerCred.user.uid), {
        email: 'customer@souk-elsayarat.com',
        displayName: 'John Smith',
        role: 'customer',
        phoneNumber: '+201234567892',
        preferences: {
          brands: ['Toyota', 'BMW'],
          categories: ['sedan', 'suv'],
          priceRange: { min: 500000, max: 2000000 }
        },
        emailVerified: false,
        active: true,
        createdAt: serverTimestamp()
      });
      console.log('  ✓ Customer user created: customer@souk-elsayarat.com');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('  ℹ Customer user already exists');
      } else {
        console.log('  ⚠ Could not create customer:', error.message);
      }
    }
    
    console.log('\n✅ Data population completed successfully!');
    console.log('\n📝 Test Accounts:');
    console.log('  Admin: admin@souk-elsayarat.com / Admin@123456');
    console.log('  Vendor: vendor@souk-elsayarat.com / Vendor@123456');
    console.log('  Customer: customer@souk-elsayarat.com / Customer@123456');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

populateData();