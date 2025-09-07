import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  variant?: 'default' | 'filled' | 'outlined';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  success?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  fullWidth = false,
  variant = 'default',
  leftIcon,
  rightIcon,
  success,
  className,
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const baseClasses = 'block w-full rounded-lg border-0 px-3 py-2 shadow-sm ring-1 ring-inset transition-all duration-200 focus:ring-2 focus:ring-inset disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    default: 'border-gray-300 ring-gray-300 placeholder:text-gray-400 focus:ring-primary-500 focus:border-primary-500',
    filled: 'bg-gray-50 border-gray-200 ring-gray-200 placeholder:text-gray-500 focus:bg-white focus:ring-primary-500 focus:border-primary-500',
    outlined: 'bg-transparent border-gray-300 ring-gray-300 placeholder:text-gray-400 focus:ring-primary-500 focus:border-primary-500',
  };

  return (
    <motion.div
      className={clsx('relative', fullWidth && 'w-full')}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400 sm:text-sm">
              {leftIcon}
            </span>
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          className={clsx(
            baseClasses,
            variantClasses[variant],
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error && 'ring-red-500 border-red-500 focus:ring-red-500 focus:border-red-500',
            success && 'ring-green-500 border-green-500 focus:ring-green-500 focus:border-green-500',
            className
          )}
          {...props}
        />

        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-400 sm:text-sm">
              {rightIcon}
            </span>
          </div>
        )}
      </div>

      {error && (
        <motion.p
          className="mt-1 text-sm text-red-600"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.p>
      )}

      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </motion.div>
  );
});

Input.displayName = 'Input';

export default Input;
