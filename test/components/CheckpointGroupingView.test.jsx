import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('modules/base-operations/store/baseOperationsStore', () => ({
  default: vi.fn(() => ({ currentRaceId: 'race-1' })),
}));

const mockDbQuery = vi.fn();
vi.mock('shared/services/database/schema', () => ({
  default: {
    imported_checkpoint_results: {
      where: () => ({ equals: () => ({ toArray: mockDbQuery }) }),
    },
  },
}));

import CheckpointGroupingView from 'components/BaseStation/CheckpointGroupingView.jsx';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CP2_DATA = {
  checkpointNumber: 2,
  runners: [
    { number: 101, status: 'PASSED', markOffTime: '2024-01-01T10:05:00.000Z', callInTime: null },
    { number: 102, status: 'NOT_STARTED', markOffTime: null, callInTime: null },
  ],
};

const CP3_DATA = {
  checkpointNumber: 3,
  runners: [
    { number: 101, status: 'PASSED', markOffTime: '2024-01-01T10:30:00.000Z', callInTime: null },
  ],
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CheckpointGroupingView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows empty state when no data imported', async () => {
    mockDbQuery.mockResolvedValue([]);
    render(<CheckpointGroupingView />);
    await waitFor(() =>
      expect(screen.getByText(/no checkpoint data imported yet/i)).toBeDefined()
    );
  });

  it('renders checkpoint column headers in matrix view', async () => {
    mockDbQuery.mockResolvedValue([CP2_DATA, CP3_DATA]);
    render(<CheckpointGroupingView />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /CP 2/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /CP 3/i })).toBeDefined();
    });
  });

  it('renders all unique runner numbers in matrix view', async () => {
    mockDbQuery.mockResolvedValue([CP2_DATA, CP3_DATA]);
    render(<CheckpointGroupingView />);
    // CP2 has 101 and 102, CP3 has 101 — union is 101, 102
    await waitFor(() => {
      const cells = screen.getAllByText('101');
      expect(cells.length).toBeGreaterThan(0);
      const cells2 = screen.getAllByText('102');
      expect(cells2.length).toBeGreaterThan(0);
    });
  });

  it('shows "—" for runners not seen at a checkpoint', async () => {
    mockDbQuery.mockResolvedValue([CP2_DATA, CP3_DATA]);
    render(<CheckpointGroupingView />);
    // Runner 102 is not in CP3, so "—" should appear at least once
    await waitFor(() => {
      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThan(0);
    });
  });

  it('switches to drilldown view when a checkpoint header is clicked', async () => {
    mockDbQuery.mockResolvedValue([CP2_DATA]);
    render(<CheckpointGroupingView />);
    await waitFor(() => screen.getByRole('button', { name: /CP 2/i }));
    fireEvent.click(screen.getByRole('button', { name: /CP 2/i }));
    expect(screen.getByText(/checkpoint 2 — 2 runners/i)).toBeDefined();
  });

  it('drilldown shows runner rows with status and times', async () => {
    mockDbQuery.mockResolvedValue([CP2_DATA]);
    render(<CheckpointGroupingView />);
    await waitFor(() => screen.getByRole('button', { name: /CP 2/i }));
    fireEvent.click(screen.getByRole('button', { name: /CP 2/i }));
    expect(screen.getByText('PASSED')).toBeDefined();
    expect(screen.getByText('NOT_STARTED')).toBeDefined();
  });

  it('"Back to matrix" button returns to matrix view', async () => {
    mockDbQuery.mockResolvedValue([CP2_DATA]);
    render(<CheckpointGroupingView />);
    await waitFor(() => screen.getByRole('button', { name: /CP 2/i }));
    fireEvent.click(screen.getByRole('button', { name: /CP 2/i }));
    fireEvent.click(screen.getByRole('button', { name: /back to matrix/i }));
    // Should be back in matrix — CP 2 header should reappear
    expect(screen.getByRole('button', { name: /CP 2/i })).toBeDefined();
  });
});
