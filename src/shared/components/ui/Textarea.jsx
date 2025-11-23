import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../../design-system/utils/classNames';

/**
 * Textarea Component
 * 
 * Enhanced textarea with auto-resize and character count.
 * 
 * @component
 * @example
 * <Textarea
 *   value={notes}
 *   onChange={setNotes}
 *   placeholder="Enter notes..."
 *   maxLength={500}
 *   showCount={true}
 *   autoResize={true}
 * />
 */
const Textarea = ({
  value,
  onChange,
  placeholder,
  rows = 3,
  maxLength,
  showCount = false,
  autoResize = false,
  disabled = false,
  error,
  className,
  ...props
}) => {
  const textareaRef = useRef(null);

  // Auto-resize functionality
  useEffect(() => {
    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value, autoResize]);

  const characterCount = value?.length || 0;
  const isOverLimit = maxLength && characterCount > maxLength;

  return (
    <div className="space-y-1">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        className={cn(
          'block w-full px-3 py-2 rounded-lg border',
          'bg-white dark:bg-gray-800',
          'text-gray-900 dark:text-gray-100',
          'placeholder-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-navy-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'resize-none transition-colors',
          error || isOverLimit
            ? 'border-red-300 dark:border-red-700 focus:ring-red-500'
            : 'border-gray-300 dark:border-gray-600',
          className
        )}
        {...props}
      />

      {/* Character Count */}
      {(showCount || maxLength) && (
        <div className="flex justify-end">
          <span
            className={cn(
              'text-xs',
              isOverLimit
                ? 'text-red-600 dark:text-red-400 font-medium'
                : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {characterCount}
            {maxLength && ` / ${maxLength}`}
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};

Textarea.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  rows: PropTypes.number,
  maxLength: PropTypes.number,
  showCount: PropTypes.bool,
  autoResize: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  className: PropTypes.string,
};

export default Textarea;
