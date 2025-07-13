import Dexie from 'dexie';

// Database schema
class RaceTrackerDB extends Dexie {
  constructor() {
    super('RaceTrackerDB');
    
    this.version(2).stores({
      races: '++id, name, date, startTime, minRunner, maxRunner, createdAt',
      runners: '++id, [raceId+number], raceId, number, status, recordedTime, notes',
      segments: '++id, raceId, startTime, endTime, called',
      settings: 'key, value'
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
      
      // Initialize runners for the race
      const runners = [];
      for (let i = raceConfig.minRunner; i <= raceConfig.maxRunner; i++) {
        runners.push({
          raceId,
          number: i,
          status: 'not-started',
          recordedTime: null,
          notes: null
        });
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
      return {
        raceConfig: {
          name: race.name,
          date: race.date,
          startTime: race.startTime,
          minRunner: race.minRunner,
          maxRunner: race.maxRunner
        },
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      };
    } catch (error) {
      console.error('Error exporting race config:', error);
      throw new Error('Failed to export race configuration');
    }
  }

  static async importRaceConfig(exportData) {
    try {
      const { raceConfig } = exportData;
      
      // Validate the imported data
      if (!raceConfig || !raceConfig.name || !raceConfig.date || 
          !raceConfig.startTime || typeof raceConfig.minRunner !== 'number' || 
          typeof raceConfig.maxRunner !== 'number') {
        throw new Error('Invalid race configuration data');
      }

      // Create a new race with imported config
      const newRaceConfig = {
        ...raceConfig,
        id: undefined // Let the database generate a new ID
      };

      return await this.saveRace(newRaceConfig);
    } catch (error) {
      console.error('Error importing race config:', error);
      throw new Error('Failed to import race configuration');
    }
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
}

export default StorageService;
