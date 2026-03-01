import db from '../../shared/services/database/schema.js';
import { safeValidateExportPackage } from './ValidationSchemas.js';
import { ExportService } from './ExportService.js';

/**
 * Import Service
 * Handles race data import with validation, conflict detection, and resolution
 * 
 * This service provides functionality for:
 * - Verifying checksums to ensure data integrity
 * - Validating import packages against schemas
 * - Detecting conflicts with existing data
 * - Resolving conflicts using various strategies
 * - Importing data with transactional safety
 * - Previewing imports before committing
 * - Supporting legacy import formats for backward compatibility
 * 
 * @module ImportService
 */

export class ImportService {
  /**
   * Verify checksum integrity
   * @param {Object} exportPackage - The export package to verify
   * @returns {boolean} True if checksum is valid
   */
  static verifyChecksum(exportPackage) {
    const { checksum, data } = exportPackage;
    if (!checksum || !data) {
      return false;
    }
    const calculatedChecksum = ExportService.generateChecksum(data);
    return checksum === calculatedChecksum;
  }

  /**
   * Validate import package
   * @param {Object} exportPackage - The export package to validate
   * @returns {{valid: boolean, errors?: Array, data?: Object}}
   */
  static validatePackage(exportPackage) {
    // Checksum validation first (before schema validation)
    if (!this.verifyChecksum(exportPackage)) {
      return {
        valid: false,
        errors: [{ path: 'checksum', message: 'Checksum mismatch - data may be corrupted' }],
      };
    }

    // Schema validation
    const validation = safeValidateExportPackage(exportPackage);
    if (!validation.success) {
      return {
        valid: false,
        errors: validation.error?.errors?.map(e => ({
          path: e.path.join('.'),
          message: e.message,
        })) || [{ path: 'validation', message: 'Validation failed' }],
      };
    }

    return { valid: true, data: validation.data };
  }

  /**
   * Detect conflicts with existing data
   * @param {Object} importData - The data to import
   * @returns {Promise<Array>} Array of conflicts
   */
  static async detectConflicts(importData) {
    const conflicts = [];

    // Check for existing races
    if (importData.races) {
      for (const race of importData.races) {
        const existing = await db.races.get(race.id);
        if (existing) {
          conflicts.push({
            type: 'race',
            id: race.id,
            existing,
            incoming: race,
            field: 'updatedAt',
            existingValue: existing.createdAt || existing.date,
            incomingValue: race.createdAt || race.date,
          });
        }
      }
    }

    // Check for existing runners
    if (importData.runners) {
      for (const runner of importData.runners) {
        const existing = await db.runners.get(runner.id);
        if (existing) {
          conflicts.push({
            type: 'runner',
            id: runner.id,
            existing,
            incoming: runner,
            field: 'status',
            existingValue: existing.status,
            incomingValue: runner.status,
          });
        }
      }
    }

    // Check for existing checkpoints
    if (importData.checkpoints) {
      for (const checkpoint of importData.checkpoints) {
        const existing = await db.checkpoints.get(checkpoint.id);
        if (existing) {
          conflicts.push({
            type: 'checkpoint',
            id: checkpoint.id,
            existing,
            incoming: checkpoint,
            field: 'name',
            existingValue: existing.name,
            incomingValue: checkpoint.name,
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Resolve conflicts based on strategy
   * @param {Object} data - The import data
   * @param {Array} conflicts - Array of conflicts
   * @param {string} strategy - Resolution strategy ('newer', 'older', 'skip', 'manual')
   * @param {Object} manualResolutions - Manual conflict resolutions
   * @returns {Promise<Object>} Resolved data
   */
  static async resolveConflicts(data, conflicts, strategy, manualResolutions = {}) {
    const resolvedData = JSON.parse(JSON.stringify(data)); // Deep clone

    if (conflicts.length === 0) {
      return resolvedData;
    }

    for (const conflict of conflicts) {
      let useIncoming = false;

      switch (strategy) {
        case 'newer':
          // Use incoming if it's newer
          useIncoming = new Date(conflict.incomingValue) > new Date(conflict.existingValue);
          break;
        case 'older':
          // Use incoming if it's older
          useIncoming = new Date(conflict.incomingValue) < new Date(conflict.existingValue);
          break;
        case 'skip':
          // Skip incoming (keep existing)
          useIncoming = false;
          break;
        case 'manual':
          // Use manual resolution
          useIncoming = manualResolutions[conflict.id] === 'incoming';
          break;
        default:
          // Default to incoming
          useIncoming = true;
      }

      if (!useIncoming) {
        // Remove from import data
        const key = conflict.type === 'race' ? 'races' : 
                    conflict.type === 'runner' ? 'runners' : 'checkpoints';
        if (resolvedData[key]) {
          resolvedData[key] = resolvedData[key].filter(item => item.id !== conflict.id);
        }
      }
    }

    return resolvedData;
  }

  /**
   * Import with conflict resolution strategy
   * @param {Object} exportPackage - The export package to import
   * @param {string} strategy - Resolution strategy ('newer', 'older', 'skip', 'manual')
   * @param {Object} manualResolutions - Manual conflict resolutions (for 'manual' strategy)
   * @returns {Promise<{success: boolean, imported: Object, conflicts: number}>}
   */
  static async importWithStrategy(exportPackage, strategy = 'newer', manualResolutions = {}) {
    // Validate package
    const validation = this.validatePackage(exportPackage);
    if (!validation.valid) {
      throw new Error(`Import validation failed: ${JSON.stringify(validation.errors)}`);
    }

    const { data } = exportPackage;

    // Detect conflicts
    const conflicts = await this.detectConflicts(data);

    // Apply resolution strategy
    const resolvedData = await this.resolveConflicts(data, conflicts, strategy, manualResolutions);

    // Import using transaction
    try {
      await db.transaction('rw', [
        db.races,
        db.runners,
        db.checkpoints,
        db.checkpoint_runners,
        db.base_station_runners,
      ], async () => {
        // Import races
        if (resolvedData.races) {
          for (const race of resolvedData.races) {
            await db.races.put(race);
          }
        }

        // Import runners
        if (resolvedData.runners) {
          for (const runner of resolvedData.runners) {
            await db.runners.put(runner);
          }
        }

        // Import checkpoints
        if (resolvedData.checkpoints) {
          for (const checkpoint of resolvedData.checkpoints) {
            await db.checkpoints.put(checkpoint);
          }
        }

        // Import checkpoint runners
        if (resolvedData.checkpointRunners) {
          for (const runner of resolvedData.checkpointRunners) {
            await db.checkpoint_runners.put(runner);
          }
        }

        // Import base station runners
        if (resolvedData.baseStationRunners) {
          for (const runner of resolvedData.baseStationRunners) {
            await db.base_station_runners.put(runner);
          }
        }
      });

      return {
        success: true,
        imported: {
          races: resolvedData.races?.length || 0,
          runners: resolvedData.runners?.length || 0,
          checkpoints: resolvedData.checkpoints?.length || 0,
          checkpointRunners: resolvedData.checkpointRunners?.length || 0,
          baseStationRunners: resolvedData.baseStationRunners?.length || 0,
        },
        conflicts: conflicts.length,
      };
    } catch (error) {
      console.error('Import transaction failed:', error);
      throw new Error(`Import failed: ${error.message}`);
    }
  }

  /**
   * Preview import (dry run)
   * @param {Object} exportPackage - The export package to preview
   * @returns {Promise<{valid: boolean, summary?: Object, conflicts?: Array, errors?: Array}>}
   */
  static async previewImport(exportPackage) {
    const validation = this.validatePackage(exportPackage);
    if (!validation.valid) {
      return { valid: false, errors: validation.errors };
    }

    const conflicts = await this.detectConflicts(exportPackage.data);

    return {
      valid: true,
      summary: {
        races: exportPackage.data.races?.length || 0,
        runners: exportPackage.data.runners?.length || 0,
        checkpoints: exportPackage.data.checkpoints?.length || 0,
        checkpointRunners: exportPackage.data.checkpointRunners?.length || 0,
        baseStationRunners: exportPackage.data.baseStationRunners?.length || 0,
        conflicts: conflicts.length,
      },
      conflicts,
      exportPackage, // Include for later use
    };
  }

  /**
   * Import legacy format (backward compatibility)
   * @param {Object} legacyData - Legacy export format
   * @returns {Promise<{success: boolean, raceId: number}>}
   */
  static async importLegacyFormat(legacyData) {
    try {
      const { raceConfig, runners, checkpointRunners } = legacyData;

      // Check if race already exists
      const existingRace = await db.races
        .where('name').equals(raceConfig.name)
        .and(race => race.date === raceConfig.date)
        .first();

      let raceId;

      if (existingRace) {
        // Update existing race
        raceId = existingRace.id;
        await db.races.update(raceId, raceConfig);
      } else {
        // Create new race
        raceId = await db.races.add({
          ...raceConfig,
          createdAt: new Date().toISOString(),
        });

        // Add checkpoints
        if (raceConfig.checkpoints) {
          for (const checkpoint of raceConfig.checkpoints) {
            await db.checkpoints.add({
              raceId,
              number: checkpoint.number,
              name: checkpoint.name,
            });
          }
        }

        // Add runners
        if (runners) {
          for (const runner of runners) {
            await db.runners.add({
              raceId,
              ...runner,
            });
          }
        }
      }

      // Import checkpoint runners
      if (checkpointRunners) {
        for (const runner of checkpointRunners) {
          const existing = await db.checkpoint_runners
            .where(['raceId', 'checkpointNumber', 'number'])
            .equals([raceId, runner.checkpointNumber, runner.number])
            .first();

          if (existing) {
            await db.checkpoint_runners.update(existing.id, runner);
          } else {
            await db.checkpoint_runners.add({
              raceId,
              ...runner,
            });
          }
        }
      }

      return { success: true, raceId };
    } catch (error) {
      console.error('Legacy import error:', error);
      throw new Error(`Legacy import failed: ${error.message}`);
    }
  }

  /**
   * Import checkpoint results from a checkpoint device export file.
   * Validates that the raceId matches, then upserts into `imported_checkpoint_results`
   * (overwrite semantics: delete existing entry for same raceId+checkpointNumber, then insert fresh).
   *
   * @param {Object} exportPackage - Package produced by ExportService.exportCheckpointResults()
   *   @param {Object} exportPackage.data - The data object containing checkpoint results
   *   @param {number|string} exportPackage.data.raceId - The raceId for the results
   *   @param {number} exportPackage.data.checkpointNumber - The checkpoint number
   *   @param {Array<Object>} exportPackage.data.runners - Array of runner result objects (not a string)
   * @param {number|string} currentRaceId - The raceId of the active race on this Base Station
   * @returns {Promise<{success: boolean, checkpointNumber: number, totalRunners: number, error?: string}>}
   */
  static async importCheckpointResults(exportPackage, currentRaceId) {
    try {
      // Basic structure check
      if (!exportPackage || exportPackage.exportType !== 'checkpoint-results') {
        throw new Error('Invalid package: expected exportType "checkpoint-results"');
      }

      const { data } = exportPackage;
      if (!data || !data.raceId || data.checkpointNumber == null || !Array.isArray(data.runners)) {
        throw new Error('Invalid package: missing raceId, checkpointNumber, or runners');
      }

      // Verify the checkpoint data belongs to the active race
      if (String(data.raceId) !== String(currentRaceId)) {
        throw new Error(
          `Race ID mismatch: package is for race "${data.raceId}", active race is "${currentRaceId}"`
        );
      }

      const { raceId, checkpointNumber, runners } = data;

      // Overwrite: delete any previous import for this checkpoint
      await db.imported_checkpoint_results
        .where(['raceId', 'checkpointNumber'])
        .equals([raceId, checkpointNumber])
        .delete();

      // Insert fresh
      await db.imported_checkpoint_results.add({
        raceId,
        checkpointNumber,
        runners,
        importedAt: new Date().toISOString(),
      });

      return { success: true, checkpointNumber, totalRunners: runners.length };
    } catch (error) {
      console.error('Checkpoint import error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default ImportService;
