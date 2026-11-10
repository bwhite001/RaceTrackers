/**
 * WICEN2 Tally and Missing (WICEN2_PARITY.md Phase 2): per checkpoint, who has
 * passed, who is still to come, and who is missing. Pure.
 */
import { appliesAt } from './receive.js';
import { standDownLists } from './missed.js';

/**
 * Out of the race before reaching checkpoint order[idx]?
 * DNS: out everywhere. DNF at CPx: out only at checkpoints after CPx (WICEN2).
 * DNF on course (no checkpoint): out everywhere they aren't recorded (K7).
 * @param {{ status: 'DNF'|'DNS', checkpoint: number|null }} rec  from outRecords()
 */
export function outBefore(rec, idx, order) {
  if (!rec) return false;
  if (rec.status === 'DNS' || rec.checkpoint == null) return true;
  const x = order.findIndex(c => c.number === rec.checkpoint);
  return x < 0 || idx > x;
}

/** Map(bib → out record) of runners out before reaching order[idx]. */
const outAt = (idx, order, outRecs) => new Map(outRecs.filter(r => outBefore(r, idx, order)).map(r => [r.number, r]));

/**
 * Past and to come at each checkpoint.
 * past = recorded there; toCome = field for that checkpoint (wave-aware, late
 * entries included) − recorded there − out before reaching it. null when the
 * field isn't known (bibs assigned on the day).
 * @returns {Map<number, { past: number, toCome: number|null }>}
 */
export function checkpointTally({ order, sightings, raceNumbers = [], outRecs = [], batchOf, fieldKnown = true }) {
  const res = new Map();
  order.forEach((cp, idx) => {
    const here = sightings.get(cp.number) ?? new Map();
    const out = outAt(idx, order, outRecs);
    let toCome = 0;
    for (const n of raceNumbers) {
      if (!here.has(n) && !out.has(n) && appliesAt(cp, n, batchOf)) toCome += 1;
    }
    res.set(cp.number, { past: here.size, toCome: fieldKnown ? toCome : null });
  });
  return res;
}

/**
 * WICEN2 "Missing at checkpoint X": every runner in the field for that
 * checkpoint not recorded there, less DNS and anyone out before reaching it.
 * One source with the stand-down check (standDownLists), with WICEN2's out rule.
 * @returns {{ rows: Array<{ number, last: string|null, seenAt: string|null }>, fieldKnown: boolean }}
 *   seenAt set = seen further on, so missed here
 */
export function missingAt({ cpNumber, order, sightings, raceNumbers = [], outRecs = [], batchOf, fieldKnown = true, wave = null }) {
  const idx = order.findIndex(c => c.number === cpNumber);
  if (!fieldKnown || idx < 0) return { rows: [], fieldKnown };
  const numbers = wave == null ? raceNumbers : raceNumbers.filter(n => batchOf?.get(n) === wave);
  const { seenFurther, notSeenPast } = standDownLists({
    cpNumber, order, sightings, raceNumbers: numbers, out: outAt(idx, order, outRecs), batchOf,
  });
  const rows = [
    ...seenFurther.map(r => ({ number: r.number, last: r.at, seenAt: r.at })),
    ...notSeenPast.map(r => ({ number: r.number, last: r.last, seenAt: null })),
  ].sort((a, b) => a.number - b.number);
  return { rows, fieldKnown };
}
