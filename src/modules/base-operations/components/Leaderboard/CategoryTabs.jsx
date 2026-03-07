import React from 'react';
import PropTypes from 'prop-types';

/**
 * Generic tab switcher for leaderboard categories (gender or wave).
 * Uses render-prop pattern: children is a function receiving the active tab key.
 *
 * Props:
 *   tabs        {Array<{key, label, count}>}
 *   activeTab   {string}
 *   onTabChange {(key: string) => void}
 *   children    {(activeKey: string) => ReactNode}
 */
export default function CategoryTabs({ tabs, activeTab, onTabChange, children }) {
  return (
    <div>
      <div role="tablist" className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls={`tabpanel-${tab.key}`}
            onClick={() => onTabChange(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors min-w-[44px] min-h-[44px]
              ${activeTab === tab.key
                ? 'border-navy-600 text-navy-700 dark:text-navy-300'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
          >
            {tab.label}
            <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium
              ${activeTab === tab.key
                ? 'bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="pt-2"
      >
        {children(activeTab)}
      </div>
    </div>
  );
}

CategoryTabs.propTypes = {
  tabs: PropTypes.arrayOf(PropTypes.shape({ key: PropTypes.string, label: PropTypes.string, count: PropTypes.number })).isRequired,
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  children: PropTypes.func.isRequired,
};
