const sdk = require('node-appwrite');
require('dotenv').config();

const client = new sdk.Client();
client
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new sdk.Databases(client);

async function listDatabases() {
  try {
    const result = await databases.list();
    console.log('\n📊 Existing Databases:');
    console.log('Total:', result.total);
    result.databases.forEach(db => {
      console.log(`  - ID: ${db.$id}, Name: ${db.name}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listDatabases();

