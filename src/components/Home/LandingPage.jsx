import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RadioIcon,
  Cog6ToothIcon,
  FlagIcon,
  AdjustmentsHorizontalIcon,
  ChevronRightIcon,
  QrCodeIcon,
  QuestionMarkCircleIcon,
  ArrowTopRightOnSquareIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../../design-system/components';
import { ClubBadge, SavedIndicator } from '../../design-system/components/VK';
import ImportExportModal from '../ImportExport/ImportExportModal';
import TimeUtils from '../../services/timeUtils';
import RaceStatsCard from './RaceStatsCard';
import RaceSelectionModal from './RaceSelectionModal';
import SettingsModal from '../Settings/SettingsModal';
import ConfirmModal from '../../shared/components/ui/ConfirmModal';
import { StandardModal } from '../../shared/components/ui';
import { categorizeRaces } from '../../utils/raceStatistics';
import { useRaceStore } from '../../store/useRaceStore';
import StorageService from '../../services/storage';
import useNavigationStore, { MODULE_TYPES } from '../../shared/store/navigationStore';

/**
 * Build checkpoint picker items, grouping linked pairs into a single entry.
 * Returns an array of { type: 'single', cp } or { type: 'linked', primary, secondary }.
 */
function buildCheckpointPickerItems(cps) {
  const sorted = [...cps].sort((a, b) => a.number - b.number);
  const seen = new Set();
  const items = [];
  for (const cp of sorted) {
    if (seen.has(cp.number)) continue;
    if (cp.linkedCheckpointNumber) {
      const partner = sorted.find(c => c.number === cp.linkedCheckpointNumber);
      if (partner) {
        items.push({ type: 'linked', primary: cp, secondary: partner });
        seen.add(cp.number);
        seen.add(partner.number);
        continue;
      }
    }
    items.push({ type: 'single', cp });
    seen.add(cp.number);
  }
  return items;
}

/** Map a picker item to its navigation path. */
function pickerItemPath(item) {
  if (item.type === 'linked') {
    return `/checkpoint/dual/${item.primary.number}/${item.secondary.number}`;
  }
  return `/checkpoint/${item.cp.number}`;
}

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
  const [showImport, setShowImport] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: '', onConfirm: null });
  const [pendingRaceForCheckpoint, setPendingRaceForCheckpoint] = useState(null);
  const [checkpointChoices, setCheckpointChoices] = useState([]);

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
  const handleRaceSelect = useCallback(async (race) => {
    if (!selectedModuleType) return;

    // Haptic feedback
    if (settings.hapticsEnabled && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }

    // Checkpoint Operations: ask which checkpoint before navigating
    if (selectedModuleType.type === MODULE_TYPES.CHECKPOINT) {
      setShowRaceModal(false);
      const cps = await StorageService.getCheckpoints(race.id);
      const items = buildCheckpointPickerItems(cps);
      if (items.length === 1) {
        // Single item — skip picker and navigate directly
        setSelectedRaceForMode(race.id);
        startOperation(MODULE_TYPES.CHECKPOINT);
        navigate(pickerItemPath(items[0]));
      } else {
        setPendingRaceForCheckpoint(race);
        setCheckpointChoices(items);
      }
      return;
    }

    setSelectedRaceForMode(race.id);
    startOperation(selectedModuleType.type);
    navigate(selectedModuleType.path);
  }, [selectedModuleType, settings.hapticsEnabled, setSelectedRaceForMode, startOperation, navigate]);

  // Handle checkpoint selection (second step for Checkpoint Operations)
  const handleCheckpointSelect = useCallback((item) => {
    if (!pendingRaceForCheckpoint) return;
    setSelectedRaceForMode(pendingRaceForCheckpoint.id);
    startOperation(MODULE_TYPES.CHECKPOINT);
    setPendingRaceForCheckpoint(null);
    setCheckpointChoices([]);
    navigate(pickerItemPath(item));
  }, [pendingRaceForCheckpoint, setSelectedRaceForMode, startOperation, navigate]);

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

  const currentRace = categorized.current[0] ?? categorized.upcoming[0] ?? categorized.recent[0] ?? null;

  return (
    <div className="min-h-screen bg-vk-paper dark:bg-gray-900 flex flex-col">
      <header className="bg-vk-navy text-white px-5 pt-7 pb-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-[18px]">
          <div className="flex items-center gap-3">
            <ClubBadge size={48} />
            <div className="flex flex-col gap-0.5 min-w-0">
              <h1 className="font-display font-extrabold text-[22px] leading-tight">RaceTracker</h1>
              <div className="text-xs text-vk-on-navy">Ipswich &amp; District Radio Club · VK4WIP</div>
            </div>
            <div className="ml-auto flex items-center">
              {!currentRace && <SavedIndicator label="Offline ready" />}
              <button type="button" aria-label="Help" onClick={() => setShowHelp(true)}
                className="w-11 h-11 rounded-btn flex items-center justify-center hover:bg-white/10">
                <QuestionMarkCircleIcon className="w-6 h-6" aria-hidden="true" />
              </button>
              <button type="button" aria-label="Settings" onClick={() => setShowSettings(true)}
                className="w-11 h-11 rounded-btn flex items-center justify-center hover:bg-white/10">
                <Cog6ToothIcon className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>
          </div>
          {currentRace && (
            <CurrentRaceCard race={currentRace} />
          )}
        </div>
      </header>

      <main className="flex-1 px-5 py-[22px]">
        <div className="max-w-3xl mx-auto flex flex-col gap-3.5" data-screenshot-target>
          <h2 className="font-display font-bold text-lg text-vk-navy dark:text-white">What are you doing today?</h2>

          {isLoading ? (
            [1, 2, 3].map(i => <div key={i} className="h-[76px] rounded-card bg-white border border-vk-border animate-pulse" />)
          ) : (
            <>
              <RoleCard
                title="Checkpoint"
                description="Mark runners as they pass your station"
                icon={FlagIcon}
                tint="bg-vk-blue-tint text-vk-blue"
                onClick={() => handleModuleSelect(MODULE_TYPES.CHECKPOINT, '/checkpoint/1')}
              />
              <RoleCard
                title="Base station"
                description="Log radio calls and watch the whole race"
                icon={RadioIcon}
                tint="bg-[rgba(11,45,83,0.1)] text-vk-navy"
                onClick={() => handleModuleSelect(MODULE_TYPES.BASE_STATION, '/base-station/operations')}
              />
              <RoleCard
                title="Race setup"
                description="Create a race, runners and checkpoints"
                icon={AdjustmentsHorizontalIcon}
                tint="bg-vk-gold-tint text-vk-ink"
                flat
                onClick={handleGoToRaceManagement}
              />
            </>
          )}

          {races.length === 0 && !isLoading && (
            <p className="text-sm text-vk-muted">
              No races on this device yet. Choose <strong className="text-vk-ink">Race setup</strong> to create one,
              or scan a race QR code from the race director.
            </p>
          )}

          <div className="mt-4 flex flex-col gap-3">
            <Button variant="gold" size="primary" fullWidth onClick={() => setShowImport(true)}
              leftIcon={<QrCodeIcon className="w-5 h-5" aria-hidden="true" />}>
              Scan race QR code
            </Button>
          </div>

          {categorized.upcoming.length + categorized.recent.length + categorized.current.length > 1 && (
            <section className="mt-6" aria-labelledby="races-hd">
              <h2 id="races-hd" className="font-display font-bold text-xs tracking-[1.5px] uppercase text-vk-blue mb-2">Races on this device</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...categorized.current, ...categorized.upcoming, ...categorized.recent].map(race => (
                  <RaceStatsCard
                    key={race.id}
                    race={race}
                    runners={runnersMap[race.id] || []}
                    variant={categorized.current.includes(race) ? 'current' : categorized.upcoming.includes(race) ? 'upcoming' : 'past'}
                    showProgress={categorized.current.includes(race)}
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

          <div className="text-center text-xs text-vk-muted mt-4">Ipswich &amp; District Radio Club · VK4WIP</div>
        </div>
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

      {/* Checkpoint selector — second step for Checkpoint Operations */}
      <StandardModal
        isOpen={checkpointChoices.length > 0}
        onClose={() => { setPendingRaceForCheckpoint(null); setCheckpointChoices([]); }}
        title="Select Your Checkpoint"
        size="sm"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Which checkpoint are you operating for <strong>{pendingRaceForCheckpoint?.name}</strong>?
        </p>
        <div className="space-y-2">
          {checkpointChoices.map((item) =>
            item.type === 'linked' ? (
              <button
                key={`linked-${item.primary.number}-${item.secondary.number}`}
                onClick={() => handleCheckpointSelect(item)}
                className="w-full text-left px-4 py-3 rounded-lg border border-navy-300 dark:border-navy-600 bg-navy-50 dark:bg-navy-900/30 hover:bg-navy-100 dark:hover:bg-navy-800/50 focus:outline-none focus:ring-2 focus:ring-navy-500 transition-colors"
              >
                <span className="font-semibold text-gray-900 dark:text-white">
                  CP{item.primary.number} &amp; CP{item.secondary.number}
                </span>
                {(item.primary.name || item.secondary.name) && (
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    — {item.primary.name || `CP${item.primary.number}`} / {item.secondary.name || `CP${item.secondary.number}`}
                  </span>
                )}
                <span className="ml-2 text-xs text-navy-600 dark:text-navy-400">Operate both</span>
              </button>
            ) : (
              <button
                key={item.cp.number}
                onClick={() => handleCheckpointSelect(item)}
                className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-navy-50 dark:hover:bg-navy-900/30 focus:outline-none focus:ring-2 focus:ring-navy-500 transition-colors"
              >
                <span className="font-semibold text-gray-900 dark:text-white">CP{item.cp.number}</span>
                {item.cp.name && <span className="ml-2 text-gray-600 dark:text-gray-400">— {item.cp.name}</span>}
              </button>
            )
          )}
        </div>
      </StandardModal>

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

      {/* Scan race QR code — existing import flow, opened on the scanner */}
      <ImportExportModal
        isOpen={showImport}
        onClose={() => { setShowImport(false); loadRaces(); }}
        initialTab="import"
        startScanner
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
};

/** Role card (≥76px): icon tile, title, one-line description, chevron. */
const RoleCard = ({ title, description, icon: Icon, tint, onClick, flat = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-left w-full bg-white dark:bg-gray-800 border border-vk-border dark:border-gray-700 rounded-card p-4 flex items-center gap-3.5 min-h-[76px] ${flat ? '' : 'shadow-btn'} focus:outline-none focus-visible:ring-2 focus-visible:ring-vk-blue`}
  >
    <span className={`w-12 h-12 rounded-btn flex items-center justify-center shrink-0 ${tint}`}>
      <Icon className="w-[26px] h-[26px]" aria-hidden="true" />
    </span>
    <span className="flex flex-col gap-[3px] flex-1">
      <span className="font-display font-bold text-base text-vk-navy dark:text-white">{title}</span>
      <span className="text-[13px] text-vk-muted dark:text-gray-400">{description}</span>
    </span>
    <ChevronRightIcon className="w-5 h-5 text-vk-muted" aria-hidden="true" />
  </button>
);

/** Current race summary in the navy header. */
const CurrentRaceCard = ({ race }) => {
  const [cpCount, setCpCount] = useState(null);
  useEffect(() => {
    let live = true;
    StorageService.getCheckpoints(race.id).then(cps => { if (live) setCpCount(cps.length); }).catch(() => {});
    return () => { live = false; };
  }, [race.id]);
  const date = race.date ? TimeUtils.formatDate(race.date, 'EEE d MMM') : '';
  const parts = [
    date,
    cpCount != null && `${cpCount} checkpoint${cpCount === 1 ? '' : 's'} + finish`,
    race.startTime && `start ${race.startTime.slice(0, 5)}`,
  ].filter(Boolean);
  return (
    <div className="bg-white/[0.08] border border-white/[0.18] rounded-card px-4 py-3.5 flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold tracking-[1.2px] uppercase text-vk-gold">Current race</span>
        <SavedIndicator label="Offline ready" />
      </div>
      <div className="font-display font-bold text-lg">{race.name}</div>
      <div className="text-[13px] text-vk-on-navy">{parts.join(' · ')}</div>
    </div>
  );
};

export default LandingPage;
