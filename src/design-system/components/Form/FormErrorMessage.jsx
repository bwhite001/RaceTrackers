import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/classNames';

/**
 * FormErrorMessage Component
 * 
 * Error message component for displaying validation errors.
 * 
 * @component
 */
const FormErrorMessage = ({
  children,
  className,
  ...props
}) => {
  if (!children) return null;

  return (
    <p
      className={cn(
        'text-sm text-red-600 dark:text-red-500 flex items-center gap-1',
        className
      )}
      role="alert"
      {...props}
    >
      <svg
        className="w-4 h-4 flex-shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      <span>{children}</span>
    </p>
  );
};

FormErrorMessage.propTypes = {
  /** Error message content */
  children: PropTypes.node,
  
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default FormErrorMessage;
