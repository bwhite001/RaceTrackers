import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../../design-system/utils/classNames';

/**
 * FormField Component
 * 
 * Wrapper for form inputs with label, error, and helper text.
 * Standardizes form field layouts across the application.
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
