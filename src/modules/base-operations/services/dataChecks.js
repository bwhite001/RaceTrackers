/**
 * Base — data checks ("Needs attention", spec §4.12). One function per check;
 * each returns issues with a stable `key` so a resolution (stored in
 * data_issue_resolutions) hides it for good. Pure functions — the view runs
 * the actions.
 */
import TimeUtils from '../../../services/timeUtils.js';
import { hhmm } from '../../../services/blocks.js';
import { recordTime } from './receive.js';
import { BASE_STATION_CP } from '../../../types/index.js';

export const PACE_LIMIT_KMH = 20;

export const CHECKS = [
  { id: 'dup', title: 'Duplicates', desc: 'Same bib reported more than once at one checkpoint. Pick the one to keep.' },
  { id: 'order', title: 'Out of order', desc: 'Time at a later checkpoint is earlier than at the one before.' },
  { id: 'skip', title: 'Skipped a checkpoint', desc: 'Seen further on but never reported at an earlier checkpoint.' },
  { id: 'after', title: 'Seen after DNF / DNS', desc: 'Reported at a checkpoint after being marked out.' },
  { id: 'unknown', title: 'Unknown bibs', desc: 'Numbers reported on calls that aren’t in this race.' },
  { id: 'pace', title: 'Impossible pace', desc: 'Faster between checkpoints than anyone could run.' },
];

const shortOf = (order, cpNumber) => order.find(c => c.number === cpNumber)?.short ?? `CP${cpNumber}`;

/** Same bib, same checkpoint, more than one live base record. */
export function findDuplicates({ baseRows, order }) {
  const groups = new Map();
  for (const r of baseRows) {
    if (!recordTime(r)) continue;
    const k = `${r.number}:${r.checkpointNumber}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  const issues = [];
  for (const rows of groups.values()) {
    if (rows.length < 2) continue;
    rows.sort((a, b) => (a.commonTime ?? '').localeCompare(b.commonTime ?? '') || a.id - b.id);
    const { number, checkpointNumber } = rows[0];
    const short = shortOf(order, checkpointNumber);
    const same = rows.every(r => hhmm(r.commonTime) === hhmm(rows[0].commonTime));
    const describe = (r) => `${hhmm(r.commonTime)}${r.markOffEntryTime ? ` (call ${hhmm(r.markOffEntryTime)})` : ''}`;
    issues.push({
      key: `dup:${number}:${checkpointNumber}`,
      check: 'dup',
      number,
      head: same ? `${short} — same time ${rows.length === 2 ? 'twice' : `${rows.length} times`}` : `${short} — ${rows.length} times`,
      detail: same ? `${hhmm(rows[0].commonTime)} in ${rows.length} calls` : rows.map(describe).join(' and '),
      rows,
      same,
    });
  }
  return issues.sort((a, b) => a.number - b.number);
}

/** For each runner, the checkpoints (course order) they were seen at, with times. */
function runnerTrails(sightings, order) {
  const trails = new Map();
  order.forEach((cp, idx) => {
    for (const [num, time] of sightings.get(cp.number) ?? []) {
      if (!trails.has(num)) trails.set(num, []);
      trails.get(num).push({ cp, idx, time });
    }
  });
  return trails;
}

/** Time at a later checkpoint earlier than at the previous recorded one. */
export function findOutOfOrder({ sightings, order }) {
  const issues = [];
  for (const [number, trail] of runnerTrails(sightings, order)) {
    for (let i = 1; i < trail.length; i++) {
      const a = trail[i - 1];
      const b = trail[i];
      if (b.time < a.time) {
        issues.push({
          key: `order:${number}:${a.cp.number}:${b.cp.number}`,
          check: 'order', number, askCp: b.cp,
          head: `${b.cp.short} before ${a.cp.short}`,
          detail: `${a.cp.short} ${hhmm(a.time)} → ${b.cp.short} ${hhmm(b.time)}`,
        });
      }
    }
  }
  return issues.sort((a, b) => a.number - b.number);
}

/** Seen further on but missing at an earlier checkpoint. */
export function findSkipped({ sightings, order }) {
  const issues = [];
  for (const [number, trail] of runnerTrails(sightings, order)) {
    const furthest = trail[trail.length - 1];
    const seenIdx = new Set(trail.map(t => t.idx));
    for (let idx = 0; idx < furthest.idx; idx++) {
      if (seenIdx.has(idx)) continue;
      const missing = order[idx];
      const before = [...trail].reverse().find(t => t.idx < idx);
      const after = trail.find(t => t.idx > idx);
      issues.push({
        key: `skip:${number}:${missing.number}`,
        check: 'skip', number, askCp: missing,
        head: `Not reported at ${missing.short}`,
        detail: [before && `${before.cp.short} ${hhmm(before.time)}`, after && `${after.cp.short} ${hhmm(after.time)}`].filter(Boolean).join(' → '),
      });
    }
  }
  return issues.sort((a, b) => a.number - b.number);
}

/**
 * Seen after DNF (a time later than the withdrawal) or any sighting while DNS.
 * @param {Map<number, object>} outByNumber  out records (statusValidation.outRecords)
 */
export function findSeenAfterOut({ sightings, order, outByNumber, baseRows }) {
  const issues = [];
  for (const [number, out] of outByNumber) {
    for (const cp of order) {
      const t = sightings.get(cp.number)?.get(number);
      if (!t) continue;
      const after = out.status === 'DNS' || (out.time && t > out.time);
      if (!after) continue;
      const baseAtCp = baseRows.filter(r => r.number === number && r.checkpointNumber === cp.number && recordTime(r));
      issues.push({
        key: `after:${number}:${cp.number}`,
        check: 'after', number, cp, out, baseRows: baseAtCp,
        head: out.status === 'DNS' ? `DNS, but seen at ${cp.short}` : `DNF, then seen at ${cp.short}`,
        detail: out.status === 'DNS'
          ? `Marked DNS → ${cp.short} ${hhmm(t)}`
          : `DNF ${out.detail} → ${cp.short} ${hhmm(t)}`,
      });
    }
  }
  return issues.sort((a, b) => a.number - b.number);
}

/** Numbers outside the race heard on calls (kept in radio_calls.rejected). */
export function findUnknownBibs({ radioCalls, order }) {
  const issues = [];
  for (const call of radioCalls) {
    if (call.undoneAt) continue;
    for (const r of call.rejected ?? []) {
      if (r.reason !== 'Not in race') continue;
      issues.push({
        key: `unknown:${call.id}:${r.number}:${r.time ?? ''}`,
        check: 'unknown', number: r.number,
        head: 'Not in race',
        detail: `${shortOf(order, call.checkpointNumber)} call at ${hhmm(call.receivedAt)}${r.time ? `, block ${hhmm(r.time)}` : ''}`,
      });
    }
  }
  return issues.sort((a, b) => a.number - b.number);
}

/**
 * Split faster than `limitKmh` between consecutive recorded checkpoints with
 * known distances (checkpoint.distanceKm; Finish uses race.distanceKm).
 */
export function findImpossiblePace({ sightings, order, distances, limitKmh = PACE_LIMIT_KMH }) {
  const issues = [];
  for (const [number, trail] of runnerTrails(sightings, order)) {
    for (let i = 1; i < trail.length; i++) {
      const a = trail[i - 1];
      const b = trail[i];
      const dA = distances.get(a.cp.number);
      const dB = distances.get(b.cp.number);
      if (dA == null || dB == null || dB <= dA) continue;
      const minutes = TimeUtils.minutesBetween(a.time, b.time);
      if (minutes <= 0) continue; // that's out of order, not pace
      const kmh = (dB - dA) / (minutes / 60);
      if (kmh > limitKmh) {
        issues.push({
          key: `pace:${number}:${a.cp.number}:${b.cp.number}`,
          check: 'pace', number, askCp: b.cp,
          head: `${a.cp.short} → ${b.cp.short} in ${minutes} min`,
          detail: `${+(dB - dA).toFixed(1)} km · ${a.cp.short} ${hhmm(a.time)} → ${b.cp.short} ${hhmm(b.time)} · ${Math.round(kmh)} km/h`,
        });
      }
    }
  }
  return issues.sort((a, b) => a.number - b.number);
}

/** Run every check and drop resolved issues. */
/** Checkpoint distances (km) for the pace check; the finish uses the race distance. */
export function checkpointDistances(checkpoints = [], race = null) {
  const m = new Map(checkpoints.filter(c => c.distanceKm != null).map(c => [c.number, Number(c.distanceKm)]));
  if (race?.distanceKm != null) m.set(BASE_STATION_CP, Number(race.distanceKm));
  return m;
}

/** Checks that cast doubt on where a runner is — flagged on the leaders table. */
const POSITION_CHECKS = ['dup', 'order', 'after', 'pace'];

/** Bibs with an open (unresolved) issue that could make their position wrong. */
export function openIssueNumbers(issues) {
  return new Set(POSITION_CHECKS.flatMap(id => (issues[id] ?? []).map(i => i.number)));
}

export function runChecks(input, resolvedKeys = new Set()) {
  const all = {
    dup: findDuplicates(input),
    order: findOutOfOrder(input),
    skip: findSkipped(input),
    after: findSeenAfterOut(input),
    unknown: findUnknownBibs(input),
    pace: findImpossiblePace(input),
  };
  return Object.fromEntries(Object.entries(all).map(([k, v]) => [k, v.filter(i => !resolvedKeys.has(i.key))]));
}
