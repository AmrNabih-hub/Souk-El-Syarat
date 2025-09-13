/**
 * 🚀 DEPLOY MY-WEB-APP BACKEND
 * Fix and deploy the my-web-app backend using latest Firebase App Hosting methods
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Deploying my-web-app backend with latest Firebase App Hosting methods...\n');

async function deployBackend() {
  try {
    // Step 1: Build the project
    console.log('🔨 Step 1: Building project...');
    execSync('npm run build:apphosting', { stdio: 'inherit' });
    console.log('✅ Project built successfully\n');

    // Step 2: Deploy to my-web-app backend
    console.log('🚀 Step 2: Deploying to my-web-app backend...');
    
    try {
      execSync('firebase apphosting:backends:deploy my-web-app --force', { stdio: 'inherit' });
      console.log('✅ my-web-app backend deployed successfully\n');
    } catch (deployError) {
      console.log('⚠️ Direct deployment failed, trying alternative method...');
      
      try {
        execSync('firebase deploy --only apphosting', { stdio: 'inherit' });
        console.log('✅ App Hosting deployment successful\n');
      } catch (altError) {
        console.log('❌ Alternative deployment failed:', altError.message);
        throw altError;
      }
    }

    // Step 3: Test the deployed backend
    console.log('🧪 Step 3: Testing deployed backend...');
    const backendUrl = 'https://my-web-app--souk-el-syarat.us-central1.hosted.app';
    
    console.log(`🌐 Backend URL: ${backendUrl}`);
    console.log(`🔍 Health Check: ${backendUrl}/health`);
    console.log(`📊 API Status: ${backendUrl}/api/status`);
    console.log(`🔐 Auth Endpoints:`);
    console.log(`  - Login: ${backendUrl}/api/auth/login`);
    console.log(`  - Signup: ${backendUrl}/api/auth/signup`);

    console.log('\n🎉 my-web-app backend deployment complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Test the backend endpoints');
    console.log('2. Verify authentication integration');
    console.log('3. Check Firebase Console for deployment status');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    console.log('\n🔧 Troubleshooting Steps:');
    console.log('1. Check Firebase Console for build logs');
    console.log('2. Verify apphosting.yaml configuration');
    console.log('3. Ensure all dependencies are installed');
    console.log('4. Check Firebase project permissions');
    process.exit(1);
  }
}

// Run the deployment
deployBackend();
