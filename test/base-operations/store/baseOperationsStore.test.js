import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import useBaseOperationsStore from '../../../src/modules/base-operations/store/baseOperationsStore';
import { RUNNER_STATUSES } from '../../../src/types';
import db from '../../../src/shared/services/database/schema';
import StorageService from '../../../src/services/storage';

describe('Base Operations Store', () => {
  beforeEach(async () => {
    // Reset store state
    useBaseOperationsStore.getState().reset();
    // Clear Dexie tables
    await db.races.clear();
    await db.runners.clear();
    await db.base_station_runners.clear();
    await db.checkpoints.clear();
    await db.checkpoint_runners.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Helper: seed a race in Dexie and return its integer id
  const seedRace = async (min = 1, max = 5) => {
    const id = await db.races.add({
      name: 'Test Race',
      date: '2024-01-01',
      startTime: '08:00',
      minRunner: min,
      maxRunner: max,
      runnerRanges: [{ min, max }],
      createdAt: new Date().toISOString(),
    });
    // Seed runner records so initializeBaseStationRunners has data to copy
    const runnerRecords = [];
    for (let n = min; n <= max; n++) {
      runnerRecords.push({ raceId: id, number: n, status: 'not-started' });
    }
    await db.runners.bulkAdd(runnerRecords);
    return id;
  };

  describe('Initialization', () => {
    test('initializes with default state', () => {
      const state = useBaseOperationsStore.getState();

      expect(state.currentRaceId).toBeNull();
      expect(state.runners).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.stats).toEqual({
        total: 0,
        finished: 0,
        active: 0,
        dnf: 0,
        dns: 0
      });
    });

    test('initializes race with config', async () => {
      const raceId = await seedRace(1, 11);

      await useBaseOperationsStore.getState().initialize(raceId);
      const state = useBaseOperationsStore.getState();

      expect(state.currentRaceId).toBe(raceId);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Runner Management', () => {
    const setupTestRace = async () => {
      const raceId = await seedRace(1, 5);
      // Seed a checkpoint so markAsNonStarter can write DNS records
      await db.checkpoints.add({ raceId, number: 1, name: 'Start' });
      await useBaseOperationsStore.getState().initialize(raceId);
      return raceId;
    };

    test('updates single runner', async () => {
      const raceId = await setupTestRace();
      await useBaseOperationsStore.getState().updateRunner(1, {
        status: RUNNER_STATUSES.FINISHED,
        finishTime: '2023-01-01T12:00:00Z'
      });

      // updateRunner writes to base_station_runners; verify in DB directly
      const bsr = await db.base_station_runners.where('raceId').equals(raceId).and(r => r.number === 1).first();
      expect(bsr).toBeDefined();
      expect(bsr.status).toBe(RUNNER_STATUSES.FINISHED);
    });

    test('bulk updates runners', async () => {
      const raceId = await setupTestRace();
      await useBaseOperationsStore.getState().bulkUpdateRunners([1, 2], {
        status: RUNNER_STATUSES.FINISHED,
        finishTime: '2023-01-01T12:00:00Z'
      });

      const bsRecords = await db.base_station_runners
        .where('raceId').equals(raceId)
        .and(r => [1, 2].includes(r.number))
        .toArray();
      expect(bsRecords).toHaveLength(2);
      bsRecords.forEach(runner => {
        expect(runner.status).toBe(RUNNER_STATUSES.FINISHED);
      });
    });

    test('marks runners as DNF', async () => {
      const raceId = await setupTestRace();
      await useBaseOperationsStore.getState().markAsDNF([1, 2], 'Test reason');

      const bsRecords = await db.base_station_runners
        .where('raceId').equals(raceId)
        .and(r => [1, 2].includes(r.number))
        .toArray();
      expect(bsRecords).toHaveLength(2);
      bsRecords.forEach(runner => {
        expect(runner.status).toBe(RUNNER_STATUSES.DNF);
      });
    });

    test('marks runners as DNS', async () => {
      const raceId = await setupTestRace();
      await useBaseOperationsStore.getState().markAsDNS([1, 2], 'Test reason');

      const cpRecords = await db.checkpoint_runners
        .where('raceId').equals(raceId)
        .and(r => [1, 2].includes(r.number))
        .toArray();
      expect(cpRecords).toHaveLength(2);
      cpRecords.forEach(r => {
        expect(r.status).toBe(RUNNER_STATUSES.DNS);
      });
    });
  });

  describe('Statistics', () => {
    test('calculates correct statistics', async () => {
      useBaseOperationsStore.setState({ currentRace: { minRunner: 1, maxRunner: 5 } });
      const runners = [
        { number: 1, checkpointNumber: 0, status: RUNNER_STATUSES.FINISHED }, // base station = finished
        { number: 2, checkpointNumber: 0, status: RUNNER_STATUSES.FINISHED }, // base station = finished
        { number: 3, checkpointNumber: 1, status: RUNNER_STATUSES.DNF },
        { number: 4, checkpointNumber: 1, status: RUNNER_STATUSES.DNS },
        { number: 5, checkpointNumber: 1, status: RUNNER_STATUSES.NOT_STARTED },
      ];

      const stats = useBaseOperationsStore.getState().calculateStats(runners);

      expect(stats).toEqual({
        total: 5,
        finished: 2,
        active: 1,
        dnf: 1,
        dns: 1
      });
    });
  });

  describe('UI State Management', () => {
    test('manages selected runners', () => {
      useBaseOperationsStore.getState().setSelectedRunners([1, 2, 3]);
      expect(useBaseOperationsStore.getState().selectedRunners).toEqual([1, 2, 3]);

      useBaseOperationsStore.getState().setSelectedRunners([]);
      expect(useBaseOperationsStore.getState().selectedRunners).toEqual([]);
    });

    test('manages common time', () => {
      const time = '2023-01-01T12:00:00Z';
      useBaseOperationsStore.getState().setCommonTime(time);
      expect(useBaseOperationsStore.getState().commonTime).toBe(time);
    });

    test('manages batch entry mode', () => {
      useBaseOperationsStore.getState().setBatchEntryMode(true);
      expect(useBaseOperationsStore.getState().batchEntryMode).toBe(true);

      useBaseOperationsStore.getState().setBatchEntryMode(false);
      expect(useBaseOperationsStore.getState().batchEntryMode).toBe(false);
    });

    test('manages sort order', () => {
      useBaseOperationsStore.getState().setSortOrder('status');
      expect(useBaseOperationsStore.getState().sortOrder).toBe('status');

      useBaseOperationsStore.getState().setSortOrder('time');
      expect(useBaseOperationsStore.getState().sortOrder).toBe('time');
    });

    test('manages filter status', () => {
      useBaseOperationsStore.getState().setFilterStatus('finished');
      expect(useBaseOperationsStore.getState().filterStatus).toBe('finished');

      useBaseOperationsStore.getState().setFilterStatus('all');
      expect(useBaseOperationsStore.getState().filterStatus).toBe('all');
    });
  });

  describe('editSessionBatch', () => {
    test('voids the original batch and creates a replacement with editedFrom set', async () => {
      vi.spyOn(StorageService, 'updateCheckpointRunner').mockResolvedValue();
      useBaseOperationsStore.setState({
        sessionBatches: [{
          id: 'batch-original',
          checkpointNumber: 1,
          commonTime: '10:00',
          bibs: [1, 2],
          submittedAt: new Date().toISOString(),
          voided: false,
          editedFrom: null,
          editedAt: null,
        }],
        currentRaceId: 'race1',
        loading: false,
      });

      await useBaseOperationsStore.getState().editSessionBatch('batch-original', [1, 3], '10:00', 1);

      const batches = useBaseOperationsStore.getState().sessionBatches;
      const original = batches.find(b => b.id === 'batch-original');
      expect(original.voided).toBe(true);
      const replacement = batches.find(b => b.editedFrom === 'batch-original');
      expect(replacement).toBeDefined();
      expect(replacement.bibs).toEqual(expect.arrayContaining([1, 3]));
      expect(replacement.voided).toBe(false);
      expect(replacement.editedAt).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('handles initialization errors', async () => {
      await expect(useBaseOperationsStore.getState().initialize(99999))
        .rejects
        .toThrow('Race configuration not found');

      expect(useBaseOperationsStore.getState().error).toBe('Race configuration not found');
      expect(useBaseOperationsStore.getState().loading).toBe(false);
    });

    test('handles runner update errors', async () => {
      await expect(useBaseOperationsStore.getState().updateRunner(1, {}))
        .rejects
        .toThrow('No active race');

      expect(useBaseOperationsStore.getState().error).toBe('No active race');
      expect(useBaseOperationsStore.getState().loading).toBe(false);
    });
  });
});
