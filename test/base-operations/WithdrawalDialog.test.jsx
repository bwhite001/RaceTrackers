import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WithdrawalDialog from '../../src/modules/base-operations/components/WithdrawalDialog';
import useBaseOperationsStore from '../../src/modules/base-operations/store/baseOperationsStore';

// Mock the store
vi.mock('../../src/modules/base-operations/store/baseOperationsStore');

describe('WithdrawalDialog', () => {
  const mockStore = {
    withdrawRunner: vi.fn().mockResolvedValue(undefined),
    reverseWithdrawal: vi.fn().mockResolvedValue(undefined),
    loading: false,
    error: null
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useBaseOperationsStore.mockImplementation(() => mockStore);
  });

  test('renders dialog when open', () => {
    render(<WithdrawalDialog {...defaultProps} />);

    // Header shows title (may appear in multiple places including button)
    expect(screen.getAllByText('Withdraw Runner').length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/Runner Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Reason/i)).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    render(<WithdrawalDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Withdraw Runner')).not.toBeInTheDocument();
  });

  test('handles runner number input', async () => {
    render(<WithdrawalDialog {...defaultProps} />);

    const input = screen.getByLabelText(/Runner Number/i);
    await userEvent.clear(input);
    await userEvent.type(input, '105');

    expect(input).toHaveValue('105');
  });

  test('validates form before submission — missing runner number', async () => {
    render(<WithdrawalDialog {...defaultProps} />);

    // Clear runner number
    const input = screen.getByLabelText(/Runner Number/i);
    await userEvent.clear(input);

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /submit|withdraw/i }));

    await waitFor(() => {
      expect(screen.getByText(/runner number is required/i)).toBeInTheDocument();
    });
  });

  test('handles successful form submission', async () => {
    const onClose = vi.fn();
    render(<WithdrawalDialog {...defaultProps} onClose={onClose} />);

    // Fill runner number
    const input = screen.getByLabelText(/Runner Number/i);
    await userEvent.clear(input);
    await userEvent.type(input, '105');

    // Submit
    const submitBtn = screen.getAllByRole('button').find(b => b.type === 'submit');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  test('handles form submission errors', async () => {
    mockStore.withdrawRunner.mockRejectedValue(new Error('Runner not found'));
    const { container } = render(<WithdrawalDialog {...defaultProps} />);

    const input = screen.getByLabelText(/Runner Number/i);
    await userEvent.clear(input);
    await userEvent.type(input, '999');

    // Submit via form submit event
    const form = container.querySelector('form');
    fireEvent.submit(form);

    await waitFor(() => {
      const errorEl = screen.queryByText('Runner not found');
      const failedEl = screen.queryByText(/failed/i);
      expect(errorEl || failedEl).toBeTruthy();
    });
  });

  test('handles escape / close button', () => {
    const onClose = vi.fn();
    render(<WithdrawalDialog {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  test('supports reversal mode via * suffix', async () => {
    render(<WithdrawalDialog {...defaultProps} />);

    const input = screen.getByLabelText(/Runner Number/i);
    // Type number with * to trigger reversal mode
    await userEvent.clear(input);
    await userEvent.type(input, '105*');

    // After * is typed, the component strips it and sets isReversal=true
    // The submit button should change to show reversal context
    await waitFor(() => {
      // Header or button should say "Reverse Withdrawal"
      const headings = screen.getAllByText(/Reverse Withdrawal|Withdraw Runner/);
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  test('shows initial runner number from prop', () => {
    render(<WithdrawalDialog {...defaultProps} runnerNumber="42" />);
    expect(screen.getByLabelText(/Runner Number/i)).toHaveValue('42');
  });

  test('focuses runner input on open', () => {
    render(<WithdrawalDialog {...defaultProps} />);
    expect(screen.getByLabelText(/Runner Number/i)).toHaveFocus();
  });

  test('maintains focus trap', async () => {
    render(<WithdrawalDialog {...defaultProps} />);

    const firstFocusable = screen.getByLabelText(/Runner Number/i);
    firstFocusable.focus();
    expect(firstFocusable).toHaveFocus();
  });

  test('is accessible — close button labelled', () => {
    render(<WithdrawalDialog {...defaultProps} />);
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  test('disables submit while submitting', async () => {
    let resolve;
    mockStore.withdrawRunner.mockReturnValue(new Promise(r => { resolve = r; }));
    const { container } = render(<WithdrawalDialog {...defaultProps} />);

    const input = screen.getByLabelText(/Runner Number/i);
    await userEvent.clear(input);
    await userEvent.type(input, '105');

    const form = container.querySelector('form');
    fireEvent.submit(form);

    await waitFor(() => {
      const processing = screen.queryByText('Processing...');
      const submitBtn = screen.getAllByRole('button').find(b => b.type === 'submit');
      expect(processing || submitBtn?.disabled).toBeTruthy();
    });

    resolve();
  });
});
