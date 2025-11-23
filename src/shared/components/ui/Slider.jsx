import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../../design-system/utils/classNames';

/**
 * Slider Component
 * 
 * Range input with value display and formatting.
 * 
 * @component
 * @example
 * <Slider
 *   value={1.0}
 *   onChange={handleChange}
 *   min={0.8}
 *   max={1.5}
 *   step={0.1}
 *   formatValue={(v) => `${Math.round(v * 100)}%`}
 * />
 */
const Slider = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  showValue = true,
  formatValue,
  marks = [],
  disabled = false,
  className,
  ...props
}) => {
  const displayValue = formatValue ? formatValue(value) : value;
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Value Display */}
      {showValue && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {displayValue}
          </span>
        </div>
      )}

      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          className={cn(
            'w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-navy-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:w-4',
            '[&::-webkit-slider-thumb]:h-4',
            '[&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:bg-navy-600',
            '[&::-webkit-slider-thumb]:cursor-pointer',
            '[&::-webkit-slider-thumb]:hover:bg-navy-700',
            '[&::-moz-range-thumb]:w-4',
            '[&::-moz-range-thumb]:h-4',
            '[&::-moz-range-thumb]:rounded-full',
            '[&::-moz-range-thumb]:bg-navy-600',
            '[&::-moz-range-thumb]:border-0',
            '[&::-moz-range-thumb]:cursor-pointer',
            '[&::-moz-range-thumb]:hover:bg-navy-700'
          )}
          style={{
            background: `linear-gradient(to right, rgb(30, 58, 138) 0%, rgb(30, 58, 138) ${percentage}%, rgb(229, 231, 235) ${percentage}%, rgb(229, 231, 235) 100%)`
          }}
          {...props}
        />

        {/* Marks */}
        {marks.length > 0 && (
          <div className="flex justify-between mt-1">
            {marks.map((mark) => (
              <span
                key={mark}
                className="text-xs text-gray-500 dark:text-gray-400"
              >
                {formatValue ? formatValue(mark) : mark}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

Slider.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  showValue: PropTypes.bool,
  formatValue: PropTypes.func,
  marks: PropTypes.arrayOf(PropTypes.number),
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default Slider;
