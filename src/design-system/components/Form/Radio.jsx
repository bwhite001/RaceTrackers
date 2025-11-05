import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/classNames';

/**
 * Radio Component
 * 
 * A styled radio button component with support for different sizes and states.
 * 
 * @component
 * @example
 * <Radio
 *   name="option"
 *   value="1"
 *   checked={selected === '1'}
 *   onChange={handleChange}
 *   label="Option 1"
 * />
 */
const Radio = forwardRef(({
  size = 'md',
  label,
  helperText,
  error = false,
  disabled = false,
  className,
  ...props
}, ref) => {
  // Size styles
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const labelSizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  // Base styles
  const baseStyles = cn(
    'rounded-full border transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  );

  // State styles
  const stateStyles = error
    ? cn(
        'border-red-300 dark:border-red-700',
        'text-red-600 dark:text-red-500',
        'focus:ring-red-500'
      )
    : cn(
        'border-gray-300 dark:border-gray-600',
        'text-navy-600 dark:text-navy-500',
        'focus:ring-navy-500'
      );

  const radioClasses = cn(
    baseStyles,
    stateStyles,
    sizeStyles[size],
    'cursor-pointer'
  );

  const content = (
    <>
      <input
        ref={ref}
        type="radio"
        disabled={disabled}
        className={radioClasses}
        aria-invalid={error}
        aria-describedby={helperText ? `${props.id}-helper` : undefined}
        {...props}
      />
      {label && (
        <span
          className={cn(
            'ml-2 text-gray-700 dark:text-gray-300',
            labelSizeStyles[size],
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {label}
        </span>
      )}
    </>
  );

  return (
    <div className={className}>
      <label className="inline-flex items-center cursor-pointer">
        {content}
      </label>
      {helperText && (
        <p
          id={`${props.id}-helper`}
          className={cn(
            'mt-1 text-sm',
            error
              ? 'text-red-600 dark:text-red-500'
              : 'text-gray-600 dark:text-gray-400'
          )}
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

Radio.displayName = 'Radio';

Radio.propTypes = {
  /** Size of the radio button */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  
  /** Label text */
  label: PropTypes.string,
  
  /** Helper text */
  helperText: PropTypes.string,
  
  /** Whether the radio has an error */
  error: PropTypes.bool,
  
  /** Whether the radio is disabled */
  disabled: PropTypes.bool,
  
  /** Additional CSS classes */
  className: PropTypes.string,
  
  /** ID for accessibility */
  id: PropTypes.string,
};

export default Radio;
