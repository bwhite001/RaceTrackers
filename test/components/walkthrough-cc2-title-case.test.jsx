/**
 * CC-2: ALL CAPS → Title Case
 *
 * Issues #36, #41, #57
 *
 * Table headers and section headings used the Tailwind `uppercase` class, which
 * renders labels as ALL CAPS. The visible text is already title case, so the
 * fix is to drop `uppercase` (keeping the letter-spacing) everywhere the
 * walkthrough flagged it:
 *   #57 Leaderboard        — both the finisher table and the DNF table
 *   #41 RaceOverview       — stat tile labels and the runners table
 *   #36 BatchEntryLayout   — the "Session History" heading
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RUNNER_STATUSES } from 'types';

const expectNoUppercaseClass = (nodes) => {
  expect(nodes.length).toBeGreaterThan(0);
  nodes.forEach(node => {
    expect(node.className).not.toContain('uppercase');
  });
};

describe('CC-2 / #57: Leaderboard headers are title case', () => {
  it('finisher table headers have no uppercase class', async () => {
    const { default: Leaderboard } = await import('modules/base-operations/components/Leaderboard');
    render(<Leaderboard runners={[
      { number: 1, commonTime: '2026-03-04T10:00:00.000Z', status: RUNNER_STATUSES.FINISHED },
    ]} />);
    expectNoUppercaseClass([...document.querySelectorAll('th')]);
  });

  it('DNF table headers also have no uppercase class', async () => {
    const { default: Leaderboard } = await import('modules/base-operations/components/Leaderboard');
    render(<Leaderboard runners={[
      { number: 1, commonTime: '2026-03-04T10:00:00.000Z', status: RUNNER_STATUSES.FINISHED },
      { number: 2, status: RUNNER_STATUSES.DNF },
    ]} />);
    // DNF section renders only when a DNF runner exists — assert it is present
    expect(screen.getByText(/Did Not Finish/)).toBeInTheDocument();
    expectNoUppercaseClass([...document.querySelectorAll('th')]);
  });

  it('renders headers in title case, not ALL CAPS text', async () => {
    const { default: Leaderboard } = await import('modules/base-operations/components/Leaderboard');
    render(<Leaderboard runners={[
      { number: 1, commonTime: '2026-03-04T10:00:00.000Z', status: RUNNER_STATUSES.FINISHED },
    ]} />);
    expect(screen.getByText('Position')).toBeInTheDocument();
    expect(screen.getByText('Bib #')).toBeInTheDocument();
    expect(screen.queryByText('POSITION')).not.toBeInTheDocument();
  });
});

describe('CC-2 / #41: base station RaceOverview is title case', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('stat tile labels and table headers have no uppercase class', async () => {
    vi.doMock('modules/base-operations/store/baseOperationsStore', () => ({
      default: () => ({
        runners: [{ number: 1, checkpointNumber: 0, status: RUNNER_STATUSES.FINISHED, commonTime: null, notes: '' }],
        stats: { total: 10, finished: 1, active: 0, dnf: 0, dns: 0 },
        sortOrder: 'number',
        setSortOrder: vi.fn(),
        filterStatus: 'all',
        setFilterStatus: vi.fn(),
        searchQuery: '',
        setSearchQuery: vi.fn(),
      }),
    }));

    const { default: RaceOverview } = await import('modules/base-operations/components/RaceOverview');
    render(<RaceOverview />);

    expectNoUppercaseClass([...document.querySelectorAll('th')]);
    // Stat tile labels ("Total", "Finished", ...) must not be uppercased either
    const statTiles = [...document.querySelectorAll('[data-testid^="stat-"] div')];
    expectNoUppercaseClass(statTiles);
  });
});

describe('CC-2 / #36: "Session History" heading is title case', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('heading text is title case with no uppercase class', async () => {
    vi.doMock('modules/base-operations/store/baseOperationsStore', () => ({
      default: () => ({
        runners: [],
        sessionBatches: [],
        submitRadioBatch: vi.fn(),
        voidSessionBatch: vi.fn(),
        loading: false,
      }),
    }));
    vi.doMock('store/useRaceStore', () => ({
      useRaceStore: () => ({ checkpoints: [], runners: [] }),
    }));

    const { default: BatchEntryLayout } = await import('modules/base-operations/components/BatchEntryLayout');
    render(<BatchEntryLayout />);

    const heading = screen.getByRole('heading', { name: 'Session History' });
    expect(heading).toBeInTheDocument();
    expect(heading.className).not.toContain('uppercase');
    expect(screen.queryByText('SESSION HISTORY')).not.toBeInTheDocument();
  });
});
