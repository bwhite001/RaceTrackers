import { describe, it, expect, beforeEach } from 'vitest';
import db from '../../src/shared/services/database/schema.js';
import CheckpointRepository from '../../src/modules/checkpoint-operations/services/CheckpointRepository.js';
import TimeUtils from '../../src/services/timeUtils.js';

const RACE = 1;
const CP = 3;
const at = (h, m) => TimeUtils.atLocalTime('2026-11-08T00:00:00.000Z', h, m);
const get = (n) => db.checkpoint_runners.where(['raceId', 'checkpointNumber', 'number']).equals([RACE, CP, n]).first();

beforeEach(async () => {
  await db.checkpoint_runners.clear();
  await db.checkpoint_runners.bulkAdd([140, 141, 142].map(number => ({
    raceId: RACE, checkpointNumber: CP, number, status: 'not-started', calledIn: false,
  })));
});

describe('checkpoint mark off — redesign', () => {
  it('marks passed with actual + common time and remembers the first time', async () => {
    await CheckpointRepository.markPassed(RACE, CP, [142], at(7, 37));
    const r = await get(142);
    expect(r).toMatchObject({ status: 'passed', actualTime: at(7, 37), calledIn: false, correction: false, originalTime: at(7, 37) });
    expect(r.commonTime).toBe(at(7, 35));
  });

  it('unmark keeps "was HH:MM" so the original time can be restored', async () => {
    await CheckpointRepository.markPassed(RACE, CP, [142], at(7, 37));
    await CheckpointRepository.unmark(RACE, CP, 142);
    let r = await get(142);
    expect(r.status).toBe('not-started');
    expect(r.actualTime).toBeNull();
    expect(r.unmarkedTime).toBe(at(7, 37));

    // Restore: mark again at the original time
    await CheckpointRepository.markPassed(RACE, CP, [142], r.unmarkedTime);
    r = await get(142);
    expect(r).toMatchObject({ status: 'passed', actualTime: at(7, 37), unmarkedTime: null });
  });

  it('editing a called-in time sends it back as a correction', async () => {
    await CheckpointRepository.markPassed(RACE, CP, [141], at(7, 31));
    await CheckpointRepository.setCalledIn(RACE, CP, [141], true);
    expect((await get(141)).calledIn).toBe(true);

    await CheckpointRepository.editTime(RACE, CP, 141, at(7, 33));
    const r = await get(141);
    expect(r).toMatchObject({ status: 'passed', actualTime: at(7, 33), calledIn: false, correction: true, originalTime: at(7, 31) });
    expect(r.editedAt).toBeTruthy();

    // Calling it in again clears the correction
    await CheckpointRepository.setCalledIn(RACE, CP, [141], true);
    expect(await get(141)).toMatchObject({ calledIn: true, correction: false });
  });

  it('editing a time base has not got yet is not a correction', async () => {
    await CheckpointRepository.markPassed(RACE, CP, [140], at(7, 40));
    await CheckpointRepository.editTime(RACE, CP, 140, at(7, 38));
    expect(await get(140)).toMatchObject({ actualTime: at(7, 38), correction: false, calledIn: false });
  });

  it('snapshot + restore undoes any change exactly', async () => {
    await CheckpointRepository.markPassed(RACE, CP, [142], at(7, 37));
    await CheckpointRepository.setCalledIn(RACE, CP, [142], true);
    const before = await get(142);
    const snap = await CheckpointRepository.snapshot(RACE, CP, [142, 999]);
    await CheckpointRepository.unmark(RACE, CP, 142);
    await CheckpointRepository.setOut(RACE, CP, 999, 'dnf'); // creates a row
    await CheckpointRepository.restoreSnapshot(RACE, CP, snap);
    expect(await get(142)).toEqual(before);
    expect(await get(999)).toBeUndefined();
  });

  it('DNS / DNF and clearing them', async () => {
    await CheckpointRepository.setOut(RACE, CP, 140, 'non-starter');
    expect((await get(140)).status).toBe('non-starter');
    await CheckpointRepository.clearOut(RACE, CP, 140);
    expect((await get(140)).status).toBe('not-started');
    await expect(CheckpointRepository.setOut(RACE, CP, 140, 'passed')).rejects.toThrow();
  });

  it('undo call-in puts the runner back on the callout sheet', async () => {
    await CheckpointRepository.markPassed(RACE, CP, [140], at(7, 40));
    await CheckpointRepository.setCalledIn(RACE, CP, [140], true);
    await CheckpointRepository.setCalledIn(RACE, CP, [140], false);
    expect(await get(140)).toMatchObject({ status: 'passed', calledIn: false, callInTime: null });
  });
});

describe('checkpoint seeding is idempotent', () => {
  it('two concurrent initialisations create one row per bib', async () => {
    await db.checkpoint_runners.clear();
    await db.runners.where('raceId').equals(77).delete();
    await db.runners.bulkAdd([1, 2, 3].map(number => ({ raceId: 77, number, status: 'not-started', batchNumber: 1 })));
    const StorageService = (await import('../../src/services/storage.js')).default;
    await Promise.all([
      CheckpointRepository.initializeCheckpoint(77, 1),
      CheckpointRepository.initializeCheckpoint(77, 1),
      StorageService.initializeCheckpointRunners(77, 1),
    ]);
    const rows = await db.checkpoint_runners.where('raceId').equals(77).toArray();
    expect(rows.map(r => r.number).sort()).toEqual([1, 2, 3]);
  });

  it('reads ignore duplicate rows left by older builds', async () => {
    await db.checkpoint_runners.clear();
    await db.checkpoint_runners.bulkAdd([
      { raceId: 78, checkpointNumber: 1, number: 5, status: 'passed' },
      { raceId: 78, checkpointNumber: 1, number: 5, status: 'not-started' },
    ]);
    const rs = await CheckpointRepository.getCheckpointRunners(78, 1);
    expect(rs).toHaveLength(1);
    expect(rs[0].status).toBe('passed');
    expect(await db.checkpoint_runners.count()).toBe(2); // nothing deleted
  });
});

describe('clearing DNS / DNF keeps a pass time (review fix)', () => {
  it('a passed runner marked DNF then cleared is passed again with the same time', async () => {
    await db.checkpoint_runners.clear();
    await db.checkpoint_runners.add({ raceId: RACE, checkpointNumber: CP, number: 150, status: 'not-started', calledIn: false });
    await CheckpointRepository.markPassed(RACE, CP, [150], at(10, 5));
    await CheckpointRepository.setCalledIn(RACE, CP, [150], true);
    await CheckpointRepository.setOut(RACE, CP, 150, 'dnf');
    await CheckpointRepository.clearOut(RACE, CP, 150);
    expect(await get(150)).toMatchObject({ status: 'passed', actualTime: at(10, 5), calledIn: false });
  });
});
