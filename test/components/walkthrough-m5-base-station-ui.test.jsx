/**
 * M-5: Base Station presentation fixes
 *
 * #35 The Base Station module badge was emerald, so it read as a status
 *     ("all good") rather than as a module identifier; Checkpoint used blue.
 * #40 Session history batch cards showed two unlabelled times side by side —
 *     the radio common time and the data-entry time were indistinguishable.
 * #43 The base station overview table used py-4 rows.
 * #62 The Checkpoint Matrix empty state was a bare sentence with no icon.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RUNNER_STATUSES } from 'types';
import PageHeader from 'shared/components/PageHeader';
import { MODULE_TYPES } from 'shared/store/navigationStore';
import BatchCard from 'modules/base-operations/components/BatchCard';

describe('M-5 / #35: Base Station module badge matches Checkpoint', () => {
  const badgeFor = (moduleType) => {
    const { container, unmount } = render(
      <PageHeader variant="operational" title="Race" moduleType={moduleType} onExit={vi.fn()} />
    );
    const badge = screen.getByText(moduleType === MODULE_TYPES.CHECKPOINT ? 'Checkpoint' : 'Base Station');
    const className = badge.className;
    unmount();
    return className;
  };

  it('is no longer emerald', () => {
    expect(badgeFor(MODULE_TYPES.BASE_STATION)).not.toContain('emerald');
  });

  it('uses the same colour family as the Checkpoint badge', () => {
    const base = badgeFor(MODULE_TYPES.BASE_STATION);
    const checkpoint = badgeFor(MODULE_TYPES.CHECKPOINT);
    expect(base).toContain('blue');
    expect(checkpoint).toContain('blue');
  });
});

describe('M-5 / #40: session history times are labelled', () => {
  const batch = {
    id: 'batch-1',
    checkpointNumber: 1,
    commonTime: '09:05',
    bibs: [1, 2],
    submittedAt: '2026-03-04T09:07:00.000Z',
    voided: false,
  };

  const renderCard = () => render(
    <BatchCard batch={batch} checkpointName="Ridgeline" isHighlighted={false} onVoid={vi.fn()} />
  );

  it('labels the radio common time', () => {
    renderCard();
    expect(screen.getByText('Common:')).toBeInTheDocument();
  });

  it('labels the data-entry time', () => {
    renderCard();
    expect(screen.getByText('Recorded:')).toBeInTheDocument();
  });

  it('still shows the common time value', () => {
    renderCard();
    expect(screen.getByText(/09:05/)).toBeInTheDocument();
  });

  it('no longer uses the bare "entered" prefix', () => {
    renderCard();
    expect(screen.queryByText(/^entered /)).not.toBeInTheDocument();
  });
});

describe('M-5 / #43: base station overview rows are compact', () => {
  beforeEach(() => vi.resetModules());

  it('uses py-2 rather than py-4', async () => {
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

    const cells = [...document.querySelectorAll('tbody td')];
    expect(cells.length).toBeGreaterThan(0);
    cells.forEach(td => {
      expect(td.className).not.toContain('py-4');
    });
  });
});

describe('M-5 / #60, #62: Checkpoint Matrix empty state', () => {
  beforeEach(() => vi.resetModules());

  it('shows a centred block with an icon and actionable guidance', async () => {
    vi.doMock('modules/base-operations/store/baseOperationsStore', () => ({
      default: () => ({ currentRaceId: null }),
    }));

    const { default: CheckpointGroupingView } = await import('modules/base-operations/components/CheckpointGroupingView');
    render(<CheckpointGroupingView />);

    expect(await screen.findByText('No checkpoint data yet')).toBeInTheDocument();
    // #62: an icon accompanies the message
    expect(document.querySelector('svg')).toBeTruthy();
    // #60: guidance points at a panel that exists on this tab
    expect(screen.getByText(/Import Checkpoint Results panel on this tab/)).toBeInTheDocument();
  });

  it('no longer claims the panel is "above"', async () => {
    vi.doMock('modules/base-operations/store/baseOperationsStore', () => ({
      default: () => ({ currentRaceId: null }),
    }));

    const { default: CheckpointGroupingView } = await import('modules/base-operations/components/CheckpointGroupingView');
    render(<CheckpointGroupingView />);

    await screen.findByText('No checkpoint data yet');
    expect(screen.queryByText(/panel above/)).not.toBeInTheDocument();
  });
});
