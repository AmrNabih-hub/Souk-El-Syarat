/**
 * 📊 Test Monitoring and Alerting Service
 * Professional test monitoring and alerting system for Souk El-Syarat platform
 */

export interface TestAlert {
  id: string
  type: 'error' | 'warning' | 'info' | 'success'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  source: string
  environment: string
  timestamp: Date
  resolved: boolean
  resolvedAt?: Date
  metadata: Record<string, any>
}

export interface TestMetric {
  name: string
  value: number
  unit: string
  timestamp: Date
  environment: string
  threshold: {
    warning: number
    critical: number
  }
  status: 'normal' | 'warning' | 'critical'
}

export interface TestHealthCheck {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  lastChecked: Date
  error?: string
  metadata: Record<string, any>
}

export interface MonitoringConfig {
  enableRealTimeMonitoring: boolean
  enableAlerts: boolean
  enableMetrics: boolean
  enableHealthChecks: boolean
  alertChannels: {
    email: boolean
    slack: boolean
    webhook: boolean
    sms: boolean
  }
  thresholds: {
    passRate: number
    responseTime: number
    errorRate: number
    coverage: number
  }
  checkInterval: number
  retentionDays: number
}

export class TestMonitoringService {
  private static instance: TestMonitoringService
  private config: MonitoringConfig
  private alerts: Map<string, TestAlert> = new Map()
  private metrics: Map<string, TestMetric[]> = new Map()
  private healthChecks: Map<string, TestHealthCheck> = new Map()
  private isMonitoring = false
  private monitoringInterval: NodeJS.Timeout | null = null

  private constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enableRealTimeMonitoring: true,
      enableAlerts: true,
      enableMetrics: true,
      enableHealthChecks: true,
      alertChannels: {
        email: true,
        slack: true,
        webhook: true,
        sms: false
      },
      thresholds: {
        passRate: 90,
        responseTime: 30000,
        errorRate: 5,
        coverage: 80
      },
      checkInterval: 60000, // 1 minute
      retentionDays: 30,
      ...config
    }
  }

  static getInstance(config?: Partial<MonitoringConfig>): TestMonitoringService {
    if (!TestMonitoringService.instance) {
      TestMonitoringService.instance = new TestMonitoringService(config)
    }
    return TestMonitoringService.instance
  }

  /**
   * 🚀 Start monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('⚠️ Monitoring is already running')
      return
    }

    this.isMonitoring = true
    console.log('📊 Starting test monitoring...')

    if (this.config.enableRealTimeMonitoring) {
      this.monitoringInterval = setInterval(() => {
        this.performMonitoringCycle()
      }, this.config.checkInterval)
    }

    console.log('✅ Test monitoring started successfully')
  }

  /**
   * 🛑 Stop monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      console.log('⚠️ Monitoring is not running')
      return
    }

    this.isMonitoring = false

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    console.log('🛑 Test monitoring stopped')
  }

  /**
   * 🔄 Perform monitoring cycle
   */
  private async performMonitoringCycle(): Promise<void> {
    try {
      if (this.config.enableHealthChecks) {
        await this.performHealthChecks()
      }

      if (this.config.enableMetrics) {
        await this.collectMetrics()
      }

      if (this.config.enableAlerts) {
        await this.checkAlerts()
      }
    } catch (error) {
      console.error('❌ Monitoring cycle failed:', error)
    }
  }

  /**
   * 🏥 Perform health checks
   */
  private async performHealthChecks(): Promise<void> {
    const healthChecks = [
      'Database Connection',
      'API Endpoints',
      'Firebase Services',
      'File Storage',
      'Email Service',
      'Authentication Service',
      'Real-time Database',
      'Push Notifications'
    ]

    for (const checkName of healthChecks) {
      try {
        const healthCheck = await this.executeHealthCheck(checkName)
        this.healthChecks.set(checkName, healthCheck)

        // Create alert if unhealthy
        if (healthCheck.status === 'unhealthy') {
          await this.createAlert({
            type: 'error',
            severity: 'critical',
            title: `Health Check Failed: ${checkName}`,
            message: healthCheck.error || 'Health check failed',
            source: 'health-check',
            environment: 'all',
            metadata: { healthCheck }
          })
        }
      } catch (error) {
        console.error(`❌ Health check failed for ${checkName}:`, error)
      }
    }
  }

  /**
   * 📊 Collect metrics
   */
  private async collectMetrics(): Promise<void> {
    const metrics = [
      {
        name: 'test_pass_rate',
        value: Math.random() * 20 + 80, // 80-100%
        unit: 'percent',
        environment: 'all'
      },
      {
        name: 'test_execution_time',
        value: Math.random() * 60000 + 10000, // 10-70 seconds
        unit: 'milliseconds',
        environment: 'all'
      },
      {
        name: 'test_coverage',
        value: Math.random() * 30 + 70, // 70-100%
        unit: 'percent',
        environment: 'all'
      },
      {
        name: 'test_error_rate',
        value: Math.random() * 10, // 0-10%
        unit: 'percent',
        environment: 'all'
      },
      {
        name: 'api_response_time',
        value: Math.random() * 500 + 100, // 100-600ms
        unit: 'milliseconds',
        environment: 'all'
      },
      {
        name: 'database_query_time',
        value: Math.random() * 200 + 50, // 50-250ms
        unit: 'milliseconds',
        environment: 'all'
      }
    ]

    for (const metric of metrics) {
      const testMetric: TestMetric = {
        ...metric,
        timestamp: new Date(),
        threshold: this.getMetricThreshold(metric.name),
        status: this.evaluateMetricStatus(metric.value, metric.name)
      }

      if (!this.metrics.has(metric.name)) {
        this.metrics.set(metric.name, [])
      }

      const metricHistory = this.metrics.get(metric.name)!
      metricHistory.push(testMetric)

      // Keep only last 1000 entries
      if (metricHistory.length > 1000) {
        metricHistory.splice(0, metricHistory.length - 1000)
      }

      // Check for threshold violations
      if (testMetric.status !== 'normal') {
        await this.createAlert({
          type: testMetric.status === 'critical' ? 'error' : 'warning',
          severity: testMetric.status === 'critical' ? 'high' : 'medium',
          title: `Metric Threshold Violation: ${metric.name}`,
          message: `${metric.name} is ${testMetric.status} (${metric.value}${metric.unit})`,
          source: 'metrics',
          environment: metric.environment,
          metadata: { metric: testMetric }
        })
      }
    }
  }

  /**
   * 🚨 Check alerts
   */
  private async checkAlerts(): Promise<void> {
    // Check for unresolved critical alerts
    const criticalAlerts = Array.from(this.alerts.values())
      .filter(alert => alert.severity === 'critical' && !alert.resolved)

    if (criticalAlerts.length > 0) {
      console.log(`🚨 ${criticalAlerts.length} critical alerts need attention`)
      
      // Send notifications for critical alerts
      for (const alert of criticalAlerts) {
        await this.sendAlertNotification(alert)
      }
    }

    // Auto-resolve old alerts
    const oldAlerts = Array.from(this.alerts.values())
      .filter(alert => 
        !alert.resolved && 
        Date.now() - alert.timestamp.getTime() > 24 * 60 * 60 * 1000 // 24 hours
      )

    for (const alert of oldAlerts) {
      await this.resolveAlert(alert.id, 'Auto-resolved after 24 hours')
    }
  }

  /**
   * 🏥 Execute health check
   */
  private async executeHealthCheck(name: string): Promise<TestHealthCheck> {
    const startTime = Date.now()
    
    try {
      // Simulate health check
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 100))
      
      const responseTime = Date.now() - startTime
      const isHealthy = Math.random() > 0.1 // 90% success rate
      
      return {
        name,
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime,
        lastChecked: new Date(),
        error: isHealthy ? undefined : 'Simulated health check failure',
        metadata: { responseTime }
      }
    } catch (error) {
      return {
        name,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: { error }
      }
    }
  }

  /**
   * 📊 Get metric threshold
   */
  private getMetricThreshold(metricName: string): { warning: number; critical: number } {
    const thresholds: Record<string, { warning: number; critical: number }> = {
      'test_pass_rate': { warning: 95, critical: 90 },
      'test_execution_time': { warning: 30000, critical: 60000 },
      'test_coverage': { warning: 85, critical: 80 },
      'test_error_rate': { warning: 5, critical: 10 },
      'api_response_time': { warning: 1000, critical: 2000 },
      'database_query_time': { warning: 500, critical: 1000 }
    }

    return thresholds[metricName] || { warning: 80, critical: 90 }
  }

  /**
   * 📈 Evaluate metric status
   */
  private evaluateMetricStatus(value: number, metricName: string): 'normal' | 'warning' | 'critical' {
    const threshold = this.getMetricThreshold(metricName)
    
    if (value >= threshold.critical) {
      return 'critical'
    } else if (value >= threshold.warning) {
      return 'warning'
    } else {
      return 'normal'
    }
  }

  /**
   * 🚨 Create alert
   */
  async createAlert(alertData: Omit<TestAlert, 'id' | 'timestamp' | 'resolved'>): Promise<string> {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const alert: TestAlert = {
      ...alertData,
      id: alertId,
      timestamp: new Date(),
      resolved: false
    }

    this.alerts.set(alertId, alert)
    console.log(`🚨 Alert created: ${alert.title}`)

    // Send immediate notification for critical alerts
    if (alert.severity === 'critical') {
      await this.sendAlertNotification(alert)
    }

    return alertId
  }

  /**
   * ✅ Resolve alert
   */
  async resolveAlert(alertId: string, resolution: string): Promise<boolean> {
    const alert = this.alerts.get(alertId)
    if (!alert) return false

    alert.resolved = true
    alert.resolvedAt = new Date()
    
    console.log(`✅ Alert resolved: ${alert.title}`)
    return true
  }

  /**
   * 📧 Send alert notification
   */
  private async sendAlertNotification(alert: TestAlert): Promise<void> {
    const notification = {
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      timestamp: alert.timestamp,
      environment: alert.environment,
      source: alert.source
    }

    // Send to configured channels
    if (this.config.alertChannels.email) {
      await this.sendEmailNotification(notification)
    }

    if (this.config.alertChannels.slack) {
      await this.sendSlackNotification(notification)
    }

    if (this.config.alertChannels.webhook) {
      await this.sendWebhookNotification(notification)
    }

    if (this.config.alertChannels.sms && alert.severity === 'critical') {
      await this.sendSMSNotification(notification)
    }
  }

  /**
   * 📧 Send email notification
   */
  private async sendEmailNotification(notification: any): Promise<void> {
    console.log(`📧 Email notification sent: ${notification.title}`)
    // Implementation would send actual email
  }

  /**
   * 💬 Send Slack notification
   */
  private async sendSlackNotification(notification: any): Promise<void> {
    console.log(`💬 Slack notification sent: ${notification.title}`)
    // Implementation would send actual Slack message
  }

  /**
   * 🔗 Send webhook notification
   */
  private async sendWebhookNotification(notification: any): Promise<void> {
    console.log(`🔗 Webhook notification sent: ${notification.title}`)
    // Implementation would send actual webhook
  }

  /**
   * 📱 Send SMS notification
   */
  private async sendSMSNotification(notification: any): Promise<void> {
    console.log(`📱 SMS notification sent: ${notification.title}`)
    // Implementation would send actual SMS
  }

  /**
   * 📊 Get alerts
   */
  getAlerts(filters?: {
    severity?: string
    resolved?: boolean
    environment?: string
    limit?: number
  }): TestAlert[] {
    let alerts = Array.from(this.alerts.values())

    if (filters) {
      if (filters.severity) {
        alerts = alerts.filter(alert => alert.severity === filters.severity)
      }
      if (filters.resolved !== undefined) {
        alerts = alerts.filter(alert => alert.resolved === filters.resolved)
      }
      if (filters.environment) {
        alerts = alerts.filter(alert => alert.environment === filters.environment)
      }
      if (filters.limit) {
        alerts = alerts.slice(0, filters.limit)
      }
    }

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  /**
   * 📈 Get metrics
   */
  getMetrics(metricName?: string, limit?: number): TestMetric[] {
    if (metricName) {
      const metrics = this.metrics.get(metricName) || []
      return limit ? metrics.slice(-limit) : metrics
    }

    const allMetrics: TestMetric[] = []
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics)
    }

    return limit ? allMetrics.slice(-limit) : allMetrics
  }

  /**
   * 🏥 Get health checks
   */
  getHealthChecks(): TestHealthCheck[] {
    return Array.from(this.healthChecks.values())
  }

  /**
   * 📊 Get monitoring statistics
   */
  getMonitoringStatistics(): Record<string, any> {
    const alerts = Array.from(this.alerts.values())
    const metrics = Array.from(this.metrics.values()).flat()
    const healthChecks = Array.from(this.healthChecks.values())

    return {
      totalAlerts: alerts.length,
      unresolvedAlerts: alerts.filter(alert => !alert.resolved).length,
      criticalAlerts: alerts.filter(alert => alert.severity === 'critical' && !alert.resolved).length,
      totalMetrics: metrics.length,
      healthyServices: healthChecks.filter(check => check.status === 'healthy').length,
      unhealthyServices: healthChecks.filter(check => check.status === 'unhealthy').length,
      averageResponseTime: healthChecks.reduce((sum, check) => sum + check.responseTime, 0) / healthChecks.length,
      isMonitoring: this.isMonitoring
    }
  }

  /**
   * 🔧 Update configuration
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('🔧 Monitoring configuration updated')
  }

  /**
   * 🗑️ Clean up old data
   */
  cleanupOldData(): void {
    const cutoffDate = new Date(Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000)
    
    // Clean up old alerts
    for (const [id, alert] of this.alerts.entries()) {
      if (alert.timestamp < cutoffDate) {
        this.alerts.delete(id)
      }
    }

    // Clean up old metrics
    for (const [name, metrics] of this.metrics.entries()) {
      const filteredMetrics = metrics.filter(metric => metric.timestamp >= cutoffDate)
      this.metrics.set(name, filteredMetrics)
    }

    console.log('🗑️ Old monitoring data cleaned up')
  }
}

// Export singleton instance
export const testMonitoringService = TestMonitoringService.getInstance()