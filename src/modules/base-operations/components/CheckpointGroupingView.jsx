import React, { useEffect, useState, useMemo } from 'react';
import db from '../../../shared/services/database/schema';
import useBaseOperationsStore from '../store/baseOperationsStore';
import { useRaceStore } from '../../../store/useRaceStore';

/**
 * CheckpointGroupingView
 * Displays checkpoint results in two complementary views:
 *
 * 1. Matrix view  — runners (rows) × checkpoints (columns), showing pass time or "—"
 * 2. Per-checkpoint drilldown — click a checkpoint column header to see only that CP's runners
 *
 * Data sources (merged):
 *   - Live data: `checkpoint_runners` records in the store's `runners` array
 *   - Imported data: `imported_checkpoint_results` table (populated by CheckpointImportPanel)
 * Live data takes precedence over imported data for the same runner/checkpoint pair.
 */

const CELL_PASSED = 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
const CELL_MISSING = 'bg-gray-50 dark:bg-gray-800 text-gray-400';

function formatTime(isoString) {
  if (!isoString) return '—';
  // Already an HH:mm string — return as-is
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(isoString)) return isoString.slice(0, 5);
  try {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

const CheckpointGroupingView = () => {
  const { currentRaceId, runners: storeRunners } = useBaseOperationsStore();
  const { checkpoints } = useRaceStore();
  const [importedData, setImportedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drilldownCp, setDrilldownCp] = useState(null);

  useEffect(() => {
    if (!currentRaceId) { setLoading(false); return; }
    db.imported_checkpoint_results
      .where('raceId').equals(currentRaceId).toArray()
      .then(rows => {
        rows.sort((a, b) => a.checkpointNumber - b.checkpointNumber);
        setImportedData(rows);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [currentRaceId]);

  // Build merged data: live checkpoint_runners + imported results
  // Structure: { [cpNumber]: { [runnerNumber]: { number, status, markOffTime, callInTime, commonTime } } }
  const merged = useMemo(() => {
    const map = {};

    // 1. Seed from imported data
    for (const { checkpointNumber, runners } of importedData) {
      if (!map[checkpointNumber]) map[checkpointNumber] = {};
      for (const r of runners) {
        map[checkpointNumber][r.number] = { ...r };
      }
    }

    // 2. Overlay live data (takes precedence)
    for (const r of (storeRunners ?? [])) {
      if (!r.checkpointNumber || r.checkpointNumber === 0) continue;
      const cp = r.checkpointNumber;
      if (!map[cp]) map[cp] = {};
      map[cp][r.number] = {
        number: r.number,
        status: r.status,
        markOffTime: r.markOffTime ?? r.commonTime ?? null,
        callInTime: r.callInTime ?? null,
        commonTime: r.commonTime ?? null,
      };
    }

    return map;
  }, [storeRunners, importedData]);

  // Sorted checkpoint numbers (use race checkpoints list + any from data)
  const checkpointNumbers = useMemo(() => {
    const fromData = Object.keys(merged).map(Number);
    const fromConfig = (checkpoints ?? []).map(cp => cp.number).filter(n => n !== 0);
    return Array.from(new Set([...fromConfig, ...fromData])).sort((a, b) => a - b);
  }, [merged, checkpoints]);

  // Checkpoint name lookup
  const cpNameMap = useMemo(() => {
    const m = {};
    for (const cp of (checkpoints ?? [])) m[cp.number] = cp.name;
    return m;
  }, [checkpoints]);

  // Sorted unique runner numbers across all checkpoints
  const allRunnerNumbers = useMemo(() => {
    const set = new Set();
    for (const runners of Object.values(merged)) {
      for (const num of Object.keys(runners)) set.add(Number(num));
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [merged]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
        Loading checkpoint data…
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-red-600 dark:text-red-400 text-sm">
        Error loading checkpoint data: {error}
      </div>
    );
  }

  if (allRunnerNumbers.length === 0) {
    return (
      <div className="py-12 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No checkpoint data</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Mark off runners at checkpoints or import checkpoint results from the Overview tab.
        </p>
      </div>
    );
  }

  // ── Drilldown view ──────────────────────────────────────────────────────────
  if (drilldownCp !== null) {
    const cpRunners = Object.values(merged[drilldownCp] ?? {}).sort((a, b) => a.number - b.number);

    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setDrilldownCp(null)}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            ← Back to matrix
          </button>
          <h4 className="text-base font-semibold text-gray-900 dark:text-white">
            {cpNameMap[drilldownCp] ?? `Checkpoint ${drilldownCp}`} — {cpRunners.length} runners
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Runner #</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {cpRunners.map((r) => (
                <tr key={r.number} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 py-2 font-mono font-medium text-gray-900 dark:text-white">{r.number}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{r.status ?? '—'}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                    {formatTime(r.commonTime ?? r.markOffTime)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── Matrix view ─────────────────────────────────────────────────────────────
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Click a checkpoint header to drill down. Green = passed, — = not seen at this checkpoint.
      </p>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 sticky left-0 bg-gray-50 dark:bg-gray-800">
                Runner #
              </th>
              {checkpointNumbers.map((cp) => (
                <th key={cp} className="px-3 py-2 text-center font-medium">
                  <button
                    onClick={() => setDrilldownCp(cp)}
                    className="text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
                    title={cpNameMap[cp] ?? `Checkpoint ${cp}`}
                  >
                    {cpNameMap[cp] ? (
                      <>
                        <span className="hidden md:inline">{cpNameMap[cp]}</span>
                        <span className="md:hidden">CP{cp}</span>
                      </>
                    ) : `CP ${cp}`}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {allRunnerNumbers.map((runnerNum) => (
              <tr key={runnerNum} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-3 py-1.5 font-mono font-medium text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-900">
                  {runnerNum}
                </td>
                {checkpointNumbers.map((cp) => {
                  const runner = merged[cp]?.[runnerNum];
                  const time = runner?.commonTime ?? runner?.markOffTime ?? null;
                  const passed = !!runner && (runner.status === 'passed' || runner.status === 'marked-off' || runner.status === 'called-in' || !!time);
                  return (
                    <td
                      key={cp}
                      className={`px-3 py-1.5 text-center text-xs ${passed ? CELL_PASSED : CELL_MISSING}`}
                    >
                      {passed ? formatTime(time) : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CheckpointGroupingView;
