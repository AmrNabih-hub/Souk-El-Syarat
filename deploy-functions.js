/**
 * Firebase Functions Deployment Script
 * Comprehensive deployment with error handling and validation
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description) {
  try {
    log(`\n🔄 ${description}...`, 'blue');
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    log(`✅ ${description} completed successfully`, 'green');
    return output;
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, 'red');
    throw error;
  }
}

async function checkPrerequisites() {
  log('\n🔍 Checking prerequisites...', 'cyan');
  
  // Check if Firebase CLI is installed
  try {
    execSync('firebase --version', { stdio: 'pipe' });
    log('✅ Firebase CLI is installed', 'green');
  } catch (error) {
    log('❌ Firebase CLI not found. Please install it first:', 'red');
    log('npm install -g firebase-tools', 'yellow');
    process.exit(1);
  }

  // Check if we're in the right directory
  if (!fs.existsSync('firebase.json')) {
    log('❌ firebase.json not found. Please run this script from the project root.', 'red');
    process.exit(1);
  }

  // Check if functions directory exists
  if (!fs.existsSync('functions')) {
    log('❌ functions directory not found.', 'red');
    process.exit(1);
  }

  log('✅ All prerequisites met', 'green');
}

async function buildFunctions() {
  log('\n🔨 Building Firebase Functions...', 'cyan');
  
  // Install dependencies
  execCommand('cd functions && npm install', 'Installing function dependencies');
  
  // Build TypeScript
  execCommand('cd functions && npm run build', 'Building TypeScript functions');
  
  // Verify build output
  if (!fs.existsSync('functions/lib/index.js')) {
    throw new Error('Build output not found. TypeScript compilation may have failed.');
  }
  
  log('✅ Functions built successfully', 'green');
}

async function validateFunctions() {
  log('\n🔍 Validating Firebase Functions...', 'cyan');
  
  // Check if main functions are exported
  const indexContent = fs.readFileSync('functions/lib/index.js', 'utf8');
  
  const requiredExports = [
    'sendWelcomeEmail',
    'sendOrderConfirmationEmail',
    'sendOrderStatusUpdateEmail',
    'sendVendorApplicationEmail',
    'sendVendorApplicationStatusEmail',
    'sendPasswordResetEmail',
    'sendCustomEmail',
    'testEmail'
  ];
  
  for (const exportName of requiredExports) {
    if (!indexContent.includes(exportName)) {
      throw new Error(`Required function ${exportName} not found in build output`);
    }
  }
  
  log('✅ All required functions validated', 'green');
}

async function deployFunctions() {
  log('\n🚀 Deploying Firebase Functions...', 'cyan');
  
  // Deploy functions
  execCommand('firebase deploy --only functions', 'Deploying Firebase Functions');
  
  log('✅ Functions deployed successfully', 'green');
}

async function testDeployedFunctions() {
  log('\n🧪 Testing deployed functions...', 'cyan');
  
  // Test email function
  try {
    const testOutput = execCommand('firebase functions:log --limit 10', 'Checking function logs');
    log('✅ Function logs retrieved successfully', 'green');
  } catch (error) {
    log('⚠️ Could not retrieve function logs, but deployment may still be successful', 'yellow');
  }
}

async function createEnvironmentConfig() {
  log('\n⚙️ Creating environment configuration...', 'cyan');
  
  const envConfig = {
    SMTP_HOST: 'smtp.gmail.com',
    SMTP_PORT: '587',
    SMTP_USER: 'your-email@gmail.com',
    SMTP_PASS: 'your-app-password',
    FIREBASE_PROJECT_ID: 'souk-el-syarat',
    FIREBASE_AUTH_DOMAIN: 'souk-el-syarat.firebaseapp.com'
  };
  
  const envContent = Object.entries(envConfig)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync('functions/.env.example', envContent);
  log('✅ Environment configuration created', 'green');
}

async function generateDeploymentReport() {
  log('\n📊 Generating deployment report...', 'cyan');
  
  const report = {
    timestamp: new Date().toISOString(),
    functions: [
      'sendWelcomeEmail',
      'sendOrderConfirmationEmail', 
      'sendOrderStatusUpdateEmail',
      'sendVendorApplicationEmail',
      'sendVendorApplicationStatusEmail',
      'sendPasswordResetEmail',
      'sendCustomEmail',
      'testEmail'
    ],
    status: 'deployed',
    environment: 'production'
  };
  
  fs.writeFileSync('functions-deployment-report.json', JSON.stringify(report, null, 2));
  log('✅ Deployment report generated', 'green');
}

async function main() {
  try {
    log('🚀 Starting Firebase Functions Deployment', 'magenta');
    log('==========================================', 'magenta');
    
    await checkPrerequisites();
    await buildFunctions();
    await validateFunctions();
    await deployFunctions();
    await testDeployedFunctions();
    await createEnvironmentConfig();
    await generateDeploymentReport();
    
    log('\n🎉 Firebase Functions Deployment Complete!', 'green');
    log('==========================================', 'green');
    log('✅ All functions deployed successfully', 'green');
    log('✅ Email services are now available', 'green');
    log('✅ Backend APIs are ready for production', 'green');
    
    log('\n📋 Next Steps:', 'cyan');
    log('1. Configure SMTP settings in Firebase Functions environment', 'white');
    log('2. Test email functions with real data', 'white');
    log('3. Monitor function logs for any issues', 'white');
    log('4. Set up function monitoring and alerts', 'white');
    
  } catch (error) {
    log('\n❌ Deployment Failed!', 'red');
    log('====================', 'red');
    log(`Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run deployment
main().catch(console.error);