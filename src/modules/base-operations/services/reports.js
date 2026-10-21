/**
 * Base reports (spec §4.10, §4.12) — pure functions over the merged records
 * (base_station_runners + imported checkpoint_runners) and radio calls.
 */
import TimeUtils from '../../../services/timeUtils.js';
import { hhmm } from '../../../services/blocks.js';
import { BASE_STATION_CP } from '../../../types/index.js';

const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/**
 * Where each runner is: furthest checkpoint (in course order) with a sighting.
 * @returns {Map<number, { idx: number, cp: object, time: string }>}
 */
export function lastSeen(sightings, order) {
  const out = new Map();
  order.forEach((cp, idx) => {
    for (const [num, time] of sightings.get(cp.number) ?? []) {
      const prev = out.get(num);
      if (!prev || idx > prev.idx) out.set(num, { idx, cp, time });
    }
  });
  return out;
}

/** Median split (minutes) for each leg order[i] → order[i+1], from runners seen at both. */
export function legMedians(sightings, order) {
  return order.slice(0, -1).map((cp, i) => {
    const a = sightings.get(cp.number) ?? new Map();
    const b = sightings.get(order[i + 1].number) ?? new Map();
    const splits = [];
    for (const [num, t1] of a) {
      const t2 = b.get(num);
      if (t2 && t2 > t1) splits.push(TimeUtils.minutesBetween(t1, t2));
    }
    return median(splits);
  });
}

export const OVERDUE_GRACE_MINUTES = 10;

/**
 * Runners past their expected time at the next checkpoint (expected = last
 * seen + the median split for that leg; legs nobody has completed are skipped).
 *
 * - **overdue**: the next checkpoint has reported up to at least expected +
 *   grace and the runner isn't there — a real safety concern.
 * - **awaiting**: past the expected time, but the next checkpoint hasn't
 *   reported that far yet (or at all) — it's just behind on calls.
 *
 * @param {Map<number,string>} upTo  cp → last block received (receive.reportedUpTo)
 * @returns {Array<{ number, lastCp, lastTime, nextCp, expectedAt, overdueMinutes, status, upTo }>}
 */
export function overdueRunners({ sightings, order, out, now, upTo = new Map(), graceMinutes = OVERDUE_GRACE_MINUTES }) {
  const seen = lastSeen(sightings, order);
  const medians = legMedians(sightings, order);
  const rows = [];
  for (const [number, { idx, cp, time }] of seen) {
    if (out.has(number) || idx >= order.length - 1) continue;
    const typical = medians[idx];
    if (typical == null) continue;
    const expectedAt = TimeUtils.addMinutes(time, Math.round(typical));
    const late = TimeUtils.minutesBetween(expectedAt, now);
    if (late <= 0) continue;
    const nextCp = order[idx + 1];
    const reported = upTo.get(nextCp.number) ?? null;
    const status = reported && reported >= TimeUtils.addMinutes(expectedAt, graceMinutes) ? 'overdue' : 'awaiting';
    rows.push({ number, lastCp: cp, lastTime: time, nextCp, expectedAt, overdueMinutes: late, status, upTo: reported });
  }
  return rows.sort((a, b) => b.overdueMinutes - a.overdueMinutes || a.number - b.number);
}

/** Awaiting-report runners grouped by the checkpoint that hasn't reported. */
export function awaitingByCheckpoint(rows) {
  const groups = new Map();
  for (const r of rows.filter(x => x.status === 'awaiting')) {
    if (!groups.has(r.nextCp.number)) groups.set(r.nextCp.number, { cp: r.nextCp, upTo: r.upTo, numbers: [] });
    groups.get(r.nextCp.number).numbers.push(r.number);
  }
  return [...groups.values()];
}

/**
 * One definition of the race-wide counts, shared by the Overview tiles and the
 * Reports sidebar (D2): on course = in the race (not DNS, not DNF, not finished).
 */
export function raceCounts({ sightings, out, raceNumbers }) {
  const finished = new Set([...(sightings.get(BASE_STATION_CP)?.keys() ?? [])].filter(n => !out.has(n)));
  const seen = new Set([...sightings.values()].flatMap(m => [...m.keys()]));
  const statuses = [...out.values()].map(v => (typeof v === 'string' ? v : v.status));
  let onCourse = 0;
  let notSeen = 0;
  for (const n of raceNumbers) {
    if (out.has(n) || finished.has(n)) continue;
    onCourse++;
    if (!seen.has(n)) notSeen++;
  }
  return {
    onCourse,
    notSeen,
    finished: finished.size,
    dns: statuses.filter(s => s === 'DNS').length,
    dnf: statuses.filter(s => s === 'DNF').length,
  };
}

/** Not finished and not out, grouped by last checkpoint passed (for sweep / stand-down). */
export function stillOnCourse({ sightings, order, out, raceNumbers }) {
  const seen = lastSeen(sightings, order);
  const groups = order.filter(cp => cp.number !== BASE_STATION_CP).map(cp => ({ label: `Last at ${cp.short}`, cp, numbers: [] }));
  const notSeen = { label: 'Not seen since start', cp: null, numbers: [] };
  for (const num of raceNumbers) {
    if (out.has(num)) continue;
    const s = seen.get(num);
    if (s?.cp.number === BASE_STATION_CP) continue; // finished
    if (!s) notSeen.numbers.push(num);
    else groups.find(g => g.cp.number === s.cp.number)?.numbers.push(num);
  }
  return [...groups, notSeen];
}

/**
 * Bib × checkpoint matrix of common times. A recorded time is never replaced:
 * DNF shows only in an empty cell at the withdrawal checkpoint, and a time
 * recorded while DNS or after the DNF time is flagged.
 * @param {Map<number,{status:'DNF'|'DNS', checkpoint?:number|null, time?:string|null}>} out
 * @returns {Array<{ number, status: string, cells: Array<{ text: string, flag: boolean }> }>}
 */
export function timesMatrix({ sightings, order, out, raceNumbers }) {
  return [...raceNumbers].sort((a, b) => a - b).map(number => {
    const o = out.get(number);
    const cells = order.map(cp => {
      const t = sightings.get(cp.number)?.get(number);
      if (t) {
        const flag = o?.status === 'DNS' || (o?.status === 'DNF' && !!o.time && t > o.time);
        return { text: hhmm(t), flag };
      }
      if (o?.status === 'DNF' && o.checkpoint != null && o.checkpoint === cp.number) return { text: 'DNF', flag: false };
      return { text: '—', flag: false };
    });
    const status = !o ? '' : o.status === 'DNS' ? 'DNS'
      : o.checkpoint != null ? `DNF @${order.find(c => c.number === o.checkpoint)?.short ?? `CP${o.checkpoint}`}` : 'DNF';
    return { number, status, cells };
  });
}

/** Calls received per checkpoint: count, numbers recorded, last call, up to. */
export function callLog({ radioCalls, board }) {
  return board.map(row => {
    const calls = radioCalls.filter(c => c.checkpointNumber === row.number && !c.undoneAt);
    return {
      number: row.number,
      short: row.short,
      calls: calls.length,
      numbers: calls.reduce((n, c) => n + (c.recorded?.length ?? 0), 0),
      lastCall: calls.map(c => c.receivedAt).sort().at(-1) ?? null,
      upTo: row.lastBlock,
    };
  });
}

/**
 * Current leaders: furthest along the course first, then fastest there.
 * Elapsed is from race start.
 */
export function currentLeaders({ sightings, order, out, raceStart, meta = new Map() }) {
  const seen = lastSeen(sightings, order);
  return [...seen.entries()]
    .filter(([num]) => !out.has(num))
    .map(([number, s]) => {
      const m = meta.get(number) ?? {};
      return {
        number,
        name: [m.firstName, m.lastName].filter(Boolean).join(' '),
        gender: m.gender && m.gender !== 'X' ? m.gender : '',
        wave: m.batchNumber ?? null,
        idx: s.idx,
        lastCp: s.cp,
        time: s.time,
        // HH:MM — common times have no seconds
        elapsed: raceStart ? TimeUtils.formatDuration(raceStart, s.time).slice(0, 5) : '',
      };
    })
    .sort((a, b) => b.idx - a.idx || a.time.localeCompare(b.time) || a.number - b.number)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}
