import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('modules/base-operations/store/baseOperationsStore', () => ({
  default: vi.fn(() => ({ currentRaceId: 1 })),
}));

vi.mock('store/useRaceStore', () => ({
  useRaceStore: vi.fn(() => ({
    checkpoints: [
      { number: 1, name: 'CP1' },
      { number: 2, name: 'CP2' },
    ],
  })),
}));

vi.mock('shared/services/database/schema', () => ({
  default: {
    imported_checkpoint_results: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      }),
    },
  },
}));

import CheckpointImportPanel from 'modules/base-operations/components/CheckpointImportPanel';
import useBaseOperationsStore from 'modules/base-operations/store/baseOperationsStore';
import { useRaceStore } from 'store/useRaceStore';

describe('CheckpointImportPanel', () => {
  it('shows a status card per checkpoint', async () => {
    render(<CheckpointImportPanel />);
    expect(await screen.findByText('CP1')).toBeInTheDocument();
    expect(screen.getByText('CP2')).toBeInTheDocument();
  });

  it('shows Not Imported badge for each checkpoint initially', async () => {
    render(<CheckpointImportPanel />);
    await screen.findByText('CP1');
    const badges = screen.getAllByText(/not imported/i);
    expect(badges.length).toBe(2);
  });

  it('shows import button for each checkpoint', async () => {
    render(<CheckpointImportPanel />);
    await screen.findByText('CP1');
    const importButtons = screen.getAllByRole('button', { name: /import/i });
    expect(importButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('shows count summary header', async () => {
    render(<CheckpointImportPanel />);
    expect(await screen.findByText(/0 \/ 2 imported/i)).toBeInTheDocument();
  });
});
