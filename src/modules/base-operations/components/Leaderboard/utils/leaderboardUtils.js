import TimeUtils from '../../../../../services/timeUtils.js';

/**
 * Compute elapsed time in milliseconds between commonTime and batchStartTime.
 * Returns null if either argument is missing/invalid.
 */
export function computeElapsedMs(commonTime, batchStartTime) {
  if (!commonTime || !batchStartTime) return null;
  const diff = new Date(commonTime).getTime() - new Date(batchStartTime).getTime();
  return Math.max(0, diff);
}

/**
 * Assign Olympic-style ranks to a pre-sorted array of entries.
 * Ties receive the same rank; next rank skips (1, 2, 2, 4).
 * Input must already be sorted ascending by elapsedMs.
 */
export function rankRunners(entries) {
  if (!entries.length) return [];
  const result = [];
  let rank = 1;
  for (let i = 0; i < entries.length; i++) {
    const isTie = i > 0 && entries[i].elapsedMs === entries[i - 1].elapsedMs;
    if (!isTie) rank = i + 1;
    result.push({ ...entries[i], rank });
  }
  return result;
}

/** Sort entries ascending by elapsedMs then apply Olympic ranking. */
function sortAndRank(entries) {
  const sorted = [...entries].sort((a, b) => a.elapsedMs - b.elapsedMs);
  return rankRunners(sorted);
}

/** Group and rank entries by gender (M/F/X). */
export function groupByGender(entries) {
  const groups = { M: [], F: [], X: [] };
  for (const e of entries) {
    (groups[e.gender] ?? (groups[e.gender] = [])).push(e);
  }
  return Object.fromEntries(
    Object.entries(groups).map(([k, v]) => [k, sortAndRank(v)])
  );
}

/** Group and rank entries by batchNumber. */
export function groupByWave(entries) {
  const groups = {};
  for (const e of entries) {
    (groups[e.batchNumber] ??= []).push(e);
  }
  return Object.fromEntries(
    Object.entries(groups).map(([k, v]) => [k, sortAndRank(v)])
  );
}

/** Group and rank entries by "gender-batchNumber" key (e.g. "M-1"). */
export function groupByCombined(entries) {
  const groups = {};
  for (const e of entries) {
    const key = `${e.gender}-${e.batchNumber}`;
    (groups[key] ??= []).push(e);
  }
  return Object.fromEntries(
    Object.entries(groups).map(([k, v]) => [k, sortAndRank(v)])
  );
}

/**
 * Build normalised leaderboard entries from raw store data.
 * Excludes DNF/DNS runners and runners without a commonTime.
 *
 * @param {Array}  runners   - base_station_runners from store
 * @param {Array}  batches   - race_batches from RaceMaintenanceRepository
 * @param {Object} race      - race object (needs .startTime as fallback)
 * @returns {Array}          - sorted ascending by elapsedMs
 */
export function buildLeaderboardEntries(runners, batches, race) {
  const batchMap = Object.fromEntries(batches.map(b => [b.batchNumber, b.startTime]));
  const fallbackStart = race?.startTime ?? null;

  const entries = [];
  for (const r of runners) {
    if (!r.commonTime) continue;
    if (r.status === 'dnf' || r.status === 'dns') continue;

    const gender = r.gender || 'X';
    const batchNumber = r.batchNumber || 1;
    const batchStart = batchMap[batchNumber] ?? batchMap[1] ?? fallbackStart;
    const elapsedMs = computeElapsedMs(r.commonTime, batchStart);
    if (elapsedMs === null) continue;

    const elapsed = TimeUtils.calculateElapsed(r.commonTime, batchStart);
    const displayName =
      r.firstName || r.lastName
        ? [r.firstName, r.lastName].filter(Boolean).join(' ')
        : `Runner #${r.number}`;

    entries.push({
      number: r.number,
      displayName,
      gender,
      batchNumber,
      batchName: batches.find(b => b.batchNumber === batchNumber)?.batchName ?? `Wave ${batchNumber}`,
      commonTime: r.commonTime,
      elapsedMs,
      elapsedFormatted: elapsed.formatted,
      status: r.status,
    });
  }

  return entries.sort((a, b) => a.elapsedMs - b.elapsedMs);
}
