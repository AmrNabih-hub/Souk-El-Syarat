const sdk = require('node-appwrite');
require('dotenv').config();

const client = new sdk.Client();
client
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const storage = new sdk.Storage(client);

async function listBuckets() {
  try {
    const result = await storage.listBuckets();
    console.log('\n🪣 Existing Storage Buckets:');
    console.log('Total:', result.total);
    result.buckets.forEach(bucket => {
      console.log(`  - ID: ${bucket.$id}, Name: ${bucket.name}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listBuckets();

