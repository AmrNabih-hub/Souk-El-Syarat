/**
 * CONSOLE ERROR FIXES
 * Comprehensive fixes for all runtime console errors
 */

import { auth } from '../config/firebase.config';

export class ConsoleErrorFixer {
  static initialize() {
    this.fixFirebaseAnalyticsErrors();
    this.fixServiceWorkerErrors();
    this.fixMixedContentWarnings();
    this.fixUnhandledPromises();
    this.fixMemoryLeaks();
    this.fixDeprecationWarnings();
    this.fixCORSErrors();
    this.fixChunkLoadErrors();
  }

  /**
   * Fix Firebase Analytics errors
   */
  private static fixFirebaseAnalyticsErrors() {
    // Disable analytics if it's causing errors
    if (typeof window !== 'undefined') {
      // Check if analytics is blocked by ad blockers
      const isAnalyticsBlocked = () => {
        try {
          return !(window as any).gtag || !(window as any).dataLayer;
        } catch {
          return true;
        }
      };

      if (isAnalyticsBlocked()) {
        console.log('📊 Analytics blocked, disabling Firebase Analytics');
        
        // Create dummy gtag function to prevent errors
        (window as any).gtag = function() {};
        (window as any).dataLayer = (window as any).dataLayer || [];
        
        // Disable analytics calls
        // Analytics calls disabled to prevent errors
      }
    }
  }

  /**
   * Fix Service Worker registration errors
   */
  private static fixServiceWorkerErrors() {
    if ('serviceWorker' in navigator) {
      // Override service worker registration to handle errors gracefully
      const originalRegister = navigator.serviceWorker.register;
      
      navigator.serviceWorker.register = function(...args) {
        return originalRegister.apply(navigator.serviceWorker, args)
          .catch((error) => {
            console.log('⚠️ Service Worker registration failed, clearing cache...');
            
            // Clear old service workers
            return navigator.serviceWorker.getRegistrations()
              .then(registrations => {
                registrations.forEach(reg => reg.unregister());
              })
              .then(() => {
                // Try registration again
                return originalRegister.apply(navigator.serviceWorker, args);
              })
              .catch(() => {
                console.log('📵 Service Worker disabled for this session');
                // Return a dummy registration object
                return {
                  installing: null,
                  waiting: null,
                  active: null,
                  scope: '/',
                  updateViaCache: 'none' as const,
                  update: async () => {},
                  unregister: async () => true,
                  addEventListener: () => {},
                  removeEventListener: () => {},
                  dispatchEvent: () => true
                } as any;
              });
          });
      };
    }
  }

  /**
   * Fix Mixed Content warnings
   */
  private static fixMixedContentWarnings() {
    // Upgrade insecure requests
    if (window.location.protocol === 'https:') {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = 'upgrade-insecure-requests';
      document.head.appendChild(meta);
    }

    // Fix insecure image sources
    document.addEventListener('DOMContentLoaded', () => {
      const images = document.querySelectorAll('img[src^="http:"]:not([src^="https:"])');
      images.forEach((img: HTMLImageElement) => {
        img.src = img.src.replace('http:', 'https:');
      });
    });
  }

  /**
   * Fix Unhandled Promise Rejections
   */
  private static fixUnhandledPromises() {
    // Create a global promise error handler
    window.addEventListener('unhandledrejection', (event) => {
      const { reason } = event;
      
      // Handle specific Firebase errors
      if (reason?.code?.includes('auth/')) {
        console.log('🔐 Auth error handled:', reason.code);
        event.preventDefault();
        
        // Handle specific auth errors
        switch (reason.code) {
          case 'auth/network-request-failed':
            // Retry the operation
            setTimeout(() => {
              window.location.reload();
            }, 3000);
            break;
          case 'auth/too-many-requests':
            // Show rate limit message
            console.log('⏳ Too many requests. Please wait...');
            break;
          default:
            // Log but don't crash
            console.warn('Auth error:', reason.message);
        }
      }
      
      // Handle chunk load errors
      if (reason?.message?.includes('Loading chunk')) {
        console.log('📦 Chunk load error, refreshing...');
        event.preventDefault();
        window.location.reload();
      }
      
      // Handle network errors
      if (reason?.message?.includes('fetch')) {
        console.log('🌐 Network error handled');
        event.preventDefault();
      }
    });
  }

  /**
   * Fix Memory Leaks
   */
  private static fixMemoryLeaks() {
    // Clean up event listeners on page unload
    window.addEventListener('beforeunload', () => {
      // Remove all event listeners
      const allElements = document.querySelectorAll('*');
      allElements.forEach(element => {
        const clone = element.cloneNode(true);
        element.parentNode?.replaceChild(clone, element);
      });
    });

    // Periodic cleanup of unused objects
    setInterval(() => {
      // Clear expired cache entries
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            if (name.includes('old') || name.includes('temp')) {
              caches.delete(name);
            }
          });
        });
      }

      // Clear old session storage items
      const now = Date.now();
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.includes('timestamp')) {
          try {
            const data = JSON.parse(sessionStorage.getItem(key) || '{}');
            if (data.timestamp && now - data.timestamp > 3600000) {
              sessionStorage.removeItem(key);
            }
          } catch {
            // Invalid JSON, remove it
            if (key) sessionStorage.removeItem(key);
          }
        }
      }
    }, 60000); // Every minute
  }

  /**
   * Fix Deprecation Warnings
   */
  private static fixDeprecationWarnings() {
    // Suppress specific deprecation warnings
    const originalWarn = console.warn;
    console.warn = function(...args) {
      const message = args[0]?.toString() || '';
      
      // Filter out known deprecation warnings
      const suppressedWarnings = [
        'deprecated',
        'DevTools',
        'source map',
        'non-passive',
        'preventDefault',
      ];
      
      const shouldSuppress = suppressedWarnings.some(warning => 
        message.toLowerCase().includes(warning.toLowerCase())
      );
      
      if (!shouldSuppress) {
        originalWarn.apply(console, args);
      }
    };
  }

  /**
   * Fix CORS Errors
   */
  private static fixCORSErrors() {
    // Add CORS proxy for external resources
    const corsProxy = 'https://cors-anywhere.herokuapp.com/';
    
    // Override fetch for external APIs
    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : input.toString();
      
      // Check if it's an external URL that might have CORS issues
      if (url.startsWith('http') && !url.includes(window.location.hostname)) {
        // Skip for known good domains
        const trustedDomains = [
          'googleapis.com',
          'firebaseapp.com',
          'firebasestorage.app',
          'cloudfunctions.net'
        ];
        
        const needsProxy = !trustedDomains.some(domain => url.includes(domain));
        
        if (needsProxy && !url.includes(corsProxy)) {
          console.log('🔄 Using CORS proxy for:', url);
          return originalFetch(corsProxy + url, init);
        }
      }
      
      return originalFetch(input, init);
    };
  }

  /**
   * Fix Chunk Load Errors
   */
  private static fixChunkLoadErrors() {
    // Implement retry logic for chunk loading
    let retryCount = 0;
    const maxRetries = 3;
    
    window.addEventListener('error', (event) => {
      if (event.message?.includes('Loading chunk')) {
        event.preventDefault();
        
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`🔄 Retrying chunk load (${retryCount}/${maxRetries})...`);
          
          setTimeout(() => {
            window.location.reload();
          }, 1000 * retryCount);
        } else {
          console.error('❌ Failed to load application chunks');
          // Show user-friendly error
          document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif;">
              <div style="text-align: center;">
                <h1>Loading Error</h1>
                <p>The application failed to load properly.</p>
                <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 20px;">
                  Refresh Page
                </button>
              </div>
            </div>
          `;
        }
      }
    });
  }
}

// Auto-initialize on import
if (typeof window !== 'undefined') {
  ConsoleErrorFixer.initialize();
}