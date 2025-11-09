import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useBaseOperationsStore from '../modules/base-operations/store/baseOperationsStore';
import useDeviceDetection from '../shared/hooks/useDeviceDetection';
import { HotkeysProvider, useHotkeysContext } from '../shared/components/HotkeysProvider';
import { HOTKEYS } from '../types';

// Components
import DataEntry from '../components/BaseStation/DataEntry';
import RaceOverview from '../components/BaseStation/RaceOverview';
import ReportsPanel from '../components/BaseStation/ReportsPanel';
import Header from '../components/Layout/Header';
import StatusStrip from '../components/Layout/StatusStrip';
import LoadingSpinner from '../components/Layout/LoadingSpinner';
import ErrorMessage from '../components/Layout/ErrorMessage';

// Tabs configuration
const TABS = {
  DATA_ENTRY: 'data-entry',
  OVERVIEW: 'overview',
  REPORTS: 'reports'
};

/**
 * BaseStationView Component
 * Main container for the base station operations interface
 */
const BaseStationView = () => {
  const navigate = useNavigate();
  const { isDesktop } = useDeviceDetection();
  const [activeTab, setActiveTab] = useState(TABS.DATA_ENTRY);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Get base operations state
  const {
    initialize,
    currentRaceId,
    loading,
    error,
    stats,
    lastSync
  } = useBaseOperationsStore();

  // Initialize base station
  useEffect(() => {
    const setupBaseStation = async () => {
      try {
        await initialize();
      } catch (error) {
        console.error('Failed to initialize base station:', error);
      }
    };

    setupBaseStation();
  }, [initialize]);

  // Define hotkeys
  const hotkeys = {
    [HOTKEYS.NEW_ENTRY]: () => setActiveTab(TABS.DATA_ENTRY),
    [HOTKEYS.REPORTS]: () => setActiveTab(TABS.REPORTS),
    [HOTKEYS.TAB_NEXT]: () => handleTabChange('next'),
    [HOTKEYS.TAB_PREV]: () => handleTabChange('prev'),
    [HOTKEYS.ESCAPE]: () => {
      if (activeTab === TABS.DATA_ENTRY) {
        setActiveTab(TABS.OVERVIEW);
      }
    }
  };

  // Handle tab changes
  const handleTabChange = (direction) => {
    const tabValues = Object.values(TABS);
    const currentIndex = tabValues.indexOf(activeTab);
    
    if (direction === 'next') {
      setActiveTab(tabValues[(currentIndex + 1) % tabValues.length]);
    } else {
      setActiveTab(tabValues[(currentIndex - 1 + tabValues.length) % tabValues.length]);
    }
  };

  // Handle exit attempt
  const handleExitAttempt = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      if (!confirmed) return;
    }
    navigate('/');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!currentRaceId) {
    return <ErrorMessage message="No active race selected" />;
  }

  return (
    <HotkeysProvider hotkeys={hotkeys}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <Header
          title="Base Station Operations"
          onExit={handleExitAttempt}
          stats={stats}
          lastSync={lastSync}
        />

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-4" aria-label="Tabs">
              <button
                onClick={() => setActiveTab(TABS.DATA_ENTRY)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === TABS.DATA_ENTRY
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                aria-current={activeTab === TABS.DATA_ENTRY ? 'page' : undefined}
              >
                Data Entry
                {isDesktop && <span className="ml-2 text-xs">({HOTKEYS.NEW_ENTRY})</span>}
              </button>

              <button
                onClick={() => setActiveTab(TABS.OVERVIEW)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === TABS.OVERVIEW
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                aria-current={activeTab === TABS.OVERVIEW ? 'page' : undefined}
              >
                Overview
              </button>

              <button
                onClick={() => setActiveTab(TABS.REPORTS)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === TABS.REPORTS
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                aria-current={activeTab === TABS.REPORTS ? 'page' : undefined}
              >
                Reports
                {isDesktop && <span className="ml-2 text-xs">({HOTKEYS.REPORTS})</span>}
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === TABS.DATA_ENTRY && (
              <DataEntry
                onUnsavedChanges={setHasUnsavedChanges}
              />
            )}

            {activeTab === TABS.OVERVIEW && (
              <RaceOverview />
            )}

            {activeTab === TABS.REPORTS && (
              <ReportsPanel />
            )}
          </div>
        </main>

        {/* Status Strip */}
        <StatusStrip
          stats={stats}
          lastSync={lastSync}
        />
      </div>
    </HotkeysProvider>
  );
};

export default BaseStationView;
