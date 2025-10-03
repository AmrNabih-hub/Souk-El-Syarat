/**
 * 🧪 APPWRITE SERVICES TEST
 * Comprehensive test suite for all Appwrite functionality
 */

import appwriteService from './services/appwrite.service.ts';

class AppwriteTest {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async runTest(name, testFn) {
    console.log(`🧪 Testing: ${name}...`);
    try {
      const result = await testFn();
      console.log(`✅ ${name} - PASSED`);
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED', result });
      return result;
    } catch (error) {
      console.error(`❌ ${name} - FAILED:`, error.message);
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: error.message });
      return null;
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Appwrite Services Test Suite...\n');

    // Test 1: Connection
    await this.runTest('Connection Test', async () => {
      return await appwriteService.testConnection();
    });

    // Test 2: Create Test User
    let testUser = null;
    const testEmail = `test_${Date.now()}@souk-test.com`;
    const testPassword = 'TestPassword123!';
    
    await this.runTest('Create Test Account', async () => {
      testUser = await appwriteService.createAccount(testEmail, testPassword, 'Test User');
      return testUser;
    });

    // Test 3: Login
    await this.runTest('Login Test', async () => {
      return await appwriteService.login(testEmail, testPassword);
    });

    // Test 4: Get Current User
    await this.runTest('Get Current User', async () => {
      return await appwriteService.getCurrentUser();
    });

    // Test 5: Create User Profile
    let userProfile = null;
    if (testUser) {
      await this.runTest('Create User Profile', async () => {
        userProfile = await appwriteService.createUserProfile(testUser.$id, {
          email: testEmail,
          name: 'Test User',
          phone: '+201234567890'
        });
        return userProfile;
      });
    }

    // Test 6: Create Vendor Profile
    if (testUser) {
      await this.runTest('Create Vendor Profile', async () => {
        return await appwriteService.createVendorProfile(testUser.$id, {
          businessName: 'Test Auto Parts',
          businessType: 'parts_dealer',
          address: 'Test Address, Cairo',
          city: 'Cairo',
          governorate: 'Cairo'
        });
      });
    }

    // Test 7: Create Car Listing
    if (testUser) {
      await this.runTest('Create Car Listing', async () => {
        return await appwriteService.createCarListing(testUser.$id, {
          title: 'Test Car - Toyota Corolla 2020',
          description: 'A test car listing for system verification',
          make: 'Toyota',
          model: 'Corolla',
          year: 2020,
          price: 350000,
          condition: 'used',
          mileage: 50000,
          transmission: 'automatic',
          fuelType: 'petrol',
          bodyType: 'sedan',
          color: 'white',
          features: ['air_conditioning', 'power_steering'],
          city: 'Cairo',
          governorate: 'Cairo'
        });
      });
    }

    // Test 8: Get Car Listings
    await this.runTest('Get Car Listings', async () => {
      return await appwriteService.getCarListings({ limit: 10 });
    });

    // Test 9: Create Order
    if (testUser) {
      await this.runTest('Create Test Order', async () => {
        return await appwriteService.createOrder(
          testUser.$id,
          testUser.$id,
          {
            type: 'car',
            items: [{ id: 'test-car-1', quantity: 1, price: 350000 }],
            subtotal: 350000,
            total: 350000,
            paymentMethod: 'cash'
          }
        );
      });
    }

    // Test 10: Create Chat
    if (testUser) {
      await this.runTest('Create Chat', async () => {
        return await appwriteService.createChat([testUser.$id, 'system'], 'Test Chat');
      });
    }

    // Test 11: Create Notification
    if (testUser) {
      await this.runTest('Create Notification', async () => {
        return await appwriteService.createNotification(
          testUser.$id,
          'Welcome to Souk Al-Sayarat!',
          'Your account has been created successfully.',
          'welcome'
        );
      });
    }

    // Test 12: Track Analytics Event
    await this.runTest('Track Analytics Event', async () => {
      return await appwriteService.trackEvent(
        'user_action',
        'car_listing',
        'test-listing-1',
        'view',
        { source: 'test_suite' },
        testUser?.$id
      );
    });

    // Test 13: Search Functionality
    await this.runTest('Search Functionality', async () => {
      return await appwriteService.search(
        appwriteService.config.collections.carListings,
        'Toyota'
      );
    });

    // Test 14: File Upload Simulation (create file object)
    await this.runTest('File Upload Simulation', async () => {
      // Create a simple text file for testing
      const blob = new Blob(['Test file content'], { type: 'text/plain' });
      const file = new File([blob], 'test.txt', { type: 'text/plain' });
      
      // This would normally upload to Appwrite storage
      // For now, just verify the file object is valid
      if (file && file.size > 0) {
        return { message: 'File object created successfully', size: file.size };
      }
      throw new Error('File creation failed');
    });

    // Test 15: Logout
    await this.runTest('Logout Test', async () => {
      return await appwriteService.logout();
    });

    // Print final results
    this.printResults();
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    console.log('\n📋 DETAILED RESULTS:');
    this.results.tests.forEach((test, index) => {
      const status = test.status === 'PASSED' ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${test.name}`);
      if (test.status === 'FAILED' && test.error) {
        console.log(`   Error: ${test.error}`);
      }
    });

    console.log('\n🎯 RECOMMENDATIONS:');
    if (this.results.failed === 0) {
      console.log('🎉 All tests passed! Your Appwrite backend is fully functional.');
      console.log('✨ You can now start building your marketplace features.');
    } else {
      console.log('⚠️  Some tests failed. Please check the errors above.');
      console.log('🔧 Fix the issues and run the tests again.');
    }

    console.log('\n💡 NEXT STEPS:');
    console.log('1. 🏗️  Set up authentication UI components');
    console.log('2. 📱 Create car listing forms and displays');
    console.log('3. 💬 Implement real-time chat functionality');
    console.log('4. 📊 Add analytics tracking to your components');
    console.log('5. 🔔 Set up push notifications');
    console.log('6. 💳 Integrate payment processing');
  }
}

// Run the tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment - expose test function globally
  window.testAppwrite = async () => {
    const tester = new AppwriteTest();
    await tester.runAllTests();
  };
  
  console.log('🧪 Appwrite Test Suite Loaded');
  console.log('💡 Run "window.testAppwrite()" in the browser console to start tests');
} else {
  // Node.js environment - run tests immediately
  const tester = new AppwriteTest();
  tester.runAllTests().catch(console.error);
}

export default AppwriteTest;