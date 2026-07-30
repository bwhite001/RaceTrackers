/**
 * #12: runner ranges must display compactly
 *
 * getRunnerRange expanded an individual-numbers range into every bib number, so
 * a 100-entry range rendered as "1, 2, 3, …" and flooded the race card. A count
 * tells the operator more in less space. Small sets stay listed, since "3
 * individual numbers" is less useful than "7, 12, 19".
 */
import { describe, it, expect } from 'vitest';
import { getRunnerRange } from '../../src/utils/raceStatistics';

describe('#12: getRunnerRange individual-number summarising', () => {
  it('summarises a large individual set as a count', () => {
    const individualNumbers = Array.from({ length: 100 }, (_, i) => i + 1);
    const result = getRunnerRange({ runnerRanges: [{ isIndividual: true, individualNumbers }] });

    expect(result).toBe('100 individual numbers');
    expect(result).not.toMatch(/1, 2, 3/);
  });

  it('still lists a small individual set', () => {
    const result = getRunnerRange({
      runnerRanges: [{ isIndividual: true, individualNumbers: [7, 12, 19] }],
    });
    expect(result).toBe('7, 12, 19');
  });

  it('summarises as soon as the set exceeds three', () => {
    const result = getRunnerRange({
      runnerRanges: [{ isIndividual: true, individualNumbers: [1, 2, 3, 4] }],
    });
    expect(result).toBe('4 individual numbers');
  });

  it('leaves min-max ranges compact and unchanged', () => {
    expect(getRunnerRange({ runnerRanges: [{ min: 100, max: 200 }] })).toBe('100–200');
  });

  it('handles an empty individual set without crashing', () => {
    expect(getRunnerRange({ runnerRanges: [{ isIndividual: true, individualNumbers: [] }] })).toBe('?');
  });

  it('joins multiple ranges', () => {
    const result = getRunnerRange({
      runnerRanges: [
        { min: 1, max: 100 },
        { isIndividual: true, individualNumbers: [500, 501, 502, 503] },
      ],
    });
    expect(result).toBe('1–100, 4 individual numbers');
  });

  it('falls back to minRunner-maxRunner when there are no ranges', () => {
    expect(getRunnerRange({ minRunner: 1, maxRunner: 50 })).toBe('1–50');
  });

  it('returns N/A for a missing race', () => {
    expect(getRunnerRange(null)).toBe('N/A');
  });
});
