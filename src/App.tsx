/**
 * PROFESSIONAL APP COMPONENT
 * Integrates all features with proper error handling
 * Maintains Egyptian theme consistency
 */

import React, { Suspense, useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

// Layout Components
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoadingScreen from '@/components/ui/LoadingScreen';

// Direct imports for critical pages
import HomePage from '@/pages/HomePage';
import NotFoundPage from '@/pages/NotFoundPage';

// Professional lazy loading with error handling
const lazyLoadWithRetry = (
  importFunc: () => Promise<any>,
  componentName: string,
  retries = 3
) => {
  return React.lazy(async () => {
    try {
      return await importFunc();
    } catch (error) {
      if (retries > 0) {
        console.warn(`Retrying load of ${componentName}, attempts left: ${retries}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return lazyLoadWithRetry(importFunc, componentName, retries - 1)();
      }
      console.error(`Failed to load ${componentName}:`, error);
      // Return a fallback component
      return {
        default: () => (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-500 mb-4">
                Failed to load {componentName}
              </h2>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                Reload Page
              </button>
            </div>
          </div>
        )
      };
    }
  });
};

// Lazy load other pages with retry logic
const LoginPage = lazyLoadWithRetry(() => import('@/pages/auth/LoginPage'), 'LoginPage');
const RegisterPage = lazyLoadWithRetry(() => import('@/pages/auth/RegisterPage'), 'RegisterPage');
const MarketplacePage = lazyLoadWithRetry(() => import('@/pages/customer/MarketplacePage'), 'MarketplacePage');
const ProductDetailsPage = lazyLoadWithRetry(() => import('@/pages/customer/ProductDetailsPage'), 'ProductDetailsPage');
const CartPage = lazyLoadWithRetry(() => import('@/pages/customer/CartPage'), 'CartPage');
const WishlistPage = lazyLoadWithRetry(() => import('@/pages/customer/WishlistPage'), 'WishlistPage');
const CheckoutPage = lazyLoadWithRetry(() => import('@/pages/customer/CheckoutPage'), 'CheckoutPage');
const ProfilePage = lazyLoadWithRetry(() => import('@/pages/customer/ProfilePage'), 'ProfilePage');
const OrdersPage = lazyLoadWithRetry(() => import('@/pages/customer/OrdersPage'), 'OrdersPage');
const VendorDashboard = lazyLoadWithRetry(() => import('@/pages/vendor/VendorDashboard'), 'VendorDashboard');
const AdminDashboard = lazyLoadWithRetry(() => import('@/pages/admin/AdminDashboard'), 'AdminDashboard');

// Professional Firebase initialization with error handling
const initializeFirebaseApp = async () => {
  try {
    const { initializeFirebase } = await import('@/config/firebase.config');
    await initializeFirebase();
    return true;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    // App can still work without Firebase for demo purposes
    return false;
  }
};

// Professional route configuration
const routes = [
  { path: '/', element: HomePage, name: 'Home' },
  { path: '/login', element: LoginPage, name: 'Login' },
  { path: '/register', element: RegisterPage, name: 'Register' },
  { path: '/marketplace', element: MarketplacePage, name: 'Marketplace' },
  { path: '/product/:id', element: ProductDetailsPage, name: 'Product Details' },
  { path: '/cart', element: CartPage, name: 'Cart' },
  { path: '/wishlist', element: WishlistPage, name: 'Wishlist' },
  { path: '/checkout', element: CheckoutPage, name: 'Checkout' },
  { path: '/profile', element: ProfilePage, name: 'Profile' },
  { path: '/orders', element: OrdersPage, name: 'Orders' },
  { path: '/vendor/dashboard', element: VendorDashboard, name: 'Vendor Dashboard' },
  { path: '/admin/dashboard', element: AdminDashboard, name: 'Admin Dashboard' },
];

// Page transition animations
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const ProfessionalApp: React.FC = () => {
  const location = useLocation();
  const [firebaseReady, setFirebaseReady] = useState<boolean | null>(null);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Initialize Firebase
    initializeFirebaseApp().then(success => {
      setFirebaseReady(success);
      setAppReady(true);
      console.log(`Firebase initialized: ${success ? 'Success' : 'Failed (Demo mode)'}`);
    });
  }, []);

  // Show loading screen while initializing
  if (!appReady) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 transition-all duration-500">
      {/* Navigation */}
      <Navbar />

      {/* Firebase Status Banner (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className={`text-center py-2 text-sm font-medium ${
          firebaseReady ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          Firebase: {firebaseReady ? '✅ Connected' : '⚠️ Demo Mode'}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <Suspense fallback={<LoadingScreen />}>
            <Routes location={location} key={location.pathname}>
              {/* Map all routes */}
              {routes.map(({ path, element: Component, name }) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    <motion.div
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.3 }}
                    >
                      <Component />
                    </motion.div>
                  }
                />
              ))}
              
              {/* 404 Route */}
              <Route
                path="*"
                element={
                  <motion.div
                    variants={pageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <NotFoundPage />
                  </motion.div>
                }
              />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer />

      {/* Toast Notifications */}
      <Toaster position="bottom-right" />
    </div>
  );
};

export default ProfessionalApp;