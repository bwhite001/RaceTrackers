/**
 * Race-day A2 — base records a correction call (one runner): the old row is
 * superseded, never deleted; undo restores it exactly; "up to" never moves.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import db from '../../src/shared/services/database/schema.js';
import { BaseOperationsRepository } from '../../src/modules/base-operations/services/BaseOperationsRepository.js';
import { reportedUpTo } from '../../src/modules/base-operations/services/receive.js';
import { callLog, timesMatrix } from '../../src/modules/base-operations/services/reports.js';
import { sightingsByCheckpoint } from '../../src/modules/base-operations/services/receive.js';

const repo = new BaseOperationsRepository();
const RACE = 901;
const B1055 = '2026-11-08T00:55:00.000Z';
const B1100 = '2026-11-08T01:00:00.000Z';
const B1105 = '2026-11-08T01:05:00.000Z';
const NOW = '2026-11-08T01:20:00.000Z';
const live = async () => (await db.base_station_runners.where('raceId').equals(RACE).toArray()).filter(r => r.status !== 'superseded');

beforeEach(async () => {
  await db.base_station_runners.clear();
  await db.radio_calls.clear();
  await repo.recordCall(RACE, 3, [
    { num: 101, t: B1100, kind: 'ok' },
    { num: 102, t: B1105, kind: 'ok' },
  ], '2026-11-08T01:10:00.000Z');
});

describe('recordCorrection', () => {
  it('supersedes the old time, writes the new one on a correction call, audit-logged', async () => {
    const before = await db.base_station_runners.toArray();
    const callId = await repo.recordCorrection(RACE, 3, { number: 101, time: B1055 }, NOW);

    const rows = await db.base_station_runners.where('raceId').equals(RACE).toArray();
    const old = rows.find(r => r.id === before.find(b => b.number === 101).id);
    expect(old).toMatchObject({ status: 'superseded', supersededReason: 'correction', supersededBy: callId, commonTime: B1100 });
    expect((await live()).filter(r => r.number === 101).map(r => [r.commonTime, r.callId, r.correction])).toEqual([[B1055, callId, true]]);

    const call = await db.radio_calls.get(callId);
    expect(call).toMatchObject({ kind: 'correction', checkpointNumber: 3, corrections: [{ number: 101, from: B1100, to: B1055, notPassed: false }] });
    const audit = await db.audit_log.where('raceId').equals(RACE).toArray();
    expect(audit.some(a => a.action === 'correction' || a.operation === 'correction' || JSON.stringify(a).includes('"correction"'))).toBe(true);
  });

  it('never moves "up to", earlier or later', async () => {
    expect(reportedUpTo(await live()).get(3)).toBe(B1105);
    await repo.recordCorrection(RACE, 3, { number: 102, time: B1055 }, NOW); // the latest block corrected earlier
    expect(reportedUpTo(await live()).get(3)).toBe(B1105);
    await repo.recordCorrection(RACE, 3, { number: 101, time: '2026-11-08T01:15:00.000Z' }, NOW); // corrected later
    expect(reportedUpTo(await live()).get(3)).toBe(B1105);
  });

  it('undo restores the exact previous rows', async () => {
    const before = await db.base_station_runners.toArray();
    const callId = await repo.recordCorrection(RACE, 3, { number: 101, time: B1055 }, NOW);
    await repo.undoCall(callId);
    expect(await db.base_station_runners.toArray()).toEqual(before);
    expect((await db.radio_calls.get(callId)).undoneAt).toBeTruthy();
  });

  it('not passed supersedes base\'s time with no replacement', async () => {
    await repo.recordCorrection(RACE, 3, { number: 101, notPassed: true }, NOW);
    expect((await live()).filter(r => r.number === 101)).toEqual([]);
    const matrix = timesMatrix({ sightings: sightingsByCheckpoint(await live()), order: [{ number: 3, short: 'CP3' }], out: new Map(), raceNumbers: [101] });
    expect(matrix[0].cells[0].text).toBe('—');
  });

  it('the call log counts corrections apart from Scores calls', async () => {
    await repo.recordCorrection(RACE, 3, { number: 101, time: B1055 }, NOW);
    const calls = await db.radio_calls.toArray();
    expect(callLog({ radioCalls: calls, board: [{ number: 3, short: 'CP3', lastBlock: B1105 }] })[0])
      .toMatchObject({ calls: 1, numbers: 2, corrections: 1, lastCall: NOW });
  });
});
