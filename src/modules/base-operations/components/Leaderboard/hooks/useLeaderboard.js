import { useMemo, useState, useCallback, useEffect } from 'react';
import {
  buildLeaderboardEntries,
  groupByGender,
  groupByWave,
  groupByCombined,
  rankRunners,
} from '../utils/leaderboardUtils';

const AUTO_REFRESH_MS = 30_000;

/**
 * Derive leaderboard data from base_station_runners.
 *
 * @param {Array}  runners    - from baseOperationsStore
 * @param {Array}  batches    - from RaceMaintenanceRepository.getBatches()
 * @param {Object} race       - current race (needs .startTime)
 * @param {Object} options    - { onRefresh: fn } called on each refresh cycle
 */
export default function useLeaderboard(runners, batches, race, options = {}) {
  const { onRefresh } = options;
  const [lastUpdated, setLastUpdated] = useState(() => new Date());

  const entries = useMemo(
    () => buildLeaderboardEntries(runners ?? [], batches ?? [], race),
    [runners, batches, race]
  );

  const overall = useMemo(() => rankRunners(entries), [entries]);

  const genderGrouped = useMemo(() => groupByGender(entries), [entries]);

  const grouped = useMemo(() => ({
    gender: {
      M: genderGrouped.M ?? [],
      F: genderGrouped.F ?? [],
      X: genderGrouped.X ?? [],
    },
    wave: groupByWave(entries),
    combined: groupByCombined(entries),
  }), [entries, genderGrouped]);

  const refresh = useCallback(() => {
    setLastUpdated(new Date());
    onRefresh?.();
  }, [onRefresh]);

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(refresh, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return { overall, grouped, lastUpdated, refresh };
}
