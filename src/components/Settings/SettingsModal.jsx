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
import {
  DialogHeader,
  DialogFooter,
  SettingsSection,
  SettingItem,
  Toggle,
  Slider,
  ColorPicker,
  WarningBox
} from '../../shared/components/ui';

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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <DialogHeader
          title="Settings"
          onClose={handleCancel}
        />

        {/* Content */}
        <div className="p-6 space-y-8">
          
          {/* Appearance Section */}
          <SettingsSection
            title="Appearance"
            icon="🎨"
            description="Customize the look and feel of the application"
          >
            <SettingItem
              label="Dark Mode"
              description="Switch between light and dark themes"
            >
              <Toggle
                checked={localSettings.darkMode}
                onChange={(checked) => handleSettingChange('darkMode', checked)}
              />
            </SettingItem>

            <SettingItem
              label="High Contrast Mode"
              description="Increase contrast for better visibility"
            >
              <Toggle
                checked={localSettings.highContrastMode}
                onChange={(checked) => handleSettingChange('highContrastMode', checked)}
              />
            </SettingItem>

            <SettingItem
              label="Reduce Motion"
              description="Minimize animations and transitions"
            >
              <Toggle
                checked={localSettings.reducedMotion}
                onChange={(checked) => handleSettingChange('reducedMotion', checked)}
              />
            </SettingItem>

            <SettingItem
              label="Font Size"
              description="Adjust the application-wide font size"
              layout="vertical"
            >
              <Slider
                value={localSettings.fontSize}
                onChange={(value) => handleSettingChange('fontSize', value)}
                min={FONT_SIZE.MIN}
                max={FONT_SIZE.MAX}
                step={FONT_SIZE.STEP}
                formatValue={(v) => `${Math.round(v * 100)}%`}
              />
            </SettingItem>
          </SettingsSection>

          {/* Display & Interaction Section */}
          <SettingsSection
            title="Display & Interaction"
            icon="📱"
            description="Configure display and interaction preferences"
          >
            <SettingItem
              label="Touch Optimization"
              description="Larger tap targets for touch devices (48px minimum)"
            >
              <Toggle
                checked={localSettings.touchOptimized}
                onChange={(checked) => handleSettingChange('touchOptimized', checked)}
              />
            </SettingItem>

            <SettingItem
              label="Compact Mode"
              description="Denser layout with reduced spacing"
            >
              <Toggle
                checked={localSettings.compactMode}
                onChange={(checked) => handleSettingChange('compactMode', checked)}
              />
            </SettingItem>

            <SettingItem
              label="Runner View Mode"
              description="Choose how runners are displayed"
              layout="vertical"
            >
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
            </SettingItem>

            <SettingItem
              label="Group Size"
              description="Number of runners per page"
              layout="vertical"
            >
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
            </SettingItem>
          </SettingsSection>

          {/* Status Colors Section */}
          <SettingsSection
            title="Status Colors"
            icon="🎨"
            description="Customize colors for different runner statuses"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(localSettings.statusColors).map(([status, color]) => (
                <ColorPicker
                  key={status}
                  label={status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  value={color}
                  onChange={(newColor) => handleStatusColorChange(status, newColor)}
                  showInput={false}
                />
              ))}
            </div>
          </SettingsSection>

          {/* Danger Zone */}
          <SettingsSection
            title="Danger Zone"
            icon="⚠️"
          >
            <WarningBox
              variant="error"
              title="Clear Database"
              message="This will permanently delete all races, runners, and settings. This action cannot be undone."
              actions={
                !showClearConfirm ? (
                  <button
                    onClick={handleClearDatabase}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm touch-target"
                  >
                    Clear Database
                  </button>
                ) : null
              }
            >
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
            </WarningBox>
          </SettingsSection>
        </div>

        {/* Footer */}
        <DialogFooter
          align="between"
          tertiaryAction={{
            label: 'Reset to Defaults',
            onClick: resetToDefaults
          }}
          secondaryAction={{
            label: 'Cancel',
            onClick: handleCancel
          }}
          primaryAction={{
            label: 'Save Changes',
            onClick: handleSave,
            disabled: !hasChanges
          }}
        />
      </div>
    </div>
  );
};

export default SettingsModal;
