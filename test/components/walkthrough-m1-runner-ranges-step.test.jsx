/**
 * M-1: Setup Wizard — RunnerRangesStep
 * Issue #8: "Create Race" button should be labelled "Next: Waves"
 * Issue #9: No default range (100–200) should be pre-populated
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock stores and hooks that RunnerRangesStep depends on
vi.mock('store/useRaceStore', () => ({
  useRaceStore: vi.fn((selector) => {
    const state = { runnerRoster: [], updateRunnerPersonalData: vi.fn() };
    return selector ? selector(state) : state;
  }),
}));

import RunnerRangesStep from '../../src/components/Setup/RunnerRangesStep';

const noop = vi.fn();

describe('M-1: RunnerRangesStep', () => {
  it('shows "Next: Waves" button, not "Create Race"', () => {
    render(<RunnerRangesStep onBack={noop} onCreate={noop} />);
    expect(screen.queryByText('Create Race')).not.toBeInTheDocument();
    expect(screen.getByText('Next: Waves')).toBeInTheDocument();
  });

  it('starts with no pre-populated runner ranges when no initialRanges provided', () => {
    render(<RunnerRangesStep onBack={noop} onCreate={noop} />);
    // With no default range there should be no "Remove" buttons visible
    // (they only appear when ranges exist)
    const removeButtons = screen.queryAllByRole('button', { name: /remove/i });
    expect(removeButtons).toHaveLength(0);
  });

  it('accepts and displays initialRanges when provided', () => {
    const ranges = [{ min: 100, max: 150 }];
    render(<RunnerRangesStep initialRanges={ranges} onBack={noop} onCreate={noop} />);
    // The range appears as "100-150" in a Badge (and again in the summary Badge)
    expect(screen.getAllByText(/100-150/).length).toBeGreaterThan(0);
  });
});
