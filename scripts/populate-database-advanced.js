#!/usr/bin/env node

/**
 * Advanced Database Population Script
 * 2025 Enterprise Standards
 * Direct Firestore Population with Real Egyptian Market Data
 */

const admin = require('firebase-admin');
const { faker } = require('@faker-js/faker');
const crypto = require('crypto');

// Initialize Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: "souk-el-syarat",
  // Note: In production, use environment variables or secure key management
};

console.log('🚀 ADVANCED DATABASE POPULATION - 2025 STANDARDS');
console.log('=' .repeat(60));
console.log('Starting at:', new Date().toISOString());
console.log('');

// Egyptian car market data
const EGYPTIAN_CARS = {
  brands: [
    { name: 'Toyota', arabic: 'تويوتا', models: ['Corolla', 'Camry', 'RAV4', 'Land Cruiser', 'Hilux'] },
    { name: 'Nissan', arabic: 'نيسان', models: ['Sunny', 'Sentra', 'Qashqai', 'X-Trail', 'Patrol'] },
    { name: 'Hyundai', arabic: 'هيونداي', models: ['Elantra', 'Tucson', 'Creta', 'Accent', 'Santa Fe'] },
    { name: 'Kia', arabic: 'كيا', models: ['Cerato', 'Sportage', 'Sorento', 'Rio', 'Picanto'] },
    { name: 'Mitsubishi', arabic: 'ميتسوبيشي', models: ['Lancer', 'Pajero', 'Eclipse Cross', 'Outlander', 'Attrage'] },
    { name: 'Mercedes-Benz', arabic: 'مرسيدس بنز', models: ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE'] },
    { name: 'BMW', arabic: 'بي إم دبليو', models: ['3 Series', '5 Series', '7 Series', 'X3', 'X5'] },
    { name: 'Volkswagen', arabic: 'فولكس فاجن', models: ['Golf', 'Passat', 'Tiguan', 'Touareg', 'Polo'] },
    { name: 'Peugeot', arabic: 'بيجو', models: ['208', '301', '308', '3008', '5008'] },
    { name: 'Renault', arabic: 'رينو', models: ['Logan', 'Duster', 'Megane', 'Kadjar', 'Captur'] },
    { name: 'Chevrolet', arabic: 'شيفروليه', models: ['Aveo', 'Cruze', 'Captiva', 'Tahoe', 'Silverado'] },
    { name: 'MG', arabic: 'إم جي', models: ['5', '6', 'ZS', 'RX5', 'HS'] },
    { name: 'Chery', arabic: 'شيري', models: ['Tiggo 2', 'Tiggo 4', 'Tiggo 7', 'Tiggo 8', 'Arrizo'] },
    { name: 'Geely', arabic: 'جيلي', models: ['Emgrand', 'Coolray', 'Azkarra', 'Okavango', 'Tugella'] },
    { name: 'BYD', arabic: 'بي واي دي', models: ['F3', 'Atto 3', 'Han', 'Tang', 'Song Plus'] }
  ],
  
  categories: [
    { id: 'sedan', name: 'Sedan', nameAr: 'سيدان' },
    { id: 'suv', name: 'SUV', nameAr: 'دفع رباعي' },
    { id: 'hatchback', name: 'Hatchback', nameAr: 'هاتشباك' },
    { id: 'pickup', name: 'Pickup', nameAr: 'بيك أب' },
    { id: 'van', name: 'Van', nameAr: 'فان' },
    { id: 'coupe', name: 'Coupe', nameAr: 'كوبيه' },
    { id: 'electric', name: 'Electric', nameAr: 'كهربائية' },
    { id: 'hybrid', name: 'Hybrid', nameAr: 'هايبرد' }
  ],
  
  colors: [
    { name: 'White', nameAr: 'أبيض', hex: '#FFFFFF' },
    { name: 'Black', nameAr: 'أسود', hex: '#000000' },
    { name: 'Silver', nameAr: 'فضي', hex: '#C0C0C0' },
    { name: 'Gray', nameAr: 'رمادي', hex: '#808080' },
    { name: 'Red', nameAr: 'أحمر', hex: '#FF0000' },
    { name: 'Blue', nameAr: 'أزرق', hex: '#0000FF' },
    { name: 'Navy', nameAr: 'كحلي', hex: '#000080' },
    { name: 'Gold', nameAr: 'ذهبي', hex: '#FFD700' },
    { name: 'Beige', nameAr: 'بيج', hex: '#F5F5DC' },
    { name: 'Brown', nameAr: 'بني', hex: '#A52A2A' }
  ],
  
  governorates: [
    'Cairo', 'Giza', 'Alexandria', 'Dakahlia', 'Red Sea', 'Beheira', 'Fayoum',
    'Gharbiya', 'Ismailia', 'Menofia', 'Minya', 'Qaliubiya', 'New Valley',
    'Suez', 'Aswan', 'Assiut', 'Beni Suef', 'Port Said', 'Damietta', 'Sharkia',
    'South Sinai', 'Kafr El Sheikh', 'Matrouh', 'Luxor', 'Qena', 'North Sinai', 'Sohag'
  ]
};

// Generate realistic Egyptian phone numbers
function generateEgyptianPhone() {
  const prefixes = ['010', '011', '012', '015'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return `+20${prefix}${number}`;
}

// Generate realistic Egyptian names
function generateEgyptianName() {
  const firstNames = [
    'Ahmed', 'Mohamed', 'Mahmoud', 'Ibrahim', 'Youssef', 'Omar', 'Ali', 'Hassan',
    'Fatma', 'Aisha', 'Mariam', 'Sara', 'Nour', 'Yasmin', 'Hana', 'Layla'
  ];
  const lastNames = [
    'Hassan', 'Ali', 'Mohamed', 'Ahmed', 'Mahmoud', 'Ibrahim', 'Abdel Rahman',
    'El-Sayed', 'Mostafa', 'Khalil', 'Farouk', 'Nasser', 'Samir', 'Gamal'
  ];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
}

// Generate car description
function generateCarDescription(brand, model, year, mileage) {
  const conditions = ['Excellent', 'Very Good', 'Good', 'Fair'];
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  
  const features = [
    'ABS', 'Airbags', 'Air Conditioning', 'Power Steering', 'Power Windows',
    'Central Lock', 'Alarm System', 'Cruise Control', 'Leather Seats',
    'Sunroof', 'Navigation System', 'Bluetooth', 'Backup Camera',
    'Parking Sensors', 'LED Headlights', 'Alloy Wheels'
  ];
  
  const selectedFeatures = features
    .sort(() => 0.5 - Math.random())
    .slice(0, Math.floor(Math.random() * 8) + 5);
  
  return {
    en: `${year} ${brand} ${model} in ${condition.toLowerCase()} condition with ${mileage.toLocaleString()} km. Features include: ${selectedFeatures.join(', ')}. ${Math.random() > 0.5 ? 'First owner, ' : ''}${Math.random() > 0.5 ? 'no accidents, ' : ''}full service history available. ${Math.random() > 0.7 ? 'Price negotiable.' : 'Fixed price.'}`,
    ar: `${brand} ${model} موديل ${year} بحالة ${condition === 'Excellent' ? 'ممتازة' : condition === 'Very Good' ? 'جيدة جداً' : condition === 'Good' ? 'جيدة' : 'مقبولة'} بعداد ${mileage.toLocaleString()} كم. المميزات تشمل: ${selectedFeatures.length} مميزات. ${Math.random() > 0.5 ? 'مالك أول، ' : ''}${Math.random() > 0.5 ? 'لا حوادث، ' : ''}سجل صيانة كامل متاح. ${Math.random() > 0.7 ? 'السعر قابل للتفاوض.' : 'السعر نهائي.'}`
  };
}

// Calculate realistic price based on Egyptian market
function calculatePrice(brand, model, year, mileage, category) {
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  
  // Base prices in EGP
  const basePrices = {
    'Toyota': 800000,
    'Nissan': 700000,
    'Hyundai': 650000,
    'Kia': 600000,
    'Mitsubishi': 750000,
    'Mercedes-Benz': 2500000,
    'BMW': 2200000,
    'Volkswagen': 900000,
    'Peugeot': 550000,
    'Renault': 500000,
    'Chevrolet': 700000,
    'MG': 450000,
    'Chery': 400000,
    'Geely': 480000,
    'BYD': 550000
  };
  
  const categoryMultipliers = {
    'sedan': 1.0,
    'suv': 1.3,
    'hatchback': 0.8,
    'pickup': 1.2,
    'van': 1.1,
    'coupe': 1.4,
    'electric': 1.5,
    'hybrid': 1.3
  };
  
  let price = basePrices[brand] || 600000;
  price *= categoryMultipliers[category] || 1.0;
  
  // Depreciation
  price *= Math.pow(0.85, age);
  
  // Mileage adjustment
  if (mileage > 100000) {
    price *= 0.9;
  } else if (mileage > 150000) {
    price *= 0.8;
  } else if (mileage > 200000) {
    price *= 0.7;
  }
  
  // Add some randomness
  price *= (0.9 + Math.random() * 0.2);
  
  return Math.round(price / 1000) * 1000; // Round to nearest 1000
}

async function populateDatabase() {
  try {
    // Initialize admin with project ID only (for emulator or authenticated environment)
    if (!admin.apps.length) {
      admin.initializeApp({
        projectId: 'souk-el-syarat'
      });
    }
    
    const db = admin.firestore();
    const batch = db.batch();
    let operationCount = 0;
    
    console.log('📝 Creating Categories...');
    // Create categories
    for (const category of EGYPTIAN_CARS.categories) {
      const categoryRef = db.collection('categories').doc(category.id);
      batch.set(categoryRef, {
        ...category,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        productCount: 0,
        featured: Math.random() > 0.7,
        order: Math.floor(Math.random() * 10)
      });
      operationCount++;
    }
    
    console.log('👤 Creating Users...');
    // Create sample users
    const userRoles = ['customer', 'vendor', 'admin'];
    const users = [];
    
    for (let i = 0; i < 20; i++) {
      const userId = `user_${Date.now()}_${i}`;
      const userRef = db.collection('users').doc(userId);
      const name = generateEgyptianName();
      const email = `${name.toLowerCase().replace(' ', '.')}@example.com`;
      
      const userData = {
        id: userId,
        name: name,
        email: email,
        phone: generateEgyptianPhone(),
        role: userRoles[Math.floor(Math.random() * userRoles.length)],
        emailVerified: Math.random() > 0.3,
        phoneVerified: Math.random() > 0.4,
        governorate: EGYPTIAN_CARS.governorates[Math.floor(Math.random() * EGYPTIAN_CARS.governorates.length)],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          loginCount: Math.floor(Math.random() * 50),
          lastLogin: admin.firestore.Timestamp.fromDate(new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000))
        },
        preferences: {
          language: Math.random() > 0.5 ? 'ar' : 'en',
          currency: 'EGP',
          notifications: {
            email: true,
            sms: Math.random() > 0.5,
            push: true
          }
        }
      };
      
      batch.set(userRef, userData);
      users.push(userData);
      operationCount++;
    }
    
    console.log('🚗 Creating Products (Cars)...');
    // Create products (cars)
    for (let i = 0; i < 100; i++) {
      const productId = `car_${Date.now()}_${i}`;
      const productRef = db.collection('products').doc(productId);
      
      const brand = EGYPTIAN_CARS.brands[Math.floor(Math.random() * EGYPTIAN_CARS.brands.length)];
      const model = brand.models[Math.floor(Math.random() * brand.models.length)];
      const year = 2015 + Math.floor(Math.random() * 10);
      const mileage = Math.floor(Math.random() * 200000);
      const category = EGYPTIAN_CARS.categories[Math.floor(Math.random() * EGYPTIAN_CARS.categories.length)];
      const color = EGYPTIAN_CARS.colors[Math.floor(Math.random() * EGYPTIAN_CARS.colors.length)];
      const vendor = users.filter(u => u.role === 'vendor')[Math.floor(Math.random() * users.filter(u => u.role === 'vendor').length)];
      const governorate = EGYPTIAN_CARS.governorates[Math.floor(Math.random() * EGYPTIAN_CARS.governorates.length)];
      
      const price = calculatePrice(brand.name, model, year, mileage, category.id);
      const description = generateCarDescription(brand.name, model, year, mileage);
      
      const productData = {
        id: productId,
        title: `${year} ${brand.name} ${model}`,
        titleAr: `${brand.arabic} ${model} ${year}`,
        description: description.en,
        descriptionAr: description.ar,
        price: price,
        originalPrice: Math.round(price * (1.1 + Math.random() * 0.2)),
        discount: Math.floor(Math.random() * 30),
        category: category.id,
        categoryName: category.name,
        brand: brand.name,
        brandAr: brand.arabic,
        model: model,
        year: year,
        mileage: mileage,
        condition: ['new', 'like-new', 'used', 'fair'][Math.floor(Math.random() * 4)],
        fuelType: ['petrol', 'diesel', 'hybrid', 'electric'][Math.floor(Math.random() * 4)],
        transmission: ['manual', 'automatic', 'cvt'][Math.floor(Math.random() * 3)],
        color: color.name,
        colorAr: color.nameAr,
        colorHex: color.hex,
        engineSize: `${(1.0 + Math.random() * 3.5).toFixed(1)}L`,
        seats: [2, 5, 7, 8][Math.floor(Math.random() * 4)],
        doors: [2, 4, 5][Math.floor(Math.random() * 3)],
        governorate: governorate,
        vendorId: vendor?.id || 'system',
        vendorName: vendor?.name || 'Souk El-Syarat',
        images: [
          `https://source.unsplash.com/800x600/?${brand.name},${model},car`,
          `https://source.unsplash.com/800x600/?${brand.name},interior`,
          `https://source.unsplash.com/800x600/?car,dashboard`,
          `https://source.unsplash.com/800x600/?car,engine`
        ],
        featured: Math.random() > 0.8,
        available: Math.random() > 0.1,
        views: Math.floor(Math.random() * 5000),
        likes: Math.floor(Math.random() * 500),
        inquiries: Math.floor(Math.random() * 50),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          sku: `SKU${productId.substring(4, 12).toUpperCase()}`,
          barcode: Math.floor(Math.random() * 1000000000000).toString(),
          weight: Math.floor(1000 + Math.random() * 2000),
          dimensions: {
            length: Math.floor(4000 + Math.random() * 1000),
            width: Math.floor(1700 + Math.random() * 300),
            height: Math.floor(1400 + Math.random() * 300)
          }
        },
        seo: {
          metaTitle: `${year} ${brand.name} ${model} for Sale in ${governorate} | Souk El-Syarat`,
          metaDescription: `Buy ${year} ${brand.name} ${model} with ${mileage} km in ${governorate}. ${description.en.substring(0, 150)}...`,
          keywords: [brand.name, model, year.toString(), category.name, governorate, 'car', 'for sale', 'Egypt']
        },
        analytics: {
          conversionRate: Math.random() * 0.1,
          averageTimeOnPage: Math.floor(30 + Math.random() * 300),
          bounceRate: Math.random() * 0.5,
          exitRate: Math.random() * 0.3
        }
      };
      
      batch.set(productRef, productData);
      operationCount++;
      
      // Stop at 499 operations (Firestore batch limit is 500)
      if (operationCount >= 499) {
        console.log(`📦 Committing batch of ${operationCount} operations...`);
        await batch.commit();
        console.log('✅ Batch committed successfully!');
        operationCount = 0;
        // Start new batch
        batch = db.batch();
      }
    }
    
    // Commit remaining operations
    if (operationCount > 0) {
      console.log(`📦 Committing final batch of ${operationCount} operations...`);
      await batch.commit();
      console.log('✅ Final batch committed successfully!');
    }
    
    console.log('');
    console.log('🎉 DATABASE POPULATION COMPLETE!');
    console.log('=' .repeat(60));
    console.log('Summary:');
    console.log(`✅ ${EGYPTIAN_CARS.categories.length} categories created`);
    console.log(`✅ ${users.length} users created`);
    console.log(`✅ 100 products (cars) created`);
    console.log('');
    console.log('🔍 You can now test the application with real data!');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error populating database:', error);
    console.error('Details:', error.message);
    console.error('');
    console.error('💡 Troubleshooting tips:');
    console.error('1. Make sure you are authenticated with Firebase');
    console.error('2. Check that the project ID is correct: souk-el-syarat');
    console.error('3. Ensure Firestore is enabled in your Firebase project');
    console.error('4. Try running: firebase login');
    console.error('5. Try running: firebase use souk-el-syarat');
  }
}

// Run the script
populateDatabase().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});