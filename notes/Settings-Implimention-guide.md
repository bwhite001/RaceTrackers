# Race Tracker Pro - Settings & Configuration Implementation Guide

**Author:** Development Team  
**Date:** November 24, 2025  
**Version:** 1.0  
**Principles:** SOLID, DRY, Accessibility-First

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Phase 1: Type Definitions & Constants](#phase-1-type-definitions--constants)
3. [Phase 2: Enhanced Settings Store](#phase-2-enhanced-settings-store)
4. [Phase 3: Settings UI Components](#phase-3-settings-ui-components)
5. [Phase 4: Global Settings Application](#phase-4-global-settings-application)
6. [Phase 5: Homepage Transformation](#phase-5-homepage-transformation)
7. [Phase 6: Export/Import Configuration](#phase-6-exportimport-configuration)
8. [Phase 7: Responsive & Accessibility](#phase-7-responsive--accessibility)
9. [Testing Strategy](#testing-strategy)
10. [Implementation Checklist](#implementation-checklist)

---

## Architecture Overview

### SOLID Principles Application

**Single Responsibility Principle (SRP)**
- Each settings component manages one concern (theme, colors, display)
- Separate hooks for settings logic (`useSettings`, `useTheme`, `useAccessibility`)
- Dedicated services for export/import functionality

**Open/Closed Principle (OCP)**
- Settings schema extensible without modifying core logic
- Plugin-based color picker and control components
- Theme system supports custom themes without code changes

**Liskov Substitution Principle (LSP)**
- All settings controls inherit from base `SettingControl` component
- Interchangeable storage adapters (localStorage, IndexedDB)

**Interface Segregation Principle (ISP)**
- Focused interfaces: `IThemeSettings`, `IDisplaySettings`, `IAccessibilitySettings`
- Components consume only required settings slice

**Dependency Inversion Principle (DIP)**
- Components depend on abstract settings interface, not concrete implementations
- Dependency injection for storage and export services

### DRY Principles Application

- Shared constants in single source of truth (`constants/settings.js`)
- Reusable setting control components (`ToggleControl`, `SliderControl`, `ColorControl`)
- Centralized settings validation logic
- Common CSS custom properties for theming

---

## Phase 1: Type Definitions & Constants

### File: `src/constants/settings.js`

/**
 * Settings Constants - Single Source of Truth
 * Follows DRY principle by centralizing all settings-related constants
 */

// View Modes
export const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list',
};

export const VIEW_MODE_OPTIONS = [
  { value: VIEW_MODES.GRID, label: 'Grid View', icon: 'grid_view', description: 'Visual cards, touch-friendly' },
  { value: VIEW_MODES.LIST, label: 'List View', icon: 'list', description: 'Table format, compact' },
];

// Contrast Modes
export const CONTRAST_MODES = {
  NORMAL: 'normal',
  HIGH: 'high',
};

export const CONTRAST_MODE_OPTIONS = [
  { value: CONTRAST_MODES.NORMAL, label: 'Normal Contrast', multiplier: 1.0 },
  { value: CONTRAST_MODES.HIGH, label: 'High Contrast', multiplier: 1.3 },
];

// Group Sizes (already exists in types/index.js, but standardize here)
export const GROUP_SIZES = [10, 25, 50, 100];

export const GROUP_SIZE_OPTIONS = GROUP_SIZES.map(size => ({
  value: size,
  label: `${size} runners`,
  description: size <= 25 ? 'Easier scrolling' : 'Better for large races',
}));

// Font Size Range
export const FONT_SIZE = {
  MIN: 0.8,
  MAX: 1.5,
  DEFAULT: 1.0,
  STEP: 0.1,
};

// Status Colors (Default Palette)
export const DEFAULT_STATUS_COLORS = {
  'not-started': '#6b7280', // Gray-500
  'passed': '#10b981',      // Green-500
  'non-starter': '#ef4444', // Red-500
  'dnf': '#f59e0b',         // Amber-500
};

export const STATUS_COLOR_LABELS = {
  'not-started': 'Not Started',
  'passed': 'Passed',
  'non-starter': 'Non-Starter',
  'dnf': 'Did Not Finish',
};

// Touch Target Sizes (WCAG 2.5.5 - Target Size Level AAA)
export const TOUCH_TARGETS = {
  STANDARD: 44,  // Minimum for WCAG AA
  OPTIMIZED: 48, // Recommended for touch devices
  LARGE: 56,     // Enhanced accessibility
};

// Motion Preferences
export const MOTION_PREFERENCES = {
  FULL: 'full',
  REDUCED: 'reduced',
  NONE: 'none',
};

### File: `src/types/settings.types.js`

/**
 * Settings Type Definitions
 * Follows ISP by segregating settings into logical interfaces
 */

/**
 * @typedef {Object} IThemeSettings
 * @property {boolean} darkMode - Dark theme enabled
 * @property {string} contrastMode - 'normal' | 'high'
 * @property {boolean} reducedMotion - Reduce animations
 */

/**
 * @typedef {Object} IDisplaySettings
 * @property {number} fontSize - Font scale multiplier (0.8-1.5)
 * @property {string} runnerViewMode - 'grid' | 'list'
 * @property {number} groupSize - Runners per group (10, 25, 50, 100)
 * @property {boolean} touchOptimized - Enhanced touch targets
 * @property {boolean} compactMode - Denser layout
 */

/**
 * @typedef {Object} IAccessibilitySettings
 * @property {boolean} hapticsEnabled - Vibration feedback
 * @property {boolean} soundEnabled - Audio feedback
 * @property {boolean} keyboardShortcuts - Enable hotkeys
 * @property {boolean} screenReaderOptimized - Enhanced ARIA
 */

/**
 * @typedef {Object} IColorSettings
 * @property {Object<string, string>} statusColors - Runner status colors
 */

/**
 * @typedef {Object} IPerformanceSettings
 * @property {boolean} autoSave - Auto-save changes
 * @property {number} segmentDuration - Call-in segment minutes
 */

/**
 * @typedef {IThemeSettings & IDisplaySettings & IAccessibilitySettings & IColorSettings & IPerformanceSettings} IAppSettings
 */

export const DEFAULT_SETTINGS = {
  // Theme
  darkMode: false,
  contrastMode: 'normal',
  reducedMotion: false,
  
  // Display
  fontSize: 1.0,
  runnerViewMode: 'grid',
  groupSize: 25,
  touchOptimized: true,
  compactMode: false,
  
  // Accessibility
  hapticsEnabled: true,
  soundEnabled: true,
  keyboardShortcuts: true,
  screenReaderOptimized: false,
  
  // Colors
  statusColors: {
    'not-started': '#6b7280',
    'passed': '#10b981',
    'non-starter': '#ef4444',
    'dnf': '#f59e0b',
  },
  
  // Performance
  autoSave: true,
  segmentDuration: 5,
};

---

## Phase 2: Enhanced Settings Store

### File: `src/hooks/useSettings.js`

/**
 * Settings Hook - Follows SRP by managing only settings logic
 * Applies DIP by using abstract storage interface
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_SETTINGS } from '../types/settings.types';
import { applyThemeToDOM, applyFontSizeToDOM, applyContrastToDOM } from '../utils/settingsDOM';

// Storage adapter interface (DIP)
const createStorageAdapter = (storage) => ({
  getItem: (name) => storage.getItem(name),
  setItem: (name, value) => storage.setItem(name, value),
  removeItem: (name) => storage.removeItem(name),
});

export const useSettings = create(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      
      // Theme settings (grouped for SRP)
      setDarkMode: (enabled) => {
        set((state) => ({ 
          settings: { ...state.settings, darkMode: enabled } 
        }));
        applyThemeToDOM(enabled);
      },
      
      setContrastMode: (mode) => {
        set((state) => ({ 
          settings: { ...state.settings, contrastMode: mode } 
        }));
        applyContrastToDOM(mode);
      },
      
      setReducedMotion: (enabled) => {
        set((state) => ({ 
          settings: { ...state.settings, reducedMotion: enabled } 
        }));
      },
      
      // Display settings
      setFontSize: (size) => {
        set((state) => ({ 
          settings: { ...state.settings, fontSize: size } 
        }));
        applyFontSizeToDOM(size);
      },
      
      setRunnerViewMode: (mode) => {
        set((state) => ({ 
          settings: { ...state.settings, runnerViewMode: mode } 
        }));
      },
      
      setGroupSize: (size) => {
        set((state) => ({ 
          settings: { ...state.settings, groupSize: size } 
        }));
      },
      
      setTouchOptimized: (enabled) => {
        set((state) => ({ 
          settings: { ...state.settings, touchOptimized: enabled } 
        }));
        document.documentElement.classList.toggle('touch-optimized', enabled);
      },
      
      // Color settings
      setStatusColor: (status, color) => {
        set((state) => ({
          settings: {
            ...state.settings,
            statusColors: {
              ...state.settings.statusColors,
              [status]: color,
            },
          },
        }));
      },
      
      resetStatusColors: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            statusColors: DEFAULT_SETTINGS.statusColors,
          },
        }));
      },
      
      // Bulk operations
      updateSettings: (partialSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...partialSettings },
        }));
      },
      
      resetSettings: () => {
        set({ settings: DEFAULT_SETTINGS });
        applyThemeToDOM(DEFAULT_SETTINGS.darkMode);
        applyFontSizeToDOM(DEFAULT_SETTINGS.fontSize);
        applyContrastToDOM(DEFAULT_SETTINGS.contrastMode);
      },
      
      // Export/Import
      exportSettings: () => {
        return {
          version: '1.0',
          exportDate: new Date().toISOString(),
          settings: get().settings,
        };
      },
      
      importSettings: (data) => {
        if (data.version === '1.0' && data.settings) {
          set({ settings: { ...DEFAULT_SETTINGS, ...data.settings } });
          return { success: true };
        }
        return { success: false, error: 'Invalid settings format' };
      },
    }),
    {
      name: 'race-tracker-settings',
      storage: createStorageAdapter(localStorage),
    }
  )
);

### File: `src/utils/settingsDOM.js`

/**
 * DOM Manipulation Utilities for Settings
 * Follows SRP by isolating DOM side effects
 */

export const applyThemeToDOM = (darkMode) => {
  document.documentElement.classList.toggle('dark', darkMode);
  // Update meta theme-color for PWA
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', darkMode ? '#1f2937' : '#ffffff');
  }
};

export const applyFontSizeToDOM = (fontSize) => {
  document.documentElement.style.setProperty('--font-scale', fontSize);
};

export const applyContrastToDOM = (mode) => {
  document.documentElement.classList.toggle('high-contrast', mode === 'high');
  document.documentElement.style.setProperty(
    '--high-contrast-multiplier', 
    mode === 'high' ? '1.3' : '1'
  );
};

export const applyReducedMotionToDOM = (enabled) => {
  document.documentElement.classList.toggle('reduce-motion', enabled);
};

// Initialize settings on page load
export const initializeSettings = (settings) => {
  applyThemeToDOM(settings.darkMode);
  applyFontSizeToDOM(settings.fontSize);
  applyContrastToDOM(settings.contrastMode);
  applyReducedMotionToDOM(settings.reducedMotion);
  document.documentElement.classList.toggle('touch-optimized', settings.touchOptimized);
  
  // Respect system preferences as fallback
  if (!settings.reducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    applyReducedMotionToDOM(true);
  }
};

---

## Phase 3: Settings UI Components

### File: `src/components/Settings/SettingsModal.jsx`

/**
 * Settings Modal - Main Container
 * Follows OCP by using pluggable section components
 */

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import AppearanceSettings from './sections/AppearanceSettings';
import DisplaySettings from './sections/DisplaySettings';
import ColorSettings from './sections/ColorSettings';
import AccessibilitySettings from './sections/AccessibilitySettings';
import AdvancedSettings from './sections/AdvancedSettings';
import DangerZoneSettings from './sections/DangerZoneSettings';

const SECTIONS = [
  { id: 'appearance', label: 'Appearance', icon: '🎨', component: AppearanceSettings },
  { id: 'display', label: 'Display & Interaction', icon: '📱', component: DisplaySettings },
  { id: 'colors', label: 'Status Colors', icon: '🎨', component: ColorSettings },
  { id: 'accessibility', label: 'Accessibility', icon: '♿', component: AccessibilitySettings },
  { id: 'advanced', label: 'Advanced', icon: '⚙️', component: AdvancedSettings },
  { id: 'danger', label: 'Danger Zone', icon: '⚠️', component: DangerZoneSettings },
];

export default function SettingsModal({ isOpen, onClose }) {
  const [activeSection, setActiveSection] = useState('appearance');
  const { settings } = useSettings();

  if (!isOpen) return null;

  const ActiveComponent = SECTIONS.find(s => s.id === activeSection)?.component;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close settings"
          >
            <X className="w-6 h-6" />
          </button>
        </header>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <nav className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-4">
            <ul className="space-y-2">
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                      activeSection === section.id
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    aria-current={activeSection === section.id ? 'page' : undefined}
                  >
                    <span className="text-xl" aria-hidden="true">{section.icon}</span>
                    <span className="font-medium">{section.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-6">
            {ActiveComponent && <ActiveComponent settings={settings} />}
          </main>
        </div>
      </div>
    </div>
  );
}

### File: `src/components/Settings/sections/AppearanceSettings.jsx`

/**
 * Appearance Settings Section
 * Follows SRP - manages only appearance-related settings
 */

import React from 'react';
import { useSettings } from '../../../hooks/useSettings';
import { CONTRAST_MODE_OPTIONS, FONT_SIZE } from '../../../constants/settings';
import ToggleControl from '../controls/ToggleControl';
import SliderControl from '../controls/SliderControl';
import RadioGroupControl from '../controls/RadioGroupControl';

export default function AppearanceSettings() {
  const { settings, setDarkMode, setContrastMode, setReducedMotion, setFontSize } = useSettings();

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold mb-4">Appearance</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Customize the visual appearance of the application
        </p>
      </div>

      <ToggleControl
        label="Dark Mode"
        description="Use dark color scheme"
        checked={settings.darkMode}
        onChange={setDarkMode}
        icon="🌙"
      />

      <RadioGroupControl
        label="Contrast Mode"
        description="Adjust contrast levels for visibility"
        options={CONTRAST_MODE_OPTIONS}
        value={settings.contrastMode}
        onChange={setContrastMode}
      />

      <SliderControl
        label="Font Size"
        description="Adjust text size for readability"
        min={FONT_SIZE.MIN}
        max={FONT_SIZE.MAX}
        step={FONT_SIZE.STEP}
        value={settings.fontSize}
        onChange={setFontSize}
        formatValue={(val) => `${Math.round(val * 100)}%`}
      />

      <ToggleControl
        label="Reduce Motion"
        description="Minimize animations and transitions"
        checked={settings.reducedMotion}
        onChange={setReducedMotion}
        icon="🎬"
      />
    </div>
  );
}

### File: `src/components/Settings/sections/DisplaySettings.jsx`

/**
 * Display Settings Section
 * Follows SRP - manages only display-related settings
 */

import React from 'react';
import { useSettings } from '../../../hooks/useSettings';
import { VIEW_MODE_OPTIONS, GROUP_SIZE_OPTIONS } from '../../../constants/settings';
import ToggleControl from '../controls/ToggleControl';
import SelectControl from '../controls/SelectControl';
import RadioGroupControl from '../controls/RadioGroupControl';

export default function DisplaySettings() {
  const { 
    settings, 
    setRunnerViewMode, 
    setGroupSize, 
    setTouchOptimized,
    setCompactMode 
  } = useSettings();

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold mb-4">Display & Interaction</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Configure how information is displayed and organized
        </p>
      </div>

      <RadioGroupControl
        label="Runner View Mode"
        description="Choose how runners are displayed"
        options={VIEW_MODE_OPTIONS}
        value={settings.runnerViewMode}
        onChange={setRunnerViewMode}
        layout="grid"
      />

      <SelectControl
        label="Group Size"
        description="Number of runners per page"
        options={GROUP_SIZE_OPTIONS}
        value={settings.groupSize}
        onChange={setGroupSize}
      />

      <ToggleControl
        label="Touch Optimization"
        description="Larger tap targets for touch devices (48px minimum)"
        checked={settings.touchOptimized}
        onChange={setTouchOptimized}
        icon="👆"
      />

      <ToggleControl
        label="Compact Mode"
        description="Denser layout with reduced spacing"
        checked={settings.compactMode}
        onChange={(enabled) => {
          setCompactMode(enabled);
          document.documentElement.classList.toggle('compact-mode', enabled);
        }}
        icon="📐"
      />
    </div>
  );
}

### File: `src/components/Settings/sections/ColorSettings.jsx`

/**
 * Color Settings Section
 * Follows SRP - manages only color customization
 */

import React from 'react';
import { useSettings } from '../../../hooks/useSettings';
import { STATUS_COLOR_LABELS, DEFAULT_STATUS_COLORS } from '../../../constants/settings';
import ColorPickerControl from '../controls/ColorPickerControl';

export default function ColorSettings() {
  const { settings, setStatusColor, resetStatusColors } = useSettings();

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold mb-4">Status Colors</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Customize colors for different runner statuses
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(STATUS_COLOR_LABELS).map(([status, label]) => (
          <ColorPickerControl
            key={status}
            label={label}
            value={settings.statusColors[status]}
            onChange={(color) => setStatusColor(status, color)}
            defaultColor={DEFAULT_STATUS_COLORS[status]}
          />
        ))}
      </div>

      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={resetStatusColors}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          Reset to Default Colors
        </button>
      </div>
    </div>
  );
}

### File: `src/components/Settings/controls/ToggleControl.jsx`

/**
 * Reusable Toggle Control Component
 * Follows DRY - single implementation for all toggle settings
 */

import React from 'react';

export default function ToggleControl({ 
  label, 
  description, 
  checked, 
  onChange, 
  icon,
  disabled = false 
}) {
  const id = `toggle-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="flex items-start justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {icon && <span className="text-xl" aria-hidden="true">{icon}</span>}
          <label htmlFor={id} className="font-medium cursor-pointer">
            {label}
          </label>
        </div>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>
      
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  );
}

### File: `src/components/Settings/controls/SliderControl.jsx`

/**
 * Reusable Slider Control Component
 * Follows DRY - single implementation for all slider settings
 */

import React from 'react';

export default function SliderControl({ 
  label, 
  description, 
  min, 
  max, 
  step, 
  value, 
  onChange,
  formatValue = (val) => val,
  disabled = false 
}) {
  const id = `slider-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
          {formatValue(value)}
        </span>
      </div>
      
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {description}
        </p>
      )}
      
      <div className="relative">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`
          }}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={formatValue(value)}
        />
      </div>
    </div>
  );
}

---

## Phase 4: Global Settings Application

### File: `src/App.jsx` (Updated)

/**
 * Root App Component
 * Applies settings globally on mount
 */

import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useSettings } from './hooks/useSettings';
import { initializeSettings } from './utils/settingsDOM';
import AppRoutes from './routes';
import FloatingSettingsButton from './components/Settings/FloatingSettingsButton';

function App() {
  const { settings } = useSettings();

  // Initialize settings on mount
  useEffect(() => {
    initializeSettings(settings);
  }, []); // Run once on mount

  // Listen for system preference changes
  useEffect(() => {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleDarkModeChange = (e) => {
      if (!settings.darkMode) { // Only if user hasn't explicitly set it
        applyThemeToDOM(e.matches);
      }
    };

    const handleMotionChange = (e) => {
      if (!settings.reducedMotion) {
        applyReducedMotionToDOM(e.matches);
      }
    };

    darkModeQuery.addEventListener('change', handleDarkModeChange);
    motionQuery.addEventListener('change', handleMotionChange);

    return () => {
      darkModeQuery.removeEventListener('change', handleDarkModeChange);
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, [settings.darkMode, settings.reducedMotion]);

  return (
    <BrowserRouter>
      <AppRoutes />
      <FloatingSettingsButton />
    </BrowserRouter>
  );
}

export default App;

### File: `src/index.css` (CSS Custom Properties)

/**
 * Global CSS Custom Properties for Settings
 * Follows DRY - single source of truth for theming
 */

:root {
  /* Font Scaling */
  --font-scale: 1.0;
  --font-size-base: calc(16px * var(--font-scale));
  --font-size-sm: calc(14px * var(--font-scale));
  --font-size-lg: calc(18px * var(--font-scale));
  --font-size-xl: calc(20px * var(--font-scale));
  --font-size-2xl: calc(24px * var(--font-scale));
  
  /* Touch Targets */
  --touch-target-min: 44px;
  --spacing-base: 16px;
  --spacing-compact: 12px;
  
  /* Contrast Multiplier */
  --high-contrast-multiplier: 1;
  
  /* Status Colors (Defaults) */
  --color-status-not-started: #6b7280;
  --color-status-passed: #10b981;
  --color-status-non-starter: #ef4444;
  --color-status-dnf: #f59e0b;
  
  /* Animation Duration */
  --animation-duration: 250ms;
}

/* Touch Optimized Mode */
.touch-optimized {
  --touch-target-min: 48px;
}

.touch-optimized button,
.touch-optimized a.btn,
.touch-optimized input[type="checkbox"],
.touch-optimized input[type="radio"] {
  min-height: var(--touch-target-min);
  min-width: var(--touch-target-min);
}

/* High Contrast Mode */
.high-contrast {
  --high-contrast-multiplier: 1.3;
}

.high-contrast * {
  border-width: 2px !important;
}

/* Compact Mode */
.compact-mode {
  --spacing-base: var(--spacing-compact);
}

/* Reduced Motion */
.reduce-motion * {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}

/* Apply font scaling */
html {
  font-size: var(--font-size-base);
}

/* Status badges use CSS variables */
.status-badge {
  transition: all var(--animation-duration);
}

.status-not-started {
  background-color: var(--color-status-not-started);
}

.status-passed {
  background-color: var(--color-status-passed);
}

.status-non-starter {
  background-color: var(--color-status-non-starter);
}

.status-dnf {
  background-color: var(--color-status-dnf);
}

/* Focus indicators (accessibility) */
:focus-visible {
  outline: 3px solid #3b82f6;
  outline-offset: 2px;
}

/* Print styles */
@media print {
  .no-print {
    display: none !important;
  }
}

---

## Phase 5: Homepage Transformation

### File: `src/components/Layout/AppHeader.jsx`

/**
 * App Header Component
 * Follows SRP - manages only header presentation and navigation
 */

import React, { useState } from 'react';
import { Settings, HelpCircle, Menu } from 'lucide-react';
import SettingsModal from '../Settings/SettingsModal';
import HelpModal from '../Help/HelpModal';
import Logo from '../shared/Logo';

export default function AppHeader() {
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <Logo className="w-8 h-8" />
              <h1 className="text-xl font-bold">Race Tracker Pro</h1>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHelp(true)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Help"
              >
                <HelpCircle className="w-6 h-6" />
              </button>
              
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Settings"
              >
                <Settings className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
}

### File: `src/components/Home/LandingPage.jsx` (Redesigned)

/**
 * Landing Page - Touch-Optimized Homepage
 * Follows responsive design and accessibility principles
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Radio, Settings as SettingsIcon } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import AppHeader from '../Layout/AppHeader';
import ModuleCard from './ModuleCard';

const MODULES = [
  {
    id: 'checkpoint',
    title: 'Checkpoint Mode',
    description: 'Track runners at your assigned checkpoint',
    icon: Activity,
    color: 'blue',
    route: '/checkpoint',
  },
  {
    id: 'base-station',
    title: 'Base Station Mode',
    description: 'Monitor all checkpoints and manage race data',
    icon: Radio,
    color: 'green',
    route: '/base-station',
  },
  {
    id: 'race-setup',
    title: 'Race Maintenance',
    description: 'Configure race details and runner information',
    icon: SettingsIcon,
    color: 'purple',
    route: '/setup',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { settings } = useSettings();

  const handleModuleClick = (route) => {
    // Haptic feedback on touch devices
    if (settings.hapticsEnabled && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Welcome to Race Tracker Pro
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Select your operation mode to begin tracking. All data is stored locally on your device.
          </p>
        </div>

        {/* Module Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {MODULES.map((module) => (
            <ModuleCard
              key={module.id}
              title={module.title}
              description={module.description}
              icon={module.icon}
              color={module.color}
              onClick={() => handleModuleClick(module.route)}
            />
          ))}
        </div>

        {/* Quick Stats (if race data exists) */}
        <RaceQuickStats />
      </main>
    </div>
  );
}

### File: `src/components/Home/ModuleCard.jsx`

/**
 * Touch-Optimized Module Card
 * Follows accessibility guidelines (WCAG 2.5.5 