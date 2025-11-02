import React, { useEffect, useCallback, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * HotkeysProvider - Global keyboard shortcut system
 * 
 * Provides context-aware keyboard shortcuts for the application.
 * Wraps components that need hotkey support.
 * 
 * Usage:
 * <HotkeysProvider hotkeys={hotkeyConfig} enabled={true}>
 *   <YourComponent />
 * </HotkeysProvider>
 */

const HotkeysContext = React.createContext({
  registerHotkey: () => {},
  unregisterHotkey: () => {},
  enableHotkeys: () => {},
  disableHotkeys: () => {},
  showHelp: () => {},
  hideHelp: () => {}
});

export const useHotkeys = () => {
  const context = React.useContext(HotkeysContext);
  if (!context) {
    throw new Error('useHotkeys must be used within a HotkeysProvider');
  }
  return context;
};

const HotkeysProvider = ({ children, hotkeys = {}, enabled = true, showHelpOnAltH = true }) => {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [registeredHotkeys, setRegisteredHotkeys] = useState(hotkeys);

  // Register a new hotkey
  const registerHotkey = useCallback((key, handler, description = '', category = 'general') => {
    setRegisteredHotkeys(prev => ({
      ...prev,
      [key]: { handler, description, category }
    }));
  }, []);

  // Unregister a hotkey
  const unregisterHotkey = useCallback((key) => {
    setRegisteredHotkeys(prev => {
      const newHotkeys = { ...prev };
      delete newHotkeys[key];
      return newHotkeys;
    });
  }, []);

  // Enable/disable hotkeys
  const enableHotkeys = useCallback(() => setIsEnabled(true), []);
  const disableHotkeys = useCallback(() => setIsEnabled(false), []);

  // Show/hide help modal
  const showHelp = useCallback(() => setShowHelpModal(true), []);
  const hideHelp = useCallback(() => setShowHelpModal(false), []);

  // Handle keyboard events
  const handleKeyDown = useCallback((event) => {
    if (!isEnabled) return;

    // Don't trigger hotkeys when typing in input fields (unless explicitly allowed)
    const target = event.target;
    const isInputField = target.tagName === 'INPUT' || 
                        target.tagName === 'TEXTAREA' || 
                        target.isContentEditable;

    // Build the key combination string
    const modifiers = [];
    if (event.ctrlKey) modifiers.push('ctrl');
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');
    if (event.metaKey) modifiers.push('meta');

    const key = event.key.toLowerCase();
    const combination = [...modifiers, key].join('+');

    // Check if this combination is registered
    const hotkeyConfig = registeredHotkeys[combination];
    
    if (hotkeyConfig) {
      // Check if hotkey should work in input fields
      const allowInInput = hotkeyConfig.allowInInput || false;
      
      if (isInputField && !allowInInput) {
        return;
      }

      // Prevent default behavior and execute handler
      event.preventDefault();
      event.stopPropagation();

      try {
        hotkeyConfig.handler(event);
      } catch (error) {
        console.error(`Error executing hotkey ${combination}:`, error);
      }
    }

    // Special case: Alt+H for help (if enabled)
    if (showHelpOnAltH && combination === 'alt+h' && !hotkeyConfig) {
      event.preventDefault();
      showHelp();
    }

    // Special case: Escape to close help modal
    if (showHelpModal && key === 'escape') {
      event.preventDefault();
      hideHelp();
    }
  }, [isEnabled, registeredHotkeys, showHelpModal, showHelpOnAltH, showHelp, hideHelp]);

  // Attach/detach keyboard event listener
  useEffect(() => {
    if (isEnabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isEnabled, handleKeyDown]);

  // Update registered hotkeys when prop changes
  useEffect(() => {
    setRegisteredHotkeys(hotkeys);
  }, [hotkeys]);

  // Update enabled state when prop changes
  useEffect(() => {
    setIsEnabled(enabled);
  }, [enabled]);

  const contextValue = {
    registerHotkey,
    unregisterHotkey,
    enableHotkeys,
    disableHotkeys,
    showHelp,
    hideHelp,
    isEnabled,
    hotkeys: registeredHotkeys
  };

  return (
    <HotkeysContext.Provider value={contextValue}>
      {children}
      
      {/* Help Modal */}
      {showHelpModal && (
        <HelpModal 
          hotkeys={registeredHotkeys} 
          onClose={hideHelp}
        />
      )}
    </HotkeysContext.Provider>
  );
};

HotkeysProvider.propTypes = {
  children: PropTypes.node.isRequired,
  hotkeys: PropTypes.object,
  enabled: PropTypes.bool,
  showHelpOnAltH: PropTypes.bool
};

// Help Modal Component
const HelpModal = ({ hotkeys, onClose }) => {
  // Group hotkeys by category
  const groupedHotkeys = React.useMemo(() => {
    const groups = {
      navigation: [],
      dataEntry: [],
      operations: [],
      lists: [],
      sorting: [],
      housekeeping: [],
      general: []
    };

    Object.entries(hotkeys).forEach(([key, config]) => {
      const category = config.category || 'general';
      if (groups[category]) {
        groups[category].push({ key, ...config });
      } else {
        groups.general.push({ key, ...config });
      }
    });

    // Remove empty categories
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  }, [hotkeys]);

  const formatKey = (key) => {
    return key
      .split('+')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' + ');
  };

  const categoryTitles = {
    navigation: 'Navigation',
    dataEntry: 'Data Entry',
    operations: 'Operations',
    lists: 'Lists & Reports',
    sorting: 'Sorting',
    housekeeping: 'Housekeeping',
    general: 'General'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(groupedHotkeys).map(([category, shortcuts]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {categoryTitles[category] || category}
                </h3>
                <div className="space-y-2">
                  {shortcuts.map(({ key, description }) => (
                    <div key={key} className="flex items-center justify-between gap-4">
                      <span className="text-sm text-gray-600 dark:text-gray-300 flex-1">
                        {description}
                      </span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 whitespace-nowrap">
                        {formatKey(key)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Note */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Press <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">Esc</kbd> or click outside to close
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

HelpModal.propTypes = {
  hotkeys: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired
};

export default HotkeysProvider;
export { HotkeysContext };
