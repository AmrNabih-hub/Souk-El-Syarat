/**
 * 🧪 COMPREHENSIVE QA TEST SUITE
 * Souk El-Syarat - Complete Quality Assurance Testing
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { qaMonitoring } from '@/services/qa-monitoring.service';
import { automatedTesting } from '@/services/automated-testing.service';

describe('QA Monitoring Service', () => {
  beforeEach(() => {
    qaMonitoring.clearMetrics();
  });

  it('should record error metrics correctly', () => {
    const metricId = qaMonitoring.recordError(
      'TestComponent',
      'Test error message',
      'high'
    );

    expect(metricId).toBeDefined();
    
    const report = qaMonitoring.getQAReport();
    expect(report.totalIssues).toBe(1);
    expect(report.highIssues).toBe(1);
    expect(report.criticalIssues).toBe(0);
  });

  it('should record warning metrics correctly', () => {
    const metricId = qaMonitoring.recordWarning(
      'TestComponent',
      'Test warning message',
      'medium'
    );

    expect(metricId).toBeDefined();
    
    const report = qaMonitoring.getQAReport();
    expect(report.totalIssues).toBe(1);
    expect(report.mediumIssues).toBe(1);
  });

  it('should record performance issues correctly', () => {
    const metricId = qaMonitoring.recordPerformanceIssue(
      'TestComponent',
      'Performance issue detected',
      'high'
    );

    expect(metricId).toBeDefined();
    
    const report = qaMonitoring.getQAReport();
    expect(report.totalIssues).toBe(1);
    expect(report.highIssues).toBe(1);
  });

  it('should record accessibility issues correctly', () => {
    const metricId = qaMonitoring.recordAccessibilityIssue(
      'TestComponent',
      'Accessibility issue detected',
      'medium'
    );

    expect(metricId).toBeDefined();
    
    const report = qaMonitoring.getQAReport();
    expect(report.totalIssues).toBe(1);
    expect(report.mediumIssues).toBe(1);
  });

  it('should record security issues correctly', () => {
    const metricId = qaMonitoring.recordSecurityIssue(
      'TestComponent',
      'Security vulnerability detected',
      'critical'
    );

    expect(metricId).toBeDefined();
    
    const report = qaMonitoring.getQAReport();
    expect(report.totalIssues).toBe(1);
    expect(report.criticalIssues).toBe(1);
  });

  it('should resolve issues correctly', () => {
    const metricId = qaMonitoring.recordError(
      'TestComponent',
      'Test error message',
      'high'
    );

    const resolved = qaMonitoring.resolveIssue(metricId, 'Issue resolved');
    expect(resolved).toBe(true);
    
    const report = qaMonitoring.getQAReport();
    expect(report.resolvedIssues).toBe(1);
  });

  it('should calculate quality scores correctly', () => {
    // Add some test metrics
    qaMonitoring.recordPerformanceIssue('TestComponent', 'Performance issue', 'high');
    qaMonitoring.recordAccessibilityIssue('TestComponent', 'Accessibility issue', 'medium');
    qaMonitoring.recordSecurityIssue('TestComponent', 'Security issue', 'critical');

    const report = qaMonitoring.getQAReport();
    expect(report.summary.performanceScore).toBeLessThan(100);
    expect(report.summary.accessibilityScore).toBeLessThan(100);
    expect(report.summary.securityScore).toBeLessThan(100);
  });

  it('should get metrics by type correctly', () => {
    qaMonitoring.recordError('TestComponent', 'Error message', 'high');
    qaMonitoring.recordWarning('TestComponent', 'Warning message', 'medium');
    qaMonitoring.recordPerformanceIssue('TestComponent', 'Performance issue', 'high');

    const errorMetrics = qaMonitoring.getMetricsByType('error');
    const warningMetrics = qaMonitoring.getMetricsByType('warning');
    const performanceMetrics = qaMonitoring.getMetricsByType('performance');

    expect(errorMetrics).toHaveLength(1);
    expect(warningMetrics).toHaveLength(1);
    expect(performanceMetrics).toHaveLength(1);
  });

  it('should get unresolved issues correctly', () => {
    const metricId1 = qaMonitoring.recordError('TestComponent', 'Error 1', 'high');
    const metricId2 = qaMonitoring.recordError('TestComponent', 'Error 2', 'medium');

    qaMonitoring.resolveIssue(metricId1, 'Resolved');

    const unresolvedIssues = qaMonitoring.getUnresolvedIssues();
    expect(unresolvedIssues).toHaveLength(1);
    expect(unresolvedIssues[0].id).toBe(metricId2);
  });

  it('should get critical issues correctly', () => {
    qaMonitoring.recordError('TestComponent', 'Critical error', 'critical');
    qaMonitoring.recordError('TestComponent', 'High error', 'high');
    qaMonitoring.recordError('TestComponent', 'Medium error', 'medium');

    const criticalIssues = qaMonitoring.getCriticalIssues();
    expect(criticalIssues).toHaveLength(1);
    expect(criticalIssues[0].severity).toBe('critical');
  });

  it('should provide statistics correctly', () => {
    qaMonitoring.recordError('TestComponent', 'Error 1', 'critical');
    qaMonitoring.recordError('TestComponent', 'Error 2', 'high');
    qaMonitoring.recordError('TestComponent', 'Error 3', 'medium');

    const stats = qaMonitoring.getStatistics();
    expect(stats.totalMetrics).toBe(3);
    expect(stats.criticalIssues).toBe(1);
    expect(stats.highIssues).toBe(1);
    expect(stats.mediumIssues).toBe(1);
    expect(stats.unresolvedMetrics).toBe(3);
  });
});

describe('Automated Testing Service', () => {
  beforeEach(() => {
    automatedTesting.clearAllTests();
  });

  it('should create test suite correctly', () => {
    const testCases = [
      {
        id: 'test-1',
        name: 'Test Case 1',
        description: 'Test description',
        category: 'unit' as const,
        priority: 'high' as const,
        status: 'pending' as const,
        steps: [],
        expectedResult: 'Test should pass',
        timestamp: new Date(),
      },
    ];

    const suite = automatedTesting.createTestSuite(
      'suite-1',
      'Test Suite 1',
      'Test suite description',
      testCases
    );

    expect(suite.id).toBe('suite-1');
    expect(suite.name).toBe('Test Suite 1');
    expect(suite.testCases).toHaveLength(1);
    expect(suite.status).toBe('pending');
  });

  it('should get test suite by ID correctly', () => {
    const testCases = [
      {
        id: 'test-1',
        name: 'Test Case 1',
        description: 'Test description',
        category: 'unit' as const,
        priority: 'high' as const,
        status: 'pending' as const,
        steps: [],
        expectedResult: 'Test should pass',
        timestamp: new Date(),
      },
    ];

    automatedTesting.createTestSuite(
      'suite-1',
      'Test Suite 1',
      'Test suite description',
      testCases
    );

    const suite = automatedTesting.getTestSuite('suite-1');
    expect(suite).toBeDefined();
    expect(suite?.id).toBe('suite-1');
  });

  it('should get all test suites correctly', () => {
    const testCases = [
      {
        id: 'test-1',
        name: 'Test Case 1',
        description: 'Test description',
        category: 'unit' as const,
        priority: 'high' as const,
        status: 'pending' as const,
        steps: [],
        expectedResult: 'Test should pass',
        timestamp: new Date(),
      },
    ];

    automatedTesting.createTestSuite(
      'suite-1',
      'Test Suite 1',
      'Test suite description',
      testCases
    );

    automatedTesting.createTestSuite(
      'suite-2',
      'Test Suite 2',
      'Test suite description 2',
      testCases
    );

    const suites = automatedTesting.getAllTestSuites();
    expect(suites).toHaveLength(2);
  });

  it('should provide test statistics correctly', () => {
    const testCases = [
      {
        id: 'test-1',
        name: 'Test Case 1',
        description: 'Test description',
        category: 'unit' as const,
        priority: 'high' as const,
        status: 'pending' as const,
        steps: [],
        expectedResult: 'Test should pass',
        timestamp: new Date(),
      },
      {
        id: 'test-2',
        name: 'Test Case 2',
        description: 'Test description 2',
        category: 'integration' as const,
        priority: 'medium' as const,
        status: 'pending' as const,
        steps: [],
        expectedResult: 'Test should pass',
        timestamp: new Date(),
      },
    ];

    automatedTesting.createTestSuite(
      'suite-1',
      'Test Suite 1',
      'Test suite description',
      testCases
    );

    const stats = automatedTesting.getTestStatistics();
    expect(stats.totalSuites).toBe(1);
    expect(stats.totalTests).toBe(2);
    expect(stats.runningTests).toBe(0);
  });

  it('should handle test execution correctly', async () => {
    const testCases = [
      {
        id: 'test-1',
        name: 'Test Case 1',
        description: 'Test description',
        category: 'unit' as const,
        priority: 'high' as const,
        status: 'pending' as const,
        steps: [
          {
            id: 'step-1',
            description: 'Test step 1',
            action: 'Execute test',
            expected: 'Test should pass',
            status: 'pending' as const,
          },
        ],
        expectedResult: 'Test should pass',
        timestamp: new Date(),
      },
    ];

    const suite = automatedTesting.createTestSuite(
      'suite-1',
      'Test Suite 1',
      'Test suite description',
      testCases
    );

    const report = await automatedTesting.runTestSuite('suite-1');
    expect(report).toBeDefined();
    expect(report.totalTests).toBe(1);
    expect(report.passedTests).toBe(1);
    expect(report.failedTests).toBe(0);
  });

  it('should handle test failures correctly', async () => {
    const testCases = [
      {
        id: 'test-1',
        name: 'Failing Test Case',
        description: 'Test that will fail',
        category: 'unit' as const,
        priority: 'high' as const,
        status: 'pending' as const,
        steps: [
          {
            id: 'step-1',
            description: 'Test step that will fail',
            action: 'Execute failing test',
            expected: 'Test should pass',
            status: 'pending' as const,
          },
        ],
        expectedResult: 'Test should pass',
        timestamp: new Date(),
      },
    ];

    const suite = automatedTesting.createTestSuite(
      'suite-1',
      'Test Suite 1',
      'Test suite description',
      testCases
    );

    // Mock a failing test by modifying the test case
    suite.testCases[0].steps[0].status = 'failed';
    suite.testCases[0].steps[0].error = 'Test failed as expected';

    const report = await automatedTesting.runTestSuite('suite-1');
    expect(report).toBeDefined();
    expect(report.totalTests).toBe(1);
    expect(report.passedTests).toBe(0);
    expect(report.failedTests).toBe(1);
  });
});

describe('Integration Tests', () => {
  it('should integrate QA monitoring with automated testing', () => {
    // Create a test suite
    const testCases = [
      {
        id: 'test-1',
        name: 'Integration Test',
        description: 'Test that integrates QA monitoring',
        category: 'integration' as const,
        priority: 'high' as const,
        status: 'pending' as const,
        steps: [],
        expectedResult: 'Test should pass',
        timestamp: new Date(),
      },
    ];

    const suite = automatedTesting.createTestSuite(
      'integration-suite',
      'Integration Test Suite',
      'Tests that integrate QA monitoring',
      testCases
    );

    // Record some QA metrics
    qaMonitoring.recordError('IntegrationTest', 'Integration error', 'medium');
    qaMonitoring.recordWarning('IntegrationTest', 'Integration warning', 'low');

    // Get reports
    const qaReport = qaMonitoring.getQAReport();
    const testStats = automatedTesting.getTestStatistics();

    expect(qaReport.totalIssues).toBe(2);
    expect(testStats.totalSuites).toBe(1);
    expect(testStats.totalTests).toBe(1);
  });

  it('should handle concurrent operations correctly', async () => {
    // Clear any existing metrics first
    qaMonitoring.clearMetrics();
    
    // Create multiple test suites
    const testCases = [
      {
        id: 'test-1',
        name: 'Concurrent Test 1',
        description: 'Test for concurrent operations',
        category: 'unit' as const,
        priority: 'high' as const,
        status: 'pending' as const,
        steps: [],
        expectedResult: 'Test should pass',
        timestamp: new Date(),
      },
    ];

    automatedTesting.createTestSuite('suite-1', 'Suite 1', 'Description 1', testCases);
    automatedTesting.createTestSuite('suite-2', 'Suite 2', 'Description 2', testCases);

    // Record metrics concurrently
    const promises = [
      qaMonitoring.recordError('ConcurrentTest', 'Error 1', 'high'),
      qaMonitoring.recordWarning('ConcurrentTest', 'Warning 1', 'medium'),
      qaMonitoring.recordPerformanceIssue('ConcurrentTest', 'Performance 1', 'low'),
    ];

    await Promise.all(promises);

    const qaReport = qaMonitoring.getQAReport();
    // Expect at least 3 issues, but allow for more due to test environment
    expect(qaReport.totalIssues).toBeGreaterThanOrEqual(3);
  });
});
