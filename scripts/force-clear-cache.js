// FORCE CLEAR CACHE SCRIPT
// Add this to the main index.html or run in browser console

(function() {
  console.log('🧹 Starting complete cache clear...');
  
  // 1. Clear all caches
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
        console.log(`Deleted cache: ${name}`);
      });
    });
  }
  
  // 2. Unregister all service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
        console.log('Unregistered service worker');
      });
    });
  }
  
  // 3. Clear local storage
  localStorage.clear();
  console.log('Cleared localStorage');
  
  // 4. Clear session storage
  sessionStorage.clear();
  console.log('Cleared sessionStorage');
  
  // 5. Clear IndexedDB (Firebase data)
  const databases = ['firebaseLocalStorageDb', 'firestore', 'firebase-heartbeat-database', 'firebase-installations-database'];
  databases.forEach(db => {
    indexedDB.deleteDatabase(db).then(() => {
      console.log(`Deleted IndexedDB: ${db}`);
    });
  });
  
  // 6. Force reload without cache
  setTimeout(() => {
    console.log('Reloading page without cache...');
    window.location.reload(true);
  }, 2000);
})();