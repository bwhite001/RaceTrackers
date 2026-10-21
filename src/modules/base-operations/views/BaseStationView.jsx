import React, { useState, useCallback, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpTrayIcon, PresentationChartLineIcon, Cog6ToothIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { withOperationExit } from '../../../shared/components/ExitOperationModal';
import HotkeysProvider from '../../../shared/components/HotkeysProvider';
import useNavigationStore, { MODULE_TYPES } from '../../../shared/store/navigationStore';
import useBaseOperationsStore from '../store/baseOperationsStore';
import { useRaceStore } from '../../../store/useRaceStore.js';
import useSettingsStore from '../../../shared/store/settingsStore';
import { HOTKEYS, RUNNER_STATUSES } from '../../../types';
import { BaseAppBar } from '../../../design-system/components/VK';
import useNow from '../../../shared/hooks/useNow';
import { hhmm } from '../../../services/blocks.js';
import ImportExportModal from '../../../components/ImportExport/ImportExportModal';

// Components
import BaseReceive from '../components/BaseReceive';
import ReportsPanel from '../components/ReportsPanel';
import RaceOverview from '../components/RaceOverview';
import WithdrawalDialog from '../components/WithdrawalDialog';
import CheckpointImportPanel from '../components/CheckpointImportPanel';
import BulkDnsModal from '../components/BulkDnsView';
import OutList from '../components/OutList';
import ErrorMessage from '../../../components/Layout/ErrorMessage';
import SettingsModal from '../../../components/Settings/SettingsModal';
import HelpDialog from '../components/HelpDialog';
import HeadsUpGrid from '../components/HeadsUpGrid';
import CourseLeadersCard from '../components/CourseLeadersCard';
import LoadingSpinner from '../../../components/Layout/LoadingSpinner';
import { getRunnerTotal } from '../../../utils/raceStatistics';
const RaceCourseMap = lazy(() => import('../components/RaceCourseMap'));

const HeaderIcon = ({ label, Icon, onClick }) => (
  <button type="button" onClick={onClick} aria-label={label} title={label}
    className="w-11 h-11 flex items-center justify-center rounded-btn text-white hover:bg-white/10">
    <Icon className="w-[22px] h-[22px]" aria-hidden="true" />
  </button>
);

/**
 * BaseStationView Component
 * Main view for base station operations
 */
const BaseStationView = ({ onExitAttempt, setHasUnsavedChanges }) => {
  const navigate = useNavigate();

  // Store access
  const { currentRaceId, currentRace, loading, error, stats, runners, initialize, refreshData, lastSync } = useBaseOperationsStore();
  const now = useNow();
  const { selectedRaceForMode, checkpoints, loadRace: loadRaceIntoStore, runners: raceRunners } = useRaceStore();
  const { darkMode } = useSettingsStore();
  const initStarted = useRef(false);
  const [showRunnerNames, setShowRunnerNames] = useState(false);

  // Group flat runner records by bib number for overview components
  const groupedRunners = useMemo(() => {
    const byRunner = new Map();
    const PASSED_STATUSES = new Set([RUNNER_STATUSES.PASSED, RUNNER_STATUSES.MARKED_OFF, RUNNER_STATUSES.CALLED_IN]);
    for (const r of (runners ?? [])) {
      if (!byRunner.has(r.number)) {
        byRunner.set(r.number, { number: r.number, status: RUNNER_STATUSES.NOT_STARTED, checkpointStatuses: {}, checkpointTimes: {}, hasBaseRecord: false });
      }
      const entry = byRunner.get(r.number);
      if (r.checkpointNumber !== 0) {
        entry.checkpointStatuses[r.checkpointNumber] = r.status;
        const t = r.commonTime || r.markOffTime || r.callInTime;
        if (t) entry.checkpointTimes[r.checkpointNumber] = t;
      } else {
        entry.status = r.status;
        entry.hasBaseRecord = true;
      }
    }
    for (const entry of byRunner.values()) {
      if (!entry.hasBaseRecord && Object.values(entry.checkpointStatuses).some(s => PASSED_STATUSES.has(s))) {
        entry.status = RUNNER_STATUSES.ACTIVE;
      }
    }
    // Merge name data from race runner list
    const nameMap = new Map((raceRunners ?? []).map(r => [r.number, r]));
    for (const entry of byRunner.values()) {
      const r = nameMap.get(entry.number);
      if (r) { entry.firstName = r.firstName || ''; entry.lastName = r.lastName || ''; }
    }
    return Array.from(byRunner.values());
  }, [runners, raceRunners]);

  // Local state
  const [activeTab, setActiveTab] = useState('receive');
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false);
  const [withdrawalType, setWithdrawalType] = useState('dnf');
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showBulkDns, setShowBulkDns] = useState(false);

  // Initialize base station from selectedRaceForMode, or redirect if no race
  useEffect(() => {
    if (currentRaceId && currentRaceId === selectedRaceForMode) {
      // Re-hydrate runners from DB on page reload (runners are not persisted to localStorage)
      refreshData();
      // Ensure checkpoints are loaded into useRaceStore (used by the overview map and grids)
      if (checkpoints.length === 0) {
        loadRaceIntoStore(currentRaceId).catch(() => {});
      }
      return;
    }
    // New or different race selected: initialize (guard against StrictMode double-fire)
    if (selectedRaceForMode && !initStarted.current) {
      initStarted.current = true;
      initialize(selectedRaceForMode)
        .then(() => loadRaceIntoStore(selectedRaceForMode).catch(() => {}))
        .catch(() => navigate('/'));
    } else if (!selectedRaceForMode) {
      navigate('/');
    }
  }, [currentRaceId, selectedRaceForMode, initialize, navigate, refreshData, loadRaceIntoStore, checkpoints.length]);

  // Handle tab change
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  // Handle withdrawal dialog
  const handleWithdrawal = useCallback((type) => {
    setWithdrawalType(type);
    setShowWithdrawalDialog(true);
  }, []);

  // Handle settings
  const handleOpenSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  // Handle help
  const handleOpenHelp = useCallback(() => {
    setShowHelp(true);
  }, []);

  // Handle exit
  const handleExit = useCallback(() => {
    if (onExitAttempt) {
      onExitAttempt();
    } else {
      navigate('/');
    }
  }, [onExitAttempt, navigate]);

  // Define hotkeys
  const hotkeys = {
    [HOTKEYS.NEW_ENTRY]: () => handleTabChange('receive'),
    [HOTKEYS.REPORTS]: () => handleTabChange('reports'),
    [HOTKEYS.DROPOUT]: () => handleWithdrawal('dnf'),
    'shift+d': () => handleTabChange('status'),
    'escape': () => {
      if (showWithdrawalDialog) setShowWithdrawalDialog(false);
    }
  };

  if (!currentRaceId) {
    return null; // useEffect handles navigate('/')
  }

  // Spinner only for the first load — later refreshes keep the screen (and any
  // call being received) in place.
  if (loading && !lastSync) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <HotkeysProvider hotkeys={hotkeys}>
      <div className="min-h-screen bg-vk-paper dark:bg-gray-900 flex flex-col">
        <BaseAppBar
          baseCallsign={currentRace?.baseCallsign || 'VK4WIP'}
          frequency={currentRace?.frequency}
          nowText={hhmm(now)}
          active={activeTab}
          onChange={handleTabChange}
          onHome={handleExit}
          right={(
            <>
              <HeaderIcon label="Import / Export" Icon={ArrowUpTrayIcon} onClick={() => setShowImportExport(true)} />
              <HeaderIcon label="Live Dashboard" Icon={PresentationChartLineIcon} onClick={() => navigate('/base-station/dashboard')} />
              <HeaderIcon label="Settings" Icon={Cog6ToothIcon} onClick={handleOpenSettings} />
              <HeaderIcon label="Help" Icon={QuestionMarkCircleIcon} onClick={handleOpenHelp} />
            </>
          )}
        />

        <main className="flex-1 pb-6">
          <div
            role="tabpanel"
            id={`tabpanel-${activeTab}`}
            aria-label={currentRace?.name ?? 'Base station'}
            className="space-y-6"
            data-screenshot-target
          >
            {activeTab === 'receive' && <BaseReceive />}

            {activeTab === 'overview' && (
              <div className="space-y-6 max-w-[1280px] mx-auto px-3 pt-3">
                <Suspense fallback={null}>
                  <RaceCourseMap
                    courseGpx={currentRace?.courseGpx ?? null}
                    checkpoints={checkpoints ?? []}
                    runners={runners ?? []}
                    total={getRunnerTotal(currentRace)}
                  />
                </Suspense>
                <CourseLeadersCard runners={groupedRunners} checkpoints={checkpoints ?? []} />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowRunnerNames(v => !v)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${showRunnerNames ? 'bg-navy-600 text-white border-navy-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}
                  >
                    {showRunnerNames ? 'Hide Names' : 'Show Names'}
                  </button>
                </div>
                <HeadsUpGrid runners={groupedRunners} checkpoints={checkpoints ?? []} showNames={showRunnerNames} />
                <RaceOverview />
                <CheckpointImportPanel />
              </div>
            )}

            {activeTab === 'status' && (
              <div className="space-y-4 max-w-[1280px] mx-auto px-3 pt-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">DNS &amp; DNF</h2>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleWithdrawal('withdrawal')}
                      className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                    >
                      Withdraw Runner
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBulkDns(true)}
                      className="px-4 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-white rounded-lg transition-colors"
                    >
                      Bulk Mark DNS
                    </button>
                  </div>
                </div>
                <OutList initialFilter="all" />
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="max-w-[1280px] mx-auto px-3 pt-3">
                <ReportsPanel />
              </div>
            )}

          </div>
        </main>


        {/* Withdrawal Dialog */}
        <WithdrawalDialog
          isOpen={showWithdrawalDialog}
          onClose={() => setShowWithdrawalDialog(false)}
          type={withdrawalType}
        />

        {/* Bulk DNS Modal */}
        <BulkDnsModal
          isOpen={showBulkDns}
          onClose={() => setShowBulkDns(false)}
        />

        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />

        <HelpDialog
          isOpen={showHelp}
          onClose={() => setShowHelp(false)}
        />

        <ImportExportModal isOpen={showImportExport} onClose={() => setShowImportExport(false)} />
      </div>
    </HotkeysProvider>
  );
};

// Wrap with operation exit handling
export default withOperationExit(BaseStationView);
