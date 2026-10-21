import React, { useMemo, useRef, useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import useBaseOperationsStore from '../store/baseOperationsStore';
import {
  buildBoard, checkCall, isRecordable, outStatusMap, sightingsByCheckpoint, CALL_DUE_MINUTES,
} from '../services/receive';
import TimeUtils from '../../../services/timeUtils.js';
import {
  toBlock, hhmm, blocksBetween, earliestTime, parseExactTime, BLOCK_MINUTES,
} from '../../../services/blocks.js';
import { checkClasses, LOCKED } from '../../../design-system/statusStyles';
import { BlockPicker, NumberPad, BibChip } from '../../../design-system/components/VK';
import useNow from '../../../shared/hooks/useNow';

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

const actionBtn = 'min-h-[48px] rounded-btn font-display font-extrabold text-xs tracking-[0.6px] uppercase';

/**
 * Base — Receive (spec §4.9). One responsive component for desktop, tablet
 * (fits 1112×834 without page scroll) and phone (stacks, receive panel first).
 */
const BaseReceive = () => {
  const store = useBaseOperationsStore();
  const {
    currentRace, checkpoints = [], runners = [], radioCalls = [], outList = [], raceRunnerNumbers = [],
    receive, setReceive, resetReceive, recordCall, undoCall,
  } = store;
  const now = useNow(10000);
  const inputRef = useRef(null);
  const [typed, setTyped] = useState('');
  const [flash, setFlash] = useState('');
  const [undoEntries, setUndoEntries] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [exactInvalid, setExactInvalid] = useState(false);

  const raceStart = currentRace?.date && currentRace?.startTime
    ? TimeUtils.createRaceTimestamp(currentRace.date, currentRace.startTime.slice(0, 5))
    : null;
  const earliest = earliestTime(raceStart, now);
  const nowBlock = toBlock(now);
  const out = useMemo(() => outStatusMap(outList, runners), [outList, runners]);
  const sightings = useMemo(() => sightingsByCheckpoint(runners), [runners]);
  const raceNumbers = useMemo(() => new Set(raceRunnerNumbers), [raceRunnerNumbers]);
  const board = useMemo(() => buildBoard({
    checkpoints, records: runners, radioCalls, now, raceStart,
    fieldSize: raceRunnerNumbers.length, outCount: out.size,
    dueMinutes: currentRace?.baseCallDueMinutes ?? CALL_DUE_MINUTES,
  }), [checkpoints, runners, radioCalls, now, raceStart, raceRunnerNumbers.length, out.size, currentRace?.baseCallDueMinutes]);

  // A draft saved for another race (persisted across reloads) is ignored
  const rx = receive && (!receive.raceId || receive.raceId === store.currentRaceId) ? receive : { step: 'idle', entries: [] };
  const cur = board.find(b => b.number === rx.cp) ?? null;
  const prevCp = cur ? board[board.indexOf(cur) - 1] : null;
  const checked = useMemo(() => (cur ? checkCall(rx.entries ?? [], {
    raceNumbers,
    out,
    logged: sightings.get(cur.number) ?? new Map(),
    prev: prevCp ? { short: prevCp.short, seen: sightings.get(prevCp.number) ?? new Map() } : null,
  }) : []), [cur, prevCp, rx.entries, raceNumbers, out, sightings]);
  const goodCount = checked.filter(c => isRecordable(c.kind)).length;

  // ── actions ──────────────────────────────────────────────────────────────
  const clearTransient = () => { setTyped(''); setUndoEntries(null); setConfirmCancel(false); };

  const pickCheckpoint = (row) => {
    const next = row.lastBlock ? TimeUtils.addMinutes(row.lastBlock, BLOCK_MINUTES) : nowBlock;
    setReceive({ step: 'rx', cp: row.number, entries: [], ctime: next > nowBlock ? nowBlock : next, manual: false, manualText: '', summary: null, lastCallId: null, raceId: store.currentRaceId });
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
    if (!/^\d{4}$|^\d{1,2}:\d{2}$/.test(v)) { setReceive({ manualText: v }); return; }
    const t = parseExactTime(v, now);
    if (t && t >= earliest && t <= now) { setBlock(t, true, hhmm(t)); return; }
    setReceive({ manualText: '' });
    setExactInvalid(true);
    setFlash(t ? `Time must be between ${hhmm(earliest)} and now` : `${v} isn't a time — type HH:MM`);
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
    const from = start < toBlock(earliest) ? toBlock(earliest) : start;
    const used = new Set(rx.entries.map(e => e.t));
    const nextKey = cur.lastBlock ? TimeUtils.addMinutes(cur.lastBlock, BLOCK_MINUTES) : null;
    blocks = blocksBetween(from, now).slice(-MAX_BLOCKS).map(b => {
      const done = !!cur.lastBlock && b <= cur.lastBlock;
      const has = used.has(b);
      return {
        key: b, label: hhmm(b), selected: !rx.manual && rx.ctime === b, done, has,
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
                  aria-label={`${row.short}, ${pillText[row.status]}`}
                  className={`min-h-[64px] px-2.5 py-2 rounded-btn flex flex-col items-start justify-center gap-0.5 text-left ${row.status === 'due'
                    ? 'bg-vk-gold-tint border-2 border-vk-gold'
                    : 'bg-white border border-vk-border dark:bg-gray-800 dark:border-gray-600'} ${row.status === 'closed' ? 'opacity-75' : ''}`}
                >
                  <span className="flex items-center gap-2 w-full">
                    <span className="font-display font-extrabold text-lg text-vk-navy dark:text-white">{row.short}</span>
                    <StatusPill status={row.status} />
                  </span>
                  <span className="text-xs font-semibold text-vk-muted">
                    {[row.ops[0], row.lastBlock ? `up to ${hhmm(row.lastBlock)}` : 'no calls yet'].filter(Boolean).join(' · ')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {rx.step === 'rx' && cur && (
          <div className="bg-white dark:bg-gray-800 border-2 border-vk-gold rounded-card p-3 flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <h1 id="rxhd" className="font-display font-extrabold text-xl text-vk-navy dark:text-white">{cur.short}</h1>
              <div className="text-[13px] text-vk-muted flex-1 min-w-0 truncate">{[cur.ops[0], cur.name].filter(Boolean).join(' · ')}</div>
              <div className="text-[13px] font-bold text-vk-blue whitespace-nowrap">{goodCount} to record</div>
            </div>

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
                    <BibChip key={c.i} number={c.num} note={c.note} className={checkClasses(c.kind)} onClick={() => removeAt(c.i)} />
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
            <div className="w-[46px] font-display font-extrabold text-[15px] text-vk-navy dark:text-white">{row.short}</div>
            <div className="flex-1 min-w-0 text-xs text-vk-muted leading-snug">{row.text}</div>
            <div className="flex flex-col items-end gap-0.5">
              <div className="font-display font-extrabold text-base tabular-nums" data-testid={`board-count-${row.short}`}>{row.count}</div>
              <StatusPill status={row.status} />
            </div>
          </div>
        ))}
      </aside>
    </div>
  );
};

export default BaseReceive;
