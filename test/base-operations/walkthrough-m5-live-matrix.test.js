/**
 * M-5 / #61: Checkpoint Matrix reads live data when nothing was imported
 *
 * The matrix only ever queried `imported_checkpoint_results`, so a race where
 * checkpoints radioed their numbers in showed "no data imported" even though
 * checkpoint_runners was full of passes.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { buildLiveMatrixData } from 'modules/base-operations/components/CheckpointGroupingView';
import db from 'shared/services/database/schema';

const RACE_ID = 9601;

describe('M-5 / #61: buildLiveMatrixData', () => {
  beforeEach(async () => {
    await db.races.put({ id: RACE_ID, name: 'Live Matrix Race', date: '2026-03-04', minRunner: 1, maxRunner: 10 });
    await db.checkpoints.clear();
    await db.checkpoint_runners.clear();
    await db.checkpoints.bulkPut([
      { id: 9610, raceId: RACE_ID, number: 1, name: 'Ridgeline' },
      { id: 9611, raceId: RACE_ID, number: 2, name: '' },
    ]);
  });

  it('returns one entry per checkpoint in number order', async () => {
    await db.checkpoint_runners.bulkPut([
      { id: 96101, raceId: RACE_ID, checkpointNumber: 2, number: 1, status: 'passed', actualTime: '2026-03-04T10:00:00.000Z' },
      { id: 96102, raceId: RACE_ID, checkpointNumber: 1, number: 1, status: 'passed', actualTime: '2026-03-04T09:00:00.000Z' },
    ]);

    const data = await buildLiveMatrixData(RACE_ID);
    expect(data.map(d => d.checkpointNumber)).toEqual([1, 2]);
  });

  it('uses the configured checkpoint name and falls back to CPn', async () => {
    await db.checkpoint_runners.put({
      id: 96103, raceId: RACE_ID, checkpointNumber: 1, number: 1, status: 'passed', actualTime: '2026-03-04T09:00:00.000Z',
    });

    const data = await buildLiveMatrixData(RACE_ID);
    expect(data.find(d => d.checkpointNumber === 1).checkpointName).toBe('Ridgeline');
    expect(data.find(d => d.checkpointNumber === 2).checkpointName).toBe('CP2');
  });

  it('includes only runners who passed', async () => {
    await db.checkpoint_runners.bulkPut([
      { id: 96104, raceId: RACE_ID, checkpointNumber: 1, number: 1, status: 'passed', actualTime: '2026-03-04T09:00:00.000Z' },
      { id: 96105, raceId: RACE_ID, checkpointNumber: 1, number: 2, status: 'not-started' },
      { id: 96106, raceId: RACE_ID, checkpointNumber: 1, number: 3, status: 'dnf' },
    ]);

    const cp1 = (await buildLiveMatrixData(RACE_ID)).find(d => d.checkpointNumber === 1);
    expect(cp1.runners.map(r => r.number)).toEqual([1]);
  });

  it('reads the pass time from actualTime', async () => {
    await db.checkpoint_runners.put({
      id: 96107, raceId: RACE_ID, checkpointNumber: 1, number: 1, status: 'passed', actualTime: '2026-03-04T09:15:00.000Z',
    });

    const cp1 = (await buildLiveMatrixData(RACE_ID)).find(d => d.checkpointNumber === 1);
    expect(cp1.runners[0].time).toBe('2026-03-04T09:15:00.000Z');
  });

  it('falls back to markOffTime then callInTime for older records', async () => {
    await db.checkpoint_runners.bulkPut([
      { id: 96108, raceId: RACE_ID, checkpointNumber: 1, number: 1, status: 'passed', markOffTime: '2026-03-04T09:20:00.000Z' },
      { id: 96109, raceId: RACE_ID, checkpointNumber: 1, number: 2, status: 'passed', callInTime: '2026-03-04T09:25:00.000Z' },
    ]);

    const cp1 = (await buildLiveMatrixData(RACE_ID)).find(d => d.checkpointNumber === 1);
    const byNumber = Object.fromEntries(cp1.runners.map(r => [r.number, r.time]));
    expect(byNumber[1]).toBe('2026-03-04T09:20:00.000Z');
    expect(byNumber[2]).toBe('2026-03-04T09:25:00.000Z');
  });

  it('returns an empty array when nobody has passed anywhere', async () => {
    await db.checkpoint_runners.put({
      id: 96110, raceId: RACE_ID, checkpointNumber: 1, number: 1, status: 'not-started',
    });

    expect(await buildLiveMatrixData(RACE_ID)).toEqual([]);
  });

  it('returns an empty array when the race has no checkpoints', async () => {
    await db.checkpoints.clear();
    expect(await buildLiveMatrixData(RACE_ID)).toEqual([]);
  });
});
