/**
 * Race Overview view — walkthrough fixes
 *
 * M-2 / #13 the race subtitle printed the raw stored date ("2026-03-04 • 08:00")
 * M-2 / #15 the "Race Created Successfully!" banner could not be dismissed
 *
 * (M-3 issues #12, #14 and #16 are added to this file by task M-3.)
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockNavigate = vi.fn();
let mockSearchParams = new URLSearchParams('');
let mockRace = {
  id: 1,
  name: 'Autumn Trail 50',
  date: '2026-03-04',
  startTime: '08:00',
  runnerRanges: [{ min: 100, max: 200 }],
};

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams],
}));

vi.mock('modules/race-maintenance/store/raceMaintenanceStore', () => ({
  default: () => ({
    currentRace: mockRace,
    checkpoints: [{ number: 1, name: 'Ridgeline' }],
    loadRace: vi.fn(),
    loadCurrentRace: vi.fn(),
    loading: false,
  }),
}));

vi.mock('shared/store/navigationStore', () => ({
  default: () => ({ endOperation: vi.fn(), startOperation: vi.fn() }),
  MODULE_TYPES: {
    CHECKPOINT: 'checkpoint',
    BASE_STATION: 'base_station',
    RACE_MAINTENANCE: 'race_maintenance',
  },
}));

vi.mock('store/useRaceStore', () => ({
  useRaceStore: () => ({
    runners: [],
    getRunnerCounts: () => ({ total: 101, passed: 0, notStarted: 101, nonStarter: 0, dnf: 0 }),
    // RaceOverview chains .catch() on this — must return a promise
    loadRace: vi.fn(() => Promise.resolve()),
  }),
}));

vi.mock('components/Shared/RunnerOverview.jsx', () => ({
  default: () => <div data-testid="runner-overview" />,
}));
vi.mock('modules/race-maintenance/components/RosterImport.jsx', () => ({
  default: () => <div data-testid="roster-import" />,
}));
vi.mock('modules/race-maintenance/components/DistributeRaceModal.jsx', () => ({
  default: () => <div data-testid="distribute-modal" />,
}));

import RaceOverview from 'views/RaceOverview';

const resetMocks = () => {
  mockNavigate.mockClear();
  mockSearchParams = new URLSearchParams('');
  mockRace = {
    id: 1,
    name: 'Autumn Trail 50',
    date: '2026-03-04',
    startTime: '08:00',
    runnerRanges: [{ min: 100, max: 200 }],
  };
};

describe('M-2 / #13: race subtitle uses the locale date format', () => {
  beforeEach(resetMocks);

  it('shows DD/MM/YYYY with a 12-hour start time', () => {
    render(<RaceOverview />);
    expect(screen.getByText('04/03/2026 • 8:00 AM')).toBeInTheDocument();
  });

  it('never shows the raw stored date string', () => {
    render(<RaceOverview />);
    expect(screen.queryByText(/2026-03-04/)).not.toBeInTheDocument();
  });

  it('shows just the date when no start time is configured', () => {
    mockRace = { ...mockRace, startTime: null };
    render(<RaceOverview />);
    expect(screen.getByText('04/03/2026')).toBeInTheDocument();
  });
});

describe('M-2 / #15: "Race Created Successfully!" banner is dismissible', () => {
  beforeEach(resetMocks);

  const renderWithBanner = () => {
    mockSearchParams = new URLSearchParams('raceId=1');
    render(<RaceOverview />);
  };

  it('shows the banner when arriving from race creation', () => {
    renderWithBanner();
    expect(screen.getByText('Race Created Successfully!')).toBeInTheDocument();
  });

  it('offers a labelled dismiss control', () => {
    renderWithBanner();
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
  });

  it('removes the banner when dismissed', () => {
    renderWithBanner();

    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));

    expect(screen.queryByText('Race Created Successfully!')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument();
  });

  it('does not show the banner on a normal visit (no raceId)', () => {
    render(<RaceOverview />);
    expect(screen.queryByText('Race Created Successfully!')).not.toBeInTheDocument();
  });

  it('keeps the rest of the page after dismissing', () => {
    renderWithBanner();
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));

    expect(screen.getByText('Autumn Trail 50')).toBeInTheDocument();
    expect(screen.getByText('Select Operation Mode')).toBeInTheDocument();
  });
});
