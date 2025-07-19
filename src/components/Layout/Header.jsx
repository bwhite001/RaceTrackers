import React from 'react';
import useRaceStore from '../../store/useRaceStore.js';
import { APP_MODES } from '../../types/index.js';

const Header = ({ onSettingsClick, onImportExportClick }) => {
  const { raceConfig, mode, setMode, getRunnerCounts } = useRaceStore();
  const counts = getRunnerCounts();

  const getModeTitle = () => {
    switch (mode) {
      case APP_MODES.SETUP:
        return 'Race Setup';
      case APP_MODES.CHECKPOINT:
        return 'Checkpoint Mode';
      case APP_MODES.BASE_STATION:
        return 'Base Station Mode';
      default:
        return 'RaceTracker Pro';
    }
  };
  const getIconBaseUrl = () => {
    return '/'
  }

  const canSwitchMode = () => {
    return raceConfig && mode !== APP_MODES.SETUP;
  };

  const handleBackToSetup = () => {
    setMode(APP_MODES.SETUP);
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Title and race info */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              {/* Back button - show when in race modes */}
              {canSwitchMode() && (
                <button
                  onClick={handleBackToSetup}
                  className="p-2 mr-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Back to Race Setup"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div className="flex-shrink-0">
                <img
                  src={getIconBaseUrl() + 'favicon_io/android-chrome-192x192.png'}
                  alt="WICEN Logo"
                  className="h-10 w-10 mr-3"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {getModeTitle()}
                </h1>
              </div>
              {raceConfig && (
                <div className="ml-4 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                  <span className="hidden sm:inline">
                    {raceConfig.name}
                  </span>
                  <span className="hidden md:inline">
                    {raceConfig.date}
                  </span>
                  <span className="hidden lg:inline">
                    Runners: {raceConfig.minRunner}-{raceConfig.maxRunner}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Center - Mode switcher */}
          {canSwitchMode() && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setMode(APP_MODES.CHECKPOINT)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  mode === APP_MODES.CHECKPOINT
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Checkpoint
              </button>
              <button
                onClick={() => setMode(APP_MODES.BASE_STATION)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  mode === APP_MODES.BASE_STATION
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Base Station
              </button>
            </div>
          )}

          {/* Right side - Stats and actions */}
          <div className="flex items-center space-x-4">
            {/* Runner counts */}
            {raceConfig && mode !== APP_MODES.SETUP && (
              <div className="hidden sm:flex items-center space-x-3 text-sm">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-status-passed"></div>
                  <span className="text-gray-600 dark:text-gray-300">
                    {counts.passed}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-status-not-started"></div>
                  <span className="text-gray-600 dark:text-gray-300">
                    {counts.notStarted}
                  </span>
                </div>
                {counts.nonStarter > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 rounded-full bg-status-non-starter"></div>
                    <span className="text-gray-600 dark:text-gray-300">
                      {counts.nonStarter}
                    </span>
                  </div>
                )}
                {counts.dnf > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 rounded-full bg-status-dnf"></div>
                    <span className="text-gray-600 dark:text-gray-300">
                      {counts.dnf}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center space-x-2">
              {raceConfig && (
                <button
                  onClick={onImportExportClick}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  title="Import/Export"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </button>
              )}
              
              <button
                onClick={onSettingsClick}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                title="Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile race info */}
      {raceConfig && (
        <div className="sm:hidden px-4 pb-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
            <span>{raceConfig.name}</span>
            <span>{raceConfig.date}</span>
          </div>
          <div className="flex justify-between items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span>Runners: {raceConfig.minRunner}-{raceConfig.maxRunner}</span>
            <div className="flex items-center space-x-2">
              <span className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-status-passed mr-1"></div>
                {counts.passed}
              </span>
              <span className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-status-not-started mr-1"></div>
                {counts.notStarted}
              </span>
              {counts.nonStarter > 0 && (
                <span className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-status-non-starter mr-1"></div>
                  {counts.nonStarter}
                </span>
              )}
              {counts.dnf > 0 && (
                <span className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-status-dnf mr-1"></div>
                  {counts.dnf}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
