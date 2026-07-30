/**
 * M-6: Reports panel presentation — issues #45, #48, #49, #50
 *
 * #45 Unselected report cards greyed their icon and text, so seven of eight
 *     cards looked disabled rather than selectable.
 * #48 One option used a styled checkbox and another a bare native one.
 * #49 "About Reports" bullets were rendered in a link colour but are not links.
 * #50 A large whitespace gap sat between Generate Report and About Reports.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('modules/base-operations/store/baseOperationsStore', () => ({
  default: () => ({
    generateReport: vi.fn(),
    downloadReport: vi.fn(),
    previewReport: vi.fn(),
    loading: false,
  }),
}));

vi.mock('modules/race-maintenance/store/raceMaintenanceStore', () => ({
  default: () => ({
    checkpoints: [{ number: 1, name: 'Ridgeline' }],
    currentRace: { id: 1, name: 'Test Race' },
  }),
}));

import ReportsPanel from 'modules/base-operations/components/ReportsPanel';

const cardFor = (label) => screen.getByText(label).closest('button');

describe('M-6 / #45: unselected report cards look selectable', () => {
  beforeEach(() => render(<ReportsPanel />));

  it('does not dim the unselected card icon', () => {
    // "Out List Report" is not the default selection. The icon wrapper is the
    // first child div; the description below it is muted for every card and is
    // not what made the cards read as disabled.
    const card = cardFor('Out List Report');
    const iconWrapper = card.querySelector('div');

    expect(card.className).not.toContain('opacity-50');
    expect(iconWrapper.className).not.toContain('text-gray-400');
  });

  it('gives unselected cards a hover affordance and pointer cursor', () => {
    const card = cardFor('Out List Report');
    expect(card.className).toMatch(/hover:/);
    expect(card.className).toContain('cursor-pointer');
  });

  it('marks the selected card with the accent border', () => {
    // "Missing Numbers Report" is the default selection
    expect(cardFor('Missing Numbers Report').className).toMatch(/border-(navy|primary)-/);
  });

  it('moves the accent border when another card is chosen', () => {
    fireEvent.click(cardFor('Out List Report'));

    expect(cardFor('Out List Report').className).toMatch(/border-(navy|primary)-/);
    expect(cardFor('Missing Numbers Report').className).not.toMatch(/border-(navy|primary)-6/);
  });
});

describe('M-6 / #48: both checkboxes are styled consistently', () => {
  beforeEach(() => render(<ReportsPanel />));

  it('renders both option checkboxes', () => {
    expect(screen.getByLabelText(/include notes/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/show preview/i)).toBeInTheDocument();
  });

  it('applies identical classes to both', () => {
    const notes = screen.getByLabelText(/include notes/i);
    const preview = screen.getByLabelText(/show preview/i);
    expect(notes.className).toBe(preview.className);
  });

  it('keeps both checkboxes functional', () => {
    const preview = screen.getByLabelText(/show preview/i);
    expect(preview.checked).toBe(false);

    fireEvent.click(preview);
    expect(preview.checked).toBe(true);
  });
});

describe('M-6 / #49: "About Reports" bullets are body text', () => {
  beforeEach(() => render(<ReportsPanel />));

  it('does not use a link colour for non-clickable bullets', () => {
    const list = screen.getByText(/Shows runners who haven't checked in/).closest('ul');
    expect(list.className).not.toMatch(/text-(blue|teal)-800/);
    expect(list.className).toMatch(/text-gray-/);
  });

  it('contains no anchors in the bullet list', () => {
    const list = screen.getByText(/Shows runners who haven't checked in/).closest('ul');
    expect(list.querySelectorAll('a')).toHaveLength(0);
  });
});

describe('M-6 / #50: no large gap before "About Reports"', () => {
  beforeEach(() => render(<ReportsPanel />));

  it('uses a tight top margin on the About Reports block', () => {
    const about = screen.getByText('About Reports').closest('div');
    expect(about.className).not.toMatch(/mt-(8|12|16)/);
  });

  it('right-aligned Generate Report row carries no extra bottom margin', () => {
    const generate = screen.getByRole('button', { name: /generate report/i });
    const row = generate.parentElement;
    expect(row.className).not.toMatch(/mb-(8|12|16)/);
  });
});
