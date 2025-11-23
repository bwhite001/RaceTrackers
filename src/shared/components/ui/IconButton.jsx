import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../../design-system/utils/classNames';

/**
 * IconButton Component
 * 
 * Icon-only buttons with tooltips and variants.
 * 
 * @component
 * @example
 * <IconButton
 *   icon={<SettingsIcon />}
 *   onClick={handleClick}
 *   label="Settings"
 *   variant="ghost"
 * />
 */
const IconButton = ({
  icon,
  onClick,
  label,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  loading = false,
  className,
  ...props
}) => {
  const variants = {
    ghost: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800',
    primary: 'text-white bg-navy-600 hover:bg-navy-700',
    secondary: 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600',
    danger: 'text-white bg-red-600 hover:bg-red-700',
  };

  const sizes = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-lg',
        'transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'touch-target',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <svg
          className={cn('animate-spin', iconSizes[size])}
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
      ) : (
        <span className={iconSizes[size]}>{icon}</span>
      )}
    </button>
  );
};

IconButton.propTypes = {
  icon: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(['ghost', 'primary', 'secondary', 'danger']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  className: PropTypes.string,
};

export default IconButton;
