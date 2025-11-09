/**
 * Runner Number Utilities
 * 
 * Utilities for parsing, normalizing, and validating runner numbers
 * Used throughout the base station module for consistent number handling
 */

/**
 * Normalize a single runner number
 * Removes leading zeros, trims whitespace, converts to integer
 * 
 * @param {string|number} input - Raw runner number input
 * @returns {number|null} - Normalized number or null if invalid
 * 
 * @example
 * normalizeRunnerNumber("001") // 1
 * normalizeRunnerNumber("  100  ") // 100
 * normalizeRunnerNumber("abc") // null
 */
export function normalizeRunnerNumber(input) {
  if (input === null || input === undefined || input === '') {
    return null;
  }

  // Convert to string and trim
  const str = String(input).trim();
  
  // Remove leading zeros
  const withoutLeadingZeros = str.replace(/^0+/, '') || '0';
  
  // Parse as integer
  const num = parseInt(withoutLeadingZeros, 10);
  
  // Return null if not a valid positive integer
  if (isNaN(num) || num < 0) {
    return null;
  }
  
  return num;
}

/**
 * Parse a range string into an array of numbers
 * Handles formats like "100-105" or "100–105" (en dash)
 * 
 * @param {string} rangeStr - Range string (e.g., "100-105")
 * @param {number} maxRangeSize - Maximum allowed range size (default: 100)
 * @returns {number[]|null} - Array of numbers or null if invalid
 * 
 * @example
 * parseRunnerRange("100-105") // [100, 101, 102, 103, 104, 105]
 * parseRunnerRange("10-5") // null (invalid range)
 * parseRunnerRange("1-200") // null (exceeds max size)
 */
export function parseRunnerRange(rangeStr, maxRangeSize = 100) {
  if (!rangeStr || typeof rangeStr !== 'string') {
    return null;
  }

  // Match range pattern (handles both hyphen and en dash)
  const rangeMatch = rangeStr.trim().match(/^(\d+)\s*[-–]\s*(\d+)$/);
  
  if (!rangeMatch) {
    return null;
  }

  const start = parseInt(rangeMatch[1], 10);
  const end = parseInt(rangeMatch[2], 10);

  // Validate range
  if (isNaN(start) || isNaN(end)) {
    return null;
  }

  if (start > end) {
    return null; // Invalid range (start > end)
  }

  const rangeSize = end - start + 1;
  if (rangeSize > maxRangeSize) {
    return null; // Range too large
  }

  // Generate array of numbers
  const numbers = [];
  for (let i = start; i <= end; i++) {
    numbers.push(i);
  }

  return numbers;
}

/**
 * Parse runner input text into an array of normalized numbers
 * Handles multiple formats:
 * - Comma separated: "100, 101, 102"
 * - Space separated: "100 101 102"
 * - Line separated: "100\n101\n102"
 * - Ranges: "100-105"
 * - Mixed: "100, 105-107, 110"
 * - Leading zeros: "001, 01, 1" → [1]
 * 
 * @param {string} text - Raw input text
 * @param {Object} options - Parsing options
 * @param {number} options.maxRangeSize - Maximum range size (default: 100)
 * @param {boolean} options.deduplicate - Remove duplicates (default: true)
 * @param {boolean} options.sort - Sort results (default: true)
 * @returns {number[]} - Array of normalized numbers
 * 
 * @example
 * parseRunnerInput("001, 1, 100-102") // [1, 100, 101, 102]
 * parseRunnerInput("5\n10\n5") // [5, 10]
 * parseRunnerInput("100 101 102") // [100, 101, 102]
 */
export function parseRunnerInput(text, options = {}) {
  const {
    maxRangeSize = 100,
    deduplicate = true,
    sort = true
  } = options;

  if (!text || typeof text !== 'string') {
    return [];
  }

  const numbers = [];

  // Split by common separators: comma, space, newline, tab
  const parts = text.split(/[,\n\s\t]+/).filter(part => part.trim());

  for (const part of parts) {
    const trimmed = part.trim();
    
    if (!trimmed) {
      continue;
    }

    // Check if it's a range
    if (trimmed.includes('-') || trimmed.includes('–')) {
      const rangeNumbers = parseRunnerRange(trimmed, maxRangeSize);
      if (rangeNumbers) {
        numbers.push(...rangeNumbers);
      }
      // If range parsing fails, try as single number (might be negative)
      else {
        const num = normalizeRunnerNumber(trimmed);
        if (num !== null) {
          numbers.push(num);
        }
      }
    } else {
      // Parse as single number
      const num = normalizeRunnerNumber(trimmed);
      if (num !== null) {
        numbers.push(num);
      }
    }
  }

  // Deduplicate if requested
  let result = deduplicate ? [...new Set(numbers)] : numbers;

  // Sort if requested
  if (sort) {
    result = result.sort((a, b) => a - b);
  }

  return result;
}

/**
 * Deduplicate an array of numbers
 * 
 * @param {number[]} numbers - Array of numbers
 * @returns {number[]} - Deduplicated array
 */
export function deduplicateNumbers(numbers) {
  if (!Array.isArray(numbers)) {
    return [];
  }
  return [...new Set(numbers)];
}

/**
 * Validate a runner number against race configuration
 * 
 * @param {number} number - Runner number to validate
 * @param {Object} raceConfig - Race configuration object
 * @param {Array} raceConfig.runnerRanges - Array of {min, max} ranges
 * @returns {Object} - Validation result {valid: boolean, reason: string}
 * 
 * @example
 * validateRunnerNumber(150, {runnerRanges: [{min: 100, max: 200}]})
 * // {valid: true, reason: null}
 * 
 * validateRunnerNumber(50, {runnerRanges: [{min: 100, max: 200}]})
 * // {valid: false, reason: "Not in race (valid ranges: 100-200)"}
 */
export function validateRunnerNumber(number, raceConfig) {
  if (number === null || number === undefined) {
    return { valid: false, reason: 'Invalid number' };
  }

  if (!raceConfig || !raceConfig.runnerRanges || !Array.isArray(raceConfig.runnerRanges)) {
    // No race config, assume valid
    return { valid: true, reason: null };
  }

  // Check if number falls within any of the configured ranges
  const isInRange = raceConfig.runnerRanges.some(range => {
    return number >= range.min && number <= range.max;
  });

  if (!isInRange) {
    const rangesStr = raceConfig.runnerRanges
      .map(r => `${r.min}-${r.max}`)
      .join(', ');
    return {
      valid: false,
      reason: `Not in race (valid ranges: ${rangesStr})`
    };
  }

  return { valid: true, reason: null };
}

/**
 * Validate multiple runner numbers
 * 
 * @param {number[]} numbers - Array of runner numbers
 * @param {Object} raceConfig - Race configuration
 * @returns {Object} - Validation results {valid: number[], invalid: Array<{number, reason}>}
 */
export function validateRunnerNumbers(numbers, raceConfig) {
  const valid = [];
  const invalid = [];

  for (const number of numbers) {
    const result = validateRunnerNumber(number, raceConfig);
    if (result.valid) {
      valid.push(number);
    } else {
      invalid.push({ number, reason: result.reason });
    }
  }

  return { valid, invalid };
}

/**
 * Format a runner number for display
 * Ensures consistent formatting across the application
 * 
 * @param {number} number - Runner number
 * @param {Object} options - Formatting options
 * @param {boolean} options.padZeros - Pad with leading zeros (default: false)
 * @param {number} options.minDigits - Minimum number of digits (default: 1)
 * @returns {string} - Formatted number
 * 
 * @example
 * formatRunnerNumber(5) // "5"
 * formatRunnerNumber(5, {padZeros: true, minDigits: 3}) // "005"
 */
export function formatRunnerNumber(number, options = {}) {
  const { padZeros = false, minDigits = 1 } = options;

  if (number === null || number === undefined) {
    return '';
  }

  const str = String(number);

  if (padZeros && str.length < minDigits) {
    return str.padStart(minDigits, '0');
  }

  return str;
}

/**
 * Group numbers into ranges for compact display
 * 
 * @param {number[]} numbers - Sorted array of numbers
 * @returns {string[]} - Array of range strings
 * 
 * @example
 * groupNumbersIntoRanges([1, 2, 3, 5, 7, 8, 9])
 * // ["1-3", "5", "7-9"]
 */
export function groupNumbersIntoRanges(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return [];
  }

  // Sort numbers
  const sorted = [...numbers].sort((a, b) => a - b);
  const ranges = [];
  let rangeStart = sorted[0];
  let rangeEnd = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === rangeEnd + 1) {
      // Continue current range
      rangeEnd = sorted[i];
    } else {
      // End current range and start new one
      if (rangeStart === rangeEnd) {
        ranges.push(String(rangeStart));
      } else {
        ranges.push(`${rangeStart}-${rangeEnd}`);
      }
      rangeStart = sorted[i];
      rangeEnd = sorted[i];
    }
  }

  // Add final range
  if (rangeStart === rangeEnd) {
    ranges.push(String(rangeStart));
  } else {
    ranges.push(`${rangeStart}-${rangeEnd}`);
  }

  return ranges;
}

export default {
  normalizeRunnerNumber,
  parseRunnerRange,
  parseRunnerInput,
  deduplicateNumbers,
  validateRunnerNumber,
  validateRunnerNumbers,
  formatRunnerNumber,
  groupNumbersIntoRanges
};
