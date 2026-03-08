import React, { useState, useCallback, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { withOperationExit } from '../../../shared/components/ExitOperationModal';
import HotkeysProvider from '../../../shared/components/HotkeysProvider';
import useNavigationStore, { MODULE_TYPES } from '../../../shared/store/navigationStore';
import useBaseOperationsStore from '../store/baseOperationsStore';
import { useRaceStore } from '../../../store/useRaceStore.js';
import useSettingsStore from '../../../shared/store/settingsStore';
import { HOTKEYS, RUNNER_STATUSES } from '../../../types';
import PageHeader from '../../../shared/components/PageHeader';
import ImportExportModal from '../../../components/ImportExport/ImportExportModal';

// Components
import BatchEntryLayout from '../components/BatchEntryLayout';
import RaceOverview from '../components/RaceOverview';
import WithdrawalDialog from '../components/WithdrawalDialog';
import CheckpointImportPanel from '../components/CheckpointImportPanel';
import BulkDnsModal from '../components/BulkDnsView';
import OutList from '../components/OutList';
import ErrorMessage from '../../../components/Layout/ErrorMessage';
import StatusStrip from '../../../components/Layout/StatusStrip';
import SettingsModal from '../../../components/Settings/SettingsModal';
import HelpDialog from '../components/HelpDialog';
import HeadsUpGrid from '../components/HeadsUpGrid';
import CourseLeadersCard from '../components/CourseLeadersCard';
import LoadingSpinner from '../../../components/Layout/LoadingSpinner';
import { getRunnerTotal } from '../../../utils/raceStatistics';
const RaceCourseMap = lazy(() => import('../components/RaceCourseMap'));

const TABS = [
  { id: 'data-entry', label: 'Data Entry' },
  { id: 'overview',   label: 'Overview' },
  { id: 'dns',        label: 'DNS' },
];

/**
 * BaseStationView Component
 * Main view for base station operations
 */
const BaseStationView = ({ onExitAttempt, setHasUnsavedChanges }) => {
  const navigate = useNavigate();

  // Store access
  const { currentRaceId, currentRace, loading, error, stats, runners, initialize, refreshData } = useBaseOperationsStore();
  const { selectedRaceForMode, checkpoints, loadRace: loadRaceIntoStore } = useRaceStore();
  const { darkMode } = useSettingsStore();
  const initStarted = useRef(false);

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
    return Array.from(byRunner.values());
  }, [runners]);

  // Local state
  const [activeTab, setActiveTab] = useState('data-entry');
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
      // Ensure checkpoints are loaded into useRaceStore (needed by BatchEntryLayout)
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
    [HOTKEYS.NEW_ENTRY]: () => handleTabChange('data-entry'),
    [HOTKEYS.DROPOUT]: () => handleWithdrawal('dnf'),
    'shift+d': () => handleTabChange('dns'),
    'escape': () => {
      if (showWithdrawalDialog) {
        setShowWithdrawalDialog(false);
      } else if (activeTab === 'data-entry') {
        handleTabChange('overview');
      }
    }
  };

  if (!currentRaceId) {
    return null; // useEffect handles navigate('/')
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <HotkeysProvider hotkeys={hotkeys}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        {/* Unified page header */}
        <PageHeader
          variant="operational"
          title={currentRace?.name ?? 'Base Station Operations'}
          moduleType={MODULE_TYPES.BASE_STATION}
          actions={[
            { icon: <ArrowUpTrayIcon className="w-5 h-5" />, label: 'Import / Export', onClick: () => setShowImportExport(true) },
          ]}
          onExit={handleExit}
          onHelp={handleOpenHelp}
          onSettings={handleOpenSettings}
        />

        {/*
          Single tab nav — responsive position:
          mobile: fixed to bottom, flex row of compact tabs
          desktop: sticky below header, underline-style with extra route buttons
        */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-30
                     md:sticky md:top-[64px] md:bottom-auto md:z-10
                     bg-white dark:bg-gray-800
                     border-t border-gray-200 dark:border-gray-700
                     md:border-t-0 md:border-b md:border-gray-200 md:dark:border-gray-700
                     shadow-[0_-4px_12px_rgba(0,0,0,0.08)] md:shadow-sm"
          aria-label="Base station tabs"
        >
          <div className="md:container md:mx-auto md:px-4 flex md:flex md:items-end">
            <div role="tablist" className="flex flex-1 md:flex-1">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`tabpanel-${tab.id}`}
                  aria-label={tab.label}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    flex-1 md:flex-none
                    py-3 px-1 md:px-5
                    text-xs md:text-sm font-semibold
                    transition-colors
                    border-t-2 md:border-t-0 md:border-b-2 -mt-px md:mt-0 md:-mb-px
                    ${activeTab === tab.id
                      ? 'text-navy-700 dark:text-navy-300 border-navy-600 dark:border-navy-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Extra route shortcuts — desktop only */}
            <div className="hidden lg:flex items-center gap-1 pb-1">
              <button
                onClick={() => navigate('/base-station/dashboard')}
                className="px-3 py-1.5 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Live Dashboard
              </button>
            </div>
          </div>
        </nav>

        {/* Main content — bottom padding prevents overlap with mobile tab bar */}
        <main className="flex-1 container mx-auto px-4 py-6 pb-24 md:pb-20">
          <div
            role="tabpanel"
            id={`tabpanel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            className="space-y-6"
            data-screenshot-target
          >
            {activeTab === 'data-entry' && (
              <BatchEntryLayout onUnsavedChanges={setHasUnsavedChanges} />
            )}

            {activeTab === 'overview' && (
              <div className="space-y-6">
                <Suspense fallback={null}>
                  <RaceCourseMap
                    courseGpx={currentRace?.courseGpx ?? null}
                    checkpoints={checkpoints ?? []}
                    runners={runners ?? []}
                    total={getRunnerTotal(currentRace)}
                  />
                </Suspense>
                <CourseLeadersCard runners={groupedRunners} checkpoints={checkpoints ?? []} />
                <HeadsUpGrid runners={groupedRunners} checkpoints={checkpoints ?? []} />
                <RaceOverview />
                <CheckpointImportPanel />
              </div>
            )}

            {activeTab === 'dns' && (
              <div className="space-y-4">
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

          </div>
        </main>

        {/* Status Strip */}
        <StatusStrip stats={stats} />

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
