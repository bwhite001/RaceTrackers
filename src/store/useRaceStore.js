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
          
          set({
            raceConfig: race,
            currentRaceId: raceId,
            runners,
            calledSegments: segments.map(s => TimeUtils.getSegmentKey(s.startTime)),
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

      // Utility actions
      resetRace: () => {
        set({
          raceConfig: null,
          currentRaceId: null,
          runners: [],
          calledSegments: [],
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
