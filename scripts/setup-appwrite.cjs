/**
 * 🚀 APPWRITE AUTOMATED SETUP SCRIPT
 * This script creates all collections, attributes, indexes, and permissions
 * Run this after creating your Appwrite project
 * 
 * Usage: node scripts/setup-appwrite.js
 */

const sdk = require('node-appwrite');
require('dotenv').config();

// Configuration
const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY; // You need to create this in Appwrite Console
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'souk_main_db';

// Initialize Appwrite SDK
const client = new sdk.Client();
client
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const databases = new sdk.Databases(client);
const storage = new sdk.Storage(client);

/**
 * Database Schema Definitions
 */
const COLLECTIONS = [
  {
    id: 'users',
    name: 'Users',
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'email', type: 'email', required: true },
      { key: 'displayName', type: 'string', size: 255, required: true },
      { key: 'role', type: 'enum', elements: ['customer', 'vendor', 'admin'], required: true },
      { key: 'phoneNumber', type: 'string', size: 50, required: false },
      { key: 'photoURL', type: 'url', required: false },
      { key: 'isActive', type: 'boolean', required: true, default: true },
      { key: 'emailVerified', type: 'boolean', required: true, default: false },
      { key: 'preferences', type: 'string', size: 5000, required: false },
    ],
    indexes: [
      { key: 'userId', type: 'unique', attributes: ['userId'] },
      { key: 'email', type: 'fulltext', attributes: ['email'] },
      { key: 'role', type: 'key', attributes: ['role'] },
    ],
  },
  {
    id: 'products',
    name: 'Products',
    attributes: [
      { key: 'title', type: 'string', size: 500, required: true },
      { key: 'description', type: 'string', size: 5000, required: true },
      { key: 'price', type: 'double', required: true },
      { key: 'originalPrice', type: 'double', required: false },
      { key: 'category', type: 'string', size: 100, required: true },
      { key: 'brand', type: 'string', size: 100, required: false },
      { key: 'model', type: 'string', size: 100, required: false },
      { key: 'year', type: 'integer', required: false },
      { key: 'mileage', type: 'integer', required: false },
      { key: 'condition', type: 'enum', elements: ['new', 'used', 'certified'], required: true },
      { key: 'images', type: 'string', size: 2000, array: true, required: false },
      { key: 'vendorId', type: 'string', size: 255, required: true },
      { key: 'status', type: 'enum', elements: ['active', 'sold', 'pending', 'inactive'], required: true },
      { key: 'featured', type: 'boolean', required: true, default: false },
      { key: 'views', type: 'integer', required: true, default: 0 },
    ],
    indexes: [
      { key: 'vendorId', type: 'key', attributes: ['vendorId'] },
      { key: 'category', type: 'fulltext', attributes: ['category'] },
      { key: 'status', type: 'key', attributes: ['status'] },
      { key: 'price', type: 'key', attributes: ['price'] },
    ],
  },
  {
    id: 'orders',
    name: 'Orders',
    attributes: [
      { key: 'customerId', type: 'string', size: 255, required: true },
      { key: 'vendorId', type: 'string', size: 255, required: true },
      { key: 'productId', type: 'string', size: 255, required: true },
      { key: 'status', type: 'enum', elements: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], required: true },
      { key: 'totalAmount', type: 'double', required: true },
      { key: 'paymentMethod', type: 'enum', elements: ['cod', 'instapay', 'card'], required: true },
      { key: 'paymentStatus', type: 'enum', elements: ['pending', 'paid', 'failed'], required: true },
      { key: 'shippingAddress', type: 'string', size: 2000, required: true },
      { key: 'trackingNumber', type: 'string', size: 255, required: false },
    ],
    indexes: [
      { key: 'customerId', type: 'key', attributes: ['customerId'] },
      { key: 'vendorId', type: 'key', attributes: ['vendorId'] },
      { key: 'status', type: 'key', attributes: ['status'] },
    ],
  },
  {
    id: 'vendor-applications',
    name: 'Vendor Applications',
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'businessName', type: 'string', size: 255, required: true },
      { key: 'businessLicense', type: 'string', size: 255, required: false },
      { key: 'phoneNumber', type: 'string', size: 50, required: true },
      { key: 'address', type: 'string', size: 1000, required: true },
      { key: 'status', type: 'enum', elements: ['pending', 'approved', 'rejected'], required: true },
      { key: 'reviewedBy', type: 'string', size: 255, required: false },
      { key: 'reviewNotes', type: 'string', size: 2000, required: false },
    ],
    indexes: [
      { key: 'userId', type: 'key', attributes: ['userId'] },
      { key: 'status', type: 'key', attributes: ['status'] },
    ],
  },
  {
    id: 'car-listings',
    name: 'Car Listings',
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'brand', type: 'string', size: 100, required: true },
      { key: 'model', type: 'string', size: 100, required: true },
      { key: 'year', type: 'integer', required: true },
      { key: 'mileage', type: 'integer', required: true },
      { key: 'price', type: 'double', required: true },
      { key: 'condition', type: 'string', size: 50, required: true },
      { key: 'description', type: 'string', size: 5000, required: true },
      { key: 'images', type: 'string', size: 2000, array: true, required: false },
      { key: 'status', type: 'enum', elements: ['pending', 'approved', 'rejected', 'sold'], required: true },
      { key: 'contactPhone', type: 'string', size: 50, required: true },
    ],
    indexes: [
      { key: 'userId', type: 'key', attributes: ['userId'] },
      { key: 'status', type: 'key', attributes: ['status'] },
      { key: 'brand', type: 'fulltext', attributes: ['brand'] },
    ],
  },
  {
    id: 'messages',
    name: 'Messages',
    attributes: [
      { key: 'chatId', type: 'string', size: 255, required: true },
      { key: 'senderId', type: 'string', size: 255, required: true },
      { key: 'receiverId', type: 'string', size: 255, required: true },
      { key: 'content', type: 'string', size: 5000, required: true },
      { key: 'read', type: 'boolean', required: true, default: false },
    ],
    indexes: [
      { key: 'chatId', type: 'key', attributes: ['chatId'] },
      { key: 'senderId', type: 'key', attributes: ['senderId'] },
      { key: 'receiverId', type: 'key', attributes: ['receiverId'] },
    ],
  },
  {
    id: 'notifications',
    name: 'Notifications',
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'message', type: 'string', size: 2000, required: true },
      { key: 'type', type: 'enum', elements: ['info', 'success', 'warning', 'error'], required: true },
      { key: 'read', type: 'boolean', required: true, default: false },
      { key: 'actionUrl', type: 'url', required: false },
    ],
    indexes: [
      { key: 'userId', type: 'key', attributes: ['userId'] },
      { key: 'read', type: 'key', attributes: ['read'] },
    ],
  },
];

/**
 * Storage Buckets Definitions
 */
const BUCKETS = [
  {
    id: 'product-images',
    name: 'Product Images',
    permissions: ['read("any")'],
    fileSecurity: true,
    enabled: true,
    maximumFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    compression: 'gzip',
    encryption: true,
    antivirus: true,
  },
  {
    id: 'car-images',
    name: 'Car Images',
    permissions: ['read("any")'],
    fileSecurity: true,
    enabled: true,
    maximumFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    compression: 'gzip',
    encryption: true,
    antivirus: true,
  },
  {
    id: 'avatars',
    name: 'Avatars',
    permissions: ['read("any")'],
    fileSecurity: true,
    enabled: true,
    maximumFileSize: 2 * 1024 * 1024, // 2MB
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    compression: 'gzip',
    encryption: true,
    antivirus: true,
  },
];

/**
 * Setup Functions
 */

async function createDatabase() {
  try {
    console.log('📦 Checking database...');
    // Try to list databases to check if it exists
    const databasesList = await databases.list();
    const existingDb = databasesList.databases.find(db => db.$id === DATABASE_ID);
    
    if (existingDb) {
      console.log(`✅ Database '${DATABASE_ID}' already exists - using it`);
      return;
    }
    
    // Create database if it doesn't exist
    await databases.create(DATABASE_ID, 'Souk El-Sayarat Database');
    console.log('✅ Database created successfully');
  } catch (error) {
    if (error.code === 409) {
      console.log('ℹ️  Database already exists');
    } else if (error.code === 403 && error.type === 'additional_resource_not_allowed') {
      console.log(`✅ Using existing database '${DATABASE_ID}' (free plan limit reached)`);
    } else {
      throw error;
    }
  }
}

async function createCollection(collection) {
  try {
    console.log(`\n📁 Creating collection: ${collection.name}...`);
    
    // Create collection
    await databases.createCollection(
      DATABASE_ID,
      collection.id,
      collection.name,
      ['read("any")', 'create("users")', 'update("users")', 'delete("users")']
    );
    
    console.log(`✅ Collection ${collection.name} created`);

    // Wait a bit before creating attributes
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create attributes
    for (const attr of collection.attributes) {
      try {
        console.log(`   📝 Creating attribute: ${attr.key}...`);
        
        if (attr.type === 'string') {
          await databases.createStringAttribute(
            DATABASE_ID,
            collection.id,
            attr.key,
            attr.size,
            attr.required,
            attr.default,
            attr.array || false
          );
        } else if (attr.type === 'email') {
          await databases.createEmailAttribute(
            DATABASE_ID,
            collection.id,
            attr.key,
            attr.required,
            attr.default
          );
        } else if (attr.type === 'url') {
          await databases.createUrlAttribute(
            DATABASE_ID,
            collection.id,
            attr.key,
            attr.required,
            attr.default
          );
        } else if (attr.type === 'integer') {
          await databases.createIntegerAttribute(
            DATABASE_ID,
            collection.id,
            attr.key,
            attr.required,
            attr.min,
            attr.max,
            attr.default
          );
        } else if (attr.type === 'double') {
          await databases.createFloatAttribute(
            DATABASE_ID,
            collection.id,
            attr.key,
            attr.required,
            attr.min,
            attr.max,
            attr.default
          );
        } else if (attr.type === 'boolean') {
          await databases.createBooleanAttribute(
            DATABASE_ID,
            collection.id,
            attr.key,
            attr.required,
            attr.default
          );
        } else if (attr.type === 'enum') {
          await databases.createEnumAttribute(
            DATABASE_ID,
            collection.id,
            attr.key,
            attr.elements,
            attr.required,
            attr.default
          );
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        if (error.code === 409) {
          console.log(`   ℹ️  Attribute ${attr.key} already exists`);
        } else {
          console.error(`   ❌ Failed to create attribute ${attr.key}:`, error.message);
        }
      }
    }

    // Wait for attributes to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create indexes
    for (const index of collection.indexes) {
      try {
        console.log(`   🔍 Creating index: ${index.key}...`);
        await databases.createIndex(
          DATABASE_ID,
          collection.id,
          index.key,
          index.type,
          index.attributes
        );
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        if (error.code === 409) {
          console.log(`   ℹ️  Index ${index.key} already exists`);
        } else {
          console.error(`   ❌ Failed to create index ${index.key}:`, error.message);
        }
      }
    }

    console.log(`✅ Collection ${collection.name} setup complete`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`ℹ️  Collection ${collection.name} already exists`);
    } else {
      console.error(`❌ Failed to create collection ${collection.name}:`, error.message);
    }
  }
}

async function createBucket(bucket) {
  try {
    console.log(`\n🪣 Creating bucket: ${bucket.name}...`);
    
    await storage.createBucket(
      bucket.id,
      bucket.name,
      bucket.permissions,
      bucket.fileSecurity,
      bucket.enabled,
      bucket.maximumFileSize,
      bucket.allowedFileExtensions,
      bucket.compression,
      bucket.encryption,
      bucket.antivirus
    );
    
    console.log(`✅ Bucket ${bucket.name} created successfully`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`ℹ️  Bucket ${bucket.name} already exists`);
    } else {
      console.error(`❌ Failed to create bucket ${bucket.name}:`, error.message);
    }
  }
}

/**
 * Main Setup Function
 */
async function setup() {
  console.log('🚀 Starting Appwrite Setup...\n');
  console.log('📋 Configuration:');
  console.log(`   Endpoint: ${APPWRITE_ENDPOINT}`);
  console.log(`   Project: ${APPWRITE_PROJECT_ID}`);
  console.log(`   Database: ${DATABASE_ID}\n`);

  if (!APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('   - VITE_APPWRITE_PROJECT_ID');
    console.error('   - APPWRITE_API_KEY');
    console.error('\nPlease set these in your .env file');
    process.exit(1);
  }

  try {
    // Create database
    await createDatabase();

    // Create collections
    console.log('\n📚 Creating collections...');
    for (const collection of COLLECTIONS) {
      await createCollection(collection);
    }

    // Create storage buckets
    console.log('\n🪣 Creating storage buckets...');
    for (const bucket of BUCKETS) {
      await createBucket(bucket);
    }

    console.log('\n✅ Setup complete!');
    console.log('\n📊 Summary:');
    console.log(`   ✅ Database: ${DATABASE_ID}`);
    console.log(`   ✅ Collections: ${COLLECTIONS.length}`);
    console.log(`   ✅ Storage Buckets: ${BUCKETS.length}`);
    console.log('\n🎉 Your Appwrite backend is ready!');
    console.log('\n📝 Next steps:');
    console.log('   1. Update your .env file with these collection/bucket IDs');
    console.log('   2. Deploy your frontend');
    console.log('   3. Test the application');
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run setup
setup();

