import React, { useState } from 'react';
import PropTypes from 'prop-types';

const MEDALS = {
  1: { emoji: '🥇', label: 'First place' },
  2: { emoji: '🥈', label: 'Second place' },
  3: { emoji: '🥉', label: 'Third place' },
};

const ROW_BG = {
  podium: 'bg-yellow-50 dark:bg-yellow-900/20',
  even: 'bg-gray-50/50 dark:bg-gray-900/30',
  odd: '',
};

/**
 * Reusable leaderboard table.
 *
 * Props:
 *   entries    {Array}   - ranked leaderboard entries (from leaderboardUtils)
 *   showNames  {boolean} - show/hide runner name column (default: true)
 *   hideGender {boolean} - hide Gender column (used in gender-grouped view)
 *   hideWave   {boolean} - hide Wave column (used in wave-grouped view)
 *   pageSize   {number}  - rows per page (default: 50, 0 = all)
 */
export default function LeaderboardTable({
  entries = [],
  showNames = true,
  hideGender = false,
  hideWave = false,
  pageSize = 50,
}) {
  const [page, setPage] = useState(0);

  const paginated = pageSize > 0 ? entries.slice(page * pageSize, (page + 1) * pageSize) : entries;
  const totalPages = pageSize > 0 ? Math.ceil(entries.length / pageSize) : 1;

  if (entries.length === 0) {
    return (
      <p className="px-4 py-16 text-center text-sm text-gray-500 dark:text-gray-400">
        No finishers recorded yet.
      </p>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm" aria-label="Race leaderboard">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 w-20">
                Rank
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 w-24">
                Bib #
              </th>
              {showNames && (
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Name
                </th>
              )}
              {!hideGender && (
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 w-24">
                  Gender
                </th>
              )}
              {!hideWave && (
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 w-24">
                  Wave
                </th>
              )}
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 w-32">
                Elapsed
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
            {paginated.map((entry, idx) => {
              const medal = MEDALS[entry.rank];
              const rowClass = entry.rank <= 3
                ? ROW_BG.podium
                : idx % 2 === 0 ? ROW_BG.even : ROW_BG.odd;
              return (
                <tr
                  key={entry.number}
                  className={`${rowClass} hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors h-11`}
                >
                  <td className="px-4 py-2 text-center font-bold text-gray-700 dark:text-gray-300">
                    {medal ? (
                      <span aria-label={medal.label}>{medal.emoji}</span>
                    ) : (
                      <span className="text-gray-400">{entry.rank}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 font-mono font-semibold text-gray-900 dark:text-white">
                    #{entry.number}
                  </td>
                  {showNames && (
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                      {entry.displayName}
                    </td>
                  )}
                  {!hideGender && (
                    <td className="px-4 py-2 text-center text-gray-600 dark:text-gray-400">
                      {entry.gender}
                    </td>
                  )}
                  {!hideWave && (
                    <td className="px-4 py-2 text-center text-xs text-gray-500 dark:text-gray-400">
                      {entry.batchName}
                    </td>
                  )}
                  <td className="px-4 py-2 text-right font-mono font-bold text-green-700 dark:text-green-400">
                    {entry.elapsedFormatted}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400">
          <span>
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, entries.length)} of {entries.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 min-w-[44px] min-h-[44px]"
            >
              ←
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 min-w-[44px] min-h-[44px]"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

LeaderboardTable.propTypes = {
  entries: PropTypes.array,
  showNames: PropTypes.bool,
  hideGender: PropTypes.bool,
  hideWave: PropTypes.bool,
  pageSize: PropTypes.number,
};
