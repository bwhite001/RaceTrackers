import React, { createContext, useContext, useCallback } from 'react';
import PropTypes from 'prop-types';
import useHotkeysHook, { HOTKEY_COMBINATIONS } from '../hooks/useHotkeys';

// Create context — null default so useHotkeysContext throws outside a provider
const HotkeysContext = createContext(null);

/**
 * HotkeysProvider Component
 * Provides hotkey functionality to its children
 */
const HotkeysProvider = ({
  children,
  hotkeys: hotkeysMap = {},
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
  const { isEnabled, trigger } = useHotkeysHook(hotkeysMap, {
    enabled,
    allowedKeys,
    preventDefault,
    stopPropagation,
    filter: hotkeyFilter,
    enableInForms
  });

  // Create context value
  const contextValue = {
    isEnabled,
    trigger,
    combinations: HOTKEY_COMBINATIONS,
    hotkeys: hotkeysMap
  };

  return (
    <HotkeysContext.Provider value={contextValue}>
      {children}
    </HotkeysContext.Provider>
  );
};

HotkeysProvider.propTypes = {
  children: PropTypes.node.isRequired,
  hotkeys: PropTypes.object,
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

// Named hook that exposes registered hotkeys — used by HelpDialog and similar
export const useHotkeys = () => {
  const context = useContext(HotkeysContext);
  return context || { isEnabled: false, trigger: () => {}, combinations: HOTKEY_COMBINATIONS, hotkeys: {} };
};

// Export component
export default HotkeysProvider;
