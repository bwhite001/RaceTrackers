/**
 * CC-1: Data Sync Write-Through — base station half
 *
 * Issues #18, #19, #30, #51, #55, #58
 *
 * Home counters, Race Overview and all Report views read useRaceStore.runners.
 * Base station mark operations wrote only to base_station_runners, so those
 * views showed stale "not started" status. After the fix every base station
 * mark syncs status into useRaceStore.runners.
 *
 * submitRadioBatch additionally has to upsert into base_station_runners
 * (checkpointNumber 0) so finisher stats count radio-called runners (#58).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import useBaseOperationsStore from 'modules/base-operations/store/baseOperationsStore';
import { useRaceStore } from 'store/useRaceStore';
import { RUNNER_STATUSES } from 'types';
import db from 'shared/services/database/schema';

const RACE_ID = 7301;

const seedRunners = () => ([
  { id: 73001, raceId: RACE_ID, number: 1, status: RUNNER_STATUSES.NOT_STARTED },
  { id: 73002, raceId: RACE_ID, number: 2, status: RUNNER_STATUSES.NOT_STARTED },
]);

describe('CC-1: baseOperationsStore write-through to useRaceStore', () => {
  beforeEach(async () => {
    await db.races.put({ id: RACE_ID, name: 'Base Sync Race', date: '2026-03-04', minRunner: 1, maxRunner: 10 });
    await db.runners.bulkPut(seedRunners());
    await db.checkpoints.put({ id: 7300, raceId: RACE_ID, number: 1, name: 'Ridgeline' });
    await db.base_station_runners.bulkPut([
      { id: 74001, raceId: RACE_ID, checkpointNumber: 0, number: 1, status: RUNNER_STATUSES.NOT_STARTED },
      { id: 74002, raceId: RACE_ID, checkpointNumber: 0, number: 2, status: RUNNER_STATUSES.NOT_STARTED },
    ]);

    useRaceStore.setState({
      currentRaceId: RACE_ID,
      runners: seedRunners(),
      raceConfig: { id: RACE_ID, name: 'Base Sync Race', minRunner: 1, maxRunner: 10 },
    });
    useBaseOperationsStore.setState({ currentRaceId: RACE_ID, sessionBatches: [] });
  });

  afterEach(() => {
    useRaceStore.setState({ currentRaceId: null, runners: [], raceConfig: null });
    useBaseOperationsStore.setState({ currentRaceId: null, sessionBatches: [] });
  });

  const storeStatus = (number) =>
    useRaceStore.getState().runners.find(r => r.number === number)?.status;

  it('bulkUpdateRunners syncs status into useRaceStore.runners', async () => {
    expect(storeStatus(1)).toBe(RUNNER_STATUSES.NOT_STARTED);

    await useBaseOperationsStore.getState().bulkUpdateRunners([1, 2], {
      status: RUNNER_STATUSES.FINISHED,
      commonTime: '2026-03-04T10:00:00.000Z',
    });

    expect(storeStatus(1)).toBe(RUNNER_STATUSES.FINISHED);
    expect(storeStatus(2)).toBe(RUNNER_STATUSES.FINISHED);
  });

  it('bulkMarkRunners (string time form) syncs status into useRaceStore.runners', async () => {
    await useBaseOperationsStore.getState().bulkMarkRunners([1], '2026-03-04T10:05:00.000Z');

    expect(storeStatus(1)).toBe(RUNNER_STATUSES.FINISHED);
  });

  it('bulkMarkRunners (options form) syncs a DNF status', async () => {
    await useBaseOperationsStore.getState().bulkMarkRunners([2], {
      status: RUNNER_STATUSES.DNF,
      reason: 'Injury',
      timestamp: '2026-03-04T10:10:00.000Z',
    });

    expect(storeStatus(2)).toBe(RUNNER_STATUSES.DNF);
  });

  it('write-through accepts string bib numbers without breaking the match', async () => {
    await useBaseOperationsStore.getState().bulkUpdateRunners(['1'], {
      status: RUNNER_STATUSES.FINISHED,
    });

    expect(storeStatus(1)).toBe(RUNNER_STATUSES.FINISHED);
  });
});

describe('CC-1: submitRadioBatch also records finishers (#58)', () => {
  beforeEach(async () => {
    await db.races.put({ id: RACE_ID, name: 'Radio Race', date: '2026-03-04', minRunner: 1, maxRunner: 10 });
    await db.runners.bulkPut(seedRunners());
    await db.checkpoints.put({ id: 7300, raceId: RACE_ID, number: 1, name: 'Ridgeline' });
    await db.checkpoint_runners.bulkPut([
      { id: 75001, raceId: RACE_ID, checkpointNumber: 1, number: 1, status: RUNNER_STATUSES.NOT_STARTED },
    ]);
    await db.base_station_runners.clear();

    useRaceStore.setState({
      currentRaceId: RACE_ID,
      runners: seedRunners(),
      raceConfig: { id: RACE_ID, name: 'Radio Race', minRunner: 1, maxRunner: 10 },
    });
    useBaseOperationsStore.setState({ currentRaceId: RACE_ID, sessionBatches: [] });
  });

  afterEach(() => {
    useRaceStore.setState({ currentRaceId: null, runners: [], raceConfig: null });
    useBaseOperationsStore.setState({ currentRaceId: null, sessionBatches: [] });
  });

  it('upserts a base_station_runners row at checkpointNumber 0 so stats count the finisher', async () => {
    await useBaseOperationsStore.getState().submitRadioBatch([1], '2026-03-04T11:00:00.000Z', 1);

    const bsRow = await db.base_station_runners
      .where(['raceId', 'checkpointNumber', 'number'])
      .equals([RACE_ID, 0, 1])
      .first();

    expect(bsRow).toBeTruthy();
    expect(bsRow.status).toBe(RUNNER_STATUSES.PASSED);
    expect(bsRow.commonTime).toBe('2026-03-04T11:00:00.000Z');
  });

  it('still writes the checkpoint_runners row for the called checkpoint', async () => {
    await useBaseOperationsStore.getState().submitRadioBatch([1], '2026-03-04T11:00:00.000Z', 1);

    const cpRow = await db.checkpoint_runners
      .where(['raceId', 'checkpointNumber', 'number'])
      .equals([RACE_ID, 1, 1])
      .first();

    expect(cpRow.status).toBe(RUNNER_STATUSES.PASSED);
  });

  it('syncs the radio-called runner status into useRaceStore.runners', async () => {
    await useBaseOperationsStore.getState().submitRadioBatch([1], '2026-03-04T11:00:00.000Z', 1);

    const storeRunner = useRaceStore.getState().runners.find(r => r.number === 1);
    expect(storeRunner?.status).toBe(RUNNER_STATUSES.PASSED);
  });

  it('records the batch in session history', async () => {
    await useBaseOperationsStore.getState().submitRadioBatch([1, 2], '2026-03-04T11:05:00.000Z', 1);

    const batches = useBaseOperationsStore.getState().sessionBatches;
    expect(batches).toHaveLength(1);
    expect(batches[0].bibs).toEqual([1, 2]);
    expect(batches[0].commonTime).toBe('2026-03-04T11:05:00.000Z');
  });
});
