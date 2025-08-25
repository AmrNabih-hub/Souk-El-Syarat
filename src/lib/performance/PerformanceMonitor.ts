/**
 * Enterprise Performance Monitoring System
 * Advanced performance tracking, optimization, and real-time monitoring
 */

// Performance Metrics Types
export interface CoreWebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  tti: number; // Time to Interactive
}

export interface CustomMetrics {
  routeLoadTime: number;
  apiResponseTime: number;
  componentRenderTime: number;
  memoryUsage: number;
  bundleSize: number;
  cacheHitRate: number;
}

export interface PerformanceBudget {
  lcp: number; // < 2.5s
  fid: number; // < 100ms
  cls: number; // < 0.1
  fcp: number; // < 1.8s
  ttfb: number; // < 600ms
  tti: number; // < 3.5s
  bundleSize: number; // < 500KB
  memoryUsage: number; // < 50MB
}

export interface PerformanceAlert {
  id: string;
  metric: keyof (CoreWebVitals & CustomMetrics);
  threshold: number;
  actualValue: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  userAgent: string;
  url: string;
}

// Performance Budget Configuration
const DEFAULT_PERFORMANCE_BUDGET: PerformanceBudget = {
  lcp: 2500, // 2.5 seconds
  fid: 100,  // 100 milliseconds
  cls: 0.1,  // 0.1 score
  fcp: 1800, // 1.8 seconds
  ttfb: 600, // 600 milliseconds
  tti: 3500, // 3.5 seconds
  bundleSize: 512000, // 500KB
  memoryUsage: 52428800, // 50MB
};

// Performance Monitoring Class
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  private alerts: PerformanceAlert[] = [];
  private observers: PerformanceObserver[] = [];
  private budget: PerformanceBudget;
  private isMonitoring: boolean = false;
  private reportingEndpoint: string = '/api/performance';

  private constructor(budget: PerformanceBudget = DEFAULT_PERFORMANCE_BUDGET) {
    this.budget = budget;
    this.initializeMonitoring();
  }

  public static getInstance(budget?: PerformanceBudget): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor(budget);
    }
    return PerformanceMonitor.instance;
  }

  private initializeMonitoring(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      console.warn('Performance monitoring not supported in this environment');
      return;
    }

    this.setupCoreWebVitalsMonitoring();
    this.setupNavigationMonitoring();
    this.setupResourceMonitoring();
    this.setupMemoryMonitoring();
    this.startMonitoring();
  }

  private setupCoreWebVitalsMonitoring(): void {
    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      this.recordMetric('lcp', lastEntry.startTime);
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (e) {
      console.warn('LCP monitoring not supported');
    }

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        this.recordMetric('fid', entry.processingStart - entry.startTime);
      });
    });

    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (e) {
      console.warn('FID monitoring not supported');
    }

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          this.recordMetric('cls', clsValue);
        }
      });
    });

    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (e) {
      console.warn('CLS monitoring not supported');
    }
  }

  private setupNavigationMonitoring(): void {
    const navigationObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        // First Contentful Paint
        this.recordMetric('fcp', entry.firstContentfulPaint);
        
        // Time to First Byte
        this.recordMetric('ttfb', entry.responseStart - entry.requestStart);
        
        // Time to Interactive (approximation)
        this.recordMetric('tti', entry.domInteractive - entry.navigationStart);
      });
    });

    try {
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);
    } catch (e) {
      console.warn('Navigation monitoring not supported');
    }
  }

  private setupResourceMonitoring(): void {
    const resourceObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      let totalSize = 0;
      
      entries.forEach((entry: any) => {
        totalSize += entry.transferSize || 0;
        
        // Track slow resources
        const loadTime = entry.responseEnd - entry.startTime;
        if (loadTime > 1000) { // Resources taking more than 1 second
          this.recordAlert({
            id: `slow-resource-${Date.now()}`,
            metric: 'apiResponseTime' as keyof (CoreWebVitals & CustomMetrics),
            threshold: 1000,
            actualValue: loadTime,
            severity: 'medium',
            timestamp: new Date(),
            userAgent: navigator.userAgent,
            url: window.location.href,
          });
        }
      });

      this.recordMetric('bundleSize', totalSize);
    });

    try {
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (e) {
      console.warn('Resource monitoring not supported');
    }
  }

  private setupMemoryMonitoring(): void {
    // Safe memory monitoring without dynamic execution
    const perfWithMemory = performance as { memory?: { usedJSHeapSize: number } };
    if (perfWithMemory.memory && typeof perfWithMemory.memory === 'object') {
      setInterval(() => {
        const memoryInfo = perfWithMemory.memory;
        if (memoryInfo && typeof memoryInfo.usedJSHeapSize === 'number') {
          this.recordMetric('memoryUsage', memoryInfo.usedJSHeapSize);
        
          // Alert on high memory usage
          if (memoryInfo.usedJSHeapSize > this.budget.memoryUsage) {
          this.recordAlert({
            id: `high-memory-${Date.now()}`,
            metric: 'memoryUsage',
            threshold: this.budget.memoryUsage,
            actualValue: memoryInfo.usedJSHeapSize,
            severity: 'high',
            timestamp: new Date(),
            userAgent: navigator.userAgent,
            url: window.location.href,
          });
          }
                }
      }, 30000); // Check every 30 seconds
    }
  }
  }

  }
    this.metrics.set(name, value);
    this.checkBudget(name, value);
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Performance Metric: ${name} = ${value.toFixed(2)}${this.getUnit(name)}`);
    }
  }

  private recordAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);
    
    // Log alert
    console.warn(`🚨 Performance Alert: ${alert.metric} exceeded threshold`, alert);
    
    // Send to monitoring service
    this.sendAlert(alert);
  }

  private checkBudget(metricName: string, value: number): void {
    const threshold = this.budget[metricName as keyof PerformanceBudget];
    if (threshold && value > threshold) {
      const severity = this.getSeverity(metricName, value, threshold);
      
      this.recordAlert({
        id: `budget-violation-${metricName}-${Date.now()}`,
        metric: metricName as keyof (CoreWebVitals & CustomMetrics),
        threshold,
        actualValue: value,
        severity,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    }
  }

  private getSeverity(
    metricName: string, 
    value: number, 
    threshold: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = value / threshold;
    
    if (ratio > 2) return 'critical';
    if (ratio > 1.5) return 'high';
    if (ratio > 1.2) return 'medium';
    return 'low';
  }

  private getUnit(metricName: string): string {
    if (metricName.includes('Time') || ['lcp', 'fid', 'fcp', 'ttfb', 'tti'].includes(metricName)) {
      return 'ms';
    }
    if (metricName === 'cls') return '';
    if (metricName === 'bundleSize' || metricName === 'memoryUsage') return 'B';
    return '';
  }

  private async sendAlert(alert: PerformanceAlert): Promise<void> {
    try {
      await fetch(this.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'performance_alert',
          alert,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.warn('Failed to send performance alert:', error);
    }
  }

  // Public API Methods
  public startMonitoring(): void {
    this.isMonitoring = true;
    console.log('🎯 Performance monitoring started');
  }

  public stopMonitoring(): void {
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    console.log('⏹️ Performance monitoring stopped');
  }

  public getMetrics(): Map<string, number> {
    return new Map(this.metrics);
  }

  public getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  public getCoreWebVitals(): Partial<CoreWebVitals> {
    return {
      lcp: this.metrics.get('lcp'),
      fid: this.metrics.get('fid'),
      cls: this.metrics.get('cls'),
      fcp: this.metrics.get('fcp'),
      ttfb: this.metrics.get('ttfb'),
      tti: this.metrics.get('tti'),
    };
  }

  public getPerformanceScore(): number {
    const vitals = this.getCoreWebVitals();
    let score = 100;
    
    // Deduct points based on budget violations
    Object.entries(vitals).forEach(([metric, value]) => {
      if (value) {
        const threshold = this.budget[metric as keyof PerformanceBudget];
        if (threshold && value > threshold) {
          const penalty = Math.min(30, (value / threshold - 1) * 100);
          score -= penalty;
        }
      }
    });
    
    return Math.max(0, Math.round(score));
  }

  // Route Performance Tracking
  public trackRouteChange(routeName: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const loadTime = performance.now() - startTime;
      this.recordMetric('routeLoadTime', loadTime);
      
      console.log(`🛣️ Route "${routeName}" loaded in ${loadTime.toFixed(2)}ms`);
    };
  }

  // Component Performance Tracking
  public trackComponentRender<T extends (...args: any[]) => any>(
    componentName: string,
    renderFunction: T
  ): T {
    return ((...args: Parameters<T>) => {
      const startTime = performance.now();
      const result = renderFunction(...args);
      const renderTime = performance.now() - startTime;
      
      this.recordMetric('componentRenderTime', renderTime);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🧩 Component "${componentName}" rendered in ${renderTime.toFixed(2)}ms`);
      }
      
      return result;
    }) as T;
  }

  // API Performance Tracking
  public trackApiCall(url: string, options?: Record<string, unknown>): Promise<Response> {
    const startTime = performance.now();
    
    return fetch(url, options).then(response => {
      const responseTime = performance.now() - startTime;
      this.recordMetric('apiResponseTime', responseTime);
      
      // Alert on slow API calls
      if (responseTime > 2000) {
        this.recordAlert({
          id: `slow-api-${Date.now()}`,
          metric: 'apiResponseTime',
          threshold: 2000,
          actualValue: responseTime,
          severity: 'medium',
          timestamp: new Date(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        });
      }
      
      return response;
    });
  }

  // Performance Report Generation
  public generateReport(): {
    summary: {
      score: number;
      grade: string;
      timestamp: Date;
    };
    metrics: Record<string, number>;
    alerts: PerformanceAlert[];
    recommendations: string[];
  } {
    const score = this.getPerformanceScore();
    const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
    
    const recommendations: string[] = [];
    const vitals = this.getCoreWebVitals();
    
    if (vitals.lcp && vitals.lcp > this.budget.lcp) {
      recommendations.push('Optimize images and reduce server response time to improve LCP');
    }
    
    if (vitals.fid && vitals.fid > this.budget.fid) {
      recommendations.push('Reduce JavaScript execution time to improve FID');
    }
    
    if (vitals.cls && vitals.cls > this.budget.cls) {
      recommendations.push('Reserve space for dynamic content to improve CLS');
    }

    return {
      summary: {
        score,
        grade,
        timestamp: new Date(),
      },
      metrics: Object.fromEntries(this.metrics),
      alerts: this.getAlerts(),
      recommendations,
    };
  }
}

// React Hook for Performance Monitoring
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance();
  
  const trackRoute = (routeName: string) => monitor.trackRouteChange(routeName);
  const trackApi = (url: string, options?: Record<string, unknown>) => monitor.trackApiCall(url, options);
  const getMetrics = () => monitor.getMetrics();
  const getScore = () => monitor.getPerformanceScore();
  const getReport = () => monitor.generateReport();
  
  return {
    trackRoute,
    trackApi,
    getMetrics,
    getScore,
    getReport,
    monitor,
  };
}

// Performance Optimization Utilities
export class PerformanceOptimizer {
  // Lazy load images with intersection observer
  public static setupLazyImages(): void {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  // Preload critical resources
  public static preloadResource(href: string, as: string): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  }

  // Optimize third-party scripts
  public static loadScriptAsync(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  }
}

// Initialize performance monitoring
export const performanceMonitor = PerformanceMonitor.getInstance();

// Auto-start monitoring in browser environment
if (typeof window !== 'undefined') {
  performanceMonitor.startMonitoring();
  PerformanceOptimizer.setupLazyImages();
}

export default performanceMonitor;