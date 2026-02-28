import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useBaseOperationsStore from '../modules/base-operations/store/baseOperationsStore';
import RaceMaintenanceRepository from '../modules/race-maintenance/services/RaceMaintenanceRepository';
import TimeUtils from '../services/timeUtils';

/**
 * Leaderboard View — Base Station.
 * Shows fastest runners by elapsed time (commonTime − batchStartTime).
 * Filterable by gender and batch.
 */
function LeaderboardView() {
  const navigate = useNavigate();
  const { runners, currentRaceId, checkpoints } = useBaseOperationsStore();
  const [batches, setBatches] = useState([]);
  const [cpRunners, setCpRunners] = useState([]);
  const [genderFilter, setGenderFilter] = useState('All');
  const [batchFilter, setBatchFilter] = useState('All');

  useEffect(() => {
    if (!currentRaceId) return;
    RaceMaintenanceRepository.getBatches(currentRaceId).then(setBatches);
    import('../shared/services/database/schema').then(({ default: db }) => {
      db.checkpoint_runners.where('raceId').equals(currentRaceId).toArray().then(setCpRunners);
    });
  }, [currentRaceId]);

  // Map bib number → latest checkpoint time and number
  const latestCpByRunner = useMemo(() => {
    const map = {};
    for (const r of cpRunners) {
      if (r.status === 'passed' && r.commonTime) {
        const current = map[r.number];
        if (!current || r.checkpointNumber > current.checkpointNumber) {
          map[r.number] = { checkpointNumber: r.checkpointNumber, commonTime: r.commonTime };
        }
      }
    }
    return map;
  }, [cpRunners]);

  // Map batchNumber → startTime
  const batchStartMap = useMemo(() => {
    const m = {};
    for (const b of batches) m[b.batchNumber] = b.startTime;
    return m;
  }, [batches]);

  // Build leaderboard entries
  const leaderboard = useMemo(() => {
    const entries = [];
    for (const runner of runners) {
      const latest = latestCpByRunner[runner.number];
      if (!latest) continue;

      const batchStart = batchStartMap[runner.batchNumber || 1];
      let elapsed = null;
      if (batchStart) {
        elapsed = TimeUtils.calculateElapsed(latest.commonTime, batchStart);
      }

      entries.push({
        number: runner.number,
        firstName: runner.firstName || null,
        lastName: runner.lastName || null,
        gender: runner.gender || 'X',
        batchNumber: runner.batchNumber || 1,
        latestCheckpoint: latest.checkpointNumber,
        latestTime: latest.commonTime,
        elapsed
      });
    }

    // Sort by elapsed time ascending; runners with no elapsed go to end
    return entries.sort((a, b) => {
      if (!a.elapsed && !b.elapsed) return a.number - b.number;
      if (!a.elapsed) return 1;
      if (!b.elapsed) return -1;
      const aMs = a.elapsed.hours * 3600 + a.elapsed.minutes * 60 + a.elapsed.seconds;
      const bMs = b.elapsed.hours * 3600 + b.elapsed.minutes * 60 + b.elapsed.seconds;
      return aMs - bMs;
    });
  }, [runners, latestCpByRunner, batchStartMap]);

  // Apply filters
  const filtered = useMemo(() => {
    return leaderboard.filter(e => {
      if (genderFilter !== 'All' && e.gender !== genderFilter) return false;
      if (batchFilter !== 'All' && String(e.batchNumber) !== batchFilter) return false;
      return true;
    });
  }, [leaderboard, genderFilter, batchFilter]);

  const batchOptions = useMemo(() => {
    return ['All', ...batches.map(b => String(b.batchNumber))];
  }, [batches]);

  const runnerName = (e) => {
    if (e.firstName || e.lastName) return [e.firstName, e.lastName].filter(Boolean).join(' ');
    return `Runner #${e.number}`;
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leaderboard</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate('/base-station/dashboard')} className="btn-outline text-sm">
            Dashboard
          </button>
          <button onClick={() => navigate('/base-station/pending')} className="btn-outline text-sm">
            Pending Call-Ins
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
          {['All', 'M', 'F', 'X'].map(g => (
            <button
              key={g}
              onClick={() => setGenderFilter(g)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                genderFilter === g
                  ? 'bg-navy-600 text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {g === 'All' ? 'All Genders' : g === 'M' ? 'Male' : g === 'F' ? 'Female' : 'Other'}
            </button>
          ))}
        </div>

        {batchOptions.length > 1 && (
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            {batchOptions.map(b => (
              <button
                key={b}
                onClick={() => setBatchFilter(b)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  batchFilter === b
                    ? 'bg-navy-600 text-white'
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {b === 'All' ? 'All Waves' : (batches.find(bt => String(bt.batchNumber) === b)?.batchName || `Wave ${b}`)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {['Rank', 'Bib', 'Name', 'Gender', 'Wave', 'Last CP', 'Elapsed'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No runners have passed a checkpoint yet.
                </td>
              </tr>
            ) : filtered.map((entry, index) => {
              const batch = batches.find(b => b.batchNumber === entry.batchNumber);
              return (
                <tr key={entry.number} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-2 font-bold text-gray-500 dark:text-gray-400">
                    {index + 1}
                  </td>
                  <td className="px-4 py-2 font-mono font-medium text-gray-900 dark:text-white">
                    #{entry.number}
                  </td>
                  <td className="px-4 py-2 text-gray-900 dark:text-white">
                    {runnerName(entry)}
                  </td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                    {entry.gender}
                  </td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400 text-xs">
                    {batch ? batch.batchName : `Wave ${entry.batchNumber}`}
                  </td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                    CP{entry.latestCheckpoint}
                  </td>
                  <td className="px-4 py-2 font-mono text-gray-900 dark:text-white font-semibold">
                    {entry.elapsed ? entry.elapsed.formatted : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Elapsed time = time at latest checkpoint − wave start time
        {!batches.length && ' (no waves configured — elapsed unavailable)'}
      </p>
    </div>
  );
}

export default LeaderboardView;
