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
    total: 3,
    finished: 1,
    active: 1,
    dnf: 1,
    dns: 0
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useBaseOperationsStore.mockImplementation(() => ({ stats: mockStats }));
  });

  test('renders stats cards', () => {
    render(<RaceOverview />);
    Object.entries(mockStats).forEach(([key, value]) => {
      const card = screen.getByTestId(`stat-${key}`);
      expect(within(card).getByText(value.toString())).toBeInTheDocument();
    });
  });

  test('shows correct stat labels', () => {
    render(<RaceOverview />);
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Finished')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('DNF')).toBeInTheDocument();
    expect(screen.getByText('DNS')).toBeInTheDocument();
  });

  test('re-renders when stats change', () => {
    const { rerender } = render(<RaceOverview />);
    expect(within(screen.getByTestId('stat-total')).getByText('3')).toBeInTheDocument();

    useBaseOperationsStore.mockImplementation(() => ({ stats: { ...mockStats, total: 5 } }));
    rerender(<RaceOverview />);
    expect(within(screen.getByTestId('stat-total')).getByText('5')).toBeInTheDocument();
  });
});
