/**
 * Base — DNF / DNS bulk add (spec §4.11). Base is the authority for
 * race-wide DNF / DNS. Pure functions; the view applies them.
 */
import { hhmm } from '../../../services/blocks.js';

export const REASONS = ['Injury', 'Self-withdrew', 'Cut-off', 'Medical', 'Other'];

/**
 * One row per runner who is out of the race, from the out list
 * (withdrawal_records, vet_out_records, checkpoint DNF / non-starter rows).
 * @returns {Array<{ number, status: 'DNF'|'DNS', detail, kind, checkpoint, reason, time, clearable }>}
 */
export function outRecords(outList = []) {
  return outList.map(r => {
    if (r.status === 'non-starter' || r.status === 'dns') {
      return { number: r.number, status: 'DNS', kind: 'dns', detail: 'Did not start', clearable: true };
    }
    const w = r.withdrawalDetails;
    const v = r.vetOutDetails;
    const checkpoint = w ? w.checkpoint : v ? v.checkpoint : null;
    const reason = w?.reason || (v ? 'Vet out' : '');
    const time = w?.withdrawalTime || v?.vetOutTime || null;
    const parts = [checkpoint != null ? `CP${checkpoint}` : (w ? 'On course' : ''), reason, time ? hhmm(time) : ''].filter(Boolean);
    return {
      number: r.number,
      status: 'DNF',
      kind: w ? 'withdrawal' : v ? 'vet-out' : 'checkpoint-dnf',
      detail: parts.join(' · ') || 'Did not finish',
      checkpoint, reason, time,
      comments: w?.comments ?? '',
      clearable: !!w,
    };
  }).sort((a, b) => a.number - b.number);
}

/**
 * Check one pending number (spec §4.11 table).
 * @param {number} num
 * @param {number} idx  position in the pending list
 * @param {object} ctx
 * @param {'dnf'|'dns'} ctx.mode
 * @param {number|null} ctx.where      DNF checkpoint (null = on course)
 * @param {Set<number>} ctx.raceNumbers
 * @param {number[]} ctx.pending
 * @param {Map<number,{status:'DNF'|'DNS'}>} ctx.out
 * @param {Map<number, Map<number,string>>} ctx.sightings  cp → bib → time
 * @param {Array<{number:number, short:string}>} ctx.order  checkpoints in course order
 */
export function checkStatusNumber(num, idx, { mode, where, raceNumbers, pending, out, sightings, order }) {
  if (!raceNumbers.has(num)) return { kind: 'bad', note: 'Not in race' };
  if (pending.slice(0, idx).includes(num)) return { kind: 'bad', note: 'Listed twice' };
  const target = mode === 'dnf' ? 'DNF' : 'DNS';
  const cur = out.get(num);
  if (cur?.status === target) return { kind: 'bad', note: `Already ${target}` };
  // A checkpoint's own DNF or a vet-out isn't base's record to change
  if (cur && cur.clearable === false) return { kind: 'bad', note: `${cur.status} at checkpoint` };
  if (cur) return { kind: 'warn', note: `Was ${cur.status} — will change` };

  const seenAt = order.filter(cp => sightings.get(cp.number)?.has(num));
  if (mode === 'dns' && seenAt.length) {
    return { kind: 'warn', note: `Seen ${seenAt[seenAt.length - 1].short} — started` };
  }
  if (mode === 'dnf' && where != null) {
    const whereIdx = order.findIndex(cp => cp.number === where);
    const later = seenAt.filter(cp => order.indexOf(cp) > whereIdx);
    if (later.length) return { kind: 'warn', note: `Seen later at ${later[later.length - 1].short}` };
  }
  return { kind: 'ok', note: '' };
}
