/**
 * M-5: Leaderboard — time formatting and title case headers
 * Issue #56: TIME column shows raw ISO string (e.g. "2026-03-04T10:30:00.000Z")
 *            instead of a human-readable time (e.g. "10:30:00").
 * Issue #57: Table headers have CSS `uppercase` class (ALL CAPS look).
 *            Headers should use title case without the `uppercase` class.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Leaderboard from 'modules/base-operations/components/Leaderboard';
import { RUNNER_STATUSES } from 'types';

const ISO_TIME = '2026-03-04T10:30:45.000Z';

describe('M-5: Leaderboard time display', () => {
  it('does NOT render the raw ISO timestamp in the time column', () => {
    const runners = [
      { number: 1, commonTime: ISO_TIME, status: RUNNER_STATUSES.FINISHED },
    ];
    render(<Leaderboard runners={runners} />);
    expect(screen.queryByText(ISO_TIME)).not.toBeInTheDocument();
  });

  it('renders a human-readable time (HH:MM:SS) for each finisher', () => {
    const runners = [
      { number: 1, commonTime: ISO_TIME, status: RUNNER_STATUSES.FINISHED },
    ];
    render(<Leaderboard runners={runners} />);
    // The formatted time should appear somewhere in the rendered output.
    // Acceptable formats: "10:30:45" or locale-specific like "10:30 AM".
    // We just assert the ISO string is gone and digits representing the time appear.
    const cells = screen.getAllByRole('cell');
    const timeCell = cells.find(c => /\d{1,2}:\d{2}/.test(c.textContent));
    expect(timeCell).toBeTruthy();
  });
});

describe('M-5: Leaderboard header title case (CC-2)', () => {
  it('table header cells do not have the "uppercase" CSS class', () => {
    render(<Leaderboard runners={[]} />);
    const headers = document.querySelectorAll('th');
    headers.forEach(th => {
      expect(th.className).not.toContain('uppercase');
    });
  });
});
