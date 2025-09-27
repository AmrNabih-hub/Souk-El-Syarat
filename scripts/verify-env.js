#!/usr/bin/env node

/**
 * 🔍 ENVIRONMENT VERIFICATION SCRIPT
 * Verifies all required environment variables for deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Required environment variables for production
const REQUIRED_ENV_VARS = [
  'VITE_AWS_REGION',
  'VITE_AWS_ACCESS_KEY_ID',
  'VITE_AWS_SECRET_ACCESS_KEY',
  'VITE_AWS_COGNITO_USER_POOL_ID',
  'VITE_AWS_COGNITO_CLIENT_ID',
  'VITE_AWS_COGNITO_IDENTITY_POOL_ID',
  'VITE_AWS_S3_BUCKET',
  'VITE_AWS_S3_REGION',
  'VITE_AWS_DYNAMODB_TABLE_PREFIX',
  'VITE_AWS_DYNAMODB_REGION',
  'VITE_AWS_API_GATEWAY_ENDPOINT',
  'VITE_AWS_API_GATEWAY_REGION',
  'VITE_ENV',
  'VITE_API_BASE_URL',
  'VITE_APP_NAME',
  'VITE_APP_VERSION',
  'VITE_DEFAULT_LANGUAGE',
  'VITE_SUPPORTED_LANGUAGES',
  'VITE_ENABLE_ANALYTICS',
  'VITE_ENABLE_EMULATORS',
  'VITE_ENABLE_DEBUG',
];

// Optional environment variables
const OPTIONAL_ENV_VARS = [
  'VITE_GOOGLE_ANALYTICS_ID',
  'VITE_SENTRY_DSN',
  'VITE_HOTJAR_ID',
];

function verifyEnvironment() {
  console.log('🔍 VERIFYING ENVIRONMENT VARIABLES...\n');
  
  const envPath = path.join(__dirname, '../.env');
  const envExamplePath = path.join(__dirname, '../.env.example');
  
  // Check if .env file exists
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!');
    console.log('💡 Create a .env file based on .env.example');
    process.exit(1);
  }
  
  // Read .env file
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  console.log('📋 ENVIRONMENT VERIFICATION RESULTS:\n');
  console.log('='.repeat(80));
  console.log('VARIABLE'.padEnd(40) + 'STATUS'.padStart(20) + 'VALUE'.padStart(20));
  console.log('='.repeat(80));
  
  let allRequiredPresent = true;
  const missingVars = [];
  const presentVars = [];
  
  // Check required variables
  REQUIRED_ENV_VARS.forEach(varName => {
    const line = envLines.find(line => line.startsWith(`${varName}=`));
    if (line) {
      const value = line.split('=')[1];
      const displayValue = value.length > 15 ? value.substring(0, 15) + '...' : value;
      console.log(varName.padEnd(40) + '✅ PRESENT'.padStart(20) + displayValue.padStart(20));
      presentVars.push(varName);
    } else {
      console.log(varName.padEnd(40) + '❌ MISSING'.padStart(20) + 'NOT SET'.padStart(20));
      missingVars.push(varName);
      allRequiredPresent = false;
    }
  });
  
  console.log('='.repeat(80));
  
  // Check optional variables
  if (OPTIONAL_ENV_VARS.length > 0) {
    console.log('\n📋 OPTIONAL VARIABLES:\n');
    console.log('='.repeat(80));
    console.log('VARIABLE'.padEnd(40) + 'STATUS'.padStart(20) + 'VALUE'.padStart(20));
    console.log('='.repeat(80));
    
    OPTIONAL_ENV_VARS.forEach(varName => {
      const line = envLines.find(line => line.startsWith(`${varName}=`));
      if (line) {
        const value = line.split('=')[1];
        const displayValue = value.length > 15 ? value.substring(0, 15) + '...' : value;
        console.log(varName.padEnd(40) + '✅ PRESENT'.padStart(20) + displayValue.padStart(20));
      } else {
        console.log(varName.padEnd(40) + '⚠️  OPTIONAL'.padStart(20) + 'NOT SET'.padStart(20));
      }
    });
    
    console.log('='.repeat(80));
  }
  
  // Summary
  console.log('\n📊 VERIFICATION SUMMARY:\n');
  console.log(`✅ Present: ${presentVars.length}/${REQUIRED_ENV_VARS.length} required variables`);
  console.log(`❌ Missing: ${missingVars.length} required variables`);
  
  if (missingVars.length > 0) {
    console.log('\n🚨 MISSING REQUIRED VARIABLES:');
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
  }
  
  // Security recommendations
  console.log('\n🔒 SECURITY RECOMMENDATIONS:\n');
  console.log('1. Ensure all AWS credentials are properly configured');
  console.log('2. Use IAM roles with minimal required permissions');
  console.log('3. Enable AWS CloudTrail for audit logging');
  console.log('4. Use AWS Secrets Manager for sensitive data');
  console.log('5. Enable AWS WAF for additional protection');
  
  // Performance recommendations
  console.log('\n⚡ PERFORMANCE RECOMMENDATIONS:\n');
  console.log('1. Enable AWS CloudFront for global CDN');
  console.log('2. Configure S3 bucket for static assets');
  console.log('3. Use AWS Lambda@Edge for edge computing');
  console.log('4. Enable compression for all assets');
  console.log('5. Implement proper caching strategies');
  
  // Final result
  if (allRequiredPresent) {
    console.log('\n🎉 ENVIRONMENT VERIFICATION PASSED!');
    console.log('✅ All required environment variables are present');
    console.log('✅ Ready for deployment');
    process.exit(0);
  } else {
    console.log('\n❌ ENVIRONMENT VERIFICATION FAILED!');
    console.log('❌ Missing required environment variables');
    console.log('❌ Cannot proceed with deployment');
    process.exit(1);
  }
}

verifyEnvironment();
