import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ImportService } from '../../src/services/import-export/ImportService';
import { ExportService } from '../../src/services/import-export/ExportService';
import db from '../../src/shared/services/database/schema';

const RACE_ID = 'race-import-test';
const CP_NUM = 2;

const makePackage = (overrides = {}) => ({
  version: '1.0',
  exportType: 'checkpoint-results',
  exportDate: new Date().toISOString(),
  checksum: 'dummy',
  data: {
    raceId: RACE_ID,
    checkpointNumber: CP_NUM,
    runners: [
      { number: 101, status: 'PASSED', markOffTime: '2024-01-01T10:00:00.000Z', callInTime: null, notes: '' },
      { number: 102, status: 'NOT_STARTED', markOffTime: null, callInTime: null, notes: '' },
    ],
  },
  metadata: { totalRunners: 2 },
  ...overrides,
});

describe('ImportService.importCheckpointResults', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  it('inserts a row into imported_checkpoint_results on success', async () => {
    const result = await ImportService.importCheckpointResults(makePackage(), RACE_ID);
    expect(result.success).toBe(true);
    const rows = await db.imported_checkpoint_results.toArray();
    expect(rows).toHaveLength(1);
  });

  it('returns checkpointNumber and totalRunners on success', async () => {
    const result = await ImportService.importCheckpointResults(makePackage(), RACE_ID);
    expect(result.checkpointNumber).toBe(CP_NUM);
    expect(result.totalRunners).toBe(2);
  });

  it('stores runners as a JSON-serialisable array in the row', async () => {
    await ImportService.importCheckpointResults(makePackage(), RACE_ID);
    const row = await db.imported_checkpoint_results.toCollection().first();
    expect(Array.isArray(row.runners)).toBe(true);
    expect(row.runners).toHaveLength(2);
  });

  it('overwrites a previous import for the same checkpoint (delete + add)', async () => {
    const pkg = makePackage();
    await ImportService.importCheckpointResults(pkg, RACE_ID);

    // Re-import with one runner
    const pkg2 = makePackage();
    pkg2.data.runners = [{ number: 101, status: 'PASSED', markOffTime: null, callInTime: null }];
    pkg2.data.runners.length; // just to use the variable
    await ImportService.importCheckpointResults(pkg2, RACE_ID);

    const rows = await db.imported_checkpoint_results.toArray();
    expect(rows).toHaveLength(1);
    expect(rows[0].runners).toHaveLength(1);
  });

  it('returns success: false when raceId does not match', async () => {
    const result = await ImportService.importCheckpointResults(makePackage(), 'other-race');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/race id mismatch/i);
  });

  it('returns success: false for wrong exportType', async () => {
    const result = await ImportService.importCheckpointResults(
      { ...makePackage(), exportType: 'full-race-data' },
      RACE_ID
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/invalid package/i);
  });

  it('returns success: false for null/undefined package', async () => {
    const result = await ImportService.importCheckpointResults(null, RACE_ID);
    expect(result.success).toBe(false);
  });
});
