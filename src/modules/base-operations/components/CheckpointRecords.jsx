import React, { useMemo, useState } from 'react';
import useBaseOperationsStore from '../store/baseOperationsStore';
import { boardCheckpoints, sightingsByCheckpoint, reportedUpTo } from '../services/receive';
import { runChecks, checkpointDistances, PACE_LIMIT_KMH } from '../services/dataChecks';
import { outRecords } from '../services/statusValidation';
import { MISSED_CONFIRMED } from '../services/missed';
import {
  recordItems, issueCounts, visibleItems, groupByBlock, groupByCall, groupSub, actionsFor, numberProblem,
  saveProblem, editMessage, FILTERS, REASONS, NEEDS_REASON,
} from '../services/records';
import TimeUtils from '../../../services/timeUtils.js';
import { toBlock, hhmm, BLOCK_MINUTES } from '../../../services/blocks.js';
import { recordClasses, LOCKED } from '../../../design-system/statusStyles';
import useNow from '../../../shared/hooks/useNow';

const btn = 'min-h-[48px] rounded-btn font-display font-extrabold text-xs tracking-[0.6px] uppercase';
const plainBtn = 'min-h-[44px] px-3 rounded-btn border border-vk-muted bg-white text-vk-ink font-bold text-xs dark:bg-gray-800 dark:text-gray-100';
const pillBtn = (on, red = false) => `min-h-[44px] px-3 rounded-full font-bold text-[13px] ${on
  ? (red ? 'bg-vk-red text-white border-2 border-vk-red' : 'bg-vk-navy text-white border-2 border-vk-navy')
  : 'bg-white text-vk-ink border border-vk-border dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600'}`;
const TAG = {
  warn: 'bg-vk-gold-tint text-vk-ink border border-vk-gold',
  alert: 'bg-vk-red-tint text-vk-red border border-vk-red',
  bad: 'bg-vk-red-tint text-vk-red border border-vk-red',
  missed: 'bg-white text-vk-blue border border-dashed border-vk-blue',
  info: 'bg-vk-band text-vk-navy border border-vk-navy',
  old: 'bg-vk-paper text-vk-muted border border-dashed border-vk-muted',
  ok: 'bg-vk-band text-vk-blue border border-vk-blue',
  checked: 'bg-vk-band text-vk-blue border border-vk-blue',
};
const VIEWS = [{ id: 'block', label: 'By block' }, { id: 'number', label: 'By number' }, { id: 'call', label: 'By call' }];

const timeText = (i) => (i.time == null ? 'not here' : `${i.edited && i.type === 'row' ? '✎ ' : ''}${i.manual ? 'Exact ' : ''}${hhmm(i.time)}`);
const ariaFor = (i) => `${i.number}, ${timeText(i)}${i.flag.note ? `, ${i.flag.note}` : ''}`;

/** Records data for one checkpoint, from the same store data and checks as Reports. */
export function useRecordItems(cpNumber) {
  const {
    currentRace, checkpoints = [], runners = [], baseRows = [], radioCalls = [], outList = [], resolutions = [], fieldChanges = [],
    raceRunnerNumbers = [], raceRunnerBatches: batchOf = new Map(),
  } = useBaseOperationsStore();
  return useMemo(() => {
    if (cpNumber == null) return { items: [], upTo: null };
    const order = boardCheckpoints(checkpoints);
    const input = {
      baseRows, order, sightings: sightingsByCheckpoint(runners), outByNumber: new Map(outRecords(outList).map(r => [r.number, r])),
      radioCalls, distances: checkpointDistances(checkpoints, currentRace), limitKmh: currentRace?.paceLimitKmh ?? PACE_LIMIT_KMH,
      raceNumbers: new Set(raceRunnerNumbers), batchOf,
    };
    const issues = runChecks(input, new Set(resolutions.map(r => r.issueKey)));
    return {
      items: recordItems({ cp: cpNumber, baseRows, issues, allIssues: runChecks(input), fieldChanges, resolutions }),
      upTo: reportedUpTo(runners, radioCalls).get(cpNumber) ?? null,
    };
  }, [baseRows, runners, outList, radioCalls, checkpoints, currentRace, raceRunnerNumbers, batchOf, resolutions, fieldChanges, cpNumber]);
}

/**
 * Base — Records for one checkpoint (BASE_EDIT_CREW_LOG Part A): every number
 * base holds there, what's wrong with them, and edits one at a time or as a
 * batch. Every change keeps history and has Undo.
 */
const CheckpointRecords = ({ cpNumber, onBack, draftCount = 0, initialView = 'block' }) => {
  const store = useBaseOperationsStore();
  const { currentRace, checkpoints = [], baseRows = [], radioCalls = [], raceRunnerNumbers = [] } = store;
  const now = useNow(15000);
  const order = useMemo(() => boardCheckpoints(checkpoints), [checkpoints]);
  const cp = order.find(c => c.number === cpNumber);
  const raceStart = currentRace?.date && currentRace?.startTime
    ? TimeUtils.createRaceTimestamp(currentRace.date, currentRace.startTime.slice(0, 5)) : null;
  const field = useMemo(() => new Set(raceRunnerNumbers), [raceRunnerNumbers]);

  const { items, upTo } = useRecordItems(cpNumber);

  const [view, setView] = useState(initialView);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [history, setHistory] = useState(false);
  const [selMode, setSelMode] = useState(false);
  const [picks, setPicks] = useState([]);       // item ids
  const [ed, setEd] = useState(null);           // single editor
  const [bed, setBed] = useState(null);         // batch editor
  const [flash, setFlash] = useState('');
  const [undo, setUndo] = useState(null);       // { label, run }
  const [busy, setBusy] = useState(false);

  const counts = issueCounts(items);
  const active = items.filter(i => i.type === 'row');
  const shown = visibleItems(items, { filter, search, history });
  const groups = view === 'block' ? groupByBlock(shown) : view === 'call' ? groupByCall(shown, radioCalls, cp?.short) : [];
  const listRows = view === 'number' ? [...shown].sort((a, b) => a.number - b.number || (a.time ?? '').localeCompare(b.time ?? '')) : [];
  const cur = ed ? items.find(i => i.id === ed.itemId) : null;
  const picked = active.filter(i => picks.includes(i.id)).sort((a, b) => a.number - b.number);
  const clamp = (t) => TimeUtils.clampPast(raceStart && t < raceStart ? raceStart : t, now);

  // ── doing things ─────────────────────────────────────────────────────────
  const run = async (fn, label) => {
    if (busy) return;
    setBusy(true);
    try {
      const before = reportedUpTo(useBaseOperationsStore.getState().runners, useBaseOperationsStore.getState().radioCalls).get(cpNumber) ?? null;
      const reverse = await fn();
      const s = useBaseOperationsStore.getState();
      const after = reportedUpTo(s.runners, s.radioCalls).get(cpNumber) ?? null;
      setFlash(`${label}${after !== before ? ` · ${cp.short} now up to ${hhmm(after) || '—'}` : ''}`);
      setUndo({ label, run: reverse });
      setEd(null); setBed(null); setPicks([]);
    } catch (err) {
      setFlash(`Could not save: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };
  const edit = (payload) => async () => {
    const id = await store.editRecords(cpNumber, payload);
    return () => store.undoRecordEdit(id);
  };

  const openItem = (i) => {
    const acts = actionsFor(i);
    setEd({ itemId: i.id, action: acts[0]?.id ?? null, t: i.time ?? toBlock(now), num: '', toCp: null, reason: null, confirm: false });
    setFlash('');
  };
  const tapItem = (i) => {
    if (!selMode) { openItem(i); return; }
    if (i.type !== 'row') { setFlash('Only recorded numbers can be selected'); return; }
    const next = picks.includes(i.id) ? picks.filter(p => p !== i.id) : [...picks, i.id];
    setPicks(next);
    setBed(next.length ? (bed ?? { action: 'time', t: toBlock(i.time), toCp: null, reason: null, confirm: false }) : null);
  };
  const toggleGroup = (g) => {
    const ids = g.items.filter(i => i.type === 'row').map(i => i.id);
    const all = ids.every(id => picks.includes(id));
    const next = all ? picks.filter(p => !ids.includes(p)) : [...new Set([...picks, ...ids])];
    setPicks(next);
    setBed(next.length ? (bed ?? { action: 'time', t: toBlock(g.items.find(i => i.type === 'row').time), toCp: null, reason: null, confirm: false }) : null);
  };

  const saveSingle = () => {
    const i = cur;
    const { action, reason } = ed;
    const late = (n) => (field.has(n) ? [] : [n]);
    const toShort = order.find(c => c.number === ed.toCp)?.short;
    switch (action) {
      case 'time': {
        const manual = toBlock(ed.t) !== ed.t;
        return run(edit({ kind: 'time', reason, changes: [{ rowId: i.row.id, toTime: ed.t, manual, note: `Was ${hhmm(i.time)} · now ${hhmm(ed.t)}` }] }),
          editMessage('time', { number: i.number, fromTime: i.time, toTime: ed.t }));
      }
      case 'number': {
        const n = Number(ed.num);
        const change = i.type === 'wrong'
          ? { rejected: { issueKey: i.issue.key, callId: i.callId }, number: i.number, toNumber: n, toTime: i.time, toCp: cpNumber, manual: i.manual }
          : { rowId: i.row.id, toNumber: n, note: `Was ${i.number} · now ${n}` };
        return run(edit({ kind: 'number', reason, supersededReason: 'renumbered', changes: [change], late: late(n) }),
          editMessage('number', { number: i.number, toNumber: n, late: !field.has(n) }));
      }
      case 'late':
        return run(edit({ kind: 'number', reason, changes: [{ rejected: { issueKey: i.issue.key, callId: i.callId }, number: i.number, toNumber: i.number, toTime: i.time, toCp: cpNumber, manual: i.manual }], late: late(i.number) }),
          `${i.number} recorded at ${hhmm(i.time)} as a late entry`);
      case 'cp':
        return run(edit({ kind: 'cp', reason, supersededReason: 'moved', changes: [{ rowId: i.row.id, toCp: ed.toCp, note: `Moved to ${toShort}` }] }),
          editMessage('cp', { number: i.number, count: 1, toShort }));
      case 'remove':
        if (!ed.confirm) { setEd({ ...ed, confirm: true }); setFlash(`Tap again to remove ${i.number} at ${hhmm(i.time)}`); return null; }
        return run(edit({ kind: 'remove', reason, supersededReason: 'removed', changes: [{ rowId: i.row.id, remove: true, note: 'Removed' }] }),
          editMessage('remove', { number: i.number, count: 1, cpShort: cp.short }));
      case 'keep': {
        const others = active.filter(x => x.number === i.number && x.id !== i.id);
        return run(edit({ kind: 'keep', reason, supersededReason: 'duplicate', changes: others.map(x => ({ rowId: x.row.id, remove: true, note: `Duplicate · kept ${hhmm(i.time)}` })) }),
          editMessage('keep', { number: i.number, fromTime: i.time }));
      }
      case 'checked':
        return run(async () => { const id = await store.addResolution(i.issue.key, 'checked'); return () => store.removeResolution(id); },
          `${i.number} marked checked — data unchanged`);
      case 'have': {
        const manual = toBlock(ed.t) !== ed.t;
        return run(async () => { const callId = await store.recordMissed(cpNumber, { number: i.number, time: ed.t, manual }); return () => store.undoCall(callId); },
          `${i.number} recorded at ${hhmm(ed.t)} (was missed)`);
      }
      case 'notseen':
        return run(async () => { const id = await store.addResolution(i.issue.key, MISSED_CONFIRMED); return () => store.removeResolution(id); },
          `${i.number} confirmed not seen at ${cp.short}`);
      default: return null;
    }
  };

  const saveBatch = () => {
    const { action, reason } = bed;
    const n = picked.length;
    const toShort = order.find(c => c.number === bed.toCp)?.short;
    if (action === 'remove' && !bed.confirm) { setBed({ ...bed, confirm: true }); setFlash(`Tap again to remove ${n} numbers`); return; }
    const changes = picked.map(i => (action === 'time'
      ? { rowId: i.row.id, toTime: bed.t, manual: false, note: `Was ${hhmm(i.time)} · now ${hhmm(bed.t)}` }
      : action === 'cp' ? { rowId: i.row.id, toCp: bed.toCp, note: `Moved to ${toShort}` } : { rowId: i.row.id, remove: true, note: 'Removed' }));
    run(edit({ kind: action, reason, supersededReason: { cp: 'moved', remove: 'removed' }[action], changes }),
      editMessage(action, { number: picked[0].number, count: n, toTime: bed.t, toShort, cpShort: cp.short, fromTime: picked[0].time }))
      .then(() => setSelMode(false));
  };

  if (!cp) return null;

  // ── single editor state ───────────────────────────────────────────────────
  const curActs = cur ? actionsFor(cur) : [];
  const otherTimes = cur ? active.filter(x => x.number === cur.number && x.id !== cur.id).map(x => hhmm(x.time)) : [];
  const numErr = cur && ed.action === 'number' ? numberProblem(ed.num, cur, items, cp.short) : null;
  const cpTaken = cur && ed.action === 'cp' && ed.toCp != null && baseRows.some(r => r.checkpointNumber === ed.toCp && r.number === cur.number && r.status !== 'superseded' && r.commonTime)
    ? `${order.find(c => c.number === ed.toCp).short} already has ${cur.number}` : null;
  const problem = cur ? (saveProblem({ action: ed.action, reason: ed.reason, numberError: numErr, toCp: ed.toCp }) ?? cpTaken ?? (ed.action === 'time' && ed.t === cur.time ? 'Time unchanged' : null)) : null;
  const saveLabel = !cur ? '' : problem ?? ({
    time: `Save · ${hhmm(ed.t)}`, number: `Save · ${ed.num}`, cp: `Move to ${order.find(c => c.number === ed.toCp)?.short}`,
    remove: ed.confirm ? 'Tap again to remove' : `Remove ${cur.number}`, keep: `Keep ${hhmm(cur.time)}`, checked: 'Mark checked',
    have: `Record at ${hhmm(ed.t)}`, notseen: 'Confirm not seen', late: 'Record late entry',
  })[ed.action];
  const stepT = (m) => setEd(e => ({ ...e, t: clamp(TimeUtils.addMinutes(e.t, m)) }));
  const bodyText = !cur ? '' : ({
    remove: `Removes ${cur.number} at ${hhmm(cur.time)} from ${cp.short}. It stays in history and Undo puts it back.`,
    keep: `Keeps ${cur.number} at ${hhmm(cur.time)} and removes ${otherTimes.join(', ')}.`,
    checked: `Base has checked ${cur.number}. The issue clears and the time stays as it is.`,
    notseen: `${cp.short} confirms ${cur.number} did not come through. Times by checkpoint shows "missed" for ${cp.short}.`,
    late: `Records ${cur.number} at ${hhmm(cur.time)} and adds it to the field as a late entry.`,
  })[ed.action] ?? '';

  // ── batch editor state ────────────────────────────────────────────────────
  const bProblem = bed ? (saveProblem({ action: bed.action, reason: bed.reason, toCp: bed.toCp })) : null;
  const bLabel = !bed ? '' : bProblem ?? (bed.action === 'time' ? `Move ${picked.length} to ${hhmm(bed.t)}`
    : bed.action === 'cp' ? `Move ${picked.length} to ${order.find(c => c.number === bed.toCp)?.short}` : bed.confirm ? 'Tap again to remove' : `Remove ${picked.length}`);
  const stepB = (m) => setBed(b => ({ ...b, confirm: false, t: toBlock(clamp(TimeUtils.addMinutes(b.t, m))) }));

  const primary = (locked, red, confirm) => (locked ? LOCKED : red ? (confirm ? 'bg-vk-red text-white' : 'bg-white text-vk-red border-2 border-vk-red dark:bg-gray-800') : 'bg-vk-gold text-vk-ink shadow-btn');
  const Reasons = ({ value, onPick }) => (
    <div className="flex flex-col gap-1.5">
      <div className="text-xs font-bold text-vk-muted">Why</div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Why">
        {REASONS.map(r => <button key={r.id} type="button" aria-pressed={value === r.id} onClick={() => onPick(r.id)} className={pillBtn(value === r.id)}>{r.label}</button>)}
      </div>
    </div>
  );
  const otherCps = order.filter(c => c.number !== cpNumber);

  const Chip = ({ i }) => {
    const sel = selMode ? picks.includes(i.id) : ed?.itemId === i.id;
    const line = view === 'call'
      ? [i.time != null ? timeText(i) : '', i.flag.note].filter(Boolean).join(' · ')
      : `${i.edited && i.type === 'row' ? '✎ ' : ''}${i.flag.note}`;
    return (
      <button type="button" onClick={() => tapItem(i)} aria-label={ariaFor(i)} aria-pressed={sel} data-testid="record-chip"
        className={`min-h-[48px] min-w-[64px] px-2.5 py-1 rounded-lg flex flex-col items-start justify-center gap-0.5 ${recordClasses(i.flag.kind)} ${sel ? 'outline outline-[3px] outline-offset-2 outline-vk-navy' : ''}`}>
        <span className="font-display font-extrabold text-lg leading-none tabular-nums">{i.number}</span>
        {line && <span className="text-[10px] font-bold no-underline">{line}</span>}
      </button>
    );
  };

  return (
    <div className="max-w-[1280px] w-full mx-auto p-3 flex flex-wrap gap-3 items-start" data-screenshot-target data-testid="records">
      <section aria-labelledby="rechd" className="flex-[999_1_520px] min-w-0 bg-white dark:bg-gray-800 border-2 border-vk-gold rounded-card p-3 flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[200px] flex flex-col">
            <h1 id="rechd" className="font-display font-extrabold text-xl text-vk-navy dark:text-white">{cp.short} · Records</h1>
            <div className="text-[13px] text-vk-muted" data-testid="records-sub">
              {active.length} numbers · up to {hhmm(upTo) || '—'} · {counts.attn ? `${counts.attn} to check` : 'nothing to check'}
            </div>
          </div>
          <button type="button" onClick={onBack} className={plainBtn}>Back to call{draftCount ? ` · ${draftCount}` : ''}</button>
          <button type="button" aria-pressed={selMode}
            onClick={() => { setSelMode(!selMode); setPicks([]); setBed(null); setEd(null); setFlash(selMode ? '' : 'Tap numbers, or Select block'); }}
            className={`${btn} min-h-[44px] px-3.5 ${selMode ? 'bg-vk-navy text-white border-2 border-vk-navy' : 'text-vk-blue border-2 border-vk-blue'}`}>
            {selMode ? 'Done selecting' : 'Select'}
          </button>
          <label className="flex items-center gap-1.5 min-h-[44px] text-[13px] font-semibold text-vk-ink dark:text-gray-100">
            <input type="checkbox" checked={history} onChange={() => setHistory(!history)} className="w-5 h-5 accent-vk-navy" /> Show history
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="View" className="flex bg-vk-band dark:bg-gray-700 rounded-btn p-0.5">
            {VIEWS.map(v => (
              <button key={v.id} type="button" aria-pressed={view === v.id} onClick={() => setView(v.id)}
                className={`min-h-[40px] px-3 rounded-lg text-[13px] font-bold ${view === v.id ? 'bg-white text-vk-navy shadow-btn dark:bg-gray-900 dark:text-white' : 'text-vk-muted'}`}>{v.label}</button>
            ))}
          </div>
          <label htmlFor="rec-find" className="sr-only">Find a number</label>
          <input id="rec-find" type="text" inputMode="numeric" value={search} placeholder="Find number" autoComplete="off"
            onChange={e => setSearch(e.target.value.replace(/\D/g, '').slice(0, 5))}
            className="ml-auto w-[150px] min-h-[44px] border border-vk-muted rounded-btn px-2.5 text-base font-bold placeholder:font-normal placeholder:text-sm bg-white dark:bg-gray-900 dark:text-white" />
        </div>
        <div className="flex items-center">
          <div role="group" aria-label="Filter" className="flex flex-nowrap gap-1 overflow-x-auto max-w-full">
            {FILTERS.map(f => {
              const n = counts[f.id] ?? 0;
              return (
                <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}
                  className={`min-h-[40px] px-2.5 rounded-full text-xs font-bold whitespace-nowrap ${filter === f.id ? 'bg-vk-navy text-white border border-vk-navy' : 'bg-white text-vk-ink border border-vk-border dark:bg-gray-800 dark:text-gray-100'}`}>
                  {f.label}{f.id !== 'all' && n ? ` · ${n}` : ''}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2 min-h-[32px]">
          <span className="flex-1 text-[13px] font-semibold text-vk-blue" aria-live="polite" data-testid="records-flash">{flash}</span>
          {undo && (
            <button type="button" disabled={busy} onClick={async () => { const u = undo; setUndo(null); try { await u.run(); setFlash(`Undone: ${u.label}`); } catch (err) { setFlash(`Could not undo: ${err.message}`); } }}
              className="min-h-[32px] px-3 rounded-lg bg-vk-ink text-white font-bold text-xs">Undo {undo.label}</button>
          )}
        </div>
        {/* Up to 500px, less on a short screen: the page itself never scrolls at 1112×834 */}
        <div className="max-h-[min(500px,calc(100vh-390px))] overflow-y-auto flex flex-col gap-2" data-testid="records-list">
          {groups.map(g => {
            const rows = g.items.filter(i => i.type === 'row');
            const all = rows.length > 0 && rows.every(i => picks.includes(i.id));
            return (
              <div key={g.key} data-testid="records-group"
                className={`rounded-btn p-2 flex flex-col gap-2 border ${g.key === 'missed' ? 'border-dashed border-vk-blue bg-white dark:bg-gray-800' : 'border-vk-border bg-vk-paper dark:bg-gray-900 dark:border-gray-700'}`}>
                <div className="flex items-center gap-2">
                  <span className={`rounded-md px-2 py-0.5 font-display font-extrabold text-[13px] ${g.key === 'missed' ? 'bg-white text-vk-blue border border-dashed border-vk-blue' : 'bg-vk-navy text-white'}`}>{g.title}</span>
                  <span className="flex-1 text-xs text-vk-muted">{groupSub(g, view)}</span>
                  {selMode && rows.length > 0 && (
                    <button type="button" onClick={() => toggleGroup(g)} className="min-h-[36px] px-2.5 rounded-lg border border-vk-blue text-vk-blue font-bold text-xs bg-white dark:bg-gray-800">
                      {all ? 'Unselect' : view === 'call' ? 'Select call' : 'Select block'}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">{g.items.map(i => <Chip key={i.id} i={i} />)}</div>
              </div>
            );
          })}
          {view === 'number' && listRows.map(i => {
            const sel = selMode ? picks.includes(i.id) : ed?.itemId === i.id;
            return (
              <button key={i.id} type="button" onClick={() => tapItem(i)} aria-pressed={sel} aria-label={ariaFor(i)} data-testid="record-row"
                className={`w-full min-h-[48px] flex items-center gap-2.5 px-3 border-b border-vk-border dark:border-gray-700 text-left ${sel ? 'bg-vk-band shadow-[inset_4px_0_0_#0B2D53] dark:bg-gray-700' : 'bg-white dark:bg-gray-800'}`}>
                <span className={`w-16 font-display font-extrabold text-lg tabular-nums ${i.type === 'history' ? 'text-vk-muted line-through' : ['bad', 'alert'].includes(i.flag.kind) ? 'text-vk-red' : 'text-vk-navy dark:text-white'}`}>{i.number}</span>
                <span className="w-24 text-sm">{timeText(i)}</span>
                <span className="flex-1 text-xs text-vk-muted">{i.callId != null ? `Call ${hhmm(radioCalls.find(c => c.id === i.callId)?.receivedAt)}` : i.type === 'missed' ? `Seen ${i.seenAt ?? 'further on'}` : 'Entered at base'}</span>
                {i.flag.note && <span className={`text-[11px] font-extrabold rounded-full px-2 py-0.5 whitespace-nowrap ${TAG[i.flag.kind]}`}>{i.flag.note}</span>}
              </button>
            );
          })}
          {!shown.length && <div className="p-4 text-sm text-vk-muted">Nothing matches this filter.</div>}
        </div>
      </section>

      <aside aria-label="Fix a record" className="flex-[1_1_320px] min-w-0 max-h-[720px] overflow-y-auto bg-white dark:bg-gray-800 border border-vk-border dark:border-gray-700 rounded-card p-3 flex flex-col gap-3">
        {!cur && !(selMode && picked.length) && (
          <div className="flex flex-col gap-2.5">
            <h2 className="font-display font-bold text-base text-vk-navy dark:text-white">Needs attention at {cp.short}</h2>
            {[['dup', 'Duplicates', 'Same number recorded more than once here'], ['missed', 'Missed', 'Seen at a later checkpoint, not here'],
              ['wrong', 'Wrong numbers', 'Heard on a call but not in the field'], ['other', 'Other checks', 'Out of order, pace, after DNF / DNS']].map(([id, label, detail]) => (
              <button key={id} type="button" onClick={() => setFilter(id)} data-testid={`records-issue-${id}`}
                className="min-h-[52px] flex items-center gap-2.5 px-2.5 rounded-btn border border-vk-border bg-vk-paper text-left dark:bg-gray-900 dark:border-gray-700">
                <span className="flex-1 flex flex-col"><span className="font-bold text-sm">{label}</span><span className="text-xs text-vk-muted">{detail}</span></span>
                <span data-testid={`records-count-${id}`} className={`min-w-[28px] h-7 rounded-full flex items-center justify-center font-display font-extrabold text-[13px] ${counts[id] ? 'bg-vk-red text-white' : 'bg-vk-band text-vk-blue'}`}>{counts[id] || '✓'}</span>
              </button>
            ))}
            <p className="text-[13px] leading-relaxed text-vk-muted">
              {selMode ? 'Tap numbers to select them, or use Select block / Select call. Then choose what to change.'
                : 'Tap any number to change its time, fix a mistyped number, move it to the right checkpoint or remove it. Every change keeps history and has Undo.'}
            </p>
          </div>
        )}

        {cur && !selMode && (
          <div className="flex flex-col gap-3" data-testid="record-editor">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <h2 className="font-display font-extrabold text-[26px] leading-none text-vk-navy dark:text-white">{cur.number}</h2>
                <div className="text-[13px] text-vk-muted mt-1">
                  {cur.time != null ? timeText(cur) : 'Not recorded here'} · {cur.callId != null ? `Call ${hhmm(radioCalls.find(c => c.id === cur.callId)?.receivedAt)}` : cur.type === 'missed' ? `seen at ${cur.seenAt}` : 'entered at base'}
                  {otherTimes.length ? ` · also ${otherTimes.join(', ')}` : ''}
                </div>
              </div>
              {cur.flag.note && <span className={`text-[11px] font-extrabold rounded-full px-2 py-0.5 whitespace-nowrap ${TAG[cur.flag.kind]}`}>{cur.flag.note}</span>}
            </div>
            {curActs.length > 0 && (
              <div role="group" aria-label="What to change" className="flex flex-wrap gap-1.5">
                {curActs.map(a => <button key={a.id} type="button" aria-pressed={ed.action === a.id} onClick={() => setEd({ ...ed, action: a.id, confirm: false })} className={pillBtn(ed.action === a.id, a.id === 'remove')}>{a.label}</button>)}
              </div>
            )}
            {(ed.action === 'time' || ed.action === 'have') && (
              <div className="flex flex-col gap-1.5">
                <div className="text-xs font-bold text-vk-muted">{ed.action === 'have' ? `Time ${cp.short} gives` : 'New time'}</div>
                <div className="grid grid-cols-[1fr_1fr_1.4fr_1fr_1fr] gap-1.5 items-center">
                  {[[-5, 'Five minutes earlier', '−5'], [-1, 'One minute earlier', '−1']].map(([m, l, t]) => <button key={m} type="button" aria-label={l} onClick={() => stepT(m)} className="min-h-[48px] rounded-btn border border-vk-border bg-vk-paper font-display font-extrabold dark:bg-gray-900">{t}</button>)}
                  <div className="text-center font-display font-extrabold text-2xl text-vk-navy dark:text-white tabular-nums" data-testid="record-time">{hhmm(ed.t)}</div>
                  {[[1, 'One minute later', '+1'], [5, 'Five minutes later', '+5']].map(([m, l, t]) => <button key={m} type="button" aria-label={l} onClick={() => stepT(m)} className="min-h-[48px] rounded-btn border border-vk-border bg-vk-paper font-display font-extrabold dark:bg-gray-900">{t}</button>)}
                </div>
                <div className="text-xs text-vk-muted">{toBlock(ed.t) !== ed.t ? 'Exact time — doesn’t move “up to”.' : `Common time block. Between ${hhmm(raceStart) || 'the start'} and now.`}</div>
              </div>
            )}
            {ed.action === 'number' && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="rec-num" className="text-xs font-bold text-vk-muted">Correct number</label>
                <input id="rec-num" type="text" inputMode="numeric" value={ed.num} autoComplete="off" placeholder="e.g. 231"
                  onChange={e => setEd({ ...ed, num: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                  className="min-h-[52px] border-2 border-vk-blue rounded-btn px-3 font-display font-extrabold text-[22px] bg-white dark:bg-gray-900 dark:text-white" />
                <div className="text-xs text-vk-muted">
                  {ed.num && !numErr && !field.has(Number(ed.num)) ? `${ed.num} isn't in the setup — it will be saved as a late entry.` : 'Keeps the same time and call. Checked against the field like Receive.'}
                </div>
              </div>
            )}
            {ed.action === 'cp' && (
              <div className="flex flex-col gap-1.5">
                <div className="text-xs font-bold text-vk-muted">Should be at</div>
                <div className="flex flex-wrap gap-1.5">
                  {otherCps.map(c => <button key={c.number} type="button" aria-pressed={ed.toCp === c.number} onClick={() => setEd({ ...ed, toCp: c.number })} className={pillBtn(ed.toCp === c.number)}>{c.short}</button>)}
                </div>
              </div>
            )}
            {bodyText && <p className="text-[13px] leading-relaxed text-vk-ink dark:text-gray-100">{bodyText}</p>}
            {NEEDS_REASON.has(ed.action) && <Reasons value={ed.reason} onPick={(r) => setEd({ ...ed, reason: r, confirm: false })} />}
            {curActs.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => { setEd(null); setFlash(''); }} className={`${btn} border border-vk-muted bg-white text-vk-ink dark:bg-gray-800 dark:text-gray-100`}>Cancel</button>
                <button type="button" onClick={saveSingle} disabled={!!problem || busy} className={`${btn} ${primary(!!problem || busy, ed.action === 'remove', ed.confirm)}`}>{saveLabel}</button>
              </div>
            ) : (
              <button type="button" onClick={() => setEd(null)} className={`${btn} border border-vk-muted bg-white text-vk-ink`}>Close</button>
            )}
          </div>
        )}

        {selMode && picked.length > 0 && bed && (
          <div className="flex flex-col gap-3" data-testid="batch-editor">
            <h2 className="font-display font-extrabold text-xl text-vk-navy dark:text-white">{picked.length} selected</h2>
            <div role="group" aria-label="What to change" className="flex flex-wrap gap-1.5">
              {[['time', 'Time'], ['cp', 'Checkpoint'], ['remove', 'Remove']].map(([id, l]) => <button key={id} type="button" aria-pressed={bed.action === id} onClick={() => setBed({ ...bed, action: id, confirm: false })} className={pillBtn(bed.action === id, id === 'remove')}>{l}</button>)}
            </div>
            {bed.action === 'time' && (
              <div className="grid grid-cols-[1fr_2fr_1fr] gap-1.5 items-center">
                <button type="button" aria-label="Five minutes earlier" onClick={() => stepB(-BLOCK_MINUTES)} className="min-h-[48px] rounded-btn border border-vk-border bg-vk-paper font-display font-extrabold dark:bg-gray-900">−5</button>
                <div className="text-center"><span className="text-xs text-vk-muted block">All to</span><span className="font-display font-extrabold text-2xl text-vk-navy dark:text-white tabular-nums" data-testid="batch-time">{hhmm(bed.t)}</span></div>
                <button type="button" aria-label="Five minutes later" onClick={() => stepB(BLOCK_MINUTES)} className="min-h-[48px] rounded-btn border border-vk-border bg-vk-paper font-display font-extrabold dark:bg-gray-900">+5</button>
              </div>
            )}
            {bed.action === 'cp' && (
              <div className="flex flex-wrap gap-1.5">
                {otherCps.map(c => <button key={c.number} type="button" aria-pressed={bed.toCp === c.number} onClick={() => setBed({ ...bed, toCp: c.number, confirm: false })} className={pillBtn(bed.toCp === c.number)}>{c.short}</button>)}
              </div>
            )}
            <div aria-label="Each number, old and new" className="max-h-[220px] overflow-y-auto flex flex-col" data-testid="batch-rows">
              {picked.map(i => (
                <div key={i.id} className="flex items-center gap-2 py-1 border-b border-vk-border dark:border-gray-700 text-sm tabular-nums">
                  <span className="w-14 font-display font-extrabold">{i.number}</span>
                  <span>{hhmm(i.time)}</span><span aria-hidden="true">→</span>
                  <span className="font-bold">{bed.action === 'time' ? hhmm(bed.t) : bed.action === 'cp' ? `${order.find(c => c.number === bed.toCp)?.short ?? '…'} · ${hhmm(i.time)}` : 'removed'}</span>
                </div>
              ))}
            </div>
            <Reasons value={bed.reason} onPick={(r) => setBed({ ...bed, reason: r, confirm: false })} />
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => { setPicks([]); setBed(null); }} className={`${btn} border border-vk-muted bg-white text-vk-ink dark:bg-gray-800 dark:text-gray-100`}>Clear selection</button>
              <button type="button" onClick={saveBatch} disabled={!!bProblem || busy} className={`${btn} ${primary(!!bProblem || busy, bed.action === 'remove', bed.confirm)}`}>{bLabel}</button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

export default CheckpointRecords;
