import { useEffect, useCallback, useRef } from 'react';
import { HOTKEYS } from '../../types';

/**
 * Custom hook for managing keyboard shortcuts
 * @param {Object} handlers - Map of hotkey to handler functions
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether hotkeys are enabled
 * @param {Array<string>} options.allowedKeys - List of allowed keys (if not provided, all defined hotkeys are allowed)
 * @param {boolean} options.preventDefault - Whether to prevent default browser behavior
 * @param {boolean} options.stopPropagation - Whether to stop event propagation
 * @param {function} options.filter - Custom filter function for key events
 */
const useHotkeys = (handlers = {}, options = {}) => {
  const {
    enabled = true,
    allowedKeys,
    preventDefault = true,
    stopPropagation = true,
    filter = () => true
  } = options;

  // Store handlers in a ref to avoid unnecessary effect triggers
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  // Helper to check if a key combination matches a hotkey
  const matchesHotkey = useCallback((event, hotkey) => {
    const keys = hotkey.toLowerCase().split('+');
    const eventKey = event.key.toLowerCase();

    // Check if all modifier keys match
    const modifiersMatch = {
      ctrl: keys.includes('ctrl') === event.ctrlKey,
      alt: keys.includes('alt') === event.altKey,
      shift: keys.includes('shift') === event.shiftKey,
      meta: keys.includes('meta') === event.metaKey
    };

    // Get the main key (last one in the combination)
    const mainKey = keys[keys.length - 1];

    // Check if all conditions match
    return (
      modifiersMatch.ctrl &&
      modifiersMatch.alt &&
      modifiersMatch.shift &&
      modifiersMatch.meta &&
      eventKey === mainKey
    );
  }, []);

  // Handle keydown events
  const handleKeyDown = useCallback((event) => {
    // Skip if hotkeys are disabled or event doesn't pass custom filter
    if (!enabled || !filter(event)) {
      return;
    }

    // Skip if target is an input/textarea/select and not explicitly allowed
    const isFormElement = /^(input|textarea|select)$/i.test(event.target.tagName);
    const isContentEditable = event.target.isContentEditable;
    if ((isFormElement || isContentEditable) && !options.enableInForms) {
      return;
    }

    // Check each handler
    Object.entries(handlersRef.current).forEach(([hotkey, handler]) => {
      // Skip if key is not in allowed keys (if specified)
      if (allowedKeys && !allowedKeys.includes(hotkey)) {
        return;
      }

      // Check if the event matches this hotkey
      if (matchesHotkey(event, hotkey)) {
        if (preventDefault) {
          event.preventDefault();
        }
        if (stopPropagation) {
          event.stopPropagation();
        }
        handler(event);
      }
    });
  }, [enabled, filter, matchesHotkey, preventDefault, stopPropagation, allowedKeys, options.enableInForms]);

  // Set up event listener
  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [enabled, handleKeyDown]);

  // Return utilities for manual control
  return {
    isEnabled: enabled,
    trigger: (hotkey) => {
      if (enabled && handlersRef.current[hotkey]) {
        handlersRef.current[hotkey]();
      }
    }
  };
};

/**
 * Predefined hotkey combinations
 */
export const HOTKEY_COMBINATIONS = {
  newEntry: HOTKEYS.NEW_ENTRY,
  reports: HOTKEYS.REPORTS,
  dropout: HOTKEYS.DROPOUT,
  help: HOTKEYS.HELP,
  escape: HOTKEYS.ESCAPE,
  tabNext: HOTKEYS.TAB_NEXT,
  tabPrev: HOTKEYS.TAB_PREV,
  save: HOTKEYS.SAVE,
  undo: HOTKEYS.UNDO,
  search: HOTKEYS.SEARCH,
  now: HOTKEYS.NOW
};

/**
 * HotkeysProvider component context
 */
export const useHotkeysContext = () => {
  const hotkeys = useHotkeys({}, { enabled: false });
  return {
    ...hotkeys,
    combinations: HOTKEY_COMBINATIONS
  };
};

export default useHotkeys;
