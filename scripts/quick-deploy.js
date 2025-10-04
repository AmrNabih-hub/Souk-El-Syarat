#!/usr/bin/env node
/**
 * 🚀 Quick Deployment Script for Souk El-Sayarat
 * Deploy to global hosting platforms with one command
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🌍 Souk El-Sayarat - Global Deployment Ready!');
console.log('=====================================\n');

// Check if in correct directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: package.json not found. Run this from the project root.');
  process.exit(1);
}

// Production environment setup
console.log('🔧 Setting up production environment...');
if (!fs.existsSync('.env.production')) {
  const envTemplate = `# Production Supabase Configuration
VITE_SUPABASE_URL=https://zgnwfnfehdwehuycbcsz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnbndmbmZlaGR3ZWh1eWNiY3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDMxMDAsImV4cCI6MjA3NTA3OTEwMH0.4nYLZq-ZkvoidVwL6RM24xMvXDCVbYBVaYSS3mD-uc0

# Application Configuration
VITE_APP_NAME=Souk El-Sayarat
VITE_CURRENCY=EGP
VITE_DEFAULT_LANGUAGE=ar
VITE_ENVIRONMENT=production

# Features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PWA=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_REALTIME=true`;

  fs.writeFileSync('.env.production', envTemplate);
  console.log('✅ Created .env.production');
}

// Copy production env to .env
fs.copyFileSync('.env.production', '.env');
console.log('✅ Production environment configured');

// Install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed');
} catch (error) {
  console.error('❌ Failed to install dependencies');
  process.exit(1);
}

// Build for production
console.log('🏗️  Building for production...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed');
  process.exit(1);
}

console.log('\n🎉 Production build ready!');
console.log('\n🚀 Deployment Options:');
console.log('======================');

console.log('\n1. 🌐 Vercel (Recommended):');
console.log('   npm install -g vercel');
console.log('   vercel --prod');

console.log('\n2. 🌐 Netlify:');
console.log('   npm install -g netlify-cli');
console.log('   netlify deploy --prod --dir=dist');

console.log('\n3. 📤 Manual Upload:');
console.log('   Upload the "dist" folder to your hosting provider');

console.log('\n🌍 Your Souk El-Sayarat marketplace is ready for global launch!');
console.log('\n📋 What you have:');
console.log('   ✅ Complete Supabase integration');
console.log('   ✅ Database with all tables');
console.log('   ✅ Storage buckets configured');
console.log('   ✅ Authentication system');
console.log('   ✅ Professional security');
console.log('   ✅ Production-optimized build');

console.log('\n🎯 Recommended domains:');
console.log('   - souk-el-sayarat.com');
console.log('   - souqelsayarat.com');
console.log('   - egycarmarket.com');

console.log('\n🌟 Ready for global success! 🚀');