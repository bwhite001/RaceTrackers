import { describe, it, expect } from 'vitest';
import {
  computeElapsedMs,
  rankRunners,
  groupByGender,
  groupByWave,
  groupByCombined,
  buildLeaderboardEntries,
} from '../../src/modules/base-operations/components/Leaderboard/utils/leaderboardUtils';

// Helpers
const iso = (offsetSec) => new Date(Date.UTC(2025, 0, 1, 6, 0, offsetSec)).toISOString();
const batchStartTime = iso(0); // 06:00:00

const makeRunner = (overrides) => ({
  number: 1,
  firstName: 'Alice',
  lastName: 'Smith',
  gender: 'F',
  batchNumber: 1,
  commonTime: iso(3600), // 1 hour after start
  status: 'finished',
  ...overrides,
});

describe('computeElapsedMs', () => {
  it('returns correct ms for 1 hour elapsed', () => {
    expect(computeElapsedMs(iso(3600), batchStartTime)).toBe(3_600_000);
  });
  it('returns 0 when commonTime equals batchStart', () => {
    expect(computeElapsedMs(batchStartTime, batchStartTime)).toBe(0);
  });
  it('returns null when commonTime is missing', () => {
    expect(computeElapsedMs(null, batchStartTime)).toBeNull();
  });
  it('returns null when batchStartTime is missing', () => {
    expect(computeElapsedMs(iso(3600), null)).toBeNull();
  });
});

describe('rankRunners', () => {
  it('ranks runners 1,2,3 for distinct times', () => {
    const entries = [
      { number: 1, elapsedMs: 3000 },
      { number: 2, elapsedMs: 4000 },
      { number: 3, elapsedMs: 5000 },
    ];
    const ranked = rankRunners(entries);
    expect(ranked.map(r => r.rank)).toEqual([1, 2, 3]);
  });

  it('assigns same rank to tied runners and skips next (1,2,2,4)', () => {
    const entries = [
      { number: 1, elapsedMs: 3000 },
      { number: 2, elapsedMs: 4000 },
      { number: 3, elapsedMs: 4000 },
      { number: 4, elapsedMs: 5000 },
    ];
    const ranked = rankRunners(entries);
    expect(ranked.map(r => r.rank)).toEqual([1, 2, 2, 4]);
  });

  it('returns empty array for empty input', () => {
    expect(rankRunners([])).toEqual([]);
  });
});

describe('groupByGender', () => {
  it('separates runners into M, F, X groups', () => {
    const entries = [
      { number: 1, gender: 'M', elapsedMs: 100 },
      { number: 2, gender: 'F', elapsedMs: 200 },
      { number: 3, gender: 'X', elapsedMs: 300 },
      { number: 4, gender: 'M', elapsedMs: 150 },
    ];
    const grouped = groupByGender(entries);
    expect(grouped.M).toHaveLength(2);
    expect(grouped.F).toHaveLength(1);
    expect(grouped.X).toHaveLength(1);
    // Each group should be ranked separately starting at 1
    expect(grouped.M[0].rank).toBe(1);
    expect(grouped.M[1].rank).toBe(2);
  });

  it('each group is sorted by elapsedMs ascending', () => {
    const entries = [
      { number: 2, gender: 'M', elapsedMs: 200 },
      { number: 1, gender: 'M', elapsedMs: 100 },
    ];
    const grouped = groupByGender(entries);
    expect(grouped.M[0].number).toBe(1);
  });
});

describe('groupByWave', () => {
  it('separates runners by batchNumber', () => {
    const entries = [
      { number: 1, batchNumber: 1, elapsedMs: 100 },
      { number: 2, batchNumber: 2, elapsedMs: 200 },
      { number: 3, batchNumber: 1, elapsedMs: 150 },
    ];
    const grouped = groupByWave(entries);
    expect(grouped[1]).toHaveLength(2);
    expect(grouped[2]).toHaveLength(1);
  });
});

describe('groupByCombined', () => {
  it('creates keys like "M-1" for male wave 1', () => {
    const entries = [
      { number: 1, gender: 'M', batchNumber: 1, elapsedMs: 100 },
      { number: 2, gender: 'F', batchNumber: 1, elapsedMs: 200 },
    ];
    const grouped = groupByCombined(entries);
    expect(grouped['M-1']).toHaveLength(1);
    expect(grouped['F-1']).toHaveLength(1);
  });
});

describe('buildLeaderboardEntries', () => {
  const runners = [
    makeRunner({ number: 1, gender: 'M', batchNumber: 1, commonTime: iso(3600) }),
    makeRunner({ number: 2, firstName: null, lastName: null, gender: 'F', batchNumber: 1, commonTime: iso(7200) }),
    makeRunner({ number: 3, gender: 'M', batchNumber: 1, status: 'dnf', commonTime: null }),
    makeRunner({ number: 4, gender: null, batchNumber: null, commonTime: iso(5400) }),
  ];
  const batches = [{ batchNumber: 1, batchName: 'Wave 1', startTime: batchStartTime }];
  const race = { startTime: batchStartTime };

  it('excludes DNF runners', () => {
    const entries = buildLeaderboardEntries(runners, batches, race);
    expect(entries.find(e => e.number === 3)).toBeUndefined();
  });

  it('excludes runners without commonTime', () => {
    const entries = buildLeaderboardEntries(runners, batches, race);
    entries.forEach(e => expect(e.elapsedMs).not.toBeNull());
  });

  it('defaults missing gender to X', () => {
    const entries = buildLeaderboardEntries(runners, batches, race);
    const runner4 = entries.find(e => e.number === 4);
    expect(runner4.gender).toBe('X');
  });

  it('defaults missing batchNumber to 1', () => {
    const entries = buildLeaderboardEntries(runners, batches, race);
    const runner4 = entries.find(e => e.number === 4);
    expect(runner4.batchNumber).toBe(1);
  });

  it('uses race.startTime as fallback when no matching batch', () => {
    const noBatchRunners = [makeRunner({ number: 5, batchNumber: 99, commonTime: iso(3600) })];
    const entries = buildLeaderboardEntries(noBatchRunners, [], race);
    expect(entries[0].elapsedMs).toBe(3_600_000);
  });

  it('generates displayName as "Runner #N" when no name', () => {
    const entries = buildLeaderboardEntries(runners, batches, race);
    const runner2 = entries.find(e => e.number === 2);
    expect(runner2.displayName).toBe('Runner #2');
  });

  it('generates displayName from firstName+lastName when available', () => {
    const entries = buildLeaderboardEntries(runners, batches, race);
    const runner1 = entries.find(e => e.number === 1);
    expect(runner1.displayName).toBe('Alice Smith');
  });
});
