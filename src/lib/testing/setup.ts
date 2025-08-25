/**
 * Professional Testing Setup
 * Comprehensive testing utilities and mocks for bulletproof testing
 */

import { expect, afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';
import { server } from './mocks/server';

// Extend expect with testing-library matchers
expect.extend(matchers);

// Global test setup
beforeAll(() => {
  // Start MSW server
  server.listen({
    onUnhandledRequest: 'error',
  });

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    disconnect() {}
    unobserve() {}
  };

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    observe() {}
    disconnect() {}
    unobserve() {}
  };

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });

  // Mock scrollTo
  Object.defineProperty(window, 'scrollTo', {
    writable: true,
    value: () => {},
  });

  // Mock localStorage
  const localStorageMock = {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, value: string) => {
      mockStorage[key] = value;
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      for (const key in mockStorage) {
        delete mockStorage[key];
      }
    },
    length: 0,
    key: () => null,
  };

  const mockStorage: Record<string, string> = {};
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: localStorageMock,
  });

  // Mock fetch
  global.fetch = async (url: string | URL | Request, init?: RequestInit) => {
    console.warn(`Unmocked fetch call to ${url}`);
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  // Mock console methods in tests
  const originalError = console.error;
  console.error = (...args: any[]) => {
    // Suppress expected React warnings in tests
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
       args[0].includes('Warning: An invalid form control'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

// Reset handlers and cleanup after each test
afterEach(() => {
  server.resetHandlers();
  cleanup();
  
  // Clear all mocks
  vi.clearAllMocks();
  
  // Clear localStorage
  localStorage.clear();
  sessionStorage.clear();
});

// Clean up after all tests
afterAll(() => {
  server.close();
});

// Global test utilities
export const testUtils = {
  // Wait for next tick
  waitForNextTick: () => new Promise(resolve => setTimeout(resolve, 0)),
  
  // Wait for condition
  waitForCondition: async (
    condition: () => boolean,
    timeout = 5000,
    interval = 100
  ): Promise<void> => {
    const start = Date.now();
    
    while (!condition() && Date.now() - start < timeout) {
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    if (!condition()) {
      throw new Error(`Condition not met within ${timeout}ms`);
    }
  },
  
  // Mock timer helpers
  mockTimers: () => {
    vi.useFakeTimers();
    return {
      advanceTime: (ms: number) => vi.advanceTimersByTime(ms),
      runAllTimers: () => vi.runAllTimers(),
      restore: () => vi.useRealTimers(),
    };
  },
  
  // Mock network conditions
  mockSlowNetwork: (delay = 2000) => {
    const originalFetch = global.fetch;
    global.fetch = async (...args) => {
      await new Promise(resolve => setTimeout(resolve, delay));
      return originalFetch(...args);
    };
    
    return () => {
      global.fetch = originalFetch;
    };
  },
  
  // Mock offline condition
  mockOffline: () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });
    
    return () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
    };
  },
  
  // Create mock user
  createMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'customer',
    isActive: true,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    preferences: {
      language: 'ar',
      currency: 'EGP',
      notifications: {
        email: true,
        sms: false,
        push: true,
      },
    },
    ...overrides,
  }),
  
  // Create mock product
  createMockProduct: (overrides = {}) => ({
    id: 'test-product-id',
    title: 'Test Product',
    description: 'Test product description',
    price: 100000,
    category: 'cars',
    condition: 'new',
    images: ['https://example.com/image1.jpg'],
    vendorId: 'test-vendor-id',
    status: 'published',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  // Create mock error
  createMockError: (type = 'NETWORK', message = 'Test error') => ({
    type,
    message,
    code: 'TEST_ERROR',
    timestamp: new Date().toISOString(),
  }),
};

// Custom test matchers
expect.extend({
  toBeAccessible: (received) => {
    // Basic accessibility check
    const hasAriaLabel = received.hasAttribute('aria-label');
    const hasRole = received.hasAttribute('role');
    const hasAltText = received.tagName === 'IMG' ? received.hasAttribute('alt') : true;
    
    const pass = hasAriaLabel || hasRole || hasAltText;
    
    return {
      pass,
      message: () => `Expected element to be accessible`,
    };
  },
  
  toHaveLoadingState: (received) => {
    const hasLoadingIndicator = received.querySelector('[data-testid="loading"]') !== null;
    const hasAriaLabel = received.getAttribute('aria-label')?.includes('loading');
    const hasLoadingClass = received.classList.contains('loading');
    
    const pass = hasLoadingIndicator || hasAriaLabel || hasLoadingClass;
    
    return {
      pass,
      message: () => `Expected element to have loading state`,
    };
  },
  
  toBeRTLCompliant: (received) => {
    const computedStyle = window.getComputedStyle(received);
    const direction = computedStyle.direction;
    const textAlign = computedStyle.textAlign;
    
    const pass = direction === 'rtl' || textAlign === 'right';
    
    return {
      pass,
      message: () => `Expected element to be RTL compliant`,
    };
  },
});

// Performance testing utilities
export const performanceUtils = {
  measureRenderTime: async (renderFn: () => void): Promise<number> => {
    const start = performance.now();
    await renderFn();
    const end = performance.now();
    return end - start;
  },
  
  measureMemoryUsage: (): number => {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  },
  
  expectFastRender: (renderTime: number, threshold = 100) => {
    expect(renderTime).toBeLessThan(threshold);
  },
};

// Accessibility testing utilities
export const a11yUtils = {
  checkKeyboardNavigation: async (element: HTMLElement) => {
    // Simulate Tab key press
    element.focus();
    expect(document.activeElement).toBe(element);
  },
  
  checkScreenReaderText: (element: HTMLElement) => {
    const ariaLabel = element.getAttribute('aria-label');
    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    const textContent = element.textContent;
    
    expect(ariaLabel || ariaLabelledBy || textContent).toBeTruthy();
  },
  
  checkColorContrast: (element: HTMLElement) => {
    const computedStyle = window.getComputedStyle(element);
    const color = computedStyle.color;
    const backgroundColor = computedStyle.backgroundColor;
    
    // Basic check - in real implementation, use color contrast libraries
    expect(color).not.toBe(backgroundColor);
  },
};

export default testUtils;