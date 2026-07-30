/**
 * CC-1: Data Sync Write-Through
 * Verifies that checkpoint and base-station operations sync status into
 * useRaceStore.runners so that Home counters, Race Overview, and Reports
 * always reflect the live race state.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CheckpointRepository } from 'modules/checkpoint-operations/services/CheckpointRepository';
import { useRaceStore } from 'store/useRaceStore';
import db from 'shared/services/database/schema';

const RACE_ID = 7001;

describe('CC-1: CheckpointRepository data sync write-through', () => {
  let repo;

  beforeEach(async () => {
    // Reset store to a known state
    useRaceStore.setState({
      currentRaceId: RACE_ID,
      runners: [
        { id: 71001, raceId: RACE_ID, number: 1, status: 'not-started' },
        { id: 71002, raceId: RACE_ID, number: 2, status: 'not-started' },
      ],
      raceConfig: { id: RACE_ID, name: 'Test Race', minRunner: 1, maxRunner: 10 },
    });

    // Seed DB
    await db.races.put({ id: RACE_ID, name: 'Test Race', date: '2026-03-04', minRunner: 1, maxRunner: 10 });
    await db.runners.bulkPut([
      { id: 71001, raceId: RACE_ID, number: 1, status: 'not-started' },
      { id: 71002, raceId: RACE_ID, number: 2, status: 'not-started' },
    ]);
    await db.checkpoints.put({ id: 7100, raceId: RACE_ID, number: 1, name: 'Gate 1' });
    await db.checkpoint_runners.bulkPut([
      { id: 72001, raceId: RACE_ID, checkpointNumber: 1, number: 1, status: 'not-started' },
      { id: 72002, raceId: RACE_ID, checkpointNumber: 1, number: 2, status: 'not-started' },
    ]);

    repo = new CheckpointRepository();
  });

  afterEach(() => {
    // Prevent async state mutations from leaking between tests
    useRaceStore.setState({ currentRaceId: null, runners: [], raceConfig: null });
  });

  it('markRunner syncs runner status to useRaceStore.runners', async () => {
    expect(useRaceStore.getState().runners.find(r => r.number === 1)?.status).toBe('not-started');

    await repo.markRunner(RACE_ID, 1, 1);

    const storeRunner = useRaceStore.getState().runners.find(r => r.number === 1);
    expect(storeRunner?.status).toBe('passed');
  });

  it('markRunner with DNF status syncs correctly', async () => {
    await repo.markRunner(RACE_ID, 1, 1, null, null, 'dnf');

    const storeRunner = useRaceStore.getState().runners.find(r => r.number === 1);
    expect(storeRunner?.status).toBe('dnf');
  });

  it('bulkMarkRunners syncs all runner statuses to useRaceStore.runners', async () => {
    await repo.bulkMarkRunners(RACE_ID, 1, [1, 2]);

    const runners = useRaceStore.getState().runners;
    expect(runners.find(r => r.number === 1)?.status).toBe('passed');
    expect(runners.find(r => r.number === 2)?.status).toBe('passed');
  });
});
