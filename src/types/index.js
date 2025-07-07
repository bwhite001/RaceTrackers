// Type definitions for the race tracking app

/**
 * @typedef {'not-started' | 'passed' | 'non-starter' | 'dnf'} RunnerStatus
 */

/**
 * @typedef {Object} RaceConfig
 * @property {string} id - Unique identifier for the race
 * @property {string} name - Name of the race
 * @property {string} date - Race date in YYYY-MM-DD format
 * @property {string} startTime - Race start time in HH:MM format
 * @property {number} minRunner - Minimum runner number
 * @property {number} maxRunner - Maximum runner number
 * @property {string} createdAt - ISO timestamp when race was created
 */

/**
 * @typedef {Object} Runner
 * @property {number} number - Runner number
 * @property {RunnerStatus} status - Current status of the runner
 * @property {string|null} recordedTime - ISO timestamp when runner passed checkpoint
 * @property {string|null} notes - Optional notes about the runner
 */

/**
 * @typedef {Object} TimeSegment
 * @property {string} startTime - ISO timestamp of segment start
 * @property {string} endTime - ISO timestamp of segment end
 * @property {number[]} runners - Array of runner numbers in this segment
 * @property {boolean} called - Whether this segment has been called in
 */

/**
 * @typedef {'setup' | 'checkpoint' | 'base-station'} AppMode
 */

/**
 * @typedef {Object} AppSettings
 * @property {boolean} darkMode - Whether dark mode is enabled
 * @property {number} fontSize - Font size multiplier (0.8 to 1.5)
 * @property {Object<RunnerStatus, string>} statusColors - Custom colors for each status
 * @property {'grid' | 'list'} runnerViewMode - Preferred view mode for runners
 * @property {number} groupSize - Size for grouping runners (10, 25, 50, 100)
 */

/**
 * @typedef {Object} AppState
 * @property {RaceConfig|null} raceConfig - Current race configuration
 * @property {AppMode} mode - Current app mode
 * @property {Runner[]} runners - Array of all runners in the race
 * @property {string[]} calledSegments - Array of segment keys that have been called
 * @property {AppSettings} settings - User preferences and settings
 * @property {boolean} isLoading - Whether the app is loading
 * @property {string|null} error - Current error message if any
 */

/**
 * @typedef {Object} ExportData
 * @property {RaceConfig} raceConfig - Race configuration to export
 * @property {string} exportedAt - ISO timestamp when exported
 * @property {string} version - App version
 */

export const RUNNER_STATUSES = {
  NOT_STARTED: 'not-started',
  PASSED: 'passed',
  NON_STARTER: 'non-starter',
  DNF: 'dnf'
};

export const APP_MODES = {
  SETUP: 'setup',
  CHECKPOINT: 'checkpoint',
  BASE_STATION: 'base-station'
};

export const DEFAULT_SETTINGS = {
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

export const SEGMENT_DURATION_MINUTES = 5;

export const GROUP_SIZES = [10, 25, 50, 100];

export const FONT_SIZE_OPTIONS = [
  { value: 0.8, label: 'Small' },
  { value: 0.9, label: 'Medium' },
  { value: 1.0, label: 'Normal' },
  { value: 1.1, label: 'Large' },
  { value: 1.2, label: 'Extra Large' },
  { value: 1.3, label: 'Huge' }
];
