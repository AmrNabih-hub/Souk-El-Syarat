// Service Worker for Egyptian Cars Marketplace
// Enhanced caching and performance optimization

const CACHE_NAME = 'souk-el-syarat-v1.2.0';
const STATIC_CACHE = 'souk-static-v1.2.0';
const DYNAMIC_CACHE = 'souk-dynamic-v1.2.0';
const IMAGE_CACHE = 'souk-images-v1.2.0';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  // Add critical CSS and JS files here
  '/assets/index.css',
  '/assets/index.js',
];

// Routes to cache dynamically
const CACHE_ROUTES = [
  '/marketplace',
  '/login',
  '/register',
  '/cart',
  '/wishlist',
  '/admin/dashboard',
  '/vendor/dashboard',
  '/customer/dashboard'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('📦 Service Worker: Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).catch((error) => {
      console.error('❌ Service Worker: Failed to cache static assets', error);
    })
  );
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activated');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== IMAGE_CACHE) {
            console.log('🗑️ Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim all clients
  return self.clients.claim();
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Skip Firebase requests (let them handle their own caching)
  if (url.hostname.includes('firebase') || url.hostname.includes('google')) {
    return fetch(request);
  }
  
  event.respondWith(
    handleRequest(request)
  );
});

// Enhanced request handling with different strategies
async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Strategy for images - Cache first, network fallback
    if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      return await handleImageRequest(request);
    }
    
    // Strategy for API calls - Network first, cache fallback
    if (url.pathname.startsWith('/api') || url.hostname.includes('firebase')) {
      return await handleApiRequest(request);
    }
    
    // Strategy for app shell - Cache first, network fallback
    if (url.pathname === '/' || CACHE_ROUTES.includes(url.pathname)) {
      return await handleAppShellRequest(request);
    }
    
    // Strategy for static assets - Cache first
    if (url.pathname.startsWith('/assets/') || 
        url.pathname.match(/\.(js|css|woff2?|ttf|eot)$/i)) {
      return await handleStaticAssetRequest(request);
    }
    
    // Default strategy - Network first, cache fallback
    return await handleDefaultRequest(request);
    
  } catch (error) {
    console.error('❌ Service Worker: Request failed', error);
    return await handleOfflineFallback(request);
  }
}

// Image handling with compression awareness
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Return cached image immediately, but fetch fresh one in background
    fetchAndCache(request, IMAGE_CACHE);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return placeholder or cached fallback
    return await handleImageFallback(request);
  }
}

// API request handling
async function handleApiRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful GET responses
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return cached version if available
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// App shell handling
async function handleAppShellRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Serve from cache, update in background
    fetchAndCache(request, STATIC_CACHE);
    return cachedResponse;
  }
  
  // If not cached, fetch and cache
  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }
  return networkResponse;
}

// Static assets handling
async function handleStaticAssetRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }
  return networkResponse;
}

// Default request handling
async function handleDefaultRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Background fetch and cache
async function fetchAndCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response);
    }
  } catch (error) {
    // Silently fail background updates
    console.log('🔄 Service Worker: Background update failed', error);
  }
}

// Offline fallbacks
async function handleOfflineFallback(request) {
  const url = new URL(request.url);
  
  // For images, return a placeholder
  if (request.destination === 'image') {
    return await handleImageFallback(request);
  }
  
  // For pages, return cached index.html or offline page
  if (request.mode === 'navigate') {
    const cache = await caches.open(STATIC_CACHE);
    const cachedIndex = await cache.match('/');
    if (cachedIndex) {
      return cachedIndex;
    }
  }
  
  // Generic offline response
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'تم فقدان الاتصال بالإنترنت',
      messageEn: 'Connection lost'
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    }
  );
}

// Image fallback
async function handleImageFallback(request) {
  // Return a simple SVG placeholder
  const svg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="#9ca3af" font-family="Arial, sans-serif" font-size="16">
        صورة غير متاحة
      </text>
    </svg>
  `;
  
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'max-age=86400'
    }
  });
}

// Message handling for cache updates
self.addEventListener('message', (event) => {
  const { data } = event;
  
  if (data.action === 'UPDATE_CACHE') {
    handleCacheUpdate(data.url, data.cacheName);
  }
  
  if (data.action === 'CLEAR_CACHE') {
    handleCacheClear(data.cacheName);
  }
  
  if (data.action === 'GET_CACHE_INFO') {
    handleCacheInfo(event);
  }
});

// Cache management functions
async function handleCacheUpdate(url, cacheName = DYNAMIC_CACHE) {
  try {
    const cache = await caches.open(cacheName);
    const response = await fetch(url);
    if (response.ok) {
      await cache.put(url, response);
      console.log('✅ Cache updated:', url);
    }
  } catch (error) {
    console.error('❌ Cache update failed:', error);
  }
}

async function handleCacheClear(cacheName) {
  try {
    await caches.delete(cacheName);
    console.log('✅ Cache cleared:', cacheName);
  } catch (error) {
    console.error('❌ Cache clear failed:', error);
  }
}

async function handleCacheInfo(event) {
  try {
    const cacheNames = await caches.keys();
    const cacheInfo = {};
    
    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      cacheInfo[name] = keys.length;
    }
    
    event.ports[0].postMessage({
      type: 'CACHE_INFO_RESPONSE',
      data: cacheInfo
    });
  } catch (error) {
    console.error('❌ Cache info failed:', error);
  }
}

// Performance monitoring
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Handle notification clicks for performance updates
  if (event.notification.tag === 'update-available') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('🚀 Service Worker: Egyptian Cars Marketplace SW loaded successfully');