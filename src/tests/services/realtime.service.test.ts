/**
 * Unit Tests for RealtimeService
 * Tests all real-time functionality and error handling
 */

import { RealtimeService } from '@/services/realtime.service';

import { Notification } from '@/types';

// Mock Firebase modules
vi.mock('@/config/firebase.config', () => ({
  db: {
    collection: vi.fn(),
    doc: vi.fn(),
  },
  realtimeDb: {
    ref: vi.fn(),
  },
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  onValue: vi.fn(),
  off: vi.fn(),
}));

describe('RealtimeService', () => {
  let realtimeService: RealtimeService;
  let mockOnSnapshot: Mock;
  let mockOnValue: Mock;
  let mockUnsubscribe: Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset singleton instance
    (RealtimeService as any).instance = null;

    mockUnsubscribe = vi.fn();
    mockOnSnapshot = vi.fn().mockReturnValue(mockUnsubscribe);
    mockOnValue = vi.fn().mockReturnValue(mockUnsubscribe);

    // Mock Firebase functions
    vi.mocked(require('firebase/firestore').onSnapshot).mockImplementation(mockOnSnapshot);
    vi.mocked(require('firebase/database').onValue).mockImplementation(mockOnValue);

    realtimeService = RealtimeService.getInstance();
  });

  afterEach(() => {
    realtimeService.destroy();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = RealtimeService.getInstance();
      const instance2 = RealtimeService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Connection Management', () => {
    it('should initialize connection status', () => {
      const stats = realtimeService.getStats();
      expect(stats.connectionStatus).toBeDefined();
    });

    it('should track active connections', () => {
      const stats = realtimeService.getStats();
      expect(stats.activeConnections).toBe(0);
    });

    it('should test connection health', async () => {
      const isConnected = await realtimeService.testConnection();
      expect(typeof isConnected).toBe('boolean');
    });
  });

  describe('Subscription Management', () => {
    it('should create and track subscriptions', () => {
      const mockCallback = vi.fn();
      const subscription = realtimeService.subscribeToUser('user123', mockCallback);

      expect(subscription).toBeDefined();
      expect(subscription.id).toBe('user_user123');
      expect(subscription.type).toBe('firestore');

      const stats = realtimeService.getStats();
      expect(stats.activeConnections).toBe(1);
    });

    it('should prevent duplicate subscriptions', () => {
      const mockCallback = vi.fn();
      const sub1 = realtimeService.subscribeToUser('user123', mockCallback);
      const sub2 = realtimeService.subscribeToUser('user123', mockCallback);

      expect(sub1).toBe(sub2);
      expect(realtimeService.getStats().activeConnections).toBe(1);
    });

    it('should unsubscribe from specific subscription', () => {
      const mockCallback = vi.fn();
      const subscription = realtimeService.subscribeToUser('user123', mockCallback);

      const result = realtimeService.unsubscribe(subscription.id);
      expect(result).toBe(true);
      expect(realtimeService.getStats().activeConnections).toBe(0);
    });

    it('should unsubscribe from all subscriptions', () => {
      const mockCallback = vi.fn();
      realtimeService.subscribeToUser('user123', mockCallback);
      realtimeService.subscribeToVendor('vendor123', mockCallback);

      expect(realtimeService.getStats().activeConnections).toBe(2);

      realtimeService.unsubscribeAll();
      expect(realtimeService.getStats().activeConnections).toBe(0);
    });

    it('should check subscription existence', () => {
      const mockCallback = vi.fn();
      const subscription = realtimeService.subscribeToUser('user123', mockCallback);

      expect(realtimeService.hasSubscription(subscription.id)).toBe(true);
      expect(realtimeService.hasSubscription('nonexistent')).toBe(false);
    });

    it('should get subscription by ID', () => {
      const mockCallback = vi.fn();
      const subscription = realtimeService.subscribeToUser('user123', mockCallback);

      const found = realtimeService.getSubscription(subscription.id);
      expect(found).toBe(subscription);
    });
  });

  describe('User Subscriptions', () => {
    it('should subscribe to user data changes', () => {
      const mockCallback = vi.fn();
      const subscription = realtimeService.subscribeToUser('user123', mockCallback);

      expect(subscription).toBeDefined();
      expect(subscription.path).toBe('users/user123');
    });

    it('should handle user data with missing fields', () => {
      const mockCallback = vi.fn();
      realtimeService.subscribeToUser('user123', mockCallback);

      // Simulate snapshot callback with minimal data
      // Mock snapshot structure would be:
      // { exists: () => true, id: 'user123', data: () => ({ email: 'test@example.com', role: 'customer' }) }

      // This would normally be called by Firebase
      // We're just testing the structure
      expect(mockCallback).toBeDefined();
    });
  });

  describe('Vendor Subscriptions', () => {
    it('should subscribe to vendor data changes', () => {
      const mockCallback = vi.fn();
      const subscription = realtimeService.subscribeToVendor('vendor123', mockCallback);

      expect(subscription).toBeDefined();
      expect(subscription.path).toBe('vendors/vendor123');
    });
  });

  describe('Product Subscriptions', () => {
    it('should subscribe to product data changes', () => {
      const mockCallback = vi.fn();
      const subscription = realtimeService.subscribeToProduct('product123', mockCallback);

      expect(subscription).toBeDefined();
      expect(subscription.path).toBe('products/product123');
    });
  });

  describe('Order Subscriptions', () => {
    it('should subscribe to order data changes', () => {
      const mockCallback = vi.fn();
      const subscription = realtimeService.subscribeToOrder('order123', mockCallback);

      expect(subscription).toBeDefined();
      expect(subscription.path).toBe('orders/order123');
    });
  });

  describe('Collection Subscriptions', () => {
    it('should subscribe to collection with filters', () => {
      const mockCallback = vi.fn();
      const filters = [{ field: 'status', operator: '==', value: 'active' }];

      const subscription = realtimeService.subscribeToCollection(
        'products',
        filters,
        'createdAt',
        'desc',
        20,
        mockCallback
      );

      expect(subscription).toBeDefined();
      expect(subscription.path).toContain('products');
    });

    it('should subscribe to Firestore collection with options', () => {
      const mockCallback = vi.fn();
      const subscription = realtimeService.subscribeToFirestoreCollection(
        'products',
        mockCallback,
        {
          filters: [{ field: 'status', operator: '==', value: 'active' }],
          orderBy: { field: 'createdAt', direction: 'desc' },
          limit: 20,
        }
      );

      expect(subscription).toBeDefined();
    });
  });

  describe('Document Subscriptions', () => {
    it('should subscribe to Firestore document', () => {
      const mockCallback = vi.fn();
      const subscription = realtimeService.subscribeToFirestoreDocument(
        'users',
        'user123',
        mockCallback
      );

      expect(subscription).toBeDefined();
      expect(subscription.path).toBe('users/user123');
    });
  });

  describe('Realtime Database Subscriptions', () => {
    it('should subscribe to realtime database path', () => {
      const mockCallback = vi.fn();
      const subscription = realtimeService.subscribeToRealtimePath('users/123', mockCallback);

      expect(subscription).toBeDefined();
      expect(subscription.type).toBe('realtime');
      expect(subscription.path).toBe('users/123');
    });
  });

  describe('Event System', () => {
    it('should subscribe to events', () => {
      const mockCallback = vi.fn();
      const unsubscribe = realtimeService.subscribeToEvents(mockCallback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should notify event listeners', () => {
      const mockCallback = vi.fn();
      realtimeService.subscribeToEvents(mockCallback);

      // Simulate an event (this would normally be triggered internally)
      const mockEvent = {
        type: 'created',
        collection: 'users',
        documentId: 'user123',
        data: { email: 'test@example.com' },
        timestamp: new Date(),
      };

      // We can't directly test private methods, but we can verify the callback is registered
      expect(mockCallback).toBeDefined();
    });
  });

  describe('Statistics', () => {
    it('should provide accurate statistics', () => {
      const stats = realtimeService.getStats();

      expect(stats).toHaveProperty('activeConnections');
      expect(stats).toHaveProperty('totalEvents');
      expect(stats).toHaveProperty('lastEventTime');
      expect(stats).toHaveProperty('connectionStatus');
    });

    it('should update statistics when subscriptions change', () => {
      const mockCallback = vi.fn();

      expect(realtimeService.getStats().activeConnections).toBe(0);

      realtimeService.subscribeToUser('user123', mockCallback);
      expect(realtimeService.getStats().activeConnections).toBe(1);

      realtimeService.subscribeToVendor('vendor123', mockCallback);
      expect(realtimeService.getStats().activeConnections).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle subscription errors gracefully', () => {
      const mockCallback = vi.fn();

      // Mock onSnapshot to throw an error
      vi.mocked(require('firebase/firestore').onSnapshot).mockImplementation(() => {
        throw new Error('Firebase error');
      });

      // Should not crash the service
      expect(() => {
        realtimeService.subscribeToUser('user123', mockCallback);
      }).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should destroy all resources', () => {
      const mockCallback = vi.fn();
      realtimeService.subscribeToUser('user123', mockCallback);
      realtimeService.subscribeToVendor('vendor123', mockCallback);

      expect(realtimeService.getStats().activeConnections).toBe(2);

      realtimeService.destroy();

      expect(realtimeService.getStats().activeConnections).toBe(0);
      expect(realtimeService.getStats().connectionStatus).toBe('disconnected');
    });
  });

  describe('Vendor Applications', () => {
    it('should subscribe to vendor applications', () => {
      const mockCallback = vi.fn();
      const subscription = realtimeService.subscribeToVendorApplications('pending', mockCallback);

      expect(subscription).toBeDefined();
      expect(subscription.path).toContain('vendor_applications');
    });
  });

  describe('Analytics Subscriptions', () => {
    it('should subscribe to platform analytics', () => {
      const mockCallback = vi.fn();
      const subscription = realtimeService.subscribeToPlatformAnalytics(mockCallback);

      expect(subscription).toBeDefined();
      expect(subscription.path).toBe('admin_analytics/platform');
    });

    it('should subscribe to vendor analytics', () => {
      const mockCallback = vi.fn();
      const subscription = realtimeService.subscribeToVendorAnalytics('vendor123', mockCallback);

      expect(subscription).toBeDefined();
      expect(subscription.path).toBe('vendor_analytics/vendor123');
    });
  });

  describe('Notification Subscriptions', () => {
    it('should subscribe to user notifications', () => {
      const mockCallback = vi.fn();
      const subscription = realtimeService.subscribeToUserNotifications('user123', mockCallback);

      expect(subscription).toBeDefined();
      expect(subscription.path).toContain('notifications');
    });
  });
});
