import { BaseRepository } from '../../../shared/services/database/BaseRepository';
import db from '../../../shared/services/database/schema';
import { BASE_STATION_CP } from '../../../types/index.js';
import TimeUtils from '../../../services/timeUtils.js';
import { raceResults } from './reports.js';
import { appliesAt } from './receive.js';
import { fieldNumbers } from './field.js';
import { hhmm } from '../../../services/blocks.js';

const csvLine = cells => cells.map(c => (typeof c === 'string' && c.includes(',') ? `"${c}"` : c)).join(',');

// Non-empty parts joined with '. ', so a blank reason or comment leaves no stray punctuation.
const joinNote = (...parts) => parts.filter(p => p != null && String(p) !== '').join('. ');

/** checkpoint_runners statuses that record a runner actually passing. */
const SIGHTING = new Set(['passed', 'called-in', 'marked-off']);

export class BaseOperationsRepository extends BaseRepository {
  constructor() {
    super('base_station_runners');
  }

  async getBaseStationRunners(raceId, checkpointNumber = null) {
    try {
      if (checkpointNumber !== null) {
        return await this.table
          .where('[raceId+checkpointNumber+number]')
          .between(
            [raceId, checkpointNumber, -Infinity],
            [raceId, checkpointNumber, Infinity]
          )
          .toArray();
      }
      return await this.table.where('raceId').equals(raceId).toArray();
    } catch (error) {
      console.error('Error getting base station runners:', error);
      return [];
    }
  }

  async initializeBaseStation(raceId, checkpointNumber = BASE_STATION_CP) {
    try {
      // Get all race runners and create base station-specific entries
      const raceRunners = await db.runners.where('raceId').equals(raceId).toArray();
      
      const baseStationRunners = raceRunners.map(runner => ({
        raceId,
        checkpointNumber,
        number: runner.number,
        status: 'not-started',
        commonTime: null,
        markOffEntryTime: null,
        notes: null
      }));

      await this.bulkAdd(baseStationRunners);
      return baseStationRunners;
    } catch (error) {
      console.error('Error initializing base station runners:', error);
      throw new Error('Failed to initialize base station runners');
    }
  }

  async updateRunner(raceId, checkpointNumber, runnerNumber, updates) {
    try {
      const runner = await this.table
        .where(['raceId', 'checkpointNumber', 'number'])
        .equals([raceId, checkpointNumber, runnerNumber])
        .first();
      
      if (!runner) {
        // Create new base station runner if it doesn't exist
        const newRunner = {
          raceId,
          checkpointNumber,
          number: runnerNumber,
          status: 'not-started',
          commonTime: null,
          markOffEntryTime: null,
          notes: null,
          ...updates
        };
        const id = await this.add(newRunner);
        return { ...newRunner, id };
      }

      await this.update(runner.id, updates);
      return { ...runner, ...updates };
    } catch (error) {
      console.error('Error updating base station runner:', error);
      throw new Error(`Failed to update base station runner ${runnerNumber}`);
    }
  }

  async markRunner(raceId, checkpointNumber, runnerNumber, commonTime = null, status = 'passed') {
    const timestamp = commonTime || new Date().toISOString();
    return this.updateRunner(raceId, checkpointNumber, runnerNumber, {
      status,
      commonTime: timestamp,
      markOffEntryTime: new Date().toISOString()
    });
  }

  async bulkMarkRunners(raceId, checkpointNumber, runnerNumbers, commonTime = null, status = 'passed') {
    try {
      const timestamp = commonTime || new Date().toISOString();
      const entryTime = new Date().toISOString();
      
      await db.transaction('rw', this.table, async () => {
        for (const runnerNumber of runnerNumbers) {
          await this.updateRunner(raceId, checkpointNumber, runnerNumber, {
            status,
            commonTime: timestamp,
            markOffEntryTime: entryTime
          });
        }
      });
    } catch (error) {
      console.error('Error bulk marking base station runners:', error);
      throw new Error('Failed to bulk mark base station runners');
    }
  }

  // ============================================================================
  // RECEIVE — radio calls (VK4WIP redesign, spec §4.9)
  // ============================================================================

  /**
   * Record one received call. Only recordable (ok / info) entries become
   * base_station_runners rows, each tagged with the call's id so the whole
   * call can be undone. Skipped and rejected numbers are kept on the call.
   *
   * @param {number} raceId
   * @param {number} checkpointNumber  race checkpoint, or BASE_STATION_CP for Finish
   * @param {Array<{num, t, kind, note, manual?}>} checked  entries after checkCall()
   * @param {string} receivedAt ISO
   * @returns {Promise<number>} radio_calls id
   */
  async recordCall(raceId, checkpointNumber, checked, receivedAt) {
    const recordable = checked.filter(e => e.kind === 'ok' || e.kind === 'info');
    const blocks = [];
    for (const e of checked) {
      let b = blocks.find(x => x.time === e.t);
      if (!b) blocks.push(b = { time: e.t, numbers: [] });
      b.numbers.push(e.num);
    }
    blocks.sort((a, b) => a.time.localeCompare(b.time));

    return db.transaction('rw', db.base_station_runners, db.radio_calls, db.audit_log, db.field_changes, async () => {
      const callId = await db.radio_calls.add({
        raceId,
        checkpointNumber,
        receivedAt,
        blocks,
        recorded: recordable.map(e => e.num),
        skipped: checked.filter(e => e.kind === 'warn').map(e => ({ number: e.num, reason: e.note })),
        rejected: checked.filter(e => e.kind === 'bad').map(e => ({ number: e.num, reason: e.note, time: e.t })),
        undoneAt: null,
        replaced: [],
      });

      const replaced = [];
      for (const e of recordable) {
        const row = {
          status: 'passed',
          commonTime: e.t,
          markOffEntryTime: receivedAt,
          manualTime: !!e.manual,
          callId,
        };
        // Reuse an empty placeholder row (no time yet) rather than duplicating it
        const existing = await db.base_station_runners
          .where(['raceId', 'checkpointNumber', 'number'])
          .equals([raceId, checkpointNumber, e.num])
          .first();
        if (existing && !existing.commonTime && existing.status !== 'passed') {
          replaced.push({ id: existing.id, before: existing });
          await db.base_station_runners.update(existing.id, row);
        } else {
          await db.base_station_runners.add({ raceId, checkpointNumber, number: e.num, notes: null, ...row });
        }
      }
      if (replaced.length) await db.radio_calls.update(callId, { replaced });
      // Late entries base accepted on this call join the field (Undo cancels them)
      const late = [...new Set(recordable.filter(e => e.late).map(e => e.num))];
      if (late.length) await this.addFieldChanges(raceId, late, 'receive', { callId });

      await this.logAudit(raceId, 'receive-call', 'radio_call', callId, {
        checkpointNumber, recorded: recordable.length, skipped: checked.length - recordable.length,
      });
      return callId;
    });
  }

  /** Undo a received call: remove its rows, restore any reused rows, mark the call undone. */
  /**
   * A correction call (one runner): the checkpoint gives a new time, or says
   * the runner didn't pass. Base's live rows for that bib at that checkpoint
   * are superseded (kept, never deleted) and, unless notPassed, one new row is
   * written. undoCall() reverses it exactly. The new row keeps the replaced
   * block (upToBlock) so a correction never moves the board's "up to".
   * @returns {Promise<number>} the radio_calls id
   */
  async recordCorrection(raceId, checkpointNumber, { number, time = null, manual = false, notPassed = false }, receivedAt) {
    return db.transaction('rw', db.base_station_runners, db.radio_calls, db.audit_log, async () => {
      const live = (await db.base_station_runners.where('raceId').equals(raceId).toArray())
        .filter(r => r.checkpointNumber === checkpointNumber && r.number === number && r.status !== 'superseded' && (r.commonTime || r.markOffEntryTime));
      const from = live.map(r => r.commonTime).filter(Boolean).sort().at(-1) ?? null;
      const upToBlock = live.filter(r => r.manualTime !== true && r.commonTime).map(r => r.commonTime).sort().at(-1) ?? null;
      const callId = await db.radio_calls.add({
        raceId, checkpointNumber, receivedAt, kind: 'correction',
        blocks: [], recorded: notPassed ? [] : [number], skipped: [], rejected: [],
        corrections: [{ number, from, to: notPassed ? null : time, notPassed }],
        // "Not passed" writes no new row, so the call keeps the block for "up to"
        ...(notPassed && upToBlock && { upToBlock }),
        undoneAt: null,
        replaced: live.map(r => ({ id: r.id, before: { ...r } })),
      });
      for (const r of live) {
        await db.base_station_runners.update(r.id, {
          status: 'superseded', supersededAt: receivedAt, supersededReason: 'correction', supersededBy: callId,
        });
      }
      if (!notPassed) {
        await db.base_station_runners.add({
          raceId, checkpointNumber, number, status: 'passed', commonTime: time, markOffEntryTime: receivedAt,
          callId, notes: null, correction: true, upToBlock,
          ...(manual && { manualTime: true }),
        });
      }
      await this.logAudit(raceId, 'correction', 'base_station', String(number), { checkpointNumber, from, to: notPassed ? 'not passed' : time, callId });
      return callId;
    });
  }

  /**
   * Base asked a checkpoint about a runner it missed and they have a time:
   * one base row on a 'missed' call (undoCall reverses it). missedReport keeps
   * the old time from moving the board's "up to".
   */
  async recordMissed(raceId, checkpointNumber, { number, time, manual = false }, receivedAt) {
    return db.transaction('rw', db.base_station_runners, db.radio_calls, db.audit_log, async () => {
      const callId = await db.radio_calls.add({
        raceId, checkpointNumber, receivedAt, kind: 'missed',
        blocks: [{ time, numbers: [number] }], recorded: [number], skipped: [], rejected: [], undoneAt: null, replaced: [],
      });
      await db.base_station_runners.add({
        raceId, checkpointNumber, number, status: 'passed', commonTime: time, markOffEntryTime: receivedAt,
        callId, notes: null, missedReport: true, ...(manual && { manualTime: true }),
      });
      await this.logAudit(raceId, 'missed-runner', 'base_station', String(number), { checkpointNumber, time, callId });
      return callId;
    });
  }

  /** Stand a checkpoint down (base-side; the shared checkpoints table is not touched). undoCall reopens it. */
  async recordStandDown(raceId, checkpointNumber, receivedAt) {
    return db.transaction('rw', db.radio_calls, db.audit_log, async () => {
      const callId = await db.radio_calls.add({
        raceId, checkpointNumber, receivedAt, kind: 'stand-down',
        blocks: [], recorded: [], skipped: [], rejected: [], undoneAt: null, replaced: [],
      });
      await this.logAudit(raceId, 'stand-down', 'checkpoint', String(checkpointNumber), { callId });
      return callId;
    });
  }

  async undoCall(callId) {
    await db.transaction('rw', db.base_station_runners, db.radio_calls, db.audit_log, db.field_changes, async () => {
      const call = await db.radio_calls.get(callId);
      if (!call || call.undoneAt) return;
      const replacedIds = new Set((call.replaced ?? []).map(r => r.id));
      const rows = await db.base_station_runners.where('callId').equals(callId).toArray();
      for (const r of rows) {
        if (!replacedIds.has(r.id)) await db.base_station_runners.delete(r.id);
      }
      for (const { before } of call.replaced ?? []) await db.base_station_runners.put(before);
      const changes = await db.field_changes.where('callId').equals(callId).toArray();
      await this.cancelFieldChanges(call.raceId, changes.map(c => c.id));
      await db.radio_calls.update(callId, { undoneAt: TimeUtils.getCurrentTimestamp() });
      await this.logAudit(call.raceId, 'undo-call', 'radio_call', callId, { checkpointNumber: call.checkpointNumber });
    });
  }

  // ── Data checks: resolutions and superseded rows (spec §4.12) ────────────

  async getResolutions(raceId) {
    return db.data_issue_resolutions.where('raceId').equals(raceId).toArray();
  }

  async addResolution(raceId, issueKey, resolution) {
    const id = await db.data_issue_resolutions.add({ raceId, issueKey, resolution, resolvedAt: TimeUtils.getCurrentTimestamp() });
    await this.logAudit(raceId, 'resolve-issue', 'data_issue', issueKey, { resolution });
    return id;
  }

  /** "Ask CPx" done (or undone): askedAt is a data column, no index. */
  async setResolutionAsked(id, askedAt) {
    const row = await db.data_issue_resolutions.get(id);
    if (!row) return;
    await db.data_issue_resolutions.update(id, { askedAt });
    await this.logAudit(row.raceId, askedAt ? 'issue-asked' : 'issue-ask-reopened', 'data_issue', row.issueKey, { resolution: row.resolution });
  }

  async removeResolution(id) {
    const row = await db.data_issue_resolutions.get(id);
    if (!row) return;
    await db.data_issue_resolutions.delete(id);
    await this.logAudit(row.raceId, 'reopen-issue', 'data_issue', row.issueKey, { resolution: row.resolution });
  }

  /**
   * Set base rows aside (status 'superseded') instead of deleting them, so a
   * duplicate or a wrong sighting stops counting but the record is kept.
   * @returns {Promise<object[]>} the rows as they were, for restoreBaseRows()
   */
  async supersedeBaseRows(raceId, ids, reason) {
    const before = (await db.base_station_runners.bulkGet(ids)).filter(Boolean);
    await db.transaction('rw', db.base_station_runners, db.audit_log, async () => {
      for (const r of before) {
        await db.base_station_runners.update(r.id, {
          status: 'superseded', supersededAt: TimeUtils.getCurrentTimestamp(), supersededReason: reason,
        });
      }
      await this.logAudit(raceId, 'supersede', 'base_station', ids.join(','), { reason });
    });
    return before;
  }

  async restoreBaseRows(raceId, rows) {
    await db.transaction('rw', db.base_station_runners, db.audit_log, async () => {
      for (const r of rows) await db.base_station_runners.put(r);
      await this.logAudit(raceId, 'restore', 'base_station', rows.map(r => r.id).join(','), {});
    });
  }

  // ── Field changes (race-day Part B): bibs not in the setup ──────────────

  async getFieldChanges(raceId) {
    return db.field_changes.where('raceId').equals(raceId).toArray();
  }

  /** Add late entries to base's field. @returns {Promise<number[]>} ids */
  async addFieldChanges(raceId, numbers, source, extra = {}) {
    const createdAt = TimeUtils.getCurrentTimestamp();
    const ids = [];
    for (const number of numbers) {
      ids.push(await db.field_changes.add({ raceId, number, kind: 'late', source, createdAt, cancelledAt: null, callId: null, ...extra }));
      await this.logAudit(raceId, 'add-to-field', 'field_change', String(number), { source });
    }
    return ids;
  }

  /**
   * Reports › Unknown bibs › Add to field: the bib joins the field and the
   * time it was heard on that call is recorded. @returns what undoAddToField needs.
   */
  async addToField(raceId, { number, checkpointNumber, time, issueKey }) {
    return db.transaction('rw', db.field_changes, db.base_station_runners, db.data_issue_resolutions, db.audit_log, async () => {
      const [fieldChangeId] = await this.addFieldChanges(raceId, [number], 'reports');
      const rowId = time && checkpointNumber != null
        ? await db.base_station_runners.add({ raceId, checkpointNumber, number, status: 'passed', commonTime: time, markOffEntryTime: TimeUtils.getCurrentTimestamp(), notes: null, lateAdd: fieldChangeId })
        : null;
      const resolutionId = await this.addResolution(raceId, issueKey, 'added to field');
      return { fieldChangeId, rowId, resolutionId };
    });
  }

  async undoAddToField(raceId, { fieldChangeId, rowId, resolutionId }) {
    await db.transaction('rw', db.field_changes, db.base_station_runners, db.data_issue_resolutions, db.audit_log, async () => {
      if (rowId) await db.base_station_runners.delete(rowId); // the row this action created
      await this.cancelFieldChanges(raceId, [fieldChangeId]);
      await this.removeResolution(resolutionId);
    });
  }

  /** Undo of an addition: cancelled, never deleted. */
  async cancelFieldChanges(raceId, ids) {
    const cancelledAt = TimeUtils.getCurrentTimestamp();
    for (const id of ids) {
      const row = await db.field_changes.get(id);
      if (!row || row.cancelledAt) continue;
      await db.field_changes.update(id, { cancelledAt });
      await this.logAudit(raceId, 'remove-from-field', 'field_change', String(row.number), { source: row.source });
    }
  }

  async getRadioCalls(raceId) {
    return db.radio_calls.where('raceId').equals(raceId).toArray();
  }

  async exportBaseStationData(raceId, checkpointNumber = 1) {
    try {
      const race = await db.races.get(raceId);
      const baseStationRunners = await this.getBaseStationRunners(raceId, checkpointNumber);
      
      return {
        raceConfig: {
          id: race.id,
          name: race.name,
          date: race.date,
          startTime: race.startTime,
          minRunner: race.minRunner,
          maxRunner: race.maxRunner
        },
        baseStationRunners,
        checkpointNumber,
        exportedAt: new Date().toISOString(),
        version: '3.0.0',
        exportType: 'isolated-base-station-results'
      };
    } catch (error) {
      console.error('Error exporting base station data:', error);
      throw new Error('Failed to export base station data');
    }
  }

  async generateRaceResults(raceId, format = 'csv') {
    try {
      if (format !== 'csv') throw new Error('Unsupported export format');
      const { race, rows } = await this.getRaceResults(raceId);
      return this._generateCSV(race, rows);
    } catch (error) {
      console.error('Error generating race results:', error);
      throw new Error('Failed to generate race results');
    }
  }

  _generateCSV(race, results) {
    const headers = ['Runner Number', 'Status', 'Recorded Time', 'Time from Start', 'Notes'];
    const start = race.startTime ? new Date(`${race.date}T${race.startTime}`) : null;

    const rows = results.map(r => {
      let timeFromStart = '';
      if (r.finish && start) {
        const secs = Math.floor((new Date(r.finish) - start) / 1000);
        if (secs >= 0) timeFromStart = [Math.floor(secs / 3600), Math.floor(secs / 60) % 60, secs % 60]
          .map(n => String(n).padStart(2, '0')).join(':');
      }
      return [r.number, r.status, hhmm(r.finish), timeFromStart, r.notes];
    });

    const csvContent = [
      `# Race: ${race.name}`,
      `# Date: ${race.date}`,
      `# Start Time: ${race.startTime}`,
      `# Exported: ${new Date().toLocaleString()}`,
      '',
      headers.join(','),
      ...rows.map(csvLine)
    ].join('\n');

    return {
      content: csvContent,
      filename: `race-results-${race.name.replace(/\s+/g, '-')}-${race.date}.csv`,
      mimeType: 'text/csv'
    };
  }

  // ============================================================================
  // AUDIT TRAIL & DELETED ENTRIES
  // ============================================================================

  async saveDeletedEntry(raceId, entryType, originalEntry, deletionReason, deletedBy = 'system') {
    try {
      const deletedEntry = {
        raceId,
        entryType, // 'runner', 'checkpoint', 'base_station'
        originalEntry: JSON.stringify(originalEntry),
        deletedAt: new Date().toISOString(),
        deletedBy,
        deletionReason,
        restorable: true
      };
      
      const id = await db.deleted_entries.add(deletedEntry);
      
      // Log to audit trail
      await this.logAudit(raceId, 'delete', entryType, originalEntry.id, {
        reason: deletionReason,
        deletedBy
      });
      
      return id;
    } catch (error) {
      console.error('Error saving deleted entry:', error);
      throw new Error('Failed to save deleted entry');
    }
  }

  async getDeletedEntries(raceId) {
    try {
      const entries = await db.deleted_entries
        .where('raceId')
        .equals(raceId)
        .reverse()
        .sortBy('deletedAt');
      
      return entries.map(entry => ({
        ...entry,
        originalEntry: JSON.parse(entry.originalEntry)
      }));
    } catch (error) {
      console.error('Error getting deleted entries:', error);
      return [];
    }
  }

  async restoreDeletedEntry(entryId) {
    try {
      const deletedEntry = await db.deleted_entries.get(entryId);
      if (!deletedEntry || !deletedEntry.restorable) {
        throw new Error('Entry cannot be restored');
      }

      const originalEntry = JSON.parse(deletedEntry.originalEntry);
      
      // Restore to appropriate table based on entryType
      let restoredId;
      switch (deletedEntry.entryType) {
        case 'base_station':
          restoredId = await db.base_station_runners.add(originalEntry);
          break;
        case 'checkpoint':
          restoredId = await db.checkpoint_runners.add(originalEntry);
          break;
        case 'runner':
          restoredId = await db.runners.add(originalEntry);
          break;
        default:
          throw new Error('Unknown entry type');
      }

      // Mark as not restorable
      await db.deleted_entries.update(entryId, { restorable: false });

      // Log to audit trail
      await this.logAudit(deletedEntry.raceId, 'restore', deletedEntry.entryType, restoredId, {
        originalId: originalEntry.id,
        restoredFrom: entryId
      });

      return restoredId;
    } catch (error) {
      console.error('Error restoring deleted entry:', error);
      throw new Error('Failed to restore deleted entry');
    }
  }

  async logAudit(raceId, action, entityType, entityId, changes = {}) {
    try {
      await db.audit_log.add({
        raceId,
        action, // 'create', 'update', 'delete', 'restore'
        entityType, // 'runner', 'checkpoint', 'base_station', 'strapper_call', 'withdrawal'
        entityId,
        changes: JSON.stringify(changes),
        performedBy: 'system', // Can be enhanced with user tracking
        performedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging audit:', error);
      // Don't throw - audit logging should not break operations
    }
  }

  async getAuditLog(raceId, filters = {}) {
    try {
      let query = db.audit_log.where('raceId').equals(raceId);
      
      const logs = await query.reverse().sortBy('performedAt');
      
      return logs.map(log => ({
        ...log,
        changes: JSON.parse(log.changes)
      }));
    } catch (error) {
      console.error('Error getting audit log:', error);
      return [];
    }
  }

  // ============================================================================
  // WITHDRAWAL & VET-OUT OPERATIONS
  // ============================================================================

  async withdrawRunner(raceId, runnerNumber, checkpoint, reason, comments, withdrawalTime = null) {
    const timestamp = withdrawalTime || new Date().toISOString();
    await db.transaction('rw', db.withdrawal_records, db.checkpoint_runners, db.runners, db.audit_log, async () => {
      await db.withdrawal_records.add({
        raceId, runnerNumber, checkpoint,
        withdrawalTime: timestamp,
        reason, comments,
        reversedAt: null, reversedBy: null
      });

      // "On course" (no checkpoint): the withdrawal record alone puts the
      // runner on the out list.
      const existing = checkpoint == null ? null : await db.checkpoint_runners
        .where(['raceId', 'checkpointNumber', 'number'])
        .equals([raceId, checkpoint, runnerNumber])
        .first();
      const detail = joinNote(reason, comments);
      const notes = detail ? `DNF: ${detail}` : 'DNF';

      if (checkpoint == null) {
        // nothing to mark at a checkpoint
      } else if (existing && SIGHTING.has(existing.status)) {
        // Never overwrite a recorded sighting (reverseWithdrawal would then
        // delete it). The withdrawal record carries the DNF.
      } else if (existing) {
        // Remember what the row was (e.g. a not-started placeholder) so
        // reverseWithdrawal can put it back instead of deleting it.
        await db.checkpoint_runners.update(existing.id, {
          status: 'dnf',
          markOffTime: timestamp,
          callInTime: timestamp,
          notes,
          dnfPrev: existing.dnfPrev ?? { status: existing.status, markOffTime: existing.markOffTime ?? null, callInTime: existing.callInTime ?? null, notes: existing.notes ?? null },
        });
      } else {
        await db.checkpoint_runners.add({
          raceId,
          checkpointNumber: checkpoint,
          number: runnerNumber,
          status: 'dnf',
          markOffTime: timestamp,
          callInTime: timestamp,
          notes
        });
      }

      await this.logAudit(raceId, 'withdraw', 'runner', runnerNumber, {
        checkpoint, reason, comments, withdrawalTime: timestamp
      });
    });
  }

  async reverseWithdrawal(raceId, runnerNumber) {
    await db.transaction('rw', db.withdrawal_records, db.checkpoint_runners, db.audit_log, async () => {
      const withdrawal = await db.withdrawal_records
        .where(['raceId', 'runnerNumber'])
        .equals([raceId, runnerNumber])
        .and(r => r.reversedAt === null)
        .first();

      if (!withdrawal) throw new Error('No active withdrawal found for this runner');

      await db.withdrawal_records.update(withdrawal.id, {
        reversedAt: new Date().toISOString(),
        reversedBy: 'system'
      });

      const cpRecord = withdrawal.checkpoint == null ? null : await db.checkpoint_runners
        .where(['raceId', 'checkpointNumber', 'number'])
        .equals([raceId, withdrawal.checkpoint, runnerNumber])
        .first();

      if (cpRecord && cpRecord.status === 'dnf') {
        if (cpRecord.dnfPrev) {
          // It was an existing row (e.g. a placeholder) — restore it
          const { dnfPrev, ...rest } = cpRecord;
          await db.checkpoint_runners.put({ ...rest, ...dnfPrev });
        } else {
          await db.checkpoint_runners.delete(cpRecord.id);
        }
      }

      await this.logAudit(raceId, 'reverse-withdrawal', 'runner', runnerNumber, {
        originalWithdrawalId: withdrawal.id
      });
    });
  }

  async vetOutRunner(raceId, runnerNumber, checkpoint, reason, medicalNotes, vetOutTime = null) {
    const timestamp = vetOutTime || new Date().toISOString();
    await db.transaction('rw', db.vet_out_records, db.checkpoint_runners, db.audit_log, async () => {
      await db.vet_out_records.add({
        raceId, runnerNumber, checkpoint,
        vetOutTime: timestamp, reason, medicalNotes, vetName: null
      });

      const existing = await db.checkpoint_runners
        .where(['raceId', 'checkpointNumber', 'number'])
        .equals([raceId, checkpoint, runnerNumber])
        .first();

      if (existing) {
        await db.checkpoint_runners.update(existing.id, {
          status: 'dnf',
          markOffTime: timestamp,
          callInTime: timestamp,
          notes: `Vet Out: ${reason}. ${medicalNotes || ''}`
        });
      } else {
        await db.checkpoint_runners.add({
          raceId, checkpointNumber: checkpoint, number: runnerNumber,
          status: 'dnf',
          markOffTime: timestamp,
          callInTime: timestamp,
          notes: `Vet Out: ${reason}. ${medicalNotes || ''}`
        });
      }

      await this.logAudit(raceId, 'vet-out', 'runner', runnerNumber, {
        checkpoint, reason, medicalNotes, vetOutTime: timestamp
      });
    });
  }

  async markAsNonStarter(raceId, runnerNumber, reason = '') {
    const checkpoints = await db.checkpoints.where('raceId').equals(raceId).toArray();
    if (!checkpoints.length) throw new Error('No checkpoints found for race');

    await db.transaction('rw', db.checkpoint_runners, db.audit_log, async () => {
      for (const cp of checkpoints) {
        const existing = await db.checkpoint_runners
          .where(['raceId', 'checkpointNumber', 'number'])
          .equals([raceId, cp.number, runnerNumber])
          .first();

        if (existing && (SIGHTING.has(existing.status) || existing.status === 'dnf')) {
          // Seen at this checkpoint, or a checkpoint's own DNF — keep it.
        } else if (existing) {
          // Remember the row's previous state so reverseNonStarter restores
          // it (e.g. a not-started placeholder) instead of deleting it.
          await db.checkpoint_runners.update(existing.id, {
            status: 'non-starter',
            notes: reason || null,
            dnsPrev: existing.dnsPrev ?? { status: existing.status, notes: existing.notes ?? null },
          });
        } else {
          await db.checkpoint_runners.add({
            raceId,
            checkpointNumber: cp.number,
            number: runnerNumber,
            status: 'non-starter',
            markOffTime: null,
            callInTime: null,
            notes: reason || null
          });
        }
      }

      await this.logAudit(raceId, 'dns', 'runner', runnerNumber, { reason });
    });
  }

  async reverseNonStarter(raceId, runnerNumber) {
    await db.transaction('rw', db.checkpoint_runners, db.audit_log, async () => {
      const records = await db.checkpoint_runners
        .where('raceId').equals(raceId)
        .and(r => r.number === runnerNumber && r.status === 'non-starter')
        .toArray();

      for (const r of records) {
        if (r.dnsPrev) {
          const { dnsPrev, ...rest } = r;
          await db.checkpoint_runners.put({ ...rest, ...dnsPrev });
        } else {
          await db.checkpoint_runners.delete(r.id);
        }
      }

      await this.logAudit(raceId, 'reverse-dns', 'runner', runnerNumber, {});
    });
  }

  /** Throwing reads (getRaceResults); the public getters below swallow errors for their other callers. */
  _withdrawnRunners(raceId) {
    return db.withdrawal_records.where('raceId').equals(raceId).and(record => record.reversedAt === null).toArray();
  }

  _vetOutRunners(raceId) {
    return db.vet_out_records.where('raceId').equals(raceId).toArray();
  }

  async getWithdrawnRunners(raceId) {
    try {
      return await this._withdrawnRunners(raceId);
    } catch (error) {
      console.error('Error getting withdrawn runners:', error);
      return [];
    }
  }

  async getVetOutRunners(raceId) {
    try {
      return await this._vetOutRunners(raceId);
    } catch (error) {
      console.error('Error getting vet-out runners:', error);
      return [];
    }
  }

  // ============================================================================
  // STRAPPER CALLS MANAGEMENT
  // ============================================================================

  async addStrapperCall(raceId, checkpoint, priority, description, createdBy = 'system') {
    try {
      const call = {
        raceId,
        checkpoint,
        priority, // 'low', 'medium', 'high', 'urgent'
        description,
        status: 'pending',
        createdAt: new Date().toISOString(),
        createdBy,
        completedAt: null,
        completedBy: null,
        notes: null
      };
      
      const id = await db.strapper_calls.add(call);
      
      // Log to audit trail
      await this.logAudit(raceId, 'create', 'strapper_call', id, {
        checkpoint,
        priority,
        description
      });
      
      return id;
    } catch (error) {
      console.error('Error adding strapper call:', error);
      throw new Error('Failed to add strapper call');
    }
  }

  async getStrapperCalls(raceId, checkpoint = null, status = null) {
    try {
      let query = db.strapper_calls.where('raceId').equals(raceId);
      
      let calls = await query.toArray();
      
      if (checkpoint !== null) {
        calls = calls.filter(call => call.checkpoint === checkpoint);
      }
      
      if (status !== null) {
        calls = calls.filter(call => call.status === status);
      }
      
      return calls.sort((a, b) => {
        // Sort by priority first, then by creation time
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
    } catch (error) {
      console.error('Error getting strapper calls:', error);
      return [];
    }
  }

  async updateStrapperCall(callId, updates) {
    try {
      const call = await db.strapper_calls.get(callId);
      if (!call) {
        throw new Error('Strapper call not found');
      }

      await db.strapper_calls.update(callId, updates);
      
      // Log to audit trail
      await this.logAudit(call.raceId, 'update', 'strapper_call', callId, updates);
    } catch (error) {
      console.error('Error updating strapper call:', error);
      throw new Error('Failed to update strapper call');
    }
  }

  async completeStrapperCall(callId, completedBy = 'system', notes = null) {
    try {
      await this.updateStrapperCall(callId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        completedBy,
        notes
      });
    } catch (error) {
      console.error('Error completing strapper call:', error);
      throw new Error('Failed to complete strapper call');
    }
  }

  async deleteStrapperCall(callId) {
    try {
      const call = await db.strapper_calls.get(callId);
      if (!call) {
        throw new Error('Strapper call not found');
      }

      await db.strapper_calls.delete(callId);
      
      // Log to audit trail
      await this.logAudit(call.raceId, 'delete', 'strapper_call', callId, {
        originalCall: call
      });
    } catch (error) {
      console.error('Error deleting strapper call:', error);
      throw new Error('Failed to delete strapper call');
    }
  }

  // ============================================================================
  // MISSING NUMBERS & OUT LIST
  // ============================================================================

  /** Rejects on a failed read: the Missing Numbers sheet must not say "none missing" for an unreadable database. */
  async getMissingRunners(raceId, checkpoint) {
    const { order, rows } = await this.getRaceResults(raceId);
    // A runner whose wave doesn't pass this checkpoint (11 km at CP1) isn't missing from it
    const cp = order.find(c => c.number === checkpoint);
    const batchOf = new Map(rows.filter(r => r.batchNumber !== '').map(r => [r.number, r.batchNumber]));
    return rows.filter(r => r.status !== 'DNS' && r.status !== 'DNF' && appliesAt(cp, r.number, batchOf)
      && !(checkpoint === BASE_STATION_CP ? r.finish : r.times[checkpoint]));
  }

  /**
   * Every runner's result, merged from checkpoint and base records (as the base
   * store does), with name fields; blank for a late entry with no runners row.
   * Rejects if any read fails (it reads past the swallowing getters): a report must not silently show an empty race.
   */
  async getRaceResults(raceId) {
    const [race, checkpoints, runners, cpRows, baseRows, outList, fieldChanges] = await Promise.all([
      db.races.get(raceId),
      db.checkpoints.where('raceId').equals(raceId).toArray(),
      db.runners.where('raceId').equals(raceId).toArray(),
      db.checkpoint_runners.where('raceId').equals(raceId).sortBy('id'),
      this.table.where('raceId').equals(raceId).toArray(),
      this._outList(raceId),
      this.getFieldChanges(raceId),
    ]);
    // first row per checkpoint + bib, as StorageService.getCheckpointRunners does
    const seen = new Set();
    const cpUnique = cpRows.filter(r => { const k = `${r.checkpointNumber}:${r.number}`; return !seen.has(k) && seen.add(k); });
    const records = [...cpUnique, ...baseRows.filter(r => r.status !== 'superseded')];
    const raceNumbers = fieldNumbers(runners.map(r => r.number), fieldChanges);
    const { order, rows } = raceResults({ records, checkpoints, outList, raceNumbers });
    const byNumber = new Map(runners.map(r => [r.number, r]));
    return {
      race,
      order,
      rows: rows.map(row => {
        const r = byNumber.get(row.number) ?? {};
        return { ...row, firstName: r.firstName ?? '', lastName: r.lastName ?? '', gender: r.gender ?? '', batchNumber: r.batchNumber ?? '', notes: r.notes ?? '' };
      }),
    };
  }

  async _outList(raceId) {
    // Get withdrawal and vet-out details from dedicated records tables
    const withdrawals = await this._withdrawnRunners(raceId);
    const vetOuts = await this._vetOutRunners(raceId);

    // Get DNF/non-starter runners from checkpoint_runners (most up-to-date status)
    const cpRunners = await db.checkpoint_runners
      .where('raceId')
      .equals(raceId)
      .and(r => r.status === 'dnf' || r.status === 'non-starter')
      .toArray();

    // Deduplicate by runner number (keep worst status entry)
    const statusPriority = { 'non-starter': 1, 'dnf': 2 };
    const cpByNumber = new Map();
    for (const r of cpRunners) {
      const existing = cpByNumber.get(r.number);
      if (!existing || (statusPriority[r.status] ?? 0) > (statusPriority[existing.status] ?? 0)) {
        cpByNumber.set(r.number, r);
      }
    }

    const withdrawnNumbers = new Set(withdrawals.map(w => w.runnerNumber));
    const vetOutNumbers = new Set(vetOuts.map(v => v.runnerNumber));

    // Build runners from withdrawal_records, vet_out_records, and cp dnf/non-starter
    const allNumbers = new Set([
      ...withdrawnNumbers,
      ...vetOutNumbers,
      ...cpByNumber.keys(),
    ]);

    const allBaseRunners = await db.runners.where('raceId').equals(raceId).toArray();
    const baseByNumber = Object.fromEntries(allBaseRunners.map(r => [r.number, r]));

    const outList = [...allNumbers].map(number => {
      const base = baseByNumber[number] ?? { number };
      const withdrawal = withdrawals.find(w => w.runnerNumber === number) || null;
      const vetOut = vetOuts.find(v => v.runnerNumber === number) || null;
      const cpEntry = cpByNumber.get(number);
      const status = withdrawal ? 'withdrawn'
        : vetOut ? 'vet-out'
        : cpEntry?.status ?? base.status ?? 'unknown';
      return { ...base, status, withdrawalDetails: withdrawal, vetOutDetails: vetOut };
    });

    return outList.sort((a, b) => a.number - b.number);
  }

  async getOutList(raceId) {
    try {
      return await this._outList(raceId);
    } catch (error) {
      console.error('Error getting out list:', error);
      return [];
    }
  }

  // ============================================================================
  // DUPLICATE DETECTION
  // ============================================================================

  async findDuplicateEntries(raceId) {
    try {
      const entries = await db.base_station_runners
        .where('raceId')
        .equals(raceId)
        .toArray();
      
      // Group by runner number and checkpoint
      const grouped = {};
      entries.forEach(entry => {
        const key = `${entry.number}-${entry.checkpointNumber}`;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(entry);
      });
      
      // Find duplicates (more than one entry for same runner/checkpoint)
      const duplicates = [];
      Object.entries(grouped).forEach(([key, entries]) => {
        if (entries.length > 1) {
          duplicates.push({
            runnerNumber: entries[0].number,
            checkpoint: entries[0].checkpointNumber,
            entries: entries.sort((a, b) => 
              new Date(a.commonTime || 0) - new Date(b.commonTime || 0)
            )
          });
        }
      });
      
      return duplicates;
    } catch (error) {
      console.error('Error finding duplicate entries:', error);
      return [];
    }
  }

  // ============================================================================
  // REPORTS GENERATION
  // ============================================================================

  /** The one switch over report types. Rejects on an unknown type or a failed read. */
  async generateReport(raceId, reportType, options = {}) {
    switch (reportType) {
      case 'missing':
        return this.generateMissingNumbersReport(raceId, options.checkpoint ?? 1, options.format ?? 'csv');
      case 'outList':
        return this.generateOutListReport(raceId);
      case 'checkpointLog':
        return this.generateCheckpointLogReport(raceId, options.checkpoint ?? 1);
      case 'summary':
        return this.generateRaceResults(raceId, options.format ?? 'csv');
      case 'finisherList':
        return this.generateFinisherListReport(raceId);
      case 'officialsReport':
        return this.generateOfficialsReport(raceId);
      case 'splitTimes':
        return this.generateSplitTimesReport(raceId);
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }

  async generateMissingNumbersReport(raceId, checkpoint, format = 'csv') {
    try {
      const race = await db.races.get(raceId);
      const missingRunners = await this.getMissingRunners(raceId, checkpoint);
      const cpRecord = await db.checkpoints.where(['raceId', 'number']).equals([raceId, checkpoint]).first();
      const checkpointLabel = cpRecord?.name || `Checkpoint ${checkpoint}`;
      
      const content = [
        `Missing Numbers Report`,
        `Race: ${race.name}`,
        `Date: ${race.date}`,
        `Checkpoint: ${checkpointLabel}`,
        `Generated: ${new Date().toLocaleString()}`,
        ``,
        `Total Missing: ${missingRunners.length}`,
        ``,
        `Missing Runner Numbers:`,
        missingRunners.map(r => r.number).join(', ')
      ].join('\n');
      
      const ext = format === 'csv' ? 'csv' : 'txt';
      return {
        content,
        filename: `missing-numbers-cp${checkpoint}-${race.date}.${ext}`,
        mimeType: format === 'csv' ? 'text/csv' : 'text/plain'
      };
    } catch (error) {
      console.error('Error generating missing numbers report:', error);
      throw new Error('Failed to generate missing numbers report');
    }
  }

  async generateOutListReport(raceId) {
    try {
      const race = await db.races.get(raceId);
      const outList = await this.getOutList(raceId);
      
      const headers = ['Number', 'Status', 'Time', 'Reason/Comments'];
      const rows = outList.map(runner => {
        let time = '';
        let reason = '';
        
        if (runner.withdrawalDetails) {
          time = new Date(runner.withdrawalDetails.withdrawalTime).toLocaleString();
          reason = joinNote(runner.withdrawalDetails.reason, runner.withdrawalDetails.comments);
        } else if (runner.vetOutDetails) {
          time = new Date(runner.vetOutDetails.vetOutTime).toLocaleString();
          reason = joinNote(runner.vetOutDetails.reason, runner.vetOutDetails.medicalNotes);
        } else if (runner.recordedTime) {
          time = new Date(runner.recordedTime).toLocaleString();
          reason = runner.notes || '';
        }
        
        return [runner.number, runner.status, time, reason];
      });
      
      const csvContent = [
        `# Out List Report`,
        `# Race: ${race.name}`,
        `# Date: ${race.date}`,
        `# Generated: ${new Date().toLocaleString()}`,
        `# Total Out: ${outList.length}`,
        '',
        headers.join(','),
        ...rows.map(row => row.map(cell => 
          typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
        ).join(','))
      ].join('\n');
      
      return {
        content: csvContent,
        filename: `out-list-${race.date}.csv`,
        mimeType: 'text/csv'
      };
    } catch (error) {
      console.error('Error generating out list report:', error);
      throw new Error('Failed to generate out list report');
    }
  }

  async generateCheckpointLogReport(raceId, checkpoint) {
    try {
      const race = await db.races.get(raceId);
      const cpRecord = await db.checkpoints.where(['raceId', 'number']).equals([raceId, checkpoint]).first();
      const checkpointLabel = cpRecord?.name || `Checkpoint ${checkpoint}`;
      const entries = await db.base_station_runners
        .where(['raceId', 'checkpointNumber'])
        .equals([raceId, checkpoint])
        .toArray();
      
      const headers = ['Number', 'Status', 'Time', 'Notes'];
      const rows = entries
        .sort((a, b) => a.number - b.number)
        .map(entry => [
          entry.number,
          entry.status,
          entry.commonTime ? new Date(entry.commonTime).toLocaleString() : '',
          entry.notes || ''
        ]);
      
      const csvContent = [
        `# Checkpoint Log Report`,
        `# Race: ${race.name}`,
        `# Checkpoint: ${checkpointLabel}`,
        `# Date: ${race.date}`,
        `# Generated: ${new Date().toLocaleString()}`,
        `# Total Entries: ${entries.length}`,
        '',
        headers.join(','),
        ...rows.map(row => row.map(cell => 
          typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
        ).join(','))
      ].join('\n');
      
      return {
        content: csvContent,
        filename: `checkpoint-${checkpoint}-log-${race.date}.csv`,
        mimeType: 'text/csv'
      };
    } catch (error) {
      console.error('Error generating checkpoint log report:', error);
      throw new Error('Failed to generate checkpoint log report');
    }
  }

  /**
   * Finisher List — runners who completed the race, sorted by finish time.
   */
  async generateFinisherListReport(raceId) {
    try {
      const { race, rows: results } = await this.getRaceResults(raceId);
      const finishers = results
        .filter(r => r.status === 'Finished')
        .sort((a, b) => a.finish.localeCompare(b.finish) || a.number - b.number);

      const headers = ['Runner #', 'First Name', 'Last Name', 'Finish Time', 'Notes'];
      const rows = finishers.map(r => [r.number, r.firstName, r.lastName, hhmm(r.finish), r.notes]);

      const csvLines = [
        `# Finisher List`,
        `# Race: ${race.name}`,
        `# Date: ${race.date}`,
        `# Generated: ${new Date().toLocaleString()}`,
        `# Total Finishers: ${finishers.length}`,
        '',
        headers.join(','),
        ...rows.map(csvLine),
      ].join('\n');

      return {
        content: csvLines,
        filename: `finisher-list-${race.date}.csv`,
        mimeType: 'text/csv',
      };
    } catch (error) {
      console.error('Error generating finisher list report:', error);
      throw new Error('Failed to generate finisher list report');
    }
  }

  /**
   * Full Officials Report — every runner × every checkpoint (the stewards sheet).
   */
  async generateOfficialsReport(raceId) {
    try {
      const { race, order, rows: results } = await this.getRaceResults(raceId);
      const cps = order.filter(cp => cp.number !== BASE_STATION_CP);

      const headers = ['Runner #', 'First Name', 'Last Name', 'Gender', 'Batch', ...cps.map(cp => cp.name), 'Finish Time', 'Status', 'Notes'];
      const rows = results.map(r => [
        r.number, r.firstName, r.lastName, r.gender, r.batchNumber,
        ...cps.map(cp => hhmm(r.times[cp.number])),
        hhmm(r.finish),
        r.status,
        r.notes,
      ]);

      const csvLines = [
        `# Full Officials Report`,
        `# Race: ${race.name}`,
        `# Date: ${race.date}`,
        `# Generated: ${new Date().toLocaleString()}`,
        '',
        csvLine(headers),
        ...rows.map(csvLine),
      ].join('\n');

      return {
        content: csvLines,
        filename: `officials-report-${race.date}.csv`,
        mimeType: 'text/csv',
      };
    } catch (error) {
      console.error('Error generating officials report:', error);
      throw new Error('Failed to generate officials report');
    }
  }

  /**
   * Split Times — one row per runner, one column per checkpoint, then Finish.
   */
  async generateSplitTimesReport(raceId) {
    try {
      const { race, order, rows: results } = await this.getRaceResults(raceId);
      const cps = order.filter(cp => cp.number !== BASE_STATION_CP);

      const headers = ['Runner #', 'First Name', 'Last Name', ...cps.map(cp => cp.name), 'Finish', 'Overall Status'];
      const rows = results.map(r => [
        r.number, r.firstName, r.lastName,
        ...cps.map(cp => hhmm(r.times[cp.number]) || (r.dnfCheckpoint === cp.number ? 'DNF' : '—')),
        hhmm(r.finish) || '—',
        r.status,
      ]);

      const csvLines = [
        `# Split Times Report`,
        `# Race: ${race.name}`,
        `# Date: ${race.date}`,
        `# Generated: ${new Date().toLocaleString()}`,
        '',
        csvLine(headers),
        ...rows.map(csvLine),
      ].join('\n');

      return {
        content: csvLines,
        filename: `split-times-${race.date}.csv`,
        mimeType: 'text/csv',
      };
    } catch (error) {
      console.error('Error generating split times report:', error);
      throw new Error('Failed to generate split times report');
    }
  }
}

export default new BaseOperationsRepository();
