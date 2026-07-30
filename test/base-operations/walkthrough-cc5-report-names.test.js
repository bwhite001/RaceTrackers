/**
 * CC-5 / #52: report headers use the configured checkpoint name
 *
 * The Missing Numbers and Checkpoint Log reports printed "Checkpoint: 1" —
 * an operator reading the sheet has no idea which physical location that is.
 * Both must print the configured name, falling back to "Checkpoint N" when
 * the checkpoint is unnamed or missing from the config.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { BaseOperationsRepository } from 'modules/base-operations/services/BaseOperationsRepository';
import db from 'shared/services/database/schema';

const RACE_ID = 9401;

describe('CC-5 / #52: checkpoint names in report headers', () => {
  let repo;

  beforeEach(async () => {
    repo = new BaseOperationsRepository();
    await db.races.put({ id: RACE_ID, name: 'Named CP Race', date: '2026-03-04', minRunner: 1, maxRunner: 5 });
    await db.runners.bulkPut([
      { id: 94001, raceId: RACE_ID, number: 1, status: 'passed' },
      { id: 94002, raceId: RACE_ID, number: 2, status: 'not-started' },
    ]);
    await db.checkpoints.bulkPut([
      { id: 9410, raceId: RACE_ID, number: 1, name: 'Ridgeline' },
      { id: 9411, raceId: RACE_ID, number: 2, name: '' },
    ]);
    await db.checkpoint_runners.put({
      id: 94101, raceId: RACE_ID, checkpointNumber: 1, number: 1,
      status: 'passed', markOffTime: '2026-03-04T09:00:00.000Z',
    });
  });

  it('missing numbers report header shows the checkpoint name', async () => {
    const report = await repo.generateMissingNumbersReport(RACE_ID, 1);
    expect(report.content).toContain('Ridgeline');
    expect(report.content).not.toContain('Checkpoint: 1');
  });

  it('missing numbers report falls back to "Checkpoint N" when unnamed', async () => {
    const report = await repo.generateMissingNumbersReport(RACE_ID, 2);
    expect(report.content).toContain('Checkpoint 2');
  });

  it('missing numbers report falls back when the checkpoint is not configured', async () => {
    const report = await repo.generateMissingNumbersReport(RACE_ID, 7);
    expect(report.content).toContain('Checkpoint 7');
  });

  it('missing numbers filename uses the slugified checkpoint name', async () => {
    const report = await repo.generateMissingNumbersReport(RACE_ID, 1);
    expect(report.filename).toContain('ridgeline');
    expect(report.filename).toMatch(/\.csv$/);
  });

  it('checkpoint log report header shows the checkpoint name', async () => {
    const report = await repo.generateCheckpointLogReport(RACE_ID, 1);
    expect(report.content).toContain('Ridgeline');
    expect(report.content).not.toContain('# Checkpoint: 1');
  });

  it('checkpoint log report falls back to "Checkpoint N" when unnamed', async () => {
    const report = await repo.generateCheckpointLogReport(RACE_ID, 2);
    expect(report.content).toContain('Checkpoint 2');
  });
});
