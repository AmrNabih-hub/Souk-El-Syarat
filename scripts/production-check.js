/**
 * 🧪 FINAL VERIFICATION SCRIPT
 * Souk Al-Sayarat - Production Readiness Check
 */

import { Client, Databases, Storage, ID } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  endpoint: process.env.VITE_APPWRITE_ENDPOINT,
  project: process.env.VITE_APPWRITE_PROJECT_ID,
  apiKey: process.env.APPWRITE_API_KEY,
  databaseId: 'souk_main_db'
};

const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.project)
  .setKey(config.apiKey);

const databases = new Databases(client);
const storage = new Storage(client);

async function runProductionCheck() {
  console.log('🧪 Running production readiness check...');
  console.log('');

  const results = {
    connection: false,
    database: false,
    collections: 0,
    storage: false,
    buckets: 0,
    overall: false
  };

  try {
    // Test 1: Connection
    console.log('1️⃣ Testing Appwrite connection...');
    await databases.list();
    results.connection = true;
    console.log('   ✅ Connection successful');

    // Test 2: Database
    console.log('2️⃣ Testing database access...');
    const database = await databases.get(config.databaseId);
    results.database = true;
    console.log(`   ✅ Database "${database.name}" accessible`);

    // Test 3: Collections
    console.log('3️⃣ Testing collections...');
    const collections = await databases.listCollections(config.databaseId);
    results.collections = collections.total;
    console.log(`   ✅ Found ${collections.total} collections`);
    
    collections.collections.forEach(collection => {
      console.log(`      - ${collection.name} (${collection.$id})`);
    });

    // Test 4: Storage
    console.log('4️⃣ Testing storage access...');
    const buckets = await storage.listBuckets();
    results.storage = true;
    results.buckets = buckets.total;
    console.log(`   ✅ Found ${buckets.total} storage bucket(s)`);
    
    buckets.buckets.forEach(bucket => {
      console.log(`      - ${bucket.name} (${bucket.$id})`);
    });

    // Overall assessment
    results.overall = 
      results.connection && 
      results.database && 
      results.collections >= 10 && 
      results.storage && 
      results.buckets >= 1;

    console.log('');
    console.log('📊 PRODUCTION READINESS REPORT');
    console.log('================================');
    console.log(`🔌 Connection: ${results.connection ? '✅ Ready' : '❌ Failed'}`);
    console.log(`🗃️ Database: ${results.database ? '✅ Ready' : '❌ Failed'}`);
    console.log(`📋 Collections: ${results.collections >= 10 ? '✅' : '❌'} ${results.collections}/14`);
    console.log(`🪣 Storage: ${results.storage ? '✅ Ready' : '❌ Failed'}`);
    console.log(`📦 Buckets: ${results.buckets >= 1 ? '✅' : '❌'} ${results.buckets}/1 (Free tier)`);
    console.log('');
    console.log(`🎯 Overall Status: ${results.overall ? '✅ PRODUCTION READY' : '❌ NEEDS ATTENTION'}`);
    
    if (results.overall) {
      console.log('');
      console.log('🚀 DEPLOYMENT INSTRUCTIONS');
      console.log('===========================');
      console.log('1. Open Appwrite Console:');
      console.log('   https://cloud.appwrite.io/console/project-68e030b8002f5fcaa59c');
      console.log('');
      console.log('2. Go to "Hosting" section');
      console.log('3. Click "Create Site"');
      console.log('4. Upload dist/ folder contents');
      console.log('5. Configure custom domain');
      console.log('6. Set up SSL certificate');
      console.log('7. Go LIVE! 🎉');
      console.log('');
      console.log('💡 Your Souk Al-Sayarat marketplace is ready for the world!');
    }

    return results;

  } catch (error) {
    console.error('❌ Production check failed:', error.message);
    return results;
  }
}

// Run check if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runProductionCheck()
    .then((results) => {
      process.exit(results.overall ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Check failed:', error);
      process.exit(1);
    });
}

export default runProductionCheck;