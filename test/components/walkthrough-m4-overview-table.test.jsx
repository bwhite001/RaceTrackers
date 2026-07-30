/**
 * M-4: Checkpoint Overview table — issues #32, #33, #34
 *
 * #33 The "Actions" column header rendered even when no row had any action
 *     available (checkpoint mode, all runners already passed), leaving a header
 *     over a column of blanks.
 * #34 A missing time rendered as "--:--:--", which reads like a live clock
 *     waiting to tick rather than "no time recorded".
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RUNNER_STATUSES, APP_MODES } from 'types';

let mockRunners = [];
let mockMode = APP_MODES.CHECKPOINT;

vi.mock('store/useRaceStore', () => ({
  useRaceStore: () => ({
    runners: mockRunners,
    markRunnerStatus: vi.fn(),
    getRunnerCounts: () => ({
      total: mockRunners.length,
      passed: mockRunners.filter(r => r.status === RUNNER_STATUSES.PASSED).length,
      notStarted: mockRunners.filter(r => r.status === RUNNER_STATUSES.NOT_STARTED).length,
      nonStarter: 0,
      dnf: 0,
    }),
    isSegmentCalled: () => false,
    mode: mockMode,
    raceConfig: { id: 1, minRunner: 1, maxRunner: 10, startTime: '2026-03-04T08:00:00.000Z' },
    isLoading: false,
  }),
}));

import RunnerOverview from '../../src/components/Shared/RunnerOverview';

const headerTexts = () => [...document.querySelectorAll('th')].map(th => th.textContent.trim());

describe('M-4 / #34: missing time placeholder', () => {
  beforeEach(() => {
    mockMode = APP_MODES.CHECKPOINT;
    mockRunners = [{ number: 1, status: RUNNER_STATUSES.NOT_STARTED, recordedTime: null }];
  });

  it('renders an em dash instead of "--:--:--"', () => {
    render(<RunnerOverview />);

    expect(screen.queryByText('--:--:--')).not.toBeInTheDocument();
    const cells = [...document.querySelectorAll('td')];
    expect(cells.some(c => c.textContent.trim() === '—')).toBe(true);
  });

  it('still shows a real recorded time when there is one', () => {
    mockRunners = [{
      number: 1,
      status: RUNNER_STATUSES.PASSED,
      recordedTime: '2026-03-04T09:07:30.000Z',
    }];
    render(<RunnerOverview />);

    const cells = [...document.querySelectorAll('td')].map(c => c.textContent);
    expect(cells.some(c => /\d{1,2}:\d{2}/.test(c))).toBe(true);
  });
});

describe('M-4 / #33: Actions column only when there are actions', () => {
  beforeEach(() => { mockMode = APP_MODES.CHECKPOINT; });

  it('omits the Actions header when no row offers an action', () => {
    // Checkpoint mode + already passed => canChangeStatus is false for every row
    mockRunners = [
      { number: 1, status: RUNNER_STATUSES.PASSED, recordedTime: '2026-03-04T09:00:00.000Z' },
      { number: 2, status: RUNNER_STATUSES.PASSED, recordedTime: '2026-03-04T09:01:00.000Z' },
    ];
    render(<RunnerOverview />);

    expect(headerTexts()).not.toContain('Actions');
  });

  it('shows the Actions header when at least one row offers an action', () => {
    mockRunners = [
      { number: 1, status: RUNNER_STATUSES.PASSED, recordedTime: '2026-03-04T09:00:00.000Z' },
      { number: 2, status: RUNNER_STATUSES.NOT_STARTED, recordedTime: null },
    ];
    render(<RunnerOverview />);

    expect(headerTexts()).toContain('Actions');
  });

  it('shows the Actions header in base station mode (all statuses changeable)', () => {
    mockMode = APP_MODES.BASE_STATION;
    mockRunners = [{ number: 1, status: RUNNER_STATUSES.PASSED, recordedTime: '2026-03-04T09:00:00.000Z' }];
    render(<RunnerOverview />);

    expect(headerTexts()).toContain('Actions');
  });

  it('keeps header and body column counts in step when Actions is omitted', () => {
    mockRunners = [{ number: 1, status: RUNNER_STATUSES.PASSED, recordedTime: '2026-03-04T09:00:00.000Z' }];
    render(<RunnerOverview />);

    const headerCount = document.querySelectorAll('thead th').length;
    const bodyCount = document.querySelectorAll('tbody tr:first-child td').length;
    expect(bodyCount).toBe(headerCount);
  });

  it('keeps header and body column counts in step when Actions is present', () => {
    mockRunners = [{ number: 1, status: RUNNER_STATUSES.NOT_STARTED, recordedTime: null }];
    render(<RunnerOverview />);

    const headerCount = document.querySelectorAll('thead th').length;
    const bodyCount = document.querySelectorAll('tbody tr:first-child td').length;
    expect(bodyCount).toBe(headerCount);
  });
});
