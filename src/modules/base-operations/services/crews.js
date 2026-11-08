/**
 * Base — crew & vehicle log (insurance), pure logic. One row per vehicle going
 * to a checkpoint; checkpointNumber 0 (BASE_STATION_CP) is base itself.
 * Times are exact ISO strings, may be before the race start, never in the future.
 */
import { BASE_STATION_CP } from '../../../types/index.js';
import { hhmm } from '../../../services/blocks.js';
import TimeUtils from '../../../services/timeUtils.js';

export const MIN_REGO = 2;
export const TIME_FIELDS = ['leftHomeAt', 'arrivedAt', 'leftSiteAt', 'homeSafeAt'];

/** Vehicles still current (not superseded by an edit or removal). */
export const activeVehicles = (rows = []) => rows.filter(v => !v.supersededAt);

/** 'not-left' | 'on-the-way' | 'arrived' */
export function vehicleState(v) {
  if (v.arrivedAt) return 'arrived';
  return v.leftHomeAt ? 'on-the-way' : 'not-left';
}

/** Cards in course order: Base first, then each race checkpoint. */
export function crewCheckpoints(checkpoints = []) {
  const cps = [...checkpoints]
    .filter(cp => cp.number !== BASE_STATION_CP)
    .sort((a, b) => a.number - b.number)
    .map(cp => ({ number: cp.number, short: `CP${cp.number}`, name: cp.locationName || cp.name || `Checkpoint ${cp.number}` }));
  return [{ number: BASE_STATION_CP, short: 'Base', name: 'Base & finish crew' }, ...cps];
}

/** Card pill for one checkpoint's vehicles. */
export function cardPill(vehicles) {
  if (!vehicles.length) return { kind: 'none', text: 'Nothing logged' };
  const way = vehicles.filter(v => vehicleState(v) === 'on-the-way').length;
  if (way) return { kind: 'way', text: `${way} on the way` };
  if (vehicles.every(v => vehicleState(v) === 'arrived')) return { kind: 'site', text: 'On site' };
  return { kind: 'notleft', text: 'Not left yet' };
}

/** cp number → 'way' | 'site' for the small pill on Receive (nothing logged / not left = no pill). */
export function crewPillByCheckpoint(rows) {
  const by = new Map();
  for (const v of activeVehicles(rows)) {
    if (!by.has(v.checkpointNumber)) by.set(v.checkpointNumber, []);
    by.get(v.checkpointNumber).push(v);
  }
  const out = new Map();
  for (const [cp, vs] of by) {
    const p = cardPill(vs);
    if (p.kind === 'way' || p.kind === 'site') out.set(cp, p.kind);
  }
  return out;
}

export function crewSummary(rows) {
  const vs = activeVehicles(rows);
  const arrived = vs.filter(v => vehicleState(v) === 'arrived').length;
  const onWay = vs.filter(v => vehicleState(v) === 'on-the-way').length;
  return { vehicles: vs.length, arrived, onWay, notLeft: vs.length - arrived - onWay, notArrived: vs.length - arrived };
}

export function summaryText(s) {
  return `${s.vehicles} vehicle${s.vehicles === 1 ? '' : 's'} · ${s.arrived} arrived · ${s.onWay} on the way${s.notLeft ? ` · ${s.notLeft} not left` : ''}`;
}

/** "Left home 05:00 · on the way" / "Left home 04:45 · arrived 05:38 · …" */
export function timesText(v) {
  if (!v.leftHomeAt && !v.arrivedAt) return 'Not left yet';
  let t = v.leftHomeAt ? `Left home ${hhmm(v.leftHomeAt)}` : 'Left home not set';
  t += v.arrivedAt ? ` · arrived ${hhmm(v.arrivedAt)}` : ' · on the way';
  if (v.leftSiteAt) t += ` · left site ${hhmm(v.leftSiteAt)}`;
  if (v.homeSafeAt) t += ` · home ${hhmm(v.homeSafeAt)}`;
  return t;
}

export const peopleText = (v) => [v.driver, ...(v.occupants ?? [])].filter(Boolean).join(' · ');

/** Upper-cased, spaces collapsed, max 10 characters. */
export const normaliseRego = (s) => String(s ?? '').toUpperCase().replace(/\s+/g, ' ').trimStart().slice(0, 10);

/**
 * Why a draft can't be saved, or null. Order matters: the first problem is
 * the Save button's label.
 */
export function vehicleProblem(d, now) {
  if (String(d.rego ?? '').trim().length < MIN_REGO) return 'Enter rego';
  if (!String(d.driver ?? '').trim()) return 'Pick a driver';
  if (TIME_FIELDS.some(k => d[k] && d[k] > now)) return 'Time in the future';
  // Each later step can't come before an earlier one that is set
  const set = TIME_FIELDS.filter(k => d[k]);
  for (let i = 1; i < set.length; i++) {
    if (d[set[i]] < d[set[i - 1]]) return set[i] === 'arrivedAt' && set[i - 1] === 'leftHomeAt' ? 'Arrived before left' : 'Times out of order';
  }
  return null;
}

/** The stored record for a draft (trimmed, ISO strings, nulls not undefined). */
export function vehicleRecord(d) {
  return {
    checkpointNumber: d.checkpointNumber,
    rego: String(d.rego).trim(),
    driver: String(d.driver).trim(),
    occupants: (d.occupants ?? []).map(o => String(o).trim()).filter(o => o && o !== String(d.driver).trim()),
    leftHomeAt: d.leftHomeAt ?? null,
    arrivedAt: d.arrivedAt ?? null,
    leftSiteAt: d.leftSiteAt ?? null,
    homeSafeAt: d.homeSafeAt ?? null,
    notes: String(d.notes ?? '').trim(),
  };
}

/** Step a time field: from its value (or now when unset), clamped to now. */
export function stepTime(iso, minutes, now) {
  return TimeUtils.clampPast(TimeUtils.addMinutes(iso ?? now, minutes), now);
}

/** Everyone named on a vehicle in this race — the driver / occupant pills. */
export function knownPeople(rows) {
  const s = new Set();
  for (const v of activeVehicles(rows)) [v.driver, ...(v.occupants ?? [])].filter(Boolean).forEach(p => s.add(p));
  return [...s].sort((a, b) => a.localeCompare(b));
}

/** Insurance report rows (header first), checkpoints in course order. */
export function crewReportRows(rows, checkpoints) {
  const vs = activeVehicles(rows);
  const out = [['Checkpoint', 'Rego', 'Driver', 'Also in the car', 'Left home', 'Arrived', 'Left site', 'Home safe', 'Notes']];
  for (const cp of crewCheckpoints(checkpoints)) {
    for (const v of vs.filter(x => x.checkpointNumber === cp.number).sort((a, b) => a.rego.localeCompare(b.rego))) {
      out.push([cp.short, v.rego, v.driver, (v.occupants ?? []).join('; '), hhmm(v.leftHomeAt), hhmm(v.arrivedAt), hhmm(v.leftSiteAt), hhmm(v.homeSafeAt), v.notes ?? '']);
    }
  }
  return out;
}
