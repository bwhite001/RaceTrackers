import { BaseRepository } from '../../../shared/services/database/BaseRepository';
import db from '../../../shared/services/database/schema';

export class CheckpointRepository extends BaseRepository {
  constructor() {
    super('checkpoint_runners');
  }

  async getCheckpointRunners(raceId, checkpointNumber) {
    try {
      return await this.table
        .where(['raceId', 'checkpointNumber'])
        .equals([raceId, checkpointNumber])
        .toArray();
    } catch (error) {
      console.error('Error getting checkpoint runners:', error);
      return [];
    }
  }

  async initializeCheckpoint(raceId, checkpointNumber) {
    try {
      // Get all race runners and create checkpoint-specific entries
      const raceRunners = await db.runners.where('raceId').equals(raceId).toArray();
      
      const checkpointRunners = raceRunners.map(runner => ({
        raceId,
        checkpointNumber,
        number: runner.number,
        status: 'not-started',
        callInTime: null,
        markOffTime: null,
        notes: null
      }));

      await this.bulkAdd(checkpointRunners);
      return checkpointRunners;
    } catch (error) {
      console.error('Error initializing checkpoint runners:', error);
      throw new Error('Failed to initialize checkpoint runners');
    }
  }

  async updateRunner(raceId, checkpointNumber, runnerNumber, updates) {
    try {
      const runner = await this.table
        .where(['raceId', 'checkpointNumber', 'number'])
        .equals([raceId, checkpointNumber, runnerNumber])
        .first();
      
      if (!runner) {
        // Create new checkpoint runner if it doesn't exist
        const newRunner = {
          raceId,
          checkpointNumber,
          number: runnerNumber,
          status: 'not-started',
          callInTime: null,
          markOffTime: null,
          notes: null,
          ...updates
        };
        const id = await this.add(newRunner);
        return { ...newRunner, id };
      }

      await this.update(runner.id, updates);
      return { ...runner, ...updates };
    } catch (error) {
      console.error('Error updating checkpoint runner:', error);
      throw new Error(`Failed to update checkpoint runner ${runnerNumber}`);
    }
  }

  async markRunner(raceId, checkpointNumber, runnerNumber, callInTime = null, markOffTime = null, status = 'passed') {
    const timestamp = markOffTime || callInTime || new Date().toISOString();
    return this.updateRunner(raceId, checkpointNumber, runnerNumber, {
      status,
      callInTime: callInTime || timestamp,
      markOffTime: markOffTime || timestamp
    });
  }

  async bulkMarkRunners(raceId, checkpointNumber, runnerNumbers, callInTime = null, markOffTime = null, status = 'passed') {
    try {
      const timestamp = markOffTime || callInTime || new Date().toISOString();
      
      await db.transaction('rw', this.table, async () => {
        for (const runnerNumber of runnerNumbers) {
          await this.updateRunner(raceId, checkpointNumber, runnerNumber, {
            status,
            callInTime: callInTime || timestamp,
            markOffTime: markOffTime || timestamp
          });
        }
      });
    } catch (error) {
      console.error('Error bulk marking checkpoint runners:', error);
      throw new Error('Failed to bulk mark checkpoint runners');
    }
  }

  async exportCheckpointData(raceId, checkpointNumber) {
    try {
      const race = await db.races.get(raceId);
      const checkpoints = await db.checkpoints.where('raceId').equals(raceId).toArray();
      const checkpointRunners = await this.getCheckpointRunners(raceId, checkpointNumber);
      
      const checkpoint = checkpoints.find(cp => cp.number === checkpointNumber);
      
      return {
        raceConfig: {
          id: race.id,
          name: race.name,
          date: race.date,
          startTime: race.startTime,
          minRunner: race.minRunner,
          maxRunner: race.maxRunner
        },
        checkpointRunners,
        checkpointNumber,
        checkpointName: checkpoint?.name || `Checkpoint ${checkpointNumber}`,
        exportedAt: new Date().toISOString(),
        version: '3.0.0',
        exportType: 'isolated-checkpoint-results'
      };
    } catch (error) {
      console.error('Error exporting checkpoint data:', error);
      throw new Error('Failed to export checkpoint data');
    }
  }
}

export default new CheckpointRepository();
