import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RaceOverview from '../../src/components/BaseStation/RaceOverview';
import useBaseOperationsStore from '../../src/modules/base-operations/store/baseOperationsStore';
import { RUNNER_STATUSES, STATUS_LABELS } from '../../src/types';

// Mock the store
vi.mock('../../src/modules/base-operations/store/baseOperationsStore');

// Mock device detection hook as a configurable vi.fn
vi.mock('../../src/shared/hooks/useDeviceDetection', () => ({
  default: vi.fn(() => ({ isDesktop: true }))
}));

import useDeviceDetection from '../../src/shared/hooks/useDeviceDetection';

describe('RaceOverview', () => {
  const mockRunners = [
    {
      number: 1,
      status: RUNNER_STATUSES.FINISHED,
      finishTime: '2023-01-01T12:00:00Z',
      notes: 'Test note 1'
    },
    {
      number: 2,
      status: RUNNER_STATUSES.ACTIVE,
      finishTime: null,
      notes: 'Test note 2'
    },
    {
      number: 3,
      status: RUNNER_STATUSES.DNF,
      finishTime: null,
      notes: 'Test note 3'
    }
  ];

  const mockStats = {
    total: 3,
    finished: 1,
    active: 1,
    dnf: 1,
    dns: 0
  };

  const mockStore = {
    runners: mockRunners,
    stats: mockStats,
    sortOrder: 'number',
    setSortOrder: vi.fn(),
    filterStatus: 'all',
    setFilterStatus: vi.fn(),
    searchQuery: '',
    setSearchQuery: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useBaseOperationsStore.mockImplementation(() => mockStore);
    useDeviceDetection.mockReturnValue({ isDesktop: true });
  });

  test('renders all components correctly', () => {
    render(<RaceOverview />);

    // Check search input
    expect(screen.getByPlaceholderText(/Search runner numbers or notes/i)).toBeInTheDocument();

    // Check filters
    expect(screen.getByRole('combobox', { name: /filter/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /sort/i })).toBeInTheDocument();

    // Check stats — use data-testid to scope each stat card lookup
    Object.entries(mockStats).forEach(([key, value]) => {
      const statCard = screen.getByTestId(`stat-${key}`);
      expect(within(statCard).getByText(value.toString())).toBeInTheDocument();
    });

    // Check table headers
    expect(screen.getByText('Runner')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
  });

  test('displays runners in table', () => {
    render(<RaceOverview />);

    const table = screen.getByRole('table');
    mockRunners.forEach(runner => {
      // Scope to table to avoid conflicts with stats section values
      const row = within(table).getByText(runner.number.toString()).closest('tr');
      expect(within(row).getByText(STATUS_LABELS[runner.status])).toBeInTheDocument();
      expect(within(row).getByText(runner.notes)).toBeInTheDocument();
      if (runner.finishTime) {
        expect(within(row).getByText(runner.finishTime)).toBeInTheDocument();
      }
    });
  });

  test('handles search filtering', async () => {
    render(<RaceOverview />);

    const searchInput = screen.getByPlaceholderText(/Search runner numbers or notes/i);
    await userEvent.type(searchInput, '1');

    expect(mockStore.setSearchQuery).toHaveBeenCalledWith('1');
  });

  test('handles status filtering', () => {
    render(<RaceOverview />);

    const filterSelect = screen.getByRole('combobox', { name: /filter/i });
    fireEvent.change(filterSelect, { target: { value: 'finished' } });

    expect(mockStore.setFilterStatus).toHaveBeenCalledWith('finished');
  });

  test('handles sorting', () => {
    render(<RaceOverview />);

    const sortSelect = screen.getByRole('combobox', { name: /sort/i });
    fireEvent.change(sortSelect, { target: { value: 'status' } });

    expect(mockStore.setSortOrder).toHaveBeenCalledWith('status');
  });

  test('handles runner selection', () => {
    render(<RaceOverview />);

    const table = screen.getByRole('table');
    const firstRunner = within(table).getByText('1').closest('tr');
    fireEvent.click(firstRunner);

    // Check selected state
    expect(firstRunner).toHaveClass('bg-blue-50');

    // Click again to deselect
    fireEvent.click(firstRunner);
    expect(firstRunner).not.toHaveClass('bg-blue-50');
  });

  test('displays no results message when filtered runners is empty', () => {
    useBaseOperationsStore.mockImplementation(() => ({
      ...mockStore,
      runners: []
    }));

    render(<RaceOverview />);

    expect(screen.getByText(/No runners found matching your criteria/i)).toBeInTheDocument();
  });

  test('applies correct status colors', () => {
    render(<RaceOverview />);

    const table = screen.getByRole('table');
    mockRunners.forEach(runner => {
      // Scope to table rows to avoid conflicts with stats section labels
      const row = within(table).getByText(runner.number.toString()).closest('tr');
      const statusBadge = within(row).getByText(STATUS_LABELS[runner.status]);
      
      switch (runner.status) {
        case RUNNER_STATUSES.FINISHED:
          expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800');
          break;
        case RUNNER_STATUSES.ACTIVE:
          expect(statusBadge).toHaveClass('bg-blue-100', 'text-blue-800');
          break;
        case RUNNER_STATUSES.DNF:
          expect(statusBadge).toHaveClass('bg-red-100', 'text-red-800');
          break;
      }
    });
  });

  test('handles mobile layout', () => {
    // Mock mobile device for this test only
    useDeviceDetection.mockReturnValueOnce({ isDesktop: false });

    render(<RaceOverview />);

    // Notes column should not be visible
    expect(screen.queryByText('Notes')).not.toBeInTheDocument();
  });

  test('is accessible', () => {
    render(<RaceOverview />);

    // Check table accessibility
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(4); // Runner, Status, Time, Notes
    expect(screen.getAllByRole('row')).toHaveLength(4); // Header + 3 runners

    // Check filter accessibility
    expect(screen.getByRole('combobox', { name: /filter/i })).toHaveAttribute('aria-label');
    expect(screen.getByRole('combobox', { name: /sort/i })).toHaveAttribute('aria-label');

    // Check search accessibility
    expect(screen.getByRole('searchbox')).toHaveAttribute('placeholder');
  });

  test('memoizes correctly', () => {
    const { rerender } = render(<RaceOverview />);
    
    // First render
    const firstRender = screen.getByRole('table').innerHTML;

    // Rerender with same data
    rerender(<RaceOverview />);
    const secondRender = screen.getByRole('table').innerHTML;

    // Should be exactly the same DOM
    expect(firstRender).toBe(secondRender);

    // Update store data
    useBaseOperationsStore.mockImplementation(() => ({
      ...mockStore,
      runners: [...mockRunners, { number: 4, status: RUNNER_STATUSES.ACTIVE }]
    }));

    // Rerender with different data
    rerender(<RaceOverview />);
    const thirdRender = screen.getByRole('table').innerHTML;

    // Should be different DOM
    expect(thirdRender).not.toBe(secondRender);
  });
});
