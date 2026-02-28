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
import SettingsModal from '../components/Settings/SettingsModal';
import HelpDialog from '../modules/base-operations/components/HelpDialog';

const TABS = [
  { id: 'data-entry', label: 'Data Entry' },
  { id: 'overview', label: 'Overview' },
  { id: 'reports', label: 'Reports' },
];

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
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <Header
          title="Base Station Operations"
          stats={stats || { finished: 0, active: 0 }}
          onExit={handleExit}
          onOpenSettings={handleOpenSettings}
          onOpenHelp={handleOpenHelp}
        />

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          {/* Tab Navigation */}
          <nav aria-label="View navigation" className="mb-6">
            <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700" role="tablist">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  aria-pressed={activeTab === tab.id}
                  aria-controls={`tabpanel-${tab.id}`}
                  aria-label={tab.label}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors
                    ${activeTab === tab.id
                      ? 'bg-white dark:bg-gray-800 border border-b-white dark:border-gray-700 text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Tab Content */}
          <div
            role="tabpanel"
            id={`tabpanel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            className="space-y-6"
          >
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
