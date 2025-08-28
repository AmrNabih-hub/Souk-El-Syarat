/**
 * 🔐 FIREBASE SECURITY RULES CONFIGURATION
 * Comprehensive security rules for all Firebase services
 */

export const firestoreRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isVendor() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'vendor';
    }
    
    function isValidEmail(email) {
      return email.matches('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
    }
    
    function isValidPhone(phone) {
      return phone.matches('^\\+?[1-9]\\d{1,14}$');
    }
    
    function hasRequiredFields(fields) {
      return request.resource.data.keys().hasAll(fields);
    }
    
    function isValidProduct() {
      return hasRequiredFields(['title', 'price', 'category', 'vendorId']) &&
        request.resource.data.price > 0 &&
        request.resource.data.title.size() > 0 &&
        request.resource.data.title.size() <= 200;
    }
    
    function isValidOrder() {
      return hasRequiredFields(['userId', 'items', 'totalAmount', 'status']) &&
        request.resource.data.totalAmount > 0 &&
        request.resource.data.items.size() > 0;
    }
    
    function rateLimit() {
      return request.time > resource.data.lastUpdate + duration.value(1, 's');
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow create: if isAuthenticated() && 
        isOwner(userId) &&
        hasRequiredFields(['email', 'displayName', 'role']) &&
        isValidEmail(request.resource.data.email);
      allow update: if isOwner(userId) && rateLimit();
      allow delete: if isAdmin();
    }
    
    // Products collection
    match /products/{productId} {
      allow read: if true; // Public read
      allow create: if isVendor() && isValidProduct();
      allow update: if isVendor() && 
        resource.data.vendorId == request.auth.uid &&
        isValidProduct() &&
        rateLimit();
      allow delete: if isAdmin() || 
        (isVendor() && resource.data.vendorId == request.auth.uid);
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read: if isOwner(resource.data.userId) || 
        isVendor() && resource.data.vendorId == request.auth.uid ||
        isAdmin();
      allow create: if isAuthenticated() && 
        isOwner(request.resource.data.userId) &&
        isValidOrder();
      allow update: if isOwner(resource.data.userId) && 
        request.resource.data.status in ['cancelled'] ||
        isVendor() && resource.data.vendorId == request.auth.uid ||
        isAdmin();
      allow delete: if isAdmin();
    }
    
    // Cart collection
    match /carts/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // Wishlist collection
    match /wishlists/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // Reviews collection
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if isAuthenticated() &&
        isOwner(request.resource.data.userId) &&
        hasRequiredFields(['productId', 'rating', 'comment']) &&
        request.resource.data.rating >= 1 &&
        request.resource.data.rating <= 5;
      allow update: if isOwner(resource.data.userId);
      allow delete: if isOwner(resource.data.userId) || isAdmin();
    }
    
    // Messages collection
    match /messages/{messageId} {
      allow read: if isOwner(resource.data.senderId) || 
        isOwner(resource.data.receiverId);
      allow create: if isAuthenticated() &&
        isOwner(request.resource.data.senderId);
      allow update: if false; // Messages are immutable
      allow delete: if isAdmin();
    }
    
    // Security logs (admin only)
    match /securityLogs/{logId} {
      allow read: if isAdmin();
      allow write: if false; // Only server-side writes
    }
    
    // Sessions collection
    match /sessions/{sessionId} {
      allow read: if isAdmin() || 
        sessionId.matches('.*_' + request.auth.uid + '_.*');
      allow write: if false; // Only server-side writes
    }
    
    // Admin alerts
    match /adminAlerts/{alertId} {
      allow read: if isAdmin();
      allow write: if false; // Only server-side writes
    }
    
    // Vendor applications
    match /vendorApplications/{applicationId} {
      allow read: if isOwner(resource.data.userId) || isAdmin();
      allow create: if isAuthenticated() &&
        isOwner(request.resource.data.userId);
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
    
    // Notifications
    match /notifications/{userId}/userNotifications/{notificationId} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId) || isAdmin();
    }
    
    // Analytics (read-only for vendors/admin)
    match /analytics/{document=**} {
      allow read: if isVendor() || isAdmin();
      allow write: if false;
    }
  }
}
`;

export const realtimeDatabaseRules = `
{
  "rules": {
    // User presence
    "presence": {
      "$uid": {
        ".read": true,
        ".write": "$uid === auth.uid"
      }
    },
    
    // Chat messages
    "chats": {
      "$chatId": {
        ".read": "auth != null && (root.child('chats').child($chatId).child('participants').child(auth.uid).exists())",
        ".write": "auth != null && (root.child('chats').child($chatId).child('participants').child(auth.uid).exists())",
        
        "messages": {
          "$messageId": {
            ".validate": "newData.hasChildren(['text', 'senderId', 'timestamp']) && newData.child('senderId').val() === auth.uid"
          }
        }
      }
    },
    
    // Real-time notifications
    "notifications": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "auth != null && ($uid === auth.uid || root.child('users').child(auth.uid).child('role').val() === 'admin')"
      }
    },
    
    // Live order tracking
    "orderTracking": {
      "$orderId": {
        ".read": "auth != null && (root.child('orders').child($orderId).child('userId').val() === auth.uid || root.child('orders').child($orderId).child('vendorId').val() === auth.uid)",
        ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'vendor'"
      }
    },
    
    // Inventory updates
    "inventory": {
      "$productId": {
        ".read": true,
        ".write": "auth != null && root.child('products').child($productId).child('vendorId').val() === auth.uid"
      }
    },
    
    // Analytics data
    "analytics": {
      ".read": "auth != null && (root.child('users').child(auth.uid).child('role').val() === 'vendor' || root.child('users').child(auth.uid).child('role').val() === 'admin')",
      ".write": false
    },
    
    // Rate limiting
    "rateLimits": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid",
        ".validate": "newData.child('count').val() <= 100 && newData.child('timestamp').val() <= now"
      }
    }
  }
}
`;

export const storageRules = `
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isValidImage() {
      return request.resource.contentType.matches('image/.*') &&
        request.resource.size < 5 * 1024 * 1024; // 5MB max
    }
    
    function isValidDocument() {
      return request.resource.contentType.matches('application/pdf') &&
        request.resource.size < 10 * 1024 * 1024; // 10MB max
    }
    
    // User profile images
    match /users/{userId}/profile/{fileName} {
      allow read: if true;
      allow write: if isOwner(userId) && isValidImage();
      allow delete: if isOwner(userId);
    }
    
    // Product images
    match /products/{productId}/{fileName} {
      allow read: if true;
      allow write: if isAuthenticated() && isValidImage();
      allow delete: if isAuthenticated();
    }
    
    // Vendor documents
    match /vendors/{vendorId}/documents/{fileName} {
      allow read: if isOwner(vendorId) || 
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow write: if isOwner(vendorId) && isValidDocument();
      allow delete: if isOwner(vendorId);
    }
    
    // Order attachments
    match /orders/{orderId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && 
        (isValidImage() || isValidDocument());
      allow delete: if false;
    }
    
    // Chat attachments
    match /chats/{chatId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isValidImage();
      allow delete: if false;
    }
    
    // Public assets
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if false;
    }
    
    // Admin uploads
    match /admin/{allPaths=**} {
      allow read: if true;
      allow write: if firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
`;