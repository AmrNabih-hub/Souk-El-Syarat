const admin = require('firebase-admin');
const { Firestore } = require('@google-cloud/firestore');
const { Storage } = require('@google-cloud/storage');
const winston = require('winston');

// Database logger
const dbLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/database.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

class DatabaseManager {
  constructor() {
    this.db = null;
    this.auth = null;
    this.storage = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      if (this.initialized) {
        return this.getConnections();
      }

      // Skip Firebase initialization for testing if no credentials
      if (process.env.NODE_ENV === 'test' || process.env.SKIP_FIREBASE === 'true') {
        dbLogger.warn('Skipping Firebase initialization for testing');
        this.db = this.createMockFirestore();
        this.auth = this.createMockAuth();
        this.storage = this.createMockStorage();
        this.initialized = true;
        return this.getConnections();
      }

      // Initialize Firebase Admin
      let serviceAccount;
      try {
        serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
          ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
          : require('./firebase-service-account.json');
      } catch (error) {
        dbLogger.error('Failed to load Firebase service account', { error: error.message });
        dbLogger.info('Starting in mock mode for development');
        this.db = this.createMockFirestore();
        this.auth = this.createMockAuth();
        this.storage = this.createMockStorage();
        this.initialized = true;
        return this.getConnections();
      }

      // Initialize Firebase Admin SDK
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
        storageBucket: `${serviceAccount.project_id}.appspot.com`
      });

      this.db = admin.firestore();
      this.auth = admin.auth();
      this.storage = admin.storage();

      // Configure Firestore settings
      this.db.settings({
        ignoreUndefinedProperties: true,
        timestampsInSnapshots: true
      });

      // Test connections
      await this.testConnections();

      this.initialized = true;
      dbLogger.info('Database connections initialized successfully');

      return this.getConnections();
    } catch (error) {
      dbLogger.error('Database initialization failed', { error: error.message });
      // Fallback to mock services for development
      this.db = this.createMockFirestore();
      this.auth = this.createMockAuth();
      this.storage = this.createMockStorage();
      this.initialized = true;
      return this.getConnections();
    }
  }

  createMockFirestore() {
    return {
      collection: (name) => ({
        doc: (id) => ({
          get: async () => ({ exists: false }),
          set: async (data) => ({ writeTime: Date.now() }),
          update: async (data) => ({ writeTime: Date.now() }),
          delete: async () => ({ writeTime: Date.now() })
        }),
        get: async () => ({ empty: true, docs: [] }),
        add: async (data) => ({ id: 'mock-id-' + Date.now() }),
        where: () => ({ get: async () => ({ empty: true, docs: [] }) }),
        limit: () => ({ get: async () => ({ empty: true, docs: [] }) })
      }),
      settings: () => {},
      batch: () => ({ commit: async () => ({ writeTime: Date.now() }) }),
      runTransaction: async (fn) => fn({})
    };
  }

  createMockAuth() {
    return {
      createUser: async (user) => ({ uid: 'mock-user-' + Date.now(), ...user }),
      getUser: async (uid) => ({ uid, email: 'mock@example.com' }),
      updateUser: async (uid, data) => ({ uid, ...data }),
      deleteUser: async (uid) => ({}),
      createCustomToken: async (uid) => 'mock-token-' + Date.now(),
      verifyIdToken: async (token) => ({ uid: 'mock-user', email: 'mock@example.com' }),
      listUsers: async (maxResults) => ({ users: [] })
    };
  }

  createMockStorage() {
    return {
      bucket: () => ({
        file: (filename) => ({
          save: async (data) => ({}),
          get: async () => ([{ name: filename }]),
          delete: async () => ({}),
          getSignedUrl: async (config) => ['https://mock-storage-url.com/' + filename]
        }),
        getFiles: async (options) => ([[]]),
        upload: async (filePath, options) => ({ name: 'mock-upload-' + Date.now() })
      })
    };
  }

  async testConnections() {
    try {
      // Skip tests for mock services
      if (this.isMockService()) {
        dbLogger.info('Mock database services initialized successfully');
        return;
      }

      // Test Firestore
      await this.db.collection('_test').doc('connection').set({
        test: true,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      // Test Authentication
      await this.auth.listUsers(1);

      // Test Storage
      await this.storage.bucket().getFiles({ maxResults: 1 });

      dbLogger.info('All database connections tested successfully');
    } catch (error) {
      dbLogger.error('Database connection test failed', { error: error.message });
      throw error;
    }
  }

  isMockService() {
    return process.env.NODE_ENV === 'test' || 
           process.env.SKIP_FIREBASE === 'true' ||
           this.db?.collection?.('_test') === undefined;
  }

  getConnections() {
    if (!this.initialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return {
      db: this.db,
      auth: this.auth,
      storage: this.storage,
      admin
    };
  }

  // Health check
  async healthCheck() {
    try {
      const health = {
        firestore: false,
        auth: false,
        storage: false,
        timestamp: new Date().toISOString()
      };

      // Check Firestore
      try {
        await this.db.collection('_health').doc('check').get();
        health.firestore = true;
      } catch (error) {
        dbLogger.warn('Firestore health check failed', { error: error.message });
      }

      // Check Auth
      try {
        await this.auth.listUsers(1);
        health.auth = true;
      } catch (error) {
        dbLogger.warn('Auth health check failed', { error: error.message });
      }

      // Check Storage
      try {
        await this.storage.bucket().getFiles({ maxResults: 1 });
        health.storage = true;
      } catch (error) {
        dbLogger.warn('Storage health check failed', { error: error.message });
      }

      health.allHealthy = health.firestore && health.auth && health.storage;
      return health;
    } catch (error) {
      dbLogger.error('Health check failed', { error: error.message });
      throw error;
    }
  }

  // Error handling wrapper
  async safeOperation(operation, context = {}) {
    try {
      return await operation();
    } catch (error) {
      dbLogger.error('Database operation failed', {
        error: error.message,
        context,
        stack: error.stack
      });
      throw error;
    }
  }
}

// Collection references with error handling
class Collections {
  constructor(db) {
    this.db = db;
  }

  users() {
    return this.db.collection('users');
  }

  vehicles() {
    return this.db.collection('vehicles');
  }

  orders() {
    return this.db.collection('orders');
  }

  messages() {
    return this.db.collection('messages');
  }

  reviews() {
    return this.db.collection('reviews');
  }

  categories() {
    return this.db.collection('categories');
  }

  // Batch operations
  async batch() {
    return this.db.batch();
  }

  // Transaction support
  async runTransaction(updateFunction) {
    return this.db.runTransaction(updateFunction);
  }
}

// Singleton instance
const dbManager = new DatabaseManager();

module.exports = {
  DatabaseManager,
  Collections,
  dbManager
};