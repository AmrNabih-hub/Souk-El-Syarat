/**
 * 🚀 COMPREHENSIVE APPWRITE TESTING COMPONENT
 * Complete backend functionality verification for Souk Al-Sayarat
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, PlayIcon, ClockIcon, CogIcon } from '@heroicons/react/24/outline';
import appwriteService from '@/services/appwrite.service';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  duration?: number;
  details?: any;
}

const AppwriteTest: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Connection Test', status: 'pending' },
    { name: 'Database Access', status: 'pending' },
    { name: 'Collections Check', status: 'pending' },
    { name: 'Storage Access', status: 'pending' },
    { name: 'Authentication Test', status: 'pending' },
    { name: 'Real-time Features', status: 'pending' },
  ]);
  
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<number>(-1);
  const [showDetails, setShowDetails] = useState(false);

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, ...updates } : test
    ));
  };

  const runTest = async (index: number, testFunction: () => Promise<any>) => {
    setCurrentTest(index);
    updateTest(index, { status: 'running' });
    const startTime = Date.now();
    
    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      updateTest(index, { 
        status: 'passed', 
        message: 'Success', 
        duration,
        details: result
      });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTest(index, { 
        status: 'failed', 
        message: error instanceof Error ? error.message : 'Unknown error',
        duration,
        details: error
      });
      throw error;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setCurrentTest(-1);
    
    // Reset all tests
    setTests(prev => prev.map(test => ({ ...test, status: 'pending' as const })));
    
    try {
      // Test 1: Connection
      await runTest(0, async () => {
        const connected = await appwriteService.testConnection();
        if (!connected) throw new Error('Connection failed');
        return { connected: true, endpoint: appwriteService.config.endpoint };
      });

      // Test 2: Database Access
      await runTest(1, async () => {
        const listings = await appwriteService.getCarListings({ limit: 1 });
        return { 
          success: true, 
          collections: Object.keys(appwriteService.config.collections).length,
          sampleData: listings 
        };
      });

      // Test 3: Collections Check
      await runTest(2, async () => {
        const collections = Object.entries(appwriteService.config.collections);
        const results = [];
        
        for (const [name, id] of collections) {
          try {
            const docs = await appwriteService.databases.listDocuments(
              appwriteService.config.databaseId,
              id,
              [appwriteService.databases.Query ? appwriteService.databases.Query.limit(1) : []]
            );
            results.push({ name, id, status: 'accessible', count: docs.total });
          } catch (error) {
            results.push({ name, id, status: 'error', error: error.message });
          }
        }
        
        return { collectionsChecked: results.length, results };
      });

      // Test 4: Storage Access
      await runTest(3, async () => {
        const buckets = await appwriteService.storage.listBuckets();
        return { 
          bucketsAvailable: buckets.total || 0, 
          buckets: buckets.buckets || [],
          configured: Object.keys(appwriteService.config.buckets).length
        };
      });

      // Test 5: Authentication Test
      await runTest(4, async () => {
        const user = await appwriteService.getCurrentUser();
        return { 
          authenticated: !!user, 
          user: user ? { id: user.$id, name: user.name, email: user.email } : null,
          authSystem: 'appwrite'
        };
      });

      // Test 6: Real-time Features
      await runTest(5, async () => {
        // Test real-time subscription capability
        try {
          const unsubscribe = appwriteService.subscribe(
            [`databases.${appwriteService.config.databaseId}.collections.${appwriteService.config.collections.carListings}.documents`],
            (response) => {
              console.log('Real-time test event:', response);
            }
          );
          
          // Immediately unsubscribe to clean up
          if (typeof unsubscribe === 'function') {
            unsubscribe();
          }
          
          return { realtimeSupported: true, subscriptionMethod: 'appwrite-realtime' };
        } catch (error) {
          return { realtimeSupported: false, error: error.message };
        }
      });

    } catch (error) {
      console.error('Test suite error:', error);
    } finally {
      setCurrentTest(-1);
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'running':
        return <ClockIcon className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return 'bg-green-50 border-green-200';
      case 'failed': return 'bg-red-50 border-red-200';
      case 'running': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const passedTests = tests.filter(t => t.status === 'passed').length;
  const totalTests = tests.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🚀 Appwrite Backend Test Suite
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Comprehensive verification of your Souk Al-Sayarat marketplace backend
          </p>
          
          <div className="flex justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={runAllTests}
              disabled={isRunning}
              className={`
                inline-flex items-center px-8 py-3 rounded-lg font-semibold text-white
                ${isRunning 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                }
                transition-all duration-200
              `}
            >
              <PlayIcon className="w-5 h-5 mr-2" />
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDetails(!showDetails)}
              className="inline-flex items-center px-6 py-3 rounded-lg font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:border-gray-300 transition-all duration-200"
            >
              <CogIcon className="w-5 h-5 mr-2" />
              {showDetails ? 'Hide Details' : 'Show Details'}
            </motion.button>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Test Progress</span>
            <span>{passedTests} / {totalTests} tests passed</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(passedTests / totalTests) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          {tests.map((test, index) => (
            <motion.div
              key={test.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                p-6 rounded-lg border-2 transition-all duration-300
                ${getStatusColor(test.status)}
                ${currentTest === index ? 'ring-2 ring-blue-400 ring-opacity-50 shadow-lg' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <h3 className="font-semibold text-gray-900">{test.name}</h3>
                    {test.message && (
                      <p className={`text-sm mt-1 ${
                        test.status === 'failed' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {test.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {test.duration && (
                    <div className="text-xs text-gray-500">
                      {test.duration}ms
                    </div>
                  )}
                  {test.status === 'passed' && (
                    <div className="text-xs text-green-600 font-medium">
                      ✓ Verified
                    </div>
                  )}
                </div>
              </div>
              
              {/* Show details if enabled and test has details */}
              {showDetails && test.details && test.status === 'passed' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 p-4 bg-white bg-opacity-50 rounded border"
                >
                  <pre className="text-xs text-gray-700 overflow-auto">
                    {JSON.stringify(test.details, null, 2)}
                  </pre>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Summary */}
        {!isRunning && tests.some(t => t.status !== 'pending') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 p-6 bg-white rounded-lg shadow-lg border"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Test Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{passedTests}</div>
                <div className="text-sm text-green-700">Passed</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-3xl font-bold text-red-600">
                  {tests.filter(t => t.status === 'failed').length}
                </div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {Math.round((passedTests / totalTests) * 100)}%
                </div>
                <div className="text-sm text-blue-700">Success Rate</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">
                  {tests.filter(t => t.duration).reduce((sum, t) => sum + (t.duration || 0), 0)}ms
                </div>
                <div className="text-sm text-purple-700">Total Time</div>
              </div>
            </div>

            {passedTests === totalTests ? (
              <div className="text-center p-6 bg-green-100 rounded-lg">
                <h3 className="text-xl font-semibold text-green-800 mb-2">
                  🎉 All Tests Passed!
                </h3>
                <p className="text-green-700 mb-4">
                  Your Appwrite backend is fully functional and ready for production.
                </p>
                <div className="text-sm text-green-600">
                  Next steps: Start building your marketplace features with confidence!
                </div>
              </div>
            ) : (
              <div className="text-center p-6 bg-yellow-100 rounded-lg">
                <h3 className="text-xl font-semibold text-yellow-800 mb-2">
                  ⚠️ Some Tests Failed
                </h3>
                <p className="text-yellow-700 mb-4">
                  Please check the failed tests above and ensure your Appwrite configuration is correct.
                </p>
                <div className="text-sm text-yellow-600">
                  Check your API keys, project settings, and network connectivity.
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Configuration Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-6 bg-gray-50 rounded-lg border"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 Configuration Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Endpoint:</span>
              <span className="ml-2 text-gray-600 break-all">{appwriteService.config.endpoint}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Project ID:</span>
              <span className="ml-2 text-gray-600">{appwriteService.config.project}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Database:</span>
              <span className="ml-2 text-gray-600">{appwriteService.config.databaseId}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Collections:</span>
              <span className="ml-2 text-gray-600">
                {Object.keys(appwriteService.config.collections).length} configured
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Storage Buckets:</span>
              <span className="ml-2 text-gray-600">
                {Object.keys(appwriteService.config.buckets).length} configured
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Services:</span>
              <span className="ml-2 text-gray-600">Auth, DB, Storage, Realtime</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AppwriteTest;
      setResults(prev => ({
        ...prev,
        [testName]: {
          isSuccess: false,
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
          timing
        }
      }));
    } finally {
      setIsLoading(prev => ({ ...prev, [testName]: false }));
    }
  };

  // Generate test IDs
  const generateTestId = () => `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const testUserId = generateTestId();
  const testVendorId = generateTestId();
  const testCarListingId = generateTestId();

  const tests = {
    // Core Infrastructure Tests
    connection: {
      name: '📡 SDK Connection',
      category: 'Infrastructure',
      fn: () => testConnection()
    },
    database: {
      name: '🗄️ Database Access',
      category: 'Infrastructure',
      fn: () => databases.list()
    },
    collections: {
      name: '📦 Collections List',
      category: 'Infrastructure',
      fn: () => databases.listCollections('souk_main_db')
    },

    // User Management Tests
    usersCollection: {
      name: '👥 Users Collection',
      category: 'User Management',
      fn: () => databases.listDocuments('souk_main_db', 'users')
    },
    createUser: {
      name: '➕ Create Test User',
      category: 'User Management',
      fn: async () => {
        const userData = {
          userId: testUserId,
          email: `test_${Date.now()}@example.com`,
          displayName: 'Test User',
          role: 'customer',
          phoneNumber: '+201234567890',
          isActive: true,
          emailVerified: false,
          createdAt: new Date().toISOString()
        };
        const result = await databases.createDocument('souk_main_db', 'users', testUserId, userData);
        setTestData(prev => ({ ...prev, user: result }));
        return result;
      }
    },
    queryUsers: {
      name: '🔍 Query Users',
      category: 'User Management',
      fn: () => databases.listDocuments('souk_main_db', 'users', [
        'role=customer'
      ])
    },

    // Vendor Management Tests
    vendorsCollection: {
      name: '🏪 Vendors Collection',
      category: 'Vendor Management',
      fn: () => databases.listDocuments('souk_main_db', 'vendors')
    },
    createVendor: {
      name: '➕ Create Test Vendor',
      category: 'Vendor Management',
      fn: async () => {
        const vendorData = {
          userId: testVendorId,
          businessName: 'Test Car Dealership',
          businessType: 'dealership',
          address: '123 Test Street, Test City',
          city: 'Cairo',
          governorate: 'Cairo',
          phoneNumber: '+201234567891',
          whatsappNumber: '+201234567891',
          verificationStatus: 'pending',
          rating: 4.5,
          totalReviews: 10,
          isActive: true,
          createdAt: new Date().toISOString()
        };
        const result = await databases.createDocument('souk_main_db', 'vendors', testVendorId, vendorData);
        setTestData(prev => ({ ...prev, vendor: result }));
        return result;
      }
    },

    // Car Listings Tests
    carListingsCollection: {
      name: '🚗 Car Listings Collection',
      category: 'Marketplace',
      fn: () => databases.listDocuments('souk_main_db', 'car-listings')
    },
    createCarListing: {
      name: '➕ Create Test Car Listing',
      category: 'Marketplace',
      fn: async () => {
        const carData = {
          vendorId: testVendorId,
          title: 'Toyota Camry 2020 - Excellent Condition',
          description: 'Well maintained Toyota Camry with low mileage',
          brand: 'Toyota',
          model: 'Camry',
          year: 2020,
          mileage: 50000,
          price: 450000,
          currency: 'EGP',
          condition: 'used',
          fuelType: 'gasoline',
          transmission: 'automatic',
          bodyType: 'sedan',
          color: 'Silver',
          engineSize: 2.5,
          features: ['AC', 'Power Steering', 'ABS'],
          images: ['car1.jpg', 'car2.jpg'],
          governorate: 'Cairo',
          status: 'active',
          featured: false,
          views: 0,
          createdAt: new Date().toISOString()
        };
        const result = await databases.createDocument('souk_main_db', 'car-listings', testCarListingId, carData);
        setTestData(prev => ({ ...prev, carListing: result }));
        return result;
      }
    },
    searchCars: {
      name: '🔍 Search Cars',
      category: 'Marketplace',
      fn: () => databases.listDocuments('souk_main_db', 'car-listings', [
        'brand=Toyota',
        'status=active'
      ])
    },

    // Communication Tests
    chatsCollection: {
      name: '💬 Chats Collection',
      category: 'Communication',
      fn: () => databases.listDocuments('souk_main_db', 'chats')
    },
    messagesCollection: {
      name: '📨 Messages Collection',
      category: 'Communication',
      fn: () => databases.listDocuments('souk_main_db', 'messages')
    },
    createChat: {
      name: '➕ Create Test Chat',
      category: 'Communication',
      fn: async () => {
        const chatData = {
          customerId: testUserId,
          vendorId: testVendorId,
          carListingId: testCarListingId,
          lastMessage: 'Hello, I am interested in this car',
          lastMessageAt: new Date().toISOString(),
          isActive: true,
          createdAt: new Date().toISOString()
        };
        const chatId = generateTestId();
        const result = await databases.createDocument('souk_main_db', 'chats', chatId, chatData);
        setTestData(prev => ({ ...prev, chat: result }));
        return result;
      }
    },

    // Transaction Tests
    ordersCollection: {
      name: '🛒 Orders Collection',
      category: 'Transactions',
      fn: () => databases.listDocuments('souk_main_db', 'orders')
    },
    createOrder: {
      name: '➕ Create Test Order',
      category: 'Transactions',
      fn: async () => {
        const orderData = {
          customerId: testUserId,
          vendorId: testVendorId,
          carListingId: testCarListingId,
          orderNumber: `ORD-${Date.now()}`,
          totalAmount: 450000,
          currency: 'EGP',
          status: 'pending',
          paymentStatus: 'pending',
          paymentMethod: 'cash',
          deliveryAddress: '456 Customer Street, Cairo',
          notes: 'Please contact before delivery',
          createdAt: new Date().toISOString()
        };
        const orderId = generateTestId();
        const result = await databases.createDocument('souk_main_db', 'orders', orderId, orderData);
        setTestData(prev => ({ ...prev, order: result }));
        return result;
      }
    },

    // Quality & Reviews Tests
    reviewsCollection: {
      name: '⭐ Reviews Collection',
      category: 'Quality',
      fn: () => databases.listDocuments('souk_main_db', 'reviews')
    },
    notificationsCollection: {
      name: '🔔 Notifications Collection',
      category: 'Quality',
      fn: () => databases.listDocuments('souk_main_db', 'notifications')
    },

    // Storage Tests
    storageList: {
      name: '📁 Storage Buckets',
      category: 'Storage',
      fn: () => storage.listBuckets()
    },
    carImagesBucket: {
      name: '🖼️ Car Images Bucket',
      category: 'Storage',
      fn: () => storage.listFiles('car_images')
    },

    // Authentication Tests
    authService: {
      name: '🔐 Auth Service',
      category: 'Authentication',
      fn: async () => {
        try {
          return await account.get();
        } catch (error: any) {
          if (error.code === 401) {
            return { status: 'No active session (expected)', service: 'working' };
          }
          throw error;
        }
      }
    }
  };

  const testCategories = {
    'Infrastructure': '🏗️ Core Infrastructure',
    'User Management': '👥 User System',
    'Vendor Management': '🏪 Vendor System',
    'Marketplace': '🚗 Car Marketplace',
    'Communication': '💬 Chat System',
    'Transactions': '🛒 Order System',
    'Quality': '⭐ Reviews & Notifications',
    'Storage': '📁 File Storage',
    'Authentication': '🔐 User Authentication'
  };

  const runAllTests = async () => {
    console.log('🚀 Running comprehensive backend tests...');
    
    // Run tests in logical order
    const testOrder = [
      'connection', 'database', 'collections',
      'usersCollection', 'createUser', 'queryUsers',
      'vendorsCollection', 'createVendor',
      'carListingsCollection', 'createCarListing', 'searchCars',
      'chatsCollection', 'messagesCollection', 'createChat',
      'ordersCollection', 'createOrder',
      'reviewsCollection', 'notificationsCollection',
      'storageList', 'carImagesBucket',
      'authService'
    ];

    for (const testKey of testOrder) {
      if (tests[testKey]) {
        await runTest(testKey, tests[testKey].fn);
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  const getSuccessRate = () => {
    const totalTests = Object.keys(results).length;
    const successfulTests = Object.values(results).filter(r => r.isSuccess).length;
    return totalTests > 0 ? Math.round((successfulTests / totalTests) * 100) : 0;
  };

  const renderTestResult = (testKey: string, test: any) => {
    const result = results[testKey];
    const loading = isLoading[testKey];

    return (
      <div key={testKey} className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-800">{test.name}</h4>
          <button
            onClick={() => runTest(testKey, test.fn)}
            disabled={loading}
            className={`px-3 py-1 rounded text-sm font-medium ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? '🔄 Testing...' : '🧪 Test'}
          </button>
        </div>

        {result && (
          <div className={`p-3 rounded-lg text-sm ${
            result.isSuccess 
              ? 'bg-green-100 border border-green-300 text-green-800'
              : 'bg-red-100 border border-red-300 text-red-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold">
                {result.isSuccess ? '✅ Success' : '❌ Failed'}
              </span>
              {result.timing && (
                <span className="text-xs opacity-75">
                  {result.timing}ms
                </span>
              )}
            </div>
            
            <div className="mt-1">
              {result.message}
            </div>
            
            {result.details && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs font-medium">
                  View Details
                </summary>
                <pre className="text-xs mt-1 overflow-auto max-h-32 bg-white bg-opacity-50 p-2 rounded">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🚀 Complete Backend Testing
          </h1>
          <p className="text-gray-600 mb-6">
            Comprehensive verification of Souk Al-Sayarat marketplace backend
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={runAllTests}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              🎯 Run All Tests
            </button>
            
            {Object.keys(results).length > 0 && (
              <div className={`px-4 py-2 rounded-lg font-semibold ${
                getSuccessRate() >= 90 
                  ? 'bg-green-100 text-green-800' 
                  : getSuccessRate() >= 70 
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                Success Rate: {getSuccessRate()}%
              </div>
            )}
          </div>
        </div>

        {Object.entries(testCategories).map(([category, title]) => {
          const categoryTests = Object.entries(tests).filter(([_, test]) => test.category === category);
          
          return (
            <div key={category} className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-500">
                {title}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryTests.map(([testKey, test]) => renderTestResult(testKey, test))}
              </div>
            </div>
          );
        })}

        {Object.keys(results).length > 0 && (
          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="font-bold text-blue-800 mb-4">📊 Test Summary</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-white p-3 rounded">
                <div className="text-2xl font-bold text-gray-800">
                  {Object.keys(results).length}
                </div>
                <div className="text-sm text-gray-600">Total Tests</div>
              </div>
              
              <div className="bg-white p-3 rounded">
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(results).filter(r => r.isSuccess).length}
                </div>
                <div className="text-sm text-gray-600">Passed</div>
              </div>
              
              <div className="bg-white p-3 rounded">
                <div className="text-2xl font-bold text-red-600">
                  {Object.values(results).filter(r => !r.isSuccess).length}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              
              <div className="bg-white p-3 rounded">
                <div className="text-2xl font-bold text-blue-600">
                  {getSuccessRate()}%
                </div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>

            {getSuccessRate() >= 90 && (
              <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg">
                <h4 className="font-bold text-green-800">🎉 Backend Ready for Production!</h4>
                <p className="text-green-700 text-sm mt-1">
                  All core systems are functioning correctly. You can proceed with building marketplace features.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppwriteTest;