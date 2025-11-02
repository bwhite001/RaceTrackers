import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import useNavigationStore, { MODULE_TYPES, OPERATION_STATUS } from '../shared/store/navigationStore';
import ProtectedRoute from '../shared/components/ProtectedRoute';
import CheckpointView from '../views/CheckpointView';
import BaseStationView from '../views/BaseStationView';
import RaceSetup from '../components/Setup/RaceSetup';
import Homepage from '../components/Home/Homepage';

// Mock the stores
vi.mock('../shared/store/navigationStore');
vi.mock('../modules/race-maintenance/store/raceMaintenanceStore');
vi.mock('../modules/checkpoint-operations/store/checkpointStore');
vi.mock('../modules/base-operations/store/baseOperationsStore');
vi.mock('../shared/store/settingsStore');

const renderWithRouter = (ui, { route = '/' } = {}) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route
          path="/checkpoint/:checkpointId"
          element={
            <ProtectedRoute moduleType={MODULE_TYPES.CHECKPOINT}>
              <CheckpointView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/base-station/operations"
          element={
            <ProtectedRoute moduleType={MODULE_TYPES.BASE_STATION}>
              <BaseStationView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/race-maintenance/setup"
          element={
            <ProtectedRoute moduleType={MODULE_TYPES.RACE_MAINTENANCE}>
              <RaceSetup />
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
};

describe('Module Isolation', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Default navigation store state
    useNavigationStore.mockImplementation(() => ({
      currentModule: MODULE_TYPES.NONE,
      operationStatus: OPERATION_STATUS.IDLE,
      canNavigateTo: vi.fn().mockReturnValue(true),
      startOperation: vi.fn(),
      endOperation: vi.fn(),
      setModule: vi.fn()
    }));
  });

  describe('Protected Routes', () => {
    test('allows navigation when no operation is in progress', async () => {
      const { container } = renderWithRouter(null, { route: '/checkpoint/1' });
      
      await waitFor(() => {
        expect(container.innerHTML).toContain('Checkpoint 1');
      });
    });

    test('prevents navigation to different module during active operation', async () => {
      // Mock operation in progress
      useNavigationStore.mockImplementation(() => ({
        currentModule: MODULE_TYPES.CHECKPOINT,
        operationStatus: OPERATION_STATUS.IN_PROGRESS,
        canNavigateTo: (moduleType) => moduleType === MODULE_TYPES.CHECKPOINT,
        startOperation: vi.fn(),
        endOperation: vi.fn()
      }));

      renderWithRouter(null, { route: '/base-station/operations' });
      
      await waitFor(() => {
        // Should redirect to home with warning
        expect(screen.getByText(/cannot navigate/i)).toBeInTheDocument();
      });
    });

    test('allows navigation within same module during operation', async () => {
      useNavigationStore.mockImplementation(() => ({
        currentModule: MODULE_TYPES.CHECKPOINT,
        operationStatus: OPERATION_STATUS.IN_PROGRESS,
        canNavigateTo: (moduleType) => moduleType === MODULE_TYPES.CHECKPOINT,
        startOperation: vi.fn(),
        endOperation: vi.fn()
      }));

      const { container } = renderWithRouter(null, { route: '/checkpoint/2' });
      
      await waitFor(() => {
        expect(container.innerHTML).toContain('Checkpoint 2');
      });
    });
  });

  describe('Operation State Management', () => {
    test('starts operation when entering a module', async () => {
      const startOperation = vi.fn();
      useNavigationStore.mockImplementation(() => ({
        currentModule: MODULE_TYPES.NONE,
        operationStatus: OPERATION_STATUS.IDLE,
        canNavigateTo: () => true,
        startOperation,
        endOperation: vi.fn()
      }));

      renderWithRouter(null, { route: '/checkpoint/1' });
      
      await waitFor(() => {
        expect(startOperation).toHaveBeenCalledWith(MODULE_TYPES.CHECKPOINT);
      });
    });

    test('prompts for confirmation when exiting with unsaved changes', async () => {
      const endOperation = vi.fn();
      useNavigationStore.mockImplementation(() => ({
        currentModule: MODULE_TYPES.CHECKPOINT,
        operationStatus: OPERATION_STATUS.IN_PROGRESS,
        canNavigateTo: () => true,
        startOperation: vi.fn(),
        endOperation
      }));

      renderWithRouter(null, { route: '/checkpoint/1' });
      
      // Simulate unsaved changes
      const exitButton = await screen.findByText(/exit checkpoint/i);
      fireEvent.click(exitButton);

      await waitFor(() => {
        expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
      });
    });
  });

  describe('Browser Navigation Protection', () => {
    test('prevents browser back navigation during operation', async () => {
      const preventDefaultMock = vi.fn();
      useNavigationStore.mockImplementation(() => ({
        currentModule: MODULE_TYPES.CHECKPOINT,
        operationStatus: OPERATION_STATUS.IN_PROGRESS,
        canNavigateTo: () => false,
        startOperation: vi.fn(),
        endOperation: vi.fn()
      }));

      renderWithRouter(null, { route: '/checkpoint/1' });

      // Simulate browser back button
      const event = new Event('popstate');
      window.dispatchEvent(event);

      await waitFor(() => {
        // Should still be on checkpoint page
        expect(screen.getByText(/checkpoint 1/i)).toBeInTheDocument();
      });
    });

    test('shows warning when refreshing page during operation', async () => {
      useNavigationStore.mockImplementation(() => ({
        currentModule: MODULE_TYPES.CHECKPOINT,
        operationStatus: OPERATION_STATUS.IN_PROGRESS,
        canNavigateTo: () => false,
        startOperation: vi.fn(),
        endOperation: vi.fn()
      }));

      renderWithRouter(null, { route: '/checkpoint/1' });

      const beforeUnloadEvent = new Event('beforeunload');
      beforeUnloadEvent.preventDefault = vi.fn();
      window.dispatchEvent(beforeUnloadEvent);

      expect(beforeUnloadEvent.preventDefault).toHaveBeenCalled();
      expect(beforeUnloadEvent.returnValue).toBe('');
    });
  });
});
