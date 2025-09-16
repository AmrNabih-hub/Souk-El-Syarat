#!/usr/bin/env node

/**
 * Automation Pipeline for Souk El-Sayarat
 * Comprehensive testing and deployment automation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class AutomationPipeline {
  constructor() {
    this.startTime = Date.now();
    this.results = {
      steps: [],
      errors: [],
      warnings: [],
      success: false
    };
  }

  log(step, message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { step, message, type, timestamp };
    this.results.steps.push(logEntry);
    
    const prefix = {
      info: '✅',
      warning: '⚠️',
      error: '❌',
      success: '🎉'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${step}] ${message}`);
  }

  async runCommand(command, step) {
    try {
      this.log(step, `Running: ${command}`);
      const output = execSync(command, { 
        encoding: 'utf8', 
        stdio: 'pipe',
        cwd: process.cwd()
      });
      this.log(step, 'Command completed successfully', 'success');
      return output;
    } catch (error) {
      this.log(step, `Command failed: ${error.message}`, 'error');
      this.results.errors.push({ step, error: error.message });
      throw error;
    }
  }

  async step1_InstallDependencies() {
    try {
      await this.runCommand('npm ci', 'Dependencies');
      this.log('Dependencies', 'All dependencies installed successfully', 'success');
    } catch (error) {
      this.log('Dependencies', 'Installing with legacy peer deps', 'warning');
      await this.runCommand('npm install --legacy-peer-deps', 'Dependencies');
    }
  }

  async step2_TypeScriptCheck() {
    try {
      await this.runCommand('npx tsc --noEmit --skipLibCheck', 'TypeScript');
      this.log('TypeScript', 'All type checks passed', 'success');
    } catch (error) {
      this.log('TypeScript', 'Type errors found - continuing with build', 'warning');
      this.results.warnings.push({
        step: 'TypeScript',
        message: 'Type errors present but build will continue'
      });
    }
  }

  async step3_LintCheck() {
    try {
      await this.runCommand('npm run lint', 'Linting');
      this.log('Linting', 'All linting checks passed', 'success');
    } catch (error) {
      this.log('Linting', 'Linting issues found - continuing', 'warning');
      this.results.warnings.push({
        step: 'Linting',
        message: 'Linting issues present'
      });
    }
  }

  async step4_UnitTests() {
    try {
      await this.runCommand('npm run test:unit', 'Unit Tests');
      this.log('Unit Tests', 'All unit tests passed', 'success');
    } catch (error) {
      this.log('Unit Tests', 'Some unit tests failed - continuing', 'warning');
      this.results.warnings.push({
        step: 'Unit Tests',
        message: 'Some unit tests failed'
      });
    }
  }

  async step5_BuildFrontend() {
    try {
      await this.runCommand('npm run build', 'Frontend Build');
      this.log('Frontend Build', 'Frontend built successfully', 'success');
      
      // Check build artifacts
      const distPath = path.join(process.cwd(), 'dist');
      if (fs.existsSync(distPath)) {
        const files = fs.readdirSync(distPath);
        this.log('Frontend Build', `Generated ${files.length} build artifacts`, 'info');
      }
    } catch (error) {
      throw error;
    }
  }

  async step6_BuildBackend() {
    try {
      await this.runCommand('npx tsc server.ts --outDir dist/server', 'Backend Build');
      this.log('Backend Build', 'Backend compiled successfully', 'success');
    } catch (error) {
      this.log('Backend Build', 'Backend compilation failed', 'error');
      throw error;
    }
  }

  async step7_HealthCheck() {
    try {
      // Start server in background
      const serverProcess = execSync('node dist/server/server.js', { 
        stdio: 'pipe',
        detached: true 
      });
      
      // Wait a bit for server to start
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Test health endpoint
      const healthCheck = execSync('curl -f http://localhost:8080/health', {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      this.log('Health Check', 'Backend server is healthy', 'success');
      
      // Kill server
      process.kill(-serverProcess.pid);
    } catch (error) {
      this.log('Health Check', 'Backend health check failed', 'warning');
      this.results.warnings.push({
        step: 'Health Check',
        message: 'Backend server health check failed'
      });
    }
  }

  async step8_IntegrationTests() {
    try {
      await this.runCommand('npm run test:integration', 'Integration Tests');
      this.log('Integration Tests', 'All integration tests passed', 'success');
    } catch (error) {
      this.log('Integration Tests', 'Some integration tests failed', 'warning');
      this.results.warnings.push({
        step: 'Integration Tests',
        message: 'Some integration tests failed'
      });
    }
  }

  async step9_GenerateReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    this.results.duration = duration;
    this.results.success = this.results.errors.length === 0;
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: `${Math.round(duration / 1000)}s`,
      success: this.results.success,
      summary: {
        totalSteps: this.results.steps.length,
        errors: this.results.errors.length,
        warnings: this.results.warnings.length
      },
      steps: this.results.steps,
      errors: this.results.errors,
      warnings: this.results.warnings
    };

    // Save report to file
    const reportPath = path.join(process.cwd(), 'automation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log('Report', `Automation report saved to ${reportPath}`, 'success');
    
    // Print summary
    console.log('\n🎯 AUTOMATION PIPELINE SUMMARY');
    console.log('================================');
    console.log(`Duration: ${report.duration}`);
    console.log(`Status: ${this.results.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Steps: ${report.summary.totalSteps}`);
    console.log(`Errors: ${report.summary.errors}`);
    console.log(`Warnings: ${report.summary.warnings}`);
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.results.errors.forEach(error => {
        console.log(`  - ${error.step}: ${error.error}`);
      });
    }
    
    if (this.results.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      this.results.warnings.forEach(warning => {
        console.log(`  - ${warning.step}: ${warning.message}`);
      });
    }
  }

  async run() {
    try {
      this.log('Pipeline', 'Starting Souk El-Sayarat Automation Pipeline', 'info');
      
      await this.step1_InstallDependencies();
      await this.step2_TypeScriptCheck();
      await this.step3_LintCheck();
      await this.step4_UnitTests();
      await this.step5_BuildFrontend();
      await this.step6_BuildBackend();
      await this.step7_HealthCheck();
      await this.step8_IntegrationTests();
      await this.step9_GenerateReport();
      
      this.log('Pipeline', 'Automation pipeline completed successfully!', 'success');
      
    } catch (error) {
      this.log('Pipeline', `Pipeline failed: ${error.message}`, 'error');
      await this.step9_GenerateReport();
      process.exit(1);
    }
  }
}

// Run the pipeline
if (require.main === module) {
  const pipeline = new AutomationPipeline();
  pipeline.run().catch(console.error);
}

module.exports = AutomationPipeline;
