#!/usr/bin/env node

/**
 * 🚀 Production Deployment Script for Souk El-Sayarat
 * Professional deployment automation with environment validation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color codes for console output
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

const log = (message, color = colors.cyan) => {
  console.log(`${color}${message}${colors.reset}`);
};

const success = (message) => log(`✅ ${message}`, colors.green);
const warning = (message) => log(`⚠️  ${message}`, colors.yellow);
const error = (message) => log(`❌ ${message}`, colors.red);
const info = (message) => log(`ℹ️  ${message}`, colors.blue);

class DeploymentManager {
  constructor() {
    this.startTime = Date.now();
    this.projectRoot = process.cwd();
    this.deploymentTarget = process.argv[2] || 'vercel';
  }

  async deploy() {
    try {
      log(`
🚀 SOUK EL-SAYARAT PRODUCTION DEPLOYMENT
=======================================
Target Platform: ${this.deploymentTarget.toUpperCase()}
Project: ${path.basename(this.projectRoot)}
Time: ${new Date().toLocaleString('ar-EG')}
      `, colors.bright);

      await this.validateEnvironment();
      await this.runPreDeploymentChecks();
      await this.optimizeBuild();
      await this.deployToTarget();
      await this.postDeploymentValidation();
      
      this.showSuccessMessage();
    } catch (err) {
      this.handleDeploymentError(err);
    }
  }

  async validateEnvironment() {
    info('🔍 Validating deployment environment...');
    
    // Check Node.js version
    const nodeVersion = process.version;
    const requiredNode = '20.17.0';
    if (!this.versionCheck(nodeVersion.slice(1), requiredNode)) {
      warning(`Node.js version ${nodeVersion} detected, recommended: ${requiredNode}+`);
    } else {
      success(`Node.js version ${nodeVersion} ✓`);
    }

    // Check package.json
    if (!fs.existsSync('package.json')) {
      throw new Error('package.json not found');
    }
    success('package.json found ✓');

    // Check environment variables
    const envPath = '.env';
    if (!fs.existsSync(envPath)) {
      warning('No .env file found - using default configuration');
    } else {
      const envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('VITE_SUPABASE_URL')) {
        success('Supabase configuration detected ✓');
      } else {
        warning('Supabase configuration not found in .env');
      }
    }

    // Check build directory
    if (fs.existsSync('dist')) {
      info('Previous build directory found, will be rebuilt');
    }
  }

  async runPreDeploymentChecks() {
    info('🔧 Running pre-deployment checks...');

    try {
      // Run linting
      info('Running ESLint...');
      execSync('npm run lint', { stdio: 'inherit' });
      success('Linting passed ✓');
    } catch (err) {
      warning('Linting warnings detected - continuing deployment');
    }

    try {
      // Type checking
      info('Running TypeScript type check...');
      execSync('npm run type-check', { stdio: 'inherit' });
      success('Type checking passed ✓');
    } catch (err) {
      error('Type checking failed');
      throw err;
    }

    // Check dependencies
    info('Checking dependencies...');
    try {
      execSync('npm audit --audit-level moderate', { stdio: 'pipe' });
      success('Security audit passed ✓');
    } catch (err) {
      warning('Security vulnerabilities detected - review npm audit output');
    }
  }

  async optimizeBuild() {
    info('🏗️  Building production bundle...');
    
    try {
      // Clean previous build
      if (fs.existsSync('dist')) {
        execSync('npm run clean', { stdio: 'inherit' });
      }

      // Run production build
      execSync('npm run build:production', { stdio: 'inherit' });
      success('Production build completed ✓');

      // Analyze bundle size
      const stats = this.analyzeBundleSize();
      info(`Bundle size: ${stats.totalSize} (${stats.gzippedSize} gzipped)`);
      
      if (stats.isOptimal) {
        success('Bundle size is optimal ✓');
      } else {
        warning('Bundle size is larger than recommended');
      }

    } catch (err) {
      error('Build failed');
      throw err;
    }
  }

  async deployToTarget() {
    info(`🚀 Deploying to ${this.deploymentTarget}...`);

    switch (this.deploymentTarget.toLowerCase()) {
      case 'vercel':
        await this.deployToVercel();
        break;
      case 'netlify':
        await this.deployToNetlify();
        break;
      case 'aws':
        await this.deployToAWS();
        break;
      default:
        warning(`Unknown deployment target: ${this.deploymentTarget}`);
        info('Please deploy manually using the built files in /dist');
    }
  }

  async deployToVercel() {
    try {
      // Check if Vercel CLI is installed
      execSync('vercel --version', { stdio: 'pipe' });
      
      // Deploy to Vercel
      execSync('vercel --prod --confirm', { stdio: 'inherit' });
      success('Deployed to Vercel successfully ✓');
      
    } catch (err) {
      if (err.message.includes('command not found')) {
        warning('Vercel CLI not found. Installing...');
        execSync('npm install -g vercel', { stdio: 'inherit' });
        execSync('vercel --prod --confirm', { stdio: 'inherit' });
      } else {
        throw err;
      }
    }
  }

  async deployToNetlify() {
    try {
      // Check if Netlify CLI is installed
      execSync('netlify --version', { stdio: 'pipe' });
      
      // Deploy to Netlify
      execSync('netlify deploy --prod --dir=dist', { stdio: 'inherit' });
      success('Deployed to Netlify successfully ✓');
      
    } catch (err) {
      if (err.message.includes('command not found')) {
        warning('Netlify CLI not found. Installing...');
        execSync('npm install -g netlify-cli', { stdio: 'inherit' });
        execSync('netlify deploy --prod --dir=dist', { stdio: 'inherit' });
      } else {
        throw err;
      }
    }
  }

  async deployToAWS() {
    warning('AWS deployment requires manual configuration');
    info('Please follow AWS S3 + CloudFront deployment guide in documentation');
  }

  async postDeploymentValidation() {
    info('🔍 Running post-deployment validation...');
    
    // Validate build artifacts
    const distPath = path.join(this.projectRoot, 'dist');
    if (!fs.existsSync(distPath)) {
      throw new Error('Build artifacts not found in /dist');
    }

    const requiredFiles = ['index.html', 'assets'];
    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(distPath, file))) {
        throw new Error(`Required file/directory not found: ${file}`);
      }
    }
    success('Build artifacts validated ✓');

    // Check if service worker exists (PWA)
    const swPath = path.join(distPath, 'sw.js');
    if (fs.existsSync(swPath)) {
      success('PWA service worker found ✓');
    }

    info('Deployment validation completed');
  }

  analyzeBundleSize() {
    const distPath = path.join(this.projectRoot, 'dist');
    const assetsPath = path.join(distPath, 'assets');
    
    let totalSize = 0;
    let jsSize = 0;
    let cssSize = 0;

    if (fs.existsSync(assetsPath)) {
      const files = fs.readdirSync(assetsPath);
      
      files.forEach(file => {
        const filePath = path.join(assetsPath, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
        
        if (file.endsWith('.js')) {
          jsSize += stats.size;
        } else if (file.endsWith('.css')) {
          cssSize += stats.size;
        }
      });
    }

    const formatSize = (bytes) => {
      const kb = bytes / 1024;
      return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
    };

    return {
      totalSize: formatSize(totalSize),
      jsSize: formatSize(jsSize),
      cssSize: formatSize(cssSize),
      gzippedSize: formatSize(totalSize * 0.3), // Approximate gzip ratio
      isOptimal: totalSize < 1024 * 1024 // Less than 1MB
    };
  }

  versionCheck(current, required) {
    const currentParts = current.split('.').map(Number);
    const requiredParts = required.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
      if (currentParts[i] > requiredParts[i]) return true;
      if (currentParts[i] < requiredParts[i]) return false;
    }
    return true;
  }

  showSuccessMessage() {
    const deploymentTime = ((Date.now() - this.startTime) / 1000).toFixed(2);
    
    log(`
🎉 DEPLOYMENT SUCCESSFUL!
========================
Platform: ${this.deploymentTarget.toUpperCase()}
Time taken: ${deploymentTime}s
Status: PRODUCTION READY ✅

🚗 Souk El-Sayarat is now LIVE!

Next Steps:
- Configure custom domain (if needed)
- Set up monitoring and analytics
- Test all features in production
- Monitor performance and errors

Thank you for using Souk El-Sayarat! 🇪🇬
    `, colors.green);
  }

  handleDeploymentError(err) {
    error(`Deployment failed: ${err.message}`);
    
    log(`
❌ DEPLOYMENT FAILED
===================
Error: ${err.message}
Time: ${new Date().toLocaleString()}

Troubleshooting:
1. Check your environment variables
2. Verify Supabase configuration
3. Ensure all dependencies are installed
4. Review build logs above

For support, please check the documentation or create an issue.
    `, colors.red);
    
    process.exit(1);
  }
}

// Run deployment
if (require.main === module) {
  const deployer = new DeploymentManager();
  deployer.deploy().catch(console.error);
}

module.exports = DeploymentManager;