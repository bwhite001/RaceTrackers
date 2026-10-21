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

/**
 * Overdue: passed a checkpoint but not at the next one by last seen + the
 * typical (median) split for that leg. Legs nobody has completed yet are skipped.
 */
export function overdueRunners({ sightings, order, out, now }) {
  const seen = lastSeen(sightings, order);
  const medians = legMedians(sightings, order);
  const rows = [];
  for (const [number, { idx, cp, time }] of seen) {
    if (out.has(number) || idx >= order.length - 1) continue;
    const typical = medians[idx];
    if (typical == null) continue;
    const expectedAt = TimeUtils.addMinutes(time, Math.round(typical));
    const overdue = TimeUtils.minutesBetween(expectedAt, now);
    if (overdue > 0) {
      rows.push({ number, lastCp: cp, lastTime: time, nextCp: order[idx + 1], expectedAt, overdueMinutes: overdue });
    }
  }
  return rows.sort((a, b) => b.overdueMinutes - a.overdueMinutes || a.number - b.number);
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

/** Bib × checkpoint matrix of common times; DNF / DNS shown in place. */
export function timesMatrix({ sightings, order, out, raceNumbers }) {
  return [...raceNumbers].sort((a, b) => a - b).map(number => {
    const cells = order.map(cp => {
      const t = sightings.get(cp.number)?.get(number);
      return t ? hhmm(t) : '';
    });
    const o = out.get(number);
    if (o?.status === 'DNS') { cells.fill(''); cells[0] = 'DNS'; }
    else if (o?.status === 'DNF') {
      const at = o.checkpoint != null ? order.findIndex(cp => cp.number === o.checkpoint) : cells.findIndex(c => !c);
      const i = at >= 0 ? at : cells.findIndex(c => !c);
      if (i >= 0 && !cells[i]) cells[i] = 'DNF';
    }
    return { number, cells: cells.map(c => c || '—') };
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
        elapsed: raceStart ? TimeUtils.formatDuration(raceStart, s.time) : '',
      };
    })
    .sort((a, b) => b.idx - a.idx || a.time.localeCompare(b.time) || a.number - b.number)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}
