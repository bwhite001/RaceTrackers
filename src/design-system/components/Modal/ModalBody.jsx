import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/classNames';

/**
 * ModalBody Component
 * 
 * Main content area for Modal. Scrollable if content exceeds available space.
 * 
 * @component
 */
const ModalBody = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'px-6 py-4 overflow-y-auto flex-1',
        'text-gray-700 dark:text-gray-300',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

ModalBody.propTypes = {
  /** Body content */
  children: PropTypes.node.isRequired,
  
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default ModalBody;
