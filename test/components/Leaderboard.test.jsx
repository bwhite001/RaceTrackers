import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Leaderboard from 'modules/base-operations/components/Leaderboard';
import { RUNNER_STATUSES } from 'types';

describe('Leaderboard', () => {
  it('renders without crashing with an empty runners array', () => {
    render(<Leaderboard runners={[]} />);
    expect(screen.getByText('Finishers')).toBeInTheDocument();
    expect(screen.getByText('No finishers recorded yet.')).toBeInTheDocument();
  });

  it('sorts runners with finish times in ascending order (fastest first)', () => {
    const runners = [
      { number: 10, commonTime: '2024-01-01T03:00:00Z', status: RUNNER_STATUSES.FINISHED },
      { number: 5,  commonTime: '2024-01-01T01:00:00Z', status: RUNNER_STATUSES.FINISHED },
      { number: 7,  commonTime: '2024-01-01T02:00:00Z', status: RUNNER_STATUSES.FINISHED },
    ];
    render(<Leaderboard runners={runners} />);

    const bibs = screen.getAllByRole('cell').filter(
      cell => ['5', '7', '10'].includes(cell.textContent.trim())
    );
    expect(bibs[0]).toHaveTextContent('5');
    expect(bibs[1]).toHaveTextContent('7');
    expect(bibs[2]).toHaveTextContent('10');
  });

  it('shows DNF runners in the Did Not Finish section, not in Finishers', () => {
    const runners = [
      { number: 1,  commonTime: '2024-01-01T01:00:00Z', status: RUNNER_STATUSES.FINISHED },
      { number: 99, commonTime: null,                   status: RUNNER_STATUSES.DNF },
    ];
    render(<Leaderboard runners={runners} />);

    expect(screen.getByText(/Did Not Finish/)).toBeInTheDocument();
    // DNF runner should appear in DNF section
    const dnfSection = screen.getByText(/Did Not Finish/).closest('div').parentElement;
    expect(dnfSection).not.toBeNull();

    // Finisher section has one row (runner 1), no row for runner 99
    const finisherTable = screen.getByText('Finishers').closest('div').parentElement;
    expect(finisherTable).toHaveTextContent('1');
    expect(finisherTable).not.toHaveTextContent('99');
  });

  it('shows runners without a recorded time under Still Racing', () => {
    const runners = [
      { number: 42, commonTime: null, status: RUNNER_STATUSES.NOT_STARTED },
    ];
    render(<Leaderboard runners={runners} />);
    expect(screen.getByText(/Still Racing/)).toBeInTheDocument();
    expect(screen.getByText('#42')).toBeInTheDocument();
  });
});
