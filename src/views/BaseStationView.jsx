import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { withOperationExit } from '../shared/components/ExitOperationModal';
import useNavigationStore, { MODULE_TYPES } from '../shared/store/navigationStore';
import useBaseOperationsStore from '../modules/base-operations/store/baseOperationsStore';
import useRaceMaintenanceStore from '../modules/race-maintenance/store/raceMaintenanceStore';
import useSettingsStore from '../shared/store/settingsStore';

import BaseStationCallInPage from '../components/BaseStation/BaseStationCallInPage';
import DataEntry from '../components/BaseStation/DataEntry';
import IsolatedBaseStationRunnerGrid from '../components/BaseStation/IsolatedBaseStationRunnerGrid';
import LoadingSpinner from '../components/Layout/LoadingSpinner';
import ErrorMessage from '../components/Layout/ErrorMessage';

const BaseStationView = ({ onExitAttempt, setHasUnsavedChanges }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('grid');
  
  // Store hooks
  const { startOperation } = useNavigationStore();
  const { currentRace, loadCurrentRace } = useRaceMaintenanceStore();
  const { 
    runners, 
    loading, 
    error,
    checkpointNumber,
    initializeBaseStation,
    loadBaseStationData 
  } = useBaseOperationsStore();
  const { updateSetting } = useSettingsStore();

  // Initialize base station operation
  useEffect(() => {
    const initializeOperation = async () => {
      try {
        // Load current race if not loaded
        if (!currentRace) {
          await loadCurrentRace();
        }

        if (currentRace) {
          // Start base station operation
          startOperation(MODULE_TYPES.BASE_STATION);
          
          // Save current base station settings
          await updateSetting('currentBaseStationCheckpoint', 1);

          // Initialize or load base station data
          const existingRunners = await loadBaseStationData(currentRace.id);
          if (!existingRunners || existingRunners.length === 0) {
            await initializeBaseStation(currentRace.id);
          }
        } else {
          // No race found, redirect to home
          navigate('/', { 
            replace: true,
            state: { error: 'No active race found. Please create or select a race first.' }
          });
        }
      } catch (error) {
        console.error('Error initializing base station:', error);
      }
    };

    initializeOperation();
  }, [currentRace, loadCurrentRace, initializeBaseStation, loadBaseStationData, startOperation, updateSetting, navigate]);

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

  return (
    <div className="space-y-6">
      {/* Base Station Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold dark:text-white">
          Base Station Operations
        </h1>
        <div className="space-x-4">
          <button
            onClick={onExitAttempt}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Exit Base Station
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-4">
          <TabButton
            active={activeTab === 'grid'}
            onClick={() => setActiveTab('grid')}
          >
            Runner Grid
          </TabButton>
          <TabButton
            active={activeTab === 'data-entry'}
            onClick={() => setActiveTab('data-entry')}
          >
            Data Entry
          </TabButton>
          <TabButton
            active={activeTab === 'call-in'}
            onClick={() => setActiveTab('call-in')}
          >
            Call-In Page
          </TabButton>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'grid' && (
          <IsolatedBaseStationRunnerGrid
            runners={runners}
            onRunnerUpdate={(number, updates) => {
              setHasUnsavedChanges(true);
              // Runner update logic here
            }}
          />
        )}
        {activeTab === 'data-entry' && (
          <DataEntry
            checkpointNumber={checkpointNumber}
            onDataEntry={() => setHasUnsavedChanges(true)}
          />
        )}
        {activeTab === 'call-in' && (
          <BaseStationCallInPage
            checkpointNumber={checkpointNumber}
            onCallIn={() => setHasUnsavedChanges(true)}
          />
        )}
      </div>
    </div>
  );
};

// Tab Button Component
const TabButton = ({ children, active, onClick }) => (
  <button
    className={`py-2 px-4 text-sm font-medium border-b-2 ${
      active
        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
    }`}
    onClick={onClick}
  >
    {children}
  </button>
);

// Wrap with operation exit handling
export default withOperationExit(BaseStationView);
