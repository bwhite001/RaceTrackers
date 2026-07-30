/**
 * CC-4: Zero-Count Colour Suppression
 *
 * Issues #31, #37
 *
 * Alert colours read as "something is wrong". Both the Checkpoint Overview
 * "NS + DNF" tile (#31) and the Base Station "DNF/DNS" status figure (#37)
 * were permanently red, so a clean race looked like a race full of problems.
 * The alert colour must only appear once the count is actually above zero.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RUNNER_STATUSES } from 'types';

/**
 * The value node sits next to the label node inside the same tile/row.
 * Labels like "Passed" also appear in filter dropdowns, so scan every match
 * and take the one that actually has a numeric sibling (i.e. the stat tile).
 */
const valueNodeFor = (labelText) => {
  for (const label of screen.getAllByText(labelText)) {
    const siblings = [...(label.parentElement?.children ?? [])].filter(n => n !== label);
    const value = siblings.find(n => /^\d+$/.test(n.textContent.trim()));
    if (value) return value;
  }
  throw new Error(`No stat tile found for label "${labelText}"`);
};

describe('CC-4 / #31: Checkpoint Overview "NS + DNF" tile', () => {
  beforeEach(() => vi.resetModules());

  const mockRaceStore = (counts) => {
    vi.doMock('store/useRaceStore', () => ({
      useRaceStore: () => ({
        runners: [],
        markRunnerStatus: vi.fn(),
        getRunnerCounts: () => counts,
        isSegmentCalled: () => false,
        mode: 'checkpoint',
        raceConfig: { id: 1, minRunner: 1, maxRunner: 10 },
        isLoading: false,
      }),
    }));
  };

  const ZERO = { total: 10, passed: 0, notStarted: 10, nonStarter: 0, dnf: 0 };
  const NONZERO = { total: 10, passed: 5, notStarted: 3, nonStarter: 1, dnf: 1 };

  it('uses a neutral colour when NS + DNF is zero', async () => {
    mockRaceStore(ZERO);
    const { default: RunnerOverview } = await import('../../src/components/Shared/RunnerOverview');
    render(<RunnerOverview />);

    const value = valueNodeFor('NS + DNF');
    expect(value.textContent.trim()).toBe('0');
    expect(value.className).not.toContain('text-red');
    expect(value.className).toContain('text-gray');
  });

  it('uses the red alert colour when NS + DNF is above zero', async () => {
    mockRaceStore(NONZERO);
    const { default: RunnerOverview } = await import('../../src/components/Shared/RunnerOverview');
    render(<RunnerOverview />);

    const value = valueNodeFor('NS + DNF');
    expect(value.textContent.trim()).toBe('2');
    expect(value.className).toContain('text-red');
  });

  it('leaves the non-alert tiles untouched', async () => {
    mockRaceStore(ZERO);
    const { default: RunnerOverview } = await import('../../src/components/Shared/RunnerOverview');
    render(<RunnerOverview />);

    // "Passed" stays green regardless — it is not an alert colour
    expect(valueNodeFor('Passed').className).toContain('text-green');
  });
});

describe('CC-4 / #37: Base Station "DNF/DNS" figure', () => {
  beforeEach(() => vi.resetModules());

  const mockBaseStore = (stats) => {
    vi.doMock('modules/base-operations/store/baseOperationsStore', () => ({
      default: () => ({
        stats,
        runners: [],
        loading: false,
        error: null,
        bulkMarkRunners: vi.fn(),
        markAsFinished: vi.fn(),
        markAsDNF: vi.fn(),
        currentRaceId: 1,
        currentRace: { minRunner: 1, maxRunner: 10 },
      }),
    }));
  };

  it('uses a neutral colour when DNF/DNS is zero', async () => {
    mockBaseStore({ total: 10, finished: 0, active: 10, dnf: 0, dns: 0 });
    const { default: DataEntry } = await import('modules/base-operations/components/DataEntry');
    render(<DataEntry />);

    const value = valueNodeFor('DNF/DNS:');
    expect(value.textContent.trim()).toBe('0');
    expect(value.className).not.toContain('text-red');
    expect(value.className).toContain('text-gray');
  });

  it('uses the red alert colour when DNF/DNS is above zero', async () => {
    mockBaseStore({ total: 10, finished: 5, active: 3, dnf: 1, dns: 1 });
    const { default: DataEntry } = await import('modules/base-operations/components/DataEntry');
    render(<DataEntry />);

    const value = valueNodeFor('DNF/DNS:');
    expect(value.textContent.trim()).toBe('2');
    expect(value.className).toContain('text-red');
  });
});
