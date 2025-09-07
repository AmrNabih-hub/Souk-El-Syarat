/**
 * Real-time Monitoring Service
 * Monitors all app functions, integrations, and real-time features
 */

import { RealtimeService } from './realtime.service';
import { AuthService } from './auth.service';
import { OrderService } from './order.service';
import { ProductService } from './product.service';

export interface MonitoringMetrics {
  timestamp: Date;
  userId?: string;
  userRole?: string;
  metrics: {
    // Authentication metrics
    auth: {
      isAuthenticated: boolean;
      sessionDuration: number;
      lastActivity: Date;
    };
    
    // Real-time metrics
    realtime: {
      isConnected: boolean;
      messageCount: number;
      notificationCount: number;
      presenceStatus: 'online' | 'offline' | 'away';
    };
    
    // API metrics
    api: {
      totalRequests: number;
      successfulRequests: number;
      failedRequests: number;
      averageResponseTime: number;
      lastRequestTime: Date;
    };
    
    // Database metrics
    database: {
      connectionStatus: 'connected' | 'disconnected' | 'error';
      queryCount: number;
      averageQueryTime: number;
      lastQueryTime: Date;
    };
    
    // Performance metrics
    performance: {
      memoryUsage: number;
      cpuUsage: number;
      networkLatency: number;
      pageLoadTime: number;
    };
    
    // Error metrics
    errors: {
      totalErrors: number;
      criticalErrors: number;
      warningErrors: number;
      lastErrorTime?: Date;
      lastError?: string;
    };
  };
}

export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  components: {
    authentication: 'healthy' | 'warning' | 'critical';
    realtime: 'healthy' | 'warning' | 'critical';
    api: 'healthy' | 'warning' | 'critical';
    database: 'healthy' | 'warning' | 'critical';
    performance: 'healthy' | 'warning' | 'critical';
  };
  timestamp: Date;
  recommendations: string[];
}

export class RealTimeMonitoringService {
  private static instance: RealTimeMonitoringService;
  private metrics: MonitoringMetrics[] = [];
  private maxMetricsHistory = 1000;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  // Performance tracking
  private performanceObserver: PerformanceObserver | null = null;
  private requestCount = 0;
  private successfulRequests = 0;
  private failedRequests = 0;
  private totalResponseTime = 0;

  // Error tracking
  private errorCount = 0;
  private criticalErrorCount = 0;
  private warningErrorCount = 0;
  private lastError: string | null = null;
  private lastErrorTime: Date | null = null;

  static getInstance(): RealTimeMonitoringService {
    if (!RealTimeMonitoringService.instance) {
      RealTimeMonitoringService.instance = new RealTimeMonitoringService();
    }
    return RealTimeMonitoringService.instance;
  }

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;

    console.log('🔍 Starting real-time monitoring...');
    this.isMonitoring = true;

    // Start performance monitoring
    this.startPerformanceMonitoring();

    // Start error monitoring
    this.startErrorMonitoring();

    // Start metrics collection
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, 5000); // Collect metrics every 5 seconds

    // Initial metrics collection
    this.collectMetrics();
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    console.log('🛑 Stopping real-time monitoring...');
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
  }

  private startPerformanceMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor page load performance
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      
      this.updatePerformanceMetrics({
        pageLoadTime: loadTime,
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
        cpuUsage: 0, // Not directly available in browser
        networkLatency: navigation.responseEnd - navigation.requestStart,
      });
    });

    // Monitor resource loading
    this.performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'resource') {
          this.updatePerformanceMetrics({
            networkLatency: entry.responseEnd - entry.requestStart,
          });
        }
      });
    });

    this.performanceObserver.observe({ entryTypes: ['resource'] });
  }

  private startErrorMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor JavaScript errors
    window.addEventListener('error', (event) => {
      this.recordError('JavaScript Error', event.error?.message || event.message, 'critical');
    });

    // Monitor unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError('Unhandled Promise Rejection', event.reason?.message || 'Unknown error', 'critical');
    });

    // Monitor fetch errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;
        
        this.requestCount++;
        this.totalResponseTime += duration;
        
        if (response.ok) {
          this.successfulRequests++;
        } else {
          this.failedRequests++;
          this.recordError('API Error', `HTTP ${response.status}: ${response.statusText}`, 'warning');
        }
        
        return response;
      } catch (error) {
        this.requestCount++;
        this.failedRequests++;
        this.recordError('Network Error', error.message, 'critical');
        throw error;
      }
    };
  }

  private async collectMetrics(): Promise<void> {
    try {
      const user = AuthService.getCurrentUser();
      const realtimeService = RealtimeService.getInstance();
      
      const metrics: MonitoringMetrics = {
        timestamp: new Date(),
        userId: user?.id,
        userRole: user?.role,
        metrics: {
          auth: {
            isAuthenticated: !!user,
            sessionDuration: user ? Date.now() - (user.createdAt?.getTime() || Date.now()) : 0,
            lastActivity: new Date(),
          },
          
          realtime: {
            isConnected: realtimeService.isConnected(),
            messageCount: this.getRealtimeMessageCount(),
            notificationCount: this.getNotificationCount(),
            presenceStatus: this.getPresenceStatus(),
          },
          
          api: {
            totalRequests: this.requestCount,
            successfulRequests: this.successfulRequests,
            failedRequests: this.failedRequests,
            averageResponseTime: this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0,
            lastRequestTime: new Date(),
          },
          
          database: {
            connectionStatus: 'connected', // Firebase handles this internally
            queryCount: this.getDatabaseQueryCount(),
            averageQueryTime: this.getAverageQueryTime(),
            lastQueryTime: new Date(),
          },
          
          performance: {
            memoryUsage: this.getMemoryUsage(),
            cpuUsage: 0, // Not available in browser
            networkLatency: this.getNetworkLatency(),
            pageLoadTime: this.getPageLoadTime(),
          },
          
          errors: {
            totalErrors: this.errorCount,
            criticalErrors: this.criticalErrorCount,
            warningErrors: this.warningErrorCount,
            lastErrorTime: this.lastErrorTime,
            lastError: this.lastError,
          },
        },
      };

      this.metrics.push(metrics);
      
      // Keep only recent metrics
      if (this.metrics.length > this.maxMetricsHistory) {
        this.metrics = this.metrics.slice(-this.maxMetricsHistory);
      }

      // Broadcast metrics to real-time service
      await this.broadcastMetrics(metrics);

    } catch (error) {
      console.error('Error collecting metrics:', error);
      this.recordError('Metrics Collection Error', error.message, 'warning');
    }
  }

  private updatePerformanceMetrics(updates: Partial<MonitoringMetrics['metrics']['performance']>): void {
    // Update performance metrics in real-time
    const latestMetrics = this.metrics[this.metrics.length - 1];
    if (latestMetrics) {
      latestMetrics.metrics.performance = {
        ...latestMetrics.metrics.performance,
        ...updates,
      };
    }
  }

  private recordError(type: string, message: string, severity: 'critical' | 'warning'): void {
    this.errorCount++;
    this.lastError = `${type}: ${message}`;
    this.lastErrorTime = new Date();

    if (severity === 'critical') {
      this.criticalErrorCount++;
    } else {
      this.warningErrorCount++;
    }

    console.error(`🚨 ${severity.toUpperCase()} ERROR:`, this.lastError);
  }

  private getRealtimeMessageCount(): number {
    // Get message count from realtime store
    return 0; // This would be implemented based on your realtime store
  }

  private getNotificationCount(): number {
    // Get notification count from realtime store
    return 0; // This would be implemented based on your realtime store
  }

  private getPresenceStatus(): 'online' | 'offline' | 'away' {
    // Get presence status from realtime store
    return 'online'; // This would be implemented based on your realtime store
  }

  private getDatabaseQueryCount(): number {
    // Track database queries
    return 0; // This would be implemented based on your database service
  }

  private getAverageQueryTime(): number {
    // Calculate average query time
    return 0; // This would be implemented based on your database service
  }

  private getMemoryUsage(): number {
    if (typeof window !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  private getNetworkLatency(): number {
    // Calculate average network latency
    return this.metrics.length > 0 
      ? this.metrics[this.metrics.length - 1].metrics.performance.networkLatency 
      : 0;
  }

  private getPageLoadTime(): number {
    if (typeof window !== 'undefined') {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0;
    }
    return 0;
  }

  private async broadcastMetrics(metrics: MonitoringMetrics): Promise<void> {
    try {
      const realtimeService = RealtimeService.getInstance();
      await realtimeService.broadcastToRole('admin', 'monitoring_metrics', metrics);
    } catch (error) {
      console.error('Error broadcasting metrics:', error);
    }
  }

  getSystemHealth(): SystemHealth {
    const latestMetrics = this.metrics[this.metrics.length - 1];
    if (!latestMetrics) {
      return {
        overall: 'warning',
        components: {
          authentication: 'warning',
          realtime: 'warning',
          api: 'warning',
          database: 'warning',
          performance: 'warning',
        },
        timestamp: new Date(),
        recommendations: ['Start monitoring to get system health status'],
      };
    }

    const components = {
      authentication: this.assessAuthHealth(latestMetrics.metrics.auth),
      realtime: this.assessRealtimeHealth(latestMetrics.metrics.realtime),
      api: this.assessApiHealth(latestMetrics.metrics.api),
      database: this.assessDatabaseHealth(latestMetrics.metrics.database),
      performance: this.assessPerformanceHealth(latestMetrics.metrics.performance),
    };

    const overall = this.calculateOverallHealth(components);
    const recommendations = this.generateRecommendations(components, latestMetrics);

    return {
      overall,
      components,
      timestamp: new Date(),
      recommendations,
    };
  }

  private assessAuthHealth(auth: MonitoringMetrics['metrics']['auth']): 'healthy' | 'warning' | 'critical' {
    if (!auth.isAuthenticated) return 'warning';
    if (auth.sessionDuration > 24 * 60 * 60 * 1000) return 'warning'; // 24 hours
    return 'healthy';
  }

  private assessRealtimeHealth(realtime: MonitoringMetrics['metrics']['realtime']): 'healthy' | 'warning' | 'critical' {
    if (!realtime.isConnected) return 'critical';
    if (realtime.presenceStatus === 'offline') return 'warning';
    return 'healthy';
  }

  private assessApiHealth(api: MonitoringMetrics['metrics']['api']): 'healthy' | 'warning' | 'critical' {
    if (api.failedRequests > api.successfulRequests) return 'critical';
    if (api.averageResponseTime > 5000) return 'warning'; // 5 seconds
    return 'healthy';
  }

  private assessDatabaseHealth(database: MonitoringMetrics['metrics']['database']): 'healthy' | 'warning' | 'critical' {
    if (database.connectionStatus === 'error') return 'critical';
    if (database.connectionStatus === 'disconnected') return 'warning';
    return 'healthy';
  }

  private assessPerformanceHealth(performance: MonitoringMetrics['metrics']['performance']): 'healthy' | 'warning' | 'critical' {
    if (performance.memoryUsage > 100 * 1024 * 1024) return 'warning'; // 100MB
    if (performance.pageLoadTime > 10000) return 'warning'; // 10 seconds
    return 'healthy';
  }

  private calculateOverallHealth(components: SystemHealth['components']): 'healthy' | 'warning' | 'critical' {
    const values = Object.values(components);
    if (values.includes('critical')) return 'critical';
    if (values.includes('warning')) return 'warning';
    return 'healthy';
  }

  private generateRecommendations(components: SystemHealth['components'], metrics: MonitoringMetrics): string[] {
    const recommendations: string[] = [];

    if (components.authentication === 'warning') {
      recommendations.push('Consider implementing session refresh mechanism');
    }

    if (components.realtime === 'critical') {
      recommendations.push('Check WebSocket connection and real-time service status');
    }

    if (components.api === 'warning') {
      recommendations.push('Optimize API response times and error handling');
    }

    if (components.performance === 'warning') {
      recommendations.push('Optimize memory usage and page load performance');
    }

    if (metrics.metrics.errors.totalErrors > 10) {
      recommendations.push('High error rate detected - investigate and fix critical issues');
    }

    return recommendations;
  }

  getMetricsHistory(limit: number = 100): MonitoringMetrics[] {
    return this.metrics.slice(-limit);
  }

  getCurrentMetrics(): MonitoringMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }
}

export default RealTimeMonitoringService;