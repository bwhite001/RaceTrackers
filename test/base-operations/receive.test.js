import { describe, it, expect } from 'vitest';
import TimeUtils from '../../src/services/timeUtils.js';
import { hhmm } from '../../src/services/blocks.js';
import {
  checkBaseNumber, checkCall, isRecordable, outStatusMap, sightingsByCheckpoint, buildBoard, boardCheckpoints, CHECK,
} from '../../src/modules/base-operations/services/receive.js';

const at = (h, m) => TimeUtils.atLocalTime('2026-11-08T00:00:00.000Z', h, m);

const ctx = {
  raceNumbers: new Set([140, 141, 142, 143, 150, 146, 186]),
  out: new Map([[150, 'DNF'], [146, 'DNS']]),
  logged: new Map([[141, at(7, 40)]]),
  prev: { short: 'CP2', seen: new Map([[140, at(7, 10)], [141, at(7, 10)], [142, at(7, 12)]]) },
};

describe('checkBaseNumber (spec §4.9)', () => {
  it('rejects bibs not in the race', () => {
    expect(checkBaseNumber(999, ctx)).toEqual({ kind: CHECK.BAD, note: 'Not in race' });
  });
  it('rejects DNF / DNS runners', () => {
    expect(checkBaseNumber(150, ctx)).toEqual({ kind: CHECK.BAD, note: 'DNF' });
    expect(checkBaseNumber(146, ctx)).toEqual({ kind: CHECK.BAD, note: 'DNS' });
  });
  it('warns when said twice in the call', () => {
    expect(checkBaseNumber(142, { ...ctx, earlier: [142] })).toEqual({ kind: CHECK.WARN, note: 'Said twice' });
  });
  it('warns when already logged at this checkpoint', () => {
    expect(checkBaseNumber(141, ctx)).toEqual({ kind: CHECK.WARN, note: 'Had 07:40' });
  });
  it('flags (info) a runner not seen at the previous checkpoint', () => {
    expect(checkBaseNumber(186, ctx)).toEqual({ kind: CHECK.INFO, note: 'Not seen CP2' });
  });
  it('is ok otherwise; no previous-checkpoint check for the first checkpoint', () => {
    expect(checkBaseNumber(140, ctx)).toEqual({ kind: CHECK.OK, note: '' });
    expect(checkBaseNumber(186, { ...ctx, prev: null }).kind).toBe(CHECK.OK);
  });
  it('only ok + info are recorded', () => {
    expect([CHECK.OK, CHECK.INFO, CHECK.WARN, CHECK.BAD].map(isRecordable)).toEqual([true, true, false, false]);
  });
  it('checkCall checks each entry against the earlier ones', () => {
    const r = checkCall([{ num: 142, t: at(7, 40) }, { num: 142, t: at(7, 45) }, { num: 999, t: at(7, 45) }], ctx);
    expect(r.map(x => x.kind)).toEqual([CHECK.OK, CHECK.WARN, CHECK.BAD]);
  });
});

describe('outStatusMap and sightings', () => {
  it('maps withdrawals / vet-outs / DNF to DNF and non-starters to DNS', () => {
    const m = outStatusMap(
      [{ number: 1, status: 'withdrawn' }, { number: 2, status: 'vet-out' }, { number: 3, status: 'non-starter' }],
      [{ checkpointNumber: 0, number: 4, status: 'dnf' }, { checkpointNumber: 2, number: 5, status: 'dnf' }],
    );
    expect([...m.entries()]).toEqual([[1, 'DNF'], [2, 'DNF'], [3, 'DNS'], [4, 'DNF']]);
  });
  it('sightings read both tables, ignoring non-passed rows', () => {
    const s = sightingsByCheckpoint([
      { checkpointNumber: 1, number: 7, status: 'passed', commonTime: at(7, 0) },          // base row
      { checkpointNumber: 1, number: 8, status: 'passed', actualTime: at(7, 3) },          // imported checkpoint row
      { checkpointNumber: 1, number: 9, status: 'not-started' },
      { checkpointNumber: 1, number: 10, status: 'non-starter' },
    ]);
    expect([...s.get(1).keys()]).toEqual([7, 8]);
  });
});

describe('buildBoard', () => {
  const checkpoints = [{ number: 2, name: 'CP two', operatorCallsigns: ['VK4IE'] }, { number: 1, name: 'CP one' }];
  it('orders checkpoints then Finish', () => {
    expect(boardCheckpoints(checkpoints).map(c => c.short)).toEqual(['CP1', 'CP2', 'Finish']);
  });

  it('computes count, up-to block, behind, and Due / OK / Closed', () => {
    const records = [
      { checkpointNumber: 1, number: 1, status: 'passed', commonTime: at(7, 0) },
      { checkpointNumber: 1, number: 2, status: 'passed', commonTime: at(7, 15) },
      { checkpointNumber: 2, number: 1, status: 'passed', commonTime: at(7, 40) },
      { checkpointNumber: 2, number: 2, status: 'passed', commonTime: at(7, 41) },
    ];
    const radioCalls = [
      { checkpointNumber: 1, receivedAt: at(7, 36) },
      { checkpointNumber: 2, receivedAt: at(7, 45) },
      { checkpointNumber: 2, receivedAt: at(7, 46), undoneAt: at(7, 46) },
    ];
    const board = buildBoard({ checkpoints, records, radioCalls, now: at(7, 47), raceStart: at(6, 30), fieldSize: 3 });
    const [cp1, cp2, fin] = board;
    expect(cp1).toMatchObject({ count: 2, since: 11, behind: 30, status: 'due' });
    expect(hhmm(cp1.lastBlock)).toBe('07:15');
    expect(cp1.text).toBe('Up to 07:15 · 30 min behind · call 11m ago');
    expect(cp2).toMatchObject({ count: 2, since: 2, status: 'ok', calls: 1 });
    expect(fin).toMatchObject({ count: 0, text: 'No calls yet', status: 'due' });

    const closed = buildBoard({ checkpoints, records, radioCalls, now: at(7, 47), raceStart: at(6, 30), fieldSize: 3, outCount: 1 });
    expect(closed[0].status).toBe('closed');
  });
});
