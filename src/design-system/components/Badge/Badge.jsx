import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/classNames';
import { combineVariants } from '../../utils/variants';

/**
 * Badge Component
 * 
 * A flexible badge component for displaying status indicators, labels, and counts.
 * Supports multiple variants, sizes, and styles with optional icons and remove functionality.
 * 
 * @component
 * @example
 * // Basic badge
 * <Badge>New</Badge>
 * 
 * @example
 * // Badge with variant and size
 * <Badge variant="success" size="lg">Active</Badge>
 * 
 * @example
 * // Badge with icon
 * <Badge variant="warning" leftIcon={<AlertIcon />}>Warning</Badge>
 * 
 * @example
 * // Removable badge
 * <Badge variant="primary" onRemove={() => console.log('removed')}>Tag</Badge>
 * 
 * @example
 * // Dot badge
 * <Badge variant="success" dot>Online</Badge>
 * 
 * @example
 * // Pulse animation
 * <Badge variant="danger" pulse>Live</Badge>
 */
const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  style = 'solid',
  leftIcon,
  rightIcon,
  dot = false,
  pulse = false,
  onRemove,
  className,
  ...props
}) => {
  // Variant styles
  const variantStyles = {
    default: {
      solid: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      outline: 'border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300',
      soft: 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    },
    primary: {
      solid: 'bg-navy-600 text-white dark:bg-navy-500',
      outline: 'border border-navy-600 text-navy-700 dark:border-navy-500 dark:text-navy-400',
      soft: 'bg-navy-50 text-navy-700 dark:bg-navy-900 dark:text-navy-300',
    },
    secondary: {
      solid: 'bg-gold-500 text-white dark:bg-gold-600',
      outline: 'border border-gold-500 text-gold-700 dark:border-gold-600 dark:text-gold-400',
      soft: 'bg-gold-50 text-gold-700 dark:bg-gold-900 dark:text-gold-300',
    },
    success: {
      solid: 'bg-green-500 text-white dark:bg-green-600',
      outline: 'border border-green-500 text-green-700 dark:border-green-600 dark:text-green-400',
      soft: 'bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300',
    },
    warning: {
      solid: 'bg-gold-500 text-white dark:bg-gold-600',
      outline: 'border border-gold-500 text-gold-700 dark:border-gold-600 dark:text-gold-400',
      soft: 'bg-gold-50 text-gold-700 dark:bg-gold-900 dark:text-gold-300',
    },
    danger: {
      solid: 'bg-red-600 text-white dark:bg-red-700',
      outline: 'border border-red-600 text-red-700 dark:border-red-700 dark:text-red-400',
      soft: 'bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300',
    },
    info: {
      solid: 'bg-blue-500 text-white dark:bg-blue-600',
      outline: 'border border-blue-500 text-blue-700 dark:border-blue-600 dark:text-blue-400',
      soft: 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    },
  };

  // Size styles
  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  // Icon sizes
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // Dot sizes
  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  // Dot colors
  const dotColors = {
    default: 'bg-gray-400 dark:bg-gray-500',
    primary: 'bg-navy-600 dark:bg-navy-500',
    secondary: 'bg-gold-500 dark:bg-gold-600',
    success: 'bg-green-500 dark:bg-green-600',
    warning: 'bg-gold-500 dark:bg-gold-600',
    danger: 'bg-red-600 dark:bg-red-700',
    info: 'bg-blue-500 dark:bg-blue-600',
  };

  // Base styles
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full transition-colors duration-200';

  // Combine all styles
  const badgeClasses = cn(
    baseStyles,
    variantStyles[variant][style],
    sizeStyles[size],
    pulse && 'animate-pulse',
    className
  );

  return (
    <span className={badgeClasses} {...props}>
      {/* Dot indicator */}
      {dot && (
        <span
          className={cn(
            'rounded-full mr-1.5',
            dotSizes[size],
            dotColors[variant],
            pulse && 'animate-pulse'
          )}
        />
      )}

      {/* Left icon */}
      {leftIcon && (
        <span className={cn('mr-1', iconSizes[size])}>
          {leftIcon}
        </span>
      )}

      {/* Content */}
      {children}

      {/* Right icon */}
      {rightIcon && (
        <span className={cn('ml-1', iconSizes[size])}>
          {rightIcon}
        </span>
      )}

      {/* Remove button */}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            'ml-1 rounded-full hover:bg-black hover:bg-opacity-10 dark:hover:bg-white dark:hover:bg-opacity-10 transition-colors duration-200',
            iconSizes[size]
          )}
          aria-label="Remove"
        >
          <svg
            className="w-full h-full"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </span>
  );
};

Badge.propTypes = {
  /** Content to display in the badge */
  children: PropTypes.node.isRequired,
  
  /** Visual style variant */
  variant: PropTypes.oneOf([
    'default',
    'primary',
    'secondary',
    'success',
    'warning',
    'danger',
    'info',
  ]),
  
  /** Size of the badge */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  
  /** Style type */
  style: PropTypes.oneOf(['solid', 'outline', 'soft']),
  
  /** Icon to display on the left */
  leftIcon: PropTypes.node,
  
  /** Icon to display on the right */
  rightIcon: PropTypes.node,
  
  /** Show a dot indicator */
  dot: PropTypes.bool,
  
  /** Enable pulse animation */
  pulse: PropTypes.bool,
  
  /** Callback when remove button is clicked */
  onRemove: PropTypes.func,
  
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default Badge;
