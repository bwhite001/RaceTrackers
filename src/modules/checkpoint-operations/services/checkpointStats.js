/**
 * Pure derivations over a checkpoint's runner records (checkpoint_runners).
 * Used by Mark off, Callout and Overview so the numbers always agree.
 */
import TimeUtils from '../../../services/timeUtils.js';
import { toBlock } from '../../../services/blocks.js';
import { checkpointRunnerState, RUNNER_STATE } from '../../../design-system/statusStyles.js';

export const CALL_DUE_WAITING = 5;      // WICEN brief: every 5–10 competitors
export const CALL_DUE_MINUTES = 5;      // …and no more than ~5 min delay

export function runnerTime(r) {
  return r?.actualTime || r?.markOffTime || r?.commonTime || null;
}

export function computeStats(runners) {
  const s = { total: runners.length, passed: 0, called: 0, toCall: 0, toCome: 0, dns: 0, dnf: 0 };
  for (const r of runners) {
    const st = checkpointRunnerState(r);
    if (st === RUNNER_STATE.CALLED) { s.passed++; s.called++; }
    else if (st === RUNNER_STATE.PASSED) { s.passed++; s.toCall++; }
    else if (st === RUNNER_STATE.DNS) s.dns++;
    else if (st === RUNNER_STATE.DNF) s.dnf++;
    else s.toCome++;
  }
  return s;
}

/** Passed but not called in — what base still needs. Oldest first. */
export function pendingRunners(runners) {
  return runners
    .filter(r => checkpointRunnerState(r) === RUNNER_STATE.PASSED)
    .sort((a, b) => (runnerTime(a) ?? '').localeCompare(runnerTime(b) ?? '') || a.number - b.number);
}

/**
 * Group runners into 5-minute common-time blocks, oldest block first.
 * Numbers inside a block stay individual and in bib order (spec G1).
 * @returns {Array<{ block: string, runners: object[] }>}
 */
export function groupByBlock(runners) {
  const map = new Map();
  for (const r of runners) {
    const t = runnerTime(r);
    if (!t) continue;
    const b = toBlock(t);
    if (!map.has(b)) map.set(b, []);
    map.get(b).push(r);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([block, rs]) => ({ block, runners: rs.sort((x, y) => x.number - y.number) }));
}

/** Called-in runners grouped by block, with the latest send time per block. */
export function calledBlocks(runners) {
  const called = runners.filter(r => checkpointRunnerState(r) === RUNNER_STATE.CALLED);
  return groupByBlock(called).map(g => ({
    ...g,
    sentAt: g.runners.map(r => r.callInTime).filter(Boolean).sort().at(-1) ?? null,
  }));
}

/** Minutes since the oldest uncalled runner passed (0 when none). */
export function oldestWaitingMinutes(runners, now) {
  const first = pendingRunners(runners)[0];
  const t = runnerTime(first);
  return t ? Math.max(0, TimeUtils.minutesBetween(t, now)) : 0;
}

/**
 * Call due when enough competitors are waiting or the oldest has waited long
 * enough (spec §4.6).
 */
export function isCallDue({ waiting, oldestMinutes }, { count = CALL_DUE_WAITING, minutes = CALL_DUE_MINUTES } = {}) {
  if (!waiting) return false;
  return waiting >= count || oldestMinutes >= minutes;
}

/** Chunk sorted bib numbers into navigation groups of `size` (Mark off chips). */
export function bibGroups(numbers, size = 20) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const groups = [];
  for (let i = 0; i < sorted.length; i += size) {
    const chunk = sorted.slice(i, i + size);
    groups.push({ first: chunk[0], last: chunk[chunk.length - 1], numbers: chunk });
  }
  return groups;
}
