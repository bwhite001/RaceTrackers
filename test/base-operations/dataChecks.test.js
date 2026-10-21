import { describe, it, expect } from 'vitest';
import TimeUtils from '../../src/services/timeUtils.js';
import {
  findDuplicates, findOutOfOrder, findSkipped, findSeenAfterOut, findUnknownBibs, findImpossiblePace, runChecks,
} from '../../src/modules/base-operations/services/dataChecks.js';

const at = (h, m) => TimeUtils.atLocalTime('2026-11-08T00:00:00.000Z', h, m);
const order = [{ number: 1, short: 'CP1' }, { number: 2, short: 'CP2' }, { number: 3, short: 'CP3' }, { number: 0, short: 'Finish' }];
const S = (entries) => new Map(entries.map(([cp, rows]) => [cp, new Map(rows)]));

describe('data checks (spec §4.12)', () => {
  it('duplicates: same bib + checkpoint, more than one live base record', () => {
    const baseRows = [
      { id: 1, number: 142, checkpointNumber: 3, status: 'passed', commonTime: at(7, 40), markOffEntryTime: at(7, 46) },
      { id: 2, number: 142, checkpointNumber: 3, status: 'passed', commonTime: at(7, 45), markOffEntryTime: at(7, 52) },
      { id: 3, number: 205, checkpointNumber: 1, status: 'passed', commonTime: at(6, 55) },
      { id: 4, number: 205, checkpointNumber: 1, status: 'passed', commonTime: at(6, 55) },
      { id: 5, number: 300, checkpointNumber: 1, status: 'superseded', commonTime: at(6, 55) },
      { id: 6, number: 300, checkpointNumber: 1, status: 'passed', commonTime: at(6, 56) },
    ];
    const d = findDuplicates({ baseRows, order });
    expect(d.map(i => [i.key, i.head, i.same])).toEqual([
      ['dup:142:3', 'CP3 — 2 times', false],
      ['dup:205:1', 'CP1 — same time twice', true],
    ]);
    expect(d[0].detail).toBe('07:40 (call 07:46) and 07:45 (call 07:52)');
  });

  it('out of order: later checkpoint earlier than the one before', () => {
    const issues = findOutOfOrder({ sightings: S([[2, [[221, at(7, 35)]]], [3, [[221, at(7, 25)]]]]), order });
    expect(issues).toEqual([expect.objectContaining({ key: 'order:221:2:3', head: 'CP3 before CP2', detail: 'CP2 07:35 → CP3 07:25' })]);
  });

  it('skipped: seen later, missing an earlier checkpoint', () => {
    const issues = findSkipped({ sightings: S([[1, [[186, at(6, 55)]]], [3, [[186, at(7, 40)]]]]), order });
    expect(issues.map(i => [i.key, i.head, i.detail])).toEqual([['skip:186:2', 'Not reported at CP2', 'CP1 06:55 → CP3 07:40']]);
  });

  it('seen after DNF (later time) or any time while DNS', () => {
    const sightings = S([[1, [[233, at(6, 55)], [150, at(7, 0)]]], [3, [[150, at(7, 40)]]]]);
    const outByNumber = new Map([
      [150, { status: 'DNF', time: at(7, 10), detail: 'CP2 · Injury · 07:10' }],
      [233, { status: 'DNS' }],
    ]);
    const issues = findSeenAfterOut({ sightings, order, outByNumber, baseRows: [] });
    expect(issues.map(i => [i.key, i.head])).toEqual([['after:150:3', 'DNF, then seen at CP3'], ['after:233:1', 'DNS, but seen at CP1']]);
  });

  it('unknown bibs come from rejected numbers on live calls', () => {
    const issues = findUnknownBibs({
      radioCalls: [
        { id: 7, checkpointNumber: 3, receivedAt: at(7, 46), rejected: [{ number: 999, reason: 'Not in race', time: at(7, 40) }, { number: 150, reason: 'DNF' }] },
        { id: 8, checkpointNumber: 1, receivedAt: at(7, 0), undoneAt: at(7, 1), rejected: [{ number: 41, reason: 'Not in race' }] },
      ],
      order,
    });
    expect(issues.map(i => [i.number, i.detail])).toEqual([[999, 'CP3 call at 07:46, block 07:40']]);
  });

  it('impossible pace: split faster than 20 km/h between known distances', () => {
    const distances = new Map([[1, 5], [2, 11], [3, 14.5]]);
    const sightings = S([[1, [[112, at(6, 55)], [113, at(6, 55)]]], [2, [[112, at(7, 5)], [113, at(7, 40)]]]]);
    const issues = findImpossiblePace({ sightings, order, distances });
    expect(issues.map(i => [i.key, i.head])).toEqual([['pace:112:1:2', 'CP1 → CP2 in 10 min']]);
    expect(issues[0].detail).toBe('6 km · CP1 06:55 → CP2 07:05 · 36 km/h');
  });

  it('runChecks hides resolved issues', () => {
    const input = {
      baseRows: [], order, sightings: S([[2, [[221, at(7, 35)]]], [3, [[221, at(7, 25)]]]]),
      outByNumber: new Map(), radioCalls: [], distances: new Map(),
    };
    expect(runChecks(input).order).toHaveLength(1);
    expect(runChecks(input, new Set(['order:221:2:3'])).order).toHaveLength(0);
  });
});
