import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import StorageService from '../services/storage.js';
import TimeUtils from '../services/timeUtils.js';
import { DEFAULT_SETTINGS, APP_MODES, RUNNER_STATUSES } from '../types/index.js';

const useRaceStore = create(
  persist(
    (set, get) => ({
      // State
      raceConfig: null,
      mode: APP_MODES.SETUP,
      runners: [],
      calledSegments: [],
      checkpoints: [],
      checkpointResults: [],
      currentCheckpoint: 1,
      settings: DEFAULT_SETTINGS,
      isLoading: false,
      error: null,
      currentRaceId: null,

      // Actions
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      clearError: () => set({ error: null }),

      // Race configuration actions
      createRace: async (raceData) => {
        set({ isLoading: true, error: null });
        try {
          const raceId = await StorageService.saveRace(raceData);
          const runners = await StorageService.getRunners(raceId);
          
          set({
            raceConfig: { ...raceData, id: raceId },
            currentRaceId: raceId,
            runners,
            calledSegments: [],
            mode: APP_MODES.SETUP,
            isLoading: false
          });
          
          return raceId;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      loadRace: async (raceId) => {
        set({ isLoading: true, error: null });
        try {
          const race = await StorageService.getRace(raceId);
          const runners = await StorageService.getRunners(raceId);
          const segments = await StorageService.getCalledSegments(raceId);
          const checkpoints = await StorageService.getCheckpoints(raceId);
          const checkpointResults = await StorageService.getCheckpointResults(raceId);
          
          set({
            raceConfig: race,
            currentRaceId: raceId,
            runners,
            calledSegments: segments.map(s => TimeUtils.getSegmentKey(s.startTime)),
            checkpoints: checkpoints || [],
            checkpointResults: checkpointResults || [],
            currentCheckpoint: checkpoints && checkpoints.length > 0 ? checkpoints[0].number : 1,
            isLoading: false
          });
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      loadCurrentRace: async () => {
        set({ isLoading: true, error: null });
        try {
          const race = await StorageService.getCurrentRace();
          if (race) {
            await get().loadRace(race.id);
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      getAllRaces: async () => {
        set({ isLoading: true, error: null });
        try {
          const races = await StorageService.getAllRaces();
          set({ isLoading: false });
          return races;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      switchToRace: async (raceId) => {
        set({ isLoading: true, error: null });
        try {
          await get().loadRace(raceId);
          set({ mode: APP_MODES.SETUP });
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      deleteRace: async (raceId) => {
        set({ isLoading: true, error: null });
        try {
          await StorageService.deleteRace(raceId);
          
          // If this was the current race, reset state
          if (get().currentRaceId === raceId) {
            set({
              raceConfig: null,
              currentRaceId: null,
              runners: [],
              calledSegments: [],
              mode: APP_MODES.SETUP
            });
          }
          
          set({ isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Mode actions
      setMode: (mode) => set({ mode }),

      // Runner actions
      markRunnerPassed: async (runnerNumber, timestamp = null) => {
        const { currentRaceId } = get();
        if (!currentRaceId) return;

        set({ isLoading: true, error: null });
        try {
          const recordedTime = timestamp || TimeUtils.getCurrentTimestamp();
          await StorageService.markRunnerPassed(currentRaceId, runnerNumber, recordedTime);
          
          // Update local state
          const runners = get().runners.map(runner =>
            runner.number === runnerNumber
              ? { ...runner, status: RUNNER_STATUSES.PASSED, recordedTime }
              : runner
          );
          
          set({ runners, isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      markRunnerStatus: async (runnerNumber, status) => {
        const { currentRaceId } = get();
        if (!currentRaceId) return;

        set({ isLoading: true, error: null });
        try {
          await StorageService.markRunnerStatus(currentRaceId, runnerNumber, status);
          
          // Update local state
          const runners = get().runners.map(runner =>
            runner.number === runnerNumber
              ? { 
                  ...runner, 
                  status, 
                  recordedTime: status === RUNNER_STATUSES.PASSED ? runner.recordedTime : null 
                }
              : runner
          );
          
          set({ runners, isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      bulkMarkRunners: async (runnerNumbers, status, timestamp = null) => {
        const { currentRaceId } = get();
        if (!currentRaceId) return;

        set({ isLoading: true, error: null });
        try {
          const updates = { status };
          if (status === RUNNER_STATUSES.PASSED) {
            updates.recordedTime = timestamp || TimeUtils.getCurrentTimestamp();
          } else {
            updates.recordedTime = null;
          }

          await StorageService.bulkUpdateRunners(currentRaceId, runnerNumbers, updates);
          
          // Update local state
          const runners = get().runners.map(runner =>
            runnerNumbers.includes(runner.number)
              ? { ...runner, ...updates }
              : runner
          );
          
          set({ runners, isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Segment actions
      markSegmentCalled: async (segmentStart, segmentEnd) => {
        const { currentRaceId } = get();
        if (!currentRaceId) return;

        set({ isLoading: true, error: null });
        try {
          await StorageService.markSegmentCalled(currentRaceId, segmentStart, segmentEnd);
          
          const segmentKey = `${segmentStart}/${segmentEnd}`;
          const calledSegments = [...get().calledSegments, segmentKey];
          
          set({ calledSegments, isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      isSegmentCalled: (timestamp) => {
        const segmentKey = TimeUtils.getSegmentKey(timestamp);
        return get().calledSegments.includes(segmentKey);
      },

      // Settings actions
      updateSettings: async (newSettings) => {
        const settings = { ...get().settings, ...newSettings };
        set({ settings });
        
        // Persist individual settings
        for (const [key, value] of Object.entries(newSettings)) {
          try {
            await StorageService.saveSetting(key, value);
          } catch (error) {
            console.error(`Failed to save setting ${key}:`, error);
          }
        }
      },

      loadSettings: async () => {
        try {
          const savedSettings = await StorageService.getAllSettings();
          const settings = { ...DEFAULT_SETTINGS, ...savedSettings };
          set({ settings });
        } catch (error) {
          console.error('Failed to load settings:', error);
        }
      },

      // Import/Export actions
      exportRaceConfig: async () => {
        const { currentRaceId } = get();
        if (!currentRaceId) throw new Error('No race to export');

        try {
          return await StorageService.exportRaceConfig(currentRaceId);
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      exportRaceResults: async (format = 'csv') => {
        const { currentRaceId, raceConfig, runners } = get();
        if (!currentRaceId) throw new Error('No race to export');

        try {
          return await StorageService.exportRaceResults(currentRaceId, raceConfig, runners, format);
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      importRaceConfig: async (exportData) => {
        set({ isLoading: true, error: null });
        try {
          const raceId = await StorageService.importRaceConfig(exportData);
          await get().loadRace(raceId);
          return raceId;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Computed getters
      getRunnersByStatus: (status) => {
        return get().runners.filter(runner => runner.status === status);
      },

      getPassedRunners: () => {
        return get().runners.filter(runner => 
          runner.status === RUNNER_STATUSES.PASSED && runner.recordedTime
        );
      },

      getRunnerCounts: () => {
        const runners = get().runners;
        return {
          total: runners.length,
          notStarted: runners.filter(r => r.status === RUNNER_STATUSES.NOT_STARTED).length,
          passed: runners.filter(r => r.status === RUNNER_STATUSES.PASSED).length,
          nonStarter: runners.filter(r => r.status === RUNNER_STATUSES.NON_STARTER).length,
          dnf: runners.filter(r => r.status === RUNNER_STATUSES.DNF).length
        };
      },

      getTimeSegments: () => {
        const passedRunners = get().getPassedRunners();
        const segments = TimeUtils.groupRunnersBySegments(passedRunners);
        const calledSegments = get().calledSegments;
        
        return segments.map(segment => ({
          ...segment,
          called: calledSegments.includes(`${segment.startTime}/${segment.endTime}`)
        }));
      },

      getRunner: (runnerNumber) => {
        return get().runners.find(runner => runner.number === runnerNumber);
      },

      // New isolated tracking state
      checkpointRunners: {}, // { [checkpointNumber]: [...runners] }
      baseStationRunners: [],
      checkpointSegments: {}, // { [checkpointNumber]: [...segments] }

      // Checkpoint actions
      setCurrentCheckpoint: (checkpointNumber) => {
        set({ currentCheckpoint: checkpointNumber });
      },

      // New isolated checkpoint methods
      loadCheckpointRunners: async (checkpointNumber) => {
        const { currentRaceId } = get();
        if (!currentRaceId) return;

        set({ isLoading: true, error: null });
        try {
          let checkpointRunners = await StorageService.getCheckpointRunners(currentRaceId, checkpointNumber);
          
          // Initialize if empty
          if (checkpointRunners.length === 0) {
            checkpointRunners = await StorageService.initializeCheckpointRunners(currentRaceId, checkpointNumber);
          }

          set(state => ({
            checkpointRunners: {
              ...state.checkpointRunners,
              [checkpointNumber]: checkpointRunners
            },
            isLoading: false
          }));
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      markCheckpointRunner: async (runnerNumber, checkpointNumber = null, callInTime = null, markOffTime = null, status = 'passed') => {
        const { currentRaceId, currentCheckpoint } = get();
        if (!currentRaceId) return;

        const checkpoint = checkpointNumber || currentCheckpoint;
        set({ isLoading: true, error: null });
        
        try {
          await StorageService.markCheckpointRunner(currentRaceId, checkpoint, runnerNumber, callInTime, markOffTime, status);
          
          // Reload checkpoint runners
          await get().loadCheckpointRunners(checkpoint);
          
          set({ isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      bulkMarkCheckpointRunners: async (runnerNumbers, checkpointNumber = null, callInTime = null, markOffTime = null, status = 'passed') => {
        const { currentRaceId, currentCheckpoint } = get();
        if (!currentRaceId) return;

        const checkpoint = checkpointNumber || currentCheckpoint;
        set({ isLoading: true, error: null });
        
        try {
          await StorageService.bulkMarkCheckpointRunners(currentRaceId, checkpoint, runnerNumbers, callInTime, markOffTime, status);
          
          // Reload checkpoint runners
          await get().loadCheckpointRunners(checkpoint);
          
          set({ isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      getCheckpointRunners: (checkpointNumber = null) => {
        const { checkpointRunners, currentCheckpoint } = get();
        const checkpoint = checkpointNumber || currentCheckpoint;
        
        return checkpointRunners[checkpoint] || [];
      },

      getCheckpointRunner: (runnerNumber, checkpointNumber = null) => {
        const { checkpointRunners, currentCheckpoint } = get();
        const checkpoint = checkpointNumber || currentCheckpoint;
        
        const runners = checkpointRunners[checkpoint] || [];
        return runners.find(runner => runner.number === runnerNumber);
      },

      // New isolated base station methods
      loadBaseStationRunners: async () => {
        const { currentRaceId } = get();
        if (!currentRaceId) return;

        set({ isLoading: true, error: null });
        try {
          let baseStationRunners = await StorageService.getBaseStationRunners(currentRaceId);
          
          // Initialize if empty
          if (baseStationRunners.length === 0) {
            baseStationRunners = await StorageService.initializeBaseStationRunners(currentRaceId);
          }

          set({ baseStationRunners, isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      markBaseStationRunner: async (runnerNumber, callInTime = null, markOffTime = null, status = 'passed') => {
        const { currentRaceId } = get();
        if (!currentRaceId) return;

        set({ isLoading: true, error: null });
        
        try {
          await StorageService.markBaseStationRunner(currentRaceId, runnerNumber, callInTime, markOffTime, status);
          
          // Reload base station runners
          await get().loadBaseStationRunners();
          
          set({ isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      bulkMarkBaseStationRunners: async (runnerNumbers, callInTime = null, markOffTime = null, status = 'passed') => {
        const { currentRaceId } = get();
        if (!currentRaceId) return;

        set({ isLoading: true, error: null });
        
        try {
          await StorageService.bulkMarkBaseStationRunners(currentRaceId, runnerNumbers, callInTime, markOffTime, status);
          
          // Reload base station runners
          await get().loadBaseStationRunners();
          
          set({ isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // New checkpoint segments methods
      loadCheckpointSegments: async (checkpointNumber) => {
        const { currentRaceId } = get();
        if (!currentRaceId) return;

        set({ isLoading: true, error: null });
        try {
          const segments = await StorageService.getCheckpointSegments(currentRaceId, checkpointNumber);
          
          set(state => ({
            checkpointSegments: {
              ...state.checkpointSegments,
              [checkpointNumber]: segments
            },
            isLoading: false
          }));
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      markCheckpointSegmentCalled: async (startTime, endTime, checkpointNumber = null) => {
        const { currentRaceId, currentCheckpoint } = get();
        if (!currentRaceId) return;

        const checkpoint = checkpointNumber || currentCheckpoint;
        set({ isLoading: true, error: null });
        
        try {
          await StorageService.markCheckpointSegmentCalled(currentRaceId, checkpoint, startTime, endTime);
          
          // Reload checkpoint segments
          await get().loadCheckpointSegments(checkpoint);
          
          set({ isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      getCheckpointSegments: (checkpointNumber = null) => {
        const { checkpointSegments, currentCheckpoint } = get();
        const checkpoint = checkpointNumber || currentCheckpoint;
        
        return checkpointSegments[checkpoint] || [];
      },

      // New export methods for isolated data
      exportIsolatedCheckpointResults: async (checkpointNumber = null) => {
        const { currentRaceId, currentCheckpoint } = get();
        if (!currentRaceId) throw new Error('No race to export');

        const checkpoint = checkpointNumber || currentCheckpoint;
        
        try {
          return await StorageService.exportIsolatedCheckpointResults(currentRaceId, checkpoint);
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      exportIsolatedBaseStationResults: async () => {
        const { currentRaceId } = get();
        if (!currentRaceId) throw new Error('No race to export');

        try {
          return await StorageService.exportIsolatedBaseStationResults(currentRaceId);
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      // Migration method
      migrateToIsolatedTracking: async () => {
        const { currentRaceId } = get();
        if (!currentRaceId) return;

        set({ isLoading: true, error: null });
        try {
          await StorageService.migrateToIsolatedTracking(currentRaceId);
          
          // Load all isolated data
          const checkpoints = get().checkpoints;
          for (const checkpoint of checkpoints) {
            await get().loadCheckpointRunners(checkpoint.number);
            await get().loadCheckpointSegments(checkpoint.number);
          }
          await get().loadBaseStationRunners();
          
          set({ isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Legacy checkpoint methods (for backward compatibility)
      markRunnerAtCheckpoint: async (runnerNumber, checkpointNumber = null, callInTime = null, markOffTime = null, status = 'passed') => {
        const { currentRaceId, currentCheckpoint } = get();
        if (!currentRaceId) return;

        const checkpoint = checkpointNumber || currentCheckpoint;
        set({ isLoading: true, error: null });
        
        try {
          await StorageService.markRunnerAtCheckpoint(currentRaceId, runnerNumber, checkpoint, callInTime, markOffTime, status);
          
          // Reload checkpoint results
          const checkpointResults = await StorageService.getCheckpointResults(currentRaceId);
          const runners = await StorageService.getRunners(currentRaceId);
          
          set({ checkpointResults, runners, isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      bulkMarkRunnersAtCheckpoint: async (runnerNumbers, checkpointNumber = null, callInTime = null, markOffTime = null, status = 'passed') => {
        const { currentRaceId, currentCheckpoint } = get();
        if (!currentRaceId) return;

        const checkpoint = checkpointNumber || currentCheckpoint;
        set({ isLoading: true, error: null });
        
        try {
          await StorageService.bulkMarkRunnersAtCheckpoint(currentRaceId, runnerNumbers, checkpoint, callInTime, markOffTime, status);
          
          // Reload checkpoint results and runners
          const checkpointResults = await StorageService.getCheckpointResults(currentRaceId);
          const runners = await StorageService.getRunners(currentRaceId);
          
          set({ checkpointResults, runners, isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      getCheckpointResults: (checkpointNumber = null) => {
        const { checkpointResults, currentCheckpoint } = get();
        const checkpoint = checkpointNumber || currentCheckpoint;
        
        return checkpointResults.filter(result => result.checkpointNumber === checkpoint);
      },

      getRunnerCheckpointResult: (runnerNumber, checkpointNumber = null) => {
        const { checkpointResults, currentCheckpoint } = get();
        const checkpoint = checkpointNumber || currentCheckpoint;
        
        return checkpointResults.find(result => 
          result.runnerNumber === runnerNumber && result.checkpointNumber === checkpoint
        );
      },

      // Utility actions
      resetRace: () => {
        set({
          raceConfig: null,
          currentRaceId: null,
          runners: [],
          calledSegments: [],
          checkpoints: [],
          checkpointResults: [],
          currentCheckpoint: 1,
          mode: APP_MODES.SETUP,
          error: null
        });
      },

      clearAllData: async () => {
        set({ isLoading: true, error: null });
        try {
          await StorageService.clearAllData();
          get().resetRace();
          set({ isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      }
    }),
    {
      name: 'race-tracker-storage',
      partialize: (state) => ({
        currentRaceId: state.currentRaceId,
        mode: state.mode,
        settings: state.settings
      })
    }
  )
);

export default useRaceStore;
