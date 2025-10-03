const sdk = require('node-appwrite');
require('dotenv').config();

const client = new sdk.Client();
client
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID);

const account = new sdk.Account(client);
const databases = new sdk.Databases(client);

async function testRegistration() {
  try {
    const testEmail = `test${Date.now()}@souk-test.com`;
    const testPassword = 'Test123456!';
    const testName = 'Test User';
    
    console.log('\n🧪 Testing User Registration...');
    console.log(`Email: ${testEmail}`);
    
    // Step 1: Create auth account
    console.log('\n1️⃣ Creating auth account...');
    const authUser = await account.create(
      sdk.ID.unique(),
      testEmail,
      testPassword,
      testName
    );
    console.log('✅ Auth account created:', authUser.$id);
    
    // Step 2: Create session (login)
    console.log('\n2️⃣ Creating session...');
    const session = await account.createEmailPasswordSession(testEmail, testPassword);
    console.log('✅ Session created');
    
    // Step 3: Create user profile in database
    console.log('\n3️⃣ Creating user profile in database...');
    const userProfile = await databases.createDocument(
      process.env.VITE_APPWRITE_DATABASE_ID,
      'users',
      sdk.ID.unique(),
      {
        userId: authUser.$id,
        email: testEmail,
        displayName: testName,
        role: 'customer',
        isActive: true,
        emailVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        preferences: JSON.stringify({
          language: 'ar',
          currency: 'EGP',
          notifications: { email: true, sms: false, push: true }
        })
      }
    );
    console.log('✅ User profile created in database');
    
    console.log('\n🎉 Registration test PASSED!');
    console.log(`\n✅ You can now login with:`);
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    
  } catch (error) {
    console.error('\n❌ Registration test FAILED:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

testRegistration();

