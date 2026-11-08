/**
 * Base Records: fix what base recorded at a checkpoint. Flags come from the
 * data checks (same issue keys); every edit supersedes, never deletes, and
 * Undo restores exactly.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import db from '../../src/shared/services/database/schema.js';
import { BaseOperationsRepository } from '../../src/modules/base-operations/services/BaseOperationsRepository.js';
import { runChecks } from '../../src/modules/base-operations/services/dataChecks.js';
import { boardCheckpoints, sightingsByCheckpoint } from '../../src/modules/base-operations/services/receive.js';
import { outRecords } from '../../src/modules/base-operations/services/statusValidation.js';
import {
  recordItems, issueCounts, visibleItems, groupByBlock, groupByCall, actionsFor, numberProblem, upToFromRows, saveProblem, NEEDS_REASON,
} from '../../src/modules/base-operations/services/records.js';

const raceId = 951;
const T = (hm) => `2026-11-07T${hm}:00.000Z`;
const repo = new BaseOperationsRepository();
const CPS = [{ number: 1, name: 'One', distanceKm: 5 }, { number: 2, name: 'Two', distanceKm: 6 }, { number: 3, name: 'Three' }];
const order = boardCheckpoints(CPS);

const row = (cp, number, hm, extra = {}) => db.base_station_runners.add({ raceId, checkpointNumber: cp, number, status: 'passed', commonTime: T(hm), markOffEntryTime: T(hm), notes: null, ...extra });

async function load(cp = 2) {
  const baseRows = await db.base_station_runners.where('raceId').equals(raceId).toArray();
  const radioCalls = await db.radio_calls.where('raceId').equals(raceId).toArray();
  const resolutions = await db.data_issue_resolutions.where('raceId').equals(raceId).toArray();
  const fieldChanges = await db.field_changes.where('raceId').equals(raceId).toArray();
  const active = baseRows.filter(r => r.status !== 'superseded');
  const input = {
    baseRows, order, sightings: sightingsByCheckpoint(active), outByNumber: new Map(outRecords([]).map(r => [r.number, r])),
    radioCalls, distances: new Map([[1, 5], [2, 6]]), raceNumbers: new Set([100, 101, 102, 103, 104, 105, 199]), batchOf: new Map(),
  };
  const keys = new Set(resolutions.map(r => r.issueKey));
  const issues = runChecks(input, keys);
  const allIssues = runChecks(input);
  return { items: recordItems({ cp, baseRows, issues, allIssues, fieldChanges, resolutions }), baseRows, issues, radioCalls };
}

beforeEach(async () => {
  await Promise.all(['races', 'base_station_runners', 'radio_calls', 'data_issue_resolutions', 'field_changes', 'base_edits', 'audit_log'].map(t => db[t].clear()));
  await db.races.put({ id: raceId, name: 'Records', date: '2026-11-08', startTime: '06:30', minRunner: 100, maxRunner: 105 });
  // CP1 and CP2 calls
  for (const n of [100, 101, 102, 103]) await row(1, n, '20:50');
  await row(1, 104, '20:55');
  const callId = await db.radio_calls.add({ raceId, checkpointNumber: 2, receivedAt: T('21:18'), blocks: [], recorded: [100, 101, 102], skipped: [], rejected: [{ number: 999, reason: 'Not in setup', time: T('21:15') }], undoneAt: null, replaced: [] });
  for (const n of [100, 101, 102]) await row(2, n, '21:15', { callId });
  await row(2, 100, '21:20', { callId });              // duplicate at CP2
  await row(2, 103, '20:45', { callId });              // before CP1 (out of order)
  await row(3, 105, '21:40');                          // 105: seen at CP3, missed at CP1 and CP2
});

describe('flags reuse the data checks', () => {
  it('flags duplicate, out of order, wrong number and missed with their issue keys', async () => {
    const { items, issues } = await load();
    const dup = items.filter(i => i.flag.issue === 'dup');
    expect(dup.map(i => i.number)).toEqual([100, 100]);
    expect(dup[0].issue.key).toBe(issues.dup[0].key);
    const other = items.find(i => i.number === 103);
    expect(other.flag).toMatchObject({ issue: 'other', note: 'Before CP1' });
    expect(other.issue.key).toBe('order:103:1:2');
    const wrong = items.find(i => i.type === 'wrong');
    expect(wrong).toMatchObject({ number: 999, issue: { key: expect.stringMatching(/^unknown:/) } });
    const missed = items.find(i => i.type === 'missed');
    expect(missed).toMatchObject({ number: 105, seenAt: 'CP3' });
    expect(missed.issue.key).toBe('skip:105:2');
    expect(issueCounts(items)).toEqual({ dup: 1, missed: 1, wrong: 1, other: 1, attn: 4 });
  });

  it('filters, finds by leading digits, and groups by block and by call', async () => {
    const { items, radioCalls } = await load();
    expect(visibleItems(items, { filter: 'dup' }).every(i => i.flag.issue === 'dup')).toBe(true);
    expect(visibleItems(items, { search: '99' }).map(i => i.number)).toEqual([999]);
    const blocks = groupByBlock(visibleItems(items, {}));
    expect(blocks.at(-1).title).toBe('Missed — seen further on');
    const calls = groupByCall(visibleItems(items, {}), radioCalls, 'CP2');
    expect(calls[0].title).toMatch(/^Call \d\d:\d\d$/);
  });

  it('actions depend on the record; reason and number rules lock Save', async () => {
    const { items } = await load();
    expect(actionsFor(items.find(i => i.flag.issue === 'dup')).map(a => a.id)).toEqual(['keep', 'time', 'number', 'cp', 'remove']);
    expect(actionsFor(items.find(i => i.number === 103)).map(a => a.id)).toContain('checked');
    expect(actionsFor(items.find(i => i.type === 'wrong')).map(a => a.id)).toEqual(['number', 'late']);
    expect(actionsFor(items.find(i => i.type === 'missed')).map(a => a.id)).toEqual(['have', 'notseen']);
    for (const a of ['time', 'number', 'cp', 'remove', 'keep', 'late']) expect(NEEDS_REASON.has(a)).toBe(true);
    expect(saveProblem({ action: 'time' })).toBe('Pick a reason');
    expect(saveProblem({ action: 'checked' })).toBeNull();
    expect(saveProblem({ action: 'cp', reason: 'other' })).toBe('Pick checkpoint');
    const r101 = items.find(i => i.number === 101);
    expect(numberProblem('102', r101, items, 'CP2')).toBe('CP2 already has 102 — fix that one first');
    expect(numberProblem('', r101, items, 'CP2')).toBe('Type the right number first');
    expect(numberProblem('150', r101, items, 'CP2')).toBeNull();
  });
});

describe('edits supersede, never delete; undo is exact', () => {
  const live = async (cp, n) => (await db.base_station_runners.where('raceId').equals(raceId).toArray()).filter(r => r.checkpointNumber === cp && r.number === n && r.status !== 'superseded');

  it('time change with a checkpoint correction logs a correction call; undo restores exactly', async () => {
    const [r] = await live(2, 101);
    const id = await repo.editRecords(raceId, 2, { kind: 'time', reason: 'correction', changes: [{ rowId: r.id, toTime: T('21:10'), note: 'Was 21:15 · now 21:10' }] });
    const [now] = await live(2, 101);
    expect(now.commonTime).toBe(T('21:10'));
    expect((await db.base_station_runners.get(r.id))).toMatchObject({ status: 'superseded', supersededReason: 'correction', supersededBy: id, supersededNote: 'Was 21:15 · now 21:10' });
    const call = (await db.radio_calls.toArray()).find(c => c.source === 'records');
    expect(call).toMatchObject({ kind: 'correction', checkpointNumber: 2 });
    await repo.undoRecordEdit(id);
    expect(await db.base_station_runners.get(r.id)).toEqual(r);
    expect((await live(2, 101)).map(x => x.id)).toEqual([r.id]);
    expect((await db.radio_calls.get(call.id)).undoneAt).toBeTruthy();
    expect(await db.base_station_runners.count()).toBe(12); // 11 seeded + the edit's row, set aside by Undo
  });

  it('a base typing error writes no call', async () => {
    const [r] = await live(2, 101);
    await repo.editRecords(raceId, 2, { kind: 'time', reason: 'base-error', changes: [{ rowId: r.id, toTime: T('21:10') }] });
    expect((await db.radio_calls.toArray()).some(c => c.source === 'records')).toBe(false);
  });

  it('renumber to a bib outside the field adds a late entry; undo cancels it', async () => {
    const [r] = await live(2, 102);
    const id = await repo.editRecords(raceId, 2, { kind: 'number', reason: 'base-error', supersededReason: 'renumbered', changes: [{ rowId: r.id, toNumber: 512 }], late: [512] });
    expect((await live(2, 512))).toHaveLength(1);
    expect((await db.field_changes.toArray()).map(f => [f.number, f.source, f.cancelledAt])).toEqual([[512, 'records', null]]);
    await repo.undoRecordEdit(id);
    expect(await live(2, 512)).toHaveLength(0);
    expect((await db.field_changes.toArray())[0].cancelledAt).toBeTruthy();
  });

  it('wrong number → change number records it and resolves the unknown issue; undo reopens it', async () => {
    const { items } = await load();
    const wrong = items.find(i => i.type === 'wrong');
    const id = await repo.editRecords(raceId, 2, { kind: 'number', reason: 'base-error', changes: [{ rejected: { issueKey: wrong.issue.key, callId: wrong.callId }, number: 999, toNumber: 105, toTime: wrong.time }] });
    let after = await load();
    expect(after.items.some(i => i.type === 'wrong')).toBe(false);
    expect(after.items.find(i => i.type === 'history' && i.number === 999).flag.note).toBe('Was 999 · now 105');
    expect(after.items.find(i => i.type === 'row' && i.number === 105)).toBeTruthy();
    await repo.undoRecordEdit(id);
    after = await load();
    expect(after.items.find(i => i.type === 'wrong').number).toBe(999);
  });

  it('move to another checkpoint, remove, keep one of a duplicate — each undoes exactly', async () => {
    const [r] = await live(2, 101);
    const moved = await repo.editRecords(raceId, 2, { kind: 'cp', reason: 'other', supersededReason: 'moved', changes: [{ rowId: r.id, toCp: 3 }] });
    expect(await live(2, 101)).toHaveLength(0);
    expect((await live(3, 101))[0].commonTime).toBe(r.commonTime);
    await repo.undoRecordEdit(moved);
    expect(await live(3, 101)).toHaveLength(0);

    const removed = await repo.editRecords(raceId, 2, { kind: 'remove', reason: 'base-error', supersededReason: 'removed', changes: [{ rowId: r.id, remove: true }] });
    expect(await live(2, 101)).toHaveLength(0);
    await repo.undoRecordEdit(removed);
    expect(await db.base_station_runners.get(r.id)).toEqual(r);

    const dups = await live(2, 100);
    const keep = dups.find(d => d.commonTime === T('21:15'));
    const other = dups.find(d => d.id !== keep.id);
    await repo.editRecords(raceId, 2, { kind: 'keep', reason: 'correction', supersededReason: 'duplicate', changes: [{ rowId: other.id, remove: true, note: 'Duplicate · kept 21:15' }] });
    const left = await live(2, 100);
    expect(left.map(x => x.id)).toEqual([keep.id]);
    const { items } = await load();
    expect(items.some(i => i.flag.issue === 'dup')).toBe(false);
  });

  it('batch time change is one edit with a batch id; undo restores every row', async () => {
    const rows = (await live(2, 101)).concat(await live(2, 102));
    const id = await repo.editRecords(raceId, 2, { kind: 'time', reason: 'other', changes: rows.map(r => ({ rowId: r.id, toTime: T('21:20') })) });
    const edit = await db.base_edits.get(id);
    expect(edit.batchId).toMatch(/^batch-/);
    expect(edit.changes.map(c => c.number).sort()).toEqual([101, 102]);
    expect((await live(2, 101))[0].commonTime).toBe(T('21:20'));
    await repo.undoRecordEdit(id);
    for (const r of rows) expect(await db.base_station_runners.get(r.id)).toEqual(r);
    expect((await db.audit_log.toArray()).map(a => a.action)).toEqual(['records-time', 'records-undo']);
  });

  it('"up to" is recalculated from active rows and an edit may lower it', async () => {
    let rows = await db.base_station_runners.toArray();
    expect(upToFromRows(rows, 2)).toBe(T('21:20'));
    const [late] = (await live(2, 100)).filter(r => r.commonTime === T('21:20'));
    await repo.editRecords(raceId, 2, { kind: 'remove', reason: 'base-error', supersededReason: 'removed', changes: [{ rowId: late.id, remove: true }] });
    rows = await db.base_station_runners.toArray();
    expect(upToFromRows(rows, 2)).toBe(T('21:15'));
  });

  it('superseded rows count nowhere: sightings and data checks read active rows only', async () => {
    const [r] = await live(2, 103);
    await repo.editRecords(raceId, 2, { kind: 'remove', reason: 'base-error', supersededReason: 'removed', changes: [{ rowId: r.id, remove: true }] });
    const { items, issues, baseRows } = await load();
    expect(sightingsByCheckpoint(baseRows).get(2).has(103)).toBe(false);
    expect(issues.order).toHaveLength(0);
    expect(items.find(i => i.number === 103 && i.type === 'history')).toBeTruthy();
  });

  it('a stale change is refused, and undo waits for a later change on the same row', async () => {
    const [r] = await live(2, 101);
    const first = await repo.editRecords(raceId, 2, { kind: 'time', reason: 'other', changes: [{ rowId: r.id, toTime: T('21:10') }] });
    await expect(repo.editRecords(raceId, 2, { kind: 'time', reason: 'other', changes: [{ rowId: r.id, toTime: T('21:05') }] })).rejects.toThrow(/changed elsewhere/);
    const [r2] = await live(2, 101);
    await repo.editRecords(raceId, 2, { kind: 'time', reason: 'other', changes: [{ rowId: r2.id, toTime: T('21:05') }] });
    await expect(repo.undoRecordEdit(first)).rejects.toThrow(/changed again/);
  });
});
