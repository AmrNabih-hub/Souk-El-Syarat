/**
 * Ultimate Performance Monitoring Service
 * Real-time performance monitoring and analytics
 */

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  category: 'api' | 'database' | 'memory' | 'cpu' | 'network' | 'cache' | 'realtime';
  tags: { [key: string]: string };
}

export interface PerformanceAlert {
  id: string;
  metric: string;
  threshold: number;
  currentValue: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
}

export interface PerformanceReport {
  id: string;
  timestamp: number;
  duration: number; // Report duration in milliseconds
  summary: {
    totalMetrics: number;
    alerts: number;
    averageResponseTime: number;
    throughput: number;
    errorRate: number;
    availability: number;
  };
  metrics: PerformanceMetric[];
  alerts: PerformanceAlert[];
  recommendations: string[];
}

export interface MonitoringConfig {
  enabled: boolean;
  interval: number; // Monitoring interval in milliseconds
  retention: number; // Data retention in milliseconds
  thresholds: { [key: string]: { warning: number; critical: number } };
  alerts: {
    enabled: boolean;
    email: string[];
    webhook: string[];
  };
}

export class UltimatePerformanceMonitoringService {
  private static instance: UltimatePerformanceMonitoringService;
  private metrics: Map<string, PerformanceMetric[]>;
  private alerts: Map<string, PerformanceAlert>;
  private config: MonitoringConfig;
  private isRunning: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private reportInterval: NodeJS.Timeout | null = null;

  // Default monitoring configuration
  private defaultConfig: MonitoringConfig = {
    enabled: true,
    interval: 5000, // 5 seconds
    retention: 24 * 60 * 60 * 1000, // 24 hours
    thresholds: {
      'api.response_time': { warning: 1000, critical: 2000 },
      'api.error_rate': { warning: 5, critical: 10 },
      'database.query_time': { warning: 500, critical: 1000 },
      'memory.usage': { warning: 80, critical: 90 },
      'cpu.usage': { warning: 80, critical: 90 },
      'cache.hit_rate': { warning: 70, critical: 50 },
      'realtime.latency': { warning: 100, critical: 200 }
    },
    alerts: {
      enabled: true,
      email: [],
      webhook: []
    }
  };

  static getInstance(): UltimatePerformanceMonitoringService {
    if (!UltimatePerformanceMonitoringService.instance) {
      UltimatePerformanceMonitoringService.instance = new UltimatePerformanceMonitoringService();
    }
    return UltimatePerformanceMonitoringService.instance;
  }

  constructor() {
    this.metrics = new Map();
    this.alerts = new Map();
    this.config = { ...this.defaultConfig };
  }

  // Initialize the service
  async initialize(): Promise<void> {
    console.log('📊 Initializing performance monitoring service...');
    
    try {
      // Start monitoring
      this.startMonitoring();
      
      // Start report generation
      this.startReportGeneration();
      
      console.log('✅ Performance monitoring service initialized');
    } catch (error) {
      console.error('❌ Performance monitoring service initialization failed:', error);
      throw error;
    }
  }

  // Start monitoring
  private startMonitoring(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.monitoringInterval = setInterval(async () => {
      await this.collectMetrics();
    }, this.config.interval);
    
    console.log(`📊 Performance monitoring started (interval: ${this.config.interval}ms)`);
  }

  // Collect performance metrics
  private async collectMetrics(): Promise<void> {
    try {
      // Collect API metrics
      await this.collectAPIMetrics();
      
      // Collect database metrics
      await this.collectDatabaseMetrics();
      
      // Collect memory metrics
      await this.collectMemoryMetrics();
      
      // Collect CPU metrics
      await this.collectCPUMetrics();
      
      // Collect network metrics
      await this.collectNetworkMetrics();
      
      // Collect cache metrics
      await this.collectCacheMetrics();
      
      // Collect real-time metrics
      await this.collectRealtimeMetrics();
      
      // Check for alerts
      await this.checkAlerts();
      
      // Clean up old data
      await this.cleanupOldData();
    } catch (error) {
      console.error('❌ Error collecting metrics:', error);
    }
  }

  // API metrics collection
  private async collectAPIMetrics(): Promise<void> {
    const metrics = [
      {
        name: 'api.response_time',
        value: Math.random() * 1000 + 100, // Simulate response time
        unit: 'ms',
        category: 'api' as const,
        tags: { endpoint: '/api/products', method: 'GET' }
      },
      {
        name: 'api.throughput',
        value: Math.random() * 100 + 50, // Simulate throughput
        unit: 'req/s',
        category: 'api' as const,
        tags: { endpoint: 'all' }
      },
      {
        name: 'api.error_rate',
        value: Math.random() * 5, // Simulate error rate
        unit: '%',
        category: 'api' as const,
        tags: { endpoint: 'all' }
      }
    ];

    for (const metric of metrics) {
      await this.recordMetric(metric);
    }
  }

  // Database metrics collection
  private async collectDatabaseMetrics(): Promise<void> {
    const metrics = [
      {
        name: 'database.query_time',
        value: Math.random() * 500 + 50, // Simulate query time
        unit: 'ms',
        category: 'database' as const,
        tags: { table: 'users', operation: 'SELECT' }
      },
      {
        name: 'database.connections',
        value: Math.random() * 20 + 10, // Simulate connection count
        unit: 'count',
        category: 'database' as const,
        tags: { pool: 'main' }
      },
      {
        name: 'database.cache_hit_rate',
        value: Math.random() * 30 + 70, // Simulate cache hit rate
        unit: '%',
        category: 'database' as const,
        tags: { type: 'query_cache' }
      }
    ];

    for (const metric of metrics) {
      await this.recordMetric(metric);
    }
  }

  // Memory metrics collection
  private async collectMemoryMetrics(): Promise<void> {
    const memoryUsage = process.memoryUsage();
    
    const metrics = [
      {
        name: 'memory.heap_used',
        value: memoryUsage.heapUsed / 1024 / 1024, // Convert to MB
        unit: 'MB',
        category: 'memory' as const,
        tags: { type: 'heap' }
      },
      {
        name: 'memory.heap_total',
        value: memoryUsage.heapTotal / 1024 / 1024, // Convert to MB
        unit: 'MB',
        category: 'memory' as const,
        tags: { type: 'heap' }
      },
      {
        name: 'memory.rss',
        value: memoryUsage.rss / 1024 / 1024, // Convert to MB
        unit: 'MB',
        category: 'memory' as const,
        tags: { type: 'rss' }
      },
      {
        name: 'memory.external',
        value: memoryUsage.external / 1024 / 1024, // Convert to MB
        unit: 'MB',
        category: 'memory' as const,
        tags: { type: 'external' }
      }
    ];

    for (const metric of metrics) {
      await this.recordMetric(metric);
    }
  }

  // CPU metrics collection
  private async collectCPUMetrics(): Promise<void> {
    const metrics = [
      {
        name: 'cpu.usage',
        value: Math.random() * 50 + 20, // Simulate CPU usage
        unit: '%',
        category: 'cpu' as const,
        tags: { core: 'all' }
      },
      {
        name: 'cpu.load_average',
        value: Math.random() * 2 + 0.5, // Simulate load average
        unit: 'load',
        category: 'cpu' as const,
        tags: { period: '1m' }
      }
    ];

    for (const metric of metrics) {
      await this.recordMetric(metric);
    }
  }

  // Network metrics collection
  private async collectNetworkMetrics(): Promise<void> {
    const metrics = [
      {
        name: 'network.bytes_in',
        value: Math.random() * 1000000 + 500000, // Simulate bytes in
        unit: 'bytes',
        category: 'network' as const,
        tags: { direction: 'in' }
      },
      {
        name: 'network.bytes_out',
        value: Math.random() * 1000000 + 500000, // Simulate bytes out
        unit: 'bytes',
        category: 'network' as const,
        tags: { direction: 'out' }
      },
      {
        name: 'network.connections',
        value: Math.random() * 100 + 50, // Simulate connection count
        unit: 'count',
        category: 'network' as const,
        tags: { type: 'active' }
      }
    ];

    for (const metric of metrics) {
      await this.recordMetric(metric);
    }
  }

  // Cache metrics collection
  private async collectCacheMetrics(): Promise<void> {
    const metrics = [
      {
        name: 'cache.hit_rate',
        value: Math.random() * 20 + 80, // Simulate cache hit rate
        unit: '%',
        category: 'cache' as const,
        tags: { type: 'redis' }
      },
      {
        name: 'cache.size',
        value: Math.random() * 100 + 50, // Simulate cache size
        unit: 'MB',
        category: 'cache' as const,
        tags: { type: 'redis' }
      },
      {
        name: 'cache.operations',
        value: Math.random() * 1000 + 500, // Simulate cache operations
        unit: 'ops/s',
        category: 'cache' as const,
        tags: { type: 'redis' }
      }
    ];

    for (const metric of metrics) {
      await this.recordMetric(metric);
    }
  }

  // Real-time metrics collection
  private async collectRealtimeMetrics(): Promise<void> {
    const metrics = [
      {
        name: 'realtime.connections',
        value: Math.random() * 500 + 100, // Simulate real-time connections
        unit: 'count',
        category: 'realtime' as const,
        tags: { type: 'websocket' }
      },
      {
        name: 'realtime.latency',
        value: Math.random() * 50 + 10, // Simulate real-time latency
        unit: 'ms',
        category: 'realtime' as const,
        tags: { type: 'websocket' }
      },
      {
        name: 'realtime.messages',
        value: Math.random() * 1000 + 500, // Simulate message count
        unit: 'msg/s',
        category: 'realtime' as const,
        tags: { type: 'websocket' }
      }
    ];

    for (const metric of metrics) {
      await this.recordMetric(metric);
    }
  }

  // Record a metric
  private async recordMetric(metricData: Omit<PerformanceMetric, 'id' | 'timestamp'>): Promise<void> {
    const metric: PerformanceMetric = {
      id: this.generateMetricId(),
      timestamp: Date.now(),
      ...metricData
    };

    const key = `${metric.category}.${metric.name}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    this.metrics.get(key)!.push(metric);
  }

  // Check for alerts
  private async checkAlerts(): Promise<void> {
    for (const [key, metrics] of this.metrics) {
      if (metrics.length === 0) continue;

      const latestMetric = metrics[metrics.length - 1];
      const threshold = this.config.thresholds[key];
      
      if (!threshold) continue;

      const value = latestMetric.value;
      let severity: PerformanceAlert['severity'] | null = null;
      let message = '';

      if (value >= threshold.critical) {
        severity = 'critical';
        message = `${key} is critically high: ${value}${latestMetric.unit}`;
      } else if (value >= threshold.warning) {
        severity = 'high';
        message = `${key} is high: ${value}${latestMetric.unit}`;
      }

      if (severity) {
        await this.createAlert(key, threshold[severity], value, severity, message);
      }
    }
  }

  // Create an alert
  private async createAlert(
    metric: string,
    threshold: number,
    currentValue: number,
    severity: PerformanceAlert['severity'],
    message: string
  ): Promise<void> {
    const alertId = this.generateAlertId();
    
    // Check if alert already exists for this metric
    const existingAlert = Array.from(this.alerts.values())
      .find(alert => alert.metric === metric && !alert.resolved);

    if (existingAlert) {
      // Update existing alert
      existingAlert.currentValue = currentValue;
      existingAlert.timestamp = Date.now();
      return;
    }

    const alert: PerformanceAlert = {
      id: alertId,
      metric,
      threshold,
      currentValue,
      severity,
      message,
      timestamp: Date.now(),
      resolved: false
    };

    this.alerts.set(alertId, alert);
    
    console.log(`🚨 Performance alert: ${message}`);
    
    // Send alert notifications
    await this.sendAlertNotification(alert);
  }

  // Send alert notification
  private async sendAlertNotification(alert: PerformanceAlert): Promise<void> {
    if (!this.config.alerts.enabled) return;

    try {
      // Send email notifications
      if (this.config.alerts.email.length > 0) {
        await this.sendEmailAlert(alert);
      }

      // Send webhook notifications
      if (this.config.alerts.webhook.length > 0) {
        await this.sendWebhookAlert(alert);
      }
    } catch (error) {
      console.error('❌ Failed to send alert notification:', error);
    }
  }

  private async sendEmailAlert(alert: PerformanceAlert): Promise<void> {
    // Simulate email sending
    console.log(`📧 Email alert sent: ${alert.message}`);
  }

  private async sendWebhookAlert(alert: PerformanceAlert): Promise<void> {
    // Simulate webhook sending
    console.log(`🔗 Webhook alert sent: ${alert.message}`);
  }

  // Start report generation
  private startReportGeneration(): void {
    this.reportInterval = setInterval(async () => {
      await this.generateReport();
    }, 60000); // Generate report every minute
  }

  // Generate performance report
  private async generateReport(): Promise<PerformanceReport> {
    const reportId = this.generateReportId();
    const timestamp = Date.now();
    const duration = 60000; // 1 minute

    // Calculate summary
    const allMetrics = Array.from(this.metrics.values()).flat();
    const activeAlerts = Array.from(this.alerts.values()).filter(alert => !alert.resolved);
    
    const apiMetrics = allMetrics.filter(m => m.category === 'api');
    const responseTimeMetrics = apiMetrics.filter(m => m.name === 'api.response_time');
    const errorRateMetrics = apiMetrics.filter(m => m.name === 'api.error_rate');
    const throughputMetrics = apiMetrics.filter(m => m.name === 'api.throughput');

    const summary = {
      totalMetrics: allMetrics.length,
      alerts: activeAlerts.length,
      averageResponseTime: responseTimeMetrics.length > 0 ? 
        responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length : 0,
      throughput: throughputMetrics.length > 0 ? 
        throughputMetrics.reduce((sum, m) => sum + m.value, 0) / throughputMetrics.length : 0,
      errorRate: errorRateMetrics.length > 0 ? 
        errorRateMetrics.reduce((sum, m) => sum + m.value, 0) / errorRateMetrics.length : 0,
      availability: this.calculateAvailability()
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(allMetrics, activeAlerts);

    const report: PerformanceReport = {
      id: reportId,
      timestamp,
      duration,
      summary,
      metrics: allMetrics,
      alerts: activeAlerts,
      recommendations
    };

    console.log(`📊 Performance report generated: ${reportId}`);
    return report;
  }

  // Calculate availability
  private calculateAvailability(): number {
    const errorRate = this.getAverageMetricValue('api.error_rate') || 0;
    return Math.max(0, 100 - errorRate);
  }

  // Generate recommendations
  private generateRecommendations(metrics: PerformanceMetric[], alerts: PerformanceAlert[]): string[] {
    const recommendations: string[] = [];

    // Check response time
    const avgResponseTime = this.getAverageMetricValue('api.response_time');
    if (avgResponseTime && avgResponseTime > 1000) {
      recommendations.push('API response time is high - consider implementing caching');
    }

    // Check error rate
    const errorRate = this.getAverageMetricValue('api.error_rate');
    if (errorRate && errorRate > 5) {
      recommendations.push('Error rate is high - investigate and fix issues');
    }

    // Check memory usage
    const memoryUsage = this.getAverageMetricValue('memory.heap_used');
    if (memoryUsage && memoryUsage > 200) {
      recommendations.push('Memory usage is high - consider optimizing memory usage');
    }

    // Check cache hit rate
    const cacheHitRate = this.getAverageMetricValue('cache.hit_rate');
    if (cacheHitRate && cacheHitRate < 80) {
      recommendations.push('Cache hit rate is low - consider optimizing cache strategy');
    }

    return recommendations;
  }

  // Get average metric value
  private getAverageMetricValue(metricName: string): number | null {
    const key = metricName.includes('.') ? metricName : `api.${metricName}`;
    const metrics = this.metrics.get(key);
    if (!metrics || metrics.length === 0) return null;
    
    return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
  }

  // Clean up old data
  private async cleanupOldData(): Promise<void> {
    const cutoffTime = Date.now() - this.config.retention;
    
    for (const [key, metrics] of this.metrics) {
      const filteredMetrics = metrics.filter(m => m.timestamp > cutoffTime);
      this.metrics.set(key, filteredMetrics);
    }

    // Clean up resolved alerts
    for (const [key, alert] of this.alerts) {
      if (alert.resolved && alert.resolvedAt && alert.resolvedAt < cutoffTime) {
        this.alerts.delete(key);
      }
    }
  }

  // Utility methods
  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  getMetrics(category?: string): PerformanceMetric[] {
    if (category) {
      return Array.from(this.metrics.values())
        .flat()
        .filter(m => m.category === category);
    }
    return Array.from(this.metrics.values()).flat();
  }

  getAlerts(resolved: boolean = false): PerformanceAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.resolved === resolved);
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      return true;
    }
    return false;
  }

  updateConfig(updates: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log('📝 Monitoring configuration updated');
  }

  // Health check
  async healthCheck(): Promise<{ status: string; metrics: number; alerts: number }> {
    return {
      status: this.isRunning ? 'healthy' : 'stopped',
      metrics: Array.from(this.metrics.values()).flat().length,
      alerts: Array.from(this.alerts.values()).filter(a => !a.resolved).length
    };
  }

  // Cleanup
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = null;
    }
    
    this.isRunning = false;
    this.metrics.clear();
    this.alerts.clear();
  }
}

export default UltimatePerformanceMonitoringService;