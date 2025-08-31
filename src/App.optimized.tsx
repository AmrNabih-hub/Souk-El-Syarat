import React, { useEffect, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { useRealtimeStore } from '@/stores/realtimeStore';
import { PushNotificationService } from '@/services/push-notification.service';
import { AuthService } from '@/services/auth.service';

// Layout Components - Always loaded
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoadingScreen from '@/components/ui/LoadingScreen';

// Enhanced lazy loading with retry and preload
import { lazyWithPreload, batchPreload, componentLoader } from '@/utils/lazyWithRetry';

// Lazy load pages with preload capability
const HomePage = lazyWithPreload(() => import('@/pages/HomePage'));
const LoginPage = lazyWithPreload(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazyWithPreload(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazyWithPreload(() => import('@/pages/auth/ForgotPasswordPage'));
const VendorApplicationPage = lazyWithPreload(() => import('@/pages/VendorApplicationPage'));
const MarketplacePage = lazyWithPreload(() => import('@/pages/customer/MarketplacePage'));
const ProductDetailsPage = lazyWithPreload(() => import('@/pages/customer/ProductDetailsPage'));
const VendorsPage = lazyWithPreload(() => import('@/pages/customer/VendorsPage'));
const CartPage = lazyWithPreload(() => import('@/pages/customer/CartPage'));
const ProfilePage = lazyWithPreload(() => import('@/pages/customer/ProfilePage'));

// Dashboard pages - Lower priority
const AdminDashboard = lazyWithPreload(() => import('@/pages/admin/AdminDashboard'));
const VendorDashboard = lazyWithPreload(() => import('@/pages/vendor/VendorDashboard'));
const CustomerDashboard = lazyWithPreload(() => import('@/pages/customer/CustomerDashboard'));

// Register components for priority loading
componentLoader.register('HomePage', () => HomePage.preload(), 'high');
componentLoader.register('MarketplacePage', () => MarketplacePage.preload(), 'high');
componentLoader.register('LoginPage', () => LoginPage.preload(), 'medium');

// Protected Route Component with optimization
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  roles?: string[];
  redirectTo?: string;
}> = React.memo(({ children, roles, redirectTo = '/login' }) => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen message='جاري التحقق من الصلاحيات...' />;
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to='/' replace />;
  }

  return <>{children}</>;
});

// Public Route Component
const PublicRoute: React.FC<{
  children: React.ReactNode;
}> = React.memo(({ children }) => {
  const { user } = useAuthStore();

  if (user) {
    // Redirect based on user role
    switch (user.role) {
      case 'admin':
        return <Navigate to='/admin/dashboard' replace />;
      case 'vendor':
        return <Navigate to='/vendor/dashboard' replace />;
      case 'customer':
        return <Navigate to='/dashboard' replace />;
      default:
        return <Navigate to='/' replace />;
    }
  }

  return <>{children}</>;
});

// Optimized page transition animations
const pageVariants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.2, // Faster transitions
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

// Route wrapper for consistent animations
const AnimatedRoute: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => (
  <motion.div
    variants={pageVariants}
    initial='initial'
    animate='animate'
    exit='exit'
  >
    {children}
  </motion.div>
));

function App() {
  const { setUser, setLoading, user } = useAuthStore();
  const { language, theme } = useAppStore();
  const { initialize: initializeRealtime, cleanup: cleanupRealtime } = useRealtimeStore();

  // Preload critical components based on user behavior
  useEffect(() => {
    // Preload components likely to be needed next
    if (user) {
      if (user.role === 'admin') {
        AdminDashboard.preload();
      } else if (user.role === 'vendor') {
        VendorDashboard.preload();
      } else {
        // Preload shopping components for customers
        CartPage.preload();
        ProductDetailsPage.preload();
      }
    } else {
      // Preload auth pages for non-logged users
      LoginPage.preload();
      RegisterPage.preload();
    }
  }, [user]);

  // Set up authentication state listener
  useEffect(() => {
    setLoading(true);

    const unsubscribe = AuthService.onAuthStateChange(user => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  // Initialize real-time services when user logs in
  useEffect(() => {
    if (user) {
      // Initialize real-time services
      initializeRealtime(user.id).catch(error => {
        // Silent handling - service will continue without real-time features
        if (process.env.NODE_ENV === 'development') {
          // console.error('Failed to initialize real-time services:', error);
        }
      });

      // Initialize push notifications with retry
      const initPushNotifications = async () => {
        let retries = 3;
        while (retries > 0) {
          try {
            await PushNotificationService.initialize(user.id);
            break;
          } catch (error) {
            retries--;
            if (retries === 0 && process.env.NODE_ENV === 'development') {
              // console.error('Failed to initialize push notifications after 3 attempts:', error);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      };
      
      initPushNotifications();

      // Subscribe to user-specific topics based on role
      if (user.role === 'vendor') {
        PushNotificationService.subscribeToTopic(user.id, 'vendor-notifications');
        PushNotificationService.subscribeToTopic(user.id, 'order-updates');
      } else if (user.role === 'customer') {
        PushNotificationService.subscribeToTopic(user.id, 'customer-notifications');
        PushNotificationService.subscribeToTopic(user.id, 'promotions');
      } else if (user.role === 'admin') {
        PushNotificationService.subscribeToTopic(user.id, 'admin-notifications');
        PushNotificationService.subscribeToTopic(user.id, 'system-alerts');
      }
    } else {
      // Clean up real-time services when user logs out
      cleanupRealtime();
    }

    // Cleanup on unmount
    return () => {
      if (!user) {
        cleanupRealtime();
      }
    };
  }, [user, initializeRealtime, cleanupRealtime]);

  // Set document direction and theme
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.documentElement.className = theme === 'dark' ? 'dark' : '';
  }, [language, theme]);

  // Preload components on route hover
  const handleRouteHover = (component: any) => {
    if (component && typeof component.preload === 'function') {
      component.preload();
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 transition-all duration-500'>
      <Navbar />

      <main className='flex-1'>
        <AnimatePresence mode='wait'>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              {/* Public Routes */}
              <Route
                path='/'
                element={
                  <AnimatedRoute>
                    <HomePage />
                  </AnimatedRoute>
                }
              />

              <Route
                path='/marketplace'
                element={
                  <AnimatedRoute>
                    <MarketplacePage />
                  </AnimatedRoute>
                }
              />

              <Route
                path='/product/:id'
                element={
                  <AnimatedRoute>
                    <ProductDetailsPage />
                  </AnimatedRoute>
                }
              />

              <Route
                path='/vendors'
                element={
                  <AnimatedRoute>
                    <VendorsPage />
                  </AnimatedRoute>
                }
              />

              <Route
                path='/vendor/apply'
                element={
                  <AnimatedRoute>
                    <VendorApplicationPage />
                  </AnimatedRoute>
                }
              />

              {/* Authentication Routes */}
              <Route
                path='/login'
                element={
                  <PublicRoute>
                    <AnimatedRoute>
                      <LoginPage />
                    </AnimatedRoute>
                  </PublicRoute>
                }
              />

              <Route
                path='/register'
                element={
                  <PublicRoute>
                    <AnimatedRoute>
                      <RegisterPage />
                    </AnimatedRoute>
                  </PublicRoute>
                }
              />

              <Route
                path='/forgot-password'
                element={
                  <PublicRoute>
                    <AnimatedRoute>
                      <ForgotPasswordPage />
                    </AnimatedRoute>
                  </PublicRoute>
                }
              />

              {/* Protected Routes */}
              <Route
                path='/cart'
                element={
                  <ProtectedRoute>
                    <AnimatedRoute>
                      <CartPage />
                    </AnimatedRoute>
                  </ProtectedRoute>
                }
              />

              <Route
                path='/profile'
                element={
                  <ProtectedRoute>
                    <AnimatedRoute>
                      <ProfilePage />
                    </AnimatedRoute>
                  </ProtectedRoute>
                }
              />

              {/* Customer Dashboard */}
              <Route
                path='/dashboard'
                element={
                  <ProtectedRoute roles={['customer']}>
                    <AnimatedRoute>
                      <CustomerDashboard />
                    </AnimatedRoute>
                  </ProtectedRoute>
                }
              />

              {/* Vendor Dashboard */}
              <Route
                path='/vendor/dashboard/*'
                element={
                  <ProtectedRoute roles={['vendor']}>
                    <AnimatedRoute>
                      <VendorDashboard />
                    </AnimatedRoute>
                  </ProtectedRoute>
                }
              />

              {/* Admin Dashboard */}
              <Route
                path='/admin/dashboard'
                element={
                  <ProtectedRoute roles={['admin']}>
                    <AnimatedRoute>
                      <AdminDashboard />
                    </AnimatedRoute>
                  </ProtectedRoute>
                }
              />

              {/* 404 Page */}
              <Route
                path='*'
                element={
                  <AnimatedRoute>
                    <div className='min-h-screen flex items-center justify-center'>
                      <div className='text-center'>
                        <h1 className='text-6xl font-bold text-neutral-900 mb-4'>404</h1>
                        <p className='text-xl text-neutral-600 mb-8'>
                          {language === 'ar' ? 'الصفحة غير موجودة' : 'Page not found'}
                        </p>
                        <Navigate to='/' replace />
                      </div>
                    </div>
                  </AnimatedRoute>
                }
              />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}

export default App;
