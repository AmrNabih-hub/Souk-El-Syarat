/**
 * Service Worker for Souk El-Sayarat
 * Implements advanced caching strategies and offline support
 */

const CACHE_VERSION = 'v2.4.0'; // Updated for visual fixes
const CACHE_NAMES = {
  STATIC: `static-${CACHE_VERSION}`,
  DYNAMIC: `dynamic-${CACHE_VERSION}`,
  IMAGES: `images-${CACHE_VERSION}`,
  API: `api-${CACHE_VERSION}`,
};

// Cache durations (in seconds) for performance optimization
const CACHE_DURATIONS = {
  STATIC: 60 * 60 * 24 * 30,  // 30 days
  IMAGES: 60 * 60 * 24 * 7,   // 7 days
  API: 60 * 5,               // 5 minutes
  DYNAMIC: 60 * 15            // 15 minutes
};

// Assets to cache on install - Only cache existing assets
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/images/hero-bg.jpg', // FIXED - now exists
  '/images/logo.png',    // FIXED - now exists
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first, falling back to network
  cacheFirst: async (request, cacheName) => {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Update cache in background
      fetch(request).then(response => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
      });
      return cachedResponse;
    }
    
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      console.error('Cache first strategy failed:', error);
      throw error;
    }
  },

  // Network first, falling back to cache
  networkFirst: async (request, cacheName) => {
    const cache = await caches.open(cacheName);

    try {
      const networkResponse = await fetch(request);

      // Clone the response before caching to avoid stream consumption
      if (networkResponse.ok && networkResponse.status !== 206) {
        const responseClone = networkResponse.clone();

        // Add security headers to cached responses
        const headers = new Headers(responseClone.headers);
        headers.set('X-Content-Type-Options', 'nosniff');
        headers.set('X-Frame-Options', 'DENY');
        headers.set('Cache-Control', `max-age=${CACHE_DURATIONS[cacheName.split('-')[0].toUpperCase()] || 300}`);

        const secureResponse = new Response(responseClone.body, {
          status: responseClone.status,
          statusText: responseClone.statusText,
          headers: headers
        });

        cache.put(request, secureResponse).catch(err => {
          console.warn('Failed to cache response:', err);
        });
      }

      return networkResponse;
    } catch (error) {
      console.warn('Network request failed:', error);
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      throw error;
    }
  },

  // Stale while revalidate
  staleWhileRevalidate: async (request, cacheName) => {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    const fetchPromise = fetch(request).then(response => {
      // Clone the response before caching to avoid stream consumption
      if (response.ok && response.status !== 206) {
        const responseClone = response.clone();
        cache.put(request, responseClone).catch(err => {
          console.warn('Failed to cache response:', err);
        });
      }
      return response;
    });
    
    return cachedResponse || fetchPromise;
  },

  // Network only
  networkOnly: async (request) => {
    return fetch(request);
  },
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAMES.STATIC).then((cache) => {
      console.log('Service Worker: Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      console.log('Service Worker: Installation complete');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return !Object.values(CACHE_NAMES).includes(cacheName);
          })
          .map((cacheName) => {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('Service Worker: Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // API requests - Network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      CACHE_STRATEGIES.networkFirst(request, CACHE_NAMES.API)
        .catch(() => {
          // Return cached response or error message
          return new Response(
            JSON.stringify({ error: 'Offline - cached data may be shown' }),
            {
              headers: { 'Content-Type': 'application/json' },
              status: 503,
            }
          );
        })
    );
    return;
  }

  // Image requests - Cache first with graceful fallback
  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
    event.respondWith(
      CACHE_STRATEGIES.cacheFirst(request, CACHE_NAMES.IMAGES)
        .catch(() => {
          // FIXED: Don't return placeholder for missing images, let them fail gracefully
          console.warn(`Service Worker: Image not found: ${request.url}`);
          return new Response('', { status: 404, statusText: 'Image not found' });
        })
    );
    return;
  }

  // Static assets (JS, CSS) - Cache first
  if (url.pathname.match(/\.(js|css|woff2?)$/)) {
    event.respondWith(
      CACHE_STRATEGIES.cacheFirst(request, CACHE_NAMES.STATIC)
    );
    return;
  }

  // HTML pages - Stale while revalidate
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      CACHE_STRATEGIES.staleWhileRevalidate(request, CACHE_NAMES.DYNAMIC)
        .catch(() => {
          // Return offline page
          return caches.match('/offline.html');
        })
    );
    return;
  }

  // Default - Stale while revalidate
  event.respondWith(
    CACHE_STRATEGIES.staleWhileRevalidate(request, CACHE_NAMES.DYNAMIC)
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart());
  } else if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from Souk El-Sayarat',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/images/checkmark.png',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/images/xmark.png',
      },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification('Souk El-Sayarat', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/marketplace')
    );
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper functions for background sync
async function syncCart() {
  try {
    const cache = await caches.open(CACHE_NAMES.API);
    const requests = await cache.keys();
    const cartRequests = requests.filter(req => req.url.includes('/api/cart'));
    
    for (const request of cartRequests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.delete(request);
        }
      } catch (error) {
        console.error('Failed to sync cart item:', error);
      }
    }
  } catch (error) {
    console.error('Cart sync failed:', error);
  }
}

async function syncFavorites() {
  try {
    const cache = await caches.open(CACHE_NAMES.API);
    const requests = await cache.keys();
    const favoriteRequests = requests.filter(req => req.url.includes('/api/favorites'));
    
    for (const request of favoriteRequests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.delete(request);
        }
      } catch (error) {
        console.error('Failed to sync favorite:', error);
      }
    }
  } catch (error) {
    console.error('Favorites sync failed:', error);
  }
}

// Periodic background sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-prices') {
    event.waitUntil(updatePrices());
  }
});

async function updatePrices() {
  try {
    const response = await fetch('/api/products/prices');
    if (response.ok) {
      const cache = await caches.open(CACHE_NAMES.API);
      await cache.put('/api/products/prices', response);
    }
  } catch (error) {
    console.error('Price update failed:', error);
  }
}
