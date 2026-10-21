import { describe, it, expect, beforeEach } from 'vitest';
import db from '../../src/shared/services/database/schema.js';
import { ExportService } from '../../src/services/import-export/ExportService.js';
import { ImportService } from '../../src/services/import-export/ImportService.js';
import { RESULT_KEYS, shareEmailUrl, setupFileName, MAILTO_MAX } from '../../src/components/Shared/shareRace.js';

describe('A7 — sharing a race', () => {
  let raceId;
  beforeEach(async () => {
    await Promise.all(['races', 'runners', 'checkpoints', 'checkpoint_runners', 'base_station_runners', 'withdrawal_records', 'audit_log'].map(t => db[t].clear()));
    raceId = await db.races.add({ name: 'Mt Glorious Mountain Trails', date: '2026-11-08', startTime: '06:30', minRunner: 100, maxRunner: 349, createdAt: new Date().toISOString() });
    await db.runners.bulkAdd(Array.from({ length: 250 }, (_, i) => ({ raceId, number: 100 + i, status: 'not-started' })));
    await db.checkpoints.add({ raceId, number: 1, name: 'CP1' });
    await db.checkpoint_runners.add({ raceId, checkpointNumber: 1, number: 101, status: 'passed' });
    await db.base_station_runners.add({ raceId, checkpointNumber: 0, number: 101, status: 'passed' });
    await db.withdrawal_records.add({ raceId, runnerNumber: 102, checkpoint: 1, withdrawalTime: 'x', reversedAt: null });
  });

  it('the shared setup carries no results and passes import validation', async () => {
    const pkg = await ExportService.exportRaceSetup(raceId);
    for (const key of RESULT_KEYS) expect(pkg.data[key]).toBeUndefined();
    expect(pkg.data.runners).toHaveLength(250);
    expect(ImportService.validatePackage(pkg).valid).toBe(true);
    // a full backup still keeps results
    const full = await ExportService.exportRace(raceId);
    expect(full.data.checkpointRunners).toHaveLength(1);
  });

  it('the email link stays short whatever the race size', () => {
    const name = 'Mt Glorious Mountain Trails';
    const url = shareEmailUrl(name, setupFileName(name));
    expect(url.startsWith('mailto:?subject=')).toBe(true);
    expect(url.length).toBeLessThanOrEqual(MAILTO_MAX);
    expect(decodeURIComponent(url)).toContain('race-setup-Mt-Glorious-Mountain-Trails.json');
  });
});
