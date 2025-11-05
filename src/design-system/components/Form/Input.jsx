import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/classNames';

/**
 * Input Component
 * 
 * A flexible input component supporting various types, sizes, and states.
 * Includes support for icons, helper text, and error messages.
 * 
 * @component
 * @example
 * <Input
 *   type="text"
 *   placeholder="Enter text"
 *   value={value}
 *   onChange={handleChange}
 * />
 */
const Input = forwardRef(({
  type = 'text',
  size = 'md',
  error = false,
  disabled = false,
  leftIcon,
  rightIcon,
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
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-900'
  );

  // State styles
  const stateStyles = error
    ? cn(
        'border-red-300 dark:border-red-700',
        'focus:border-red-500 focus:ring-red-500',
        'text-red-900 dark:text-red-100',
        'placeholder-red-400 dark:placeholder-red-600'
      )
    : cn(
        'border-gray-300 dark:border-gray-600',
        'focus:border-navy-500 focus:ring-navy-500',
        'text-gray-900 dark:text-gray-100',
        'placeholder-gray-400 dark:placeholder-gray-500'
      );

  // Background styles
  const bgStyles = 'bg-white dark:bg-gray-800';

  // Icon padding adjustments
  const iconPadding = {
    left: leftIcon ? 'pl-10' : '',
    right: rightIcon ? 'pr-10' : '',
  };

  const inputClasses = cn(
    baseStyles,
    stateStyles,
    bgStyles,
    sizeStyles[size],
    iconPadding.left,
    iconPadding.right,
    className
  );

  return (
    <div className="relative">
      {/* Left icon */}
      {leftIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
          <div className="w-5 h-5">
            {leftIcon}
          </div>
        </div>
      )}

      {/* Input */}
      <input
        ref={ref}
        type={type}
        disabled={disabled}
        className={inputClasses}
        aria-invalid={error}
        {...props}
      />

      {/* Right icon */}
      {rightIcon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
          <div className="w-5 h-5">
            {rightIcon}
          </div>
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  /** Input type */
  type: PropTypes.oneOf([
    'text',
    'email',
    'password',
    'number',
    'tel',
    'url',
    'search',
    'date',
    'time',
    'datetime-local',
  ]),
  
  /** Size of the input */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  
  /** Whether the input has an error */
  error: PropTypes.bool,
  
  /** Whether the input is disabled */
  disabled: PropTypes.bool,
  
  /** Icon to display on the left */
  leftIcon: PropTypes.node,
  
  /** Icon to display on the right */
  rightIcon: PropTypes.node,
  
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default Input;
