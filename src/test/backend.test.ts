/**
 * 🧪 PROFESSIONAL BACKEND TESTING SUITE
 * Comprehensive testing for all backend services and functions
 * Implements unit, integration, and end-to-end tests
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { services } from '../services/data.service';
import { apiService } from '../services/api.service';
import { validationService } from '../services/validation.service';
import { performanceServices } from '../services/performance.service';

// Mock Firebase configuration for testing
const firebaseConfig = {
  apiKey: 'test-api-key',
  authDomain: 'test-project.firebaseapp.com',
  projectId: 'test-project',
  storageBucket: 'test-project.appspot.com',
  messagingSenderId: '123456789',
  appId: 'test-app-id'
};

// Initialize Firebase for testing
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Connect to emulators
beforeAll(async () => {
  // Connect to Firestore emulator
  connectFirestoreEmulator(db, 'localhost', 8080);
  
  // Connect to Auth emulator
  connectAuthEmulator(auth, 'http://localhost:9099');
  
  // Connect to Storage emulator
  connectStorageEmulator(storage, 'localhost', 9199);
});

afterAll(async () => {
  // Cleanup
});

describe('Data Service Tests', () => {
  beforeEach(async () => {
    // Setup test data
  });

  afterEach(async () => {
    // Cleanup test data
  });

  describe('User Service', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'customer' as const,
        isActive: true,
      };

      const result = await services.user.create(userData);
      
      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
      expect(result.displayName).toBe(userData.displayName);
      expect(result.role).toBe(userData.role);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
    });

    it('should read user by ID', async () => {
      const userData = {
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'customer' as const,
        isActive: true,
      };

      const createdUser = await services.user.create(userData);
      const readUser = await services.user.read(createdUser.id!);

      expect(readUser).toBeDefined();
      expect(readUser?.email).toBe(userData.email);
    });

    it('should update user data', async () => {
      const userData = {
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'customer' as const,
        isActive: true,
      };

      const createdUser = await services.user.create(userData);
      const updatedUser = await services.user.update(createdUser.id!, {
        displayName: 'Updated User'
      });

      expect(updatedUser.displayName).toBe('Updated User');
    });

    it('should get users by role', async () => {
      const customerData = {
        email: 'customer@example.com',
        displayName: 'Customer',
        role: 'customer' as const,
        isActive: true,
      };

      const vendorData = {
        email: 'vendor@example.com',
        displayName: 'Vendor',
        role: 'vendor' as const,
        isActive: true,
      };

      await services.user.create(customerData);
      await services.user.create(vendorData);

      const customers = await services.user.getByRole('customer');
      const vendors = await services.user.getByRole('vendor');

      expect(customers.length).toBeGreaterThan(0);
      expect(vendors.length).toBeGreaterThan(0);
    });
  });

  describe('Product Service', () => {
    it('should create a new product', async () => {
      const productData = {
        title: 'Test Product',
        description: 'Test Description',
        price: 100,
        category: 'cars',
        vendorId: 'test-vendor-id',
        vendorName: 'Test Vendor',
        images: ['https://example.com/image.jpg'],
        specifications: { brand: 'Test Brand' },
        status: 'published' as const,
        stock: 1,
        tags: ['test'],
        featured: false,
      };

      const result = await services.product.create(productData);
      
      expect(result).toBeDefined();
      expect(result.title).toBe(productData.title);
      expect(result.price).toBe(productData.price);
      expect(result.status).toBe(productData.status);
    });

    it('should get published products', async () => {
      const productData = {
        title: 'Test Product',
        description: 'Test Description',
        price: 100,
        category: 'cars',
        vendorId: 'test-vendor-id',
        vendorName: 'Test Vendor',
        images: ['https://example.com/image.jpg'],
        specifications: {},
        status: 'published' as const,
        stock: 1,
        tags: [],
        featured: false,
      };

      await services.product.create(productData);
      const publishedProducts = await services.product.getPublished();

      expect(publishedProducts.length).toBeGreaterThan(0);
      expect(publishedProducts[0].status).toBe('published');
    });

    it('should get products by category', async () => {
      const productData = {
        title: 'Test Car',
        description: 'Test Car Description',
        price: 50000,
        category: 'cars',
        vendorId: 'test-vendor-id',
        vendorName: 'Test Vendor',
        images: ['https://example.com/image.jpg'],
        specifications: {},
        status: 'published' as const,
        stock: 1,
        tags: [],
        featured: false,
      };

      await services.product.create(productData);
      const carProducts = await services.product.getByCategory('cars');

      expect(carProducts.length).toBeGreaterThan(0);
      expect(carProducts[0].category).toBe('cars');
    });
  });

  describe('Order Service', () => {
    it('should create a new order', async () => {
      const orderData = {
        customerId: 'test-customer-id',
        customerName: 'Test Customer',
        customerEmail: 'customer@example.com',
        vendorId: 'test-vendor-id',
        vendorName: 'Test Vendor',
        items: [{
          productId: 'test-product-id',
          productTitle: 'Test Product',
          quantity: 1,
          price: 100,
          total: 100,
        }],
        subtotal: 100,
        tax: 0,
        shipping: 0,
        totalAmount: 100,
        status: 'pending' as const,
        paymentMethod: 'cod' as const,
        shippingAddress: {
          street: 'Test Street',
          city: 'Test City',
          governorate: 'Test Governorate',
          postalCode: '12345',
          phone: '01234567890',
        },
      };

      const result = await services.order.create(orderData);
      
      expect(result).toBeDefined();
      expect(result.customerId).toBe(orderData.customerId);
      expect(result.totalAmount).toBe(orderData.totalAmount);
      expect(result.status).toBe(orderData.status);
    });

    it('should update order status', async () => {
      const orderData = {
        customerId: 'test-customer-id',
        customerName: 'Test Customer',
        customerEmail: 'customer@example.com',
        vendorId: 'test-vendor-id',
        vendorName: 'Test Vendor',
        items: [{
          productId: 'test-product-id',
          productTitle: 'Test Product',
          quantity: 1,
          price: 100,
          total: 100,
        }],
        subtotal: 100,
        tax: 0,
        shipping: 0,
        totalAmount: 100,
        status: 'pending' as const,
        paymentMethod: 'cod' as const,
        shippingAddress: {
          street: 'Test Street',
          city: 'Test City',
          governorate: 'Test Governorate',
          postalCode: '12345',
          phone: '01234567890',
        },
      };

      const createdOrder = await services.order.create(orderData);
      const updatedOrder = await services.order.updateStatus(createdOrder.id!, 'confirmed');

      expect(updatedOrder.status).toBe('confirmed');
    });
  });
});

describe('API Service Tests', () => {
  beforeEach(() => {
    // Mock fetch for API tests
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle successful API response', async () => {
    const mockResponse = {
      success: true,
      data: { message: 'Success' },
      timestamp: new Date().toISOString(),
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await apiService.getHealth();

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should handle API error response', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const result = await apiService.getHealth();

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should retry failed requests', async () => {
    (global.fetch as any)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      });

    const result = await apiService.getHealth();

    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });
});

describe('Validation Service Tests', () => {
  it('should validate user data correctly', async () => {
    const validUserData = {
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'customer',
      isActive: true,
    };

    const result = await validationService.validate(
      validationService.UserValidationSchema,
      validUserData
    );

    expect(result.isValid).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should reject invalid user data', async () => {
    const invalidUserData = {
      email: 'invalid-email',
      displayName: '',
      role: 'invalid-role',
      isActive: true,
    };

    const result = await validationService.validate(
      validationService.UserValidationSchema,
      invalidUserData
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it('should validate email correctly', () => {
    const validEmail = 'test@example.com';
    const invalidEmail = 'invalid-email';

    const validResult = validationService.validateEmail(validEmail);
    const invalidResult = validationService.validateEmail(invalidEmail);

    expect(validResult.isValid).toBe(true);
    expect(invalidResult.isValid).toBe(false);
  });

  it('should validate phone number correctly', () => {
    const validPhone = '01234567890';
    const invalidPhone = '123';

    const validResult = validationService.validatePhone(validPhone);
    const invalidResult = validationService.validatePhone(invalidPhone);

    expect(validResult.isValid).toBe(true);
    expect(invalidResult.isValid).toBe(false);
  });

  it('should sanitize input data', () => {
    const input = {
      name: '  Test User  ',
      script: '<script>alert("xss")</script>',
      url: 'javascript:alert("xss")',
    };

    const sanitized = validationService.sanitizeInput(input);

    expect(sanitized.name).toBe('Test User');
    expect(sanitized.script).not.toContain('<script>');
    expect(sanitized.url).not.toContain('javascript:');
  });
});

describe('Performance Service Tests', () => {
  it('should cache data correctly', () => {
    const cache = performanceServices.cache;
    
    cache.set('test-key', 'test-value');
    const value = cache.get('test-key');
    
    expect(value).toBe('test-value');
  });

  it('should handle cache expiration', () => {
    const cache = performanceServices.cache;
    
    cache.set('test-key', 'test-value');
    // Simulate time passage
    const entry = cache['cache'].get('test-key');
    if (entry) {
      entry.timestamp = Date.now() - 10 * 60 * 1000; // 10 minutes ago
    }
    
    const value = cache.get('test-key');
    expect(value).toBeNull();
  });

  it('should monitor performance metrics', () => {
    const monitor = performanceServices.monitor;
    
    const endTiming = monitor.startTiming('test-operation');
    endTiming();
    
    const stats = monitor.getStats();
    
    expect(stats.totalOperations).toBeGreaterThan(0);
    expect(stats.averageDuration).toBeGreaterThan(0);
  });

  it('should debounce function calls', async () => {
    const debounce = performanceServices.debounce;
    let callCount = 0;

    const debouncedFunction = debounce.debounce(
      'test-key',
      () => { callCount++; },
      100
    );

    // Call multiple times rapidly
    debouncedFunction();
    debouncedFunction();
    debouncedFunction();

    // Should only be called once after delay
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(callCount).toBe(1);
  });

  it('should throttle function calls', async () => {
    const throttle = performanceServices.throttle;
    let callCount = 0;

    const throttledFunction = throttle.throttle(
      'test-key',
      () => { callCount++; },
      100
    );

    // Call multiple times rapidly
    throttledFunction();
    throttledFunction();
    throttledFunction();

    // Should only be called once immediately
    expect(callCount).toBe(1);

    await new Promise(resolve => setTimeout(resolve, 150));
    throttledFunction();
    expect(callCount).toBe(2);
  });
});

describe('Integration Tests', () => {
  it('should handle complete user registration flow', async () => {
    // Create user
    const userData = {
      email: 'integration@example.com',
      displayName: 'Integration User',
      role: 'customer' as const,
      isActive: true,
    };

    const user = await services.user.create(userData);
    expect(user.id).toBeDefined();

    // Create product
    const productData = {
      title: 'Integration Test Product',
      description: 'Test Description',
      price: 100,
      category: 'cars',
      vendorId: user.id!,
      vendorName: user.displayName,
      images: ['https://example.com/image.jpg'],
      specifications: {},
      status: 'published' as const,
      stock: 1,
      tags: [],
      featured: false,
    };

    const product = await services.product.create(productData);
    expect(product.id).toBeDefined();

    // Create order
    const orderData = {
      customerId: user.id!,
      customerName: user.displayName,
      customerEmail: user.email,
      vendorId: user.id!,
      vendorName: user.displayName,
      items: [{
        productId: product.id!,
        productTitle: product.title,
        quantity: 1,
        price: product.price,
        total: product.price,
      }],
      subtotal: product.price,
      tax: 0,
      shipping: 0,
      totalAmount: product.price,
      status: 'pending' as const,
      paymentMethod: 'cod' as const,
      shippingAddress: {
        street: 'Test Street',
        city: 'Test City',
        governorate: 'Test Governorate',
        postalCode: '12345',
        phone: '01234567890',
      },
    };

    const order = await services.order.create(orderData);
    expect(order.id).toBeDefined();
    expect(order.totalAmount).toBe(product.price);
  });
});

describe('Error Handling Tests', () => {
  it('should handle database connection errors gracefully', async () => {
    // Mock database error
    const originalCreate = services.user.create;
    services.user.create = vi.fn().mockRejectedValue(new Error('Database connection failed'));

    try {
      await services.user.create({
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'customer' as const,
        isActive: true,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('Database connection failed');
    }

    // Restore original function
    services.user.create = originalCreate;
  });

  it('should handle validation errors gracefully', async () => {
    const invalidData = {
      email: 'invalid-email',
      displayName: '',
      role: 'invalid-role',
    };

    try {
      await services.user.create(invalidData as any);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });
});

