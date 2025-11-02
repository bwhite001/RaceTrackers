import { vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock IndexedDB for Dexie
const indexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn()
};

const IDBKeyRange = {
  bound: vi.fn()
};

global.indexedDB = indexedDB;
global.IDBKeyRange = IDBKeyRange;

// Mock stores initial state factory
export const createMockStores = () => ({
  navigationStore: {
    currentModule: 'none',
    operationStatus: 'idle',
    previousModule: null,
    canExitOperation: true,
    startOperation: vi.fn(),
    endOperation: vi.fn(),
    setModule: vi.fn(),
    forceExitOperation: vi.fn(),
    canNavigateTo: vi.fn().mockReturnValue(true),
    reset: vi.fn()
  },

  raceMaintenanceStore: {
    currentRace: null,
    races: [],
    checkpoints: [],
    loading: false,
    error: null,
    createRace: vi.fn(),
    loadRace: vi.fn(),
    loadCurrentRace: vi.fn(),
    deleteRace: vi.fn(),
    updateCheckpoint: vi.fn(),
    reset: vi.fn()
  },

  checkpointStore: {
    currentRaceId: null,
    checkpointNumber: null,
    runners: [],
    loading: false,
    error: null,
    lastSync: null,
    initializeCheckpoint: vi.fn(),
    loadCheckpointData: vi.fn(),
    updateRunner: vi.fn(),
    markRunner: vi.fn(),
    bulkMarkRunners: vi.fn(),
    exportData: vi.fn(),
    reset: vi.fn()
  },

  baseOperationsStore: {
    currentRaceId: null,
    checkpointNumber: 1,
    runners: [],
    loading: false,
    error: null,
    lastSync: null,
    exportFormat: 'csv',
    initializeBaseStation: vi.fn(),
    loadBaseStationData: vi.fn(),
    updateRunner: vi.fn(),
    markRunner: vi.fn(),
    bulkMarkRunners: vi.fn(),
    exportBaseStationData: vi.fn(),
    generateRaceResults: vi.fn(),
    reset: vi.fn()
  },

  settingsStore: {
    settings: {
      darkMode: false,
      autoRefresh: true,
      refreshInterval: 30,
      defaultCheckpoint: 1,
      currentRaceId: null,
      currentCheckpoint: null,
      currentBaseStationCheckpoint: 1
    },
    loading: false,
    error: null,
    initializeSettings: vi.fn(),
    updateSetting: vi.fn(),
    updateSettings: vi.fn(),
    resetSettings: vi.fn(),
    getSetting: vi.fn(),
    reset: vi.fn()
  }
});

// Mock repository factory
export const createMockRepositories = () => ({
  raceMaintenanceRepository: {
    createRace: vi.fn(),
    getCurrentRace: vi.fn(),
    deleteRace: vi.fn(),
    getCheckpoints: vi.fn(),
    updateCheckpoint: vi.fn()
  },

  checkpointRepository: {
    getCheckpointRunners: vi.fn(),
    initializeCheckpoint: vi.fn(),
    updateRunner: vi.fn(),
    markRunner: vi.fn(),
    bulkMarkRunners: vi.fn(),
    exportCheckpointData: vi.fn()
  },

  baseOperationsRepository: {
    getBaseStationRunners: vi.fn(),
    initializeBaseStation: vi.fn(),
    updateRunner: vi.fn(),
    markRunner: vi.fn(),
    bulkMarkRunners: vi.fn(),
    exportBaseStationData: vi.fn(),
    generateRaceResults: vi.fn()
  },

  settingsRepository: {
    getSetting: vi.fn(),
    saveSetting: vi.fn(),
    getAllSettings: vi.fn(),
    clearSettings: vi.fn()
  }
});

// Test data factory
export const createTestData = () => ({
  race: {
    id: '123',
    name: 'Test Race',
    date: '2024-01-01',
    startTime: '08:00',
    minRunner: 1,
    maxRunner: 100,
    createdAt: new Date().toISOString()
  },

  runners: Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    number: i + 1,
    status: 'not-started',
    recordedTime: null,
    notes: null
  })),

  checkpoints: Array.from({ length: 3 }, (_, i) => ({
    id: i + 1,
    number: i + 1,
    name: `Checkpoint ${i + 1}`
  }))
});

// Helper to simulate timing and async operations
export const waitForAsync = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

// Reset IndexedDB between tests
afterEach(() => {
  indexedDB.deleteDatabase('RaceTrackerDB');
});

// Global error handler for unhandled promises
beforeAll(() => {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (
      args[0]?.includes?.('Warning: ReactDOM.render is no longer supported') ||
      args[0]?.includes?.('Warning: React.createFactory()')
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };
});

// Restore console after all tests
afterAll(() => {
  console.error = console.error;
});
