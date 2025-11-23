import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../../design-system/utils/classNames';

/**
 * SettingItem Component
 * 
 * Individual setting row with label, description, and control.
 * 
 * @component
 * @example
 * <SettingItem
 *   label="Font Size"
 *   description="Adjust the application-wide font size"
 *   helperText="Range: 80% to 150%"
 * >
 *   <Slider value={fontSize} onChange={handleChange} />
 * </SettingItem>
 */
const SettingItem = ({
  label,
  description,
  helperText,
  error,
  required = false,
  children,
  layout = 'horizontal',
  className,
}) => {
  const isHorizontal = layout === 'horizontal';

  return (
    <div
      className={cn(
        'py-3 px-4 rounded-lg border border-gray-200 dark:border-gray-700',
        error && 'border-red-300 dark:border-red-700',
        className
      )}
    >
      <div
        className={cn(
          'flex gap-3',
          isHorizontal ? 'items-center justify-between' : 'flex-col'
        )}
      >
        {/* Label Section */}
        <div className={cn(isHorizontal && 'flex-1')}>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {description}
            </p>
          )}
        </div>

        {/* Control Section */}
        <div className={cn(!isHorizontal && 'mt-2')}>
          {children}
        </div>
      </div>

      {/* Helper Text or Error */}
      {(helperText || error) && (
        <div className="mt-2">
          {error ? (
            <p className="text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {helperText}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

SettingItem.propTypes = {
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
  helperText: PropTypes.string,
  error: PropTypes.string,
  required: PropTypes.bool,
  children: PropTypes.node.isRequired,
  layout: PropTypes.oneOf(['horizontal', 'vertical']),
  className: PropTypes.string,
};

export default SettingItem;
