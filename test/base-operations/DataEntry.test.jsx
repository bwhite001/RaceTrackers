import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import DataEntry from '../../src/components/BaseStation/DataEntry';
import useBaseOperationsStore from '../../src/modules/base-operations/store/baseOperationsStore';
import { HOTKEYS } from '../../src/types';

// Mock the store
vi.mock('../../modules/base-operations/store/baseOperationsStore');

// Mock device detection hook
vi.mock('../../shared/hooks/useDeviceDetection', () => ({
  default: () => ({
    isDesktop: true
  })
}));

describe('DataEntry', () => {
  const mockStore = {
    currentRaceId: 'test-race-1',
    checkpointNumber: 1,
    bulkMarkRunners: vi.fn(),
    stats: {
      total: 100,
      finished: 50,
      active: 40,
      dnf: 5,
      dns: 5
    },
    error: null,
    loading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useBaseOperationsStore.mockImplementation(() => mockStore);
  });

  test('renders form elements correctly', () => {
    render(<DataEntry />);

    // Check time input
    expect(screen.getByLabelText(/Common Time/i)).toBeInTheDocument();
    expect(screen.getByText(`(Press ${HOTKEYS.NOW} for current time)`)).toBeInTheDocument();

    // Check runner numbers input
    expect(screen.getByLabelText(/Runner Numbers/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Example: 1, 2, 3-5, 10')).toBeInTheDocument();

    // Check buttons
    expect(screen.getByText('Now')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
    expect(screen.getByText(/Save/)).toBeInTheDocument();
  });

  test('handles time input', async () => {
    render(<DataEntry />);
    
    const timeInput = screen.getByLabelText(/Common Time/i);
    await userEvent.type(timeInput, '12:34:56');

    expect(timeInput.value).toBe('12:34:56');
  });

  test('handles "Now" button click', () => {
    render(<DataEntry />);
    
    const nowButton = screen.getByText('Now');
    fireEvent.click(nowButton);

    const timeInput = screen.getByLabelText(/Common Time/i);
    expect(timeInput.value).toBe(format(new Date(), 'HH:mm:ss'));
  });

  test('handles runner number input and shows preview', async () => {
    render(<DataEntry />);
    
    const input = screen.getByLabelText(/Runner Numbers/i);
    await userEvent.type(input, '1, 2, 3-5');

    // Check preview
    expect(screen.getByText('Preview (5 runners)')).toBeInTheDocument();
    expect(screen.getByText('1, 2, 3, 4, 5')).toBeInTheDocument();
  });

  test('validates form before submission', async () => {
    render(<DataEntry />);
    
    // Try to submit without data
    const submitButton = screen.getByText(/Save/);
    fireEvent.click(submitButton);

    // Check validation messages
    expect(screen.getByText('Time is required')).toBeInTheDocument();
    expect(screen.getByText('At least one valid runner number is required')).toBeInTheDocument();
  });

  test('handles successful form submission', async () => {
    const onUnsavedChanges = vi.fn();
    render(<DataEntry onUnsavedChanges={onUnsavedChanges} />);
    
    // Fill form
    await userEvent.type(screen.getByLabelText(/Common Time/i), '12:34:56');
    await userEvent.type(screen.getByLabelText(/Runner Numbers/i), '1, 2, 3');

    // Submit form
    fireEvent.click(screen.getByText(/Save/));

    // Check store interaction
    await waitFor(() => {
      expect(mockStore.bulkMarkRunners).toHaveBeenCalledWith(
        [1, 2, 3],
        '12:34:56'
      );
    });

    // Form should be cleared
    expect(screen.getByLabelText(/Runner Numbers/i).value).toBe('');
    expect(onUnsavedChanges).toHaveBeenCalledWith(false);
  });

  test('handles form submission errors', async () => {
    const error = new Error('Test error');
    mockStore.bulkMarkRunners.mockRejectedValue(error);

    render(<DataEntry />);
    
    // Fill and submit form
    await userEvent.type(screen.getByLabelText(/Common Time/i), '12:34:56');
    await userEvent.type(screen.getByLabelText(/Runner Numbers/i), '1, 2, 3');
    fireEvent.click(screen.getByText(/Save/));

    // Check error message
    await waitFor(() => {
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });
  });

  test('handles clear button', async () => {
    const onUnsavedChanges = vi.fn();
    render(<DataEntry onUnsavedChanges={onUnsavedChanges} />);
    
    // Fill form
    await userEvent.type(screen.getByLabelText(/Common Time/i), '12:34:56');
    await userEvent.type(screen.getByLabelText(/Runner Numbers/i), '1, 2, 3');

    // Clear form
    fireEvent.click(screen.getByText('Clear'));

    // Check form is cleared
    expect(screen.getByLabelText(/Runner Numbers/i).value).toBe('');
    expect(onUnsavedChanges).toHaveBeenCalledWith(false);
  });

  test('displays current stats', () => {
    render(<DataEntry />);
    
    expect(screen.getByText('100')).toBeInTheDocument(); // Total
    expect(screen.getByText('50')).toBeInTheDocument();  // Finished
    expect(screen.getByText('40')).toBeInTheDocument();  // Active
    expect(screen.getByText('10')).toBeInTheDocument();  // DNF/DNS
  });

  test('disables save button while loading', () => {
    useBaseOperationsStore.mockImplementation(() => ({
      ...mockStore,
      loading: true
    }));

    render(<DataEntry />);
    
    const saveButton = screen.getByText('Saving...');
    expect(saveButton).toBeDisabled();
  });

  test('tracks unsaved changes', async () => {
    const onUnsavedChanges = vi.fn();
    render(<DataEntry onUnsavedChanges={onUnsavedChanges} />);
    
    // Type in runner numbers
    await userEvent.type(screen.getByLabelText(/Runner Numbers/i), '1, 2, 3');
    expect(onUnsavedChanges).toHaveBeenCalledWith(true);

    // Clear form
    fireEvent.click(screen.getByText('Clear'));
    expect(onUnsavedChanges).toHaveBeenCalledWith(false);
  });

  test('handles keyboard shortcuts', () => {
    render(<DataEntry />);
    
    // Press 'T' for current time
    fireEvent.keyDown(document, { key: HOTKEYS.NOW });
    const timeInput = screen.getByLabelText(/Common Time/i);
    expect(timeInput.value).toBe(format(new Date(), 'HH:mm:ss'));

    // Press Ctrl+Enter to save
    fireEvent.keyDown(document, { key: 'Enter', ctrlKey: true });
    expect(mockStore.bulkMarkRunners).not.toHaveBeenCalled(); // Should not save without data
  });

  test('is accessible', () => {
    render(<DataEntry />);

    // Check form labels
    expect(screen.getByLabelText(/Common Time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Runner Numbers/i)).toBeInTheDocument();

    // Check button accessibility
    expect(screen.getByText('Now')).toHaveAttribute('type', 'button');
    expect(screen.getByText('Clear')).toHaveAttribute('type', 'button');
    expect(screen.getByText(/Save/)).toHaveAttribute('type', 'submit');
  });
});
