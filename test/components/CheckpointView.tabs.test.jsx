/**
 * Tests that CheckpointView renders a 3-tab layout.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// ─── Store / dependency mocks ───────────────────────────────────────────────

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
  checkpointStore: { getState: vi.fn(() => ({ runners: [], currentRace: { id: 'race-1', name: 'Test Race' } })) },
}));

vi.mock('shared/store/settingsStore', () => ({
  default: vi.fn(() => ({ updateSetting: vi.fn() })),
}));

vi.mock('modules/race-maintenance/store/raceMaintenanceStore', () => ({
  default: vi.fn(() => ({
    currentRace: { id: 'race-1', name: 'Test Race' },
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

vi.mock('components/Layout/LoadingSpinner', () => ({
  default: () => <div>Loading…</div>,
}));

vi.mock('components/Layout/ErrorMessage', () => ({
  default: ({ message }) => <div>{message}</div>,
}));

vi.mock('shared/components/ExitOperationModal', () => ({
  withOperationExit: (Component) => (props) =>
    <Component {...props} onExitAttempt={vi.fn()} setHasUnsavedChanges={vi.fn()} />,
}));

vi.mock('store/useRaceStore', () => ({
  useRaceStore: vi.fn(() => ({
    loadRace: vi.fn(),
    loadCheckpointRunners: vi.fn(),
  })),
}));

vi.mock('modules/checkpoint-operations/components/RadioOperatorView', () => ({
  default: () => <div data-testid="radio-operator-view">RadioOperatorView</div>,
}));

vi.mock('modules/checkpoint-operations/components/transfer/BatchShareModal', () => ({
  default: ({ isOpen }) => isOpen ? <div data-testid="batch-share-modal">BatchShareModal</div> : null,
}));

vi.mock('modules/checkpoint-operations/services/TransferService', () => ({
  default: {
    getLastShareTimestamp: vi.fn(() => Promise.resolve(null)),
    buildPayload: vi.fn(() => Promise.resolve({ count: 0 })),
  },
}));

// ─── Render helper ────────────────────────────────────────────────────────────

import TransferService from 'modules/checkpoint-operations/services/TransferService';

// Import AFTER mocks
import CheckpointView from 'views/CheckpointView.jsx';

function renderCheckpointView(checkpointId = '1') {
  return render(
    <MemoryRouter initialEntries={[`/checkpoint/${checkpointId}`]}>
      <Routes>
        <Route path="/checkpoint/:checkpointId" element={<CheckpointView />} />
      </Routes>
    </MemoryRouter>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CheckpointView — 3-tab layout', () => {
  it('renders three tab buttons', () => {
    renderCheckpointView();
    expect(screen.getByRole('button', { name: 'Mark Off' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Callout Sheet' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Overview' })).toBeDefined();
  });

  it('shows RunnerGrid on the default "Mark Off" tab', () => {
    renderCheckpointView();
    expect(screen.getByTestId('runner-grid')).toBeDefined();
  });

  it('does NOT show CalloutSheet initially', () => {
    renderCheckpointView();
    expect(screen.queryByTestId('callout-sheet')).toBeNull();
  });

  it('switches to CalloutSheet when "Callout Sheet" tab is clicked', () => {
    renderCheckpointView();
    fireEvent.click(screen.getByRole('button', { name: 'Callout Sheet' }));
    expect(screen.getByTestId('callout-sheet')).toBeDefined();
    expect(screen.queryByTestId('runner-grid')).toBeNull();
  });

  it('switches to RunnerOverview when "Overview" tab is clicked', () => {
    renderCheckpointView();
    fireEvent.click(screen.getByRole('button', { name: 'Overview' }));
    expect(screen.getByTestId('runner-overview')).toBeDefined();
    expect(screen.queryByTestId('runner-grid')).toBeNull();
  });

  it('switches back to RunnerGrid when "Mark Off" tab is clicked after switching', () => {
    renderCheckpointView();
    fireEvent.click(screen.getByRole('button', { name: 'Callout Sheet' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mark Off' }));
    expect(screen.getByTestId('runner-grid')).toBeDefined();
    expect(screen.queryByTestId('callout-sheet')).toBeNull();
  });

  it('does NOT show a "View Callout Sheet" button (modal pattern removed)', () => {
    renderCheckpointView();
    expect(screen.queryByRole('button', { name: /view callout sheet/i })).toBeNull();
  });

  it('shows the checkpoint number in the heading', () => {
    renderCheckpointView('3');
    expect(screen.getByText('Checkpoint 3')).toBeDefined();
  });

  it('shows "Exit operation" button in header', () => {
    renderCheckpointView();
    expect(screen.getByRole('button', { name: 'Exit operation' })).toBeDefined();
  });
});

describe('CheckpointView — role toggle', () => {
  it('renders Marker and Radio Operator toggle buttons', () => {
    renderCheckpointView();
    expect(screen.getByRole('button', { name: 'Marker' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Radio Operator' })).toBeDefined();
  });

  it('defaults to Marker mode — shows runner grid, not RadioOperatorView', () => {
    renderCheckpointView();
    expect(screen.getByTestId('runner-grid')).toBeDefined();
    expect(screen.queryByTestId('radio-operator-view')).toBeNull();
  });

  it('switching to Radio Operator mode shows RadioOperatorView and hides runner grid', () => {
    renderCheckpointView();
    fireEvent.click(screen.getByRole('button', { name: 'Radio Operator' }));
    expect(screen.getByTestId('radio-operator-view')).toBeDefined();
    expect(screen.queryByTestId('runner-grid')).toBeNull();
  });

  it('switching back to Marker mode shows runner grid again', () => {
    renderCheckpointView();
    fireEvent.click(screen.getByRole('button', { name: 'Radio Operator' }));
    fireEvent.click(screen.getByRole('button', { name: 'Marker' }));
    expect(screen.getByTestId('runner-grid')).toBeDefined();
    expect(screen.queryByTestId('radio-operator-view')).toBeNull();
  });

  it('shows Share Batch button in Marker mode', () => {
    renderCheckpointView();
    expect(screen.getByRole('button', { name: /share batch/i })).toBeDefined();
  });

  it('opens BatchShareModal when Share Batch is clicked', () => {
    renderCheckpointView();
    expect(screen.queryByTestId('batch-share-modal')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /share batch/i }));
    expect(screen.getByTestId('batch-share-modal')).toBeDefined();
  });

  it('does NOT show Share Batch button in Radio Operator mode', () => {
    renderCheckpointView();
    fireEvent.click(screen.getByRole('button', { name: 'Radio Operator' }));
    expect(screen.queryByRole('button', { name: /share batch/i })).toBeNull();
  });
});
