import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../../design-system/utils/classNames';

/**
 * LoadingSpinner Component
 * 
 * Loading indicators with different sizes and colors.
 * 
 * @component
 * @example
 * <LoadingSpinner size="lg" text="Loading..." />
 */
const LoadingSpinner = ({
  size = 'md',
  color = 'primary',
  text,
  overlay = false,
  className,
}) => {
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const colors = {
    primary: 'text-navy-600 dark:text-navy-400',
    white: 'text-white',
    gray: 'text-gray-600 dark:text-gray-400',
    success: 'text-green-600 dark:text-green-400',
    error: 'text-red-600 dark:text-red-400',
  };

  const Spinner = () => (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <svg
        className={cn('animate-spin', sizes[size], colors[color])}
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
      {text && (
        <p className={cn('text-sm font-medium', colors[color])}>
          {text}
        </p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
          <Spinner />
        </div>
      </div>
    );
  }

  return <Spinner />;
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  color: PropTypes.oneOf(['primary', 'white', 'gray', 'success', 'error']),
  text: PropTypes.string,
  overlay: PropTypes.bool,
  className: PropTypes.string,
};

export default LoadingSpinner;
