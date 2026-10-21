import { describe, it, expect, beforeEach } from 'vitest';
import db from '../../src/shared/services/database/schema.js';
import { BaseOperationsRepository } from '../../src/modules/base-operations/services/BaseOperationsRepository.js';

const repo = new BaseOperationsRepository();
const RACE = 900;
const T1 = '2026-11-08T07:40:00.000Z';
const T2 = '2026-11-08T07:45:00.000Z';
const NOW = '2026-11-08T08:30:00.000Z';

beforeEach(async () => {
  await db.base_station_runners.clear();
  await db.radio_calls.clear();
  await db.checkpoint_runners.clear();
});

describe('recordCall / undoCall', () => {
  it('records only ok + info numbers, keeps skipped and rejected on the call', async () => {
    const callId = await repo.recordCall(RACE, 3, [
      { num: 140, t: T1, kind: 'ok' },
      { num: 186, t: T1, kind: 'info', note: 'Not seen CP2' },
      { num: 140, t: T2, kind: 'warn', note: 'Said twice' },
      { num: 999, t: T2, kind: 'bad', note: 'Not in race' },
    ], NOW);

    const rows = await db.base_station_runners.where('raceId').equals(RACE).toArray();
    expect(rows.map(r => [r.number, r.checkpointNumber, r.commonTime, r.markOffEntryTime, r.callId, r.status]))
      .toEqual([[140, 3, T1, NOW, callId, 'passed'], [186, 3, T1, NOW, callId, 'passed']]);

    const call = await db.radio_calls.get(callId);
    expect(call.recorded).toEqual([140, 186]);
    expect(call.skipped).toEqual([{ number: 140, reason: 'Said twice' }]);
    expect(call.rejected).toEqual([{ number: 999, reason: 'Not in race', time: T2 }]);
    expect(call.blocks).toEqual([{ time: T1, numbers: [140, 186] }, { time: T2, numbers: [140, 999] }]);
    expect(await db.checkpoint_runners.count()).toBe(0); // never touches checkpoint data (G11)
    expect(await db.audit_log.where('raceId').equals(RACE).count()).toBeGreaterThan(0);
  });

  it('undo removes the call rows and marks the call undone', async () => {
    const callId = await repo.recordCall(RACE, 3, [{ num: 140, t: T1, kind: 'ok' }], NOW);
    await repo.undoCall(callId);
    expect(await db.base_station_runners.where('raceId').equals(RACE).count()).toBe(0);
    expect((await db.radio_calls.get(callId)).undoneAt).toBeTruthy();
  });

  it('reuses an empty finish-line placeholder instead of duplicating it, and undo restores it', async () => {
    const placeholderId = await db.base_station_runners.add({ raceId: RACE, checkpointNumber: 0, number: 140, status: 'not-started', commonTime: null, notes: 'keep me' });
    const callId = await repo.recordCall(RACE, 0, [{ num: 140, t: T1, kind: 'ok', manual: true }], NOW);
    const rows = await db.base_station_runners.where('raceId').equals(RACE).toArray();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: placeholderId, status: 'passed', commonTime: T1, manualTime: true, callId });

    await repo.undoCall(callId);
    const after = await db.base_station_runners.get(placeholderId);
    expect(after).toMatchObject({ status: 'not-started', commonTime: null, notes: 'keep me' });
    expect(after.callId).toBeUndefined();
  });
});
