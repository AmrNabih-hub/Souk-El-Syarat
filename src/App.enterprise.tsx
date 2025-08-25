/**
 * Enterprise Application Entry Point
 * Advanced integration with performance monitoring, security, and error handling
 */

import React, { useEffect, Suspense, useMemo } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Enterprise Systems
import { EnterpriseErrorBoundary, ErrorBoundaryConfigs } from '@/lib/errors/EnterpriseErrorBoundary';
import { performanceMonitor, usePerformanceMonitor } from '@/lib/performance/PerformanceMonitor';
import { securityManager, useSecurity } from '@/lib/security/SecurityManager';

// Store Management
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { useRealtimeStore } from '@/stores/realtimeStore';

// Services
import { PushNotificationService } from '@/services/push-notification.service';
import { AuthService } from '@/services/auth.service';

// Layout Components
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import RobustLoadingScreen from '@/components/ui/RobustLoadingScreen';

// Enhanced Components
import FuturisticAdminDashboard from '@/pages/admin/FuturisticAdminDashboard';
import AdvancedUserProfile from '@/pages/customer/AdvancedUserProfile';
import { EnhancedAuthModal } from '@/components/auth/EnhancedAuthModal';

// Lazy load pages for optimal performance
const HomePage = React.lazy(() => import('@/pages/HomePage'));
const LoginPage = React.lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const VendorApplicationPage = React.lazy(() => import('@/pages/VendorApplicationPage'));
const MarketplacePage = React.lazy(() => import('@/pages/customer/MarketplacePage'));
const ProductDetailsPage = React.lazy(() => import('@/pages/customer/ProductDetailsPage'));
const VendorsPage = React.lazy(() => import('@/pages/customer/VendorsPage'));
const CartPage = React.lazy(() => import('@/pages/customer/CartPage'));

// Dashboard pages
const CustomerDashboard = React.lazy(() => import('@/pages/customer/CustomerDashboard'));
const VendorDashboard = React.lazy(() => import('@/pages/vendor/VendorDashboard'));
const AdminDashboard = React.lazy(() => import('@/pages/admin/AdminDashboard'));

// Page transition animations
const pageVariants = {
  initial: { 
    opacity: 0, 
    x: -20,
    scale: 0.98,
  },
  animate: { 
    opacity: 1, 
    x: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: { 
    opacity: 0, 
    x: 20,
    scale: 0.98,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

// Enhanced Route Component with Performance Tracking
const EnhancedRoute: React.FC<{
  path: string;
  element: React.ReactElement;
  name: string;
}> = ({ element, name }) => {
  const { trackRoute } = usePerformanceMonitor();
  const location = useLocation();

  useEffect(() => {
    const endTracking = trackRoute(name);
    
    // Track page view
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', 'GA_MEASUREMENT_ID', {
        page_title: name,
        page_location: window.location.href,
      });
    }

    return endTracking;
  }, [name, location.pathname, trackRoute]);

  return (
    <motion.div
      key={location.pathname}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen"
    >
      <EnterpriseErrorBoundary {...ErrorBoundaryConfigs.page} name={`${name}Page`}>
        {element}
      </EnterpriseErrorBoundary>
    </motion.div>
  );
};

// Main Enterprise Application Component
const EnterpriseApp: React.FC = () => {
  const { user, initializeAuth, isLoading: authLoading } = useAuthStore();
  const { initialize: initializeApp, isLoading: appLoading } = useAppStore();
  const { initialize: initializeRealtime } = useRealtimeStore();
  
  const { manager: securityMgr } = useSecurity();
  const { monitor: perfMonitor } = usePerformanceMonitor();

  // Initialize enterprise systems
  useEffect(() => {
    const initializeEnterpriseSystems = async () => {
      try {
        console.log('🚀 Initializing enterprise systems...');

        // Initialize core services
        await Promise.all([
          initializeAuth(),
          initializeApp(),
          initializeRealtime(),
        ]);

        // Initialize push notifications
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          PushNotificationService.initialize();
        }

        // Setup performance monitoring
        perfMonitor.startMonitoring();
        
        // Setup security monitoring
        securityMgr.startMonitoring();

        console.log('✅ Enterprise systems initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize enterprise systems:', error);
        
        // Record security event for initialization failure
        securityMgr.recordSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY' as any,
          level: 'MEDIUM' as any,
          details: { error: error.message, phase: 'initialization' },
          blocked: false,
          automated: true,
        });
      }
    };

    initializeEnterpriseSystems();

    // Cleanup on unmount
    return () => {
      perfMonitor.stopMonitoring();
      securityMgr.stopMonitoring();
    };
  }, [initializeAuth, initializeApp, initializeRealtime, perfMonitor, securityMgr]);

  // Performance monitoring for route changes
  const location = useLocation();
  useEffect(() => {
    // Track route changes
    if (typeof window !== 'undefined') {
      const endTracking = perfMonitor.trackRouteChange(location.pathname);
      return endTracking;
    }
  }, [location.pathname, perfMonitor]);

  // Loading state with enterprise loading screen
  const isLoading = authLoading || appLoading;
  
  if (isLoading) {
    return (
      <EnterpriseErrorBoundary {...ErrorBoundaryConfigs.page} name="LoadingScreen">
        <RobustLoadingScreen />
      </EnterpriseErrorBoundary>
    );
  }

  return (
    <EnterpriseErrorBoundary {...ErrorBoundaryConfigs.page} name="MainApp">
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 transition-all duration-500">
        
        {/* Navigation with Error Boundary */}
        <EnterpriseErrorBoundary 
          {...ErrorBoundaryConfigs.section} 
          name="Navigation"
          fallback={<div className="h-16 bg-white shadow-sm" />}
        >
          <Navbar />
        </EnterpriseErrorBoundary>

        {/* Main Content Area */}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <Suspense 
              fallback={
                <EnterpriseErrorBoundary {...ErrorBoundaryConfigs.component} name="SuspenseFallback">
                  <RobustLoadingScreen />
                </EnterpriseErrorBoundary>
              }
            >
              <Routes>
                {/* Public Routes */}
                <Route 
                  path="/" 
                  element={<EnhancedRoute path="/" element={<HomePage />} name="Home" />} 
                />
                <Route 
                  path="/login" 
                  element={<EnhancedRoute path="/login" element={<LoginPage />} name="Login" />} 
                />
                <Route 
                  path="/register" 
                  element={<EnhancedRoute path="/register" element={<RegisterPage />} name="Register" />} 
                />
                <Route 
                  path="/forgot-password" 
                  element={<EnhancedRoute path="/forgot-password" element={<ForgotPasswordPage />} name="ForgotPassword" />} 
                />
                <Route 
                  path="/vendor-application" 
                  element={<EnhancedRoute path="/vendor-application" element={<VendorApplicationPage />} name="VendorApplication" />} 
                />

                {/* Customer Routes */}
                <Route 
                  path="/marketplace" 
                  element={<EnhancedRoute path="/marketplace" element={<MarketplacePage />} name="Marketplace" />} 
                />
                <Route 
                  path="/product/:id" 
                  element={<EnhancedRoute path="/product/:id" element={<ProductDetailsPage />} name="ProductDetails" />} 
                />
                <Route 
                  path="/vendors" 
                  element={<EnhancedRoute path="/vendors" element={<VendorsPage />} name="Vendors" />} 
                />
                <Route 
                  path="/cart" 
                  element={<EnhancedRoute path="/cart" element={<CartPage />} name="Cart" />} 
                />

                {/* Enhanced Profile Route */}
                <Route 
                  path="/profile" 
                  element={<EnhancedRoute path="/profile" element={<AdvancedUserProfile />} name="Profile" />} 
                />

                {/* Dashboard Routes */}
                {user && (
                  <>
                    <Route 
                      path="/dashboard" 
                      element={
                        <Navigate 
                          to={
                            user.role === 'admin' ? '/admin/dashboard' :
                            user.role === 'vendor' ? '/vendor/dashboard' :
                            '/customer/dashboard'
                          } 
                          replace 
                        />
                      } 
                    />

                    {/* Customer Dashboard */}
                    {user.role === 'customer' && (
                      <Route 
                        path="/customer/dashboard" 
                        element={<EnhancedRoute path="/customer/dashboard" element={<CustomerDashboard />} name="CustomerDashboard" />} 
                      />
                    )}

                    {/* Vendor Dashboard */}
                    {user.role === 'vendor' && (
                      <Route 
                        path="/vendor/dashboard" 
                        element={<EnhancedRoute path="/vendor/dashboard" element={<VendorDashboard />} name="VendorDashboard" />} 
                      />
                    )}

                    {/* Enhanced Admin Dashboard */}
                    {user.role === 'admin' && (
                      <>
                        <Route 
                          path="/admin/dashboard" 
                          element={<EnhancedRoute path="/admin/dashboard" element={<FuturisticAdminDashboard />} name="AdminDashboard" />} 
                        />
                        <Route 
                          path="/admin/dashboard/legacy" 
                          element={<EnhancedRoute path="/admin/dashboard/legacy" element={<AdminDashboard />} name="LegacyAdminDashboard" />} 
                        />
                      </>
                    )}
                  </>
                )}

                {/* Catch-all route */}
                <Route 
                  path="*" 
                  element={
                    <EnhancedRoute 
                      path="*" 
                      element={
                        <div className="min-h-screen flex items-center justify-center">
                          <div className="text-center">
                            <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                            <p className="text-gray-600 mb-8">الصفحة غير موجودة</p>
                            <button 
                              onClick={() => window.location.href = '/'}
                              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                            >
                              العودة للرئيسية
                            </button>
                          </div>
                        </div>
                      } 
                      name="NotFound" 
                    />
                  } 
                />
              </Routes>
            </Suspense>
          </AnimatePresence>
        </main>

        {/* Footer with Error Boundary */}
        <EnterpriseErrorBoundary 
          {...ErrorBoundaryConfigs.section} 
          name="Footer"
          fallback={
            <div className="bg-neutral-100 p-4 text-center text-sm text-neutral-600">
              Footer temporarily unavailable
            </div>
          }
        >
          <Footer />
        </EnterpriseErrorBoundary>
      </div>
    </EnterpriseErrorBoundary>
  );
};

// Performance and Security Monitoring Component
const EnterpriseMonitoring: React.FC = () => {
  const { getReport: getPerformanceReport } = usePerformanceMonitor();
  const { getReport: getSecurityReport } = useSecurity();

  useEffect(() => {
    // Generate and log reports every 5 minutes in development
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        const perfReport = getPerformanceReport();
        const secReport = getSecurityReport();
        
        console.group('📊 Enterprise Monitoring Report');
        console.log('Performance:', perfReport);
        console.log('Security:', secReport);
        console.groupEnd();
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [getPerformanceReport, getSecurityReport]);

  return null; // This is a monitoring component, no UI
};

// Main App Export with Monitoring
const App: React.FC = () => {
  return (
    <>
      <EnterpriseApp />
      <EnterpriseMonitoring />
    </>
  );
};

export default App;