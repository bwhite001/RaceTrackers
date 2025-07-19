import Dexie from 'dexie';

// Database schema
class RaceTrackerDB extends Dexie {
  constructor() {
    super('RaceTrackerDB');

    this.version(4).stores({
      races: '++id, name, date, startTime, minRunner, maxRunner, createdAt',
      runners: '++id, [raceId+number], raceId, number, status, recordedTime, notes',
      segments: '++id, raceId, startTime, endTime, called',
      settings: 'key, value',
      checkpoints: '++id, raceId, number, name',
      checkpoint_results: '++id, [raceId+runnerNumber+checkpointNumber], raceId, runnerNumber, checkpointNumber, callInTime, markOffTime, status, notes',
      // New isolated tracking tables
      checkpoint_runners: '++id, [raceId+checkpointNumber+number], raceId, checkpointNumber, number, status, callInTime, markOffTime, notes',
      base_station_runners: '++id, [raceId+number], raceId, number, status, callInTime, markOffTime, notes',
      checkpoint_segments: '++id, [raceId+checkpointNumber], raceId, checkpointNumber, startTime, endTime, called'
    }).upgrade(tx => {
      // Migration logic for existing data
      return tx.table('races').toCollection().modify(race => {
        // Migration will be handled in application layer
      });
    });
  }
}

const db = new RaceTrackerDB();

// Storage service for managing race data
export class StorageService {
  static async saveRace(raceConfig) {
    try {
      const raceId = await db.races.add({
        ...raceConfig,
        createdAt: new Date().toISOString()
      });

      // Save checkpoints if provided
      if (raceConfig.checkpoints && raceConfig.checkpoints.length > 0) {
        const checkpoints = raceConfig.checkpoints.map(checkpoint => ({
          raceId,
          number: checkpoint.number,
          name: checkpoint.name || `Checkpoint ${checkpoint.number}`
        }));
        await db.checkpoints.bulkAdd(checkpoints);
      } else {
        // Add default checkpoint for backward compatibility
        await db.checkpoints.add({
          raceId,
          number: 1,
          name: 'Checkpoint 1'
        });
      }

      // Initialize runners for the race
      const runners = [];
      
      // If runnerRanges are provided, use them to create runners
      if (raceConfig.runnerRanges && raceConfig.runnerRanges.length > 0) {
        for (const range of raceConfig.runnerRanges) {
          if (range.isIndividual && range.individualNumbers) {
            // Add individual numbers
            for (const number of range.individualNumbers) {
              runners.push({
                raceId,
                number: number,
                status: 'not-started',
                recordedTime: null,
                notes: null
              });
            }
          } else {
            // Add range numbers
            for (let i = range.min; i <= range.max; i++) {
              runners.push({
                raceId,
                number: i,
                status: 'not-started',
                recordedTime: null,
                notes: null
              });
            }
          }
        }
      } else {
        // Fallback to single range for backward compatibility
        for (let i = raceConfig.minRunner; i <= raceConfig.maxRunner; i++) {
          runners.push({
            raceId,
            number: i,
            status: 'not-started',
            recordedTime: null,
            notes: null
          });
        }
      }
      
      await db.runners.bulkAdd(runners);

      return raceId;
    } catch (error) {
      console.error('Error saving race:', error);
      throw new Error('Failed to save race configuration');
    }
  }

  static async getRace(raceId) {
    try {
      const race = await db.races.get(raceId);
      if (!race) {
        throw new Error('Race not found');
      }
      return race;
    } catch (error) {
      console.error('Error getting race:', error);
      throw new Error('Failed to load race');
    }
  }

  static async getCurrentRace() {
    try {
      const races = await db.races.orderBy('createdAt').reverse().limit(1).toArray();
      return races.length > 0 ? races[0] : null;
    } catch (error) {
      console.error('Error getting current race:', error);
      return null;
    }
  }

  static async getAllRaces() {
    try {
      return await db.races.orderBy('createdAt').reverse().toArray();
    } catch (error) {
      console.error('Error getting all races:', error);
      return [];
    }
  }

  static async deleteRace(raceId) {
    try {
      await db.transaction('rw', db.races, db.runners, db.segments, async () => {
        await db.races.delete(raceId);
        await db.runners.where('raceId').equals(raceId).delete();
        await db.segments.where('raceId').equals(raceId).delete();
      });
    } catch (error) {
      console.error('Error deleting race:', error);
      throw new Error('Failed to delete race');
    }
  }

  static async getRunners(raceId) {
    try {
      return await db.runners.where('raceId').equals(raceId).toArray();
    } catch (error) {
      console.error('Error getting runners:', error);
      return [];
    }
  }

  static async updateRunner(raceId, runnerNumber, updates) {
    try {
      const runner = await db.runners
        .where(['raceId', 'number'])
        .equals([raceId, runnerNumber])
        .first();
      
      if (!runner) {
        throw new Error(`Runner ${runnerNumber} not found`);
      }

      await db.runners.update(runner.id, updates);
      return { ...runner, ...updates };
    } catch (error) {
      console.error('Error updating runner:', error);
      throw new Error(`Failed to update runner ${runnerNumber}`);
    }
  }

  static async markRunnerPassed(raceId, runnerNumber, timestamp = null) {
    const recordedTime = timestamp || new Date().toISOString();
    return this.updateRunner(raceId, runnerNumber, {
      status: 'passed',
      recordedTime
    });
  }

  static async markRunnerStatus(raceId, runnerNumber, status) {
    const updates = { status };
    
    // Clear recorded time for non-passed statuses
    if (status !== 'passed') {
      updates.recordedTime = null;
    }
    
    return this.updateRunner(raceId, runnerNumber, updates);
  }

  static async bulkUpdateRunners(raceId, runnerNumbers, updates) {
    try {
      const runners = await db.runners
        .where('raceId')
        .equals(raceId)
        .and(runner => runnerNumbers.includes(runner.number))
        .toArray();

      const updatePromises = runners.map(runner =>
        db.runners.update(runner.id, updates)
      );

      await Promise.all(updatePromises);
      return runners.map(runner => ({ ...runner, ...updates }));
    } catch (error) {
      console.error('Error bulk updating runners:', error);
      throw new Error('Failed to update multiple runners');
    }
  }

  static async getCalledSegments(raceId) {
    try {
      return await db.segments.where('raceId').equals(raceId).toArray();
    } catch (error) {
      console.error('Error getting called segments:', error);
      return [];
    }
  }

  static async markSegmentCalled(raceId, startTime, endTime) {
    try {
      await db.segments.add({
        raceId,
        startTime,
        endTime,
        called: true
      });
    } catch (error) {
      console.error('Error marking segment called:', error);
      throw new Error('Failed to mark segment as called');
    }
  }

  static async isSegmentCalled(raceId, timestamp) {
    try {
      const segments = await this.getCalledSegments(raceId);
      return segments.some(segment => {
        const segmentStart = new Date(segment.startTime);
        const segmentEnd = new Date(segment.endTime);
        const time = new Date(timestamp);
        return time >= segmentStart && time < segmentEnd;
      });
    } catch (error) {
      console.error('Error checking if segment is called:', error);
      return false;
    }
  }

  static async saveSetting(key, value) {
    try {
      await db.settings.put({ key, value });
    } catch (error) {
      console.error('Error saving setting:', error);
      throw new Error(`Failed to save setting: ${key}`);
    }
  }

  static async getSetting(key, defaultValue = null) {
    try {
      const setting = await db.settings.get(key);
      return setting ? setting.value : defaultValue;
    } catch (error) {
      console.error('Error getting setting:', error);
      return defaultValue;
    }
  }

  static async getAllSettings() {
    try {
      const settings = await db.settings.toArray();
      return settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});
    } catch (error) {
      console.error('Error getting all settings:', error);
      return {};
    }
  }

  static async clearAllData() {
    try {
      await db.transaction('rw', db.races, db.runners, db.segments, db.settings, async () => {
        await db.races.clear();
        await db.runners.clear();
        await db.segments.clear();
        await db.settings.clear();
      });
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw new Error('Failed to clear all data');
    }
  }

  static async exportRaceConfig(raceId) {
    try {
      const race = await this.getRace(raceId);
      const checkpoints = await this.getCheckpoints(raceId);
      const runners = await this.getRunners(raceId);
      const checkpointResults = await this.getCheckpointResults(raceId);
      const segments = await this.getCalledSegments(raceId);
      
      return {
        raceConfig: {
          name: race.name,
          date: race.date,
          startTime: race.startTime,
          minRunner: race.minRunner,
          maxRunner: race.maxRunner,
          checkpoints: checkpoints.map(cp => ({ number: cp.number, name: cp.name }))
        },
        runners: runners.map(runner => ({
          number: runner.number,
          status: runner.status,
          recordedTime: runner.recordedTime,
          notes: runner.notes
        })),
        checkpointResults: checkpointResults.map(result => ({
          runnerNumber: result.runnerNumber,
          checkpointNumber: result.checkpointNumber,
          callInTime: result.callInTime,
          markOffTime: result.markOffTime,
          status: result.status,
          notes: result.notes
        })),
        calledSegments: segments.map(segment => ({
          startTime: segment.startTime,
          endTime: segment.endTime,
          called: segment.called
        })),
        exportedAt: new Date().toISOString(),
        version: '2.0.0',
        exportType: 'full-race-data'
      };
    } catch (error) {
      console.error('Error exporting race config:', error);
      throw new Error('Failed to export race configuration');
    }
  }

  static async importRaceConfig(exportData) {
    try {
      const { raceConfig, runners, checkpointResults, calledSegments, exportType } = exportData;
      
      // Validate the imported data
      if (!raceConfig || !raceConfig.name || !raceConfig.date || 
          !raceConfig.startTime || typeof raceConfig.minRunner !== 'number' || 
          typeof raceConfig.maxRunner !== 'number') {
        throw new Error('Invalid race configuration data');
      }

      // Check if race already exists (by name and date)
      const existingRace = await db.races
        .where('name').equals(raceConfig.name)
        .and(race => race.date === raceConfig.date)
        .first();

      let raceId;

      if (existingRace && exportType === 'full-race-data') {
        // Merge with existing race
        raceId = existingRace.id;
        await this.mergeRaceData(raceId, exportData);
      } else {
        // Create new race
        const newRaceConfig = {
          ...raceConfig,
          id: undefined // Let the database generate a new ID
        };
        raceId = await this.saveRace(newRaceConfig);

        // Import additional data if it's a full race export
        if (exportType === 'full-race-data') {
          await this.importFullRaceData(raceId, exportData);
        }
      }

      return raceId;
    } catch (error) {
      console.error('Error importing race config:', error);
      throw new Error('Failed to import race configuration');
    }
  }

  static async mergeRaceData(raceId, exportData) {
    try {
      const { runners, checkpointResults, calledSegments } = exportData;

      // Merge runner data
      if (runners && runners.length > 0) {
        for (const importedRunner of runners) {
          const existingRunner = await db.runners
            .where(['raceId', 'number'])
            .equals([raceId, importedRunner.number])
            .first();

          if (existingRunner) {
            // Merge runner data - prefer more recent or more complete data
            const updates = {};
            
            // Update status if imported status is more advanced
            const statusPriority = { 'not-started': 0, 'passed': 1, 'dnf': 2, 'non-starter': 3 };
            if (statusPriority[importedRunner.status] > statusPriority[existingRunner.status]) {
              updates.status = importedRunner.status;
            }

            // Update recorded time if imported time exists and existing doesn't, or if imported is more recent
            if (importedRunner.recordedTime && (!existingRunner.recordedTime || 
                new Date(importedRunner.recordedTime) > new Date(existingRunner.recordedTime))) {
              updates.recordedTime = importedRunner.recordedTime;
            }

            // Merge notes
            if (importedRunner.notes && importedRunner.notes !== existingRunner.notes) {
              updates.notes = existingRunner.notes ? 
                `${existingRunner.notes} | ${importedRunner.notes}` : 
                importedRunner.notes;
            }

            if (Object.keys(updates).length > 0) {
              await db.runners.update(existingRunner.id, updates);
            }
          }
        }
      }

      // Merge checkpoint results
      if (checkpointResults && checkpointResults.length > 0) {
        for (const result of checkpointResults) {
          await this.recordCheckpointResult(raceId, result.runnerNumber, result.checkpointNumber, {
            callInTime: result.callInTime,
            markOffTime: result.markOffTime,
            status: result.status,
            notes: result.notes
          });
        }
      }

      // Merge called segments
      if (calledSegments && calledSegments.length > 0) {
        for (const segment of calledSegments) {
          // Check if segment already exists
          const existingSegment = await db.segments
            .where('raceId').equals(raceId)
            .and(s => s.startTime === segment.startTime && s.endTime === segment.endTime)
            .first();

          if (!existingSegment) {
            await db.segments.add({
              raceId,
              startTime: segment.startTime,
              endTime: segment.endTime,
              called: segment.called
            });
          }
        }
      }
    } catch (error) {
      console.error('Error merging race data:', error);
      throw new Error('Failed to merge race data');
    }
  }

  static async importFullRaceData(raceId, exportData) {
    try {
      const { runners, checkpointResults, calledSegments } = exportData;

      // Import runner status updates (only if they're more advanced than default)
      if (runners && runners.length > 0) {
        for (const importedRunner of runners) {
          if (importedRunner.status !== 'not-started' || importedRunner.recordedTime || importedRunner.notes) {
            await this.updateRunner(raceId, importedRunner.number, {
              status: importedRunner.status,
              recordedTime: importedRunner.recordedTime,
              notes: importedRunner.notes
            });
          }
        }
      }

      // Import checkpoint results
      if (checkpointResults && checkpointResults.length > 0) {
        for (const result of checkpointResults) {
          await this.recordCheckpointResult(raceId, result.runnerNumber, result.checkpointNumber, {
            callInTime: result.callInTime,
            markOffTime: result.markOffTime,
            status: result.status,
            notes: result.notes
          });
        }
      }

      // Import called segments
      if (calledSegments && calledSegments.length > 0) {
        for (const segment of calledSegments) {
          await db.segments.add({
            raceId,
            startTime: segment.startTime,
            endTime: segment.endTime,
            called: segment.called
          });
        }
      }
    } catch (error) {
      console.error('Error importing full race data:', error);
      throw new Error('Failed to import full race data');
    }
  }

  static async exportRaceResults(raceId, raceConfig, runners, format = 'csv') {
    try {
      if (format === 'csv') {
        return this.generateCSV(raceConfig, runners);
      } else {
        throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Error exporting race results:', error);
      throw new Error('Failed to export race results');
    }
  }

  static generateCSV(raceConfig, runners) {
    const headers = [
      'Runner Number',
      'Status',
      'Recorded Time',
      'Time from Start',
      'Notes'
    ];

    const raceStartTime = new Date(`${raceConfig.date}T${raceConfig.startTime}`);
    
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

    // Sort by runner number
    rows.sort((a, b) => a[0] - b[0]);

    // Create CSV content
    const csvContent = [
      `# Race: ${raceConfig.name}`,
      `# Date: ${raceConfig.date}`,
      `# Start Time: ${raceConfig.startTime}`,
      `# Exported: ${new Date().toLocaleString()}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(cell => 
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
      ).join(','))
    ].join('\n');

    return {
      content: csvContent,
      filename: `race-results-${raceConfig.name.replace(/\s+/g, '-')}-${raceConfig.date}.csv`,
      mimeType: 'text/csv'
    };
  }

  // Database maintenance
  static async getDatabaseSize() {
    try {
      const races = await db.races.count();
      const runners = await db.runners.count();
      const segments = await db.segments.count();
      const settings = await db.settings.count();
      
      return {
        races,
        runners,
        segments,
        settings,
        total: races + runners + segments + settings
      };
    } catch (error) {
      console.error('Error getting database size:', error);
      return { races: 0, runners: 0, segments: 0, settings: 0, total: 0 };
    }
  }

  static async cleanupOldRaces(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const oldRaces = await db.races
        .where('createdAt')
        .below(cutoffDate.toISOString())
        .toArray();

      for (const race of oldRaces) {
        await this.deleteRace(race.id);
      }

      return oldRaces.length;
    } catch (error) {
      console.error('Error cleaning up old races:', error);
      return 0;
    }
  }

  // Checkpoint management methods
  static async getCheckpoints(raceId) {
    try {
      return await db.checkpoints.where('raceId').equals(raceId).sortBy('number');
    } catch (error) {
      console.error('Error getting checkpoints:', error);
      return [];
    }
  }

  static async addCheckpoint(raceId, checkpointNumber, name) {
    try {
      return await db.checkpoints.add({
        raceId,
        number: checkpointNumber,
        name: name || `Checkpoint ${checkpointNumber}`
      });
    } catch (error) {
      console.error('Error adding checkpoint:', error);
      throw new Error('Failed to add checkpoint');
    }
  }

  static async updateCheckpoint(checkpointId, updates) {
    try {
      await db.checkpoints.update(checkpointId, updates);
    } catch (error) {
      console.error('Error updating checkpoint:', error);
      throw new Error('Failed to update checkpoint');
    }
  }

  static async deleteCheckpoint(checkpointId) {
    try {
      await db.transaction('rw', db.checkpoints, db.checkpoint_results, async () => {
        await db.checkpoints.delete(checkpointId);
        // Also delete related checkpoint results
        const checkpoint = await db.checkpoints.get(checkpointId);
        if (checkpoint) {
          await db.checkpoint_results
            .where(['raceId', 'checkpointNumber'])
            .equals([checkpoint.raceId, checkpoint.number])
            .delete();
        }
      });
    } catch (error) {
      console.error('Error deleting checkpoint:', error);
      throw new Error('Failed to delete checkpoint');
    }
  }

  // Checkpoint results methods
  static async getCheckpointResults(raceId, checkpointNumber = null) {
    try {
      if (checkpointNumber !== null) {
        return await db.checkpoint_results
          .where(['raceId', 'checkpointNumber'])
          .equals([raceId, checkpointNumber])
          .toArray();
      } else {
        return await db.checkpoint_results.where('raceId').equals(raceId).toArray();
      }
    } catch (error) {
      console.error('Error getting checkpoint results:', error);
      return [];
    }
  }

  static async recordCheckpointResult(raceId, runnerNumber, checkpointNumber, data) {
    try {
      const existing = await db.checkpoint_results
        .where(['raceId', 'runnerNumber', 'checkpointNumber'])
        .equals([raceId, runnerNumber, checkpointNumber])
        .first();

      if (existing) {
        await db.checkpoint_results.update(existing.id, data);
        return existing.id;
      } else {
        return await db.checkpoint_results.add({
          raceId,
          runnerNumber,
          checkpointNumber,
          ...data
        });
      }
    } catch (error) {
      console.error('Error recording checkpoint result:', error);
      throw new Error('Failed to record checkpoint result');
    }
  }

  static async markRunnerAtCheckpoint(raceId, runnerNumber, checkpointNumber, callInTime = null, markOffTime = null, status = 'passed') {
    try {
      const data = {
        status,
        callInTime: callInTime || new Date().toISOString(),
        markOffTime: markOffTime || new Date().toISOString()
      };

      await this.recordCheckpointResult(raceId, runnerNumber, checkpointNumber, data);

      // Also update the main runner record for backward compatibility
      if (status === 'passed') {
        await this.markRunnerPassed(raceId, runnerNumber, markOffTime || data.markOffTime);
      } else {
        await this.markRunnerStatus(raceId, runnerNumber, status);
      }
    } catch (error) {
      console.error('Error marking runner at checkpoint:', error);
      throw new Error('Failed to mark runner at checkpoint');
    }
  }

  static async bulkMarkRunnersAtCheckpoint(raceId, runnerNumbers, checkpointNumber, callInTime = null, markOffTime = null, status = 'passed') {
    try {
      const timestamp = markOffTime || callInTime || new Date().toISOString();
      
      const checkpointResults = runnerNumbers.map(runnerNumber => ({
        raceId,
        runnerNumber,
        checkpointNumber,
        status,
        callInTime: callInTime || timestamp,
        markOffTime: markOffTime || timestamp
      }));

      // Use upsert logic for checkpoint results
      for (const result of checkpointResults) {
        await this.recordCheckpointResult(raceId, result.runnerNumber, checkpointNumber, {
          status: result.status,
          callInTime: result.callInTime,
          markOffTime: result.markOffTime
        });
      }

      // Also update main runner records for backward compatibility
      if (status === 'passed') {
        await this.bulkUpdateRunners(raceId, runnerNumbers, {
          status: 'passed',
          recordedTime: timestamp
        });
      } else {
        await this.bulkUpdateRunners(raceId, runnerNumbers, { status });
      }
    } catch (error) {
      console.error('Error bulk marking runners at checkpoint:', error);
      throw new Error('Failed to bulk mark runners at checkpoint');
    }
  }

  // Enhanced export methods
  static async exportCheckpointResults(raceId, checkpointNumber) {
    try {
      const race = await this.getRace(raceId);
      const checkpoints = await this.getCheckpoints(raceId);
      const checkpointResults = await this.getCheckpointResults(raceId, checkpointNumber);
      
      const checkpoint = checkpoints.find(cp => cp.number === checkpointNumber);
      
      return {
        raceConfig: {
          id: race.id,
          name: race.name,
          date: race.date,
          startTime: race.startTime,
          minRunner: race.minRunner,
          maxRunner: race.maxRunner,
          checkpoints: checkpoints.map(cp => ({ number: cp.number, name: cp.name }))
        },
        checkpointResults,
        checkpointNumber,
        checkpointName: checkpoint?.name || `Checkpoint ${checkpointNumber}`,
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        exportType: 'checkpoint-results'
      };
    } catch (error) {
      console.error('Error exporting checkpoint results:', error);
      throw new Error('Failed to export checkpoint results');
    }
  }

  static async importCheckpointResults(exportData) {
    try {
      const { raceConfig, checkpointResults, checkpointNumber } = exportData;
      
      if (!raceConfig || !checkpointResults || checkpointNumber === undefined) {
        throw new Error('Invalid checkpoint export data');
      }

      // Find or create the race
      let raceId;
      const existingRace = await db.races.where('name').equals(raceConfig.name).first();
      
      if (existingRace) {
        raceId = existingRace.id;
      } else {
        // Create new race if it doesn't exist
        raceId = await this.saveRace(raceConfig);
      }

      // Import checkpoint results
      for (const result of checkpointResults) {
        await this.recordCheckpointResult(raceId, result.runnerNumber, result.checkpointNumber, {
          callInTime: result.callInTime,
          markOffTime: result.markOffTime,
          status: result.status,
          notes: result.notes
        });
      }

      return raceId;
    } catch (error) {
      console.error('Error importing checkpoint results:', error);
      throw new Error('Failed to import checkpoint results');
    }
  }

  // New isolated checkpoint and base station methods

  // Checkpoint isolated tracking methods
  static async getCheckpointRunners(raceId, checkpointNumber) {
    try {
      return await db.checkpoint_runners
        .where(['raceId', 'checkpointNumber'])
        .equals([raceId, checkpointNumber])
        .toArray();
    } catch (error) {
      console.error('Error getting checkpoint runners:', error);
      return [];
    }
  }

  static async initializeCheckpointRunners(raceId, checkpointNumber) {
    try {
      // Get all race runners and create checkpoint-specific entries
      const raceRunners = await this.getRunners(raceId);
      
      const checkpointRunners = raceRunners.map(runner => ({
        raceId,
        checkpointNumber,
        number: runner.number,
        status: 'not-started',
        callInTime: null,
        markOffTime: null,
        notes: null
      }));

      await db.checkpoint_runners.bulkAdd(checkpointRunners);
      return checkpointRunners;
    } catch (error) {
      console.error('Error initializing checkpoint runners:', error);
      throw new Error('Failed to initialize checkpoint runners');
    }
  }

  static async updateCheckpointRunner(raceId, checkpointNumber, runnerNumber, updates) {
    try {
      const runner = await db.checkpoint_runners
        .where(['raceId', 'checkpointNumber', 'number'])
        .equals([raceId, checkpointNumber, runnerNumber])
        .first();
      
      if (!runner) {
        throw new Error(`Runner ${runnerNumber} not found for checkpoint ${checkpointNumber}`);
      }

      await db.checkpoint_runners.update(runner.id, updates);
      return { ...runner, ...updates };
    } catch (error) {
      console.error('Error updating checkpoint runner:', error);
      throw new Error(`Failed to update checkpoint runner ${runnerNumber}`);
    }
  }

  static async markCheckpointRunner(raceId, checkpointNumber, runnerNumber, callInTime = null, markOffTime = null, status = 'passed') {
    const timestamp = markOffTime || callInTime || new Date().toISOString();
    return this.updateCheckpointRunner(raceId, checkpointNumber, runnerNumber, {
      status,
      callInTime: callInTime || timestamp,
      markOffTime: markOffTime || timestamp
    });
  }

  static async bulkMarkCheckpointRunners(raceId, checkpointNumber, runnerNumbers, callInTime = null, markOffTime = null, status = 'passed') {
    try {
      const timestamp = markOffTime || callInTime || new Date().toISOString();
      
      const updates = runnerNumbers.map(runnerNumber => ({
        raceId,
        checkpointNumber,
        number: runnerNumber,
        status,
        callInTime: callInTime || timestamp,
        markOffTime: markOffTime || timestamp
      }));

      // Use upsert logic
      for (const update of updates) {
        const existing = await db.checkpoint_runners
          .where(['raceId', 'checkpointNumber', 'number'])
          .equals([update.raceId, update.checkpointNumber, update.number])
          .first();

        if (existing) {
          await db.checkpoint_runners.update(existing.id, update);
        } else {
          await db.checkpoint_runners.add(update);
        }
      }
    } catch (error) {
      console.error('Error bulk marking checkpoint runners:', error);
      throw new Error('Failed to bulk mark checkpoint runners');
    }
  }

  static async getCheckpointSegments(raceId, checkpointNumber) {
    try {
      return await db.checkpoint_segments
        .where(['raceId', 'checkpointNumber'])
        .equals([raceId, checkpointNumber])
        .toArray();
    } catch (error) {
      console.error('Error getting checkpoint segments:', error);
      return [];
    }
  }

  static async markCheckpointSegmentCalled(raceId, checkpointNumber, startTime, endTime) {
    try {
      await db.checkpoint_segments.add({
        raceId,
        checkpointNumber,
        startTime,
        endTime,
        called: true
      });
    } catch (error) {
      console.error('Error marking checkpoint segment called:', error);
      throw new Error('Failed to mark checkpoint segment as called');
    }
  }

  // Base station isolated tracking methods
  static async getBaseStationRunners(raceId) {
    try {
      return await db.base_station_runners.where('raceId').equals(raceId).toArray();
    } catch (error) {
      console.error('Error getting base station runners:', error);
      return [];
    }
  }

  static async initializeBaseStationRunners(raceId) {
    try {
      // Get all race runners and create base station-specific entries
      const raceRunners = await this.getRunners(raceId);
      
      const baseStationRunners = raceRunners.map(runner => ({
        raceId,
        number: runner.number,
        status: 'not-started',
        callInTime: null,
        markOffTime: null,
        notes: null
      }));

      await db.base_station_runners.bulkAdd(baseStationRunners);
      return baseStationRunners;
    } catch (error) {
      console.error('Error initializing base station runners:', error);
      throw new Error('Failed to initialize base station runners');
    }
  }

  static async updateBaseStationRunner(raceId, runnerNumber, updates) {
    try {
      const runner = await db.base_station_runners
        .where(['raceId', 'number'])
        .equals([raceId, runnerNumber])
        .first();
      
      if (!runner) {
        throw new Error(`Runner ${runnerNumber} not found in base station`);
      }

      await db.base_station_runners.update(runner.id, updates);
      return { ...runner, ...updates };
    } catch (error) {
      console.error('Error updating base station runner:', error);
      throw new Error(`Failed to update base station runner ${runnerNumber}`);
    }
  }

  static async markBaseStationRunner(raceId, runnerNumber, callInTime = null, markOffTime = null, status = 'passed') {
    const timestamp = markOffTime || callInTime || new Date().toISOString();
    return this.updateBaseStationRunner(raceId, runnerNumber, {
      status,
      callInTime: callInTime || timestamp,
      markOffTime: markOffTime || timestamp
    });
  }

  static async bulkMarkBaseStationRunners(raceId, runnerNumbers, callInTime = null, markOffTime = null, status = 'passed') {
    try {
      const timestamp = markOffTime || callInTime || new Date().toISOString();
      
      const updates = runnerNumbers.map(runnerNumber => ({
        raceId,
        number: runnerNumber,
        status,
        callInTime: callInTime || timestamp,
        markOffTime: markOffTime || timestamp
      }));

      // Use upsert logic
      for (const update of updates) {
        const existing = await db.base_station_runners
          .where(['raceId', 'number'])
          .equals([update.raceId, update.number])
          .first();

        if (existing) {
          await db.base_station_runners.update(existing.id, update);
        } else {
          await db.base_station_runners.add(update);
        }
      }
    } catch (error) {
      console.error('Error bulk marking base station runners:', error);
      throw new Error('Failed to bulk mark base station runners');
    }
  }

  // Export methods for isolated data
  static async exportIsolatedCheckpointResults(raceId, checkpointNumber) {
    try {
      const race = await this.getRace(raceId);
      const checkpoints = await this.getCheckpoints(raceId);
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
        version: '2.0.0',
        exportType: 'isolated-checkpoint-results'
      };
    } catch (error) {
      console.error('Error exporting isolated checkpoint results:', error);
      throw new Error('Failed to export isolated checkpoint results');
    }
  }

  static async exportIsolatedBaseStationResults(raceId) {
    try {
      const race = await this.getRace(raceId);
      const baseStationRunners = await this.getBaseStationRunners(raceId);
      
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
        exportedAt: new Date().toISOString(),
        version: '2.0.0',
        exportType: 'isolated-base-station-results'
      };
    } catch (error) {
      console.error('Error exporting isolated base station results:', error);
      throw new Error('Failed to export isolated base station results');
    }
  }

  // Migration methods
  static async migrateToIsolatedTracking(raceId) {
    try {
      const checkpoints = await this.getCheckpoints(raceId);
      
      // Initialize isolated tracking for each checkpoint
      for (const checkpoint of checkpoints) {
        await this.initializeCheckpointRunners(raceId, checkpoint.number);
      }
      
      // Initialize isolated tracking for base station
      await this.initializeBaseStationRunners(raceId);
      
      return true;
    } catch (error) {
      console.error('Error migrating to isolated tracking:', error);
      throw new Error('Failed to migrate to isolated tracking');
    }
  }
}

export default StorageService;
