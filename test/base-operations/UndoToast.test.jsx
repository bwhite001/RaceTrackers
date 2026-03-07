import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import UndoToast from 'modules/base-operations/components/UndoToast';

describe('UndoToast', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('renders the batch count message', () => {
    render(<UndoToast count={5} onUndo={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByText(/batch submitted.*5 runner/i)).toBeInTheDocument();
  });

  it('calls onUndo when Undo is clicked', () => {
    const onUndo = vi.fn();
    render(<UndoToast count={3} onUndo={onUndo} onDismiss={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /undo/i }));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss after 10 seconds', () => {
    const onDismiss = vi.fn();
    render(<UndoToast count={2} onUndo={vi.fn()} onDismiss={onDismiss} />);
    act(() => { vi.advanceTimersByTime(10000); });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when × button is clicked', () => {
    const onDismiss = vi.fn();
    render(<UndoToast count={2} onUndo={vi.fn()} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
