import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/classNames';

/**
 * ModalFooter Component
 * 
 * Footer section for Modal, typically containing action buttons.
 * 
 * @component
 */
const ModalFooter = ({
  children,
  align = 'right',
  className,
  ...props
}) => {
  // Alignment styles
  const alignStyles = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div
      className={cn(
        'px-6 py-4 border-t border-gray-200 dark:border-gray-700',
        'flex items-center gap-3',
        alignStyles[align],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

ModalFooter.propTypes = {
  /** Footer content (typically buttons) */
  children: PropTypes.node.isRequired,
  
  /** Alignment of footer content */
  align: PropTypes.oneOf(['left', 'center', 'right', 'between']),
  
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default ModalFooter;
