import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../design-system/components';
import RaceStatsCard from './RaceStatsCard';
import RaceSelectionModal from './RaceSelectionModal';
import { categorizeRaces } from '../../utils/raceStatistics';
import { useRaceStore } from '../../store/useRaceStore';
import useNavigationStore, { MODULE_TYPES } from '../../shared/store/navigationStore';

/**
 * LandingPage Component
 * 
 * Main landing page showing race statistics and module selection.
 * Follows Single Responsibility Principle - orchestrates landing page layout.
 * Delegates race display to RaceStatsCard and selection to RaceSelectionModal.
 * 
 * @component
 */
const LandingPage = () => {
  const navigate = useNavigate();
  const { getAllRaces, setSelectedRaceForMode } = useRaceStore();
  const { startOperation, canNavigateTo, endOperation } = useNavigationStore();

  const [races, setRaces] = useState([]);
  const [runnersMap, setRunnersMap] = useState({}); // Map of raceId -> runners
  const [isLoading, setIsLoading] = useState(true);
  const [showRaceModal, setShowRaceModal] = useState(false);
  const [selectedModuleType, setSelectedModuleType] = useState(null);

  // Load all races on mount
  useEffect(() => {
    loadRaces();
  }, []);

  const loadRaces = async () => {
    setIsLoading(true);
    try {
      const allRaces = await getAllRaces();
      setRaces(allRaces || []);
      
      // Load runners for each race (for progress calculation)
      // In a real app, you might want to lazy load this or cache it
      const StorageService = (await import('../../services/storage.js')).default;
      const runnersData = {};
      for (const race of allRaces || []) {
        try {
          const runners = await StorageService.getRunners(race.id);
          runnersData[race.id] = runners || [];
        } catch (error) {
          console.error(`Failed to load runners for race ${race.id}:`, error);
          runnersData[race.id] = [];
        }
      }
      setRunnersMap(runnersData);
    } catch (error) {
      console.error('Failed to load races:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Categorize races
  const categorized = categorizeRaces(races, 3);

  // Handle module selection
  const handleModuleSelect = (moduleType, defaultPath) => {
    // Check if navigation is allowed
    if (!canNavigateTo(moduleType)) {
      const confirmed = window.confirm(
        'You are currently in an active operation. Do you want to exit and switch modules? Any unsaved changes may be lost.'
      );
      if (!confirmed) return;
      endOperation();
    }

    // Show race selection modal
    setSelectedModuleType({ type: moduleType, path: defaultPath });
    setShowRaceModal(true);
  };

  // Handle race selection from modal
  const handleRaceSelect = (race) => {
    if (!selectedModuleType) return;

    // Set the selected race in store
    setSelectedRaceForMode(race.id);

    // Start operation for the module
    startOperation(selectedModuleType.type);

    // Navigate to the module
    navigate(selectedModuleType.path);
  };

  // Handle direct race management navigation
  const handleGoToRaceManagement = () => {
    if (!canNavigateTo(MODULE_TYPES.RACE_MAINTENANCE)) {
      const confirmed = window.confirm(
        'You are currently in an active operation. Do you want to exit? Any unsaved changes may be lost.'
      );
      if (!confirmed) return;
      endOperation();
    }

    startOperation(MODULE_TYPES.RACE_MAINTENANCE);
    navigate('/race-management');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading races...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-navy-900 to-navy-700 rounded-2xl overflow-hidden mb-12 shadow-elevated">
        <div className="absolute top-0 right-0 w-64 h-full bg-accent-600 transform skew-x-12 translate-x-32 opacity-20"></div>
        
        <div className="relative px-8 py-12 md:py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Race Tracking System
            </h1>
            <p className="text-xl text-navy-100 mb-6">
              Professional offline race management for checkpoints and base stations
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                onClick={handleGoToRaceManagement}
                className="bg-white text-navy-900 hover:bg-navy-50"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Manage Races
              </Button>
              {categorized.current.length === 0 && categorized.upcoming.length === 0 && (
                <Button
                  variant="secondary"
                  onClick={() => navigate('/race-maintenance/setup')}
                  className="bg-navy-800 text-white hover:bg-navy-700 border-navy-600"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Create New Race
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Current Races Section */}
      {categorized.current.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Current Races
            </h2>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
              {categorized.current.length} Active
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categorized.current.map((race) => (
              <RaceStatsCard
                key={race.id}
                race={race}
                runners={runnersMap[race.id] || []}
                variant="current"
                onSelect={() => {
                  setSelectedModuleType(null);
                  setShowRaceModal(true);
                  // Pre-select this race
                  setTimeout(() => handleRaceSelect(race), 100);
                }}
                onManage={() => {
                  setSelectedRaceForMode(race.id);
                  navigate('/race-management');
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Module Selection Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Select Operation Mode
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ModuleCard
            title="Checkpoint Operations"
            description="Track runners at checkpoints, mark off numbers, and manage callout sheets"
            icon={
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            }
            onClick={() => handleModuleSelect(MODULE_TYPES.CHECKPOINT, '/checkpoint/1')}
          />

          <ModuleCard
            title="Base Station Operations"
            description="Monitor race progress, enter data, and manage overall race status"
            icon={
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
              </svg>
            }
            onClick={() => handleModuleSelect(MODULE_TYPES.BASE_STATION, '/base-station/operations')}
          />

          <ModuleCard
            title="Race Maintenance"
            description="Set up and configure races, manage runner ranges, and export configurations"
            icon={
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            }
            onClick={handleGoToRaceManagement}
          />
        </div>
      </section>

      {/* Upcoming Races Section */}
      {categorized.upcoming.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Upcoming Races
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categorized.upcoming.map((race) => (
              <RaceStatsCard
                key={race.id}
                race={race}
                runners={runnersMap[race.id] || []}
                variant="upcoming"
                showProgress={false}
                onSelect={() => handleRaceSelect(race)}
                onManage={() => {
                  setSelectedRaceForMode(race.id);
                  navigate('/race-management');
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recent Races Section */}
      {categorized.recent.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Recent Races
            </h2>
            <Button
              variant="text"
              onClick={handleGoToRaceManagement}
              className="text-navy-600 dark:text-navy-400"
            >
              View All Races
              <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categorized.recent.map((race) => (
              <RaceStatsCard
                key={race.id}
                race={race}
                runners={runnersMap[race.id] || []}
                variant="past"
                showProgress={false}
                onSelect={() => handleRaceSelect(race)}
                onManage={() => {
                  setSelectedRaceForMode(race.id);
                  navigate('/race-management');
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {races.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No races yet
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Get started by creating your first race
          </p>
          <div className="mt-6">
            <Button
              variant="primary"
              onClick={() => navigate('/race-maintenance/setup')}
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create New Race
            </Button>
          </div>
        </div>
      )}

      {/* Race Selection Modal */}
      <RaceSelectionModal
        isOpen={showRaceModal}
        onClose={() => {
          setShowRaceModal(false);
          setSelectedModuleType(null);
        }}
        races={races}
        onSelectRace={handleRaceSelect}
        moduleType={selectedModuleType?.type}
      />
    </div>
  );
};

/**
 * ModuleCard Component
 * Internal component for module selection cards
 */
const ModuleCard = ({ title, description, icon, onClick }) => (
  <button
    onClick={onClick}
    className="text-left p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-navy-500 dark:hover:border-navy-400 hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-800 group"
  >
    <div className="flex items-center mb-4">
      <div className="p-3 rounded-lg bg-navy-100 text-navy-900 dark:bg-navy-900 dark:text-navy-100 group-hover:bg-navy-600 group-hover:text-white transition-colors duration-200">
        {icon}
      </div>
    </div>
    <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-navy-600 dark:group-hover:text-navy-400">
      {title}
    </h3>
    <p className="text-gray-600 dark:text-gray-400 mb-4">
      {description}
    </p>
    <div className="flex items-center text-navy-600 dark:text-navy-400 font-medium">
      <span>Get Started</span>
      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </div>
  </button>
);

export default LandingPage;
