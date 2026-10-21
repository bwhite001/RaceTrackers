/**
 * Race-day B — bibs can change on the day. Base's field = setup + late
 * entries; checkpoints log their own; every addition undoes exactly.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import db from '../../src/shared/services/database/schema.js';
import { BaseOperationsRepository } from '../../src/modules/base-operations/services/BaseOperationsRepository.js';
import CheckpointRepository from '../../src/modules/checkpoint-operations/services/CheckpointRepository.js';
import { fieldNumbers } from '../../src/modules/base-operations/services/field.js';
import { findUnknownBibs } from '../../src/modules/base-operations/services/dataChecks.js';
import { fieldGroups, looksLikeTypo, computeStats } from '../../src/modules/checkpoint-operations/services/checkpointStats.js';

const repo = new BaseOperationsRepository();
const RACE = 902;
const T = '2026-11-08T07:40:00.000Z';
const NOW = '2026-11-08T08:00:00.000Z';

beforeEach(async () => {
  for (const t of ['base_station_runners', 'radio_calls', 'field_changes', 'checkpoint_runners', 'checkpoint_field_changes', 'data_issue_resolutions']) await db[t].clear();
});

describe('base field', () => {
  it('field = setup runners + uncancelled late entries', () => {
    expect(fieldNumbers([101, 100], [
      { number: 512, kind: 'late' }, { number: 513, kind: 'late', cancelledAt: NOW }, { number: 100, kind: 'late' },
    ])).toEqual([100, 101, 512]);
  });

  it('a late entry recorded on a call joins the field; undoing the call takes it out', async () => {
    const callId = await repo.recordCall(RACE, 1, [{ num: 512, t: T, kind: 'ok', late: true }, { num: 999, t: T, kind: 'bad', note: 'Not in setup' }], NOW);
    let changes = await repo.getFieldChanges(RACE);
    expect(changes.map(c => [c.number, c.source, c.callId, c.cancelledAt])).toEqual([[512, 'receive', callId, null]]);
    expect((await db.radio_calls.get(callId)).rejected).toEqual([{ number: 999, reason: 'Not in setup', time: T }]);
    await repo.undoCall(callId);
    changes = await repo.getFieldChanges(RACE);
    expect(changes[0].cancelledAt).toBeTruthy(); // cancelled, never deleted
    expect(fieldNumbers([], changes)).toEqual([]);
  });

  it('Add to field records the heard time; undo removes it exactly', async () => {
    const callId = await repo.recordCall(RACE, 1, [{ num: 999, t: T, kind: 'bad', note: 'Not in setup' }], NOW);
    const [issue] = findUnknownBibs({ radioCalls: await db.radio_calls.toArray(), order: [{ number: 1, short: 'CP1' }] });
    expect(issue).toMatchObject({ number: 999, checkpointNumber: 1, time: T, head: 'Not in setup' });
    const done = await repo.addToField(RACE, { number: 999, checkpointNumber: 1, time: T, issueKey: issue.key });
    expect((await db.base_station_runners.get(done.rowId))).toMatchObject({ number: 999, checkpointNumber: 1, commonTime: T });
    expect(findUnknownBibs({ radioCalls: await db.radio_calls.toArray(), order: [], raceNumbers: new Set([999]) })).toEqual([]);
    await repo.undoAddToField(RACE, done);
    expect(await db.base_station_runners.get(done.rowId)).toBeUndefined();
    expect(fieldNumbers([], await repo.getFieldChanges(RACE))).toEqual([]);
    expect(await db.data_issue_resolutions.count()).toBe(0);
    expect(callId).toBeTruthy();
  });
});

describe('checkpoint: bibs not in the setup', () => {
  it('marks them in checkpoint_runners with notInSetup and logs them; Undo removes both', async () => {
    const snap = await CheckpointRepository.snapshot(RACE, 3, [512]);
    await CheckpointRepository.markNotInSetup(RACE, 3, [512], T);
    expect(await db.checkpoint_runners.where('raceId').equals(RACE).toArray()).toEqual([expect.objectContaining({ number: 512, status: 'passed', notInSetup: true })]);
    expect((await db.checkpoint_field_changes.toArray()).map(c => [c.number, c.kind, c.source])).toEqual([[512, 'late', 'checkpoint']]);
    expect(await db.runners.where('raceId').equals(RACE).count()).toBe(0); // never the shared runners table
    await CheckpointRepository.restoreSnapshot(RACE, 3, snap);
    expect(await db.checkpoint_runners.where('raceId').equals(RACE).count()).toBe(0);
    expect(await db.checkpoint_field_changes.count()).toBe(0);
  });

  it('groups: the setup\'s groups never shift; extras join a covering group or new ones after', () => {
    const setup = Array.from({ length: 40 }, (_, i) => ({ number: 100 + i })); // 100–139
    const g = fieldGroups([...setup, { number: 512, notInSetup: true }]);
    expect(g.map(x => [x.first, x.last])).toEqual([[100, 119], [120, 139], [512, 512]]);
    // A gap in the setup (no 125) filled on the day: it joins the 120–139 group
    const gappy = fieldGroups([...setup.filter(r => r.number !== 125), { number: 125, notInSetup: true }]);
    expect(gappy[1].numbers).toContain(125);
    expect(gappy).toHaveLength(2);
  });

  it('typo guard: more digits than any bib in the field, or over 9999', () => {
    expect(looksLikeTypo(51212, [100, 159])).toBe(true);
    expect(looksLikeTypo(512, [100, 159])).toBe(false);
    expect(looksLikeTypo(12000, [])).toBe(true);
    expect(looksLikeTypo(512, [])).toBe(false);
  });

  it('counts with bibs assigned on the day: nothing to come until the field has bibs', () => {
    expect(computeStats([])).toMatchObject({ total: 0, toCome: 0 });
    expect(computeStats([{ number: 512, status: 'passed', notInSetup: true, actualTime: T }])).toMatchObject({ passed: 1, toCome: 0 });
  });
});
