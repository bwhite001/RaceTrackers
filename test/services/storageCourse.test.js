import { describe, it, expect, beforeEach } from 'vitest';
import StorageService from '../../src/services/storage';
import db from '../../src/shared/services/database/schema';

describe('StorageService — course data', () => {
  let raceId;

  beforeEach(async () => {
    await db.races.clear();
    await db.checkpoints.clear();
    await db.runners.clear();
    raceId = await db.races.add({
      name: 'Test Race', date: '2026-03-07', startTime: '06:00',
      minRunner: 1, maxRunner: 5, createdAt: new Date().toISOString(),
    });
    await db.checkpoints.bulkAdd([
      { raceId, number: 1, name: 'CP1' },
      { raceId, number: 2, name: 'CP2' },
    ]);
  });

  it('updateRaceCourseData saves courseGpx and courseBounds', async () => {
    await StorageService.updateRaceCourseData(raceId, {
      courseGpx: '<gpx/>',
      courseBounds: { north: -27.0, south: -27.5, east: 153.5, west: 153.0 },
    });
    const race = await db.races.get(raceId);
    expect(race.courseGpx).toBe('<gpx/>');
    expect(race.courseBounds.north).toBe(-27.0);
  });

  it('updateCheckpointCoordinates saves lat/lng to the correct checkpoint', async () => {
    await StorageService.updateCheckpointCoordinates(raceId, 1, -27.1, 153.1);
    const cp = await db.checkpoints
      .where(['raceId', 'number']).equals([raceId, 1]).first();
    expect(cp.latitude).toBe(-27.1);
    expect(cp.longitude).toBe(153.1);
  });

  it('saveRace passes courseGpx and checkpoint lat/lng through', async () => {
    await db.races.clear();
    await db.checkpoints.clear();
    await db.runners.clear();
    const newRaceId = await StorageService.saveRace({
      name: 'New Race', date: '2026-03-07', startTime: '06:00',
      minRunner: 100, maxRunner: 102,
      courseGpx: '<gpx/>',
      courseBounds: { north: -27.0, south: -27.5, east: 153.5, west: 153.0 },
      checkpoints: [
        { number: 1, name: 'CP1', latitude: -27.1, longitude: 153.1 },
      ],
      runnerRanges: [{ min: 100, max: 102 }],
    });
    const race = await db.races.get(newRaceId);
    expect(race.courseGpx).toBe('<gpx/>');
    const cp = await db.checkpoints
      .where(['raceId', 'number']).equals([newRaceId, 1]).first();
    expect(cp.latitude).toBe(-27.1);
  });
});
