/**
 * Checkpoints restricted to some waves (allowedBatches): Mt Glorious 2026 —
 * the 11 km field (wave 3) only passes CP4, so base must not call them
 * missed / skipped / not seen at CP1–3.
 */
import { describe, it, expect } from 'vitest';
import { appliesAt, boardCheckpoints, buildBoard, checkCall } from '../../src/modules/base-operations/services/receive.js';
import { missedReminders, standDownLists } from '../../src/modules/base-operations/services/missed.js';
import { findSkipped } from '../../src/modules/base-operations/services/dataChecks.js';
import { timesMatrix } from '../../src/modules/base-operations/services/reports.js';

const T = (m) => `2026-11-08T0${7 + Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:00.000Z`;
const checkpoints = [1, 2, 3].map(n => ({ number: n, allowedBatches: [1, 2] })).concat({ number: 4, allowedBatches: null });
const order = boardCheckpoints(checkpoints);
const batchOf = new Map([[10, 1], [20, 2], [150, 3]]);
const S = (entries) => new Map(entries.map(([cp, rows]) => [cp, new Map(rows)]));
// 22 km bib 10 seen CP1–4; 11 km bib 150 seen only at CP4
const sightings = S([[1, [[10, T(0)]]], [2, [[10, T(20)]]], [3, [[10, T(40)]]], [4, [[10, T(60)], [150, T(30)]]]]);
const rec = (cp, number, m) => ({ checkpointNumber: cp, number, status: 'passed', commonTime: T(m) });
const records = [rec(1, 10, 0), rec(2, 10, 20), rec(3, 10, 40), rec(4, 150, 30)];

describe('appliesAt', () => {
  it('a checkpoint with no wave list, or a bib with no wave, applies to everyone', () => {
    expect(appliesAt({ number: 4 }, 150, batchOf)).toBe(true);
    expect(appliesAt(order[0], 999, batchOf)).toBe(true);
    expect(appliesAt(order[0], 150, batchOf)).toBe(false);
    expect(appliesAt(order[0], 10, batchOf)).toBe(true);
    expect(appliesAt(order[0], 150)).toBe(true);
  });
});

describe('waves at a checkpoint', () => {
  it('an 11 km runner at CP4 is not skipped / missed at CP1–3', () => {
    expect(findSkipped({ sightings, order, batchOf })).toEqual([]);
    expect(missedReminders({ sightings, order, batchOf }).size).toBe(0);
    // Without the wave map the old behaviour stands
    expect(findSkipped({ sightings, order }).map(i => i.key)).toEqual(['skip:150:1', 'skip:150:2', 'skip:150:3']);
  });

  it('stand-down at CP1 leaves out runners who never pass it', () => {
    const lists = standDownLists({ cpNumber: 1, order, sightings, raceNumbers: [10, 20, 150], batchOf });
    expect(lists.seenFurther).toEqual([]);
    expect(lists.notSeenPast).toEqual([{ number: 20, last: null }]);
  });

  it('calling 150 in at CP4 is not "Not seen CP3"', () => {
    const prevCp = order[2];
    const [r150, r20] = checkCall([{ num: 150, t: T(30) }, { num: 20, t: T(30) }], {
      raceNumbers: new Set([10, 20, 150]), out: new Map(), logged: new Map(),
      prev: { short: 'CP3', seen: sightings.get(3), applies: (n) => appliesAt(prevCp, n, batchOf) },
    });
    expect(r150.note).toBe('');
    expect(r20.note).toBe('Not seen CP3');
  });

  it('board: CP1 closes when the 22 km field is through; CP4 still expects the 22 km runner', () => {
    const board = buildBoard({
      checkpoints, records: [rec(1, 10, 0), rec(1, 20, 1), rec(3, 10, 40), rec(4, 150, 30)], now: T(70), raceStart: T(0),
      fieldSize: 3, raceNumbers: [10, 20, 150], out: new Map(), batchOf,
    });
    expect(board[0].status).toBe('closed');
    // CP4 has 1 (the 11 km runner) and CP3 has 1, but 10 is still to come
    expect(board[3].status).toBe('due');
  });

  it('times by checkpoint: blank, not "—", where the runner never goes', () => {
    const rows = timesMatrix({ sightings, order, out: new Map(), raceNumbers: [150], batchOf });
    expect(rows[0].cells.map(c => c.text)).toEqual(['', '', '', '07:30', '—']);
  });
});
