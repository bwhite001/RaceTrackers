import React from 'react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, renderHook } from '@testing-library/react';
import HotkeysProvider, { useHotkeysContext } from '../../src/shared/components/HotkeysProvider';
import { HOTKEY_COMBINATIONS } from '../../src/shared/hooks/useHotkeys';

describe('HotkeysProvider', () => {
  const TestComponent = ({ onHotkeyPress }) => {
    const { isEnabled, trigger, combinations } = useHotkeysContext();
    return (
      <div>
        <button onClick={() => trigger('n')}>Trigger 'n'</button>
        <div data-testid="enabled-status">{isEnabled.toString()}</div>
        <div data-testid="combinations">{JSON.stringify(combinations)}</div>
      </div>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('provides hotkey context to children', () => {
    render(
      <HotkeysProvider>
        <TestComponent />
      </HotkeysProvider>
    );

    expect(screen.getByTestId('enabled-status')).toHaveTextContent('true');
    expect(screen.getByTestId('combinations')).toHaveTextContent(
      JSON.stringify(HOTKEY_COMBINATIONS)
    );
  });

  test('handles hotkey events', () => {
    const handler = vi.fn();
    render(
      <HotkeysProvider hotkeys={{ 'n': handler }}>
        <TestComponent />
      </HotkeysProvider>
    );

    fireEvent.keyDown(document, { key: 'n' });
    expect(handler).toHaveBeenCalled();
  });

  test('respects enabled prop', () => {
    const handler = vi.fn();
    render(
      <HotkeysProvider hotkeys={{ 'n': handler }} enabled={false}>
        <TestComponent />
      </HotkeysProvider>
    );

    fireEvent.keyDown(document, { key: 'n' });
    expect(handler).not.toHaveBeenCalled();
    expect(screen.getByTestId('enabled-status')).toHaveTextContent('false');
  });

  test('handles form elements correctly', () => {
    const handler = vi.fn();
    render(
      <HotkeysProvider hotkeys={{ 'n': handler }} enableInForms={false}>
        <input type="text" data-testid="input" />
      </HotkeysProvider>
    );

    const input = screen.getByTestId('input');
    input.focus();
    fireEvent.keyDown(input, { key: 'n', bubbles: true });
    expect(handler).not.toHaveBeenCalled();
  });

  test('allows hotkeys in forms when enableInForms is true', () => {
    const handler = vi.fn();
    render(
      <HotkeysProvider hotkeys={{ 'n': handler }} enableInForms={true}>
        <input type="text" data-testid="input" />
      </HotkeysProvider>
    );

    const input = screen.getByTestId('input');
    input.focus();
    fireEvent.keyDown(input, { key: 'n', bubbles: true });
    expect(handler).toHaveBeenCalled();
  });

  test('respects custom filter', () => {
    const handler = vi.fn();
    const filter = (event) => event.target.tagName !== 'BUTTON';
    
    render(
      <HotkeysProvider hotkeys={{ 'n': handler }} filter={filter}>
        <button data-testid="button">Test Button</button>
      </HotkeysProvider>
    );

    const button = screen.getByTestId('button');
    button.focus();
    fireEvent.keyDown(button, { key: 'n', bubbles: true });
    expect(handler).not.toHaveBeenCalled();
  });

  test('trigger method works through context', () => {
    const handler = vi.fn();
    render(
      <HotkeysProvider hotkeys={{ 'n': handler }}>
        <TestComponent />
      </HotkeysProvider>
    );

    fireEvent.click(screen.getByText("Trigger 'n'"));
    expect(handler).toHaveBeenCalled();
  });

  test('throws error when useHotkeysContext is used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useHotkeysContext must be used within a HotkeysProvider');

    consoleError.mockRestore();
  });

  test('handles combination hotkeys', () => {
    const handler = vi.fn();
    render(
      <HotkeysProvider hotkeys={{ 'ctrl+s': handler }}>
        <TestComponent />
      </HotkeysProvider>
    );

    fireEvent.keyDown(document, { key: 's', ctrlKey: true });
    expect(handler).toHaveBeenCalled();
  });

  test('prevents default behavior when preventDefault is true', () => {
    const handler = vi.fn();
    render(
      <HotkeysProvider hotkeys={{ 'n': handler }} preventDefault={true}>
        <TestComponent />
      </HotkeysProvider>
    );

    const event = new KeyboardEvent('keydown', { key: 'n', bubbles: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    document.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  test('stops propagation when stopPropagation is true', () => {
    const handler = vi.fn();
    render(
      <HotkeysProvider hotkeys={{ 'n': handler }} stopPropagation={true}>
        <TestComponent />
      </HotkeysProvider>
    );

    const event = new KeyboardEvent('keydown', { key: 'n', bubbles: true });
    const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');
    document.dispatchEvent(event);

    expect(stopPropagationSpy).toHaveBeenCalled();
  });
});
