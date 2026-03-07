import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LiveLeadersWidget from '../../src/modules/base-operations/components/Leaderboard/LiveLeadersWidget';

const genderGroups = {
  M: [{ number: 45, displayName: 'John Smith', gender: 'M', batchName: 'Wave 1', elapsedFormatted: '2:15:30', rank: 1 }],
  F: [{ number: 22, displayName: 'Sarah Jones', gender: 'F', batchName: 'Wave 1', elapsedFormatted: '2:18:45', rank: 1 }],
  X: [],
};

describe('LiveLeadersWidget', () => {
  it('renders the widget heading', () => {
    render(<LiveLeadersWidget genderGroups={genderGroups} />);
    expect(screen.getByText(/current leaders/i)).toBeInTheDocument();
  });

  it('shows leader bib number for Male', () => {
    render(<LiveLeadersWidget genderGroups={genderGroups} />);
    expect(screen.getByText('#45')).toBeInTheDocument();
  });

  it('shows leader elapsed time', () => {
    render(<LiveLeadersWidget genderGroups={genderGroups} />);
    expect(screen.getByText('2:15:30')).toBeInTheDocument();
  });

  it('does not render a card for empty gender group', () => {
    render(<LiveLeadersWidget genderGroups={genderGroups} />);
    // X group has no runners, so "Other" category should not appear
    const cards = screen.queryAllByText(/other/i);
    // "Other" label should not appear as a leader card
    expect(cards.filter(el => el.closest('[data-testid="leader-card"]'))).toHaveLength(0);
  });

  it('renders placeholder when all groups are empty', () => {
    render(<LiveLeadersWidget genderGroups={{ M: [], F: [], X: [] }} />);
    expect(screen.getByText(/awaiting first finisher/i)).toBeInTheDocument();
  });
});
