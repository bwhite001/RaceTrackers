import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ExportService } from '../../src/services/import-export/ExportService';
import db from '../../src/shared/services/database/schema';

describe('ExportService.exportCheckpointResults', () => {
  const RACE_ID = 'race-cp-export-test';
  const CP_NUM = 3;

  beforeEach(async () => {
    await db.delete();
    await db.open();

    // Seed two checkpoint runners
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
      // Different checkpoint — should NOT be included
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

  it('returns only runners from the specified checkpoint', async () => {
    const pkg = await ExportService.exportCheckpointResults(RACE_ID, CP_NUM);
    expect(pkg.data.runners).toHaveLength(2);
    expect(pkg.data.runners.every((r) => r.checkpointNumber === CP_NUM)).toBe(true);
  });

  it('includes metadata with correct totalRunners count', async () => {
    const pkg = await ExportService.exportCheckpointResults(RACE_ID, CP_NUM);
    expect(pkg.metadata.totalRunners).toBe(2);
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

  it('returns empty runners array when checkpoint has no data', async () => {
    const pkg = await ExportService.exportCheckpointResults(RACE_ID, 99);
    expect(pkg.data.runners).toHaveLength(0);
    expect(pkg.metadata.totalRunners).toBe(0);
  });
});
