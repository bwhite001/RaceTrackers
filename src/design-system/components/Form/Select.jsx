import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/classNames';

/**
 * Select Component
 * 
 * A styled select dropdown component with support for different sizes and states.
 * 
 * @component
 * @example
 * <Select value={value} onChange={handleChange}>
 *   <option value="">Select an option</option>
 *   <option value="1">Option 1</option>
 *   <option value="2">Option 2</option>
 * </Select>
 */
const Select = forwardRef(({
  size = 'md',
  error = false,
  disabled = false,
  children,
  className,
  ...props
}, ref) => {
  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-4 py-3 text-lg',
  };

  // Base styles
  const baseStyles = cn(
    'w-full rounded-lg border transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-900',
    'appearance-none bg-no-repeat',
    'pr-10' // Space for dropdown arrow
  );

  // State styles
  const stateStyles = error
    ? cn(
        'border-red-300 dark:border-red-700',
        'focus:border-red-500 focus:ring-red-500',
        'text-red-900 dark:text-red-100'
      )
    : cn(
        'border-gray-300 dark:border-gray-600',
        'focus:border-navy-500 focus:ring-navy-500',
        'text-gray-900 dark:text-gray-100'
      );

  // Background styles
  const bgStyles = 'bg-white dark:bg-gray-800';

  const selectClasses = cn(
    baseStyles,
    stateStyles,
    bgStyles,
    sizeStyles[size],
    className
  );

  return (
    <div className="relative">
      <select
        ref={ref}
        disabled={disabled}
        className={selectClasses}
        aria-invalid={error}
        {...props}
      >
        {children}
      </select>

      {/* Dropdown arrow */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
});

Select.displayName = 'Select';

Select.propTypes = {
  /** Size of the select */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  
  /** Whether the select has an error */
  error: PropTypes.bool,
  
  /** Whether the select is disabled */
  disabled: PropTypes.bool,
  
  /** Option elements */
  children: PropTypes.node.isRequired,
  
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default Select;
