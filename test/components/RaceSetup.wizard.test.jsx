import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

import RaceSetup from '../../src/components/Setup/RaceSetup';

describe('RaceSetup wizard — course map step', () => {
  it('renders "Step 1 of 5" label when template step is active', () => {
    render(<MemoryRouter><RaceSetup /></MemoryRouter>);
    expect(screen.getByText(/step 1 of 5/i)).toBeInTheDocument();
  });
});
