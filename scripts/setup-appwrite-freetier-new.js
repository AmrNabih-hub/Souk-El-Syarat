/**
 * 🚀 APPWRITE SETUP AUTOMATION SCRIPT - FREE TIER
 * Creates collections and storage bucket using existing database
 */

import { Client, Databases, Storage } from 'node-appwrite';

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('68e030b8002f5fcaa59c')
  .setKey('standard_77ce7fb9b60982995e25deacee6f7c9acf61b7e1c2bcc49872b151ecf1e17c90db86e3f49c2262922b1f630a4530a3551318e813b2d98655aa13c676b64642c157645072f5bdd59e226d8e5bd54a57ac7da5c69f4169d9eac79aff0c2e7ac4b132d9eca9434660be7da520fe56cad621af11cff2080070a4fe72038a30baf2fa');

const databases = new Databases(client);
const storage = new Storage(client);

async function checkExistingResources() {
  try {
    console.log('🔍 Checking existing databases...');
    const dbList = await databases.list();
    console.log('📦 Available databases:');
    dbList.databases.forEach(db => {
      console.log(`   • ${db.name} (ID: ${db.$id})`);
    });

    console.log('\n🔍 Checking existing storage buckets...');
    const bucketList = await storage.listBuckets();
    console.log('🗄️  Available buckets:');
    bucketList.buckets.forEach(bucket => {
      console.log(`   • ${bucket.name} (ID: ${bucket.$id})`);
    });

    // Use first available database
    if (dbList.databases.length > 0) {
      const DATABASE_ID = dbList.databases[0].$id;
      console.log(`\n🎯 Using database: ${DATABASE_ID}`);
      
      // Check existing collections
      const collections = await databases.listCollections(DATABASE_ID);
      console.log('\n📋 Existing collections:');
      collections.collections.forEach(col => {
        console.log(`   • ${col.name} (ID: ${col.$id})`);
      });
      
      return DATABASE_ID;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error checking resources:', error.message);
    return null;
  }
}

// Collection configurations for free tier
const essentialCollections = [
  {
    id: 'users',
    name: 'Users',
    permissions: ['read("any")', 'create("users")', 'update("users")', 'delete("users")'],
    documentSecurity: true,
    attributes: [
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'email', type: 'string', size: 255, required: true },
      { key: 'role', type: 'string', size: 50, required: true, default: 'customer' },
      { key: 'phone', type: 'string', size: 20, required: false },
      { key: 'avatar', type: 'string', size: 500, required: false },
      { key: 'location', type: 'string', size: 255, required: false },
      { key: 'isVerified', type: 'boolean', required: true, default: false }
    ],
    indexes: [
      { key: 'email_index', type: 'unique', attributes: ['email'] },
      { key: 'role_index', type: 'key', attributes: ['role'] }
    ]
  },
  {
    id: 'car_listings',
    name: 'Car Listings',
    permissions: ['read("any")', 'create("users")', 'update("users")', 'delete("users")'],
    documentSecurity: true,
    attributes: [
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 2000, required: true },
      { key: 'price', type: 'integer', required: true },
      { key: 'brand', type: 'string', size: 100, required: true },
      { key: 'model', type: 'string', size: 100, required: true },
      { key: 'year', type: 'integer', required: true },
      { key: 'mileage', type: 'integer', required: true },
      { key: 'condition', type: 'string', size: 50, required: true },
      { key: 'fuelType', type: 'string', size: 50, required: true },
      { key: 'transmission', type: 'string', size: 50, required: true },
      { key: 'location', type: 'string', size: 255, required: true },
      { key: 'images', type: 'string', size: 500, required: false, array: true },
      { key: 'vendorId', type: 'string', size: 255, required: true },
      { key: 'status', type: 'string', size: 50, required: true, default: 'active' },
      { key: 'views', type: 'integer', required: true, default: 0 }
    ],
    indexes: [
      { key: 'vendor_index', type: 'key', attributes: ['vendorId'] },
      { key: 'status_index', type: 'key', attributes: ['status'] },
      { key: 'brand_model_index', type: 'key', attributes: ['brand', 'model'] },
      { key: 'price_index', type: 'key', attributes: ['price'] }
    ]
  }
];

// Storage bucket configuration
const bucket = {
  id: 'car_images',
  name: 'Car Images',
  permissions: ['read("any")', 'create("users")', 'update("users")', 'delete("users")'],
  fileSecurity: true,
  enabled: true,
  maximumFileSize: 30000000, // 30MB
  allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  compression: 'gzip',
  encryption: true,
  antivirus: true
};

async function setupCollections(DATABASE_ID) {
  console.log('\n📋 Setting up essential collections...');
  
  for (const collection of essentialCollections) {
    try {
      await databases.createCollection(
        DATABASE_ID,
        collection.id,
        collection.name,
        collection.permissions,
        collection.documentSecurity
      );
      console.log(`✅ Collection "${collection.name}" created`);

      // Add attributes with delay
      for (const attr of collection.attributes) {
        try {
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms between attribute creation
          
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
          } else if (attr.type === 'integer') {
            await databases.createIntegerAttribute(
              DATABASE_ID,
              collection.id,
              attr.key,
              attr.required,
              undefined,
              undefined,
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
          }
          console.log(`  ✅ Attribute "${attr.key}" added`);
        } catch (attrError) {
          if (attrError.code === 409) {
            console.log(`  ℹ️  Attribute "${attr.key}" already exists`);
          } else {
            console.error(`  ❌ Error creating attribute "${attr.key}":`, attrError.message);
          }
        }
      }

      // Add indexes with delay
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s for attributes to be ready
      for (const index of collection.indexes) {
        try {
          await databases.createIndex(
            DATABASE_ID,
            collection.id,
            index.key,
            index.type,
            index.attributes
          );
          console.log(`  ✅ Index "${index.key}" created`);
        } catch (indexError) {
          if (indexError.code === 409) {
            console.log(`  ℹ️  Index "${index.key}" already exists`);
          } else {
            console.error(`  ❌ Error creating index "${index.key}":`, indexError.message);
          }
        }
      }

    } catch (error) {
      if (error.code === 409) {
        console.log(`ℹ️  Collection "${collection.name}" already exists`);
      } else {
        console.error(`❌ Error creating collection "${collection.name}":`, error.message);
      }
    }
  }
}

async function setupStorage() {
  console.log('\n🗄️  Setting up storage bucket...');
  try {
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
    console.log('✅ Storage bucket created successfully');
  } catch (error) {
    if (error.code === 409) {
      console.log('ℹ️  Storage bucket already exists');
    } else {
      console.error('❌ Error creating storage bucket:', error.message);
    }
  }
}

async function setupAppwriteFreeTier() {
  try {
    console.log('🚀 Starting Appwrite setup for Souk Al-Sayarat (Free Tier)...');
    
    const DATABASE_ID = await checkExistingResources();
    
    if (!DATABASE_ID) {
      console.log('❌ No database found. Please create one manually in the Appwrite console.');
      return;
    }

    await setupCollections(DATABASE_ID);
    await setupStorage();

    console.log('\n🎉 Appwrite setup completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   • Database: ${DATABASE_ID}`);
    console.log(`   • Collections: ${essentialCollections.length} essential collections`);
    console.log(`   • Storage bucket: ${bucket.id}`);
    console.log('\n🚀 Your marketplace is ready for deployment!');
    console.log('\n💡 Update your .env file with the correct database ID:');
    console.log(`   VITE_APPWRITE_DATABASE_ID="${DATABASE_ID}"`);

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
setupAppwriteFreeTier();