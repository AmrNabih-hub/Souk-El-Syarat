/**
 * Service Worker Registration
 * PWA functionality for offline support and caching
 */

import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    // Show update notification
    if (confirm('New version available! Reload to update?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline');
    // Show notification that app is ready for offline use
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Souk El-Sayarat', {
        body: 'App is ready for offline use!',
        icon: '/icon-192x192.png',
      });
    }
  },
  onRegistered(registration) {
    console.log('Service Worker registered:', registration);
  },
  onRegisterError(error) {
    console.error('Service Worker registration error:', error);
  },
});

// Export for manual updates
export { updateSW };
