import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { withOperationExit } from '../shared/components/ExitOperationModal';
import HotkeysProvider from '../shared/components/HotkeysProvider';
import useNavigationStore, { MODULE_TYPES } from '../shared/store/navigationStore';
import useBaseOperationsStore from '../modules/base-operations/store/baseOperationsStore';
import useSettingsStore from '../shared/store/settingsStore';
import { HOTKEYS } from '../types';

// Components
import DataEntry from '../components/BaseStation/DataEntry';
import RaceOverview from '../components/BaseStation/RaceOverview';
import ReportsPanel from '../components/BaseStation/ReportsPanel';
import WithdrawalDialog from '../components/BaseStation/WithdrawalDialog';
import LoadingSpinner from '../components/Layout/LoadingSpinner';
import ErrorMessage from '../components/Layout/ErrorMessage';
import Header from '../components/Layout/Header';
import StatusStrip from '../components/Layout/StatusStrip';

/**
 * BaseStationView Component
 * Main view for base station operations
 */
const BaseStationView = ({ onExitAttempt, setHasUnsavedChanges }) => {
  const navigate = useNavigate();
  
  // Store access
  const { currentRaceId, loading, error, stats } = useBaseOperationsStore();
  const { darkMode } = useSettingsStore();

  // Local state
  const [activeTab, setActiveTab] = useState('data-entry');
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false);
  const [withdrawalType, setWithdrawalType] = useState('dnf');

  // Initialize base station
  useEffect(() => {
    if (!currentRaceId) {
      navigate('/');
    }
  }, [currentRaceId, navigate]);

  // Handle tab change
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  // Handle withdrawal dialog
  const handleWithdrawal = useCallback((type) => {
    setWithdrawalType(type);
    setShowWithdrawalDialog(true);
  }, []);

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

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <HotkeysProvider hotkeys={hotkeys}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <Header
          title="Base Station Operations"
          stats={stats}
          onTabChange={handleTabChange}
          activeTab={activeTab}
        />

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'data-entry' && (
              <DataEntry
                onWithdrawal={handleWithdrawal}
                onUnsavedChanges={setHasUnsavedChanges}
              />
            )}

            {activeTab === 'overview' && (
              <RaceOverview />
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
      </div>
    </HotkeysProvider>
  );
};

// Wrap with operation exit handling
export default withOperationExit(BaseStationView);
