import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../../design-system/utils/classNames';

/**
 * ColorPicker Component
 * 
 * Color input with preview and preset swatches.
 * 
 * @component
 * @example
 * <ColorPicker
 *   value="#ff0000"
 *   onChange={handleColorChange}
 *   label="Primary Color"
 *   presets={['#ff0000', '#00ff00', '#0000ff']}
 * />
 */
const ColorPicker = ({
  value,
  onChange,
  label,
  presets = [],
  showInput = true,
  disabled = false,
  className,
  ...props
}) => {
  const handleColorChange = (newColor) => {
    onChange(newColor);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div className="flex items-center gap-3">
        {/* Color Preview & Input */}
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => handleColorChange(e.target.value)}
            disabled={disabled}
            className={cn(
              'w-12 h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600',
              'cursor-pointer touch-target',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-navy-500'
            )}
            {...props}
          />
        </div>

        {/* Hex Input */}
        {showInput && (
          <input
            type="text"
            value={value}
            onChange={(e) => handleColorChange(e.target.value)}
            disabled={disabled}
            className={cn(
              'flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
              'focus:outline-none focus:ring-2 focus:ring-navy-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'font-mono text-sm'
            )}
            placeholder="#000000"
            maxLength={7}
          />
        )}
      </div>

      {/* Preset Swatches */}
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleColorChange(preset)}
              disabled={disabled}
              className={cn(
                'w-8 h-8 rounded-md border-2 transition-all',
                'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-navy-500',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                value === preset
                  ? 'border-navy-500 ring-2 ring-navy-500'
                  : 'border-gray-300 dark:border-gray-600'
              )}
              style={{ backgroundColor: preset }}
              aria-label={`Select color ${preset}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

ColorPicker.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  presets: PropTypes.arrayOf(PropTypes.string),
  showInput: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default ColorPicker;
