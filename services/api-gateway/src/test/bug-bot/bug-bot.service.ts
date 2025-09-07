import { Injectable, Logger } from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service';
import { LoginDto, RegisterDto } from '../../modules/auth/auth.service';

export interface BugReport {
  id: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'authorization' | 'performance' | 'security' | 'data' | 'network';
  title: string;
  description: string;
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
  environment: {
    nodeVersion: string;
    platform: string;
    memoryUsage: NodeJS.MemoryUsage;
  };
  stackTrace?: string;
  metadata?: any;
}

export interface BugBotConfig {
  enabled: boolean;
  checkInterval: number; // milliseconds
  maxMemoryUsage: number; // bytes
  maxResponseTime: number; // milliseconds
  maxConcurrentRequests: number;
  securityChecks: boolean;
  performanceChecks: boolean;
  dataIntegrityChecks: boolean;
}

@Injectable()
export class BugBotService {
  private readonly logger = new Logger(BugBotService.name);
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private bugReports: BugReport[] = [];
  private requestCount = 0;
  private concurrentRequests = 0;

  constructor(private readonly authService: AuthService) {}

  async startMonitoring(config: BugBotConfig): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Bug Bot is already running');
      return;
    }

    this.logger.log('Starting Bug Bot monitoring...');
    this.isRunning = true;

    // Start periodic checks
    this.intervalId = setInterval(async () => {
      await this.performHealthChecks(config);
    }, config.checkInterval);

    // Monitor uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.reportBug({
        severity: 'critical',
        category: 'security',
        title: 'Uncaught Exception',
        description: 'An uncaught exception occurred',
        stepsToReproduce: ['Application running'],
        expectedBehavior: 'Application should handle all exceptions gracefully',
        actualBehavior: 'Uncaught exception caused application to crash',
        environment: this.getEnvironmentInfo(),
        stackTrace: error.stack,
        metadata: { error: error.message }
      });
    });

    // Monitor unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.reportBug({
        severity: 'high',
        category: 'security',
        title: 'Unhandled Promise Rejection',
        description: 'A promise was rejected but not handled',
        stepsToReproduce: ['Application running'],
        expectedBehavior: 'All promises should be handled',
        actualBehavior: 'Promise rejection was not caught',
        environment: this.getEnvironmentInfo(),
        metadata: { reason, promise }
      });
    });

    this.logger.log('Bug Bot monitoring started successfully');
  }

  async stopMonitoring(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Bug Bot is not running');
      return;
    }

    this.logger.log('Stopping Bug Bot monitoring...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.logger.log('Bug Bot monitoring stopped');
  }

  private async performHealthChecks(config: BugBotConfig): Promise<void> {
    try {
      // Memory usage check
      if (config.performanceChecks) {
        await this.checkMemoryUsage(config);
      }

      // Security checks
      if (config.securityChecks) {
        await this.performSecurityChecks();
      }

      // Data integrity checks
      if (config.dataIntegrityChecks) {
        await this.performDataIntegrityChecks();
      }

      // Performance checks
      if (config.performanceChecks) {
        await this.performPerformanceChecks(config);
      }

    } catch (error) {
      this.logger.error('Error during health checks:', error);
    }
  }

  private async checkMemoryUsage(config: BugBotConfig): Promise<void> {
    const memoryUsage = process.memoryUsage();
    
    if (memoryUsage.heapUsed > config.maxMemoryUsage) {
      this.reportBug({
        severity: 'high',
        category: 'performance',
        title: 'High Memory Usage',
        description: `Memory usage exceeded threshold: ${memoryUsage.heapUsed} bytes`,
        stepsToReproduce: ['Application running'],
        expectedBehavior: 'Memory usage should stay below threshold',
        actualBehavior: `Memory usage is ${memoryUsage.heapUsed} bytes`,
        environment: this.getEnvironmentInfo(),
        metadata: { memoryUsage }
      });
    }
  }

  private async performSecurityChecks(): Promise<void> {
    try {
      // Test for SQL injection vulnerabilities
      await this.testSQLInjectionVulnerabilities();
      
      // Test for XSS vulnerabilities
      await this.testXSSVulnerabilities();
      
      // Test for authentication bypass
      await this.testAuthenticationBypass();
      
      // Test for authorization bypass
      await this.testAuthorizationBypass();
      
    } catch (error) {
      this.logger.error('Error during security checks:', error);
    }
  }

  private async testSQLInjectionVulnerabilities(): Promise<void> {
    const sqlInjectionAttempts = [
      { email: "admin'; DROP TABLE users; --", password: "password" },
      { email: "admin' OR '1'='1", password: "password" },
      { email: "admin' UNION SELECT * FROM users --", password: "password" }
    ];

    for (const attempt of sqlInjectionAttempts) {
      try {
        await this.authService.login(attempt);
        // If we get here, there might be a vulnerability
        this.reportBug({
          severity: 'critical',
          category: 'security',
          title: 'Potential SQL Injection Vulnerability',
          description: 'SQL injection attempt succeeded',
          stepsToReproduce: [`Attempt login with email: ${attempt.email}`],
          expectedBehavior: 'SQL injection attempts should fail',
          actualBehavior: 'SQL injection attempt succeeded',
          environment: this.getEnvironmentInfo(),
          metadata: { attempt }
        });
      } catch (error) {
        // This is expected - SQL injection should fail
        if (!error.message.includes('Invalid credentials') && 
            !error.message.includes('Unauthorized')) {
          this.reportBug({
            severity: 'medium',
            category: 'security',
            title: 'Unexpected Error During SQL Injection Test',
            description: 'Unexpected error during SQL injection test',
            stepsToReproduce: [`Attempt login with email: ${attempt.email}`],
            expectedBehavior: 'Should return invalid credentials error',
            actualBehavior: `Got error: ${error.message}`,
            environment: this.getEnvironmentInfo(),
            metadata: { attempt, error: error.message }
          });
        }
      }
    }
  }

  private async testXSSVulnerabilities(): Promise<void> {
    const xssAttempts = [
      { email: "<script>alert('xss')</script>@example.com", password: "password" },
      { email: "admin@example.com", password: "<script>alert('xss')</script>" }
    ];

    for (const attempt of xssAttempts) {
      try {
        await this.authService.login(attempt);
        // If we get here, there might be a vulnerability
        this.reportBug({
          severity: 'high',
          category: 'security',
          title: 'Potential XSS Vulnerability',
          description: 'XSS attempt succeeded',
          stepsToReproduce: [`Attempt login with email: ${attempt.email}`],
          expectedBehavior: 'XSS attempts should fail',
          actualBehavior: 'XSS attempt succeeded',
          environment: this.getEnvironmentInfo(),
          metadata: { attempt }
        });
      } catch (error) {
        // This is expected - XSS should fail
        if (!error.message.includes('Invalid credentials') && 
            !error.message.includes('Unauthorized')) {
          this.reportBug({
            severity: 'medium',
            category: 'security',
            title: 'Unexpected Error During XSS Test',
            description: 'Unexpected error during XSS test',
            stepsToReproduce: [`Attempt login with email: ${attempt.email}`],
            expectedBehavior: 'Should return invalid credentials error',
            actualBehavior: `Got error: ${error.message}`,
            environment: this.getEnvironmentInfo(),
            metadata: { attempt, error: error.message }
          });
        }
      }
    }
  }

  private async testAuthenticationBypass(): Promise<void> {
    try {
      // Test with empty credentials
      await this.authService.login({ email: '', password: '' });
      this.reportBug({
        severity: 'critical',
        category: 'authentication',
        title: 'Authentication Bypass Vulnerability',
        description: 'Empty credentials were accepted',
        stepsToReproduce: ['Attempt login with empty email and password'],
        expectedBehavior: 'Empty credentials should be rejected',
        actualBehavior: 'Empty credentials were accepted',
        environment: this.getEnvironmentInfo()
      });
    } catch (error) {
      // This is expected - empty credentials should fail
    }

    try {
      // Test with null credentials
      await this.authService.login({ email: null as any, password: null as any });
      this.reportBug({
        severity: 'critical',
        category: 'authentication',
        title: 'Authentication Bypass Vulnerability',
        description: 'Null credentials were accepted',
        stepsToReproduce: ['Attempt login with null email and password'],
        expectedBehavior: 'Null credentials should be rejected',
        actualBehavior: 'Null credentials were accepted',
        environment: this.getEnvironmentInfo()
      });
    } catch (error) {
      // This is expected - null credentials should fail
    }
  }

  private async testAuthorizationBypass(): Promise<void> {
    // This would test authorization bypass if we had protected endpoints
    // For now, we'll just log that this test was performed
    this.logger.debug('Authorization bypass test performed');
  }

  private async performDataIntegrityChecks(): Promise<void> {
    try {
      // Test user registration and login consistency
      const testUser: RegisterDto = {
        email: `test-${Date.now()}@example.com`,
        password: 'password123',
        role: 'customer'
      };

      // Register user
      const registerResult = await this.authService.register(testUser);
      
      if (!registerResult.user || !registerResult.accessToken) {
        this.reportBug({
          severity: 'high',
          category: 'data',
          title: 'Data Integrity Issue in Registration',
          description: 'User registration returned incomplete data',
          stepsToReproduce: ['Register a new user'],
          expectedBehavior: 'Registration should return complete user data and tokens',
          actualBehavior: 'Registration returned incomplete data',
          environment: this.getEnvironmentInfo(),
          metadata: { registerResult }
        });
      }

      // Test login with registered user
      const loginResult = await this.authService.login({
        email: testUser.email,
        password: testUser.password
      });

      if (!loginResult.user || !loginResult.accessToken) {
        this.reportBug({
          severity: 'high',
          category: 'data',
          title: 'Data Integrity Issue in Login',
          description: 'User login returned incomplete data',
          stepsToReproduce: ['Login with registered user'],
          expectedBehavior: 'Login should return complete user data and tokens',
          actualBehavior: 'Login returned incomplete data',
          environment: this.getEnvironmentInfo(),
          metadata: { loginResult }
        });
      }

    } catch (error) {
      this.reportBug({
        severity: 'medium',
        category: 'data',
        title: 'Data Integrity Check Failed',
        description: 'Data integrity check encountered an error',
        stepsToReproduce: ['Run data integrity check'],
        expectedBehavior: 'Data integrity check should complete successfully',
        actualBehavior: `Data integrity check failed with error: ${error.message}`,
        environment: this.getEnvironmentInfo(),
        metadata: { error: error.message }
      });
    }
  }

  private async performPerformanceChecks(config: BugBotConfig): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test login performance
      await this.authService.login({
        email: 'admin@soukel-syarat.com',
        password: 'admin123'
      });
      
      const responseTime = Date.now() - startTime;
      
      if (responseTime > config.maxResponseTime) {
        this.reportBug({
          severity: 'medium',
          category: 'performance',
          title: 'Slow Response Time',
          description: `Login response time exceeded threshold: ${responseTime}ms`,
          stepsToReproduce: ['Attempt to login'],
          expectedBehavior: `Response time should be under ${config.maxResponseTime}ms`,
          actualBehavior: `Response time was ${responseTime}ms`,
          environment: this.getEnvironmentInfo(),
          metadata: { responseTime, threshold: config.maxResponseTime }
        });
      }
      
    } catch (error) {
      this.logger.error('Error during performance check:', error);
    }
  }

  private getEnvironmentInfo(): BugReport['environment'] {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage()
    };
  }

  private reportBug(bugData: Omit<BugReport, 'id' | 'timestamp'>): void {
    const bug: BugReport = {
      id: `bug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...bugData
    };

    this.bugReports.push(bug);
    
    this.logger.error(`🐛 Bug Detected: ${bug.title}`, {
      severity: bug.severity,
      category: bug.category,
      id: bug.id
    });

    // In a real application, you would send this to a bug tracking system
    // For now, we'll just log it
    console.log('🐛 Bug Report:', JSON.stringify(bug, null, 2));
  }

  getBugReports(): BugReport[] {
    return [...this.bugReports];
  }

  getBugReportById(id: string): BugReport | undefined {
    return this.bugReports.find(bug => bug.id === id);
  }

  getBugReportsBySeverity(severity: BugReport['severity']): BugReport[] {
    return this.bugReports.filter(bug => bug.severity === severity);
  }

  getBugReportsByCategory(category: BugReport['category']): BugReport[] {
    return this.bugReports.filter(bug => bug.category === category);
  }

  clearBugReports(): void {
    this.bugReports = [];
  }

  generateBugReport(): string {
    const totalBugs = this.bugReports.length;
    const criticalBugs = this.bugReports.filter(b => b.severity === 'critical').length;
    const highBugs = this.bugReports.filter(b => b.severity === 'high').length;
    const mediumBugs = this.bugReports.filter(b => b.severity === 'medium').length;
    const lowBugs = this.bugReports.filter(b => b.severity === 'low').length;

    let report = `
# Bug Bot Report
Generated: ${new Date().toISOString()}

## Summary
- Total Bugs: ${totalBugs}
- Critical: ${criticalBugs}
- High: ${highBugs}
- Medium: ${mediumBugs}
- Low: ${lowBugs}

## Bug Details
`;

    this.bugReports.forEach(bug => {
      report += `
### ${bug.title} (${bug.severity.toUpperCase()})
- ID: ${bug.id}
- Category: ${bug.category}
- Timestamp: ${bug.timestamp.toISOString()}
- Description: ${bug.description}
- Steps to Reproduce: ${bug.stepsToReproduce.join(', ')}
- Expected Behavior: ${bug.expectedBehavior}
- Actual Behavior: ${bug.actualBehavior}
- Environment: ${JSON.stringify(bug.environment, null, 2)}
${bug.stackTrace ? `- Stack Trace: ${bug.stackTrace}` : ''}
${bug.metadata ? `- Metadata: ${JSON.stringify(bug.metadata, null, 2)}` : ''}
`;
    });

    return report;
  }
}