/**
 * Runner Status Constants
 */
export const RUNNER_STATUSES = {
  NOT_STARTED: 'not_started',
  ACTIVE: 'active',
  FINISHED: 'finished',
  DNF: 'dnf', // Did Not Finish
  DNS: 'dns', // Did Not Start
  WITHDRAWN: 'withdrawn',
  DISQUALIFIED: 'disqualified'
};

/**
 * Sort Order Options
 */
export const SORT_ORDERS = {
  NUMBER: 'number',
  STATUS: 'status',
  TIME: 'time',
  CHECKPOINT: 'checkpoint'
};

/**
 * Filter Status Options
 */
export const FILTER_STATUSES = {
  ALL: 'all',
  ACTIVE: 'active',
  FINISHED: 'finished',
  DNF: 'dnf',
  DNS: 'dns',
  WITHDRAWN: 'withdrawn'
};

/**
 * Module Types
 */
export const MODULE_TYPES = {
  BASE_STATION: 'base_station',
  CHECKPOINT: 'checkpoint',
  RACE_SETUP: 'race_setup'
};

/**
 * Runner Type Definition
 * @typedef {Object} Runner
 * @property {number} number - Runner's bib number
 * @property {string} [firstName] - Runner's first name (optional)
 * @property {string} [lastName] - Runner's last name (optional)
 * @property {'M'|'F'|'X'} [gender] - Runner's gender (default 'X')
 * @property {number} [batchNumber] - Wave/batch number this runner belongs to (default 1)
 * @property {string} status - Current status (from RUNNER_STATUSES)
 * @property {Object} checkpoints - Checkpoint times keyed by checkpoint number
 * @property {string} [finishTime] - ISO timestamp of finish
 * @property {string} [startTime] - ISO timestamp of start
 * @property {string} [dnfTime] - ISO timestamp of DNF
 * @property {string} [dnfReason] - Reason for DNF
 * @property {string} [dnsReason] - Reason for DNS
 * @property {string} [withdrawalReason] - Reason for withdrawal
 * @property {string} [disqualificationReason] - Reason for disqualification
 * @property {string} lastUpdate - ISO timestamp of last update
 */

/**
 * Race Batch / Wave Type Definition
 * @typedef {Object} RaceBatch
 * @property {number} id - Auto-incremented DB id
 * @property {number} raceId - Parent race id
 * @property {number} batchNumber - Wave number (1-based)
 * @property {string} batchName - Display name e.g. "Elite Wave", "Wave A"
 * @property {string} startTime - ISO timestamp of this wave's start
 */

/**
 * Checkpoint Runner Type Definition (v8)
 * @typedef {Object} CheckpointRunner
 * @property {number} raceId
 * @property {number} checkpointNumber
 * @property {number} number - Bib number
 * @property {string} [actualTime] - Exact tap timestamp (ISO)
 * @property {string} [commonTime] - Floored to 5-min interval (ISO)
 * @property {string} [commonTimeLabel] - e.g. "10:45–10:50"
 * @property {boolean} calledIn - Whether this group has been called to base
 * @property {string} [callInTime] - When group was called (ISO)
 * @property {string} status
 * @property {string} [notes]
 */

/**
 * Race Configuration Type Definition
 * @typedef {Object} RaceConfig
 * @property {string} name - Race name
 * @property {string} date - Race date
 * @property {string} startTime - Race start time
 * @property {Array<string>} checkpoints - Array of checkpoint names
 * @property {Array<string>} runnerRanges - Array of runner number ranges (e.g. ["1-100", "200-250"])
 */

/**
 * Statistics Type Definition
 * @typedef {Object} RaceStats
 * @property {number} total - Total number of runners
 * @property {number} finished - Number of finished runners
 * @property {number} active - Number of active runners
 * @property {number} dnf - Number of DNF runners
 * @property {number} dns - Number of DNS runners
 */

/**
 * Base Operations Store State Type Definition
 * @typedef {Object} BaseOperationsState
 * @property {string|null} currentRaceId - Current race ID
 * @property {number} checkpointNumber - Current checkpoint number
 * @property {Array<Runner>} runners - Array of runners
 * @property {boolean} loading - Loading state
 * @property {string|null} error - Error message
 * @property {string|null} lastSync - ISO timestamp of last sync
 * @property {string} sortOrder - Current sort order
 * @property {string} filterStatus - Current filter status
 * @property {string} searchQuery - Current search query
 * @property {Array<number>} selectedRunners - Array of selected runner numbers
 * @property {string|null} commonTime - Common time for batch entry
 * @property {boolean} batchEntryMode - Batch entry mode state
 * @property {RaceStats} stats - Race statistics
 */

export const STATUS_COLORS = {
  [RUNNER_STATUSES.NOT_STARTED]: 'gray',
  [RUNNER_STATUSES.ACTIVE]: 'blue',
  [RUNNER_STATUSES.FINISHED]: 'green',
  [RUNNER_STATUSES.DNF]: 'red',
  [RUNNER_STATUSES.DNS]: 'yellow',
  [RUNNER_STATUSES.WITHDRAWN]: 'orange',
  [RUNNER_STATUSES.DISQUALIFIED]: 'purple'
};

export const STATUS_LABELS = {
  [RUNNER_STATUSES.NOT_STARTED]: 'Not Started',
  [RUNNER_STATUSES.ACTIVE]: 'Active',
  [RUNNER_STATUSES.FINISHED]: 'Finished',
  [RUNNER_STATUSES.DNF]: 'DNF',
  [RUNNER_STATUSES.DNS]: 'DNS',
  [RUNNER_STATUSES.WITHDRAWN]: 'Withdrawn',
  [RUNNER_STATUSES.DISQUALIFIED]: 'Disqualified'
};

/**
 * Hotkey Configuration
 */
export const HOTKEYS = {
  NEW_ENTRY: 'n',
  REPORTS: 'r',
  DROPOUT: 'd',
  HELP: 'h',
  ESCAPE: 'escape',
  TAB_NEXT: 'ctrl+right',
  TAB_PREV: 'ctrl+left',
  SAVE: 'ctrl+enter',
  UNDO: 'ctrl+z',
  SEARCH: '/',
  NOW: 't'
};

/**
 * Time Format Options
 */
export const TIME_FORMATS = {
  DISPLAY: 'HH:mm:ss',
  INPUT: 'HH:mm',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
};

/**
 * App Modes
 */
export const APP_MODES = {
  CHECKPOINT: 'checkpoint',
  BASE_STATION: 'base_station',
  RACE_SETUP: 'race_setup',
  SETUP: 'setup',
  RACE_OVERVIEW: 'race_overview'
};

/**
 * View Modes for Runner Display
 */
export const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list'
};

/**
 * Contrast Modes
 */
export const CONTRAST_MODES = {
  NORMAL: 'normal',
  HIGH: 'high'
};

/**
 * Group Sizes for Runner Display
 */
export const GROUP_SIZES = {
  SMALL: 10,
  MEDIUM: 25,
  LARGE: 50,
  XLARGE: 100
};

/**
 * Touch Target Sizes (WCAG 2.5.5)
 */
export const TOUCH_TARGETS = {
  STANDARD: 44,  // Minimum for WCAG AA
  OPTIMIZED: 48, // Recommended for touch devices
  LARGE: 56      // Enhanced accessibility
};

/**
 * Font Size Range
 */
export const FONT_SIZE = {
  MIN: 0.8,
  MAX: 1.5,
  DEFAULT: 1.0,
  STEP: 0.1
};

/**
 * Segment Duration in Minutes
 */
export const SEGMENT_DURATION_MINUTES = 5;

/**
 * Default Status Colors
 */
export const DEFAULT_STATUS_COLORS = {
  'not-started': '#9ca3af',  // Gray-400
  'passed': '#10b981',       // Green-500
  'non-starter': '#ef4444',  // Red-500
  'dnf': '#f59e0b'          // Amber-500
};

/**
 * Default Settings
 * Comprehensive settings object with all customization options
 */
export const DEFAULT_SETTINGS = {
  // Theme Settings
  darkMode: false,
  highContrastMode: false,
  reducedMotion: false,
  
  // Display Settings
  fontSize: FONT_SIZE.DEFAULT,
  runnerViewMode: VIEW_MODES.GRID,
  groupSize: GROUP_SIZES.MEDIUM,
  touchOptimized: true,
  compactMode: false,
  
  // Accessibility Settings
  soundEnabled: true,
  hapticsEnabled: true,
  keyboardShortcuts: true,
  
  // Color Settings
  statusColors: DEFAULT_STATUS_COLORS,
  
  // Performance Settings
  autoSave: true,
  segmentDuration: SEGMENT_DURATION_MINUTES
};

export default {
  RUNNER_STATUSES,
  SORT_ORDERS,
  FILTER_STATUSES,
  MODULE_TYPES,
  STATUS_COLORS,
  STATUS_LABELS,
  HOTKEYS,
  TIME_FORMATS,
  APP_MODES,
  VIEW_MODES,
  CONTRAST_MODES,
  GROUP_SIZES,
  TOUCH_TARGETS,
  FONT_SIZE,
  SEGMENT_DURATION_MINUTES,
  DEFAULT_STATUS_COLORS,
  DEFAULT_SETTINGS
};
