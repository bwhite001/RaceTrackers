import { describe, it, expect } from 'vitest';
import TimeUtils from '../../src/services/timeUtils.js';
import {
  toBlock, blocksBetween, nextBlock, clampTime, parseExactTime, earliestTime, hhmm, isBlockTime,
} from '../../src/services/blocks.js';

// Local-time ISO helper so the tests don't depend on the machine's timezone
const at = (h, m) => TimeUtils.atLocalTime('2026-11-08T00:00:00.000Z', h, m);

describe('blocks', () => {
  it('floors to the 5-minute block', () => {
    expect(hhmm(toBlock(at(7, 47)))).toBe('07:45');
    expect(hhmm(toBlock(at(7, 40)))).toBe('07:40');
  });

  it('lists every block between two times inclusive', () => {
    expect(blocksBetween(at(7, 31), at(7, 47)).map(hhmm)).toEqual(['07:30', '07:35', '07:40', '07:45']);
  });

  it('next block is capped at the current block', () => {
    expect(hhmm(nextBlock(at(7, 30), at(7, 47)))).toBe('07:35');
    expect(hhmm(nextBlock(at(7, 45), at(7, 47)))).toBe('07:45');
  });

  it('clamps to race start and now', () => {
    expect(clampTime(at(6, 0), at(6, 30), at(7, 47))).toBe(at(6, 30));
    expect(clampTime(at(8, 0), at(6, 30), at(7, 47))).toBe(at(7, 47));
    expect(clampTime(at(7, 0), at(6, 30), at(7, 47))).toBe(at(7, 0));
  });

  it('parses HH:MM and HHMM onto the date of now, rejects junk', () => {
    expect(hhmm(parseExactTime('0742', at(7, 47)))).toBe('07:42');
    expect(hhmm(parseExactTime('7:42', at(7, 47)))).toBe('07:42');
    expect(parseExactTime('2561', at(7, 47))).toBeNull();
    expect(parseExactTime('abc', at(7, 47))).toBeNull();
  });

  it('earliest time is race start on race day, else a 12 h window', () => {
    expect(earliestTime(at(6, 30), at(7, 47))).toBe(at(6, 30));
    expect(earliestTime('2020-01-01T00:00:00.000Z', at(7, 47))).toBe(TimeUtils.addMinutes(at(7, 47), -720));
    expect(earliestTime(at(9, 0), at(7, 47))).toBe(TimeUtils.addMinutes(at(7, 47), -720));
  });

  it('knows block boundaries', () => {
    expect(isBlockTime(at(7, 45))).toBe(true);
    expect(isBlockTime(at(7, 47))).toBe(false);
  });
});
