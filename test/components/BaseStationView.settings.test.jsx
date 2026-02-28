/**
 * Tests that BaseStationView properly opens SettingsModal and HelpDialog
 * when the header settings/help buttons are clicked.
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// ─── Store / dependency mocks ─────────────────────────────────────────────────

vi.mock('shared/store/navigationStore', () => ({
  default: vi.fn(() => ({
    startOperation: vi.fn(),
    endOperation: vi.fn(),
    canNavigateTo: vi.fn(() => true),
    operationStatus: 'IDLE',
  })),
  MODULE_TYPES: { BASE_STATION: 'base-station' },
  OPERATION_STATUS: { IDLE: 'IDLE', IN_PROGRESS: 'IN_PROGRESS' },
}));

vi.mock('modules/base-operations/store/baseOperationsStore', () => ({
  default: vi.fn(() => ({
    currentRaceId: 'race-1',
    loading: false,
    error: null,
    stats: { total: 0, passed: 0, dnf: 0, notStarted: 0 },
  })),
}));

vi.mock('shared/store/settingsStore', () => ({
  default: vi.fn(() => ({
    darkMode: false,
    updateSetting: vi.fn(),
  })),
}));

vi.mock('shared/components/HotkeysProvider', () => ({
  default: ({ children }) => <div>{children}</div>,
  useHotkeys: vi.fn(),
}));

// ─── Component mocks ──────────────────────────────────────────────────────────

vi.mock('components/BaseStation/DataEntry', () => ({ default: () => <div>DataEntry</div> }));
vi.mock('components/BaseStation/RaceOverview', () => ({ default: () => <div>RaceOverview</div> }));
vi.mock('components/BaseStation/ReportsPanel', () => ({ default: () => <div>ReportsPanel</div> }));
vi.mock('components/BaseStation/WithdrawalDialog', () => ({ default: () => null }));
vi.mock('components/Layout/LoadingSpinner', () => ({ default: () => <div>Loading…</div> }));
vi.mock('components/Layout/ErrorMessage', () => ({ default: ({ message }) => <div>{message}</div> }));
vi.mock('components/Layout/StatusStrip', () => ({ default: () => null }));

let capturedSettingsProps = null;
let capturedHelpProps = null;

vi.mock('components/Settings/SettingsModal', () => ({
  default: (props) => {
    capturedSettingsProps = props;
    return props.isOpen ? <div data-testid="settings-modal">SettingsModal</div> : null;
  },
}));

vi.mock('modules/base-operations/components/HelpDialog', () => ({
  default: (props) => {
    capturedHelpProps = props;
    return props.isOpen ? <div data-testid="help-dialog">HelpDialog</div> : null;
  },
}));

// Header mock that exposes settings and help buttons
vi.mock('components/Layout/Header', () => ({
  default: ({ onOpenSettings, onOpenHelp }) => (
    <header>
      <button onClick={onOpenSettings}>Settings</button>
      <button onClick={onOpenHelp}>Help</button>
    </header>
  ),
}));

vi.mock('shared/components/ExitOperationModal', () => ({
  withOperationExit: (Component) => (props) =>
    <Component {...props} onExitAttempt={vi.fn()} setHasUnsavedChanges={vi.fn()} />,
}));

import BaseStationView from 'views/BaseStationView.jsx';

// ─── Tests ────────────────────────────────────────────────────────────────────

function renderView() {
  return render(
    <MemoryRouter>
      <BaseStationView />
    </MemoryRouter>
  );
}

describe('BaseStationView — settings and help', () => {
  beforeEach(() => {
    capturedSettingsProps = null;
    capturedHelpProps = null;
  });

  it('settings modal is NOT open initially', () => {
    renderView();
    expect(screen.queryByTestId('settings-modal')).toBeNull();
  });

  it('opens SettingsModal when Settings button is clicked', () => {
    renderView();
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByTestId('settings-modal')).toBeDefined();
  });

  it('closes SettingsModal when onClose is called', () => {
    renderView();
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(capturedSettingsProps).not.toBeNull();
    act(() => { capturedSettingsProps.onClose(); });
    expect(screen.queryByTestId('settings-modal')).toBeNull();
  });

  it('help dialog is NOT open initially', () => {
    renderView();
    expect(screen.queryByTestId('help-dialog')).toBeNull();
  });

  it('opens HelpDialog when Help button is clicked', () => {
    renderView();
    fireEvent.click(screen.getByRole('button', { name: 'Help' }));
    expect(screen.getByTestId('help-dialog')).toBeDefined();
  });

  it('closes HelpDialog when onClose is called', () => {
    renderView();
    fireEvent.click(screen.getByRole('button', { name: 'Help' }));
    expect(capturedHelpProps).not.toBeNull();
    act(() => { capturedHelpProps.onClose(); });
    expect(screen.queryByTestId('help-dialog')).toBeNull();
  });
});
