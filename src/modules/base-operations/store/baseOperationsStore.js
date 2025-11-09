import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RUNNER_STATUSES } from '../../../types';

/**
 * Base Operations Store
 * Manages state for the base station operations module
 */
const useBaseOperationsStore = create(
  persist(
    (set, get) => ({
      // State
      currentRaceId: null,
      checkpointNumber: 1,
      runners: [],
      loading: false,
      error: null,
      lastSync: null,
      sortOrder: 'number', // 'number', 'status', 'time'
      filterStatus: 'all', // 'all', 'active', 'finished', 'dnf', 'dns'
      searchQuery: '',
      
      // UI State
      selectedRunners: [],
      commonTime: null,
      batchEntryMode: false,
      
      // Statistics
      stats: {
        total: 0,
        finished: 0,
        active: 0,
        dnf: 0,
        dns: 0
      },

      // Actions - Initialization
      initialize: async (raceId) => {
        try {
          set({ loading: true, error: null });
          
          // Load race configuration
          const raceConfig = await get().loadRaceConfig(raceId);
          if (!raceConfig) throw new Error('Race configuration not found');

          // Initialize runners if needed
          const existingRunners = await get().loadRunners(raceId);
          if (existingRunners.length === 0) {
            await get().initializeRunners(raceId, raceConfig);
          }

          set({
            currentRaceId: raceId,
            loading: false,
            lastSync: new Date().toISOString()
          });

          // Load initial data
          await get().refreshData();
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Actions - Data Loading
      loadRaceConfig: async (raceId) => {
        try {
          // Load race configuration from storage
          const config = await localStorage.getItem(`race_${raceId}_config`);
          return config ? JSON.parse(config) : null;
        } catch (error) {
          console.error('Failed to load race config:', error);
          return null;
        }
      },

      loadRunners: async (raceId) => {
        try {
          const runners = await localStorage.getItem(`race_${raceId}_runners`);
          return runners ? JSON.parse(runners) : [];
        } catch (error) {
          console.error('Failed to load runners:', error);
          return [];
        }
      },

      initializeRunners: async (raceId, config) => {
        const runners = config.runnerRanges.flatMap(range => {
          const [start, end] = range.split('-').map(Number);
          return Array.from(
            { length: end - start + 1 },
            (_, i) => ({
              number: start + i,
              status: RUNNER_STATUSES.NOT_STARTED,
              checkpoints: {},
              lastUpdate: new Date().toISOString()
            })
          );
        });

        await localStorage.setItem(
          `race_${raceId}_runners`,
          JSON.stringify(runners)
        );

        return runners;
      },

      refreshData: async () => {
        const { currentRaceId } = get();
        if (!currentRaceId) return;

        try {
          set({ loading: true, error: null });
          
          const runners = await get().loadRunners(currentRaceId);
          const stats = get().calculateStats(runners);

          set({
            runners,
            stats,
            loading: false,
            lastSync: new Date().toISOString()
          });
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Actions - Runner Management
      updateRunner: async (runnerNumber, updates) => {
        const { currentRaceId, runners } = get();
        if (!currentRaceId) throw new Error('No active race');

        try {
          set({ loading: true, error: null });

          const updatedRunners = runners.map(runner =>
            runner.number === runnerNumber
              ? { ...runner, ...updates, lastUpdate: new Date().toISOString() }
              : runner
          );

          await localStorage.setItem(
            `race_${currentRaceId}_runners`,
            JSON.stringify(updatedRunners)
          );

          const stats = get().calculateStats(updatedRunners);
          set({
            runners: updatedRunners,
            stats,
            loading: false,
            lastSync: new Date().toISOString()
          });
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      bulkUpdateRunners: async (runnerNumbers, updates) => {
        const { currentRaceId, runners } = get();
        if (!currentRaceId) throw new Error('No active race');

        try {
          set({ loading: true, error: null });

          const updatedRunners = runners.map(runner =>
            runnerNumbers.includes(runner.number)
              ? { ...runner, ...updates, lastUpdate: new Date().toISOString() }
              : runner
          );

          await localStorage.setItem(
            `race_${currentRaceId}_runners`,
            JSON.stringify(updatedRunners)
          );

          const stats = get().calculateStats(updatedRunners);
          set({
            runners: updatedRunners,
            stats,
            loading: false,
            lastSync: new Date().toISOString()
          });
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Actions - Status Management
      markAsFinished: async (runnerNumbers, time) => {
        await get().bulkUpdateRunners(runnerNumbers, {
          status: RUNNER_STATUSES.FINISHED,
          finishTime: time || new Date().toISOString()
        });
      },

      markAsDNF: async (runnerNumbers, reason = '') => {
        await get().bulkUpdateRunners(runnerNumbers, {
          status: RUNNER_STATUSES.DNF,
          dnfReason: reason,
          dnfTime: new Date().toISOString()
        });
      },

      markAsDNS: async (runnerNumbers, reason = '') => {
        await get().bulkUpdateRunners(runnerNumbers, {
          status: RUNNER_STATUSES.DNS,
          dnsReason: reason
        });
      },

      // Actions - UI State
      setSelectedRunners: (numbers) => {
        set({ selectedRunners: numbers });
      },

      setCommonTime: (time) => {
        set({ commonTime: time });
      },

      setBatchEntryMode: (enabled) => {
        set({ batchEntryMode: enabled });
      },

      setSortOrder: (order) => {
        set({ sortOrder: order });
      },

      setFilterStatus: (status) => {
        set({ filterStatus: status });
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      // Utilities
      calculateStats: (runners) => {
        return runners.reduce(
          (stats, runner) => {
            stats.total++;
            switch (runner.status) {
              case RUNNER_STATUSES.FINISHED:
                stats.finished++;
                break;
              case RUNNER_STATUSES.DNF:
                stats.dnf++;
                break;
              case RUNNER_STATUSES.DNS:
                stats.dns++;
                break;
              default:
                stats.active++;
            }
            return stats;
          },
          { total: 0, finished: 0, active: 0, dnf: 0, dns: 0 }
        );
      },

      // Reset store
      reset: () => {
        set({
          currentRaceId: null,
          checkpointNumber: 1,
          runners: [],
          loading: false,
          error: null,
          lastSync: null,
          sortOrder: 'number',
          filterStatus: 'all',
          searchQuery: '',
          selectedRunners: [],
          commonTime: null,
          batchEntryMode: false,
          stats: {
            total: 0,
            finished: 0,
            active: 0,
            dnf: 0,
            dns: 0
          }
        });
      }
    }),
    {
      name: 'base-operations-storage',
      partialize: (state) => ({
        currentRaceId: state.currentRaceId,
        checkpointNumber: state.checkpointNumber,
        sortOrder: state.sortOrder,
        filterStatus: state.filterStatus
      })
    }
  )
);

export default useBaseOperationsStore;
