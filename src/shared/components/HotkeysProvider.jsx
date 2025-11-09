import React, { createContext, useContext, useCallback } from 'react';
import PropTypes from 'prop-types';
import useHotkeys, { HOTKEY_COMBINATIONS } from '../hooks/useHotkeys';

// Create context
const HotkeysContext = createContext({
  isEnabled: true,
  trigger: () => {},
  combinations: HOTKEY_COMBINATIONS
});

/**
 * HotkeysProvider Component
 * Provides hotkey functionality to its children
 */
const HotkeysProvider = ({
  children,
  hotkeys = {},
  enabled = true,
  allowedKeys,
  enableInForms = false,
  preventDefault = true,
  stopPropagation = true,
  filter
}) => {
  // Custom filter to handle form elements
  const hotkeyFilter = useCallback((event) => {
    // If a custom filter is provided, run it first
    if (filter && !filter(event)) {
      return false;
    }

    // Handle form elements based on enableInForms setting
    const isFormElement = /^(input|textarea|select)$/i.test(event.target.tagName);
    const isContentEditable = event.target.isContentEditable;

    if ((isFormElement || isContentEditable) && !enableInForms) {
      return false;
    }

    return true;
  }, [filter, enableInForms]);

  // Initialize hotkeys hook
  const { isEnabled, trigger } = useHotkeys(hotkeys, {
    enabled,
    allowedKeys,
    preventDefault,
    stopPropagation,
    filter: hotkeyFilter
  });

  // Create context value
  const contextValue = {
    isEnabled,
    trigger,
    combinations: HOTKEY_COMBINATIONS
  };

  return (
    <HotkeysContext.Provider value={contextValue}>
      {children}
    </HotkeysContext.Provider>
  );
};

HotkeysProvider.propTypes = {
  children: PropTypes.node.isRequired,
  hotkeys: PropTypes.objectOf(PropTypes.func),
  enabled: PropTypes.bool,
  allowedKeys: PropTypes.arrayOf(PropTypes.string),
  enableInForms: PropTypes.bool,
  preventDefault: PropTypes.bool,
  stopPropagation: PropTypes.bool,
  filter: PropTypes.func
};

// Custom hook to use hotkeys context
export const useHotkeysContext = () => {
  const context = useContext(HotkeysContext);
  if (!context) {
    throw new Error('useHotkeysContext must be used within a HotkeysProvider');
  }
  return context;
};

// Export component
export default HotkeysProvider;
