import { describe, it, expect } from 'vitest';
import Dexie from 'dexie';

// Opens a fresh DB name at v10 (the shipped schema), writes data, then opens it
// with the app schema (v11) and checks nothing was dropped or rewritten.
const V10 = {
  races: '++id, name, date, startTime, minRunner, maxRunner, createdAt',
  runners: '++id, [raceId+number], raceId, number, gender, batchNumber, status, recordedTime, notes',
  checkpoints: '++id, [raceId+number], raceId, number, name',
  checkpoint_runners: '++id, [raceId+checkpointNumber+number], raceId, checkpointNumber, number, actualTime, commonTime, calledIn, markOffTime, callInTime, status, notes',
  base_station_runners: '++id, [raceId+checkpointNumber+number], raceId, checkpointNumber, number, commonTime, markOffEntryTime, status, notes',
  settings: 'key, value',
  withdrawal_records: '++id, [raceId+runnerNumber], raceId, runnerNumber, checkpoint, withdrawalTime, reversedAt',
};

describe('Dexie v11 migration (additive)', () => {
  it('keeps every v10 record and adds the new tables', async () => {
    const name = `RaceTrackerDB-mig-${Date.now()}`;
    const old = new Dexie(name);
    old.version(10).stores(V10);
    await old.open();
    const raceId = await old.races.add({ name: 'Old race', date: '2026-11-08', startTime: '06:30' });
    await old.checkpoint_runners.add({ raceId, checkpointNumber: 1, number: 101, status: 'passed', calledIn: true, actualTime: '2026-11-08T07:31:00.000Z' });
    await old.base_station_runners.add({ raceId, checkpointNumber: 0, number: 101, status: 'passed', commonTime: '2026-11-08T08:00:00.000Z' });
    await old.withdrawal_records.add({ raceId, runnerNumber: 102, checkpoint: 1, withdrawalTime: 'x', reversedAt: null, reason: 'Injury' });
    old.close();

    // Re-open the same physical DB under the app's v11 schema
    const { default: AppDb } = await import('../../src/shared/services/database/schema.js');
    const upgraded = new Dexie(name);
    // Reuse the app's version chain by copying its declared versions
    for (const v of AppDb._versions.slice().sort((a, b) => a._cfg.version - b._cfg.version)) {
      upgraded.version(v._cfg.version).stores(v._cfg.storesSource);
    }
    await upgraded.open();

    expect(upgraded.verno).toBe(11);
    expect(await upgraded.checkpoint_runners.count()).toBe(1);
    expect((await upgraded.checkpoint_runners.toArray())[0]).toMatchObject({ number: 101, calledIn: true, status: 'passed' });
    expect(await upgraded.base_station_runners.count()).toBe(1);
    expect((await upgraded.withdrawal_records.toArray())[0].reason).toBe('Injury');
    expect(upgraded.tables.map(t => t.name)).toEqual(expect.arrayContaining(['radio_calls', 'data_issue_resolutions', 'readout_progress']));

    // New indexes are queryable
    await upgraded.base_station_runners.add({ raceId, checkpointNumber: 2, number: 103, callId: 7 });
    expect(await upgraded.base_station_runners.where('callId').equals(7).count()).toBe(1);
    upgraded.close();
  });
});
