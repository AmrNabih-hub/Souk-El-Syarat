/**
 * Firebase Messaging Service Worker for Souk El-Sayarat
 * Handles background push notifications
 */

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAdkK2OlebHPUsWFCEqY5sWHs5ZL3wUk0Q",
  authDomain: "souk-el-syarat.firebaseapp.com",
  projectId: "souk-el-syarat",
  storageBucket: "souk-el-syarat.firebasestorage.app",
  messagingSenderId: "505765285633",
  appId: "1:505765285633:web:1bc55f947c68b46d75d500",
  measurementId: "G-46RKPHQLVB"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const { notification, data } = payload;
  
  // Customize notification options
  const notificationTitle = notification?.title || 'Souk El-Sayarat';
  const notificationOptions = {
    body: notification?.body || 'لديك إشعار جديد',
    icon: notification?.icon || '/icon-192x192.png',
    badge: '/icon-72x72.png',
    image: notification?.image,
    data: data || {},
    tag: data?.type || 'general',
    renotify: true,
    requireInteraction: data?.priority === 'high',
    actions: getNotificationActions(data?.type),
    timestamp: Date.now(),
    vibrate: [200, 100, 200],
  };

  // Show notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received:', event);

  event.notification.close();

  const { action, data } = event;
  const notificationData = event.notification.data || data || {};

  // Handle different actions
  let url = '/';
  
  if (action) {
    url = handleNotificationAction(action, notificationData);
  } else {
    // Default click action based on notification type
    url = getDefaultUrl(notificationData);
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            url,
            data: notificationData,
          });
          return;
        }
      }
      
      // Open new window if app is not open
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Get notification actions based on type
function getNotificationActions(type) {
  switch (type) {
    case 'order':
      return [
        {
          action: 'view_order',
          title: 'عرض الطلب',
          icon: '/icons/view.png'
        },
        {
          action: 'dismiss',
          title: 'إغلاق',
          icon: '/icons/close.png'
        }
      ];
    
    case 'message':
      return [
        {
          action: 'view_message',
          title: 'عرض الرسالة',
          icon: '/icons/message.png'
        },
        {
          action: 'reply',
          title: 'رد سريع',
          icon: '/icons/reply.png'
        },
        {
          action: 'dismiss',
          title: 'إغلاق',
          icon: '/icons/close.png'
        }
      ];
    
    case 'product_approval':
      return [
        {
          action: 'view_product',
          title: 'عرض المنتج',
          icon: '/icons/product.png'
        }
      ];
    
    default:
      return [
        {
          action: 'dismiss',
          title: 'إغلاق',
          icon: '/icons/close.png'
        }
      ];
  }
}

// Handle notification actions
function handleNotificationAction(action, data) {
  switch (action) {
    case 'view_order':
      return `/orders/${data.orderId || ''}`;
    
    case 'view_message':
      return `/messages/${data.senderId || ''}`;
    
    case 'view_product':
      return `/products/${data.productId || ''}`;
    
    case 'reply':
      return `/messages/${data.senderId || ''}?reply=true`;
    
    case 'dismiss':
    default:
      return '/';
  }
}

// Get default URL based on notification data
function getDefaultUrl(data) {
  const { type, orderId, productId, senderId } = data;
  
  switch (type) {
    case 'order':
    case 'order_update':
      return orderId ? `/orders/${orderId}` : '/orders';
    
    case 'message':
      return senderId ? `/messages/${senderId}` : '/messages';
    
    case 'product_approval':
      return productId ? `/products/${productId}` : '/vendor/products';
    
    case 'vendor_application':
      return '/vendor/application';
    
    case 'system':
    default:
      return '/';
  }
}

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw.js] Notification closed:', event);
  
  // Track notification close analytics
  const data = event.notification.data || {};
  
  // Send analytics event (if needed)
  if (data.trackClose) {
    // You can send analytics data here
    console.log('Tracking notification close:', data);
  }
});

// Cache notification data for offline access
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_NOTIFICATION') {
    // Cache notification data in IndexedDB or localStorage
    console.log('Caching notification data:', event.data);
  }
});

// Handle push event (alternative to onBackgroundMessage)
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push event received:', event);
  
  if (!event.data) {
    console.log('Push event has no data');
    return;
  }
  
  try {
    const payload = event.data.json();
    const { notification, data } = payload;
    
    if (notification) {
      const notificationTitle = notification.title || 'Souk El-Sayarat';
      const notificationOptions = {
        body: notification.body || 'لديك إشعار جديد',
        icon: notification.icon || '/icon-192x192.png',
        badge: '/icon-72x72.png',
        image: notification.image,
        data: data || {},
        tag: data?.type || 'general',
        renotify: true,
        requireInteraction: data?.priority === 'high',
        actions: getNotificationActions(data?.type),
        timestamp: Date.now(),
        vibrate: [200, 100, 200],
      };
      
      event.waitUntil(
        self.registration.showNotification(notificationTitle, notificationOptions)
      );
    }
  } catch (error) {
    console.error('Error handling push event:', error);
  }
});

// Service Worker activation
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activated');
  
  // Clear old caches if needed
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('notifications-') && cacheName !== 'notifications-v1') {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Service Worker installation
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installed');
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Handle sync events for offline notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'notification-sync') {
    console.log('[firebase-messaging-sw.js] Syncing notifications');
    
    event.waitUntil(
      // Sync offline notifications when connection is restored
      syncOfflineNotifications()
    );
  }
});

// Sync offline notifications
async function syncOfflineNotifications() {
  try {
    // Get cached notifications from IndexedDB
    // Send them when connection is restored
    console.log('Syncing offline notifications...');
    
    // Implementation would depend on your offline storage strategy
    // This is a placeholder for the actual sync logic
  } catch (error) {
    console.error('Error syncing offline notifications:', error);
  }
}

// Error handling
self.addEventListener('error', (event) => {
  console.error('[firebase-messaging-sw.js] Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[firebase-messaging-sw.js] Unhandled promise rejection:', event.reason);
});
