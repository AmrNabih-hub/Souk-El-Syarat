/**
 * Quick Appwrite Configuration Test
 */

import { Client, Databases, Storage } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  endpoint: process.env.VITE_APPWRITE_ENDPOINT,
  project: process.env.VITE_APPWRITE_PROJECT_ID,
  apiKey: process.env.APPWRITE_API_KEY,
  databaseId: 'souk_main_db'
};

console.log('🔍 Testing Appwrite Configuration...');
console.log('Endpoint:', config.endpoint);
console.log('Project:', config.project);
console.log('API Key:', config.apiKey ? '✓ Present' : '✗ Missing');

const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.project)
  .setKey(config.apiKey);

const databases = new Databases(client);
const storage = new Storage(client);

async function testSetup() {
  try {
    console.log('\n📡 Testing connection...');
    
    // Test database connection
    const dbList = await databases.list();
    console.log('✅ Connected to Appwrite');
    console.log('Databases found:', dbList.total);

    // Check if our database exists
    try {
      const database = await databases.get(config.databaseId);
      console.log('✅ Database exists:', database.name);
      
      // List collections
      const collections = await databases.listCollections(config.databaseId);
      console.log('Collections found:', collections.total);
      
      collections.collections.forEach(collection => {
        console.log(`  - ${collection.name} (${collection.$id})`);
      });

      // Check users collection specifically
      try {
        const usersCollection = await databases.getCollection(config.databaseId, 'users');
        console.log('\n👥 Users Collection Attributes:');
        usersCollection.attributes.forEach(attr => {
          console.log(`  - ${attr.key}: ${attr.type} ${attr.required ? '(required)' : '(optional)'}`);
        });
      } catch (error) {
        console.log('❌ Users collection not found:', error.message);
      }

    } catch (error) {
      console.error('❌ Database not found:', error.message);
    }

    // Check storage
    const buckets = await storage.listBuckets();
    console.log('\n🪣 Storage buckets:', buckets.total);
    buckets.buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.$id})`);
    });

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testSetup();