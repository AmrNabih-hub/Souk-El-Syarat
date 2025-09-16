import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';

interface CustomCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  id,
  checked,
  onChange,
  disabled = false,
  label,
  description,
  size = 'md',
  variant = 'default',
  className = '',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const variantClasses = {
    default: {
      unchecked: 'border-gray-300 bg-white hover:border-gray-400',
      checked: 'border-primary-500 bg-primary-500',
      disabled: 'border-gray-200 bg-gray-100',
    },
    primary: {
      unchecked: 'border-primary-300 bg-white hover:border-primary-400',
      checked: 'border-primary-500 bg-primary-500',
      disabled: 'border-primary-200 bg-primary-50',
    },
    success: {
      unchecked: 'border-green-300 bg-white hover:border-green-400',
      checked: 'border-green-500 bg-green-500',
      disabled: 'border-green-200 bg-green-50',
    },
    warning: {
      unchecked: 'border-yellow-300 bg-white hover:border-yellow-400',
      checked: 'border-yellow-500 bg-yellow-500',
      disabled: 'border-yellow-200 bg-yellow-50',
    },
    error: {
      unchecked: 'border-red-300 bg-white hover:border-red-400',
      checked: 'border-red-500 bg-red-500',
      disabled: 'border-red-200 bg-red-50',
    },
  };

  const getVariantClasses = () => {
    if (disabled) return variantClasses[variant].disabled;
    return checked ? variantClasses[variant].checked : variantClasses[variant].unchecked;
  };

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className={`flex items-start space-x-3 ${className}`}>
      <div className="flex items-center">
        <motion.button
          type="button"
          role="checkbox"
          aria-checked={checked}
          aria-label={ariaLabel || label}
          aria-describedby={ariaDescribedby}
          disabled={disabled}
          className={`
            ${sizeClasses[size]}
            ${getVariantClasses()}
            rounded-md border-2 transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            disabled:cursor-not-allowed
            ${!disabled ? 'cursor-pointer' : ''}
          `}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          whileHover={!disabled ? { scale: 1.05 } : {}}
          whileTap={!disabled ? { scale: 0.95 } : {}}
        >
          <motion.div
            initial={false}
            animate={{
              scale: checked ? 1 : 0,
              opacity: checked ? 1 : 0,
            }}
            transition={{
              duration: 0.2,
              ease: 'easeInOut',
            }}
            className="flex items-center justify-center"
          >
            <CheckIcon className={`${iconSizes[size]} text-white`} />
          </motion.div>
        </motion.button>
      </div>

      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && (
            <label
              htmlFor={id}
              className={`
                block text-sm font-medium
                ${disabled ? 'text-gray-400' : 'text-gray-900 cursor-pointer'}
                transition-colors duration-200
              `}
            >
              {label}
            </label>
          )}
          {description && (
            <p
              className={`
                mt-1 text-sm
                ${disabled ? 'text-gray-400' : 'text-gray-600'}
              `}
            >
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomCheckbox;
