import React from 'react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BaseStationView from '../../views/BaseStationView';
import useBaseOperationsStore from '../../modules/base-operations/store/baseOperationsStore';
import { HOTKEYS } from '../../types';

// Mock the store
vi.mock('../../modules/base-operations/store/baseOperationsStore');

// Mock child components
vi.mock('../../components/BaseStation/DataEntry', () => ({
  default: () => <div data-testid="data-entry">Data Entry Component</div>
}));

vi.mock('../../components/BaseStation/RaceOverview', () => ({
  default: () => <div data-testid="race-overview">Race Overview Component</div>
}));

vi.mock('../../components/BaseStation/ReportsPanel', () => ({
  default: () => <div data-testid="reports-panel">Reports Panel Component</div>
}));

vi.mock('../../components/Layout/Header', () => ({
  default: ({ title }) => <header data-testid="header">{title}</header>
}));

vi.mock('../../components/Layout/StatusStrip', () => ({
  default: () => <div data-testid="status-strip">Status Strip Component</div>
}));

// Test wrapper component
const TestWrapper = ({ children }) => (
  <MemoryRouter>
    {children}
  </MemoryRouter>
);

describe('BaseStationView', () => {
  const mockStore = {
    initialize: vi.fn(),
    currentRaceId: 'test-race-1',
    loading: false,
    error: null,
    stats: {
      total: 100,
      finished: 50,
      active: 40,
      dnf: 5,
      dns: 5
    },
    lastSync: '2023-01-01T12:00:00Z'
  };

  beforeEach(() => {
    useBaseOperationsStore.mockImplementation(() => mockStore);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('initializes base station on mount', async () => {
    render(<BaseStationView />, { wrapper: TestWrapper });
    expect(mockStore.initialize).toHaveBeenCalled();
  });

  test('displays loading state', () => {
    useBaseOperationsStore.mockImplementation(() => ({
      ...mockStore,
      loading: true
    }));

    render(<BaseStationView />, { wrapper: TestWrapper });
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('displays error state', () => {
    useBaseOperationsStore.mockImplementation(() => ({
      ...mockStore,
      error: 'Test error message'
    }));

    render(<BaseStationView />, { wrapper: TestWrapper });
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  test('displays no active race message when no race is selected', () => {
    useBaseOperationsStore.mockImplementation(() => ({
      ...mockStore,
      currentRaceId: null
    }));

    render(<BaseStationView />, { wrapper: TestWrapper });
    expect(screen.getByText('No active race selected')).toBeInTheDocument();
  });

  test('renders main interface when race is active', () => {
    render(<BaseStationView />, { wrapper: TestWrapper });

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('data-entry')).toBeInTheDocument();
    expect(screen.getByTestId('status-strip')).toBeInTheDocument();
  });

  test('handles tab navigation', () => {
    render(<BaseStationView />, { wrapper: TestWrapper });

    // Initially shows data entry
    expect(screen.getByTestId('data-entry')).toBeInTheDocument();

    // Switch to overview
    fireEvent.click(screen.getByText('Overview'));
    expect(screen.getByTestId('race-overview')).toBeInTheDocument();

    // Switch to reports
    fireEvent.click(screen.getByText('Reports'));
    expect(screen.getByTestId('reports-panel')).toBeInTheDocument();
  });

  test('handles keyboard shortcuts', () => {
    render(<BaseStationView />, { wrapper: TestWrapper });

    // Switch to reports with keyboard shortcut
    fireEvent.keyDown(document, { key: HOTKEYS.REPORTS });
    expect(screen.getByTestId('reports-panel')).toBeInTheDocument();

    // Switch back to data entry with keyboard shortcut
    fireEvent.keyDown(document, { key: HOTKEYS.NEW_ENTRY });
    expect(screen.getByTestId('data-entry')).toBeInTheDocument();
  });

  test('handles tab cycling with keyboard', () => {
    render(<BaseStationView />, { wrapper: TestWrapper });

    // Start at data entry
    expect(screen.getByTestId('data-entry')).toBeInTheDocument();

    // Cycle forward
    fireEvent.keyDown(document, { key: 'ArrowRight', ctrlKey: true });
    expect(screen.getByTestId('race-overview')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'ArrowRight', ctrlKey: true });
    expect(screen.getByTestId('reports-panel')).toBeInTheDocument();

    // Cycle back to data entry
    fireEvent.keyDown(document, { key: 'ArrowRight', ctrlKey: true });
    expect(screen.getByTestId('data-entry')).toBeInTheDocument();
  });

  test('prompts for unsaved changes when exiting', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);
    
    render(<BaseStationView />, { wrapper: TestWrapper });

    // Simulate unsaved changes
    const dataEntry = screen.getByTestId('data-entry');
    fireEvent.change(dataEntry, { target: { value: 'new data' } });

    // Try to exit
    fireEvent.click(screen.getByText('Exit'));

    expect(confirmSpy).toHaveBeenCalledWith(
      'You have unsaved changes. Are you sure you want to leave?'
    );

    confirmSpy.mockRestore();
  });

  test('updates status strip with latest stats', async () => {
    const updatedStats = {
      ...mockStore.stats,
      finished: 51
    };

    useBaseOperationsStore.mockImplementation(() => ({
      ...mockStore,
      stats: updatedStats
    }));

    render(<BaseStationView />, { wrapper: TestWrapper });

    const statusStrip = screen.getByTestId('status-strip');
    expect(statusStrip).toHaveTextContent('51'); // Check for updated finished count
  });

  test('handles errors during initialization', async () => {
    const error = new Error('Failed to initialize');
    useBaseOperationsStore.mockImplementation(() => ({
      ...mockStore,
      initialize: vi.fn().mockRejectedValue(error)
    }));

    render(<BaseStationView />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Failed to initialize base station:',
        error
      );
    });
  });
});
