/**
 * M-2 / #13, #17: consistent race date formatting
 *
 * Race Overview printed the raw stored value ("2026-03-04 • 08:00") while the
 * Home cards used a different format again. Both now route through shared
 * helpers so every surface reads the same way.
 */
import { describe, it, expect } from 'vitest';
import { formatLocaleDate, formatLocaleDateTime } from '../../src/utils/raceStatistics';

describe('M-2 / #13: formatLocaleDate', () => {
  it('formats an ISO date as DD/MM/YYYY', () => {
    expect(formatLocaleDate('2026-03-04')).toBe('04/03/2026');
  });

  it('pads single-digit days and months', () => {
    expect(formatLocaleDate('2026-01-09')).toBe('09/01/2026');
  });

  it('never leaks the raw ISO string', () => {
    expect(formatLocaleDate('2026-03-04')).not.toContain('2026-03-04');
  });

  it('handles a missing date without throwing', () => {
    expect(formatLocaleDate(null)).toBe('No date');
    expect(formatLocaleDate(undefined)).toBe('No date');
    expect(formatLocaleDate('')).toBe('No date');
  });

  it('reports an invalid date rather than NaN', () => {
    expect(formatLocaleDate('not-a-date')).toBe('Invalid date');
  });
});

describe('M-2 / #13: formatLocaleDateTime', () => {
  it('appends a 12-hour time with the date', () => {
    expect(formatLocaleDateTime('2026-03-04', '08:00')).toBe('04/03/2026 • 8:00 AM');
  });

  it('formats afternoon times as PM', () => {
    expect(formatLocaleDateTime('2026-03-04', '14:30')).toBe('04/03/2026 • 2:30 PM');
  });

  it('renders midnight as 12 AM and noon as 12 PM', () => {
    expect(formatLocaleDateTime('2026-03-04', '00:15')).toBe('04/03/2026 • 12:15 AM');
    expect(formatLocaleDateTime('2026-03-04', '12:05')).toBe('04/03/2026 • 12:05 PM');
  });

  it('returns just the date when no start time is set', () => {
    expect(formatLocaleDateTime('2026-03-04', null)).toBe('04/03/2026');
    expect(formatLocaleDateTime('2026-03-04', '')).toBe('04/03/2026');
  });
});
