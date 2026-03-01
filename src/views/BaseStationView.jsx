import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { withOperationExit } from '../shared/components/ExitOperationModal';
import HotkeysProvider from '../shared/components/HotkeysProvider';
import useNavigationStore, { MODULE_TYPES } from '../shared/store/navigationStore';
import useBaseOperationsStore from '../modules/base-operations/store/baseOperationsStore';
import { useRaceStore } from '../store/useRaceStore.js';
import useSettingsStore from '../shared/store/settingsStore';
import { HOTKEYS } from '../types';
import PageHeader from '../shared/components/PageHeader';

// Components
import DataEntry from '../components/BaseStation/DataEntry';
import RaceOverview from '../components/BaseStation/RaceOverview';
import ReportsPanel from '../components/BaseStation/ReportsPanel';
import WithdrawalDialog from '../components/BaseStation/WithdrawalDialog';
import CheckpointImportPanel from '../components/BaseStation/CheckpointImportPanel';
import CheckpointGroupingView from '../components/BaseStation/CheckpointGroupingView';
import LoadingSpinner from '../components/Layout/LoadingSpinner';
import ErrorMessage from '../components/Layout/ErrorMessage';
import StatusStrip from '../components/Layout/StatusStrip';
import SettingsModal from '../components/Settings/SettingsModal';
import HelpDialog from '../modules/base-operations/components/HelpDialog';
import HeadsUpGrid from '../modules/base-operations/components/HeadsUpGrid';
import Leaderboard from '../modules/base-operations/components/Leaderboard';

const TABS = [
  { id: 'data-entry', label: 'Data Entry' },
  { id: 'overview', label: 'Overview' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'checkpoint-matrix', label: 'Checkpoint Matrix' },
  { id: 'reports', label: 'Reports' },
];

/**
 * BaseStationView Component
 * Main view for base station operations
 */
const BaseStationView = ({ onExitAttempt, setHasUnsavedChanges }) => {
  const navigate = useNavigate();

  // Store access
  const { currentRaceId, loading, error, stats, runners, initialize } = useBaseOperationsStore();
  const { selectedRaceForMode, checkpoints } = useRaceStore();
  const { darkMode } = useSettingsStore();
  const initStarted = useRef(false);

  // Local state
  const [activeTab, setActiveTab] = useState('data-entry');
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false);
  const [withdrawalType, setWithdrawalType] = useState('dnf');
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Initialize base station from selectedRaceForMode, or redirect if no race
  useEffect(() => {
    if (currentRaceId) return; // already initialized
    if (selectedRaceForMode && !initStarted.current) {
      initStarted.current = true;
      initialize(selectedRaceForMode).catch(() => navigate('/'));
    } else if (!selectedRaceForMode) {
      navigate('/');
    }
  }, [currentRaceId, selectedRaceForMode, initialize, navigate]);

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
    [HOTKEYS.REPORTS]: () => handleTabChange('reports'),
    [HOTKEYS.DROPOUT]: () => handleWithdrawal('dnf'),
    'shift+d': () => handleWithdrawal('dns'),
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
          title={selectedRaceForMode?.name ?? 'Base Station Operations'}
          moduleType={MODULE_TYPES.BASE_STATION}
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
                  aria-pressed={activeTab === tab.id}
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
            <div className="hidden md:flex items-center gap-1 pb-1">
              <button
                onClick={() => navigate('/base-station/dashboard')}
                className="px-3 py-1.5 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Live Dashboard
              </button>
              <button
                onClick={() => navigate('/base-station/leaderboard')}
                className="px-3 py-1.5 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Leaderboard
              </button>
              <button
                onClick={() => navigate('/base-station/pending')}
                className="px-3 py-1.5 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Pending Call-Ins
              </button>
            </div>
          </div>
        </nav>

        {/* Main content — bottom padding prevents overlap with mobile tab bar */}
        <main className="flex-1 container mx-auto px-4 py-6 pb-24 md:pb-6">
          <div
            role="tabpanel"
            id={`tabpanel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            className="space-y-6"
            data-screenshot-target
          >
            {activeTab === 'data-entry' && (
              <DataEntry
                onWithdrawal={handleWithdrawal}
                onUnsavedChanges={setHasUnsavedChanges}
              />
            )}

            {activeTab === 'overview' && (
              <div className="space-y-6">
                <HeadsUpGrid
                  runners={(runners ?? []).map(r => ({
                    number: r.number,
                    status: r.status,
                    checkpointStatuses: r.checkpoints ?? {},
                  }))}
                  checkpoints={checkpoints ?? []}
                />
                <RaceOverview />
                <CheckpointImportPanel />
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <Leaderboard runners={runners ?? []} />
            )}

            {activeTab === 'checkpoint-matrix' && (
              <CheckpointGroupingView />
            )}

            {activeTab === 'reports' && (
              <ReportsPanel />
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

        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />

        <HelpDialog
          isOpen={showHelp}
          onClose={() => setShowHelp(false)}
        />
      </div>
    </HotkeysProvider>
  );
};

// Wrap with operation exit handling
export default withOperationExit(BaseStationView);
