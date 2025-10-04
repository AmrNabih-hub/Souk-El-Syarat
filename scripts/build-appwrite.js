#!/usr/bin/env node

/**
 * 🚀 BUILD FOR APPWRITE DEPLOYMENT
 * Optimized build for Appwrite Sites
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Building for Appwrite deployment...');

try {
  // 1. Clean previous build
  console.log('🧹 Cleaning previous build...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // 2. Copy production environment
  console.log('📋 Setting up production environment...');
  if (fs.existsSync('.env.production.local')) {
    fs.copyFileSync('.env.production.local', '.env.local');
  }

  // 3. Build with Vite
  console.log('🔨 Building with Vite...');
  execSync('npm run build:production', { stdio: 'inherit' });

  // 4. Verify build output
  console.log('✅ Verifying build output...');
  const distStats = fs.statSync('dist');
  if (!distStats.isDirectory()) {
    throw new Error('Build output directory not found');
  }

  const indexPath = path.join('dist', 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error('index.html not found in build output');
  }

  console.log('✅ Build completed successfully!');
  console.log('📁 Build output ready in ./dist');
  console.log('🚀 Ready for Appwrite Sites deployment');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}