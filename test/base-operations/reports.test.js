import { describe, it, expect } from 'vitest';
import TimeUtils from '../../src/services/timeUtils.js';
import {
  lastSeen, legMedians, overdueRunners, stillOnCourse, timesMatrix, callLog, currentLeaders,
} from '../../src/modules/base-operations/services/reports.js';

const at = (h, m) => TimeUtils.atLocalTime('2026-11-08T00:00:00.000Z', h, m);
const order = [{ number: 1, short: 'CP1' }, { number: 2, short: 'CP2' }, { number: 0, short: 'Finish' }];
const sightings = new Map([
  [1, new Map([[101, at(7, 0)], [102, at(7, 0)], [103, at(7, 0)], [104, at(7, 10)]])],
  [2, new Map([[101, at(7, 30)], [102, at(7, 40)]])],
  [0, new Map([[101, at(8, 0)]])],
]);
const out = new Map([[105, { status: 'DNS' }]]);

describe('base reports', () => {
  it('lastSeen finds the furthest checkpoint', () => {
    const s = lastSeen(sightings, order);
    expect(s.get(101).cp.short).toBe('Finish');
    expect(s.get(102).cp.short).toBe('CP2');
    expect(s.get(104).cp.short).toBe('CP1');
  });

  it('leg medians come from runners seen at both ends', () => {
    expect(legMedians(sightings, order)).toEqual([35, 30]);
  });

  it('overdue = last seen + median split, past now', () => {
    const rows = overdueRunners({ sightings, order, out, now: at(8, 0) });
    // 103: CP1 07:00 + 35 → 07:35, 25 min overdue; 104: 07:10 + 35 → 07:45, 15; 102: CP2 07:40 + 30 → 08:10, not yet
    expect(rows.map(r => [r.number, r.nextCp.short, r.overdueMinutes])).toEqual([[103, 'CP2', 25], [104, 'CP2', 15]]);
  });

  it('still on course groups by last checkpoint, excludes finished and out', () => {
    const groups = stillOnCourse({ sightings, order, out, raceNumbers: [101, 102, 103, 104, 105, 106] });
    expect(groups.map(g => [g.label, g.numbers])).toEqual([
      ['Last at CP1', [103, 104]], ['Last at CP2', [102]], ['Not seen since start', [106]],
    ]);
  });

  it('times matrix shows times, DNF / DNS in place', () => {
    const m = timesMatrix({ sightings, order, out: new Map([[105, { status: 'DNS' }], [104, { status: 'DNF', checkpoint: 2 }]]), raceNumbers: [101, 104, 105] });
    expect(m).toEqual([
      { number: 101, cells: ['07:00', '07:30', '08:00'] },
      { number: 104, cells: ['07:10', 'DNF', '—'] },
      { number: 105, cells: ['DNS', '—', '—'] },
    ]);
  });

  it('call log counts non-undone calls per checkpoint', () => {
    const log = callLog({
      radioCalls: [
        { checkpointNumber: 1, receivedAt: at(7, 5), recorded: [101, 102] },
        { checkpointNumber: 1, receivedAt: at(7, 15), recorded: [104] },
        { checkpointNumber: 1, receivedAt: at(7, 16), recorded: [9], undoneAt: at(7, 16) },
      ],
      board: [{ number: 1, short: 'CP1', lastBlock: at(7, 10) }],
    });
    expect(log).toEqual([{ number: 1, short: 'CP1', calls: 2, numbers: 3, lastCall: at(7, 15), upTo: at(7, 10) }]);
  });

  it('leaders: furthest first, then fastest; elapsed from race start', () => {
    const l = currentLeaders({ sightings, order, out, raceStart: at(6, 30), meta: new Map([[101, { firstName: 'Sarah', lastName: 'J', gender: 'F' }]]) });
    expect(l.slice(0, 3).map(r => [r.rank, r.number, r.lastCp.short])).toEqual([[1, 101, 'Finish'], [2, 102, 'CP2'], [3, 103, 'CP1']]);
    expect(l[0]).toMatchObject({ name: 'Sarah J', gender: 'F', elapsed: '01:30:00' });
  });
});
