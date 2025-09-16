/**
 * 🚀 PROFESSIONAL PERFORMANCE MONITORING SERVICE
 * Souk El-Syarat - Real-time Performance Analytics
 */

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  component: string;
  action: string;
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  id: string;
  timestamp: Date;
  metrics: PerformanceMetric[];
  summary: {
    averageLoadTime: number;
    slowestOperation: string;
    fastestOperation: string;
    totalOperations: number;
    errorRate: number;
  };
}

export class PerformanceMonitorService {
  private static instance: PerformanceMonitorService;
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000;
  private observers: Set<(report: PerformanceReport) => void> = new Set();

  static getInstance(): PerformanceMonitorService {
    if (!PerformanceMonitorService.instance) {
      PerformanceMonitorService.instance = new PerformanceMonitorService();
    }
    return PerformanceMonitorService.instance;
  }

  /**
   * Start timing an operation
   */
  static startTiming(operationName: string, component: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.recordMetric({
        name: operationName,
        value: duration,
        unit: 'ms',
        component,
        action: 'timing',
      });
    };
  }

  /**
   * Record a custom metric
   */
  static recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): void {
    const instance = PerformanceMonitorService.getInstance();
    
    const fullMetric: PerformanceMetric = {
      ...metric,
      id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    instance.metrics.push(fullMetric);
    
    // Maintain metrics array size
    if (instance.metrics.length > instance.maxMetrics) {
      instance.metrics.shift();
    }

    // Notify observers
    instance.notifyObservers();
  }

  /**
   * Measure component render time
   */
  static measureRender(componentName: string): () => void {
    return PerformanceMonitorService.startTiming(`render_${componentName}`, componentName);
  }

  /**
   * Measure API call performance
   */
  static measureApiCall(endpoint: string): () => void {
    return PerformanceMonitorService.startTiming(`api_${endpoint}`, 'ApiService');
  }

  /**
   * Measure user interaction
   */
  static measureInteraction(action: string, component: string): () => void {
    return PerformanceMonitorService.startTiming(`interaction_${action}`, component);
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): PerformanceReport {
    const recentMetrics = this.metrics.slice(-100); // Last 100 metrics
    
    const loadTimes = recentMetrics
      .filter(m => m.name.includes('render') || m.name.includes('api'))
      .map(m => m.value);

    const averageLoadTime = loadTimes.length > 0 
      ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length 
      : 0;

    const slowestOperation = recentMetrics.reduce((slowest, current) => 
      current.value > slowest.value ? current : slowest, 
      recentMetrics[0] || { name: 'none', value: 0 }
    );

    const fastestOperation = recentMetrics.reduce((fastest, current) => 
      current.value < fastest.value ? current : fastest, 
      recentMetrics[0] || { name: 'none', value: 0 }
    );

    const errorRate = recentMetrics.filter(m => m.name.includes('error')).length / recentMetrics.length;

    return {
      id: `report_${Date.now()}`,
      timestamp: new Date(),
      metrics: recentMetrics,
      summary: {
        averageLoadTime,
        slowestOperation: slowestOperation.name,
        fastestOperation: fastestOperation.name,
        totalOperations: recentMetrics.length,
        errorRate: errorRate * 100,
      },
    };
  }

  /**
   * Subscribe to performance updates
   */
  subscribe(callback: (report: PerformanceReport) => void): () => void {
    this.observers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.observers.delete(callback);
    };
  }

  /**
   * Notify observers of new metrics
   */
  private notifyObservers(): void {
    const report = this.getPerformanceReport();
    this.observers.forEach(callback => {
      try {
        callback(report);
      } catch (error) {
        console.error('Error in performance observer:', error);
      }
    });
  }

  /**
   * Get metrics by component
   */
  getMetricsByComponent(component: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.component === component);
  }

  /**
   * Get slowest operations
   */
  getSlowestOperations(limit: number = 10): PerformanceMetric[] {
    return this.metrics
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp > cutoffTime);
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    totalMetrics: number;
    averageResponseTime: number;
    slowestComponent: string;
    fastestComponent: string;
  } {
    const components = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.component]) {
        acc[metric.component] = { total: 0, count: 0 };
      }
      acc[metric.component].total += metric.value;
      acc[metric.component].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const componentAverages = Object.entries(components).map(([name, data]) => ({
      name,
      average: data.total / data.count,
    }));

    const slowestComponent = componentAverages.reduce((slowest, current) => 
      current.average > slowest.average ? current : slowest,
      { name: 'none', average: 0 }
    );

    const fastestComponent = componentAverages.reduce((fastest, current) => 
      current.average < fastest.average ? current : fastest,
      { name: 'none', average: Infinity }
    );

    const averageResponseTime = this.metrics.length > 0
      ? this.metrics.reduce((sum, metric) => sum + metric.value, 0) / this.metrics.length
      : 0;

    return {
      totalMetrics: this.metrics.length,
      averageResponseTime,
      slowestComponent: slowestComponent.name,
      fastestComponent: fastestComponent.name === 'none' ? 'none' : fastestComponent.name,
    };
  }
}

// Export convenience functions
export const startTiming = PerformanceMonitorService.startTiming;
export const measureRender = PerformanceMonitorService.measureRender;
export const measureApiCall = PerformanceMonitorService.measureApiCall;
export const measureInteraction = PerformanceMonitorService.measureInteraction;
export const recordMetric = PerformanceMonitorService.recordMetric;

export default PerformanceMonitorService;
