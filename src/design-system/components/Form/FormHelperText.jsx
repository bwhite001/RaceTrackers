import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/classNames';

/**
 * FormHelperText Component
 * 
 * Helper text component for providing additional information about a form field.
 * 
 * @component
 */
const FormHelperText = ({
  children,
  className,
  ...props
}) => {
  return (
    <p
      className={cn(
        'text-sm text-gray-600 dark:text-gray-400',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
};

FormHelperText.propTypes = {
  /** Helper text content */
  children: PropTypes.node.isRequired,
  
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default FormHelperText;
