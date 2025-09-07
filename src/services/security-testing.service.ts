/**
 * Security Testing Service
 * Comprehensive security testing and vulnerability assessment
 */

import InputSanitizationService from './input-sanitization.service';
import SecureFileUploadService from './secure-file-upload.service';

export interface SecurityTestResult {
  testName: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

export class SecurityTestingService {
  private static instance: SecurityTestingService;
  private testResults: SecurityTestResult[] = [];

  static getInstance(): SecurityTestingService {
    if (!SecurityTestingService.instance) {
      SecurityTestingService.instance = new SecurityTestingService();
    }
    return SecurityTestingService.instance;
  }

  /**
   * Run all security tests
   */
  async runAllSecurityTests(): Promise<SecurityTestResult[]> {
    console.log('🔒 Starting security testing...');
    
    this.testResults = [];
    
    // Run authentication tests
    await this.testPasswordValidation();
    await this.testEmailValidation();
    
    // Run input validation tests
    await this.testXSSPrevention();
    await this.testSQLInjectionPrevention();
    
    // Run file upload tests
    await this.testFileUploadSecurity();
    
    console.log('✅ Security testing completed');
    return this.testResults;
  }

  /**
   * Test password validation
   */
  private async testPasswordValidation(): Promise<void> {
    const weakPasswords = ['123456', 'password', 'qwerty'];
    const strongPassword = 'StrongP@ssw0rd123!';
    
    for (const weakPassword of weakPasswords) {
      const result = InputSanitizationService.validatePassword(weakPassword);
      if (result.isValid) {
        this.testResults.push({
          testName: 'Password Validation',
          status: 'failed',
          message: 'Weak passwords are being accepted',
          severity: 'high',
          timestamp: new Date()
        });
        return;
      }
    }

    const strongResult = InputSanitizationService.validatePassword(strongPassword);
    if (!strongResult.isValid) {
      this.testResults.push({
        testName: 'Password Validation',
        status: 'failed',
        message: 'Strong passwords are being rejected',
        severity: 'high',
        timestamp: new Date()
      });
      return;
    }

    this.testResults.push({
      testName: 'Password Validation',
      status: 'passed',
      message: 'Password validation working correctly',
      severity: 'high',
      timestamp: new Date()
    });
  }

  /**
   * Test email validation
   */
  private async testEmailValidation(): Promise<void> {
    const invalidEmails = ['invalid', 'test@', '@domain.com'];
    const validEmail = 'test@example.com';
    
    for (const invalidEmail of invalidEmails) {
      const result = InputSanitizationService.validateEmail(invalidEmail);
      if (result.isValid) {
        this.testResults.push({
          testName: 'Email Validation',
          status: 'failed',
          message: 'Invalid emails are being accepted',
          severity: 'medium',
          timestamp: new Date()
        });
        return;
      }
    }

    const validResult = InputSanitizationService.validateEmail(validEmail);
    if (!validResult.isValid) {
      this.testResults.push({
        testName: 'Email Validation',
        status: 'failed',
        message: 'Valid emails are being rejected',
        severity: 'medium',
        timestamp: new Date()
      });
      return;
    }

    this.testResults.push({
      testName: 'Email Validation',
      status: 'passed',
      message: 'Email validation working correctly',
      severity: 'medium',
      timestamp: new Date()
    });
  }

  /**
   * Test XSS prevention
   */
  private async testXSSPrevention(): Promise<void> {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      'javascript:alert("XSS")',
      '<img src="x" onerror="alert(\'XSS\')">'
    ];

    for (const payload of xssPayloads) {
      const result = InputSanitizationService.sanitizeString(payload);
      if (result.sanitizedValue.includes('<script') || 
          result.sanitizedValue.includes('javascript:') ||
          result.sanitizedValue.includes('onerror=')) {
        this.testResults.push({
          testName: 'XSS Prevention',
          status: 'failed',
          message: 'XSS payload not properly sanitized',
          severity: 'critical',
          timestamp: new Date()
        });
        return;
      }
    }

    this.testResults.push({
      testName: 'XSS Prevention',
      status: 'passed',
      message: 'XSS prevention working correctly',
      severity: 'critical',
      timestamp: new Date()
    });
  }

  /**
   * Test SQL injection prevention
   */
  private async testSQLInjectionPrevention(): Promise<void> {
    const sqlPayloads = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "' UNION SELECT * FROM users --"
    ];

    for (const payload of sqlPayloads) {
      const result = InputSanitizationService.sanitizeString(payload);
      if (result.sanitizedValue.includes("'") || 
          result.sanitizedValue.includes('--') ||
          result.sanitizedValue.includes('UNION') ||
          result.sanitizedValue.includes('DROP')) {
        this.testResults.push({
          testName: 'SQL Injection Prevention',
          status: 'failed',
          message: 'SQL injection payload not properly sanitized',
          severity: 'critical',
          timestamp: new Date()
        });
        return;
      }
    }

    this.testResults.push({
      testName: 'SQL Injection Prevention',
      status: 'passed',
      message: 'SQL injection prevention working correctly',
      severity: 'critical',
      timestamp: new Date()
    });
  }

  /**
   * Test file upload security
   */
  private async testFileUploadSecurity(): Promise<void> {
    // Create mock malicious file
    const maliciousFile = new File(['<script>alert("XSS")</script>'], 'malicious.html', { type: 'text/html' });
    
    try {
      const result = await SecureFileUploadService.uploadFile(
        maliciousFile, 
        'test', 
        'test-user', 
        SecureFileUploadService['DEFAULT_IMAGE_RULES']
      );
      
      if (result.success) {
        this.testResults.push({
          testName: 'File Upload Security',
          status: 'failed',
          message: 'Malicious file was uploaded successfully',
          severity: 'critical',
          timestamp: new Date()
        });
        return;
      }
    } catch (error) {
      // Expected behavior - malicious file should be rejected
    }

    this.testResults.push({
      testName: 'File Upload Security',
      status: 'passed',
      message: 'File upload security working correctly',
      severity: 'critical',
      timestamp: new Date()
    });
  }

  /**
   * Get test results summary
   */
  getTestSummary(): {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    warningTests: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    overallScore: number;
  } {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === 'passed').length;
    const failedTests = this.testResults.filter(r => r.status === 'failed').length;
    const warningTests = this.testResults.filter(r => r.status === 'warning').length;

    const criticalIssues = this.testResults.filter(r => r.severity === 'critical' && r.status === 'failed').length;
    const highIssues = this.testResults.filter(r => r.severity === 'high' && r.status === 'failed').length;
    const mediumIssues = this.testResults.filter(r => r.severity === 'medium' && r.status === 'failed').length;
    const lowIssues = this.testResults.filter(r => r.severity === 'low' && r.status === 'failed').length;

    const overallScore = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

    return {
      totalTests,
      passedTests,
      failedTests,
      warningTests,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      overallScore
    };
  }

  /**
   * Export test results
   */
  exportTestResults(): string {
    const summary = this.getTestSummary();
    return JSON.stringify({
      summary,
      results: this.testResults
    }, null, 2);
  }
}

export default SecurityTestingService;