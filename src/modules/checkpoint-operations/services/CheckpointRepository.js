import { BaseRepository } from '../../../shared/services/database/BaseRepository';
import db from '../../../shared/services/database/schema';
import TimeUtils from '../../../services/timeUtils';

export class CheckpointRepository extends BaseRepository {
  constructor() {
    super('checkpoint_runners');
  }

  async getCheckpointRunners(raceId, checkpointNumber) {
    try {
      const rows = await this.table
        .where('[raceId+checkpointNumber+number]')
        .between([raceId, checkpointNumber, -Infinity], [raceId, checkpointNumber, Infinity])
        .toArray();
      // Older builds could seed a checkpoint twice. Keep the first row per bib —
      // the same row every update targets — and ignore (not delete) the rest.
      const seen = new Set();
      return rows.filter(r => !seen.has(r.number) && seen.add(r.number));
    } catch (error) {
      console.error('Error getting checkpoint runners:', error);
      return [];
    }
  }

  async initializeCheckpoint(raceId, checkpointNumber) {
    try {
      let raceRunners = await db.runners.where('raceId').equals(raceId).toArray();

      // Filter by allowedBatches if the checkpoint restricts waves
      const checkpoint = await db.checkpoints
        .where('[raceId+number]').equals([raceId, checkpointNumber])
        .first();
      if (checkpoint?.allowedBatches?.length) {
        raceRunners = raceRunners.filter(r => checkpoint.allowedBatches.includes(r.batchNumber));
      }

      // Seed only bibs that have no row yet, inside one rw transaction, so two
      // concurrent initialisations can't create duplicate rows.
      return await db.transaction('rw', db.checkpoint_runners, async () => {
        const have = new Set((await db.checkpoint_runners
          .where('[raceId+checkpointNumber+number]')
          .between([raceId, checkpointNumber, -Infinity], [raceId, checkpointNumber, Infinity])
          .toArray()).map(r => r.number));
        const checkpointRunners = raceRunners.filter(runner => !have.has(runner.number)).map(runner => ({
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

        if (checkpointRunners.length) await this.bulkAdd(checkpointRunners);
        return checkpointRunners;
      });
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

  // ── VK4WIP redesign: per-bib edits, each undoable via an exact snapshot ──

  async _get(raceId, checkpointNumber, number) {
    return this.table
      .where(['raceId', 'checkpointNumber', 'number'])
      .equals([raceId, checkpointNumber, number])
      .first();
  }

  /** Exact copies of these runners' records (null where none) for Undo. */
  async snapshot(raceId, checkpointNumber, numbers) {
    return Promise.all(numbers.map(async number => ({
      number,
      record: (await this._get(raceId, checkpointNumber, number)) ?? null,
    })));
  }

  /** Put records back exactly as snapshotted; delete rows that didn't exist. */
  async restoreSnapshot(raceId, checkpointNumber, snap) {
    await db.transaction('rw', this.table, async () => {
      for (const { number, record } of snap) {
        if (record) {
          await this.table.put(record);
        } else {
          const added = await this._get(raceId, checkpointNumber, number);
          if (added) await this.table.delete(added.id);
        }
      }
    });
  }

  /** Mark bibs passed at `time` (ISO). Clears any call-in / restore state. */
  async markPassed(raceId, checkpointNumber, numbers, time) {
    const { commonTime, commonTimeLabel } = TimeUtils.getCommonTimeLabel(time);
    await db.transaction('rw', this.table, async () => {
      for (const number of numbers) {
        const existing = await this._get(raceId, checkpointNumber, number);
        await this.updateRunner(raceId, checkpointNumber, number, {
          status: 'passed',
          actualTime: time,
          commonTime,
          commonTimeLabel,
          markOffTime: time,
          calledIn: false,
          callInTime: null,
          correction: false,
          originalTime: existing?.originalTime ?? time,
          editedAt: null,
          unmarkedAt: null,
          unmarkedTime: null,
        });
      }
    });
  }

  /**
   * Change a passed runner's time. If base already had it (called in), it goes
   * back on the callout sheet as a correction.
   */
  async editTime(raceId, checkpointNumber, number, time) {
    const r = await this._get(raceId, checkpointNumber, number);
    if (!r) throw new Error(`Runner ${number} not found at checkpoint ${checkpointNumber}`);
    const { commonTime, commonTimeLabel } = TimeUtils.getCommonTimeLabel(time);
    const patch = {
      status: 'passed',
      actualTime: time,
      commonTime,
      commonTimeLabel,
      markOffTime: time,
      editedAt: TimeUtils.getCurrentTimestamp(),
      originalTime: r.originalTime ?? r.actualTime ?? time,
    };
    if (r.calledIn) Object.assign(patch, { calledIn: false, correction: true });
    await this.update(r.id, patch);
  }

  /** Unmark (or reset) a runner; keeps the old time so it can be restored. */
  async unmark(raceId, checkpointNumber, number) {
    const r = await this._get(raceId, checkpointNumber, number);
    if (!r) return;
    await this.update(r.id, {
      status: 'not-started',
      actualTime: null,
      commonTime: null,
      commonTimeLabel: null,
      markOffTime: null,
      calledIn: false,
      callInTime: null,
      correction: false,
      unmarkedAt: TimeUtils.getCurrentTimestamp(),
      unmarkedTime: r.actualTime ?? r.unmarkedTime ?? null,
    });
  }

  /** Mark bibs as copied by base (or undo that). Clears the correction flag. */
  async setCalledIn(raceId, checkpointNumber, numbers, calledIn = true) {
    const callInTime = calledIn ? TimeUtils.getCurrentTimestamp() : null;
    await db.transaction('rw', this.table, async () => {
      for (const number of numbers) {
        const r = await this._get(raceId, checkpointNumber, number);
        if (!r) continue;
        await this.update(r.id, calledIn
          ? { calledIn: true, callInTime, correction: false }
          : { calledIn: false, callInTime: null });
      }
    });
  }

  /** Mark DNS ('non-starter') or DNF at this checkpoint. */
  async setOut(raceId, checkpointNumber, number, status) {
    if (status !== 'non-starter' && status !== 'dnf') throw new Error(`Invalid status ${status}`);
    await this.updateRunner(raceId, checkpointNumber, number, {
      status, calledIn: false, correction: false,
    });
  }

  /** Clear DNS / DNF — back to not passed. */
  async clearOut(raceId, checkpointNumber, number) {
    const r = await this._get(raceId, checkpointNumber, number);
    if (!r) return;
    await this.update(r.id, {
      status: 'not-started',
      actualTime: null,
      commonTime: null,
      commonTimeLabel: null,
      markOffTime: null,
      calledIn: false,
      callInTime: null,
      correction: false,
    });
  }

  // ── Read-out progress (resume an interrupted read) ───────────────────────

  async getReadout(raceId, checkpointNumber, blockTime) {
    return db.readout_progress
      .where('[raceId+checkpointNumber+blockTime]')
      .equals([raceId, checkpointNumber, blockTime])
      .first();
  }

  async saveReadout(raceId, checkpointNumber, blockTime, { tickedNumbers, overIndex }) {
    const existing = await this.getReadout(raceId, checkpointNumber, blockTime);
    const row = { raceId, checkpointNumber, blockTime, tickedNumbers, overIndex, updatedAt: TimeUtils.getCurrentTimestamp() };
    if (existing) await db.readout_progress.update(existing.id, row);
    else await db.readout_progress.add(row);
  }

  async clearReadout(raceId, checkpointNumber, blockTime) {
    await db.readout_progress
      .where('[raceId+checkpointNumber+blockTime]')
      .equals([raceId, checkpointNumber, blockTime])
      .delete();
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
