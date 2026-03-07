import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { withOperationExit } from '../shared/components/ExitOperationModal';
import useNavigationStore, { MODULE_TYPES } from '../shared/store/navigationStore';
import useDualCheckpointStore from '../modules/checkpoint-operations/store/useDualCheckpointStore';
import useRaceMaintenanceStore, { raceMaintenanceStore } from '../modules/race-maintenance/store/raceMaintenanceStore';
import { useRaceStore } from '../store/useRaceStore.js';
import PageHeader from '../shared/components/PageHeader';
import DualRunnerGrid from '../components/Checkpoint/DualRunnerGrid';
import DualQuickEntryBar from '../components/Checkpoint/DualQuickEntryBar';
import DualCalloutSheet from '../components/Checkpoint/DualCalloutSheet';
import LinkedCheckpointOverview from '../components/Checkpoint/LinkedCheckpointOverview';
import LoadingSpinner from '../components/Layout/LoadingSpinner';
import ErrorMessage from '../components/Layout/ErrorMessage';

const TABS = [
  { id: 'mark-off', label: 'Mark Off' },
  { id: 'callout', label: 'Callout Sheet' },
  { id: 'overview', label: 'Overview' },
];

const DualCheckpointView = ({ onExitAttempt, setHasUnsavedChanges }) => {
  const { primaryCpId, secondaryCpId } = useParams();
  const navigate = useNavigate();
  const primaryNum = parseInt(primaryCpId, 10);
  const secondaryNum = parseInt(secondaryCpId, 10);

  const [activeTab, setActiveTab] = useState('mark-off');
  const { startOperation } = useNavigationStore();
  const { currentRace, loadCurrentRace, checkpoints = [] } = useRaceMaintenanceStore();
  const {
    activeTab: activeCpTab,
    setActiveTab: setActiveCpTab,
    initialize,
    primaryCpNumber,
    secondaryCpNumber,
    loading,
    error,
    secondaryRunners,
    primaryRunners,
  } = useDualCheckpointStore();
  const { loadRace: loadRaceIntoLegacyStore } = useRaceStore();

  useEffect(() => {
    const init = async () => {
      try {
        if (!currentRace) await loadCurrentRace();
        const freshRace = raceMaintenanceStore.getState().currentRace;
        if (freshRace) {
          startOperation(MODULE_TYPES.CHECKPOINT);
          await initialize(freshRace.id, primaryNum, secondaryNum);
          await loadRaceIntoLegacyStore(freshRace.id);
        } else {
          navigate('/', { replace: true, state: { error: 'No active race found.' } });
        }
      } catch (err) {
        console.error('Error initializing dual checkpoint:', err);
      }
    };
    init();
  }, [primaryNum, secondaryNum]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setHasUnsavedChanges(false);
  }, [setHasUnsavedChanges]);

  if (loading && !primaryCpNumber) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const getCpName = (num) => checkpoints.find(cp => cp.number === num)?.name || `CP${num}`;
  const primaryName = getCpName(primaryNum);
  const secondaryName = getCpName(secondaryNum);

  const pendingPrimary = primaryRunners.filter(r => r.markOffTime && !r.callInTime).length;
  const pendingSecondary = secondaryRunners.filter(r => r.markOffTime && !r.callInTime).length;
  const totalPending = pendingPrimary + pendingSecondary;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <PageHeader
        variant="operational"
        title={currentRace?.name}
        moduleType={MODULE_TYPES.CHECKPOINT}
        moduleLabel={`🔗 ${primaryName} & ${secondaryName}`}
        onExit={onExitAttempt}
      />

      {/* CP switcher — which checkpoint is active for mark/callout operations */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-[64px] z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 py-2">
          <button
            onClick={() => setActiveCpTab('primary')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-colors ${
              activeCpTab === 'primary'
                ? 'bg-navy-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            CP{primaryNum} — {primaryName}
          </button>
          <button
            onClick={() => setActiveCpTab('secondary')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-colors ${
              activeCpTab === 'secondary'
                ? 'bg-navy-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            CP{secondaryNum} — {secondaryName}
          </button>
        </div>
      </div>

      {/* Page tabs (Mark Off / Callout / Overview) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30
                   md:sticky md:top-[112px] md:bottom-auto md:z-10
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
              {tab.id === 'callout' && totalPending > 0 ? (
                <span className="flex items-center gap-2">
                  Callout Sheet
                  <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full">
                    {totalPending}
                  </span>
                </span>
              ) : tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-40 md:pb-6" data-screenshot-target>
        {activeTab === 'mark-off' && (
          <div className="space-y-4">
            <DualRunnerGrid />
          </div>
        )}
        {activeTab === 'callout' && <DualCalloutSheet />}
        {activeTab === 'overview' && <LinkedCheckpointOverview />}
      </main>

      {activeTab === 'mark-off' && (
        <div className="fixed bottom-[56px] left-0 right-0 z-20 md:static md:bottom-auto md:z-auto md:max-w-7xl md:w-full md:mx-auto md:px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 shadow-lg md:shadow-none">
          <DualQuickEntryBar />
        </div>
      )}
    </div>
  );
};

export default withOperationExit(DualCheckpointView);
