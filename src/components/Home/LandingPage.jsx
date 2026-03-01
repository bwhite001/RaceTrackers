import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BoltIcon, 
  RadioIcon, 
  Cog6ToothIcon, 
  PlusIcon,
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../../design-system/components';
import RaceStatsCard from './RaceStatsCard';
import RaceSelectionModal from './RaceSelectionModal';
import SettingsModal from '../Settings/SettingsModal';
import PageHeader from '../../shared/components/PageHeader';
import ConfirmModal from '../../shared/components/ui/ConfirmModal';
import EmptyState from '../../shared/components/ui/EmptyState';
import { StandardModal } from '../../shared/components/ui';
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
  const [showHelp, setShowHelp] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: '', onConfirm: null });

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
      setConfirmModal({
        isOpen: true,
        message: 'You are currently in an active operation. Do you want to exit and switch modules? Any unsaved changes may be lost.',
        onConfirm: () => {
          endOperation();
          setSelectedModuleType({ type: moduleType, path: defaultPath });
          setShowRaceModal(true);
        },
      });
      return;
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
      setConfirmModal({
        isOpen: true,
        message: 'You are currently in an active operation. Do you want to exit? Any unsaved changes may be lost.',
        onConfirm: () => {
          endOperation();
          startOperation(MODULE_TYPES.RACE_MAINTENANCE);
          navigate('/race-management');
        },
      });
      return;
    }

    startOperation(MODULE_TYPES.RACE_MAINTENANCE);
    navigate('/race-management');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <PageHeader variant="landing" />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-10">
            <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
            <div className="h-4 w-72 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 mb-4" />
                <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-1" />
                <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageHeader
        variant="landing"
        onHelp={() => setShowHelp(true)}
        onSettings={() => setShowSettings(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
            Select your operation mode to begin tracking. All data is stored locally on your device.
          </p>
        </div>

        {/* Module Selection Grid */}
        <section className="mb-12" data-screenshot-target>
          <h3 className="section-heading">Select Operation Mode</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ModuleCard
              title="Checkpoint Operations"
              description="Track runners at your assigned checkpoint"
              icon={BoltIcon}
              accentColor="border-l-blue-600"
              iconBg="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
              onClick={() => handleModuleSelect(MODULE_TYPES.CHECKPOINT, '/checkpoint/1')}
            />

            <ModuleCard
              title="Base Station Operations"
              description="Monitor all checkpoints and manage race data"
              icon={RadioIcon}
              accentColor="border-l-emerald-600"
              iconBg="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
              onClick={() => handleModuleSelect(MODULE_TYPES.BASE_STATION, '/base-station/operations')}
            />

            <ModuleCard
              title="Race Maintenance"
              description="Configure race details and runner information"
              icon={Cog6ToothIcon}
              accentColor="border-l-violet-600"
              iconBg="bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400"
              onClick={handleGoToRaceManagement}
            />
          </div>
        </section>

        {/* Current Races Section */}
        {categorized.current.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-heading mb-0 border-0 pb-0">Current Races</h3>
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
            <h3 className="section-heading">Upcoming Races</h3>
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
              <h3 className="section-heading mb-0 border-0 pb-0">Recent Races</h3>
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
          <EmptyState
            icon={<BoltIcon className="w-full h-full" />}
            title="No races yet"
            description="Get started by creating your first race. You can configure checkpoints, add runners, and start tracking."
            size="lg"
            action={{
              label: 'Create New Race',
              onClick: () => navigate('/race-maintenance/setup'),
            }}
          />
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

      {/* Navigation confirmation modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, message: '', onConfirm: null })}
        onConfirm={() => {
          confirmModal.onConfirm?.();
          setConfirmModal({ isOpen: false, message: '', onConfirm: null });
        }}
        title="Leave Active Operation?"
        message={confirmModal.message}
        confirmLabel="Exit & Continue"
        confirmVariant="danger"
      />

      {/* Help modal */}
      <StandardModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title="Race Tracker Pro — Help"
        size="lg"
      >
        <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Modules</h4>
            <ul className="space-y-2">
              <li><span className="font-medium">Checkpoint Operations</span> — Track runners as they pass a specific checkpoint. Mark off, record times, and generate callout sheets.</li>
              <li><span className="font-medium">Base Station</span> — Finish line operations. Import checkpoint results, manage DNFs/withdrawals, view real-time race overview.</li>
              <li><span className="font-medium">Race Maintenance</span> — Configure race details, set up checkpoints, manage runner number ranges, and import/export data.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Keyboard Shortcuts</h4>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">n</span><span>New data entry</span>
              <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">r</span><span>Reports tab</span>
              <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">d</span><span>DNF entry</span>
              <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Esc</span><span>Close dialogs</span>
            </div>
          </div>

          {/* Full user guide links */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">User Guide</h4>
            <a
              href={`${import.meta.env.BASE_URL}guides/user-guide.html`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-navy-600 dark:text-navy-400 font-medium hover:underline mb-4"
            >
              View Full User Guide
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </a>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Download by journey:</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'setup',      label: 'Setting Up a Race' },
                { key: 'checkpoint', label: 'Running a Checkpoint' },
                { key: 'navigation', label: 'Navigating the App' },
                { key: 'settings',   label: 'Settings' },
              ].map(({ key, label }) => (
                <a
                  key={key}
                  href={`${import.meta.env.BASE_URL}guides/user-guide-${key}.pdf`}
                  download={`racetracker-guide-${key}.pdf`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <ArrowDownTrayIcon className="w-3.5 h-3.5 shrink-0" />
                  {label}
                </a>
              ))}
            </div>
          </div>

          <p className="text-gray-500 dark:text-gray-400 text-xs">
            All data is stored locally on this device using IndexedDB. No internet connection is required during race operations.
          </p>
        </div>
      </StandardModal>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
};

/**
 * ModuleCard — Touch-optimized module selection card with left accent border.
 */
const ModuleCard = ({ title, description, icon: Icon, accentColor, iconBg, onClick }) => (
  <button
    onClick={onClick}
    className={`
      group card-hoverable text-left w-full
      bg-white dark:bg-gray-800
      rounded-xl border-l-4 border border-gray-200 dark:border-gray-700
      ${accentColor}
      p-6 transition-all duration-200
      active:scale-[0.97]
      focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2
    `}
    style={{ minHeight: '140px' }}
  >
    <div className="flex flex-col h-full">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}>
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 flex-grow">
        {description}
      </p>
      <div className="flex items-center mt-4 text-sm font-semibold text-navy-700 dark:text-navy-300">
        <span>Get Started</span>
        <ArrowRightIcon className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </div>
    </div>
  </button>
);

export default LandingPage;
