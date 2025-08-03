import React, { useState, useEffect } from 'react';
import { useRaceStore } from '../../store/useRaceStore.js';
import { FONT_SIZE_OPTIONS, RUNNER_STATUSES } from '../../types/index.js';

const SettingsModal = ({ isOpen, onClose }) => {
  const { settings, updateSettings, clearAllData } = useRaceStore();
  
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings, isOpen]);

  useEffect(() => {
    // Apply font size changes immediately for preview
    document.documentElement.style.setProperty(
      '--font-size-multiplier', 
      localSettings.fontSize.toString()
    );
  }, [localSettings.fontSize]);

  useEffect(() => {
    // Apply dark mode changes immediately for preview
    if (localSettings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [localSettings.darkMode]);

  const handleSettingChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleStatusColorChange = (status, color) => {
    setLocalSettings(prev => ({
      ...prev,
      statusColors: {
        ...prev.statusColors,
        [status]: color
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateSettings(localSettings);
      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleCancel = () => {
    // Revert changes
    setLocalSettings(settings);
    setHasChanges(false);
    
    // Revert visual changes
    document.documentElement.style.setProperty(
      '--font-size-multiplier', 
      settings.fontSize.toString()
    );
    
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    onClose();
  };

  const resetToDefaults = () => {
    const defaultSettings = {
      darkMode: false,
      fontSize: 1.0,
      statusColors: {
        'not-started': '#9ca3af',
        'passed': '#10b981',
        'non-starter': '#ef4444',
        'dnf': '#f59e0b'
      },
      runnerViewMode: 'grid',
      groupSize: 50
    };
    
    setLocalSettings(defaultSettings);
    setHasChanges(true);
  };

  const handleClearDatabase = () => {
    setShowClearConfirm(true);
  };

  const confirmClearDatabase = async () => {
    if (confirmText === 'CLEAR') {
      try {
        await clearAllData();
        setShowClearConfirm(false);
        setConfirmText('');
        onClose();
        // It's a good practice to reload the page to ensure a full reset
        window.location.reload();
      } catch (error) {
        console.error('Failed to clear database:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Settings
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Appearance */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Appearance
            </h3>
            
            {/* Dark Mode */}
            <div className="flex items-center justify-between py-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Dark Mode
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Switch between light and dark themes
                </p>
              </div>
              <button
                onClick={() => handleSettingChange('darkMode', !localSettings.darkMode)}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out ${
                  localSettings.darkMode ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
                    localSettings.darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Font Size */}
            <div className="py-3">
              <label htmlFor="font-size" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Font Size
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Adjust the application-wide font size
              </p>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  id="font-size"
                  min="0.8"
                  max="1.5"
                  step="0.1"
                  value={localSettings.fontSize}
                  onChange={(e) => handleSettingChange('fontSize', parseFloat(e.target.value))}
                  className="w-full"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {Math.round(localSettings.fontSize * 100)}%
                </span>
              </div>
            </div>

            {/* Status Colors */}
            <div className="py-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Status Colors
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Customize the colors for each runner status
              </p>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(localSettings.statusColors).map(([status, color]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                      {status.replace('-', ' ')}
                    </span>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => handleStatusColorChange(status, e.target.value)}
                      className="w-8 h-8 rounded border-none cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-red-600 dark:text-red-500 mb-4">
              Danger Zone
            </h3>
            
            {/* Clear Database */}
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-red-800 dark:text-red-300">
                    Clear Database
                  </h4>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    This will permanently delete all races, runners, and settings. This action cannot be undone.
                  </p>
                </div>
                <button
                  onClick={handleClearDatabase}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm"
                >
                  Clear Database
                </button>
              </div>

              {showClearConfirm && (
                <div className="mt-4">
                  <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                    To confirm, please type <strong>CLEAR</strong> in the box below.
                  </p>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="w-full p-2 border border-red-300 rounded bg-white dark:bg-gray-700 dark:text-white"
                    placeholder="CLEAR"
                  />
                  <button
                    onClick={confirmClearDatabase}
                    disabled={confirmText !== 'CLEAR'}
                    className="mt-2 w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded disabled:bg-red-400 disabled:cursor-not-allowed"
                  >
                    Confirm Clear Database
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={resetToDefaults}
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            Reset to Defaults
          </button>
          <div>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="ml-3 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
