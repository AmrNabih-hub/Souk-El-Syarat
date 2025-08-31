/**
 * Comprehensive Loading States
 * Provides loading UI for all async operations
 */

import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

// ============================================
// SKELETON COMPONENTS
// ============================================

// Base skeleton component
export const Skeleton: React.FC<{
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
  width?: string | number;
  height?: string | number;
}> = ({ 
  className, 
  variant = 'text', 
  animation = 'pulse',
  width,
  height 
}) => {
  const baseClasses = 'bg-gray-200';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  return (
    <div
      className={clsx(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        width: width || '100%',
        height: height || (variant === 'text' ? '1em' : '100%'),
      }}
    />
  );
};

// Product card skeleton
export const ProductCardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={clsx('bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden', className)}>
      <Skeleton variant="rectangular" height={200} />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" height={24} width="75%" />
        <Skeleton variant="text" height={16} />
        <Skeleton variant="text" height={16} width="60%" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton variant="text" height={28} width={80} />
          <Skeleton variant="circular" width={32} height={32} />
        </div>
      </div>
    </div>
  );
};

// Order card skeleton
export const OrderCardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={clsx('bg-white rounded-lg shadow-sm border border-gray-200 p-6', className)}>
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          <Skeleton variant="text" height={20} width={120} />
          <Skeleton variant="text" height={16} width={180} />
        </div>
        <Skeleton variant="rectangular" width={100} height={32} />
      </div>
      <div className="space-y-3">
        <div className="flex gap-4">
          <Skeleton variant="rectangular" width={80} height={80} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" height={18} />
            <Skeleton variant="text" height={16} width="60%" />
            <Skeleton variant="text" height={20} width={100} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Table skeleton
export const TableSkeleton: React.FC<{ 
  rows?: number; 
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className }) => {
  return (
    <div className={clsx('bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden', className)}>
      <div className="border-b border-gray-200 bg-gray-50 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} variant="text" height={20} />
          ))}
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton 
                  key={colIndex} 
                  variant="text" 
                  height={16}
                  width={colIndex === 0 ? '100%' : `${60 + Math.random() * 40}%`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Form skeleton
export const FormSkeleton: React.FC<{ 
  fields?: number;
  className?: string;
}> = ({ fields = 4, className }) => {
  return (
    <div className={clsx('space-y-6', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton variant="text" height={16} width={120} />
          <Skeleton variant="rectangular" height={40} />
        </div>
      ))}
      <div className="flex gap-4 pt-4">
        <Skeleton variant="rectangular" height={40} width={120} />
        <Skeleton variant="rectangular" height={40} width={120} />
      </div>
    </div>
  );
};

// Dashboard stats skeleton
export const DashboardStatsSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={clsx('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6', className)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton variant="circular" width={48} height={48} />
            <Skeleton variant="text" width={60} height={16} />
          </div>
          <Skeleton variant="text" height={32} width="60%" />
          <Skeleton variant="text" height={16} width="40%" className="mt-2" />
        </div>
      ))}
    </div>
  );
};

// Chat message skeleton
export const ChatMessageSkeleton: React.FC<{ 
  isOwn?: boolean;
  className?: string;
}> = ({ isOwn = false, className }) => {
  return (
    <div className={clsx('flex gap-3', isOwn && 'flex-row-reverse', className)}>
      <Skeleton variant="circular" width={40} height={40} />
      <div className={clsx('space-y-2', isOwn && 'items-end')}>
        <Skeleton variant="text" height={16} width={100} />
        <Skeleton 
          variant="rectangular" 
          height={60} 
          width={200}
          className={clsx('rounded-2xl', isOwn ? 'bg-blue-100' : 'bg-gray-100')}
        />
      </div>
    </div>
  );
};

// ============================================
// LOADING SPINNERS
// ============================================

// Simple spinner
export const Spinner: React.FC<{
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
}> = ({ size = 'md', color = 'primary', className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    success: 'text-green-600',
    danger: 'text-red-600',
    warning: 'text-yellow-600',
  };

  return (
    <svg
      className={clsx(
        'animate-spin',
        sizeClasses[size],
        colorClasses[color as keyof typeof colorClasses] || color,
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

// Dots loader
export const DotsLoader: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}> = ({ size = 'md', color = 'primary', className }) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div className={clsx('flex gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={clsx(
            'rounded-full bg-current',
            sizeClasses[size],
            color === 'primary' ? 'text-blue-600' : `text-${color}-600`
          )}
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
};

// Progress bar loader
export const ProgressLoader: React.FC<{
  progress?: number;
  showLabel?: boolean;
  color?: string;
  className?: string;
}> = ({ progress = 0, showLabel = true, color = 'blue', className }) => {
  return (
    <div className={clsx('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">Loading...</span>
          <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div
          className={`h-full bg-${color}-600 rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
};

// ============================================
// LOADING OVERLAYS
// ============================================

// Full page loader
export const PageLoader: React.FC<{
  message?: string;
  messageAr?: string;
}> = ({ message = 'Loading...', messageAr = 'جاري التحميل...' }) => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="mb-4">
          <Spinner size="xl" />
        </div>
        <p className="text-lg text-gray-700 mb-2">{message}</p>
        <p className="text-sm text-gray-500" dir="rtl">{messageAr}</p>
      </motion.div>
    </div>
  );
};

// Section loader
export const SectionLoader: React.FC<{
  height?: string | number;
  message?: string;
}> = ({ height = 200, message }) => {
  return (
    <div 
      className="flex flex-col items-center justify-center bg-gray-50 rounded-lg"
      style={{ height }}
    >
      <Spinner size="lg" />
      {message && (
        <p className="mt-4 text-gray-600">{message}</p>
      )}
    </div>
  );
};

// Inline loader
export const InlineLoader: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}> = ({ size = 'md', text = 'Loading', className }) => {
  return (
    <span className={clsx('inline-flex items-center gap-2', className)}>
      <Spinner size={size} />
      <span className="text-gray-600">{text}</span>
    </span>
  );
};

// Button loader
export const ButtonLoader: React.FC<{
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}> = ({ loading = false, children, className, disabled, onClick }) => {
  return (
    <button
      className={clsx(
        'relative inline-flex items-center justify-center',
        loading && 'cursor-not-allowed opacity-75',
        className
      )}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner size="sm" color="white" />
        </span>
      )}
      <span className={clsx(loading && 'invisible')}>{children}</span>
    </button>
  );
};

// ============================================
// DATA STATES
// ============================================

// Empty state
export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}> = ({ icon, title, titleAr, message, messageAr, action, className }) => {
  return (
    <div className={clsx('text-center py-12', className)}>
      {icon && (
        <div className="mb-4 text-gray-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {titleAr && (
        <p className="text-gray-600 mb-2" dir="rtl">{titleAr}</p>
      )}
      <p className="text-gray-500 mb-4">{message}</p>
      {messageAr && (
        <p className="text-gray-400 text-sm mb-6" dir="rtl">{messageAr}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

// Error state
export const ErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}> = ({ 
  title = 'Something went wrong', 
  message = 'An error occurred while loading the data.',
  onRetry,
  className 
}) => {
  return (
    <div className={clsx('text-center py-12', className)}>
      <div className="mb-4 text-red-500">
        <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

// Suspense fallback wrapper
export const SuspenseFallback: React.FC<{
  type?: 'page' | 'section' | 'component';
  height?: string | number;
}> = ({ type = 'component', height }) => {
  if (type === 'page') {
    return <PageLoader />;
  }

  if (type === 'section') {
    return <SectionLoader height={height} />;
  }

  return <Spinner size="md" />;
};

// Export all components
export default {
  // Skeletons
  Skeleton,
  ProductCardSkeleton,
  OrderCardSkeleton,
  TableSkeleton,
  FormSkeleton,
  DashboardStatsSkeleton,
  ChatMessageSkeleton,
  
  // Spinners
  Spinner,
  DotsLoader,
  ProgressLoader,
  
  // Overlays
  PageLoader,
  SectionLoader,
  InlineLoader,
  ButtonLoader,
  
  // States
  EmptyState,
  ErrorState,
  SuspenseFallback,
};