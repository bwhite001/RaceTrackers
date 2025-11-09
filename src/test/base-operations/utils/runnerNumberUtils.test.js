import {
  normalizeRunnerNumber,
  parseRunnerRange,
  parseRunnerInput,
  validateRunnerNumber,
  deduplicateNumbers,
  formatRunnerNumber,
  groupNumbersIntoRanges
} from '../../../utils/runnerNumberUtils';

describe('Runner Number Utilities - Critical Path Tests', () => {
  describe('normalizeRunnerNumber', () => {
    test('removes leading zeros', () => {
      expect(normalizeRunnerNumber('001')).toBe(1);
      expect(normalizeRunnerNumber('01')).toBe(1);
      expect(normalizeRunnerNumber('1')).toBe(1);
    });

    test('handles invalid input', () => {
      expect(normalizeRunnerNumber('')).toBeNull();
      expect(normalizeRunnerNumber('abc')).toBeNull();
      expect(normalizeRunnerNumber('-1')).toBeNull();
    });
  });

  describe('parseRunnerRange', () => {
    test('parses valid ranges', () => {
      expect(parseRunnerRange('100-105')).toEqual([100, 101, 102, 103, 104, 105]);
      expect(parseRunnerRange('1-3')).toEqual([1, 2, 3]);
    });

    test('handles invalid ranges', () => {
      expect(parseRunnerRange('105-100')).toBeNull(); // End < Start
      expect(parseRunnerRange('abc-def')).toBeNull(); // Invalid numbers
      expect(parseRunnerRange('100-200')).toBeNull(); // Exceeds maxRangeSize
    });
  });

  describe('parseRunnerInput', () => {
    test('handles mixed input formats', () => {
      const input = '001, 1, 100-102, 01, 200';
      const expected = [1, 100, 101, 102, 200];
      expect(parseRunnerInput(input)).toEqual(expected);
    });

    test('handles newlines and spaces', () => {
      const input = '100\n101 102\n103';
      const expected = [100, 101, 102, 103];
      expect(parseRunnerInput(input)).toEqual(expected);
    });

    test('deduplicates by default', () => {
      const input = '1,1,1,2,2,3';
      const expected = [1, 2, 3];
      expect(parseRunnerInput(input)).toEqual(expected);
    });
  });

  describe('validateRunnerNumber', () => {
    const raceConfig = {
      runnerRanges: [
        { min: 100, max: 200 },
        { min: 500, max: 550 }
      ]
    };

    test('validates numbers within range', () => {
      expect(validateRunnerNumber(150, raceConfig)).toEqual({ valid: true, reason: null });
      expect(validateRunnerNumber(525, raceConfig)).toEqual({ valid: true, reason: null });
    });

    test('invalidates numbers outside range', () => {
      const result = validateRunnerNumber(300, raceConfig);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Not in race');
    });
  });

  describe('groupNumbersIntoRanges', () => {
    test('groups consecutive numbers', () => {
      const numbers = [1, 2, 3, 5, 7, 8, 9];
      const expected = ['1-3', '5', '7-9'];
      expect(groupNumbersIntoRanges(numbers)).toEqual(expected);
    });
  });
});
