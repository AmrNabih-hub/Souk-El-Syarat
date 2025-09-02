#!/usr/bin/env node

/**
 * Continuous Monitoring & Progress Tracking System
 * Real-time monitoring with staff engineer review points
 */

const axios = require('axios');
const chalk = require('chalk');
const Table = require('cli-table3');
const fs = require('fs');

class ContinuousMonitor {
  constructor() {
    this.startTime = Date.now();
    this.checkCount = 0;
    this.history = [];
    this.improvements = [];
    this.regressions = [];
    this.lastSuccessRate = 0;
  }

  async runContinuousCheck() {
    console.clear();
    console.log(chalk.blue.bold('🔄 CONTINUOUS MONITORING SYSTEM'));
    console.log(chalk.gray('=' .repeat(60)));
    console.log(chalk.gray(`Started: ${new Date(this.startTime).toLocaleString()}`));
    console.log(chalk.gray(`Check #${++this.checkCount}`));
    console.log('');

    const results = await this.performFullCheck();
    this.analyzeProgress(results);
    this.displayResults(results);
    this.saveReport(results);
    
    // Run every 30 seconds
    setTimeout(() => this.runContinuousCheck(), 30000);
  }

  async performFullCheck() {
    const results = {
      timestamp: new Date().toISOString(),
      checkNumber: this.checkCount,
      endpoints: {},
      metrics: {},
      issues: [],
      fixes: [],
      successRate: 0
    };

    // Test all endpoints
    const endpoints = [
      { name: 'App Hosting Health', url: 'https://souk-el-sayarat-backend--souk-el-syarat.europe-west4.hosted.app/health' },
      { name: 'Cloud Functions API', url: 'https://us-central1-souk-el-syarat.cloudfunctions.net/api/health' },
      { name: 'Products API', url: 'https://us-central1-souk-el-syarat.cloudfunctions.net/api/api/products' },
      { name: 'Vendors API', url: 'https://us-central1-souk-el-syarat.cloudfunctions.net/api/api/vendors' },
      { name: 'Search API', url: 'https://us-central1-souk-el-syarat.cloudfunctions.net/api/api/search/products?q=car' },
      { name: 'Frontend', url: 'https://souk-el-syarat.web.app' }
    ];

    let passed = 0;
    let total = endpoints.length;

    for (const endpoint of endpoints) {
      try {
        const start = Date.now();
        const response = await axios.get(endpoint.url, {
          timeout: 5000,
          validateStatus: () => true
        });
        const duration = Date.now() - start;

        const success = response.status < 400;
        if (success) passed++;

        results.endpoints[endpoint.name] = {
          status: response.status,
          duration,
          success,
          hasData: response.data && Object.keys(response.data).length > 0
        };

        // Check for specific issues
        if (response.status === 500) {
          results.issues.push(`${endpoint.name}: Internal server error`);
        } else if (response.status === 404) {
          results.issues.push(`${endpoint.name}: Endpoint not found`);
        } else if (duration > 2000) {
          results.issues.push(`${endpoint.name}: Slow response (${duration}ms)`);
        }

      } catch (error) {
        results.endpoints[endpoint.name] = {
          status: 0,
          error: error.message,
          success: false
        };
        results.issues.push(`${endpoint.name}: ${error.message}`);
      }
    }

    results.successRate = (passed / total * 100).toFixed(1);

    // Calculate metrics
    const durations = Object.values(results.endpoints)
      .filter(e => e.duration)
      .map(e => e.duration);
    
    if (durations.length > 0) {
      results.metrics = {
        avgResponseTime: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
        minResponseTime: Math.min(...durations),
        maxResponseTime: Math.max(...durations),
        totalEndpoints: total,
        workingEndpoints: passed,
        failedEndpoints: total - passed
      };
    }

    return results;
  }

  analyzeProgress(results) {
    const currentRate = parseFloat(results.successRate);
    
    if (this.lastSuccessRate > 0) {
      if (currentRate > this.lastSuccessRate) {
        this.improvements.push({
          timestamp: results.timestamp,
          from: this.lastSuccessRate,
          to: currentRate,
          improvement: (currentRate - this.lastSuccessRate).toFixed(1)
        });
      } else if (currentRate < this.lastSuccessRate) {
        this.regressions.push({
          timestamp: results.timestamp,
          from: this.lastSuccessRate,
          to: currentRate,
          regression: (this.lastSuccessRate - currentRate).toFixed(1)
        });
      }
    }
    
    this.lastSuccessRate = currentRate;
    this.history.push(results);
    
    // Keep only last 100 checks
    if (this.history.length > 100) {
      this.history.shift();
    }
  }

  displayResults(results) {
    // Status Overview
    console.log(chalk.blue.bold('📊 STATUS OVERVIEW\n'));
    
    const statusTable = new Table({
      head: ['Service', 'Status', 'Response', 'Health'],
      colWidths: [25, 10, 12, 10]
    });

    for (const [name, data] of Object.entries(results.endpoints)) {
      let statusColor = chalk.red;
      let statusText = 'DOWN';
      let healthIcon = '❌';
      
      if (data.success) {
        statusColor = chalk.green;
        statusText = data.status;
        healthIcon = '✅';
      } else if (data.status === 404) {
        statusColor = chalk.yellow;
        statusText = '404';
        healthIcon = '⚠️';
      } else if (data.status === 500) {
        statusColor = chalk.red;
        statusText = '500';
        healthIcon = '❌';
      }
      
      const responseTime = data.duration ? 
        (data.duration < 500 ? chalk.green : 
         data.duration < 2000 ? chalk.yellow : chalk.red)
        (`${data.duration}ms`) : chalk.gray('N/A');
      
      statusTable.push([
        name,
        statusColor(statusText),
        responseTime,
        healthIcon
      ]);
    }
    
    console.log(statusTable.toString());
    
    // Metrics
    if (results.metrics.avgResponseTime) {
      console.log(chalk.blue.bold('\n⚡ PERFORMANCE METRICS\n'));
      console.log(`Average Response: ${results.metrics.avgResponseTime}ms`);
      console.log(`Min/Max Response: ${results.metrics.minResponseTime}ms / ${results.metrics.maxResponseTime}ms`);
      console.log(`Working Endpoints: ${results.metrics.workingEndpoints}/${results.metrics.totalEndpoints}`);
    }
    
    // Progress Tracking
    console.log(chalk.blue.bold('\n📈 PROGRESS TRACKING\n'));
    
    const progressBar = this.createProgressBar(parseFloat(results.successRate));
    console.log(`Success Rate: ${progressBar} ${results.successRate}%`);
    
    if (this.improvements.length > 0) {
      const lastImprovement = this.improvements[this.improvements.length - 1];
      console.log(chalk.green(`✅ Last Improvement: +${lastImprovement.improvement}%`));
    }
    
    if (this.regressions.length > 0) {
      const lastRegression = this.regressions[this.regressions.length - 1];
      console.log(chalk.red(`⚠️ Last Regression: -${lastRegression.regression}%`));
    }
    
    // Issues
    if (results.issues.length > 0) {
      console.log(chalk.yellow.bold('\n⚠️ CURRENT ISSUES\n'));
      results.issues.forEach(issue => {
        console.log(chalk.yellow(`• ${issue}`));
      });
    }
    
    // Staff Review Points
    this.checkStaffReviewPoints(results);
  }

  createProgressBar(percentage) {
    const filled = Math.round(percentage / 5);
    const empty = 20 - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    
    if (percentage >= 80) return chalk.green(`[${bar}]`);
    if (percentage >= 60) return chalk.yellow(`[${bar}]`);
    return chalk.red(`[${bar}]`);
  }

  checkStaffReviewPoints(results) {
    console.log(chalk.blue.bold('\n👨‍💻 STAFF ENGINEER REVIEW POINTS\n'));
    
    const reviewPoints = [];
    
    // Check Phase 1 completion
    if (results.endpoints['App Hosting Health']?.success || 
        results.endpoints['Cloud Functions API']?.success) {
      reviewPoints.push({
        phase: 'Phase 1',
        status: 'COMPLETE',
        message: 'Backend infrastructure operational'
      });
    }
    
    // Check Phase 2 completion
    if (results.endpoints['Products API']?.success && 
        results.endpoints['Vendors API']?.success) {
      reviewPoints.push({
        phase: 'Phase 2',
        status: 'COMPLETE',
        message: 'API routes configured and working'
      });
    }
    
    // Check overall health
    if (parseFloat(results.successRate) >= 80) {
      reviewPoints.push({
        phase: 'System Health',
        status: 'GOOD',
        message: 'System health above 80% threshold'
      });
    }
    
    reviewPoints.forEach(point => {
      const icon = point.status === 'COMPLETE' ? '✅' : 
                   point.status === 'GOOD' ? '👍' : '⏳';
      console.log(`${icon} ${chalk.bold(point.phase)}: ${point.message}`);
    });
    
    // Recommendations
    console.log(chalk.blue.bold('\n💡 RECOMMENDATIONS\n'));
    
    if (!results.endpoints['App Hosting Health']?.success) {
      console.log('1. Fix App Hosting backend - still returning errors');
    }
    
    if (results.metrics.avgResponseTime > 1000) {
      console.log('2. Optimize performance - average response time too high');
    }
    
    if (results.issues.length > 2) {
      console.log('3. Address multiple issues detected in the system');
    }
    
    if (parseFloat(results.successRate) < 100) {
      console.log(`4. ${(100 - parseFloat(results.successRate)).toFixed(1)}% of system still needs fixing`);
    }
  }

  saveReport(results) {
    const report = {
      ...results,
      history: {
        totalChecks: this.checkCount,
        improvements: this.improvements.length,
        regressions: this.regressions.length,
        uptime: Date.now() - this.startTime
      }
    };
    
    fs.writeFileSync(
      '/workspace/qa-automation/continuous-monitor-report.json',
      JSON.stringify(report, null, 2)
    );
  }
}

// Start monitoring
const monitor = new ContinuousMonitor();

console.log(chalk.blue.bold('🚀 STARTING CONTINUOUS MONITORING'));
console.log(chalk.gray('Press Ctrl+C to stop'));
console.log('');

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n📊 Final Report:'));
  console.log(`Total Checks: ${monitor.checkCount}`);
  console.log(`Improvements: ${monitor.improvements.length}`);
  console.log(`Regressions: ${monitor.regressions.length}`);
  console.log(`Final Success Rate: ${monitor.lastSuccessRate}%`);
  process.exit(0);
});

// Start the monitoring loop
monitor.runContinuousCheck();