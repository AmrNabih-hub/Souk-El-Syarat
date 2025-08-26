import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useRealtimeStore } from './stores/realtimeStore';

// Layout Components
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { NotificationToast } from './components/common/NotificationToast';

// Pages
import { HomePage } from './pages/HomePage';
import { CarsPage } from './pages/CarsPage';
import { SellCarPage } from './pages/SellCarPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { AdminLoginPage } from './pages/auth/AdminLoginPage';

// Customer Pages
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { MarketplacePage } from './pages/customer/MarketplacePage';
import { ProductDetailsPage } from './pages/customer/ProductDetailsPage';
import { CartPage } from './pages/customer/CartPage';
import { WishlistPage } from './pages/customer/WishlistPage';
import { ProfilePage } from './pages/customer/ProfilePage';
import { VendorsPage } from './pages/customer/VendorsPage';

// Vendor Pages
import { VendorApplicationPage } from './pages/VendorApplicationPage';
import { VendorDashboard } from './pages/vendor/VendorDashboard';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { EnhancedAdminDashboard } from './pages/admin/EnhancedAdminDashboard';

// Protected Route Component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requiredRole?: 'customer' | 'vendor' | 'admin';
  adminOnly?: boolean;
}> = ({ children, requiredRole, adminOnly = false }) => {
  const { user, userRole, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && userRole !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

// Unauthorized Page Component
const UnauthorizedPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-4">غير مصرح</h1>
      <p className="text-gray-600 mb-6">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
      <button
        onClick={() => window.history.back()}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        العودة
      </button>
    </div>
  </div>
);

// Main App Component
const App: React.FC = () => {
  const { user, isLoading, initializeAuth, userRole } = useAuthStore();
  const { initialize: initializeRealtime, isConnected } = useRealtimeStore();

  // Initialize authentication and real-time services
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Initialize real-time services when user is authenticated
  useEffect(() => {
    if (user?.uid && !isConnected) {
      initializeRealtime(user.uid);
    }
  }, [user?.uid, isConnected, initializeRealtime]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Offline Indicator */}
        <OfflineIndicator />
        
        {/* Navigation */}
        <Navbar />

        {/* Main Content */}
        <main className="flex-1">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/cars" element={<CarsPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/product/:id" element={<ProductDetailsPage />} />
            <Route path="/vendors" element={<VendorsPage />} />
            <Route path="/sell" element={<SellCarPage />} />
            
            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/admin-login" element={<AdminLoginPage />} />
            <Route path="/vendor-application" element={<VendorApplicationPage />} />
            
            {/* Customer Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requiredRole="customer">
                  <CustomerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/cart" 
              element={
                <ProtectedRoute requiredRole="customer">
                  <CartPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/wishlist" 
              element={
                <ProtectedRoute requiredRole="customer">
                  <WishlistPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />

            {/* Vendor Protected Routes */}
            <Route 
              path="/vendor/dashboard" 
              element={
                <ProtectedRoute requiredRole="vendor">
                  <VendorDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Admin Protected Routes */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute adminOnly>
                  {userRole === 'admin' ? <AdminDashboard /> : <EnhancedAdminDashboard />}
                </ProtectedRoute>
              } 
            />

            {/* Error Routes */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <Footer />

        {/* Global Notifications */}
        <NotificationToast />
      </div>
    </ErrorBoundary>
  );
};

export default App;