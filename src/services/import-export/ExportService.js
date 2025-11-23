import db from '../../shared/services/database/schema.js';
import CryptoJS from 'crypto-js';

/**
 * Export Service
 * Handles race data export with validation and checksums
 * 
 * This service provides functionality for:
 * - Generating SHA-256 checksums for data integrity
 * - Tracking device IDs for multi-device scenarios
 * - Exporting single or multiple races with all related data
 * - Creating downloadable export files
 * - Validating exports before download
 * - Supporting legacy export formats for backward compatibility
 * 
 * @module ExportService
 */

export class ExportService {
  /**
   * Generate SHA-256 checksum for data
   * @param {Object} data - The data to generate checksum for
   * @returns {string} SHA-256 checksum (64 characters)
   */
  static generateChecksum(data) {
    const dataString = JSON.stringify(data, null, 0);
    return CryptoJS.SHA256(dataString).toString();
  }

  /**
   * Get device ID (persistent across sessions)
   * @returns {string} Device ID
   */
  static getDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  /**
   * Export single race with all related data
   * @param {number|string} raceId - The race ID to export
   * @returns {Promise<Object>} Export package
   */
  static async exportRace(raceId) {
    try {
      // Fetch all race data
      const race = await db.races.get(raceId);
      if (!race) {
        throw new Error(`Race not found: ${raceId}`);
      }

      const runners = await db.runners.where('raceId').equals(raceId).toArray();
      const checkpoints = await db.checkpoints.where('raceId').equals(raceId).toArray();
      const checkpointRunners = await db.checkpoint_runners.where('raceId').equals(raceId).toArray();
      const baseStationRunners = await db.base_station_runners.where('raceId').equals(raceId).toArray();
      
      // Optional tables (may not exist in all databases)
      let deletedEntries = [];
      let strapperCalls = [];
      let auditLog = [];
      let withdrawalRecords = [];
      let vetOutRecords = [];

      try {
        deletedEntries = await db.deleted_entries?.where('raceId').equals(raceId).toArray() || [];
      } catch (e) {
        // Table doesn't exist, skip
      }

      try {
        strapperCalls = await db.strapper_calls?.where('raceId').equals(raceId).toArray() || [];
      } catch (e) {
        // Table doesn't exist, skip
      }

      try {
        auditLog = await db.audit_log?.where('raceId').equals(raceId).toArray() || [];
      } catch (e) {
        // Table doesn't exist, skip
      }

      try {
        withdrawalRecords = await db.withdrawal_records?.where('raceId').equals(raceId).toArray() || [];
      } catch (e) {
        // Table doesn't exist, skip
      }

      try {
        vetOutRecords = await db.vet_out_records?.where('raceId').equals(raceId).toArray() || [];
      } catch (e) {
        // Table doesn't exist, skip
      }

      // Build export package
      const exportData = {
        races: [race],
        runners,
        checkpoints,
        checkpointRunners,
        baseStationRunners,
        deletedEntries,
        strapperCalls,
        auditLog,
        withdrawalRecords,
        vetOutRecords,
      };

      // Generate checksum
      const checksum = this.generateChecksum(exportData);

      // Build complete package
      const exportPackage = {
        version: '3.0.0',
        exportDate: new Date().toISOString(),
        checksum,
        deviceId: this.getDeviceId(),
        exportType: 'full-race-data',
        data: exportData,
        metadata: {
          totalRaces: 1,
          totalRunners: runners.length,
          totalCheckpoints: checkpoints.length,
          totalCheckpointRunners: checkpointRunners.length,
          totalBaseStationRunners: baseStationRunners.length,
          exportedBy: 'RaceTracker Pro',
        },
      };

      return exportPackage;
    } catch (error) {
      console.error('Export error:', error);
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  /**
   * Export multiple races
   * @param {Array<number|string>} raceIds - Array of race IDs to export
   * @returns {Promise<Object>} Merged export package
   */
  static async exportMultipleRaces(raceIds) {
    const allExports = await Promise.all(
      raceIds.map(id => this.exportRace(id))
    );

    // Merge all exports
    const mergedData = {
      races: [],
      runners: [],
      checkpoints: [],
      checkpointRunners: [],
      baseStationRunners: [],
      deletedEntries: [],
      strapperCalls: [],
      auditLog: [],
      withdrawalRecords: [],
      vetOutRecords: [],
    };

    allExports.forEach(exp => {
      mergedData.races.push(...exp.data.races);
      mergedData.runners.push(...exp.data.runners);
      mergedData.checkpoints.push(...exp.data.checkpoints);
      mergedData.checkpointRunners.push(...(exp.data.checkpointRunners || []));
      mergedData.baseStationRunners.push(...(exp.data.baseStationRunners || []));
      mergedData.deletedEntries.push(...(exp.data.deletedEntries || []));
      mergedData.strapperCalls.push(...(exp.data.strapperCalls || []));
      mergedData.auditLog.push(...(exp.data.auditLog || []));
      mergedData.withdrawalRecords.push(...(exp.data.withdrawalRecords || []));
      mergedData.vetOutRecords.push(...(exp.data.vetOutRecords || []));
    });

    const checksum = this.generateChecksum(mergedData);

    return {
      version: '3.0.0',
      exportDate: new Date().toISOString(),
      checksum,
      deviceId: this.getDeviceId(),
      exportType: 'full-race-data',
      data: mergedData,
      metadata: {
        totalRaces: mergedData.races.length,
        totalRunners: mergedData.runners.length,
        totalCheckpoints: mergedData.checkpoints.length,
        totalCheckpointRunners: mergedData.checkpointRunners.length,
        totalBaseStationRunners: mergedData.baseStationRunners.length,
        exportedBy: 'RaceTracker Pro',
      },
    };
  }

  /**
   * Download export as JSON file
   * @param {Object} exportPackage - The export package to download
   * @param {string} filename - Optional filename
   */
  static downloadExport(exportPackage, filename) {
    const jsonString = JSON.stringify(exportPackage, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `race-export-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Validate export before download
   * @param {number|string} raceId - The race ID to export
   * @param {string} filename - Optional filename
   * @returns {Promise<{success: boolean, exportPackage?: Object, error?: string}>}
   */
  static async validateAndExport(raceId, filename) {
    try {
      const exportPackage = await this.exportRace(raceId);
      
      // Validate structure (using Zod schemas)
      const { safeValidateExportPackage } = await import('./ValidationSchemas.js');
      const validation = safeValidateExportPackage(exportPackage);

      if (!validation.success) {
        const errors = validation.error.errors.map(e => e.message).join(', ');
        throw new Error(`Export validation failed: ${errors}`);
      }

      // Download
      this.downloadExport(exportPackage, filename);

      return { success: true, exportPackage };
    } catch (error) {
      console.error('Validate and export error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Export race configuration only (legacy format for backward compatibility)
   * @param {number|string} raceId - The race ID to export
   * @returns {Promise<Object>} Legacy export format
   */
  static async exportRaceConfigLegacy(raceId) {
    try {
      const race = await db.races.get(raceId);
      if (!race) {
        throw new Error(`Race not found: ${raceId}`);
      }

      const checkpoints = await db.checkpoints.where('raceId').equals(raceId).toArray();
      const runners = await db.runners.where('raceId').equals(raceId).toArray();
      const checkpointRunners = await db.checkpoint_runners.where('raceId').equals(raceId).toArray();

      const exportData = {
        raceConfig: {
          name: race.name,
          date: race.date,
          startTime: race.startTime,
          minRunner: race.minRunner,
          maxRunner: race.maxRunner,
          runnerRanges: race.runnerRanges || [],
          checkpoints: checkpoints.map(cp => ({ number: cp.number, name: cp.name })),
        },
        runners: runners.map(runner => ({
          number: runner.number,
          status: runner.status,
          recordedTime: runner.recordedTime,
          notes: runner.notes,
        })),
        checkpointRunners: checkpointRunners.map(runner => ({
          checkpointNumber: runner.checkpointNumber,
          number: runner.number,
          markOffTime: runner.markOffTime,
          callInTime: runner.callInTime,
          status: runner.status,
          notes: runner.notes,
        })),
        exportedAt: new Date().toISOString(),
        version: '2.0.0',
        exportType: 'race-config',
      };

      // Generate checksum for legacy format
      const checksum = this.generateChecksum(exportData);
      exportData.checksum = checksum;

      return exportData;
    } catch (error) {
      console.error('Legacy export error:', error);
      throw new Error(`Legacy export failed: ${error.message}`);
    }
  }
}

export default ExportService;
