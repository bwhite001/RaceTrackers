/**
 * CC-3: Missing Button Styling
 *
 * Issues #7, #11, #25, #47
 *
 * Three interactive actions did not read as buttons:
 *   #7/#11 "Back: Race Details" used Button variant="ghost" — no border or fill,
 *          so it looked like plain text next to the primary action.
 *   #25    "Mark Called" was a raw <button className="btn-primary">.
 *   #47    "Generate Report" was a raw <button className="btn-primary"> with an
 *          inline icon, reading as a link rather than the panel's primary action.
 *
 * All three must now render through the design-system <Button>, which applies
 * the shared base styles (inline-flex, rounded-lg, font-medium).
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

/** Classes every design-system Button carries (see Button/Button.jsx baseStyles). */
const DESIGN_SYSTEM_BASE = ['inline-flex', 'rounded-lg', 'font-medium'];

const expectDesignSystemButton = (el) => {
  expect(el.tagName).toBe('BUTTON');
  DESIGN_SYSTEM_BASE.forEach(cls => expect(el.className).toContain(cls));
  // The legacy global utility class must be gone
  expect(el.className).not.toContain('btn-primary');
};

describe('CC-3 / #7,#11: "Back: Race Details" is a visibly styled button', () => {
  beforeEach(() => vi.resetModules());

  it('renders as a design-system Button with a visible border (outline variant)', async () => {
    vi.doMock('store/useRaceStore', () => ({
      useRaceStore: vi.fn((selector) => {
        const state = { runnerRoster: [], updateRunnerPersonalData: vi.fn() };
        return selector ? selector(state) : state;
      }),
    }));

    const { default: RunnerRangesStep } = await import('../../src/components/Setup/RunnerRangesStep');
    render(<RunnerRangesStep onBack={vi.fn()} onCreate={vi.fn()} />);

    const back = screen.getByRole('button', { name: 'Back: Race Details' });
    expectDesignSystemButton(back);
    // ghost variant has no border; outline does — this is the actual fix
    expect(back.className).toContain('border');
  });
});

describe('CC-3 / #25: "Mark Called" is a design-system Button', () => {
  beforeEach(() => vi.resetModules());

  const segment = {
    commonTimeLabel: '09:05',
    commonTime: '2026-03-04T09:05:00.000Z',
    calledIn: false,
    runners: [{ number: 1 }, { number: 2 }],
  };

  it('renders through the design-system Button, not a raw btn-primary', async () => {
    vi.doMock('modules/checkpoint-operations/store/checkpointStore', () => ({
      default: () => ({
        getTimeSegments: () => [segment],
        markSegmentCalledIn: vi.fn(),
        loading: false,
        runners: [],
      }),
    }));

    const { default: CalloutSheet } = await import('../../src/components/Checkpoint/CalloutSheet');
    render(<CalloutSheet />);

    expectDesignSystemButton(screen.getByRole('button', { name: /mark called/i }));
  });

  it('is disabled while that segment is being called in', async () => {
    vi.doMock('modules/checkpoint-operations/store/checkpointStore', () => ({
      default: () => ({
        getTimeSegments: () => [segment],
        markSegmentCalledIn: vi.fn(),
        loading: true, // store-level busy flag
        runners: [],
      }),
    }));

    const { default: CalloutSheet } = await import('../../src/components/Checkpoint/CalloutSheet');
    render(<CalloutSheet />);

    expect(screen.getByRole('button', { name: /mark called/i })).toBeDisabled();
  });
});

describe('CC-3 / #47: "Generate Report" is a design-system Button', () => {
  beforeEach(() => vi.resetModules());

  const mockStore = (overrides = {}) => {
    vi.doMock('modules/base-operations/store/baseOperationsStore', () => ({
      default: () => ({
        generateReport: vi.fn(),
        downloadReport: vi.fn(),
        previewReport: vi.fn(),
        loading: false,
        checkpoints: [],
        ...overrides,
      }),
    }));
  };

  it('renders through the design-system Button, not a raw btn-primary', async () => {
    mockStore();
    const { default: ReportsPanel } = await import('modules/base-operations/components/ReportsPanel');
    render(<ReportsPanel />);

    expectDesignSystemButton(screen.getByRole('button', { name: /generate report/i }));
  });

  it('shows a loading state while generating', async () => {
    mockStore({ loading: true });
    const { default: ReportsPanel } = await import('modules/base-operations/components/ReportsPanel');
    render(<ReportsPanel />);

    const btn = screen.getByRole('button', { name: /generating|generate report/i });
    expect(btn).toBeDisabled();
  });
});
