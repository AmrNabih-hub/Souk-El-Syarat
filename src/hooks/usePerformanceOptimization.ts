/**
 * Performance Optimization Hooks
 * Enterprise-grade performance monitoring and optimization
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  useEffect(() => {
    // Monitor Core Web Vitals
    const observer = new PerformanceObserver(list => {
      list.getEntries().forEach(entry => {
        if (entry.entryType === 'navigation') {
          const navigationEntry = entry as PerformanceNavigationTiming;
          // Performance metrics tracking disabled for production
          if (process.env.NODE_ENV === 'development') {
            // Performance data available but logging disabled
          }
        }

        if (entry.entryType === 'paint') {
          // if (process.env.NODE_ENV === 'development') console.log(`${entry.name}: ${entry.startTime}ms`);
        }

        if (entry.entryType === 'largest-contentful-paint') {
          // if (process.env.NODE_ENV === 'development') console.log(`LCP: ${entry.startTime}ms`);
        }
      });
    });

    observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });

    return () => observer.disconnect();
  }, []);
};

// Lazy loading hook with intersection observer
export const useLazyLoad = (threshold = 0.1) => {
  const { ref, inView } = useInView({
    threshold,
    triggerOnce: true,
    rootMargin: '50px 0px',
  });

  return { ref, inView };
};

// Image optimization hook
export const useOptimizedImage = (src: string, sizes?: string) => {
  const optimizedSrc = useMemo(() => {
    if (!src) return '';

    // Add optimization parameters for Unsplash images
    if (src.includes('unsplash.com')) {
      const url = new URL(src);
      url.searchParams.set('auto', 'format');
      url.searchParams.set('fit', 'crop');
      url.searchParams.set('q', '80');
      return url.toString();
    }

    return src;
  }, [src]);

  const srcSet = useMemo(() => {
    if (!src || !src.includes('unsplash.com')) return '';

    const baseUrl = new URL(src);
    baseUrl.searchParams.set('auto', 'format');
    baseUrl.searchParams.set('fit', 'crop');
    baseUrl.searchParams.set('q', '80');

    const widths = [320, 640, 768, 1024, 1280, 1536];
    return widths
      .map(width => {
        const url = new URL(baseUrl);
        url.searchParams.set('w', width.toString());
        return `${url.toString()} ${width}w`;
      })
      .join(', ');
  }, [src]);

  return { optimizedSrc, srcSet, sizes };
};

// Debounce hook for search and form inputs
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Memory-efficient list virtualization
export const useVirtualization = <T extends Record<string, unknown>>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return items.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      index: startIndex + index,
      offsetY: (startIndex + index) * itemHeight,
    }));
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    handleScroll,
    totalHeight: items.length * itemHeight,
  };
};

// Service Worker registration for PWA
export const useServiceWorker = () => {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          // if (process.env.NODE_ENV === 'development') console.log('Service Worker registered:', registration);
        } catch (error) {
          if (process.env.NODE_ENV === 'development')
            if (process.env.NODE_ENV === 'development')
              console.error('Service Worker registration failed:', error);
        }
      });
    }
  }, []);
};

// Preload critical resources
export const useResourcePreloader = (resources: string[]) => {
  useEffect(() => {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';

      if (resource.endsWith('.js')) {
        link.as = 'script';
      } else if (resource.endsWith('.css')) {
        link.as = 'style';
      } else if (resource.match(/\.(jpg|jpeg|png|webp|avif)$/)) {
        link.as = 'image';
      } else if (resource.endsWith('.woff2')) {
        link.as = 'font';
        link.type = 'font/woff2';
        link.crossOrigin = 'anonymous';
      }

      link.href = resource;
      document.head.appendChild(link);
    });
  }, [resources]);
};

// Bundle size monitoring
export const useBundleAnalytics = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      // Monitor bundle performance
      const observer = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (entry.entryType === 'resource' && entry.name.includes('.js')) {
            // Bundle performance monitoring disabled for production
            if (process.env.NODE_ENV === 'development') {
              // Bundle metrics available but logging disabled
            }
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
      return () => observer.disconnect();
    }
    return undefined;
  }, []);
};
