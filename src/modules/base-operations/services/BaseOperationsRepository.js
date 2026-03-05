import { BaseRepository } from '../../../shared/services/database/BaseRepository';
import db from '../../../shared/services/database/schema';
import { BASE_STATION_CP } from '../../../types/index.js';

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
      const race = await db.races.get(raceId);
      const runners = await db.runners.where('raceId').equals(raceId).toArray();
      
      if (format === 'csv') {
        return this._generateCSV(race, runners);
      }
      throw new Error('Unsupported export format');
    } catch (error) {
      console.error('Error generating race results:', error);
      throw new Error('Failed to generate race results');
    }
  }

  _generateCSV(race, runners) {
    const headers = [
      'Runner Number',
      'Status',
      'Recorded Time',
      'Time from Start',
      'Notes'
    ];

    const raceStartTime = new Date(`${race.date}T${race.startTime}`);
    
    const rows = runners.map(runner => {
      let timeFromStart = '';
      if (runner.recordedTime && runner.status === 'passed') {
        const recordedTime = new Date(runner.recordedTime);
        const diffMs = recordedTime.getTime() - raceStartTime.getTime();
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        timeFromStart = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }

      return [
        runner.number,
        runner.status,
        runner.recordedTime ? new Date(runner.recordedTime).toLocaleString() : '',
        timeFromStart,
        runner.notes || ''
      ];
    });

    rows.sort((a, b) => a[0] - b[0]);

    const csvContent = [
      `# Race: ${race.name}`,
      `# Date: ${race.date}`,
      `# Start Time: ${race.startTime}`,
      `# Exported: ${new Date().toLocaleString()}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(cell => 
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
      ).join(','))
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
    const timeHHMM = timestamp.slice(11, 16);

    await db.transaction('rw', db.withdrawal_records, db.checkpoint_runners, db.runners, async () => {
      await db.withdrawal_records.add({
        raceId, runnerNumber, checkpoint,
        withdrawalTime: timestamp,
        reason, comments,
        reversedAt: null, reversedBy: null
      });

      const existing = await db.checkpoint_runners
        .where(['raceId', 'checkpointNumber', 'number'])
        .equals([raceId, checkpoint, runnerNumber])
        .first();

      if (existing) {
        await db.checkpoint_runners.update(existing.id, {
          status: 'dnf',
          markOffTime: timeHHMM,
          callInTime: timeHHMM,
          notes: `DNF: ${reason}. ${comments || ''}`
        });
      } else {
        await db.checkpoint_runners.add({
          raceId,
          checkpointNumber: checkpoint,
          number: runnerNumber,
          status: 'dnf',
          markOffTime: timeHHMM,
          callInTime: timeHHMM,
          notes: `DNF: ${reason}. ${comments || ''}`
        });
      }

      await this.logAudit(raceId, 'withdraw', 'runner', runnerNumber, {
        checkpoint, reason, comments, withdrawalTime: timestamp
      });
    });
  }

  async reverseWithdrawal(raceId, runnerNumber) {
    await db.transaction('rw', db.withdrawal_records, db.checkpoint_runners, async () => {
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

      const cpRecord = await db.checkpoint_runners
        .where(['raceId', 'checkpointNumber', 'number'])
        .equals([raceId, withdrawal.checkpoint, runnerNumber])
        .first();

      if (cpRecord && cpRecord.status === 'dnf') {
        await db.checkpoint_runners.delete(cpRecord.id);
      }

      await this.logAudit(raceId, 'reverse-withdrawal', 'runner', runnerNumber, {
        originalWithdrawalId: withdrawal.id
      });
    });
  }

  async vetOutRunner(raceId, runnerNumber, checkpoint, reason, medicalNotes, vetOutTime = null) {
    const timestamp = vetOutTime || new Date().toISOString();
    const timeHHMM = timestamp.slice(11, 16);

    await db.transaction('rw', db.vet_out_records, db.checkpoint_runners, async () => {
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
          markOffTime: timeHHMM,
          callInTime: timeHHMM,
          notes: `Vet Out: ${reason}. ${medicalNotes || ''}`
        });
      } else {
        await db.checkpoint_runners.add({
          raceId, checkpointNumber: checkpoint, number: runnerNumber,
          status: 'dnf',
          markOffTime: timeHHMM,
          callInTime: timeHHMM,
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

        if (existing) {
          await db.checkpoint_runners.update(existing.id, {
            status: 'non-starter',
            notes: reason || null
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
        await db.checkpoint_runners.delete(r.id);
      }

      await this.logAudit(raceId, 'reverse-dns', 'runner', runnerNumber, {});
    });
  }

  async getWithdrawnRunners(raceId) {
    try {
      const withdrawals = await db.withdrawal_records
        .where('raceId')
        .equals(raceId)
        .and(record => record.reversedAt === null)
        .toArray();
      
      return withdrawals;
    } catch (error) {
      console.error('Error getting withdrawn runners:', error);
      return [];
    }
  }

  async getVetOutRunners(raceId) {
    try {
      return await db.vet_out_records
        .where('raceId')
        .equals(raceId)
        .toArray();
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

  async getMissingRunners(raceId, checkpoint) {
    try {
      // Get all runners for the race
      const allRunners = await db.runners.where('raceId').equals(raceId).toArray();
      
      // Get runners who have passed this checkpoint (from checkpoint_runners, not base_station_runners)
      const passedRunners = await db.checkpoint_runners
        .where(['raceId', 'checkpointNumber'])
        .equals([raceId, checkpoint])
        .and(runner => runner.status === 'passed')
        .toArray();
      
      const passedNumbers = new Set(passedRunners.map(r => r.number));
      
      // Find missing runners
      const missingRunners = allRunners.filter(runner => 
        !passedNumbers.has(runner.number) && 
        runner.status !== 'non-starter' &&
        runner.status !== 'withdrawn' &&
        runner.status !== 'vet-out'
      );
      
      return missingRunners.sort((a, b) => a.number - b.number);
    } catch (error) {
      console.error('Error getting missing runners:', error);
      return [];
    }
  }

  async getOutList(raceId) {
    try {
      // Get withdrawal and vet-out details from dedicated records tables
      const withdrawals = await this.getWithdrawnRunners(raceId);
      const vetOuts = await this.getVetOutRunners(raceId);

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

  async generateMissingNumbersReport(raceId, checkpoint) {
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
      
      return {
        content,
        filename: `missing-numbers-cp${checkpoint}-${race.date}.txt`,
        mimeType: 'text/plain'
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
          reason = `${runner.withdrawalDetails.reason}. ${runner.withdrawalDetails.comments || ''}`;
        } else if (runner.vetOutDetails) {
          time = new Date(runner.vetOutDetails.vetOutTime).toLocaleString();
          reason = `${runner.vetOutDetails.reason}. ${runner.vetOutDetails.medicalNotes || ''}`;
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
      const race = await db.races.get(raceId);
      const finishers = await db.base_station_runners
        .where('raceId').equals(raceId)
        .filter(r => r.status === 'passed' || r.status === 'finished')
        .toArray();
      finishers.sort((a, b) => new Date(a.commonTime) - new Date(b.commonTime));

      const runnerDetails = await db.runners.where('raceId').equals(raceId).toArray();
      const nameMap = Object.fromEntries(runnerDetails.map(r => [r.number, r]));

      const headers = ['Runner #', 'First Name', 'Last Name', 'Finish Time', 'Notes'];
      const rows = finishers.map(r => {
        const info = nameMap[r.number] ?? {};
        const finishTime = r.commonTime
          ? new Date(r.commonTime).toLocaleTimeString()
          : '';
        return [r.number, info.firstName ?? '', info.lastName ?? '', finishTime, r.notes ?? ''];
      });

      const csvLines = [
        `# Finisher List`,
        `# Race: ${race.name}`,
        `# Date: ${race.date}`,
        `# Generated: ${new Date().toLocaleString()}`,
        `# Total Finishers: ${finishers.length}`,
        '',
        headers.join(','),
        ...rows.map(row => row.map(cell =>
          typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
        ).join(',')),
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
      const race = await db.races.get(raceId);
      const checkpoints = await db.checkpoints.where('raceId').equals(raceId).sortBy('number');
      const runners = await db.runners.where('raceId').equals(raceId).sortBy('number');
      const cpRunners = await db.checkpoint_runners.where('raceId').equals(raceId).toArray();
      const bsRunners = await db.base_station_runners.where('raceId').equals(raceId).toArray();

      const cpIndex = {};
      for (const r of cpRunners) {
        cpIndex[`${r.number}-${r.checkpointNumber}`] = r;
      }
      const bsIndex = Object.fromEntries(bsRunners.map(r => [r.number, r]));

      const cpHeaders = checkpoints.map(cp => cp.name || `CP${cp.number}`);
      const headers = ['Runner #', 'First Name', 'Last Name', 'Gender', 'Batch', ...cpHeaders, 'Finish Time', 'Status', 'Notes'];

      const rows = runners.map(runner => {
        const cpTimes = checkpoints.map(cp => {
          const entry = cpIndex[`${runner.number}-${cp.number}`];
          if (!entry) return '';
          return entry.markOffTime
            ? new Date(entry.markOffTime).toLocaleTimeString()
            : (entry.status ?? '');
        });
        const bs = bsIndex[runner.number];
        const finishTime = bs?.commonTime ? new Date(bs.commonTime).toLocaleTimeString() : '';
        return [
          runner.number,
          runner.firstName ?? '',
          runner.lastName ?? '',
          runner.gender ?? '',
          runner.batchNumber ?? '',
          ...cpTimes,
          finishTime,
          bs?.status ?? runner.status ?? '',
          runner.notes ?? '',
        ];
      });

      const csvLines = [
        `# Full Officials Report`,
        `# Race: ${race.name}`,
        `# Date: ${race.date}`,
        `# Generated: ${new Date().toLocaleString()}`,
        '',
        headers.join(','),
        ...rows.map(row => row.map(cell =>
          typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
        ).join(',')),
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
   * Split Times — one row per runner, one column per checkpoint.
   */
  async generateSplitTimesReport(raceId) {
    try {
      const race = await db.races.get(raceId);
      const checkpoints = await db.checkpoints.where('raceId').equals(raceId).sortBy('number');
      const runners = await db.runners.where('raceId').equals(raceId).sortBy('number');
      const cpRunners = await db.checkpoint_runners.where('raceId').equals(raceId).toArray();

      const cpIndex = {};
      for (const r of cpRunners) {
        cpIndex[`${r.number}-${r.checkpointNumber}`] = r;
      }

      const cpHeaders = checkpoints.map(cp => cp.name || `CP${cp.number}`);
      const headers = ['Runner #', 'First Name', 'Last Name', ...cpHeaders, 'Overall Status'];

      const rows = runners.map(runner => {
        const splits = checkpoints.map(cp => {
          const entry = cpIndex[`${runner.number}-${cp.number}`];
          if (!entry) return '—';
          if (entry.status === 'dnf') return 'DNF';
          if (entry.status === 'dns' || entry.status === 'non-starter') return 'DNS';
          return entry.markOffTime
            ? new Date(entry.markOffTime).toLocaleTimeString()
            : '—';
        });
        return [
          runner.number,
          runner.firstName ?? '',
          runner.lastName ?? '',
          ...splits,
          runner.status ?? '',
        ];
      });

      const csvLines = [
        `# Split Times Report`,
        `# Race: ${race.name}`,
        `# Date: ${race.date}`,
        `# Generated: ${new Date().toLocaleString()}`,
        '',
        headers.join(','),
        ...rows.map(row => row.map(cell =>
          typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
        ).join(',')),
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
