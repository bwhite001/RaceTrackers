/**
 * Race-day fixes Part E — runners a checkpoint missed. A checkpoint can't
 * know it missed someone; base finds out when the runner is reported further
 * on. The list is the Skipped-a-checkpoint check itself (one source, so a bib
 * is never listed twice): it appears as soon as a later sighting is recorded
 * and clears itself when the checkpoint calls the bib in or base resolves it.
 */
import { findSkipped } from './dataChecks.js';
import { appliesAt } from './receive.js';

/** Resolution meaning "the checkpoint confirmed they didn't see this runner". */
export const MISSED_CONFIRMED = 'missed-confirmed';

/**
 * Open missed reminders by checkpoint: Map(cp → [{ number, issueKey, seenAt }]).
 * Resolved skip issues (asked, checked, confirmed missed) are left out.
 */
export function missedReminders({ sightings, order, resolvedKeys = new Set(), batchOf }) {
  const out = new Map();
  for (const issue of findSkipped({ sightings, order, batchOf })) {
    if (resolvedKeys.has(issue.key)) continue;
    const cp = issue.askCp.number;
    if (!out.has(cp)) out.set(cp, []);
    out.get(cp).push({ number: issue.number, issueKey: issue.key, seenAt: issue.seenAt?.short ?? null });
  }
  return out;
}

/** "213, 218 (seen CP2)" — or "213 (seen CP2), 218 (seen CP3)" when they differ. Every bib listed (G1). */
export function missedText(list = []) {
  const where = [...new Set(list.map(m => m.seenAt))];
  if (where.length === 1) return `${list.map(m => m.number).join(', ')}${where[0] ? ` (seen ${where[0]})` : ''}`;
  return list.map(m => `${m.number}${m.seenAt ? ` (seen ${m.seenAt})` : ''}`).join(', ');
}

/** Set of "bib:cp" the checkpoint confirmed it never saw (Times by checkpoint shows "missed"). */
export function confirmedMissed(resolutions = []) {
  const out = new Set();
  for (const r of resolutions) {
    const m = /^skip:(\d+):(\d+)$/.exec(r.issueKey ?? '');
    if (m && r.resolution === MISSED_CONFIRMED) out.add(`${m[1]}:${m[2]}`);
  }
  return out;
}

/**
 * Stand-down check for one checkpoint: every runner still in the race (field,
 * not DNS / DNF) not recorded there, split into seen further on (missed here)
 * and not seen past here (still to account for). fieldKnown is false for a
 * "bibs assigned on the day" race with no bibs yet.
 */
export function standDownLists({ cpNumber, order, sightings, raceNumbers = [], out = new Map(), fieldKnown = true, batchOf }) {
  const idx = order.findIndex(c => c.number === cpNumber);
  const here = sightings.get(cpNumber) ?? new Map();
  const seenFurther = [];
  const notSeenPast = [];
  for (const number of [...raceNumbers].sort((a, b) => a - b)) {
    if (out.has(number) || here.has(number) || !appliesAt(order[idx], number, batchOf)) continue;
    const seenAt = order.map((c, i) => ({ c, i })).filter(({ c }) => sightings.get(c.number)?.has(number));
    const later = seenAt.find(({ i }) => i > idx);
    if (later) seenFurther.push({ number, at: later.c.short });
    else notSeenPast.push({ number, last: seenAt.length ? seenAt[seenAt.length - 1].c.short : null });
  }
  return { seenFurther, notSeenPast: fieldKnown ? notSeenPast : null };
}
