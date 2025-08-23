import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'neutral';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const colorClasses = {
  primary: 'border-primary-200 border-t-primary-500',
  secondary: 'border-secondary-200 border-t-secondary-500',
  neutral: 'border-neutral-200 border-t-neutral-500',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className,
  text,
}) => {
  return (
    <div className={clsx('flex flex-col items-center justify-center', className)}>
      <motion.div
        className={clsx(
          'rounded-full border-2',
          sizeClasses[size],
          colorClasses[color]
        )}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      
      {text && (
        <motion.p
          className="mt-3 text-sm text-neutral-600 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

// Alternative Egyptian-themed loader
export const EgyptianLoader: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  text = 'جاري التحميل...',
}) => {
  const pyramidSize = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <div className={clsx('flex flex-col items-center justify-center', className)}>
      <motion.div
        className={clsx(
          'relative',
          pyramidSize[size]
        )}
      >
        {/* Pyramid loader */}
        <motion.div
          className="absolute inset-0 border-l-[20px] border-r-[20px] border-b-[20px] border-l-transparent border-r-transparent border-b-primary-500"
          style={{ borderWidth: size === 'sm' ? '10px' : size === 'lg' ? '30px' : size === 'xl' ? '40px' : '20px' }}
          animate={{
            rotateY: [0, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        
        {/* Golden glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary-400/20 blur-sm"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>
      
      {text && (
        <motion.p
          className="mt-4 text-sm text-primary-600 font-arabic font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

// Dot loader
export const DotLoader: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={clsx('flex space-x-1', className)}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-2 h-2 bg-primary-500 rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: index * 0.2,
          }}
        />
      ))}
    </div>
  );
};

export default LoadingSpinner;