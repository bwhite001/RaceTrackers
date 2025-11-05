import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/classNames';
import { useTabs } from './Tabs';

/**
 * TabPanels Component
 * 
 * Container for TabPanel components. Handles layout based on
 * the parent Tabs configuration.
 * 
 * @component
 */
const TabPanels = ({ children, className, ...props }) => {
  const { orientation } = useTabs();

  // Base styles
  const baseStyles = 'flex-1';

  // Orientation styles
  const orientationStyles = {
    horizontal: 'mt-4',
    vertical: 'ml-4',
  };

  return (
    <div
      className={cn(
        baseStyles,
        orientationStyles[orientation],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

TabPanels.propTypes = {
  /** TabPanel components */
  children: PropTypes.node.isRequired,
  
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default TabPanels;
