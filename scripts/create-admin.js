/**
 * Create Admin Account Script
 * Run this after creating a user through the website
 */

async function createAdmin() {
  console.log('📋 INSTRUCTIONS TO CREATE ADMIN:\n');
  
  console.log('1. Go to: https://souk-el-syarat.web.app/register');
  console.log('2. Create an account with your email');
  console.log('3. Go to Firebase Console: https://console.firebase.google.com/project/souk-el-syarat/firestore/data');
  console.log('4. Find your user in the "users" collection');
  console.log('5. Edit the document and change role to: "super_admin"');
  console.log('\n✅ You now have full admin access!');
  
  console.log('\n📊 AVAILABLE ROLES:');
  console.log('- super_admin: Full system control');
  console.log('- admin: High-level management');
  console.log('- vendor: Can sell products');
  console.log('- customer: Regular user (default)');
  
  console.log('\n🔗 ADMIN DASHBOARD:');
  console.log('After setting role to admin, access:');
  console.log('https://souk-el-syarat.web.app/admin');
}

createAdmin();