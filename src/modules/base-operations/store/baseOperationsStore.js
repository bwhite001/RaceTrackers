import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RUNNER_STATUSES } from '../../../types';
import db from '../../../shared/services/database/schema.js';
import StorageService from '../../../services/storage.js';
import { BaseOperationsRepository } from '../services/BaseOperationsRepository';

/**
 * Base Operations Store
 * Manages state for the base station operations module
 */
const useBaseOperationsStore = create(
  persist(
    (set, get) => ({
      // State
      currentRaceId: null,
      currentRace: null,
      runners: [],
      sessionBatches: [],
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
            await get().initializeRunners(raceId);
          }

          set({
            currentRaceId: raceId,
            currentRace: raceConfig,
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
          return await db.races.get(parseInt(raceId, 10)) || null;
        } catch (error) {
          console.error('Failed to load race config:', error);
          return null;
        }
      },

      loadRunners: async (raceId) => {
        try {
          return await StorageService.getCheckpointRunners(raceId);
        } catch (error) {
          console.error('Failed to load runners:', error);
          return [];
        }
      },

      initializeRunners: async (raceId) => {
        return await StorageService.getCheckpointRunners(raceId);
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
        const { currentRaceId } = get();
        if (!currentRaceId) {
          const err = new Error('No active race');
          set({ error: err.message, loading: false });
          throw err;
        }

        try {
          set({ loading: true, error: null });
          await StorageService.updateBaseStationRunner(
            currentRaceId, 0, Number(runnerNumber), updates
          );
          await get().refreshData();
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      bulkUpdateRunners: async (runnerNumbers, updates) => {
        const { currentRaceId } = get();
        if (!currentRaceId) throw new Error('No active race');

        try {
          set({ loading: true, error: null });
          for (const num of runnerNumbers) {
            await StorageService.updateBaseStationRunner(
              currentRaceId, 0, Number(num), updates
            );
          }
          await get().refreshData();
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Primary entry point for DataEntry and WithdrawalDialog
      bulkMarkRunners: async (runnerNumbers, timeOrOptions) => {
        const { currentRaceId } = get();
        if (!currentRaceId) throw new Error('No active race');

        let updates;
        if (typeof timeOrOptions === 'string') {
          updates = {
            status: RUNNER_STATUSES.FINISHED,
            commonTime: timeOrOptions,
          };
        } else {
          updates = {
            status: timeOrOptions.status,
            notes: timeOrOptions.reason || null,
            commonTime: timeOrOptions.timestamp || null,
          };
        }

        try {
          set({ loading: true, error: null });
          for (const num of runnerNumbers) {
            await StorageService.updateBaseStationRunner(
              currentRaceId, 0, Number(num), updates
            );
          }
          await get().refreshData();
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
        const { currentRaceId } = get();
        if (!currentRaceId) throw new Error('No active race');
        const repo = new BaseOperationsRepository();
        for (const num of runnerNumbers) {
          await repo.markAsNonStarter(currentRaceId, Number(num), reason);
        }
        await get().refreshData();
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

      // ─── Report actions ─────────────────────────────────────────────

      generateReport: async (reportType, options = {}) => {
        const { currentRaceId } = get();
        if (!currentRaceId) throw new Error('No active race');
        const repo = new BaseOperationsRepository();
        switch (reportType) {
          case 'missing':
            return repo.generateMissingNumbersReport(currentRaceId, options.checkpoint ?? 1);
          case 'outList':
            return repo.generateOutListReport(currentRaceId);
          case 'checkpointLog':
            return repo.generateCheckpointLogReport(currentRaceId, options.checkpoint ?? 1);
          case 'summary':
            return repo.generateRaceResults(currentRaceId, options.format ?? 'csv');
          case 'finisherList':
            return repo.generateFinisherListReport(currentRaceId);
          case 'officialsReport':
            return repo.generateOfficialsReport(currentRaceId);
          case 'splitTimes':
            return repo.generateSplitTimesReport(currentRaceId);
          default:
            throw new Error(`Unknown report type: ${reportType}`);
        }
      },

      downloadReport: (report) => {
        if (!report?.content || !report?.filename) return;
        const blob = new Blob([report.content], { type: report.mimeType ?? 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = report.filename;
        a.click();
        URL.revokeObjectURL(url);
      },

      previewReport: (report) => {
        if (!report?.content) return;
        const blob = new Blob([report.content], { type: report.mimeType ?? 'text/plain' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      },

      generateMissingNumbersReport: async (checkpoint) => {
        const { currentRaceId } = get();
        if (!currentRaceId) throw new Error('No active race');
        const repo = new BaseOperationsRepository();
        return repo.generateMissingNumbersReport(currentRaceId, checkpoint);
      },

      generateOutListReport: async () => {
        const { currentRaceId } = get();
        if (!currentRaceId) throw new Error('No active race');
        const repo = new BaseOperationsRepository();
        return repo.generateOutListReport(currentRaceId);
      },

      generateCheckpointLogReport: async (checkpoint) => {
        const { currentRaceId } = get();
        if (!currentRaceId) throw new Error('No active race');
        const repo = new BaseOperationsRepository();
        return repo.generateCheckpointLogReport(currentRaceId, checkpoint);
      },

      // Utilities
      calculateStats: (runners) => {
        const { currentRace } = get();
        const total = currentRace ? (currentRace.maxRunner - currentRace.minRunner + 1) : 0;
        const byNumber = new Map();
        for (const runner of runners) {
          const existing = byNumber.get(runner.number);
          if (!existing || runner.checkpointNumber > existing.checkpointNumber) {
            byNumber.set(runner.number, runner);
          }
        }
        const counts = Array.from(byNumber.values()).reduce(
          (acc, runner) => {
            const s = runner.status;
            if (s === RUNNER_STATUSES.FINISHED || s === RUNNER_STATUSES.PASSED || s === 'finished') acc.finished++;
            else if (s === RUNNER_STATUSES.DNF) acc.dnf++;
            else if (s === RUNNER_STATUSES.DNS || s === RUNNER_STATUSES.NON_STARTER || s === 'dns') acc.dns++;
            else acc.active++;
            return acc;
          },
          { finished: 0, active: 0, dnf: 0, dns: 0 }
        );
        return { total, ...counts };
      },

      submitRadioBatch: async (runnerNumbers, time, checkpointNumber) => {
        const { currentRaceId } = get();
        if (!currentRaceId) throw new Error('No active race');
        if (checkpointNumber === undefined || checkpointNumber === null) throw new Error('checkpointNumber is required');
        try {
          set({ loading: true, error: null });
          for (const num of runnerNumbers) {
            await StorageService.updateCheckpointRunner(
              currentRaceId, checkpointNumber, Number(num),
              { status: RUNNER_STATUSES.PASSED, markOffTime: time, callInTime: time }
            );
          }
          const newBatch = {
            id: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            checkpointNumber, commonTime: time, bibs: [...runnerNumbers],
            submittedAt: new Date().toISOString(), voided: false,
          };
          set(state => ({ sessionBatches: [newBatch, ...state.sessionBatches] }));
          await get().refreshData();
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      voidSessionBatch: (batchId) => {
        set(state => ({
          sessionBatches: state.sessionBatches.map(b => b.id === batchId ? { ...b, voided: true } : b)
        }));
      },

      // Reset store
      reset: () => {
        set({
          currentRaceId: null,
          currentRace: null,
          runners: [],
          sessionBatches: [],
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
      // Only persist UI preferences — never race data (causes stale state across sessions)
      partialize: (state) => ({
        sortOrder: state.sortOrder,
        filterStatus: state.filterStatus
      })
    }
  )
);

export default useBaseOperationsStore;
