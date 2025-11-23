import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import LogOperationsPanel from '../../src/modules/base-operations/components/LogOperationsPanel';
import useBaseOperationsStore from '../../src/modules/base-operations/store/baseOperationsStore';
import TimeUtils from '../../src/services/timeUtils';

// Mock the store and TimeUtils
vi.mock('../../modules/base-operations/store/baseOperationsStore');
vi.mock('../../services/timeUtils');

describe('LogOperationsPanel', () => {
  const mockLoadLogEntries = vi.fn();
  const mockLoadDeletedEntries = vi.fn();
  const mockLoadDuplicateEntries = vi.fn();
  const mockUpdateLogEntry = vi.fn();
  const mockDeleteLogEntry = vi.fn();
  const mockRestoreLogEntry = vi.fn();
  const mockResolveDuplicate = vi.fn();

  const mockLogEntries = [
    {
      id: 1,
      number: 101,
      checkpoint: 1,
      timestamp: '2024-01-01T10:00:00Z',
      notes: 'Regular entry'
    },
    {
      id: 2,
      number: 102,
      checkpoint: 2,
      timestamp: '2024-01-01T10:30:00Z',
      notes: 'Another entry'
    }
  ];

  const mockDeletedEntries = [
    {
      id: 3,
      originalEntry: {
        number: 103,
        checkpoint: 1,
        timestamp: '2024-01-01T09:00:00Z'
      },
      deletedAt: '2024-01-01T09:30:00Z',
      deletionReason: 'Error correction'
    }
  ];

  const mockDuplicateEntries = [
    {
      id: 4,
      number: 104,
      checkpoint: 1,
      timestamp: '2024-01-01T11:00:00Z',
      duplicateOf: 1
    }
  ];

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock store implementation
    useBaseOperationsStore.mockImplementation(() => ({
      logEntries: mockLogEntries,
      deletedEntries: mockDeletedEntries,
      duplicateEntries: mockDuplicateEntries,
      loadLogEntries: mockLoadLogEntries,
      loadDeletedEntries: mockLoadDeletedEntries,
      loadDuplicateEntries: mockLoadDuplicateEntries,
      updateLogEntry: mockUpdateLogEntry,
      deleteLogEntry: mockDeleteLogEntry,
      restoreLogEntry: mockRestoreLogEntry,
      resolveDuplicate: mockResolveDuplicate,
      loading: false
    }));

    // Mock TimeUtils
    TimeUtils.formatTime.mockImplementation(time => new Date(time).toLocaleString());
  });

  it('renders correctly', () => {
    render(<LogOperationsPanel />);

    expect(screen.getByText('Log Operations')).toBeInTheDocument();
    expect(mockLoadLogEntries).toHaveBeenCalled();
  });

  it('switches between views', () => {
    render(<LogOperationsPanel />);

    // Switch to deleted entries view
    fireEvent.click(screen.getByText('Deleted Entries'));
    expect(mockLoadDeletedEntries).toHaveBeenCalled();
    expect(screen.getByText('Error correction')).toBeInTheDocument();

    // Switch to duplicates view
    fireEvent.click(screen.getByText('Duplicates'));
    expect(mockLoadDuplicateEntries).toHaveBeenCalled();
    expect(screen.getByText('104')).toBeInTheDocument();

    // Switch back to active entries
    fireEvent.click(screen.getByText('Active Entries'));
    expect(screen.getByText('Regular entry')).toBeInTheDocument();
  });

  it('handles entry editing', async () => {
    render(<LogOperationsPanel />);

    // Open edit modal
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    // Update fields
    fireEvent.change(screen.getByLabelText(/Checkpoint/i), {
      target: { value: '2' }
    });

    fireEvent.change(screen.getByLabelText(/Notes/i), {
      target: { value: 'Updated notes' }
    });

    // Submit changes
    await act(async () => {
      fireEvent.click(screen.getByText('Save Changes'));
    });

    expect(mockUpdateLogEntry).toHaveBeenCalledWith(1, {
      checkpoint: 2,
      notes: 'Updated notes'
    });
  });

  it('handles entry deletion', async () => {
    render(<LogOperationsPanel />);

    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm');
    confirmSpy.mockImplementation(() => true);

    // Delete an entry
    const deleteButtons = screen.getAllByText('Delete');
    await act(async () => {
      fireEvent.click(deleteButtons[0]);
    });

    expect(mockDeleteLogEntry).toHaveBeenCalledWith(1);
    confirmSpy.mockRestore();
  });

  it('handles entry restoration', async () => {
    render(<LogOperationsPanel />);

    // Switch to deleted entries view
    fireEvent.click(screen.getByText('Deleted Entries'));

    // Restore an entry
    await act(async () => {
      fireEvent.click(screen.getByText('Restore'));
    });

    expect(mockRestoreLogEntry).toHaveBeenCalledWith(3);
  });

  it('handles duplicate resolution', async () => {
    render(<LogOperationsPanel />);

    // Switch to duplicates view
    fireEvent.click(screen.getByText('Duplicates'));

    // Resolve duplicate (keep)
    await act(async () => {
      fireEvent.click(screen.getByText('Keep'));
    });

    expect(mockResolveDuplicate).toHaveBeenCalledWith(4, 'keep');
  });

  it('filters by checkpoint', () => {
    render(<LogOperationsPanel />);

    // Filter to checkpoint 1
    fireEvent.change(screen.getByLabelText(/All Checkpoints/i), {
      target: { value: '1' }
    });

    // Should show only checkpoint 1 entries
    expect(screen.getByText('Regular entry')).toBeInTheDocument();
    expect(screen.queryByText('Another entry')).not.toBeInTheDocument();
  });

  it('handles search functionality', () => {
    render(<LogOperationsPanel />);

    // Search by number
    fireEvent.change(screen.getByPlaceholderText(/Search by number or notes/i), {
      target: { value: '101' }
    });

    expect(screen.getByText('Regular entry')).toBeInTheDocument();
    expect(screen.queryByText('Another entry')).not.toBeInTheDocument();
  });

  it('handles sort order changes', () => {
    render(<LogOperationsPanel />);

    // Change sort order
    fireEvent.change(screen.getByLabelText(/Sort by/i), {
      target: { value: 'number' }
    });

    const entries = screen.getAllByRole('row').slice(1); // Skip header row
    expect(entries[0]).toHaveTextContent('101');
    expect(entries[1]).toHaveTextContent('102');
  });

  it('shows loading state', () => {
    useBaseOperationsStore.mockImplementation(() => ({
      logEntries: [],
      loadLogEntries: mockLoadLogEntries,
      loading: true
    }));

    render(<LogOperationsPanel />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows empty state', () => {
    useBaseOperationsStore.mockImplementation(() => ({
      logEntries: [],
      loadLogEntries: mockLoadLogEntries,
      loading: false
    }));

    render(<LogOperationsPanel />);

    expect(screen.getByText('No Entries Found')).toBeInTheDocument();
  });

  it('validates edit form', async () => {
    render(<LogOperationsPanel />);

    // Open edit modal
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    // Clear required field
    fireEvent.change(screen.getByLabelText(/Time/i), {
      target: { value: '' }
    });

    // Try to save
    await act(async () => {
      fireEvent.click(screen.getByText('Save Changes'));
    });

    expect(screen.getByText('Time is required')).toBeInTheDocument();
    expect(mockUpdateLogEntry).not.toHaveBeenCalled();
  });

  it('maintains view state across refreshes', () => {
    render(<LogOperationsPanel />);

    // Switch to deleted entries view
    fireEvent.click(screen.getByText('Deleted Entries'));

    // Refresh
    fireEvent.click(screen.getByTitle('Refresh list'));

    // Should still be in deleted entries view
    expect(screen.getByText('Error correction')).toBeInTheDocument();
  });

  it('shows correct entry counts', () => {
    render(<LogOperationsPanel />);

    expect(screen.getByText(`Showing ${mockLogEntries.length} entries`)).toBeInTheDocument();

    // Switch to deleted entries
    fireEvent.click(screen.getByText('Deleted Entries'));
    expect(screen.getByText(`Showing ${mockDeletedEntries.length} entries`)).toBeInTheDocument();

    // Switch to duplicates
    fireEvent.click(screen.getByText('Duplicates'));
    expect(screen.getByText(`Showing ${mockDuplicateEntries.length} entries`)).toBeInTheDocument();
  });

  it('handles errors during operations', async () => {
    // Mock update to fail
    mockUpdateLogEntry.mockRejectedValue(new Error('Update failed'));

    render(<LogOperationsPanel />);

    // Open edit modal
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    // Try to save
    await act(async () => {
      fireEvent.click(screen.getByText('Save Changes'));
    });

    expect(screen.getByText('Update failed')).toBeInTheDocument();
  });
});
