/**
 * Remaining presentation fixes from the 2026-03-04 walkthrough that main had
 * not yet picked up.
 *
 * #5  Setup wizard step labels for not-yet-reached steps were too faint.
 * #40 Batch cards showed the radio common time unlabelled next to a labelled
 *     "Recorded:" time, so the two were indistinguishable.
 * #41 Base station overview stat labels were rendered ALL CAPS.
 * #45 Export-format cards dimmed their unselected icons — the report-type cards
 *     had already been fixed, leaving the two rows inconsistent.
 * #47 "Generate Report" was a raw btn-primary rather than a design-system Button.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StepIndicator from '../../src/components/Setup/StepIndicator';
import BatchCard from 'modules/base-operations/components/BatchCard';

describe('#5: StepIndicator contrast', () => {
  const STEPS = [
    { number: 1, label: 'Race Details', description: 'Name and date' },
    { number: 2, label: 'Runner Ranges', description: 'Bib ranges' },
    { number: 3, label: 'Waves', description: 'Start times' },
  ];

  it('upcoming step labels use the higher-contrast gray', () => {
    render(<StepIndicator steps={STEPS} currentStep={0} />);

    const upcoming = screen.getByText('Runner Ranges');
    expect(upcoming.className).toContain('text-gray-600');
    expect(upcoming.className).toContain('dark:text-gray-300');
    expect(upcoming.className).not.toContain('text-gray-500');
  });

  it('keeps the current step dominant and completed steps green', () => {
    render(<StepIndicator steps={STEPS} currentStep={2} />);

    expect(screen.getByText('Waves').className).toContain('text-navy-900');
    expect(screen.getByText('Race Details').className).toContain('text-green-700');
  });
});

describe('#40: batch card times are both labelled', () => {
  const batch = {
    id: 'b1',
    checkpointNumber: 1,
    commonTime: '09:05',
    bibs: [1, 2],
    submittedAt: '2026-03-04T09:07:00.000Z',
    voided: false,
  };

  it('labels the radio common time', () => {
    render(<BatchCard batch={batch} checkpointName="Ridgeline" isHighlighted={false} onVoid={vi.fn()} />);
    expect(screen.getByText(/Common: 09:05/)).toBeInTheDocument();
  });

  it('still labels the data-entry time', () => {
    render(<BatchCard batch={batch} checkpointName="Ridgeline" isHighlighted={false} onVoid={vi.fn()} />);
    expect(screen.getByText(/Recorded:/)).toBeInTheDocument();
  });
});

describe('#41: base station overview stat labels are title case', () => {
  beforeEach(() => vi.resetModules());

  it('no stat label carries the uppercase class', async () => {
    vi.doMock('modules/base-operations/store/baseOperationsStore', () => ({
      default: () => ({
        stats: { total: 10, finished: 1, active: 2, dnf: 0, dns: 0, notStarted: 7, checkpointCounts: {} },
        checkpoints: [{ number: 1, name: 'Ridgeline' }],
      }),
    }));
    vi.doMock('store/useRaceStore', () => ({
      useRaceStore: () => ({ currentRace: { date: '2026-03-04', startTime: '08:00' } }),
    }));
    vi.doMock('modules/base-operations/components/Leaderboard/LiveLeadersBanner', () => ({
      default: () => <div data-testid="live-leaders" />,
    }));

    const { default: RaceOverview } = await import('modules/base-operations/components/RaceOverview');
    const { container } = render(<RaceOverview />);

    const uppercased = [...container.querySelectorAll('*')]
      .filter(el => typeof el.className === 'string' && el.className.includes('uppercase'));
    expect(uppercased).toHaveLength(0);
  });
});

describe('#45, #47: Reports panel card states and Generate button', () => {
  beforeEach(() => vi.resetModules());

  const renderPanel = async () => {
    vi.doMock('modules/base-operations/store/baseOperationsStore', () => ({
      default: () => ({
        generateReport: vi.fn(),
        downloadReport: vi.fn(),
        previewReport: vi.fn(),
        loading: false,
        currentRaceId: 1,
      }),
    }));
    const { default: ReportsPanel } = await import('modules/base-operations/components/ReportsPanel');
    render(<ReportsPanel />);
  };

  it('#47 renders Generate Report through the design-system Button', async () => {
    await renderPanel();

    const btn = screen.getByRole('button', { name: /generate report/i });
    expect(btn.className).toContain('inline-flex');
    expect(btn.className).toContain('rounded-lg');
    expect(btn.className).not.toContain('btn-primary');
  });

  it('#45 export-format cards match the report-type cards when unselected', async () => {
    await renderPanel();

    // CSV is selected by default, so Excel is an unselected format card, and
    // "Out List Report" is an unselected report-type card.
    const formatCard = screen.getByText('Excel').closest('button');
    const reportCard = screen.getByText('Out List Report').closest('button');

    // The dimmed 'text-gray-400 dark:text-gray-500' pairing is gone; both rows
    // now use the same unselected treatment.
    expect(formatCard.querySelector('div').className)
      .toBe(reportCard.querySelector('div').className);
    expect(formatCard.className).toMatch(/hover:/);
  });
});
