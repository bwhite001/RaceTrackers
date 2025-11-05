import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/classNames';
import { useTabs } from './Tabs';

/**
 * Tab Component
 * 
 * Individual tab button. Automatically manages active state and
 * keyboard navigation.
 * 
 * @component
 */
const Tab = ({
  children,
  index,
  disabled = false,
  leftIcon,
  rightIcon,
  badge,
  className,
  ...props
}) => {
  const { activeTab, setActiveTab, orientation, variant } = useTabs();
  const tabRef = useRef(null);
  const isActive = activeTab === index;

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;

    const isHorizontal = orientation === 'horizontal';
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';

    if (e.key === nextKey || e.key === prevKey) {
      e.preventDefault();
      const tabs = Array.from(
        tabRef.current.parentElement.querySelectorAll('[role="tab"]:not([disabled])')
      );
      const currentIndex = tabs.indexOf(tabRef.current);
      const nextIndex = e.key === nextKey ? currentIndex + 1 : currentIndex - 1;
      
      if (nextIndex >= 0 && nextIndex < tabs.length) {
        tabs[nextIndex].focus();
        tabs[nextIndex].click();
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      const firstTab = tabRef.current.parentElement.querySelector('[role="tab"]:not([disabled])');
      if (firstTab) {
        firstTab.focus();
        firstTab.click();
      }
    } else if (e.key === 'End') {
      e.preventDefault();
      const tabs = Array.from(
        tabRef.current.parentElement.querySelectorAll('[role="tab"]:not([disabled])')
      );
      const lastTab = tabs[tabs.length - 1];
      if (lastTab) {
        lastTab.focus();
        lastTab.click();
      }
    }
  };

  // Base styles
  const baseStyles = cn(
    'inline-flex items-center justify-center font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
    disabled && 'opacity-50 cursor-not-allowed'
  );

  // Variant styles
  const variantStyles = {
    underline: {
      base: cn(
        'px-4 py-2 text-sm border-b-2 whitespace-nowrap',
        orientation === 'horizontal' ? 'border-b-2' : 'border-r-2'
      ),
      active: cn(
        'border-navy-600 text-navy-600 dark:text-navy-400',
        orientation === 'horizontal' ? 'border-b-navy-600' : 'border-r-navy-600'
      ),
      inactive: cn(
        'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
        'dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
      ),
    },
    pills: {
      base: 'px-4 py-2 text-sm rounded-lg whitespace-nowrap',
      active: 'bg-navy-600 text-white dark:bg-navy-500',
      inactive: cn(
        'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
      ),
    },
    enclosed: {
      base: cn(
        'px-4 py-2 text-sm border whitespace-nowrap',
        orientation === 'horizontal'
          ? 'border-b-0 rounded-t-lg -mb-px'
          : 'border-r-0 rounded-l-lg -mr-px'
      ),
      active: cn(
        'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
        'text-navy-600 dark:text-navy-400'
      ),
      inactive: cn(
        'bg-gray-50 dark:bg-gray-900 border-transparent',
        'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
      ),
    },
  };

  const tabClasses = cn(
    baseStyles,
    variantStyles[variant].base,
    isActive ? variantStyles[variant].active : variantStyles[variant].inactive,
    className
  );

  return (
    <button
      ref={tabRef}
      role="tab"
      type="button"
      aria-selected={isActive}
      aria-controls={`tabpanel-${index}`}
      id={`tab-${index}`}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      className={tabClasses}
      onClick={() => !disabled && setActiveTab(index)}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {/* Left icon */}
      {leftIcon && (
        <span className="mr-2 w-5 h-5">
          {leftIcon}
        </span>
      )}

      {/* Content */}
      <span>{children}</span>

      {/* Badge */}
      {badge && (
        <span className="ml-2">
          {badge}
        </span>
      )}

      {/* Right icon */}
      {rightIcon && (
        <span className="ml-2 w-5 h-5">
          {rightIcon}
        </span>
      )}
    </button>
  );
};

Tab.propTypes = {
  /** Tab content */
  children: PropTypes.node.isRequired,
  
  /** Tab index (automatically assigned by parent) */
  index: PropTypes.number.isRequired,
  
  /** Whether the tab is disabled */
  disabled: PropTypes.bool,
  
  /** Icon to display on the left */
  leftIcon: PropTypes.node,
  
  /** Icon to display on the right */
  rightIcon: PropTypes.node,
  
  /** Badge to display (e.g., count) */
  badge: PropTypes.node,
  
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default Tab;
