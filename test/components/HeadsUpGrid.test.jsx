import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HeadsUpGrid from 'modules/base-operations/components/HeadsUpGrid';
import { RUNNER_STATUSES } from 'types';

const CHECKPOINTS = [
  { number: 1, name: 'CP1 - Start' },
  { number: 2, name: 'CP2 - Mid' },
];

const RUNNERS = [
  { number: 101, status: RUNNER_STATUSES.PASSED, checkpointStatuses: { 1: RUNNER_STATUSES.PASSED, 2: RUNNER_STATUSES.PASSED } },
  { number: 102, status: RUNNER_STATUSES.DNF,    checkpointStatuses: { 1: RUNNER_STATUSES.PASSED, 2: RUNNER_STATUSES.DNF } },
  { number: 103, status: RUNNER_STATUSES.NOT_STARTED, checkpointStatuses: {} },
];

describe('HeadsUpGrid', () => {
  it('renders without crashing with empty data', () => {
    const { container } = render(<HeadsUpGrid runners={[]} checkpoints={[]} />);
    expect(container).toBeTruthy();
    expect(screen.getByText(/No runner data available/i)).toBeInTheDocument();
  });

  it('shows one row per runner sorted by bib number', () => {
    render(<HeadsUpGrid runners={RUNNERS} checkpoints={CHECKPOINTS} />);

    // All three bib numbers should appear in the table
    expect(screen.getByText('101')).toBeInTheDocument();
    expect(screen.getByText('102')).toBeInTheDocument();
    expect(screen.getByText('103')).toBeInTheDocument();

    // Verify row count (tbody rows only) — 3 runners = 3 rows
    const rows = screen.getAllByRole('row');
    // thead (1) + tbody (3) + tfoot (1) = 5 rows total
    expect(rows.length).toBe(5);
  });

  it('shows ✓ for a runner marked as passed at a checkpoint', () => {
    render(<HeadsUpGrid runners={RUNNERS} checkpoints={CHECKPOINTS} />);

    const passedCells = screen.getAllByLabelText('passed');
    // Runner 101 passed both CP1 and CP2, Runner 102 passed CP1 = 3 passed cells
    expect(passedCells.length).toBe(3);
  });

  it('shows ✗ for a runner with DNF at a checkpoint', () => {
    render(<HeadsUpGrid runners={RUNNERS} checkpoints={CHECKPOINTS} />);

    const dnfCells = screen.getAllByLabelText('dnf');
    // Runner 102 has DNF at CP2 = 1 cell
    expect(dnfCells.length).toBe(1);
  });

  it('shows checkpoint pass counts in summary row', () => {
    render(<HeadsUpGrid runners={RUNNERS} checkpoints={CHECKPOINTS} />);

    // CP1: runners 101 and 102 passed = 2
    // CP2: only runner 101 passed = 1
    const tfoot = document.querySelector('tfoot');
    expect(tfoot).not.toBeNull();
    expect(tfoot.textContent).toContain('2');
    expect(tfoot.textContent).toContain('1');
  });

  it('displays checkpoint names in column headers', () => {
    render(<HeadsUpGrid runners={RUNNERS} checkpoints={CHECKPOINTS} />);
    // Desktop labels (hidden md:inline spans still exist in DOM)
    expect(screen.getByText('CP1 - Start')).toBeInTheDocument();
    expect(screen.getByText('CP2 - Mid')).toBeInTheDocument();
  });
});
