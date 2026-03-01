import { create } from 'zustand';
import CheckpointRepository from '../services/CheckpointRepository';
import SettingsRepository from '../../../shared/services/database/SettingsRepository';
import { RUNNER_STATUS } from '../../../shared/types/store.types';

const useCheckpointStore = create((set, get) => ({
  // State
  currentRaceId: null,
  checkpointNumber: null,
  runners: [],
  loading: false,
  error: null,
  lastSync: null,

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Initialize checkpoint
  initializeCheckpoint: async (raceId, checkpointNumber) => {
    try {
      set({ loading: true, error: null });
      
      // Initialize checkpoint runners if not already initialized
      const existingRunners = await CheckpointRepository.getCheckpointRunners(raceId, checkpointNumber);
      if (existingRunners.length === 0) {
        await CheckpointRepository.initializeCheckpoint(raceId, checkpointNumber);
      }

      const runners = await CheckpointRepository.getCheckpointRunners(raceId, checkpointNumber);
      
      set({
        currentRaceId: raceId,
        checkpointNumber,
        runners,
        loading: false,
        lastSync: new Date().toISOString()
      });

      // Save current checkpoint in settings
      await SettingsRepository.saveSetting('currentCheckpoint', checkpointNumber);
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Load checkpoint data
  loadCheckpointData: async (raceId, checkpointNumber) => {
    try {
      set({ loading: true, error: null });
      const runners = await CheckpointRepository.getCheckpointRunners(raceId, checkpointNumber);
      
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
      if (!currentRaceId || !checkpointNumber) {
        throw new Error('No active checkpoint session');
      }

      set({ loading: true, error: null });
      await CheckpointRepository.updateRunner(currentRaceId, checkpointNumber, runnerNumber, updates);
      
      // Refresh runners
      const runners = await CheckpointRepository.getCheckpointRunners(currentRaceId, checkpointNumber);
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

  markRunner: async (runnerNumber, callInTime = null, markOffTime = null, status = RUNNER_STATUS.PASSED) => {
    try {
      const { currentRaceId, checkpointNumber } = get();
      if (!currentRaceId || !checkpointNumber) {
        throw new Error('No active checkpoint session');
      }

      set({ loading: true, error: null });
      await CheckpointRepository.markRunner(
        currentRaceId,
        checkpointNumber,
        runnerNumber,
        callInTime,
        markOffTime,
        status
      );
      
      // Refresh runners
      const runners = await CheckpointRepository.getCheckpointRunners(currentRaceId, checkpointNumber);
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

  bulkMarkRunners: async (runnerNumbers, callInTime = null, markOffTime = null, status = RUNNER_STATUS.PASSED) => {
    try {
      const { currentRaceId, checkpointNumber } = get();
      if (!currentRaceId || !checkpointNumber) {
        throw new Error('No active checkpoint session');
      }

      set({ loading: true, error: null });
      await CheckpointRepository.bulkMarkRunners(
        currentRaceId,
        checkpointNumber,
        runnerNumbers,
        callInTime,
        markOffTime,
        status
      );
      
      // Refresh runners
      const runners = await CheckpointRepository.getCheckpointRunners(currentRaceId, checkpointNumber);
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

  /**
   * Build 5-minute time segments from current runners (passed only).
   * Returns segments sorted by commonTime, each with { commonTimeLabel, commonTime, runners, calledIn }.
   */
  getTimeSegments: () => {
    const { runners } = get();
    const passed = runners.filter(r => r.status === 'passed' && r.commonTimeLabel);
    const groups = {};
    for (const r of passed) {
      const key = r.commonTimeLabel;
      if (!groups[key]) {
        groups[key] = { commonTimeLabel: key, commonTime: r.commonTime, runners: [], calledIn: true };
      }
      groups[key].runners.push(r);
      // If any runner in the group is not called in, the group is not called in
      if (!r.calledIn) groups[key].calledIn = false;
    }
    return Object.values(groups).sort((a, b) =>
      new Date(a.commonTime) - new Date(b.commonTime)
    );
  },

  /**
   * Persist calledIn=true for all runners in a 5-minute group.
   */
  markSegmentCalledIn: async (commonTimeLabel) => {
    try {
      const { currentRaceId, checkpointNumber } = get();
      if (!currentRaceId || !checkpointNumber) throw new Error('No active checkpoint session');
      set({ loading: true, error: null });
      await CheckpointRepository.markGroupCalledIn(currentRaceId, checkpointNumber, commonTimeLabel);
      const runners = await CheckpointRepository.getCheckpointRunners(currentRaceId, checkpointNumber);
      set({ runners, loading: false, lastSync: new Date().toISOString() });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Export checkpoint data
  exportData: async () => {
    try {
      const { currentRaceId, checkpointNumber } = get();
      if (!currentRaceId || !checkpointNumber) {
        throw new Error('No active checkpoint session');
      }

      set({ loading: true, error: null });
      const exportData = await CheckpointRepository.exportCheckpointData(currentRaceId, checkpointNumber);
      set({ loading: false });
      return exportData;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Reset state
  reset: () => {
    set({
      currentRaceId: null,
      checkpointNumber: null,
      runners: [],
      loading: false,
      error: null,
      lastSync: null
    });
  }
}));

export { useCheckpointStore as checkpointStore };
export default useCheckpointStore;
