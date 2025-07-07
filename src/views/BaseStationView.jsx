import React, { useState } from 'react';
import DataEntry from '../components/BaseStation/DataEntry.jsx';
import RunnerOverview from '../components/Shared/RunnerOverview.jsx';

const BaseStationView = () => {
  const [activeTab, setActiveTab] = useState('data-entry');

  const tabs = [
    { id: 'data-entry', label: 'Data Entry', component: DataEntry },
    { id: 'overview', label: 'Race Overview', component: RunnerOverview }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || DataEntry;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
        <ActiveComponent />
      </div>
    </div>
  );
};

export default BaseStationView;
