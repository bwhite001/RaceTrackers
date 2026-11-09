import React, { useMemo, useState } from 'react';
import useBaseOperationsStore from '../store/baseOperationsStore';
import { boardCheckpoints, sightingsByCheckpoint } from '../services/receive';
import { checkStatusNumber, outRecords, REASONS } from '../services/statusValidation';
import { parseWithdrawLine } from '../services/keymap';
import TimeUtils from '../../../services/timeUtils';
import { earliestTime, parseExactTime, hhmm } from '../../../services/blocks.js';
import { BottomSheet } from '../../../design-system/components/VK';
import { Button } from '../../../design-system/components';
import useNow from '../../../shared/hooks/useNow';

const pillCls = (on) => `min-h-[44px] px-3 rounded-full text-[13px] font-bold ${on
  ? 'bg-vk-navy text-white'
  : 'bg-white text-vk-ink border border-vk-border dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600'}`;

/**
 * Alt+W — WICEN2's withdraw line: `28 2106`, `28 CP2`, `28`, `28 *`.
 * Previews what will happen with the Bulk add checks, then applies through the
 * same store actions as the DNF / DNS tab, with Undo from the host.
 */
const QuickWithdrawSheet = ({ open, onClose, onDone }) => {
  const {
    currentRace, checkpoints = [], outList = [], runners = [], raceRunnerNumbers = [],
    applyOutStatus, undoOutStatus, clearOutStatus, restoreOutStatus,
  } = useBaseOperationsStore();
  const now = useNow();
  const [line, setLine] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const order = useMemo(() => boardCheckpoints(checkpoints), [checkpoints]);
  const records = useMemo(() => outRecords(outList), [outList]);
  const outMap = useMemo(() => new Map(records.map(r => [r.number, r])), [records]);
  const raceStart = currentRace?.date && currentRace?.startTime
    ? TimeUtils.createRaceTimestamp(currentRace.date, currentRace.startTime.slice(0, 5))
    : null;

  const preview = useMemo(() => {
    if (!line.trim()) return null;
    const p = parseWithdrawLine(line);
    if (p.error) return { bad: p.error };
    if (p.reverse) {
      const rec = outMap.get(p.number);
      if (!rec) return { bad: `${p.number} isn't out` };
      if (!rec.clearable) return { bad: `${p.number}: ${rec.status} at checkpoint — clear it there` };
      return { reverse: true, rec, text: `Put ${p.number} back in the race`, note: `Now ${rec.status}${rec.detail ? ` · ${rec.detail}` : ''}` };
    }
    let where = null;
    if (p.cp != null) {
      const cp = order.find(c => c.number === p.cp && c.short !== 'Finish');
      if (!cp) return { bad: `No checkpoint ${p.cp}` };
      where = cp.number;
    }
    let time = now;
    if (p.time) {
      time = parseExactTime(p.time, now);
      if (!time) return { bad: `${p.time} isn't a time` };
      if (time > now || time < earliestTime(raceStart, now)) return { bad: 'Time must be between race start and now' };
    }
    const check = checkStatusNumber(p.number, 0, {
      mode: 'dnf', where, raceNumbers: new Set(raceRunnerNumbers), pending: [p.number], out: outMap,
      sightings: sightingsByCheckpoint(runners), order,
    });
    if (check.kind === 'bad') return { bad: `${p.number}: ${check.note}` };
    const place = where != null ? `CP${where}` : 'On course';
    return { number: p.number, where, time, text: `DNF ${p.number} · ${place} · ${hhmm(time)}`, note: check.note };
  }, [line, outMap, order, now, raceStart, raceRunnerNumbers, runners]);

  if (!open) return null;

  const close = () => { setLine(''); setReason(''); setErr(''); onClose(); };

  const apply = async (e) => {
    e?.preventDefault();
    if (!preview || preview.bad || busy) return;
    setBusy(true);
    try {
      if (preview.reverse) {
        const rec = preview.rec;
        await clearOutStatus(rec);
        onDone?.(`${rec.number} back in the race`, () => restoreOutStatus(rec));
      } else {
        const ops = await applyOutStatus({ mode: 'dnf', numbers: [preview.number], where: preview.where, reason, time: preview.time, prev: outMap });
        onDone?.(`${preview.number} DNF`, () => undoOutStatus(ops));
      }
      close();
    } catch (error) {
      setErr(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet open onClose={close} labelledBy="quickwd-hd">
      <form onSubmit={apply} className="flex flex-col gap-3" aria-label="Quick withdraw">
        <h2 id="quickwd-hd" className="font-display font-bold text-xl text-vk-navy dark:text-white">Quick withdraw</h2>
        <label htmlFor="quickwd-line" className="text-xs font-bold text-vk-muted uppercase tracking-[0.8px]">Number, then time or checkpoint</label>
        <input id="quickwd-line" type="text" autoComplete="off" value={line} placeholder="28 2106"
          onChange={e => { setLine(e.target.value.slice(0, 16)); setErr(''); }}
          className="font-display font-extrabold text-[26px] text-vk-ink bg-white border-2 border-vk-blue rounded-btn px-3 py-1 min-h-[52px] dark:bg-gray-900 dark:text-white" />
        <div className="text-xs text-vk-muted">28 · 28 2106 · 28 CP2 · 28 * puts 28 back in the race</div>
        <div className="min-h-[44px] rounded-btn px-3 py-2 text-sm font-bold bg-vk-paper dark:bg-gray-900" data-testid="quickwd-preview" aria-live="polite">
          {!preview ? <span className="text-vk-muted font-semibold">Preview shows here</span>
            : preview.bad ? <span className="text-vk-red">{preview.bad}</span>
              : <>{preview.text}{preview.note && <span className="block text-xs font-semibold text-vk-muted">{preview.note}</span>}</>}
        </div>
        {preview && !preview.bad && !preview.reverse && (
          <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Reason">
            {REASONS.map(r => (
              <button key={r} type="button" aria-pressed={reason === r} onClick={() => setReason(reason === r ? '' : r)} className={pillCls(reason === r)}>{r}</button>
            ))}
          </div>
        )}
        {err && <p className="text-[13px] font-semibold text-vk-red" role="alert">{err}</p>}
        <Button type="submit" variant={preview?.reverse ? 'blue' : 'red'} size="primary" fullWidth disabled={!preview || !!preview.bad || busy}>
          {preview?.reverse ? 'Put back in the race' : 'Withdraw'}
        </Button>
        <Button type="button" variant="plain" size="action" fullWidth onClick={close}>Cancel</Button>
      </form>
    </BottomSheet>
  );
};

export default QuickWithdrawSheet;
