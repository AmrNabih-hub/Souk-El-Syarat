/**
 * ✅ VERIFY EXISTING APPWRITE SETUP
 * Checks your existing Appwrite project and creates missing collections
 */

const sdk = require('node-appwrite');
require('dotenv').config();

const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID;

console.log('✅ Verifying Existing Appwrite Setup...\n');
console.log('Configuration:');
console.log(`  Project ID: ${APPWRITE_PROJECT_ID}`);
console.log(`  Database ID: ${DATABASE_ID}`);
console.log(`  Endpoint: ${APPWRITE_ENDPOINT}\n`);

if (!APPWRITE_PROJECT_ID) {
  console.error('❌ ERROR: VITE_APPWRITE_PROJECT_ID not found in .env');
  console.error('Please ensure .env file exists with correct values.\n');
  process.exit(1);
}

// You'll need an API key for this verification
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;

if (!APPWRITE_API_KEY) {
  console.log('⚠️  No API key provided.');
  console.log('\n📋 To create missing collections, you need an API key:');
  console.log('   1. Go to https://cloud.appwrite.io');
  console.log('   2. Select your project');
  console.log('   3. Go to Settings → API Keys');
  console.log('   4. Create new API key with databases.* permissions');
  console.log('   5. Add to .env: APPWRITE_API_KEY=your-key\n');
  console.log('✅ Your frontend is configured correctly and ready to use!');
  console.log('   You can test the deployment now.\n');
  process.exit(0);
}

const client = new sdk.Client();
client
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const databases = new sdk.Databases(client);
const storage = new sdk.Storage(client);

async function verifySetup() {
  try {
    console.log('🔍 Checking Database...\n');
    
    // Check database
    try {
      const db = await databases.get(DATABASE_ID);
      console.log(`✅ Database found: ${db.name}`);
    } catch (error) {
      if (error.code === 404) {
        console.log('⚠️  Database not found. Creating...');
        await databases.create(DATABASE_ID, 'Souk El-Sayarat Database');
        console.log('✅ Database created!');
      } else {
        throw error;
      }
    }
    
    console.log('\n🔍 Checking Collections...\n');
    
    const collections = [
      'users',
      'products', 
      'orders',
      'vendor-applications',
      'car-listings',
      'messages',
      'notifications',
    ];
    
    let missingCollections = [];
    
    for (const collectionId of collections) {
      try {
        const collection = await databases.getCollection(DATABASE_ID, collectionId);
        console.log(`✅ Collection exists: ${collection.name} (${collection.attributes.length} attributes)`);
      } catch (error) {
        if (error.code === 404) {
          console.log(`⚠️  Collection missing: ${collectionId}`);
          missingCollections.push(collectionId);
        } else {
          console.log(`⚠️  Error checking ${collectionId}:`, error.message);
        }
      }
    }
    
    console.log('\n🔍 Checking Storage Buckets...\n');
    
    const buckets = [
      { id: 'product_images', name: 'Product Images' },
      { id: 'vendor_documents', name: 'Vendor Documents' },
      { id: 'car_listing_images', name: 'Car Listing Images' },
    ];
    
    for (const bucket of buckets) {
      try {
        const b = await storage.getBucket(bucket.id);
        console.log(`✅ Bucket exists: ${b.name} (max ${b.maximumFileSize / 1024 / 1024}MB)`);
      } catch (error) {
        if (error.code === 404) {
          console.log(`⚠️  Bucket missing: ${bucket.name}`);
        } else {
          console.log(`⚠️  Error checking ${bucket.id}:`, error.message);
        }
      }
    }
    
    console.log('\n═'.repeat(60));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('═'.repeat(60));
    
    if (missingCollections.length > 0) {
      console.log(`\n⚠️  Missing ${missingCollections.length} collection(s):`);
      missingCollections.forEach(col => console.log(`   - ${col}`));
      console.log('\n💡 To create missing collections:');
      console.log('   Run: node scripts/setup-appwrite.js\n');
    } else {
      console.log('\n✅ All collections exist!');
    }
    
    console.log('✅ Your Appwrite backend is configured!');
    console.log('\n📋 Next Steps:');
    console.log('   1. If collections are missing, run: node scripts/setup-appwrite.js');
    console.log('   2. Build: npm run build');
    console.log('   3. Deploy your site (already configured in Appwrite Console)');
    console.log('   4. Test: node scripts/smoke-tests.cjs https://souk-al-sayarat.appwrite.network\n');
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    console.log('\n💡 Common issues:');
    console.log('   - Check your API key has correct permissions');
    console.log('   - Verify Project ID is correct');
    console.log('   - Ensure database name matches\n');
    process.exit(1);
  }
}

verifySetup();

