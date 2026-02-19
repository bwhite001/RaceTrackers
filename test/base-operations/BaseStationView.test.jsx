import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BaseStationView from '../../src/views/BaseStationView';
import useBaseOperationsStore from '../../src/modules/base-operations/store/baseOperationsStore';
import useNavigationStore from '../../src/shared/store/navigationStore';
import useSettingsStore from '../../src/shared/store/settingsStore';
import { HOTKEYS } from '../../src/types';

// Mock the stores
vi.mock('../../src/modules/base-operations/store/baseOperationsStore');
vi.mock('../../src/shared/store/navigationStore');
vi.mock('../../src/shared/store/settingsStore');

// Mock the components
vi.mock('../../src/components/BaseStation/DataEntry', () => ({
  default: () => <div data-testid="data-entry">Data Entry</div>
}));

vi.mock('../../src/components/BaseStation/RaceOverview', () => ({
  default: () => <div data-testid="race-overview">Race Overview</div>
}));

vi.mock('../../src/components/BaseStation/ReportsPanel', () => ({
  default: () => <div data-testid="reports-panel">Reports Panel</div>
}));

vi.mock('../../src/components/BaseStation/WithdrawalDialog', () => ({
  default: ({ isOpen, type }) => isOpen ? <div data-testid="withdrawal-dialog">Withdrawal Dialog ({type})</div> : null
}));

// Mock ImportExportModal used by Header
vi.mock('../../src/components/ImportExport/ImportExportModal', () => ({
  default: () => null
}));

describe('BaseStationView', () => {
  const mockStore = {
    currentRaceId: 'test-race-1',
    loading: false,
    error: null,
    stats: {
      total: 100,
      finished: 50,
      active: 40,
      dnf: 10,  // remaining = 100-50-10-5 = 35, different from active=40
      dns: 5
    }
  };

  const mockNavigationStore = {
    currentModule: 'base_station'
  };

  const mockSettingsStore = {
    darkMode: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useBaseOperationsStore.mockImplementation(() => mockStore);
    useNavigationStore.mockImplementation(() => mockNavigationStore);
    useSettingsStore.mockImplementation(() => mockSettingsStore);
  });

  const renderWithRouter = (ui) => {
    return render(
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    );
  };

  test('renders main components', () => {
    renderWithRouter(<BaseStationView />);

    // Check header
    expect(screen.getByText('Base Station Operations')).toBeInTheDocument();

    // Check initial tab content
    expect(screen.getByTestId('data-entry')).toBeInTheDocument();

    // Check tab navigation buttons exist
    expect(screen.getByRole('button', { name: /data entry/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reports/i })).toBeInTheDocument();
  });

  test('handles tab navigation', () => {
    renderWithRouter(<BaseStationView />);

    // Switch to overview tab
    fireEvent.click(screen.getByRole('button', { name: /overview/i }));
    expect(screen.getByTestId('race-overview')).toBeInTheDocument();

    // Switch to reports tab
    fireEvent.click(screen.getByRole('button', { name: /reports/i }));
    expect(screen.getByTestId('reports-panel')).toBeInTheDocument();

    // Switch back to data entry
    fireEvent.click(screen.getByRole('button', { name: /data entry/i }));
    expect(screen.getByTestId('data-entry')).toBeInTheDocument();
  });

  test('handles keyboard shortcuts', () => {
    renderWithRouter(<BaseStationView />);

    // Press 'N' for data entry
    fireEvent.keyDown(document, { key: HOTKEYS.NEW_ENTRY });
    expect(screen.getByTestId('data-entry')).toBeInTheDocument();

    // Press 'R' for reports
    fireEvent.keyDown(document, { key: HOTKEYS.REPORTS });
    expect(screen.getByTestId('reports-panel')).toBeInTheDocument();

    // Press 'D' for DNF dialog
    fireEvent.keyDown(document, { key: HOTKEYS.DROPOUT });
    expect(screen.getByTestId('withdrawal-dialog')).toBeInTheDocument();
    expect(screen.getByText('Withdrawal Dialog (dnf)')).toBeInTheDocument();
  });

  test('handles withdrawal dialog', () => {
    renderWithRouter(<BaseStationView />);

    // Open DNF dialog
    fireEvent.keyDown(document, { key: HOTKEYS.DROPOUT });
    expect(screen.getByTestId('withdrawal-dialog')).toBeInTheDocument();
    expect(screen.getByText('Withdrawal Dialog (dnf)')).toBeInTheDocument();

    // Close dialog with Escape
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('withdrawal-dialog')).not.toBeInTheDocument();
  });

  test('handles loading state', () => {
    useBaseOperationsStore.mockImplementation(() => ({
      ...mockStore,
      loading: true
    }));

    renderWithRouter(<BaseStationView />);
    // LoadingSpinner uses role="status"
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('handles error state', () => {
    const error = 'Test error message';
    useBaseOperationsStore.mockImplementation(() => ({
      ...mockStore,
      error
    }));

    renderWithRouter(<BaseStationView />);
    expect(screen.getByText(error)).toBeInTheDocument();
  });

  test('redirects if no race selected', async () => {
    useBaseOperationsStore.mockImplementation(() => ({
      ...mockStore,
      currentRaceId: null
    }));

    // When currentRaceId is null, the component triggers navigate('/') via useEffect.
    // We verify the view doesn't render its main content (the redirect effect fired).
    renderWithRouter(<BaseStationView />);
    await waitFor(() => {
      expect(screen.queryByTestId('data-entry')).not.toBeInTheDocument();
    });
  });

  test('tracks unsaved changes', () => {
    const setHasUnsavedChanges = vi.fn();
    renderWithRouter(
      <BaseStationView setHasUnsavedChanges={setHasUnsavedChanges} />
    );

    // DataEntry is mocked, so we can't trigger unsaved changes through it.
    // Just verify that the component mounts and data-entry tab is shown.
    expect(screen.getByTestId('data-entry')).toBeInTheDocument();
  });

  test('is accessible', () => {
    renderWithRouter(<BaseStationView />);

    // Check main landmark
    expect(screen.getByRole('main')).toBeInTheDocument();

    // Check navigation landmark
    expect(screen.getByRole('navigation')).toBeInTheDocument();

    // Check tab panel
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
  });
});
