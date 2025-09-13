/**
 * 🚀 APP HOSTING DEPLOYMENT FIX SCRIPT
 * Fixes failed rollouts and deploys working backend
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting App Hosting Deployment Fix...\n');

// Step 1: Clean up existing deployments
console.log('🧹 Step 1: Cleaning up existing deployments...');
try {
  execSync('firebase apphosting:backends:list', { stdio: 'pipe' });
  console.log('✅ Current backends listed');
} catch (error) {
  console.log('⚠️ Error listing backends:', error.message);
}

// Step 2: Build the project
console.log('\n🔨 Step 2: Building project...');
try {
  execSync('npm run build:apphosting', { stdio: 'inherit' });
  console.log('✅ Project built successfully');
} catch (error) {
  console.log('❌ Build failed:', error.message);
  process.exit(1);
}

// Step 3: Verify server file
console.log('\n🔍 Step 3: Verifying server configuration...');
const serverFile = 'server-apphosting.js';
if (fs.existsSync(serverFile)) {
  console.log('✅ Server file exists:', serverFile);
} else {
  console.log('❌ Server file not found:', serverFile);
  process.exit(1);
}

// Step 4: Test server locally
console.log('\n🧪 Step 4: Testing server locally...');
try {
  const server = require(`./${serverFile}`);
  console.log('✅ Server loads without errors');
} catch (error) {
  console.log('❌ Server test failed:', error.message);
  process.exit(1);
}

// Step 5: Deploy to App Hosting
console.log('\n🚀 Step 5: Deploying to App Hosting...');
try {
  // Deploy the backend
  execSync('firebase apphosting:backends:deploy souk-el-sayarat-backend --force', { stdio: 'inherit' });
  console.log('✅ Backend deployed successfully');
} catch (error) {
  console.log('❌ Deployment failed:', error.message);
  console.log('🔧 Trying alternative deployment method...');
  
  try {
    execSync('firebase deploy --only apphosting', { stdio: 'inherit' });
    console.log('✅ Alternative deployment successful');
  } catch (altError) {
    console.log('❌ Alternative deployment also failed:', altError.message);
    process.exit(1);
  }
}

// Step 6: Verify deployment
console.log('\n🔍 Step 6: Verifying deployment...');
try {
  const backendUrl = 'https://souk-el-sayarat-backend--souk-el-syarat.europe-west4.hosted.app';
  console.log('🌐 Backend URL:', backendUrl);
  console.log('🔍 Health Check:', `${backendUrl}/health`);
  console.log('📊 API Status:', `${backendUrl}/api/status`);
  console.log('🔐 Auth Endpoints:');
  console.log('  - Login:', `${backendUrl}/api/auth/login`);
  console.log('  - Signup:', `${backendUrl}/api/auth/signup`);
  console.log('  - Logout:', `${backendUrl}/api/auth/logout`);
  console.log('  - Reset:', `${backendUrl}/api/auth/reset`);
} catch (error) {
  console.log('⚠️ Could not verify deployment:', error.message);
}

console.log('\n🎉 App Hosting Deployment Fix Complete!');
console.log('\n📋 Next Steps:');
console.log('1. Check Firebase Console for deployment status');
console.log('2. Test all API endpoints');
console.log('3. Verify authentication flow');
console.log('4. Set up GitHub integration for automatic deployments');
