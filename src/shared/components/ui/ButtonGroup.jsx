import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../../design-system/utils/classNames';

/**
 * ButtonGroup Component
 * 
 * Enhanced button groups for related actions with selection support.
 * 
 * @component
 * @example
 * <ButtonGroup
 *   options={[
 *     { value: 'grid', label: 'Grid', icon: <GridIcon /> },
 *     { value: 'list', label: 'List', icon: <ListIcon /> }
 *   ]}
 *   value={viewMode}
 *   onChange={setViewMode}
 * />
 */
const ButtonGroup = ({
  options,
  value,
  onChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  disabled = false,
  className,
}) => {
  const variants = {
    default: {
      container: 'bg-gray-100 dark:bg-gray-800',
      button: 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
      active: 'bg-white dark:bg-gray-700 text-navy-600 dark:text-navy-400 shadow-sm',
    },
    pills: {
      container: 'bg-transparent gap-2',
      button: 'text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-gray-400',
      active: 'bg-navy-600 text-white border-navy-600',
    },
    tabs: {
      container: 'bg-transparent border-b border-gray-200 dark:border-gray-700',
      button: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-b-2 border-transparent',
      active: 'text-navy-600 dark:text-navy-400 border-navy-600',
    },
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  const variantStyles = variants[variant];

  return (
    <div
      className={cn(
        'inline-flex rounded-lg p-1',
        variantStyles.container,
        fullWidth && 'w-full',
        className
      )}
      role="group"
    >
      {options.map((option) => {
        const isActive = value === option.value;
        const isDisabled = disabled || option.disabled;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => !isDisabled && onChange(option.value)}
            disabled={isDisabled}
            className={cn(
              'inline-flex items-center justify-center gap-2',
              'font-medium rounded-md transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'touch-target',
              sizes[size],
              fullWidth && 'flex-1',
              isActive ? variantStyles.active : variantStyles.button
            )}
            aria-pressed={isActive}
          >
            {option.icon && (
              <span className="w-5 h-5">{option.icon}</span>
            )}
            {option.label}
            {option.badge && (
              <span className={cn(
                'px-1.5 py-0.5 text-xs rounded-full',
                isActive
                  ? 'bg-navy-100 dark:bg-navy-900 text-navy-800 dark:text-navy-200'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              )}>
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

ButtonGroup.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
      badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      disabled: PropTypes.bool,
    })
  ).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['default', 'pills', 'tabs']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default ButtonGroup;
