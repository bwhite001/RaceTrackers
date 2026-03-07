import React, { useMemo } from 'react';
import useBaseOperationsStore from '../store/baseOperationsStore';
import { STATUS_LABELS } from '../../../types';
import LiveLeadersBanner from './Leaderboard/LiveLeadersBanner';

// Static status colour classes (Tailwind JIT requires static strings)
const STATUS_CLASS_MAP = {
  active:         { accent: 'border-t-blue-500' },
  finished:       { accent: 'border-t-green-500' },
  passed:         { accent: 'border-t-green-500' },
  dnf:            { accent: 'border-t-red-500' },
  dns:            { accent: 'border-t-yellow-500' },
  'non-starter':  { accent: 'border-t-yellow-500' },
  total:          { accent: 'border-t-navy-500' },
};

const STAT_LABELS = {
  total: 'Total', finished: 'Finished', active: 'Active', dnf: 'DNF', dns: 'DNS',
};

/**
 * RaceOverview Component
 * Displays stats summary and the live leaders banner.
 */
const RaceOverview = () => {
  const { stats } = useBaseOperationsStore();

  return (
    <div className="space-y-6">
      <LiveLeadersBanner />
      {/* Stats Summary — bordered accent cards */}
      <div data-testid="stats-grid" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(stats).map(([key, value]) => {
          const accentClass = STATUS_CLASS_MAP[key]?.accent ?? 'border-t-gray-400';
          return (
            <div
              key={key}
              data-testid={`stat-${key}`}
              className={`p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border-t-4 ${accentClass}`}
            >
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {STAT_LABELS[key] ?? key}
              </div>
              <div className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                {value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

RaceOverview.displayName = 'RaceOverview';

export default RaceOverview;
