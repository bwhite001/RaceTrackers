import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useHotkeys } from '../../../shared/components/HotkeysProvider';

/**
 * HelpDialog - Comprehensive help system and documentation
 * 
 * Features:
 * - Keyboard shortcuts reference
 * - Feature documentation
 * - Quick start guide
 * - Troubleshooting tips
 * - Context-sensitive help
 */

const HELP_SECTIONS = {
  quickStart: {
    label: 'Quick Start',
    icon: (
      <svg className="w-5 h-5" role="img" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
      </svg>
    )
  },
  dataEntry: {
    label: 'Data Entry',
    icon: (
      <svg className="w-5 h-5" role="img" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z" clipRule="evenodd" />
      </svg>
    )
  },
  runnerStatus: {
    label: 'Runner Status',
    icon: (
      <svg className="w-5 h-5" role="img" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    )
  },
  reports: {
    label: 'Reports',
    icon: (
      <svg className="w-5 h-5" role="img" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" />
      </svg>
    )
  },
  backup: {
    label: 'Backup & Restore',
    icon: (
      <svg className="w-5 h-5" role="img" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
      </svg>
    )
  },
  troubleshooting: {
    label: 'Troubleshooting',
    icon: (
      <svg className="w-5 h-5" role="img" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    )
  }
};

const HelpDialog = ({ isOpen, onClose, initialSection = 'quickStart' }) => {
  const [activeSection, setActiveSection] = useState(initialSection);
  const { hotkeys } = useHotkeys();

  if (!isOpen) return null;

  const renderHotkeysSection = (category) => {
    const categoryHotkeys = Object.entries(hotkeys).filter(([_, config]) => config.category === category);
    if (categoryHotkeys.length === 0) return null;

    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          {category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
        </h4>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-2">
          {categoryHotkeys.map(([key, { description }]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {description}
              </span>
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                {key.split('+').map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(' + ')}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'quickStart':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Getting Started
            </h3>
            <div className="prose dark:prose-invert">
              <ol className="list-decimal pl-4 space-y-2">
                <li>Select your operation mode (Base Station or Checkpoint)</li>
                <li>Enter runner numbers as they pass checkpoints</li>
                <li>Use hotkeys for quick data entry (Alt+B for bulk entry)</li>
                <li>Monitor missing runners and out list</li>
                <li>Generate reports as needed</li>
              </ol>
            </div>
            {renderHotkeysSection('navigation')}
          </div>
        );

      case 'dataEntry':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Data Entry Guide
            </h3>
            <div className="prose dark:prose-invert">
              <h4>Single Entry</h4>
              <ul className="list-disc pl-4">
                <li>Enter runner number in the input field</li>
                <li>Press Enter or click "Mark"</li>
                <li>Time is automatically recorded</li>
              </ul>

              <h4 className="mt-4">Bulk Entry</h4>
              <ul className="list-disc pl-4">
                <li>Switch to bulk mode for groups of runners</li>
                <li>Enter multiple numbers (comma or space separated)</li>
                <li>Set common time for the group</li>
                <li>Preview before submitting</li>
              </ul>

              <h4 className="mt-4">Tips</h4>
              <ul className="list-disc pl-4">
                <li>Use number ranges (e.g., "100-105")</li>
                <li>Press "Now" for current time</li>
                <li>Add notes for special cases</li>
              </ul>
            </div>
            {renderHotkeysSection('dataEntry')}
          </div>
        );

      case 'runnerStatus':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Managing Runner Status
            </h3>
            <div className="prose dark:prose-invert">
              <h4>Status Types</h4>
              <ul className="list-disc pl-4">
                <li><strong>Not Started:</strong> Runner hasn't begun</li>
                <li><strong>Active:</strong> Currently on course</li>
                <li><strong>Passed:</strong> Cleared checkpoint</li>
                <li><strong>Withdrawn:</strong> Voluntarily stopped</li>
                <li><strong>Vet Out:</strong> Failed veterinary check</li>
                <li><strong>DNF:</strong> Did not finish</li>
              </ul>

              <h4 className="mt-4">Changing Status</h4>
              <ul className="list-disc pl-4">
                <li>Use appropriate dialog for status changes</li>
                <li>Add required notes/reasons</li>
                <li>Status changes are logged for audit</li>
              </ul>
            </div>
            {renderHotkeysSection('operations')}
          </div>
        );

      case 'reports':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Reports & Lists
            </h3>
            <div className="prose dark:prose-invert">
              <h4>Available Reports</h4>
              <ul className="list-disc pl-4">
                <li><strong>Missing Numbers:</strong> Not checked in</li>
                <li><strong>Out List:</strong> Withdrawn/Vet out</li>
                <li><strong>Checkpoint Log:</strong> All crossings</li>
                <li><strong>Summary Report:</strong> Overall stats</li>
              </ul>

              <h4 className="mt-4">Export Options</h4>
              <ul className="list-disc pl-4">
                <li>CSV for spreadsheets</li>
                <li>Excel with formatting</li>
                <li>HTML for web display</li>
              </ul>
            </div>
            {renderHotkeysSection('reports')}
          </div>
        );

      case 'backup':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Backup & Restore
            </h3>
            <div className="prose dark:prose-invert">
              <h4>Backup Types</h4>
              <ul className="list-disc pl-4">
                <li><strong>Local:</strong> Browser storage</li>
                <li><strong>External:</strong> File download</li>
                <li><strong>Auto:</strong> Every 30 minutes</li>
              </ul>

              <h4 className="mt-4">Best Practices</h4>
              <ul className="list-disc pl-4">
                <li>Regular backups during event</li>
                <li>Export to external storage</li>
                <li>Verify backups before restore</li>
                <li>Keep multiple backup points</li>
              </ul>
            </div>
            {renderHotkeysSection('housekeeping')}
          </div>
        );

      case 'troubleshooting':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Troubleshooting Guide
            </h3>
            <div className="prose dark:prose-invert">
              <h4>Common Issues</h4>
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium">Data Not Saving</h5>
                  <ul className="list-disc pl-4">
                    <li>Check internet connection</li>
                    <li>Verify browser storage space</li>
                    <li>Try clearing cache</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium">Duplicate Entries</h5>
                  <ul className="list-disc pl-4">
                    <li>Use duplicate resolution dialog</li>
                    <li>Check for typos in numbers</li>
                    <li>Verify checkpoint selection</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium">Sync Issues</h5>
                  <ul className="list-disc pl-4">
                    <li>Check network connection</li>
                    <li>Verify device time settings</li>
                    <li>Try manual sync</li>
                  </ul>
                </div>
              </div>

              <h4 className="mt-4">Recovery Steps</h4>
              <ol className="list-decimal pl-4">
                <li>Save any unsaved data</li>
                <li>Export current state</li>
                <li>Refresh application</li>
                <li>Restore from backup if needed</li>
              </ol>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Help & Documentation
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-navy-500 rounded-lg p-2 touch-target"
            aria-label="Close"
            title="Close (Esc)"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex h-[calc(90vh-129px)]">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <nav className="p-4 space-y-1">
              {Object.entries(HELP_SECTIONS).map(([key, { label, icon }]) => (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-left ${
                    activeSection === key
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900/50'
                  }`}
                >
                  <span className={activeSection === key ? 'text-primary-500' : 'text-gray-400'}>
                    {icon}
                  </span>
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderContent()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Press Alt + H to open help anytime
          </div>
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Close Help
          </button>
        </div>
      </div>
    </div>
  );
};

HelpDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialSection: PropTypes.oneOf(Object.keys(HELP_SECTIONS))
};

export default HelpDialog;
