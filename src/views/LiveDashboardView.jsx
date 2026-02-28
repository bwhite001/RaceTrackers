import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useBaseOperationsStore from '../modules/base-operations/store/baseOperationsStore';
import RaceMaintenanceRepository from '../modules/race-maintenance/services/RaceMaintenanceRepository';
import { useRaceStore } from '../store/useRaceStore';

/**
 * Live Dashboard — Base Station heads-up view.
 * Panel A: cross-checkpoint runner progress grid.
 * Panel B: checkpoint summary bar (runners passed per checkpoint).
 */
function LiveDashboardView() {
  const navigate = useNavigate();
  const { runners, currentRaceId, checkpoints, loadBaseStationData } = useBaseOperationsStore();
  const { raceConfig, currentRaceId: storeRaceId } = useRaceStore.getState ? useRaceStore() : {};
  const [batches, setBatches] = React.useState([]);
  const [cpRunners, setCpRunners] = React.useState([]); // checkpoint_runners from all checkpoints

  const raceId = currentRaceId || storeRaceId;

  // Load batches and checkpoint runners for the cross-checkpoint grid
  useEffect(() => {
    if (!raceId) return;
    RaceMaintenanceRepository.getBatches(raceId).then(setBatches);
    // Load checkpoint_runners from the DB directly to show cross-cp progress
    import('../shared/services/database/schema').then(({ default: db }) => {
      db.checkpoint_runners.where('raceId').equals(raceId).toArray().then(setCpRunners);
    });
  }, [raceId]);

  // Build progress matrix: { [number]: { [cpNumber]: commonTime } }
  const progressMatrix = useMemo(() => {
    const matrix = {};
    for (const r of cpRunners) {
      if (r.status === 'passed' && r.commonTime) {
        if (!matrix[r.number]) matrix[r.number] = {};
        matrix[r.number][r.checkpointNumber] = r.commonTime;
      }
    }
    return matrix;
  }, [cpRunners]);

  const sortedRunners = useMemo(() => {
    return [...runners].sort((a, b) => a.number - b.number);
  }, [runners]);

  const sortedCheckpoints = useMemo(() => {
    return [...(checkpoints || [])].sort((a, b) => a.number - b.number);
  }, [checkpoints]);

  // Count passed per checkpoint
  const cpPassedCounts = useMemo(() => {
    const counts = {};
    for (const r of cpRunners) {
      if (r.status === 'passed') {
        counts[r.checkpointNumber] = (counts[r.checkpointNumber] || 0) + 1;
      }
    }
    return counts;
  }, [cpRunners]);

  const formatTime = (iso) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch { return '—'; }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Live Dashboard
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/base-station/pending')}
            className="btn-outline text-sm"
          >
            Pending Call-Ins
          </button>
          <button
            onClick={() => navigate('/base-station/leaderboard')}
            className="btn-outline text-sm"
          >
            Leaderboard
          </button>
        </div>
      </div>

      {/* Panel B — Checkpoint summary bar */}
      {sortedCheckpoints.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {sortedCheckpoints.map(cp => {
            const passed = cpPassedCounts[cp.number] || 0;
            const total = runners.length;
            const allDone = total > 0 && passed === total;
            return (
              <button
                key={cp.number}
                onClick={() => navigate('/base-station/pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  allDone
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:border-navy-500'
                }`}
              >
                CP{cp.number} {allDone ? '✓' : ''} {passed}/{total}
              </button>
            );
          })}
        </div>
      )}

      {/* Panel A — Runner × Checkpoint progress grid */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                Runner
              </th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                Status
              </th>
              {sortedCheckpoints.map(cp => (
                <th key={cp.number} className="px-3 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                  CP{cp.number}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
            {sortedRunners.length === 0 ? (
              <tr>
                <td colSpan={sortedCheckpoints.length + 2} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No runners loaded. Start the base station session to see data.
                </td>
              </tr>
            ) : sortedRunners.map(runner => {
              const matrix = progressMatrix[runner.number] || {};
              const latestCp = Object.keys(matrix).map(Number).sort((a, b) => b - a)[0];
              return (
                <tr key={runner.number} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-2 font-mono font-medium text-gray-900 dark:text-white">
                    #{runner.number}
                    {(runner.firstName || runner.lastName) && (
                      <span className="ml-2 font-sans font-normal text-gray-500 dark:text-gray-400 text-xs">
                        {[runner.firstName, runner.lastName].filter(Boolean).join(' ')}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      runner.status === 'passed' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                      runner.status === 'dnf' ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300' :
                      runner.status === 'withdrawn' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' :
                      'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}>
                      {runner.status || 'not-started'}
                    </span>
                  </td>
                  {sortedCheckpoints.map(cp => (
                    <td key={cp.number} className={`px-3 py-2 font-mono text-xs ${
                      matrix[cp.number] ? 'text-green-700 dark:text-green-400' : 'text-gray-300 dark:text-gray-600'
                    }`}>
                      {formatTime(matrix[cp.number])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LiveDashboardView;
