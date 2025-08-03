import React, { useEffect } from 'react';
import { useRaceStore } from '../../store/useRaceStore.js';
import SharedRunnerGrid from '../Shared/SharedRunnerGrid.jsx';
import { RUNNER_STATUSES } from '../../types/index.js';

/**
 * RunnerGrid component displays a grid of runners for checkpoint tracking.
 * Uses isolated checkpoint tracking with call-in and mark-off workflow.
 *
 * @component
 * @returns {JSX.Element} The rendered grid of runners.
 */
const RunnerGrid = () => {
  const {
    getCheckpointRunners,
    markCheckpointRunner,
    unmarkCheckpointRunner,
    updateCheckpointRunnerTime,
    loadCheckpointRunners,
    currentCheckpoint,
    isLoading,
    raceConfig,
    settings,
    checkpoints
  } = useRaceStore();

  const checkpointRunners = getCheckpointRunners(currentCheckpoint);
  const currentCheckpointName = checkpoints.find(cp => cp.number === currentCheckpoint)?.name || `Checkpoint ${currentCheckpoint}`;

  // Load checkpoint runners when component mounts or checkpoint changes
  useEffect(() => {
    if (currentCheckpoint) {
      loadCheckpointRunners(currentCheckpoint);
    }
  }, [currentCheckpoint, loadCheckpointRunners]);

  const handleMarkOffRunner = async (runnerNumber) => {
    try {
      const runner = checkpointRunners.find(r => r.number === runnerNumber);
      const callInTime = runner?.callInTime || new Date().toISOString();
      
      await markCheckpointRunner(
        runnerNumber,
        currentCheckpoint,
        callInTime, // preserve existing callInTime or use current time
        new Date().toISOString(), // markOffTime
        RUNNER_STATUSES.PASSED
      );
    } catch (error) {
      console.error('Failed to mark off runner:', error);
      throw error;
    }
  };

  const handleUnmarkRunner = async (runnerNumber) => {
    try {
      await unmarkCheckpointRunner(runnerNumber, currentCheckpoint);
    } catch (error) {
      console.error('Failed to unmark runner:', error);
      throw error;
    }
  };

  const handleUpdateTime = async (runnerNumber, newTime) => {
    try {
      await updateCheckpointRunnerTime(runnerNumber, newTime, currentCheckpoint);
    } catch (error) {
      console.error('Failed to update runner time:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-4">
      {/* Checkpoint Status */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          {currentCheckpointName} - Runner Tracking
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-600 dark:text-gray-300">
              {checkpointRunners.filter(r => r.status === RUNNER_STATUSES.NOT_STARTED).length}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Not Started</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {checkpointRunners.filter(r => r.status === RUNNER_STATUSES.CALLED_IN).length}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Called In</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {checkpointRunners.filter(r => r.status === RUNNER_STATUSES.PASSED).length}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Passed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
              {checkpointRunners.length}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Total</div>
          </div>
        </div>
      </div>

      {/* Runner Grid */}
      <SharedRunnerGrid
        runners={checkpointRunners}
        onMarkRunner={handleMarkOffRunner}
        onUnmarkRunner={handleUnmarkRunner}
        onUpdateTime={handleUpdateTime}
        isLoading={isLoading}
        raceConfig={raceConfig}
        settings={settings}
        contextLabel={currentCheckpointName}
        currentCheckpoint={currentCheckpoint}
        workflowMode="checkpoint"
        showMultipleTimes={true}
      />
    </div>
  );
};

export default RunnerGrid;
