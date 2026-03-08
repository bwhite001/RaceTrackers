import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import OutList from '../../src/modules/base-operations/components/OutList';
import useBaseOperationsStore from '../../src/modules/base-operations/store/baseOperationsStore';
import TimeUtils from '../../src/services/timeUtils';

// Mock the store and TimeUtils
vi.mock('../../src/modules/base-operations/store/baseOperationsStore');
vi.mock('../../src/services/timeUtils');

describe('OutList', () => {
  const mockLoadOutList = vi.fn();
  const mockGenerateOutListReport = vi.fn();
  const mockDownloadReport = vi.fn();

  const mockOutList = [
    {
      id: 1,
      number: 101,
      status: 'dnf',
      withdrawalDetails: {
        withdrawalTime: '2024-01-01T10:00:00Z',
        reason: 'Personal Emergency',
        comments: 'Rider requested withdrawal'
      }
    },
    {
      id: 2,
      number: 102,
      status: 'vet-out',
      vetOutDetails: {
        vetOutTime: '2024-01-01T11:00:00Z',
        reason: 'Lameness',
        medicalNotes: 'Left front limb lameness'
      }
    },
    {
      id: 3,
      number: 103,
      status: 'non-starter',
      recordedTime: '2024-01-01T12:00:00Z',
      notes: 'Did not reach checkpoint in time'
    }
  ];

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock store implementation
    useBaseOperationsStore.mockImplementation(() => ({
      outList: mockOutList,
      loadOutList: mockLoadOutList,
      generateOutListReport: mockGenerateOutListReport,
      downloadReport: mockDownloadReport,
      loading: false
    }));

    // Mock TimeUtils
    TimeUtils.formatTime.mockImplementation(time => new Date(time).toLocaleString());
  });

  it('renders correctly', () => {
    render(<OutList />);

    expect(screen.getByText('Out List')).toBeInTheDocument();
    expect(screen.getByText(/Runners who are out of the race/i)).toBeInTheDocument();
    expect(mockLoadOutList).toHaveBeenCalled();
  });

  it('shows status summary cards', () => {
    render(<OutList />);

    // Summary cards show counts — 1 dnf, 1 vet-out, 1 non-starter
    const ones = screen.getAllByText('1');
    expect(ones.length).toBeGreaterThanOrEqual(3); // at least 3 cards showing "1"
  });

  it('filters by status', () => {
    render(<OutList />);

    // Select dnf status
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'dnf' }
    });

    // Should only show dnf runner
    expect(screen.getByText('101')).toBeInTheDocument();
    expect(screen.queryByText('102')).not.toBeInTheDocument();
    expect(screen.queryByText('103')).not.toBeInTheDocument();
  });

  it('handles search functionality', () => {
    render(<OutList />);

    // Search by number
    fireEvent.change(screen.getByPlaceholderText(/Search by number/i), {
      target: { value: '102' }
    });

    expect(screen.getByText('102')).toBeInTheDocument();
    expect(screen.queryByText('101')).not.toBeInTheDocument();
    expect(screen.queryByText('103')).not.toBeInTheDocument();

    // Search by reason
    fireEvent.change(screen.getByPlaceholderText(/Search by number/i), {
      target: { value: 'lameness' }
    });

    expect(screen.getByText('102')).toBeInTheDocument();
    expect(screen.queryByText('101')).not.toBeInTheDocument();
    expect(screen.queryByText('103')).not.toBeInTheDocument();
  });

  it('handles refresh button click', () => {
    render(<OutList />);

    fireEvent.click(screen.getByTitle('Refresh list'));
    expect(mockLoadOutList).toHaveBeenCalledTimes(2); // Once on mount, once on click
  });

  it('handles print button click', () => {
    const mockPrint = vi.fn();
    window.print = mockPrint;

    render(<OutList />);

    fireEvent.click(screen.getByText('Print'));
    expect(mockPrint).toHaveBeenCalled();
  });

  it('handles export button click', async () => {
    render(<OutList />);

    await act(async () => {
      fireEvent.click(screen.getByText('Export CSV'));
    });

    expect(mockGenerateOutListReport).toHaveBeenCalled();
    expect(mockDownloadReport).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    useBaseOperationsStore.mockImplementation(() => ({
      outList: [],
      loadOutList: mockLoadOutList,
      loading: true
    }));

    render(<OutList />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows empty state when no out list entries', () => {
    useBaseOperationsStore.mockImplementation(() => ({
      outList: [],
      loadOutList: mockLoadOutList,
      loading: false
    }));

    render(<OutList />);

    expect(screen.getByText('No runners out')).toBeInTheDocument();
  });

  it('displays correct status badges', () => {
    render(<OutList />);

    expect(screen.getByText('VET OUT')).toHaveClass('bg-orange-100');
    // "DNF" appears in both the summary card label and the row badge
    const dnfElements = screen.getAllByText('DNF');
    const dnfBadge = dnfElements.find(el => el.classList.contains('bg-red-100'));
    expect(dnfBadge).toBeTruthy();
  });

  it('shows correct timestamps', () => {
    render(<OutList />);

    mockOutList.forEach(entry => {
      const time = entry.withdrawalDetails?.withdrawalTime || 
                   entry.vetOutDetails?.vetOutTime || 
                   entry.recordedTime;
      expect(screen.getByText(new Date(time).toLocaleString())).toBeInTheDocument();
    });
  });

  it('shows comments and notes', () => {
    render(<OutList />);

    expect(screen.getByText('Rider requested withdrawal')).toBeInTheDocument();
    expect(screen.getByText('Left front limb lameness')).toBeInTheDocument();
    expect(screen.getByText('Did not reach checkpoint in time')).toBeInTheDocument();
  });

  it('handles export errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGenerateOutListReport.mockRejectedValue(new Error('Export failed'));

    render(<OutList />);

    await act(async () => {
      fireEvent.click(screen.getByText('Export CSV'));
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to export out list:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('shows correct filtered count', () => {
    render(<OutList />);

    // Filter to dnf only
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'dnf' }
    });

    expect(screen.getByText('Showing 1 of 3 runners')).toBeInTheDocument();
  });

  it('maintains filter state across refreshes', async () => {
    render(<OutList />);

    // Set filter
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'dnf' }
    });

    // Refresh
    fireEvent.click(screen.getByTitle('Refresh list'));

    // Should still show only dnf runner
    expect(screen.getByText('101')).toBeInTheDocument();
    expect(screen.queryByText('102')).not.toBeInTheDocument();
    expect(screen.queryByText('103')).not.toBeInTheDocument();
  });

  it('disables export and print when no entries match filter', () => {
    render(<OutList />);

    // Search for non-existent runner
    fireEvent.change(screen.getByPlaceholderText(/Search by number/i), {
      target: { value: '999' }
    });

    expect(screen.getByText('Print')).toBeDisabled();
    expect(screen.getByText('Export CSV')).toBeDisabled();
  });

  it('shows appropriate status icons', () => {
    render(<OutList />);

    // Check for status icons
    expect(screen.getAllByRole('img', { hidden: true })).toHaveLength(3); // One icon per entry
  });

  it('updates when new out list entries are loaded', () => {
    const { rerender } = render(<OutList />);

    // Update store with new data
    const newOutList = [...mockOutList, {
      id: 4,
      number: 104,
      status: 'non-starter',
      notes: 'Did not start'
    }];

    useBaseOperationsStore.mockImplementation(() => ({
      outList: newOutList,
      loadOutList: mockLoadOutList,
      loading: false
    }));

    rerender(<OutList />);

    expect(screen.getByText('104')).toBeInTheDocument();
    expect(screen.getByText('Did not start')).toBeInTheDocument();
  });

  it('shows Undo DNS button for non-starter runners and calls undoDns on click', async () => {
    const mockUndoDns = vi.fn().mockResolvedValue();
    useBaseOperationsStore.mockImplementation(() => ({
      outList: [{ id: 3, number: 103, status: 'non-starter', recordedTime: null, notes: '' }],
      loadOutList: mockLoadOutList,
      generateOutListReport: mockGenerateOutListReport,
      downloadReport: mockDownloadReport,
      loading: false,
      undoDns: mockUndoDns,
    }));

    render(<OutList initialFilter="non-starter" />);

    const undoBtn = screen.getByRole('button', { name: /undo dns/i });
    expect(undoBtn).toBeInTheDocument();

    fireEvent.click(undoBtn);
    await waitFor(() => expect(mockUndoDns).toHaveBeenCalledWith(103));
  });

  it('does not show Undo DNS button for DNF runners', () => {
    useBaseOperationsStore.mockImplementation(() => ({
      outList: [{ id: 1, number: 101, status: 'dnf', withdrawalDetails: { withdrawalTime: '2024-01-01T10:00:00Z', reason: 'Injury', comments: '' } }],
      loadOutList: mockLoadOutList,
      generateOutListReport: mockGenerateOutListReport,
      downloadReport: mockDownloadReport,
      loading: false,
      undoDns: vi.fn(),
    }));

    render(<OutList initialFilter="dnf" />);
    expect(screen.queryByRole('button', { name: /undo dns/i })).not.toBeInTheDocument();
  });
});
