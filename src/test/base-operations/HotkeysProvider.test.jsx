import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import HotkeysProvider, { useHotkeys } from '../../shared/components/HotkeysProvider';

describe('HotkeysProvider', () => {
  // Test component that uses hotkeys
  const TestComponent = () => {
    const { registerHotkey, showHelp } = useHotkeys();

    React.useEffect(() => {
      registerHotkey('alt+a', () => {
        console.log('Alt+A pressed');
      }, 'Test action', 'test');

      registerHotkey('ctrl+s', () => {
        console.log('Ctrl+S pressed');
      }, 'Save action', 'test');
    }, [registerHotkey]);

    return (
      <div>
        <button onClick={showHelp}>Show Help</button>
        <input type="text" placeholder="Test input" />
      </div>
    );
  };

  beforeEach(() => {
    // Clear any previous event listeners
    vi.clearAllMocks();
  });

  it('renders children correctly', () => {
    render(
      <HotkeysProvider>
        <div data-testid="test-child">Test Child</div>
      </HotkeysProvider>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('registers and triggers hotkeys correctly', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    
    render(
      <HotkeysProvider>
        <TestComponent />
      </HotkeysProvider>
    );

    // Simulate Alt+A hotkey
    act(() => {
      fireEvent.keyDown(document, {
        key: 'a',
        code: 'KeyA',
        altKey: true
      });
    });

    expect(consoleSpy).toHaveBeenCalledWith('Alt+A pressed');

    // Simulate Ctrl+S hotkey
    act(() => {
      fireEvent.keyDown(document, {
        key: 's',
        code: 'KeyS',
        ctrlKey: true
      });
    });

    expect(consoleSpy).toHaveBeenCalledWith('Ctrl+S pressed');
  });

  it('ignores hotkeys when typing in input fields', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    
    render(
      <HotkeysProvider>
        <TestComponent />
      </HotkeysProvider>
    );

    const input = screen.getByPlaceholderText('Test input');
    input.focus();

    // Simulate Alt+A hotkey while input is focused
    act(() => {
      fireEvent.keyDown(input, {
        key: 'a',
        code: 'KeyA',
        altKey: true
      });
    });

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('shows help modal when Alt+H is pressed', () => {
    render(
      <HotkeysProvider>
        <TestComponent />
      </HotkeysProvider>
    );

    // Simulate Alt+H hotkey
    act(() => {
      fireEvent.keyDown(document, {
        key: 'h',
        code: 'KeyH',
        altKey: true
      });
    });

    // Help modal should be visible
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('closes help modal with Escape key', () => {
    render(
      <HotkeysProvider>
        <TestComponent />
      </HotkeysProvider>
    );

    // Show help modal
    act(() => {
      fireEvent.keyDown(document, {
        key: 'h',
        code: 'KeyH',
        altKey: true
      });
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Press Escape
    act(() => {
      fireEvent.keyDown(document, {
        key: 'Escape',
        code: 'Escape'
      });
    });

    // Help modal should be closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('disables hotkeys when enabled prop is false', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    
    render(
      <HotkeysProvider enabled={false}>
        <TestComponent />
      </HotkeysProvider>
    );

    // Simulate Alt+A hotkey
    act(() => {
      fireEvent.keyDown(document, {
        key: 'a',
        code: 'KeyA',
        altKey: true
      });
    });

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('groups hotkeys by category in help modal', () => {
    render(
      <HotkeysProvider>
        <TestComponent />
      </HotkeysProvider>
    );

    // Show help modal
    fireEvent.click(screen.getByText('Show Help'));

    // Check for category and hotkey
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('Test action')).toBeInTheDocument();
    expect(screen.getByText('Save action')).toBeInTheDocument();
  });

  it('handles multiple modifier keys correctly', () => {
    const handler = vi.fn();
    
    const MultiModifierTest = () => {
      const { registerHotkey } = useHotkeys();

      React.useEffect(() => {
        registerHotkey('ctrl+shift+a', handler, 'Multi-modifier test', 'test');
      }, [registerHotkey]);

      return <div>Test</div>;
    };

    render(
      <HotkeysProvider>
        <MultiModifierTest />
      </HotkeysProvider>
    );

    // Simulate Ctrl+Shift+A
    act(() => {
      fireEvent.keyDown(document, {
        key: 'a',
        code: 'KeyA',
        ctrlKey: true,
        shiftKey: true
      });
    });

    expect(handler).toHaveBeenCalled();
  });

  it('allows hotkeys in input fields when explicitly allowed', () => {
    const handler = vi.fn();
    
    const AllowInInputTest = () => {
      const { registerHotkey } = useHotkeys();

      React.useEffect(() => {
        registerHotkey('ctrl+a', handler, 'Allow in input test', 'test', true);
      }, [registerHotkey]);

      return <input type="text" placeholder="Test input" />;
    };

    render(
      <HotkeysProvider>
        <AllowInInputTest />
      </HotkeysProvider>
    );

    const input = screen.getByPlaceholderText('Test input');
    input.focus();

    // Simulate Ctrl+A in input
    act(() => {
      fireEvent.keyDown(input, {
        key: 'a',
        code: 'KeyA',
        ctrlKey: true
      });
    });

    expect(handler).toHaveBeenCalled();
  });

  it('unregisters hotkeys correctly', () => {
    const handler = vi.fn();
    
    const UnregisterTest = () => {
      const { registerHotkey, unregisterHotkey } = useHotkeys();

      React.useEffect(() => {
        registerHotkey('alt+x', handler, 'Test unregister', 'test');
        return () => unregisterHotkey('alt+x');
      }, [registerHotkey, unregisterHotkey]);

      return <div>Test</div>;
    };

    const { unmount } = render(
      <HotkeysProvider>
        <UnregisterTest />
      </HotkeysProvider>
    );

    // Simulate Alt+X before unmount
    act(() => {
      fireEvent.keyDown(document, {
        key: 'x',
        code: 'KeyX',
        altKey: true
      });
    });

    expect(handler).toHaveBeenCalled();
    handler.mockClear();

    // Unmount component
    unmount();

    // Simulate Alt+X after unmount
    act(() => {
      fireEvent.keyDown(document, {
        key: 'x',
        code: 'KeyX',
        altKey: true
      });
    });

    expect(handler).not.toHaveBeenCalled();
  });
});
