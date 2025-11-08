import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/classNames';

/**
 * ModalHeader Component
 * 
 * Header section for Modal with title and optional subtitle.
 * 
 * @component
 */
const ModalHeader = ({
  children,
  title,
  subtitle,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'px-6 py-4 border-b border-gray-200 dark:border-gray-700',
        className
      )}
      {...props}
    >
      {children || (
        <>
          {title && (
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white pr-8">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </>
      )}
    </div>
  );
};

ModalHeader.propTypes = {
  /** Custom content (overrides title and subtitle) */
  children: PropTypes.node,
  
  /** Header title */
  title: PropTypes.string,
  
  /** Header subtitle */
  subtitle: PropTypes.string,
  
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default ModalHeader;
