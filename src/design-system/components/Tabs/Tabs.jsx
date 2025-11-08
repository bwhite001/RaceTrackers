import React, { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/classNames';

/**
 * Tabs Context
 * Manages the active tab state and provides it to child components
 */
const TabsContext = createContext({
  activeTab: 0,
  setActiveTab: () => {},
  orientation: 'horizontal',
  variant: 'underline',
});

/**
 * Hook to access Tabs context
 */
export const useTabs = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs compound components must be used within a Tabs component');
  }
  return context;
};

/**
 * Tabs Component
 * 
 * A flexible tabs component for organizing content into separate views.
 * Supports horizontal and vertical orientations, multiple visual styles,
 * and keyboard navigation.
 * 
 * @component
 * @example
 * <Tabs defaultTab={0}>
 *   <TabList>
 *     <Tab>Tab 1</Tab>
 *     <Tab>Tab 2</Tab>
 *     <Tab>Tab 3</Tab>
 *   </TabList>
 *   <TabPanels>
 *     <TabPanel>Content 1</TabPanel>
 *     <TabPanel>Content 2</TabPanel>
 *     <TabPanel>Content 3</TabPanel>
 *   </TabPanels>
 * </Tabs>
 */
const Tabs = ({
  children,
  defaultTab = 0,
  activeTab: controlledActiveTab,
  onChange,
  orientation = 'horizontal',
  variant = 'underline',
  className,
  ...props
}) => {
  // Support both controlled and uncontrolled modes
  const [uncontrolledActiveTab, setUncontrolledActiveTab] = useState(defaultTab);
  const isControlled = controlledActiveTab !== undefined;
  const activeTab = isControlled ? controlledActiveTab : uncontrolledActiveTab;

  const setActiveTab = useCallback(
    (index) => {
      if (!isControlled) {
        setUncontrolledActiveTab(index);
      }
      if (onChange) {
        onChange(index);
      }
    },
    [isControlled, onChange]
  );

  const contextValue = {
    activeTab,
    setActiveTab,
    orientation,
    variant,
  };

  // Container styles based on orientation
  const containerStyles = {
    horizontal: 'flex flex-col',
    vertical: 'flex flex-row',
  };

  return (
    <TabsContext.Provider value={contextValue}>
      <div
        className={cn(containerStyles[orientation], className)}
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
};

Tabs.propTypes = {
  /** Child components (TabList and TabPanels) */
  children: PropTypes.node.isRequired,
  
  /** Default active tab index (uncontrolled mode) */
  defaultTab: PropTypes.number,
  
  /** Active tab index (controlled mode) */
  activeTab: PropTypes.number,
  
  /** Callback when tab changes */
  onChange: PropTypes.func,
  
  /** Orientation of the tabs */
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  
  /** Visual style variant */
  variant: PropTypes.oneOf(['underline', 'pills', 'enclosed']),
  
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default Tabs;
