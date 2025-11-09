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

export default {
  RUNNER_STATUSES,
  SORT_ORDERS,
  FILTER_STATUSES,
  MODULE_TYPES,
  STATUS_COLORS,
  STATUS_LABELS,
  HOTKEYS,
  TIME_FORMATS
};
