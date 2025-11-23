import React, { memo, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import useDeviceDetection from '../../shared/hooks/useDeviceDetection';
import { HOTKEYS } from '../../types';
import ImportExportModal from '../ImportExport/ImportExportModal';

/**
 * Header Component
 * Displays race information and navigation controls at the top of the base station view
 */
const Header = memo(({ 
  title, 
  onExit, 
  stats, 
  lastSync,
  onOpenSettings,
  onOpenHelp 
}) => {
  const navigate = useNavigate();
  const { isDesktop } = useDeviceDetection();
  const [showImportExportModal, setShowImportExportModal] = useState(false);

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      navigate('/');
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Title and Stats */}
          <div className="flex items-center space-x-4">
            {/* Title */}
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {title}
            </h1>

            {/* Quick Stats */}
            <div className="hidden sm:flex items-center space-x-4 text-sm">
              <div className="px-2 py-1 bg-green-100 dark:bg-green-900 rounded">
                <span className="font-medium text-green-800 dark:text-green-200">
                  Finished: {stats.finished}
                </span>
              </div>
              <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded">
                <span className="font-medium text-blue-800 dark:text-blue-200">
                  Active: {stats.active}
                </span>
              </div>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center space-x-2">
            {/* Import/Export Button */}
            <button
              onClick={() => setShowImportExportModal(true)}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              aria-label="Import/Export"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" 
                />
              </svg>
            </button>
            
            {/* Help Button */}
            <button
              onClick={onOpenHelp}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              aria-label="Help"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              {isDesktop && (
                <span className="ml-1 text-xs">({HOTKEYS.HELP})</span>
              )}
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              aria-label="Settings"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                />
              </svg>
            </button>

            {/* Exit Button */}
            <button
              onClick={handleExit}
              className="ml-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md text-sm font-medium transition-colors"
              aria-label="Exit Base Station"
            >
              Exit
              {isDesktop && (
                <span className="ml-1 text-xs">({HOTKEYS.ESCAPE})</span>
              )}
            </button>
          </div>
        </div>

        {/* Last Sync Info - Mobile Only */}
        <div className="mt-2 sm:hidden text-xs text-gray-500 dark:text-gray-400">
          Last update: {lastSync ? new Date(lastSync).toLocaleTimeString() : 'Never'}
        </div>
      </div>
      
      {/* Import/Export Modal */}
      <ImportExportModal 
        isOpen={showImportExportModal} 
        onClose={() => setShowImportExportModal(false)} 
      />
    </header>
  );
});

Header.propTypes = {
  title: PropTypes.string.isRequired,
  onExit: PropTypes.func,
  stats: PropTypes.shape({
    finished: PropTypes.number.isRequired,
    active: PropTypes.number.isRequired
  }).isRequired,
  lastSync: PropTypes.string,
  onOpenSettings: PropTypes.func.isRequired,
  onOpenHelp: PropTypes.func.isRequired
};

Header.defaultProps = {
  lastSync: null,
  onExit: null
};

// Add display name for debugging
Header.displayName = 'Header';

export default Header;
