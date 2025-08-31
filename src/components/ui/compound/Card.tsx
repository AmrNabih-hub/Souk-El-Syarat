/**
 * Compound Card Component System
 * Flexible, composable card components with advanced features
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

// Card Context
interface CardContextValue {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  interactive?: boolean;
  featured?: boolean;
}

const CardContext = createContext<CardContextValue>({});

// Card Root Component
interface CardRootProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  interactive?: boolean;
  featured?: boolean;
  onClick?: () => void;
  layoutId?: string;
}

const CardRoot: React.FC<CardRootProps> = ({
  children,
  className,
  variant = 'default',
  interactive = false,
  featured = false,
  onClick,
  layoutId,
}) => {
  const baseClasses = 'relative overflow-hidden transition-all duration-300';
  
  const variantClasses = {
    default: 'bg-white border border-neutral-200 shadow-sm',
    elevated: 'bg-white shadow-lg hover:shadow-xl',
    outlined: 'bg-transparent border-2 border-neutral-300',
    glass: 'bg-white/80 backdrop-blur-md border border-white/20 shadow-xl',
  };
  
  const interactiveClasses = interactive
    ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
    : '';
  
  const featuredClasses = featured
    ? 'ring-2 ring-primary-500 ring-offset-2'
    : '';

  return (
    <CardContext.Provider value={{ variant, interactive, featured }}>
      <motion.div
        layoutId={layoutId}
        className={clsx(
          baseClasses,
          variantClasses[variant],
          interactiveClasses,
          featuredClasses,
          'rounded-xl',
          className
        )}
        onClick={onClick}
        whileHover={interactive ? { y: -4 } : undefined}
        whileTap={interactive ? { scale: 0.98 } : undefined}
      >
        {featured && (
          <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-secondary-500' />
        )}
        {children}
      </motion.div>
    </CardContext.Provider>
  );
};

// Card Header Component
interface CardHeaderProps {
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className,
  actions,
}) => {
  const { variant } = useContext(CardContext);
  
  return (
    <div
      className={clsx(
        'px-6 py-4',
        variant === 'glass' && 'border-b border-white/10',
        variant !== 'glass' && 'border-b border-neutral-200',
        className
      )}
    >
      <div className='flex items-center justify-between'>
        <div className='flex-1'>{children}</div>
        {actions && <div className='flex items-center space-x-2'>{actions}</div>}
      </div>
    </div>
  );
};

// Card Title Component
interface CardTitleProps {
  children: ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const CardTitle: React.FC<CardTitleProps> = ({
  children,
  className,
  as: Component = 'h3',
}) => {
  return (
    <Component
      className={clsx(
        'font-semibold text-neutral-900',
        Component === 'h1' && 'text-3xl',
        Component === 'h2' && 'text-2xl',
        Component === 'h3' && 'text-xl',
        Component === 'h4' && 'text-lg',
        Component === 'h5' && 'text-base',
        Component === 'h6' && 'text-sm',
        className
      )}
    >
      {children}
    </Component>
  );
};

// Card Subtitle Component
interface CardSubtitleProps {
  children: ReactNode;
  className?: string;
}

const CardSubtitle: React.FC<CardSubtitleProps> = ({ children, className }) => {
  return (
    <p className={clsx('text-sm text-neutral-600 mt-1', className)}>
      {children}
    </p>
  );
};

// Card Content Component
interface CardContentProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

const CardContent: React.FC<CardContentProps> = ({
  children,
  className,
  noPadding = false,
}) => {
  return (
    <div className={clsx(!noPadding && 'px-6 py-4', className)}>
      {children}
    </div>
  );
};

// Card Footer Component
interface CardFooterProps {
  children: ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right' | 'between';
}

const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className,
  align = 'right',
}) => {
  const { variant } = useContext(CardContext);
  
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };
  
  return (
    <div
      className={clsx(
        'px-6 py-4 flex items-center',
        alignClasses[align],
        variant === 'glass' && 'border-t border-white/10',
        variant !== 'glass' && 'border-t border-neutral-200',
        className
      )}
    >
      {children}
    </div>
  );
};

// Card Image Component
interface CardImageProps {
  src: string;
  alt: string;
  className?: string;
  height?: number;
  overlay?: boolean;
  gradient?: boolean;
}

const CardImage: React.FC<CardImageProps> = ({
  src,
  alt,
  className,
  height = 200,
  overlay = false,
  gradient = false,
}) => {
  return (
    <div
      className={clsx('relative overflow-hidden', className)}
      style={{ height: `${height}px` }}
    >
      <img
        src={src}
        alt={alt}
        className='w-full h-full object-cover'
        loading='lazy'
      />
      {overlay && (
        <div className='absolute inset-0 bg-black/40' />
      )}
      {gradient && (
        <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent' />
      )}
    </div>
  );
};

// Card Badge Component
interface CardBadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

const CardBadge: React.FC<CardBadgeProps> = ({
  children,
  variant = 'primary',
  position = 'top-right',
  className,
}) => {
  const variantClasses = {
    primary: 'bg-primary-500 text-white',
    secondary: 'bg-secondary-500 text-white',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-white',
    danger: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
  };
  
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };
  
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={clsx(
        'absolute z-10 px-3 py-1 rounded-full text-xs font-semibold',
        variantClasses[variant],
        positionClasses[position],
        className
      )}
    >
      {children}
    </motion.div>
  );
};

// Card Skeleton Component
interface CardSkeletonProps {
  className?: string;
  lines?: number;
  showImage?: boolean;
  showActions?: boolean;
}

const CardSkeleton: React.FC<CardSkeletonProps> = ({
  className,
  lines = 3,
  showImage = true,
  showActions = false,
}) => {
  return (
    <div className={clsx('bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden', className)}>
      {showImage && (
        <div className='h-48 bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 animate-pulse' />
      )}
      <div className='p-6 space-y-4'>
        <div className='h-6 bg-neutral-200 rounded animate-pulse w-3/4' />
        <div className='space-y-2'>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className='h-4 bg-neutral-200 rounded animate-pulse'
              style={{ width: `${100 - i * 10}%` }}
            />
          ))}
        </div>
        {showActions && (
          <div className='flex space-x-2 pt-4'>
            <div className='h-9 bg-neutral-200 rounded animate-pulse flex-1' />
            <div className='h-9 bg-neutral-200 rounded animate-pulse flex-1' />
          </div>
        )}
      </div>
    </div>
  );
};

// Export Compound Card Component
export const Card = {
  Root: CardRoot,
  Header: CardHeader,
  Title: CardTitle,
  Subtitle: CardSubtitle,
  Content: CardContent,
  Footer: CardFooter,
  Image: CardImage,
  Badge: CardBadge,
  Skeleton: CardSkeleton,
};

// Export individual components for flexibility
export {
  CardRoot,
  CardHeader,
  CardTitle,
  CardSubtitle,
  CardContent,
  CardFooter,
  CardImage,
  CardBadge,
  CardSkeleton,
};
