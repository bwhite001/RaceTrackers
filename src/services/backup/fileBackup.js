/**
 * Base's second copy of the race: the full race backup (ExportService.exportRace)
 * written into a folder the operator picked, one file per race, overwritten each
 * time. createWritable() writes to a swap file and swaps on close(), so a write
 * cut off half-way leaves the previous backup intact.
 *
 * The chosen folder and the idle delay live in their own small database, not the
 * app's settings table: those rows are loaded into app settings state.
 */
import Dexie from 'dexie';
import { ExportService } from '../import-export/ExportService.js';
import { raceSlug } from '../../components/Shared/shareRace.js';
import TimeUtils from '../timeUtils.js';

export const backupDb = new Dexie('RaceTrackerBackup');
backupDb.version(1).stores({ kv: 'key' });

export const DEFAULT_IDLE_SECONDS = 30;

export const backupFileName = (race) => `race-backup-${raceSlug(race?.name)}-${race?.date ?? 'undated'}.json`;

const get = async (key) => (await backupDb.kv.get(key))?.value ?? null;
const put = (key, value) => backupDb.kv.put({ key, value });

export const saveBackupFolder = (handle) => put('folder', handle);
export const loadBackupFolder = () => get('folder');
export const getIdleSeconds = async () => (await get('idleSeconds')) ?? DEFAULT_IDLE_SECONDS;
export const setIdleSeconds = (n) => put('idleSeconds', n);

/** 'granted' | 'prompt' | 'denied'. Requesting needs a user tap (browser rule). */
export async function folderPermission(handle, { request = false } = {}) {
  const opts = { mode: 'readwrite' };
  return request ? handle.requestPermission(opts) : handle.queryPermission(opts);
}

/** Write the race's full backup into the folder. Rejects with the browser's error if it can't. */
export async function writeBackup(handle, raceId) {
  const pkg = await ExportService.exportRace(raceId);
  const fileName = backupFileName(pkg.data.races[0]);
  const text = JSON.stringify(pkg);
  const file = await handle.getFileHandle(fileName, { create: true });
  const out = await file.createWritable();
  await out.write(text);
  await out.close();
  return { fileName, at: TimeUtils.getCurrentTimestamp(), bytes: text.length };
}
