import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/classNames';

/**
 * FormLabel Component
 * 
 * Label component for form fields with optional required indicator.
 * 
 * @component
 */
const FormLabel = ({
  children,
  htmlFor,
  required = false,
  className,
  ...props
}) => {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        'block text-sm font-medium text-gray-700 dark:text-gray-300',
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="text-red-600 dark:text-red-500 ml-1" aria-label="required">
          *
        </span>
      )}
    </label>
  );
};

FormLabel.propTypes = {
  /** Label text */
  children: PropTypes.node.isRequired,
  
  /** ID of the form field this label is for */
  htmlFor: PropTypes.string,
  
  /** Whether the field is required */
  required: PropTypes.bool,
  
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default FormLabel;
