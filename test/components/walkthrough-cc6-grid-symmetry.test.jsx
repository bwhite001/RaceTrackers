/**
 * CC-6: Asymmetric Grid Fixes
 *
 * Issues #4, #6, #46
 *
 * Three fixed 2-column grids left an orphaned half-width cell whenever the item
 * count was odd. Each becomes a responsive grid whose column count suits the
 * real item count:
 *   #4  template cards        — 3-up at sm and above
 *   #6  checkpoint name fields — 2-up from sm (was md), so the orphan row is
 *                                narrower and less jarring
 *   #46 report cards          — 2-up at sm, 3-up at lg
 *
 * These assertions pin the responsive class sets so a future edit cannot
 * silently reintroduce a bare two-column grid.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

/** Find the grid container that holds a given child element. */
const gridAncestorOf = (el) => {
  let node = el;
  while (node && node !== document.body) {
    if (node.classList?.contains('grid')) return node;
    node = node.parentElement;
  }
  throw new Error('No grid ancestor found');
};

describe('CC-6 / #4: template cards grid', () => {
  it('lays templates out 3-up rather than in a fixed 2-column grid', async () => {
    const { default: TemplateSelectionStep } = await import('../../src/components/Setup/TemplateSelectionStep');
    render(<TemplateSelectionStep onSelect={vi.fn()} />);

    // The "Start from Scratch" button sits outside the grid; use a template card
    const cards = screen.getAllByRole('button').filter(b => /checkpoints/.test(b.textContent));
    expect(cards.length).toBeGreaterThan(0);

    const grid = gridAncestorOf(cards[0]);
    expect(grid.className).toContain('grid-cols-1');
    expect(grid.className).toContain('sm:grid-cols-3');
    expect(grid.className).not.toMatch(/(^|\s)sm:grid-cols-2(\s|$)/);
  });
});

describe('CC-6 / #6: checkpoint name fields grid', () => {
  const renderStep = async (numCheckpoints) => {
    const checkpoints = Array.from({ length: numCheckpoints }, (_, i) => ({
      number: i + 1, name: '',
    }));
    const { default: RaceDetailsStep } = await import('../../src/components/Setup/RaceDetailsStep');
    render(
      <RaceDetailsStep
        formData={{
          name: 'Test Race',
          date: '2026-03-04',
          startTime: '08:00',
          numCheckpoints,
          checkpoints,
        }}
        validationErrors={{}}
        onChange={vi.fn()}
        onNext={vi.fn()}
        onCheckpointNameChange={vi.fn()}
      />
    );
    return checkpoints;
  };

  it('goes 2-up from the sm breakpoint (odd counts orphan a narrower cell)', async () => {
    await renderStep(3);

    const firstField = document.getElementById('checkpoint-0');
    expect(firstField).toBeTruthy();

    const grid = gridAncestorOf(firstField);
    expect(grid.className).toContain('grid-cols-1');
    expect(grid.className).toContain('sm:grid-cols-2');
    expect(grid.className).not.toContain('md:grid-cols-2');
  });

  it('uses the same responsive grid for an even checkpoint count', async () => {
    await renderStep(4);

    const grid = gridAncestorOf(document.getElementById('checkpoint-0'));
    expect(grid.className).toContain('sm:grid-cols-2');
  });
});

describe('CC-6 / #46: report cards grid', () => {
  beforeEach(() => vi.resetModules());

  it('goes 3-up at lg instead of a fixed 2-column grid', async () => {
    vi.doMock('modules/base-operations/store/baseOperationsStore', () => ({
      default: () => ({
        generateReport: vi.fn(),
        downloadReport: vi.fn(),
        previewReport: vi.fn(),
        loading: false,
      }),
    }));
    vi.doMock('modules/race-maintenance/store/raceMaintenanceStore', () => ({
      default: () => ({ checkpoints: [], currentRace: null }),
    }));

    const { default: ReportsPanel } = await import('modules/base-operations/components/ReportsPanel');
    render(<ReportsPanel />);

    const card = screen.getByText('Missing Numbers Report');
    const grid = gridAncestorOf(card);

    expect(grid.className).toContain('grid-cols-1');
    expect(grid.className).toContain('sm:grid-cols-2');
    expect(grid.className).toContain('lg:grid-cols-3');
  });
});
