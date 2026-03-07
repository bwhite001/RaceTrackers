import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

// Mock baseOperationsStore
vi.mock('modules/base-operations/store/baseOperationsStore', () => ({
  default: vi.fn(),
}));

// Mock RaceMaintenanceRepository
vi.mock('modules/race-maintenance/services/RaceMaintenanceRepository', () => ({
  default: {
    getBatches: vi.fn(),
  },
}));

// Mock useRaceStore
vi.mock('store/useRaceStore', () => ({
  useRaceStore: vi.fn(() => ({
    raceConfig: null,
    currentRaceId: 1,
  })),
}));

// Mock the dynamic import of the database schema
vi.mock('../../src/shared/services/database/schema', () => ({
  default: {
    checkpoint_runners: {
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn(() => Promise.resolve([])),
        })),
      })),
    },
    runners: {
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn(() => Promise.resolve([
            { id: 1, number: 101, status: 'passed', firstName: 'Alice', lastName: 'Smith' },
            { id: 2, number: 102, status: 'not-started', firstName: null, lastName: null },
          ])),
        })),
      })),
    },
  },
}));

import useBaseOperationsStore from '../../src/modules/base-operations/store/baseOperationsStore.js';
import RaceMaintenanceRepository from '../../src/modules/race-maintenance/services/RaceMaintenanceRepository.js';
import LiveDashboardView from '../../src/views/LiveDashboardView.jsx';

const CHECKPOINTS = [
  { number: 1, name: 'Start' },
  { number: 2, name: 'Mid' },
  { number: 3, name: 'Finish' },
];

const RUNNERS = [
  { number: 101, status: 'passed', firstName: 'Alice', lastName: 'Smith' },
  { number: 102, status: 'not-started', firstName: null, lastName: null },
];

beforeEach(() => {
  vi.clearAllMocks();
  useBaseOperationsStore.mockReturnValue({
    currentRaceId: 1,
    checkpoints: CHECKPOINTS,
    runners: RUNNERS,
    loadBaseStationData: vi.fn(),
  });
  RaceMaintenanceRepository.getBatches.mockResolvedValue([]);
});

describe('LiveDashboardView', () => {
  it('renders the "Live Dashboard" heading', async () => {
    render(<LiveDashboardView />);
    await waitFor(() => {
      expect(screen.getByText('Live Dashboard')).toBeInTheDocument();
    });
  });

  it('renders checkpoint column headers for each checkpoint', async () => {
    render(<LiveDashboardView />);
    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: /CP1/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /CP2/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /CP3/i })).toBeInTheDocument();
    });
  });

  it('renders a row for each runner', async () => {
    render(<LiveDashboardView />);
    await waitFor(() => {
      expect(screen.getByText('#101')).toBeInTheDocument();
      expect(screen.getByText('#102')).toBeInTheDocument();
    });
  });

  it('shows runner names when PII toggle is enabled', async () => {
    const { getByRole } = render(<LiveDashboardView />);
    await waitFor(() => expect(screen.getByText('#101')).toBeInTheDocument());
    getByRole('button', { name: /show names/i }).click();
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });
  });

  it('shows checkpoint summary buttons for each checkpoint', async () => {
    render(<LiveDashboardView />);
    await waitFor(() => {
      expect(screen.getAllByText(/CP1/i).length).toBeGreaterThan(0);
    });
  });

  it('renders checkpoint time cells with "—" when no commonTime data', async () => {
    render(<LiveDashboardView />);
    await waitFor(() => {
      // With no checkpoint_runners, all time cells should be "—"
      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThan(0);
    });
  });

  it('renders a bib cell for each runner', async () => {
    render(<LiveDashboardView />);
    await waitFor(() => {
      expect(screen.getAllByText(/^#\d+/).length).toBeGreaterThanOrEqual(2);
    });
  });
});
