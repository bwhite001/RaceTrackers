import React from 'react';
import { useRaceStore } from '../../store/useRaceStore.js';
import SharedRunnerGrid from '../Shared/SharedRunnerGrid.jsx';

/**
 * RunnerGrid component displays a grid of runners and allows marking runners as passed.
 *
 * It retrieves runner data and configuration from the race store, and passes them to SharedRunnerGrid.
 *
 * @component
 * @returns {JSX.Element} The rendered grid of runners.
 */
const RunnerGrid = () => {
  const {
    runners,
    markRunnerPassed,
    isLoading,
    raceConfig,
    settings
  } = useRaceStore();

  return (
    <SharedRunnerGrid
      runners={runners}
      onMarkRunner={markRunnerPassed}
      isLoading={isLoading}
      raceConfig={raceConfig}
      settings={settings}
      contextLabel="All Runners"
    />
  );
};

export default RunnerGrid;
