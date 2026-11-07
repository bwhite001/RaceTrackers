import { describe, it, expect, beforeEach } from 'vitest';
import db from '../../src/shared/services/database/schema.js';
import { fakeFolder } from '../helpers/fakeFolder.js';
import {
  backupDb, backupFileName, writeBackup, saveBackupFolder, loadBackupFolder, getIdleSeconds, setIdleSeconds, folderPermission,
} from '../../src/services/backup/fileBackup.js';

const raceId = 802;

describe('file backup', () => {
  beforeEach(async () => {
    await Promise.all(['races', 'radio_calls'].map(t => db[t].clear()));
    await backupDb.kv.clear();
    await db.races.put({ id: raceId, name: 'Mt Glorious Mountain Trail', date: '2026-11-08', startTime: '06:30', minRunner: 1, maxRunner: 200 });
    await db.radio_calls.add({ raceId, checkpointNumber: 1, receivedAt: '2026-11-07T21:30:00.000Z', undoneAt: null });
  });

  it('writes the full race package under the race file name', async () => {
    const folder = fakeFolder();
    const r = await writeBackup(folder, raceId);
    expect(r.fileName).toBe('race-backup-Mt-Glorious-Mountain-Trail-2026-11-08.json');
    expect(backupFileName({ name: 'Mt Glorious Mountain Trail', date: '2026-11-08' })).toBe(r.fileName);
    expect(JSON.parse(folder.files[r.fileName]).data.radioCalls).toHaveLength(1);
    expect(r.bytes).toBe(folder.files[r.fileName].length);
    expect(r.at).toMatch(/^\d{4}-\d\d-\d\dT/);
  });

  it('overwrites the same file each time', async () => {
    const folder = fakeFolder();
    await writeBackup(folder, raceId);
    await db.radio_calls.add({ raceId, checkpointNumber: 2, receivedAt: '2026-11-07T21:40:00.000Z', undoneAt: null });
    const r = await writeBackup(folder, raceId);
    expect(Object.keys(folder.files)).toEqual([r.fileName]);
    expect(JSON.parse(folder.files[r.fileName]).data.radioCalls).toHaveLength(2);
  });

  it('failed write reports and retries', async () => {
    const folder = fakeFolder({ fail: new DOMException('gone', 'NotFoundError') });
    await expect(writeBackup(folder, raceId)).rejects.toThrow(/gone/);
    expect(await db.radio_calls.count()).toBe(1);
    const r = await writeBackup(folder, raceId);
    expect(folder.files[r.fileName]).toBeTruthy();
  });

  it('remembers the folder and the idle seconds', async () => {
    expect(await loadBackupFolder()).toBeNull();
    await saveBackupFolder({ name: 'Backups' });
    expect((await loadBackupFolder()).name).toBe('Backups');
    expect(await getIdleSeconds()).toBe(30);
    await setIdleSeconds(60);
    expect(await getIdleSeconds()).toBe(60);
  });

  it('asks for permission only when told to', async () => {
    const folder = fakeFolder({ permission: 'prompt' });
    expect(await folderPermission(folder)).toBe('prompt');
    expect(await folderPermission(folder, { request: true })).toBe('granted');
  });
});
