import { create } from 'zustand';
import BaseOperationsRepository from '../services/BaseOperationsRepository';
import SettingsRepository from '../../../shared/services/database/SettingsRepository';
import { RUNNER_STATUS } from '../../../shared/types/store.types';

const useBaseOperationsStore = create((set, get) => ({
  // State
  currentRaceId: null,
  checkpointNumber: 1, // Base station typically monitors checkpoint 1
  runners: [],
  loading: false,
  error: null,
  lastSync: null,
  exportFormat: 'csv',

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setExportFormat: (format) => set({ exportFormat: format }),

  // Initialize base station
  initializeBaseStation: async (raceId, checkpointNumber = 1) => {
    try {
      set({ loading: true, error: null });
      
      // Initialize base station runners if not already initialized
      const existingRunners = await BaseOperationsRepository.getBaseStationRunners(raceId, checkpointNumber);
      if (existingRunners.length === 0) {
        await BaseOperationsRepository.initializeBaseStation(raceId, checkpointNumber);
      }

      const runners = await BaseOperationsRepository.getBaseStationRunners(raceId, checkpointNumber);
      
      set({
        currentRaceId: raceId,
        checkpointNumber,
        runners,
        loading: false,
        lastSync: new Date().toISOString()
      });

      // Save current base station settings
      await SettingsRepository.saveSetting('currentBaseStationCheckpoint', checkpointNumber);
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Load base station data
  loadBaseStationData: async (raceId, checkpointNumber = 1) => {
    try {
      set({ loading: true, error: null });
      const runners = await BaseOperationsRepository.getBaseStationRunners(raceId, checkpointNumber);
      
      set({
        currentRaceId: raceId,
        checkpointNumber,
        runners,
        loading: false,
        lastSync: new Date().toISOString()
      });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Runner management
  updateRunner: async (runnerNumber, updates) => {
    try {
      const { currentRaceId, checkpointNumber } = get();
      if (!currentRaceId) {
        throw new Error('No active base station session');
      }

      set({ loading: true, error: null });
      await BaseOperationsRepository.updateRunner(currentRaceId, checkpointNumber, runnerNumber, updates);
      
      // Refresh runners
      const runners = await BaseOperationsRepository.getBaseStationRunners(currentRaceId, checkpointNumber);
      set({ 
        runners,
        loading: false,
        lastSync: new Date().toISOString()
      });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  markRunner: async (runnerNumber, commonTime = null, status = RUNNER_STATUS.PASSED) => {
    try {
      const { currentRaceId, checkpointNumber } = get();
      if (!currentRaceId) {
        throw new Error('No active base station session');
      }

      set({ loading: true, error: null });
      await BaseOperationsRepository.markRunner(
        currentRaceId,
        checkpointNumber,
        runnerNumber,
        commonTime,
        status
      );
      
      // Refresh runners
      const runners = await BaseOperationsRepository.getBaseStationRunners(currentRaceId, checkpointNumber);
      set({ 
        runners,
        loading: false,
        lastSync: new Date().toISOString()
      });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  bulkMarkRunners: async (runnerNumbers, commonTime = null, status = RUNNER_STATUS.PASSED) => {
    try {
      const { currentRaceId, checkpointNumber } = get();
      if (!currentRaceId) {
        throw new Error('No active base station session');
      }

      set({ loading: true, error: null });
      await BaseOperationsRepository.bulkMarkRunners(
        currentRaceId,
        checkpointNumber,
        runnerNumbers,
        commonTime,
        status
      );
      
      // Refresh runners
      const runners = await BaseOperationsRepository.getBaseStationRunners(currentRaceId, checkpointNumber);
      set({ 
        runners,
        loading: false,
        lastSync: new Date().toISOString()
      });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Export functions
  exportBaseStationData: async () => {
    try {
      const { currentRaceId, checkpointNumber } = get();
      if (!currentRaceId) {
        throw new Error('No active base station session');
      }

      set({ loading: true, error: null });
      const exportData = await BaseOperationsRepository.exportBaseStationData(currentRaceId, checkpointNumber);
      set({ loading: false });
      return exportData;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  generateRaceResults: async () => {
    try {
      const { currentRaceId, exportFormat } = get();
      if (!currentRaceId) {
        throw new Error('No active base station session');
      }

      set({ loading: true, error: null });
      const results = await BaseOperationsRepository.generateRaceResults(currentRaceId, exportFormat);
      set({ loading: false });
      return results;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Reset state
  reset: () => {
    set({
      currentRaceId: null,
      checkpointNumber: 1,
      runners: [],
      loading: false,
      error: null,
      lastSync: null,
      exportFormat: 'csv'
    });
  }
}));

export default useBaseOperationsStore;
