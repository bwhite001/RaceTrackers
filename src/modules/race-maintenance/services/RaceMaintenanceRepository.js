import { BaseRepository } from '../../../shared/services/database/BaseRepository';
import db from '../../../shared/services/database/schema';

export class RaceMaintenanceRepository extends BaseRepository {
  constructor() {
    super('races');
  }

  async createRace(raceConfig) {
    try {
      return await db.transaction('rw', [db.races, db.runners, db.checkpoints], async () => {
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
            name: checkpoint.name || `Checkpoint ${checkpoint.number}`
          }));
          await db.checkpoints.bulkAdd(checkpoints);
        } else {
          await db.checkpoints.add({
            raceId,
            number: 1,
            name: 'Checkpoint 1'
          });
        }

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
}

export default new RaceMaintenanceRepository();
