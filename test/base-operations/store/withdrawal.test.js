import { describe, it, expect, beforeEach } from 'vitest';
import db from 'shared/services/database/schema';
import { BaseOperationsRepository } from 'modules/base-operations/services/BaseOperationsRepository';

describe('withdrawRunner — writes DNF to checkpoint_runners', () => {
  let repo;

  beforeEach(async () => {
    repo = new BaseOperationsRepository();
    await db.checkpoint_runners.clear();
    await db.withdrawal_records.clear();
    if (db.audit_log) await db.audit_log.clear();
  });

  it('creates a checkpoint_runners record with status dnf at the given checkpoint', async () => {
    await repo.withdrawRunner('r1', 42, 3, 'Injury', '', null);
    const record = await db.checkpoint_runners
      .where(['raceId', 'checkpointNumber', 'number'])
      .equals(['r1', 3, 42])
      .first();
    expect(record).toBeDefined();
    expect(record.status).toBe('dnf');
    expect(record.checkpointNumber).toBe(3);
  });

  it('creates a withdrawal_records audit entry', async () => {
    await repo.withdrawRunner('r1', 42, 3, 'Injury', 'notes', null);
    const withdrawal = await db.withdrawal_records
      .where(['raceId', 'runnerNumber'])
      .equals(['r1', 42])
      .first();
    expect(withdrawal).toBeDefined();
    expect(withdrawal.checkpoint).toBe(3);
  });

  it('reverseWithdrawal removes the dnf record from checkpoint_runners', async () => {
    await repo.withdrawRunner('r1', 42, 3, 'Injury', '', null);
    await repo.reverseWithdrawal('r1', 42);
    const record = await db.checkpoint_runners
      .where(['raceId', 'checkpointNumber', 'number'])
      .equals(['r1', 3, 42])
      .first();
    expect(record).toBeUndefined();
  });
});

describe('markAsNonStarter — broadcasts to all checkpoints', () => {
  let repo;

  beforeEach(async () => {
    repo = new BaseOperationsRepository();
    await db.checkpoint_runners.clear();
    await db.checkpoints.clear();
    if (db.audit_log) await db.audit_log.clear();
    await db.checkpoints.bulkAdd([
      { raceId: 'r1', number: 1, name: 'Start' },
      { raceId: 'r1', number: 3, name: 'Ridge' },
    ]);
  });

  it('creates non-starter records at every checkpoint', async () => {
    await repo.markAsNonStarter('r1', 42, 'No show');
    const records = await db.checkpoint_runners.where('raceId').equals('r1').toArray();
    expect(records).toHaveLength(2);
    expect(records.every(r => r.status === 'non-starter')).toBe(true);
    expect(records.map(r => r.checkpointNumber).sort()).toEqual([1, 3]);
  });

  it('reverseNonStarter removes all non-starter records for the runner', async () => {
    await repo.markAsNonStarter('r1', 42, '');
    await repo.reverseNonStarter('r1', 42);
    const records = await db.checkpoint_runners
      .where('raceId').equals('r1')
      .and(r => r.number === 42)
      .toArray();
    expect(records).toHaveLength(0);
  });
});

describe('DNF / DNS never destroy recorded sightings', () => {
  let repo;
  beforeEach(async () => {
    repo = new BaseOperationsRepository();
    await db.checkpoint_runners.clear();
    await db.checkpoints.clear();
    await db.withdrawal_records.clear();
    await db.checkpoints.bulkAdd([
      { raceId: 'r2', number: 1, name: 'CP1' },
      { raceId: 'r2', number: 2, name: 'CP2' },
    ]);
    await db.checkpoint_runners.add({ raceId: 'r2', checkpointNumber: 1, number: 7, status: 'passed', actualTime: '2026-11-08T07:00:00.000Z' });
  });

  const cp1 = () => db.checkpoint_runners.where(['raceId', 'checkpointNumber', 'number']).equals(['r2', 1, 7]).first();

  it('DNS then undo keeps the CP1 sighting', async () => {
    await repo.markAsNonStarter('r2', 7, '');
    expect((await cp1()).status).toBe('passed');
    await repo.reverseNonStarter('r2', 7);
    expect(await cp1()).toMatchObject({ status: 'passed', actualTime: '2026-11-08T07:00:00.000Z' });
  });

  it('DNF at a checkpoint the runner passed, then undo, keeps the sighting', async () => {
    await repo.withdrawRunner('r2', 7, 1, 'Injury', '', '2026-11-08T07:30:00.000Z');
    expect((await cp1()).status).toBe('passed');
    expect(await db.withdrawal_records.where('raceId').equals('r2').count()).toBe(1);
    await repo.reverseWithdrawal('r2', 7);
    expect((await cp1()).status).toBe('passed');
  });

  it('DNF "on course" (no checkpoint) records only the withdrawal', async () => {
    await repo.withdrawRunner('r2', 8, null, 'Medical', '', '2026-11-08T07:30:00.000Z');
    const out = await repo.getOutList('r2');
    expect(out.find(r => r.number === 8)).toMatchObject({ status: 'withdrawn' });
    await repo.reverseWithdrawal('r2', 8);
    expect((await repo.getOutList('r2')).find(r => r.number === 8)).toBeUndefined();
  });
});
