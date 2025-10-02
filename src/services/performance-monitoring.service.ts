/**
 * Performance Monitoring Service
 * Advanced performance tracking, optimization, and monitoring
 */

import { logger } from '@/utils/logger';

export interface PerformanceMetrics {
  pageLoad: {
    average: number;
    p95: number;
    p99: number;
    slowest: string[];
  };
  api: {
    average: number;
    p95: number;
    p99: number;
    slowest: string[];
  };
  userExperience: {
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
    firstInputDelay: number;
  };
  errors: {
    total: number;
    byType: Record<string, number>;
    critical: number;
    resolved: number;
  };
  resources: {
    totalSize: number;
    compressedSize: number;
    cacheHitRate: number;
    slowestResources: string[];
  };
}

export interface PerformanceAlert {
  id: string;
  type: 'slow_page' | 'high_error_rate' | 'memory_leak' | 'slow_api' | 'low_cache_hit';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  metrics: any;
  recommendations: string[];
  resolved: boolean;
}

export interface OptimizationSuggestion {
  type: 'bundle' | 'image' | 'caching' | 'database' | 'api' | 'rendering';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  implementation: string[];
  estimatedSavings: {
    time: string;
    size: string;
    cost: string;
  };
}

export interface PerformanceBudget {
  pageLoad: number; // ms
  bundleSize: number; // bytes
  imageSize: number; // bytes
  apiResponse: number; // ms
  memoryUsage: number; // MB
}

export class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private metrics: PerformanceMetrics;
  private alerts: PerformanceAlert[] = [];
  private performanceBudget: PerformanceBudget;
  private observers: Map<string, PerformanceObserver> = new Map();

  public static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  constructor() {
    this.performanceBudget = {
      pageLoad: 3000, // 3 seconds
      bundleSize: 500000, // 500KB
      imageSize: 200000, // 200KB
      apiResponse: 1000, // 1 second
      memoryUsage: 100 // 100MB
    };

    this.metrics = {
      pageLoad: {
        average: 0,
        p95: 0,
        p99: 0,
        slowest: []
      },
      api: {
        average: 0,
        p95: 0,
        p99: 0,
        slowest: []
      },
      userExperience: {
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        cumulativeLayoutShift: 0,
        firstInputDelay: 0
      },
      errors: {
        total: 0,
        byType: {},
        critical: 0,
        resolved: 0
      },
      resources: {
        totalSize: 0,
        compressedSize: 0,
        cacheHitRate: 0,
        slowestResources: []
      }
    };
  }

  /**
   * Initialize performance monitoring
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing performance monitoring', {}, 'PERFORMANCE');
      
      // Initialize Web Vitals monitoring
      this.initializeWebVitals();
      
      // Initialize resource monitoring
      this.initializeResourceMonitoring();
      
      // Initialize error tracking
      this.initializeErrorTracking();
      
      // Initialize API monitoring
      this.initializeAPIMonitoring();
      
      // Start performance budget monitoring
      this.startPerformanceBudgetMonitoring();
      
      logger.info('Performance monitoring initialized', {}, 'PERFORMANCE');
    } catch (error) {
      logger.error('Failed to initialize performance monitoring', error, 'PERFORMANCE');
      throw error;
    }
  }

  /**
   * Track page load performance
   */
  trackPageLoad(pageName: string, loadTime: number): void {
    try {
      logger.info('Tracking page load', { pageName, loadTime }, 'PERFORMANCE');
      
      // Update metrics
      this.updatePageLoadMetrics(pageName, loadTime);
      
      // Check against budget
      if (loadTime > this.performanceBudget.pageLoad) {
        this.createAlert({
          type: 'slow_page',
          severity: loadTime > this.performanceBudget.pageLoad * 2 ? 'critical' : 'high',
          message: `Page ${pageName} loaded in ${loadTime}ms (budget: ${this.performanceBudget.pageLoad}ms)`,
          metrics: { pageName, loadTime, budget: this.performanceBudget.pageLoad },
          recommendations: [
            'Optimize bundle size',
            'Implement code splitting',
            'Use lazy loading',
            'Optimize images'
          ]
        });
      }
    } catch (error) {
      logger.error('Failed to track page load', error, 'PERFORMANCE');
    }
  }

  /**
   * Track API performance
   */
  trackAPICall(endpoint: string, duration: number, status: number): void {
    try {
      logger.info('Tracking API call', { endpoint, duration, status }, 'PERFORMANCE');
      
      // Update metrics
      this.updateAPIMetrics(endpoint, duration, status);
      
      // Check against budget
      if (duration > this.performanceBudget.apiResponse) {
        this.createAlert({
          type: 'slow_api',
          severity: duration > this.performanceBudget.apiResponse * 2 ? 'critical' : 'high',
          message: `API ${endpoint} responded in ${duration}ms (budget: ${this.performanceBudget.apiResponse}ms)`,
          metrics: { endpoint, duration, status, budget: this.performanceBudget.apiResponse },
          recommendations: [
            'Optimize database queries',
            'Implement caching',
            'Use CDN',
            'Optimize API endpoints'
          ]
        });
      }
    } catch (error) {
      logger.error('Failed to track API call', error, 'PERFORMANCE');
    }
  }

  /**
   * Track user experience metrics
   */
  trackUserExperience(metrics: {
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
    firstInputDelay: number;
  }): void {
    try {
      logger.info('Tracking user experience metrics', metrics, 'PERFORMANCE');
      
      this.metrics.userExperience = metrics;
      
      // Check for poor user experience
      if (metrics.largestContentfulPaint > 4000) {
        this.createAlert({
          type: 'slow_page',
          severity: 'high',
          message: `Poor user experience: LCP ${metrics.largestContentfulPaint}ms`,
          metrics,
          recommendations: [
            'Optimize images',
            'Implement lazy loading',
            'Use modern image formats',
            'Optimize critical rendering path'
          ]
        });
      }
    } catch (error) {
      logger.error('Failed to track user experience', error, 'PERFORMANCE');
    }
  }

  /**
   * Track errors
   */
  trackError(error: Error, context: any): void {
    try {
      logger.error('Tracking performance error', { error: error.message, context }, 'PERFORMANCE');
      
      // Update error metrics
      this.updateErrorMetrics(error, context);
      
      // Create alert for critical errors
      if (this.isCriticalError(error)) {
        this.createAlert({
          type: 'high_error_rate',
          severity: 'critical',
          message: `Critical error: ${error.message}`,
          metrics: { error: error.message, stack: error.stack, context },
          recommendations: [
            'Review error logs',
            'Implement error boundaries',
            'Add monitoring',
            'Test error scenarios'
          ]
        });
      }
    } catch (trackingError) {
      logger.error('Failed to track error', trackingError, 'PERFORMANCE');
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance alerts
   */
  getPerformanceAlerts(severity?: string): PerformanceAlert[] {
    if (severity) {
      return this.alerts.filter(alert => alert.severity === severity);
    }
    return [...this.alerts];
  }

  /**
   * Get optimization suggestions
   */
  getOptimizationSuggestions(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    // Bundle optimization
    if (this.metrics.resources.totalSize > this.performanceBudget.bundleSize) {
      suggestions.push({
        type: 'bundle',
        priority: 'high',
        title: 'Bundle Size Optimization',
        description: 'Bundle size exceeds budget',
        impact: 'Faster page loads, better user experience',
        effort: 'medium',
        implementation: [
          'Implement code splitting',
          'Remove unused dependencies',
          'Use tree shaking',
          'Optimize imports'
        ],
        estimatedSavings: {
          time: '2-3 seconds',
          size: '200-300KB',
          cost: '$500-1000/month'
        }
      });
    }
    
    // Image optimization
    if (this.metrics.resources.slowestResources.some(resource => resource.includes('.jpg') || resource.includes('.png'))) {
      suggestions.push({
        type: 'image',
        priority: 'medium',
        title: 'Image Optimization',
        description: 'Large images affecting performance',
        impact: 'Faster image loading, reduced bandwidth',
        effort: 'low',
        implementation: [
          'Convert to WebP format',
          'Implement responsive images',
          'Use lazy loading',
          'Optimize compression'
        ],
        estimatedSavings: {
          time: '1-2 seconds',
          size: '100-200KB',
          cost: '$200-500/month'
        }
      });
    }
    
    // Caching optimization
    if (this.metrics.resources.cacheHitRate < 0.8) {
      suggestions.push({
        type: 'caching',
        priority: 'medium',
        title: 'Caching Optimization',
        description: 'Low cache hit rate',
        impact: 'Reduced server load, faster responses',
        effort: 'low',
        implementation: [
          'Implement CDN',
          'Optimize cache headers',
          'Use service workers',
          'Implement Redis caching'
        ],
        estimatedSavings: {
          time: '500ms-1s',
          size: '50-100KB',
          cost: '$100-300/month'
        }
      });
    }
    
    return suggestions;
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): {
    summary: any;
    metrics: PerformanceMetrics;
    alerts: PerformanceAlert[];
    suggestions: OptimizationSuggestion[];
    budget: PerformanceBudget;
  } {
    return {
      summary: {
        overallScore: this.calculateOverallScore(),
        budgetCompliance: this.calculateBudgetCompliance(),
        criticalIssues: this.alerts.filter(alert => alert.severity === 'critical').length,
        recommendations: this.getOptimizationSuggestions().length
      },
      metrics: this.getPerformanceMetrics(),
      alerts: this.getPerformanceAlerts(),
      suggestions: this.getOptimizationSuggestions(),
      budget: this.performanceBudget
    };
  }

  private initializeWebVitals(): void {
    // Initialize Web Vitals monitoring
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            this.trackUserExperience({
              firstContentfulPaint: 0, // Will be updated by other observer
              largestContentfulPaint: entry.startTime,
              cumulativeLayoutShift: 0, // Will be updated by other observer
              firstInputDelay: 0 // Will be updated by other observer
            });
          }
        }
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('web-vitals', observer);
    }
  }

  private initializeResourceMonitoring(): void {
    // Monitor resource loading
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.trackResourceLoad(entry as PerformanceResourceTiming);
          }
        }
      });
      
      observer.observe({ entryTypes: ['resource'] });
      this.observers.set('resources', observer);
    }
  }

  private initializeErrorTracking(): void {
    // Track unhandled errors
    window.addEventListener('error', (event) => {
      this.trackError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });
    
    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(event.reason), {
        type: 'unhandledrejection'
      });
    });
  }

  private initializeAPIMonitoring(): void {
    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - start;
        this.trackAPICall(args[0] as string, duration, response.status);
        return response;
      } catch (error) {
        const duration = performance.now() - start;
        this.trackAPICall(args[0] as string, duration, 0);
        throw error;
      }
    };
  }

  private startPerformanceBudgetMonitoring(): void {
    // Monitor performance budget compliance
    setInterval(() => {
      this.checkPerformanceBudget();
    }, 30000); // Check every 30 seconds
  }

  private updatePageLoadMetrics(pageName: string, loadTime: number): void {
    // Update page load metrics
    this.metrics.pageLoad.average = (this.metrics.pageLoad.average + loadTime) / 2;
    
    if (loadTime > this.metrics.pageLoad.p95) {
      this.metrics.pageLoad.p95 = loadTime;
    }
    
    if (loadTime > this.metrics.pageLoad.p99) {
      this.metrics.pageLoad.p99 = loadTime;
    }
    
    // Track slowest pages
    if (this.metrics.pageLoad.slowest.length < 10) {
      this.metrics.pageLoad.slowest.push(pageName);
    } else {
      const slowest = this.metrics.pageLoad.slowest.sort();
      if (loadTime > Number(slowest[0])) {
        this.metrics.pageLoad.slowest[0] = pageName;
      }
    }
  }

  private updateAPIMetrics(endpoint: string, duration: number, status: number): void {
    // Update API metrics
    this.metrics.api.average = (this.metrics.api.average + duration) / 2;
    
    if (duration > this.metrics.api.p95) {
      this.metrics.api.p95 = duration;
    }
    
    if (duration > this.metrics.api.p99) {
      this.metrics.api.p99 = duration;
    }
    
    // Track slowest APIs
    if (this.metrics.api.slowest.length < 10) {
      this.metrics.api.slowest.push(endpoint);
    } else {
      const slowest = this.metrics.api.slowest.sort();
      if (duration > Number(slowest[0])) {
        this.metrics.api.slowest[0] = endpoint;
      }
    }
  }

  private updateErrorMetrics(error: Error, context: any): void {
    this.metrics.errors.total++;
    
    const errorType = error.constructor.name;
    this.metrics.errors.byType[errorType] = (this.metrics.errors.byType[errorType] || 0) + 1;
    
    if (this.isCriticalError(error)) {
      this.metrics.errors.critical++;
    }
  }

  private trackResourceLoad(entry: PerformanceResourceTiming): void {
    // Track resource loading performance
    this.metrics.resources.totalSize += entry.transferSize;
    this.metrics.resources.compressedSize += entry.encodedBodySize;
    
    // Track slowest resources
    if (entry.duration > 1000) { // Slower than 1 second
      this.metrics.resources.slowestResources.push(entry.name);
    }
  }

  private checkPerformanceBudget(): void {
    // Check if we're within performance budget
    const currentMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    if (currentMemory > this.performanceBudget.memoryUsage * 1024 * 1024) {
      this.createAlert({
        type: 'memory_leak',
        severity: 'high',
        message: `Memory usage ${Math.round(currentMemory / 1024 / 1024)}MB exceeds budget ${this.performanceBudget.memoryUsage}MB`,
        metrics: { currentMemory, budget: this.performanceBudget.memoryUsage },
        recommendations: [
          'Review memory leaks',
          'Optimize object creation',
          'Implement garbage collection',
          'Use memory profiling tools'
        ]
      });
    }
  }

  private createAlert(alert: Omit<PerformanceAlert, 'id' | 'timestamp' | 'resolved'>): void {
    const performanceAlert: PerformanceAlert = {
      id: `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...alert
    };
    
    this.alerts.push(performanceAlert);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
    
    logger.warn('Performance alert created', performanceAlert, 'PERFORMANCE');
  }

  private isCriticalError(error: Error): boolean {
    const criticalErrors = [
      'ChunkLoadError',
      'TypeError',
      'ReferenceError',
      'NetworkError'
    ];
    
    return criticalErrors.some(criticalError => 
      error.name.includes(criticalError) || error.message.includes(criticalError)
    );
  }

  private calculateOverallScore(): number {
    // Calculate overall performance score (0-100)
    const pageLoadScore = Math.max(0, 100 - (this.metrics.pageLoad.average / 100));
    const apiScore = Math.max(0, 100 - (this.metrics.api.average / 10));
    const errorScore = Math.max(0, 100 - (this.metrics.errors.total * 5));
    
    return Math.round((pageLoadScore + apiScore + errorScore) / 3);
  }

  private calculateBudgetCompliance(): number {
    // Calculate budget compliance percentage
    const pageLoadCompliance = this.metrics.pageLoad.average <= this.performanceBudget.pageLoad ? 100 : 
      Math.max(0, 100 - ((this.metrics.pageLoad.average - this.performanceBudget.pageLoad) / this.performanceBudget.pageLoad * 100));
    
    const apiCompliance = this.metrics.api.average <= this.performanceBudget.apiResponse ? 100 : 
      Math.max(0, 100 - ((this.metrics.api.average - this.performanceBudget.apiResponse) / this.performanceBudget.apiResponse * 100));
    
    return Math.round((pageLoadCompliance + apiCompliance) / 2);
  }
}

export const performanceMonitoringService = PerformanceMonitoringService.getInstance();
