/**
 * CC-5: Checkpoint Name Propagation
 *
 * Issues #23, #54
 *
 * The setup wizard lets an operator name each checkpoint ("Ridgeline"), but the
 * name never reached the places that matter:
 *   #23 the Checkpoint View header said "Checkpoint 1"
 *   #54 the Reports checkpoint dropdown hardcoded 1–5, ignoring the real config
 *
 * All the "name, or Checkpoint N" lookups route through one shared helper
 * (src/utils/checkpointName.js), so its edge cases are tested directly.
 *
 * Note: raceMaintenanceStore keeps `checkpoints` as its own array — it is NOT
 * nested under `currentRace` — so lookups read the store's checkpoints.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { getCheckpointName } from '../../src/utils/checkpointName';

const CHECKPOINTS = [
  { id: 1, raceId: 'race-1', number: 1, name: 'Ridgeline' },
  { id: 2, raceId: 'race-1', number: 2, name: 'Creek Crossing' },
  { id: 3, raceId: 'race-1', number: 3, name: '' }, // unnamed — must fall back
];

// ─── Shared helper ───────────────────────────────────────────────────────────

describe('CC-5: getCheckpointName helper', () => {
  it('returns the configured name', () => {
    expect(getCheckpointName(CHECKPOINTS, 1)).toBe('Ridgeline');
  });

  it('matches when the number is a string (route params are strings)', () => {
    expect(getCheckpointName(CHECKPOINTS, '2')).toBe('Creek Crossing');
  });

  it('falls back to "Checkpoint N" when the name is empty', () => {
    expect(getCheckpointName(CHECKPOINTS, 3)).toBe('Checkpoint 3');
  });

  it('falls back when the checkpoint is not in the config', () => {
    expect(getCheckpointName(CHECKPOINTS, 9)).toBe('Checkpoint 9');
  });

  it('falls back when checkpoints is empty, null or undefined', () => {
    expect(getCheckpointName([], 1)).toBe('Checkpoint 1');
    expect(getCheckpointName(null, 1)).toBe('Checkpoint 1');
    expect(getCheckpointName(undefined, 1)).toBe('Checkpoint 1');
  });
});

// ─── #23: Checkpoint View header ─────────────────────────────────────────────

// Mutable so each test can vary the configured checkpoints (vi.mock is hoisted)
let mockCheckpoints = CHECKPOINTS;

vi.mock('shared/store/navigationStore', () => ({
  default: vi.fn(() => ({
    startOperation: vi.fn(),
    endOperation: vi.fn(),
    canNavigateTo: vi.fn(() => true),
  })),
  MODULE_TYPES: { CHECKPOINT: 'checkpoint' },
}));

vi.mock('modules/checkpoint-operations/store/checkpointStore', () => ({
  default: vi.fn(() => ({
    runners: [],
    loading: false,
    error: null,
    initializeCheckpoint: vi.fn(),
    loadCheckpointData: vi.fn(() => Promise.resolve([])),
    pendingCallInCount: vi.fn(() => 0),
  })),
  // CheckpointView reads fresh state via the raw store during init
  checkpointStore: { getState: vi.fn(() => ({ runners: [{ number: 1 }] })) },
}));

vi.mock('shared/store/settingsStore', () => ({
  default: vi.fn(() => ({ updateSetting: vi.fn() })),
}));

vi.mock('modules/race-maintenance/store/raceMaintenanceStore', () => ({
  default: vi.fn(() => ({
    currentRace: { id: 'race-1', name: 'Test Race' },
    checkpoints: mockCheckpoints,
    loadCurrentRace: vi.fn(),
  })),
  raceMaintenanceStore: {
    getState: vi.fn(() => ({ currentRace: { id: 'race-1', name: 'Test Race' } })),
  },
}));

vi.mock('components/Checkpoint/RunnerGrid', () => ({
  default: () => <div data-testid="runner-grid">RunnerGrid</div>,
}));
vi.mock('components/Checkpoint/CalloutSheet', () => ({
  default: () => <div data-testid="callout-sheet">CalloutSheet</div>,
}));
vi.mock('components/Shared/RunnerOverview', () => ({
  default: () => <div data-testid="runner-overview">RunnerOverview</div>,
}));
vi.mock('components/Layout/LoadingSpinner', () => ({ default: () => <div>Loading…</div> }));
vi.mock('components/Layout/ErrorMessage', () => ({ default: ({ message }) => <div>{message}</div> }));
vi.mock('shared/components/ExitOperationModal', () => ({
  withOperationExit: (Component) => (props) =>
    <Component {...props} onExitAttempt={vi.fn()} setHasUnsavedChanges={vi.fn()} />,
}));

import CheckpointView from 'views/CheckpointView.jsx';

const renderCheckpointView = (checkpointId = '1') => render(
  <MemoryRouter initialEntries={[`/checkpoint/${checkpointId}`]}>
    <Routes>
      <Route path="/checkpoint/:checkpointId" element={<CheckpointView />} />
    </Routes>
  </MemoryRouter>
);

describe('CC-5 / #23: Checkpoint View header shows the configured name', () => {
  beforeEach(() => { mockCheckpoints = CHECKPOINTS; });

  it('shows "Ridgeline" instead of "Checkpoint 1"', () => {
    renderCheckpointView('1');
    expect(screen.getByText('Ridgeline')).toBeDefined();
    expect(screen.queryByText('Checkpoint 1')).toBeNull();
  });

  it('shows the second checkpoint name for checkpoint 2', () => {
    renderCheckpointView('2');
    expect(screen.getByText('Creek Crossing')).toBeDefined();
  });

  it('falls back to "Checkpoint N" when the checkpoint has no name', () => {
    renderCheckpointView('3');
    expect(screen.getByText('Checkpoint 3')).toBeDefined();
  });

  it('falls back to "Checkpoint N" when no checkpoints are configured', () => {
    mockCheckpoints = [];
    renderCheckpointView('1');
    expect(screen.getByText('Checkpoint 1')).toBeDefined();
  });
});

// ─── #54: Reports checkpoint dropdown ────────────────────────────────────────

describe('CC-5 / #54: Reports checkpoint dropdown uses the real config', () => {
  beforeEach(() => { mockCheckpoints = CHECKPOINTS; });

  const renderPanel = async () => {
    vi.doMock('modules/base-operations/store/baseOperationsStore', () => ({
      default: () => ({
        generateReport: vi.fn(),
        downloadReport: vi.fn(),
        previewReport: vi.fn(),
        loading: false,
      }),
    }));
    const { default: ReportsPanel } = await import('modules/base-operations/components/ReportsPanel');
    render(<ReportsPanel />);
  };

  it('lists the configured checkpoint names, not hardcoded numbers', async () => {
    await renderPanel();

    const select = screen.getByLabelText('Checkpoint');
    const optionText = [...select.options].map(o => o.textContent);

    expect(optionText).toContain('Ridgeline');
    expect(optionText).toContain('Creek Crossing');
    // The old hardcoded 1-5 list is gone
    expect(optionText).not.toContain('Checkpoint 4');
    expect(optionText).not.toContain('Checkpoint 5');
  });

  it('falls back to "Checkpoint N" for an unnamed checkpoint', async () => {
    await renderPanel();
    const select = screen.getByLabelText('Checkpoint');
    expect([...select.options].map(o => o.textContent)).toContain('Checkpoint 3');
  });

  it('option values remain the checkpoint numbers', async () => {
    await renderPanel();
    const select = screen.getByLabelText('Checkpoint');
    expect([...select.options].map(o => o.value)).toEqual(['1', '2', '3']);
  });

  it('renders no checkpoint options when the race has none configured', async () => {
    mockCheckpoints = [];
    await renderPanel();
    const select = screen.getByLabelText('Checkpoint');
    expect(select.options).toHaveLength(0);
  });
});
