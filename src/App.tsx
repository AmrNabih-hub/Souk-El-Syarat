import React, { useEffect, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';

// Layout Components
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoadingScreen from '@/components/ui/LoadingScreen';
import ErrorBoundary from '@/components/ErrorBoundary';

// Simple lazy loading
const HomePage = React.lazy(() => import('@/pages/HomePage'));
const SimpleLoginPage = React.lazy(() => import('@/pages/auth/LoginPage.simple'));
const RegisterPage = React.lazy(() => import('@/pages/auth/RegisterPage'));
const MarketplacePage = React.lazy(() => import('@/pages/customer/MarketplacePage'));
const AdminDashboard = React.lazy(() => import('@/pages/admin/AdminDashboard'));
const VendorDashboard = React.lazy(() => import('@/pages/vendor/VendorDashboard'));
const CustomerDashboard = React.lazy(() => import('@/pages/customer/CustomerDashboard'));

// Simple Protected Route
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  roles?: string[];
}> = ({ children, roles }) => {
  const { user, isInitialized, isLoading } = useAuthStore();

  if (!isInitialized || isLoading) {
    return <LoadingScreen message='جاري التحقق من الصلاحيات...' />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Simple Public Route
const PublicRoute: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user, isInitialized, isLoading } = useAuthStore();

  if (!isInitialized || isLoading) {
    return <LoadingScreen message='جاري التحقق من حالة المصادقة...' />;
  }

  if (user) {
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'vendor':
        return <Navigate to="/vendor/dashboard" replace />;
      case 'customer':
        return <Navigate to="/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { initializeAuth, isInitialized } = useAuthStore();
  const { theme } = useAppStore();

  // Simple initialization
  useEffect(() => {
    if (!isInitialized) {
      console.log('🚀 Initializing App...');
      try {
        initializeAuth();
      } catch (error) {
        console.error('❌ App initialization failed:', error);
      }
    }
  }, [initializeAuth, isInitialized]);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 transition-all duration-500">
          <ErrorBoundary>
            <Navbar />
          </ErrorBoundary>

          <main className="flex-1">
            <ErrorBoundary>
              <Suspense fallback={<LoadingScreen message="جاري تحميل الصفحة..." />}>
                <Routes>
                  {/* Public Routes */}
                  <Route 
                    path="/" 
                    element={
                      <ErrorBoundary>
                        <HomePage />
                      </ErrorBoundary>
                    } 
                  />
                  
                  <Route 
                    path="/login" 
                    element={
                      <PublicRoute>
                        <ErrorBoundary>
                          <SimpleLoginPage />
                        </ErrorBoundary>
                      </PublicRoute>
                    } 
                  />
                  
                  <Route 
                    path="/register" 
                    element={
                      <PublicRoute>
                        <ErrorBoundary>
                          <RegisterPage />
                        </ErrorBoundary>
                      </PublicRoute>
                    } 
                  />
                  
                  <Route 
                    path="/marketplace" 
                    element={
                      <ErrorBoundary>
                        <MarketplacePage />
                      </ErrorBoundary>
                    } 
                  />

                  {/* Protected Routes */}
                  <Route 
                    path="/admin/dashboard" 
                    element={
                      <ProtectedRoute roles={['admin']}>
                        <ErrorBoundary>
                          <AdminDashboard />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/vendor/dashboard" 
                    element={
                      <ProtectedRoute roles={['vendor']}>
                        <ErrorBoundary>
                          <VendorDashboard />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute roles={['customer']}>
                        <ErrorBoundary>
                          <CustomerDashboard />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </main>

          <ErrorBoundary>
            <Footer />
          </ErrorBoundary>
        </div>
      </ErrorBoundary>
    </div>
  );
};

export default App;