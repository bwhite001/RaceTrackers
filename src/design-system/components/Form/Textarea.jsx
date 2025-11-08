import React, { forwardRef, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/classNames';

/**
 * Textarea Component
 * 
 * A flexible textarea component with support for auto-resize and character counting.
 * 
 * @component
 * @example
 * <Textarea
 *   placeholder="Enter description"
 *   value={value}
 *   onChange={handleChange}
 *   rows={4}
 * />
 */
const Textarea = forwardRef(({
  size = 'md',
  error = false,
  disabled = false,
  autoResize = false,
  maxLength,
  showCount = false,
  className,
  ...props
}, ref) => {
  const textareaRef = useRef(null);
  const combinedRef = ref || textareaRef;

  // Auto-resize functionality
  useEffect(() => {
    if (!autoResize || !combinedRef.current) return;

    const textarea = combinedRef.current;
    const adjustHeight = () => {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    };

    adjustHeight();
    textarea.addEventListener('input', adjustHeight);

    return () => {
      textarea.removeEventListener('input', adjustHeight);
    };
  }, [autoResize, combinedRef, props.value]);

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
    'resize-vertical'
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

  const textareaClasses = cn(
    baseStyles,
    stateStyles,
    bgStyles,
    sizeStyles[size],
    autoResize && 'resize-none overflow-hidden',
    className
  );

  const currentLength = props.value?.length || 0;
  const showCounter = showCount && maxLength;

  return (
    <div className="relative">
      <textarea
        ref={combinedRef}
        disabled={disabled}
        maxLength={maxLength}
        className={textareaClasses}
        aria-invalid={error}
        {...props}
      />

      {/* Character counter */}
      {showCounter && (
        <div
          className={cn(
            'absolute bottom-2 right-2 text-xs',
            currentLength > maxLength * 0.9
              ? 'text-red-600 dark:text-red-500'
              : 'text-gray-500 dark:text-gray-400'
          )}
        >
          {currentLength} / {maxLength}
        </div>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

Textarea.propTypes = {
  /** Size of the textarea */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  
  /** Whether the textarea has an error */
  error: PropTypes.bool,
  
  /** Whether the textarea is disabled */
  disabled: PropTypes.bool,
  
  /** Whether to auto-resize based on content */
  autoResize: PropTypes.bool,
  
  /** Maximum character length */
  maxLength: PropTypes.number,
  
  /** Whether to show character count */
  showCount: PropTypes.bool,
  
  /** Current value (for character counting) */
  value: PropTypes.string,
  
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default Textarea;
