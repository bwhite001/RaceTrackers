/**
 * M-4: Callout Sheet layout — issues #27, #28, #29
 *
 * #27 "Pending Callouts" heading was not visible on load — it scrolled away
 *     with the list, so an operator could not tell what they were looking at.
 * #28 The "No pending callouts" empty state rendered above already-called
 *     segments, so the sheet said nothing was pending while showing history.
 * #29 The "5-minute segments" subtitle was right-aligned opposite the heading
 *     instead of sitting under it as a subtitle.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const segment = (label, opts = {}) => ({
  commonTimeLabel: label,
  commonTime: `2026-03-04T${label.slice(0, 5)}:00.000Z`,
  calledIn: false,
  runners: [{ number: 1 }, { number: 2 }],
  ...opts,
});

let mockSegments = [];

vi.mock('modules/checkpoint-operations/store/checkpointStore', () => ({
  default: () => ({
    getTimeSegments: () => mockSegments,
    markSegmentCalledIn: vi.fn(),
    loading: false,
    runners: [],
  }),
}));

import CalloutSheet from '../../src/components/Checkpoint/CalloutSheet';

describe('M-4 / #27: "Pending Callouts" heading stays visible', () => {
  beforeEach(() => { mockSegments = [segment('09:05–09:10')]; });

  it('renders the heading with the pending count', () => {
    render(<CalloutSheet />);
    expect(screen.getByText(/Pending Callouts \(1\)/)).toBeInTheDocument();
  });

  it('pins the heading so it survives scrolling the segment list', () => {
    render(<CalloutSheet />);

    const heading = screen.getByText(/Pending Callouts \(1\)/);
    const sticky = heading.closest('.sticky');
    expect(sticky).toBeTruthy();
    expect(sticky.className).toContain('top-0');
  });
});

describe('M-4 / #28: empty state does not contradict called history', () => {
  it('shows the full empty state when nothing is pending and nothing was called', () => {
    mockSegments = [];
    render(<CalloutSheet />);

    expect(screen.getByText('No pending callouts')).toBeInTheDocument();
  });

  it('hides the empty state when called segments exist', () => {
    mockSegments = [segment('09:00–09:05', { calledIn: true })];
    render(<CalloutSheet />);

    expect(screen.queryByText('No pending callouts')).not.toBeInTheDocument();
  });

  it('confirms all segments are called instead of claiming none are pending', () => {
    mockSegments = [segment('09:00–09:05', { calledIn: true })];
    render(<CalloutSheet />);

    expect(screen.getByText(/all segments called in/i)).toBeInTheDocument();
  });

  it('shows neither empty state nor all-called note while callouts are pending', () => {
    mockSegments = [segment('09:05–09:10')];
    render(<CalloutSheet />);

    expect(screen.queryByText('No pending callouts')).not.toBeInTheDocument();
    expect(screen.queryByText(/all segments called in/i)).not.toBeInTheDocument();
  });
});

describe('M-4 / #29: "5-minute segments" is a subtitle', () => {
  beforeEach(() => { mockSegments = [segment('09:05–09:10')]; });

  it('sits inside the same block as the "Callout Sheet" heading', () => {
    render(<CalloutSheet />);

    const heading = screen.getByRole('heading', { name: 'Callout Sheet' });
    const subtitle = screen.getByText(/5-minute segments/);

    // Subtitle is a sibling under the heading's own container, not pushed to
    // the far side of a justify-between row.
    expect(heading.parentElement).toBe(subtitle.parentElement);
  });

  it('renders as a paragraph beneath the heading', () => {
    render(<CalloutSheet />);

    const subtitle = screen.getByText(/5-minute segments/);
    expect(subtitle.tagName).toBe('P');
  });
});
