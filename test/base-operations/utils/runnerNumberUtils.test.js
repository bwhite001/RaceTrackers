import { describe, test, expect } from 'vitest';
import {
  parseRunnerNumbers,
  isValidRunnerNumber,
  formatRunnerNumber,
  findNumberGaps,
  groupIntoRanges,
  formatRange
} from '../../src/../utils/runnerNumberUtils';

describe('Runner Number Utilities', () => {
  describe('parseRunnerNumbers', () => {
    test('handles empty input', () => {
      expect(parseRunnerNumbers('')).toEqual([]);
      expect(parseRunnerNumbers(null)).toEqual([]);
      expect(parseRunnerNumbers(undefined)).toEqual([]);
    });

    test('parses single numbers', () => {
      expect(parseRunnerNumbers('1')).toEqual([1]);
      expect(parseRunnerNumbers('42')).toEqual([42]);
    });

    test('parses comma-separated numbers', () => {
      expect(parseRunnerNumbers('1,2,3')).toEqual([1, 2, 3]);
      expect(parseRunnerNumbers('42,43,44')).toEqual([42, 43, 44]);
    });

    test('parses space-separated numbers', () => {
      expect(parseRunnerNumbers('1 2 3')).toEqual([1, 2, 3]);
      expect(parseRunnerNumbers('42 43 44')).toEqual([42, 43, 44]);
    });

    test('parses ranges', () => {
      expect(parseRunnerNumbers('1-5')).toEqual([1, 2, 3, 4, 5]);
      expect(parseRunnerNumbers('42-45')).toEqual([42, 43, 44, 45]);
    });

    test('parses mixed formats', () => {
      expect(parseRunnerNumbers('1,2,3-5 6,7-10')).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    test('handles invalid input', () => {
      expect(parseRunnerNumbers('abc')).toEqual([]);
      expect(parseRunnerNumbers('1,abc,3')).toEqual([1, 3]);
    });

    test('respects maxRange option', () => {
      expect(parseRunnerNumbers('1-5', { maxRange: 3 })).toEqual([]);
      expect(parseRunnerNumbers('1-3', { maxRange: 3 })).toEqual([1, 2, 3]);
    });

    test('respects maxNumber option', () => {
      expect(parseRunnerNumbers('1,2,999,1000,1001', { maxNumber: 1000 }))
        .toEqual([1, 2, 999, 1000]);
    });

    test('removes duplicates and sorts', () => {
      expect(parseRunnerNumbers('3,1,2,1,2,3')).toEqual([1, 2, 3]);
    });
  });

  describe('isValidRunnerNumber', () => {
    test('validates single numbers', () => {
      expect(isValidRunnerNumber(1)).toBe(true);
      expect(isValidRunnerNumber('42')).toBe(true);
      expect(isValidRunnerNumber(0)).toBe(false);
      expect(isValidRunnerNumber(-1)).toBe(false);
      expect(isValidRunnerNumber('abc')).toBe(false);
    });

    test('respects maxNumber option', () => {
      expect(isValidRunnerNumber(1000, { maxNumber: 999 })).toBe(false);
      expect(isValidRunnerNumber(999, { maxNumber: 999 })).toBe(true);
    });
  });

  describe('formatRunnerNumber', () => {
    test('formats numbers without padding', () => {
      expect(formatRunnerNumber(1)).toBe('1');
      expect(formatRunnerNumber(42)).toBe('42');
    });

    test('formats numbers with padding', () => {
      expect(formatRunnerNumber(1, { minLength: 3 })).toBe('001');
      expect(formatRunnerNumber(42, { minLength: 3 })).toBe('042');
    });

    test('handles invalid input', () => {
      expect(formatRunnerNumber('abc')).toBe('');
      expect(formatRunnerNumber(null)).toBe('');
    });
  });

  describe('findNumberGaps', () => {
    test('finds gaps in sequence', () => {
      expect(findNumberGaps([1, 2, 4, 5, 7])).toEqual([
        { start: 3, end: 3 },
        { start: 6, end: 6 }
      ]);
    });

    test('handles no gaps', () => {
      expect(findNumberGaps([1, 2, 3])).toEqual([]);
    });

    test('handles empty input', () => {
      expect(findNumberGaps([])).toEqual([]);
    });

    test('handles unsorted input', () => {
      expect(findNumberGaps([5, 1, 3])).toEqual([
        { start: 2, end: 2 },
        { start: 4, end: 4 }
      ]);
    });
  });

  describe('groupIntoRanges', () => {
    test('groups consecutive numbers', () => {
      expect(groupIntoRanges([1, 2, 3, 5, 6, 8])).toEqual([
        { start: 1, end: 3 },
        { start: 5, end: 6 },
        { start: 8, end: 8 }
      ]);
    });

    test('handles single number', () => {
      expect(groupIntoRanges([1])).toEqual([
        { start: 1, end: 1 }
      ]);
    });

    test('handles empty input', () => {
      expect(groupIntoRanges([])).toEqual([]);
    });

    test('handles unsorted input', () => {
      expect(groupIntoRanges([3, 1, 2, 6, 5])).toEqual([
        { start: 1, end: 3 },
        { start: 5, end: 6 }
      ]);
    });
  });

  describe('formatRange', () => {
    test('formats single number range', () => {
      expect(formatRange({ start: 1, end: 1 })).toBe('1');
    });

    test('formats number range', () => {
      expect(formatRange({ start: 1, end: 5 })).toBe('1-5');
    });

    test('formats with padding', () => {
      expect(formatRange({ start: 1, end: 5 }, { minLength: 3 })).toBe('001-005');
    });
  });
});
