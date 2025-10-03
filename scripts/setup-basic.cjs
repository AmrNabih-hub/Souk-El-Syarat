/**
 * 🚀 APPWRITE QUICK SETUP
 * Test connection and create basic structure
 */

const { Client, Databases, Storage, ID, Permission, Role } = require('node-appwrite');
require('dotenv').config();

// Configuration
const config = {
  endpoint: process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1',
  project: process.env.VITE_APPWRITE_PROJECT_ID || '68e030b8002f5fcaa59c',
  apiKey: process.env.APPWRITE_API_KEY,
  databaseId: 'souk_main_db'
};

console.log('🚀 Starting Appwrite setup for Souk Al-Sayarat...');
console.log('📡 Endpoint:', config.endpoint);
console.log('🆔 Project:', config.project);
console.log('🔑 API Key:', config.apiKey ? 'Present' : 'Missing');

// Initialize Appwrite Client
const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.project)
  .setKey(config.apiKey);

const databases = new Databases(client);
const storage = new Storage(client);

async function setupAppwrite() {
  try {
    // Test connection
    console.log('\n🔍 Testing connection...');
    const health = await client.call('GET', '/health');
    console.log('✅ Connection successful!');

    // Create database
    console.log('\n🗃️ Creating database...');
    try {
      const database = await databases.create(config.databaseId, 'Souk Al-Sayarat Main Database');
      console.log('✅ Database created:', database.name);
    } catch (error) {
      if (error.code === 409) {
        console.log('ℹ️  Database already exists');
      } else {
        throw error;
      }
    }

    // Create a simple test collection
    console.log('\n📋 Creating test collection...');
    try {
      const collection = await databases.createCollection(
        config.databaseId,
        'test_collection',
        'Test Collection',
        [
          Permission.read(Role.any()),
          Permission.create(Role.users()),
          Permission.update(Role.users()),
          Permission.delete(Role.users())
        ]
      );
      console.log('✅ Test collection created:', collection.name);

      // Add a simple attribute
      await databases.createStringAttribute(
        config.databaseId,
        'test_collection',
        'title',
        255,
        true
      );
      console.log('✅ Added title attribute');

    } catch (error) {
      if (error.code === 409) {
        console.log('ℹ️  Test collection already exists');
      } else {
        console.error('❌ Error creating collection:', error);
      }
    }

    // Create storage bucket
    console.log('\n🪣 Creating storage bucket...');
    try {
      const bucket = await storage.createBucket(
        'test_bucket',
        'Test Bucket',
        [
          Permission.read(Role.any()),
          Permission.create(Role.users()),
          Permission.update(Role.users()),
          Permission.delete(Role.users())
        ],
        true, // fileSecurity
        true, // enabled
        10 * 1024 * 1024, // 10MB max
        ['jpg', 'jpeg', 'png', 'webp', 'gif'] // allowed extensions
      );
      console.log('✅ Storage bucket created:', bucket.name);
    } catch (error) {
      if (error.code === 409) {
        console.log('ℹ️  Storage bucket already exists');
      } else {
        console.error('❌ Error creating bucket:', error);
      }
    }

    console.log('\n🎉 Basic setup completed successfully!');
    console.log('✅ Your Appwrite backend is ready for Souk Al-Sayarat');

  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    console.error('Error details:', error.message);
  }
}

// Run setup
setupAppwrite();