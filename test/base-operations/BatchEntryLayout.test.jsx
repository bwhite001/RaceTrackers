import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('modules/base-operations/store/baseOperationsStore');
vi.mock('store/useRaceStore', () => ({
  useRaceStore: vi.fn(),
}));

import useBaseOperationsStore from 'modules/base-operations/store/baseOperationsStore';
import { useRaceStore } from 'store/useRaceStore';
import BatchEntryLayout from 'modules/base-operations/components/BatchEntryLayout';

describe('BatchEntryLayout', () => {
  beforeEach(() => {
    useBaseOperationsStore.mockReturnValue({
      currentRaceId: 'r1',
      runners: [
        { number: 42, checkpointNumber: 3, status: 'passed' },
        { number: 1,  checkpointNumber: 1, status: 'passed' },
      ],
      sessionBatches: [],
      submitRadioBatch: vi.fn().mockResolvedValue(),
      voidSessionBatch: vi.fn(),
      loading: false,
    });
    useRaceStore.mockReturnValue({
      checkpoints: [{ number: 1, name: 'Start' }, { number: 3, name: 'Ridgeline' }],
      runners: [{ number: 1 }, { number: 42 }, { number: 100 }],
    });
  });

  it('renders entry pane and history pane', () => {
    render(<BatchEntryLayout onUnsavedChanges={vi.fn()} />, { wrapper: MemoryRouter });
    expect(screen.getAllByRole('combobox', { name: /checkpoint/i })[0]).toBeInTheDocument();
    expect(screen.getByText(/no batches/i)).toBeInTheDocument();
  });
});
