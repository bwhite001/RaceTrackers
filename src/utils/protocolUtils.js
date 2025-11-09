/**
 * Protocol Assist Utilities
 * Handles radio check-in protocols, time block management, and communication logging
 */

/**
 * Time block intervals in minutes
 */
export const TIME_BLOCKS = {
  STANDARD: 5,  // Standard 5-minute blocks
  EXTENDED: 10, // Extended 10-minute blocks for busy periods
  URGENT: 2     // 2-minute blocks for critical situations
};

/**
 * Radio protocol types
 */
export const PROTOCOL_TYPES = {
  CHECK_IN: 'check_in',      // Regular runner check-ins
  EMERGENCY: 'emergency',     // Emergency situations
  WITHDRAWAL: 'withdrawal',   // Runner withdrawals
  SWEEP: 'sweep',            // Sweep operations
  LOGISTICS: 'logistics'      // Supply/equipment requests
};

/**
 * Communication priority levels
 */
export const PRIORITY_LEVELS = {
  ROUTINE: 'routine',
  URGENT: 'urgent',
  EMERGENCY: 'emergency'
};

/**
 * Get the next time block based on current time
 * @param {Date} currentTime - Current time
 * @param {number} blockSize - Size of time block in minutes
 * @returns {Date} Next time block
 */
export const getNextTimeBlock = (currentTime = new Date(), blockSize = TIME_BLOCKS.STANDARD) => {
  const minutes = currentTime.getMinutes();
  const nextBlock = Math.ceil(minutes / blockSize) * blockSize;
  const result = new Date(currentTime);
  result.setMinutes(nextBlock);
  result.setSeconds(0);
  result.setMilliseconds(0);
  return result;
};

/**
 * Format a time block for display
 * @param {Date} time - Time to format
 * @returns {string} Formatted time block
 */
export const formatTimeBlock = (time) => {
  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Check if a time is within the current time block
 * @param {Date} time - Time to check
 * @param {Date} blockStart - Start of time block
 * @param {number} blockSize - Size of time block in minutes
 * @returns {boolean} Whether time is within block
 */
export const isWithinTimeBlock = (time, blockStart, blockSize = TIME_BLOCKS.STANDARD) => {
  const blockEnd = new Date(blockStart);
  blockEnd.setMinutes(blockStart.getMinutes() + blockSize);
  return time >= blockStart && time < blockEnd;
};

/**
 * Create a communication log entry
 * @param {Object} params - Log entry parameters
 * @param {string} params.type - Type of communication (from PROTOCOL_TYPES)
 * @param {string} params.message - Communication message
 * @param {string} params.priority - Priority level (from PRIORITY_LEVELS)
 * @param {string[]} params.runners - Array of affected runner numbers
 * @param {Date} params.timestamp - Time of communication
 * @returns {Object} Log entry object
 */
export const createLogEntry = ({
  type,
  message,
  priority = PRIORITY_LEVELS.ROUTINE,
  runners = [],
  timestamp = new Date()
}) => {
  return {
    id: `${timestamp.getTime()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    message,
    priority,
    runners,
    timestamp,
    timeBlock: getNextTimeBlock(timestamp),
    acknowledged: false,
    resolved: false
  };
};

/**
 * Validate a radio check-in message
 * @param {Object} message - Message to validate
 * @returns {Object} Validation result
 */
export const validateMessage = (message) => {
  const errors = {};

  if (!message.type || !Object.values(PROTOCOL_TYPES).includes(message.type)) {
    errors.type = 'Invalid protocol type';
  }

  if (!message.message?.trim()) {
    errors.message = 'Message is required';
  }

  if (!message.priority || !Object.values(PRIORITY_LEVELS).includes(message.priority)) {
    errors.priority = 'Invalid priority level';
  }

  if (message.runners && !Array.isArray(message.runners)) {
    errors.runners = 'Runners must be an array';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Sort log entries by priority and time
 * @param {Object[]} entries - Array of log entries
 * @returns {Object[]} Sorted entries
 */
export const sortLogEntries = (entries) => {
  const priorityOrder = {
    [PRIORITY_LEVELS.EMERGENCY]: 0,
    [PRIORITY_LEVELS.URGENT]: 1,
    [PRIORITY_LEVELS.ROUTINE]: 2
  };

  return [...entries].sort((a, b) => {
    // First sort by priority
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Then by timestamp (most recent first)
    return b.timestamp - a.timestamp;
  });
};

/**
 * Group log entries by time block
 * @param {Object[]} entries - Array of log entries
 * @returns {Object} Entries grouped by time block
 */
export const groupEntriesByTimeBlock = (entries) => {
  return entries.reduce((groups, entry) => {
    const blockKey = formatTimeBlock(entry.timeBlock);
    if (!groups[blockKey]) {
      groups[blockKey] = [];
    }
    groups[blockKey].push(entry);
    return groups;
  }, {});
};

/**
 * Generate a summary of communications for a time block
 * @param {Object[]} entries - Array of log entries
 * @returns {string} Summary text
 */
export const generateBlockSummary = (entries) => {
  const stats = entries.reduce((acc, entry) => {
    acc.total++;
    acc[entry.type] = (acc[entry.type] || 0) + 1;
    acc.runners = [...new Set([...acc.runners, ...entry.runners])];
    return acc;
  }, { total: 0, runners: [] });

  return `${stats.total} communications, ${stats.runners.length} runners affected`;
};

export default {
  TIME_BLOCKS,
  PROTOCOL_TYPES,
  PRIORITY_LEVELS,
  getNextTimeBlock,
  formatTimeBlock,
  isWithinTimeBlock,
  createLogEntry,
  validateMessage,
  sortLogEntries,
  groupEntriesByTimeBlock,
  generateBlockSummary
};
