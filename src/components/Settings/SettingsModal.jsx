import React, { useState, useEffect } from 'react';
import { XMarkIcon, QrCodeIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useRaceStore } from '../../store/useRaceStore.js';
import {
  VIEW_MODES,
  GROUP_SIZES,
  FONT_SIZE,
  DEFAULT_SETTINGS,
  DEFAULT_STATUS_COLORS,
} from '../../types/index.js';
import {
  applyThemeToDOM,
  applyFontSizeToDOM,
  applyContrastToDOM,
  applyReducedMotionToDOM,
  applyTouchOptimizedToDOM,
  applyCompactModeToDOM,
  applyStatusColorsToDOM,
  applySunlightModeToDOM
} from '../../utils/settingsDOM.js';
import {
  DialogFooter,
  SettingItem,
  Toggle,
  WarningBox
} from '../../shared/components/ui';
import ShareRaceModal from '../Shared/ShareRaceModal';
import ImportExportModal from '../ImportExport/ImportExportModal';

const THEMES = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'sunlight', label: 'Sunlight' },
];

const STATUS_ROWS = [
  { key: 'not-started', name: 'Not yet', desc: 'White', swatch: 'border border-vk-border' },
  { key: 'passed', name: 'Passed', desc: 'Club blue' },
  { key: 'called-in', name: 'Called in', desc: 'Navy' },
  { key: 'non-starter', name: 'Non-starter', desc: 'Grey, dashed', swatch: 'border border-dashed border-vk-muted' },
  { key: 'dnf', name: 'DNF', desc: 'Red outline', swatch: 'border-2 border-vk-red' },
];

const themeOf = (s) => (s.sunlightMode ? 'sunlight' : s.darkMode ? 'dark' : 'light');

const fontLabel = (v) => {
  const pct = Math.round(v * 100);
  const name = v < 0.95 ? 'Small' : v <= 1.05 ? 'Standard' : v <= 1.2 ? 'Large' : 'Extra large';
  return `${name} · ${pct}%`;
};

const SectionHeading = ({ children }) => (
  <h3 className="font-display font-bold text-xs tracking-[1.5px] uppercase text-vk-blue">{children}</h3>
);

const Panel = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 border border-vk-border dark:border-gray-700 rounded-card ${className}`}>{children}</div>
);

const applyAll = (s) => {
  applyFontSizeToDOM(s.fontSize);
  applyThemeToDOM(s.darkMode);
  applyContrastToDOM(s.highContrastMode ? 'high' : 'normal');
  applyReducedMotionToDOM(s.reducedMotion);
  applyTouchOptimizedToDOM(s.touchOptimized);
  applyCompactModeToDOM(s.compactMode);
  applyStatusColorsToDOM(s.statusColors);
  applySunlightModeToDOM(s.sunlightMode ?? false);
};

const SettingsModal = ({ isOpen, onClose }) => {
  const { settings, updateSettings, clearAllData, currentRaceId, selectedRaceForMode } = useRaceStore();

  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const shareRaceId = selectedRaceForMode ?? currentRaceId;

  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings, isOpen]);

  // Apply changes immediately for preview
  useEffect(() => {
    if (isOpen) applyAll(localSettings);
  }, [localSettings, isOpen]);

  const change = (patch) => {
    setLocalSettings(prev => ({ ...prev, ...patch }));
    setHasChanges(true);
  };

  const setTheme = (id) => change({ darkMode: id === 'dark', sunlightMode: id === 'sunlight' });

  const setStatusColor = (status, color) => change({ statusColors: { ...localSettings.statusColors, [status]: color } });

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
    setLocalSettings(settings);
    setHasChanges(false);
    applyAll(settings);
    onClose();
  };

  const confirmClearDatabase = async () => {
    if (confirmText !== 'CLEAR') return;
    try {
      await clearAllData();
      setShowClearConfirm(false);
      setConfirmText('');
      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear database:', error);
    }
  };

  if (!isOpen) return null;

  const theme = themeOf(localSettings);
  const colors = localSettings.statusColors ?? DEFAULT_STATUS_COLORS;

  return (
    <div className="fixed inset-0 bg-[rgba(11,45,83,0.55)] flex items-stretch sm:items-center justify-center sm:p-4 z-50">
      <div
        className="bg-vk-paper dark:bg-gray-900 sm:rounded-sheet shadow-sheet w-full sm:max-w-xl max-h-full sm:max-h-[90vh] overflow-y-auto flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-hd"
        data-screenshot-target
      >
        <div className="bg-vk-navy text-white px-3 py-4 flex items-center gap-2 sm:rounded-t-sheet sticky top-0 z-10">
          <h2 id="settings-hd" className="font-display font-bold text-lg flex-1 pl-2">Settings</h2>
          <button
            type="button"
            onClick={handleCancel}
            className="w-11 h-11 flex items-center justify-center rounded-btn hover:bg-white/10"
            aria-label="Close settings"
          >
            <XMarkIcon className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-[18px]">
          <section className="flex flex-col gap-2.5">
            <SectionHeading>Display</SectionHeading>
            <Panel className="p-4 flex flex-col gap-[18px]">
              <div className="flex flex-col gap-2">
                <div className="text-sm font-semibold">Theme</div>
                <div className="grid grid-cols-3 bg-vk-band dark:bg-gray-700 rounded-btn p-1 gap-1" role="group" aria-label="Theme">
                  {THEMES.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={theme === t.id}
                      onClick={() => setTheme(t.id)}
                      className={`min-h-[44px] rounded-lg text-sm ${theme === t.id
                        ? 'bg-white text-vk-navy font-bold shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:bg-gray-900 dark:text-white'
                        : 'text-vk-muted font-semibold dark:text-gray-300'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-baseline">
                  <label htmlFor="text-size" className="text-sm font-semibold">Text size</label>
                  <span className="text-[13px] text-vk-muted">{fontLabel(localSettings.fontSize)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-bold" aria-hidden="true">A</span>
                  <input
                    id="text-size"
                    type="range"
                    min={FONT_SIZE.MIN}
                    max={FONT_SIZE.MAX}
                    step={FONT_SIZE.STEP}
                    value={localSettings.fontSize}
                    onChange={e => change({ fontSize: parseFloat(e.target.value) })}
                    className="flex-1 accent-vk-blue h-6"
                  />
                  <span className="text-xl font-bold" aria-hidden="true">A</span>
                </div>
              </div>
            </Panel>
          </section>

          <section className="flex flex-col gap-2.5">
            <SectionHeading>Status colours</SectionHeading>
            <Panel className="flex flex-col">
              {STATUS_ROWS.map((row, i) => (
                <label
                  key={row.key}
                  className={`min-h-[56px] px-4 flex items-center gap-3 text-[15px] cursor-pointer ${i < STATUS_ROWS.length - 1 ? 'border-b border-vk-border dark:border-gray-700' : ''}`}
                >
                  <span className="relative w-7 h-7 shrink-0">
                    <span
                      className={`absolute inset-0 rounded-chip ${row.swatch ?? ''}`}
                      style={{ background: row.key === 'dnf' ? `${colors[row.key]}1a` : colors[row.key] }}
                      aria-hidden="true"
                    />
                    <input
                      type="color"
                      value={colors[row.key] ?? DEFAULT_STATUS_COLORS[row.key]}
                      onChange={e => setStatusColor(row.key, e.target.value)}
                      aria-label={`${row.name} colour`}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                  </span>
                  <span className="flex-1">{row.name}</span>
                  <span className="text-xs text-vk-muted">{row.desc}</span>
                </label>
              ))}
            </Panel>
            <button
              type="button"
              onClick={() => change({ statusColors: { ...DEFAULT_STATUS_COLORS } })}
              className="self-start py-1.5 text-sm font-semibold text-vk-blue hover:text-vk-navy"
            >
              Reset to club colours
            </button>
          </section>

          <section className="flex flex-col gap-2.5">
            <SectionHeading>Race data</SectionHeading>
            <button
              type="button"
              onClick={() => (shareRaceId ? setShowShare(true) : setShowImport(true))}
              className="bg-white dark:bg-gray-800 border border-vk-border dark:border-gray-700 rounded-card min-h-[56px] px-4 flex items-center gap-3 text-[15px] text-left"
            >
              <QrCodeIcon className="w-5 h-5 text-vk-blue" aria-hidden="true" />
              <span className="flex-1">Share or import race config</span>
              <ChevronRightIcon className="w-[18px] h-[18px] text-vk-muted" aria-hidden="true" />
            </button>
          </section>

          <section className="flex flex-col gap-2.5">
            <SectionHeading>More options</SectionHeading>
            <Panel className="px-4 py-2 flex flex-col divide-y divide-vk-border dark:divide-gray-700">
              <SettingItem label="High contrast" description="Thicker borders and bolder text">
                <Toggle checked={!!localSettings.highContrastMode} onChange={v => change({ highContrastMode: v })} />
              </SettingItem>
              <SettingItem label="Reduce motion" description="Fewer animations and transitions">
                <Toggle checked={!!localSettings.reducedMotion} onChange={v => change({ reducedMotion: v })} />
              </SettingItem>
              <SettingItem label="Touch optimisation" description="Larger tap targets (48px minimum)">
                <Toggle checked={!!localSettings.touchOptimized} onChange={v => change({ touchOptimized: v })} />
              </SettingItem>
              <SettingItem label="Compact mode" description="Denser layout with less spacing">
                <Toggle checked={!!localSettings.compactMode} onChange={v => change({ compactMode: v })} />
              </SettingItem>
              <SettingItem label="Runner view" description="Grid is touch-friendly; list is compact" layout="vertical">
                <div className="grid grid-cols-2 bg-vk-band dark:bg-gray-700 rounded-btn p-1 gap-1" role="group" aria-label="Runner view">
                  {[[VIEW_MODES.GRID, 'Grid'], [VIEW_MODES.LIST, 'List']].map(([id, label]) => (
                    <button key={id} type="button" aria-pressed={localSettings.runnerViewMode === id}
                      onClick={() => change({ runnerViewMode: id })}
                      className={`min-h-[44px] rounded-lg text-sm ${localSettings.runnerViewMode === id ? 'bg-white font-bold text-vk-navy dark:bg-gray-900 dark:text-white' : 'text-vk-muted font-semibold'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </SettingItem>
              <SettingItem label="Group size" description="Runners per page in list views" layout="vertical">
                <div className="grid grid-cols-4 gap-2">
                  {Object.values(GROUP_SIZES).map(size => (
                    <button key={size} type="button" aria-pressed={localSettings.groupSize === size}
                      onClick={() => change({ groupSize: size })}
                      className={`min-h-[44px] rounded-btn text-sm font-bold ${localSettings.groupSize === size ? 'bg-vk-navy text-white' : 'bg-white border border-vk-border text-vk-ink dark:bg-gray-800 dark:text-gray-100'}`}>
                      {size}
                    </button>
                  ))}
                </div>
              </SettingItem>
            </Panel>
          </section>

          <section className="flex flex-col gap-2.5">
            <SectionHeading>Danger zone</SectionHeading>
            <WarningBox
              variant="error"
              title="Clear database"
              message="Permanently deletes all races, runners and settings on this device. This cannot be undone."
              actions={!showClearConfirm ? (
                <button type="button" onClick={() => setShowClearConfirm(true)}
                  className="bg-vk-red hover:bg-red-700 text-white font-bold py-2 px-4 rounded-btn text-sm min-h-[44px]">
                  Clear database
                </button>
              ) : null}
            >
              {showClearConfirm && (
                <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
                  <label htmlFor="clear-confirm" className="block text-sm text-vk-red mb-2">
                    To confirm, type <strong>CLEAR</strong> in the box below.
                  </label>
                  <input id="clear-confirm" type="text" value={confirmText} onChange={e => setConfirmText(e.target.value)}
                    className="w-full p-2 border-2 border-red-300 rounded-btn bg-white dark:bg-gray-700 dark:text-white mb-2" placeholder="CLEAR" />
                  <button type="button" onClick={confirmClearDatabase} disabled={confirmText !== 'CLEAR'}
                    className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-btn disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]">
                    Confirm clear database
                  </button>
                </div>
              )}
            </WarningBox>
          </section>
        </div>

        <div className="mt-auto sticky bottom-0 bg-white dark:bg-gray-800">
          <DialogFooter
            align="between"
            tertiaryAction={{ label: 'Reset to defaults', onClick: () => change(DEFAULT_SETTINGS) }}
            secondaryAction={{ label: 'Cancel', onClick: handleCancel }}
            primaryAction={{ label: 'Save Changes', onClick: handleSave, disabled: !hasChanges }}
          />
        </div>
      </div>

      <ShareRaceModal
        isOpen={showShare}
        raceId={shareRaceId}
        onClose={() => setShowShare(false)}
        onImport={() => { setShowShare(false); setShowImport(true); }}
      />
      <ImportExportModal isOpen={showImport} onClose={() => setShowImport(false)} initialTab="import" />
    </div>
  );
};

export default SettingsModal;
