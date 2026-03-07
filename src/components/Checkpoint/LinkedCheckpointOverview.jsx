import React, { useMemo, useState } from 'react';
import useDualCheckpointStore from '../../modules/checkpoint-operations/store/useDualCheckpointStore';
import { RUNNER_STATUSES } from '../../types/index.js';
import useSettingsStore from '../../shared/store/settingsStore';
import TimeUtils from '../../services/timeUtils.js';

const FILTER_ALL = 'all';
const FILTER_BOTH = 'both';
const FILTER_PRIMARY_ONLY = 'primary-only';
const FILTER_SECONDARY_ONLY = 'secondary-only';

/**
 * Format elapsed time between two ISO timestamps as mm:ss or h:mm:ss.
 */
function formatElapsed(isoA, isoB) {
  if (!isoA || !isoB) return '—';
  const diffMs = new Date(isoB) - new Date(isoA);
  if (isNaN(diffMs) || diffMs < 0) return '—';
  const totalSec = Math.floor(diffMs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Compute cross-checkpoint status for each runner.
 * Returns an array of { number, primaryTime, secondaryTime, elapsed, status }.
 */
function buildCrossCheckpointStatus(primaryRunners, secondaryRunners, alertMinutes) {
  const primaryMap = new Map(primaryRunners.map(r => [r.number, r]));
  const secondaryMap = new Map(secondaryRunners.map(r => [r.number, r]));
  const allNumbers = new Set([...primaryMap.keys(), ...secondaryMap.keys()]);

  const now = Date.now();
  return Array.from(allNumbers).sort((a, b) => a - b).map(num => {
    const pr = primaryMap.get(num);
    const sr = secondaryMap.get(num);
    const passedPrimary = pr?.status === RUNNER_STATUSES.PASSED;
    const passedSecondary = sr?.status === RUNNER_STATUSES.PASSED;

    let status;
    let isAlert = false;
    if (passedPrimary && passedSecondary) {
      status = 'both';
    } else if (passedPrimary) {
      status = 'primary-only';
      // Alert if too long since primary passage
      if (alertMinutes > 0 && pr.actualTime) {
        const elapsedMin = (now - new Date(pr.actualTime)) / 60000;
        if (elapsedMin >= alertMinutes) isAlert = true;
      }
    } else if (passedSecondary) {
      status = 'secondary-only';
    } else {
      status = 'neither';
    }

    const primaryTime = passedPrimary ? (pr.actualTime || pr.commonTime) : null;
    const secondaryTime = passedSecondary ? (sr.actualTime || sr.commonTime) : null;
    const elapsed = (passedPrimary && passedSecondary) ? formatElapsed(primaryTime, secondaryTime) : '—';

    return { number: num, primaryTime, secondaryTime, elapsed, status, isAlert };
  });
}

const STATUS_ICON = {
  both: '✅',
  'primary-only': '⏱️',
  'secondary-only': '⚠️',
  neither: '⭕',
};

/**
 * LinkedCheckpointOverview — cross-checkpoint runner status table.
 * Shows which runners passed primary, secondary, or both, and time between.
 */
const LinkedCheckpointOverview = () => {
  const {
    primaryCpNumber,
    secondaryCpNumber,
    primaryRunners,
    secondaryRunners,
  } = useDualCheckpointStore();

  const { settings } = useSettingsStore();
  const alertMinutes = settings?.linkedCheckpointAlertMinutes ?? 0;

  const [filter, setFilter] = useState(FILTER_ALL);

  const rows = useMemo(
    () => buildCrossCheckpointStatus(primaryRunners, secondaryRunners, alertMinutes),
    [primaryRunners, secondaryRunners, alertMinutes]
  );

  const filtered = useMemo(() => {
    if (filter === FILTER_ALL) return rows;
    return rows.filter(r => r.status === filter);
  }, [rows, filter]);

  const counts = useMemo(() => ({
    both: rows.filter(r => r.status === 'both').length,
    primaryOnly: rows.filter(r => r.status === 'primary-only').length,
    secondaryOnly: rows.filter(r => r.status === 'secondary-only').length,
    alerts: rows.filter(r => r.isAlert).length,
  }), [rows]);

  const elapsedTimes = rows
    .filter(r => r.status === 'both' && r.primaryTime && r.secondaryTime)
    .map(r => new Date(r.secondaryTime) - new Date(r.primaryTime))
    .filter(ms => ms > 0);
  const avgElapsedMs = elapsedTimes.length ? elapsedTimes.reduce((a, b) => a + b, 0) / elapsedTimes.length : 0;
  const avgElapsed = avgElapsedMs > 0 ? formatElapsed(new Date(0).toISOString(), new Date(avgElapsedMs).toISOString()) : '—';

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{rows.filter(r => r.status !== 'neither').length > 0 ? rows.filter(r => r.status === 'both').length : 0}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Both ✅</div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{counts.primaryOnly}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">CP{primaryCpNumber} Only ⏱️</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-700 dark:text-red-300">{counts.secondaryOnly}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">CP{secondaryCpNumber} Only ⚠️</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">{avgElapsed}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Avg Time Between</div>
        </div>
      </div>

      {counts.alerts > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
          ⚠️ {counts.alerts} runner{counts.alerts !== 1 ? 's' : ''} passed CP{primaryCpNumber} over {alertMinutes} min ago with no CP{secondaryCpNumber} mark — check status.
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: FILTER_ALL, label: 'All' },
          { id: FILTER_BOTH, label: 'Both ✅' },
          { id: FILTER_PRIMARY_ONLY, label: `CP${primaryCpNumber} Only ⏱️` },
          { id: FILTER_SECONDARY_ONLY, label: `CP${secondaryCpNumber} Only ⚠️` },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f.id
                ? 'bg-navy-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
              <th className="py-2 pr-4 font-medium text-gray-500 dark:text-gray-400">Runner</th>
              <th className="py-2 pr-4 font-medium text-gray-500 dark:text-gray-400">CP{primaryCpNumber}</th>
              <th className="py-2 pr-4 font-medium text-gray-500 dark:text-gray-400">CP{secondaryCpNumber}</th>
              <th className="py-2 pr-4 font-medium text-gray-500 dark:text-gray-400">Elapsed</th>
              <th className="py-2 font-medium text-gray-500 dark:text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(row => (
              <tr
                key={row.number}
                className={`border-b border-gray-100 dark:border-gray-800 ${row.isAlert ? 'bg-red-50 dark:bg-red-900/10' : ''}`}
              >
                <td className="py-2 pr-4 font-semibold text-gray-900 dark:text-white">{row.number}</td>
                <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">
                  {row.primaryTime ? TimeUtils.formatTime(row.primaryTime, 'HH:mm:ss') : <span className="text-gray-400">—</span>}
                </td>
                <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">
                  {row.secondaryTime ? TimeUtils.formatTime(row.secondaryTime, 'HH:mm:ss') : <span className="text-gray-400">—</span>}
                </td>
                <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">{row.elapsed}</td>
                <td className="py-2">
                  {row.isAlert
                    ? <span className="text-red-600 dark:text-red-400">⚠️ Alert</span>
                    : STATUS_ICON[row.status]
                  }
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">
                  No runners match this filter
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export { buildCrossCheckpointStatus };
export default LinkedCheckpointOverview;
