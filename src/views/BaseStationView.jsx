import React, { useState } from 'react';
import DataEntry from '../components/BaseStation/DataEntry.jsx';
import BaseStationCallInPage from '../components/BaseStation/BaseStationCallInPage.jsx';
import RunnerOverview from '../components/Shared/RunnerOverview.jsx';
import { useRaceStore } from '../store/useRaceStore.js';

const BaseStationView = () => {
  const { exportIsolatedBaseStationResults, raceConfig } = useRaceStore();
  const [activeTab, setActiveTab] = useState('data-entry');
  const [isExporting, setIsExporting] = useState(false);

  const handleExportBaseStation = async () => {
    setIsExporting(true);
    try {
      const exportData = await exportIsolatedBaseStationResults();
      
      // Download as JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${raceConfig?.name || 'race'}-base-station-results.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export base station results:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const tabs = [
    { id: 'data-entry', label: 'Data Entry', component: DataEntry },
    { id: 'callin', label: 'Call-In Page', component: BaseStationCallInPage },
    { id: 'overview', label: 'Race Overview', component: RunnerOverview }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || DataEntry;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
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
          
          <button
            onClick={handleExportBaseStation}
            disabled={isExporting}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 spinner"></div>
                <span>Exporting...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export Results</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[60vh]">
        {activeTab === 'callin' ? (
          <BaseStationCallInPage />
        ) : (
          <ActiveComponent />
        )}
      </div>
    </div>
  );
};

export default BaseStationView;
