/**
 * 🧪 SOUK EL-SAYARAT - COMPREHENSIVE SYSTEM TESTING
 * Professional automated testing for all components and integrations
 * 
 * @author Souk El-Sayarat Engineering Team
 * @version 1.0.0
 * @created 2024
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';

const execAsync = promisify(exec);

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration: number;
  details?: any;
}

interface SystemHealth {
  frontend: boolean;
  backend: boolean;
  database: boolean;
  build: boolean;
  dependencies: boolean;
  typescript: boolean;
  performance: boolean;
}

class SystemTester {
  private results: TestResult[] = [];
  private startTime: number = 0;

  constructor() {
    this.startTime = Date.now();
    console.log('🧪 Starting Comprehensive System Testing...\n');
  }

  private async runTest(name: string, testFn: () => Promise<any>): Promise<TestResult> {
    const testStart = Date.now();
    try {
      const result = await testFn();
      const duration = Date.now() - testStart;
      
      const testResult: TestResult = {
        name,
        status: 'PASS',
        message: 'Test passed successfully',
        duration,
        details: result
      };
      
      this.results.push(testResult);
      console.log(`✅ ${name} - PASS (${duration}ms)`);
      return testResult;
    } catch (error) {
      const duration = Date.now() - testStart;
      
      const testResult: TestResult = {
        name,
        status: 'FAIL',
        message: (error as Error).message,
        duration,
        details: error
      };
      
      this.results.push(testResult);
      console.log(`❌ ${name} - FAIL (${duration}ms): ${(error as Error).message}`);
      return testResult;
    }
  }

  async testDependencies(): Promise<void> {
    await this.runTest('Dependency Audit', async () => {
      const { stdout } = await execAsync('npm audit --audit-level=high --json');
      const audit = JSON.parse(stdout);
      
      if (audit.vulnerabilities && Object.keys(audit.vulnerabilities).length > 0) {
        throw new Error(`Found ${Object.keys(audit.vulnerabilities).length} high-severity vulnerabilities`);
      }
      
      return { vulnerabilities: 0, dependencies: audit.metadata?.totalDependencies || 0 };
    });

    await this.runTest('Package Conflicts', async () => {
      const { stdout } = await execAsync('npm ls --depth=0');
      const lines = stdout.split('\n');
      const conflicts = lines.filter(line => line.includes('UNMET') || line.includes('conflict'));
      
      if (conflicts.length > 0) {
        throw new Error(`Found ${conflicts.length} package conflicts`);
      }
      
      return { conflicts: 0, packages: lines.length - 1 };
    });
  }

  async testTypeScript(): Promise<void> {
    await this.runTest('TypeScript Compilation', async () => {
      const { stdout, stderr } = await execAsync('npx tsc --noEmit --skipLibCheck');
      
      if (stderr && stderr.includes('error')) {
        throw new Error(`TypeScript compilation errors: ${stderr}`);
      }
      
      return { compiled: true, errors: 0 };
    });

    await this.runTest('TypeScript Strict Mode', async () => {
      const { stdout, stderr } = await execAsync('npx tsc --noEmit --strict');
      
      if (stderr && stderr.includes('error')) {
        throw new Error(`TypeScript strict mode errors: ${stderr}`);
      }
      
      return { strictMode: true, errors: 0 };
    });
  }

  async testBuildProcess(): Promise<void> {
    await this.runTest('Frontend Build', async () => {
      const { stdout, stderr } = await execAsync('npm run build');
      
      if (stderr && stderr.includes('Error:')) {
        throw new Error(`Build failed: ${stderr}`);
      }
      
      // Check if dist directory exists and has files
      const { stdout: lsOutput } = await execAsync('ls -la dist/');
      const files = lsOutput.split('\n').filter(line => line.includes('.'));
      
      return { 
        built: true, 
        files: files.length,
        output: stdout.substring(0, 200) + '...'
      };
    });

    await this.runTest('Bundle Size Analysis', async () => {
      const { stdout } = await execAsync('du -sh dist/');
      const size = stdout.split('\t')[0];
      
      // Check for large files
      const { stdout: largeFiles } = await execAsync('find dist/ -name "*.js" -size +500k');
      const largeFileCount = largeFiles.split('\n').filter(line => line.trim()).length;
      
      if (largeFileCount > 0) {
        console.warn(`⚠️ Found ${largeFileCount} large files (>500KB)`);
      }
      
      return { 
        totalSize: size,
        largeFiles: largeFileCount,
        optimized: largeFileCount === 0
      };
    });
  }

  async testBackendServer(): Promise<void> {
    await this.runTest('Backend Health Check', async () => {
      const response = await fetch('http://localhost:8080/health');
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json() as any;
      
      if (data.status !== 'healthy') {
        throw new Error(`Server not healthy: ${data.status}`);
      }
      
      return {
        status: data.status,
        uptime: data.uptime,
        version: data.version,
        memory: data.memory
      };
    });

    await this.runTest('API Endpoints', async () => {
      const endpoints = [
        '/api/status',
        '/api/auth/verify',
        '/api/vendors/status',
        '/api/products/status',
        '/api/analytics/dashboard'
      ];
      
      const results = [];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`http://localhost:8080${endpoint}`);
          results.push({
            endpoint,
            status: response.status,
            ok: response.ok
          });
        } catch (error) {
          results.push({
            endpoint,
            status: 'ERROR',
            ok: false,
            error: (error as Error).message
          });
        }
      }
      
      const failed = results.filter(r => !r.ok);
      if (failed.length > 0) {
        throw new Error(`${failed.length} endpoints failed: ${failed.map(f => f.endpoint).join(', ')}`);
      }
      
      return { endpoints: results.length, allWorking: true };
    });
  }

  async testPerformance(): Promise<void> {
    await this.runTest('Build Performance', async () => {
      const start = Date.now();
      await execAsync('npm run build');
      const duration = Date.now() - start;
      
      // Build should complete within 2 minutes
      if (duration > 120000) {
        throw new Error(`Build took too long: ${duration}ms`);
      }
      
      return { 
        duration: `${Math.round(duration / 1000)}s`,
        acceptable: duration < 120000
      };
    });

    await this.runTest('Server Response Time', async () => {
      const start = Date.now();
      const response = await fetch('http://localhost:8080/health');
      const duration = Date.now() - start;
      
      // Response should be under 500ms
      if (duration > 500) {
        throw new Error(`Response too slow: ${duration}ms`);
      }
      
      return { 
        responseTime: `${duration}ms`,
        acceptable: duration < 500
      };
    });
  }

  async testSecurity(): Promise<void> {
    await this.runTest('Security Headers', async () => {
      const response = await fetch('http://localhost:8080/health');
      const headers = response.headers;
      
      const requiredHeaders = [
        'content-security-policy',
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection'
      ];
      
      const missing = requiredHeaders.filter(header => !headers.get(header));
      
      if (missing.length > 0) {
        throw new Error(`Missing security headers: ${missing.join(', ')}`);
      }
      
      return { 
        securityHeaders: requiredHeaders.length - missing.length,
        totalHeaders: requiredHeaders.length
      };
    });
  }

  async runAllTests(): Promise<SystemHealth> {
    console.log('🔍 Running Dependency Tests...\n');
    await this.testDependencies();
    
    console.log('\n🔍 Running TypeScript Tests...\n');
    await this.testTypeScript();
    
    console.log('\n🔍 Running Build Process Tests...\n');
    await this.testBuildProcess();
    
    console.log('\n🔍 Running Backend Server Tests...\n');
    await this.testBackendServer();
    
    console.log('\n🔍 Running Performance Tests...\n');
    await this.testPerformance();
    
    console.log('\n🔍 Running Security Tests...\n');
    await this.testSecurity();
    
    // Calculate overall health
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    
    const health: SystemHealth = {
      frontend: this.results.filter(r => r.name.includes('Frontend') || r.name.includes('Build')).every(r => r.status === 'PASS'),
      backend: this.results.filter(r => r.name.includes('Backend') || r.name.includes('API')).every(r => r.status === 'PASS'),
      database: this.results.filter(r => r.name.includes('Database')).every(r => r.status === 'PASS'),
      build: this.results.filter(r => r.name.includes('Build')).every(r => r.status === 'PASS'),
      dependencies: this.results.filter(r => r.name.includes('Dependency') || r.name.includes('Package')).every(r => r.status === 'PASS'),
      typescript: this.results.filter(r => r.name.includes('TypeScript')).every(r => r.status === 'PASS'),
      performance: this.results.filter(r => r.name.includes('Performance') || r.name.includes('Response')).every(r => r.status === 'PASS')
    };
    
    const totalDuration = Date.now() - this.startTime;
    
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('========================');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`⏱️ Total Duration: ${Math.round(totalDuration / 1000)}s`);
    console.log('\n🏥 SYSTEM HEALTH:');
    console.log(`Frontend: ${health.frontend ? '✅' : '❌'}`);
    console.log(`Backend: ${health.backend ? '✅' : '❌'}`);
    console.log(`Database: ${health.database ? '✅' : '❌'}`);
    console.log(`Build: ${health.build ? '✅' : '❌'}`);
    console.log(`Dependencies: ${health.dependencies ? '✅' : '❌'}`);
    console.log(`TypeScript: ${health.typescript ? '✅' : '❌'}`);
    console.log(`Performance: ${health.performance ? '✅' : '❌'}`);
    
    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.filter(r => r.status === 'FAIL').forEach(result => {
        console.log(`- ${result.name}: ${result.message}`);
      });
    }
    
    return health;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new SystemTester();
  tester.runAllTests().then(health => {
    const allHealthy = Object.values(health).every(h => h);
    process.exit(allHealthy ? 0 : 1);
  }).catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

export default SystemTester;
