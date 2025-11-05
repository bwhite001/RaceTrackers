import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/classNames';
import { useTabs } from './Tabs';

/**
 * TabList Component
 * 
 * Container for Tab components. Handles layout and styling based on
 * the parent Tabs configuration.
 * 
 * @component
 */
const TabList = ({ children, className, ...props }) => {
  const { orientation, variant } = useTabs();

  // Base styles
  const baseStyles = 'flex';

  // Orientation styles
  const orientationStyles = {
    horizontal: 'flex-row overflow-x-auto',
    vertical: 'flex-col',
  };

  // Variant styles
  const variantStyles = {
    underline: {
      horizontal: 'border-b border-gray-200 dark:border-gray-700',
      vertical: 'border-r border-gray-200 dark:border-gray-700 pr-4',
    },
    pills: {
      horizontal: 'space-x-2',
      vertical: 'space-y-2',
    },
    enclosed: {
      horizontal: 'border-b border-gray-200 dark:border-gray-700',
      vertical: 'border-r border-gray-200 dark:border-gray-700 pr-4',
    },
  };

  return (
    <div
      role="tablist"
      aria-orientation={orientation}
      className={cn(
        baseStyles,
        orientationStyles[orientation],
        variantStyles[variant][orientation],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

TabList.propTypes = {
  /** Tab components */
  children: PropTypes.node.isRequired,
  
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default TabList;
