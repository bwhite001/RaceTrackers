import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/classNames';

/**
 * FormGroup Component
 * 
 * Wrapper component for form fields that provides consistent spacing
 * and layout for labels, inputs, and helper text.
 * 
 * @component
 */
const FormGroup = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn('space-y-1.5', className)}
      {...props}
    >
      {children}
    </div>
  );
};

FormGroup.propTypes = {
  /** Form field components */
  children: PropTypes.node.isRequired,
  
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default FormGroup;
