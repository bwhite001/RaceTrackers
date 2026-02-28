import { BaseRepository } from '../../../shared/services/database/BaseRepository';
import db from '../../../shared/services/database/schema';
import TimeUtils from '../../../services/timeUtils';

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
      const raceRunners = await db.runners.where('raceId').equals(raceId).toArray();
      
      const checkpointRunners = raceRunners.map(runner => ({
        raceId,
        checkpointNumber,
        number: runner.number,
        status: 'not-started',
        actualTime: null,
        commonTime: null,
        commonTimeLabel: null,
        calledIn: false,
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
        const newRunner = {
          raceId,
          checkpointNumber,
          number: runnerNumber,
          status: 'not-started',
          actualTime: null,
          commonTime: null,
          commonTimeLabel: null,
          calledIn: false,
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

  /**
   * Mark a runner as passed through a checkpoint.
   * Computes and persists all 3 times: actualTime, commonTime, commonTimeLabel.
   */
  async markRunner(raceId, checkpointNumber, runnerNumber, callInTime = null, markOffTime = null, status = 'passed') {
    const actualTime = markOffTime || callInTime || new Date().toISOString();
    const { commonTime, commonTimeLabel } = TimeUtils.getCommonTimeLabel(actualTime);

    return this.updateRunner(raceId, checkpointNumber, runnerNumber, {
      status,
      actualTime,
      commonTime,
      commonTimeLabel,
      markOffTime: actualTime, // keep for back-compat
      callInTime: callInTime || null
    });
  }

  async bulkMarkRunners(raceId, checkpointNumber, runnerNumbers, callInTime = null, markOffTime = null, status = 'passed') {
    try {
      const actualTime = markOffTime || callInTime || new Date().toISOString();
      const { commonTime, commonTimeLabel } = TimeUtils.getCommonTimeLabel(actualTime);

      await db.transaction('rw', this.table, async () => {
        for (const runnerNumber of runnerNumbers) {
          await this.updateRunner(raceId, checkpointNumber, runnerNumber, {
            status,
            actualTime,
            commonTime,
            commonTimeLabel,
            markOffTime: actualTime,
            callInTime: callInTime || null
          });
        }
      });
    } catch (error) {
      console.error('Error bulk marking checkpoint runners:', error);
      throw new Error('Failed to bulk mark checkpoint runners');
    }
  }

  /**
   * Mark an entire 5-minute group as called in to base station.
   * Persists calledIn=true and callInTime on all runners with matching commonTimeLabel.
   */
  async markGroupCalledIn(raceId, checkpointNumber, commonTimeLabel) {
    try {
      const callInTime = new Date().toISOString();
      await db.transaction('rw', this.table, async () => {
        const runners = await this.table
          .where(['raceId', 'checkpointNumber'])
          .equals([raceId, checkpointNumber])
          .filter(r => r.commonTimeLabel === commonTimeLabel)
          .toArray();

        for (const runner of runners) {
          await this.update(runner.id, { calledIn: true, callInTime });
        }
      });
    } catch (error) {
      console.error('Error marking group called in:', error);
      throw new Error('Failed to mark group as called in');
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
