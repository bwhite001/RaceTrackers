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
