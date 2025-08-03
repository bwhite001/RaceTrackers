import React, { useState } from 'react';
import RunnerGrid from '../components/Checkpoint/RunnerGrid.jsx';
import CalloutSheet from '../components/Checkpoint/CalloutSheet.jsx';
import RunnerOverview from '../components/Shared/RunnerOverview.jsx';
import { useRaceStore } from '../store/useRaceStore.js';
import { APP_MODES } from '../types/index.js';

const CheckpointView = () => {
  const { 
    checkpoints, 
    currentCheckpoint, 
    setCurrentCheckpoint, 
    exportIsolatedCheckpointResults,
    raceConfig,
    setMode
  } = useRaceStore();
  
  const [activeTab, setActiveTab] = useState('runners');
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCheckpoint = async () => {
    setIsExporting(true);
    try {
      const exportData = await exportIsolatedCheckpointResults(currentCheckpoint);
      
      // Download as JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      const checkpointName = checkpoints.find(cp => cp.number === currentCheckpoint)?.name || `Checkpoint ${currentCheckpoint}`;
      link.download = `${raceConfig?.name || 'race'}-${checkpointName.replace(/\s+/g, '-')}-checkpoint-results.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export checkpoint results:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const tabs = [
    { id: 'runners', label: 'Runner Tracking', component: RunnerGrid },
    { id: 'callouts', label: 'Callout Sheet', component: CalloutSheet },
    { id: 'overview', label: 'Overview', component: RunnerOverview }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || RunnerGrid;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header with Back Button */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Checkpoint Check-In
        </h1>
        <button
          onClick={() => setMode(APP_MODES.RACE_OVERVIEW)}
          className="btn-secondary"
        >
          ← Back to Race Overview
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[60vh]">
        {activeTab === 'callin' ? (
          <CheckpointCallInPage checkpointNumber={currentCheckpoint} />
        ) : (
          <ActiveComponent />
        )}
      </div>
    </div>
  );
};

export default CheckpointView;
