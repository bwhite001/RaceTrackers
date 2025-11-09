import React, { memo } from 'react';
import PropTypes from 'prop-types';

/**
 * ErrorMessage Component
 * Displays error messages with optional retry functionality and details
 */
const ErrorMessage = memo(({
  message,
  details,
  onRetry,
  fullScreen = false,
  className = ''
}) => {
  // Container classes based on props
  const containerClasses = [
    'flex flex-col items-center justify-center p-6 rounded-lg',
    'bg-red-50 dark:bg-red-900/20',
    fullScreen ? 'fixed inset-0' : 'w-full min-h-[200px]',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      role="alert"
      aria-live="assertive"
      className={containerClasses}
    >
      {/* Error Icon */}
      <div className="w-12 h-12 text-red-500 dark:text-red-400">
        <svg 
          className="w-full h-full"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
          />
        </svg>
      </div>

      {/* Error Message */}
      <h2 className="mt-4 text-lg font-semibold text-red-800 dark:text-red-200">
        {message}
      </h2>

      {/* Error Details */}
      {details && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-300">
          <pre className="whitespace-pre-wrap font-mono bg-red-100 dark:bg-red-900/40 p-2 rounded">
            {details}
          </pre>
        </div>
      )}

      {/* Retry Button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 
                   bg-red-100 dark:bg-red-900/40 rounded-md hover:bg-red-200 
                   dark:hover:bg-red-900/60 focus:outline-none focus:ring-2 
                   focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-red-900"
          aria-label="Retry operation"
        >
          Try Again
        </button>
      )}

      {/* Screen Reader Text */}
      <span className="sr-only">Error occurred: {message}</span>
    </div>
  );
});

ErrorMessage.propTypes = {
  message: PropTypes.string.isRequired,
  details: PropTypes.string,
  onRetry: PropTypes.func,
  fullScreen: PropTypes.bool,
  className: PropTypes.string
};

// Add display name for debugging
ErrorMessage.displayName = 'ErrorMessage';

export default ErrorMessage;
