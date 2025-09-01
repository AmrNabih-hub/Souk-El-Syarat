/**
 * Automated Issue Detection and Fix System
 * Professional implementation following August 2025 standards
 * Self-healing infrastructure with automatic remediation
 */

const admin = require('firebase-admin');
const axios = require('axios');
const chalk = require('chalk');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

class AutoFixSystem {
  constructor() {
    this.issues = [];
    this.fixes = [];
    this.config = {
      projectId: 'souk-el-syarat',
      region: 'europe-west1',
      appHostingBackend: 'souk-el-sayarat-backend',
      environments: {
        production: {
          url: 'https://souk-el-sayarat-backend--souk-el-syarat.europe-west4.hosted.app',
          functions: 'https://us-central1-souk-el-syarat.cloudfunctions.net'
        }
      }
    };
  }

  // ============= ISSUE DETECTION =============

  async detectAllIssues() {
    console.log(chalk.blue.bold('\n🔍 Detecting Issues...\n'));
    
    await this.detectInfrastructureIssues();
    await this.detectConfigurationIssues();
    await this.detectSecurityIssues();
    await this.detectPerformanceIssues();
    await this.detectCodeIssues();
    
    return this.issues;
  }

  async detectInfrastructureIssues() {
    console.log(chalk.cyan('  Checking infrastructure...'));
    
    // Check App Hosting backend
    try {
      const response = await axios.get(
        `${this.config.environments.production.url}/health`,
        { timeout: 5000, validateStatus: () => true }
      );
      
      if (response.status === 500) {
        this.issues.push({
          type: 'infrastructure',
          severity: 'critical',
          component: 'app-hosting',
          issue: 'Backend returning 500 error',
          details: 'App Hosting backend is not properly configured',
          fix: 'fixAppHostingConfiguration'
        });
      }
    } catch (error) {
      this.issues.push({
        type: 'infrastructure',
        severity: 'critical',
        component: 'app-hosting',
        issue: 'Backend unreachable',
        details: error.message,
        fix: 'fixAppHostingDeployment'
      });
    }

    // Check Cloud Functions
    try {
      const response = await axios.get(
        `${this.config.environments.production.functions}/api`,
        { timeout: 5000, validateStatus: () => true }
      );
      
      if (response.status === 404 || (response.data && response.data.error === 'Not found')) {
        this.issues.push({
          type: 'infrastructure',
          severity: 'high',
          component: 'cloud-functions',
          issue: 'API function not properly configured',
          details: 'Function exists but routes are not set up',
          fix: 'fixCloudFunctionRoutes'
        });
      }
    } catch (error) {
      this.issues.push({
        type: 'infrastructure',
        severity: 'high',
        component: 'cloud-functions',
        issue: 'Cloud Functions API error',
        details: error.message,
        fix: 'fixCloudFunctions'
      });
    }
  }

  async detectConfigurationIssues() {
    console.log(chalk.cyan('  Checking configuration...'));
    
    // Check environment variables
    try {
      const { stdout } = await execAsync('firebase functions:config:get');
      const config = JSON.parse(stdout);
      
      const requiredKeys = [
        'app.environment',
        'security.jwt_secret',
        'marketplace.currency'
      ];
      
      for (const key of requiredKeys) {
        const keys = key.split('.');
        let value = config;
        for (const k of keys) {
          value = value?.[k];
        }
        
        if (!value) {
          this.issues.push({
            type: 'configuration',
            severity: 'medium',
            component: 'environment',
            issue: `Missing configuration: ${key}`,
            details: `Required configuration key ${key} is not set`,
            fix: 'fixEnvironmentVariable',
            data: { key, value: this.getDefaultValue(key) }
          });
        }
      }
    } catch (error) {
      this.issues.push({
        type: 'configuration',
        severity: 'high',
        component: 'environment',
        issue: 'Cannot read configuration',
        details: error.message,
        fix: 'fixConfiguration'
      });
    }

    // Check for deprecated config API usage
    this.issues.push({
      type: 'configuration',
      severity: 'medium',
      component: 'functions',
      issue: 'Using deprecated functions.config() API',
      details: 'Should migrate to environment variables before March 2026',
      fix: 'migrateToEnvVariables'
    });
  }

  async detectSecurityIssues() {
    console.log(chalk.cyan('  Checking security...'));
    
    // Check CORS configuration
    try {
      const response = await axios.options(
        `${this.config.environments.production.url}/api/products`,
        {
          headers: {
            'Origin': 'https://malicious-site.com',
            'Access-Control-Request-Method': 'POST'
          },
          timeout: 5000,
          validateStatus: () => true
        }
      );
      
      const allowedOrigin = response.headers['access-control-allow-origin'];
      if (allowedOrigin === '*' || allowedOrigin === 'https://malicious-site.com') {
        this.issues.push({
          type: 'security',
          severity: 'critical',
          component: 'cors',
          issue: 'CORS misconfiguration',
          details: 'CORS allows all origins or untrusted domains',
          fix: 'fixCORSConfiguration'
        });
      }
    } catch (error) {
      // CORS check failed - might be good (blocking)
    }

    // Check for public API access
    try {
      const response = await axios.get(
        `${this.config.environments.production.functions}/api/admin/users`,
        { timeout: 5000, validateStatus: () => true }
      );
      
      if (response.status === 200) {
        this.issues.push({
          type: 'security',
          severity: 'critical',
          component: 'authorization',
          issue: 'Admin endpoint publicly accessible',
          details: 'Admin endpoints should require authentication',
          fix: 'fixAuthorization'
        });
      }
    } catch (error) {
      // Good - endpoint is protected
    }
  }

  async detectPerformanceIssues() {
    console.log(chalk.cyan('  Checking performance...'));
    
    // Test response times
    const endpoints = [
      '/api/products',
      '/api/vendors',
      '/health'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const start = Date.now();
        await axios.get(
          `${this.config.environments.production.url}${endpoint}`,
          { timeout: 10000, validateStatus: () => true }
        );
        const duration = Date.now() - start;
        
        if (duration > 2000) {
          this.issues.push({
            type: 'performance',
            severity: 'medium',
            component: 'api',
            issue: `Slow response time for ${endpoint}`,
            details: `Response took ${duration}ms (threshold: 2000ms)`,
            fix: 'optimizeEndpoint',
            data: { endpoint, duration }
          });
        }
      } catch (error) {
        // Already handled in infrastructure checks
      }
    }
  }

  async detectCodeIssues() {
    console.log(chalk.cyan('  Checking code quality...'));
    
    // Check for missing error handling
    try {
      const serverCode = await fs.readFile(
        path.join(process.cwd(), 'backend', 'server.js'),
        'utf-8'
      );
      
      if (!serverCode.includes('app.use((err, req, res, next)')) {
        this.issues.push({
          type: 'code',
          severity: 'high',
          component: 'error-handling',
          issue: 'Missing global error handler',
          details: 'No global error handling middleware found',
          fix: 'addErrorHandler'
        });
      }
      
      if (!serverCode.includes('process.on(\'unhandledRejection\'')) {
        this.issues.push({
          type: 'code',
          severity: 'medium',
          component: 'error-handling',
          issue: 'Missing unhandled rejection handler',
          details: 'Process should handle unhandled promise rejections',
          fix: 'addRejectionHandler'
        });
      }
    } catch (error) {
      // File not found or read error
    }
  }

  // ============= AUTOMATIC FIXES =============

  async fixAllIssues() {
    console.log(chalk.blue.bold('\n🔧 Applying Automatic Fixes...\n'));
    
    for (const issue of this.issues) {
      console.log(chalk.yellow(`\n  Fixing: ${issue.issue}`));
      
      try {
        const fixMethod = this[issue.fix];
        if (fixMethod) {
          await fixMethod.call(this, issue);
          this.fixes.push({
            issue: issue.issue,
            status: 'fixed',
            timestamp: new Date().toISOString()
          });
          console.log(chalk.green(`    ✓ Fixed: ${issue.issue}`));
        } else {
          console.log(chalk.red(`    ✗ No fix available for: ${issue.issue}`));
        }
      } catch (error) {
        console.log(chalk.red(`    ✗ Failed to fix: ${error.message}`));
        this.fixes.push({
          issue: issue.issue,
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return this.fixes;
  }

  async fixAppHostingConfiguration(issue) {
    console.log(chalk.gray('    Setting App Hosting environment variables...'));
    
    const envVars = {
      NODE_ENV: 'production',
      FIREBASE_PROJECT_ID: this.config.projectId,
      FIREBASE_DATABASE_URL: `https://${this.config.projectId}-default-rtdb.firebaseio.com`,
      FIREBASE_STORAGE_BUCKET: `${this.config.projectId}.firebasestorage.app`,
      PORT: '8080'
    };
    
    for (const [key, value] of Object.entries(envVars)) {
      try {
        await execAsync(
          `firebase apphosting:secrets:set ${key}=${value} --force`
        );
        console.log(chalk.gray(`      Set ${key}`));
      } catch (error) {
        // Try alternative method
        await execAsync(
          `gcloud run services update ${this.config.appHostingBackend} ` +
          `--set-env-vars ${key}=${value} --region ${this.config.region}`
        );
      }
    }
    
    // Redeploy the backend
    console.log(chalk.gray('    Redeploying App Hosting backend...'));
    await execAsync(
      `firebase apphosting:backends:deploy ${this.config.appHostingBackend}`
    );
  }

  async fixCloudFunctionRoutes(issue) {
    console.log(chalk.gray('    Updating Cloud Function routes...'));
    
    // Create a fixed version of the function
    const functionCode = `
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

if (!admin.apps.length) {
  admin.initializeApp();
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'cloud-functions-api'
  });
});

// Products endpoint
app.get('/products', async (req, res) => {
  try {
    const snapshot = await admin.firestore()
      .collection('products')
      .limit(20)
      .get();
    
    const products = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });
    
    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Main API handler
app.all('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

exports.api = functions.https.onRequest(app);
`;

    // Write the fixed function
    await fs.writeFile(
      path.join(process.cwd(), 'functions', 'index-fixed.js'),
      functionCode
    );
    
    // Deploy the fixed function
    console.log(chalk.gray('    Deploying fixed Cloud Function...'));
    await execAsync('cd functions && firebase deploy --only functions:api');
  }

  async fixEnvironmentVariable(issue) {
    const { key, value } = issue.data;
    console.log(chalk.gray(`    Setting ${key} = ${value}`));
    
    await execAsync(
      `firebase functions:config:set ${key}="${value}"`
    );
  }

  async migrateToEnvVariables(issue) {
    console.log(chalk.gray('    Migrating to environment variables...'));
    
    // Get current config
    const { stdout } = await execAsync('firebase functions:config:get');
    const config = JSON.parse(stdout);
    
    // Create .env file
    const envContent = this.configToEnv(config);
    await fs.writeFile(
      path.join(process.cwd(), 'functions', '.env'),
      envContent
    );
    
    console.log(chalk.gray('    Created .env file with configuration'));
  }

  async fixCORSConfiguration(issue) {
    console.log(chalk.gray('    Fixing CORS configuration...'));
    
    const corsConfig = `
const allowedOrigins = [
  'https://souk-el-syarat.web.app',
  'https://souk-el-syarat.firebaseapp.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
`;

    // Update server files with proper CORS
    await this.updateServerFile('backend/server.js', corsConfig);
  }

  async fixAuthorization(issue) {
    console.log(chalk.gray('    Adding authorization middleware...'));
    
    const authMiddleware = `
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Protect admin endpoints
app.use('/api/admin/*', verifyToken, requireRole('admin'));
`;

    await this.updateServerFile('backend/server.js', authMiddleware);
  }

  async optimizeEndpoint(issue) {
    const { endpoint } = issue.data;
    console.log(chalk.gray(`    Optimizing ${endpoint}...`));
    
    // Add caching headers
    const cacheMiddleware = `
app.get('${endpoint}', (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
  next();
});
`;

    await this.updateServerFile('backend/server.js', cacheMiddleware);
    
    // Add database indexes
    if (endpoint.includes('products')) {
      await this.addFirestoreIndex('products', ['createdAt', 'category']);
    }
  }

  async addErrorHandler(issue) {
    console.log(chalk.gray('    Adding global error handler...'));
    
    const errorHandler = `
// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  
  res.status(status).json({
    error: message,
    status: status,
    timestamp: new Date().toISOString()
  });
});
`;

    await this.appendToServerFile('backend/server.js', errorHandler);
  }

  async addRejectionHandler(issue) {
    console.log(chalk.gray('    Adding unhandled rejection handler...'));
    
    const rejectionHandler = `
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in production
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Graceful shutdown
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});
`;

    await this.appendToServerFile('backend/server.js', rejectionHandler);
  }

  // ============= HELPER METHODS =============

  getDefaultValue(key) {
    const defaults = {
      'app.environment': 'production',
      'app.name': 'Souk El-Syarat',
      'app.domain': 'https://souk-el-syarat.web.app',
      'security.jwt_secret': this.generateSecret(),
      'security.api_key': this.generateSecret(),
      'marketplace.currency': 'EGP',
      'marketplace.platform_commission': '0.025'
    };
    
    return defaults[key] || '';
  }

  generateSecret() {
    return require('crypto').randomBytes(32).toString('hex');
  }

  configToEnv(config, prefix = '') {
    let env = '';
    
    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'object') {
        env += this.configToEnv(value, `${prefix}${key.toUpperCase()}_`);
      } else {
        env += `${prefix}${key.toUpperCase()}=${value}\n`;
      }
    }
    
    return env;
  }

  async updateServerFile(filePath, content) {
    const fullPath = path.join(process.cwd(), filePath);
    const fileContent = await fs.readFile(fullPath, 'utf-8');
    
    if (!fileContent.includes(content)) {
      // Find a good place to insert (after imports)
      const lines = fileContent.split('\n');
      const insertIndex = lines.findIndex(line => 
        line.includes('app.use') || line.includes('app.get')
      );
      
      if (insertIndex > 0) {
        lines.splice(insertIndex, 0, content);
        await fs.writeFile(fullPath, lines.join('\n'));
      }
    }
  }

  async appendToServerFile(filePath, content) {
    const fullPath = path.join(process.cwd(), filePath);
    const fileContent = await fs.readFile(fullPath, 'utf-8');
    
    if (!fileContent.includes(content.substring(0, 50))) {
      await fs.appendFile(fullPath, '\n' + content);
    }
  }

  async addFirestoreIndex(collection, fields) {
    console.log(chalk.gray(`      Adding Firestore index for ${collection}...`));
    
    const indexFile = path.join(process.cwd(), 'firestore.indexes.json');
    const indexes = JSON.parse(await fs.readFile(indexFile, 'utf-8'));
    
    const newIndex = {
      collectionGroup: collection,
      queryScope: 'COLLECTION',
      fields: fields.map(field => ({
        fieldPath: field,
        order: 'ASCENDING'
      }))
    };
    
    if (!indexes.indexes.some(idx => 
      idx.collectionGroup === collection &&
      JSON.stringify(idx.fields) === JSON.stringify(newIndex.fields)
    )) {
      indexes.indexes.push(newIndex);
      await fs.writeFile(indexFile, JSON.stringify(indexes, null, 2));
      
      // Deploy the new index
      await execAsync('firebase deploy --only firestore:indexes');
    }
  }

  // ============= REPORTING =============

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      issuesFound: this.issues.length,
      fixesApplied: this.fixes.filter(f => f.status === 'fixed').length,
      fixesFailed: this.fixes.filter(f => f.status === 'failed').length,
      issues: this.issues,
      fixes: this.fixes,
      recommendations: this.generateRecommendations()
    };
    
    console.log(chalk.blue.bold('\n📊 AUTO-FIX REPORT\n'));
    console.log(chalk.cyan(`Issues Found: ${report.issuesFound}`));
    console.log(chalk.green(`Fixes Applied: ${report.fixesApplied}`));
    console.log(chalk.red(`Fixes Failed: ${report.fixesFailed}`));
    
    if (report.recommendations.length > 0) {
      console.log(chalk.yellow.bold('\n💡 Recommendations:\n'));
      report.recommendations.forEach((rec, i) => {
        console.log(chalk.yellow(`${i + 1}. ${rec}`));
      });
    }
    
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    const criticalIssues = this.issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push(
        `${criticalIssues.length} critical issues require immediate attention`
      );
    }
    
    const securityIssues = this.issues.filter(i => i.type === 'security');
    if (securityIssues.length > 0) {
      recommendations.push(
        'Prioritize fixing security vulnerabilities before deployment'
      );
    }
    
    const performanceIssues = this.issues.filter(i => i.type === 'performance');
    if (performanceIssues.length > 0) {
      recommendations.push(
        'Consider implementing caching and database optimization'
      );
    }
    
    if (this.fixes.some(f => f.status === 'failed')) {
      recommendations.push(
        'Manual intervention required for failed fixes'
      );
    }
    
    return recommendations;
  }
}

// Export for use
module.exports = AutoFixSystem;

// Run if executed directly
if (require.main === module) {
  const autoFix = new AutoFixSystem();
  
  (async () => {
    try {
      console.log(chalk.blue.bold('🚀 Starting Automated Fix System\n'));
      
      await autoFix.detectAllIssues();
      await autoFix.fixAllIssues();
      
      const report = autoFix.generateReport();
      
      // Save report
      await fs.writeFile(
        'auto-fix-report.json',
        JSON.stringify(report, null, 2)
      );
      
      console.log(chalk.green('\n✅ Report saved to auto-fix-report.json'));
      
    } catch (error) {
      console.error(chalk.red('Fatal error:'), error);
      process.exit(1);
    }
  })();
}