import { describe, it, expect, beforeEach } from 'vitest';
import db from '../../src/shared/services/database/schema';

describe('Schema v9 — GPS fields', () => {
  beforeEach(async () => {
    await db.races.clear();
    await db.checkpoints.clear();
  });

  it('allows saving courseGpx and courseBounds on a race', async () => {
    const id = await db.races.add({
      name: 'Test Race',
      date: '2026-03-07',
      startTime: '06:00',
      minRunner: 1,
      maxRunner: 10,
      createdAt: new Date().toISOString(),
      courseGpx: '<gpx/>',
      courseBounds: { north: -27.0, south: -27.5, east: 153.5, west: 153.0 },
    });
    const race = await db.races.get(id);
    expect(race.courseGpx).toBe('<gpx/>');
    expect(race.courseBounds.north).toBe(-27.0);
  });

  it('allows saving latitude and longitude on a checkpoint', async () => {
    const id = await db.checkpoints.add({
      raceId: 1,
      number: 1,
      name: 'Ridge Top',
      latitude: -27.1,
      longitude: 153.1,
    });
    const cp = await db.checkpoints.get(id);
    expect(cp.latitude).toBe(-27.1);
    expect(cp.longitude).toBe(153.1);
  });

  it('allows null GPS fields (existing races unaffected)', async () => {
    const id = await db.races.add({
      name: 'No GPS Race',
      date: '2026-03-07',
      startTime: '06:00',
      minRunner: 1,
      maxRunner: 10,
      createdAt: new Date().toISOString(),
    });
    const race = await db.races.get(id);
    expect(race.courseGpx).toBeUndefined();
    expect(race.courseBounds).toBeUndefined();
  });
});
