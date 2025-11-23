import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WithdrawalDialog from '../../src/components/BaseStation/WithdrawalDialog';
import useBaseOperationsStore from '../../src/modules/base-operations/store/baseOperationsStore';
import { RUNNER_STATUSES } from '../../src/types';

// Mock the store
vi.mock('../../modules/base-operations/store/baseOperationsStore');

describe('WithdrawalDialog', () => {
  const mockStore = {
    bulkMarkRunners: vi.fn(),
    loading: false,
    error: null
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    type: 'dnf'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useBaseOperationsStore.mockImplementation(() => mockStore);
  });

  test('renders dialog when open', () => {
    render(<WithdrawalDialog {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Mark Runners as DNF')).toBeInTheDocument();
    expect(screen.getByLabelText(/Runner Numbers/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Reason/i)).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    render(<WithdrawalDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('handles runner number input and shows preview', async () => {
    render(<WithdrawalDialog {...defaultProps} />);
    
    const input = screen.getByLabelText(/Runner Numbers/i);
    await userEvent.type(input, '1, 2, 3-5');

    // Check preview
    expect(screen.getByText('Preview (5 runners)')).toBeInTheDocument();
    expect(screen.getByText('1, 2, 3, 4, 5')).toBeInTheDocument();
  });

  test('validates form before submission', async () => {
    render(<WithdrawalDialog {...defaultProps} />);
    
    // Try to submit without data
    const submitButton = screen.getByText(/Mark as DNF/i);
    fireEvent.click(submitButton);

    // Check validation messages
    expect(screen.getByText('At least one valid runner number is required')).toBeInTheDocument();
    expect(screen.getByText('DNF reason is required')).toBeInTheDocument();
  });

  test('handles successful form submission', async () => {
    const onClose = vi.fn();
    render(<WithdrawalDialog {...defaultProps} onClose={onClose} />);
    
    // Fill form
    await userEvent.type(screen.getByLabelText(/Runner Numbers/i), '1, 2, 3');
    await userEvent.type(screen.getByLabelText(/Reason/i), 'Test reason');

    // Submit form
    fireEvent.click(screen.getByText(/Mark as DNF/i));

    // Check store interaction
    await waitFor(() => {
      expect(mockStore.bulkMarkRunners).toHaveBeenCalledWith(
        [1, 2, 3],
        {
          status: RUNNER_STATUSES.DNF,
          reason: 'Test reason',
          timestamp: expect.any(String)
        }
      );
    });

    // Dialog should close
    expect(onClose).toHaveBeenCalled();
  });

  test('handles form submission errors', async () => {
    const error = new Error('Test error');
    mockStore.bulkMarkRunners.mockRejectedValue(error);

    render(<WithdrawalDialog {...defaultProps} />);
    
    // Fill and submit form
    await userEvent.type(screen.getByLabelText(/Runner Numbers/i), '1, 2, 3');
    await userEvent.type(screen.getByLabelText(/Reason/i), 'Test reason');
    fireEvent.click(screen.getByText(/Mark as DNF/i));

    // Check error message
    await waitFor(() => {
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });
  });

  test('handles clear button', async () => {
    render(<WithdrawalDialog {...defaultProps} />);
    
    // Fill form
    await userEvent.type(screen.getByLabelText(/Runner Numbers/i), '1, 2, 3');
    await userEvent.type(screen.getByLabelText(/Reason/i), 'Test reason');

    // Clear form
    fireEvent.click(screen.getByText('Clear'));

    // Check form is cleared
    expect(screen.getByLabelText(/Runner Numbers/i)).toHaveValue('');
    expect(screen.getByLabelText(/Reason/i)).toHaveValue('');
  });

  test('handles escape key', () => {
    const onClose = vi.fn();
    render(<WithdrawalDialog {...defaultProps} onClose={onClose} />);

    // Press escape
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  test('disables submit button while loading', () => {
    useBaseOperationsStore.mockImplementation(() => ({
      ...mockStore,
      loading: true
    }));

    render(<WithdrawalDialog {...defaultProps} />);
    
    const submitButton = screen.getByText('Saving...');
    expect(submitButton).toBeDisabled();
  });

  test('supports DNS type', () => {
    render(<WithdrawalDialog {...defaultProps} type="dns" />);
    
    expect(screen.getByText('Mark Runners as DNS')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter DNS reason')).toBeInTheDocument();
  });

  test('is accessible', () => {
    render(<WithdrawalDialog {...defaultProps} />);

    // Check dialog accessibility
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby');
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    // Check form labels
    expect(screen.getByLabelText(/Runner Numbers/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Reason/i)).toBeInTheDocument();

    // Check button accessibility
    expect(screen.getByRole('button', { name: /Mark as DNF/i })).toHaveAttribute('type', 'submit');
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAttribute('type', 'button');
    expect(screen.getByRole('button', { name: 'Clear' })).toHaveAttribute('type', 'button');
  });

  test('focuses runner input on open', () => {
    render(<WithdrawalDialog {...defaultProps} />);
    expect(screen.getByLabelText(/Runner Numbers/i)).toHaveFocus();
  });

  test('maintains focus trap', async () => {
    render(<WithdrawalDialog {...defaultProps} />);

    const firstFocusable = screen.getByLabelText(/Runner Numbers/i);
    const lastFocusable = screen.getByRole('button', { name: /Mark as DNF/i });

    // Focus last element and press Tab
    lastFocusable.focus();
    fireEvent.keyDown(lastFocusable, { key: 'Tab' });

    // Focus should move to first element
    expect(firstFocusable).toHaveFocus();

    // Focus first element and press Shift+Tab
    firstFocusable.focus();
    fireEvent.keyDown(firstFocusable, { key: 'Tab', shiftKey: true });

    // Focus should move to last element
    expect(lastFocusable).toHaveFocus();
  });
});
