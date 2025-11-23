# SOLID & DRY Implementation Guide

## Quick Reference for Component Implementation

This guide provides detailed implementation examples for each reusable component in the refactoring plan.

---

## Table of Contents

- [SOLID \& DRY Implementation Guide](#solid--dry-implementation-guide)
  - [Quick Reference for Component Implementation](#quick-reference-for-component-implementation)
  - [Table of Contents](#table-of-contents)
  - [Toggle Component](#toggle-component)
  - [ColorPicker Component](#colorpicker-component)
  - [SettingsSection Component](#settingssection-component)
  - [SettingItem Component](#settingitem-component)
  - [Slider Component](#slider-component)
  - [FormField Component](#formfield-component)
  - [DialogHeader Component](#dialogheader-component)
  - [DialogFooter Component](#dialogfooter-component)

---

## Toggle Component

**File:** `src/shared/components/ui/Toggle.jsx`

```jsx
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
```

**Usage Example:**
```jsx
// In SettingsModal.jsx
import { Toggle } from '../../shared/components/ui';

<Toggle
  checked={localSettings.darkMode}
  onChange={(value) => handleSettingChange('darkMode', value)}
  label="Dark Mode"
  description="Switch between light and dark themes"
  size="md"
/>
```

---

## ColorPicker Component

**File:** `src/shared/components/ui/ColorPicker.jsx`

```jsx
import React, { useState } from 'react';
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
  const [isOpen, setIsOpen] = useState(false);

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
```

---

## SettingsSection Component

**File:** `src/shared/components/ui/SettingsSection.jsx`

```jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { cn } from '../../../design-system/utils/classNames';

/**
 * SettingsSection Component
 * 
 * Collapsible section for grouping related settings.
 * 
 * @component
 * @example
 * <SettingsSection
 *   title="Appearance"
 *   icon="🎨"
 *   description="Customize the look and feel"
 *   collapsible={true}
 * >
 *   {children}
 * </SettingsSection>
 */
const SettingsSection = ({
  title,
  icon,
  description,
  children,
  collapsible = false,
  defaultOpen = true,
  badge,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleOpen = () => {
    if (collapsible) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <section className={cn('space-y-4', className)}>
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between',
          collapsible && 'cursor-pointer select-none'
        )}
        onClick={toggleOpen}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <span className="text-2xl" aria-hidden="true">
              {icon}
            </span>
          )}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
              {title}
              {badge && (
                <span className="px-2 py-0.5 text-xs font-medium bg-navy-100 dark:bg-navy-900 text-navy-800 dark:text-navy-200 rounded-full">
                  {badge}
                </span>
              )}
            </h3>
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>

        {collapsible && (
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label={isOpen ? 'Collapse section' : 'Expand section'}
          >
            {isOpen ? (
              <ChevronUpIcon className="w-5 h-5" />
            ) : (
              <ChevronDownIcon className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {/* Content */}
      {isOpen && (
        <div className="space-y-3 pl-11">
          {children}
        </div>
      )}
    </section>
  );
};

SettingsSection.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.node,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
  collapsible: PropTypes.bool,
  defaultOpen: PropTypes.bool,
  badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string,
};

export default SettingsSection;
```

---

## SettingItem Component

**File:** `src/shared/components/ui/SettingItem.jsx`

```jsx
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
```

---

## Slider Component

**File:** `src/shared/components/ui/Slider.jsx`

```jsx
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
```

---

## FormField Component

**File:** `src/shared/components/ui/FormField.jsx`

```jsx
import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../../design-system/utils/classNames';

/**
 * FormField Component
 * 
 * Wrapper for form inputs with label, error, and helper text.
 * 
 * @component
 * @example
 * <FormField
 *   label="Runner Number"
 *   required={true}
 *   error={errors.runnerNumber}
 *   helperText="Enter a valid runner number"
 * >
 *   <Input value={runnerNumber} onChange={handleChange} />
 * </FormField>
 */
const FormField = ({
  label,
  required = false,
  error,
  helperText,
  children,
  htmlFor,
  className,
}) => {
  return (
    <div className={cn('space-y-1', className)}>
      {/* Label */}
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input */}
      <div>{children}</div>

      {/* Helper Text or Error */}
      {(error || helperText) && (
        <div className="min-h-[20px]">
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </p>
          ) : helperText ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {helperText}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
};

FormField.propTypes = {
  label: PropTypes.string,
  required: PropTypes.bool,
  error: PropTypes.string,
  helperText: PropTypes.string,
  children: PropTypes.node.isRequired,
  htmlFor: PropTypes.string,
  className: PropTypes.string,
};

export default FormField;
```

---

## DialogHeader Component

**File:** `src/shared/components/ui/DialogHeader.jsx`

```jsx
import React from 'react';
import PropTypes from 'prop-types';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '../../../design-system/utils/classNames';

/**
 * DialogHeader Component
 * 
 * Consistent header for dialogs with title, subtitle, and close button.
 * 
 * @component
 * @example
 * <DialogHeader
 *   title="Vet Out Runner"
 *   subtitle="Failed veterinary check"
 *   onClose={handleClose}
 *   icon={<ExclamationIcon />}
 * />
 */
const DialogHeader = ({
  title,
  subtitle,
  icon,
  onClose,
  showCloseButton = true,
  sticky = true,
  actions,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700',
        'bg-white dark:bg-gray-800',
        sticky && 'sticky top-0 z-10',
        className
      )}
    >
      {/* Title Section */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {icon && (
          <div className="flex-shrink-0 text-gray-400 dark:text-gray-500">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Actions Section */}
      <div className="flex items-center gap-2 ml-4">
        {actions}
        {showCloseButton && onClose && (
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200',
              'rounded-lg transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-navy-500',
              'touch-target'
            )}
            aria-label="Close dialog"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};

DialogHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.node,
  onClose: PropTypes.func,
  showCloseButton: PropTypes.bool,
  sticky: PropTypes.bool,
  actions: PropTypes.node,
  className: PropTypes.string,
};

export default DialogHeader;
```

---

## DialogFooter Component

**File:** `src/shared/components/ui/DialogFooter.jsx`

```jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '../../../design-system/components';
import { cn } from '../../../design-system/utils/classNames';

/**
 * DialogFooter Component
 * 
 * Consistent footer for dialogs with action buttons.
 * 
 * @component
 * @example
 * <DialogFooter
 *   primaryAction={{
 *     label: 'Save',
 *     onClick: handleSave,
 *     loading: isSaving
 *   }}
 *   secondaryAction={{
 *     label: 'Cancel',
 *     onClick: handleCancel
 *   }}
 * />
 */
const DialogFooter = ({
  primaryAction,
  secondaryAction,
  tertiaryAction,
  sticky = true,
  align = 'right',
  className,
  children,
}) => {
  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-6 border-t border-gray-200 dark:border-gray-700',
        'bg-gray-50 dark:bg-gray-900',
        sticky && 'sticky bottom-0',
        alignmentClasses[align],
        className
      )}
    >
      {/* Custom Children (left side) */}
      {children && <div className="flex-1">{children}</div>}

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {tertiaryAction && (
          <Button
            variant="ghost"
            onClick={tertiaryAction.onClick}
            disabled={tertiaryAction.disabled || tertiaryAction.loading}
            loading={tertiaryAction.loading}
            {...tertiaryAction.props}
          >
            {tertiaryAction.label}
          </Button>
        )}

        {secondaryAction && (
          <Button
            variant="secondary"
            onClick={secondaryAction.onClick}
            disabled={secondaryAction.disabled || secondaryAction.loading}
            loading={secondaryAction.loading}
            {...secondaryAction.props}
          >
            {secondaryAction.label}
          </Button>
        )}

        {primaryAction && (
          <Button
            variant={primaryAction.variant || 'primary'}
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled || primaryAction.loading}
            loading={primaryAction.loading}
            {...primaryAction.props}
          >
            {primaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
};

DialogFooter.propTypes = {
  primaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    variant: PropTypes.string,
    props: PropTypes.object,
  }),
  secondaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    props: PropTypes.object,
  }),
  tertiaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick
