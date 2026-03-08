import { BaseRepository } from '../../../shared/services/database/BaseRepository';
import db from '../../../shared/services/database/schema';

export class RaceMaintenanceRepository extends BaseRepository {
  constructor() {
    super('races');
  }

  async createRace(raceConfig) {
    try {
      return await db.transaction('rw', [db.races, db.runners, db.checkpoints, db.race_batches], async () => {
        // Create race
        const raceId = await this.add({
          ...raceConfig,
          createdAt: new Date().toISOString()
        });

        // Create checkpoints
        if (raceConfig.checkpoints?.length > 0) {
          const checkpoints = raceConfig.checkpoints.map(checkpoint => ({
            raceId,
            number: checkpoint.number,
            name: checkpoint.name || `Checkpoint ${checkpoint.number}`,
            ...(checkpoint.linkedCheckpointNumber != null && { linkedCheckpointNumber: checkpoint.linkedCheckpointNumber }),
            ...(checkpoint.linkLabel != null && { linkLabel: checkpoint.linkLabel }),
          }));
          await db.checkpoints.bulkAdd(checkpoints);
        } else {
          await db.checkpoints.add({
            raceId,
            number: 1,
            name: 'Checkpoint 1'
          });
        }

        // Create batches
        const batches = raceConfig.batches?.length > 0
          ? raceConfig.batches
          : [{ batchNumber: 1, batchName: 'All Runners', startTime: raceConfig.startTime || new Date().toISOString() }];

        await db.race_batches.bulkAdd(
          batches.map(b => ({ raceId, batchNumber: b.batchNumber, batchName: b.batchName, startTime: b.startTime }))
        );

        // Initialize runners
        const runners = [];
        if (raceConfig.runnerRanges?.length > 0) {
          for (const range of raceConfig.runnerRanges) {
            if (range.isIndividual && range.individualNumbers) {
              for (const number of range.individualNumbers) {
                runners.push(this._createRunnerObject(raceId, number));
              }
            } else {
              for (let i = range.min; i <= range.max; i++) {
                runners.push(this._createRunnerObject(raceId, i));
              }
            }
          }
        } else {
          for (let i = raceConfig.minRunner; i <= raceConfig.maxRunner; i++) {
            runners.push(this._createRunnerObject(raceId, i));
          }
        }
        
        await db.runners.bulkAdd(runners);
        return raceId;
      });
    } catch (error) {
      console.error('Error creating race:', error);
      throw new Error('Failed to create race configuration');
    }
  }

  async getCurrentRace() {
    try {
      const races = await this.table.orderBy('createdAt').reverse().limit(1).toArray();
      return races.length > 0 ? races[0] : null;
    } catch (error) {
      console.error('Error getting current race:', error);
      return null;
    }
  }

  async deleteRace(raceId) {
    try {
      await db.transaction('rw', [
        db.races, 
        db.runners, 
        db.checkpoints, 
        db.checkpoint_runners, 
        db.base_station_runners,
        db.race_batches
      ], async () => {
        await db.races.delete(raceId);
        await db.runners.where('raceId').equals(raceId).delete();
        await db.checkpoints.where('raceId').equals(raceId).delete();
        await db.checkpoint_runners.where('raceId').equals(raceId).delete();
        await db.base_station_runners.where('raceId').equals(raceId).delete();
        await db.race_batches.where('raceId').equals(raceId).delete();
      });
    } catch (error) {
      console.error('Error deleting race:', error);
      throw new Error('Failed to delete race');
    }
  }

  async getCheckpoints(raceId) {
    try {
      return await db.checkpoints.where('raceId').equals(raceId).sortBy('number');
    } catch (error) {
      console.error('Error getting checkpoints:', error);
      return [];
    }
  }

  async updateCheckpoint(checkpointId, updates) {
    try {
      await db.checkpoints.update(checkpointId, updates);
    } catch (error) {
      console.error('Error updating checkpoint:', error);
      throw new Error('Failed to update checkpoint');
    }
  }

  async linkCheckpoints(raceId, cpNumberA, cpNumberB) {
    try {
      const [cpA, cpB] = await Promise.all([
        db.checkpoints.where({ raceId, number: cpNumberA }).first(),
        db.checkpoints.where({ raceId, number: cpNumberB }).first(),
      ]);
      if (!cpA || !cpB) throw new Error('One or both checkpoints not found');

      // Clear any previous partner's back-link
      if (cpA.linkedCheckpointNumber != null && cpA.linkedCheckpointNumber !== cpNumberB) {
        const oldPartnerA = await db.checkpoints.where({ raceId, number: cpA.linkedCheckpointNumber }).first();
        if (oldPartnerA) await db.checkpoints.update(oldPartnerA.id, { linkedCheckpointNumber: null, linkLabel: null });
      }
      if (cpB.linkedCheckpointNumber != null && cpB.linkedCheckpointNumber !== cpNumberA) {
        const oldPartnerB = await db.checkpoints.where({ raceId, number: cpB.linkedCheckpointNumber }).first();
        if (oldPartnerB) await db.checkpoints.update(oldPartnerB.id, { linkedCheckpointNumber: null, linkLabel: null });
      }

      await db.checkpoints.update(cpA.id, { linkedCheckpointNumber: cpNumberB });
      await db.checkpoints.update(cpB.id, { linkedCheckpointNumber: cpNumberA });
    } catch (error) {
      console.error('Error linking checkpoints:', error);
      throw new Error('Failed to link checkpoints');
    }
  }

  async unlinkCheckpoints(raceId, cpNumber) {
    try {
      const cp = await db.checkpoints.where({ raceId, number: cpNumber }).first();
      if (!cp) return;
      const partnerNumber = cp.linkedCheckpointNumber;
      await db.checkpoints.update(cp.id, { linkedCheckpointNumber: null, linkLabel: null });
      if (partnerNumber != null) {
        const partner = await db.checkpoints.where({ raceId, number: partnerNumber }).first();
        if (partner) await db.checkpoints.update(partner.id, { linkedCheckpointNumber: null, linkLabel: null });
      }
    } catch (error) {
      console.error('Error unlinking checkpoints:', error);
      throw new Error('Failed to unlink checkpoints');
    }
  }

  async getLinkedCheckpoint(raceId, cpNumber) {
    try {
      const cp = await db.checkpoints.where({ raceId, number: cpNumber }).first();
      if (!cp?.linkedCheckpointNumber) return null;
      return await db.checkpoints.where({ raceId, number: cp.linkedCheckpointNumber }).first() ?? null;
    } catch (error) {
      console.error('Error getting linked checkpoint:', error);
      return null;
    }
  }

  _createRunnerObject(raceId, number) {
    return {
      raceId,
      number,
      firstName: null,
      lastName: null,
      gender: 'X',
      batchNumber: 1,
      status: 'not-started',
      recordedTime: null,
      notes: null
    };
  }

  // ── Batch / Wave methods ─────────────────────────────────────────────────

  async createBatch(raceId, batchData) {
    try {
      return await db.race_batches.add({ raceId, ...batchData });
    } catch (error) {
      console.error('Error creating batch:', error);
      throw new Error('Failed to create race batch');
    }
  }

  async getBatches(raceId) {
    try {
      return await db.race_batches.where('raceId').equals(raceId).sortBy('batchNumber');
    } catch (error) {
      console.error('Error getting batches:', error);
      return [];
    }
  }

  async updateBatch(batchId, updates) {
    try {
      await db.race_batches.update(batchId, updates);
    } catch (error) {
      console.error('Error updating batch:', error);
      throw new Error('Failed to update batch');
    }
  }

  async deleteBatch(batchId) {
    try {
      await db.race_batches.delete(batchId);
    } catch (error) {
      console.error('Error deleting batch:', error);
      throw new Error('Failed to delete batch');
    }
  }

  async bulkCreateBatches(raceId, batches) {
    try {
      const records = batches.map(b => ({ raceId, ...b }));
      await db.race_batches.bulkAdd(records);
    } catch (error) {
      console.error('Error bulk creating batches:', error);
      throw new Error('Failed to create batches');
    }
  }

  // ── Runner personal data (CSV upsert) ────────────────────────────────────

  /**
   * Upsert runner details from CSV import.
   * Matches on raceId+number, updates firstName/lastName/gender/batchNumber.
   * Never deletes runners.
   * @param {number} raceId
   * @param {Array<{number, firstName, lastName, gender, batchNumber}>} rows
   * @returns {{ updated: number, created: number, errors: number }}
   */
  async bulkUpsertRunnerDetails(raceId, rows) {
    let updated = 0, created = 0, errors = 0;
    await db.transaction('rw', db.runners, async () => {
      for (const row of rows) {
        try {
          const existing = await db.runners
            .where(['raceId', 'number'])
            .equals([raceId, row.number])
            .first();
          if (existing) {
            await db.runners.update(existing.id, {
              firstName: row.firstName ?? existing.firstName,
              lastName: row.lastName ?? existing.lastName,
              gender: row.gender ?? existing.gender,
              batchNumber: row.batchNumber ?? existing.batchNumber
            });
            updated++;
          } else {
            await db.runners.add(this._createRunnerObject(raceId, row.number));
            await db.runners
              .where(['raceId', 'number'])
              .equals([raceId, row.number])
              .modify({
                firstName: row.firstName ?? null,
                lastName: row.lastName ?? null,
                gender: row.gender ?? 'X',
                batchNumber: row.batchNumber ?? 1
              });
            created++;
          }
        } catch (err) {
          console.error('Error upserting runner', row.number, err);
          errors++;
        }
      }
    });
    return { updated, created, errors };
  }

  async updateRace(raceId, updates) {
    const allowed = ['name', 'date', 'startTime', 'description', 'runnerRanges'];
    const safe = Object.fromEntries(
      Object.entries(updates).filter(([k]) => allowed.includes(k))
    );
    if (Object.keys(safe).length === 0) return;
    await db.races.update(raceId, safe);
  }

  /**
   * Upsert race_batches rows with names from XLSX import.
   * @param {number} raceId
   * @param {{ [batchNumber]: string }} batchLabels - e.g. { 1: 'Pinnacles Classic', 2: 'Pinnacles Double' }
   */
  async upsertBatchNames(raceId, batchLabels) {
    await db.transaction('rw', db.race_batches, async () => {
      for (const [num, name] of Object.entries(batchLabels)) {
        const batchNumber = parseInt(num, 10);
        const existing = await db.race_batches
          .where(['raceId', 'batchNumber'])
          .equals([raceId, batchNumber])
          .first();
        if (existing) {
          await db.race_batches.update(existing.id, { batchName: name });
        } else {
          await db.race_batches.add({ raceId, batchNumber, batchName: name, startTime: null });
        }
      }
    });
  }

  async addCheckpoint(raceId, { name } = {}) {
    const existing = await db.checkpoints.where('raceId').equals(raceId).toArray();
    const nextNumber = existing.length > 0
      ? Math.max(...existing.map(c => c.number)) + 1
      : 1;
    return await db.checkpoints.add({
      raceId,
      number: nextNumber,
      name: name?.trim() || `Checkpoint ${nextNumber}`,
    });
  }

  async hasCheckpointRunnerData(raceId) {
    const count = await db.checkpoint_runners.where('raceId').equals(raceId).count();
    return count > 0;
  }
}

export default new RaceMaintenanceRepository();
