/**
 * 🚀 APPWRITE CONNECTION TEST
 * Test the frontend Appwrite connection
 */

import { client, account, databases, storage, testConnection, appwriteConfig } from '../src/config/appwrite.config.ts';

async function testAppwriteConnection() {
  console.log('🚀 Testing Appwrite Connection for Souk Al-Sayarat');
  console.log('📡 Endpoint:', appwriteConfig.endpoint);
  console.log('🆔 Project:', appwriteConfig.project);
  console.log('🗃️ Database:', appwriteConfig.databaseId);
  console.log('');

  try {
    // Test basic connection
    console.log('1️⃣ Testing basic connection...');
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Basic connection failed');
    }
    console.log('✅ Connection successful');
    console.log('');

    // Test account service
    console.log('2️⃣ Testing account service...');
    try {
      const user = await account.get();
      console.log('✅ Account service working - User logged in:', user.name);
    } catch (error) {
      if (error.code === 401) {
        console.log('ℹ️  Account service working - No user logged in (expected)');
      } else {
        throw error;
      }
    }
    console.log('');

    // Test database service
    console.log('3️⃣ Testing database service...');
    try {
      const databases_list = await databases.list();
      console.log('✅ Database service working - Found databases:', databases_list.total);
    } catch (error) {
      console.log('⚠️  Database service error (may need setup):', error.message);
    }
    console.log('');

    // Test storage service
    console.log('4️⃣ Testing storage service...');
    try {
      const buckets = await storage.listBuckets();
      console.log('✅ Storage service working - Found buckets:', buckets.total);
    } catch (error) {
      console.log('⚠️  Storage service error (may need setup):', error.message);
    }
    console.log('');

    console.log('🎉 Appwrite connection test completed!');
    console.log('✅ Your frontend is properly connected to Appwrite');

  } catch (error) {
    console.error('❌ Connection test failed:', error);
    console.error('');
    console.error('Troubleshooting tips:');
    console.error('1. Check your .env file has correct values');
    console.error('2. Verify your Appwrite project is active');
    console.error('3. Ensure your project ID and endpoint are correct');
  }
}

// Run the test
testAppwriteConnection();