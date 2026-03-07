import React, { useState, useEffect } from 'react';
import useBaseOperationsStore from '../../store/baseOperationsStore';
import RaceMaintenanceRepository from '../../../race-maintenance/services/RaceMaintenanceRepository';
import useLeaderboard from './hooks/useLeaderboard';
import LiveLeadersWidget from './LiveLeadersWidget';

/**
 * Self-contained wrapper that loads its own batches data and renders
 * LiveLeadersWidget. Renders null when no leaders exist.
 */
export default function LiveLeadersBanner() {
  const { runners, currentRaceId, currentRace, refreshData } = useBaseOperationsStore();
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    if (!currentRaceId) return;
    RaceMaintenanceRepository.getBatches(currentRaceId).then(setBatches).catch(() => {});
  }, [currentRaceId]);

  const { grouped } = useLeaderboard(runners, batches, currentRace, { onRefresh: refreshData });

  const genderLeaders = Object.entries(grouped.gender)
    .map(([gender, entries]) => entries[0] ? { gender, entry: entries[0] } : null)
    .filter(Boolean);

  if (genderLeaders.length === 0) return null;

  return <LiveLeadersWidget leaders={genderLeaders} />;
}
