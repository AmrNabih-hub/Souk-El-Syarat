/**
 * 🚀 APPWRITE SETUP AUTOMATION SCRIPT
 * Creates database, collections, and storage bucket for Souk Al-Sayarat
 */

import { Client, Databases, Storage, Users } from 'node-appwrite';

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('68e030b8002f5fcaa59c')
  .setKey('standard_77ce7fb9b60982995e25deacee6f7c9acf61b7e1c2bcc49872b151ecf1e17c90db86e3f49c2262922b1f630a4530a3551318e813b2d98655aa13c676b64642c157645072f5bdd59e226d8e5bd54a57ac7da5c69f4169d9eac79aff0c2e7ac4b132d9eca9434660be7da520fe56cad621af11cff2080070a4fe72038a30baf2fa');

const databases = new Databases(client);
const storage = new Storage(client);
const users = new Users(client);

const DATABASE_ID = 'souk_main_db';

// Collection configurations
const collections = [
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
      { key: 'isVerified', type: 'boolean', required: true, default: false },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: true }
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
      { key: 'views', type: 'integer', required: true, default: 0 },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: true }
    ],
    indexes: [
      { key: 'vendor_index', type: 'key', attributes: ['vendorId'] },
      { key: 'status_index', type: 'key', attributes: ['status'] },
      { key: 'brand_model_index', type: 'key', attributes: ['brand', 'model'] },
      { key: 'price_index', type: 'key', attributes: ['price'] },
      { key: 'location_index', type: 'key', attributes: ['location'] }
    ]
  },
  {
    id: 'vendors',
    name: 'Vendors',
    permissions: ['read("any")', 'create("users")', 'update("users")', 'delete("users")'],
    documentSecurity: true,
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'businessName', type: 'string', size: 255, required: true },
      { key: 'businessLicense', type: 'string', size: 255, required: false },
      { key: 'description', type: 'string', size: 1000, required: false },
      { key: 'address', type: 'string', size: 500, required: true },
      { key: 'phone', type: 'string', size: 20, required: true },
      { key: 'email', type: 'string', size: 255, required: true },
      { key: 'website', type: 'string', size: 255, required: false },
      { key: 'specialties', type: 'string', size: 100, required: false, array: true },
      { key: 'rating', type: 'double', required: true, default: 0.0 },
      { key: 'reviewCount', type: 'integer', required: true, default: 0 },
      { key: 'isVerified', type: 'boolean', required: true, default: false },
      { key: 'isActive', type: 'boolean', required: true, default: true },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: true }
    ],
    indexes: [
      { key: 'user_index', type: 'unique', attributes: ['userId'] },
      { key: 'verified_index', type: 'key', attributes: ['isVerified'] },
      { key: 'active_index', type: 'key', attributes: ['isActive'] },
      { key: 'rating_index', type: 'key', attributes: ['rating'] }
    ]
  },
  {
    id: 'orders',
    name: 'Orders',
    permissions: ['read("users")', 'create("users")', 'update("users")', 'delete("users")'],
    documentSecurity: true,
    attributes: [
      { key: 'orderNumber', type: 'string', size: 100, required: true },
      { key: 'customerId', type: 'string', size: 255, required: true },
      { key: 'vendorId', type: 'string', size: 255, required: true },
      { key: 'productId', type: 'string', size: 255, required: true },
      { key: 'productType', type: 'string', size: 50, required: true },
      { key: 'quantity', type: 'integer', required: true, default: 1 },
      { key: 'unitPrice', type: 'integer', required: true },
      { key: 'totalPrice', type: 'integer', required: true },
      { key: 'status', type: 'string', size: 50, required: true, default: 'pending' },
      { key: 'paymentStatus', type: 'string', size: 50, required: true, default: 'pending' },
      { key: 'paymentMethod', type: 'string', size: 50, required: false },
      { key: 'shippingAddress', type: 'string', size: 500, required: true },
      { key: 'notes', type: 'string', size: 1000, required: false },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: true }
    ],
    indexes: [
      { key: 'order_number_index', type: 'unique', attributes: ['orderNumber'] },
      { key: 'customer_index', type: 'key', attributes: ['customerId'] },
      { key: 'vendor_index', type: 'key', attributes: ['vendorId'] },
      { key: 'status_index', type: 'key', attributes: ['status'] },
      { key: 'payment_status_index', type: 'key', attributes: ['paymentStatus'] }
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

async function setupAppwrite() {
  try {
    console.log('🚀 Starting Appwrite setup for Souk Al-Sayarat...');
    
    // Create database
    console.log('📦 Creating database...');
    try {
      await databases.create(DATABASE_ID, 'Souk Main Database');
      console.log('✅ Database created successfully');
    } catch (error) {
      if (error.code === 409) {
        console.log('ℹ️  Database already exists');
      } else {
        throw error;
      }
    }

    // Create collections
    console.log('📋 Creating collections...');
    for (const collection of collections) {
      try {
        await databases.createCollection(
          DATABASE_ID,
          collection.id,
          collection.name,
          collection.permissions,
          collection.documentSecurity
        );
        console.log(`✅ Collection "${collection.name}" created`);

        // Add attributes
        for (const attr of collection.attributes) {
          try {
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
            } else if (attr.type === 'datetime') {
              await databases.createDatetimeAttribute(
                DATABASE_ID,
                collection.id,
                attr.key,
                attr.required,
                attr.default
              );
            } else if (attr.type === 'double') {
              await databases.createFloatAttribute(
                DATABASE_ID,
                collection.id,
                attr.key,
                attr.required,
                undefined,
                undefined,
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

        // Add indexes (after a delay to ensure attributes are ready)
        setTimeout(async () => {
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
        }, 2000);

      } catch (error) {
        if (error.code === 409) {
          console.log(`ℹ️  Collection "${collection.name}" already exists`);
        } else {
          console.error(`❌ Error creating collection "${collection.name}":`, error.message);
        }
      }
    }

    // Create storage bucket
    console.log('🗄️  Creating storage bucket...');
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

    console.log('\n🎉 Appwrite setup completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   • Database: ${DATABASE_ID}`);
    console.log(`   • Collections: ${collections.length}`);
    console.log(`   • Storage bucket: ${bucket.id}`);
    console.log('\n🚀 Your marketplace is ready for deployment!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
setupAppwrite();