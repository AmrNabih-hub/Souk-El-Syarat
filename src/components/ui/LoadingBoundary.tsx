/**
 * Loading Boundary Component
 * Provides consistent loading states and skeleton screens across the application
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface LoadingBoundaryProps {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  skeleton?: 'card' | 'list' | 'table' | 'form' | 'custom';
  minHeight?: string;
  className?: string;
}

const SkeletonCard: React.FC = () => (
  <div className="animate-pulse">
    <div className="bg-neutral-200 dark:bg-neutral-700 rounded-lg h-48 w-full mb-4"></div>
    <div className="space-y-2">
      <div className="bg-neutral-200 dark:bg-neutral-700 rounded h-4 w-3/4"></div>
      <div className="bg-neutral-200 dark:bg-neutral-700 rounded h-4 w-1/2"></div>
      <div className="bg-neutral-200 dark:bg-neutral-700 rounded h-4 w-2/3"></div>
    </div>
  </div>
);

const SkeletonList: React.FC = () => (
  <div className="animate-pulse space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center space-x-4 rtl:space-x-reverse">
        <div className="bg-neutral-200 dark:bg-neutral-700 rounded-full h-12 w-12"></div>
        <div className="flex-1 space-y-2">
          <div className="bg-neutral-200 dark:bg-neutral-700 rounded h-4 w-3/4"></div>
          <div className="bg-neutral-200 dark:bg-neutral-700 rounded h-3 w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);

const SkeletonTable: React.FC = () => (
  <div className="animate-pulse">
    <div className="grid grid-cols-4 gap-4 mb-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-neutral-200 dark:bg-neutral-700 rounded h-6"></div>
      ))}
    </div>
    {[...Array(8)].map((_, i) => (
      <div key={i} className="grid grid-cols-4 gap-4 mb-2">
        {[...Array(4)].map((_, j) => (
          <div key={j} className="bg-neutral-100 dark:bg-neutral-800 rounded h-4"></div>
        ))}
      </div>
    ))}
  </div>
);

const SkeletonForm: React.FC = () => (
  <div className="animate-pulse space-y-6">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="space-y-2">
        <div className="bg-neutral-200 dark:bg-neutral-700 rounded h-4 w-1/4"></div>
        <div className="bg-neutral-100 dark:bg-neutral-800 rounded h-12 w-full"></div>
      </div>
    ))}
    <div className="bg-primary-200 dark:bg-primary-800 rounded h-12 w-full"></div>
  </div>
);

const DefaultLoadingSpinner: React.FC = () => (
  <motion.div 
    className="flex flex-col items-center justify-center py-12 space-y-4"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      className="relative"
    >
      <SparklesIcon className="w-12 h-12 text-primary-500" />
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        style={{ filter: 'blur(8px)', opacity: 0.3 }}
      />
    </motion.div>
    <motion.p 
      className="text-neutral-600 dark:text-neutral-400 font-medium"
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      جارٍ التحميل...
    </motion.p>
  </motion.div>
);

export const LoadingBoundary: React.FC<LoadingBoundaryProps> = ({
  isLoading,
  children,
  fallback,
  skeleton = 'card',
  minHeight = '200px',
  className,
}) => {
  const renderSkeleton = () => {
    switch (skeleton) {
      case 'card':
        return <SkeletonCard />;
      case 'list':
        return <SkeletonList />;
      case 'table':
        return <SkeletonTable />;
      case 'form':
        return <SkeletonForm />;
      case 'custom':
        return fallback || <DefaultLoadingSpinner />;
      default:
        return <DefaultLoadingSpinner />;
    }
  };

  return (
    <div 
      className={clsx('relative', className)}
      style={{ minHeight: isLoading ? minHeight : 'auto' }}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {renderSkeleton()}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoadingBoundary;