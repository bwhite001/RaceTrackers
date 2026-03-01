import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { withOperationExit } from '../shared/components/ExitOperationModal';
import useNavigationStore, { MODULE_TYPES } from '../shared/store/navigationStore';
import useCheckpointStore, { checkpointStore } from '../modules/checkpoint-operations/store/checkpointStore';
import useSettingsStore from '../shared/store/settingsStore';
import useRaceMaintenanceStore, { raceMaintenanceStore } from '../modules/race-maintenance/store/raceMaintenanceStore';
import { useRaceStore } from '../store/useRaceStore.js';
import PageHeader from '../shared/components/PageHeader';

import RunnerGrid from '../components/Checkpoint/RunnerGrid';
import QuickEntryBar from '../components/Checkpoint/QuickEntryBar';
import CalloutSheet from '../components/Checkpoint/CalloutSheet';
import RunnerOverview from '../components/Shared/RunnerOverview';
import LoadingSpinner from '../components/Layout/LoadingSpinner';
import ErrorMessage from '../components/Layout/ErrorMessage';
import { ExportService } from '../services/import-export/ExportService';

const TABS = [
  { id: 'mark-off', label: 'Mark Off' },
  { id: 'callout', label: 'Callout Sheet' },
  { id: 'overview', label: 'Overview' },
];

const CheckpointView = ({ onExitAttempt, setHasUnsavedChanges }) => {
  const { checkpointId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('mark-off');
  
  // Store hooks
  const { startOperation } = useNavigationStore();
  const { currentRace, loadCurrentRace } = useRaceMaintenanceStore();
  const { 
    runners, 
    loading, 
    error,
    initializeCheckpoint,
    loadCheckpointData 
  } = useCheckpointStore();
  const { loadRace: loadRaceIntoLegacyStore, loadCheckpointRunners } = useRaceStore();
  const { updateSetting } = useSettingsStore();

  // Initialize checkpoint operation
  useEffect(() => {
    const initializeOperation = async () => {
      try {
        // Load current race if not loaded
        if (!currentRace) {
          await loadCurrentRace();
        }

        // Read fresh state after async load (avoid stale closure)
        const freshRace = raceMaintenanceStore.getState().currentRace;
        if (freshRace) {
          // Start checkpoint operation
          startOperation(MODULE_TYPES.CHECKPOINT);
          
          // Initialize or load checkpoint data first (ensures runners are in IndexedDB)
          await loadCheckpointData(freshRace.id, parseInt(checkpointId));
          const { runners: existingRunners } = checkpointStore.getState();
          if (!existingRunners || existingRunners.length === 0) {
            await initializeCheckpoint(freshRace.id, parseInt(checkpointId));
          }

          // After data is ready, load race into the legacy useRaceStore so RunnerGrid can access it
          await loadRaceIntoLegacyStore(freshRace.id);
          // Explicitly load checkpoint runners since currentCheckpoint may not change (stays 1)
          await loadCheckpointRunners(parseInt(checkpointId));
          
          // Save current checkpoint in settings
          await updateSetting('currentCheckpoint', parseInt(checkpointId));
        } else if (!currentRace) {
          // No race found after attempted load, redirect to home
          navigate('/', { 
            replace: true,
            state: { error: 'No active race found. Please create or select a race first.' }
          });
        }
      } catch (error) {
        console.error('Error initializing checkpoint:', error);
      }
    };

    initializeOperation();
  }, [checkpointId, currentRace, loadCurrentRace, initializeCheckpoint, loadCheckpointData, startOperation, updateSetting, navigate, loadRaceIntoLegacyStore, loadCheckpointRunners]);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(false); // Reset on load
  }, [setHasUnsavedChanges]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const handleBackToHome = () => {
    onExitAttempt(); // This will trigger the exit confirmation if needed
  };

  const handleExportResults = async () => {
    if (!currentRace) return;
    try {
      const pkg = await ExportService.exportCheckpointResults(
        currentRace.id,
        parseInt(checkpointId)
      );
      ExportService.downloadExport(
        pkg,
        `checkpoint-${checkpointId}-results-${Date.now()}.json`
      );
    } catch (err) {
      console.error('Checkpoint export failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Unified page header */}
      <PageHeader
        variant="operational"
        title={currentRace?.name}
        moduleType={MODULE_TYPES.CHECKPOINT}
        moduleLabel={`Checkpoint ${checkpointId}`}
        onExit={onExitAttempt}
        actions={[
          {
            icon: <ArrowDownTrayIcon />,
            label: 'Export Results',
            onClick: handleExportResults,
          },
        ]}
      />

      {/*
        Single tab nav — responsive position:
        mobile: fixed to bottom, flex row of compact tabs
        desktop: sticky below header, underline-style horizontal tabs
      */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30
                   md:sticky md:top-[64px] md:bottom-auto md:z-10
                   bg-white dark:bg-gray-800
                   border-t border-gray-200 dark:border-gray-700
                   md:border-t-0 md:border-b md:border-gray-200 md:dark:border-gray-700
                   shadow-[0_-4px_12px_rgba(0,0,0,0.08)] md:shadow-sm"
        aria-label="Checkpoint tabs"
      >
        <div className="md:max-w-7xl md:mx-auto md:px-4 sm:px-6 lg:px-8 flex md:block">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 md:flex-none
                py-3 px-2 md:px-5
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
      </nav>

      {/* Main content — bottom padding prevents overlap with mobile tab bar + QuickEntryBar */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-40 md:pb-6">
        {activeTab === 'mark-off' && (
          <div className="space-y-4">
            <RunnerGrid onRunnerUpdate={() => setHasUnsavedChanges(true)} />
          </div>
        )}
        {activeTab === 'callout' && <CalloutSheet />}
        {activeTab === 'overview' && <RunnerOverview />}
      </main>

      {/* QuickEntryBar — sticky above mobile tab bar, inline on desktop */}
      {activeTab === 'mark-off' && (
        <div className="fixed bottom-[56px] left-0 right-0 z-20 md:static md:bottom-auto md:z-auto md:max-w-7xl md:w-full md:mx-auto md:px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 shadow-lg md:shadow-none">
          <QuickEntryBar />
        </div>
      )}
    </div>
  );
};

// Wrap with operation exit handling
export default withOperationExit(CheckpointView);
