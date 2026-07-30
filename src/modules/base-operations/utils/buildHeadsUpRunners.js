import { BASE_STATION_CP } from '../../../types/index.js';

/**
 * Collapse the base station store's flat runner rows into one row per runner
 * for the Heads-Up grid.
 *
 * The store holds `checkpoint_runners` rows (checkpointNumber 1..N) concatenated
 * with `base_station_runners` rows (checkpointNumber 0). Rendering that list
 * directly gave one grid row per record — duplicating runners — and left every
 * checkpoint cell blank because no per-runner checkpoint map existed.
 *
 * @param {Array<{number: number, checkpointNumber: number, status: string}>} rows
 * @returns {Array<{number: number, status: string, checkpointStatuses: Object}>}
 *          one entry per runner, sorted by bib number
 */
export const buildHeadsUpRunners = (rows) => {
  if (!rows?.length) return [];

  const byRunner = new Map();

  for (const row of rows) {
    const number = Number(row.number);
    if (!byRunner.has(number)) {
      byRunner.set(number, {
        number,
        status: undefined,
        checkpointStatuses: {},
        _highestCp: -1,
      });
    }
    const entry = byRunner.get(number);

    if (row.checkpointNumber === BASE_STATION_CP) {
      // The base station record is the authoritative overall status
      entry._baseStatus = row.status;
    } else {
      entry.checkpointStatuses[row.checkpointNumber] = row.status;
      if (row.checkpointNumber > entry._highestCp) {
        entry._highestCp = row.checkpointNumber;
        entry._highestStatus = row.status;
      }
    }
  }

  return [...byRunner.values()]
    .map(({ _baseStatus, _highestStatus, _highestCp, ...runner }) => ({
      ...runner,
      status: _baseStatus ?? _highestStatus,
    }))
    .sort((a, b) => a.number - b.number);
};

export default buildHeadsUpRunners;
