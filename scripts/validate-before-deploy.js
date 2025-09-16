import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Starting pre-deployment validation...');

// Validation functions
function validateEnvironment() {
  console.log('📋 Validating environment configuration...');
  
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(envVar => console.error(`   - ${envVar}`));
    return false;
  }
  
  console.log('✅ Environment variables validated');
  return true;
}

function validateDependencies() {
  console.log('📦 Validating dependencies...');
  
  try {
    execSync('npm ls --depth=0', { stdio: 'pipe' });
    console.log('✅ Dependencies validated');
    return true;
  } catch (error) {
    console.error('❌ Dependency validation failed:', error.message);
    return false;
  }
}

function validateTypeScript() {
  console.log('🔧 Validating TypeScript compilation...');
  
  try {
    execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
    console.log('✅ TypeScript compilation successful');
    return true;
  } catch (error) {
    console.error('❌ TypeScript compilation failed');
    return false;
  }
}

function validateLinting() {
  console.log('🧹 Validating code quality...');
  
  try {
    execSync('npm run lint:ci', { stdio: 'pipe' });
    console.log('✅ Linting passed');
    return true;
  } catch (error) {
    console.error('❌ Linting failed');
    return false;
  }
}

function validateTests() {
  console.log('🧪 Validating tests...');
  
  try {
    execSync('npm run test:unit -- --run --passWithNoTests', { stdio: 'pipe' });
    console.log('✅ Tests passed');
    return true;
  } catch (error) {
    console.error('❌ Tests failed');
    return false;
  }
}

function validateBuild() {
  console.log('🏗️ Validating production build...');
  
  try {
    execSync('npm run build:ci', { stdio: 'pipe' });
    console.log('✅ Build successful');
    return true;
  } catch (error) {
    console.error('❌ Build failed');
    return false;
  }
}

function validateFirebaseConfig() {
  console.log('🔥 Validating Firebase configuration...');
  
  const firebaseConfigPath = path.join(__dirname, '..', 'firebase.json');
  const apphostingConfigPath = path.join(__dirname, '..', 'apphosting.yaml');
  
  if (!fs.existsSync(firebaseConfigPath)) {
    console.error('❌ firebase.json not found');
    return false;
  }
  
  if (!fs.existsSync(apphostingConfigPath)) {
    console.error('❌ apphosting.yaml not found');
    return false;
  }
  
  console.log('✅ Firebase configuration validated');
  return true;
}

// Main validation function
function validateBeforeDeploy() {
  const validations = [
    validateEnvironment,
    validateDependencies,
    validateTypeScript,
    validateLinting,
    validateTests,
    validateBuild,
    validateFirebaseConfig
  ];

  let allPassed = true;

  validations.forEach(validation => {
    const passed = validation();
    if (!passed) {
      allPassed = false;
    }
    console.log(''); // Add spacing between validations
  });

  if (allPassed) {
    console.log('🎉 All validations passed! Ready for deployment.');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Review the deployment checklist');
    console.log('   2. Deploy to staging first: npm run deploy:staging');
    console.log('   3. Test thoroughly in staging');
    console.log('   4. Deploy to production: npm run deploy:prod');
    process.exit(0);
  } else {
    console.error('❌ Some validations failed. Please fix the issues above before deploying.');
    process.exit(1);
  }
}

// Run validation if called directly
if (process.argv[1] === __filename) {
  validateBeforeDeploy();
}

export { validateBeforeDeploy };