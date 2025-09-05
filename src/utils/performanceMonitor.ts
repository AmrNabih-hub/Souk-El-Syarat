/**
 * Performance Monitoring Utility
 * Tracks and reports performance metrics for the application
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    totalMetrics: number;
    averageDuration: number;
    slowestMetric: PerformanceMetric | null;
    fastestMetric: PerformanceMetric | null;
  };
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private observers: PerformanceObserver[] = [];
  private isEnabled: boolean = true;

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    // Observe navigation timing
    try {
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            this.recordMetric('navigation', {
              startTime: entry.fetchStart,
              endTime: entry.loadEventEnd,
              duration: entry.loadEventEnd - entry.fetchStart,
              metadata: {
                domContentLoaded: entry.domContentLoadedEventEnd - entry.fetchStart,
                firstPaint: this.getFirstPaint(),
                firstContentfulPaint: this.getFirstContentfulPaint(),
              },
            });
          }
        });
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);
    } catch (error) {
      console.warn('Navigation timing observer not supported:', error);
    }

    // Observe paint timing
    try {
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'paint') {
            this.recordMetric(`paint-${entry.name}`, {
              startTime: entry.startTime,
              endTime: entry.startTime,
              duration: entry.startTime,
              metadata: {
                size: entry.size || 0,
              },
            });
          }
        });
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);
    } catch (error) {
      console.warn('Paint timing observer not supported:', error);
    }

    // Observe resource timing
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.recordMetric(`resource-${this.getResourceType(resourceEntry.name)}`, {
              startTime: resourceEntry.fetchStart,
              endTime: resourceEntry.responseEnd,
              duration: resourceEntry.responseEnd - resourceEntry.fetchStart,
              metadata: {
                url: resourceEntry.name,
                size: resourceEntry.transferSize || 0,
                cached: resourceEntry.transferSize === 0,
              },
            });
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (error) {
      console.warn('Resource timing observer not supported:', error);
    }
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'javascript';
    if (url.includes('.css')) return 'stylesheet';
    if (url.includes('.png') || url.includes('.jpg') || url.includes('.jpeg') || url.includes('.gif') || url.includes('.webp')) return 'image';
    if (url.includes('.woff') || url.includes('.woff2') || url.includes('.ttf')) return 'font';
    return 'other';
  }

  private getFirstPaint(): number | null {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
  }

  private getFirstContentfulPaint(): number | null {
    const paintEntries = performance.getEntriesByType('paint');
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return firstContentfulPaint ? firstContentfulPaint.startTime : null;
  }

  startTiming(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    });
  }

  endTiming(name: string): number | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`No timing started for metric: ${name}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    // Log slow operations
    if (duration > 100) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  recordMetric(name: string, metric: Partial<PerformanceMetric>): void {
    if (!this.isEnabled) return;

    this.metrics.set(name, {
      name,
      startTime: metric.startTime || performance.now(),
      endTime: metric.endTime,
      duration: metric.duration,
      metadata: metric.metadata,
    });
  }

  getMetric(name: string): PerformanceMetric | null {
    return this.metrics.get(name) || null;
  }

  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  generateReport(): PerformanceReport {
    const metrics = this.getAllMetrics();
    const durations = metrics.filter(m => m.duration !== undefined).map(m => m.duration!);

    const summary = {
      totalMetrics: metrics.length,
      averageDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      slowestMetric: durations.length > 0 ? metrics.find(m => m.duration === Math.max(...durations)) || null : null,
      fastestMetric: durations.length > 0 ? metrics.find(m => m.duration === Math.min(...durations)) || null : null,
    };

    return { metrics, summary };
  }

  logReport(): void {
    const report = this.generateReport();
    console.group('🚀 Performance Report');
    console.log('Summary:', report.summary);
    console.table(report.metrics);
    console.groupEnd();
  }

  exportReport(): string {
    const report = this.generateReport();
    return JSON.stringify(report, null, 2);
  }

  clearMetrics(): void {
    this.metrics.clear();
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for common performance measurements
export const measurePerformance = {
  // Measure component render time
  measureRender: (componentName: string) => {
    performanceMonitor.startTiming(`render-${componentName}`);
    return () => performanceMonitor.endTiming(`render-${componentName}`);
  },

  // Measure API call time
  measureApiCall: (endpoint: string) => {
    performanceMonitor.startTiming(`api-${endpoint}`);
    return () => performanceMonitor.endTiming(`api-${endpoint}`);
  },

  // Measure user interaction time
  measureInteraction: (action: string) => {
    performanceMonitor.startTiming(`interaction-${action}`);
    return () => performanceMonitor.endTiming(`interaction-${action}`);
  },

  // Measure page load time
  measurePageLoad: (pageName: string) => {
    performanceMonitor.startTiming(`page-load-${pageName}`);
    return () => performanceMonitor.endTiming(`page-load-${pageName}`);
  },

  // Measure bundle load time
  measureBundleLoad: (bundleName: string) => {
    performanceMonitor.startTiming(`bundle-load-${bundleName}`);
    return () => performanceMonitor.endTiming(`bundle-load-${bundleName}`);
  },
};

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const startTiming = (name: string, metadata?: Record<string, any>) => {
    performanceMonitor.startTiming(name, metadata);
  };

  const endTiming = (name: string) => {
    return performanceMonitor.endTiming(name);
  };

  const measureAsync = async <T>(
    name: string,
    asyncFn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    startTiming(name, metadata);
    try {
      const result = await asyncFn();
      endTiming(name);
      return result;
    } catch (error) {
      endTiming(name);
      throw error;
    }
  };

  return {
    startTiming,
    endTiming,
    measureAsync,
    getReport: () => performanceMonitor.generateReport(),
    logReport: () => performanceMonitor.logReport(),
  };
}

export default performanceMonitor;