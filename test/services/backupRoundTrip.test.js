/**
 * A full race backup restores everything base did: DNF reasons, the call log
 * and stand-downs, late entries, resolved issues and wave names — not just
 * runners and times.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import db from '../../src/shared/services/database/schema.js';
import { ExportService, RACE_TABLES } from '../../src/services/import-export/ExportService.js';
import { ImportService } from '../../src/services/import-export/ImportService.js';

const raceId = 801;
const ROWS = {
  runners: { number: 12, status: 'not-started' },
  checkpoints: { number: 1, name: 'CP1' },
  checkpoint_runners: { checkpointNumber: 1, number: 12, status: 'passed' },
  base_station_runners: { checkpointNumber: 1, number: 12, status: 'passed', commonTime: '2026-11-07T21:00:00.000Z' },
  deleted_entries: { entryType: 'base', deletedAt: '2026-11-07T21:00:00.000Z', restorable: true },
  strapper_calls: { checkpoint: 1, status: 'pending', priority: 'normal', createdAt: '2026-11-07T21:00:00.000Z' },
  audit_log: { entityType: 'runner', action: 'update', performedAt: '2026-11-07T21:00:00.000Z' },
  withdrawal_records: { runnerNumber: 12, checkpoint: 1, withdrawalTime: '2026-11-07T21:10:00.000Z', reason: 'injury', reversedAt: null },
  vet_out_records: { runnerNumber: 13, checkpoint: 1, vetOutTime: '2026-11-07T21:20:00.000Z' },
  imported_checkpoint_results: { checkpointNumber: 3, importedAt: '2026-11-07T22:00:00.000Z' },
  race_batches: { batchNumber: 2, batchName: 'Community', startTime: null },
  radio_calls: { checkpointNumber: 1, receivedAt: '2026-11-07T21:30:00.000Z', kind: 'stand-down', undoneAt: null },
  data_issue_resolutions: { issueKey: 'skip:12:1', resolvedAt: '2026-11-07T21:40:00.000Z', resolution: 'checked' },
  readout_progress: { checkpointNumber: 1, blockTime: '2026-11-07T21:00:00.000Z' },
  checkpoint_field_changes: { checkpointNumber: 1, number: 500, kind: 'late', source: 'checkpoint' },
  field_changes: { number: 500, kind: 'late', source: 'base', callId: 1, cancelledAt: null },
  crew_vehicles: { checkpointNumber: 4, rego: '147 STU', driver: 'VK4AJG', occupants: ['VK4DTB'], leftHomeAt: '2026-11-07T18:45:00.000Z', arrivedAt: null, createdAt: '2026-11-07T18:40:00.000Z', supersededAt: null },
};

const clearAll = () => Promise.all(['races', ...RACE_TABLES.map(([, t]) => t)].map(t => db[t].clear()));

describe('full race backup', () => {
  beforeEach(async () => {
    await clearAll();
    await db.races.put({ id: raceId, name: 'Backup Race', date: '2026-11-08', startTime: '06:30', minRunner: 1, maxRunner: 20 });
    for (const [table, row] of Object.entries(ROWS)) await db[table].add({ raceId, ...row });
  });

  it('lists every per-race table', () => {
    expect(RACE_TABLES.map(([, t]) => t).sort()).toEqual(Object.keys(ROWS).sort());
  });

  it('restores every race table', async () => {
    const pkg = await ExportService.exportRace(raceId);
    await clearAll();
    await ImportService.importWithStrategy(pkg, 'newer');
    for (const [key, table] of RACE_TABLES) {
      expect(pkg.data[key]?.length, key).toBeGreaterThanOrEqual(1);
      expect(await db[table].where('raceId').equals(raceId).count(), table).toBe(pkg.data[key].length);
    }
  });

  it('keeps the DNF reason, the stand-down and the late entry', async () => {
    const pkg = await ExportService.exportRace(raceId);
    await clearAll();
    await ImportService.importWithStrategy(pkg, 'newer');
    expect((await db.withdrawal_records.where('raceId').equals(raceId).first()).reason).toBe('injury');
    expect((await db.radio_calls.where('raceId').equals(raceId).first()).kind).toBe('stand-down');
    expect((await db.field_changes.where('raceId').equals(raceId).first()).kind).toBe('late');
    expect((await db.data_issue_resolutions.where('raceId').equals(raceId).first()).issueKey).toBe('skip:12:1');
  });

  it('restores what base really writes: call audit, corrections, a DNF at base or with no checkpoint', async () => {
    await db.audit_log.add({ raceId, entityType: 'radio_call', action: 'receive-call', performedAt: '2026-11-07T21:31:00.000Z' });
    await db.audit_log.add({ raceId, entityType: 'runner', action: 'withdraw', performedAt: '2026-11-07T21:32:00.000Z' });
    await db.base_station_runners.add({ raceId, checkpointNumber: 1, number: 14, status: 'superseded', commonTime: '2026-11-07T21:05:00.000Z' });
    await db.base_station_runners.add({ raceId, checkpointNumber: 0, number: 12, status: 'passed', commonTime: '2026-11-07T22:05:00.000Z' }); // Finish
    await db.withdrawal_records.add({ raceId, runnerNumber: 15, checkpoint: null, withdrawalTime: '2026-11-07T21:33:00.000Z', reversedAt: null });
    await db.withdrawal_records.add({ raceId, runnerNumber: 16, checkpoint: 0, withdrawalTime: '2026-11-07T21:34:00.000Z', reversedAt: null });
    const pkg = await ExportService.exportRace(raceId);
    await clearAll();
    await ImportService.importWithStrategy(pkg, 'newer');
    expect(await db.withdrawal_records.where('raceId').equals(raceId).count()).toBe(3);
    expect(await db.audit_log.where('raceId').equals(raceId).count()).toBe(3);
  });

  it('restores onto a device with another race without touching it', async () => {
    const pkg = await ExportService.exportRace(raceId);
    await clearAll();
    // The spare device's own race, numbered from 1 too — but not the same record ids
    await db.races.put({ id: 900, name: 'Training', date: '2026-11-01', startTime: '07:00', minRunner: 1, maxRunner: 5 });
    await db.radio_calls.add({ raceId: 900, checkpointNumber: 1, receivedAt: '2026-11-01T21:00:00.000Z', undoneAt: null });
    await ImportService.importWithStrategy(pkg, 'newer');
    expect(await db.radio_calls.where('raceId').equals(900).count()).toBe(1);
    expect(await db.radio_calls.where('raceId').equals(raceId).count()).toBe(1);
  });

  it('refuses, and changes nothing, when a record number belongs to another race on this device', async () => {
    const pkg = await ExportService.exportRace(raceId);
    await clearAll();
    const callId = pkg.data.radioCalls[0].id;
    await db.races.put({ id: 900, name: 'Training', date: '2026-11-01', startTime: '07:00', minRunner: 1, maxRunner: 5 });
    await db.radio_calls.put({ id: callId, raceId: 900, checkpointNumber: 1, receivedAt: '2026-11-01T21:00:00.000Z', undoneAt: null });
    await expect(ImportService.importWithStrategy(pkg, 'newer')).rejects.toThrow(/another race on this device/i);
    expect((await db.radio_calls.get(callId)).raceId).toBe(900);
    expect(await db.races.get(raceId)).toBeUndefined();
  });

  it('a restore replaces the race: rows added since the backup are gone', async () => {
    const pkg = await ExportService.exportRace(raceId);
    await db.radio_calls.add({ raceId, checkpointNumber: 2, receivedAt: '2026-11-07T23:00:00.000Z', undoneAt: null });
    await ImportService.importWithStrategy(pkg, 'newer');
    expect(await db.radio_calls.where('raceId').equals(raceId).count()).toBe(1);
  });

  it('a setup file leaves the device\'s own results alone', async () => {
    const setup = await ExportService.exportRaceSetup(raceId);
    await ImportService.importWithStrategy(setup, 'newer');
    expect(await db.checkpoint_runners.where('raceId').equals(raceId).count()).toBe(1);
    expect(await db.radio_calls.where('raceId').equals(raceId).count()).toBe(1);
  });

  it('a backup is one consistent snapshot: a call and its finish rows go together', async () => {
    const write = db.transaction('rw', [db.radio_calls, db.base_station_runners], async () => {
      await db.radio_calls.add({ raceId, checkpointNumber: 0, receivedAt: '2026-11-07T23:10:00.000Z', undoneAt: null });
      await db.base_station_runners.add({ raceId, checkpointNumber: 0, number: 13, status: 'passed', commonTime: '2026-11-07T23:10:00.000Z' });
    });
    const pkg = await ExportService.exportRace(raceId);
    await write;
    const calls = pkg.data.radioCalls.length;
    const finishes = pkg.data.baseStationRunners.filter(r => r.number === 13).length;
    expect([calls, finishes]).toSatisfy(([c, f]) => (c === 1 && f === 0) || (c === 2 && f === 1));
  });

  it('imports a 3.0.0 package without the new tables', async () => {
    const pkg = await ExportService.exportRace(raceId);
    const old = ['races', 'runners', 'checkpoints', 'checkpointRunners', 'baseStationRunners', 'deletedEntries',
      'strapperCalls', 'auditLog', 'withdrawalRecords', 'vetOutRecords'];
    const data = Object.fromEntries(old.map(k => [k, pkg.data[k]]));
    await clearAll();
    await ImportService.importWithStrategy({ ...pkg, data, checksum: ExportService.generateChecksum(data) }, 'newer');
    expect(await db.runners.where('raceId').equals(raceId).count()).toBe(1);
    expect(await db.radio_calls.where('raceId').equals(raceId).count()).toBe(0);
  });
});
