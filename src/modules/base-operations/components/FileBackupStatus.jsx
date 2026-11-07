import React, { useState } from 'react';
import { Button } from '../../../design-system/components';
import { BottomSheet } from '../../../design-system/components/VK';
import { hhmm } from '../../../services/blocks.js';
import { useAutoFileBackup } from '../hooks/useAutoFileBackup.js';

const IDLE_CHOICES = [10, 30, 60, 120];

const CHIP = {
  off: 'border border-white/40 text-white',
  ok: 'bg-white/10 text-white',
  pending: 'bg-white/10 text-white',
  paused: 'bg-vk-gold text-vk-ink',
  error: 'bg-vk-red text-white',
};

/**
 * Base header chip for the automatic file backup (the race's second copy).
 * Hidden where the browser can't write to a folder (phones, Firefox, Safari):
 * the Import / Export backup still works there.
 */
const FileBackupStatus = ({ raceId }) => {
  const b = useAutoFileBackup(raceId);
  const [open, setOpen] = useState(false);
  if (!b.supported) return null;

  const label = {
    off: 'File backup off',
    ok: b.lastAt ? `Backed up ${hhmm(b.lastAt)}` : 'File backup on',
    pending: 'Backup due',
    paused: 'Backup paused — tap to allow',
    error: 'Backup failed',
  }[b.status];
  // Allowing folder access again needs a tap — do it straight from the chip
  const onChip = () => (b.status === 'paused' ? b.resume() : setOpen(true));

  return (
    <>
      <button type="button" onClick={onChip} title={b.error ?? undefined}
        className={`min-h-[36px] px-3 rounded-full text-xs font-bold whitespace-nowrap ${CHIP[b.status]}`}>
        {label}
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} labelledBy="filebackup-hd">
        <h2 id="filebackup-hd" className="font-display font-bold text-xl text-vk-navy dark:text-white">File backup</h2>
        <p className="text-sm">
          A second copy of the whole race, saved as a file in a folder you choose. It is written after a pause in entries,
          and at least every 5 minutes while entries keep coming. To restore, import the file in Race management.
        </p>
        <div className="text-sm">
          <div><span className="text-vk-muted">Folder:</span> <strong>{b.folderName ?? 'none chosen'}</strong></div>
          {b.fileName && <div><span className="text-vk-muted">File:</span> {b.fileName}</div>}
          {b.lastAt && <div><span className="text-vk-muted">Last saved:</span> {hhmm(b.lastAt)}</div>}
          {b.error && <div className="text-vk-red font-semibold" role="alert">{b.error}</div>}
        </div>
        <label className="text-sm flex items-center gap-2">
          Save after
          <select value={b.idleSeconds} onChange={e => b.setIdleSeconds(Number(e.target.value))}
            className="rounded-btn border border-vk-border px-2 py-1 bg-white dark:bg-gray-800">
            {IDLE_CHOICES.map(n => <option key={n} value={n}>{n} s</option>)}
          </select>
          with no new entries
        </label>
        <div className="flex gap-2">
          <Button variant="blueOutline" size="primary" className="flex-1" onClick={b.chooseFolder}>
            {b.folderName ? 'Change folder…' : 'Choose folder…'}
          </Button>
          {b.folderName && <Button variant="gold" size="primary" className="flex-1" onClick={b.backupNow}>Back up now</Button>}
        </div>
        <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
      </BottomSheet>
    </>
  );
};

export default FileBackupStatus;
