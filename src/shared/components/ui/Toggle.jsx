import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../../design-system/utils/classNames';

/**
 * Toggle Component
 * 
 * Accessible switch component following WCAG 2.1 guidelines.
 * Replaces 9+ duplicated toggle implementations.
 * 
 * @component
 * @example
 * <Toggle
 *   checked={darkMode}
 *   onChange={setDarkMode}
 *   label="Dark Mode"
 *   description="Switch between light and dark themes"
 * />
 */
const Toggle = ({
  checked = false,
  onChange,
  label,
  description,
  size = 'md',
  disabled = false,
  loading = false,
  labelPosition = 'left',
  className,
  ...props
}) => {
  const sizes = {
    sm: {
      track: 'h-5 w-9',
      thumb: 'h-3 w-3',
      translate: 'translate-x-5'
    },
    md: {
      track: 'h-6 w-11',
      thumb: 'h-4 w-4',
      translate: 'translate-x-6'
    },
    lg: {
      track: 'h-7 w-14',
      thumb: 'h-5 w-5',
      translate: 'translate-x-8'
    }
  };

  const sizeClasses = sizes[size];

  const handleChange = () => {
    if (!disabled && !loading) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleChange();
    }
  };

  const ToggleSwitch = () => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled || loading}
      onClick={handleChange}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'touch-target',
        sizeClasses.track,
        checked
          ? 'bg-green-500 dark:bg-green-600'
          : 'bg-gray-300 dark:bg-gray-600',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          'inline-block transform bg-white rounded-full transition-transform duration-200 ease-in-out',
          sizeClasses.thumb,
          checked ? sizeClasses.translate : 'translate-x-1'
        )}
      />
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg
            className="animate-spin h-3 w-3 text-white"
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
        </span>
      )}
    </button>
  );

  if (!label) {
    return <ToggleSwitch />;
  }

  const LabelContent = () => (
    <div className="flex-1">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {description}
        </p>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        'flex items-center gap-3',
        labelPosition === 'left' ? 'justify-between' : 'flex-row-reverse justify-end'
      )}
    >
      {labelPosition === 'left' && <LabelContent />}
      <ToggleSwitch />
      {labelPosition === 'right' && <LabelContent />}
    </div>
  );
};

Toggle.propTypes = {
  checked: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  description: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  labelPosition: PropTypes.oneOf(['left', 'right']),
  className: PropTypes.string,
};

export default Toggle;
