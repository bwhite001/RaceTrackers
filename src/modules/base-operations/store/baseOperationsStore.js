import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RUNNER_STATUSES } from '../../../types';
import db from '../../../shared/services/database/schema.js';
import StorageService from '../../../services/storage.js';
import { BaseOperationsRepository } from '../services/BaseOperationsRepository';
import { getRunnerTotal } from '../../../utils/raceStatistics';
import TimeUtils from '../../../services/timeUtils.js';

/** Race ids are numeric in IndexedDB; tests and old state may hold strings. */
const raceKeyOf = (id) => (Number.isFinite(Number(id)) ? Number(id) : id);

/** Receive call draft — survives tab switches, cleared on Complete / Cancel (spec §6). */
export const EMPTY_RECEIVE = {
  step: 'idle',        // 'idle' | 'rx' | 'done'
  cp: null,            // checkpoint number (BASE_STATION_CP = Finish)
  entries: [],         // [{ num, t (ISO), manual }]
  ctime: null,         // selected block / exact time (ISO)
  manual: false,
  manualText: '',
  summary: null,       // { title, sub } after Complete
  lastCallId: null,
  raceId: null,        // race the draft belongs to (persisted across reloads)
};

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
      checkpoints: [],
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
        notStarted: 0,
        finished: 0,
        active: 0,
        dnf: 0,
        dns: 0,
        total: 0,
        checkpointCounts: {},
      },

      outList: [],
      raceRunnerNumbers: [],
      radioCalls: [],
      baseRows: [],
      resolutions: [],
      receive: EMPTY_RECEIVE,

      // Actions - Initialization
      initialize: async (raceId) => {
        try {
          set({ loading: true, error: null });
          
          // Load race configuration
          const raceConfig = await get().loadRaceConfig(raceId);
          if (!raceConfig) throw new Error('Race configuration not found');

          // Load checkpoints
          const checkpoints = await db.checkpoints.where('raceId').equals(parseInt(raceId, 10)).sortBy('number');

          // Initialize runners if needed
          const existingRunners = await get().loadRunners(raceId);
          if (existingRunners.length === 0) {
            await get().initializeRunners(raceId);
          }

          set({
            currentRaceId: raceId,
            currentRace: raceConfig,
            checkpoints,
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
          const [checkpointRunners, baseStationRunners] = await Promise.all([
            StorageService.getCheckpointRunners(raceId),
            StorageService.getBaseStationRunners(raceId),
          ]);
          // Rows set aside when resolving a data check don't count anywhere
          return [...checkpointRunners, ...baseStationRunners.filter(r => r.status !== 'superseded')];
        } catch (error) {
          console.error('Failed to load runners:', error);
          return [];
        }
      },

      initializeRunners: async (raceId) => {
        return await StorageService.getCheckpointRunners(raceId);
      },

      refreshData: async ({ silent = false } = {}) => {
        const { currentRaceId } = get();
        if (!currentRaceId) return;

        try {
          if (!silent) set({ loading: true, error: null });

          const runners = await get().loadRunners(currentRaceId);
          // Receive needs the race's bibs, received calls and who is out. These
          // are look-ups for validation — if one fails, warn and carry on empty
          // rather than failing the whole refresh.
          const repo = new BaseOperationsRepository();
          const raceKey = raceKeyOf(currentRaceId);
          const soft = (label, p) => Promise.resolve().then(() => p()).catch(err => {
            console.warn(`Base refresh: could not load ${label}`, err);
            return [];
          });
          const [raceRunnerRows, radioCalls, outList, baseRows, resolutions] = await Promise.all([
            soft('race runners', () => db.runners.where('raceId').equals(raceKey).toArray()),
            soft('radio calls', () => repo.getRadioCalls(raceKey)),
            soft('out list', () => repo.getOutList(raceKey)),
            soft('base records', () => repo.getBaseStationRunners(raceKey)),
            soft('resolutions', () => repo.getResolutions(raceKey)),
          ]);
          const stats = get().calculateStats(runners);

          // Compute per-wave breakdown if the race has multiple batches
          const batches = await db.race_batches
            .where('raceId').equals(currentRaceId).sortBy('batchNumber');
          if (batches.length > 1) {
            const baseRunners = await StorageService.getRunners(currentRaceId);
            const finishedNums = new Set(
              runners
                .filter(r => r.checkpointNumber === 0 && r.status === RUNNER_STATUSES.PASSED)
                .map(r => r.number)
            );
            stats.waveBreakdown = batches.map(batch => {
              const waveRunners = baseRunners.filter(r => r.batchNumber === batch.batchNumber);
              const dns = waveRunners.filter(
                r => r.status === RUNNER_STATUSES.NON_STARTER || r.status === RUNNER_STATUSES.DNS || r.status === 'dns'
              ).length;
              const throughCP = waveRunners.filter(r => finishedNums.has(r.number)).length;
              return {
                batchNumber: batch.batchNumber,
                label: batch.batchName || `Wave ${batch.batchNumber}`,
                throughCP,
                pending: Math.max(0, waveRunners.length - dns - throughCP),
                dns,
              };
            });
          } else {
            stats.waveBreakdown = [];
          }

          set({
            runners,
            stats,
            raceRunnerNumbers: raceRunnerRows.map(r => r.number),
            radioCalls,
            outList,
            baseRows,
            resolutions,
            loading: false,
            lastSync: new Date().toISOString()
          });
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Actions - Receive (radio calls)
      setReceive: (patch) => set(state => ({
        receive: { ...state.receive, ...(typeof patch === 'function' ? patch(state.receive) : patch) },
      })),

      resetReceive: () => set({ receive: EMPTY_RECEIVE }),

      recordCall: async (checkpointNumber, checked) => {
        const { currentRaceId } = get();
        if (!currentRaceId) throw new Error('No active race');
        const repo = new BaseOperationsRepository();
        const callId = await repo.recordCall(raceKeyOf(currentRaceId), checkpointNumber, checked, TimeUtils.getCurrentTimestamp());
        await get().refreshData({ silent: true });
        return callId;
      },

      undoCall: async (callId) => {
        const repo = new BaseOperationsRepository();
        await repo.undoCall(callId);
        await get().refreshData({ silent: true });
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

      undoDns: async (runnerNumber) => {
        const { currentRaceId } = get();
        if (!currentRaceId) throw new Error('No active race');
        const repo = new BaseOperationsRepository();
        await repo.reverseNonStarter(currentRaceId, Number(runnerNumber));
        await get().refreshData();
      },

      withdrawRunner: async (runnerNumber, reason, comments, checkpoint, withdrawalTime) => {
        const { currentRaceId } = get();
        if (!currentRaceId) throw new Error('No active race');
        const repo = new BaseOperationsRepository();
        await repo.withdrawRunner(currentRaceId, Number(runnerNumber), checkpoint, reason, comments, withdrawalTime);
        await get().refreshData();
      },

      reverseWithdrawal: async (runnerNumber) => {
        const { currentRaceId } = get();
        if (!currentRaceId) throw new Error('No active race');
        const repo = new BaseOperationsRepository();
        await repo.reverseWithdrawal(currentRaceId, Number(runnerNumber));
        await get().refreshData();
      },

      // Actions - DNF / DNS bulk (spec §4.11). Each change is audit-logged by the
      // repository; one silent refresh at the end.
      // prev: Map(bib → out record from outRecords()) for runners already out
      applyOutStatus: async ({ mode, numbers, where = null, reason = '', comments = '', time, prev = new Map() }) => {
        const { currentRaceId } = get();
        if (!currentRaceId) throw new Error('No active race');
        const raceKey = raceKeyOf(currentRaceId);
        const repo = new BaseOperationsRepository();
        const ops = [];
        for (const num of numbers) {
          const before = prev.get(num) ?? null;
          if (mode === 'dnf') {
            if (before?.status === 'DNS') await repo.reverseNonStarter(raceKey, num);
            await repo.withdrawRunner(raceKey, num, where, reason || '', comments, time);
          } else {
            if (before?.kind === 'withdrawal') await repo.reverseWithdrawal(raceKey, num);
            await repo.markAsNonStarter(raceKey, num, '');
          }
          ops.push({ num, mode, before });
        }
        await get().refreshData({ silent: true });
        return ops;
      },

      /** Undo applyOutStatus: reverse each change, then restore what was there. */
      undoOutStatus: async (ops) => {
        const { currentRaceId } = get();
        const raceKey = raceKeyOf(currentRaceId);
        const repo = new BaseOperationsRepository();
        for (const { num, mode, before } of [...ops].reverse()) {
          if (mode === 'dnf') await repo.reverseWithdrawal(raceKey, num);
          else await repo.reverseNonStarter(raceKey, num);
          if (before) await get()._restoreOut(repo, raceKey, before);
        }
        await get().refreshData({ silent: true });
      },

      /** Put a runner back in the race (Clear on the out list). */
      clearOutStatus: async (record) => {
        const { currentRaceId } = get();
        const raceKey = raceKeyOf(currentRaceId);
        const repo = new BaseOperationsRepository();
        if (record.status === 'DNS') await repo.reverseNonStarter(raceKey, record.number);
        else await repo.reverseWithdrawal(raceKey, record.number);
        await get().refreshData({ silent: true });
      },

      restoreOutStatus: async (record) => {
        const { currentRaceId } = get();
        const raceKey = raceKeyOf(currentRaceId);
        await get()._restoreOut(new BaseOperationsRepository(), raceKey, record);
        await get().refreshData({ silent: true });
      },

      _restoreOut: async (repo, raceKey, record) => {
        if (record.status === 'DNS') await repo.markAsNonStarter(raceKey, record.number, '');
        else if (record.kind === 'withdrawal') {
          await repo.withdrawRunner(raceKey, record.number, record.checkpoint ?? null, record.reason || '', record.comments || '', record.time || undefined);
        }
      },

      // Actions - data-check resolutions (spec §4.12)
      addResolution: async (issueKey, resolution) => {
        const repo = new BaseOperationsRepository();
        const id = await repo.addResolution(raceKeyOf(get().currentRaceId), issueKey, resolution);
        await get().refreshData({ silent: true });
        return id;
      },

      removeResolution: async (id) => {
        await new BaseOperationsRepository().removeResolution(id);
        await get().refreshData({ silent: true });
      },

      supersedeBaseRows: async (ids, reason) => {
        const before = await new BaseOperationsRepository().supersedeBaseRows(raceKeyOf(get().currentRaceId), ids, reason);
        await get().refreshData({ silent: true });
        return before;
      },

      restoreBaseRows: async (rows) => {
        await new BaseOperationsRepository().restoreBaseRows(raceKeyOf(get().currentRaceId), rows);
        await get().refreshData({ silent: true });
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
            return repo.generateMissingNumbersReport(currentRaceId, options.checkpoint ?? 1, options.format ?? 'csv');
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

      loadOutList: async () => {
        const { currentRaceId } = get();
        if (!currentRaceId) return;
        const repo = new BaseOperationsRepository();
        const outList = await repo.getOutList(currentRaceId);
        set({ outList });
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
        const total = getRunnerTotal(currentRace);

        // Runners with a base station record (checkpointNumber === 0, status 'passed') are finishers.
        // All other records use the highest-checkpoint entry to determine current status.
        const finishedAtBase = new Set(
          runners
            .filter(r => r.checkpointNumber === 0 && r.status === RUNNER_STATUSES.PASSED)
            .map(r => r.number)
        );

        const byCheckpoint = new Map();
        for (const runner of runners) {
          if (runner.checkpointNumber === 0) continue; // base station handled above
          const existing = byCheckpoint.get(runner.number);
          if (!existing || runner.checkpointNumber > existing.checkpointNumber) {
            byCheckpoint.set(runner.number, runner);
          }
        }

        const counts = { finished: finishedAtBase.size, active: 0, dnf: 0, dns: 0 };
        for (const runner of byCheckpoint.values()) {
          if (finishedAtBase.has(runner.number)) continue;
          const s = runner.status;
          if (s === RUNNER_STATUSES.DNF) counts.dnf++;
          else if (s === RUNNER_STATUSES.DNS || s === RUNNER_STATUSES.NON_STARTER || s === 'dns') counts.dns++;
          else counts.active++;
        }

        const notStarted = total - counts.finished - counts.active - counts.dnf - counts.dns;

        // Per-checkpoint counts — distinct runner numbers recorded at each CP
        const checkpointCounts = {};
        for (const runner of runners) {
          if (runner.checkpointNumber === 0) continue;
          const cp = runner.checkpointNumber;
          checkpointCounts[cp] = (checkpointCounts[cp] ?? 0) + 1;
        }

        return { notStarted: Math.max(0, notStarted), ...counts, total, checkpointCounts };
      },

      submitRadioBatch: async (runnerNumbers, time, checkpointNumber, meta = {}) => {
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
            editedFrom: meta.editedFrom ?? null,
            editedAt: meta.editedFrom ? new Date().toISOString() : null,
          };
          set(state => ({ sessionBatches: [newBatch, ...state.sessionBatches] }));
          await get().refreshData();
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      clearCheckpointRunner: async (runnerNumber, checkpointNumber) => {
        const { currentRaceId } = get();
        if (!currentRaceId) return;
        await StorageService.updateCheckpointRunner(
          currentRaceId, checkpointNumber, Number(runnerNumber),
          { status: RUNNER_STATUSES.NOT_STARTED, actualTime: null, markOffTime: null, callInTime: null, commonTime: null, commonTimeLabel: null, calledIn: false }
        );
        await get().refreshData();
      },

      clearAllCheckpointTimes: async (runnerNumber) => {
        const { currentRaceId } = get();
        if (!currentRaceId) return;
        const allCheckpointRunners = await StorageService.getCheckpointRunners(currentRaceId);
        const runnerRecords = allCheckpointRunners.filter(r => r.number === Number(runnerNumber));
        for (const r of runnerRecords) {
          await StorageService.updateCheckpointRunner(
            currentRaceId, r.checkpointNumber, r.number,
            { status: RUNNER_STATUSES.NOT_STARTED, actualTime: null, markOffTime: null, callInTime: null, commonTime: null, commonTimeLabel: null, calledIn: false }
          );
        }
        await get().refreshData();
      },

      editSessionBatch: async (batchId, newBibs, commonTime, checkpointNumber) => {
        await get().voidSessionBatch(batchId);
        await get().submitRadioBatch(newBibs, commonTime, checkpointNumber, { editedFrom: batchId });
      },

      voidSessionBatch: async (batchId) => {
        const { currentRaceId, sessionBatches } = get();
        const batch = sessionBatches.find(b => b.id === batchId);
        if (batch && currentRaceId) {
          for (const num of batch.bibs) {
            await StorageService.updateCheckpointRunner(
              currentRaceId, batch.checkpointNumber, Number(num),
              { status: RUNNER_STATUSES.NOT_STARTED, actualTime: null, markOffTime: null, callInTime: null, commonTime: null, commonTimeLabel: null, calledIn: false }
            );
          }
        }
        set(state => ({
          sessionBatches: state.sessionBatches.map(b => b.id === batchId ? { ...b, voided: true } : b)
        }));
        await get().refreshData();
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
            notStarted: 0,
            finished: 0,
            active: 0,
            dnf: 0,
            dns: 0,
            total: 0,
            checkpointCounts: {},
          }
        });
      }
    }),
    {
      name: 'base-operations-storage',
      // Only persist UI preferences — never race data (causes stale state across sessions)
      // UI preferences, plus the call being received: a page reload (e.g. a
      // service-worker update mid-call) must not drop the numbers taken so far.
      partialize: (state) => ({
        sortOrder: state.sortOrder,
        filterStatus: state.filterStatus,
        receive: state.receive,
      })
    }
  )
);

export default useBaseOperationsStore;
