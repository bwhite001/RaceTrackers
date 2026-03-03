import { describe, it, expect, beforeEach } from 'vitest';
import { BaseOperationsRepository } from 'modules/base-operations/services/BaseOperationsRepository';
import db from 'shared/services/database/schema';

describe('BaseOperationsRepository new reports', () => {
  let repo;
  const raceId = 999; // Use unique ID to avoid cross-test contamination

  beforeEach(async () => {
    repo = new BaseOperationsRepository();
    // Seed a race
    await db.races.put({ id: raceId, name: 'Test Race', date: '2026-03-02' });
    // Seed runners
    await db.runners.bulkPut([
      { id: 10001, raceId, number: 101, firstName: 'Alice', lastName: 'Smith', gender: 'F', batchNumber: 1, status: 'passed' },
      { id: 10002, raceId, number: 102, firstName: 'Bob', lastName: 'Jones', gender: 'M', batchNumber: 1, status: 'dnf' },
    ]);
    // Seed a checkpoint
    await db.checkpoints.put({ id: 9001, raceId, number: 1, name: 'CP1' });
    // Seed base station runner (finisher)
    await db.base_station_runners.put({
      id: 20001, raceId, number: 101, status: 'passed',
      commonTime: '2026-03-02T10:30:00.000Z', checkpointNumber: 1,
    });
    // Seed checkpoint runner
    await db.checkpoint_runners.put({
      id: 30001, raceId, checkpointNumber: 1, number: 101,
      markOffTime: '2026-03-02T09:00:00.000Z', callInTime: '2026-03-02T09:01:00.000Z', status: 'passed',
    });
  });

  describe('generateFinisherListReport', () => {
    it('returns an object with content, filename, and mimeType', async () => {
      const report = await repo.generateFinisherListReport(raceId);
      expect(report).toHaveProperty('content');
      expect(report).toHaveProperty('filename');
      expect(report).toHaveProperty('mimeType');
    });

    it('includes finisher runner number in CSV content', async () => {
      const report = await repo.generateFinisherListReport(raceId);
      expect(report.content).toContain('101');
    });

    it('filename contains "finisher-list"', async () => {
      const report = await repo.generateFinisherListReport(raceId);
      expect(report.filename).toMatch(/finisher-list/);
    });

    it('mimeType is text/csv', async () => {
      const report = await repo.generateFinisherListReport(raceId);
      expect(report.mimeType).toBe('text/csv');
    });
  });

  describe('generateOfficialsReport', () => {
    it('returns an object with content, filename, and mimeType', async () => {
      const report = await repo.generateOfficialsReport(raceId);
      expect(report).toHaveProperty('content');
      expect(report).toHaveProperty('filename');
      expect(report).toHaveProperty('mimeType');
    });

    it('contains header row with Runner # column', async () => {
      const report = await repo.generateOfficialsReport(raceId);
      expect(report.content).toContain('Runner #');
    });

    it('contains both runner numbers', async () => {
      const report = await repo.generateOfficialsReport(raceId);
      expect(report.content).toContain('101');
      expect(report.content).toContain('102');
    });

    it('filename contains "officials"', async () => {
      const report = await repo.generateOfficialsReport(raceId);
      expect(report.filename).toMatch(/officials/);
    });

    it('mimeType is text/csv', async () => {
      const report = await repo.generateOfficialsReport(raceId);
      expect(report.mimeType).toBe('text/csv');
    });
  });

  describe('generateSplitTimesReport', () => {
    it('returns an object with content, filename, and mimeType', async () => {
      const report = await repo.generateSplitTimesReport(raceId);
      expect(report).toHaveProperty('content');
      expect(report).toHaveProperty('filename');
      expect(report).toHaveProperty('mimeType');
    });

    it('contains checkpoint column header', async () => {
      const report = await repo.generateSplitTimesReport(raceId);
      expect(report.content).toContain('CP1');
    });

    it('contains runner numbers', async () => {
      const report = await repo.generateSplitTimesReport(raceId);
      expect(report.content).toContain('101');
      expect(report.content).toContain('102');
    });

    it('filename contains "split-times"', async () => {
      const report = await repo.generateSplitTimesReport(raceId);
      expect(report.filename).toMatch(/split-times/);
    });

    it('mimeType is text/csv', async () => {
      const report = await repo.generateSplitTimesReport(raceId);
      expect(report.mimeType).toBe('text/csv');
    });
  });
});
