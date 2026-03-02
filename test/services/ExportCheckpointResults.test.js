import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ExportService } from '../../src/services/import-export/ExportService';
import db from '../../src/shared/services/database/schema';

describe('ExportService.exportCheckpointResults', () => {
  const RACE_ID = 'race-cp-export-test';
  const CP_NUM = 3;

  beforeEach(async () => {
    await db.delete();
    await db.open();

    // Seed all race runners (required for all-runners export)
    await db.runners.bulkAdd([
      { raceId: RACE_ID, number: 101, firstName: 'Alice', lastName: 'Smith', status: 'not-started' },
      { raceId: RACE_ID, number: 102, firstName: 'Bob', lastName: 'Jones', status: 'not-started' },
      { raceId: RACE_ID, number: 103, firstName: 'Carol', lastName: 'White', status: 'not-started' },
    ]);

    // Seed checkpoint runners (seen at this checkpoint)
    await db.checkpoint_runners.bulkAdd([
      {
        raceId: RACE_ID,
        checkpointNumber: CP_NUM,
        number: 101,
        markOffTime: '2024-01-01T10:05:00.000Z',
        callInTime: '2024-01-01T10:06:00.000Z',
        status: 'PASSED',
        notes: '',
      },
      {
        raceId: RACE_ID,
        checkpointNumber: CP_NUM,
        number: 102,
        markOffTime: null,
        callInTime: null,
        status: 'NOT_STARTED',
        notes: '',
      },
      // Different checkpoint — should NOT merge into CP_NUM data
      {
        raceId: RACE_ID,
        checkpointNumber: CP_NUM + 1,
        number: 101,
        markOffTime: null,
        callInTime: null,
        status: 'NOT_STARTED',
        notes: '',
      },
    ]);
  });

  afterEach(async () => {
    await db.delete();
  });

  it('returns a package with exportType "checkpoint-results"', async () => {
    const pkg = await ExportService.exportCheckpointResults(RACE_ID, CP_NUM);
    expect(pkg.exportType).toBe('checkpoint-results');
  });

  it('includes raceId and checkpointNumber in data', async () => {
    const pkg = await ExportService.exportCheckpointResults(RACE_ID, CP_NUM);
    expect(pkg.data.raceId).toBe(RACE_ID);
    expect(pkg.data.checkpointNumber).toBe(CP_NUM);
  });

  it('returns ALL race runners (not just those seen at checkpoint)', async () => {
    const pkg = await ExportService.exportCheckpointResults(RACE_ID, CP_NUM);
    expect(pkg.data.runners).toHaveLength(3);
    const numbers = pkg.data.runners.map(r => r.number);
    expect(numbers).toContain(101);
    expect(numbers).toContain(102);
    expect(numbers).toContain(103); // Not seen at checkpoint but still included
  });

  it('merges checkpoint data for runners seen at this checkpoint', async () => {
    const pkg = await ExportService.exportCheckpointResults(RACE_ID, CP_NUM);
    const runner101 = pkg.data.runners.find(r => r.number === 101);
    expect(runner101.markOffTime).toBe('2024-01-01T10:05:00.000Z');
    expect(runner101.callInTime).toBe('2024-01-01T10:06:00.000Z');
  });

  it('marks unseen runners with null times', async () => {
    const pkg = await ExportService.exportCheckpointResults(RACE_ID, CP_NUM);
    const runner103 = pkg.data.runners.find(r => r.number === 103);
    expect(runner103.markOffTime).toBeNull();
    expect(runner103.callInTime).toBeNull();
  });

  it('does not include data from other checkpoints', async () => {
    const pkg = await ExportService.exportCheckpointResults(RACE_ID, CP_NUM);
    // runner 101 has a CP_NUM+1 entry but we should only see CP_NUM data
    const runner101 = pkg.data.runners.find(r => r.number === 101);
    // Should have markOffTime from CP_NUM (not null from CP_NUM+1)
    expect(runner101.markOffTime).toBe('2024-01-01T10:05:00.000Z');
  });

  it('includes metadata with correct totalRunners count', async () => {
    const pkg = await ExportService.exportCheckpointResults(RACE_ID, CP_NUM);
    expect(pkg.metadata.totalRunners).toBe(3);
  });

  it('includes a checksum string', async () => {
    const pkg = await ExportService.exportCheckpointResults(RACE_ID, CP_NUM);
    expect(typeof pkg.checksum).toBe('string');
    expect(pkg.checksum.length).toBe(64); // SHA-256 hex
  });

  it('includes exportDate as ISO string', async () => {
    const pkg = await ExportService.exportCheckpointResults(RACE_ID, CP_NUM);
    expect(() => new Date(pkg.exportDate)).not.toThrow();
    expect(new Date(pkg.exportDate).toISOString()).toBe(pkg.exportDate);
  });

  it('includes version "1.0"', async () => {
    const pkg = await ExportService.exportCheckpointResults(RACE_ID, CP_NUM);
    expect(pkg.version).toBe('1.0');
  });

  it('returns empty runners array when race has no runners', async () => {
    const pkg = await ExportService.exportCheckpointResults('empty-race-id', 99);
    expect(pkg.data.runners).toHaveLength(0);
    expect(pkg.metadata.totalRunners).toBe(0);
  });
});
