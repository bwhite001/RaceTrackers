/**
 * M-6: Missing Numbers Report — CSV format
 * Issue #53: generateMissingNumbersReport was hardcoded to .txt / text/plain.
 * It should produce .csv / text/csv.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { BaseOperationsRepository } from 'modules/base-operations/services/BaseOperationsRepository';
import db from 'shared/services/database/schema';

const RACE_ID = 9201;

describe('M-6: generateMissingNumbersReport produces CSV', () => {
  let repo;

  beforeEach(async () => {
    repo = new BaseOperationsRepository();
    await db.races.put({ id: RACE_ID, name: 'CSV Test Race', date: '2026-03-04', minRunner: 1, maxRunner: 10 });
    await db.runners.bulkPut([
      { id: 92001, raceId: RACE_ID, number: 1, status: 'passed' },
      { id: 92002, raceId: RACE_ID, number: 2, status: 'not-started' },
      { id: 92003, raceId: RACE_ID, number: 3, status: 'not-started' },
    ]);
    await db.checkpoints.put({ id: 9200, raceId: RACE_ID, number: 1, name: 'CP1' });
    await db.checkpoint_runners.put({
      id: 93001, raceId: RACE_ID, checkpointNumber: 1, number: 1,
      status: 'passed', markOffTime: '2026-03-04T09:00:00.000Z',
    });
  });

  it('returns a .csv filename', async () => {
    const report = await repo.generateMissingNumbersReport(RACE_ID, 1);
    expect(report.filename).toMatch(/\.csv$/);
    expect(report.filename).not.toMatch(/\.txt$/);
  });

  it('returns text/csv mimeType', async () => {
    const report = await repo.generateMissingNumbersReport(RACE_ID, 1);
    expect(report.mimeType).toBe('text/csv');
  });

  it('still produces content with missing runner numbers', async () => {
    const report = await repo.generateMissingNumbersReport(RACE_ID, 1);
    // Runners 2 and 3 haven't passed CP1 — should appear as missing
    expect(report.content).toContain('2');
    expect(report.content).toContain('3');
  });
});
