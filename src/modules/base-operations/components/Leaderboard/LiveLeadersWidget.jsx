import React from 'react';
import PropTypes from 'prop-types';

const GENDER_CONFIG = {
  M: { label: 'Male', color: 'text-blue-600 dark:text-blue-400' },
  F: { label: 'Female', color: 'text-pink-600 dark:text-pink-400' },
  X: { label: 'Other', color: 'text-purple-600 dark:text-purple-400' },
};

/**
 * Live Leaders Widget — shown on the Overview tab.
 * Displays the 1st-place runner for each gender category with finishers.
 *
 * Props:
 *   genderGroups  - { M: [...entries], F: [...entries], X: [...entries] }
 *                   from useLeaderboard().grouped.gender
 */
export default function LiveLeadersWidget({ genderGroups }) {
  const leaders = Object.entries(GENDER_CONFIG)
    .map(([key, config]) => ({ key, config, leader: genderGroups[key]?.[0] ?? null }))
    .filter(({ leader }) => leader !== null);

  return (
    <div className="rounded-lg border-2 border-yellow-200 dark:border-yellow-700 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl" role="img" aria-label="Crown">👑</span>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Current Leaders</h2>
      </div>

      {leaders.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          Awaiting first finisher…
        </p>
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {leaders.map(({ key, config, leader }) => (
            <div
              key={key}
              data-testid="leader-card"
              className="relative bg-white dark:bg-gray-900 rounded-lg border border-yellow-100 dark:border-yellow-800 p-4 shadow-sm"
            >
              {/* Category badge */}
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold uppercase tracking-wider ${config.color}`}>
                  {config.label}
                </span>
                <span className="text-lg" role="img" aria-label="First place">🥇</span>
              </div>

              {/* Bib */}
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-0.5">
                #{leader.number}
              </div>

              {/* Name */}
              <div className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2">
                {leader.displayName}
              </div>

              {/* Time */}
              <div className="font-mono text-xl font-bold text-green-700 dark:text-green-400">
                {leader.elapsedFormatted}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

LiveLeadersWidget.propTypes = {
  genderGroups: PropTypes.shape({
    M: PropTypes.array,
    F: PropTypes.array,
    X: PropTypes.array,
  }).isRequired,
};
