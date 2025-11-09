/**
 * Global Hotkey Manager
 * 
 * Provides a priority-based hotkey system with scope management
 * Prevents conflicts and allows context-specific hotkeys
 */

import { useEffect, useRef, useCallback } from 'react';
import { isTouchDevice } from './useDeviceDetection';

/**
 * Hotkey scopes/priorities
 * Higher priority scopes override lower priority ones
 */
export const HOTKEY_SCOPES = {
  GLOBAL: 0,      // Always active (e.g., help, settings)
  VIEW: 10,       // View-level hotkeys (e.g., tab navigation)
  DIALOG: 20,     // Dialog/modal hotkeys (highest priority)
};

/**
 * Parse hotkey string into normalized format
 * 
 * @param {string} hotkey - Hotkey string (e.g., "ctrl+enter", "shift+n", "escape")
 * @returns {Object} Parsed hotkey {key, ctrl, shift, alt, meta}
 * 
 * @example
 * parseHotkey("ctrl+enter") // {key: "enter", ctrl: true, shift: false, alt: false, meta: false}
 */
function parseHotkey(hotkey) {
  const parts = hotkey.toLowerCase().split('+');
  const key = parts[parts.length - 1];
  
  return {
    key,
    ctrl: parts.includes('ctrl') || parts.includes('control'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    meta: parts.includes('meta') || parts.includes('cmd') || parts.includes('command')
  };
}

/**
 * Check if keyboard event matches hotkey definition
 * 
 * @param {KeyboardEvent} event - Keyboard event
 * @param {Object} hotkey - Parsed hotkey definition
 * @returns {boolean} Whether event matches hotkey
 */
function matchesHotkey(event, hotkey) {
  const eventKey = event.key.toLowerCase();
  
  // Normalize key names
  const normalizedEventKey = {
    'escape': 'escape',
    'esc': 'escape',
    'enter': 'enter',
    'return': 'enter',
    'space': ' ',
    'spacebar': ' ',
    'arrowleft': 'arrowleft',
    'left': 'arrowleft',
    'arrowright': 'arrowright',
    'right': 'arrowright',
    'arrowup': 'arrowup',
    'up': 'arrowup',
    'arrowdown': 'arrowdown',
    'down': 'arrowdown',
    'tab': 'tab',
    'backspace': 'backspace',
    'delete': 'delete',
    'del': 'delete'
  }[eventKey] || eventKey;

  const normalizedHotkeyKey = {
    'escape': 'escape',
    'esc': 'escape',
    'enter': 'enter',
    'return': 'enter',
    'space': ' ',
    'spacebar': ' ',
    'arrowleft': 'arrowleft',
    'left': 'arrowleft',
    'arrowright': 'arrowright',
    'right': 'arrowright',
    'arrowup': 'arrowup',
    'up': 'arrowup',
    'arrowdown': 'arrowdown',
    'down': 'arrowdown',
    'tab': 'tab',
    'backspace': 'backspace',
    'delete': 'delete',
    'del': 'delete'
  }[hotkey.key] || hotkey.key;

  // Check if keys match
  if (normalizedEventKey !== normalizedHotkeyKey) {
    return false;
  }

  // Check modifiers
  if (hotkey.ctrl !== (event.ctrlKey || event.metaKey)) {
    return false;
  }

  if (hotkey.shift !== event.shiftKey) {
    return false;
  }

  if (hotkey.alt !== event.altKey) {
    return false;
  }

  return true;
}

/**
 * Global hotkey registry
 * Stores all registered hotkeys with their handlers and scopes
 */
class HotkeyRegistry {
  constructor() {
    this.hotkeys = new Map();
    this.enabledScopes = new Set([HOTKEY_SCOPES.GLOBAL]);
    this.debugMode = false;
  }

  /**
   * Register a hotkey
   */
  register(id, hotkey, handler, scope = HOTKEY_SCOPES.GLOBAL, options = {}) {
    const parsed = parseHotkey(hotkey);
    
    this.hotkeys.set(id, {
      hotkey,
      parsed,
      handler,
      scope,
      options,
      enabled: true
    });

    if (this.debugMode) {
      console.log(`[Hotkeys] Registered: ${hotkey} (${id}) at scope ${scope}`);
    }
  }

  /**
   * Unregister a hotkey
   */
  unregister(id) {
    if (this.debugMode && this.hotkeys.has(id)) {
      const { hotkey } = this.hotkeys.get(id);
      console.log(`[Hotkeys] Unregistered: ${hotkey} (${id})`);
    }
    
    this.hotkeys.delete(id);
  }

  /**
   * Enable a scope
   */
  enableScope(scope) {
    this.enabledScopes.add(scope);
    
    if (this.debugMode) {
      console.log(`[Hotkeys] Enabled scope: ${scope}`);
    }
  }

  /**
   * Disable a scope
   */
  disableScope(scope) {
    this.enabledScopes.delete(scope);
    
    if (this.debugMode) {
      console.log(`[Hotkeys] Disabled scope: ${scope}`);
    }
  }

  /**
   * Handle keyboard event
   */
  handleKeyDown(event) {
    // Don't handle hotkeys when typing in inputs (unless explicitly allowed)
    const target = event.target;
    const isInput = target.tagName === 'INPUT' || 
                    target.tagName === 'TEXTAREA' || 
                    target.isContentEditable;

    // Find matching hotkeys in enabled scopes
    const matches = [];
    
    for (const [id, hotkeyDef] of this.hotkeys.entries()) {
      if (!hotkeyDef.enabled) {
        continue;
      }

      if (!this.enabledScopes.has(hotkeyDef.scope)) {
        continue;
      }

      if (matchesHotkey(event, hotkeyDef.parsed)) {
        // Check if hotkey should work in inputs
        if (isInput && !hotkeyDef.options.enableInInput) {
          continue;
        }

        matches.push({ id, ...hotkeyDef });
      }
    }

    if (matches.length === 0) {
      return;
    }

    // Sort by scope priority (highest first)
    matches.sort((a, b) => b.scope - a.scope);

    // Execute highest priority match
    const match = matches[0];
    
    if (this.debugMode) {
      console.log(`[Hotkeys] Triggered: ${match.hotkey} (${match.id}) at scope ${match.scope}`);
    }

    // Prevent default if specified
    if (match.options.preventDefault !== false) {
      event.preventDefault();
    }

    // Stop propagation if specified
    if (match.options.stopPropagation) {
      event.stopPropagation();
    }

    // Execute handler
    try {
      match.handler(event);
    } catch (error) {
      console.error(`[Hotkeys] Error in handler for ${match.hotkey}:`, error);
    }
  }

  /**
   * Enable debug mode
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
    console.log(`[Hotkeys] Debug mode: ${enabled ? 'ON' : 'OFF'}`);
  }

  /**
   * Get all registered hotkeys
   */
  getAll() {
    return Array.from(this.hotkeys.entries()).map(([id, def]) => ({
      id,
      hotkey: def.hotkey,
      scope: def.scope,
      enabled: def.enabled
    }));
  }
}

// Global registry instance
const globalRegistry = new HotkeyRegistry();

// Attach global listener
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    globalRegistry.handleKeyDown(e);
  });
}

/**
 * React Hook: useHotkeys
 * 
 * Register hotkeys for a component
 * 
 * @param {Object} hotkeys - Map of hotkey strings to handlers
 * @param {number} scope - Hotkey scope/priority
 * @param {Object} options - Additional options
 * @param {boolean} options.enabled - Whether hotkeys are enabled (default: true)
 * @param {boolean} options.enableInInput - Allow hotkeys in input fields (default: false)
 * @param {boolean} options.preventDefault - Prevent default browser behavior (default: true)
 * @param {boolean} options.stopPropagation - Stop event propagation (default: false)
 * 
 * @example
 * useHotkeys({
 *   'n': () => openDialog(),
 *   'ctrl+enter': () => saveForm(),
 *   'escape': () => closeDialog()
 * }, HOTKEY_SCOPES.DIALOG);
 */
export function useHotkeys(hotkeys, scope = HOTKEY_SCOPES.GLOBAL, options = {}) {
  const {
    enabled = true,
    enableInInput = false,
    preventDefault = true,
    stopPropagation = false
  } = options;

  const hotkeyIds = useRef(new Set());

  useEffect(() => {
    // Skip on touch devices if not explicitly enabled
    if (isTouchDevice() && !options.enableOnTouch) {
      return;
    }

    if (!enabled) {
      return;
    }

    // Register all hotkeys
    Object.entries(hotkeys).forEach(([hotkey, handler]) => {
      const id = `${scope}-${hotkey}-${Math.random()}`;
      hotkeyIds.current.add(id);
      
      globalRegistry.register(id, hotkey, handler, scope, {
        enableInInput,
        preventDefault,
        stopPropagation
      });
    });

    // Enable scope
    globalRegistry.enableScope(scope);

    // Cleanup
    return () => {
      hotkeyIds.current.forEach(id => {
        globalRegistry.unregister(id);
      });
      hotkeyIds.current.clear();

      // Disable scope if no other hotkeys are using it
      const hasOtherHotkeys = globalRegistry.getAll().some(h => h.scope === scope);
      if (!hasOtherHotkeys) {
        globalRegistry.disableScope(scope);
      }
    };
  }, [hotkeys, scope, enabled, enableInInput, preventDefault, stopPropagation, options.enableOnTouch]);
}

/**
 * React Hook: useHotkeyScope
 * 
 * Enable/disable a hotkey scope
 * Useful for managing dialog/modal hotkey contexts
 * 
 * @param {number} scope - Scope to manage
 * @param {boolean} enabled - Whether scope is enabled
 * 
 * @example
 * useHotkeyScope(HOTKEY_SCOPES.DIALOG, isDialogOpen);
 */
export function useHotkeyScope(scope, enabled = true) {
  useEffect(() => {
    if (enabled) {
      globalRegistry.enableScope(scope);
    } else {
      globalRegistry.disableScope(scope);
    }

    return () => {
      if (enabled) {
        globalRegistry.disableScope(scope);
      }
    };
  }, [scope, enabled]);
}

/**
 * Enable hotkey debug mode
 * Logs all hotkey registrations and triggers
 * 
 * @param {boolean} enabled - Whether debug mode is enabled
 */
export function setHotkeyDebugMode(enabled) {
  globalRegistry.setDebugMode(enabled);
}

/**
 * Get all registered hotkeys
 * Useful for displaying hotkey help
 * 
 * @returns {Array} Array of registered hotkeys
 */
export function getAllHotkeys() {
  return globalRegistry.getAll();
}

/**
 * Format hotkey for display
 * 
 * @param {string} hotkey - Hotkey string
 * @returns {string} Formatted hotkey for display
 * 
 * @example
 * formatHotkey("ctrl+enter") // "Ctrl+Enter"
 * formatHotkey("shift+n") // "Shift+N"
 */
export function formatHotkey(hotkey) {
  return hotkey
    .split('+')
    .map(part => {
      const normalized = part.toLowerCase();
      return {
        'ctrl': 'Ctrl',
        'control': 'Ctrl',
        'shift': 'Shift',
        'alt': 'Alt',
        'meta': 'Cmd',
        'cmd': 'Cmd',
        'command': 'Cmd',
        'enter': 'Enter',
        'escape': 'Esc',
        'esc': 'Esc',
        'space': 'Space',
        'spacebar': 'Space',
        'arrowleft': '←',
        'left': '←',
        'arrowright': '→',
        'right': '→',
        'arrowup': '↑',
        'up': '↑',
        'arrowdown': '↓',
        'down': '↓',
        'tab': 'Tab',
        'backspace': 'Backspace',
        'delete': 'Delete',
        'del': 'Delete'
      }[normalized] || part.toUpperCase();
    })
    .join('+');
}

export default {
  useHotkeys,
  useHotkeyScope,
  setHotkeyDebugMode,
  getAllHotkeys,
  formatHotkey,
  HOTKEY_SCOPES
};
