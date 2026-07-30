/**
 * Race Overview view — walkthrough fixes
 *
 * M-2 / #13 the race subtitle printed the raw stored date ("2026-03-04 • 08:00")
 * M-2 / #15 the "Race Created Successfully!" banner could not be dismissed
 * M-3 / #12 runner ranges expanded into a full inline list of every bib number
 * M-3 / #14 "Exit to Homepage" was an unremarkable secondary button
 * M-3 / #16 "Go to Checkpoint" did not navigate
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

const mockEndOperation = vi.fn();
const mockStartOperation = vi.fn();

vi.mock('shared/store/navigationStore', () => ({
  default: () => ({ endOperation: mockEndOperation, startOperation: mockStartOperation }),
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
  mockEndOperation.mockClear();
  mockStartOperation.mockClear();
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

describe('M-3 / #12: runner ranges display compactly', () => {
  beforeEach(resetMocks);

  it('shows a range as "min–max (count runners)" rather than every number', () => {
    render(<RaceOverview />);
    expect(screen.getByText('100–200 (101 runners)')).toBeInTheDocument();
  });

  it('does not expand a range into an inline list of bib numbers', () => {
    mockRace = {
      ...mockRace,
      runnerRanges: [{
        min: 1,
        max: 5,
        isIndividual: true,
        individualNumbers: [1, 2, 3, 4, 5],
      }],
    };
    render(<RaceOverview />);

    expect(screen.queryByText(/1, 2, 3, 4, 5/)).not.toBeInTheDocument();
    expect(screen.getByText('5 individual numbers')).toBeInTheDocument();
  });

  it('renders a plain string range as-is', () => {
    mockRace = { ...mockRace, runnerRanges: ['100-200'] };
    render(<RaceOverview />);
    expect(screen.getByText('100-200')).toBeInTheDocument();
  });

  it('falls back to the description when min/max are absent', () => {
    mockRace = { ...mockRace, runnerRanges: [{ description: 'Elite wave' }] };
    render(<RaceOverview />);
    expect(screen.getByText('Elite wave')).toBeInTheDocument();
  });

  it('counts a single-number range correctly', () => {
    mockRace = { ...mockRace, runnerRanges: [{ min: 42, max: 42 }] };
    render(<RaceOverview />);
    expect(screen.getByText('42–42 (1 runners)')).toBeInTheDocument();
  });
});

describe('M-3 / #14: "Exit to Homepage" is prominent', () => {
  beforeEach(resetMocks);

  it('renders with a visible outline border and a back arrow', () => {
    render(<RaceOverview />);

    const exit = screen.getByRole('button', { name: /exit to homepage/i });
    expect(exit.className).toContain('border');
    expect(exit.querySelector('svg')).toBeTruthy();
  });

  it('ends the operation and navigates home when clicked', () => {
    render(<RaceOverview />);

    fireEvent.click(screen.getByRole('button', { name: /exit to homepage/i }));

    expect(mockEndOperation).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});

describe('M-3 / #16: "Go to Checkpoint" navigates', () => {
  beforeEach(resetMocks);

  it('navigates to the checkpoint route', () => {
    render(<RaceOverview />);

    fireEvent.click(screen.getByRole('button', { name: /go to checkpoint/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/checkpoint/1');
  });

  it('releases the operation lock before navigating so ProtectedRoute allows it', () => {
    render(<RaceOverview />);

    fireEvent.click(screen.getByRole('button', { name: /go to checkpoint/i }));

    expect(mockEndOperation).toHaveBeenCalled();
  });

  it('does NOT pre-start the checkpoint operation — CheckpointView owns that', () => {
    render(<RaceOverview />);

    fireEvent.click(screen.getByRole('button', { name: /go to checkpoint/i }));

    // Starting it here left ProtectedRoute reading an intermediate state and
    // bounced the navigation; CheckpointView calls startOperation on mount.
    expect(mockStartOperation).not.toHaveBeenCalled();
  });

  it('still pre-starts the base station operation (BaseStationView does not)', () => {
    render(<RaceOverview />);

    fireEvent.click(screen.getByRole('button', { name: /go to base station|base station/i }));

    expect(mockStartOperation).toHaveBeenCalledWith('base_station');
    expect(mockNavigate).toHaveBeenCalledWith('/base-station/operations');
  });
});
