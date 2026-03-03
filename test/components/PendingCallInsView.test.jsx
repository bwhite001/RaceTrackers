import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

// Mock baseOperationsStore
vi.mock('modules/base-operations/store/baseOperationsStore', () => ({
  default: vi.fn(),
}));

// Mock CheckpointRepository
vi.mock('modules/checkpoint-operations/services/CheckpointRepository', () => ({
  default: {
    getCheckpointRunners: vi.fn(),
    markGroupCalledIn: vi.fn(),
  },
}));

import useBaseOperationsStore from '../../src/modules/base-operations/store/baseOperationsStore.js';
import CheckpointRepository from '../../src/modules/checkpoint-operations/services/CheckpointRepository.js';
import PendingCallInsView from '../../src/views/PendingCallInsView.jsx';

const CHECKPOINTS = [
  { number: 1, name: 'Start' },
  { number: 2, name: 'Mid' },
];

const UNCALLED_RUNNERS = [
  {
    number: 101,
    status: 'passed',
    commonTimeLabel: '07:40–07:45',
    commonTime: '2024-01-01T07:40:00.000Z',
    calledIn: false,
  },
  {
    number: 102,
    status: 'passed',
    commonTimeLabel: '07:40–07:45',
    commonTime: '2024-01-01T07:40:00.000Z',
    calledIn: false,
  },
];

const CALLED_RUNNERS = [
  {
    number: 103,
    status: 'passed',
    commonTimeLabel: '07:30–07:35',
    commonTime: '2024-01-01T07:30:00.000Z',
    calledIn: true,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  useBaseOperationsStore.mockReturnValue({
    currentRaceId: 1,
    checkpoints: CHECKPOINTS,
  });
  CheckpointRepository.getCheckpointRunners.mockResolvedValue([]);
  CheckpointRepository.markGroupCalledIn.mockResolvedValue(undefined);
});

describe('PendingCallInsView', () => {
  it('renders checkpoint tabs for each checkpoint', async () => {
    render(<PendingCallInsView />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /CP1/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /CP2/i })).toBeInTheDocument();
    });
  });

  it('shows uncalled groups in the Pending section', async () => {
    CheckpointRepository.getCheckpointRunners.mockResolvedValue(UNCALLED_RUNNERS);
    render(<PendingCallInsView />);
    await waitFor(() => {
      expect(screen.getByText('07:40–07:45')).toBeInTheDocument();
    });
    // Check for "Pending (1 group)" style header
    expect(screen.getAllByText(/pending/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /mark called in/i })).toBeInTheDocument();
  });

  it('shows calledIn groups in the Called In section', async () => {
    CheckpointRepository.getCheckpointRunners.mockResolvedValue(CALLED_RUNNERS);
    render(<PendingCallInsView />);
    await waitFor(() => {
      expect(screen.getByText('07:30–07:35')).toBeInTheDocument();
    });
    // Both the section header "Called In (1)" and the row "✓ Called In" should be present
    expect(screen.getAllByText(/called in/i).length).toBeGreaterThan(0);
  });

  it('hides calledIn groups from the pending section', async () => {
    CheckpointRepository.getCheckpointRunners.mockResolvedValue(CALLED_RUNNERS);
    render(<PendingCallInsView />);
    await waitFor(() => {
      expect(screen.getByText(/all groups called in/i)).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /mark called in/i })).not.toBeInTheDocument();
  });

  it('shows "All groups called in" message when no pending groups', async () => {
    CheckpointRepository.getCheckpointRunners.mockResolvedValue([]);
    render(<PendingCallInsView />);
    await waitFor(() => {
      expect(screen.getByText(/all groups called in/i)).toBeInTheDocument();
    });
  });

  it('clicking Mark Called In calls markGroupCalledIn and reloads runners', async () => {
    // First call returns uncalled runners, second call returns them as called
    const calledVersion = UNCALLED_RUNNERS.map(r => ({ ...r, calledIn: true }));
    CheckpointRepository.getCheckpointRunners
      .mockResolvedValueOnce(UNCALLED_RUNNERS)
      .mockResolvedValueOnce(calledVersion);

    render(<PendingCallInsView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /mark called in/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /mark called in/i }));

    await waitFor(() => {
      expect(CheckpointRepository.markGroupCalledIn).toHaveBeenCalledWith(
        1,
        1,
        '07:40–07:45'
      );
    });

    // After reload, runners should be called in — pending button gone
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /mark called in/i })).not.toBeInTheDocument();
    });
  });
});
