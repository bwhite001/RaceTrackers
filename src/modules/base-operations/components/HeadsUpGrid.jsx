import React, { useMemo } from 'react';
import { RUNNER_STATUSES } from '../../../types';

/**
 * Status indicator cell for a single runner/checkpoint intersection.
 */
const StatusCell = ({ status }) => {
  if (!status || status === RUNNER_STATUSES.NOT_STARTED) {
    return <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>;
  }
  if (status === RUNNER_STATUSES.PASSED || status === RUNNER_STATUSES.MARKED_OFF || status === RUNNER_STATUSES.CALLED_IN) {
    return <span className="text-green-600 dark:text-green-400 font-bold text-sm" aria-label="passed">✓</span>;
  }
  if (status === RUNNER_STATUSES.DNF || status === RUNNER_STATUSES.DNS || status === RUNNER_STATUSES.WITHDRAWN) {
    return <span className="text-red-500 dark:text-red-400 font-bold text-sm" aria-label="dnf">✗</span>;
  }
  return <span className="text-yellow-500 text-xs" aria-label={status}>?</span>;
};

/**
 * HeadsUpGrid — real-time heads-up display grid for race director.
 *
 * @param {Object[]} runners - Array of { number, status, checkpointStatuses: { [cpNumber]: string } }
 * @param {Object[]} checkpoints - Array of { number, name }
 */
const HeadsUpGrid = ({ runners = [], checkpoints = [] }) => {
  const sortedRunners = useMemo(
    () => [...runners].sort((a, b) => a.number - b.number),
    [runners]
  );

  const sortedCheckpoints = useMemo(
    () => [...checkpoints].sort((a, b) => a.number - b.number),
    [checkpoints]
  );

  // Per-checkpoint pass counts for the summary row
  const passCountByCheckpoint = useMemo(() => {
    const counts = {};
    for (const cp of sortedCheckpoints) {
      counts[cp.number] = sortedRunners.filter(r => {
        const s = r.checkpointStatuses?.[cp.number];
        return s === RUNNER_STATUSES.PASSED || s === RUNNER_STATUSES.MARKED_OFF || s === RUNNER_STATUSES.CALLED_IN;
      }).length;
    }
    return counts;
  }, [sortedRunners, sortedCheckpoints]);

  if (sortedRunners.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
        No runner data available.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Runner Overview
          <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
            {sortedRunners.length} runners · {sortedCheckpoints.length} checkpoints
          </span>
        </h2>
      </div>

      {/* Scrollable table wrapper — allows horizontal scroll on small screens */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse" aria-label="Runner checkpoint grid">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/50">
              <th className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-900/50 px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
                Bib #
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
                Overall
              </th>
              {sortedCheckpoints.map(cp => (
                <th
                  key={cp.number}
                  className="px-3 py-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 whitespace-nowrap"
                  title={cp.name}
                >
                  <span className="hidden md:inline">{cp.name || `CP ${cp.number}`}</span>
                  <span className="md:hidden">{cp.number}</span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sortedRunners.map((runner, idx) => (
              <tr
                key={runner.number}
                className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-900/30'}
              >
                {/* Bib number — sticky on mobile scroll */}
                <td className="sticky left-0 z-10 bg-inherit px-3 py-1.5 font-mono font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700/50 whitespace-nowrap">
                  {runner.number}
                </td>

                {/* Overall status badge */}
                <td className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-700/50 whitespace-nowrap">
                  <OverallStatusBadge status={runner.status} />
                </td>

                {/* Per-checkpoint cells */}
                {sortedCheckpoints.map(cp => (
                  <td
                    key={cp.number}
                    className="px-3 py-1.5 text-center border-b border-gray-100 dark:border-gray-700/50"
                  >
                    <StatusCell status={runner.checkpointStatuses?.[cp.number]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>

          {/* Summary row — pass counts per checkpoint */}
          {sortedCheckpoints.length > 0 && (
            <tfoot>
              <tr className="bg-gray-100 dark:bg-gray-900/70 font-semibold">
                <td className="sticky left-0 z-10 bg-gray-100 dark:bg-gray-900/70 px-3 py-2 text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                  Passed
                </td>
                <td className="px-3 py-2" />
                {sortedCheckpoints.map(cp => (
                  <td key={cp.number} className="px-3 py-2 text-center text-xs font-bold text-green-700 dark:text-green-400">
                    {passCountByCheckpoint[cp.number]}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

const OverallStatusBadge = ({ status }) => {
  const map = {
    [RUNNER_STATUSES.NOT_STARTED]: { label: 'Not Started', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
    [RUNNER_STATUSES.PASSED]: { label: 'Passed', cls: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' },
    [RUNNER_STATUSES.DNF]: { label: 'DNF', cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
    [RUNNER_STATUSES.DNS]: { label: 'DNS', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' },
    [RUNNER_STATUSES.WITHDRAWN]: { label: 'WD', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' },
    [RUNNER_STATUSES.NON_STARTER]: { label: 'Non-Starter', cls: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' },
  };
  const entry = map[status] ?? { label: status ?? '—', cls: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' };
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${entry.cls}`}>
      {entry.label}
    </span>
  );
};

export default HeadsUpGrid;
