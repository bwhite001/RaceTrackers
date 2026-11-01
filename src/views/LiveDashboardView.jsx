import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useBaseOperationsStore from '../modules/base-operations/store/baseOperationsStore';
import { BaseOperationsRepository } from '../modules/base-operations/services/BaseOperationsRepository';
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
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [showPII, setShowPII] = useState(false);

  const raceId = currentRaceId || storeRaceId;

  // ponytail: loads on open, not live polling; add an interval if base leaves it on screen
  useEffect(() => {
    if (!raceId) return;
    let live = true;
    new BaseOperationsRepository().getRaceResults(raceId)
      .then(r => { if (live) { setRows(r.rows); setError(null); } })
      .catch(e => { if (live) setError(e?.message || 'Could not read base records'); });
    return () => { live = false; };
  }, [raceId]);

  const sortedRunners = useMemo(() => [...rows].sort((a, b) => a.number - b.number), [rows]);

  // Count runners with a sighting per checkpoint
  const cpPassedCounts = useMemo(() => {
    const counts = {};
    for (const r of rows) {
      for (const cp of Object.keys(r.times || {})) counts[cp] = (counts[cp] || 0) + 1;
    }
    return counts;
  }, [rows]);

  const sortedCheckpoints = useMemo(() => {
    return [...(checkpoints || [])].sort((a, b) => a.number - b.number);
  }, [checkpoints]);

  const deriveStatus = (runner) => {
    if (runner.status === 'Finished') return 'finished';
    if (runner.status === 'DNF') return 'dnf';
    if (runner.status === 'DNS') return 'dns';
    return Object.keys(runner.times || {}).length > 0 ? 'active' : 'not-started';
  };

  const STATUS_STYLES = {
    // Club states (§3.3): finished navy, active blue tint, DNF red, DNS muted
    finished:    'bg-vk-navy text-white',
    active:      'bg-vk-blue-tint text-vk-blue dark:text-navy-300',
    dnf:         'bg-vk-red-tint text-vk-red border border-vk-red',
    dns:         'bg-vk-paper text-vk-muted border border-dashed border-vk-muted dark:bg-gray-800',
    'not-started': 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
  };

  const STATUS_LABELS = {
    finished: 'Finished', active: 'Active', dnf: 'DNF', dns: 'DNS', 'not-started': 'Not Started',
  };

  const formatTime = (iso) => {
    if (!iso) return '—';
    // Already HH:mm — return as-is
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(iso)) return iso.slice(0, 5);
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

      {error && (
        <div role="alert" className="rounded-lg border border-vk-red bg-vk-red-tint text-vk-red px-4 py-3 text-sm">
          Could not read base records: {error}
        </div>
      )}

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
                    ? 'border-navy-500 bg-navy-50 dark:bg-navy-900/20 text-navy-700 dark:text-navy-300'
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
              <th className="px-3 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Status</th>
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
                <td colSpan={sortedCheckpoints.length + (showPII ? 4 : 2)} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No runners found. Make sure a race is active.
                </td>
              </tr>
            ) : sortedRunners.map(runner => {
              const matrix = runner.times || {};
              const cpCount = Object.keys(matrix).length;
              return (
                <tr key={runner.number} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-2 font-mono font-medium text-gray-900 dark:text-white">
                    #{runner.number}
                    {cpCount > 0 && (
                      <span className="ml-1.5 text-xs text-navy-600 dark:text-navy-400">•</span>
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
                  <td className="px-3 py-2">
                    {(() => {
                      const st = deriveStatus(runner);
                      return <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[st]}`}>{STATUS_LABELS[st]}</span>;
                    })()}
                  </td>
                  {sortedCheckpoints.map(cp => (
                    <td key={cp.number} className={`px-3 py-2 font-mono text-xs ${
                      matrix[cp.number] ? 'text-navy-700 dark:text-navy-400 font-medium' : 'text-gray-300 dark:text-gray-600'
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
