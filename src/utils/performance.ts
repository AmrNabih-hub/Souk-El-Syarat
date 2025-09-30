/**
 * Performance Utilities
 * Helper functions for optimizing application performance
 */

// Debounce function for search and input optimization
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
};

// Throttle function for scroll and resize optimization
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Lazy loading utility for images
export const createImageLoader = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// Intersection Observer for lazy loading
export const createIntersectionObserver = (
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): IntersectionObserver => {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  };
  
  return new IntersectionObserver(callback, defaultOptions);
};

// Memoization utility
export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map();
  
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    return result;
  }) as T;
};

// Performance measurement utility
export const measurePerformance = async <T>(
  name: string,
  fn: () => Promise<T> | T
): Promise<T> => {
  const start = performance.now();
  
  try {
    const result = await fn();
    const end = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ ${name}: ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const end = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ ${name} failed after ${(end - start).toFixed(2)}ms:`, error);
    }
    
    throw error;
  }
};

// Bundle size optimization - dynamic imports
export const loadModule = async <T>(moduleFactory: () => Promise<T>): Promise<T> => {
  try {
    return await moduleFactory();
  } catch (error) {
    console.error('Failed to load module:', error);
    throw error;
  }
};

// Memory usage tracking (development only)
export const trackMemoryUsage = (label: string): void => {
  if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
    const memory = (performance as any).memory;
    console.log(`🧠 Memory Usage - ${label}:`, {
      used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB`,
      total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)} MB`,
      limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)} MB`,
    });
  }
};

// Virtual scrolling utility for large lists
export const calculateVisibleItems = (
  scrollTop: number,
  itemHeight: number,
  containerHeight: number,
  totalItems: number,
  overscan: number = 5
): { startIndex: number; endIndex: number; visibleCount: number } => {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 2 * overscan;
  const endIndex = Math.min(totalItems - 1, startIndex + visibleCount);
  
  return { startIndex, endIndex, visibleCount };
};

// Image optimization utility
export const optimizeImageUrl = (
  url: string,
  width?: number,
  height?: number,
  quality: number = 80
): string => {
  // For Unsplash images, add optimization parameters
  if (url.includes('unsplash.com')) {
    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    params.set('q', quality.toString());
    params.set('auto', 'format');
    
    return `${url}${url.includes('?') ? '&' : '?'}${params.toString()}`;
  }
  
  return url;
};

// Local storage with compression
export const compressedStorage = {
  setItem: (key: string, value: any): void => {
    try {
      const compressed = JSON.stringify(value);
      localStorage.setItem(key, compressed);
    } catch (error) {
      console.error('Failed to save to compressed storage:', error);
    }
  },
  
  getItem: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Failed to load from compressed storage:', error);
      return null;
    }
  },
  
  removeItem: (key: string): void => {
    localStorage.removeItem(key);
  },
};

// Preload critical resources
export const preloadResource = (href: string, as: string, type?: string): void => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) link.type = type;
  
  document.head.appendChild(link);
};

// Critical CSS loading
export const loadCriticalCSS = (css: string): void => {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
};

export default {
  debounce,
  throttle,
  createImageLoader,
  createIntersectionObserver,
  memoize,
  measurePerformance,
  loadModule,
  trackMemoryUsage,
  calculateVisibleItems,
  optimizeImageUrl,
  compressedStorage,
  preloadResource,
  loadCriticalCSS,
};