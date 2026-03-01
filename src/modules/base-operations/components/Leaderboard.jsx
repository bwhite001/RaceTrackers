import React from 'react';
import PropTypes from 'prop-types';
import { Badge } from '../../../design-system/components/Badge';
import { Card } from '../../../design-system/components/Card';
import { RUNNER_STATUSES } from '../../../types';

const statusVariant = {
  [RUNNER_STATUSES.FINISHED]: 'success',
  [RUNNER_STATUSES.DNF]: 'danger',
  [RUNNER_STATUSES.ACTIVE]: 'primary',
  [RUNNER_STATUSES.NOT_STARTED]: 'default',
};

const statusLabel = {
  [RUNNER_STATUSES.FINISHED]: 'Finished',
  [RUNNER_STATUSES.DNF]: 'DNF',
  [RUNNER_STATUSES.ACTIVE]: 'Active',
  [RUNNER_STATUSES.NOT_STARTED]: 'Not Started',
};

/**
 * Leaderboard Component
 * Displays runners ranked by finish/common time.
 *
 * @param {{ runners: Array<{number: number|string, commonTime: string|null, status: string}> }} props
 */
const Leaderboard = ({ runners = [] }) => {
  const finishers = runners
    .filter(r => r.commonTime && r.status !== RUNNER_STATUSES.DNF)
    .sort((a, b) => new Date(a.commonTime) - new Date(b.commonTime));

  const dnfRunners = runners.filter(r => r.status === RUNNER_STATUSES.DNF);

  const stillRacing = runners.filter(
    r => !r.commonTime && r.status !== RUNNER_STATUSES.DNF
  );

  return (
    <div className="space-y-6">
      {/* Finishers table */}
      <Card>
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Finishers
          </h2>
        </div>
        {finishers.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
            No finishers recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Bib #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {finishers.map((runner, index) => (
                  <tr key={runner.number} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-gray-100">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100">
                      {runner.number}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-700 dark:text-gray-300">
                      {runner.commonTime}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[runner.status] ?? 'default'} size="sm">
                        {statusLabel[runner.status] ?? runner.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Still racing */}
      {stillRacing.length > 0 && (
        <Card>
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Still Racing ({stillRacing.length})
            </h2>
          </div>
          <div className="px-4 py-3 flex flex-wrap gap-2">
            {stillRacing.map(runner => (
              <span
                key={runner.number}
                className="inline-block px-2 py-1 text-xs font-mono bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
              >
                #{runner.number}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* DNF section */}
      {dnfRunners.length > 0 && (
        <Card>
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Did Not Finish ({dnfRunners.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Bib #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {dnfRunners.map(runner => (
                  <tr key={runner.number}>
                    <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100">
                      {runner.number}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="danger" size="sm">DNF</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

Leaderboard.propTypes = {
  runners: PropTypes.arrayOf(
    PropTypes.shape({
      number: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      commonTime: PropTypes.string,
      status: PropTypes.string,
    })
  ),
};

export default Leaderboard;
