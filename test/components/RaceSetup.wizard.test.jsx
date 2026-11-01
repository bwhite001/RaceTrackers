import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock all stores and components CourseMapStep depends on
vi.mock('../../src/modules/race-maintenance/store/raceMaintenanceStore', () => ({
  default: () => ({ createRace: vi.fn().mockResolvedValue(1), loading: false, error: null }),
}));
vi.mock('../../src/shared/store/navigationStore', () => ({
  default: () => ({
    startOperation: vi.fn(),
    endOperation: vi.fn(),
    canNavigateTo: () => true,
    operationStatus: 'idle',
    currentModule: null,
  }),
  MODULE_TYPES: { RACE_MAINTENANCE: 'race-maintenance' },
  OPERATION_STATUS: { IDLE: 'idle', IN_PROGRESS: 'in_progress' },
}));
vi.mock('../../src/shared/components/ExitOperationModal', () => ({
  withOperationExit: (C) => (props) => React.createElement(C, {
    ...props,
    setHasUnsavedChanges: vi.fn(),
    onExitAttempt: vi.fn(),
  }),
}));

// Leaflet doesn't render in jsdom, and this test is about the GPX reaching the step
vi.mock('../../src/components/Setup/CoursePreviewMap', () => ({ default: () => null }));

import RaceSetup from '../../src/components/Setup/RaceSetup';

describe('RaceSetup wizard — course map step', () => {
  it('renders "Step 1 of 5" label when template step is active', () => {
    render(<MemoryRouter><RaceSetup /></MemoryRouter>);
    expect(screen.getByText(/step 1 of 5/i)).toBeInTheDocument();
  });

  it('carries the template course through to the Course Map step', async () => {
    render(<MemoryRouter><RaceSetup /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /mt glorious mountain trail/i }));
    fireEvent.change(await screen.findByLabelText(/race date/i), { target: { value: '2026-11-08' } });
    fireEvent.click(screen.getByRole('button', { name: /next: runner setup/i }));
    fireEvent.click(await screen.findByRole('checkbox', { name: /on the day/i }));
    fireEvent.click(screen.getByRole('button', { name: /next: waves/i }));
    fireEvent.click(await screen.findByRole('button', { name: /next: course map/i }));
    expect(await screen.findByText(/GPX loaded/)).toBeInTheDocument();
  });
});
