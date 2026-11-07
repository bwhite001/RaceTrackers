/**
 * Base backs the race up to a folder by itself: after N seconds with no new
 * entries, paused (never silently "ok") when the browser needs permission
 * again, and retried after a failed write.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, render } from '@testing-library/react';
import db from '../../src/shared/services/database/schema.js';
import { backupDb, saveBackupFolder } from '../../src/services/backup/fileBackup.js';
import { useAutoFileBackup } from '../../src/modules/base-operations/hooks/useAutoFileBackup.js';
import FileBackupStatus from '../../src/modules/base-operations/components/FileBackupStatus.jsx';
import { fakeFolder } from '../helpers/fakeFolder.js';

// fake-indexeddb can't store the fake folder's methods (a real FileSystemDirectoryHandle
// can): keep the chosen folder in memory here. Storing it is covered in fileBackup.test.js.
const saved = vi.hoisted(() => ({ folder: null }));
vi.mock('../../src/services/backup/fileBackup.js', async (importOriginal) => ({
  ...(await importOriginal()),
  saveBackupFolder: async (f) => { saved.folder = f; },
  loadBackupFolder: async () => saved.folder,
}));

const raceId = 803;
const FILE = 'race-backup-Backup-Race-2026-11-08.json';
const fileData = (folder) => JSON.parse(folder.files[FILE]).data;
const tick = (ms) => act(() => vi.advanceTimersByTimeAsync(ms));
// waitFor polls with setTimeout, which is faked here; IndexedDB (fake-indexeddb) runs on setImmediate
const waitFor = async (check) => {
  for (let i = 0; ; i++) {
    try { return check(); } catch (e) { if (i > 500) throw e; }
    await act(() => new Promise(r => setImmediate(r)));
  }
};

describe('automatic file backup', () => {
  let folder;
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    await Promise.all(['races', 'radio_calls', 'settings'].map(t => db[t].clear()));
    await backupDb.kv.clear();
    saved.folder = null;
    await db.races.put({ id: raceId, name: 'Backup Race', date: '2026-11-08', startTime: '06:30', minRunner: 1, maxRunner: 20 });
    folder = fakeFolder();
    window.showDirectoryPicker = vi.fn().mockResolvedValue(folder);
  });
  afterEach(() => { vi.useRealTimers(); delete window.showDirectoryPicker; });

  it('a base entry is in the file 30 s later', async () => {
    const { result } = renderHook(() => useAutoFileBackup(raceId));
    await act(() => result.current.chooseFolder());
    expect(result.current.status).toBe('ok');
    expect(fileData(folder).radioCalls).toHaveLength(0);

    await act(() => db.radio_calls.add({ raceId, checkpointNumber: 1, receivedAt: '2026-11-07T21:30:00.000Z', undoneAt: null }));
    await waitFor(() => expect(result.current.status).toBe('pending'));
    await tick(29000);
    expect(fileData(folder).radioCalls).toHaveLength(0);
    await tick(1000);
    await waitFor(() => expect(fileData(folder).radioCalls).toHaveLength(1));
    expect(result.current.status).toBe('ok');
    expect(result.current.lastAt).toMatch(/^\d{4}-/);
  });

  it('settings writes alone do not trigger a backup', async () => {
    const { result } = renderHook(() => useAutoFileBackup(raceId));
    await act(() => result.current.chooseFolder());
    expect(folder.writes).toBe(1);
    await act(() => db.settings.put({ key: 'x', value: 1 }));
    await tick(60000);
    expect(folder.writes).toBe(1);
    expect(result.current.status).toBe('ok');
  });

  it('paused after reload until tapped', async () => {
    folder.permission = 'prompt';
    await saveBackupFolder(folder);
    const { result } = renderHook(() => useAutoFileBackup(raceId));
    await waitFor(() => expect(result.current.status).toBe('paused'));
    expect(folder.files[FILE]).toBeUndefined();
    await act(() => result.current.resume());
    expect(result.current.status).toBe('ok');
    expect(fileData(folder).races[0].id).toBe(raceId);
  });

  it('failed write reports and retries', async () => {
    const { result } = renderHook(() => useAutoFileBackup(raceId));
    folder.fail = new DOMException('The folder is gone', 'NotFoundError');
    await act(() => result.current.chooseFolder());
    expect(result.current.status).toBe('error');
    expect(result.current.error).toMatch(/gone/);
    await act(() => db.radio_calls.add({ raceId, checkpointNumber: 2, receivedAt: '2026-11-07T21:40:00.000Z', undoneAt: null }));
    await tick(30000);
    await waitFor(() => expect(result.current.status).toBe('ok'));
    expect(fileData(folder).radioCalls).toHaveLength(1);
  });

  it('the idle delay can be changed and is remembered', async () => {
    const { result, unmount } = renderHook(() => useAutoFileBackup(raceId));
    await act(() => result.current.chooseFolder());
    await act(() => result.current.setIdleSeconds(10));
    await act(() => db.radio_calls.add({ raceId, checkpointNumber: 1, receivedAt: '2026-11-07T21:30:00.000Z', undoneAt: null }));
    await tick(10000);
    await waitFor(() => expect(fileData(folder).radioCalls).toHaveLength(1));
    unmount();
    const again = renderHook(() => useAutoFileBackup(raceId));
    await waitFor(() => expect(again.result.current.idleSeconds).toBe(10));
  });

  it('hidden when the browser has no folder access', () => {
    delete window.showDirectoryPicker;
    const { container } = render(<FileBackupStatus raceId={1} />);
    expect(container).toBeEmptyDOMElement();
  });
});
