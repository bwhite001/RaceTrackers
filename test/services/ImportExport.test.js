import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ExportService } from '../../src/services/import-export/ExportService';
import { ImportService } from '../../src/services/import-export/ImportService';
import db from '../../src/shared/services/database/schema';

describe('Import/Export Integration', () => {
  beforeEach(async () => {
    // Clear database before each test
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    // Clean up after each test
    await db.delete();
  });

  describe('Export Service', () => {
    it('generates valid SHA-256 checksum', () => {
      const data = { test: 'data', number: 123 };
      const checksum = ExportService.generateChecksum(data);
      
      expect(checksum).toBeDefined();
      expect(checksum.length).toBe(64); // SHA-256 produces 64 hex characters
      expect(typeof checksum).toBe('string');
    });

    it('generates consistent checksums for same data', () => {
      const data = { test: 'data', number: 123 };
      const checksum1 = ExportService.generateChecksum(data);
      const checksum2 = ExportService.generateChecksum(data);
      
      expect(checksum1).toBe(checksum2);
    });

    it('generates different checksums for different data', () => {
      const data1 = { test: 'data1' };
      const data2 = { test: 'data2' };
      const checksum1 = ExportService.generateChecksum(data1);
      const checksum2 = ExportService.generateChecksum(data2);
      
      expect(checksum1).not.toBe(checksum2);
    });

    it('gets or creates device ID', () => {
      const deviceId1 = ExportService.getDeviceId();
      const deviceId2 = ExportService.getDeviceId();
      
      expect(deviceId1).toBeDefined();
      expect(deviceId1).toBe(deviceId2); // Should be persistent
      expect(deviceId1).toMatch(/^device-/);
    });

    it('exports race with all data', async () => {
      // Create test race
      const raceId = await db.races.add({
        name: 'Test Race',
        date: '2024-01-15',
        startTime: '08:00',
        minRunner: 1,
        maxRunner: 10,
        createdAt: new Date().toISOString(),
      });

      // Add runners
      await db.runners.add({
        raceId,
        number: 1,
        status: 'passed',
        recordedTime: new Date().toISOString(),
      });

      // Add checkpoint
      await db.checkpoints.add({
        raceId,
        number: 1,
        name: 'Checkpoint 1',
      });

      // Export
      const exportPackage = await ExportService.exportRace(raceId);

      expect(exportPackage).toBeDefined();
      expect(exportPackage.version).toBe('3.0.0');
      expect(exportPackage.exportType).toBe('full-race-data');
      expect(exportPackage.checksum).toBeDefined();
      expect(exportPackage.checksum.length).toBe(64);
      expect(exportPackage.data.races).toHaveLength(1);
      expect(exportPackage.data.runners).toHaveLength(1);
      expect(exportPackage.data.checkpoints).toHaveLength(1);
      expect(exportPackage.metadata.totalRaces).toBe(1);
      expect(exportPackage.metadata.totalRunners).toBe(1);
    });

    it('throws error when exporting non-existent race', async () => {
      await expect(ExportService.exportRace(99999)).rejects.toThrow('Race not found');
    });
  });

  describe('Import Service', () => {
    it('verifies valid checksum', () => {
      const data = { test: 'data' };
      const checksum = ExportService.generateChecksum(data);
      const exportPackage = { data, checksum };
      
      const isValid = ImportService.verifyChecksum(exportPackage);
      expect(isValid).toBe(true);
    });

    it('rejects invalid checksum', () => {
      const data = { test: 'data' };
      const exportPackage = { data, checksum: 'invalid-checksum' };
      
      const isValid = ImportService.verifyChecksum(exportPackage);
      expect(isValid).toBe(false);
    });

    it('validates correct export package', () => {
      const exportPackage = {
        version: '3.0.0',
        exportDate: new Date().toISOString(),
        checksum: 'a'.repeat(64),
        data: {
          races: [],
          runners: [],
          checkpoints: [],
        },
      };
      
      // Add valid checksum
      exportPackage.checksum = ExportService.generateChecksum(exportPackage.data);
      
      const validation = ImportService.validatePackage(exportPackage);
      expect(validation.valid).toBe(true);
    });

    it('rejects package with invalid checksum', () => {
      const exportPackage = {
        version: '3.0.0',
        exportDate: new Date().toISOString(),
        checksum: 'invalid',
        data: {
          races: [],
          runners: [],
          checkpoints: [],
        },
      };
      
      const validation = ImportService.validatePackage(exportPackage);
      expect(validation.valid).toBe(false);
      expect(validation.errors[0].message).toContain('Checksum mismatch');
    });
  });

  describe('Round-trip Import/Export', () => {
    it('performs complete round-trip export and import', async () => {
      // Create test data
      const raceId = await db.races.add({
        name: 'Test Race',
        date: '2024-01-15',
        startTime: '08:00',
        minRunner: 1,
        maxRunner: 10,
        createdAt: new Date().toISOString(),
      });

      await db.runners.add({
        raceId,
        number: 1,
        status: 'passed',
        recordedTime: new Date().toISOString(),
      });

      await db.checkpoints.add({
        raceId,
        number: 1,
        name: 'Checkpoint 1',
      });

      // Export
      const exportPackage = await ExportService.exportRace(raceId);
      expect(exportPackage.data.races).toHaveLength(1);
      expect(exportPackage.data.runners).toHaveLength(1);

      // Clear database
      await db.races.clear();
      await db.runners.clear();
      await db.checkpoints.clear();

      // Verify cleared
      const racesCount = await db.races.count();
      expect(racesCount).toBe(0);

      // Import
      const result = await ImportService.importWithStrategy(exportPackage, 'newer');
      expect(result.success).toBe(true);
      expect(result.imported.races).toBe(1);
      expect(result.imported.runners).toBe(1);

      // Verify data
      const importedRace = await db.races.get(raceId);
      expect(importedRace).toBeDefined();
      expect(importedRace.name).toBe('Test Race');

      const importedRunner = await db.runners.where('raceId').equals(raceId).first();
      expect(importedRunner).toBeDefined();
      expect(importedRunner.number).toBe(1);
      expect(importedRunner.status).toBe('passed');
    });

    it('detects and resolves conflicts with newer strategy', async () => {
      const raceId = 1;

      // Create existing data (older)
      await db.races.add({
        id: raceId,
        name: 'Old Race Name',
        date: '2024-01-01',
        startTime: '08:00',
        minRunner: 1,
        maxRunner: 10,
        createdAt: '2024-01-01T00:00:00.000Z',
      });

      // Create import package with newer data
      const newerDate = new Date().toISOString();
      const exportPackage = {
        version: '3.0.0',
        exportDate: newerDate,
        checksum: '',
        exportType: 'full-race-data',
        data: {
          races: [{
            id: raceId,
            name: 'New Race Name',
            date: '2024-01-15',
            startTime: '09:00',
            minRunner: 1,
            maxRunner: 10,
            createdAt: newerDate,
          }],
          runners: [],
          checkpoints: [],
        },
        metadata: {
          totalRaces: 1,
          totalRunners: 0,
          totalCheckpoints: 0,
        },
      };

      // Calculate checksum
      exportPackage.checksum = ExportService.generateChecksum(exportPackage.data);

      // Import with newer strategy
      const result = await ImportService.importWithStrategy(exportPackage, 'newer');
      expect(result.success).toBe(true);
      expect(result.conflicts).toBe(1);

      // Verify newer data was kept
      const race = await db.races.get(raceId);
      expect(race.name).toBe('New Race Name');
      expect(race.startTime).toBe('09:00');
    });

    it('skips conflicts with skip strategy', async () => {
      const raceId = 1;

      // Create existing data
      await db.races.add({
        id: raceId,
        name: 'Existing Race',
        date: '2024-01-01',
        startTime: '08:00',
        minRunner: 1,
        maxRunner: 10,
        createdAt: '2024-01-01T00:00:00.000Z',
      });

      // Create import package
      const exportPackage = {
        version: '3.0.0',
        exportDate: new Date().toISOString(),
        checksum: '',
        exportType: 'full-race-data',
        data: {
          races: [{
            id: raceId,
            name: 'New Race',
            date: '2024-01-15',
            startTime: '09:00',
            minRunner: 1,
            maxRunner: 10,
            createdAt: new Date().toISOString(),
          }],
          runners: [],
          checkpoints: [],
        },
        metadata: {
          totalRaces: 1,
          totalRunners: 0,
          totalCheckpoints: 0,
        },
      };

      exportPackage.checksum = ExportService.generateChecksum(exportPackage.data);

      // Import with skip strategy
      const result = await ImportService.importWithStrategy(exportPackage, 'skip');
      expect(result.success).toBe(true);

      // Verify existing data was kept
      const race = await db.races.get(raceId);
      expect(race.name).toBe('Existing Race');
      expect(race.startTime).toBe('08:00');
    });

    it('previews import without committing', async () => {
      const exportPackage = {
        version: '3.0.0',
        exportDate: new Date().toISOString(),
        checksum: '',
        exportType: 'full-race-data',
        data: {
          races: [{
            id: 1,
            name: 'Test Race',
            date: '2024-01-15',
            startTime: '08:00',
            minRunner: 1,
            maxRunner: 10,
            createdAt: new Date().toISOString(),
          }],
          runners: [{
            id: 1,
            raceId: 1,
            number: 1,
            status: 'passed',
          }],
          checkpoints: [],
        },
        metadata: {
          totalRaces: 1,
          totalRunners: 1,
          totalCheckpoints: 0,
        },
      };

      exportPackage.checksum = ExportService.generateChecksum(exportPackage.data);

      // Preview
      const preview = await ImportService.previewImport(exportPackage);
      
      expect(preview.valid).toBe(true);
      expect(preview.summary.races).toBe(1);
      expect(preview.summary.runners).toBe(1);
      expect(preview.conflicts).toHaveLength(0);

      // Verify nothing was imported
      const racesCount = await db.races.count();
      expect(racesCount).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('handles corrupted data gracefully', async () => {
      const corruptedPackage = {
        version: '3.0.0',
        exportDate: new Date().toISOString(),
        checksum: 'wrong-checksum',
        data: {
          races: [],
          runners: [],
          checkpoints: [],
        },
      };

      await expect(
        ImportService.importWithStrategy(corruptedPackage, 'newer')
      ).rejects.toThrow('Checksum mismatch');
    });

    it('rolls back on import error', async () => {
      const exportPackage = {
        version: '3.0.0',
        exportDate: new Date().toISOString(),
        checksum: '',
        exportType: 'full-race-data',
        data: {
          races: [{
            id: 1,
            name: 'Test Race',
            date: '2024-01-15',
            startTime: '08:00',
            minRunner: 1,
            maxRunner: 10,
          }],
          runners: [{
            // Invalid runner - missing required fields
            id: 1,
            raceId: 1,
          }],
          checkpoints: [],
        },
      };

      exportPackage.checksum = ExportService.generateChecksum(exportPackage.data);

      // Import should fail and rollback
      try {
        await ImportService.importWithStrategy(exportPackage, 'newer');
      } catch (error) {
        // Expected to fail
      }

      // Verify nothing was imported
      const racesCount = await db.races.count();
      expect(racesCount).toBe(0);
    });
  });
});
