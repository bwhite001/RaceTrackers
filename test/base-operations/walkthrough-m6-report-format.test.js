/**
 * M-6 / #53: report export honours the selected format
 *
 * ReportsPanel let the operator pick CSV / Excel / HTML and passed
 * `{ format }` into generateReport, but the missing-numbers and checkpoint-log
 * generators ignored it — missing numbers always came out as plain text with a
 * .txt name regardless of the choice.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { BaseOperationsRepository } from 'modules/base-operations/services/BaseOperationsRepository';
import db from 'shared/services/database/schema';

const RACE_ID = 9701;

describe('M-6 / #53: missing numbers report format', () => {
  let repo;

  beforeEach(async () => {
    repo = new BaseOperationsRepository();
    await db.races.put({ id: RACE_ID, name: 'Format Race', date: '2026-03-04', minRunner: 1, maxRunner: 5 });
    await db.runners.bulkPut([
      { id: 97001, raceId: RACE_ID, number: 1, status: 'passed' },
      { id: 97002, raceId: RACE_ID, number: 2, status: 'not-started' },
      { id: 97003, raceId: RACE_ID, number: 3, status: 'not-started' },
    ]);
    await db.checkpoints.put({ id: 9710, raceId: RACE_ID, number: 1, name: 'Ridgeline' });
    // getMissingRunners determines "passed" from base_station_runners
    await db.base_station_runners.clear();
    await db.base_station_runners.put({
      id: 97101, raceId: RACE_ID, checkpointNumber: 1, number: 1,
      status: 'passed', commonTime: '2026-03-04T09:00:00.000Z',
    });
  });

  it('defaults to CSV', async () => {
    const report = await repo.generateMissingNumbersReport(RACE_ID, 1);
    expect(report.filename).toMatch(/\.csv$/);
    expect(report.mimeType).toBe('text/csv');
  });

  it('produces a CSV column header when the format is csv', async () => {
    const report = await repo.generateMissingNumbersReport(RACE_ID, 1, { format: 'csv' });
    expect(report.content).toMatch(/Runner Number/i);
  });

  it('puts each missing runner on its own CSV row', async () => {
    const report = await repo.generateMissingNumbersReport(RACE_ID, 1, { format: 'csv' });

    const dataLines = report.content
      .split('\n')
      .filter(l => /^\d+$/.test(l.trim()));
    expect(dataLines.map(l => l.trim())).toEqual(['2', '3']);
  });

  it('switches to .html and text/html when the format is html', async () => {
    const report = await repo.generateMissingNumbersReport(RACE_ID, 1, { format: 'html' });
    expect(report.filename).toMatch(/\.html$/);
    expect(report.mimeType).toBe('text/html');
    expect(report.content).toMatch(/<table|<html|<h1/i);
  });

  it('keeps the checkpoint name in the header for every format', async () => {
    for (const format of ['csv', 'html']) {
      const report = await repo.generateMissingNumbersReport(RACE_ID, 1, { format });
      expect(report.content).toContain('Ridgeline');
    }
  });

  it('keeps the checkpoint name in the filename for every format', async () => {
    for (const format of ['csv', 'html']) {
      const report = await repo.generateMissingNumbersReport(RACE_ID, 1, { format });
      expect(report.filename).toContain('ridgeline');
    }
  });

  it('treats excel as CSV rather than failing', async () => {
    const report = await repo.generateMissingNumbersReport(RACE_ID, 1, { format: 'excel' });
    expect(report.filename).toMatch(/\.csv$/);
    expect(report.mimeType).toBe('text/csv');
  });
});

describe('M-6 / #53: checkpoint log report format', () => {
  let repo;

  beforeEach(async () => {
    repo = new BaseOperationsRepository();
    await db.races.put({ id: RACE_ID, name: 'Format Race', date: '2026-03-04', minRunner: 1, maxRunner: 5 });
    await db.checkpoints.put({ id: 9710, raceId: RACE_ID, number: 1, name: 'Ridgeline' });
    await db.base_station_runners.clear();
    await db.base_station_runners.put({
      id: 97201, raceId: RACE_ID, checkpointNumber: 1, number: 1,
      status: 'passed', commonTime: '2026-03-04T09:00:00.000Z', notes: '',
    });
  });

  it('defaults to CSV', async () => {
    const report = await repo.generateCheckpointLogReport(RACE_ID, 1);
    expect(report.filename).toMatch(/\.csv$/);
    expect(report.mimeType).toBe('text/csv');
  });

  it('switches to .html and text/html when the format is html', async () => {
    const report = await repo.generateCheckpointLogReport(RACE_ID, 1, { format: 'html' });
    expect(report.filename).toMatch(/\.html$/);
    expect(report.mimeType).toBe('text/html');
    expect(report.content).toMatch(/<table|<html|<h1/i);
  });

  it('keeps the CSV column headers in csv mode', async () => {
    const report = await repo.generateCheckpointLogReport(RACE_ID, 1, { format: 'csv' });
    expect(report.content).toContain('Number,Status,Time,Notes');
  });
});
