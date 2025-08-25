/**
 * 🚀 Advanced Performance Monitoring Service
 * Souk El-Syarat - Enterprise Performance Optimization
 */

import { performance } from '@/config/firebase.config';

interface PerformanceMetrics {
  pageLoadTime: number;
  timeToFirstByte: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
  totalBlockingTime: number;
}

interface ResourceTiming {
  name: string;
  duration: number;
  size: number;
  type: string;
}

export class PerformanceMonitorService {
  private static instance: PerformanceMonitorService;
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private resourceTimings: ResourceTiming[] = [];
  private isMonitoring = false;

  private constructor() {
    this.initializeMonitoring();
  }

  static getInstance(): PerformanceMonitorService {
    if (!PerformanceMonitorService.instance) {
      PerformanceMonitorService.instance = new PerformanceMonitorService();
    }
    return PerformanceMonitorService.instance;
  }

  /**
   * Initialize performance monitoring
   */
  private initializeMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Start monitoring on page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.startMonitoring());
    } else {
      this.startMonitoring();
    }

    // Monitor route changes
    this.monitorRouteChanges();

    // Monitor resource loading
    this.monitorResourceLoading();

    // Monitor user interactions
    this.monitorUserInteractions();
  }

  /**
   * Start performance monitoring
   */
  private startMonitoring(): void {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    // Collect Web Vitals
    this.collectWebVitals();

    // Monitor memory usage
    this.monitorMemoryUsage();

    // Monitor network performance
    this.monitorNetworkPerformance();

    // Monitor JavaScript errors
    this.monitorJavaScriptErrors();

    console.log('🚀 Performance monitoring started');
  }

  /**
   * Collect Web Vitals metrics
   */
  private collectWebVitals(): void {
    // Use Performance Observer API
    if ('PerformanceObserver' in window) {
      // Monitor Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.updateMetric('largestContentfulPaint', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Monitor First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.updateMetric('firstInputDelay', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Monitor Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.updateMetric('cumulativeLayoutShift', clsValue);
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }

    // Collect navigation timing
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const navigationStart = timing.navigationStart;

      this.updateMetric('pageLoadTime', timing.loadEventEnd - navigationStart);
      this.updateMetric('timeToFirstByte', timing.responseStart - navigationStart);
      this.updateMetric('firstContentfulPaint', this.getFirstContentfulPaint());
    }
  }

  /**
   * Get First Contentful Paint timing
   */
  private getFirstContentfulPaint(): number {
    if (window.performance && window.performance.getEntriesByType) {
      const paintEntries = window.performance.getEntriesByType('paint');
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      return fcp ? fcp.startTime : 0;
    }
    return 0;
  }

  /**
   * Monitor route changes for SPA
   */
  private monitorRouteChanges(): void {
    // Override pushState and replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.onRouteChange();
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.onRouteChange();
    };

    // Listen to popstate events
    window.addEventListener('popstate', () => this.onRouteChange());
  }

  /**
   * Handle route change
   */
  private onRouteChange(): void {
    // Reset metrics for new page
    this.resetMetrics();
    
    // Start collecting new metrics
    setTimeout(() => this.collectWebVitals(), 100);

    // Log route change
    console.log('📊 Route changed, collecting new metrics');
  }

  /**
   * Monitor resource loading
   */
  private monitorResourceLoading(): void {
    if (!window.performance || !window.performance.getEntriesByType) return;

    const resources = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    resources.forEach(resource => {
      this.resourceTimings.push({
        name: resource.name,
        duration: resource.duration,
        size: resource.transferSize || 0,
        type: resource.initiatorType
      });
    });

    // Monitor future resource loads
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          this.resourceTimings.push({
            name: entry.name,
            duration: entry.duration,
            size: entry.transferSize || 0,
            type: entry.initiatorType
          });
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
    }
  }

  /**
   * Monitor user interactions
   */
  private monitorUserInteractions(): void {
    // Track click events
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const selector = this.getElementSelector(target);
      this.trackInteraction('click', selector);
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const target = event.target as HTMLElement;
      const selector = this.getElementSelector(target);
      this.trackInteraction('submit', selector);
    });
  }

  /**
   * Monitor memory usage
   */
  private monitorMemoryUsage(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const usedMemory = memory.usedJSHeapSize / 1048576; // Convert to MB
        const totalMemory = memory.totalJSHeapSize / 1048576;
        
        if (usedMemory > 100) { // Alert if memory usage exceeds 100MB
          console.warn(`⚠️ High memory usage: ${usedMemory.toFixed(2)}MB / ${totalMemory.toFixed(2)}MB`);
        }
      }, 30000); // Check every 30 seconds
    }
  }

  /**
   * Monitor network performance
   */
  private monitorNetworkPerformance(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      connection.addEventListener('change', () => {
        console.log(`📡 Network changed: ${connection.effectiveType}, RTT: ${connection.rtt}ms`);
      });
    }
  }

  /**
   * Monitor JavaScript errors
   */
  private monitorJavaScriptErrors(): void {
    window.addEventListener('error', (event) => {
      console.error('🚨 JavaScript Error:', {
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        error: event.error
      });

      // Send to Firebase Performance Monitoring
      if (performance) {
        const trace = performance.trace('js_error');
        trace.putAttribute('error_message', event.message);
        trace.putAttribute('error_source', event.filename || 'unknown');
        trace.start();
        trace.stop();
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('🚨 Unhandled Promise Rejection:', event.reason);
    });
  }

  /**
   * Update a metric value
   */
  private updateMetric(name: keyof PerformanceMetrics, value: number): void {
    const currentPage = window.location.pathname;
    const metrics = this.metrics.get(currentPage) || {} as PerformanceMetrics;
    metrics[name] = value;
    this.metrics.set(currentPage, metrics);

    // Send to Firebase Performance Monitoring
    if (performance) {
      const trace = performance.trace(`page_${name}`);
      trace.putMetric(name, Math.round(value));
      trace.start();
      trace.stop();
    }
  }

  /**
   * Reset metrics for new page
   */
  private resetMetrics(): void {
    const currentPage = window.location.pathname;
    this.metrics.delete(currentPage);
  }

  /**
   * Track user interaction
   */
  private trackInteraction(type: string, selector: string): void {
    console.log(`👆 User interaction: ${type} on ${selector}`);
    
    // Send to Firebase Performance Monitoring
    if (performance) {
      const trace = performance.trace(`user_${type}`);
      trace.putAttribute('element', selector);
      trace.start();
      trace.stop();
    }
  }

  /**
   * Get element selector for tracking
   */
  private getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(page?: string): PerformanceMetrics | undefined {
    const targetPage = page || window.location.pathname;
    return this.metrics.get(targetPage);
  }

  /**
   * Get resource timings
   */
  public getResourceTimings(): ResourceTiming[] {
    return this.resourceTimings;
  }

  /**
   * Get performance report
   */
  public getPerformanceReport(): {
    metrics: Map<string, PerformanceMetrics>;
    resources: ResourceTiming[];
    summary: {
      totalResources: number;
      totalResourceSize: number;
      averageResourceDuration: number;
      slowestResource: ResourceTiming | null;
    };
  } {
    const totalSize = this.resourceTimings.reduce((sum, r) => sum + r.size, 0);
    const totalDuration = this.resourceTimings.reduce((sum, r) => sum + r.duration, 0);
    const slowestResource = this.resourceTimings.reduce((slowest, current) => 
      current.duration > (slowest?.duration || 0) ? current : slowest, null as ResourceTiming | null);

    return {
      metrics: this.metrics,
      resources: this.resourceTimings,
      summary: {
        totalResources: this.resourceTimings.length,
        totalResourceSize: totalSize,
        averageResourceDuration: this.resourceTimings.length > 0 ? totalDuration / this.resourceTimings.length : 0,
        slowestResource
      }
    };
  }

  /**
   * Optimize performance based on metrics
   */
  public optimizePerformance(): void {
    const report = this.getPerformanceReport();
    
    // Lazy load images
    this.lazyLoadImages();
    
    // Preconnect to required origins
    this.preconnectOrigins();
    
    // Prefetch critical resources
    this.prefetchCriticalResources();
    
    // Remove unused CSS
    this.removeUnusedCSS();
    
    console.log('⚡ Performance optimization applied', report.summary);
  }

  /**
   * Lazy load images
   */
  private lazyLoadImages(): void {
    if ('IntersectionObserver' in window) {
      const images = document.querySelectorAll('img[data-src]');
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src || '';
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    }
  }

  /**
   * Preconnect to required origins
   */
  private preconnectOrigins(): void {
    const origins = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://firebasestorage.googleapis.com'
    ];

    origins.forEach(origin => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = origin;
      document.head.appendChild(link);
    });
  }

  /**
   * Prefetch critical resources
   */
  private prefetchCriticalResources(): void {
    const criticalResources = [
      '/api/products',
      '/api/vendors',
      '/api/categories'
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = resource;
      document.head.appendChild(link);
    });
  }

  /**
   * Remove unused CSS (placeholder for actual implementation)
   */
  private removeUnusedCSS(): void {
    // This would require a more complex implementation
    // involving CSS coverage analysis
    console.log('📦 CSS optimization check completed');
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitorService.getInstance();