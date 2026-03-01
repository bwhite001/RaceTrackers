/**
 * Race Statistics Utilities
 * 
 * Provides helper functions for categorizing and analyzing races.
 * Follows DRY principle by centralizing race-related calculations.
 * 
 * @module raceStatistics
 */

/**
 * Determines if a race is currently active (happening today)
 * @param {Object} race - Race object with date property
 * @returns {boolean} True if race is today
 */
export const isRaceActive = (race) => {
  if (!race || !race.date) return false;
  
  const today = new Date();
  const raceDate = new Date(race.date);
  
  return (
    raceDate.getFullYear() === today.getFullYear() &&
    raceDate.getMonth() === today.getMonth() &&
    raceDate.getDate() === today.getDate()
  );
};

/**
 * Determines if a race is in the future
 * @param {Object} race - Race object with date property
 * @returns {boolean} True if race is in the future
 */
export const isRaceUpcoming = (race) => {
  if (!race || !race.date) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  
  const raceDate = new Date(race.date);
  raceDate.setHours(0, 0, 0, 0);
  
  return raceDate > today;
};

/**
 * Determines if a race is in the past
 * @param {Object} race - Race object with date property
 * @returns {boolean} True if race is in the past
 */
export const isRacePast = (race) => {
  if (!race || !race.date) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  
  const raceDate = new Date(race.date);
  raceDate.setHours(0, 0, 0, 0);
  
  return raceDate < today;
};

/**
 * Gets all currently active races (happening today)
 * @param {Array<Object>} races - Array of race objects
 * @returns {Array<Object>} Array of active races
 */
export const getCurrentRaces = (races) => {
  if (!Array.isArray(races)) return [];
  return races.filter(isRaceActive);
};

/**
 * Gets all upcoming races (future dates)
 * Sorted by date (earliest first)
 * @param {Array<Object>} races - Array of race objects
 * @returns {Array<Object>} Array of upcoming races
 */
export const getUpcomingRaces = (races) => {
  if (!Array.isArray(races)) return [];
  
  return races
    .filter(isRaceUpcoming)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};

/**
 * Gets the most recent completed races
 * Sorted by date (most recent first)
 * @param {Array<Object>} races - Array of race objects
 * @param {number} count - Number of races to return (default: 3)
 * @returns {Array<Object>} Array of recent past races
 */
export const getRecentRaces = (races, count = 3) => {
  if (!Array.isArray(races)) return [];
  
  return races
    .filter(isRacePast)
    .sort((a, b) => new Date(b.date) - new Date(a.date)) // Most recent first
    .slice(0, count);
};

/**
 * Calculates race progress based on runner statuses
 * @param {Object} race - Race object
 * @param {Array<Object>} runners - Array of runner objects with status property
 * @returns {Object} Progress statistics
 * @returns {number} return.total - Total number of runners
 * @returns {number} return.completed - Number of completed runners (finished, DNF, withdrawn, etc.)
 * @returns {number} return.active - Number of active runners
 * @returns {number} return.notStarted - Number of runners not yet started
 * @returns {number} return.percentage - Completion percentage (0-100)
 */
export const getRaceProgress = (race, runners = []) => {
  if (!Array.isArray(runners) || runners.length === 0) {
    return {
      total: 0,
      completed: 0,
      active: 0,
      notStarted: 0,
      percentage: 0,
    };
  }

  const total = runners.length;
  const notStarted = runners.filter(r => r.status === 'not_started').length;
  const active = runners.filter(r => r.status === 'active').length;
  const completed = runners.filter(r => 
    ['finished', 'dnf', 'dns', 'withdrawn', 'disqualified'].includes(r.status)
  ).length;

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    active,
    notStarted,
    percentage,
  };
};

/**
 * Categorizes races into current, upcoming, and recent
 * @param {Array<Object>} races - Array of race objects
 * @param {number} recentCount - Number of recent races to include (default: 3)
 * @returns {Object} Categorized races
 * @returns {Array<Object>} return.current - Currently active races
 * @returns {Array<Object>} return.upcoming - Upcoming races
 * @returns {Array<Object>} return.recent - Recent past races
 * @returns {Array<Object>} return.all - All races sorted by date (newest first)
 */
export const categorizeRaces = (races, recentCount = 3) => {
  if (!Array.isArray(races)) {
    return {
      current: [],
      upcoming: [],
      recent: [],
      all: [],
    };
  }

  const current = getCurrentRaces(races);
  const upcoming = getUpcomingRaces(races);
  const recent = getRecentRaces(races, recentCount);
  
  // All races sorted by date (newest first)
  const all = [...races].sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    current,
    upcoming,
    recent,
    all,
  };
};

/**
 * Formats a race date for display
 * @param {string|Date} date - Date to format
 * @param {Object} options - Formatting options
 * @param {boolean} options.includeYear - Whether to include year (default: true)
 * @param {boolean} options.includeDay - Whether to include day of week (default: false)
 * @returns {string} Formatted date string
 */
export const formatRaceDate = (date, options = {}) => {
  const { includeYear = true, includeDay = false } = options;
  
  if (!date) return 'No date';
  
  const raceDate = new Date(date);
  
  if (isNaN(raceDate.getTime())) return 'Invalid date';
  
  const formatOptions = {
    month: 'short',
    day: 'numeric',
  };
  
  if (includeYear) {
    formatOptions.year = 'numeric';
  }
  
  if (includeDay) {
    formatOptions.weekday = 'short';
  }
  
  return raceDate.toLocaleDateString('en-US', formatOptions);
};

/**
 * Gets a human-readable status for a race
 * @param {Object} race - Race object
 * @returns {string} Status string ('Active', 'Upcoming', 'Completed')
 */
export const getRaceStatus = (race) => {
  if (!race) return 'Unknown';
  
  if (isRaceActive(race)) return 'Active';
  if (isRaceUpcoming(race)) return 'Upcoming';
  if (isRacePast(race)) return 'Completed';
  
  return 'Unknown';
};

/**
 * Gets a color class for race status badge
 * @param {Object} race - Race object
 * @returns {string} Tailwind color classes
 */
export const getRaceStatusColor = (race) => {
  if (!race) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  
  if (isRaceActive(race)) {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
  }
  
  if (isRaceUpcoming(race)) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
  }
  
  if (isRacePast(race)) {
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
  
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
};

/**
 * Searches races by name or date
 * @param {Array<Object>} races - Array of race objects
 * @param {string} query - Search query
 * @returns {Array<Object>} Filtered races
 */
export const searchRaces = (races, query) => {
  if (!Array.isArray(races) || !query || query.trim() === '') {
    return races;
  }
  
  const lowerQuery = query.toLowerCase().trim();
  
  return races.filter(race => {
    const nameMatch = race.name?.toLowerCase().includes(lowerQuery);
    const dateMatch = race.date?.toLowerCase().includes(lowerQuery);
    const formattedDateMatch = formatRaceDate(race.date).toLowerCase().includes(lowerQuery);
    
    return nameMatch || dateMatch || formattedDateMatch;
  });
};

/**
 * Gets runner count range for a race
 * @param {Object} race - Race object with minRunner and maxRunner
 * @returns {string} Formatted runner range (e.g., "1-100" or "Multiple ranges")
 */
export const getRunnerRange = (race) => {
  if (!race) return 'N/A';
  
  if (race.minRunner !== undefined && race.maxRunner !== undefined) {
    return `${race.minRunner}-${race.maxRunner}`;
  }
  
  if (race.runnerRanges && Array.isArray(race.runnerRanges)) {
    if (race.runnerRanges.length === 1) {
      const r = race.runnerRanges[0];
      if (r && typeof r === 'object') {
        return r.isIndividual ? `${r.count || r.individualNumbers?.length || '?'} individual` : `${r.min}-${r.max}`;
      }
      return String(r);
    }
    return 'Multiple ranges';
  }
  
  return 'N/A';
};

export default {
  isRaceActive,
  isRaceUpcoming,
  isRacePast,
  getCurrentRaces,
  getUpcomingRaces,
  getRecentRaces,
  getRaceProgress,
  categorizeRaces,
  formatRaceDate,
  getRaceStatus,
  getRaceStatusColor,
  searchRaces,
  getRunnerRange,
};
