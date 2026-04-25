import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowDownTrayIcon, ArrowsRightLeftIcon, QrCodeIcon } from '@heroicons/react/24/outline';
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
import ExportCheckpointResultsModal from '../modules/checkpoint-operations/components/ExportCheckpointResultsModal';
import RadioOperatorView from '../modules/checkpoint-operations/components/RadioOperatorView';
import BatchShareModal from '../modules/checkpoint-operations/components/transfer/BatchShareModal';
import TransferService from '../modules/checkpoint-operations/services/TransferService';

const TABS = [
  { id: 'mark-off', label: 'Mark Off' },
  { id: 'callout', label: 'Callout Sheet' },
  { id: 'overview', label: 'Overview' },
];

const CheckpointView = ({ onExitAttempt, setHasUnsavedChanges }) => {
  const { checkpointId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('mark-off');
  const [showExportModal, setShowExportModal] = useState(false);
  const [role, setRole] = useState('marker'); // 'marker' | 'radio'
  const [showBatchShare, setShowBatchShare] = useState(false);
  const [unsharedCount, setUnsharedCount] = useState(0);
  
  // Store hooks
  const { startOperation } = useNavigationStore();
  const { currentRace, loadCurrentRace, checkpoints = [] } = useRaceMaintenanceStore();
  const { 
    runners, 
    loading, 
    error,
    initializeCheckpoint,
    loadCheckpointData,
  } = useCheckpointStore();

  // Runners marked off but not yet called in to base station
  const pendingCallInCount = runners.filter(r => r.markOffTime && !r.callInTime).length;
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

  // Compute unshared runner count for Share Batch badge
  useEffect(() => {
    if (!currentRace?.id || !checkpointId) return;
    const raceId = currentRace.id; // capture before async boundary
    const cpNumber = parseInt(checkpointId);
    let cancelled = false;
    async function computeUnshared() {
      const ts = await TransferService.getLastShareTimestamp(raceId, cpNumber);
      const payload = await TransferService.buildPayload(raceId, cpNumber, {
        isDelta: true,
        sinceTimestamp: ts,
      });
      if (!cancelled) setUnsharedCount(payload.count);
    }
    computeUnshared().catch(() => {});
    return () => { cancelled = true; };
  }, [currentRace?.id, checkpointId, runners]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const handleBackToHome = () => {
    onExitAttempt(); // This will trigger the exit confirmation if needed
  };

  const handleExportResults = () => setShowExportModal(true);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Unified page header */}
      <PageHeader
        variant="operational"
        title={currentRace?.name}
        moduleType={MODULE_TYPES.CHECKPOINT}
        moduleLabel={checkpoints.find(cp => cp.number === parseInt(checkpointId))?.name || `Checkpoint ${checkpointId}`}
        onExit={onExitAttempt}
        actions={[
          {
            icon: <ArrowsRightLeftIcon />,
            label: 'Transfer Data',
            onClick: () => navigate(`/checkpoint/${checkpointId}/transfer`),
          },
          {
            icon: <ArrowDownTrayIcon />,
            label: 'Export Results',
            onClick: handleExportResults,
          },
        ]}
      />

      {/* Role toggle pill */}
      <div className="flex justify-center py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="inline-flex rounded-full border border-gray-300 dark:border-gray-600 overflow-hidden text-sm font-medium">
          <button
            onClick={() => setRole('marker')}
            className={`px-5 py-1.5 transition-colors ${
              role === 'marker'
                ? 'bg-navy-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Marker
          </button>
          <button
            onClick={() => setRole('radio')}
            className={`px-5 py-1.5 transition-colors ${
              role === 'radio'
                ? 'bg-navy-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Radio Operator
          </button>
        </div>
      </div>

      {role === 'marker' ? (
        <>
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
              {tab.id === 'callout' ? (
                <span className="flex items-center gap-2">
                  Callout Sheet
                  {pendingCallInCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full">
                      {pendingCallInCount}
                    </span>
                  )}
                </span>
              ) : tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main content — bottom padding prevents overlap with mobile tab bar + QuickEntryBar */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-40 md:pb-6" data-screenshot-target>
        {activeTab === 'mark-off' && (
          <div className="space-y-4">
            <RunnerGrid onRunnerUpdate={() => setHasUnsavedChanges(true)} />
          </div>
        )}
        {activeTab === 'callout' && <CalloutSheet />}
        {activeTab === 'overview' && <RunnerOverview runners={runners} />}
      </main>

      {/* QuickEntryBar — sticky above mobile tab bar, inline on desktop */}
      {activeTab === 'mark-off' && (
        <div className="fixed bottom-[56px] left-0 right-0 z-20 md:static md:bottom-auto md:z-auto md:max-w-7xl md:w-full md:mx-auto md:px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 shadow-lg md:shadow-none">
          <QuickEntryBar />
        </div>
      )}

      {/* Share Batch FAB — Marker mode */}
      <button
        onClick={() => setShowBatchShare(true)}
        className="fixed bottom-[110px] right-4 z-30 md:bottom-6 md:right-6 flex items-center gap-2 px-4 py-2.5 rounded-full bg-navy-600 hover:bg-navy-700 text-white shadow-lg font-medium text-sm transition-colors"
        aria-label="Share batch"
      >
        <QrCodeIcon className="w-5 h-5" />
        Share Batch
        {unsharedCount > 0 && (
          <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full">
            {unsharedCount}
          </span>
        )}
      </button>

      <BatchShareModal
        isOpen={showBatchShare}
        raceId={currentRace?.id}
        checkpointNumber={parseInt(checkpointId)}
        onClose={() => setShowBatchShare(false)}
      />
      </>
      ) : (
        <RadioOperatorView
          raceId={currentRace?.id}
          checkpointNumber={parseInt(checkpointId)}
        />
      )}

      <ExportCheckpointResultsModal
        isOpen={showExportModal}
        raceId={currentRace?.id}
        checkpointNumber={parseInt(checkpointId)}
        checkpointName={checkpoints.find(cp => cp.number === parseInt(checkpointId))?.name || `Checkpoint ${checkpointId}`}
        raceName={currentRace?.name ?? ''}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
};

// Wrap with operation exit handling
export default withOperationExit(CheckpointView);
