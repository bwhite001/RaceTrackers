import React, { useMemo } from 'react';
import { RUNNER_STATUSES } from '../../../types';

const PASSED_STATUSES = new Set([
  RUNNER_STATUSES.PASSED,
  RUNNER_STATUSES.MARKED_OFF,
  RUNNER_STATUSES.CALLED_IN,
]);

/**
 * CourseLeadersCard — shows the top runners currently on the course.
 *
 * Ranks by: furthest checkpoint reached (desc), then earliest time at
 * that checkpoint (asc). Runners who have finished (base-station record)
 * are excluded from the on-course view.
 *
 * @param {Object[]} runners - same shape as HeadsUpGrid: { number, status,
 *   checkpointStatuses, checkpointTimes, hasBaseRecord }
 * @param {Object[]} checkpoints - [{ number, name }]
 * @param {number} [topN=5] - how many leaders to show
 */
export default function CourseLeadersCard({ runners = [], checkpoints = [], topN = 5 }) {
  const sortedCheckpoints = useMemo(
    () => [...checkpoints].sort((a, b) => a.number - b.number),
    [checkpoints]
  );

  const leaders = useMemo(() => {
    const scored = runners
      .filter(r => !r.hasBaseRecord) // exclude finishers
      .map(r => {
        // Find the furthest checkpoint this runner has passed
        let furthestIdx = -1;
        let furthestTime = null;
        for (let i = sortedCheckpoints.length - 1; i >= 0; i--) {
          const cp = sortedCheckpoints[i];
          if (PASSED_STATUSES.has(r.checkpointStatuses?.[cp.number])) {
            furthestIdx = i;
            furthestTime = r.checkpointTimes?.[cp.number] ?? null;
            break;
          }
        }
        return { number: r.number, furthestIdx, furthestTime };
      })
      .filter(r => r.furthestIdx >= 0); // only runners with at least one CP

    // Sort: furthest CP desc, then time asc (earliest = faster)
    scored.sort((a, b) => {
      if (b.furthestIdx !== a.furthestIdx) return b.furthestIdx - a.furthestIdx;
      if (!a.furthestTime && !b.furthestTime) return 0;
      if (!a.furthestTime) return 1;
      if (!b.furthestTime) return -1;
      return (a.furthestTime ?? '').localeCompare(b.furthestTime ?? '');
    });

    return scored.slice(0, topN).map((r, i) => ({
      ...r,
      position: i + 1,
      cpName: sortedCheckpoints[r.furthestIdx]?.name ?? `CP ${sortedCheckpoints[r.furthestIdx]?.number}`,
      cpNumber: sortedCheckpoints[r.furthestIdx]?.number,
      timeLabel: r.furthestTime ?? null,
    }));
  }, [runners, sortedCheckpoints, topN]);

  if (leaders.length === 0) return null;

  const POSITION_STYLES = [
    'text-yellow-500 dark:text-yellow-400', // 1st
    'text-gray-400 dark:text-gray-300',      // 2nd
    'text-amber-600 dark:text-amber-500',    // 3rd
  ];

  const MEDAL = ['🥇', '🥈', '🥉'];

  return (
    <div className="rounded-lg border-2 border-yellow-200 dark:border-yellow-700 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl" role="img" aria-label="Crown">👑</span>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Current Leaders
        </h2>
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">on course</span>
      </div>

      <div className="space-y-1.5">
        {leaders.map(({ position, number, cpName, timeLabel }) => (
          <div
            key={number}
            className="flex items-center gap-3 bg-white dark:bg-gray-900/60 rounded-md px-3 py-2 shadow-sm"
          >
            {/* Position */}
            <span className={`text-lg w-6 text-center flex-shrink-0 ${POSITION_STYLES[position - 1] ?? 'text-gray-500'}`}>
              {MEDAL[position - 1] ?? position}
            </span>

            {/* Bib */}
            <span className="font-mono font-bold text-gray-900 dark:text-white text-base w-12 flex-shrink-0">
              #{number}
            </span>

            {/* Checkpoint */}
            <span className="flex-1 text-xs text-gray-500 dark:text-gray-400 truncate">
              {cpName}
            </span>

            {/* Time at checkpoint */}
            {timeLabel && (
              <span className="font-mono text-xs text-green-700 dark:text-green-400 flex-shrink-0">
                {timeLabel}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
