import React, { useState, useEffect } from 'react';
import useRaceStore from '../../store/useRaceStore.js';
import { FONT_SIZE_OPTIONS, RUNNER_STATUSES } from '../../types/index.js';

const SettingsModal = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useRaceStore();
  
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

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
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localSettings.darkMode ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localSettings.darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Font Size */}
            <div className="py-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                Font Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {FONT_SIZE_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleSettingChange('fontSize', option.value)}
                    className={`p-2 text-sm rounded-md border transition-colors ${
                      localSettings.fontSize === option.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Changes apply immediately for preview
              </p>
            </div>
          </div>

          {/* Runner Display */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Runner Display
            </h3>

            {/* View Mode */}
            <div className="py-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                Default View Mode
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleSettingChange('runnerViewMode', 'grid')}
                  className={`flex-1 p-3 rounded-md border transition-colors ${
                    localSettings.runnerViewMode === 'grid'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span className="text-sm">Grid</span>
                  </div>
                </button>
                <button
                  onClick={() => handleSettingChange('runnerViewMode', 'list')}
                  className={`flex-1 p-3 rounded-md border transition-colors ${
                    localSettings.runnerViewMode === 'list'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">List</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Group Size */}
            <div className="py-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                Default Group Size
              </label>
              <select
                value={localSettings.groupSize}
                onChange={(e) => handleSettingChange('groupSize', parseInt(e.target.value))}
                className="form-input"
              >
                <option value={10}>10 runners</option>
                <option value={25}>25 runners</option>
                <option value={50}>50 runners</option>
                <option value={100}>100 runners</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                For large runner ranges, group runners for easier navigation
              </p>
            </div>
          </div>

          {/* Status Colors */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Status Colors
            </h3>
            <div className="space-y-3">
              {Object.entries(RUNNER_STATUSES).map(([key, status]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: localSettings.statusColors[status] }}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {status.replace('-', ' ')}
                    </span>
                  </div>
                  <input
                    type="color"
                    value={localSettings.statusColors[status]}
                    onChange={(e) => handleStatusColorChange(status, e.target.value)}
                    className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={resetToDefaults}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Reset to Defaults
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
