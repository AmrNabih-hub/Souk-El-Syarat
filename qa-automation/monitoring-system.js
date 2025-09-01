/**
 * Real-time Monitoring and Alerting System
 * Professional SRE implementation - August 2025 standards
 * Continuous monitoring with automatic incident response
 */

const axios = require('axios');
const chalk = require('chalk');
const WebSocket = require('ws');
const EventEmitter = require('events');
const admin = require('firebase-admin');

class MonitoringSystem extends EventEmitter {
  constructor() {
    super();
    this.metrics = {
      uptime: {},
      performance: {},
      errors: {},
      traffic: {},
      alerts: []
    };
    
    this.config = {
      checkInterval: 30000, // 30 seconds
      endpoints: [
        {
          name: 'App Hosting Backend',
          url: 'https://souk-el-sayarat-backend--souk-el-syarat.europe-west4.hosted.app/health',
          critical: true,
          expectedStatus: 200,
          timeout: 5000,
          sla: 0.999 // 99.9% uptime
        },
        {
          name: 'Cloud Functions API',
          url: 'https://us-central1-souk-el-syarat.cloudfunctions.net/api',
          critical: true,
          expectedStatus: 200,
          timeout: 10000,
          sla: 0.995
        },
        {
          name: 'Frontend',
          url: 'https://souk-el-syarat.web.app',
          critical: true,
          expectedStatus: 200,
          timeout: 5000,
          sla: 0.999
        }
      ],
      thresholds: {
        responseTime: {
          warning: 1000,
          critical: 3000
        },
        errorRate: {
          warning: 0.01,
          critical: 0.05
        },
        cpu: {
          warning: 70,
          critical: 90
        },
        memory: {
          warning: 80,
          critical: 95
        }
      }
    };
    
    this.isMonitoring = false;
    this.checkTimers = [];
  }

  // ============= MONITORING CORE =============

  async startMonitoring() {
    console.log(chalk.blue.bold('🔍 Starting Real-time Monitoring System\n'));
    console.log(chalk.gray('Monitoring interval: ' + this.config.checkInterval + 'ms'));
    console.log(chalk.gray('Endpoints: ' + this.config.endpoints.length));
    console.log(chalk.gray('=' .repeat(60)));
    
    this.isMonitoring = true;
    
    // Initial check
    await this.performHealthChecks();
    
    // Set up periodic checks
    this.checkTimers.push(
      setInterval(() => this.performHealthChecks(), this.config.checkInterval)
    );
    
    // Set up real-time monitoring
    this.setupRealtimeMonitoring();
    
    // Set up metric aggregation
    this.checkTimers.push(
      setInterval(() => this.aggregateMetrics(), 60000) // Every minute
    );
    
    // Set up alert processing
    this.checkTimers.push(
      setInterval(() => this.processAlerts(), 10000) // Every 10 seconds
    );
    
    console.log(chalk.green('\n✅ Monitoring system started\n'));
  }

  stopMonitoring() {
    this.isMonitoring = false;
    this.checkTimers.forEach(timer => clearInterval(timer));
    this.checkTimers = [];
    console.log(chalk.yellow('\n⏹️  Monitoring system stopped\n'));
  }

  // ============= HEALTH CHECKS =============

  async performHealthChecks() {
    const timestamp = Date.now();
    
    for (const endpoint of this.config.endpoints) {
      try {
        const start = Date.now();
        const response = await axios.get(endpoint.url, {
          timeout: endpoint.timeout,
          validateStatus: () => true,
          headers: {
            'User-Agent': 'SoukElSyarat-Monitor/1.0'
          }
        });
        const duration = Date.now() - start;
        
        // Record metrics
        this.recordMetric(endpoint.name, {
          timestamp,
          status: response.status,
          responseTime: duration,
          available: response.status === endpoint.expectedStatus,
          headers: response.headers
        });
        
        // Check for issues
        if (response.status !== endpoint.expectedStatus) {
          this.createAlert({
            severity: endpoint.critical ? 'critical' : 'warning',
            service: endpoint.name,
            issue: `Unexpected status: ${response.status}`,
            details: `Expected ${endpoint.expectedStatus}, got ${response.status}`,
            timestamp
          });
        }
        
        if (duration > this.config.thresholds.responseTime.critical) {
          this.createAlert({
            severity: 'critical',
            service: endpoint.name,
            issue: 'Critical response time',
            details: `Response took ${duration}ms (threshold: ${this.config.thresholds.responseTime.critical}ms)`,
            timestamp
          });
        } else if (duration > this.config.thresholds.responseTime.warning) {
          this.createAlert({
            severity: 'warning',
            service: endpoint.name,
            issue: 'Slow response time',
            details: `Response took ${duration}ms (threshold: ${this.config.thresholds.responseTime.warning}ms)`,
            timestamp
          });
        }
        
        // Display status
        this.displayStatus(endpoint.name, response.status, duration);
        
      } catch (error) {
        // Service is down
        this.recordMetric(endpoint.name, {
          timestamp,
          status: 0,
          responseTime: endpoint.timeout,
          available: false,
          error: error.message
        });
        
        this.createAlert({
          severity: 'critical',
          service: endpoint.name,
          issue: 'Service unreachable',
          details: error.message,
          timestamp
        });
        
        this.displayStatus(endpoint.name, 'DOWN', 0, error.message);
        
        // Attempt automatic recovery
        if (endpoint.critical) {
          this.attemptRecovery(endpoint);
        }
      }
    }
  }

  // ============= REAL-TIME MONITORING =============

  setupRealtimeMonitoring() {
    // Monitor Firebase Realtime Database
    if (!admin.apps.length) {
      admin.initializeApp({
        projectId: 'souk-el-syarat',
        databaseURL: 'https://souk-el-syarat-default-rtdb.firebaseio.com'
      });
    }
    
    // Monitor system stats
    const statsRef = admin.database().ref('_monitoring/stats');
    statsRef.on('value', (snapshot) => {
      const stats = snapshot.val();
      if (stats) {
        this.processSystemStats(stats);
      }
    });
    
    // Monitor errors
    const errorsRef = admin.database().ref('_monitoring/errors');
    errorsRef.on('child_added', (snapshot) => {
      const error = snapshot.val();
      this.processError(error);
    });
    
    // Monitor user activity
    const activityRef = admin.database().ref('_monitoring/activity');
    activityRef.on('value', (snapshot) => {
      const activity = snapshot.val();
      if (activity) {
        this.processActivity(activity);
      }
    });
  }

  // ============= METRICS PROCESSING =============

  recordMetric(service, data) {
    if (!this.metrics.uptime[service]) {
      this.metrics.uptime[service] = {
        checks: 0,
        successes: 0,
        failures: 0,
        totalResponseTime: 0,
        history: []
      };
    }
    
    const metric = this.metrics.uptime[service];
    metric.checks++;
    
    if (data.available) {
      metric.successes++;
    } else {
      metric.failures++;
    }
    
    metric.totalResponseTime += data.responseTime;
    
    // Keep last 100 data points
    metric.history.push(data);
    if (metric.history.length > 100) {
      metric.history.shift();
    }
    
    // Calculate availability
    metric.availability = (metric.successes / metric.checks) * 100;
    metric.avgResponseTime = metric.totalResponseTime / metric.checks;
  }

  aggregateMetrics() {
    console.log(chalk.blue.bold('\n📊 Metrics Summary\n'));
    
    const table = require('cli-table3');
    const metricsTable = new table({
      head: ['Service', 'Availability', 'Avg Response', 'Status'],
      colWidths: [30, 15, 15, 10]
    });
    
    for (const [service, data] of Object.entries(this.metrics.uptime)) {
      const availability = data.availability.toFixed(2) + '%';
      const avgResponse = Math.round(data.avgResponseTime) + 'ms';
      const lastCheck = data.history[data.history.length - 1];
      const status = lastCheck?.available ? 
        chalk.green('UP') : chalk.red('DOWN');
      
      // Check SLA
      const endpoint = this.config.endpoints.find(e => e.name === service);
      const slaViolation = endpoint && data.availability < (endpoint.sla * 100);
      
      metricsTable.push([
        service,
        slaViolation ? chalk.red(availability) : chalk.green(availability),
        data.avgResponseTime > 1000 ? 
          chalk.yellow(avgResponse) : chalk.green(avgResponse),
        status
      ]);
      
      if (slaViolation) {
        this.createAlert({
          severity: 'warning',
          service,
          issue: 'SLA violation',
          details: `Availability ${availability} below SLA ${(endpoint.sla * 100).toFixed(1)}%`,
          timestamp: Date.now()
        });
      }
    }
    
    console.log(metricsTable.toString());
    
    // Performance metrics
    this.displayPerformanceMetrics();
  }

  displayPerformanceMetrics() {
    if (Object.keys(this.metrics.performance).length > 0) {
      console.log(chalk.blue.bold('\n⚡ Performance Metrics\n'));
      
      for (const [metric, value] of Object.entries(this.metrics.performance)) {
        const threshold = this.config.thresholds[metric];
        let status = chalk.green('OK');
        
        if (threshold) {
          if (value > threshold.critical) {
            status = chalk.red('CRITICAL');
          } else if (value > threshold.warning) {
            status = chalk.yellow('WARNING');
          }
        }
        
        console.log(`  ${metric}: ${value} ${status}`);
      }
    }
  }

  // ============= ALERTING =============

  createAlert(alert) {
    // Deduplicate alerts
    const existingAlert = this.metrics.alerts.find(a => 
      a.service === alert.service && 
      a.issue === alert.issue &&
      Date.now() - a.timestamp < 300000 // 5 minutes
    );
    
    if (!existingAlert) {
      this.metrics.alerts.push(alert);
      this.emit('alert', alert);
      
      // Display alert
      const icon = alert.severity === 'critical' ? '🚨' : '⚠️';
      const color = alert.severity === 'critical' ? chalk.red : chalk.yellow;
      
      console.log(color.bold(`\n${icon} ALERT: ${alert.service} - ${alert.issue}`));
      console.log(color(`   ${alert.details}`));
      
      // Send notifications
      this.sendNotification(alert);
    }
  }

  async sendNotification(alert) {
    // In production, this would send to:
    // - Slack/Discord
    // - Email
    // - SMS for critical alerts
    // - PagerDuty for incident management
    
    if (alert.severity === 'critical') {
      // Log to Firebase for persistence
      try {
        await admin.firestore()
          .collection('_monitoring_alerts')
          .add({
            ...alert,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
      } catch (error) {
        console.error('Failed to log alert:', error);
      }
    }
  }

  processAlerts() {
    // Clean up old alerts
    const now = Date.now();
    this.metrics.alerts = this.metrics.alerts.filter(alert => 
      now - alert.timestamp < 3600000 // Keep alerts for 1 hour
    );
    
    // Check for patterns
    const criticalAlerts = this.metrics.alerts.filter(a => 
      a.severity === 'critical' && 
      now - a.timestamp < 600000 // Last 10 minutes
    );
    
    if (criticalAlerts.length >= 3) {
      this.escalateIncident(criticalAlerts);
    }
  }

  // ============= INCIDENT RESPONSE =============

  async attemptRecovery(endpoint) {
    console.log(chalk.yellow(`\n🔧 Attempting automatic recovery for ${endpoint.name}...`));
    
    const recoveryStrategies = [
      () => this.restartService(endpoint),
      () => this.clearCache(endpoint),
      () => this.scaleUp(endpoint),
      () => this.failover(endpoint)
    ];
    
    for (const strategy of recoveryStrategies) {
      try {
        const success = await strategy();
        if (success) {
          console.log(chalk.green(`✅ Recovery successful for ${endpoint.name}`));
          
          // Verify recovery
          setTimeout(() => {
            this.verifyRecovery(endpoint);
          }, 10000);
          
          return;
        }
      } catch (error) {
        console.log(chalk.red(`   Recovery strategy failed: ${error.message}`));
      }
    }
    
    console.log(chalk.red(`❌ Automatic recovery failed for ${endpoint.name}`));
    this.escalateIncident([{
      service: endpoint.name,
      issue: 'Service down - recovery failed',
      severity: 'critical'
    }]);
  }

  async restartService(endpoint) {
    console.log(chalk.gray('   Attempting service restart...'));
    
    // For App Hosting
    if (endpoint.name.includes('App Hosting')) {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      try {
        await execAsync(
          'firebase apphosting:backends:deploy souk-el-sayarat-backend'
        );
        return true;
      } catch (error) {
        return false;
      }
    }
    
    // For Cloud Functions
    if (endpoint.name.includes('Cloud Functions')) {
      try {
        // Trigger a function cold start
        await axios.post(endpoint.url + '/health', {}, {
          timeout: 5000
        });
        return true;
      } catch (error) {
        return false;
      }
    }
    
    return false;
  }

  async clearCache(endpoint) {
    console.log(chalk.gray('   Clearing cache...'));
    
    // Clear CDN cache
    try {
      await axios.post('https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache', {
        purge_everything: true
      }, {
        headers: {
          'Authorization': 'Bearer CLOUDFLARE_TOKEN'
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async scaleUp(endpoint) {
    console.log(chalk.gray('   Scaling up instances...'));
    
    // Increase instance count
    if (endpoint.name.includes('App Hosting')) {
      try {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        await execAsync(
          'gcloud run services update souk-el-sayarat-backend ' +
          '--min-instances=2 --max-instances=10 --region=europe-west4'
        );
        return true;
      } catch (error) {
        return false;
      }
    }
    
    return false;
  }

  async failover(endpoint) {
    console.log(chalk.gray('   Initiating failover...'));
    
    // Switch to backup endpoint
    // In production, this would update DNS or load balancer
    return false;
  }

  async verifyRecovery(endpoint) {
    try {
      const response = await axios.get(endpoint.url, {
        timeout: 5000,
        validateStatus: () => true
      });
      
      if (response.status === endpoint.expectedStatus) {
        console.log(chalk.green(`✅ ${endpoint.name} is back online`));
        
        this.createAlert({
          severity: 'info',
          service: endpoint.name,
          issue: 'Service recovered',
          details: 'Automatic recovery successful',
          timestamp: Date.now()
        });
      } else {
        console.log(chalk.red(`❌ ${endpoint.name} still having issues`));
      }
    } catch (error) {
      console.log(chalk.red(`❌ ${endpoint.name} still unreachable`));
    }
  }

  escalateIncident(alerts) {
    console.log(chalk.red.bold('\n🚨 INCIDENT ESCALATION 🚨'));
    console.log(chalk.red('Multiple critical issues detected:'));
    
    alerts.forEach(alert => {
      console.log(chalk.red(`  - ${alert.service}: ${alert.issue}`));
    });
    
    // In production, this would:
    // 1. Page on-call engineer
    // 2. Create incident in incident management system
    // 3. Start incident response workflow
    // 4. Enable emergency mode
    
    this.emit('incident', {
      alerts,
      timestamp: Date.now(),
      severity: 'critical'
    });
  }

  // ============= SYSTEM STATS =============

  processSystemStats(stats) {
    this.metrics.performance = {
      cpu: stats.cpu || 0,
      memory: stats.memory || 0,
      disk: stats.disk || 0,
      network: stats.network || 0
    };
    
    // Check thresholds
    if (stats.cpu > this.config.thresholds.cpu.critical) {
      this.createAlert({
        severity: 'critical',
        service: 'System',
        issue: 'High CPU usage',
        details: `CPU at ${stats.cpu}%`,
        timestamp: Date.now()
      });
    }
    
    if (stats.memory > this.config.thresholds.memory.critical) {
      this.createAlert({
        severity: 'critical',
        service: 'System',
        issue: 'High memory usage',
        details: `Memory at ${stats.memory}%`,
        timestamp: Date.now()
      });
    }
  }

  processError(error) {
    if (!this.metrics.errors[error.service]) {
      this.metrics.errors[error.service] = [];
    }
    
    this.metrics.errors[error.service].push({
      ...error,
      timestamp: Date.now()
    });
    
    // Calculate error rate
    const recentErrors = this.metrics.errors[error.service].filter(e => 
      Date.now() - e.timestamp < 300000 // Last 5 minutes
    );
    
    const errorRate = recentErrors.length / 300; // Errors per second
    
    if (errorRate > this.config.thresholds.errorRate.critical) {
      this.createAlert({
        severity: 'critical',
        service: error.service,
        issue: 'High error rate',
        details: `${recentErrors.length} errors in last 5 minutes`,
        timestamp: Date.now()
      });
    }
  }

  processActivity(activity) {
    this.metrics.traffic = {
      activeUsers: activity.activeUsers || 0,
      requestsPerSecond: activity.rps || 0,
      avgLatency: activity.latency || 0
    };
  }

  // ============= DISPLAY =============

  displayStatus(service, status, responseTime, error = null) {
    const timestamp = new Date().toISOString();
    let statusDisplay;
    
    if (status === 'DOWN') {
      statusDisplay = chalk.red('DOWN');
    } else if (status === 200) {
      statusDisplay = chalk.green('UP');
    } else {
      statusDisplay = chalk.yellow(`${status}`);
    }
    
    let responseDisplay = '';
    if (responseTime > 0) {
      if (responseTime < 500) {
        responseDisplay = chalk.green(`${responseTime}ms`);
      } else if (responseTime < 2000) {
        responseDisplay = chalk.yellow(`${responseTime}ms`);
      } else {
        responseDisplay = chalk.red(`${responseTime}ms`);
      }
    }
    
    console.log(
      `[${chalk.gray(timestamp)}] ${service}: ${statusDisplay} ${responseDisplay}`
    );
    
    if (error) {
      console.log(chalk.red(`   Error: ${error}`));
    }
  }

  // ============= DASHBOARD =============

  async generateDashboard() {
    const dashboard = {
      timestamp: new Date().toISOString(),
      summary: {
        services: this.config.endpoints.length,
        healthy: 0,
        degraded: 0,
        down: 0
      },
      uptime: {},
      performance: this.metrics.performance,
      alerts: this.metrics.alerts.filter(a => 
        Date.now() - a.timestamp < 3600000
      ),
      errors: {}
    };
    
    // Calculate service health
    for (const [service, data] of Object.entries(this.metrics.uptime)) {
      const lastCheck = data.history[data.history.length - 1];
      
      if (lastCheck?.available) {
        if (data.avgResponseTime < 1000) {
          dashboard.summary.healthy++;
        } else {
          dashboard.summary.degraded++;
        }
      } else {
        dashboard.summary.down++;
      }
      
      dashboard.uptime[service] = {
        availability: data.availability,
        avgResponseTime: data.avgResponseTime,
        lastCheck: lastCheck
      };
    }
    
    // Error summary
    for (const [service, errors] of Object.entries(this.metrics.errors)) {
      const recentErrors = errors.filter(e => 
        Date.now() - e.timestamp < 3600000
      );
      
      if (recentErrors.length > 0) {
        dashboard.errors[service] = {
          count: recentErrors.length,
          lastError: recentErrors[recentErrors.length - 1]
        };
      }
    }
    
    return dashboard;
  }
}

// Export for use
module.exports = MonitoringSystem;

// Run if executed directly
if (require.main === module) {
  const monitor = new MonitoringSystem();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\nShutting down monitoring...'));
    monitor.stopMonitoring();
    process.exit(0);
  });
  
  // Start monitoring
  monitor.startMonitoring();
  
  // Listen for alerts
  monitor.on('alert', (alert) => {
    // Handle alerts (send notifications, trigger automation, etc.)
  });
  
  monitor.on('incident', (incident) => {
    // Handle major incidents
    console.log(chalk.red.bold('\n🚨 MAJOR INCIDENT DECLARED 🚨'));
  });
}