/**
 * Common-time blocks (WICEN procedure, spec G2/G3).
 *
 * A block is the start of a 5-minute window, as an ISO string. Times are
 * never in the future and never before race start.
 */
import TimeUtils from './timeUtils.js';

export const BLOCK_MINUTES = 5;

/** Floor a timestamp to its 5-minute block. */
export function toBlock(iso) {
  return TimeUtils.getSegmentStart(iso, BLOCK_MINUTES);
}

/** HH:MM (24-hour) for display. */
export function hhmm(iso) {
  return iso ? TimeUtils.formatTime(iso, 'HH:mm') : '';
}

/** Clamp a time to [raceStart, now]. raceStart may be null. */
/** Same clock minute (what the operator sees) — ISO strings from toISOString(). */
export function sameMinute(a, b) {
  return !!a && !!b && a.slice(0, 16) === b.slice(0, 16);
}

export function clampTime(iso, raceStart, now) {
  let t = iso;
  if (raceStart && t < raceStart) t = raceStart;
  if (now && t > now) t = now;
  return t;
}

/** Every block from `from` to `to` inclusive (both floored), oldest first. */
export function blocksBetween(from, to) {
  const out = [];
  const end = toBlock(to);
  for (let b = toBlock(from); b <= end; b = TimeUtils.addMinutes(b, BLOCK_MINUTES)) {
    out.push(b);
  }
  return out;
}

/** The block after `iso`, capped at the current block. */
export function nextBlock(iso, now) {
  const next = TimeUtils.addMinutes(toBlock(iso), BLOCK_MINUTES);
  const nowBlock = toBlock(now);
  return next > nowBlock ? nowBlock : next;
}

/**
 * Earliest time an operator may pick. Race start when the race has started;
 * otherwise (race not today, or a demo race in the past is still open) fall
 * back to 12 hours before now so the controls stay usable.
 */
export function earliestTime(raceStart, now) {
  if (raceStart && raceStart <= now && TimeUtils.minutesBetween(raceStart, now) <= 24 * 60) {
    return raceStart;
  }
  return TimeUtils.addMinutes(now, -12 * 60);
}

/**
 * Parse an exact time typed as HH:MM or HHMM onto the date of `now`.
 * @returns {string|null} ISO, or null when it isn't a valid clock time
 */
export function parseExactTime(text, now) {
  const m = String(text ?? '').trim().match(/^(\d{1,2}):?(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return TimeUtils.atLocalTime(now, h, min);
}

/** True when `iso` sits exactly on a block boundary. */
export function isBlockTime(iso) {
  return toBlock(iso) === TimeUtils.getSegmentStart(iso, 1);
}
