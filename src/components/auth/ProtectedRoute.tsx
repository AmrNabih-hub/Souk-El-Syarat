/**
 * 🔐 Protected Route Component
 * Restricts access based on user authentication and roles
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { motion } from 'framer-motion';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireAuth = true,
  redirectTo = '/login',
}) => {
  const { user, isLoading, isInitialized } = useAuthStore();
  const location = useLocation();

  // Show loading while auth is initializing
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-neutral-600 dark:text-neutral-400"
          >
            جاري التحميل...
          </motion.p>
        </div>
      </div>
    );
  }

  // Check if authentication is required
  if (requireAuth && !user) {
    // Redirect to login, but save the attempted location
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check if user's role is allowed
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user's role
    const roleDashboards: Record<UserRole, string> = {
      customer: '/customer/dashboard',
      vendor: '/vendor/dashboard',
      admin: '/admin/dashboard',
    };

    return <Navigate to={roleDashboards[user.role] || '/'} replace />;
  }

  // All checks passed, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
