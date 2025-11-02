import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { withOperationExit } from '../shared/components/ExitOperationModal';
import HotkeysProvider from '../shared/components/HotkeysProvider';
import useNavigationStore, { MODULE_TYPES } from '../shared/store/navigationStore';
import useBaseOperationsStore from '../modules/base-operations/store/baseOperationsStore';
import useRaceMaintenanceStore from '../modules/race-maintenance/store/raceMaintenanceStore';
import useSettingsStore from '../shared/store/settingsStore';

// Existing components
import BaseStationCallInPage from '../components/BaseStation/BaseStationCallInPage';
import DataEntry from '../components/BaseStation/DataEntry';
import IsolatedBaseStationRunnerGrid from '../components/BaseStation/IsolatedBaseStationRunnerGrid';
import LoadingSpinner from '../components/Layout/LoadingSpinner';
import ErrorMessage from '../components/Layout/ErrorMessage';

// New base-operations components
import LogOperationsPanel from '../modules/base-operations/components/LogOperationsPanel';
import MissingNumbersList from '../modules/base-operations/components/MissingNumbersList';
import OutList from '../modules/base-operations/components/OutList';
import StrapperCallsPanel from '../modules/base-operations/components/StrapperCallsPanel';
import ReportsPanel from '../modules/base-operations/components/ReportsPanel';
import WithdrawalDialog from '../modules/base-operations/components/WithdrawalDialog';
import VetOutDialog from '../modules/base-operations/components/VetOutDialog';
import DuplicateEntriesDialog from '../modules/base-operations/components/DuplicateEntriesDialog';
import DeletedEntriesView from '../modules/base-operations/components/DeletedEntriesView';
import BackupRestoreDialog from '../modules/base-operations/components/BackupRestoreDialog';
import HelpDialog from '../modules/base-operations/components/HelpDialog';
import AboutDialog from '../modules/base-operations/components/AboutDialog';

const BaseStationView = ({ onExitAttempt, setHasUnsavedChanges }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('grid');
  
  // Dialog states
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false);
  const [showVetOutDialog, setShowVetOutDialog] = useState(false);
  const [showDuplicatesDialog, setShowDuplicatesDialog] = useState(false);
  const [showDeletedEntriesView, setShowDeletedEntriesView] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  
  // Store hooks
  const { startOperation } = useNavigationStore();
  const { currentRace, loadCurrentRace } = useRaceMaintenanceStore();
  const { 
    runners, 
    loading, 
    error,
    checkpointNumber,
    initializeBaseStation,
    loadBaseStationData,
    withdrawRunner,
    vetOutRunner,
    duplicateEntries,
    deletedEntries,
    loadDuplicateEntries,
    loadDeletedEntries
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

  // Hotkey handlers
  const hotkeyHandlers = {
    'alt+w': () => setShowWithdrawalDialog(true),
    'alt+v': () => setShowVetOutDialog(true),
    'alt+l': () => setShowDeletedEntriesView(true),
    'alt+k': () => setShowBackupDialog(true),
    'alt+h': () => setShowHelpDialog(true),
    'alt+o': () => setShowAboutDialog(true),
    'alt+q': () => onExitAttempt(),
    'alt+1': () => setActiveTab('grid'),
    'alt+2': () => setActiveTab('data-entry'),
    'alt+3': () => setActiveTab('log-ops'),
    'alt+4': () => setActiveTab('lists'),
    'alt+5': () => setActiveTab('housekeeping'),
    'alt+6': () => setActiveTab('overview')
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <HotkeysProvider handlers={hotkeyHandlers}>
      <div className="space-y-6">
        {/* Base Station Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold dark:text-white">
              Base Station Operations
            </h1>
            {currentRace && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {currentRace.name} • Checkpoint {checkpointNumber}
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowHelpDialog(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-2"
              title="Help (Alt+H)"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span>Help</span>
            </button>
            <button
              onClick={onExitAttempt}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              title="Exit Base Station (Alt+Q)"
            >
              Exit Base Station
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-4 overflow-x-auto">
            <TabButton
              active={activeTab === 'grid'}
              onClick={() => setActiveTab('grid')}
              hotkey="Alt+1"
            >
              Runner Grid
            </TabButton>
            <TabButton
              active={activeTab === 'data-entry'}
              onClick={() => setActiveTab('data-entry')}
              hotkey="Alt+2"
            >
              Data Entry
            </TabButton>
            <TabButton
              active={activeTab === 'log-ops'}
              onClick={() => setActiveTab('log-ops')}
              hotkey="Alt+3"
            >
              Log Operations
            </TabButton>
            <TabButton
              active={activeTab === 'lists'}
              onClick={() => setActiveTab('lists')}
              hotkey="Alt+4"
            >
              Lists & Reports
            </TabButton>
            <TabButton
              active={activeTab === 'housekeeping'}
              onClick={() => setActiveTab('housekeeping')}
              hotkey="Alt+5"
            >
              Housekeeping
            </TabButton>
            <TabButton
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              hotkey="Alt+6"
            >
              Overview
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
            <div className="space-y-6">
              <DataEntry
                checkpointNumber={checkpointNumber}
                onDataEntry={() => setHasUnsavedChanges(true)}
              />
              
              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Quick Actions
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowWithdrawalDialog(true)}
                    className="btn-secondary flex items-center space-x-2"
                    title="Withdraw Runner (Alt+W)"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                    </svg>
                    <span>Withdraw Runner</span>
                  </button>
                  <button
                    onClick={() => setShowVetOutDialog(true)}
                    className="btn-secondary flex items-center space-x-2"
                    title="Vet Out Runner (Alt+V)"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>Vet Out Runner</span>
                  </button>
                  <button
                    onClick={() => setShowDuplicatesDialog(true)}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                      <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                    </svg>
                    <span>View Duplicates</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'log-ops' && (
            <LogOperationsPanel
              onViewDeleted={() => setShowDeletedEntriesView(true)}
              onViewDuplicates={() => setShowDuplicatesDialog(true)}
            />
          )}
          
          {activeTab === 'lists' && (
            <div className="space-y-6">
              {/* Sub-tabs for Lists */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex space-x-4 px-6">
                    <SubTabButton
                      active={activeTab === 'lists'}
                      onClick={() => {}}
                    >
                      Missing Numbers
                    </SubTabButton>
                    <SubTabButton
                      active={false}
                      onClick={() => {}}
                    >
                      Out List
                    </SubTabButton>
                    <SubTabButton
                      active={false}
                      onClick={() => {}}
                    >
                      Reports
                    </SubTabButton>
                  </nav>
                </div>
                
                <div className="p-6">
                  <MissingNumbersList />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <OutList />
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <ReportsPanel />
              </div>
            </div>
          )}
          
          {activeTab === 'housekeeping' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <StrapperCallsPanel />
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Backup & Restore
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowBackupDialog(true)}
                    className="btn-primary flex items-center space-x-2"
                    title="Backup Data (Alt+K)"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                    </svg>
                    <span>Backup Now</span>
                  </button>
                  <button
                    onClick={() => setShowBackupDialog(true)}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    <span>Restore from Backup</span>
                  </button>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  System Information
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowAboutDialog(true)}
                    className="btn-secondary flex items-center space-x-2"
                    title="About (Alt+O)"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>About</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <IsolatedBaseStationRunnerGrid
                runners={runners}
                onRunnerUpdate={(number, updates) => {
                  setHasUnsavedChanges(true);
                }}
                showStatusManagement={true}
              />
              
              {/* Status Management Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Status Management
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowWithdrawalDialog(true)}
                    className="btn-secondary"
                  >
                    Mark as Withdrawn
                  </button>
                  <button
                    onClick={() => setShowVetOutDialog(true)}
                    className="btn-secondary"
                  >
                    Mark as Vet Out
                  </button>
                  <button
                    className="btn-secondary"
                  >
                    Mark as DNF
                  </button>
                  <button
                    className="btn-secondary"
                  >
                    Mark as Non-Starter
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dialogs */}
        <WithdrawalDialog
          isOpen={showWithdrawalDialog}
          onClose={() => setShowWithdrawalDialog(false)}
          onWithdraw={async (data) => {
            await withdrawRunner(data);
            setShowWithdrawalDialog(false);
            setHasUnsavedChanges(true);
          }}
        />

        <VetOutDialog
          isOpen={showVetOutDialog}
          onClose={() => setShowVetOutDialog(false)}
          onVetOut={async (data) => {
            await vetOutRunner(data);
            setShowVetOutDialog(false);
            setHasUnsavedChanges(true);
          }}
        />

        <DuplicateEntriesDialog
          isOpen={showDuplicatesDialog}
          onClose={() => setShowDuplicatesDialog(false)}
          duplicates={duplicateEntries}
          onResolve={async (resolution) => {
            // Handle duplicate resolution
            setShowDuplicatesDialog(false);
            setHasUnsavedChanges(true);
            // Reload duplicate entries after resolution
            await loadDuplicateEntries();
          }}
        />

        <DeletedEntriesView
          isOpen={showDeletedEntriesView}
          onClose={() => setShowDeletedEntriesView(false)}
          deletedEntries={deletedEntries}
        />

        <BackupRestoreDialog
          isOpen={showBackupDialog}
          onClose={() => setShowBackupDialog(false)}
        />

        <HelpDialog
          isOpen={showHelpDialog}
          onClose={() => setShowHelpDialog(false)}
        />

        <AboutDialog
          isOpen={showAboutDialog}
          onClose={() => setShowAboutDialog(false)}
        />
      </div>
    </HotkeysProvider>
  );
};

// Tab Button Component
const TabButton = ({ children, active, onClick, hotkey }) => (
  <button
    className={`py-2 px-4 text-sm font-medium border-b-2 whitespace-nowrap ${
      active
        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
    }`}
    onClick={onClick}
    title={hotkey}
  >
    {children}
  </button>
);

// Sub-tab Button Component
const SubTabButton = ({ children, active, onClick }) => (
  <button
    className={`py-3 px-4 text-sm font-medium border-b-2 ${
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
