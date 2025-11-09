import { renderHook, act } from '@testing-library/react-hooks';
import {
  useHotkeys,
  useHotkeyScope,
  HOTKEY_SCOPES,
  setHotkeyDebugMode
} from '../../../shared/hooks/useHotkeys';

describe('Hotkeys System - Critical Path Tests', () => {
  // Mock keyboard events
  const createKeyboardEvent = (key, modifiers = {}) => {
    return new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...modifiers
    });
  };

  beforeEach(() => {
    // Reset any previous hotkey registrations
    setHotkeyDebugMode(false);
  });

  describe('useHotkeys hook', () => {
    test('registers and triggers simple hotkey', () => {
      const handler = jest.fn();
      
      renderHook(() => useHotkeys({
        'n': handler
      }));

      // Simulate 'n' key press
      act(() => {
        window.dispatchEvent(createKeyboardEvent('n'));
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    test('handles modifier keys correctly', () => {
      const handler = jest.fn();
      
      renderHook(() => useHotkeys({
        'ctrl+enter': handler
      }));

      // Simulate Ctrl+Enter
      act(() => {
        window.dispatchEvent(createKeyboardEvent('Enter', { ctrlKey: true }));
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    test('respects scope priority', () => {
      const globalHandler = jest.fn();
      const dialogHandler = jest.fn();

      // Register global hotkey
      renderHook(() => useHotkeys({
        'escape': globalHandler
      }, HOTKEY_SCOPES.GLOBAL));

      // Register dialog hotkey (higher priority)
      renderHook(() => useHotkeys({
        'escape': dialogHandler
      }, HOTKEY_SCOPES.DIALOG));

      // Simulate Escape key
      act(() => {
        window.dispatchEvent(createKeyboardEvent('Escape'));
      });

      // Dialog handler should be called, not global
      expect(dialogHandler).toHaveBeenCalledTimes(1);
      expect(globalHandler).not.toHaveBeenCalled();
    });

    test('ignores hotkeys in input fields by default', () => {
      const handler = jest.fn();
      
      renderHook(() => useHotkeys({
        'a': handler
      }));

      // Create an input element
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      // Simulate 'a' key in input
      act(() => {
        input.dispatchEvent(createKeyboardEvent('a'));
      });

      expect(handler).not.toHaveBeenCalled();

      // Cleanup
      document.body.removeChild(input);
    });

    test('allows hotkeys in input fields when enabled', () => {
      const handler = jest.fn();
      
      renderHook(() => useHotkeys({
        'ctrl+s': handler
      }, HOTKEY_SCOPES.GLOBAL, { enableInInput: true }));

      // Create an input element
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      // Simulate Ctrl+S in input
      act(() => {
        input.dispatchEvent(createKeyboardEvent('s', { ctrlKey: true }));
      });

      expect(handler).toHaveBeenCalledTimes(1);

      // Cleanup
      document.body.removeChild(input);
    });
  });

  describe('useHotkeyScope hook', () => {
    test('enables and disables scope', () => {
      const handler = jest.fn();
      const scopeId = HOTKEY_SCOPES.DIALOG;

      // Register hotkey in dialog scope
      renderHook(() => useHotkeys({
        'escape': handler
      }, scopeId));

      // Initially scope is disabled
      const { rerender } = renderHook(
        ({ enabled }) => useHotkeyScope(scopeId, enabled),
        { initialProps: { enabled: false } }
      );

      // Simulate Escape key (should not trigger)
      act(() => {
        window.dispatchEvent(createKeyboardEvent('Escape'));
      });
      expect(handler).not.toHaveBeenCalled();

      // Enable scope
      rerender({ enabled: true });

      // Simulate Escape key (should trigger)
      act(() => {
        window.dispatchEvent(createKeyboardEvent('Escape'));
      });
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Hotkey conflict resolution', () => {
    test('higher priority scope overrides lower priority', () => {
      const globalHandler = jest.fn();
      const viewHandler = jest.fn();
      const dialogHandler = jest.fn();

      // Register handlers at different scopes
      renderHook(() => useHotkeys({ 'x': globalHandler }, HOTKEY_SCOPES.GLOBAL));
      renderHook(() => useHotkeys({ 'x': viewHandler }, HOTKEY_SCOPES.VIEW));
      renderHook(() => useHotkeys({ 'x': dialogHandler }, HOTKEY_SCOPES.DIALOG));

      // Enable all scopes
      renderHook(() => useHotkeyScope(HOTKEY_SCOPES.GLOBAL, true));
      renderHook(() => useHotkeyScope(HOTKEY_SCOPES.VIEW, true));
      renderHook(() => useHotkeyScope(HOTKEY_SCOPES.DIALOG, true));

      // Simulate 'x' key
      act(() => {
        window.dispatchEvent(createKeyboardEvent('x'));
      });

      // Only highest priority (dialog) should be called
      expect(dialogHandler).toHaveBeenCalledTimes(1);
      expect(viewHandler).not.toHaveBeenCalled();
      expect(globalHandler).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup behavior', () => {
    test('removes hotkeys when component unmounts', () => {
      const handler = jest.fn();
      
      const { unmount } = renderHook(() => useHotkeys({
        'x': handler
      }));

      // Unmount the hook
      unmount();

      // Simulate 'x' key
      act(() => {
        window.dispatchEvent(createKeyboardEvent('x'));
      });

      expect(handler).not.toHaveBeenCalled();
    });
  });
});
