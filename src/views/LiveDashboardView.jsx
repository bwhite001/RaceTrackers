import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useBaseOperationsStore from '../modules/base-operations/store/baseOperationsStore';
import RaceMaintenanceRepository from '../modules/race-maintenance/services/RaceMaintenanceRepository';
import { useRaceStore } from '../store/useRaceStore';

/**
 * Live Dashboard — Base Station heads-up view.
 * Shows all race bibs with per-checkpoint progress times.
 * Names/gender can be toggled for privacy.
 */
function LiveDashboardView() {
  const navigate = useNavigate();
  const { currentRaceId, checkpoints } = useBaseOperationsStore();
  const { currentRaceId: storeRaceId } = useRaceStore();
  const [cpRunners, setCpRunners] = React.useState([]);
  const [allRunners, setAllRunners] = React.useState([]);
  const [showPII, setShowPII] = useState(false);

  const raceId = currentRaceId || storeRaceId;

  useEffect(() => {
    if (!raceId) return;
    import('../shared/services/database/schema').then(({ default: db }) => {
      db.checkpoint_runners.where('raceId').equals(raceId).toArray().then(setCpRunners);
      db.runners.where('raceId').equals(raceId).toArray().then(setAllRunners);
    });
  }, [raceId]);

  // Build progress matrix: { [number]: { [cpNumber]: time } }
  const progressMatrix = useMemo(() => {
    const matrix = {};
    for (const r of cpRunners) {
      if (r.status === 'passed' || r.status === 'marked-off' || r.status === 'called-in') {
        const time = r.commonTime || r.callInTime || r.markOffTime;
        if (time) {
          if (!matrix[r.number]) matrix[r.number] = {};
          matrix[r.number][r.checkpointNumber] = time;
        }
      }
    }
    return matrix;
  }, [cpRunners]);

  const sortedRunners = useMemo(() => {
    return [...allRunners].sort((a, b) => a.number - b.number);
  }, [allRunners]);

  const sortedCheckpoints = useMemo(() => {
    return [...(checkpoints || [])].sort((a, b) => a.number - b.number);
  }, [checkpoints]);

  // Count passed per checkpoint (unique runner numbers)
  const cpPassedCounts = useMemo(() => {
    const seen = {};
    for (const r of cpRunners) {
      if (r.status === 'passed' || r.status === 'marked-off' || r.status === 'called-in') {
        if (!seen[r.checkpointNumber]) seen[r.checkpointNumber] = new Set();
        seen[r.checkpointNumber].add(r.number);
      }
    }
    return Object.fromEntries(Object.entries(seen).map(([k, v]) => [k, v.size]));
  }, [cpRunners]);

  // Derive per-runner overall status from checkpoint data + stored status
  const runnerStatusMap = useMemo(() => {
    // Which runners have at least one CP pass (on course)
    const onCourse = new Set();
    for (const r of cpRunners) {
      if (r.status === 'passed' || r.status === 'marked-off' || r.status === 'called-in') {
        onCourse.add(r.number);
      }
    }
    return { onCourse };
  }, [cpRunners]);

  const deriveStatus = (runner) => {
    const s = (runner.status || '').toLowerCase();
    if (s === 'dnf') return 'dnf';
    if (s === 'dns' || s === 'non-starter') return 'dns';
    if (s === 'passed') return 'finished';
    if (runnerStatusMap.onCourse.has(runner.number)) return 'active';
    return 'not-started';
  };

  const STATUS_STYLES = {
    finished:    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    active:      'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    dnf:         'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    dns:         'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    'not-started': 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
  };

  const STATUS_LABELS = {
    finished: 'Finished', active: 'Active', dnf: 'DNF', dns: 'DNS', 'not-started': 'Not Started',
  };

  const formatTime = (iso) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch { return '—'; }
  };

  const GENDER_LABELS = { M: 'M', F: 'F', m: 'M', f: 'F', male: 'M', female: 'F' };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            aria-label="Go back"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Live Dashboard
          </h1>
        </div>
        <button
          onClick={() => setShowPII(v => !v)}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
            showPII
              ? 'border-navy-500 bg-navy-50 dark:bg-navy-900/20 text-navy-700 dark:text-navy-300'
              : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          {showPII ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          )}
          {showPII ? 'Hide names' : 'Show names'}
        </button>
      </div>

      {/* Checkpoint summary bar */}
      {sortedCheckpoints.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {sortedCheckpoints.map(cp => {
            const passed = cpPassedCounts[cp.number] || 0;
            const total = sortedRunners.length;
            const allDone = total > 0 && passed === total;
            return (
              <div
                key={cp.number}
                className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                  allDone
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="font-semibold">CP{cp.number}</span>
                {cp.name && <span className="hidden sm:inline text-gray-400 dark:text-gray-500"> — {cp.name}</span>}
                <span className="ml-2">{allDone ? '✓' : ''} {passed}/{total}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Runner × Checkpoint progress grid */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Bib</th>
              {showPII && (
                <>
                  <th className="px-3 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Name</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Gender</th>
                </>
              )}
              {sortedCheckpoints.map(cp => (
                <th key={cp.number} className="px-3 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                  CP{cp.number}
                  {cp.name && <span className="hidden lg:block text-xs font-normal text-gray-400 dark:text-gray-500 truncate max-w-[120px]">{cp.name}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
            {sortedRunners.length === 0 ? (
              <tr>
                <td colSpan={sortedCheckpoints.length + (showPII ? 3 : 1)} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No runners found. Make sure a race is active.
                </td>
              </tr>
            ) : sortedRunners.map(runner => {
              const matrix = progressMatrix[runner.number] || {};
              const cpCount = Object.keys(matrix).length;
              return (
                <tr key={runner.id ?? runner.number} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-2 font-mono font-medium text-gray-900 dark:text-white">
                    #{runner.number}
                    {cpCount > 0 && (
                      <span className="ml-1.5 text-xs text-green-600 dark:text-green-400">•</span>
                    )}
                  </td>
                  {showPII && (
                    <>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                        {[runner.firstName, runner.lastName].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                        {GENDER_LABELS[runner.gender] || '—'}
                      </td>
                    </>
                  )}
                  {sortedCheckpoints.map(cp => (
                    <td key={cp.number} className={`px-3 py-2 font-mono text-xs ${
                      matrix[cp.number] ? 'text-green-700 dark:text-green-400 font-medium' : 'text-gray-300 dark:text-gray-600'
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
