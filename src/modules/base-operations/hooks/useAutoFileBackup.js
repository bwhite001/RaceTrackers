import { useCallback, useEffect, useRef, useState } from 'react';
import Dexie from 'dexie';
import { createBackupScheduler } from '../../../services/backup/backupScheduler.js';
import {
  loadBackupFolder, saveBackupFolder, folderPermission, writeBackup,
  getIdleSeconds, setIdleSeconds as saveIdleSeconds, DEFAULT_IDLE_SECONDS,
} from '../../../services/backup/fileBackup.js';

export const MAX_WAIT_MS = 5 * 60 * 1000; // a busy base still backs up every 5 minutes

/** A write to the race database other than app settings (and not the backup's own database). */
const isRaceChange = (parts) => Object.keys(parts ?? {}).some(p => p.startsWith('idb://RaceTrackerDB/') && !p.startsWith('idb://RaceTrackerDB/settings/'));

/**
 * Base's second copy of the race: after `idleSeconds` with no new entries the
 * whole race is written to a file in the folder the operator chose.
 * status: 'off' (no folder) | 'paused' (browser needs a tap to allow) | 'ok' | 'pending' (changes not yet in the file) | 'error'.
 */
export function useAutoFileBackup(raceId) {
  const supported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  const [state, setState] = useState({ status: 'off', folderName: null, fileName: null, lastAt: null, error: null, idleSeconds: DEFAULT_IDLE_SECONDS });
  const folderRef = useRef(null);
  const schedRef = useRef(null);
  const patch = (p) => setState(s => ({ ...s, ...p }));

  const write = useCallback(async () => {
    const folder = folderRef.current;
    if (!folder || raceId == null) return;
    if (await folderPermission(folder) !== 'granted') {
      patch({ status: 'paused' });
      throw new Error('Folder access paused'); // stays unsaved; written once allowed
    }
    try {
      const r = await writeBackup(folder, raceId);
      patch({ status: 'ok', lastAt: r.at, fileName: r.fileName, error: null });
    } catch (e) {
      patch({ status: 'error', error: e?.message || String(e) });
      throw e;
    }
  }, [raceId]);

  useEffect(() => {
    if (!supported || raceId == null) return undefined;
    let live = true;
    const sched = createBackupScheduler({ idleMs: DEFAULT_IDLE_SECONDS * 1000, maxWaitMs: MAX_WAIT_MS, run: write });
    schedRef.current = sched;

    (async () => {
      const [folder, idleSeconds] = await Promise.all([loadBackupFolder(), getIdleSeconds()]);
      if (!live) return;
      sched.setIdleMs(idleSeconds * 1000);
      patch({ idleSeconds });
      if (!folder) return;
      folderRef.current = folder;
      patch({ folderName: folder.name ?? null });
      write().catch(() => {}); // a fresh copy on opening base, or 'paused' if the browser needs a tap
    })();

    const onChange = (parts) => {
      if (!isRaceChange(parts) || !folderRef.current) return;
      setState(s => (s.status === 'ok' ? { ...s, status: 'pending' } : s));
      sched.touch();
    };
    const onHide = () => { if (document.visibilityState === 'hidden') sched.flush(); };
    Dexie.on('storagemutated', onChange);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      live = false;
      Dexie.on.storagemutated.unsubscribe(onChange);
      document.removeEventListener('visibilitychange', onHide);
      sched.cancel();
    };
  }, [supported, raceId, write]);

  const chooseFolder = useCallback(async () => {
    const folder = await window.showDirectoryPicker({ id: 'racetracker-backup', mode: 'readwrite' });
    await saveBackupFolder(folder);
    folderRef.current = folder;
    patch({ folderName: folder.name ?? null });
    await write().catch(() => {});
  }, [write]);

  const resume = useCallback(async () => {
    const folder = folderRef.current;
    if (!folder) return;
    if (await folderPermission(folder, { request: true }) === 'granted') await write().catch(() => {});
  }, [write]);

  const backupNow = useCallback(() => write().catch(() => {}), [write]);

  const setIdleSeconds = useCallback(async (n) => {
    await saveIdleSeconds(n);
    schedRef.current?.setIdleMs(n * 1000);
    patch({ idleSeconds: n });
  }, []);

  return { supported, ...state, chooseFolder, resume, backupNow, setIdleSeconds };
}
