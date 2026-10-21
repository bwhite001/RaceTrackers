import React, { useEffect, useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import useCheckpointStore from '../../modules/checkpoint-operations/store/checkpointStore';
import { pendingRunners, groupByBlock, calledBlocks } from '../../modules/checkpoint-operations/services/checkpointStats';
import SettingsRepository from '../../shared/services/database/SettingsRepository';
import TimeUtils from '../../services/timeUtils.js';
import { hhmm, BLOCK_MINUTES } from '../../services/blocks.js';
import { BottomSheet, UndoBar, useUndo } from '../../design-system/components/VK';
import { Button } from '../../design-system/components';
import useCheckpointContext from './useCheckpointContext';

const blockRange = (block) => `${hhmm(block)} – ${hhmm(TimeUtils.addMinutes(block, BLOCK_MINUTES))}`;
const RECENT_CALLED = 2;

/**
 * Checkpoint — Callout sheet (spec §4.6). Every bib is listed on its own,
 * never as a range. No radio phrases on screen (they live in the user guide).
 */
const CalloutSheet = ({ onReadOut }) => {
  const { runners = [], setCalledIn, snapshot, restoreSnapshot } = useCheckpointStore();
  const ctx = useCheckpointContext();
  const undo = useUndo();
  const [showAllCalled, setShowAllCalled] = useState(false);
  const [logType, setLogType] = useState(null);
  const [message, setMessage] = useState('');

  const pending = pendingRunners(runners);
  const blocks = groupByBlock(pending);
  const called = calledBlocks(runners);
  const shownCalled = showAllCalled ? called : called.slice(-RECENT_CALLED);

  const markSent = async () => {
    const numbers = pending.map(r => r.number);
    if (!numbers.length) return;
    const snap = await snapshot(numbers);
    await setCalledIn(numbers, true);
    setMessage(`${numbers.length} marked as copied by base`);
    undo.offer(`${numbers.length} marked sent`, async () => {
      await restoreSnapshot(snap);
      setMessage('Back on the callout sheet');
    });
  };

  return (
    <div className="px-4 pt-3.5 pb-28 flex flex-col gap-3">
      {called.length > RECENT_CALLED && (
        <button type="button" onClick={() => setShowAllCalled(v => !v)}
          className="self-start text-[13px] font-semibold text-vk-blue min-h-[32px]">
          {showAllCalled ? 'Hide earlier calls' : `Show ${called.length - RECENT_CALLED} earlier call${called.length - RECENT_CALLED === 1 ? '' : 's'}`}
        </button>
      )}
      {shownCalled.map(g => (
        <div key={g.block} className="bg-white dark:bg-gray-800 border border-vk-border dark:border-gray-700 rounded-card px-3.5 py-2.5 flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-vk-navy flex items-center justify-center shrink-0">
            <CheckIcon className="w-3.5 h-3.5 text-vk-gold stroke-[3]" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-px flex-1 min-w-0">
            <div className="font-bold text-sm">{blockRange(g.block)} · {g.runners.length}</div>
            <div className="text-[13px] text-vk-muted break-words">{g.runners.map(r => r.number).join(', ')}</div>
          </div>
          {g.sentAt && <div className="text-xs font-semibold text-vk-muted whitespace-nowrap">Sent {hhmm(g.sentAt)}</div>}
        </div>
      ))}

      {blocks.length > 0 ? (
        <section aria-labelledby="next-call-hd" className="bg-vk-gold-tint border-2 border-vk-gold rounded-card p-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 id="next-call-hd" className="font-display font-extrabold text-lg text-vk-navy dark:text-white">
              Next call · {blocks.length} block{blocks.length === 1 ? '' : 's'}
            </h2>
            <span className="bg-vk-gold text-vk-ink rounded-full px-2.5 py-1 text-xs font-extrabold whitespace-nowrap">
              {pending.length} competitor{pending.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {blocks.map(g => (
              <div key={g.block} className="bg-white dark:bg-gray-800 rounded-btn p-3 flex flex-col gap-1.5" data-testid="pending-block">
                <div className="text-[13px] font-bold text-vk-blue">Common time {hhmm(g.block)} · {g.runners.length}</div>
                <div className="font-display font-extrabold text-[22px] tracking-[0.5px] flex flex-wrap items-center gap-x-1.5 gap-y-1 tabular-nums">
                  {g.runners.map((r, i) => (
                    <React.Fragment key={r.number}>
                      {i > 0 && <span className="text-vk-muted" aria-hidden="true">·</span>}
                      <span className="inline-flex items-center gap-1">
                        {r.number}
                        {r.correction && (
                          <span className="font-sans text-[11px] font-bold tracking-normal border border-vk-gold rounded-chip px-1.5 py-0.5 text-vk-ink">Correction</span>
                        )}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="blueOutline" size="primary" className="flex-1 !text-[13px]" onClick={onReadOut}>Read out</Button>
            <Button variant="gold" size="primary" className="flex-[2] !text-[13px]" onClick={markSent}>Base copied — mark sent</Button>
          </div>
        </section>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-vk-border dark:border-gray-700 rounded-card p-5 text-center">
          <div className="font-display font-bold text-vk-navy dark:text-white">Nothing to call in</div>
          <div className="text-[13px] text-vk-muted mt-1">Runners appear here as you mark them off.</div>
        </div>
      )}

      <div className="min-h-[18px] text-[13px] font-semibold text-vk-blue text-center" aria-live="polite">{message}</div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <Button variant="plain" size="action" className="!normal-case !font-sans !font-bold !tracking-normal !text-[13px] !text-vk-navy !border-vk-border" onClick={() => setLogType('official')}>Official message</Button>
        <Button variant="plain" size="action" className="!normal-case !font-sans !font-bold !tracking-normal !text-[13px] !text-vk-navy !border-vk-border" onClick={() => setLogType('standdown')}>Request stand down</Button>
      </div>
      <div className="text-xs text-vk-muted text-center">Send every 5–10 competitors, no more than ~5 min late</div>

      <UndoBar {...undo.bar} className="fixed left-4 right-4 bottom-[84px] z-40 max-w-xl mx-auto" />

      {logType && (
        <CheckpointLogSheet
          type={logType}
          raceId={ctx.race?.id}
          checkpointNumber={ctx.checkpointNumber}
          sender={ctx.operator || ctx.shortName}
          recipient={ctx.baseCallsign}
          onClose={() => setLogType(null)}
          onSaved={(text) => { setLogType(null); setMessage(text); }}
        />
      )}
    </div>
  );
};

/**
 * Official message / stand-down request, kept in an on-device checkpoint log
 * (WICEN: sender, recipient, message number, date/time).
 */
const CheckpointLogSheet = ({ type, raceId, checkpointNumber, sender, recipient, onClose, onSaved }) => {
  const key = `checkpointLog:${raceId}:${checkpointNumber}`;
  const [log, setLog] = useState([]);
  const [to, setTo] = useState(recipient);
  const [text, setText] = useState('');
  const official = type === 'official';

  useEffect(() => {
    SettingsRepository.getSetting(key, []).then(v => setLog(Array.isArray(v) ? v : []));
  }, [key]);

  const nextNo = log.filter(e => e.type === 'official').length + 1;
  const save = async () => {
    const entry = {
      type, at: TimeUtils.getCurrentTimestamp(), from: sender, to, text: text.trim(),
      ...(official && { number: nextNo }),
    };
    await SettingsRepository.saveSetting(key, [...log, entry]);
    onSaved(official ? `Message ${nextNo} logged at ${hhmm(entry.at)}` : `Stand-down request logged at ${hhmm(entry.at)}`);
  };

  return (
    <BottomSheet open onClose={onClose} labelledBy="log-hd">
      <h2 id="log-hd" className="font-display font-extrabold text-xl text-vk-navy dark:text-white">
        {official ? `Official message ${nextNo}` : 'Request stand down'}
      </h2>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div><span className="text-vk-muted">From</span> <strong>{sender}</strong></div>
        <div><span className="text-vk-muted">Time</span> <strong>{hhmm(TimeUtils.getCurrentTimestamp())}</strong></div>
      </div>
      {official && (
        <label className="flex flex-col gap-1 text-sm font-semibold">
          To
          <input value={to} onChange={e => setTo(e.target.value)}
            className="min-h-[48px] rounded-btn border border-vk-border px-3 font-normal dark:bg-gray-700" />
        </label>
      )}
      <label className="flex flex-col gap-1 text-sm font-semibold">
        {official ? 'Message' : 'Note'}
        <textarea value={text} onChange={e => setText(e.target.value)} rows={4}
          placeholder={official ? '' : 'e.g. sweep vehicle passed at 09:40'}
          className="rounded-btn border border-vk-border px-3 py-2 font-normal dark:bg-gray-700" />
      </label>
      <Button variant="gold" size="primary" fullWidth disabled={official && !text.trim()} onClick={save}>
        {official ? 'Log message' : 'Log request'}
      </Button>
      <Button variant="plain" size="action" fullWidth onClick={onClose}>Cancel</Button>
      {log.length > 0 && <div className="text-xs text-vk-muted text-center">{log.length} entr{log.length === 1 ? 'y' : 'ies'} in this checkpoint's log</div>}
    </BottomSheet>
  );
};

export default CalloutSheet;
