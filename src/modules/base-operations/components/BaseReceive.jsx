import React, { useMemo, useRef, useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import useBaseOperationsStore from '../store/baseOperationsStore';
import {
  buildBoard, checkCall, isRecordable, outStatusMap, sightingsByCheckpoint, askReminders, boardCheckpoints, appliesAt, CALL_DUE_MINUTES, CHECK,
} from '../services/receive';
import { missedReminders, missedText, standDownLists, MISSED_CONFIRMED } from '../services/missed';
import { checkpointDistances } from '../services/dataChecks';
import TimeUtils from '../../../services/timeUtils.js';
import {
  toBlock, hhmm, blocksBetween, earliestTime, parseExactTime, BLOCK_MINUTES,
} from '../../../services/blocks.js';
import { checkClasses, LOCKED } from '../../../design-system/statusStyles';
import { BlockPicker, NumberPad, BibChip, BottomSheet } from '../../../design-system/components/VK';
import useNow from '../../../shared/hooks/useNow';
import { CrewSheet } from './CrewLog';
import { crewPillByCheckpoint } from '../services/crews';

const MAX_BLOCKS = 48;
const MAX_DIGITS = 5;

const pill = {
  due: 'bg-vk-gold text-vk-ink',
  ok: 'bg-vk-band text-vk-navy',
  closed: 'bg-vk-band text-vk-muted',
};
const pillText = { due: 'Due', ok: 'OK', closed: 'Closed' };

const StatusPill = ({ status }) => (
  <span className={`text-[10px] font-extrabold rounded-full px-[7px] py-px ${pill[status]}`}>{pillText[status]}</span>
);

/** Before the start: is this checkpoint's crew on the way or on site? */
const CrewPill = ({ kind }) => (kind ? (
  <span data-testid="crew-status" className={`text-[10px] font-extrabold rounded-full px-[7px] py-px whitespace-nowrap ${kind === 'way' ? 'bg-vk-gold text-vk-ink' : 'bg-vk-navy text-white'}`}>
    {kind === 'way' ? 'On the way' : 'On site'}
  </span>
) : null);

const actionBtn = 'min-h-[48px] rounded-btn font-display font-extrabold text-xs tracking-[0.6px] uppercase';

/**
 * Base — Receive (spec §4.9). One responsive component for desktop, tablet
 * (fits 1112×834 without page scroll) and phone (stacks, receive panel first).
 */
const BaseReceive = () => {
  const store = useBaseOperationsStore();
  const {
    currentRace, checkpoints = [], runners = [], radioCalls = [], outList = [], raceRunnerNumbers = [], raceRunnerBatches: batchOf = new Map(), resolutions = [],
    receive, setReceive, resetReceive, recordCall, undoCall, setResolutionsAsked, recordCorrection,
    recordMissed, recordStandDown, addResolution, removeResolution, crewVehicles = [],
  } = store;
  const now = useNow(10000);
  const inputRef = useRef(null);
  const [typed, setTyped] = useState('');
  const [flash, setFlash] = useState('');
  const [undoEntries, setUndoEntries] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [exactInvalid, setExactInvalid] = useState(false);
  const [askUndo, setAskUndo] = useState(null); // { cp, ids, text } after "Asked"
  const [standDownCp, setStandDownCp] = useState(null); // checkpoint whose Stand-down check is open
  const [crewCp, setCrewCp] = useState(null); // checkpoint whose crew sheet is open

  const raceStart = currentRace?.date && currentRace?.startTime
    ? TimeUtils.createRaceTimestamp(currentRace.date, currentRace.startTime.slice(0, 5))
    : null;
  const earliest = earliestTime(raceStart, now);
  // Crew pills only matter while crews are still getting into position
  const crewPills = useMemo(() => (raceStart && now < raceStart ? crewPillByCheckpoint(crewVehicles) : new Map()), [crewVehicles, raceStart, now]);
  const nowBlock = toBlock(now);
  const out = useMemo(() => outStatusMap(outList, runners), [outList, runners]);
  const sightings = useMemo(() => sightingsByCheckpoint(runners), [runners]);
  const raceNumbers = useMemo(() => new Set(raceRunnerNumbers), [raceRunnerNumbers]);
  const distances = useMemo(() => checkpointDistances(checkpoints, currentRace), [checkpoints, currentRace]);
  const board = useMemo(() => buildBoard({
    checkpoints, records: runners, radioCalls, now, raceStart, distances,
    fieldSize: raceRunnerNumbers.length, outCount: out.size, raceNumbers: raceRunnerNumbers, out, batchOf,
    dueMinutes: currentRace?.baseCallDueMinutes ?? CALL_DUE_MINUTES,
  }), [checkpoints, runners, radioCalls, now, raceStart, raceRunnerNumbers, out, batchOf, currentRace?.baseCallDueMinutes, distances]);

  // "Ask CPx" reminders set in Reports › Needs attention, until marked asked
  const asks = useMemo(() => askReminders(resolutions, board), [resolutions, board]);
  const askText = (cp) => (asks.get(cp) ?? []).map(a => a.number).join(', ');
  const markAsked = async (row) => {
    const ids = asks.get(row.number).map(a => a.id);
    await setResolutionsAsked(ids, TimeUtils.getCurrentTimestamp());
    setAskUndo({ cp: row.number, ids, text: `Asked ${row.short} about ${askText(row.number)}` });
  };
  const undoAsked = async () => {
    const u = askUndo;
    setAskUndo(null);
    await setResolutionsAsked(u.ids, null);
  };

  // Runners a checkpoint missed (Part E1): the Skipped check, by checkpoint
  const order = useMemo(() => boardCheckpoints(checkpoints), [checkpoints]);
  const resolvedKeys = useMemo(() => new Set(resolutions.map(r => r.issueKey)), [resolutions]);
  const missed = useMemo(() => missedReminders({ sightings, order, resolvedKeys, batchOf }), [sightings, order, resolvedKeys, batchOf]);

  // A draft saved for another race (persisted across reloads) is ignored
  const rx = receive && (!receive.raceId || receive.raceId === store.currentRaceId) ? receive : { step: 'idle', entries: [] };
  const cur = board.find(b => b.number === rx.cp) ?? null;
  const prevCp = cur ? board[board.indexOf(cur) - 1] : null;
  const checked = useMemo(() => (cur ? checkCall(rx.entries ?? [], {
    raceNumbers,
    out,
    logged: sightings.get(cur.number) ?? new Map(),
    prev: prevCp ? { short: prevCp.short, seen: sightings.get(prevCp.number) ?? new Map(), applies: (n) => appliesAt(prevCp, n, batchOf) } : null,
  }) : []), [cur, prevCp, rx.entries, raceNumbers, out, sightings, batchOf]);
  const goodCount = checked.filter(c => isRecordable(c.kind)).length;

  // ── actions ──────────────────────────────────────────────────────────────
  const clearTransient = () => { setTyped(''); setUndoEntries(null); setConfirmCancel(false); };

  const pickCheckpoint = (row) => {
    const next = row.lastBlock ? TimeUtils.addMinutes(row.lastBlock, BLOCK_MINUTES) : nowBlock;
    setReceive({ step: 'rx', cp: row.number, entries: [], ctime: next > nowBlock ? nowBlock : next, manual: false, manualText: '', summary: null, lastCallId: null, raceId: store.currentRaceId, corr: null, missedUndo: null });
    clearTransient();
    setFlash('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const setBlock = (t, manual = false, text = '') => {
    setReceive({ ctime: t, manual, manualText: text });
    clearTransient();
    setFlash((rx.entries ?? []).length ? `Now taking ${hhmm(t)}` : '');
  };

  const addNum = (raw = typed) => {
    const s = String(raw).trim();
    if (!/^\d+$/.test(s)) { setFlash('Type a number first'); return; }
    setReceive(r => ({ entries: [...r.entries, { num: Number(s), t: r.ctime, manual: r.manual }] }));
    setTyped('');
    setConfirmCancel(false);
    setUndoEntries(null);
    setFlash(`${s} added at ${hhmm(rx.ctime)}`);
    inputRef.current?.focus();
  };

  // A number outside the field: tap to record it as a late entry (Undo)
  const acceptLate = (i) => {
    setUndoEntries(rx.entries);
    setReceive({ entries: rx.entries.map((e, k) => (k === i ? { ...e, late: true } : e)) });
    setFlash(`${rx.entries[i].num} will be recorded as a late entry`);
  };

  const removeAt = (i) => {
    const e = rx.entries[i];
    setUndoEntries(rx.entries);
    setReceive({ entries: rx.entries.filter((_, k) => k !== i) });
    setConfirmCancel(false);
    setFlash(`${e.num} removed`);
  };

  const clearBlock = () => {
    const keep = rx.entries.filter(e => e.t !== rx.ctime);
    const n = rx.entries.length - keep.length;
    setConfirmCancel(false);
    if (!n) { setFlash(`Nothing in ${hhmm(rx.ctime)} yet`); return; }
    setUndoEntries(rx.entries);
    setReceive({ entries: keep });
    setFlash(`Cleared ${n} from ${hhmm(rx.ctime)}`);
  };

  const goNextBlock = () => {
    const t = TimeUtils.addMinutes(toBlock(rx.ctime), BLOCK_MINUTES);
    if (t > nowBlock) return;
    setReceive({ ctime: t, manual: false, manualText: '' });
    clearTransient();
    setFlash(`Now taking ${hhmm(t)}`);
    inputRef.current?.focus();
  };

  const cancelCall = () => {
    if (rx.entries.length && !confirmCancel) {
      setConfirmCancel(true);
      setFlash(`Cancel drops all ${rx.entries.length} numbers in this call`);
      return;
    }
    resetReceive();
    clearTransient();
    setFlash('');
  };

  // Commit once a whole time is typed (HHMM or H:MM); show it as HH:MM.
  // A rejected time clears the field and keeps the block that was selected.
  const onExact = (value) => {
    const v = value.replace(/[^\d:]/g, '').slice(0, 5);
    setExactInvalid(false);
    const setText = (text) => (rx.corr ? setCorr({ manualText: text }) : setReceive({ manualText: text }));
    if (!/^\d{4}$|^\d{1,2}:\d{2}$/.test(v)) { setText(v); return; }
    const t = parseExactTime(v, now);
    if (t && t >= earliest && t <= now) {
      if (rx.corr) setCorr({ ctime: t, manual: true, manualText: hhmm(t) });
      else setBlock(t, true, hhmm(t));
      return;
    }
    setText('');
    setExactInvalid(true);
    setFlash(t ? `Time must be between ${hhmm(earliest)} and now` : `${v} isn't a time — type HH:MM`);
  };

  // ── Correction mode (its own call, one runner at a time) ─────────────────
  // The call in progress is kept in the draft and comes back on "Back to call".
  const setCorr = (patch) => setReceive(r => ({ corr: { ...r.corr, ...patch } }));
  const openCorrection = () => {
    setReceive({ corr: { num: '', ctime: nowBlock, manual: false, manualText: '', notPassed: false } });
    setFlash(''); setExactInvalid(false);
  };
  const closeCorrection = () => { setReceive({ corr: null }); setFlash(''); setExactInvalid(false); };
  const corrNum = rx.corr?.num ? Number(rx.corr.num) : null;
  const corrHad = cur && corrNum ? (sightings.get(cur.number)?.get(corrNum) ?? null) : null;
  const corrWarn = corrNum == null ? null
    : !raceNumbers.has(corrNum) ? 'Not in setup — check the number'
      : out.has(corrNum) ? `Marked ${out.get(corrNum)} — base decides` : null;
  const setCorrNum = (num) => {
    // Pick up what base had, so the picker starts on it
    const had = cur && num ? sightings.get(cur.number)?.get(Number(num)) : null;
    setCorr({ num, ...(had && { ctime: toBlock(had), manual: false, manualText: '' }) });
  };
  const applyCorrection = async () => {
    if (!corrNum || busy) return;
    setBusy(true);
    try {
      const { ctime, manual, notPassed } = rx.corr;
      if (rx.corr.missed) {
        // "They have it": the checkpoint gave a time for a runner it had missed
        const callId = await recordMissed(cur.number, { number: corrNum, time: ctime, manual });
        setReceive({ corr: null, missedUndo: { kind: 'call', id: callId, text: `${corrNum} recorded at ${cur.short} ${hhmm(ctime)}` } });
        setFlash('');
        return;
      }
      const callId = await recordCorrection(cur.number, { number: corrNum, time: notPassed ? null : ctime, manual, notPassed });
      const text = `${corrNum} at ${cur.short}: ${corrHad ? hhmm(corrHad) : 'no time'} → ${notPassed ? 'not passed' : hhmm(ctime)}`;
      setReceive(r => ({ corr: { ...r.corr, num: '', notPassed: false, undo: { callId, text } } }));
      setFlash(`Correction recorded — ${text}`);
    } catch (err) {
      setFlash(`Could not record the correction: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };
  const corrUndo = rx.corr?.undo ?? null; // kept in the persisted draft, like the done card's Undo
  const undoCorrection = async () => {
    const u = corrUndo;
    setCorr({ undo: null });
    await undoCall(u.callId);
    setFlash(`Correction undone — ${u.text}`);
  };

  const askedHasIt = (m) => {
    setReceive({ corr: { num: String(m.number), ctime: nowBlock, manual: false, manualText: '', notPassed: false, missed: true } });
    setFlash(''); setExactInvalid(false);
  };
  const notSeenThere = async (m) => {
    const id = await addResolution(m.issueKey, MISSED_CONFIRMED);
    setReceive({ missedUndo: { kind: 'resolution', id, text: `${m.number}: not seen at ${cur.short}` } });
  };
  const undoMissed = async () => {
    const u = rx.missedUndo;
    setReceive({ missedUndo: null });
    if (u.kind === 'call') await undoCall(u.id);
    else await removeResolution(u.id);
  };

  const complete = async () => {
    if (!rx.entries.length || busy) return;
    setBusy(true);
    try {
      const callId = await recordCall(cur.number, checked);
      const times = [...new Set(rx.entries.map(e => e.t))].sort();
      const bad = rx.entries.length - goodCount;
      const label = times.length > 1 ? `Blocks ${times.map(hhmm).join(', ')}` : `Common time ${hhmm(times[0])}`;
      setReceive({
        step: 'done',
        lastCallId: callId,
        summary: { title: `${goodCount} recorded at ${cur.short}${bad ? ` · ${bad} skipped (flagged)` : ''}`, sub: label },
      });
      clearTransient();
      setFlash('');
    } catch (err) {
      setFlash(`Could not record the call: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const reopen = async () => {
    await undoCall(rx.lastCallId);
    setReceive({ step: 'rx', summary: null, lastCallId: null });
    setFlash('Call reopened');
  };

  // ── derived view data ───────────────────────────────────────────────────
  let blocks = [];
  if (cur && rx.step === 'rx') {
    const start = cur.lastBlock
      ? TimeUtils.addMinutes(cur.lastBlock, -BLOCK_MINUTES)
      : TimeUtils.addMinutes(nowBlock, -60);
    // A correction or a missed runner can be any earlier time: offer the whole window
    const from = rx.corr || start < toBlock(earliest) ? toBlock(earliest) : start;
    const used = new Set(rx.entries.map(e => e.t));
    const nextKey = cur.lastBlock ? TimeUtils.addMinutes(cur.lastBlock, BLOCK_MINUTES) : null;
    const sel = rx.corr ?? rx;
    blocks = blocksBetween(from, now).slice(-MAX_BLOCKS).map(b => {
      const done = !!cur.lastBlock && b <= cur.lastBlock;
      const has = !rx.corr && used.has(b);
      return {
        key: b, label: hhmm(b), selected: !sel.manual && sel.ctime === b, done, has,
        sub: done ? 'done' : has ? 'this call' : b === nextKey ? 'next' : '',
      };
    });
  }
  const chips = checked.map((c, i) => ({ ...c, i })).filter(c => c.t === rx.ctime);
  const otherTimes = [...new Set(checked.map(c => c.t))].filter(t => t !== rx.ctime).sort();
  const atNow = rx.ctime && toBlock(rx.ctime) >= nowBlock;
  const nextLabel = atNow ? 'At now' : `Next ${hhmm(TimeUtils.addMinutes(toBlock(rx.ctime ?? now), BLOCK_MINUTES))} →`;

  return (
    <div className="max-w-[1280px] w-full mx-auto p-3 flex flex-wrap gap-3 items-start" data-screenshot-target>
      <section aria-labelledby="rxhd" className="flex-[999_1_480px] min-w-0 flex flex-col gap-3">
        {rx.step === 'idle' && (
          <div className="bg-white dark:bg-gray-800 border border-vk-border dark:border-gray-700 rounded-card p-3 flex flex-col gap-2.5">
            <h1 id="rxhd" className="font-display font-bold text-base text-vk-navy dark:text-white">Who&apos;s calling?</h1>
            <div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
              {board.map(row => (
                <button
                  key={row.number}
                  type="button"
                  onClick={() => pickCheckpoint(row)}
                  aria-label={`${row.short}, ${pillText[row.status]}${asks.has(row.number) ? `, ask about ${askText(row.number)}` : ''}${missed.has(row.number) ? `, missed ${missed.get(row.number).map(m => m.number).join(', ')}` : ''}`}
                  className={`min-h-[64px] px-2.5 py-2 rounded-btn flex flex-col items-start justify-center gap-0.5 text-left ${row.status === 'due'
                    ? 'bg-vk-gold-tint border-2 border-vk-gold'
                    : 'bg-white border border-vk-border dark:bg-gray-800 dark:border-gray-600'} ${row.status === 'closed' ? 'opacity-75' : ''}`}
                >
                  <span className="flex items-center gap-2 w-full">
                    <span className="font-display font-extrabold text-lg text-vk-navy dark:text-white">{row.short}</span>
                    <StatusPill status={row.status} />
                    <CrewPill kind={crewPills.get(row.number)} />
                  </span>
                  <span className="text-xs font-semibold text-vk-muted">
                    {row.lastBlock ? `up to ${hhmm(row.lastBlock)}` : 'no calls yet'}
                  </span>
                  {asks.has(row.number) && (
                    <span className="text-xs font-bold text-vk-ink bg-vk-gold-tint border border-vk-gold rounded-chip px-1.5">Ask about {askText(row.number)}</span>
                  )}
                  {missed.has(row.number) && (
                    <span className="text-xs font-bold text-vk-ink bg-vk-gold-tint border border-vk-gold rounded-chip px-1.5">Missed: {missedText(missed.get(row.number))}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {rx.step === 'rx' && cur && rx.corr && (
          <div className="bg-white dark:bg-gray-800 border-2 border-vk-gold rounded-card p-3 flex flex-col gap-2.5" data-testid="correction-panel">
            <div className="flex items-center gap-2.5">
              <h1 id="rxhd" className="font-display font-extrabold text-xl text-vk-navy dark:text-white">{cur.short} · {rx.corr.missed ? 'Missed runner' : 'Correction'}</h1>
              <div className="text-[13px] text-vk-muted flex-1 min-w-0 truncate">{rx.corr.missed ? 'Enter the time they give' : 'One runner at a time'}</div>
              <button type="button" onClick={closeCorrection}
                className="min-h-[40px] px-3 rounded-btn border border-vk-muted bg-white text-vk-ink font-bold text-xs dark:bg-gray-800 dark:text-gray-100">
                Back to call{rx.entries.length ? ` · ${rx.entries.length}` : ''}
              </button>
            </div>
            <div className="flex flex-wrap gap-3 items-stretch">
              <div className="flex-[1_1_240px] min-w-0 flex flex-col gap-2">
                <label htmlFor="corr-bib" className="text-xs font-bold text-vk-muted uppercase tracking-[0.8px]">Runner</label>
                <input id="corr-bib" type="text" inputMode="numeric" autoComplete="off" value={rx.corr.num ?? ''} readOnly={!!rx.corr.missed}
                  onChange={e => setCorrNum(e.target.value.replace(/\D/g, '').slice(0, MAX_DIGITS))}
                  placeholder="Number"
                  className="font-display font-extrabold text-[26px] text-vk-ink bg-white border-2 border-vk-blue rounded-btn px-3 py-1 min-h-[52px] dark:bg-gray-900 dark:text-white" />
                <div className="text-sm font-semibold min-h-[20px]" data-testid="corr-had">
                  {corrNum ? (corrHad ? `Had ${hhmm(corrHad)}` : 'No earlier time') : ''}
                </div>
                {corrWarn && <div className="text-xs font-bold text-vk-ink bg-vk-gold-tint border border-vk-gold rounded-btn px-2 py-1" data-testid="corr-warning">{corrWarn}</div>}
                <div className="text-xs font-bold text-vk-muted uppercase tracking-[0.8px] mt-1">New time</div>
                <BlockPicker blocks={blocks} onPick={(t) => setCorr({ ctime: t, manual: false, manualText: '', notPassed: false })}
                  exactText={rx.corr.manualText} onExactChange={onExact} exactActive={rx.corr.manual && !rx.corr.notPassed} exactInvalid={exactInvalid} />
                {!rx.corr.missed && <button type="button" aria-pressed={!!rx.corr.notPassed} onClick={() => setCorr({ notPassed: !rx.corr.notPassed })}
                  className={`self-start min-h-[44px] px-3.5 rounded-btn font-bold text-[13px] ${rx.corr.notPassed ? 'bg-vk-navy text-white' : 'bg-white text-vk-ink border border-vk-muted dark:bg-gray-800 dark:text-gray-100'}`}>
                  Not passed
                </button>}
              </div>
              <div className="flex-[0_1_220px]">
                <NumberPad
                  onDigit={d => setCorrNum(((rx.corr.num ?? '') + d).slice(0, MAX_DIGITS))}
                  onBackspace={() => setCorrNum((rx.corr.num ?? '').slice(0, -1))}
                  onAdd={applyCorrection}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 min-h-[28px]">
              <span className="flex-1 text-xs font-semibold text-vk-blue" aria-live="polite" data-testid="rx-flash">{flash}</span>
              {corrUndo && (
                <button type="button" onClick={undoCorrection} className="min-h-[32px] px-3 rounded-lg bg-vk-ink text-white font-bold text-xs">Undo</button>
              )}
            </div>
            <button type="button" onClick={applyCorrection} disabled={!corrNum || busy}
              className={`${actionBtn} ${!corrNum || busy ? LOCKED : 'bg-vk-gold text-vk-ink shadow-btn'}`}>
              {rx.corr.missed ? `Record missed · ${hhmm(rx.corr.ctime)}`
                : rx.corr.notPassed ? 'Apply correction · not passed' : `Apply correction${corrNum ? ` · ${hhmm(rx.corr.ctime)}` : ''}`}
            </button>
          </div>
        )}

        {rx.step === 'rx' && cur && !rx.corr && (
          <div className="bg-white dark:bg-gray-800 border-2 border-vk-gold rounded-card p-3 flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <h1 id="rxhd" className="font-display font-extrabold text-xl text-vk-navy dark:text-white">{cur.short}</h1>
              <div className="text-[13px] text-vk-muted flex-1 min-w-0 truncate">{cur.name}</div>
              <div className="text-[13px] font-bold text-vk-blue whitespace-nowrap">{goodCount} to record</div>
              <button type="button" onClick={openCorrection}
                className="min-h-[40px] px-3 rounded-btn border border-vk-muted bg-white text-vk-ink font-bold text-xs dark:bg-gray-800 dark:text-gray-100">
                Correction
              </button>
              <button type="button" onClick={() => setStandDownCp(cur.number)}
                className="min-h-[40px] px-3 rounded-btn border border-vk-muted bg-white text-vk-ink font-bold text-xs dark:bg-gray-800 dark:text-gray-100">
                Stand-down check
              </button>
              <button type="button" onClick={() => setCrewCp(cur.number)}
                className="min-h-[40px] px-3 rounded-btn border border-vk-muted bg-white text-vk-ink font-bold text-xs dark:bg-gray-800 dark:text-gray-100">
                Crew
              </button>
            </div>

            {(missed.has(cur.number) || rx.missedUndo) && (
              <div className="bg-vk-gold-tint border border-vk-gold rounded-btn p-2.5 flex flex-col gap-2" data-testid="missed-panel">
                {missed.has(cur.number) && (
                  <>
                    <div className="text-[13px] font-bold text-vk-ink dark:text-white">Missed here — seen further on. Ask about each:</div>
                    {missed.get(cur.number).map(m => (
                      <div key={m.issueKey} className="flex flex-wrap items-center gap-2" data-testid="missed-row">
                        <span className="font-display font-extrabold text-lg tabular-nums w-14">{m.number}</span>
                        <span className="flex-1 text-xs text-vk-muted">{m.seenAt ? `seen ${m.seenAt}` : ''}</span>
                        <button type="button" onClick={() => askedHasIt(m)} className="min-h-[40px] px-3 rounded-btn bg-vk-blue text-white font-bold text-xs">They have it</button>
                        <button type="button" onClick={() => notSeenThere(m)} className="min-h-[40px] px-3 rounded-btn border border-vk-muted bg-white text-vk-ink font-bold text-xs dark:bg-gray-800 dark:text-gray-100">Not seen there</button>
                      </div>
                    ))}
                  </>
                )}
                {rx.missedUndo && (
                  <div className="flex items-center gap-2 text-xs text-vk-ink dark:text-white" role="status">
                    <span className="flex-1">{rx.missedUndo.text}</span>
                    <button type="button" onClick={undoMissed} className="min-h-[32px] px-3 rounded-lg bg-vk-ink text-white font-bold text-xs">Undo</button>
                  </div>
                )}
              </div>
            )}

            <BlockPicker
              blocks={blocks}
              onPick={(t) => setBlock(t)}
              exactText={rx.manualText}
              onExactChange={onExact}
              exactActive={rx.manual}
              exactInvalid={exactInvalid}
            />

            <div className="flex flex-wrap gap-3 items-stretch">
              <div className="flex-[1_1_240px] min-w-0 flex flex-col gap-2">
                <div
                  className="flex-1 flex flex-wrap gap-1.5 min-h-[96px] max-h-[210px] overflow-y-auto content-start bg-vk-paper dark:bg-gray-900 rounded-btn p-2"
                  aria-label={`Numbers at ${hhmm(rx.ctime)}`}
                  data-testid="rx-numbers"
                >
                  {chips.map(c => (
                    c.canAdd
                      ? <BibChip key={c.i} number={c.num} note={`${c.note} — tap to record`} ariaLabel={`Record ${c.num}, not in setup`}
                          className={checkClasses(CHECK.WARN)} onClick={() => acceptLate(c.i)} />
                      : <BibChip key={c.i} number={c.num} note={c.note} className={checkClasses(c.kind)} onClick={() => removeAt(c.i)} />
                  ))}
                  {chips.length === 0 && (
                    <span className="text-[13px] text-vk-muted">No numbers at {hhmm(rx.ctime)} yet. Tap a number to remove it.</span>
                  )}
                </div>
                {otherTimes.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-vk-muted">Also in this call:</span>
                    {otherTimes.map(t => {
                      const n = checked.filter(c => c.t === t && isRecordable(c.kind)).length;
                      const manual = toBlock(t) !== t;
                      return (
                        <button key={t} type="button" onClick={() => setBlock(t, manual, manual ? hhmm(t) : '')}
                          aria-label={`Show the numbers at ${hhmm(t)}, ${n} to record`}
                          className="min-h-[32px] px-2.5 rounded-full border border-vk-blue bg-white text-vk-blue font-bold text-xs dark:bg-gray-800">
                          {hhmm(t)} · {n}
                        </button>
                      );
                    })}
                  </div>
                )}
                <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); addNum(); }}>
                  <label htmlFor="bib-heard" className="sr-only">Number heard</label>
                  <input
                    id="bib-heard"
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={typed}
                    onChange={e => { setTyped(e.target.value.replace(/\D/g, '').slice(0, MAX_DIGITS)); setFlash(''); }}
                    placeholder="Number heard"
                    className="flex-1 min-w-0 font-display font-extrabold text-[26px] text-vk-ink bg-white border-2 border-vk-blue rounded-btn px-3 py-1 min-h-[52px] dark:bg-gray-900 dark:text-white"
                  />
                  <button type="submit" className="font-display font-extrabold text-sm tracking-[0.6px] uppercase bg-vk-blue text-white rounded-btn px-4 min-h-[52px]">Add</button>
                </form>
                <div className="flex items-center gap-2 min-h-[28px]">
                  <span className="flex-1 text-xs font-semibold text-vk-blue" aria-live="polite" data-testid="rx-flash">{flash}</span>
                  {undoEntries && (
                    <button type="button" onClick={() => { setReceive({ entries: undoEntries }); setUndoEntries(null); setFlash('Restored'); }}
                      className="min-h-[32px] px-3 rounded-lg bg-vk-ink text-white font-bold text-xs">
                      Undo
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-[0_1_220px]">
                <NumberPad
                  onDigit={d => setTyped(t => (t.length < MAX_DIGITS ? t + d : t))}
                  onBackspace={() => setTyped(t => t.slice(0, -1))}
                  onAdd={() => addNum()}
                />
              </div>
            </div>

            <div className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(110px,1fr))]">
              <button type="button" onClick={cancelCall}
                className={`${actionBtn} ${confirmCancel ? 'bg-vk-red text-white' : 'bg-white text-vk-red border-2 border-vk-red dark:bg-gray-800'}`}>
                {confirmCancel ? 'Tap again to cancel' : 'Cancel call'}
              </button>
              <button type="button" onClick={clearBlock} className={`${actionBtn} bg-white text-vk-ink border border-vk-muted dark:bg-gray-800 dark:text-gray-100`}>
                Clear {hhmm(rx.ctime)}
              </button>
              <button type="button" onClick={goNextBlock} disabled={atNow}
                className={`${actionBtn} ${atNow ? LOCKED : 'bg-vk-blue text-white'}`}>
                {nextLabel}
              </button>
              {/* Nothing recordable: still log the call (rejected numbers feed the
                  Unknown bibs check), but not as the gold primary */}
              <button type="button" onClick={complete} disabled={!rx.entries.length || busy}
                className={`${actionBtn} ${!rx.entries.length || busy
                  ? LOCKED
                  : !goodCount
                    ? 'bg-white text-vk-ink border border-vk-muted dark:bg-gray-800 dark:text-gray-100'
                    : 'bg-vk-gold text-vk-ink shadow-btn'}`}>
                {rx.entries.length && !goodCount ? 'Log call · 0' : `Complete · ${goodCount}`}
              </button>
            </div>
          </div>
        )}

        {rx.step === 'done' && rx.summary && (
          <div className="bg-white dark:bg-gray-800 border border-vk-border dark:border-gray-700 rounded-card p-3.5 flex flex-wrap items-center gap-3" role="status">
            <span className="w-11 h-11 rounded-full bg-vk-navy flex items-center justify-center shrink-0">
              <CheckIcon className="w-[22px] h-[22px] text-vk-gold stroke-[3]" aria-hidden="true" />
            </span>
            <div className="flex-1 min-w-[180px] flex flex-col gap-0.5">
              <div className="font-display font-extrabold text-[17px] text-vk-navy dark:text-white">{rx.summary.title}</div>
              <div className="text-[13px] text-vk-muted">{rx.summary.sub}</div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={reopen}
                className="min-h-[44px] px-3.5 rounded-btn border-2 border-vk-blue text-vk-blue font-display font-extrabold text-xs tracking-[0.6px] uppercase">
                Undo
              </button>
              <button type="button" onClick={() => { resetReceive(); setFlash(''); }}
                className="min-h-[44px] px-3.5 rounded-btn bg-vk-gold text-vk-ink font-display font-extrabold text-xs tracking-[0.6px] uppercase">
                Next call
              </button>
            </div>
          </div>
        )}
      </section>

      <aside aria-labelledby="boardhd" className="flex-[1_1_260px] min-w-0 bg-white dark:bg-gray-800 border border-vk-border dark:border-gray-700 rounded-card overflow-hidden">
        <div className="px-3 py-2.5 border-b border-vk-border dark:border-gray-700">
          <h2 id="boardhd" className="font-display font-bold text-[15px] text-vk-navy dark:text-white">Checkpoints</h2>
        </div>
        {board.map(row => (
          <div key={row.number} data-testid={`board-${row.short}`}
            className={`flex items-center gap-2 px-3 py-[7px] border-b border-vk-border dark:border-gray-700 last:border-b-0 ${row.number === rx.cp && rx.step !== 'idle' ? 'bg-vk-gold-tint' : ''}`}>
            <div className="w-[46px] flex flex-col items-start gap-0.5">
              <span className="font-display font-extrabold text-[15px] text-vk-navy dark:text-white">{row.short}</span>
              <CrewPill kind={crewPills.get(row.number)} />
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="text-xs text-vk-muted leading-snug">{row.text}</div>
              {asks.has(row.number) && (
                <div className="flex items-center gap-1.5 bg-vk-gold-tint border border-vk-gold rounded-btn px-2 py-1" data-testid={`ask-${row.short}`}>
                  <span className="flex-1 text-xs font-bold text-vk-ink">Ask about {askText(row.number)}</span>
                  <button type="button" onClick={() => markAsked(row)} aria-label={`Asked ${row.short} about ${askText(row.number)}`}
                    className="min-h-[32px] px-2.5 rounded-lg bg-white border border-vk-muted text-vk-ink font-bold text-xs dark:bg-gray-800 dark:text-gray-100">Asked</button>
                </div>
              )}
              {missed.has(row.number) && (
                <div className="text-xs font-bold text-vk-ink bg-vk-gold-tint border border-vk-gold rounded-btn px-2 py-1" data-testid={`missed-${row.short}`}>
                  Missed: {missedText(missed.get(row.number))}
                </div>
              )}
              <button type="button" onClick={() => setStandDownCp(row.number)} aria-label={`Stand-down check ${row.short}`}
                className="self-start min-h-[32px] px-2 rounded-lg text-xs font-semibold text-vk-blue">
                Stand-down check
              </button>
              {askUndo?.cp === row.number && !asks.has(row.number) && (
                <div className="flex items-center gap-1.5 text-xs text-vk-muted" role="status">
                  <span className="flex-1">{askUndo.text}</span>
                  <button type="button" onClick={undoAsked} className="min-h-[32px] px-3 rounded-lg bg-vk-ink text-white font-bold text-xs">Undo</button>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <div className="font-display font-extrabold text-base tabular-nums" data-testid={`board-count-${row.short}`}>{row.count}</div>
              <StatusPill status={row.status} />
            </div>
          </div>
        ))}
      </aside>

      {crewCp != null && <CrewSheet cpNumber={crewCp} onClose={() => setCrewCp(null)} />}

      {standDownCp != null && (() => {
        const row = board.find(b => b.number === standDownCp);
        const lists = standDownLists({
          cpNumber: standDownCp, order, sightings, raceNumbers: raceRunnerNumbers, out, batchOf,
          fieldKnown: !(currentRace?.bibsOnTheDay && !raceRunnerNumbers.length),
        });
        return (
          <StandDownSheet row={row} lists={lists} missedHere={missed.get(standDownCp) ?? []}
            onStandDown={() => recordStandDown(standDownCp)} onUndo={(callId) => undoCall(callId)}
            onAddToMissed={async (numbers) => {
              // Off the list only because base resolved them earlier (asked / checked): reopen those
              const keys = new Set(numbers.map(n => `skip:${n}:${standDownCp}`));
              const rows = resolutions.filter(r => keys.has(r.issueKey));
              for (const r of rows) await removeResolution(r.id);
              return async () => { for (const r of rows) await addResolution(r.issueKey, r.resolution); };
            }}
            onClose={() => setStandDownCp(null)} />
        );
      })()}
    </div>
  );
};

/**
 * Stand-down check (Part E2): who is still unaccounted for at a checkpoint
 * before it packs down. Stand down (two taps) marks it Closed on base only;
 * runners still listed stay on Overdue / Still on course.
 */
const StandDownSheet = ({ row, lists, missedHere, onStandDown, onUndo, onAddToMissed, onClose }) => {
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState(null); // callId once stood down
  const [added, setAdded] = useState(null); // { count, undo } after Add to missed list
  const onMissedList = new Set(missedHere.map(m => m.number));
  const notOnList = lists.seenFurther.filter(r => !onMissedList.has(r.number)).map(r => r.number);
  const standDown = async () => {
    if (!confirm) { setConfirm(true); return; }
    setDone(await onStandDown());
    setConfirm(false);
  };
  const Chip = ({ children }) => <span className="inline-block bg-vk-paper dark:bg-gray-900 rounded-chip px-2 py-0.5 text-[13px] font-semibold tabular-nums">{children}</span>;
  return (
    <BottomSheet open onClose={onClose} labelledBy="standdown-hd">
      <h2 id="standdown-hd" className="font-display font-extrabold text-xl text-vk-navy dark:text-white">Stand-down check · {row.short}</h2>
      <section className="flex flex-col gap-1.5" data-testid="seen-further">
        <h3 className="text-xs font-bold text-vk-muted uppercase tracking-[0.8px]">Seen further on — missed here · {lists.seenFurther.length}</h3>
        <div className="flex flex-wrap gap-1.5">
          {lists.seenFurther.map(r => <Chip key={r.number}>{r.number} · {r.at}</Chip>)}
          {!lists.seenFurther.length && <span className="text-[13px] text-vk-muted">None</span>}
        </div>
        {lists.seenFurther.some(r => onMissedList.has(r.number)) && (
          <div className="text-xs text-vk-muted">On {row.short}&apos;s missed list: {lists.seenFurther.filter(r => onMissedList.has(r.number)).map(r => r.number).join(', ')} — ask about them on the call.</div>
        )}
        {notOnList.length > 0 && (
          <button type="button" onClick={async () => setAdded({ count: notOnList.length, undo: await onAddToMissed(notOnList) })}
            className="self-start min-h-[40px] px-3 rounded-btn bg-vk-blue text-white font-bold text-xs">
            Add {notOnList.join(', ')} to the missed list
          </button>
        )}
        {added && (
          <div className="flex items-center gap-2 text-xs" role="status">
            <span className="flex-1">{added.count} added to {row.short}&apos;s missed list</span>
            <button type="button" onClick={async () => { await added.undo(); setAdded(null); }}
              className="min-h-[32px] px-3 rounded-lg bg-vk-ink text-white font-bold text-xs">Undo</button>
          </div>
        )}
      </section>
      <section className="flex flex-col gap-1.5" data-testid="not-seen-past">
        <h3 className="text-xs font-bold text-vk-muted uppercase tracking-[0.8px]">
          Not seen past here — still to account for{lists.notSeenPast ? ` · ${lists.notSeenPast.length}` : ''}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {lists.notSeenPast === null
            ? <span className="text-[13px] text-vk-muted">Field not known (bibs assigned on the day)</span>
            : lists.notSeenPast.map(r => <Chip key={r.number}>{r.number} · {r.last ? `last ${r.last}` : 'not seen'}</Chip>)}
          {lists.notSeenPast?.length === 0 && <span className="text-[13px] text-vk-muted">None</span>}
        </div>
      </section>
      {done ? (
        <div className="flex items-center gap-2" role="status">
          <span className="flex-1 text-sm font-semibold">{row.short} stood down</span>
          <button type="button" onClick={async () => { await onUndo(done); setDone(null); }}
            className="min-h-[40px] px-3 rounded-lg bg-vk-ink text-white font-bold text-xs">Undo</button>
        </div>
      ) : (
        <button type="button" onClick={standDown}
          className={`${actionBtn} ${confirm ? 'bg-vk-red text-white' : 'bg-white text-vk-red border-2 border-vk-red dark:bg-gray-800'}`}>
          {confirm ? 'Tap again to stand down' : 'Stand down'}
        </button>
      )}
      <button type="button" onClick={onClose}
        className={`${actionBtn} bg-white text-vk-ink border border-vk-muted dark:bg-gray-800 dark:text-gray-100`}>Close</button>
    </BottomSheet>
  );
};

export default BaseReceive;
