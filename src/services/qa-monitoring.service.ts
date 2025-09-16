/**
 * 🔍 PROFESSIONAL QA MONITORING SERVICE
 * Souk El-Syarat - Comprehensive Quality Assurance & Bug Detection
 */

export interface QAMetric {
  id: string;
  type: 'error' | 'warning' | 'performance' | 'accessibility' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  component: string;
  message: string;
  stack?: string;
  timestamp: Date;
  userAgent?: string;
  url?: string;
  resolved: boolean;
  resolution?: string;
}

export interface QAReport {
  id: string;
  timestamp: Date;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  resolvedIssues: number;
  metrics: QAMetric[];
  summary: {
    errorRate: number;
    performanceScore: number;
    accessibilityScore: number;
    securityScore: number;
  };
}

export class QAMonitoringService {
  private static instance: QAMonitoringService;
  private metrics: QAMetric[] = [];
  private maxMetrics = 1000;
  private observers: Set<(report: QAReport) => void> = new Set();

  static getInstance(): QAMonitoringService {
    if (!QAMonitoringService.instance) {
      QAMonitoringService.instance = new QAMonitoringService();
    }
    return QAMonitoringService.instance;
  }

  /**
   * Record a QA metric
   */
  recordMetric(metric: Omit<QAMetric, 'id' | 'timestamp'>): string {
    const id = `qa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newMetric: QAMetric = {
      ...metric,
      id,
      timestamp: new Date(),
    };

    this.metrics.push(newMetric);

    // Keep only the latest metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Notify observers
    this.notifyObservers();

    return id;
  }

  /**
   * Record an error
   */
  recordError(
    component: string,
    message: string,
    severity: QAMetric['severity'] = 'medium',
    stack?: string
  ): string {
    return this.recordMetric({
      type: 'error',
      severity,
      component,
      message,
      stack,
      resolved: false,
    });
  }

  /**
   * Record a warning
   */
  recordWarning(
    component: string,
    message: string,
    severity: QAMetric['severity'] = 'low'
  ): string {
    return this.recordMetric({
      type: 'warning',
      severity,
      component,
      message,
      resolved: false,
    });
  }

  /**
   * Record a performance issue
   */
  recordPerformanceIssue(
    component: string,
    message: string,
    severity: QAMetric['severity'] = 'medium'
  ): string {
    return this.recordMetric({
      type: 'performance',
      severity,
      component,
      message,
      resolved: false,
    });
  }

  /**
   * Record an accessibility issue
   */
  recordAccessibilityIssue(
    component: string,
    message: string,
    severity: QAMetric['severity'] = 'medium'
  ): string {
    return this.recordMetric({
      type: 'accessibility',
      severity,
      component,
      message,
      resolved: false,
    });
  }

  /**
   * Record a security issue
   */
  recordSecurityIssue(
    component: string,
    message: string,
    severity: QAMetric['severity'] = 'high'
  ): string {
    return this.recordMetric({
      type: 'security',
      severity,
      component,
      message,
      resolved: false,
    });
  }

  /**
   * Resolve an issue
   */
  resolveIssue(metricId: string, resolution: string): boolean {
    const metric = this.metrics.find(m => m.id === metricId);
    if (metric) {
      metric.resolved = true;
      metric.resolution = resolution;
      this.notifyObservers();
      return true;
    }
    return false;
  }

  /**
   * Get current QA report
   */
  getQAReport(): QAReport {
    const totalIssues = this.metrics.length;
    const criticalIssues = this.metrics.filter(m => m.severity === 'critical').length;
    const highIssues = this.metrics.filter(m => m.severity === 'high').length;
    const mediumIssues = this.metrics.filter(m => m.severity === 'medium').length;
    const lowIssues = this.metrics.filter(m => m.severity === 'low').length;
    const resolvedIssues = this.metrics.filter(m => m.resolved).length;

    const errorRate = totalIssues > 0 ? (criticalIssues + highIssues) / totalIssues : 0;
    const performanceScore = this.calculatePerformanceScore();
    const accessibilityScore = this.calculateAccessibilityScore();
    const securityScore = this.calculateSecurityScore();

    return {
      id: `qa_report_${Date.now()}`,
      timestamp: new Date(),
      totalIssues,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      resolvedIssues,
      metrics: [...this.metrics],
      summary: {
        errorRate,
        performanceScore,
        accessibilityScore,
        securityScore,
      },
    };
  }

  /**
   * Get metrics by type
   */
  getMetricsByType(type: QAMetric['type']): QAMetric[] {
    return this.metrics.filter(m => m.type === type);
  }

  /**
   * Get unresolved issues
   */
  getUnresolvedIssues(): QAMetric[] {
    return this.metrics.filter(m => !m.resolved);
  }

  /**
   * Get critical issues
   */
  getCriticalIssues(): QAMetric[] {
    return this.metrics.filter(m => m.severity === 'critical' && !m.resolved);
  }

  /**
   * Subscribe to QA updates
   */
  subscribe(callback: (report: QAReport) => void): () => void {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.notifyObservers();
  }

  /**
   * Calculate performance score
   */
  private calculatePerformanceScore(): number {
    const performanceIssues = this.metrics.filter(m => m.type === 'performance');
    if (performanceIssues.length === 0) return 100;

    const criticalIssues = performanceIssues.filter(m => m.severity === 'critical').length;
    const highIssues = performanceIssues.filter(m => m.severity === 'high').length;
    const mediumIssues = performanceIssues.filter(m => m.severity === 'medium').length;
    const lowIssues = performanceIssues.filter(m => m.severity === 'low').length;

    const score = 100 - (criticalIssues * 20 + highIssues * 10 + mediumIssues * 5 + lowIssues * 2);
    return Math.max(0, score);
  }

  /**
   * Calculate accessibility score
   */
  private calculateAccessibilityScore(): number {
    const accessibilityIssues = this.metrics.filter(m => m.type === 'accessibility');
    if (accessibilityIssues.length === 0) return 100;

    const criticalIssues = accessibilityIssues.filter(m => m.severity === 'critical').length;
    const highIssues = accessibilityIssues.filter(m => m.severity === 'high').length;
    const mediumIssues = accessibilityIssues.filter(m => m.severity === 'medium').length;
    const lowIssues = accessibilityIssues.filter(m => m.severity === 'low').length;

    const score = 100 - (criticalIssues * 25 + highIssues * 15 + mediumIssues * 8 + lowIssues * 3);
    return Math.max(0, score);
  }

  /**
   * Calculate security score
   */
  private calculateSecurityScore(): number {
    const securityIssues = this.metrics.filter(m => m.type === 'security');
    if (securityIssues.length === 0) return 100;

    const criticalIssues = securityIssues.filter(m => m.severity === 'critical').length;
    const highIssues = securityIssues.filter(m => m.severity === 'high').length;
    const mediumIssues = securityIssues.filter(m => m.severity === 'medium').length;
    const lowIssues = securityIssues.filter(m => m.severity === 'low').length;

    const score = 100 - (criticalIssues * 30 + highIssues * 20 + mediumIssues * 10 + lowIssues * 5);
    return Math.max(0, score);
  }

  /**
   * Notify observers
   */
  private notifyObservers(): void {
    const report = this.getQAReport();
    this.observers.forEach(callback => {
      try {
        callback(report);
      } catch (error) {
        console.error('Error in QA observer:', error);
      }
    });
  }

  /**
   * Get QA statistics
   */
  getStatistics(): {
    totalMetrics: number;
    resolvedMetrics: number;
    unresolvedMetrics: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    averageResolutionTime: number;
  } {
    const totalMetrics = this.metrics.length;
    const resolvedMetrics = this.metrics.filter(m => m.resolved).length;
    const unresolvedMetrics = totalMetrics - resolvedMetrics;
    const criticalIssues = this.metrics.filter(m => m.severity === 'critical').length;
    const highIssues = this.metrics.filter(m => m.severity === 'high').length;
    const mediumIssues = this.metrics.filter(m => m.severity === 'medium').length;
    const lowIssues = this.metrics.filter(m => m.severity === 'low').length;

    // Calculate average resolution time
    const resolvedMetricsWithTime = this.metrics.filter(m => m.resolved && m.resolution);
    const averageResolutionTime = resolvedMetricsWithTime.length > 0 
      ? resolvedMetricsWithTime.reduce((sum, m) => {
          const resolutionTime = new Date().getTime() - m.timestamp.getTime();
          return sum + resolutionTime;
        }, 0) / resolvedMetricsWithTime.length
      : 0;

    return {
      totalMetrics,
      resolvedMetrics,
      unresolvedMetrics,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      averageResolutionTime,
    };
  }
}

// Export singleton instance
export const qaMonitoring = QAMonitoringService.getInstance();
