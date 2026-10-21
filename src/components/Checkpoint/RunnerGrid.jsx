import React, { useMemo, useState } from 'react';
import useCheckpointStore from '../../modules/checkpoint-operations/store/checkpointStore';
import { bibGroups, runnerTime } from '../../modules/checkpoint-operations/services/checkpointStats';
import { parseBibList } from '../../shared/utils/parseBibs';
import TimeUtils from '../../services/timeUtils.js';
import { hhmm } from '../../services/blocks.js';
import {
  checkpointRunnerState, stateClasses, numberClasses, stateLabel, RUNNER_STATE, STATE_NAMES,
} from '../../design-system/statusStyles';
import { BottomSheet, TimeStepper, UndoBar, useUndo } from '../../design-system/components/VK';
import { Button } from '../../design-system/components';
import QuickEntryBar from './QuickEntryBar';
import useCheckpointContext from './useCheckpointContext';

const HINT = 'Tap a number as the runner passes. Tap again to fix its time.';

/**
 * Checkpoint — Mark off (spec §4.5).
 * Tap a not-passed tile to mark it at now. Tap a passed / called-in tile to
 * open the edit sheet (never unmarks directly). Unmarked runners keep
 * "was HH:MM" and can be restored.
 */
const RunnerGrid = () => {
  const { runners = [], markPassed, editTime, unmarkRunner, snapshot, restoreSnapshot } = useCheckpointStore();
  const ctx = useCheckpointContext();
  const undo = useUndo();
  const [groupIdx, setGroupIdx] = useState(0);
  const [message, setMessage] = useState(HINT);
  const [sheet, setSheet] = useState(null);

  const byNumber = useMemo(() => new Map(runners.map(r => [r.number, r])), [runners]);
  const groups = useMemo(() => bibGroups(runners.map(r => r.number)), [runners]);
  const group = groups[Math.min(groupIdx, Math.max(0, groups.length - 1))];

  const now = () => TimeUtils.getCurrentTimestamp();

  const withUndo = async (numbers, text, change, afterUndo) => {
    const snap = await snapshot(numbers);
    await change();
    undo.offer(text, async () => {
      await restoreSnapshot(snap);
      if (afterUndo) setMessage(afterUndo);
    });
  };

  const jumpTo = (number) => {
    const idx = groups.findIndex(g => g.numbers.includes(number));
    if (idx >= 0) setGroupIdx(idx);
  };

  const handleQuickEntry = async (text) => {
    const { numbers, rejected } = parseBibList(text);
    const unique = [...new Set(numbers)];
    const unknown = unique.filter(n => !byNumber.has(n));
    const already = unique.filter(n => {
      const st = checkpointRunnerState(byNumber.get(n));
      return byNumber.has(n) && st !== RUNNER_STATE.NONE && st !== RUNNER_STATE.RESTORABLE;
    });
    const toMark = unique.filter(n => byNumber.has(n) && !already.includes(n));
    const notes = [];
    if (unknown.length) notes.push(`${unknown.join(', ')} not at this checkpoint`);
    if (already.length) notes.push(`${already.join(', ')} already marked`);
    if (rejected.length) notes.push('type each number on its own');

    if (!toMark.length) {
      setMessage(notes.length ? `No new runners — ${notes.join(' · ')}` : 'No new runners in that entry');
      return;
    }
    const t = now();
    const what = toMark.length === 1 ? `${toMark[0]} marked` : `${toMark.length} runners marked`;
    await withUndo(toMark, what, () => markPassed(toMark, t), 'Marks undone');
    jumpTo(toMark[0]);
    setMessage([`${what} at ${hhmm(t)}`, ...notes].join(' · '));
  };

  const handleTap = async (r) => {
    const state = checkpointRunnerState(r);
    if (state === RUNNER_STATE.NONE) {
      const t = now();
      undo.clear();
      await markPassed([r.number], t);
      setMessage(`${r.number} marked at ${hhmm(t)}`);
    } else if (state === RUNNER_STATE.PASSED || state === RUNNER_STATE.CALLED) {
      const t = runnerTime(r);
      setSheet({ number: r.number, mode: 'edit', draft: t, orig: t, called: state === RUNNER_STATE.CALLED });
    } else if (state === RUNNER_STATE.RESTORABLE) {
      setSheet({ number: r.number, mode: 'restore', draft: r.unmarkedTime, orig: r.unmarkedTime, called: false });
    } else {
      setMessage(`${r.number} is ${STATE_NAMES[state]} — change it in Overview`);
    }
  };

  const closeSheet = () => setSheet(null);

  const save = async () => {
    const { number, mode, draft, orig, called } = sheet;
    closeSheet();
    if (mode === 'edit') {
      if (draft === orig) return;
      await withUndo([number], `${number} time changed`, () => editTime(number, draft), `${number} back to ${hhmm(orig)}`);
      setMessage(called
        ? `${number} changed to ${hhmm(draft)} — back on callout as a correction`
        : `${number} time changed to ${hhmm(draft)}`);
    } else {
      await withUndo([number], `${number} marked`, () => markPassed([number], draft));
      setMessage(`${number} marked at ${hhmm(draft)}`);
    }
  };

  const alt = async () => {
    const { number, mode, orig } = sheet;
    closeSheet();
    if (mode === 'edit') {
      await withUndo([number], `${number} unmarked`, () => unmarkRunner(number), `${number} restored at ${hhmm(orig)}`);
      setMessage('');
    } else {
      const t = now();
      await withUndo([number], `${number} marked`, () => markPassed([number], t));
      setMessage(`${number} marked at ${hhmm(t)}`);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-3.5">
        <QuickEntryBar onMark={handleQuickEntry} />
      </div>
      <div className="px-4 pt-1.5 min-h-[20px] text-[13px] font-semibold text-vk-blue" aria-live="polite" data-testid="markoff-status">
        {message}
      </div>

      {groups.length > 1 && (
        <div className="px-4 pt-2 flex gap-2 overflow-x-auto" role="group" aria-label="Bib groups">
          {groups.map((g, i) => {
            const on = g === group;
            return (
              <button
                key={g.first}
                type="button"
                aria-pressed={on}
                onClick={() => setGroupIdx(i)}
                className={`shrink-0 min-h-[40px] px-3.5 rounded-full text-[13px] font-bold tabular-nums ${on
                  ? 'bg-vk-navy text-white'
                  : 'bg-white text-vk-ink border border-vk-border dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600'}`}
              >
                {g.first}–{g.last}
              </button>
            );
          })}
        </div>
      )}

      <div
        className="px-4 pt-3 pb-28 grid gap-2 grid-cols-[repeat(auto-fill,minmax(76px,1fr))] auto-rows-[64px]"
        data-testid="runner-grid"
      >
        {(group?.numbers ?? []).map(number => {
          const r = byNumber.get(number);
          const state = checkpointRunnerState(r);
          const label = stateLabel(state, {
            time: hhmm(runnerTime(r)),
            correction: !!r.correction,
            wasTime: hhmm(r.unmarkedTime),
          });
          return (
            <button
              key={number}
              type="button"
              onClick={() => handleTap(r)}
              aria-label={`Runner ${number}, ${label || STATE_NAMES[state].toLowerCase()}`}
              className={`rounded-btn flex flex-col items-center justify-center gap-0.5 ${stateClasses(state)}`}
            >
              <span className={`font-display font-extrabold text-[22px] leading-none tabular-nums ${numberClasses(state)}`}>{number}</span>
              <span className="text-[11px] font-bold min-h-[14px]">{label}</span>
            </button>
          );
        })}
      </div>

      <UndoBar {...undo.bar} className="fixed left-4 right-4 bottom-[84px] z-40 max-w-xl mx-auto" />

      {sheet && (
        <EditSheet
          sheet={sheet}
          earliest={ctx.earliest}
          onDraft={draft => setSheet(s => ({ ...s, draft }))}
          onSave={save}
          onAlt={alt}
          onClose={closeSheet}
        />
      )}
    </div>
  );
};

/** Bottom sheet: change time / unmark (edit), or restore an unmarked runner. */
const EditSheet = ({ sheet, earliest, onDraft, onSave, onAlt, onClose }) => {
  const { number, mode, draft, orig, called } = sheet;
  const nowIso = TimeUtils.getCurrentTimestamp();
  const changed = draft !== orig;
  const edit = mode === 'edit';
  const title = edit ? (called ? 'Called in to base' : 'Passed · not called in yet') : 'Unmarked earlier';
  const sub = edit ? `Marked at ${hhmm(orig)}` : `It had been marked at ${hhmm(orig)}`;
  const hint = edit
    ? (changed ? `Was ${hhmm(orig)}` : 'Use − / + to correct the time')
    : 'Restore the original time, or adjust it';
  const saveLabel = edit ? (changed ? `Save ${hhmm(draft)}` : 'Keep time') : `Mark at ${hhmm(draft)}`;
  const altLabel = edit ? 'Unmark runner' : `Use now (${hhmm(nowIso)})`;

  return (
    <BottomSheet open onClose={onClose} labelledBy="sheet-bib">
      <div className="flex items-center gap-3">
        <div id="sheet-bib" className="font-display font-extrabold text-[32px] text-vk-navy dark:text-white tabular-nums">{number}</div>
        <div className="flex flex-col gap-0.5 flex-1">
          <div className="font-bold text-[15px]">{title}</div>
          <div className="text-[13px] text-vk-muted">{sub}</div>
        </div>
      </div>

      {edit && called && changed && (
        <div className="bg-vk-gold-tint border border-vk-gold rounded-btn px-3 py-2.5 text-[13px] leading-normal">
          Base already has <strong>{hhmm(orig)}</strong>. A changed time goes back on the callout sheet as a correction.
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <div className="text-xs font-bold text-vk-muted uppercase tracking-[1px]">Time passed</div>
        <TimeStepper value={draft} onChange={onDraft} min={earliest} max={nowIso} />
        <div className="text-xs text-vk-muted text-center">{hint}</div>
      </div>

      <Button variant="gold" size="primary" fullWidth onClick={onSave}>{saveLabel}</Button>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="plain" size="action" className="!normal-case !font-sans !font-bold !tracking-normal" onClick={onClose}>Cancel</Button>
        <Button variant="blueOutline" size="action" className="!normal-case !font-sans !font-bold !tracking-normal" onClick={onAlt}>{altLabel}</Button>
      </div>
    </BottomSheet>
  );
};

export default RunnerGrid;
