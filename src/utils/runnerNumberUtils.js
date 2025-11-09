/**
 * Runner Number Utilities
 * Handles parsing, validation, and normalization of runner numbers
 */

/**
 * Parse a string of runner numbers into an array of numbers
 * Handles various formats:
 * - Single numbers: "1", "42"
 * - Comma separated: "1,2,3", "42, 43, 44"
 * - Space separated: "1 2 3", "42 43 44"
 * - Ranges: "1-5", "42-45"
 * - Mixed: "1,2,3-5 6,7-10"
 * 
 * @param {string} input - The string to parse
 * @param {Object} options - Parsing options
 * @param {number} options.maxRange - Maximum allowed range size (default: 100)
 * @param {number} options.maxNumber - Maximum allowed number (default: 9999)
 * @returns {number[]} Array of parsed and normalized numbers
 */
export const parseRunnerNumbers = (input, options = {}) => {
  const {
    maxRange = 100,
    maxNumber = 9999
  } = options;

  if (!input || typeof input !== 'string') {
    return [];
  }

  // Split input on commas, spaces, and newlines
  const parts = input.split(/[,\s\n]+/).filter(Boolean);
  const numbers = new Set();

  for (const part of parts) {
    // Check for range format (e.g., "1-5")
    const rangeMatch = part.match(/^(\d+)\s*[-–]\s*(\d+)$/);
    
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);

      // Validate range
      if (
        !isNaN(start) && 
        !isNaN(end) && 
        start > 0 && 
        end > 0 && 
        start <= end && 
        end <= maxNumber && 
        (end - start) <= maxRange
      ) {
        for (let i = start; i <= end; i++) {
          numbers.add(i);
        }
      }
    } else {
      // Handle single number
      const num = parseInt(part, 10);
      if (!isNaN(num) && num > 0 && num <= maxNumber) {
        numbers.add(num);
      }
    }
  }

  return Array.from(numbers).sort((a, b) => a - b);
};

/**
 * Validate a single runner number
 * @param {number|string} number - Number to validate
 * @param {Object} options - Validation options
 * @param {number} options.maxNumber - Maximum allowed number (default: 9999)
 * @returns {boolean} Whether the number is valid
 */
export const isValidRunnerNumber = (number, options = {}) => {
  const { maxNumber = 9999 } = options;
  const num = parseInt(number, 10);
  return !isNaN(num) && num > 0 && num <= maxNumber;
};

/**
 * Format a runner number for display
 * @param {number|string} number - Number to format
 * @param {Object} options - Formatting options
 * @param {number} options.minLength - Minimum length with leading zeros (default: 0)
 * @returns {string} Formatted number
 */
export const formatRunnerNumber = (number, options = {}) => {
  const { minLength = 0 } = options;
  const num = parseInt(number, 10);
  
  if (isNaN(num)) {
    return '';
  }

  return num.toString().padStart(minLength, '0');
};

/**
 * Find gaps in a sequence of runner numbers
 * @param {number[]} numbers - Array of runner numbers
 * @returns {Array<{start: number, end: number}>} Array of gaps
 */
export const findNumberGaps = (numbers) => {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return [];
  }

  const sorted = [...new Set(numbers)].sort((a, b) => a - b);
  const gaps = [];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const previous = sorted[i - 1];

    if (current - previous > 1) {
      gaps.push({
        start: previous + 1,
        end: current - 1
      });
    }
  }

  return gaps;
};

/**
 * Group consecutive numbers into ranges
 * @param {number[]} numbers - Array of numbers to group
 * @returns {Array<{start: number, end: number}>} Array of ranges
 */
export const groupIntoRanges = (numbers) => {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return [];
  }

  const sorted = [...new Set(numbers)].sort((a, b) => a - b);
  const ranges = [];
  let rangeStart = sorted[0];
  let previous = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    
    if (current - previous > 1) {
      ranges.push({
        start: rangeStart,
        end: previous
      });
      rangeStart = current;
    }
    
    previous = current;
  }

  ranges.push({
    start: rangeStart,
    end: previous
  });

  return ranges;
};

/**
 * Format a range of numbers for display
 * @param {Object} range - Range object with start and end properties
 * @param {Object} options - Formatting options
 * @param {number} options.minLength - Minimum length with leading zeros
 * @returns {string} Formatted range
 */
export const formatRange = (range, options = {}) => {
  const { start, end } = range;
  const { minLength = 0 } = options;

  if (start === end) {
    return formatRunnerNumber(start, { minLength });
  }

  return `${formatRunnerNumber(start, { minLength })}-${formatRunnerNumber(end, { minLength })}`;
};

export default {
  parseRunnerNumbers,
  isValidRunnerNumber,
  formatRunnerNumber,
  findNumberGaps,
  groupIntoRanges,
  formatRange
};
