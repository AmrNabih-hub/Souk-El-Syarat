import { ComponentType, lazy, Component } from 'react';

// Enhanced lazy loading with retry mechanism
export function lazyWithRetry<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  retries = 3,
  delay = 1000
): T {
  return lazy(() => {
    return new Promise((resolve, reject) => {
      const attemptImport = (attempt: number) => {
        importFunc()
          .then(resolve)
          .catch((error) => {
            if (attempt < retries) {
              console.warn(`Lazy loading attempt ${attempt + 1} failed, retrying...`, error);
              setTimeout(() => attemptImport(attempt + 1), delay * attempt);
            } else {
              console.error('Lazy loading failed after all retries:', error);
              reject(error);
            }
          });
      };
      
      attemptImport(0);
    });
  });
}

// Preload function for components
export function preloadComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): Promise<{ default: T }> {
  return importFunc();
}

// Component loader with priority system
class ComponentLoader {
  private preloadedComponents = new Map<string, Promise<any>>();
  private priorities = new Map<string, 'high' | 'medium' | 'low'>();

  register(
    name: string,
    importFunc: () => Promise<any>,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ) {
    this.priorities.set(name, priority);
    this.preloadedComponents.set(name, importFunc());
  }

  async preload(name: string): Promise<any> {
    const component = this.preloadedComponents.get(name);
    if (component) {
      return component;
    }
    throw new Error(`Component ${name} not registered`);
  }

  async preloadByPriority(priority: 'high' | 'medium' | 'low' = 'high') {
    const components = Array.from(this.priorities.entries())
      .filter(([, p]) => p === priority)
      .map(([name]) => this.preload(name));

    return Promise.all(components);
  }

  getRegisteredComponents(): string[] {
    return Array.from(this.preloadedComponents.keys());
  }
}

export const componentLoader = new ComponentLoader();

// Enhanced lazy loading with preload capability
export function lazyWithPreload<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  const LazyComponent = lazyWithRetry(importFunc);
  
  // Add preload method to the component
  (LazyComponent as any).preload = () => preloadComponent(importFunc);
  
  return LazyComponent;
}

// Batch preload multiple components
export async function batchPreload(
  components: Array<() => Promise<any>>,
  concurrency = 3
): Promise<any[]> {
  const results: any[] = [];
  
  for (let i = 0; i < components.length; i += concurrency) {
    const batch = components.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(component => component()));
    results.push(...batchResults);
  }
  
  return results;
}

// Intersection Observer for lazy loading images
export class LazyImageLoader {
  private observer: IntersectionObserver;
  private images = new Map<Element, () => void>();

  constructor(options: IntersectionObserverInit = {}) {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const loadImage = this.images.get(entry.target);
            if (loadImage) {
              loadImage();
              this.observer.unobserve(entry.target);
              this.images.delete(entry.target);
            }
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );
  }

  observe(element: Element, loadImage: () => void) {
    this.images.set(element, loadImage);
    this.observer.observe(element);
  }

  unobserve(element: Element) {
    this.observer.unobserve(element);
    this.images.delete(element);
  }

  disconnect() {
    this.observer.disconnect();
    this.images.clear();
  }
}

// Performance monitoring for lazy loading
export class LazyLoadingPerformance {
  private metrics = new Map<string, { start: number; end?: number }>();

  startTiming(name: string) {
    this.metrics.set(name, { start: performance.now() });
  }

  endTiming(name: string) {
    const metric = this.metrics.get(name);
    if (metric) {
      metric.end = performance.now();
      const duration = metric.end - metric.start;
      console.log(`Lazy loading ${name}: ${duration.toFixed(2)}ms`);
    }
  }

  getMetrics() {
    const results: Record<string, number> = {};
    this.metrics.forEach((metric, name) => {
      if (metric.end) {
        results[name] = metric.end - metric.start;
      }
    });
    return results;
  }
}

export const lazyLoadingPerformance = new LazyLoadingPerformance();

// Utility for creating lazy-loaded routes
export function createLazyRoute<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: {
    retries?: number;
    delay?: number;
    priority?: 'high' | 'medium' | 'low';
    preload?: boolean;
  } = {}
) {
  const {
    retries = 3,
    delay = 1000,
    priority = 'medium',
    preload = false,
  } = options;

  const LazyComponent = lazyWithRetry(importFunc, retries, delay);
  
  if (preload) {
    // Preload the component
    setTimeout(() => {
      preloadComponent(importFunc).catch(console.warn);
    }, 100);
  }

  return LazyComponent;
}

// Hook for managing lazy loading state
export function useLazyLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadComponent = async <T extends ComponentType<any>>(
    importFunc: () => Promise<{ default: T }>
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const component = await importFunc();
      setIsLoading(false);
      return component;
    } catch (err) {
      const error = err as Error;
      setError(error);
      setIsLoading(false);
      throw error;
    }
  };

  return {
    isLoading,
    error,
    loadComponent,
  };
}

export default {
  lazyWithRetry,
  lazyWithPreload,
  preloadComponent,
  componentLoader,
  batchPreload,
  LazyImageLoader,
  LazyLoadingPerformance,
  lazyLoadingPerformance,
  createLazyRoute,
  useLazyLoading,
};