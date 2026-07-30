/**
 * M-4: Runner groups — issues #21, #22
 *
 * #21 A range that does not divide evenly by the group size left a trailing
 *     group holding a single number ("Runners 200-200", 0/1), which reads as a
 *     bug rather than a group.
 * #22 Every group started collapsed, so the grid opened showing only headers —
 *     the first group should already be open.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RUNNER_STATUSES } from 'types';

const makeRunners = (min, max) =>
  Array.from({ length: max - min + 1 }, (_, i) => ({
    number: min + i,
    status: RUNNER_STATUSES.NOT_STARTED,
    recordedTime: null,
  }));

const renderGrid = (props = {}) => {
  const {
    minRunner = 100,
    maxRunner = 200,
    groupSize = 50,
  } = props;

  return render(
    <SharedRunnerGrid
      runners={makeRunners(minRunner, maxRunner)}
      raceConfig={{ id: 1, minRunner, maxRunner }}
      settings={{ groupSize }}
      onMarkRunner={vi.fn()}
      onUnmarkRunner={vi.fn()}
      onUpdateTime={vi.fn()}
      isLoading={false}
    />
  );
};

import SharedRunnerGrid from '../../src/components/Shared/SharedRunnerGrid';

const groupHeadings = () =>
  screen.getAllByRole('heading').map(h => h.textContent.trim()).filter(t => /Runners/.test(t));

describe('M-4 / #21: no single-number trailing group', () => {
  it('does not produce a "200-200" group for 100-200 at group size 50', () => {
    renderGrid({ minRunner: 100, maxRunner: 200, groupSize: 50 });

    const headings = groupHeadings();
    expect(headings.some(h => /200-200/.test(h))).toBe(false);
  });

  it('absorbs the leftover number into the previous group', () => {
    renderGrid({ minRunner: 100, maxRunner: 200, groupSize: 50 });

    const headings = groupHeadings();
    // 100-149 and 150-200 rather than 100-149 / 150-199 / 200-200
    expect(headings.some(h => /150-200/.test(h))).toBe(true);
  });

  it('leaves evenly divisible ranges untouched', () => {
    renderGrid({ minRunner: 1, maxRunner: 100, groupSize: 50 });

    const headings = groupHeadings();
    expect(headings.some(h => /1-50/.test(h))).toBe(true);
    expect(headings.some(h => /51-100/.test(h))).toBe(true);
  });

  it('keeps a substantial trailing group as its own group', () => {
    // 1-120 at size 50 => 1-50, 51-100, 101-120 (20 runners: worth its own group)
    renderGrid({ minRunner: 1, maxRunner: 120, groupSize: 50 });

    const headings = groupHeadings();
    expect(headings.some(h => /101-120/.test(h))).toBe(true);
  });
});

describe('M-4 / #22: first group is expanded on load', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders runner buttons from the first group without any interaction', () => {
    renderGrid({ minRunner: 100, maxRunner: 200, groupSize: 50 });

    // Runner 100 lives in the first group and must be visible immediately
    expect(screen.getByRole('button', { name: /^Runner 100,/ })).toBeInTheDocument();
  });

  it('leaves later groups collapsed', () => {
    renderGrid({ minRunner: 100, maxRunner: 200, groupSize: 50 });

    expect(screen.queryByRole('button', { name: /^Runner 150,/ })).not.toBeInTheDocument();
  });

  it('can still collapse the first group', () => {
    renderGrid({ minRunner: 100, maxRunner: 200, groupSize: 50 });

    const firstHeading = groupHeadings().find(h => /100-149/.test(h));
    expect(firstHeading).toBeTruthy();

    fireEvent.click(screen.getByText(/Runners 100-149/));
    expect(screen.queryByRole('button', { name: /^Runner 100,/ })).not.toBeInTheDocument();
  });

  it('can expand a later group', () => {
    renderGrid({ minRunner: 100, maxRunner: 200, groupSize: 50 });

    fireEvent.click(screen.getByText(/Runners 150-200/));
    expect(screen.getByRole('button', { name: /^Runner 150,/ })).toBeInTheDocument();
  });
});
