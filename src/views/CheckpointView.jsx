import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { withOperationExit } from '../shared/components/ExitOperationModal';
import useNavigationStore, { MODULE_TYPES } from '../shared/store/navigationStore';
import useCheckpointStore from '../modules/checkpoint-operations/store/checkpointStore';
import useSettingsStore from '../shared/store/settingsStore';
import useRaceMaintenanceStore from '../modules/race-maintenance/store/raceMaintenanceStore';
import { useRaceStore } from '../store/useRaceStore.js';

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
        const freshRace = useRaceMaintenanceStore.getState().currentRace;
        if (freshRace) {
          // Start checkpoint operation
          startOperation(MODULE_TYPES.CHECKPOINT);
          
          // Initialize or load checkpoint data first (ensures runners are in IndexedDB)
          await loadCheckpointData(freshRace.id, parseInt(checkpointId));
          const { runners: existingRunners } = useCheckpointStore.getState();
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
    <div className="space-y-6">
      {/* Checkpoint Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBackToHome}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Back to Home"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold dark:text-white">
            Checkpoint {checkpointId}
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportResults}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            title="Download checkpoint results as JSON for Base Station import"
          >
            Export Results
          </button>
          <button
            onClick={onExitAttempt}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Exit Checkpoint
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-4" aria-label="Checkpoint tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab panels */}
      {activeTab === 'mark-off' && (
        <div className="space-y-4">
          <QuickEntryBar />
          <RunnerGrid
            onRunnerUpdate={() => setHasUnsavedChanges(true)}
          />
        </div>
      )}
      {activeTab === 'callout' && <CalloutSheet />}
      {activeTab === 'overview' && <RunnerOverview />}
    </div>
  );
};

// Wrap with operation exit handling
export default withOperationExit(CheckpointView);
