import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import db from '../../src/shared/services/database/schema.js';
import RaceMaintenanceRepository from '../../src/modules/race-maintenance/services/RaceMaintenanceRepository.js';

const seedRace = async () => {
  const raceId = await db.races.add({
    name: 'Test Race',
    date: '2026-03-07',
    startTime: '06:00',
    description: '',
    minRunner: 1,
    maxRunner: 10,
    createdAt: new Date().toISOString(),
  });
  await db.checkpoints.bulkAdd([
    { raceId, number: 1, name: 'Checkpoint 1' },
    { raceId, number: 2, name: 'Checkpoint 2' },
  ]);
  return raceId;
};

describe('RaceMaintenanceRepository.updateRace', () => {
  beforeEach(async () => {
    await db.races.clear();
    await db.checkpoints.clear();
    await db.runners.clear();
  });

  it('updates only allowed fields', async () => {
    const raceId = await seedRace();
    await RaceMaintenanceRepository.updateRace(raceId, {
      name: 'Updated Race',
      startTime: '07:00',
      minRunner: 999, // should be ignored
    });
    const race = await db.races.get(raceId);
    expect(race.name).toBe('Updated Race');
    expect(race.startTime).toBe('07:00');
    expect(race.minRunner).toBe(1); // unchanged — not in allowlist
  });

  it('does nothing when no allowed fields are provided', async () => {
    const raceId = await seedRace();
    await expect(
      RaceMaintenanceRepository.updateRace(raceId, { minRunner: 999 })
    ).resolves.not.toThrow();
    const race = await db.races.get(raceId);
    expect(race.name).toBe('Test Race');
  });
});

describe('RaceMaintenanceRepository.addCheckpoint', () => {
  beforeEach(async () => {
    await db.races.clear();
    await db.checkpoints.clear();
  });

  it('adds a checkpoint with the next sequential number', async () => {
    const raceId = await seedRace();
    await RaceMaintenanceRepository.addCheckpoint(raceId, { name: 'Checkpoint 3' });
    const checkpoints = await db.checkpoints.where('raceId').equals(raceId).sortBy('number');
    expect(checkpoints).toHaveLength(3);
    expect(checkpoints[2].number).toBe(3);
    expect(checkpoints[2].name).toBe('Checkpoint 3');
  });

  it('uses a default name when none provided', async () => {
    const raceId = await seedRace();
    await RaceMaintenanceRepository.addCheckpoint(raceId, {});
    const checkpoints = await db.checkpoints.where('raceId').equals(raceId).sortBy('number');
    expect(checkpoints[2].name).toBe('Checkpoint 3');
  });

  it('starts at 1 when no checkpoints exist yet', async () => {
    const raceId = await db.races.add({ name: 'Empty', createdAt: new Date().toISOString() });
    await RaceMaintenanceRepository.addCheckpoint(raceId, { name: 'First' });
    const cp = await db.checkpoints.where('raceId').equals(raceId).first();
    expect(cp.number).toBe(1);
  });
});

describe('RaceMaintenanceRepository.hasCheckpointRunnerData', () => {
  beforeEach(async () => {
    await db.races.clear();
    await db.checkpoints.clear();
    await db.checkpoint_runners.clear();
  });

  it('returns false when no checkpoint_runners exist for the race', async () => {
    const raceId = await seedRace();
    const result = await RaceMaintenanceRepository.hasCheckpointRunnerData(raceId);
    expect(result).toBe(false);
  });

  it('returns true when checkpoint_runners exist for the race', async () => {
    const raceId = await seedRace();
    await db.checkpoint_runners.add({
      raceId, checkpointNumber: 1, number: 1, status: 'passed',
    });
    const result = await RaceMaintenanceRepository.hasCheckpointRunnerData(raceId);
    expect(result).toBe(true);
  });
});
