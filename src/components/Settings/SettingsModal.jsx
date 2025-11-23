import React, { useState, useEffect } from 'react';
import { useRaceStore } from '../../store/useRaceStore.js';
import { 
  VIEW_MODES, 
  CONTRAST_MODES, 
  GROUP_SIZES, 
  FONT_SIZE,
  DEFAULT_SETTINGS 
} from '../../types/index.js';
import {
  applyThemeToDOM,
  applyFontSizeToDOM,
  applyContrastToDOM,
  applyReducedMotionToDOM,
  applyTouchOptimizedToDOM,
  applyCompactModeToDOM,
  applyStatusColorsToDOM
} from '../../utils/settingsDOM.js';

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

  // Apply changes immediately for preview
  useEffect(() => {
    if (isOpen) {
      applyFontSizeToDOM(localSettings.fontSize);
      applyThemeToDOM(localSettings.darkMode);
      applyContrastToDOM(localSettings.highContrastMode ? 'high' : 'normal');
      applyReducedMotionToDOM(localSettings.reducedMotion);
      applyTouchOptimizedToDOM(localSettings.touchOptimized);
      applyCompactModeToDOM(localSettings.compactMode);
      applyStatusColorsToDOM(localSettings.statusColors);
    }
  }, [
    localSettings.fontSize,
    localSettings.darkMode,
    localSettings.highContrastMode,
    localSettings.reducedMotion,
    localSettings.touchOptimized,
    localSettings.compactMode,
    localSettings.statusColors,
    isOpen
  ]);

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
    applyFontSizeToDOM(settings.fontSize);
    applyThemeToDOM(settings.darkMode);
    applyContrastToDOM(settings.highContrastMode ? 'high' : 'normal');
    applyReducedMotionToDOM(settings.reducedMotion);
    applyTouchOptimizedToDOM(settings.touchOptimized);
    applyCompactModeToDOM(settings.compactMode);
    applyStatusColorsToDOM(settings.statusColors);
    
    onClose();
  };

  const resetToDefaults = () => {
    setLocalSettings(DEFAULT_SETTINGS);
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
        window.location.reload();
      } catch (error) {
        console.error('Failed to clear database:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Settings
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 touch-target"
            aria-label="Close settings"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Appearance Section */}
          <section>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              🎨 Appearance
            </h3>
            
            {/* Dark Mode */}
            <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-3">
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
                className={`relative inline-flex items-center h-6 rounded-md w-11 transition-colors duration-200 ease-in-out touch-target ${
                  localSettings.darkMode ? 'bg-green-500' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={localSettings.darkMode}
              >
                <span
                  className={`inline-block w-4 h-4 transform bg-white rounded transition-transform duration-200 ease-in-out ${
                    localSettings.darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* High Contrast Mode */}
            <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  High Contrast Mode
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Increase contrast for better visibility
                </p>
              </div>
              <button
                onClick={() => handleSettingChange('highContrastMode', !localSettings.highContrastMode)}
                className={`relative inline-flex items-center h-6 rounded-md w-11 transition-colors duration-200 ease-in-out touch-target ${
                  localSettings.highContrastMode ? 'bg-green-500' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={localSettings.highContrastMode}
              >
                <span
                  className={`inline-block w-4 h-4 transform bg-white rounded transition-transform duration-200 ease-in-out ${
                    localSettings.highContrastMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Reduced Motion */}
            <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reduce Motion
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Minimize animations and transitions
                </p>
              </div>
              <button
                onClick={() => handleSettingChange('reducedMotion', !localSettings.reducedMotion)}
                className={`relative inline-flex items-center h-6 rounded-md w-11 transition-colors duration-200 ease-in-out touch-target ${
                  localSettings.reducedMotion ? 'bg-green-500' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={localSettings.reducedMotion}
              >
                <span
                  className={`inline-block w-4 h-4 transform bg-white rounded transition-transform duration-200 ease-in-out ${
                    localSettings.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Font Size */}
            <div className="py-3 px-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="font-size" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Font Size
                </label>
                <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {Math.round(localSettings.fontSize * 100)}%
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Adjust the application-wide font size
              </p>
              <input
                type="range"
                id="font-size"
                min={FONT_SIZE.MIN}
                max={FONT_SIZE.MAX}
                step={FONT_SIZE.STEP}
                value={localSettings.fontSize}
                onChange={(e) => handleSettingChange('fontSize', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </section>

          {/* Display & Interaction Section */}
          <section>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              📱 Display & Interaction
            </h3>

            {/* Touch Optimization */}
            <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Touch Optimization
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Larger tap targets for touch devices (48px minimum)
                </p>
              </div>
              <button
                onClick={() => handleSettingChange('touchOptimized', !localSettings.touchOptimized)}
                className={`relative inline-flex items-center h-6 rounded-md w-11 transition-colors duration-200 ease-in-out touch-target ${
                  localSettings.touchOptimized ? 'bg-green-500' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={localSettings.touchOptimized}
              >
                <span
                  className={`inline-block w-4 h-4 transform bg-white rounded transition-transform duration-200 ease-in-out ${
                    localSettings.touchOptimized ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Compact Mode */}
            <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Compact Mode
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Denser layout with reduced spacing
                </p>
              </div>
              <button
                onClick={() => handleSettingChange('compactMode', !localSettings.compactMode)}
                className={`relative inline-flex items-center h-6 rounded-md w-11 transition-colors duration-200 ease-in-out touch-target ${
                  localSettings.compactMode ? 'bg-green-500' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={localSettings.compactMode}
              >
                <span
                  className={`inline-block w-4 h-4 transform bg-white rounded transition-transform duration-200 ease-in-out ${
                    localSettings.compactMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* View Mode */}
            <div className="py-3 px-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                Runner View Mode
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Choose how runners are displayed
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleSettingChange('runnerViewMode', VIEW_MODES.GRID)}
                  className={`p-3 rounded-lg border-2 transition-all touch-target ${
                    localSettings.runnerViewMode === VIEW_MODES.GRID
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">📊</div>
                  <div className="text-sm font-medium">Grid View</div>
                  <div className="text-xs text-gray-500">Touch-friendly</div>
                </button>
                <button
                  onClick={() => handleSettingChange('runnerViewMode', VIEW_MODES.LIST)}
                  className={`p-3 rounded-lg border-2 transition-all touch-target ${
                    localSettings.runnerViewMode === VIEW_MODES.LIST
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">📋</div>
                  <div className="text-sm font-medium">List View</div>
                  <div className="text-xs text-gray-500">Compact</div>
                </button>
              </div>
            </div>

            {/* Group Size */}
            <div className="py-3 px-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                Group Size
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Number of runners per page
              </p>
              <div className="grid grid-cols-4 gap-2">
                {Object.values(GROUP_SIZES).map((size) => (
                  <button
                    key={size}
                    onClick={() => handleSettingChange('groupSize', size)}
                    className={`py-2 px-3 rounded-lg border-2 transition-all touch-target text-sm font-medium ${
                      localSettings.groupSize === size
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Status Colors Section */}
          <section>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              🎨 Status Colors
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Customize colors for different runner statuses
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(localSettings.statusColors).map(([status, color]) => (
                <div key={status} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {status.replace('-', ' ')}
                  </span>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => handleStatusColorChange(status, e.target.value)}
                    className="w-12 h-12 rounded border-2 border-gray-300 dark:border-gray-600 cursor-pointer touch-target"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Danger Zone */}
          <section className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-red-600 dark:text-red-500 mb-4">
              ⚠️ Danger Zone
            </h3>
            
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-4">
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
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm touch-target whitespace-nowrap"
                >
                  Clear Database
                </button>
              </div>

              {showClearConfirm && (
                <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                    To confirm, please type <strong>CLEAR</strong> in the box below.
                  </p>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="w-full p-2 border-2 border-red-300 rounded bg-white dark:bg-gray-700 dark:text-white mb-2"
                    placeholder="CLEAR"
                  />
                  <button
                    onClick={confirmClearDatabase}
                    disabled={confirmText !== 'CLEAR'}
                    className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded disabled:bg-red-400 disabled:cursor-not-allowed touch-target"
                  >
                    Confirm Clear Database
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={resetToDefaults}
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium touch-target"
          >
            Reset to Defaults
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 touch-target"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed touch-target"
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
