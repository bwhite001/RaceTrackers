import React from 'react';
import useDualCheckpointStore from '../../modules/checkpoint-operations/store/useDualCheckpointStore';
import SharedRunnerGrid from '../Shared/SharedRunnerGrid.jsx';
import { RUNNER_STATUSES } from '../../types/index.js';
import { useRaceStore } from '../../store/useRaceStore.js';

/**
 * DualRunnerGrid — runner grid for dual-checkpoint operations.
 * When the secondary tab is active, runners who already passed the primary
 * checkpoint get a ⭐ indicator so volunteers know who to expect.
 */
const DualRunnerGrid = () => {
  const {
    activeTab,
    primaryRunners,
    secondaryRunners,
    loading,
    markRunner,
    updateRunner,
    getActiveRunners,
  } = useDualCheckpointStore();

  const { raceConfig, settings } = useRaceStore();

  const activeRunners = getActiveRunners();

  // When viewing secondary tab, annotate runners with passedPrimary flag
  const annotatedRunners = React.useMemo(() => {
    if (activeTab !== 'secondary') return activeRunners;
    const passedPrimaryNumbers = new Set(
      primaryRunners.filter(r => r.status === RUNNER_STATUSES.PASSED).map(r => r.number)
    );
    return activeRunners.map(r =>
      passedPrimaryNumbers.has(r.number) ? { ...r, passedPrimary: true } : r
    );
  }, [activeTab, activeRunners, primaryRunners]);

  const passed = activeRunners.filter(r => r.status === RUNNER_STATUSES.PASSED).length;
  const total = activeRunners.length;
  const awaitingReturn = activeTab === 'secondary'
    ? primaryRunners.filter(r => r.status === RUNNER_STATUSES.PASSED).length - secondaryRunners.filter(r => r.status === RUNNER_STATUSES.PASSED).length
    : 0;

  const handleMarkRunner = async (runnerNumber) => {
    await markRunner(runnerNumber, null, new Date().toISOString());
  };

  const handleUnmarkRunner = async (runnerNumber) => {
    await updateRunner(runnerNumber, {
      status: RUNNER_STATUSES.NOT_STARTED,
      actualTime: null,
      commonTime: null,
      commonTimeLabel: null,
      calledIn: false,
    });
  };

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4 text-sm text-center">
          <div>
            <div className="text-lg font-bold text-green-600">{passed}</div>
            <div className="text-gray-500 dark:text-gray-400">Passed</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-800 dark:text-gray-200">{total - passed}</div>
            <div className="text-gray-500 dark:text-gray-400">Not Yet</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-800 dark:text-gray-200">{total}</div>
            <div className="text-gray-500 dark:text-gray-400">Total</div>
          </div>
        </div>
        {activeTab === 'secondary' && awaitingReturn > 0 && (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-400 text-center">
            ⭐ {awaitingReturn} runner{awaitingReturn !== 1 ? 's' : ''} still expected from outbound checkpoint
          </p>
        )}
      </div>

      <SharedRunnerGrid
        runners={annotatedRunners}
        onMarkRunner={handleMarkRunner}
        onUnmarkRunner={handleUnmarkRunner}
        isLoading={loading}
        raceConfig={raceConfig}
        settings={settings}
      />
    </div>
  );
};

export default DualRunnerGrid;
