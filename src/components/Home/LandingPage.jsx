import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BoltIcon, 
  RadioIcon, 
  Cog6ToothIcon, 
  QuestionMarkCircleIcon,
  PlusIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../design-system/components';
import RaceStatsCard from './RaceStatsCard';
import RaceSelectionModal from './RaceSelectionModal';
import SettingsModal from '../Settings/SettingsModal';
import { categorizeRaces } from '../../utils/raceStatistics';
import { useRaceStore } from '../../store/useRaceStore';
import useNavigationStore, { MODULE_TYPES } from '../../shared/store/navigationStore';

/**
 * LandingPage Component - App-Friendly Homepage
 * 
 * Touch-optimized interface for mobile and tablet devices.
 * Follows accessibility guidelines with 48px minimum touch targets.
 * 
 * @component
 */
const LandingPage = () => {
  const navigate = useNavigate();
  const { getAllRaces, setSelectedRaceForMode, settings } = useRaceStore();
  const { startOperation, canNavigateTo, endOperation } = useNavigationStore();

  const [races, setRaces] = useState([]);
  const [runnersMap, setRunnersMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showRaceModal, setShowRaceModal] = useState(false);
  const [selectedModuleType, setSelectedModuleType] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // Load all races on mount
  useEffect(() => {
    loadRaces();
  }, []);

  const loadRaces = async () => {
    setIsLoading(true);
    try {
      const allRaces = await getAllRaces();
      setRaces(allRaces || []);
      
      // Load runners for each race
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
    // Haptic feedback on touch devices
    if (settings.hapticsEnabled && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }

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

    // Haptic feedback
    if (settings.hapticsEnabled && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }

    setSelectedRaceForMode(race.id);
    startOperation(selectedModuleType.type);
    navigate(selectedModuleType.path);
  };

  // Handle direct race management navigation
  const handleGoToRaceManagement = () => {
    if (settings.hapticsEnabled && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* App Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-navy-600 dark:bg-navy-500 rounded-lg flex items-center justify-center">
                <BoltIcon className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Race Tracker Pro
              </h1>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (settings.hapticsEnabled && 'vibrate' in navigator) {
                    navigator.vibrate(10);
                  }
                  // TODO: Implement help modal
                  alert('Help documentation coming soon!');
                }}
                className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-target"
                aria-label="Help"
              >
                <QuestionMarkCircleIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
              
              <button
                onClick={() => {
                  if (settings.hapticsEnabled && 'vibrate' in navigator) {
                    navigator.vibrate(10);
                  }
                  setShowSettings(true);
                }}
                className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-target"
                aria-label="Settings"
              >
                <Cog6ToothIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Welcome Back
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Select your operation mode to begin tracking. All data is stored locally on your device.
          </p>
        </div>

        {/* Module Selection Grid */}
        <section className="mb-12">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Select Operation Mode
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ModuleCard
              title="Checkpoint Operations"
              description="Track runners at your assigned checkpoint"
              icon={BoltIcon}
              color="blue"
              onClick={() => handleModuleSelect(MODULE_TYPES.CHECKPOINT, '/checkpoint/1')}
              hapticsEnabled={settings.hapticsEnabled}
            />

            <ModuleCard
              title="Base Station Operations"
              description="Monitor all checkpoints and manage race data"
              icon={RadioIcon}
              color="green"
              onClick={() => handleModuleSelect(MODULE_TYPES.BASE_STATION, '/base-station/operations')}
              hapticsEnabled={settings.hapticsEnabled}
            />

            <ModuleCard
              title="Race Maintenance"
              description="Configure race details and runner information"
              icon={Cog6ToothIcon}
              color="purple"
              onClick={handleGoToRaceManagement}
              hapticsEnabled={settings.hapticsEnabled}
            />
          </div>
        </section>

        {/* Current Races Section */}
        {categorized.current.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Current Races
              </h3>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                {categorized.current.length} Active
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categorized.current.map((race) => (
                <RaceStatsCard
                  key={race.id}
                  race={race}
                  runners={runnersMap[race.id] || []}
                  variant="current"
                  onSelect={() => {
                    if (settings.hapticsEnabled && 'vibrate' in navigator) {
                      navigator.vibrate(10);
                    }
                    setSelectedModuleType(null);
                    setShowRaceModal(true);
                    setTimeout(() => handleRaceSelect(race), 100);
                  }}
                  onManage={() => {
                    if (settings.hapticsEnabled && 'vibrate' in navigator) {
                      navigator.vibrate(10);
                    }
                    setSelectedRaceForMode(race.id);
                    navigate('/race-management');
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Races Section */}
        {categorized.upcoming.length > 0 && (
          <section className="mb-12">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Upcoming Races
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categorized.upcoming.map((race) => (
                <RaceStatsCard
                  key={race.id}
                  race={race}
                  runners={runnersMap[race.id] || []}
                  variant="upcoming"
                  showProgress={false}
                  onSelect={() => handleRaceSelect(race)}
                  onManage={() => {
                    if (settings.hapticsEnabled && 'vibrate' in navigator) {
                      navigator.vibrate(10);
                    }
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Races
              </h3>
              <Button
                variant="text"
                onClick={handleGoToRaceManagement}
                className="text-navy-600 dark:text-navy-400 touch-target inline-flex items-center"
              >
                View All Races
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categorized.recent.map((race) => (
                <RaceStatsCard
                  key={race.id}
                  race={race}
                  runners={runnersMap[race.id] || []}
                  variant="past"
                  showProgress={false}
                  onSelect={() => handleRaceSelect(race)}
                  onManage={() => {
                    if (settings.hapticsEnabled && 'vibrate' in navigator) {
                      navigator.vibrate(10);
                    }
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
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <BoltIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No races yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Get started by creating your first race. You can configure checkpoints, add runners, and start tracking.
            </p>
            <Button
              variant="primary"
              onClick={() => {
                if (settings.hapticsEnabled && 'vibrate' in navigator) {
                  navigator.vibrate(10);
                }
                navigate('/race-maintenance/setup');
              }}
              className="touch-target inline-flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create New Race
            </Button>
          </div>
        )}
      </main>

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

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
};

/**
 * ModuleCard Component - Touch-Optimized Module Selection Card
 * Follows WCAG 2.5.5 with 48px minimum touch targets
 */
const ModuleCard = ({ title, description, icon: Icon, color, onClick, hapticsEnabled }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 border-green-200 dark:border-green-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-800',
  };

  const handleClick = () => {
    if (hapticsEnabled && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={`
        text-left p-6 rounded-xl border-2 transition-all duration-200
        hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        touch-target w-full
        ${colorClasses[color]}
      `}
      style={{ minHeight: '140px' }}
    >
      <div className="flex flex-col h-full">
        <div className="mb-4">
          <Icon className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 flex-grow">
          {description}
        </p>
        <div className="flex items-center mt-4 font-medium text-sm">
          <span>Get Started</span>
          <ArrowRightIcon className="w-5 h-5 ml-2" />
        </div>
      </div>
    </button>
  );
};

export default LandingPage;
