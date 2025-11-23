import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { withOperationExit } from '../shared/components/ExitOperationModal';
import useNavigationStore, { MODULE_TYPES } from '../shared/store/navigationStore';
import useCheckpointStore from '../modules/checkpoint-operations/store/checkpointStore';
import useSettingsStore from '../shared/store/settingsStore';
import useRaceMaintenanceStore from '../modules/race-maintenance/store/raceMaintenanceStore';

import RunnerGrid from '../components/Checkpoint/RunnerGrid';
import CalloutSheet from '../components/Checkpoint/CalloutSheet';
import LoadingSpinner from '../components/Layout/LoadingSpinner';
import ErrorMessage from '../components/Layout/ErrorMessage';

const CheckpointView = ({ onExitAttempt, setHasUnsavedChanges }) => {
  const { checkpointId } = useParams();
  const navigate = useNavigate();
  const [showCalloutSheet, setShowCalloutSheet] = useState(false);
  
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
  const { updateSetting } = useSettingsStore();

  // Initialize checkpoint operation
  useEffect(() => {
    const initializeOperation = async () => {
      try {
        // Load current race if not loaded
        if (!currentRace) {
          await loadCurrentRace();
        }

        if (currentRace) {
          // Start checkpoint operation
          startOperation(MODULE_TYPES.CHECKPOINT);
          
          // Save current checkpoint in settings
          await updateSetting('currentCheckpoint', parseInt(checkpointId));

          // Initialize or load checkpoint data
          const existingRunners = await loadCheckpointData(currentRace.id, parseInt(checkpointId));
          if (!existingRunners || existingRunners.length === 0) {
            await initializeCheckpoint(currentRace.id, parseInt(checkpointId));
          }
        } else {
          // No race found, redirect to home
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
  }, [checkpointId, currentRace, loadCurrentRace, initializeCheckpoint, loadCheckpointData, startOperation, updateSetting, navigate]);

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
        <div className="space-x-4">
          <button
            onClick={() => setShowCalloutSheet(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            View Callout Sheet
          </button>
          <button
            onClick={onExitAttempt}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Exit Checkpoint
          </button>
        </div>
      </div>

      {/* Runner Grid */}
      <RunnerGrid 
        runners={runners}
        onRunnerUpdate={(number, updates) => {
          setHasUnsavedChanges(true);
          // Runner update logic here
        }}
      />

      {/* Callout Sheet Modal */}
      {showCalloutSheet && (
        <CalloutSheet
          runners={runners}
          onClose={() => setShowCalloutSheet(false)}
        />
      )}
    </div>
  );
};

// Wrap with operation exit handling
export default withOperationExit(CheckpointView);
