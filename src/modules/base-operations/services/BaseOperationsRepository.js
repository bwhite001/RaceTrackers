import { BaseRepository } from '../../../shared/services/database/BaseRepository';
import db from '../../../shared/services/database/schema';

export class BaseOperationsRepository extends BaseRepository {
  constructor() {
    super('base_station_runners');
  }

  async getBaseStationRunners(raceId, checkpointNumber = null) {
    try {
      if (checkpointNumber !== null) {
        return await this.table
          .where(['raceId', 'checkpointNumber'])
          .equals([raceId, checkpointNumber])
          .toArray();
      }
      return await this.table.where('raceId').equals(raceId).toArray();
    } catch (error) {
      console.error('Error getting base station runners:', error);
      return [];
    }
  }

  async initializeBaseStation(raceId, checkpointNumber = 1) {
    try {
      // Get all race runners and create base station-specific entries
      const raceRunners = await db.runners.where('raceId').equals(raceId).toArray();
      
      const baseStationRunners = raceRunners.map(runner => ({
        raceId,
        checkpointNumber,
        number: runner.number,
        status: 'not-started',
        commonTime: null,
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
      commonTime: timestamp
    });
  }

  async bulkMarkRunners(raceId, checkpointNumber, runnerNumbers, commonTime = null, status = 'passed') {
    try {
      const timestamp = commonTime || new Date().toISOString();
      
      await db.transaction('rw', this.table, async () => {
        for (const runnerNumber of runnerNumbers) {
          await this.updateRunner(raceId, checkpointNumber, runnerNumber, {
            status,
            commonTime: timestamp
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
    try {
      const timestamp = withdrawalTime || new Date().toISOString();
      
      await db.transaction('rw', db.withdrawal_records, db.base_station_runners, db.runners, async () => {
        // Create withdrawal record
        await db.withdrawal_records.add({
          raceId,
          runnerNumber,
          checkpoint,
          withdrawalTime: timestamp,
          reason,
          comments,
          reversedAt: null,
          reversedBy: null
        });

        // Update runner status
        await this.updateRunner(raceId, checkpoint, runnerNumber, {
          status: 'withdrawn',
          commonTime: timestamp,
          notes: `Withdrawn: ${reason}. ${comments || ''}`
        });

        // Log to audit trail
        await this.logAudit(raceId, 'withdraw', 'runner', runnerNumber, {
          checkpoint,
          reason,
          comments,
          withdrawalTime: timestamp
        });
      });
    } catch (error) {
      console.error('Error withdrawing runner:', error);
      throw new Error('Failed to withdraw runner');
    }
  }

  async reverseWithdrawal(raceId, runnerNumber) {
    try {
      await db.transaction('rw', db.withdrawal_records, db.base_station_runners, async () => {
        // Find the withdrawal record
        const withdrawal = await db.withdrawal_records
          .where(['raceId', 'runnerNumber'])
          .equals([raceId, runnerNumber])
          .and(record => record.reversedAt === null)
          .first();

        if (!withdrawal) {
          throw new Error('No active withdrawal found for this runner');
        }

        // Mark withdrawal as reversed
        await db.withdrawal_records.update(withdrawal.id, {
          reversedAt: new Date().toISOString(),
          reversedBy: 'system'
        });

        // Update runner status back to not-started
        await this.updateRunner(raceId, withdrawal.checkpoint, runnerNumber, {
          status: 'not-started',
          commonTime: null,
          notes: 'Withdrawal reversed'
        });

        // Log to audit trail
        await this.logAudit(raceId, 'reverse-withdrawal', 'runner', runnerNumber, {
          originalWithdrawalId: withdrawal.id
        });
      });
    } catch (error) {
      console.error('Error reversing withdrawal:', error);
      throw new Error('Failed to reverse withdrawal');
    }
  }

  async vetOutRunner(raceId, runnerNumber, checkpoint, reason, medicalNotes, vetOutTime = null) {
    try {
      const timestamp = vetOutTime || new Date().toISOString();
      
      await db.transaction('rw', db.vet_out_records, db.base_station_runners, async () => {
        // Create vet-out record
        await db.vet_out_records.add({
          raceId,
          runnerNumber,
          checkpoint,
          vetOutTime: timestamp,
          reason,
          medicalNotes,
          vetName: null
        });

        // Update runner status
        await this.updateRunner(raceId, checkpoint, runnerNumber, {
          status: 'vet-out',
          commonTime: timestamp,
          notes: `Vet Out: ${reason}. ${medicalNotes || ''}`
        });

        // Log to audit trail
        await this.logAudit(raceId, 'vet-out', 'runner', runnerNumber, {
          checkpoint,
          reason,
          medicalNotes,
          vetOutTime: timestamp
        });
      });
    } catch (error) {
      console.error('Error vetting out runner:', error);
      throw new Error('Failed to vet out runner');
    }
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
      
      // Get runners who have passed this checkpoint
      const passedRunners = await db.base_station_runners
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
      // Get all withdrawn, vet-out, DNF, and non-starter runners
      const runners = await db.runners
        .where('raceId')
        .equals(raceId)
        .and(runner => 
          runner.status === 'withdrawn' ||
          runner.status === 'vet-out' ||
          runner.status === 'dnf' ||
          runner.status === 'non-starter'
        )
        .toArray();
      
      // Get withdrawal and vet-out details
      const withdrawals = await this.getWithdrawnRunners(raceId);
      const vetOuts = await this.getVetOutRunners(raceId);
      
      // Combine data
      const outList = runners.map(runner => {
        const withdrawal = withdrawals.find(w => w.runnerNumber === runner.number);
        const vetOut = vetOuts.find(v => v.runnerNumber === runner.number);
        
        return {
          ...runner,
          withdrawalDetails: withdrawal || null,
          vetOutDetails: vetOut || null
        };
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
      
      const content = [
        `Missing Numbers Report`,
        `Race: ${race.name}`,
        `Date: ${race.date}`,
        `Checkpoint: ${checkpoint}`,
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
        `# Checkpoint: ${checkpoint}`,
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
}

export default new BaseOperationsRepository();
