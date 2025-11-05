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
        db.base_station_runners
      ], async () => {
        await db.races.delete(raceId);
        await db.runners.where('raceId').equals(raceId).delete();
        await db.checkpoints.where('raceId').equals(raceId).delete();
        await db.checkpoint_runners.where('raceId').equals(raceId).delete();
        await db.base_station_runners.where('raceId').equals(raceId).delete();
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
      status: 'not-started',
      recordedTime: null,
      notes: null
    };
  }
}

export default new RaceMaintenanceRepository();
