#!/usr/bin/env node

/**
 * Deployment Script for Souk El-Syarat
 * Handles build optimization and deployment to Firebase
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.cyan}▶${colors.reset} ${colors.bright}${msg}${colors.reset}`),
};

class Deployer {
  constructor(environment = 'production') {
    this.environment = environment;
    this.startTime = Date.now();
  }

  async deploy() {
    try {
      log.step('🚀 Starting deployment process...');
      
      await this.validateEnvironment();
      await this.runTests();
      await this.typeCheck();
      await this.lint();
      await this.build();
      await this.optimizeBuild();
      await this.deployToFirebase();
      
      this.logSuccess();
    } catch (error) {
      this.logError(error);
      process.exit(1);
    }
  }

  async validateEnvironment() {
    log.step('🔍 Validating environment...');
    
    // Check if Firebase CLI is installed
    try {
      execSync('firebase --version', { stdio: 'ignore' });
      log.success('Firebase CLI is installed');
    } catch {
      throw new Error('Firebase CLI is not installed. Run: npm install -g firebase-tools');
    }

    // Check if logged in to Firebase
    try {
      execSync('firebase projects:list', { stdio: 'ignore' });
      log.success('Firebase authentication verified');
    } catch {
      throw new Error('Not logged in to Firebase. Run: firebase login');
    }

    log.success('Environment validation complete');
  }

  async runTests() {
    log.step('🧪 Running tests...');
    
    try {
      execSync('npm run test:run', { stdio: 'inherit' });
      log.success('All tests passed');
    } catch {
      throw new Error('Tests failed. Fix failing tests before deployment.');
    }
  }

  async typeCheck() {
    log.step('🔍 Running TypeScript type check...');
    
    try {
      execSync('npm run type-check', { stdio: 'inherit' });
      log.success('TypeScript type check passed');
    } catch {
      throw new Error('TypeScript type check failed. Fix type errors before deployment.');
    }
  }

  async lint() {
    log.step('🔍 Running ESLint...');
    
    try {
      execSync('npm run lint', { stdio: 'inherit' });
      log.success('Linting passed');
    } catch {
      log.warning('Linting issues found. Attempting to fix...');
      try {
        execSync('npm run lint:fix', { stdio: 'inherit' });
        log.success('Linting issues fixed automatically');
      } catch {
        throw new Error('Linting failed. Fix linting errors before deployment.');
      }
    }
  }

  async build() {
    log.step('🏗️ Building application...');
    
    const buildCommand = this.environment === 'production' 
      ? 'npm run build:production' 
      : 'npm run build';
    
    try {
      execSync(buildCommand, { stdio: 'inherit' });
      log.success('Build completed successfully');
    } catch {
      throw new Error('Build failed. Check build errors above.');
    }
  }

  async optimizeBuild() {
    log.step('⚡ Optimizing build...');
    
    // Add build optimization steps here
    // For example: compress images, minify assets, etc.
    
    log.success('Build optimization complete');
  }

  async deployToFirebase() {
    log.step('🚀 Deploying to Firebase...');
    
    try {
      const deployCommand = this.environment === 'production'
        ? 'firebase deploy --only hosting,firestore:rules,storage:rules'
        : 'firebase deploy --only hosting';
      
      execSync(deployCommand, { stdio: 'inherit' });
      log.success('Firebase deployment complete');
    } catch {
      throw new Error('Firebase deployment failed.');
    }
  }

  logSuccess() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    console.log();
    log.success(`🎉 Deployment completed successfully in ${duration}s`);
    log.info(`Environment: ${this.environment}`);
    log.info('Your application is now live!');
    console.log();
  }

  logError(error) {
    console.log();
    log.error(`💥 Deployment failed: ${error.message}`);
    console.log();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const environment = args.find(arg => ['development', 'staging', 'production'].includes(arg)) || 'production';

// Start deployment
const deployer = new Deployer(environment);
deployer.deploy();
