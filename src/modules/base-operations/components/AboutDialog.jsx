import React from 'react';
import PropTypes from 'prop-types';

/**
 * AboutDialog - Display application information and credits
 * 
 * Features:
 * - Version information
 * - Credits and acknowledgments
 * - License details
 * - System information
 */

const APP_VERSION = '3.0.0';
const BUILD_DATE = '2024';
const LICENSE = 'MIT License';

const AboutDialog = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              About RaceTracker Pro
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Version {APP_VERSION}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Application Info */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Application Information
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Version</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{APP_VERSION}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Build Date</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{BUILD_DATE}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">License</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{LICENSE}</span>
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Key Features
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Base Station Mode
                </h4>
                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <li>• Real-time runner tracking</li>
                  <li>• Status management</li>
                  <li>• Comprehensive reporting</li>
                  <li>• Data backup & restore</li>
                </ul>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Checkpoint Mode
                </h4>
                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <li>• Quick data entry</li>
                  <li>• Offline operation</li>
                  <li>• Auto-sync when online</li>
                  <li>• Resource management</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Credits */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Credits
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    Development Team
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Built with ❤️ by the RaceTracker Pro team
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    Open Source Libraries
                  </h4>
                  <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                    <li>• React - UI Framework</li>
                    <li>• Zustand - State Management</li>
                    <li>• Dexie.js - IndexedDB Wrapper</li>
                    <li>• TailwindCSS - Styling</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Legal
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                © {BUILD_DATE} RaceTracker Pro. All rights reserved.
                Licensed under the {LICENSE}. This software is provided "as is",
                without warranty of any kind.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

AboutDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default AboutDialog;
