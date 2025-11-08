import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/classNames';
import { useTabs } from './Tabs';

/**
 * TabPanel Component
 * 
 * Individual tab content panel. Only renders when its corresponding
 * tab is active.
 * 
 * @component
 */
const TabPanel = ({
  children,
  index,
  className,
  keepMounted = false,
  ...props
}) => {
  const { activeTab } = useTabs();
  const isActive = activeTab === index;

  // If keepMounted is false and panel is not active, don't render
  if (!keepMounted && !isActive) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      hidden={!isActive}
      className={cn(
        'focus:outline-none',
        !isActive && 'hidden',
        className
      )}
      tabIndex={0}
      {...props}
    >
      {children}
    </div>
  );
};

TabPanel.propTypes = {
  /** Panel content */
  children: PropTypes.node.isRequired,
  
  /** Panel index (automatically assigned by parent) */
  index: PropTypes.number.isRequired,
  
  /** Keep panel mounted in DOM when inactive */
  keepMounted: PropTypes.bool,
  
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default TabPanel;
