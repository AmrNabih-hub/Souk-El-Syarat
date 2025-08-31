/**
 * Enhanced lazy loading with retry logic and preloading
 * Handles network failures and provides better UX
 */

import { lazy, ComponentType, LazyExoticComponent } from 'react';

interface RetryOptions {
  retries?: number;
  retryDelay?: number;
  onRetry?: (attemptNumber: number) => void;
}

/**
 * Retry loading a chunk to handle network failures
 */
function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { retries = 3, retryDelay = 1000, onRetry } = options;
  
  return new Promise((resolve, reject) => {
    const attempt = (attemptNumber: number) => {
      fn()
        .then(resolve)
        .catch((error) => {
          // console.log(`Attempt ${attemptNumber} failed:`, error);
          
          if (attemptNumber <= retries) {
            if (onRetry) {
              onRetry(attemptNumber);
            }
            
            setTimeout(() => {
              attempt(attemptNumber + 1);
            }, retryDelay * attemptNumber);
          } else {
            reject(error);
          }
        });
    };
    
    attempt(1);
  });
}

/**
 * Enhanced lazy loading with retry logic
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: RetryOptions = {}
): LazyExoticComponent<T> {
  return lazy(() => retry(importFn, options));
}

/**
 * Preload a component before it's needed
 */
export function preloadComponent(
  importFn: () => Promise<{ default: ComponentType<any> }>
): void {
  importFn();
}

/**
 * Create a lazy component with preload capability
 */
export function lazyWithPreload<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): LazyExoticComponent<T> & { preload: () => void } {
  const Component = lazyWithRetry(importFn);
  
  // Add preload method to the component
  (Component as any).preload = () => importFn();
  
  return Component as LazyExoticComponent<T> & { preload: () => void };
}

/**
 * Intersection Observer based lazy loading
 */
export function lazyLoadOnVisible<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  rootMargin = '50px'
): LazyExoticComponent<T> {
  let hasLoaded = false;
  let Component: T | null = null;
  
  return lazy(async () => {
    if (!hasLoaded) {
      // Use Intersection Observer to detect when component is near viewport
      return new Promise((resolve) => {
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting && !hasLoaded) {
              hasLoaded = true;
              importFn().then((module) => {
                Component = module.default;
                resolve(module);
              });
            }
          },
          { rootMargin }
        );
        
        // Start observing immediately
        // This is a placeholder - actual implementation would observe the component's container
        importFn().then(resolve);
      });
    }
    
    return { default: Component! };
  });
}

/**
 * Batch preload multiple components
 */
export async function batchPreload(
  components: Array<{ preload: () => void }>
): Promise<void> {
  await Promise.all(
    components.map((component) => {
      if (typeof component.preload === 'function') {
        return component.preload();
      }
      return Promise.resolve();
    })
  );
}

/**
 * Priority-based component loading
 */
export class ComponentLoader {
  private queue: Map<string, () => Promise<any>> = new Map();
  private loading: Set<string> = new Set();
  
  register(name: string, importFn: () => Promise<any>, priority: 'high' | 'medium' | 'low' = 'medium') {
    this.queue.set(name, importFn);
    
    // High priority components load immediately
    if (priority === 'high') {
      this.load(name);
    }
    // Medium priority loads on idle
    else if (priority === 'medium') {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => this.load(name));
      } else {
        setTimeout(() => this.load(name), 1);
      }
    }
    // Low priority loads after everything else
  }
  
  async load(name: string): Promise<void> {
    if (this.loading.has(name)) return;
    
    const importFn = this.queue.get(name);
    if (!importFn) return;
    
    this.loading.add(name);
    
    try {
      await importFn();
      this.queue.delete(name);
    } catch (error) {
      // console.error(`Failed to load component ${name}:`, error);
    } finally {
      this.loading.delete(name);
    }
  }
  
  async loadAll(): Promise<void> {
    const promises = Array.from(this.queue.keys()).map(name => this.load(name));
    await Promise.all(promises);
  }
}

// Global component loader instance
export const componentLoader = new ComponentLoader();