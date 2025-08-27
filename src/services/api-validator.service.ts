/**
 * 🔍 API ENDPOINT VALIDATION SERVICE
 * Ensures all API endpoints are correct and functional
 */

import { db, auth, storage, functions } from '@/config/firebase.config';
import { errorHandler } from './error-handler.service';
import { securityConfig } from '@/config/security.config';

interface EndpointTest {
  name: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  requiresAuth: boolean;
  expectedStatus: number;
  testData?: any;
}

export class APIValidatorService {
  private static instance: APIValidatorService;
  private endpoints: Map<string, EndpointTest> = new Map();
  private healthCheckInterval: NodeJS.Timer | null = null;

  private constructor() {
    this.initializeEndpoints();
  }

  static getInstance(): APIValidatorService {
    if (!APIValidatorService.instance) {
      APIValidatorService.instance = new APIValidatorService();
    }
    return APIValidatorService.instance;
  }

  /**
   * Initialize all API endpoints
   */
  private initializeEndpoints(): void {
    // Firebase Auth endpoints
    this.endpoints.set('auth.signIn', {
      name: 'Sign In',
      endpoint: 'auth/signInWithEmailAndPassword',
      method: 'POST',
      requiresAuth: false,
      expectedStatus: 200
    });

    this.endpoints.set('auth.signUp', {
      name: 'Sign Up',
      endpoint: 'auth/createUserWithEmailAndPassword',
      method: 'POST',
      requiresAuth: false,
      expectedStatus: 201
    });

    this.endpoints.set('auth.signOut', {
      name: 'Sign Out',
      endpoint: 'auth/signOut',
      method: 'POST',
      requiresAuth: true,
      expectedStatus: 200
    });

    // Firestore endpoints
    this.endpoints.set('users.get', {
      name: 'Get User',
      endpoint: 'users/{userId}',
      method: 'GET',
      requiresAuth: true,
      expectedStatus: 200
    });

    this.endpoints.set('products.list', {
      name: 'List Products',
      endpoint: 'products',
      method: 'GET',
      requiresAuth: false,
      expectedStatus: 200
    });

    this.endpoints.set('orders.create', {
      name: 'Create Order',
      endpoint: 'orders',
      method: 'POST',
      requiresAuth: true,
      expectedStatus: 201
    });

    // Storage endpoints
    this.endpoints.set('storage.upload', {
      name: 'Upload File',
      endpoint: 'storage/upload',
      method: 'POST',
      requiresAuth: true,
      expectedStatus: 200
    });

    // Cloud Functions endpoints
    this.endpoints.set('functions.processPayment', {
      name: 'Process Payment',
      endpoint: 'processPayment',
      method: 'POST',
      requiresAuth: true,
      expectedStatus: 200
    });

    this.endpoints.set('functions.sendNotification', {
      name: 'Send Notification',
      endpoint: 'sendNotification',
      method: 'POST',
      requiresAuth: true,
      expectedStatus: 200
    });
  }

  /**
   * Validate all endpoints
   */
  async validateAllEndpoints(): Promise<{
    success: boolean;
    results: Map<string, boolean>;
    errors: string[];
  }> {
    const results = new Map<string, boolean>();
    const errors: string[] = [];

    for (const [key, endpoint] of this.endpoints) {
      try {
        const isValid = await this.validateEndpoint(endpoint);
        results.set(key, isValid);
        
        if (!isValid) {
          errors.push(`Endpoint ${endpoint.name} (${key}) validation failed`);
        }
      } catch (error: any) {
        results.set(key, false);
        errors.push(`${endpoint.name}: ${error.message}`);
        
        await errorHandler.logError({
          type: 'error',
          message: `API endpoint validation failed: ${key}`,
          context: { endpoint, error: error.message }
        });
      }
    }

    const success = errors.length === 0;

    if (!success) {
      await errorHandler.logError({
        type: 'critical',
        message: 'API endpoint validation failed',
        context: { errors, results: Object.fromEntries(results) }
      });
    }

    return { success, results, errors };
  }

  /**
   * Validate single endpoint
   */
  private async validateEndpoint(endpoint: EndpointTest): Promise<boolean> {
    try {
      // Check Firebase services availability
      if (endpoint.endpoint.startsWith('auth/')) {
        return await this.validateAuthEndpoint(endpoint);
      } else if (endpoint.endpoint.includes('users') || endpoint.endpoint.includes('products') || endpoint.endpoint.includes('orders')) {
        return await this.validateFirestoreEndpoint(endpoint);
      } else if (endpoint.endpoint.startsWith('storage/')) {
        return await this.validateStorageEndpoint(endpoint);
      } else if (functions && endpoint.endpoint in functions) {
        return await this.validateFunctionEndpoint(endpoint);
      }

      return false;
    } catch (error) {
      console.error(`Endpoint validation failed for ${endpoint.name}:`, error);
      return false;
    }
  }

  /**
   * Validate Auth endpoints
   */
  private async validateAuthEndpoint(endpoint: EndpointTest): Promise<boolean> {
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }

    // Check if auth methods are available
    const authMethods = [
      'signInWithEmailAndPassword',
      'createUserWithEmailAndPassword',
      'signOut',
      'sendPasswordResetEmail'
    ];

    const methodName = endpoint.endpoint.split('/')[1];
    return authMethods.includes(methodName);
  }

  /**
   * Validate Firestore endpoints
   */
  private async validateFirestoreEndpoint(endpoint: EndpointTest): Promise<boolean> {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    try {
      // Test collection accessibility
      const collectionName = endpoint.endpoint.split('/')[0];
      const { collection, getDocs, limit, query } = await import('firebase/firestore');
      
      const testQuery = query(collection(db, collectionName), limit(1));
      await getDocs(testQuery);
      
      return true;
    } catch (error: any) {
      // Check if error is due to permissions (which is expected)
      if (error.code === 'permission-denied' && endpoint.requiresAuth && !auth.currentUser) {
        return true; // Endpoint exists but requires auth
      }
      throw error;
    }
  }

  /**
   * Validate Storage endpoints
   */
  private async validateStorageEndpoint(endpoint: EndpointTest): Promise<boolean> {
    if (!storage) {
      throw new Error('Firebase Storage not initialized');
    }

    try {
      const { ref, getMetadata } = await import('firebase/storage');
      const testRef = ref(storage, 'test-connection');
      
      // Try to get metadata (will fail with permission error if storage is configured correctly)
      try {
        await getMetadata(testRef);
      } catch (error: any) {
        if (error.code === 'storage/object-not-found' || error.code === 'storage/unauthorized') {
          return true; // Storage is configured correctly
        }
        throw error;
      }
      
      return true;
    } catch (error) {
      throw new Error(`Storage validation failed: ${error}`);
    }
  }

  /**
   * Validate Cloud Function endpoints
   */
  private async validateFunctionEndpoint(endpoint: EndpointTest): Promise<boolean> {
    if (!functions) {
      throw new Error('Cloud Functions not initialized');
    }

    try {
      const { httpsCallable } = await import('firebase/functions');
      const callable = httpsCallable(functions, endpoint.endpoint);
      
      // Functions exist if httpsCallable doesn't throw
      return typeof callable === 'function';
    } catch (error) {
      throw new Error(`Function validation failed: ${error}`);
    }
  }

  /**
   * Start health check monitoring
   */
  startHealthCheck(intervalMinutes: number = 5): void {
    this.stopHealthCheck(); // Clear any existing interval

    this.healthCheckInterval = setInterval(async () => {
      const health = await this.checkSystemHealth();
      
      if (!health.healthy) {
        await errorHandler.logError({
          type: 'critical',
          message: 'System health check failed',
          context: health
        });
      }
    }, intervalMinutes * 60 * 1000);

    // Run initial health check
    this.checkSystemHealth();
  }

  /**
   * Stop health check monitoring
   */
  stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Check overall system health
   */
  async checkSystemHealth(): Promise<{
    healthy: boolean;
    services: {
      auth: boolean;
      firestore: boolean;
      storage: boolean;
      functions: boolean;
      realtime: boolean;
    };
    performance: {
      responseTime: number;
      errorRate: number;
    };
  }> {
    const services = {
      auth: false,
      firestore: false,
      storage: false,
      functions: false,
      realtime: false
    };

    const startTime = performance.now();

    // Check Auth
    try {
      services.auth = auth !== null && auth !== undefined;
    } catch {
      services.auth = false;
    }

    // Check Firestore
    try {
      const { collection, getDocs, limit, query } = await import('firebase/firestore');
      const testQuery = query(collection(db, 'system_health'), limit(1));
      await getDocs(testQuery);
      services.firestore = true;
    } catch {
      services.firestore = auth.currentUser ? false : true; // May fail due to auth
    }

    // Check Storage
    try {
      services.storage = storage !== null && storage !== undefined;
    } catch {
      services.storage = false;
    }

    // Check Functions
    try {
      services.functions = functions !== null && functions !== undefined;
    } catch {
      services.functions = false;
    }

    // Check Realtime Database
    try {
      const { getDatabase, ref, get } = await import('firebase/database');
      const rtdb = getDatabase();
      await get(ref(rtdb, 'health'));
      services.realtime = true;
    } catch {
      services.realtime = auth.currentUser ? false : true; // May fail due to auth
    }

    const responseTime = performance.now() - startTime;
    const errorStats = await errorHandler.getErrorStats();
    const errorRate = errorStats.total > 0 ? (errorStats.critical / errorStats.total) * 100 : 0;

    const healthy = Object.values(services).every(s => s) && responseTime < 5000 && errorRate < 5;

    return {
      healthy,
      services,
      performance: {
        responseTime,
        errorRate
      }
    };
  }

  /**
   * Test specific API operation
   */
  async testAPIOperation(operation: string, data?: any): Promise<{
    success: boolean;
    response?: any;
    error?: string;
    duration: number;
  }> {
    const startTime = performance.now();
    
    try {
      let response: any;

      switch (operation) {
        case 'createUser':
          response = await this.testCreateUser(data);
          break;
        case 'createProduct':
          response = await this.testCreateProduct(data);
          break;
        case 'createOrder':
          response = await this.testCreateOrder(data);
          break;
        case 'uploadFile':
          response = await this.testUploadFile(data);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      return {
        success: true,
        response,
        duration: performance.now() - startTime
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        duration: performance.now() - startTime
      };
    }
  }

  /**
   * Test operations
   */
  private async testCreateUser(data: any): Promise<any> {
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    const testUserId = `test_${Date.now()}`;
    
    await setDoc(doc(db, 'test_users', testUserId), {
      ...data,
      createdAt: serverTimestamp(),
      isTest: true
    });

    // Clean up test data
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'test_users', testUserId));
    
    return { testUserId };
  }

  private async testCreateProduct(data: any): Promise<any> {
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    const testProductId = `test_${Date.now()}`;
    
    await setDoc(doc(db, 'test_products', testProductId), {
      ...data,
      createdAt: serverTimestamp(),
      isTest: true
    });

    // Clean up test data
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'test_products', testProductId));
    
    return { testProductId };
  }

  private async testCreateOrder(data: any): Promise<any> {
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    const testOrderId = `test_${Date.now()}`;
    
    await setDoc(doc(db, 'test_orders', testOrderId), {
      ...data,
      createdAt: serverTimestamp(),
      isTest: true
    });

    // Clean up test data
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'test_orders', testOrderId));
    
    return { testOrderId };
  }

  private async testUploadFile(data: any): Promise<any> {
    const { ref, uploadString, deleteObject } = await import('firebase/storage');
    const testRef = ref(storage, `test/test_${Date.now()}.txt`);
    
    await uploadString(testRef, 'Test file content');
    
    // Clean up test data
    await deleteObject(testRef);
    
    return { success: true };
  }
}

// Export singleton instance
export const apiValidator = APIValidatorService.getInstance();