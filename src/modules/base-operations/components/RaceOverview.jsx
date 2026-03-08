import React from 'react';
import useBaseOperationsStore from '../store/baseOperationsStore';
import { useRaceStore } from '../../../store/useRaceStore';
import LiveLeadersBanner from './Leaderboard/LiveLeadersBanner';

// Static status colour classes (Tailwind JIT requires static strings)
const STATUS_CLASS_MAP = {
  notStarted:     { accent: 'border-t-gray-400' },
  active:         { accent: 'border-t-blue-500' },
  finished:       { accent: 'border-t-green-500' },
  passed:         { accent: 'border-t-green-500' },
  dnf:            { accent: 'border-t-red-500' },
  dns:            { accent: 'border-t-yellow-500' },
  'non-starter':  { accent: 'border-t-yellow-500' },
  total:          { accent: 'border-t-navy-500' },
};

const STAT_LABELS = {
  notStarted: 'Not Started', total: 'Total', finished: 'Finished', active: 'Active', dnf: 'DNF', dns: 'DNS',
};

/** Returns 'Pending' instead of 'Not Started' once the race has started. */
function notStartedLabel(raceStarted) {
  return raceStarted ? 'Pending' : 'Not Started';
}

const STAT_ORDER = ['notStarted', 'active', 'finished', 'dnf', 'dns', 'total'];

/**
 * RaceOverview Component
 * Displays stats summary, per-checkpoint counts, and the live leaders banner.
 */
const RaceOverview = () => {
  const { stats, checkpoints = [] } = useBaseOperationsStore();
  const { currentRace } = useRaceStore();
  const { checkpointCounts = {} } = stats;

  const raceStarted = Boolean(
    currentRace?.startTime &&
    currentRace?.date &&
    new Date(`${currentRace.date}T${currentRace.startTime}`) <= new Date()
  );

  // Expected = runners who could still arrive (not DNS/DNF)
  const expected = Math.max(0, stats.total - stats.dnf - stats.dns);

  return (
    <div className="space-y-4">
      {/* Per-checkpoint counts */}
      {checkpoints.length > 0 && (
        <div data-testid="checkpoint-counts" className="overflow-x-auto">
          <div className="flex gap-2 min-w-0">
            {checkpoints.map((cp) => {
              const count = checkpointCounts[cp.number] ?? 0;
              const pct = expected > 0 ? Math.round((count / expected) * 100) : 0;
              return (
                <div
                  key={cp.number}
                  data-testid={`cp-count-${cp.number}`}
                  className="flex-1 min-w-[4rem] px-2 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border-t-4 border-t-indigo-400 text-center"
                >
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-tight truncate">
                    CP {cp.number}
                  </div>
                  <div className="mt-0.5 text-lg font-bold text-gray-900 dark:text-white leading-none">
                    {count}
                    <span className="text-xs font-normal text-gray-400 dark:text-gray-500">/{expected}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-indigo-500 dark:text-indigo-400 font-medium">{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats Summary — 6 compact cards on one row */}
      <div data-testid="stats-grid" className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {STAT_ORDER.map((key) => {
          const value = stats[key] ?? 0;
          const accentClass = STATUS_CLASS_MAP[key]?.accent ?? 'border-t-gray-400';
          return (
            <div
              key={key}
              data-testid={`stat-${key}`}
              className={`px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border-t-4 ${accentClass}`}
            >
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-tight">
                {key === 'notStarted' ? notStartedLabel(raceStarted) : (STAT_LABELS[key] ?? key)}
              </div>
              <div className="mt-0.5 text-xl font-bold text-gray-900 dark:text-white">
                {value}
              </div>
            </div>
          );
        })}
      </div>

      <LiveLeadersBanner />
    </div>
  );
};

RaceOverview.displayName = 'RaceOverview';

export default RaceOverview;
