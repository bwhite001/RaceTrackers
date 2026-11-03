import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import db from '../../src/shared/services/database/schema.js';
import RaceMaintenanceRepository from '../../src/modules/race-maintenance/services/RaceMaintenanceRepository.js';

// Helper: insert two checkpoints into the DB
const insertCheckpoints = async (raceId) => {
  await db.checkpoints.bulkAdd([
    { raceId, number: 1, name: 'Mile 5 Out' },
    { raceId, number: 4, name: 'Mile 15 Back' },
  ]);
};

describe('RaceMaintenanceRepository — checkpoint linking', () => {
  beforeEach(async () => {
    await db.checkpoints.clear();
  });

  it('linkCheckpoints sets linkedCheckpointNumber on both records bidirectionally', async () => {
    await insertCheckpoints(1);
    await RaceMaintenanceRepository.linkCheckpoints(1, 1, 4);
    const cp1 = await db.checkpoints.where({ raceId: 1, number: 1 }).first();
    const cp4 = await db.checkpoints.where({ raceId: 1, number: 4 }).first();
    expect(cp1.linkedCheckpointNumber).toBe(4);
    expect(cp4.linkedCheckpointNumber).toBe(1);
  });

  it('unlinkCheckpoints clears linkedCheckpointNumber on both records', async () => {
    await insertCheckpoints(1);
    await RaceMaintenanceRepository.linkCheckpoints(1, 1, 4);
    await RaceMaintenanceRepository.unlinkCheckpoints(1, 1);
    const cp1 = await db.checkpoints.where({ raceId: 1, number: 1 }).first();
    const cp4 = await db.checkpoints.where({ raceId: 1, number: 4 }).first();
    expect(cp1.linkedCheckpointNumber).toBeNull();
    expect(cp4.linkedCheckpointNumber).toBeNull();
  });

  it('getLinkedCheckpoint returns the partner record', async () => {
    await insertCheckpoints(1);
    await RaceMaintenanceRepository.linkCheckpoints(1, 1, 4);
    const partner = await RaceMaintenanceRepository.getLinkedCheckpoint(1, 1);
    expect(partner.number).toBe(4);
  });

  it('getLinkedCheckpoint returns null when not linked', async () => {
    await insertCheckpoints(1);
    const partner = await RaceMaintenanceRepository.getLinkedCheckpoint(1, 1);
    expect(partner).toBeNull();
  });

  it('linkCheckpoints replaces an existing link', async () => {
    await db.checkpoints.bulkAdd([
      { raceId: 1, number: 1, name: 'CP1' },
      { raceId: 1, number: 2, name: 'CP2' },
      { raceId: 1, number: 4, name: 'CP4' },
    ]);
    await RaceMaintenanceRepository.linkCheckpoints(1, 1, 2);
    await RaceMaintenanceRepository.linkCheckpoints(1, 1, 4);
    const cp1 = await db.checkpoints.where({ raceId: 1, number: 1 }).first();
    expect(cp1.linkedCheckpointNumber).toBe(4);
    // CP2 should have had its link cleared
    const cp2 = await db.checkpoints.where({ raceId: 1, number: 2 }).first();
    expect(cp2.linkedCheckpointNumber ?? null).toBeNull();
  });

  it('createRace keeps checkpoint coordinates', async () => {
    const id = await RaceMaintenanceRepository.createRace({
      name: 'GPS', date: '2026-11-08', startTime: '06:30', minRunner: 1, maxRunner: 2,
      runnerRanges: [{ min: 1, max: 2 }],
      checkpoints: [{ number: 1, name: 'CP1', latitude: -27.321677, longitude: 152.714852 }, { number: 2, name: 'CP2' }],
    });
    const [a, b] = await db.checkpoints.where('raceId').equals(id).sortBy('number');
    expect(a).toMatchObject({ latitude: -27.321677, longitude: 152.714852 });
    expect(b.latitude).toBeUndefined();
  });

  it('createRace stores no operator or base callsigns (not tracked)', async () => {
    const id = await RaceMaintenanceRepository.createRace({
      name: 'Old setup', date: '2026-11-08', startTime: '06:30', minRunner: 1, maxRunner: 2, baseCallsign: 'VK4WIP',
      runnerRanges: [{ min: 1, max: 2 }],
      checkpoints: [{ number: 1, name: 'CP1', operatorCallsigns: ['VK4IE'] }],
    });
    const [cp] = await db.checkpoints.where('raceId').equals(id).toArray();
    expect(cp.operatorCallsigns).toBeUndefined();
    expect((await db.races.get(id)).baseCallsign).toBeUndefined();
  });
});
