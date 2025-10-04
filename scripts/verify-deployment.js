#!/usr/bin/env node

/**
 * 🔍 Deployment Verification Script
 * Professional verification for Souk El-Sayarat marketplace
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

console.log('🔍 Souk El-Sayarat - Deployment Verification');
console.log('===========================================\n');

let failureCount = 0;
const warnings = [];

// Check functions
function checkFileExists(filePath, name) {
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${name}: ${exists ? 'Found' : 'Missing'}`);
  if (!exists) failureCount++;
  return exists;
}

function checkDirectoryExists(dirPath, name) {
  const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  console.log(`${exists ? '✅' : '❌'} ${name}: ${exists ? 'Found' : 'Missing'}`);
  if (!exists) failureCount++;
  return exists;
}

function checkEnvironmentFile() {
  console.log('\n📋 Environment Configuration:');
  
  const envExample = checkFileExists('.env.example', '.env.example template');
  const envLocal = fs.existsSync('.env.local');
  const envProd = fs.existsSync('.env.production');
  
  console.log(`${envLocal ? '✅' : '⚠️'} .env.local: ${envLocal ? 'Found' : 'Not found (optional for development)'}`);
  console.log(`${envProd ? '✅' : '⚠️'} .env.production: ${envProd ? 'Found' : 'Not found (should be set in Vercel)'}`);
  
  if (!envLocal && !envProd) {
    warnings.push('No environment files found. Ensure Vercel environment variables are configured.');
  }
}

function checkPackageJson() {
  console.log('\n📦 Package Configuration:');
  
  if (!checkFileExists('package.json', 'package.json')) return;
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Check essential scripts
  const requiredScripts = ['dev', 'build', 'preview'];
  const hasAllScripts = requiredScripts.every(script => {
    const exists = packageJson.scripts && packageJson.scripts[script];
    console.log(`${exists ? '✅' : '❌'} Script "${script}": ${exists ? 'Configured' : 'Missing'}`);
    if (!exists) failureCount++;
    return exists;
  });
  
  // Check essential dependencies
  const requiredDeps = ['react', 'react-dom', 'vite', '@supabase/supabase-js'];
  requiredDeps.forEach(dep => {
    const exists = (packageJson.dependencies && packageJson.dependencies[dep]) || 
                   (packageJson.devDependencies && packageJson.devDependencies[dep]);
    console.log(`${exists ? '✅' : '❌'} Dependency "${dep}": ${exists ? 'Installed' : 'Missing'}`);
    if (!exists) failureCount++;
  });
}

function checkBuildConfiguration() {
  console.log('\n🏗️ Build Configuration:');
  
  checkFileExists('vite.config.ts', 'Vite configuration');
  checkFileExists('vercel.json', 'Vercel configuration');
  checkFileExists('tsconfig.json', 'TypeScript configuration');
  checkFileExists('tailwind.config.js', 'Tailwind configuration');
  checkFileExists('postcss.config.js', 'PostCSS configuration');
}

function checkSourceStructure() {
  console.log('\n📁 Source Structure:');
  
  const requiredDirs = [
    'src',
    'src/components',
    'src/pages',
    'src/services',
    'src/contexts',
    'src/hooks',
    'src/types',
    'src/utils',
    'src/config'
  ];
  
  requiredDirs.forEach(dir => {
    checkDirectoryExists(dir, `Directory "${dir}"`);
  });
  
  // Check essential files
  const requiredFiles = [
    'src/main.tsx',
    'src/App.tsx',
    'src/index.css',
    'src/config/supabase.config.ts'
  ];
  
  requiredFiles.forEach(file => {
    checkFileExists(file, `File "${file}"`);
  });
}

function checkSupabaseConfiguration() {
  console.log('\n🗄️ Supabase Configuration:');
  
  const configExists = checkFileExists('src/config/supabase.config.ts', 'Supabase config');
  
  if (configExists) {
    const configContent = fs.readFileSync('src/config/supabase.config.ts', 'utf8');
    
    const checks = [
      { pattern: /VITE_SUPABASE_URL/, name: 'URL environment variable reference' },
      { pattern: /VITE_SUPABASE_ANON_KEY/, name: 'Anon key environment variable reference' },
      { pattern: /createClient/, name: 'Supabase client creation' },
      { pattern: /export.*supabase/, name: 'Client export' }
    ];
    
    checks.forEach(check => {
      const exists = check.pattern.test(configContent);
      console.log(`${exists ? '✅' : '❌'} ${check.name}: ${exists ? 'Configured' : 'Missing'}`);
      if (!exists) failureCount++;
    });
  }
  
  // Check migration files
  const migrationDir = 'supabase/migrations';
  if (fs.existsSync(migrationDir)) {
    const migrations = fs.readdirSync(migrationDir).filter(f => f.endsWith('.sql'));
    console.log(`✅ Database migrations: ${migrations.length} found`);
  } else {
    console.log('⚠️ Database migrations: Not found (optional)');
    warnings.push('No database migrations found. Consider adding schema migrations.');
  }
}

function checkBuildOutput() {
  console.log('\n🔍 Build Output Verification:');
  
  const distExists = checkDirectoryExists('dist', 'Build output directory');
  
  if (distExists) {
    const requiredBuildFiles = [
      'dist/index.html',
    ];
    
    requiredBuildFiles.forEach(file => {
      checkFileExists(file, `Build file "${path.basename(file)}"`);
    });
    
    // Check for assets
    const assetsDir = path.join('dist', 'assets');
    if (fs.existsSync(assetsDir)) {
      const jsFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.js'));
      const cssFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.css'));
      
      console.log(`✅ JavaScript files: ${jsFiles.length} found`);
      console.log(`✅ CSS files: ${cssFiles.length} found`);
      
      if (jsFiles.length === 0) {
        console.log('❌ No JavaScript files found in build');
        failureCount++;
      }
      
      if (cssFiles.length === 0) {
        console.log('❌ No CSS files found in build');
        failureCount++;
      }
    } else {
      console.log('❌ Assets directory not found');
      failureCount++;
    }
  }
}

function checkCIConfiguration() {
  console.log('\n🔄 CI/CD Configuration:');
  
  const githubDir = '.github/workflows';
  if (checkDirectoryExists(githubDir, 'GitHub workflows directory')) {
    const workflows = fs.readdirSync(githubDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
    console.log(`✅ GitHub workflows: ${workflows.length} found`);
    
    workflows.forEach(workflow => {
      console.log(`  📄 ${workflow}`);
    });
    
    // Check for Vercel-specific workflows
    const hasVercelWorkflow = workflows.some(w => w.includes('vercel'));
    if (hasVercelWorkflow) {
      console.log('✅ Vercel deployment workflow: Found');
    } else {
      console.log('⚠️ Vercel deployment workflow: Not found');
      warnings.push('Consider adding Vercel-specific deployment workflow.');
    }
  }
}

function generateReport() {
  console.log('\n📊 DEPLOYMENT VERIFICATION REPORT');
  console.log('================================');
  
  const status = failureCount === 0 ? 'READY' : 'ISSUES FOUND';
  const emoji = failureCount === 0 ? '✅' : '❌';
  
  console.log(`${emoji} Status: ${status}`);
  console.log(`📊 Issues: ${failureCount}`);
  console.log(`⚠️ Warnings: ${warnings.length}`);
  
  if (warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    warnings.forEach((warning, index) => {
      console.log(`   ${index + 1}. ${warning}`);
    });
  }
  
  if (failureCount === 0) {
    console.log('\n🎉 SUCCESS: Your Souk El-Sayarat marketplace is ready for deployment!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Ensure environment variables are set in Vercel');
    console.log('   2. Configure Supabase project settings');
    console.log('   3. Deploy to Vercel');
    console.log('   4. Test the deployed application');
  } else {
    console.log('\n❌ FAILED: Please fix the issues above before deploying.');
    process.exit(1);
  }
}

// Main execution
async function main() {
  try {
    checkEnvironmentFile();
    checkPackageJson();
    checkBuildConfiguration();
    checkSourceStructure();
    checkSupabaseConfiguration();
    checkCIConfiguration();
    
    // Try to build if not already built
    if (!fs.existsSync('dist')) {
      console.log('\n🏗️ Running build to verify output...');
      
      const buildProcess = spawn('npm', ['run', 'build'], { stdio: 'inherit' });
      
      buildProcess.on('close', (code) => {
        if (code === 0) {
          checkBuildOutput();
          generateReport();
        } else {
          console.log('\n❌ Build failed. Please fix build errors before deploying.');
          process.exit(1);
        }
      });
    } else {
      checkBuildOutput();
      generateReport();
    }
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    process.exit(1);
  }
}

main();