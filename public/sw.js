/**
 * Service Worker for Souk El-Syarat PWA
 * Offline-first caching strategy for automotive marketplace
 */

const CACHE_NAME = 'souk-el-syarat-v1.0.0';
const STATIC_CACHE = 'souk-static-v1';
const DYNAMIC_CACHE = 'souk-dynamic-v1';
const IMAGE_CACHE = 'souk-images-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/app-icon.svg',
  '/offline.html',
  // Add critical CSS and JS files here
];

// Image domains to cache
const IMAGE_DOMAINS = [
  'images.unsplash.com',
  'firebasestorage.googleapis.com',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Cache failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== IMAGE_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
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
    return;
  }

  // Skip Chrome extensions and other protocols
  if (!request.url.startsWith('http')) {
    return;
  }

  // Handle different types of requests
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
  } else if (request.url.includes('/api/') || request.url.includes('firestore.googleapis.com')) {
    event.respondWith(handleApiRequest(request));
  } else if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
  } else {
    event.respondWith(handleStaticRequest(request));
  }
});

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Only cache images from allowed domains
      const url = new URL(request.url);
      if (IMAGE_DOMAINS.some(domain => url.hostname.includes(domain))) {
        cache.put(request, response.clone());
      }
    }
    return response;
  } catch (error) {
    console.log('Service Worker: Image fetch failed', error);
    // Return a placeholder image if available
    return cache.match('/images/placeholder.jpg') || 
           new Response('', { status: 404 });
  }
}

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('Service Worker: API fetch failed, trying cache', error);
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response(
      JSON.stringify({ error: 'Offline', cached: false }), 
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle navigation requests with cache-first strategy
async function handleNavigationRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('Service Worker: Navigation fetch failed', error);
    // Return offline page
    return cache.match('/offline.html') || 
           cache.match('/') ||
           new Response('Offline', { status: 503 });
  }
}

// Handle static asset requests
async function handleStaticRequest(request) {
  const staticCache = await caches.open(STATIC_CACHE);
  const dynamicCache = await caches.open(DYNAMIC_CACHE);
  
  // Try static cache first
  let cachedResponse = await staticCache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Try dynamic cache
  cachedResponse = await dynamicCache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Fetch from network
  try {
    const response = await fetch(request);
    if (response.ok) {
      dynamicCache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('Service Worker: Static fetch failed', error);
    return new Response('Offline', { status: 503 });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'cart-sync') {
    event.waitUntil(syncCartData());
  } else if (event.tag === 'favorites-sync') {
    event.waitUntil(syncFavoritesData());
  }
});

// Sync cart data when online
async function syncCartData() {
  try {
    // Implement cart synchronization logic
    console.log('Service Worker: Syncing cart data');
    // This would typically sync with your backend
  } catch (error) {
    console.error('Service Worker: Cart sync failed', error);
  }
}

// Sync favorites data when online
async function syncFavoritesData() {
  try {
    // Implement favorites synchronization logic
    console.log('Service Worker: Syncing favorites data');
    // This would typically sync with your backend
  } catch (error) {
    console.error('Service Worker: Favorites sync failed', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/app-icon.svg',
    badge: '/app-icon.svg',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Souk El-Syarat', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
