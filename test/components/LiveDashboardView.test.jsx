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

const { getRaceResults } = vi.hoisted(() => ({ getRaceResults: vi.fn() }));
vi.mock('../../src/modules/base-operations/services/BaseOperationsRepository', () => ({
  BaseOperationsRepository: vi.fn(() => ({ getRaceResults })),
}));

import useBaseOperationsStore from '../../src/modules/base-operations/store/baseOperationsStore.js';
import RaceMaintenanceRepository from '../../src/modules/race-maintenance/services/RaceMaintenanceRepository.js';
import LiveDashboardView from '../../src/views/LiveDashboardView.jsx';

const CHECKPOINTS = [
  { number: 1, name: 'Start' },
  { number: 2, name: 'Mid' },
  { number: 3, name: 'Finish' },
];

const ROWS = [
  { number: 101, status: 'Finished', times: { 1: '2026-11-01T06:30:00.000Z' }, firstName: 'Alice', lastName: 'Smith', gender: 'F' },
  { number: 102, status: 'On course', times: {}, firstName: null, lastName: null },
];

beforeEach(() => {
  vi.clearAllMocks();
  getRaceResults.mockResolvedValue({ race: {}, order: [101, 102], rows: ROWS });
  useBaseOperationsStore.mockReturnValue({
    currentRaceId: 1,
    checkpoints: CHECKPOINTS,
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

  it('renders checkpoint time cells with "—" when no sighting', async () => {
    render(<LiveDashboardView />);
    await waitFor(() => {
      // Bib 102 has no sightings, so its time cells should be "—"
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

  it('counts and times come from base records', async () => {
    render(<LiveDashboardView />);
    expect(await screen.findByText('1/2')).toBeInTheDocument();
    expect(screen.getByText('Finished')).toBeInTheDocument();
    expect(screen.getByText('Not Started')).toBeInTheDocument(); // 102 has no sighting
  });

  it('shows an error, not an empty dashboard, when the read fails', async () => {
    getRaceResults.mockRejectedValue(new Error('db down'));
    render(<LiveDashboardView />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/db down/);
  });
});
