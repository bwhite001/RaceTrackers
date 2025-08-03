import React, { useState, useEffect } from 'react';
import { useRaceStore } from './store/useRaceStore.js';
import { APP_MODES } from './types/index.js';

// Layout Components
import Header from './components/Layout/Header.jsx';
import LoadingSpinner from './components/Layout/LoadingSpinner.jsx';
import ErrorMessage from './components/Layout/ErrorMessage.jsx';

// View Components
import Homepage from './components/Home/Homepage.jsx';
import RaceConfig from './components/Setup/RaceConfig.jsx';
import CheckpointView from './views/CheckpointView.jsx';
import BaseStationView from './views/BaseStationView.jsx';
import RaceOverview from './views/RaceOverview.jsx';

// Modal Components
import SettingsModal from './components/Settings/SettingsModal.jsx';
import ImportExportModal from './components/ImportExport/ImportExportModal.jsx';

function App() {
  const { 
    mode, 
    raceConfig, 
    isLoading, 
    error, 
    clearError, 
    loadCurrentRace, 
    loadSettings,
    settings 
  } = useRaceStore();

  const [showSettings, setShowSettings] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize app on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load settings first
        await loadSettings();
        
        // Load current race if exists
        await loadCurrentRace();
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, [loadCurrentRace, loadSettings]);

  // Apply settings to document
  useEffect(() => {
    if (settings) {
      // Apply font size
      document.documentElement.style.setProperty(
        '--font-size-multiplier', 
        settings.fontSize.toString()
      );

      // Apply dark mode
      if (settings.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // Apply status colors as CSS custom properties
      Object.entries(settings.statusColors).forEach(([status, color]) => {
        document.documentElement.style.setProperty(
          `--status-${status}`, 
          color
        );
      });
    }
  }, [settings]);

  // Show loading spinner during initialization
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Initializing RaceTracker Pro..." />
      </div>
    );
  }

  // Determine which view to show
  const getCurrentView = () => {
    switch (mode) {
      case APP_MODES.RACE_CONFIG:
        return <RaceConfig />;
      case APP_MODES.CHECKPOINT:
        return <CheckpointView />;
      case APP_MODES.BASE_STATION:
        return <BaseStationView />;
      case APP_MODES.RACE_OVERVIEW:
        return <RaceOverview />;
      case APP_MODES.SETUP:
      default:
        return <Homepage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header 
        onSettingsClick={() => setShowSettings(true)}
        onImportExportClick={() => setShowImportExport(true)}
      />

      {/* Main Content */}
      <main className="pb-8">
        {/* Global Error Message */}
        {error && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <ErrorMessage 
              error={error} 
              onDismiss={clearError}
            />
          </div>
        )}

        {/* Global Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
              <LoadingSpinner message="Processing..." />
            </div>
          </div>
        )}

        {/* Current View */}
        {getCurrentView()}
      </main>

      {/* Modals */}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
      
      <ImportExportModal 
        isOpen={showImportExport} 
        onClose={() => setShowImportExport(false)} 
      />

      {/* PWA Install Prompt (if supported) */}
      <PWAInstallPrompt />
    </div>
  );
}

// PWA Install Prompt Component
const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install prompt
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      // Hide the install prompt
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Don't clear deferredPrompt in case user changes mind
  };

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-primary-600 text-white rounded-lg shadow-lg p-4 z-50 max-w-sm mx-auto">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium">Install RaceTracker Pro</h3>
          <p className="text-xs opacity-90 mt-1">
            Install this app on your device for offline access and better performance.
          </p>
          <div className="flex space-x-2 mt-3">
            <button
              onClick={handleInstallClick}
              className="bg-white text-primary-600 px-3 py-1 rounded text-xs font-medium hover:bg-gray-100 transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="text-white px-3 py-1 rounded text-xs hover:bg-primary-700 transition-colors"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default App;
