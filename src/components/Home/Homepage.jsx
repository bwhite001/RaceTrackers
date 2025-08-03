import React, { useState, useEffect } from 'react';
import { useRaceStore } from '../../store/useRaceStore.js';
import { APP_MODES } from '../../types/index.js';
import LoadingSpinner from '../Layout/LoadingSpinner.jsx';

const Homepage = () => {
  const { 
    getAllRaces, 
    switchToRace, 
    deleteRace, 
    setMode,
    raceConfig,
    isLoading 
  } = useRaceStore();
  
  const [existingRaces, setExistingRaces] = useState([]);
  const [loadingRaces, setLoadingRaces] = useState(true);

  // Load existing races on component mount
  useEffect(() => {
    loadExistingRaces();
  }, []);

  const loadExistingRaces = async () => {
    try {
      setLoadingRaces(true);
      const races = await getAllRaces();
      setExistingRaces(races);
    } catch (error) {
      console.error('Failed to load races:', error);
    } finally {
      setLoadingRaces(false);
    }
  };

  const handleSelectRace = async (raceId) => {
    try {
      await switchToRace(raceId);
    } catch (error) {
      console.error('Failed to switch to race:', error);
    }
  };

  const handleDeleteRace = async (raceId, raceName) => {
    if (window.confirm(`Are you sure you want to delete the race "${raceName}"? This action cannot be undone.`)) {
      try {
        await deleteRace(raceId);
        await loadExistingRaces(); // Refresh the list
      } catch (error) {
        console.error('Failed to delete race:', error);
      }
    }
  };

  const handleModeSelect = (mode) => {
    setMode(mode);
  };

  const handleCreateNewRace = () => {
    setMode(APP_MODES.RACE_CONFIG);
  };

  if (isLoading || loadingRaces) {
    return <LoadingSpinner message="Loading races..." />;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          RaceTracker Pro
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Professional race tracking for checkpoints and base stations
        </p>
      </div>

      {/* Current Race Mode Selection */}
      {raceConfig && (
        <div className="card p-6 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Current Race: {raceConfig.name}
            </h2>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <span>{raceConfig.date}</span>
              <span className="mx-2">•</span>
              <span>{raceConfig.startTime}</span>
              <span className="mx-2">•</span>
              <span>Runners: {raceConfig.minRunner}-{raceConfig.maxRunner}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => handleModeSelect(APP_MODES.CHECKPOINT)}
              className="group p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary-200 dark:group-hover:bg-primary-900/50 transition-colors">
                  <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Checkpoint Mode
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Track runners passing through checkpoints, manage callouts, and monitor progress
                </p>
              </div>
            </button>

            <button
              onClick={() => handleModeSelect(APP_MODES.BASE_STATION)}
              className="group p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary-200 dark:group-hover:bg-primary-900/50 transition-colors">
                  <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8h1m-1-4h1m4 4h1m-1-4h1" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Base Station Mode
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Enter finish times, manage race completion data, and track final results
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Race Management */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Race Management
          </h2>
          <button
            onClick={handleCreateNewRace}
            className="btn-primary flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create New Race</span>
          </button>
        </div>

        {existingRaces.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8h1m-1-4h1m4 4h1m-1-4h1" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No races found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Create your first race to get started with race tracking.
            </p>
            <button
              onClick={handleCreateNewRace}
              className="btn-primary"
            >
              Create First Race
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {existingRaces.map((race) => (
              <div
                key={race.id}
                className={`border rounded-lg p-4 transition-all duration-200 ${
                  raceConfig?.id === race.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {race.name}
                      </h3>
                      {raceConfig?.id === race.id && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      <span>{race.date}</span>
                      <span className="mx-2">•</span>
                      <span>{race.startTime}</span>
                      <span className="mx-2">•</span>
                      <span>Runners: {race.minRunner}-{race.maxRunner}</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Created: {new Date(race.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {raceConfig?.id !== race.id && (
                      <button
                        onClick={() => handleSelectRace(race.id)}
                        className="btn-secondary text-sm"
                      >
                        Select
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteRace(race.id, race.name)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete race"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Homepage;
