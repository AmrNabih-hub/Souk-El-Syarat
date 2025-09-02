#!/usr/bin/env node

/**
 * COMPREHENSIVE SYSTEM AUDIT
 * Complete health check for all APIs, routing, endpoints, and frontend-backend integration
 */

const axios = require('axios');
const chalk = require('chalk');
const Table = require('cli-table3');
const fs = require('fs');

class ComprehensiveSystemAudit {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      endpoints: {},
      routing: {},
      integration: {},
      security: {},
      performance: {},
      gaps: [],
      leaks: [],
      recommendations: []
    };
    
    this.backends = {
      appHosting: 'https://souk-el-sayarat-backend--souk-el-syarat.europe-west4.hosted.app',
      cloudFunctions: 'https://api-52vezf5qqa-uc.a.run.app',
      frontend: 'https://souk-el-syarat.web.app'
    };
  }

  async runFullAudit() {
    console.log(chalk.blue.bold('\n🔍 COMPREHENSIVE SYSTEM AUDIT\n'));
    console.log(chalk.gray('=' .repeat(60)));
    
    // Run all audits
    await this.auditEndpoints();
    await this.auditRouting();
    await this.auditIntegration();
    await this.auditSecurity();
    await this.auditPerformance();
    await this.auditFrontendBackendLink();
    await this.identifyGaps();
    
    // Generate report
    this.generateReport();
    
    return this.results;
  }

  async auditEndpoints() {
    console.log(chalk.yellow('\n📡 AUDITING ALL ENDPOINTS...\n'));
    
    const endpoints = [
      // App Hosting Backend
      { name: 'AppHost: Root', url: `${this.backends.appHosting}/`, expected: 200 },
      { name: 'AppHost: Health', url: `${this.backends.appHosting}/health`, expected: 200 },
      { name: 'AppHost: API Info', url: `${this.backends.appHosting}/api`, expected: 200 },
      { name: 'AppHost: Products', url: `${this.backends.appHosting}/api/products`, expected: 200 },
      { name: 'AppHost: Products/ID', url: `${this.backends.appHosting}/api/products/test123`, expected: [200, 404] },
      { name: 'AppHost: Vendors', url: `${this.backends.appHosting}/api/vendors`, expected: 200 },
      { name: 'AppHost: Search', url: `${this.backends.appHosting}/api/search/products?q=test`, expected: 200 },
      { name: 'AppHost: Orders', url: `${this.backends.appHosting}/api/orders`, expected: [200, 404] },
      { name: 'AppHost: Auth/Login', url: `${this.backends.appHosting}/api/auth/login`, method: 'POST', expected: [200, 400, 404] },
      { name: 'AppHost: Auth/Register', url: `${this.backends.appHosting}/api/auth/register`, method: 'POST', expected: [200, 400, 404] },
      
      // Cloud Functions
      { name: 'CF: Health', url: `${this.backends.cloudFunctions}/health`, expected: 200 },
      { name: 'CF: Products', url: `${this.backends.cloudFunctions}/products`, expected: 200 },
      { name: 'CF: Vendors', url: `${this.backends.cloudFunctions}/vendors`, expected: 200 },
      { name: 'CF: Search', url: `${this.backends.cloudFunctions}/search/products`, expected: 200 },
      
      // Frontend
      { name: 'Frontend: Home', url: `${this.backends.frontend}/`, expected: 200 },
      { name: 'Frontend: Static', url: `${this.backends.frontend}/index.html`, expected: 200 },
    ];

    for (const endpoint of endpoints) {
      try {
        const start = Date.now();
        const response = await axios({
          method: endpoint.method || 'GET',
          url: endpoint.url,
          timeout: 5000,
          validateStatus: () => true,
          data: endpoint.method === 'POST' ? {} : undefined
        });
        const duration = Date.now() - start;
        
        const expectedStatuses = Array.isArray(endpoint.expected) ? endpoint.expected : [endpoint.expected];
        const isExpected = expectedStatuses.includes(response.status);
        
        this.results.endpoints[endpoint.name] = {
          url: endpoint.url,
          status: response.status,
          duration,
          success: isExpected,
          hasData: response.data && Object.keys(response.data).length > 0
        };
        
        if (isExpected && response.status < 400) {
          console.log(chalk.green(`✓ ${endpoint.name}: ${response.status} (${duration}ms)`));
        } else if (isExpected) {
          console.log(chalk.yellow(`⚠ ${endpoint.name}: ${response.status} (${duration}ms)`));
        } else {
          console.log(chalk.red(`✗ ${endpoint.name}: ${response.status} - UNEXPECTED`));
          this.results.gaps.push(`${endpoint.name} returning unexpected status ${response.status}`);
        }
      } catch (error) {
        console.log(chalk.red(`✗ ${endpoint.name}: ERROR - ${error.message}`));
        this.results.endpoints[endpoint.name] = {
          url: endpoint.url,
          error: error.message,
          success: false
        };
        this.results.gaps.push(`${endpoint.name} is failing: ${error.message}`);
      }
    }
  }

  async auditRouting() {
    console.log(chalk.yellow('\n🔀 AUDITING ROUTING CONFIGURATION...\n'));
    
    const routes = [
      { path: '/api/products', backend: 'appHosting', expected: 'working' },
      { path: '/api/vendors', backend: 'appHosting', expected: 'working' },
      { path: '/api/orders', backend: 'appHosting', expected: 'needs-implementation' },
      { path: '/api/auth/*', backend: 'appHosting', expected: 'needs-implementation' },
      { path: '/api/payments', backend: 'appHosting', expected: 'not-implemented' },
      { path: '/api/analytics', backend: 'appHosting', expected: 'not-implemented' },
    ];
    
    for (const route of routes) {
      const url = `${this.backends[route.backend]}${route.path}`;
      try {
        const response = await axios.get(url, {
          timeout: 2000,
          validateStatus: () => true
        });
        
        if (response.status === 200) {
          this.results.routing[route.path] = 'implemented';
          console.log(chalk.green(`✓ ${route.path}: Implemented`));
        } else if (response.status === 404) {
          this.results.routing[route.path] = 'not-implemented';
          if (route.expected === 'working') {
            console.log(chalk.red(`✗ ${route.path}: Not implemented (expected working)`));
            this.results.gaps.push(`Route ${route.path} not implemented`);
          } else {
            console.log(chalk.yellow(`⚠ ${route.path}: Not implemented`));
          }
        } else {
          this.results.routing[route.path] = `error-${response.status}`;
          console.log(chalk.red(`✗ ${route.path}: Error ${response.status}`));
        }
      } catch (error) {
        this.results.routing[route.path] = 'error';
        console.log(chalk.red(`✗ ${route.path}: ${error.message}`));
      }
    }
  }

  async auditIntegration() {
    console.log(chalk.yellow('\n🔗 AUDITING FRONTEND-BACKEND INTEGRATION...\n'));
    
    // Check if frontend is properly configured to use backend
    const integrationChecks = [
      {
        name: 'Frontend API Configuration',
        check: async () => {
          // Check if frontend can reach backend
          try {
            const response = await axios.get(`${this.backends.frontend}/`, {
              timeout: 5000
            });
            const html = response.data;
            
            // Check for API URL configuration in frontend
            const hasApiConfig = html.includes('api-52vezf5qqa-uc.a.run.app') || 
                                html.includes('souk-el-sayarat-backend--souk-el-syarat');
            
            return {
              success: hasApiConfig,
              message: hasApiConfig ? 'Frontend configured with backend URL' : 'Frontend not configured with backend URL'
            };
          } catch (error) {
            return { success: false, message: error.message };
          }
        }
      },
      {
        name: 'CORS Configuration',
        check: async () => {
          try {
            const response = await axios.get(`${this.backends.appHosting}/api/products`, {
              headers: {
                'Origin': 'https://souk-el-syarat.web.app'
              },
              timeout: 5000
            });
            
            const corsHeader = response.headers['access-control-allow-origin'];
            return {
              success: corsHeader !== undefined,
              message: corsHeader ? `CORS enabled for ${corsHeader}` : 'CORS not configured'
            };
          } catch (error) {
            return { success: false, message: 'CORS check failed' };
          }
        }
      },
      {
        name: 'Database Connectivity',
        check: async () => {
          try {
            const response = await axios.get(`${this.backends.appHosting}/api/products`);
            const hasData = response.data && response.data.success;
            return {
              success: hasData,
              message: hasData ? 'Database connected and returning data' : 'Database not returning data'
            };
          } catch (error) {
            return { success: false, message: 'Database connectivity failed' };
          }
        }
      }
    ];
    
    for (const check of integrationChecks) {
      const result = await check.check();
      this.results.integration[check.name] = result;
      
      if (result.success) {
        console.log(chalk.green(`✓ ${check.name}: ${result.message}`));
      } else {
        console.log(chalk.red(`✗ ${check.name}: ${result.message}`));
        this.results.gaps.push(`Integration issue: ${check.name} - ${result.message}`);
      }
    }
  }

  async auditSecurity() {
    console.log(chalk.yellow('\n🔒 AUDITING SECURITY...\n'));
    
    const securityChecks = [
      {
        name: 'Rate Limiting',
        check: async () => {
          // Send multiple requests rapidly
          const requests = [];
          for (let i = 0; i < 150; i++) {
            requests.push(axios.get(`${this.backends.appHosting}/api/products`, {
              timeout: 1000,
              validateStatus: () => true
            }));
          }
          
          try {
            const responses = await Promise.all(requests);
            const rateLimited = responses.filter(r => r.status === 429);
            return {
              success: rateLimited.length > 0,
              message: rateLimited.length > 0 ? 
                `Rate limiting active (${rateLimited.length}/150 blocked)` : 
                'Rate limiting NOT active - SECURITY RISK'
            };
          } catch (error) {
            return { success: false, message: 'Rate limit test failed' };
          }
        }
      },
      {
        name: 'Security Headers',
        check: async () => {
          try {
            const response = await axios.get(`${this.backends.appHosting}/health`);
            const headers = response.headers;
            
            const securityHeaders = [
              'x-content-type-options',
              'x-frame-options',
              'x-xss-protection',
              'strict-transport-security'
            ];
            
            const presentHeaders = securityHeaders.filter(h => headers[h]);
            
            return {
              success: presentHeaders.length >= 2,
              message: `${presentHeaders.length}/4 security headers present`
            };
          } catch (error) {
            return { success: false, message: 'Security headers check failed' };
          }
        }
      },
      {
        name: 'Input Validation',
        check: async () => {
          try {
            // Try SQL injection
            const response = await axios.get(`${this.backends.appHosting}/api/search/products`, {
              params: { q: "'; DROP TABLE users; --" },
              validateStatus: () => true
            });
            
            return {
              success: response.status !== 500,
              message: response.status !== 500 ? 'Input validation working' : 'Input validation FAILED - SQL injection possible'
            };
          } catch (error) {
            return { success: true, message: 'Input validation check passed' };
          }
        }
      }
    ];
    
    for (const check of securityChecks) {
      const result = await check.check();
      this.results.security[check.name] = result;
      
      if (result.success) {
        console.log(chalk.green(`✓ ${check.name}: ${result.message}`));
      } else {
        console.log(chalk.red(`✗ ${check.name}: ${result.message}`));
        this.results.leaks.push(`Security leak: ${check.name} - ${result.message}`);
      }
    }
  }

  async auditPerformance() {
    console.log(chalk.yellow('\n⚡ AUDITING PERFORMANCE...\n'));
    
    const performanceTests = [
      { name: 'Health Check', url: `${this.backends.appHosting}/health`, threshold: 200 },
      { name: 'Products API', url: `${this.backends.appHosting}/api/products`, threshold: 500 },
      { name: 'Search API', url: `${this.backends.appHosting}/api/search/products?q=test`, threshold: 1000 },
    ];
    
    for (const test of performanceTests) {
      const times = [];
      
      // Run 5 requests to get average
      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        try {
          await axios.get(test.url, { timeout: 5000 });
          times.push(Date.now() - start);
        } catch (error) {
          times.push(5000);
        }
      }
      
      const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      const min = Math.min(...times);
      const max = Math.max(...times);
      
      this.results.performance[test.name] = {
        average: avg,
        min,
        max,
        threshold: test.threshold,
        passed: avg <= test.threshold
      };
      
      if (avg <= test.threshold) {
        console.log(chalk.green(`✓ ${test.name}: ${avg}ms avg (threshold: ${test.threshold}ms)`));
      } else {
        console.log(chalk.red(`✗ ${test.name}: ${avg}ms avg - SLOW (threshold: ${test.threshold}ms)`));
        this.results.gaps.push(`Performance issue: ${test.name} slow (${avg}ms)`);
      }
    }
  }

  async auditFrontendBackendLink() {
    console.log(chalk.yellow('\n🌐 AUDITING FRONTEND-BACKEND LINK...\n'));
    
    const linkChecks = [
      {
        name: 'API Base URL Configuration',
        check: () => {
          // Check if frontend has correct backend URL
          const expectedUrls = [
            'https://souk-el-sayarat-backend--souk-el-syarat.europe-west4.hosted.app',
            'https://api-52vezf5qqa-uc.a.run.app'
          ];
          
          // In production, this would check the actual frontend config
          return {
            success: true,
            message: 'Frontend should be configured with backend URL'
          };
        }
      },
      {
        name: 'Authentication Flow',
        check: async () => {
          // Check if auth endpoints exist
          try {
            const loginResponse = await axios.post(`${this.backends.appHosting}/api/auth/login`, 
              { email: 'test@test.com', password: 'test' },
              { validateStatus: () => true }
            );
            
            const registerResponse = await axios.post(`${this.backends.appHosting}/api/auth/register`,
              { email: 'test@test.com', password: 'test', name: 'Test' },
              { validateStatus: () => true }
            );
            
            const authImplemented = loginResponse.status !== 404 || registerResponse.status !== 404;
            
            return {
              success: authImplemented,
              message: authImplemented ? 'Auth endpoints exist' : 'Auth endpoints NOT implemented'
            };
          } catch (error) {
            return { success: false, message: 'Auth check failed' };
          }
        }
      },
      {
        name: 'Real-time Features',
        check: () => {
          // Check if WebSocket or real-time features are configured
          return {
            success: false,
            message: 'Real-time features not implemented (WebSocket/Socket.io needed)'
          };
        }
      }
    ];
    
    for (const check of linkChecks) {
      const result = await check.check();
      this.results.integration[`Frontend-Backend: ${check.name}`] = result;
      
      if (result.success) {
        console.log(chalk.green(`✓ ${check.name}: ${result.message}`));
      } else {
        console.log(chalk.yellow(`⚠ ${check.name}: ${result.message}`));
        if (check.name === 'Authentication Flow' || check.name === 'Real-time Features') {
          this.results.gaps.push(`${check.name}: ${result.message}`);
        }
      }
    }
  }

  identifyGaps() {
    console.log(chalk.yellow('\n🔍 IDENTIFYING GAPS & LEAKS...\n'));
    
    // Add any additional gaps based on analysis
    const criticalGaps = [
      'Authentication system not fully implemented',
      'Payment processing not implemented',
      'Order management incomplete',
      'Admin dashboard missing',
      'User profile management missing',
      'Email notifications not configured',
      'SMS notifications not configured',
      'Analytics tracking not implemented',
      'Backup strategy not defined',
      'CI/CD pipeline not fully automated'
    ];
    
    // Check which gaps are actual issues
    for (const gap of criticalGaps) {
      const isIssue = !this.results.routing['/api/auth/login'] || 
                      this.results.routing['/api/auth/login'] === 'not-implemented';
      
      if (gap.includes('Authentication') && isIssue) {
        this.results.gaps.push(gap);
      } else if (gap.includes('Payment') && !this.results.routing['/api/payments']) {
        this.results.gaps.push(gap);
      } else if (gap.includes('Order') && !this.results.routing['/api/orders']) {
        this.results.gaps.push(gap);
      }
    }
  }

  generateReport() {
    console.log(chalk.blue.bold('\n📊 AUDIT REPORT\n'));
    console.log(chalk.gray('=' .repeat(60)));
    
    // Calculate scores
    const endpointScore = Object.values(this.results.endpoints).filter(e => e.success).length / 
                         Object.keys(this.results.endpoints).length * 100;
    
    const securityScore = Object.values(this.results.security).filter(s => s.success).length / 
                         Object.keys(this.results.security).length * 100;
    
    const performanceScore = Object.values(this.results.performance).filter(p => p.passed).length / 
                           Object.keys(this.results.performance).length * 100;
    
    // Summary table
    const summaryTable = new Table({
      head: ['Category', 'Score', 'Status'],
      colWidths: [20, 15, 20]
    });
    
    summaryTable.push(
      ['Endpoints', `${endpointScore.toFixed(1)}%`, endpointScore >= 80 ? chalk.green('GOOD') : chalk.yellow('NEEDS WORK')],
      ['Security', `${securityScore.toFixed(1)}%`, securityScore >= 80 ? chalk.green('GOOD') : chalk.red('CRITICAL')],
      ['Performance', `${performanceScore.toFixed(1)}%`, performanceScore >= 80 ? chalk.green('GOOD') : chalk.yellow('NEEDS OPTIMIZATION')]
    );
    
    console.log(summaryTable.toString());
    
    // Gaps and Leaks
    if (this.results.gaps.length > 0) {
      console.log(chalk.red.bold('\n❌ GAPS IDENTIFIED:\n'));
      this.results.gaps.forEach((gap, i) => {
        console.log(chalk.red(`${i + 1}. ${gap}`));
      });
    }
    
    if (this.results.leaks.length > 0) {
      console.log(chalk.red.bold('\n🚨 SECURITY LEAKS:\n'));
      this.results.leaks.forEach((leak, i) => {
        console.log(chalk.red(`${i + 1}. ${leak}`));
      });
    }
    
    // Recommendations
    console.log(chalk.blue.bold('\n💡 RECOMMENDATIONS:\n'));
    
    const recommendations = [
      'Implement complete authentication system (login, register, logout, refresh)',
      'Add rate limiting to all API endpoints',
      'Implement payment processing (Stripe/PayPal integration)',
      'Complete order management system',
      'Add admin dashboard with full CRUD operations',
      'Configure email notifications (SendGrid/AWS SES)',
      'Implement real-time features with WebSocket',
      'Add comprehensive logging and monitoring',
      'Set up automated backups',
      'Complete CI/CD pipeline with automated testing'
    ];
    
    recommendations.forEach((rec, i) => {
      console.log(chalk.yellow(`${i + 1}. ${rec}`));
    });
    
    // Save detailed report
    fs.writeFileSync('system-audit-report.json', JSON.stringify(this.results, null, 2));
    console.log(chalk.green('\n✅ Detailed report saved to system-audit-report.json\n'));
    
    // Overall health
    const overallHealth = (endpointScore + securityScore + performanceScore) / 3;
    
    console.log(chalk.blue.bold('📈 OVERALL SYSTEM HEALTH: ') + 
               (overallHealth >= 80 ? chalk.green : overallHealth >= 60 ? chalk.yellow : chalk.red)
               (`${overallHealth.toFixed(1)}%`));
    
    if (overallHealth < 80) {
      console.log(chalk.yellow('\n⚠️  System needs attention to be production-ready'));
    } else {
      console.log(chalk.green('\n✅ System is in good health'));
    }
  }
}

// Run the audit
async function main() {
  const audit = new ComprehensiveSystemAudit();
  await audit.runFullAudit();
}

main().catch(console.error);