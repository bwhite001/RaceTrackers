import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseOperationsRepository } from 'modules/base-operations/services/BaseOperationsRepository';
import db from 'shared/services/database/schema';
import TimeUtils from 'services/timeUtils.js';

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
    // Seed base station runner (finisher at Finish, seen at CP1)
    await db.base_station_runners.bulkPut([
      { id: 20001, raceId, number: 101, status: 'passed', commonTime: '2026-03-02T10:30:00.000Z', checkpointNumber: 0 },
      { id: 20002, raceId, number: 101, status: 'passed', commonTime: '2026-03-02T09:00:00.000Z', checkpointNumber: 1 },
    ]);
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

describe('BaseOperationsRepository getRaceResults', () => {
  const raceId = 998;
  beforeEach(async () => {
    await db.races.put({ id: raceId, name: 'Results Race', date: '2026-03-02' });
    await db.checkpoints.put({ id: 9101, raceId, number: 1, name: 'CP1' });
    await db.runners.put({ id: 10101, raceId, number: 101, firstName: 'Alice', lastName: 'Smith', gender: 'F', batchNumber: 1, notes: 'n', status: 'passed' });
    await db.base_station_runners.bulkPut([
      { id: 20101, raceId, number: 101, status: 'superseded', commonTime: '2026-03-02T09:00:00.000Z', checkpointNumber: 1 },
      { id: 20102, raceId, number: 101, status: 'passed', commonTime: '2026-03-02T08:30:00.000Z', checkpointNumber: 1 },
      { id: 20103, raceId, number: 500, status: 'passed', commonTime: '2026-03-02T08:30:00.000Z', checkpointNumber: 1 },
    ]);
    await db.field_changes.put({ raceId, number: 500, kind: 'late', cancelledAt: null });
  });

  it('getRaceResults ignores superseded rows and includes late entries', async () => {
    const { race, rows } = await new BaseOperationsRepository().getRaceResults(raceId);
    expect(race.name).toBe('Results Race');
    expect(rows.find(r => r.number === 101)).toMatchObject({ firstName: 'Alice', notes: 'n' });
    expect(rows.find(r => r.number === 101).times[1]).toBe('2026-03-02T08:30:00.000Z');
    expect(rows.find(r => r.number === 500)).toMatchObject({ firstName: '', status: 'On course' });
  });

  it('rejects when a read fails instead of reporting an empty race', async () => {
    const repo = new BaseOperationsRepository();
    const spy = vi.spyOn(db.withdrawal_records, 'where').mockImplementation(() => { throw new Error('read failed'); });
    try {
      await expect(repo.getRaceResults(raceId)).rejects.toThrow('read failed');
    } finally { spy.mockRestore(); }
    const base = vi.spyOn(db.base_station_runners, 'where').mockImplementation(() => { throw new Error('base failed'); });
    try {
      await expect(repo.getRaceResults(raceId)).rejects.toThrow('base failed');
    } finally { base.mockRestore(); }
  });
});

describe('BaseOperationsRepository reports read base records', () => {
  const raceId = 997;
  const at = (h, m) => TimeUtils.atLocalTime('2026-11-08T12:00:00', h, m);
  const row = (id, number, checkpointNumber, h, m, status = 'passed') =>
    ({ id, raceId, number, checkpointNumber, status, commonTime: at(h, m) });
  let repo;

  beforeEach(async () => {
    repo = new BaseOperationsRepository();
    await db.races.put({ id: raceId, name: 'Rehearsal', date: '2026-11-08', startTime: '06:30' });
    await db.checkpoints.bulkPut([
      { id: 99701, raceId, number: 1, name: 'CP1' },
      { id: 99702, raceId, number: 2, name: 'CP2' },
    ]);
    await db.runners.bulkPut([1, 2, 3, 4].map(n => (
      { id: 99710 + n, raceId, number: n, firstName: '', lastName: '', gender: '', batchNumber: 1, status: 'not-started' })));
    await db.base_station_runners.bulkPut([
      row(99721, 1, 1, 7, 0), row(99722, 1, 2, 7, 30), row(99723, 1, 2, 8, 10, 'superseded'), row(99724, 1, 0, 8, 0),
      row(99725, 2, 1, 7, 5),
      row(99726, 4, 1, 7, 10), row(99727, 4, 2, 7, 40),
      row(99728, 500, 1, 7, 15), row(99729, 500, 0, 8, 20),
    ]);
    await db.checkpoint_runners.bulkPut([
      { id: 99731, raceId, checkpointNumber: 1, number: 3, status: 'non-starter' },
      { id: 99732, raceId, checkpointNumber: 2, number: 4, status: 'dnf' },
    ]);
    await db.withdrawal_records.put({
      id: 99741, raceId, runnerNumber: 4, checkpoint: 2, withdrawalTime: at(7, 45),
      reason: 'injury', comments: '', reversedAt: null, reversedBy: null,
    });
    await db.field_changes.put({ id: 99751, raceId, number: 500, kind: 'late', cancelledAt: null });
  });

  it('Race Summary reflects base, not the setup table', async () => {
    const { content } = await repo.generateRaceResults(997);
    expect(content).not.toContain('not-started');
    expect(content).toMatch(/^1,Finished,08:00,01:30:00,/m);
    expect(content).toMatch(/^3,DNS,,,/m);
    expect(content).toMatch(/^4,DNF,,,/m);
    expect(content).toMatch(/^500,Finished,08:20,01:50:00,/m);
  });
  it('Missing Numbers excludes passed, DNS and DNF runners', async () => {
    expect((await repo.getMissingRunners(997, 2)).map(r => r.number)).toEqual([2, 500]);
    expect((await repo.generateMissingNumbersReport(997, 1)).content).toContain('Total Missing: 0');
  });
  it('Finisher List has one row per finisher', async () => {
    const { content } = await repo.generateFinisherListReport(997);
    expect(content).toContain('# Total Finishers: 2');
    expect(content.split('\n').filter(l => /^\d/.test(l)).map(l => l.split(',')[0])).toEqual(['1', '500']);
  });
  it('Officials takes Finish Time only from the finish', async () => {
    const lines = (await repo.generateOfficialsReport(997)).content.split('\n');
    const cells = bib => lines.find(l => l.startsWith(`${bib},`)).split(',').slice(5, 9);
    expect(cells(1)).toEqual(['07:00', '07:30', '08:00', 'Finished']);
    expect(cells(2)).toEqual(['07:05', '', '', 'On course']);
    expect(cells(4)).toEqual(['07:10', '07:40', '', 'DNF']);
  });
  it('Split Times fills in from base', async () => {
    const { content } = await repo.generateSplitTimesReport(997);
    expect(content).toMatch(/^Runner #,First Name,Last Name,CP1,CP2,Finish,Overall Status$/m);
    expect(content).toMatch(/^1,,,07:00,07:30,08:00,Finished$/m);
    expect(content).toMatch(/^2,,,07:05,—,—,On course$/m);
    expect(content).toMatch(/^3,,,—,—,—,DNS$/m);
  });
  it('Split Times marks DNF where no time is held at the withdrawal checkpoint', async () => {
    await db.base_station_runners.delete(99727);
    const { content } = await repo.generateSplitTimesReport(997);
    expect(content).toMatch(/^4,,,07:10,DNF,—,DNF$/m);
  });
  it('a failed read fails the report instead of exporting an empty race', async () => {
    const spy = vi.spyOn(db.withdrawal_records, 'where').mockImplementation(() => { throw new Error('read failed'); });
    try {
      await expect(repo.generateRaceResults(997)).rejects.toThrow('Failed to generate race results');
    } finally { spy.mockRestore(); }
  });
});
