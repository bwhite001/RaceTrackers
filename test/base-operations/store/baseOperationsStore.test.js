import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import useBaseOperationsStore from '../../../src/modules/base-operations/store/baseOperationsStore';
import { RUNNER_STATUSES } from '../../../src/types';

describe('Base Operations Store', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset store state
    useBaseOperationsStore.getState().reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    test('initializes with default state', () => {
      const state = useBaseOperationsStore.getState();
      
      expect(state.currentRaceId).toBeNull();
      expect(state.checkpointNumber).toBe(1);
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
      const raceId = 'test-race-1';
      const raceConfig = {
        runnerRanges: ['1-5', '10-15']
      };

      // Mock race config in localStorage
      localStorage.setItem(`race_${raceId}_config`, JSON.stringify(raceConfig));

      // Initialize race
      await useBaseOperationsStore.getState().initialize(raceId);
      const state = useBaseOperationsStore.getState();

      expect(state.currentRaceId).toBe(raceId);
      expect(state.runners.length).toBe(11); // 5 + 6 runners from ranges
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Runner Management', () => {
    const setupTestRace = async () => {
      const raceId = 'test-race-1';
      const raceConfig = {
        runnerRanges: ['1-5']
      };

      localStorage.setItem(`race_${raceId}_config`, JSON.stringify(raceConfig));
      await useBaseOperationsStore.getState().initialize(raceId);
    };

    test('updates single runner', async () => {
      await setupTestRace();
      await useBaseOperationsStore.getState().updateRunner(1, {
        status: RUNNER_STATUSES.FINISHED,
        finishTime: '2023-01-01T12:00:00Z'
      });

      const updatedRunner = useBaseOperationsStore.getState().runners.find(r => r.number === 1);
      expect(updatedRunner.status).toBe(RUNNER_STATUSES.FINISHED);
      expect(updatedRunner.finishTime).toBe('2023-01-01T12:00:00Z');
    });

    test('bulk updates runners', async () => {
      await setupTestRace();
      await useBaseOperationsStore.getState().bulkUpdateRunners([1, 2], {
        status: RUNNER_STATUSES.FINISHED,
        finishTime: '2023-01-01T12:00:00Z'
      });

      const updatedRunners = useBaseOperationsStore.getState().runners.filter(r => [1, 2].includes(r.number));
      expect(updatedRunners).toHaveLength(2);
      updatedRunners.forEach(runner => {
        expect(runner.status).toBe(RUNNER_STATUSES.FINISHED);
        expect(runner.finishTime).toBe('2023-01-01T12:00:00Z');
      });
    });

    test('marks runners as DNF', async () => {
      await setupTestRace();
      await useBaseOperationsStore.getState().markAsDNF([1, 2], 'Test reason');

      const dnfRunners = useBaseOperationsStore.getState().runners.filter(r => [1, 2].includes(r.number));
      expect(dnfRunners).toHaveLength(2);
      dnfRunners.forEach(runner => {
        expect(runner.status).toBe(RUNNER_STATUSES.DNF);
        expect(runner.dnfReason).toBe('Test reason');
        expect(runner.dnfTime).toBeTruthy();
      });
    });

    test('marks runners as DNS', async () => {
      await setupTestRace();
      await useBaseOperationsStore.getState().markAsDNS([1, 2], 'Test reason');

      const dnsRunners = useBaseOperationsStore.getState().runners.filter(r => [1, 2].includes(r.number));
      expect(dnsRunners).toHaveLength(2);
      dnsRunners.forEach(runner => {
        expect(runner.status).toBe(RUNNER_STATUSES.DNS);
        expect(runner.dnsReason).toBe('Test reason');
      });
    });
  });

  describe('Statistics', () => {
    test('calculates correct statistics', async () => {
      const runners = [
        { number: 1, status: RUNNER_STATUSES.FINISHED },
        { number: 2, status: RUNNER_STATUSES.FINISHED },
        { number: 3, status: RUNNER_STATUSES.DNF },
        { number: 4, status: RUNNER_STATUSES.DNS },
        { number: 5, status: RUNNER_STATUSES.NOT_STARTED },
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

  describe('Error Handling', () => {
    test('handles initialization errors', async () => {
      await expect(useBaseOperationsStore.getState().initialize('non-existent-race'))
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
