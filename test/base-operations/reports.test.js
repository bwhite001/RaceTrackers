import { describe, it, expect } from 'vitest';
import TimeUtils from '../../src/services/timeUtils.js';
import {
  lastSeen, legMedians, overdueRunners, stillOnCourse, timesMatrix, callLog, currentLeaders,
  awaitingByCheckpoint, raceCounts,
} from '../../src/modules/base-operations/services/reports.js';
import { reportedUpTo, buildBoard } from '../../src/modules/base-operations/services/receive.js';

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

  it('past the expected time but the next checkpoint has not reported that far → awaiting, not overdue', () => {
    // 103: CP1 07:00 + 35 → expected 07:35; 104: 07:10 + 35 → 07:45; 102: CP2 07:40 + 30 → 08:10 (not late yet)
    const upTo = new Map([[2, at(7, 40)]]); // CP2 reported up to the 07:40 block
    const rows = overdueRunners({ sightings, order, out, now: at(8, 0), upTo });
    expect(rows.map(r => [r.number, r.nextCp.short, r.overdueMinutes, r.status])).toEqual([
      [103, 'CP2', 25, 'awaiting'], [104, 'CP2', 15, 'awaiting'],
    ]);
  });

  it('overdue once the next checkpoint reports past expected + grace', () => {
    const rows = overdueRunners({ sightings, order, out, now: at(8, 0), upTo: new Map([[2, at(7, 45)]]) });
    // 103 expected 07:35 + 10 grace = 07:45 ≤ 07:45 → overdue; 104 expected 07:45 + 10 = 07:55 > 07:45 → awaiting
    expect(rows.map(r => [r.number, r.status])).toEqual([[103, 'overdue'], [104, 'awaiting']]);
    // expected exactly equal to up-to (no grace) is still awaiting
    const strict = overdueRunners({ sightings, order, out, now: at(8, 0), upTo: new Map([[2, at(7, 35)]]) });
    expect(strict.find(r => r.number === 103).status).toBe('awaiting');
    // grace is configurable
    const noGrace = overdueRunners({ sightings, order, out, now: at(8, 0), upTo: new Map([[2, at(7, 35)]]), graceMinutes: 0 });
    expect(noGrace.find(r => r.number === 103).status).toBe('overdue');
  });

  it('legs with no completed split are skipped; awaiting groups by checkpoint', () => {
    const lonely = new Map([[1, new Map([[150, at(7, 0)]])]]);
    expect(overdueRunners({ sightings: lonely, order, out, now: at(9, 0) })).toEqual([]);
    const rows = overdueRunners({ sightings, order, out, now: at(8, 0), upTo: new Map([[2, at(7, 40)]]) });
    expect(awaitingByCheckpoint(rows)).toEqual([{ cp: order[1], upTo: at(7, 40), numbers: [103, 104] }]);
  });

  it('race counts: on course = in the race and not finished (D2), with "not seen yet"', () => {
    const c = raceCounts({ sightings, out, raceNumbers: [101, 102, 103, 104, 105, 106] });
    expect(c).toEqual({ onCourse: 4, notSeen: 1, finished: 1, dns: 1, dnf: 0 });
  });

  it('still on course groups by last checkpoint, excludes finished and out', () => {
    const groups = stillOnCourse({ sightings, order, out, raceNumbers: [101, 102, 103, 104, 105, 106] });
    expect(groups.map(g => [g.label, g.numbers])).toEqual([
      ['Last at CP1', [103, 104]], ['Last at CP2', [102]], ['Not seen since start', [106]],
    ]);
  });

  it('times matrix never replaces a recorded time; DNF only in an empty cell; late times flagged', () => {
    const m = timesMatrix({
      sightings, order,
      out: new Map([[105, { status: 'DNS' }], [104, { status: 'DNF', checkpoint: 2, time: at(7, 20) }], [101, { status: 'DNS' }]]),
      raceNumbers: [101, 104, 105],
    });
    expect(m.map(r => [r.number, r.status, r.cells.map(c => c.text + (c.flag ? '!' : ''))])).toEqual([
      [101, 'DNS', ['07:00!', '07:30!', '08:00!']],
      [104, 'DNF @CP2', ['07:10', 'DNF', '—']],
      [105, 'DNS', ['—', '—', '—']],
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

  it('reportedUpTo ignores exact (manual) times; the board uses it', () => {
    const records = [
      { checkpointNumber: 1, number: 1, status: 'passed', commonTime: at(7, 15) },
      { checkpointNumber: 1, number: 2, status: 'passed', commonTime: at(7, 20) },
      { checkpointNumber: 1, number: 3, status: 'passed', commonTime: at(7, 53), manualTime: true },
      { checkpointNumber: 2, number: 4, status: 'passed', commonTime: at(7, 30), manualTime: true },
    ];
    const up = reportedUpTo(records);
    expect(up.get(1)).toBe(at(7, 20));
    expect(up.has(2)).toBe(false);
    const board = buildBoard({ checkpoints: [{ number: 1 }, { number: 2 }], records, now: at(8, 0), raceStart: at(6, 30), fieldSize: 10 });
    expect(board[0].lastBlock).toBe(at(7, 20));
    expect(board[1].lastBlock).toBeNull();
  });
});
