import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import DeletedEntriesView from '../../src/modules/base-operations/components/DeletedEntriesView';
import useBaseOperationsStore from '../../src/modules/base-operations/store/baseOperationsStore';
import TimeUtils from '../../src/services/timeUtils';

// Mock the store and TimeUtils
vi.mock('../../modules/base-operations/store/baseOperationsStore');
vi.mock('../../services/timeUtils');

describe('DeletedEntriesView', () => {
  const mockLoadDeletedEntries = vi.fn();
  const mockRestoreEntry = vi.fn();

  const mockDeletedEntries = [
    {
      id: 1,
      originalEntry: {
        number: 101,
        checkpoint: 1,
        timestamp: '2024-01-01T10:00:00Z',
        notes: 'Original entry'
      },
      deletedAt: '2024-01-01T10:30:00Z',
      deletedBy: 'operator1',
      deletionReason: 'Error correction',
      auditTrail: [
        {
          action: 'DELETE',
          timestamp: '2024-01-01T10:30:00Z',
          user: 'operator1',
          details: 'Initial deletion'
        }
      ]
    },
    {
      id: 2,
      originalEntry: {
        number: 102,
        checkpoint: 2,
        timestamp: '2024-01-01T11:00:00Z',
        notes: 'Another entry'
      },
      deletedAt: '2024-01-01T11:30:00Z',
      deletedBy: 'operator2',
      deletionReason: 'Duplicate entry',
      auditTrail: [
        {
          action: 'DELETE',
          timestamp: '2024-01-01T11:30:00Z',
          user: 'operator2',
          details: 'Removed duplicate'
        }
      ]
    }
  ];

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock store implementation
    useBaseOperationsStore.mockImplementation(() => ({
      deletedEntries: mockDeletedEntries,
      loadDeletedEntries: mockLoadDeletedEntries,
      restoreEntry: mockRestoreEntry,
      loading: false
    }));

    // Mock TimeUtils
    TimeUtils.formatTime.mockImplementation(time => new Date(time).toLocaleString());
    TimeUtils.formatRelative.mockImplementation(() => '30 minutes ago');
  });

  it('renders correctly', () => {
    render(<DeletedEntriesView />);

    expect(screen.getByText('Deleted Entries')).toBeInTheDocument();
    expect(mockLoadDeletedEntries).toHaveBeenCalled();
  });

  it('shows deleted entries with details', () => {
    render(<DeletedEntriesView />);

    mockDeletedEntries.forEach(entry => {
      expect(screen.getByText(`#${entry.originalEntry.number}`)).toBeInTheDocument();
      expect(screen.getByText(entry.deletionReason)).toBeInTheDocument();
      expect(screen.getByText(`by ${entry.deletedBy}`)).toBeInTheDocument();
    });
  });

  it('handles entry restoration', async () => {
    render(<DeletedEntriesView />);

    // Restore first entry
    await act(async () => {
      fireEvent.click(screen.getAllByText('Restore')[0]);
    });

    expect(mockRestoreEntry).toHaveBeenCalledWith(1);
  });

  it('filters by checkpoint', () => {
    render(<DeletedEntriesView />);

    // Filter to checkpoint 1
    fireEvent.change(screen.getByLabelText(/All Checkpoints/i), {
      target: { value: '1' }
    });

    // Should show only checkpoint 1 entries
    expect(screen.getByText('101')).toBeInTheDocument();
    expect(screen.queryByText('102')).not.toBeInTheDocument();
  });

  it('filters by time range', () => {
    render(<DeletedEntriesView />);

    // Filter to last hour
    fireEvent.change(screen.getByLabelText(/All Time/i), {
      target: { value: '1h' }
    });

    // Time filtering is handled in the component
    expect(screen.getByText('101')).toBeInTheDocument();
    expect(screen.getByText('102')).toBeInTheDocument();
  });

  it('handles search functionality', () => {
    render(<DeletedEntriesView />);

    // Search by number
    fireEvent.change(screen.getByPlaceholderText(/Search by number/i), {
      target: { value: '101' }
    });

    expect(screen.getByText('101')).toBeInTheDocument();
    expect(screen.queryByText('102')).not.toBeInTheDocument();

    // Search by reason
    fireEvent.change(screen.getByPlaceholderText(/Search by number/i), {
      target: { value: 'duplicate' }
    });

    expect(screen.queryByText('101')).not.toBeInTheDocument();
    expect(screen.getByText('102')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    useBaseOperationsStore.mockImplementation(() => ({
      deletedEntries: [],
      loadDeletedEntries: mockLoadDeletedEntries,
      loading: true
    }));

    render(<DeletedEntriesView />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows empty state', () => {
    useBaseOperationsStore.mockImplementation(() => ({
      deletedEntries: [],
      loadDeletedEntries: mockLoadDeletedEntries,
      loading: false
    }));

    render(<DeletedEntriesView />);

    expect(screen.getByText('No Deleted Entries')).toBeInTheDocument();
  });

  it('shows audit trail details', () => {
    render(<DeletedEntriesView />);

    // Show details for first entry
    fireEvent.click(screen.getAllByText('Show Details')[0]);

    expect(screen.getByText('Initial deletion')).toBeInTheDocument();
    expect(screen.getByText('operator1')).toBeInTheDocument();
  });

  it('handles refresh button click', () => {
    render(<DeletedEntriesView />);

    fireEvent.click(screen.getByTitle('Refresh list'));
    expect(mockLoadDeletedEntries).toHaveBeenCalledTimes(2); // Once on mount, once on click
  });

  it('maintains filter state across refreshes', () => {
    render(<DeletedEntriesView />);

    // Set filters
    fireEvent.change(screen.getByLabelText(/All Checkpoints/i), {
      target: { value: '1' }
    });

    fireEvent.change(screen.getByLabelText(/All Time/i), {
      target: { value: '1h' }
    });

    // Refresh
    fireEvent.click(screen.getByTitle('Refresh list'));

    // Should maintain filter selections
    expect(screen.getByLabelText(/All Checkpoints/i)).toHaveValue('1');
    expect(screen.getByLabelText(/All Time/i)).toHaveValue('1h');
  });

  it('shows relative timestamps', () => {
    render(<DeletedEntriesView />);

    expect(screen.getAllByText('30 minutes ago')).toHaveLength(2);
  });

  it('handles errors during restoration', async () => {
    mockRestoreEntry.mockRejectedValue(new Error('Restore failed'));

    render(<DeletedEntriesView />);

    // Try to restore entry
    await act(async () => {
      fireEvent.click(screen.getAllByText('Restore')[0]);
    });

    expect(screen.getByText('Restore failed')).toBeInTheDocument();
  });

  it('shows correct filtered count', () => {
    render(<DeletedEntriesView />);

    // Filter to checkpoint 1
    fireEvent.change(screen.getByLabelText(/All Checkpoints/i), {
      target: { value: '1' }
    });

    expect(screen.getByText('Showing 1 of 2 deleted entries')).toBeInTheDocument();
  });

  it('toggles details visibility', () => {
    render(<DeletedEntriesView />);

    // Show details
    fireEvent.click(screen.getAllByText('Show Details')[0]);
    expect(screen.getByText('Initial deletion')).toBeInTheDocument();

    // Hide details
    fireEvent.click(screen.getByText('Hide Details'));
    expect(screen.queryByText('Initial deletion')).not.toBeInTheDocument();
  });

  it('shows original entry details', () => {
    render(<DeletedEntriesView />);

    mockDeletedEntries.forEach(entry => {
      expect(screen.getByText(`Checkpoint ${entry.originalEntry.checkpoint}`)).toBeInTheDocument();
      expect(screen.getByText(entry.originalEntry.notes)).toBeInTheDocument();
    });
  });

  it('shows entry IDs for audit purposes', () => {
    render(<DeletedEntriesView />);

    mockDeletedEntries.forEach(entry => {
      expect(screen.getByText(`Entry ID: ${entry.id}`)).toBeInTheDocument();
      expect(screen.getByText(`Original Entry ID: ${entry.originalEntry.id}`)).toBeInTheDocument();
    });
  });
});
