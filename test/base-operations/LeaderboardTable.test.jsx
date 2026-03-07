import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LeaderboardTable from '../../src/modules/base-operations/components/Leaderboard/LeaderboardTable';

const makeEntry = (overrides) => ({
  number: 1,
  displayName: 'Alice Smith',
  gender: 'F',
  batchName: 'Wave 1',
  elapsedFormatted: '1:00:00',
  rank: 1,
  ...overrides,
});

describe('LeaderboardTable', () => {
  it('renders empty state when no entries', () => {
    render(<LeaderboardTable entries={[]} />);
    expect(screen.getByText(/no finishers recorded yet/i)).toBeInTheDocument();
  });

  it('renders medal emoji for rank 1', () => {
    render(<LeaderboardTable entries={[makeEntry({ rank: 1 })]} />);
    expect(screen.getByLabelText(/first place/i)).toBeInTheDocument();
  });

  it('renders medal emoji for rank 2', () => {
    render(<LeaderboardTable entries={[makeEntry({ rank: 2, number: 2, displayName: 'Bob', elapsedFormatted: '1:01:00' })]} />);
    expect(screen.getByLabelText(/second place/i)).toBeInTheDocument();
  });

  it('renders medal emoji for rank 3', () => {
    render(<LeaderboardTable entries={[makeEntry({ rank: 3, number: 3, displayName: 'Carol', elapsedFormatted: '1:02:00' })]} />);
    expect(screen.getByLabelText(/third place/i)).toBeInTheDocument();
  });

  it('renders bib number and elapsed time', () => {
    render(<LeaderboardTable entries={[makeEntry()]} />);
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('1:00:00')).toBeInTheDocument();
  });

  it('hides names when showNames is false', () => {
    render(<LeaderboardTable entries={[makeEntry()]} showNames={false} />);
    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
  });

  it('shows names by default (showNames=true)', () => {
    render(<LeaderboardTable entries={[makeEntry()]} showNames={true} />);
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
  });

  it('hides gender column when hideGender is true', () => {
    const { queryByText } = render(<LeaderboardTable entries={[makeEntry()]} hideGender={true} />);
    expect(queryByText('Gender')).not.toBeInTheDocument();
  });

  it('shows pagination controls when entries exceed pageSize', () => {
    const manyEntries = Array.from({ length: 60 }, (_, i) =>
      makeEntry({ number: i + 1, displayName: `Runner ${i + 1}`, rank: i + 1, elapsedFormatted: `1:${String(i).padStart(2,'0')}:00` })
    );
    render(<LeaderboardTable entries={manyEntries} pageSize={50} />);
    expect(screen.getByText(/showing/i)).toBeInTheDocument();
  });
});
