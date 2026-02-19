import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import VetOutDialog from '../../src/modules/base-operations/components/VetOutDialog';
import useBaseOperationsStore from '../../src/modules/base-operations/store/baseOperationsStore';

// Mock the store
vi.mock('../../src/modules/base-operations/store/baseOperationsStore');

describe('VetOutDialog', () => {
  const mockVetOutRunner = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock store implementation
    useBaseOperationsStore.mockImplementation(() => ({
      vetOutRunner: mockVetOutRunner,
      loading: false
    }));
  });

  it('renders correctly when open', () => {
    render(
      <VetOutDialog
        isOpen={true}
        onClose={mockOnClose}
        runnerNumber="123"
      />
    );

    expect(screen.getByText('Vet Out Runner')).toBeInTheDocument();
    expect(screen.getByLabelText(/Runner Number/i)).toHaveValue('123');
    expect(screen.getByText('Failed veterinary check')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <VetOutDialog
        isOpen={false}
        onClose={mockOnClose}
        runnerNumber="123"
      />
    );

    expect(screen.queryByText('Vet Out Runner')).not.toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <VetOutDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Try to submit without required fields
    fireEvent.click(screen.getByText('Vet Out Runner'));

    // Check for validation messages
    expect(await screen.findByText('Runner number is required')).toBeInTheDocument();
    expect(await screen.findByText('Vet-out time is required')).toBeInTheDocument();
    expect(await screen.findByText('Reason is required')).toBeInTheDocument();
    expect(await screen.findByText('Medical notes are recommended for vet-outs')).toBeInTheDocument();

    // No vet-out should be attempted
    expect(mockVetOutRunner).not.toHaveBeenCalled();
  });

  it('handles vet-out submission correctly', async () => {
    // Mock current time
    const mockDate = new Date('2024-01-01T12:00:00');
    vi.spyOn(global, 'Date').mockImplementation(() => mockDate);

    render(
      <VetOutDialog
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

    const vetOutTime = screen.getByLabelText(/Vet-Out Time/i);
    fireEvent.change(vetOutTime, {
      target: { value: '2024-01-01T12:00' }
    });

    fireEvent.change(screen.getByLabelText(/Reason/i), {
      target: { value: 'Lameness' }
    });

    fireEvent.change(screen.getByLabelText(/Medical Notes/i), {
      target: { value: 'Left front limb lameness' }
    });

    fireEvent.change(screen.getByLabelText(/Veterinarian Name/i), {
      target: { value: 'Dr. Smith' }
    });

    // Submit form
    await act(async () => {
      fireEvent.click(screen.getByText('Vet Out Runner'));
    });

    // Verify vet-out was called with correct params
    expect(mockVetOutRunner).toHaveBeenCalledWith(
      123,
      'Lameness',
      'Vet: Dr. Smith\nLeft front limb lameness',
      2,
      '2024-01-01T12:00:00.000Z'
    );

    // Dialog should close on success
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles errors during submission', async () => {
    // Mock vet-out to fail
    const error = new Error('Failed to vet out runner');
    mockVetOutRunner.mockRejectedValue(error);

    render(
      <VetOutDialog
        isOpen={true}
        onClose={mockOnClose}
        runnerNumber="123"
      />
    );

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Runner Number/i), {
      target: { value: '123' }
    });

    const vetOutTime = screen.getByLabelText(/Vet-Out Time/i);
    fireEvent.change(vetOutTime, {
      target: { value: '2024-01-01T12:00' }
    });

    fireEvent.change(screen.getByLabelText(/Reason/i), {
      target: { value: 'Lameness' }
    });

    // Submit form
    await act(async () => {
      fireEvent.click(screen.getByText('Vet Out Runner'));
    });

    // Error should be displayed
    expect(await screen.findByText('Failed to vet out runner')).toBeInTheDocument();
    
    // Dialog should stay open
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('validates runner number format', async () => {
    render(
      <VetOutDialog
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
      <VetOutDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Click "Now" button
    fireEvent.click(screen.getByText('Now'));

    // Time input should be set to current time
    const timeInput = screen.getByLabelText(/Vet-Out Time/i);
    expect(timeInput.value).toBe('2024-01-01T12:00');
  });

  it('disables form submission while loading', () => {
    // Mock loading state
    useBaseOperationsStore.mockImplementation(() => ({
      vetOutRunner: mockVetOutRunner,
      loading: true
    }));

    render(
      <VetOutDialog
        isOpen={true}
        onClose={mockOnClose}
        runnerNumber="123"
      />
    );

    // Submit button should be disabled
    expect(screen.getByText('Vet Out Runner')).toBeDisabled();
  });

  it('shows processing state during submission', async () => {
    // Mock vet-out to take some time
    mockVetOutRunner.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <VetOutDialog
        isOpen={true}
        onClose={mockOnClose}
        runnerNumber="123"
      />
    );

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Runner Number/i), {
      target: { value: '123' }
    });

    const vetOutTime = screen.getByLabelText(/Vet-Out Time/i);
    fireEvent.change(vetOutTime, {
      target: { value: '2024-01-01T12:00' }
    });

    fireEvent.change(screen.getByLabelText(/Reason/i), {
      target: { value: 'Lameness' }
    });

    // Submit form
    fireEvent.click(screen.getByText('Vet Out Runner'));

    // Should show processing state
    expect(await screen.findByText('Processing...')).toBeInTheDocument();

    // Wait for completion
    await waitFor(() => {
      expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
    });
  });

  it('preserves form state between submissions', async () => {
    render(
      <VetOutDialog
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

    fireEvent.change(screen.getByLabelText(/Medical Notes/i), {
      target: { value: 'Test notes' }
    });

    fireEvent.change(screen.getByLabelText(/Veterinarian Name/i), {
      target: { value: 'Dr. Smith' }
    });

    // Submit with missing required fields
    fireEvent.click(screen.getByText('Vet Out Runner'));

    // Form should retain entered values after failed submission
    expect(screen.getByLabelText(/Runner Number/i)).toHaveValue('123');
    expect(screen.getByLabelText(/Checkpoint/i)).toHaveValue('2');
    expect(screen.getByLabelText(/Medical Notes/i)).toHaveValue('Test notes');
    expect(screen.getByLabelText(/Veterinarian Name/i)).toHaveValue('Dr. Smith');
  });

  it('combines vet name and notes correctly', async () => {
    render(
      <VetOutDialog
        isOpen={true}
        onClose={mockOnClose}
        runnerNumber="123"
      />
    );

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Runner Number/i), {
      target: { value: '123' }
    });

    const vetOutTime = screen.getByLabelText(/Vet-Out Time/i);
    fireEvent.change(vetOutTime, {
      target: { value: '2024-01-01T12:00' }
    });

    fireEvent.change(screen.getByLabelText(/Reason/i), {
      target: { value: 'Lameness' }
    });

    // Add vet name and notes
    fireEvent.change(screen.getByLabelText(/Veterinarian Name/i), {
      target: { value: 'Dr. Smith' }
    });

    fireEvent.change(screen.getByLabelText(/Medical Notes/i), {
      target: { value: 'Test notes' }
    });

    // Submit form
    await act(async () => {
      fireEvent.click(screen.getByText('Vet Out Runner'));
    });

    // Verify notes format
    expect(mockVetOutRunner).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(String),
      'Vet: Dr. Smith\nTest notes',
      expect.any(Number),
      expect.any(String)
    );
  });

  it('shows warning message about irreversible action', () => {
    render(
      <VetOutDialog
        isOpen={true}
        onClose={mockOnClose}
        runnerNumber="123"
      />
    );

    expect(screen.getByText(/This will permanently mark runner 123 as vetted out/i)).toBeInTheDocument();
    expect(screen.getByText(/This action is typically not reversible/i)).toBeInTheDocument();
  });
});
