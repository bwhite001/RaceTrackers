import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, fireEvent, screen, within } from '@testing-library/react';
import { act } from 'react';
import DeletedEntriesView from '../../src/modules/base-operations/components/DeletedEntriesView';
import useBaseOperationsStore from '../../src/modules/base-operations/store/baseOperationsStore';
import TimeUtils from '../../src/services/timeUtils';

// Mock the store and TimeUtils
vi.mock('../../src/modules/base-operations/store/baseOperationsStore');
vi.mock('../../src/services/timeUtils');

describe('DeletedEntriesView', () => {
  const mockLoadDeletedEntries = vi.fn();
  const mockRestoreEntry = vi.fn();

  const mockDeletedEntries = [
    {
      id: 1,
      originalEntry: {
        id: 10,
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
        id: 20,
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

  // Helper: find the <tr> row that contains a given runner number span (e.g., "#101")
  const getRowByRunnerNumber = (number) => {
    const span = screen.getByText(`#${number}`);
    // Walk up to the <tr> ancestor
    return span.closest('tr');
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock window.confirm to return true (user confirms restore)
    vi.spyOn(window, 'confirm').mockReturnValue(true);

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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders correctly', () => {
    render(<DeletedEntriesView />);

    expect(screen.getByText('Deleted Entries')).toBeInTheDocument();
    expect(mockLoadDeletedEntries).toHaveBeenCalled();
  });

  it('shows deleted entries with runner numbers and deleted-by info', () => {
    render(<DeletedEntriesView />);

    // Runner numbers are rendered as "#101" and "#102"
    expect(screen.getByText('#101')).toBeInTheDocument();
    expect(screen.getByText('#102')).toBeInTheDocument();

    // "by <user>" is displayed in the Deletion Details column for each row
    expect(screen.getByText('by operator1')).toBeInTheDocument();
    expect(screen.getByText('by operator2')).toBeInTheDocument();
  });

  it('shows deletion reasons inside expanded details rows', () => {
    render(<DeletedEntriesView />);

    // Deletion reasons are only shown after expanding details
    // Entries are sorted newest-first: entry 2 (id=2) is at position 0, entry 1 (id=1) at position 1

    // Expand entry 1 using the Show Details button in its row
    const row1 = getRowByRunnerNumber(101);
    const showDetailsBtn1 = within(row1).getByText('Show Details');
    fireEvent.click(showDetailsBtn1);
    expect(screen.getByText('Error correction')).toBeInTheDocument();

    // Expand entry 2 using the Show Details button in its row
    const row2 = getRowByRunnerNumber(102);
    const showDetailsBtn2 = within(row2).getByText('Show Details');
    fireEvent.click(showDetailsBtn2);
    expect(screen.getByText('Duplicate entry')).toBeInTheDocument();
  });

  it('handles entry restoration for first entry (id=1)', async () => {
    mockRestoreEntry.mockResolvedValue(undefined);

    render(<DeletedEntriesView />);

    // Entries are sorted newest-first, so entry 2 (id=2) appears first.
    // To restore entry id=1, click Restore in its specific row.
    const row1 = getRowByRunnerNumber(101);
    const restoreBtn = within(row1).getByText('Restore');

    await act(async () => {
      fireEvent.click(restoreBtn);
    });

    expect(mockRestoreEntry).toHaveBeenCalledWith(1);
  });

  it('handles entry restoration for second entry (id=2)', async () => {
    mockRestoreEntry.mockResolvedValue(undefined);

    render(<DeletedEntriesView />);

    const row2 = getRowByRunnerNumber(102);
    const restoreBtn = within(row2).getByText('Restore');

    await act(async () => {
      fireEvent.click(restoreBtn);
    });

    expect(mockRestoreEntry).toHaveBeenCalledWith(2);
  });

  it('filters by checkpoint using the select element', () => {
    render(<DeletedEntriesView />);

    // The checkpoint filter is a <select> with no label; locate it by its displayed value
    const checkpointSelect = screen.getByDisplayValue('All Checkpoints');
    fireEvent.change(checkpointSelect, { target: { value: '1' } });

    // Runner #101 is at checkpoint 1, #102 is at checkpoint 2
    expect(screen.getByText('#101')).toBeInTheDocument();
    expect(screen.queryByText('#102')).not.toBeInTheDocument();
  });

  it('filters by time range using the select element', () => {
    render(<DeletedEntriesView />);

    const timeRangeSelect = screen.getByDisplayValue('All Time');
    fireEvent.change(timeRangeSelect, { target: { value: '1h' } });

    // The select value updates (time filtering works with real timestamps)
    expect(timeRangeSelect).toHaveValue('1h');
  });

  it('handles search by runner number', () => {
    render(<DeletedEntriesView />);

    fireEvent.change(screen.getByPlaceholderText(/Search by number/i), {
      target: { value: '101' }
    });

    expect(screen.getByText('#101')).toBeInTheDocument();
    expect(screen.queryByText('#102')).not.toBeInTheDocument();
  });

  it('handles search by deletion reason', () => {
    render(<DeletedEntriesView />);

    fireEvent.change(screen.getByPlaceholderText(/Search by number/i), {
      target: { value: 'duplicate' }
    });

    expect(screen.queryByText('#101')).not.toBeInTheDocument();
    expect(screen.getByText('#102')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    useBaseOperationsStore.mockImplementation(() => ({
      deletedEntries: [],
      loadDeletedEntries: mockLoadDeletedEntries,
      restoreEntry: mockRestoreEntry,
      loading: true
    }));

    render(<DeletedEntriesView />);

    // The loading spinner is a div with animate-spin class; no role="status" is set
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('shows empty state', () => {
    useBaseOperationsStore.mockImplementation(() => ({
      deletedEntries: [],
      loadDeletedEntries: mockLoadDeletedEntries,
      restoreEntry: mockRestoreEntry,
      loading: false
    }));

    render(<DeletedEntriesView />);

    expect(screen.getByText('No Deleted Entries')).toBeInTheDocument();
  });

  it('shows deletion reason in expanded details', () => {
    render(<DeletedEntriesView />);

    // Open details for entry 1 (runner #101) via row-scoped lookup
    const row1 = getRowByRunnerNumber(101);
    fireEvent.click(within(row1).getByText('Show Details'));

    // The deletion reason appears in the details section below
    expect(screen.getByText('Error correction')).toBeInTheDocument();
    // Entry 2's reason is not yet expanded
    expect(screen.queryByText('Duplicate entry')).not.toBeInTheDocument();
  });

  it('shows original notes in expanded details', () => {
    render(<DeletedEntriesView />);

    // Notes are only visible after expanding the entry details
    const row1 = getRowByRunnerNumber(101);
    fireEvent.click(within(row1).getByText('Show Details'));

    expect(screen.getByText('Original entry')).toBeInTheDocument();
  });

  it('handles refresh button click', () => {
    render(<DeletedEntriesView />);

    fireEvent.click(screen.getByTitle('Refresh list'));
    expect(mockLoadDeletedEntries).toHaveBeenCalledTimes(2); // Once on mount, once on click
  });

  it('maintains filter state across refreshes', () => {
    render(<DeletedEntriesView />);

    const checkpointSelect = screen.getByDisplayValue('All Checkpoints');
    const timeRangeSelect = screen.getByDisplayValue('All Time');

    fireEvent.change(checkpointSelect, { target: { value: '1' } });
    fireEvent.change(timeRangeSelect, { target: { value: '1h' } });

    // Refresh
    fireEvent.click(screen.getByTitle('Refresh list'));

    // Filter selects retain their values after refresh
    expect(checkpointSelect).toHaveValue('1');
    expect(timeRangeSelect).toHaveValue('1h');
  });

  it('shows relative timestamps for each deleted entry', () => {
    render(<DeletedEntriesView />);

    // Each entry renders "Deleted 30 minutes ago" — the component prefixes with "Deleted "
    // so getByText('30 minutes ago') alone won't match; use a regex to find the full string
    expect(screen.getAllByText(/Deleted 30 minutes ago/i)).toHaveLength(2);
  });

  it('does not display an error message in the UI when restoration fails', async () => {
    mockRestoreEntry.mockRejectedValue(new Error('Restore failed'));

    render(<DeletedEntriesView />);

    // Try to restore via the first row's Restore button
    const row2 = getRowByRunnerNumber(102); // sorted first (newest)
    await act(async () => {
      fireEvent.click(within(row2).getByText('Restore'));
    });

    // The component logs the error but does not render error text in the UI
    expect(screen.queryByText(/Restore failed/i)).not.toBeInTheDocument();
    // The component still renders normally after the failed restore
    expect(screen.getByText('Deleted Entries')).toBeInTheDocument();
  });

  it('shows correct filtered count', () => {
    render(<DeletedEntriesView />);

    const checkpointSelect = screen.getByDisplayValue('All Checkpoints');
    fireEvent.change(checkpointSelect, { target: { value: '1' } });

    // Count text is split across React interpolated elements; use { exact: false }
    expect(screen.getByText(/Showing 1 of 2 deleted entries/i)).toBeInTheDocument();
  });

  it('toggles details visibility', () => {
    render(<DeletedEntriesView />);

    // Show details for entry 1
    const row1 = getRowByRunnerNumber(101);
    fireEvent.click(within(row1).getByText('Show Details'));
    expect(screen.getByText('Deletion Reason')).toBeInTheDocument();

    // Hide details
    fireEvent.click(within(row1).getByText('Hide Details'));
    expect(screen.queryByText('Deletion Reason')).not.toBeInTheDocument();
  });

  it('shows checkpoint in entry rows', () => {
    render(<DeletedEntriesView />);

    // The table rows show "Checkpoint 1" and "Checkpoint 2" in the Original Entry column
    // (the dropdown also has checkpoint options, so there will be multiple matches)
    expect(screen.getAllByText(/^Checkpoint 1$/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/^Checkpoint 2$/).length).toBeGreaterThanOrEqual(1);
  });

  it('shows entry IDs in expanded audit info for entry 1', () => {
    render(<DeletedEntriesView />);

    // Expand entry 1 (runner #101)
    const row1 = getRowByRunnerNumber(101);
    fireEvent.click(within(row1).getByText('Show Details'));

    // The component renders "Entry ID: {id} • Original Entry ID: {originalEntry.id}"
    // Text is split across JSX interpolations; use a custom matcher
    expect(
      screen.getByText((content, element) =>
        element?.tagName !== 'SCRIPT' &&
        element?.textContent?.includes('Entry ID: 1') &&
        element?.textContent?.includes('Original Entry ID: 10') &&
        !element?.querySelector('div') // leaf-level text container
      )
    ).toBeInTheDocument();
  });

  it('shows entry IDs in expanded audit info for entry 2', () => {
    render(<DeletedEntriesView />);

    // Expand entry 2 (runner #102)
    const row2 = getRowByRunnerNumber(102);
    fireEvent.click(within(row2).getByText('Show Details'));

    expect(
      screen.getByText((content, element) =>
        element?.tagName !== 'SCRIPT' &&
        element?.textContent?.includes('Entry ID: 2') &&
        element?.textContent?.includes('Original Entry ID: 20') &&
        !element?.querySelector('div')
      )
    ).toBeInTheDocument();
  });
});
