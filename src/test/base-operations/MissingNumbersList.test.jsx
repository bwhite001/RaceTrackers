import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import MissingNumbersList from '../../modules/base-operations/components/MissingNumbersList';
import useBaseOperationsStore from '../../modules/base-operations/store/baseOperationsStore';

// Mock the store
vi.mock('../../modules/base-operations/store/baseOperationsStore');

describe('MissingNumbersList', () => {
  const mockLoadMissingRunners = vi.fn();
  const mockGenerateMissingNumbersReport = vi.fn();
  const mockDownloadReport = vi.fn();

  const mockMissingRunners = [
    { number: 101 },
    { number: 102 },
    { number: 103 },
    { number: 105 },
    { number: 106 },
    { number: 107 },
    { number: 110 }
  ];

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock store implementation
    useBaseOperationsStore.mockImplementation(() => ({
      missingRunners: mockMissingRunners,
      loadMissingRunners: mockLoadMissingRunners,
      generateMissingNumbersReport: mockGenerateMissingNumbersReport,
      downloadReport: mockDownloadReport,
      loading: false
    }));
  });

  it('renders correctly with initial checkpoint', () => {
    render(<MissingNumbersList checkpoint={2} />);

    expect(screen.getByText('Missing Numbers')).toBeInTheDocument();
    expect(screen.getByText(/Runners who haven't checked in at checkpoint 2/i)).toBeInTheDocument();
    expect(mockLoadMissingRunners).toHaveBeenCalledWith(2);
  });

  it('loads missing runners on mount', () => {
    render(<MissingNumbersList />);
    expect(mockLoadMissingRunners).toHaveBeenCalledWith(1); // Default checkpoint
  });

  it('reloads when checkpoint changes', () => {
    render(<MissingNumbersList />);
    
    // Change checkpoint
    fireEvent.change(screen.getByLabelText(/Checkpoint:/i), {
      target: { value: '3' }
    });

    expect(mockLoadMissingRunners).toHaveBeenCalledWith(3);
  });

  it('formats runner numbers into compact ranges', () => {
    render(<MissingNumbersList />);

    // Should show "101-103, 105-107, 110"
    expect(screen.getByText('101-103, 105-107, 110')).toBeInTheDocument();
  });

  it('shows individual numbers grid', () => {
    render(<MissingNumbersList />);

    mockMissingRunners.forEach(runner => {
      expect(screen.getByText(runner.number.toString())).toBeInTheDocument();
    });
  });

  it('handles refresh button click', () => {
    render(<MissingNumbersList />);

    fireEvent.click(screen.getByTitle('Refresh list'));
    expect(mockLoadMissingRunners).toHaveBeenCalledTimes(2); // Once on mount, once on click
  });

  it('handles print button click', () => {
    const mockPrint = vi.fn();
    window.print = mockPrint;

    render(<MissingNumbersList />);

    fireEvent.click(screen.getByText('Print'));
    expect(mockPrint).toHaveBeenCalled();
  });

  it('handles export button click', async () => {
    render(<MissingNumbersList />);

    await act(async () => {
      fireEvent.click(screen.getByText('Export'));
    });

    expect(mockGenerateMissingNumbersReport).toHaveBeenCalled();
    expect(mockDownloadReport).toHaveBeenCalled();
  });

  it('handles auto-refresh toggle', () => {
    vi.useFakeTimers();

    render(<MissingNumbersList />);

    // Enable auto-refresh
    fireEvent.click(screen.getByLabelText(/Auto-refresh every 30 seconds/i));

    // Fast-forward 30 seconds
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(mockLoadMissingRunners).toHaveBeenCalledTimes(2); // Once on mount, once after timer

    // Disable auto-refresh
    fireEvent.click(screen.getByLabelText(/Auto-refresh every 30 seconds/i));

    // Fast-forward another 30 seconds
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    // Should not have called loadMissingRunners again
    expect(mockLoadMissingRunners).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('shows loading state', () => {
    useBaseOperationsStore.mockImplementation(() => ({
      missingRunners: [],
      loadMissingRunners: mockLoadMissingRunners,
      loading: true
    }));

    render(<MissingNumbersList />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows empty state when no missing runners', () => {
    useBaseOperationsStore.mockImplementation(() => ({
      missingRunners: [],
      loadMissingRunners: mockLoadMissingRunners,
      loading: false
    }));

    render(<MissingNumbersList />);

    expect(screen.getByText('All Runners Accounted For!')).toBeInTheDocument();
  });

  it('disables export and print buttons when no missing runners', () => {
    useBaseOperationsStore.mockImplementation(() => ({
      missingRunners: [],
      loadMissingRunners: mockLoadMissingRunners,
      loading: false
    }));

    render(<MissingNumbersList />);

    expect(screen.getByText('Print')).toBeDisabled();
    expect(screen.getByText('Export')).toBeDisabled();
  });

  it('handles export errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGenerateMissingNumbersReport.mockRejectedValue(new Error('Export failed'));

    render(<MissingNumbersList />);

    await act(async () => {
      fireEvent.click(screen.getByText('Export'));
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to export missing numbers:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('cleans up auto-refresh on unmount', () => {
    vi.useFakeTimers();

    const { unmount } = render(<MissingNumbersList />);

    // Enable auto-refresh
    fireEvent.click(screen.getByLabelText(/Auto-refresh every 30 seconds/i));

    unmount();

    // Fast-forward 30 seconds
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    // Should not have called loadMissingRunners after unmount
    expect(mockLoadMissingRunners).toHaveBeenCalledTimes(1); // Only the initial load

    vi.useRealTimers();
  });

  it('shows correct total count', () => {
    render(<MissingNumbersList />);

    expect(screen.getByText('7')).toBeInTheDocument(); // Total missing runners
  });

  it('updates when new missing runners are loaded', async () => {
    const { rerender } = render(<MissingNumbersList />);

    // Update store with new data
    useBaseOperationsStore.mockImplementation(() => ({
      missingRunners: [...mockMissingRunners, { number: 111 }],
      loadMissingRunners: mockLoadMissingRunners,
      loading: false
    }));

    rerender(<MissingNumbersList />);

    expect(screen.getByText('8')).toBeInTheDocument(); // Updated total
    expect(screen.getByText('111')).toBeInTheDocument(); // New runner number
  });

  it('maintains auto-refresh state across re-renders', () => {
    vi.useFakeTimers();

    const { rerender } = render(<MissingNumbersList />);

    // Enable auto-refresh
    fireEvent.click(screen.getByLabelText(/Auto-refresh every 30 seconds/i));

    // Re-render with new props
    rerender(<MissingNumbersList checkpoint={2} />);

    // Fast-forward 30 seconds
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    // Should still be auto-refreshing
    expect(mockLoadMissingRunners).toHaveBeenCalledWith(2);

    vi.useRealTimers();
  });
});
