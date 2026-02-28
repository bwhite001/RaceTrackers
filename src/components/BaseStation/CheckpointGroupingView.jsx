import React, { useEffect, useState, useMemo } from 'react';
import db from '../../shared/services/database/schema';
import useBaseOperationsStore from '../../modules/base-operations/store/baseOperationsStore';

/**
 * CheckpointGroupingView
 * Displays imported checkpoint results in two complementary views:
 *
 * 1. Matrix view  — runners (rows) × checkpoints (columns), showing pass time or "—"
 * 2. Per-checkpoint drilldown — click a checkpoint column header to see only that CP's runners
 *
 * Reads from `imported_checkpoint_results` table (populated by CheckpointImportPanel).
 */

const CELL_PASSED = 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
const CELL_MISSING = 'bg-gray-50 dark:bg-gray-800 text-gray-400';

function formatTime(isoString) {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

const CheckpointGroupingView = () => {
  const { currentRaceId } = useBaseOperationsStore();
  const [importedData, setImportedData] = useState([]); // array of { checkpointNumber, runners }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drilldownCp, setDrilldownCp] = useState(null); // null = matrix, number = drilldown

  useEffect(() => {
    if (!currentRaceId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        const rows = await db.imported_checkpoint_results
          .where('raceId')
          .equals(currentRaceId)
          .toArray();

        // Sort by checkpointNumber
        rows.sort((a, b) => a.checkpointNumber - b.checkpointNumber);
        setImportedData(rows);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentRaceId]);

  // Sorted list of unique runner numbers across all checkpoints
  const allRunnerNumbers = useMemo(() => {
    const set = new Set();
    importedData.forEach(({ runners }) =>
      runners.forEach((r) => set.add(r.number))
    );
    return Array.from(set).sort((a, b) => a - b);
  }, [importedData]);

  // Lookup: { [cpNumber]: { [runnerNumber]: runner } }
  const cpLookup = useMemo(() => {
    const lookup = {};
    importedData.forEach(({ checkpointNumber, runners }) => {
      lookup[checkpointNumber] = {};
      runners.forEach((r) => {
        lookup[checkpointNumber][r.number] = r;
      });
    });
    return lookup;
  }, [importedData]);

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

  if (importedData.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
        No checkpoint data imported yet. Use the "Import Checkpoint Results" panel above.
      </div>
    );
  }

  const checkpointNumbers = importedData.map((d) => d.checkpointNumber);

  // ── Drilldown view ──────────────────────────────────────────────────────────
  if (drilldownCp !== null) {
    const cpRunners = importedData.find((d) => d.checkpointNumber === drilldownCp)?.runners ?? [];
    const sorted = [...cpRunners].sort((a, b) => a.number - b.number);

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
            Checkpoint {drilldownCp} — {cpRunners.length} runners
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Runner #</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Mark-Off Time</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Call-In Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {sorted.map((r) => (
                <tr key={r.number} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 py-2 font-mono font-medium text-gray-900 dark:text-white">{r.number}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{r.status ?? '—'}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{formatTime(r.markOffTime)}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{formatTime(r.callInTime)}</td>
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
                    title={`View Checkpoint ${cp} details`}
                  >
                    CP {cp}
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
                  const runner = cpLookup[cp]?.[runnerNum];
                  const passed = runner?.status === 'PASSED' || runner?.markOffTime;
                  return (
                    <td
                      key={cp}
                      className={`px-3 py-1.5 text-center text-xs ${passed ? CELL_PASSED : CELL_MISSING}`}
                    >
                      {passed ? formatTime(runner.markOffTime) : '—'}
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
