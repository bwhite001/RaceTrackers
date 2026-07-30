/**
 * M-2 / #2, #3: Race Management view navigation
 *
 * #2 The view was the only one rendering without the shared navy PageHeader,
 *    so it looked like a different application.
 * #3 "Back to Home" floated at the top-right of the page body instead of
 *    sitting in the header where every other view puts its exit action.
 *
 * Adopting PageHeader fixes both: the exit action moves into the header and the
 * floating button disappears from the page body.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('store/useRaceStore', () => ({
  useRaceStore: () => ({
    getAllRaces: vi.fn(() => Promise.resolve([])),
    deleteRace: vi.fn(),
    setSelectedRaceForMode: vi.fn(),
    loadRace: vi.fn(),
  }),
}));

vi.mock('shared/store/navigationStore', () => ({
  default: () => ({ endOperation: vi.fn() }),
  MODULE_TYPES: {
    CHECKPOINT: 'checkpoint',
    BASE_STATION: 'base_station',
    RACE_MAINTENANCE: 'race_maintenance',
  },
}));

vi.mock('shared/components/ui/Toast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('components/ImportExport/ImportExportModal', () => ({
  default: () => <div data-testid="import-export-modal" />,
}));

import RaceManagementView from 'views/RaceManagementView';

describe('M-2 / #2: Race Management uses the shared PageHeader', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('renders a banner-role header', async () => {
    render(<RaceManagementView />);
    expect(await screen.findByRole('banner')).toBeInTheDocument();
  });

  it('shows the view title inside the header', async () => {
    render(<RaceManagementView />);
    const header = await screen.findByRole('banner');
    expect(header.textContent).toContain('Race Management');
  });
});

describe('M-2 / #3: "Back to Home" lives in the header', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('exposes the exit action inside the header, not the page body', async () => {
    render(<RaceManagementView />);

    const exit = await screen.findByRole('button', { name: /exit operation|back to home/i });
    expect(screen.getByRole('banner').contains(exit)).toBe(true);
  });

  it('no longer renders a floating "Back to Home" button in the page body', async () => {
    render(<RaceManagementView />);

    const header = await screen.findByRole('banner');
    const strays = screen
      .queryAllByRole('button', { name: /back to home/i })
      .filter(btn => !header.contains(btn));
    expect(strays).toHaveLength(0);
  });

  it('navigates home when the header exit action is used', async () => {
    render(<RaceManagementView />);

    fireEvent.click(await screen.findByRole('button', { name: /exit operation|back to home/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('still offers the Create New Race and Import Race actions', async () => {
    render(<RaceManagementView />);

    await screen.findByRole('banner');
    // Appears twice with an empty race list: action bar + empty-state CTA
    expect(screen.getAllByRole('button', { name: /create new race/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /import race/i })).toBeInTheDocument();
  });
});
