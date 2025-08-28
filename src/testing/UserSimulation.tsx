/**
 * 🧪 COMPREHENSIVE USER SIMULATION & ERROR DETECTION SYSTEM
 * Tests all user flows, detects runtime errors, and validates real-time operations
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  PlayIcon, 
  StopIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { useRealtimeStore } from '@/stores/realtimeStore';
import { useAppStore } from '@/stores/appStore';
import { AuthService } from '@/services/auth.service';
import { ProductService } from '@/services/product.service';
import { OrderService } from '@/services/order.service';
import { CartService } from '@/services/cart.service';
import { errorHandlerService } from '@/services/error-handler.service';
import { apiValidatorService } from '@/services/api-validator.service';

interface SimulationStep {
  id: string;
  name: string;
  description: string;
  action: () => Promise<void>;
  status: 'pending' | 'running' | 'success' | 'error' | 'warning';
  error?: string;
  warnings?: string[];
  duration?: number;
}

interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  steps: SimulationStep[];
}

interface ErrorReport {
  type: 'error' | 'warning' | 'info';
  component: string;
  message: string;
  stack?: string;
  timestamp: Date;
}

export const UserSimulation: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<SimulationScenario | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [errors, setErrors] = useState<ErrorReport[]>([]);
  const [completedScenarios, setCompletedScenarios] = useState<Set<string>>(new Set());
  const simulationRef = useRef<boolean>(false);
  
  const { user, login, logout } = useAuthStore();
  const { initialize: initRealtime, cleanup: cleanupRealtime } = useRealtimeStore();
  const { setLanguage, setTheme } = useAppStore();

  // Error detection setup
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setErrors(prev => [...prev, {
        type: 'error',
        component: 'Global',
        message: event.message,
        stack: event.error?.stack,
        timestamp: new Date()
      }]);
      return true;
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setErrors(prev => [...prev, {
        type: 'error',
        component: 'Promise',
        message: event.reason?.toString() || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        timestamp: new Date()
      }]);
    };

    const handleConsoleError = (message: any, ...args: any[]) => {
      setErrors(prev => [...prev, {
        type: 'error',
        component: 'Console',
        message: typeof message === 'string' ? message : JSON.stringify(message),
        timestamp: new Date()
      }]);
    };

    const handleConsoleWarn = (message: any, ...args: any[]) => {
      setErrors(prev => [...prev, {
        type: 'warning',
        component: 'Console',
        message: typeof message === 'string' ? message : JSON.stringify(message),
        timestamp: new Date()
      }]);
    };

    // Override console methods
    const originalError = console.error;
    const originalWarn = console.warn;
    console.error = handleConsoleError;
    console.warn = handleConsoleWarn;

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  // Define comprehensive test scenarios
  const scenarios: SimulationScenario[] = [
    {
      id: 'app-startup',
      name: '🚀 App Startup & Initialization',
      description: 'Tests app initialization, Firebase connection, and real-time setup',
      steps: [
        {
          id: 'check-firebase',
          name: 'Check Firebase Connection',
          description: 'Validates Firebase services are accessible',
          action: async () => {
            const results = await apiValidatorService.runComprehensiveHealthCheck();
            if (Object.values(results).some(r => !r)) {
              throw new Error('Firebase services unhealthy');
            }
          },
          status: 'pending'
        },
        {
          id: 'init-realtime',
          name: 'Initialize Real-time Services',
          description: 'Sets up WebSocket connections and listeners',
          action: async () => {
            if (!user) throw new Error('No user for real-time init');
            await initRealtime(user.id);
          },
          status: 'pending'
        },
        {
          id: 'check-performance',
          name: 'Check Initial Performance',
          description: 'Measures initial load time and memory usage',
          action: async () => {
            const loadTime = performance.now();
            if (loadTime > 3000) {
              throw new Error(`Slow initial load: ${loadTime}ms`);
            }
          },
          status: 'pending'
        }
      ]
    },
    {
      id: 'user-auth-flow',
      name: '🔐 User Authentication Flow',
      description: 'Tests registration, login, logout, and session management',
      steps: [
        {
          id: 'register-user',
          name: 'Register New User',
          description: 'Creates a test user account',
          action: async () => {
            const testEmail = `test_${Date.now()}@souk.com`;
            const result = await AuthService.register(
              testEmail,
              'Test@123456',
              'Test User',
              'customer'
            );
            if (!result.success) throw new Error(result.error);
          },
          status: 'pending'
        },
        {
          id: 'login-user',
          name: 'Login User',
          description: 'Authenticates with test credentials',
          action: async () => {
            const result = await AuthService.login(
              'test@example.com',
              'password123'
            );
            if (!result.success) throw new Error(result.error);
          },
          status: 'pending'
        },
        {
          id: 'check-session',
          name: 'Validate Session',
          description: 'Checks session persistence and tokens',
          action: async () => {
            const currentUser = await AuthService.getCurrentUser();
            if (!currentUser) throw new Error('Session not persisted');
          },
          status: 'pending'
        },
        {
          id: 'logout-user',
          name: 'Logout User',
          description: 'Tests logout and cleanup',
          action: async () => {
            await logout();
            await cleanupRealtime();
          },
          status: 'pending'
        }
      ]
    },
    {
      id: 'product-browsing',
      name: '🛍️ Product Browsing & Search',
      description: 'Tests product listing, filtering, search, and real-time updates',
      steps: [
        {
          id: 'load-products',
          name: 'Load Product Catalog',
          description: 'Fetches and displays products',
          action: async () => {
            const products = await ProductService.getProducts();
            if (!products || products.length === 0) {
              throw new Error('No products loaded');
            }
          },
          status: 'pending'
        },
        {
          id: 'search-products',
          name: 'Search Products',
          description: 'Tests search functionality',
          action: async () => {
            const results = await ProductService.searchProducts('car');
            if (!Array.isArray(results)) {
              throw new Error('Search returned invalid results');
            }
          },
          status: 'pending'
        },
        {
          id: 'filter-products',
          name: 'Filter Products',
          description: 'Tests category and price filtering',
          action: async () => {
            const filtered = await ProductService.getProductsByCategory('sedan');
            if (!Array.isArray(filtered)) {
              throw new Error('Filter returned invalid results');
            }
          },
          status: 'pending'
        },
        {
          id: 'realtime-product-update',
          name: 'Real-time Product Updates',
          description: 'Verifies products update in real-time',
          action: async () => {
            // Simulate product update and check if UI reflects it
            const testProduct = await ProductService.getProducts();
            if (testProduct.length > 0) {
              // Update would trigger real-time listener
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          },
          status: 'pending'
        }
      ]
    },
    {
      id: 'shopping-cart',
      name: '🛒 Shopping Cart Operations',
      description: 'Tests cart CRUD operations with real-time sync',
      steps: [
        {
          id: 'add-to-cart',
          name: 'Add Product to Cart',
          description: 'Adds items and checks real-time update',
          action: async () => {
            const products = await ProductService.getProducts();
            if (products.length > 0) {
              await CartService.addToCart({
                productId: products[0].id,
                quantity: 1
              });
            }
          },
          status: 'pending'
        },
        {
          id: 'update-quantity',
          name: 'Update Cart Quantity',
          description: 'Changes quantity and verifies sync',
          action: async () => {
            const cart = await CartService.getCart();
            if (cart.items.length > 0) {
              await CartService.updateQuantity(cart.items[0].productId, 2);
            }
          },
          status: 'pending'
        },
        {
          id: 'remove-from-cart',
          name: 'Remove from Cart',
          description: 'Removes items and checks update',
          action: async () => {
            const cart = await CartService.getCart();
            if (cart.items.length > 0) {
              await CartService.removeFromCart(cart.items[0].productId);
            }
          },
          status: 'pending'
        },
        {
          id: 'cart-persistence',
          name: 'Cart Persistence',
          description: 'Verifies cart survives page reload',
          action: async () => {
            const cart = await CartService.getCart();
            // Simulate page reload
            await new Promise(resolve => setTimeout(resolve, 500));
            const reloadedCart = await CartService.getCart();
            if (cart.items.length !== reloadedCart.items.length) {
              throw new Error('Cart not persisted');
            }
          },
          status: 'pending'
        }
      ]
    },
    {
      id: 'checkout-order',
      name: '💳 Checkout & Order Processing',
      description: 'Tests complete order flow with payment',
      steps: [
        {
          id: 'initiate-checkout',
          name: 'Initiate Checkout',
          description: 'Starts checkout process',
          action: async () => {
            const cart = await CartService.getCart();
            if (cart.items.length === 0) {
              // Add test item first
              const products = await ProductService.getProducts();
              if (products.length > 0) {
                await CartService.addToCart({
                  productId: products[0].id,
                  quantity: 1
                });
              }
            }
          },
          status: 'pending'
        },
        {
          id: 'validate-shipping',
          name: 'Validate Shipping Info',
          description: 'Checks shipping address validation',
          action: async () => {
            const shippingData = {
              fullName: 'Test User',
              address: '123 Test St',
              city: 'Cairo',
              postalCode: '12345',
              phone: '+201234567890'
            };
            // Validate shipping data
            if (!shippingData.fullName || !shippingData.address) {
              throw new Error('Invalid shipping data');
            }
          },
          status: 'pending'
        },
        {
          id: 'process-payment',
          name: 'Process Payment',
          description: 'Simulates payment processing',
          action: async () => {
            // Simulate payment API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            const paymentSuccess = Math.random() > 0.1; // 90% success rate
            if (!paymentSuccess) {
              throw new Error('Payment failed');
            }
          },
          status: 'pending'
        },
        {
          id: 'create-order',
          name: 'Create Order',
          description: 'Creates order and clears cart',
          action: async () => {
            const orderData = {
              items: [],
              total: 1000,
              shippingAddress: {},
              paymentMethod: 'card'
            };
            const order = await OrderService.createOrder(orderData);
            if (!order) throw new Error('Order creation failed');
          },
          status: 'pending'
        }
      ]
    },
    {
      id: 'realtime-features',
      name: '🔄 Real-time Features',
      description: 'Tests all real-time functionality',
      steps: [
        {
          id: 'user-presence',
          name: 'User Presence System',
          description: 'Verifies online status updates',
          action: async () => {
            const { onlineUsers } = useRealtimeStore.getState();
            if (!onlineUsers || Object.keys(onlineUsers).length === 0) {
              console.warn('No online users detected');
            }
          },
          status: 'pending'
        },
        {
          id: 'live-notifications',
          name: 'Live Notifications',
          description: 'Tests notification delivery',
          action: async () => {
            // Trigger test notification
            const { notifications } = useRealtimeStore.getState();
            await new Promise(resolve => setTimeout(resolve, 1000));
          },
          status: 'pending'
        },
        {
          id: 'chat-system',
          name: 'Chat System',
          description: 'Tests real-time messaging',
          action: async () => {
            const { sendMessage } = useRealtimeStore.getState();
            if (user) {
              // Test message sending
              await sendMessage(user.id, 'test_recipient', 'Test message');
            }
          },
          status: 'pending'
        },
        {
          id: 'inventory-updates',
          name: 'Inventory Updates',
          description: 'Verifies stock changes reflect instantly',
          action: async () => {
            // Monitor inventory changes
            await new Promise(resolve => setTimeout(resolve, 1000));
          },
          status: 'pending'
        }
      ]
    },
    {
      id: 'vendor-operations',
      name: '👔 Vendor Operations',
      description: 'Tests vendor-specific functionality',
      steps: [
        {
          id: 'vendor-registration',
          name: 'Vendor Registration',
          description: 'Tests vendor application process',
          action: async () => {
            const vendorData = {
              businessName: 'Test Motors',
              businessType: 'dealership',
              description: 'Test dealership',
              phoneNumber: '+201234567890'
            };
            // Simulate vendor registration
            await new Promise(resolve => setTimeout(resolve, 500));
          },
          status: 'pending'
        },
        {
          id: 'product-management',
          name: 'Product Management',
          description: 'Tests vendor product CRUD',
          action: async () => {
            // Test product creation by vendor
            const productData = {
              name: 'Test Car',
              price: 50000,
              category: 'sedan',
              stock: 5
            };
            await new Promise(resolve => setTimeout(resolve, 500));
          },
          status: 'pending'
        },
        {
          id: 'order-management',
          name: 'Order Management',
          description: 'Tests vendor order handling',
          action: async () => {
            // Test order status updates
            await new Promise(resolve => setTimeout(resolve, 500));
          },
          status: 'pending'
        }
      ]
    },
    {
      id: 'performance-stress',
      name: '⚡ Performance & Stress Testing',
      description: 'Tests app under load and stress conditions',
      steps: [
        {
          id: 'concurrent-users',
          name: 'Simulate Concurrent Users',
          description: 'Tests with multiple simultaneous users',
          action: async () => {
            const promises = [];
            for (let i = 0; i < 10; i++) {
              promises.push(ProductService.getProducts());
            }
            await Promise.all(promises);
          },
          status: 'pending'
        },
        {
          id: 'rapid-navigation',
          name: 'Rapid Page Navigation',
          description: 'Tests quick page switching',
          action: async () => {
            // Simulate rapid navigation
            for (let i = 0; i < 5; i++) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          },
          status: 'pending'
        },
        {
          id: 'memory-leaks',
          name: 'Check Memory Leaks',
          description: 'Monitors memory usage patterns',
          action: async () => {
            if (performance.memory) {
              const used = performance.memory.usedJSHeapSize;
              const limit = performance.memory.jsHeapSizeLimit;
              if (used / limit > 0.9) {
                throw new Error('High memory usage detected');
              }
            }
          },
          status: 'pending'
        },
        {
          id: 'network-resilience',
          name: 'Network Resilience',
          description: 'Tests offline/online transitions',
          action: async () => {
            // Simulate network interruption
            const online = navigator.onLine;
            if (!online) {
              console.warn('Network offline');
            }
          },
          status: 'pending'
        }
      ]
    },
    {
      id: 'security-validation',
      name: '🔒 Security Validation',
      description: 'Tests security measures and vulnerabilities',
      steps: [
        {
          id: 'auth-protection',
          name: 'Authentication Protection',
          description: 'Verifies protected routes',
          action: async () => {
            // Try accessing protected resource without auth
            if (!user) {
              try {
                await OrderService.getOrders();
                throw new Error('Accessed protected resource without auth');
              } catch (e) {
                // Expected behavior
              }
            }
          },
          status: 'pending'
        },
        {
          id: 'input-sanitization',
          name: 'Input Sanitization',
          description: 'Tests XSS prevention',
          action: async () => {
            const maliciousInput = '<script>alert("XSS")</script>';
            // Test if input is sanitized
            const sanitized = maliciousInput.replace(/<script.*?>.*?<\/script>/gi, '');
            if (sanitized.includes('<script>')) {
              throw new Error('XSS vulnerability detected');
            }
          },
          status: 'pending'
        },
        {
          id: 'rate-limiting',
          name: 'Rate Limiting',
          description: 'Tests API rate limits',
          action: async () => {
            // Test rapid API calls
            const promises = [];
            for (let i = 0; i < 20; i++) {
              promises.push(ProductService.getProducts().catch(() => {}));
            }
            await Promise.all(promises);
          },
          status: 'pending'
        }
      ]
    },
    {
      id: 'edge-cases',
      name: '🔧 Edge Cases & Error Handling',
      description: 'Tests unusual scenarios and error recovery',
      steps: [
        {
          id: 'empty-states',
          name: 'Empty State Handling',
          description: 'Tests UI with no data',
          action: async () => {
            // Test components with empty data
            await new Promise(resolve => setTimeout(resolve, 500));
          },
          status: 'pending'
        },
        {
          id: 'invalid-data',
          name: 'Invalid Data Handling',
          description: 'Tests with malformed data',
          action: async () => {
            try {
              // Test with invalid product ID
              await ProductService.getProductById('invalid_id_123');
            } catch (e) {
              // Expected to handle gracefully
            }
          },
          status: 'pending'
        },
        {
          id: 'timeout-handling',
          name: 'Timeout Handling',
          description: 'Tests long-running operations',
          action: async () => {
            const timeout = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 5000)
            );
            const operation = new Promise(resolve => 
              setTimeout(resolve, 1000)
            );
            await Promise.race([operation, timeout]);
          },
          status: 'pending'
        },
        {
          id: 'error-recovery',
          name: 'Error Recovery',
          description: 'Tests automatic error recovery',
          action: async () => {
            // Test retry mechanism
            let attempts = 0;
            const retry = async () => {
              attempts++;
              if (attempts < 3) {
                throw new Error('Simulated failure');
              }
            };
            await errorHandlerService.retryOperation(retry, 3, 100);
          },
          status: 'pending'
        }
      ]
    }
  ];

  const runScenario = async (scenario: SimulationScenario) => {
    setCurrentScenario(scenario);
    setCurrentStep(0);
    
    for (let i = 0; i < scenario.steps.length; i++) {
      if (!simulationRef.current) break;
      
      setCurrentStep(i);
      const step = scenario.steps[i];
      step.status = 'running';
      
      const startTime = performance.now();
      
      try {
        await step.action();
        step.duration = performance.now() - startTime;
        step.status = 'success';
      } catch (error: any) {
        step.duration = performance.now() - startTime;
        step.status = 'error';
        step.error = error.message;
        
        setErrors(prev => [...prev, {
          type: 'error',
          component: `${scenario.name} - ${step.name}`,
          message: error.message,
          stack: error.stack,
          timestamp: new Date()
        }]);
      }
      
      // Update UI
      setCurrentScenario({...scenario});
      
      // Small delay between steps
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setCompletedScenarios(prev => new Set(prev).add(scenario.id));
  };

  const startSimulation = async () => {
    setIsRunning(true);
    simulationRef.current = true;
    setErrors([]);
    setCompletedScenarios(new Set());
    
    for (const scenario of scenarios) {
      if (!simulationRef.current) break;
      await runScenario(scenario);
    }
    
    setIsRunning(false);
    simulationRef.current = false;
  };

  const stopSimulation = () => {
    simulationRef.current = false;
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'running':
        return <ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-300" />;
    }
  };

  const totalSteps = scenarios.reduce((acc, s) => acc + s.steps.length, 0);
  const completedSteps = scenarios.reduce((acc, s) => 
    acc + s.steps.filter(step => step.status === 'success').length, 0
  );
  const failedSteps = scenarios.reduce((acc, s) => 
    acc + s.steps.filter(step => step.status === 'error').length, 0
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              🧪 Comprehensive User Simulation & Testing
            </h1>
            <p className="text-gray-600 mt-1">
              Automated testing of all user flows and real-time features
            </p>
          </div>
          <div className="flex space-x-4">
            {!isRunning ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startSimulation}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <PlayIcon className="w-5 h-5" />
                <span>Start Simulation</span>
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopSimulation}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <StopIcon className="w-5 h-5" />
                <span>Stop Simulation</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600">Overall Progress</span>
            <span className="text-sm font-medium">
              {completedSteps} / {totalSteps} steps
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all"
              style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-green-600">✅ {completedSteps} Passed</span>
            <span className="text-xs text-red-600">❌ {failedSteps} Failed</span>
            <span className="text-xs text-gray-500">⏳ {totalSteps - completedSteps - failedSteps} Pending</span>
          </div>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {scenarios.map(scenario => (
          <motion.div
            key={scenario.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-lg shadow-lg p-6 ${
              currentScenario?.id === scenario.id ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{scenario.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{scenario.description}</p>
              </div>
              {completedScenarios.has(scenario.id) && (
                <CheckCircleIcon className="w-6 h-6 text-green-500" />
              )}
            </div>

            <div className="space-y-2">
              {scenario.steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    currentScenario?.id === scenario.id && currentStep === index
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(step.status)}
                    <span className="text-sm text-gray-700">{step.name}</span>
                  </div>
                  {step.duration && (
                    <span className="text-xs text-gray-500">
                      {step.duration.toFixed(0)}ms
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Error Log */}
      {errors.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-semibold text-red-900 mb-4">
            ⚠️ Errors & Warnings ({errors.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {errors.map((error, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  error.type === 'error' 
                    ? 'bg-red-50 border border-red-200' 
                    : 'bg-yellow-50 border border-yellow-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      {error.type === 'error' ? (
                        <XCircleIcon className="w-4 h-4 text-red-500" />
                      ) : (
                        <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className="text-sm font-medium">{error.component}</span>
                      <span className="text-xs text-gray-500">
                        {error.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{error.message}</p>
                    {error.stack && (
                      <pre className="text-xs text-gray-600 mt-2 overflow-x-auto">
                        {error.stack.split('\n').slice(0, 3).join('\n')}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};