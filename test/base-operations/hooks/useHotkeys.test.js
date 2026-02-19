import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useHotkeys, { HOTKEY_COMBINATIONS } from '../../../src/shared/hooks/useHotkeys';

describe('useHotkeys Hook', () => {
  let addEventListenerSpy;
  let removeEventListenerSpy;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('registers event listener when enabled', () => {
    renderHook(() => useHotkeys({}, { enabled: true }));
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  test('does not register event listener when disabled', () => {
    renderHook(() => useHotkeys({}, { enabled: false }));
    expect(addEventListenerSpy).not.toHaveBeenCalled();
  });

  test('removes event listener on cleanup', () => {
    const { unmount } = renderHook(() => useHotkeys({}, { enabled: true }));
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  test('handles single key hotkeys', () => {
    const handler = vi.fn();
    const { result } = renderHook(() => useHotkeys({
      'n': handler
    }));

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }));
    });

    expect(handler).toHaveBeenCalled();
  });

  test('handles combination hotkeys', () => {
    const handler = vi.fn();
    const { result } = renderHook(() => useHotkeys({
      'ctrl+s': handler
    }));

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true
      }));
    });

    expect(handler).toHaveBeenCalled();
  });

  test('respects allowedKeys option', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    
    const { result } = renderHook(() => useHotkeys({
      'n': handler1,
      'r': handler2
    }, {
      allowedKeys: ['n']
    }));

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
    });

    expect(handler1).toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();
  });

  test('ignores hotkeys in form elements by default', () => {
    const handler = vi.fn();
    const { result } = renderHook(() => useHotkeys({
      'n': handler
    }));

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true }));
    });

    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  test('allows hotkeys in form elements when enableInForms is true', () => {
    const handler = vi.fn();
    const { result } = renderHook(() => useHotkeys({
      'n': handler
    }, {
      enableInForms: true
    }));

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true }));
    });

    expect(handler).toHaveBeenCalled();
    document.body.removeChild(input);
  });

  test('prevents default behavior when preventDefault is true', () => {
    const handler = vi.fn();
    const { result } = renderHook(() => useHotkeys({
      'n': handler
    }, {
      preventDefault: true
    }));

    const event = new KeyboardEvent('keydown', { key: 'n', bubbles: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    act(() => {
      document.dispatchEvent(event);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  test('stops propagation when stopPropagation is true', () => {
    const handler = vi.fn();
    const { result } = renderHook(() => useHotkeys({
      'n': handler
    }, {
      stopPropagation: true
    }));

    const event = new KeyboardEvent('keydown', { key: 'n', bubbles: true });
    const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');

    act(() => {
      document.dispatchEvent(event);
    });

    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  test('respects custom filter function', () => {
    const handler = vi.fn();
    const filter = (event) => event.target.tagName !== 'BUTTON';
    
    const { result } = renderHook(() => useHotkeys({
      'n': handler
    }, {
      filter
    }));

    const button = document.createElement('button');
    document.body.appendChild(button);
    button.focus();

    act(() => {
      button.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true }));
    });

    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(button);
  });

  test('trigger method calls handler directly', () => {
    const handler = vi.fn();
    const { result } = renderHook(() => useHotkeys({
      'n': handler
    }));

    act(() => {
      result.current.trigger('n');
    });

    expect(handler).toHaveBeenCalled();
  });

  test('trigger method respects enabled state', () => {
    const handler = vi.fn();
    const { result } = renderHook(() => useHotkeys({
      'n': handler
    }, {
      enabled: false
    }));

    act(() => {
      result.current.trigger('n');
    });

    expect(handler).not.toHaveBeenCalled();
  });

  test('HOTKEY_COMBINATIONS match defined constants', () => {
    expect(HOTKEY_COMBINATIONS).toMatchObject({
      newEntry: expect.any(String),
      reports: expect.any(String),
      dropout: expect.any(String),
      help: expect.any(String),
      escape: expect.any(String),
      tabNext: expect.any(String),
      tabPrev: expect.any(String),
      save: expect.any(String),
      undo: expect.any(String),
      search: expect.any(String),
      now: expect.any(String)
    });
  });
});
