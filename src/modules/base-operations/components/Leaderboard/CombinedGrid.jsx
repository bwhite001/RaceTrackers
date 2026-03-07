import React from 'react';
import PropTypes from 'prop-types';

const GENDER_LABELS = { M: 'Male', F: 'Female', X: 'Other' };

/**
 * Grid of mini leaderboard cards — one per gender×wave combination.
 * Shows top 10 per card; "View Full" switches to a detailed single-category table.
 *
 * Props:
 *   grouped      - output of groupByCombined() from leaderboardUtils
 *   batches      - array of batch objects (for display names)
 *   onViewFull   - (key: string) => void — called when "View Full →" is clicked
 */
export default function CombinedGrid({ grouped, batches = [], onViewFull }) {
  const keys = Object.keys(grouped).filter(k => grouped[k].length > 0);

  if (keys.length === 0) {
    return (
      <p className="px-4 py-16 text-center text-sm text-gray-500 dark:text-gray-400">
        No finishers recorded yet.
      </p>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {keys.map(key => {
        const [gender, batchNum] = key.split('-');
        const batch = batches.find(b => String(b.batchNumber) === batchNum);
        const label = `${GENDER_LABELS[gender] ?? gender} – ${batch?.batchName ?? `Wave ${batchNum}`}`;
        const entries = grouped[key].slice(0, 10);

        return (
          <div
            key={key}
            className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{label}</h3>
            </div>
            <div className="overflow-y-auto max-h-72">
              <table className="min-w-full text-xs">
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800 bg-white dark:bg-gray-900">
                  {entries.map(e => (
                    <tr key={e.number} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-3 py-2 w-8 text-gray-400 font-bold">{e.rank}.</td>
                      <td className="px-3 py-2 font-mono font-semibold text-gray-800 dark:text-white">#{e.number}</td>
                      <td className="px-3 py-2 font-mono text-green-700 dark:text-green-400 text-right">{e.elapsedFormatted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {onViewFull && (
              <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => onViewFull(key)}
                  className="text-xs text-navy-600 dark:text-navy-400 hover:underline"
                >
                  View Full →
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

CombinedGrid.propTypes = {
  grouped: PropTypes.object.isRequired,
  batches: PropTypes.array,
  onViewFull: PropTypes.func,
};
