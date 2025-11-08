import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import WithdrawalDialog from '../../modules/base-operations/components/WithdrawalDialog';
import useBaseOperationsStore from '../../modules/base-operations/store/baseOperationsStore';

// Mock the store
vi.mock('../../modules/base-operations/store/baseOperationsStore');

describe('WithdrawalDialog', () => {
  const mockWithdrawRunner = vi.fn();
  const mockReverseWithdrawal = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock store implementation
    useBaseOperationsStore.mockImplementation(() => ({
      withdrawRunner: mockWithdrawRunner,
      reverseWithdrawal: mockReverseWithdrawal,
      loading: false
    }));
  });

  it('renders correctly when open', () => {
    render(
      <WithdrawalDialog
        isOpen={true}
        onClose={mockOnClose}
        runnerNumber="123"
      />
    );

    expect(screen.getByText('Withdraw Runner')).toBeInTheDocument();
    expect(screen.getByLabelText(/Runner Number/i)).toHaveValue('123');
  });

  it('does not render when closed', () => {
    render(
      <WithdrawalDialog
        isOpen={false}
        onClose={mockOnClose}
        runnerNumber="123"
      />
    );

    expect(screen.queryByText('Withdraw Runner')).not.toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <WithdrawalDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Try to submit without required fields
    fireEvent.click(screen.getByText('Withdraw Runner'));

    // Check for validation messages
    expect(await screen.findByText('Runner number is required')).toBeInTheDocument();
    expect(await screen.findByText('Withdrawal time is required')).toBeInTheDocument();
    expect(await screen.findByText('Reason is required')).toBeInTheDocument();

    // No withdrawal should be attempted
    expect(mockWithdrawRunner).not.toHaveBeenCalled();
  });

  it('handles withdrawal submission correctly', async () => {
    // Mock current time
    const mockDate = new Date('2024-01-01T12:00:00');
    vi.spyOn(global, 'Date').mockImplementation(() => mockDate);

    render(
      <WithdrawalDialog
        isOpen={true}
        onClose={mockOnClose}
        runnerNumber="123"
      />
    );

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/Runner Number/i), {
      target: { value: '123' }
    });

    fireEvent.change(screen.getByLabelText(/Checkpoint/i), {
      target: { value: '2' }
    });

    const withdrawalTime = screen.getByLabelText(/Withdrawal Time/i);
    fireEvent.change(withdrawalTime, {
      target: { value: '2024-01-01T12:00' }
    });

    fireEvent.change(screen.getByLabelText(/Reason/i), {
      target: { value: 'Personal Emergency' }
    });

    fireEvent.change(screen.getByLabelText(/Comments/i), {
      target: { value: 'Test comment' }
    });

    // Submit form
    await act(async () => {
      fireEvent.click(screen.getByText('Withdraw Runner'));
    });

    // Verify withdrawal was called with correct params
    expect(mockWithdrawRunner).toHaveBeenCalledWith(
      123,
      'Personal Emergency',
      'Test comment',
      2,
      '2024-01-01T12:00:00.000Z'
    );

    // Dialog should close on success
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles withdrawal reversal correctly', async () => {
    render(
      <WithdrawalDialog
        isOpen={true}
        onClose={mockOnClose}
        runnerNumber="123*"
      />
    );

    // Should detect reversal mode from * suffix
    expect(screen.getByText(/Reversal Mode/i)).toBeInTheDocument();

    // Submit reversal
    await act(async () => {
      fireEvent.click(screen.getByText('Reverse Withdrawal'));
    });

    // Verify reversal was called
    expect(mockReverseWithdrawal).toHaveBeenCalledWith(123);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles errors during submission', async () => {
    // Mock withdrawal to fail
    const error = new Error('Failed to withdraw runner');
    mockWithdrawRunner.mockRejectedValue(error);

    render(
      <WithdrawalDialog
        isOpen={true}
        onClose={mockOnClose}
        runnerNumber="123"
      />
    );

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Runner Number/i), {
      target: { value: '123' }
    });

    const withdrawalTime = screen.getByLabelText(/Withdrawal Time/i);
    fireEvent.change(withdrawalTime, {
      target: { value: '2024-01-01T12:00' }
    });

    // Submit form
    await act(async () => {
      fireEvent.click(screen.getByText('Withdraw Runner'));
    });

    // Error should be displayed
    expect(await screen.findByText('Failed to withdraw runner')).toBeInTheDocument();
    
    // Dialog should stay open
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('validates runner number format', async () => {
    render(
      <WithdrawalDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Try invalid runner numbers
    const runnerInput = screen.getByLabelText(/Runner Number/i);

    fireEvent.change(runnerInput, { target: { value: 'abc' } });
    expect(await screen.findByText('Invalid runner number')).toBeInTheDocument();

    fireEvent.change(runnerInput, { target: { value: '-1' } });
    expect(await screen.findByText('Invalid runner number')).toBeInTheDocument();

    fireEvent.change(runnerInput, { target: { value: '0' } });
    expect(await screen.findByText('Invalid runner number')).toBeInTheDocument();
  });

  it('handles "Now" button for time selection', () => {
    // Mock current time
    const mockDate = new Date('2024-01-01T12:00:00');
    vi.spyOn(global, 'Date').mockImplementation(() => mockDate);

    render(
      <WithdrawalDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Click "Now" button
    fireEvent.click(screen.getByText('Now'));

    // Time input should be set to current time
    const timeInput = screen.getByLabelText(/Withdrawal Time/i);
    expect(timeInput.value).toBe('2024-01-01T12:00');
  });

  it('disables form submission while loading', () => {
    // Mock loading state
    useBaseOperationsStore.mockImplementation(() => ({
      withdrawRunner: mockWithdrawRunner,
      reverseWithdrawal: mockReverseWithdrawal,
      loading: true
    }));

    render(
      <WithdrawalDialog
        isOpen={true}
        onClose={mockOnClose}
        runnerNumber="123"
      />
    );

    // Submit button should be disabled
    expect(screen.getByText('Withdraw Runner')).toBeDisabled();
  });

  it('shows processing state during submission', async () => {
    // Mock withdrawal to take some time
    mockWithdrawRunner.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <WithdrawalDialog
        isOpen={true}
        onClose={mockOnClose}
        runnerNumber="123"
      />
    );

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Runner Number/i), {
      target: { value: '123' }
    });

    const withdrawalTime = screen.getByLabelText(/Withdrawal Time/i);
    fireEvent.change(withdrawalTime, {
      target: { value: '2024-01-01T12:00' }
    });

    // Submit form
    fireEvent.click(screen.getByText('Withdraw Runner'));

    // Should show processing state
    expect(await screen.findByText('Processing...')).toBeInTheDocument();

    // Wait for completion
    await waitFor(() => {
      expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
    });
  });

  it('preserves form state between submissions', async () => {
    render(
      <WithdrawalDialog
        isOpen={true}
        onClose={mockOnClose}
        runnerNumber="123"
      />
    );

    // Fill in form
    fireEvent.change(screen.getByLabelText(/Runner Number/i), {
      target: { value: '123' }
    });

    fireEvent.change(screen.getByLabelText(/Checkpoint/i), {
      target: { value: '2' }
    });

    fireEvent.change(screen.getByLabelText(/Comments/i), {
      target: { value: 'Test comment' }
    });

    // Submit with missing required fields
    fireEvent.click(screen.getByText('Withdraw Runner'));

    // Form should retain entered values after failed submission
    expect(screen.getByLabelText(/Runner Number/i)).toHaveValue('123');
    expect(screen.getByLabelText(/Checkpoint/i)).toHaveValue('2');
    expect(screen.getByLabelText(/Comments/i)).toHaveValue('Test comment');
  });
});
