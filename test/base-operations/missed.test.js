/**
 * Race-day E — runners a checkpoint missed: reminders come from the Skipped
 * check (no duplicates), clear on a later call-in, and the stand-down lists
 * split correctly without DNS / DNF runners.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import db from '../../src/shared/services/database/schema.js';
import { BaseOperationsRepository } from '../../src/modules/base-operations/services/BaseOperationsRepository.js';
import { missedReminders, missedText, standDownLists, confirmedMissed, MISSED_CONFIRMED } from '../../src/modules/base-operations/services/missed.js';
import { reportedUpTo, buildBoard } from '../../src/modules/base-operations/services/receive.js';
import { timesMatrix } from '../../src/modules/base-operations/services/reports.js';

const order = [{ number: 1, short: 'CP1' }, { number: 2, short: 'CP2' }, { number: 3, short: 'CP3' }, { number: 0, short: 'Finish' }];
const T = (m) => `2026-11-08T08:${String(m).padStart(2, '0')}:00.000Z`;
const S = (entries) => new Map(entries.map(([cp, rows]) => [cp, new Map(rows)]));

describe('missed reminders', () => {
  it('a number recorded at CP2 but not CP1 is missed at CP1 — once, even when seen at CP3 too', () => {
    const sightings = S([[1, [[100, T(0)]]], [2, [[100, T(20)], [213, T(25)]]], [3, [[213, T(40)]]]]);
    expect([...missedReminders({ sightings, order })]).toEqual([[1, [{ number: 213, issueKey: 'skip:213:1', seenAt: 'CP2' }]]]);
  });

  it('clears itself when the checkpoint calls the bib in, or base resolves it', () => {
    const later = S([[1, [[213, T(5)]]], [2, [[213, T(25)]]]]);
    expect(missedReminders({ sightings: later, order }).size).toBe(0);
    const sightings = S([[2, [[213, T(25)]]]]);
    expect(missedReminders({ sightings, order, resolvedKeys: new Set(['skip:213:1']) }).size).toBe(0);
  });

  it('text lists every bib; groups "seen" when it is the same checkpoint', () => {
    expect(missedText([{ number: 213, seenAt: 'CP2' }, { number: 218, seenAt: 'CP2' }])).toBe('213, 218 (seen CP2)');
    expect(missedText([{ number: 213, seenAt: 'CP2' }, { number: 218, seenAt: 'CP3' }])).toBe('213 (seen CP2), 218 (seen CP3)');
  });

  it('"not seen there" shows missed in that cell of the times table', () => {
    const missed = confirmedMissed([{ issueKey: 'skip:213:1', resolution: MISSED_CONFIRMED }, { issueKey: 'skip:214:1', resolution: 'checked' }]);
    expect([...missed]).toEqual(['213:1']);
    const m = timesMatrix({ sightings: S([[2, [[213, T(25)]]]]), order, out: new Map(), raceNumbers: [213], missed });
    expect(m[0].cells[0]).toMatchObject({ text: 'missed', missed: true });
    expect(m[0].cells[1].text).toMatch(/^\d\d:\d\d$/);
    expect(m[0].cells.slice(2).map(c => c.text)).toEqual(['—', '—']);
  });
});

describe('stand-down check', () => {
  it('splits runners not recorded at CP2 into seen further on and not seen past here, without DNS / DNF', () => {
    const sightings = S([[1, [[100, T(0)], [101, T(1)], [102, T(2)], [103, T(3)]]], [2, [[100, T(20)]]], [3, [[101, T(40)]]]]);
    const out = new Map([[103, 'DNF'], [104, 'DNS']]);
    const lists = standDownLists({ cpNumber: 2, order, sightings, raceNumbers: [100, 101, 102, 103, 104, 105], out });
    expect(lists.seenFurther).toEqual([{ number: 101, at: 'CP3' }]);
    expect(lists.notSeenPast).toEqual([{ number: 102, last: 'CP1' }, { number: 105, last: null }]);
    expect(standDownLists({ cpNumber: 2, order, sightings, raceNumbers: [], fieldKnown: false }).notSeenPast).toBeNull();
  });
});

describe('base records', () => {
  const repo = new BaseOperationsRepository();
  const RACE = 903;
  beforeEach(async () => { await db.base_station_runners.clear(); await db.radio_calls.clear(); });

  it('"they have it" records the time without moving "up to"; undo removes it', async () => {
    await repo.recordCall(RACE, 1, [{ num: 100, t: T(5), kind: 'ok' }], T(10));
    const callId = await repo.recordMissed(RACE, 1, { number: 213, time: T(15) }, T(30));
    const rows = await db.base_station_runners.where('raceId').equals(RACE).toArray();
    expect(rows.find(r => r.number === 213)).toMatchObject({ commonTime: T(15), missedReport: true, callId });
    expect(reportedUpTo(rows).get(1)).toBe(T(5));
    expect((await db.radio_calls.get(callId)).kind).toBe('missed');
    await repo.undoCall(callId);
    expect((await db.base_station_runners.where('raceId').equals(RACE).toArray()).map(r => r.number)).toEqual([100]);
  });

  it('stand down closes the checkpoint on the board; undo reopens it', async () => {
    const callId = await repo.recordStandDown(RACE, 2, T(50));
    const board = (calls) => buildBoard({ checkpoints: [{ number: 2, name: 'CP2' }], records: [], radioCalls: calls, now: T(55), raceStart: T(0), fieldSize: 10 });
    expect(board(await db.radio_calls.toArray()).find(b => b.number === 2).status).toBe('closed');
    await repo.undoCall(callId);
    expect(board(await db.radio_calls.toArray()).find(b => b.number === 2).status).not.toBe('closed');
  });
});
