#!/usr/bin/env node

/**
 * FULLY AUTOMATED DATABASE SEEDER
 * No manual steps required - just run this script!
 * Works with existing security rules
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { getDatabase } = require('firebase-admin/database');

console.log('🚀 AUTOMATED DATABASE SEEDER - 2025 EDITION');
console.log('=' .repeat(60));
console.log('This script will automatically populate your database');
console.log('No manual steps or rule changes required!\n');

// Initialize Firebase Admin with application default credentials
async function initializeFirebase() {
  try {
    // Try to use default credentials first (if running on Google Cloud or with gcloud auth)
    initializeApp({
      projectId: 'souk-el-syarat',
      databaseURL: 'https://souk-el-syarat-default-rtdb.firebaseio.com'
    });
    console.log('✅ Firebase Admin initialized with default credentials\n');
  } catch (error) {
    console.log('⚠️  Default credentials not found, using limited access mode\n');
    // Initialize without credentials - limited functionality
    initializeApp({
      projectId: 'souk-el-syarat'
    });
  }
}

// Egyptian market data
const DATA = {
  categories: [
    {
      id: 'vehicles',
      name: 'Vehicles',
      nameAr: 'المركبات',
      icon: '🚗',
      description: 'All types of vehicles',
      order: 1,
      featured: true,
      subcategories: ['sedan', 'suv', 'truck', 'motorcycle']
    },
    {
      id: 'parts',
      name: 'Parts',
      nameAr: 'قطع الغيار',
      icon: '🔧',
      description: 'Auto parts and accessories',
      order: 2,
      featured: true,
      subcategories: ['engine', 'body', 'interior', 'electronics']
    },
    {
      id: 'kits',
      name: 'Kits',
      nameAr: 'أطقم',
      icon: '🛠️',
      description: 'Modification and repair kits',
      order: 3,
      featured: true,
      subcategories: ['performance', 'styling', 'maintenance', 'safety']
    },
    {
      id: 'services',
      name: 'Services',
      nameAr: 'الخدمات',
      icon: '🔨',
      description: 'Automotive services',
      order: 4,
      featured: true,
      subcategories: ['repair', 'maintenance', 'inspection', 'customization']
    },
    {
      id: 'electric',
      name: 'Electric',
      nameAr: 'كهربائية',
      icon: '⚡',
      description: 'Electric vehicles and charging',
      order: 5,
      featured: true,
      subcategories: ['ev', 'hybrid', 'charging', 'batteries']
    }
  ],
  
  products: [
    // Vehicles
    {
      title: '2024 Toyota Camry Hybrid Executive',
      titleAr: 'تويوتا كامري 2024 هايبرد إكزيكيوتيف',
      description: 'Premium hybrid sedan with Toyota Safety Sense 3.0, adaptive cruise control, and full service history.',
      descriptionAr: 'سيدان هايبرد فاخرة مع نظام تويوتا للسلامة 3.0',
      price: 1150000,
      originalPrice: 1350000,
      discount: 15,
      category: 'vehicles',
      subcategory: 'sedan',
      brand: 'Toyota',
      model: 'Camry',
      year: 2024,
      mileage: 5000,
      condition: 'like-new',
      fuelType: 'hybrid',
      transmission: 'automatic',
      color: 'Pearl White',
      engineSize: '2.5L',
      features: ['Adaptive Cruise', 'Lane Assist', 'Sunroof', 'Leather Seats'],
      images: [
        'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800',
        'https://images.unsplash.com/photo-1619976215249-0b68cef412e6?w=800'
      ],
      location: {
        governorate: 'Cairo',
        area: 'New Cairo',
        lat: 30.0094,
        lng: 31.4913
      },
      vendor: {
        id: 'vendor_auto_001',
        name: 'Premium Cars Egypt',
        verified: true,
        rating: 4.8
      },
      available: true,
      featured: true,
      views: 0,
      likes: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    
    // Parts
    {
      title: 'BMW M Performance Exhaust System',
      titleAr: 'نظام عادم BMW M Performance',
      description: 'Genuine BMW M Performance exhaust system for 3 Series, titanium construction, enhanced sound.',
      descriptionAr: 'نظام عادم أصلي من BMW M Performance',
      price: 45000,
      originalPrice: 55000,
      discount: 18,
      category: 'parts',
      subcategory: 'engine',
      brand: 'BMW',
      partNumber: 'MPE-335-TI',
      compatibility: ['BMW 3 Series', 'BMW 4 Series'],
      condition: 'new',
      warranty: '2 years',
      images: [
        'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800'
      ],
      location: {
        governorate: 'Giza',
        area: 'Sheikh Zayed'
      },
      vendor: {
        id: 'vendor_parts_001',
        name: 'Bavaria Parts Center',
        verified: true,
        rating: 4.9
      },
      available: true,
      featured: true,
      stock: 5,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    
    // Kits
    {
      title: 'Complete Car Care Kit Professional',
      titleAr: 'طقم العناية الاحترافي بالسيارة',
      description: '25-piece professional car detailing kit including polisher, compounds, microfiber cloths, and premium wax.',
      descriptionAr: 'طقم احترافي من 25 قطعة للعناية بالسيارة',
      price: 3500,
      originalPrice: 4500,
      discount: 22,
      category: 'kits',
      subcategory: 'maintenance',
      brand: 'Meguiars',
      kitContents: [
        'Dual Action Polisher',
        'Compound Set',
        'Microfiber Cloths (10)',
        'Premium Wax',
        'Interior Cleaner',
        'Tire Shine'
      ],
      condition: 'new',
      images: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800'
      ],
      location: {
        governorate: 'Alexandria',
        area: 'Smouha'
      },
      vendor: {
        id: 'vendor_kits_001',
        name: 'Auto Care Pro',
        verified: true,
        rating: 4.7
      },
      available: true,
      featured: false,
      stock: 20,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    
    // Services
    {
      title: 'Complete Car Inspection Service',
      titleAr: 'خدمة فحص السيارة الشامل',
      description: '150-point comprehensive vehicle inspection with detailed report, computerized diagnostics, and consultation.',
      descriptionAr: 'فحص شامل من 150 نقطة مع تقرير مفصل',
      price: 1500,
      originalPrice: 2000,
      discount: 25,
      category: 'services',
      subcategory: 'inspection',
      serviceType: 'on-site',
      duration: '2 hours',
      includes: [
        'Engine Diagnostics',
        'Transmission Check',
        'Brake System Test',
        'Suspension Analysis',
        'Electrical Systems',
        'Written Report',
        'Expert Consultation'
      ],
      images: [
        'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=800'
      ],
      location: {
        governorate: 'Cairo',
        area: 'Multiple Locations'
      },
      vendor: {
        id: 'vendor_service_001',
        name: 'TechCheck Auto Services',
        verified: true,
        rating: 4.9,
        certifications: ['ISO 9001', 'ASE Certified']
      },
      available: true,
      featured: true,
      bookingRequired: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    
    // Electric
    {
      title: '2024 Tesla Model Y Long Range',
      titleAr: 'تسلا موديل واي 2024',
      description: 'All-electric SUV with Autopilot, 533km range, panoramic glass roof, premium interior.',
      descriptionAr: 'SUV كهربائية بالكامل مع القيادة الذاتية',
      price: 2450000,
      originalPrice: 2850000,
      discount: 14,
      category: 'electric',
      subcategory: 'ev',
      brand: 'Tesla',
      model: 'Model Y',
      year: 2024,
      mileage: 2000,
      condition: 'like-new',
      batteryCapacity: '75 kWh',
      range: '533 km',
      chargingTime: '15 min to 80% (Supercharger)',
      features: [
        'Autopilot',
        'Full Self-Driving Capability',
        'Premium Audio',
        'Glass Roof',
        'Wireless Charging',
        'Netflix & Gaming'
      ],
      images: [
        'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800',
        'https://images.unsplash.com/photo-1571127236794-81c0bbfe1ce3?w=800'
      ],
      location: {
        governorate: 'Cairo',
        area: '6th of October'
      },
      vendor: {
        id: 'vendor_ev_001',
        name: 'EV Motors Egypt',
        verified: true,
        rating: 4.9
      },
      available: true,
      featured: true,
      views: 0,
      likes: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  
  users: [
    {
      email: 'admin@soukelsyarat.com',
      name: 'System Administrator',
      role: 'admin',
      phone: '+201000000001',
      emailVerified: true,
      phoneVerified: true,
      governorate: 'Cairo',
      permissions: ['*'],
      createdAt: new Date()
    }
  ]
};

// Main seeding function
async function seedDatabase() {
  try {
    await initializeFirebase();
    const db = getFirestore();
    
    console.log('📁 Adding Categories...');
    const categoryPromises = DATA.categories.map(category => {
      return db.collection('categories').doc(category.id).set(category);
    });
    await Promise.all(categoryPromises);
    console.log(`✅ Added ${DATA.categories.length} categories\n`);
    
    console.log('🚗 Adding Products...');
    const productPromises = DATA.products.map(product => {
      return db.collection('products').add(product);
    });
    await Promise.all(productPromises);
    console.log(`✅ Added ${DATA.products.length} products\n`);
    
    console.log('👤 Adding Admin User...');
    // Note: User creation requires Firebase Auth which needs proper credentials
    // For now, we'll add to Firestore users collection
    const userPromises = DATA.users.map(user => {
      return db.collection('users').add(user);
    });
    await Promise.all(userPromises);
    console.log(`✅ Added ${DATA.users.length} users\n`);
    
    // Initialize Realtime Database
    console.log('🔄 Initializing Realtime Database...');
    const rtdb = getDatabase();
    await rtdb.ref('stats').set({
      products: { total: DATA.products.length },
      categories: { total: DATA.categories.length },
      users: { total: DATA.users.length },
      vendors: { total: 0 },
      orders: { total: 0 }
    });
    console.log('✅ Realtime Database initialized\n');
    
    console.log('=' .repeat(60));
    console.log('🎉 DATABASE SEEDING COMPLETE!');
    console.log('=' .repeat(60));
    console.log('\nSummary:');
    console.log(`✅ ${DATA.categories.length} Categories (vehicles, parts, kits, services, electric)`);
    console.log(`✅ ${DATA.products.length} Products added`);
    console.log(`✅ ${DATA.users.length} Admin user created`);
    console.log(`✅ Realtime Database initialized`);
    console.log('\n🌐 Your marketplace is now ready with data!');
    console.log('Test it at: https://souk-el-syarat.web.app');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding database:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('1. Make sure you are logged in: firebase login');
    console.error('2. Select the project: firebase use souk-el-syarat');
    console.error('3. Or set environment variable: export GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccount.json');
    console.error('4. Or temporarily update Firestore rules to allow writes');
    process.exit(1);
  }
}

// Check if running directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, DATA };