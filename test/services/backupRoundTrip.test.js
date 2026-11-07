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
    await db.withdrawal_records.add({ raceId, runnerNumber: 15, checkpoint: null, withdrawalTime: '2026-11-07T21:33:00.000Z', reversedAt: null });
    await db.withdrawal_records.add({ raceId, runnerNumber: 16, checkpoint: 0, withdrawalTime: '2026-11-07T21:34:00.000Z', reversedAt: null });
    const pkg = await ExportService.exportRace(raceId);
    await clearAll();
    await ImportService.importWithStrategy(pkg, 'newer');
    expect(await db.withdrawal_records.where('raceId').equals(raceId).count()).toBe(3);
    expect(await db.audit_log.where('raceId').equals(raceId).count()).toBe(3);
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
