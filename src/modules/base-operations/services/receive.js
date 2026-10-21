/**
 * Base station Receive — pure logic (spec §4.9, §6).
 *
 * Base reads both its own records (base_station_runners) and any checkpoint
 * data imported onto this device (checkpoint_runners); it only ever writes
 * base_station_runners (G11).
 */
import TimeUtils from '../../../services/timeUtils.js';
import { toBlock, hhmm } from '../../../services/blocks.js';
import { BASE_STATION_CP } from '../../../types/index.js';

export const CALL_DUE_MINUTES = 8;   // base: no call for 8+ min with runners expected
export const BEHIND_MINUTES = 15;    // show "N min behind" from 15 min

export const CHECK = { OK: 'ok', INFO: 'info', WARN: 'warn', BAD: 'bad' };

const PASSED = new Set(['passed', 'called-in', 'marked-off']);
const DNF_STATUSES = new Set(['dnf', 'withdrawn', 'vet-out']);

/** Time a record puts a runner at its checkpoint, or null if it isn't a sighting. */
export function recordTime(r) {
  if (!r || !PASSED.has(r.status)) return null;
  return r.commonTime || r.actualTime || r.markOffTime || null;
}

/** cp number → Map(bib → earliest time seen there). */
export function sightingsByCheckpoint(records) {
  const out = new Map();
  for (const r of records) {
    const t = recordTime(r);
    if (!t) continue;
    if (!out.has(r.checkpointNumber)) out.set(r.checkpointNumber, new Map());
    const m = out.get(r.checkpointNumber);
    if (!m.has(r.number) || t < m.get(r.number)) m.set(r.number, t);
  }
  return out;
}

/**
 * Race-wide out status: bib → 'DNF' | 'DNS'. Built from the out list
 * (withdrawals, vet-outs, checkpoint DNF/DNS) and base finish-line records.
 */
export function outStatusMap(outList = [], records = []) {
  const m = new Map();
  for (const r of outList) {
    if (r.status === 'non-starter' || r.status === 'dns') m.set(r.number, 'DNS');
    else if (DNF_STATUSES.has(r.status)) m.set(r.number, 'DNF');
  }
  for (const r of records) {
    if (r.checkpointNumber !== BASE_STATION_CP) continue;
    if (r.status === 'non-starter' || r.status === 'dns') m.set(r.number, 'DNS');
    else if (DNF_STATUSES.has(r.status)) m.set(r.number, 'DNF');
  }
  return m;
}

/**
 * Last block received for each checkpoint ("up to"). Exact times (manualTime)
 * never advance it — one runner given an exact 10:53 mustn't make the board
 * think 10:25–10:45 were received.
 * @returns {Map<number, string>} cp → block ISO
 */
export function reportedUpTo(records) {
  const out = new Map();
  for (const r of records) {
    const t = recordTime(r);
    if (!t || r.manualTime === true) continue;
    const b = toBlock(t);
    const cur = out.get(r.checkpointNumber);
    if (!cur || b > cur) out.set(r.checkpointNumber, b);
  }
  return out;
}

/** Board order: race checkpoints ascending, then Finish (base station, cp 0). */
export function boardCheckpoints(checkpoints = []) {
  const cps = [...checkpoints]
    .filter(cp => cp.number !== BASE_STATION_CP)
    .sort((a, b) => a.number - b.number)
    .map(cp => ({
      number: cp.number,
      short: `CP${cp.number}`,
      name: cp.locationName || cp.name || `Checkpoint ${cp.number}`,
      ops: cp.operatorCallsigns ?? [],
    }));
  return [...cps, { number: BASE_STATION_CP, short: 'Finish', name: 'Finish', ops: [] }];
}

/**
 * Check one number heard on a call (spec §4.9 table).
 * @param {number} num
 * @param {object} ctx
 * @param {Set<number>} ctx.raceNumbers       bibs in the race
 * @param {Map<number,string>} ctx.out        bib → 'DNF' | 'DNS'
 * @param {number[]} ctx.earlier              numbers already heard earlier in this call
 * @param {Map<number,string>} ctx.logged     bib → time already recorded at this checkpoint
 * @param {{ short: string, seen: Map<number,string> } | null} ctx.prev  previous checkpoint
 * @returns {{ kind: 'ok'|'info'|'warn'|'bad', note: string }}
 */
export function checkBaseNumber(num, { raceNumbers, out, earlier = [], logged, prev }) {
  if (!raceNumbers.has(num)) return { kind: CHECK.BAD, note: 'Not in race' };
  if (out.has(num)) return { kind: CHECK.BAD, note: out.get(num) };
  if (earlier.includes(num)) return { kind: CHECK.WARN, note: 'Said twice' };
  if (logged?.has(num)) return { kind: CHECK.WARN, note: `Had ${hhmm(logged.get(num))}` };
  if (prev && !prev.seen?.has(num)) return { kind: CHECK.INFO, note: `Not seen ${prev.short}` };
  return { kind: CHECK.OK, note: '' };
}

/** Only ok + info are recorded. */
export const isRecordable = (kind) => kind === CHECK.OK || kind === CHECK.INFO;

/**
 * Check every entry of a call in order.
 * @param {Array<{ num: number, t: string }>} entries
 * @returns {Array<{ num, t, kind, note }>}
 */
export function checkCall(entries, ctx) {
  return entries.map((e, i) => ({
    ...e,
    ...checkBaseNumber(e.num, { ...ctx, earlier: entries.slice(0, i).map(x => x.num) }),
  }));
}

/**
 * Checkpoint board rows: count, last call, how far behind, Due / OK / Closed.
 */
export function buildBoard({ checkpoints, records, radioCalls = [], now, raceStart, fieldSize, outCount = 0, dueMinutes = CALL_DUE_MINUTES }) {
  const cps = boardCheckpoints(checkpoints);
  const seen = sightingsByCheckpoint(records);
  const upTo = reportedUpTo(records);
  const nowBlock = toBlock(now);
  const activeField = Math.max(0, (fieldSize ?? 0) - outCount);
  const raceStarted = raceStart && raceStart <= now;

  return cps.map((cp, i) => {
    const here = seen.get(cp.number) ?? new Map();
    const prev = i > 0 ? cps[i - 1] : null;
    const prevCount = prev ? (seen.get(prev.number)?.size ?? 0) : null;
    const calls = radioCalls.filter(c => c.checkpointNumber === cp.number && !c.undoneAt);
    const lastCallAt = calls.map(c => c.receivedAt).sort().at(-1) ?? null;
    const lastBlock = upTo.get(cp.number) ?? null;
    const since = lastCallAt ? Math.max(0, TimeUtils.minutesBetween(lastCallAt, now)) : null;
    const behind = lastBlock ? Math.max(0, TimeUtils.minutesBetween(lastBlock, nowBlock)) : null;
    const closed = activeField > 0 && here.size >= activeField;
    const expected = prev ? prevCount > here.size : !!raceStarted;
    const waitedFrom = lastCallAt ?? (raceStarted ? raceStart : null);
    const waited = waitedFrom ? TimeUtils.minutesBetween(waitedFrom, now) : 0;
    const due = !closed && expected && waited >= dueMinutes;

    const parts = [];
    if (closed) parts.push('Closed');
    else {
      parts.push(lastBlock ? `Up to ${hhmm(lastBlock)}` : 'No calls yet');
      if (behind != null && behind >= BEHIND_MINUTES) parts.push(`${behind} min behind`);
      if (since != null) parts.push(`call ${since}m ago`);
    }

    return {
      ...cp,
      prevShort: prev?.short ?? null,
      count: here.size,
      calls: calls.length,
      lastCallAt,
      lastBlock,
      since,
      behind,
      status: closed ? 'closed' : due ? 'due' : 'ok',
      text: parts.join(' · '),
    };
  });
}
