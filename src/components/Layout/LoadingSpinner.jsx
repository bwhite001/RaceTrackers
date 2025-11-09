import React, { memo } from 'react';
import PropTypes from 'prop-types';

/**
 * LoadingSpinner Component
 * Displays a loading animation with optional message
 */
const LoadingSpinner = memo(({ 
  message = 'Loading...', 
  size = 'md',
  fullScreen = false,
  overlay = false,
  className = ''
}) => {
  // Size classes mapping
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  // Container classes based on props
  const containerClasses = [
    'flex flex-col items-center justify-center',
    fullScreen ? 'fixed inset-0' : 'w-full h-full min-h-[200px]',
    overlay ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      role="status"
      aria-label={message}
      className={containerClasses}
    >
      {/* Spinner Animation */}
      <div className={`${sizeClasses[size]} animate-spin`}>
        <svg
          className="w-full h-full text-gray-300 dark:text-gray-600"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
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
      </div>

      {/* Loading Message */}
      {message && (
        <p 
          className="mt-4 text-sm font-medium text-gray-700 dark:text-gray-300"
          aria-live="polite"
        >
          {message}
        </p>
      )}

      {/* Screen Reader Text */}
      <span className="sr-only">Loading content, please wait</span>
    </div>
  );
});

LoadingSpinner.propTypes = {
  message: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  fullScreen: PropTypes.bool,
  overlay: PropTypes.bool,
  className: PropTypes.string
};

// Add display name for debugging
LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
