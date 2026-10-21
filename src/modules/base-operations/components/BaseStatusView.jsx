import React, { useMemo, useState } from 'react';
import useBaseOperationsStore from '../store/baseOperationsStore';
import { sightingsByCheckpoint, boardCheckpoints } from '../services/receive';
import { checkStatusNumber, outRecords, REASONS } from '../services/statusValidation';
import { parseBibList } from '../../../shared/utils/parseBibs';
import TimeUtils from '../../../services/timeUtils.js';
import { earliestTime } from '../../../services/blocks.js';
import { stateClasses, checkClasses, RUNNER_STATE } from '../../../design-system/statusStyles';
import { BibChip, TimeStepper } from '../../../design-system/components/VK';
import useNow from '../../../shared/hooks/useNow';

const pillCls = (on) => `min-h-[40px] px-3 rounded-full text-[13px] font-bold ${on
  ? 'bg-vk-navy text-white'
  : 'bg-white text-vk-ink border border-vk-border dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600'}`;

const Label = ({ children }) => (
  <span className="text-xs font-bold text-vk-muted uppercase tracking-[0.8px] w-16 shrink-0">{children}</span>
);

/**
 * Base — DNF / DNS (spec §4.11). Bulk add by typing or pasting a list, with
 * checks; the out-of-race list with Clear. Every change has Undo.
 */
const BaseStatusView = ({ onWithdrawDetails }) => {
  const {
    currentRace, checkpoints = [], runners = [], outList = [], raceRunnerNumbers = [],
    applyOutStatus, undoOutStatus, clearOutStatus, restoreOutStatus,
  } = useBaseOperationsStore();
  const now = useNow();
  const [mode, setMode] = useState('dnf');
  const [where, setWhere] = useState(null);
  const [reason, setReason] = useState('');
  const [time, setTime] = useState(null);       // null = follow the clock
  const [typed, setTyped] = useState('');
  const [pending, setPending] = useState([]);
  const [filter, setFilter] = useState('all');
  const [flash, setFlash] = useState('');
  const [undo, setUndo] = useState(null);
  const [busy, setBusy] = useState(false);

  const raceStart = currentRace?.date && currentRace?.startTime
    ? TimeUtils.createRaceTimestamp(currentRace.date, currentRace.startTime.slice(0, 5))
    : null;
  const earliest = earliestTime(raceStart, now);
  const dnfTime = time ?? now;

  const records = useMemo(() => outRecords(outList), [outList]);
  const outMap = useMemo(() => new Map(records.map(r => [r.number, r])), [records]);
  const order = useMemo(() => boardCheckpoints(checkpoints), [checkpoints]);
  const raceCps = order.filter(cp => cp.short !== 'Finish');
  const ctx = useMemo(() => ({
    mode, where, pending,
    raceNumbers: new Set(raceRunnerNumbers),
    out: outMap,
    sightings: sightingsByCheckpoint(runners),
    order,
  }), [mode, where, pending, raceRunnerNumbers, outMap, runners, order]);
  const checked = pending.map((num, i) => ({ num, i, ...checkStatusNumber(num, i, ctx) }));
  const applyCount = checked.filter(c => c.kind !== 'bad').length;
  const label = mode === 'dnf' ? 'DNF' : 'DNS';

  const addText = () => {
    const { numbers, rejected } = parseBibList(typed);
    if (!numbers.length) { setFlash(rejected.length ? 'Type each number on its own' : 'Type a number first'); return; }
    setPending(p => [...p, ...numbers]);
    setTyped('');
    setUndo(null);
    setFlash(numbers.length === 1 ? `${numbers[0]} added` : `${numbers.length} numbers added`);
  };

  const apply = async () => {
    if (!applyCount || busy) return;
    setBusy(true);
    try {
      const numbers = checked.filter(c => c.kind !== 'bad').map(c => c.num);
      const ops = await applyOutStatus({ mode, numbers, where, reason, time: dnfTime, prev: outMap });
      setPending([]);
      setFlash(`${numbers.length} marked ${label}`);
      setUndo({ run: () => undoOutStatus(ops) });
    } catch (err) {
      setFlash(`Could not mark ${label}: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const clear = async (rec) => {
    await clearOutStatus(rec);
    setFlash(`${rec.number} back in the race`);
    setUndo({ run: () => restoreOutStatus(rec) });
  };

  const shown = records.filter(r => filter === 'all' || r.status === filter);
  const dnsCount = records.filter(r => r.status === 'DNS').length;
  const dnfCount = records.length - dnsCount;

  return (
    <div className="max-w-[1280px] w-full mx-auto p-3 flex flex-wrap gap-3 items-start" data-screenshot-target>
      <section aria-labelledby="bulkhd" className="flex-[999_1_480px] min-w-0 bg-white dark:bg-gray-800 border border-vk-border dark:border-gray-700 rounded-card p-3 flex flex-col gap-2.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 id="bulkhd" className="font-display font-bold text-base text-vk-navy dark:text-white flex-1">Bulk add</h1>
          <div className="grid grid-cols-2 bg-vk-band dark:bg-gray-700 rounded-btn p-[3px] gap-[3px]" role="group" aria-label="Status to apply">
            {[['dnf', 'DNF'], ['dns', 'DNS']].map(([id, text]) => (
              <button key={id} type="button" aria-pressed={mode === id} onClick={() => { setMode(id); setFlash(''); }}
                className={`min-h-[40px] min-w-[72px] rounded-lg font-display font-extrabold text-sm ${mode === id
                  ? (id === 'dnf' ? 'bg-vk-red text-white' : 'bg-white text-vk-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]')
                  : 'text-vk-muted'}`}>
                {text}
              </button>
            ))}
          </div>
        </div>

        {mode === 'dnf' ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label="Where">
              <Label>Where</Label>
              {raceCps.map(cp => (
                <button key={cp.number} type="button" aria-pressed={where === cp.number} onClick={() => setWhere(cp.number)} className={pillCls(where === cp.number)}>{cp.short}</button>
              ))}
              <button type="button" aria-pressed={where === null} onClick={() => setWhere(null)} className={pillCls(where === null)}>On course</button>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label="Reason">
              <Label>Reason</Label>
              {REASONS.map(r => (
                <button key={r} type="button" aria-pressed={reason === r} onClick={() => setReason(reason === r ? '' : r)} className={pillCls(reason === r)}>{r}</button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <Label>Time</Label>
              <TimeStepper size="md" steps={[-5, 5]} value={dnfTime} min={earliest} max={now} onChange={setTime} className="max-w-[220px]" />
            </div>
          </div>
        ) : (
          <div className="text-[13px] text-vk-muted bg-vk-paper dark:bg-gray-900 rounded-btn px-3 py-2">
            Non-starters: runners who never crossed the start. Anyone already recorded at a checkpoint is flagged.
          </div>
        )}

        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); addText(); }}>
          <label htmlFor="bulk-bibs" className="sr-only">Bib numbers</label>
          <input id="bulk-bibs" type="text" inputMode="numeric" autoComplete="off" value={typed}
            onChange={e => setTyped(e.target.value.replace(/[^\d,;\s]/g, ''))}
            placeholder="Bib numbers — type or paste a list"
            className="flex-1 min-w-0 font-display font-bold text-xl text-vk-ink bg-white border-2 border-vk-blue rounded-btn px-3 py-1 min-h-[52px] dark:bg-gray-900 dark:text-white" />
          <button type="submit" className="font-display font-extrabold text-sm tracking-[0.6px] uppercase bg-vk-blue text-white rounded-btn px-4 min-h-[52px]">Add</button>
        </form>

        <div className="flex flex-wrap gap-1.5 min-h-[64px] max-h-[170px] overflow-y-auto content-start bg-vk-paper dark:bg-gray-900 rounded-btn p-2" data-testid="bulk-pending">
          {checked.map(c => (
            <BibChip key={c.i} number={c.num} note={c.note}
              className={c.kind === 'ok'
                ? stateClasses(mode === 'dnf' ? RUNNER_STATE.DNF : RUNNER_STATE.DNS)
                : checkClasses(c.kind)}
              onClick={() => { setPending(p => p.filter((_, k) => k !== c.i)); setFlash(`${c.num} removed`); setUndo(null); }} />
          ))}
          {!checked.length && (
            <span className="text-[13px] text-vk-muted">Add numbers one at a time or paste a list like 212, 218 224. Tap one to remove it.</span>
          )}
        </div>

        <div className="flex items-center gap-2 min-h-[28px]">
          <span className="flex-1 text-xs font-semibold text-vk-blue" aria-live="polite" data-testid="status-flash">{flash}</span>
          {undo && (
            <button type="button" onClick={async () => { const u = undo; setUndo(null); await u.run(); setFlash('Undone'); }}
              className="min-h-[32px] px-3 rounded-lg bg-vk-ink text-white font-bold text-xs">Undo</button>
          )}
        </div>

        <div className="grid grid-cols-[1fr_2fr] gap-2">
          <button type="button" onClick={() => { setPending([]); setTyped(''); setFlash('List cleared'); setUndo(null); }}
            className="min-h-[48px] rounded-btn border border-vk-muted bg-white text-vk-ink font-display font-extrabold text-xs tracking-[0.6px] uppercase dark:bg-gray-800 dark:text-gray-100">
            Clear list
          </button>
          <button type="button" onClick={apply} disabled={!applyCount || busy}
            className={`min-h-[48px] rounded-btn font-display font-extrabold text-[13px] tracking-[0.6px] uppercase ${applyCount
              ? (mode === 'dnf' ? 'bg-vk-red text-white' : 'bg-vk-gold text-vk-ink')
              : 'bg-vk-band text-vk-muted cursor-not-allowed'}`}>
            {applyCount ? `Mark ${applyCount} as ${label}` : 'Add numbers to mark'}
          </button>
        </div>

        {onWithdrawDetails && (
          <button type="button" onClick={onWithdrawDetails} className="self-start text-[13px] font-semibold text-vk-blue min-h-[32px]">
            Withdraw runner with comments or vet-out details…
          </button>
        )}
      </section>

      <aside aria-labelledby="outhd" className="flex-[1_1_300px] min-w-0 bg-white dark:bg-gray-800 border border-vk-border dark:border-gray-700 rounded-card overflow-hidden flex flex-col">
        <div className="px-3 py-2.5 border-b border-vk-border dark:border-gray-700 flex items-center gap-2 flex-wrap">
          <h2 id="outhd" className="font-display font-bold text-[15px] text-vk-navy dark:text-white flex-1">Out of the race</h2>
          <span className="text-xs font-bold text-vk-muted">{dnsCount} DNS · {dnfCount} DNF</span>
        </div>
        <div className="px-3 py-2 flex gap-1.5 border-b border-vk-border dark:border-gray-700" role="group" aria-label="Filter out list">
          {[['all', 'All'], ['DNF', 'DNF'], ['DNS', 'DNS']].map(([id, text]) => (
            <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)} className={pillCls(filter === id).replace('min-h-[40px]', 'min-h-[36px]')}>{text}</button>
          ))}
        </div>
        <div className="max-h-[420px] overflow-y-auto" data-testid="out-list">
          {shown.map(r => (
            <div key={r.number} className="flex items-center gap-2.5 px-3 py-1.5 border-b border-vk-border dark:border-gray-700 min-h-[48px]" data-testid="out-row">
              <span className="w-11 font-display font-extrabold text-[17px] tabular-nums">{r.number}</span>
              {/* Two lines (status over detail) so "CP1 · Medical · 11:15" is never cut off */}
              <span className="flex-1 min-w-0 flex flex-col items-start gap-0.5">
                <span className={`rounded-chip px-2 py-0.5 text-xs font-bold ${r.status === 'DNF'
                  ? 'bg-vk-red-tint border border-vk-red text-vk-red'
                  : 'bg-vk-paper border border-dashed border-vk-muted text-vk-muted'}`}>{r.status}</span>
                <span className="text-xs text-vk-muted break-words" data-testid="out-detail">{r.detail}</span>
              </span>
              <button type="button" onClick={() => clear(r)} disabled={!r.clearable}
                aria-label={`Clear ${r.status} for ${r.number}`}
                title={r.clearable ? undefined : 'Recorded at a checkpoint — clear it there'}
                className="min-h-[36px] px-2.5 rounded-lg border border-vk-border bg-white text-vk-blue font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed dark:bg-gray-800">
                Clear
              </button>
            </div>
          ))}
          {!shown.length && <div className="px-3 py-4 text-[13px] text-vk-muted">None yet.</div>}
        </div>
      </aside>
    </div>
  );
};

export default BaseStatusView;
