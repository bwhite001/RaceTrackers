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
}

export default new BaseOperationsRepository();
