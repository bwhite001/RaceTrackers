import React from 'react';
import useRaceStore from '../../store/useRaceStore.js';
import SharedRunnerGrid from '../Shared/SharedRunnerGrid.jsx';

const IsolatedBaseStationRunnerGrid = () => {
  const {
    baseStationRunners,
    markBaseStationRunner,
    isLoading,
    raceConfig,
    settings
  } = useRaceStore();

  return (
    <SharedRunnerGrid
      runners={baseStationRunners}
      onMarkRunner={markBaseStationRunner}
      isLoading={isLoading}
      raceConfig={raceConfig}
      settings={settings}
      contextLabel="Base Station"
    />
  );
};

export default IsolatedBaseStationRunnerGrid;
