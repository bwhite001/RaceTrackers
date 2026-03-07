import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import RaceOverview from '../../src/modules/base-operations/components/RaceOverview';
import useBaseOperationsStore from '../../src/modules/base-operations/store/baseOperationsStore';

// Mock the store
vi.mock('../../src/modules/base-operations/store/baseOperationsStore');

// Mock LiveLeadersBanner (self-contained, tested separately)
vi.mock('../../src/modules/base-operations/components/Leaderboard/LiveLeadersBanner', () => ({
  default: () => null,
}));

describe('RaceOverview', () => {
  const mockStats = {
    notStarted: 0,
    total: 3,
    finished: 1,
    active: 1,
    dnf: 1,
    dns: 0,
    checkpointCounts: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useBaseOperationsStore.mockImplementation(() => ({ stats: mockStats, checkpoints: [] }));
  });

  test('renders stats cards', () => {
    render(<RaceOverview />);
    expect(within(screen.getByTestId('stat-total')).getByText('3')).toBeInTheDocument();
    expect(within(screen.getByTestId('stat-finished')).getByText('1')).toBeInTheDocument();
    expect(within(screen.getByTestId('stat-active')).getByText('1')).toBeInTheDocument();
    expect(within(screen.getByTestId('stat-dnf')).getByText('1')).toBeInTheDocument();
  });

  test('shows correct stat labels', () => {
    render(<RaceOverview />);
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Not Started')).toBeInTheDocument();
    expect(screen.getByText('Finished')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('DNF')).toBeInTheDocument();
    expect(screen.getByText('DNS')).toBeInTheDocument();
  });

  test('re-renders when stats change', () => {
    const { rerender } = render(<RaceOverview />);
    expect(within(screen.getByTestId('stat-total')).getByText('3')).toBeInTheDocument();

    useBaseOperationsStore.mockImplementation(() => ({ stats: { ...mockStats, total: 5 }, checkpoints: [] }));
    rerender(<RaceOverview />);
    expect(within(screen.getByTestId('stat-total')).getByText('5')).toBeInTheDocument();
  });

  test('renders per-checkpoint counts when checkpoints configured', () => {
    useBaseOperationsStore.mockImplementation(() => ({
      stats: { ...mockStats, checkpointCounts: { 1: 2, 2: 1 } },
      checkpoints: [{ number: 1, name: 'CP 1' }, { number: 2, name: 'CP 2' }],
    }));
    render(<RaceOverview />);
    expect(screen.getByTestId('cp-count-1')).toBeInTheDocument();
    expect(screen.getByTestId('cp-count-2')).toBeInTheDocument();
  });
});
