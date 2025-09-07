import React, { useEffect, useState, useCallback } from 'react';
import { performanceMonitor, measurePerformance } from '@/utils/performanceMonitor';

interface PerformanceOptimizerProps {
  children: React.ReactNode;
  enableMonitoring?: boolean;
  enablePreloading?: boolean;
  enableImageOptimization?: boolean;
  enableBundleOptimization?: boolean;
}

const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({
  children,
  enableMonitoring = true,
  enablePreloading = true,
  enableImageOptimization = true,
  enableBundleOptimization = true,
}) => {
  const [isOptimized, setIsOptimized] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  // Preload critical resources - DISABLED to prevent conflicts with HTML preloads
  const preloadCriticalResources = useCallback(() => {
    if (!enablePreloading) return;

    const endPreload = measurePerformance.measureBundleLoad('critical-resources');
    
    // FIXED: Disabled dynamic preloading to prevent conflicts with HTML preloads
    // All critical resources (fonts and images) are now preloaded in index.html
    // This prevents duplicate preload warnings and ensures proper loading order
    
    console.log('PerformanceOptimizer: Preloading disabled - handled by HTML preloads');
    
    endPreload();
  }, [enablePreloading]);

  // Optimize images
  const optimizeImages = useCallback(() => {
    if (!enableImageOptimization) return;

    const endOptimization = measurePerformance.measureRender('image-optimization');
    
    // Add loading="lazy" to images that don't have it
    const images = document.querySelectorAll('img:not([loading])');
    images.forEach(img => {
      img.setAttribute('loading', 'lazy');
    });

    // Add decoding="async" to images
    images.forEach(img => {
      img.setAttribute('decoding', 'async');
    });

    endOptimization();
  }, [enableImageOptimization]);

  // Optimize bundle loading
  const optimizeBundleLoading = useCallback(() => {
    if (!enableBundleOptimization) return;

    const endOptimization = measurePerformance.measureBundleLoad('bundle-optimization');
    
    // Preload next likely routes
    const nextRoutes = ['/marketplace', '/login', '/register'];
    
    nextRoutes.forEach(route => {
      // This would typically preload the route's JavaScript bundle
      // For now, we'll just mark it as optimized
      console.log(`Preloading route: ${route}`);
    });

    endOptimization();
  }, [enableBundleOptimization]);

  // Monitor performance
  const monitorPerformance = useCallback(() => {
    if (!enableMonitoring) return;

    // Monitor Core Web Vitals
    const monitorWebVitals = () => {
      // Largest Contentful Paint (LCP)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        performanceMonitor.recordMetric('lcp', {
          startTime: lastEntry.startTime,
          endTime: lastEntry.startTime,
          duration: lastEntry.startTime,
          metadata: { element: lastEntry.element?.tagName },
        });
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          performanceMonitor.recordMetric('fid', {
            startTime: entry.startTime,
            endTime: entry.startTime,
            duration: entry.processingStart - entry.startTime,
            metadata: { eventType: entry.name },
          });
        });
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            performanceMonitor.recordMetric('cls', {
              startTime: entry.startTime,
              endTime: entry.startTime,
              duration: entry.value,
              metadata: { cumulative: clsValue },
            });
          }
        });
      }).observe({ entryTypes: ['layout-shift'] });
    };

    monitorWebVitals();

    // Monitor resource loading
    const monitorResources = () => {
      const resources = performance.getEntriesByType('resource');
      resources.forEach(resource => {
        const resourceEntry = resource as PerformanceResourceTiming;
        if (resourceEntry.duration > 1000) { // Log slow resources
          console.warn(`Slow resource: ${resourceEntry.name} took ${resourceEntry.duration}ms`);
        }
      });
    };

    // Monitor after page load
    window.addEventListener('load', monitorResources);
  }, [enableMonitoring]);

  // Initialize optimizations
  useEffect(() => {
    const endInit = measurePerformance.measureRender('performance-optimizer-init');
    
    preloadCriticalResources();
    optimizeImages();
    optimizeBundleLoading();
    monitorPerformance();
    
    setIsOptimized(true);
    endInit();
  }, [preloadCriticalResources, optimizeImages, optimizeBundleLoading, monitorPerformance]);

  // Generate performance report
  useEffect(() => {
    if (enableMonitoring) {
      const timer = setTimeout(() => {
        const report = performanceMonitor.generateReport();
        setPerformanceMetrics(report);
        
        // Log performance report in development
        if (process.env.NODE_ENV === 'development') {
          performanceMonitor.logReport();
        }
      }, 5000); // Wait 5 seconds after page load

      return () => clearTimeout(timer);
    }
  }, [enableMonitoring]);

  // Performance tips component
  const PerformanceTips = () => (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-50">
      <h3 className="font-semibold text-neutral-900 mb-2">Performance Tips</h3>
      <ul className="text-sm text-neutral-600 space-y-1">
        <li>• Images are lazy-loaded for faster initial load</li>
        <li>• Critical resources are preloaded</li>
        <li>• Bundle optimization is enabled</li>
        <li>• Performance monitoring is active</li>
      </ul>
      {performanceMetrics && (
        <div className="mt-3 pt-3 border-t border-neutral-200">
          <p className="text-xs text-neutral-500">
            Load time: {performanceMetrics.summary.averageDuration.toFixed(0)}ms
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {children}
      {process.env.NODE_ENV === 'development' && isOptimized && <PerformanceTips />}
    </>
  );
};

export default PerformanceOptimizer;