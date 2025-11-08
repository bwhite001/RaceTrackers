import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useRaceMaintenanceStore from '../modules/race-maintenance/store/raceMaintenanceStore';
import useNavigationStore from '../shared/store/navigationStore';
import RunnerOverview from '../components/Shared/RunnerOverview.jsx';

const RaceOverview = () => {
  const navigate = useNavigate();
  const {
    currentRace: raceConfig,
    checkpoints,
    loadCurrentRace,
    loading
  } = useRaceMaintenanceStore();
  
  const { startOperation, MODULE_TYPES } = useNavigationStore();
  
  // Load current race on mount
  useEffect(() => {
    if (!raceConfig) {
      loadCurrentRace();
    }
  }, [raceConfig, loadCurrentRace]);
  
  // Mock runners for now - in real app this would come from a runners store
  const runners = [];

  // Get runner counts
  const getRunnerCounts = () => {
    return {
      total: runners.length,
      notStarted: runners.filter(r => r.status === 'not-started').length,
      passed: runners.filter(r => r.status === 'passed').length,
      nonStarter: runners.filter(r => r.status === 'non-starter').length,
      dnf: runners.filter(r => r.status === 'dnf').length
    };
  };

  const counts = getRunnerCounts();

  const handleGoToCheckpoint = (checkpointNumber) => {
    startOperation(MODULE_TYPES.CHECKPOINT);
    navigate(`/checkpoint/${checkpointNumber}`);
  };

  const handleGoToBaseStation = () => {
    startOperation(MODULE_TYPES.BASE_STATION);
    navigate('/base-station');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="card p-6 text-center">
          <p className="text-gray-600 dark:text-gray-300">Loading race...</p>
        </div>
      </div>
    );
  }

  if (!raceConfig) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="card p-6 text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            No Race Selected
          </h2>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="card p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Overview
          </h1>
          <button
            onClick={() => navigate('/')}
            className="btn-secondary"
          >
            Back to Home
          </button>
        </div>

        {/* Checkpoints Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Checkpoints
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {checkpoints && checkpoints.length > 0 && checkpoints.map((checkpoint) => (
              <div key={checkpoint.number} className="card p-4 flex flex-col items-stretch">
                <button
                  onClick={() => handleGoToCheckpoint(checkpoint.number)}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-lg font-semibold"
                >
                  {/* Check-in Icon */}
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  </svg>
                  {checkpoint.name || `Checkpoint ${checkpoint.number}`}
                </button>
              </div>
            ))}
            {(!checkpoints || checkpoints.length === 0) && (
              <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                No checkpoints configured
              </div>
            )}
          </div>
        </div>

        {/* Basestation Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Basestation
          </h2>
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Call-In Finish Numbers
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Manage completion and call in finished runners
                </p>
              </div>
              <button
                onClick={handleGoToBaseStation}
                className="btn-primary"
              >
                Go to Basestation
              </button>
            </div>
          </div>
        </div>

        {/* Runner Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Runner Status Overview
          </h2>
          <RunnerOverview runners={runners} />
        </div>
      </div>
    </div>
  );
};

export default RaceOverview;
