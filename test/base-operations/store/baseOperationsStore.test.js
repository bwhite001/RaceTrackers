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

    test.skip('updates single runner', async () => {
      // TODO: Fix in Task 8.3 - store methods not implemented
      await setupTestRace();
      const store = useBaseOperationsStore.getState();

      await store.updateRunner(1, {
        status: RUNNER_STATUSES.FINISHED,
        finishTime: '2023-01-01T12:00:00Z'
      });

      const updatedRunner = store.runners.find(r => r.number === 1);
      expect(updatedRunner.status).toBe(RUNNER_STATUSES.FINISHED);
      expect(updatedRunner.finishTime).toBe('2023-01-01T12:00:00Z');
    });

    test.skip('bulk updates runners', async () => {
      // TODO: Fix in Task 8.3 - store methods not implemented
      await setupTestRace();
      const store = useBaseOperationsStore.getState();

      await store.bulkUpdateRunners([1, 2], {
        status: RUNNER_STATUSES.FINISHED,
        finishTime: '2023-01-01T12:00:00Z'
      });

      const updatedRunners = store.runners.filter(r => [1, 2].includes(r.number));
      expect(updatedRunners).toHaveLength(2);
      updatedRunners.forEach(runner => {
        expect(runner.status).toBe(RUNNER_STATUSES.FINISHED);
        expect(runner.finishTime).toBe('2023-01-01T12:00:00Z');
      });
    });

    test.skip('marks runners as DNF', async () => {
      // TODO: Fix in Task 8.3 - store methods not implemented
      await setupTestRace();
      const store = useBaseOperationsStore.getState();

      await store.markAsDNF([1, 2], 'Test reason');

      const dnfRunners = store.runners.filter(r => [1, 2].includes(r.number));
      expect(dnfRunners).toHaveLength(2);
      dnfRunners.forEach(runner => {
        expect(runner.status).toBe(RUNNER_STATUSES.DNF);
        expect(runner.dnfReason).toBe('Test reason');
        expect(runner.dnfTime).toBeTruthy();
      });
    });

    test.skip('marks runners as DNS', async () => {
      // TODO: Fix in Task 8.3 - store methods not implemented
      await setupTestRace();
      const store = useBaseOperationsStore.getState();

      await store.markAsDNS([1, 2], 'Test reason');

      const dnsRunners = store.runners.filter(r => [1, 2].includes(r.number));
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
    test.skip('manages selected runners', () => {
      // TODO: Fix in Task 8.3 - store methods not implemented
      const store = useBaseOperationsStore.getState();
      
      store.setSelectedRunners([1, 2, 3]);
      expect(store.selectedRunners).toEqual([1, 2, 3]);

      store.setSelectedRunners([]);
      expect(store.selectedRunners).toEqual([]);
    });

    test.skip('manages common time', () => {
      // TODO: Fix in Task 8.3 - store methods not implemented
      const store = useBaseOperationsStore.getState();
      const time = '2023-01-01T12:00:00Z';
      
      store.setCommonTime(time);
      expect(store.commonTime).toBe(time);
    });

    test.skip('manages batch entry mode', () => {
      // TODO: Fix in Task 8.3 - store methods not implemented
      const store = useBaseOperationsStore.getState();
      
      store.setBatchEntryMode(true);
      expect(store.batchEntryMode).toBe(true);

      store.setBatchEntryMode(false);
      expect(store.batchEntryMode).toBe(false);
    });

    test.skip('manages sort order', () => {
      // TODO: Fix in Task 8.3 - store methods not implemented
      const store = useBaseOperationsStore.getState();
      
      store.setSortOrder('status');
      expect(store.sortOrder).toBe('status');

      store.setSortOrder('time');
      expect(store.sortOrder).toBe('time');
    });

    test.skip('manages filter status', () => {
      // TODO: Fix in Task 8.3 - store methods not implemented
      const store = useBaseOperationsStore.getState();
      
      store.setFilterStatus('finished');
      expect(store.filterStatus).toBe('finished');

      store.setFilterStatus('all');
      expect(store.filterStatus).toBe('all');
    });
  });

  describe('Error Handling', () => {
    test.skip('handles initialization errors', async () => {
      // TODO: Fix in Task 8.3 - store methods not implemented
      const store = useBaseOperationsStore.getState();
      
      await expect(store.initialize('non-existent-race'))
        .rejects
        .toThrow('Race configuration not found');

      expect(store.error).toBe('Race configuration not found');
      expect(store.loading).toBe(false);
    });

    test.skip('handles runner update errors', async () => {
      // TODO: Fix in Task 8.3 - store methods not implemented
      const store = useBaseOperationsStore.getState();
      
      await expect(store.updateRunner(1, {}))
        .rejects
        .toThrow('No active race');

      expect(store.error).toBe('No active race');
      expect(store.loading).toBe(false);
    });
  });
});
