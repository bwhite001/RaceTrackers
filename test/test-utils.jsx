import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

// ============================================================================
// ROUTER UTILITIES
// ============================================================================

/**
 * Renders a component wrapped in MemoryRouter for testing components that use router hooks
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Render options
 * @param {string} options.initialRoute - Initial route path (default: '/')
 * @param {Array<string>} options.initialEntries - Initial history entries
 * @param {Object} options.renderOptions - Additional options to pass to render()
 * @returns {Object} - Render result with additional utilities
 */
export function renderWithRouter(ui, { initialRoute = '/', initialEntries, ...renderOptions } = {}) {
  const entries = initialEntries || [initialRoute];
  
  const Wrapper = ({ children }) => (
    <MemoryRouter initialEntries={entries}>
      {children}
    </MemoryRouter>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// ============================================================================
// STORE MOCK UTILITIES
// ============================================================================

/**
 * Creates a default mock for useRaceStore
 */
export const createMockRaceStore = (overrides = {}) => ({
  // State
  raceConfig: null,
  mode: 'setup',
  currentCheckpoint: null,
  runners: [],
  isLoading: false,
  error: null,
  
  // Actions
  createRace: vi.fn(),
  setMode: vi.fn(),
  setCurrentCheckpoint: vi.fn(),
  getAllRaces: vi.fn().mockResolvedValue([]),
  switchToRace: vi.fn(),
  deleteRace: vi.fn(),
  clearError: vi.fn(),
  getRunnerCounts: vi.fn(() => ({
    total: 0,
    notStarted: 0,
    passed: 0,
    nonStarter: 0,
    dnf: 0
  })),
  
  // Override with custom values
  ...overrides
});

/**
 * Creates a default mock for useNavigationStore
 */
export const createMockNavigationStore = (overrides = {}) => ({
  // State
  currentModule: 'NONE',
  operationStatus: 'IDLE',
  previousModule: null,
  
  // Actions
  startOperation: vi.fn(),
  endOperation: vi.fn(),
  forceExit: vi.fn(),
  canNavigateTo: vi.fn().mockReturnValue(true),
  setModule: vi.fn(),
  reset: vi.fn(),
  
  // Override with custom values
  ...overrides
});

/**
 * Creates a default mock for useSettingsStore
 */
export const createMockSettingsStore = (overrides = {}) => ({
  // State
  darkMode: false,
  fontSize: 16,
  statusColors: {
    notStarted: '#6B7280',
    passed: '#10B981',
    nonStarter: '#EF4444',
    dnf: '#F59E0B'
  },
  
  // Actions
  toggleDarkMode: vi.fn(),
  setFontSize: vi.fn(),
  updateStatusColor: vi.fn(),
  initializeSettings: vi.fn(),
  updateSetting: vi.fn(),
  
  // Override with custom values
  ...overrides
});

/**
 * Creates a default mock for useBaseOperationsStore
 */
export const createMockBaseOperationsStore = (overrides = {}) => ({
  // State
  currentRaceId: null,
  checkpointNumber: 1,
  runners: [],
  loading: false,
  error: null,
  lastSync: null,
  exportFormat: 'csv',
  deletedEntries: [],
  duplicateEntries: [],
  strapperCalls: [],
  missingRunners: [],
  outList: [],
  sortOrder: 'default',
  
  // Actions
  setLoading: vi.fn(),
  setError: vi.fn(),
  setExportFormat: vi.fn(),
  setSortOrder: vi.fn(),
  initializeBaseStation: vi.fn(),
  loadBaseStationData: vi.fn(),
  updateRunner: vi.fn(),
  markRunner: vi.fn(),
  bulkMarkRunners: vi.fn(),
  exportBaseStationData: vi.fn(),
  generateRaceResults: vi.fn(),
  withdrawRunner: vi.fn(),
  reverseWithdrawal: vi.fn(),
  vetOutRunner: vi.fn(),
  addStrapperCall: vi.fn(),
  loadStrapperCalls: vi.fn(),
  updateStrapperCall: vi.fn(),
  completeStrapperCall: vi.fn(),
  deleteStrapperCall: vi.fn(),
  deleteEntry: vi.fn(),
  loadDeletedEntries: vi.fn(),
  restoreEntry: vi.fn(),
  getAuditLog: vi.fn(),
  loadDuplicateEntries: vi.fn(),
  resolveDuplicate: vi.fn(),
  loadMissingRunners: vi.fn(),
  loadOutList: vi.fn(),
  generateMissingNumbersReport: vi.fn(),
  generateOutListReport: vi.fn(),
  generateCheckpointLogReport: vi.fn(),
  downloadReport: vi.fn(),
  reset: vi.fn(),
  
  // Override with custom values
  ...overrides
});

/**
 * Creates a default mock for useCheckpointStore
 */
export const createMockCheckpointStore = (overrides = {}) => ({
  // State
  currentRaceId: null,
  currentCheckpoint: null,
  runners: [],
  loading: false,
  error: null,
  lastSync: null,
  
  // Actions
  setLoading: vi.fn(),
  setError: vi.fn(),
  initializeCheckpoint: vi.fn(),
  loadCheckpointData: vi.fn(),
  updateRunner: vi.fn(),
  markRunner: vi.fn(),
  bulkMarkRunners: vi.fn(),
  exportCheckpointData: vi.fn(),
  reset: vi.fn(),
  
  // Override with custom values
  ...overrides
});

/**
 * Creates a default mock for useRaceMaintenanceStore
 */
export const createMockRaceMaintenanceStore = (overrides = {}) => ({
  // State
  currentRace: null,
  races: [],
  loading: false,
  error: null,
  
  // Actions
  setLoading: vi.fn(),
  setError: vi.fn(),
  loadCurrentRace: vi.fn(),
  loadAllRaces: vi.fn(),
  createRace: vi.fn(),
  updateRace: vi.fn(),
  deleteRace: vi.fn(),
  switchRace: vi.fn(),
  reset: vi.fn(),
  
  // Override with custom values
  ...overrides
});

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

/**
 * Creates a mock race configuration
 */
export const createMockRace = (overrides = {}) => ({
  id: '1',
  name: 'Test Marathon 2025',
  date: '2025-07-13',
  startTime: '08:00',
  minRunner: 100,
  maxRunner: 150,
  checkpoints: [
    { name: 'Checkpoint 1', number: 1 },
    { name: 'Checkpoint 2', number: 2 }
  ],
  createdAt: '2025-07-13T10:00:00Z',
  ...overrides
});

/**
 * Creates a mock runner
 */
export const createMockRunner = (overrides = {}) => ({
  id: '1',
  raceId: '1',
  number: 100,
  status: 'not-started',
  checkpointNumber: 1,
  commonTime: null,
  notes: '',
  ...overrides
});

/**
 * Creates multiple mock runners
 */
export const createMockRunners = (count, startNumber = 100) => {
  return Array.from({ length: count }, (_, i) => 
    createMockRunner({ 
      id: String(i + 1),
      number: startNumber + i 
    })
  );
};

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Waits for async operations to complete
 */
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Creates a mock file for file upload testing
 */
export const createMockFile = (content, filename = 'test.csv', type = 'text/csv') => {
  const blob = new Blob([content], { type });
  return new File([blob], filename, { type });
};

/**
 * Simulates a delay (useful for testing loading states)
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Creates a mock event object
 */
export const createMockEvent = (overrides = {}) => ({
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  target: { value: '' },
  ...overrides
});

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Checks if a function was called with partial arguments
 */
export const toHaveBeenCalledWithPartial = (mockFn, partialArgs) => {
  const calls = mockFn.mock.calls;
  return calls.some(call => {
    return Object.keys(partialArgs).every(key => {
      return call[0] && call[0][key] === partialArgs[key];
    });
  });
};

/**
 * Gets the last call arguments of a mock function
 */
export const getLastCallArgs = (mockFn) => {
  const calls = mockFn.mock.calls;
  return calls.length > 0 ? calls[calls.length - 1] : null;
};

// ============================================================================
// EXPORTS
// ============================================================================

// Re-export everything from @testing-library/react for convenience
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
