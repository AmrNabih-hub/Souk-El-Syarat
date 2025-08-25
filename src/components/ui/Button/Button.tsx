/**
 * Professional Button Component
 * Bulletproof, accessible, and highly customizable button component
 */

import React, { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { clsx } from 'clsx';
import { ErrorHandler } from '@/lib/errors';

// Button Variants
export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'ghost' 
  | 'outline';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isFullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loadingText?: string;
  children: ReactNode;
  motionProps?: MotionProps;
  errorBoundary?: boolean;
}

// Variant styles
const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 text-white shadow-sm',
  secondary: 'bg-secondary-600 hover:bg-secondary-700 focus:ring-secondary-500 text-white shadow-sm',
  success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white shadow-sm',
  warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 text-white shadow-sm',
  danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white shadow-sm',
  ghost: 'bg-transparent hover:bg-neutral-100 focus:ring-neutral-500 text-neutral-700',
  outline: 'bg-transparent border-2 border-neutral-300 hover:border-neutral-400 focus:ring-neutral-500 text-neutral-700',
};

// Size styles
const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1.5 text-xs font-medium rounded',
  sm: 'px-3 py-2 text-sm font-medium rounded-md',
  md: 'px-4 py-2 text-sm font-medium rounded-md',
  lg: 'px-4 py-2 text-base font-medium rounded-lg',
  xl: 'px-6 py-3 text-base font-semibold rounded-lg',
};

// Loading spinner component
const LoadingSpinner: React.FC<{ size: ButtonSize }> = ({ size }) => {
  const spinnerSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-5 h-5',
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={clsx('border-2 border-current border-t-transparent rounded-full', spinnerSizes[size])}
      aria-hidden="true"
    />
  );
};

// Error Boundary Wrapper
const ButtonErrorBoundary: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback 
}) => {
  try {
    return <>{children}</>;
  } catch (error) {
    ErrorHandler.handle(error as Error, { component: 'Button' });
    
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <button
        disabled
        className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md cursor-not-allowed"
      >
        خطأ في الزر
      </button>
    );
  }
};

// Main Button Component
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isFullWidth = false,
      leftIcon,
      rightIcon,
      loadingText,
      children,
      className,
      disabled,
      onClick,
      motionProps,
      errorBoundary = true,
      ...props
    },
    ref
  ) => {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      try {
        if (isLoading || disabled) {
          event.preventDefault();
          return;
        }

        onClick?.(event);
      } catch (error) {
        ErrorHandler.handle(error as Error, { 
          component: 'Button',
          action: 'click',
          variant,
          size 
        });
      }
    };

    const buttonClasses = clsx(
      // Base styles
      'inline-flex items-center justify-center font-medium transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'select-none',
      
      // Variant styles
      variantStyles[variant],
      
      // Size styles
      sizeStyles[size],
      
      // Full width
      isFullWidth && 'w-full',
      
      // Loading state
      isLoading && 'cursor-wait',
      
      // Custom className
      className
    );

    const buttonContent = (
      <>
        {/* Left Icon */}
        {leftIcon && !isLoading && (
          <span className={clsx('flex-shrink-0', children && 'mr-2 rtl:mr-0 rtl:ml-2')}>
            {leftIcon}
          </span>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <span className={clsx('flex-shrink-0', (children || loadingText) && 'mr-2 rtl:mr-0 rtl:ml-2')}>
            <LoadingSpinner size={size} />
          </span>
        )}

        {/* Button Text */}
        <span className={clsx(isLoading && 'opacity-70')}>
          {isLoading && loadingText ? loadingText : children}
        </span>

        {/* Right Icon */}
        {rightIcon && !isLoading && (
          <span className={clsx('flex-shrink-0', children && 'ml-2 rtl:ml-0 rtl:mr-2')}>
            {rightIcon}
          </span>
        )}
      </>
    );

    const MotionButton = motion.button;

    const buttonElement = (
      <MotionButton
        ref={ref}
        className={buttonClasses}
        disabled={disabled || isLoading}
        onClick={handleClick}
        whileHover={!disabled && !isLoading ? { scale: 1.02 } : undefined}
        whileTap={!disabled && !isLoading ? { scale: 0.98 } : undefined}
        {...motionProps}
        {...props}
      >
        {buttonContent}
      </MotionButton>
    );

    if (errorBoundary) {
      return (
        <ButtonErrorBoundary
          fallback={
            <button
              disabled
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md cursor-not-allowed"
            >
              خطأ في الزر
            </button>
          }
        >
          {buttonElement}
        </ButtonErrorBoundary>
      );
    }

    return buttonElement;
  }
);

Button.displayName = 'Button';

// Button Group Component
export interface ButtonGroupProps {
  children: ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  className,
  orientation = 'horizontal',
  spacing = 'sm',
}) => {
  const spacingClasses = {
    none: '',
    sm: orientation === 'horizontal' ? 'space-x-2 rtl:space-x-reverse' : 'space-y-2',
    md: orientation === 'horizontal' ? 'space-x-3 rtl:space-x-reverse' : 'space-y-3',
    lg: orientation === 'horizontal' ? 'space-x-4 rtl:space-x-reverse' : 'space-y-4',
  };

  const orientationClasses = {
    horizontal: 'flex flex-row',
    vertical: 'flex flex-col',
  };

  return (
    <div
      className={clsx(
        orientationClasses[orientation],
        spacingClasses[spacing],
        className
      )}
      role="group"
    >
      {children}
    </div>
  );
};

// Icon Button Component
export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: ReactNode;
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, ...props }, ref) => {
    return (
      <Button ref={ref} {...props}>
        {icon}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default Button;