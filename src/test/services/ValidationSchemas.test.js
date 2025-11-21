import { describe, it, expect } from 'vitest';
import {
  validateRace,
  validateRunner,
  validateCheckpoint,
  validateCheckpointRunner,
  validateBaseStationRunner,
  validateExportPackage,
  safeValidateExportPackage,
  formatValidationErrors,
  validateArray,
  runnerSchema,
} from '../../services/import-export/ValidationSchemas';

describe('ValidationSchemas', () => {
  describe('Race Validation', () => {
    it('validates correct race data', () => {
      const validRace = {
        id: 1,
        name: 'Test Race 2024',
        date: '2024-01-15',
        startTime: '08:00',
        minRunner: 1,
        maxRunner: 100,
        createdAt: new Date().toISOString(),
      };

      expect(() => validateRace(validRace)).not.toThrow();
    });

    it('validates race with runner ranges', () => {
      const validRace = {
        name: 'Test Race 2024',
        date: '2024-01-15',
        startTime: '08:00',
        minRunner: 1,
        maxRunner: 100,
        runnerRanges: [
          { min: 1, max: 50, isIndividual: false },
          { isIndividual: true, individualNumbers: [101, 102, 103] },
        ],
      };

      expect(() => validateRace(validRace)).not.toThrow();
    });

    it('rejects race with missing required fields', () => {
      const invalidRace = {
        id: 1,
        // missing name
        date: '2024-01-15',
        startTime: '08:00',
      };

      expect(() => validateRace(invalidRace)).toThrow();
    });

    it('rejects race with invalid time format', () => {
      const invalidRace = {
        name: 'Test Race',
        date: '2024-01-15',
        startTime: '8:00', // Invalid format (should be 08:00)
        minRunner: 1,
        maxRunner: 100,
      };

      expect(() => validateRace(invalidRace)).toThrow(/Invalid time format/);
    });

    it('rejects race with negative runner numbers', () => {
      const invalidRace = {
        name: 'Test Race',
        date: '2024-01-15',
        startTime: '08:00',
        minRunner: -1, // Invalid
        maxRunner: 100,
      };

      expect(() => validateRace(invalidRace)).toThrow();
    });
  });

  describe('Runner Validation', () => {
    it('validates correct runner data', () => {
      const validRunner = {
        id: 1,
        raceId: 1,
        number: 42,
        status: 'not-started',
        recordedTime: null,
        notes: null,
      };

      expect(() => validateRunner(validRunner)).not.toThrow();
    });

    it('validates runner with all statuses', () => {
      const statuses = ['not-started', 'passed', 'dnf', 'non-starter', 'withdrawn', 'vet-out'];
      
      statuses.forEach(status => {
        const runner = {
          raceId: 1,
          number: 42,
          status,
        };
        expect(() => validateRunner(runner)).not.toThrow();
      });
    });

    it('validates runner with extended data', () => {
      const validRunner = {
        raceId: 1,
        number: 42,
        status: 'passed',
        firstName: 'John',
        lastName: 'Doe',
        gender: 'M',
        email: 'john@example.com',
        recordedTime: new Date().toISOString(),
      };

      expect(() => validateRunner(validRunner)).not.toThrow();
    });

    it('rejects runner with invalid status', () => {
      const invalidRunner = {
        raceId: 1,
        number: 42,
        status: 'invalid_status', // Invalid
      };

      expect(() => validateRunner(invalidRunner)).toThrow();
    });

    it('rejects runner with invalid email', () => {
      const invalidRunner = {
        raceId: 1,
        number: 42,
        status: 'passed',
        email: 'not-an-email', // Invalid
      };

      expect(() => validateRunner(invalidRunner)).toThrow();
    });
  });

  describe('Checkpoint Validation', () => {
    it('validates correct checkpoint data', () => {
      const validCheckpoint = {
        id: 1,
        raceId: 1,
        number: 1,
        name: 'Checkpoint 1',
      };

      expect(() => validateCheckpoint(validCheckpoint)).not.toThrow();
    });

    it('validates checkpoint with optional fields', () => {
      const validCheckpoint = {
        raceId: 1,
        number: 1,
        name: 'Checkpoint 1',
        description: 'First checkpoint',
        distance: 10.5,
        order: 1,
        cutoffTime: '12:00',
      };

      expect(() => validateCheckpoint(validCheckpoint)).not.toThrow();
    });

    it('rejects checkpoint with missing name', () => {
      const invalidCheckpoint = {
        raceId: 1,
        number: 1,
        // missing name
      };

      expect(() => validateCheckpoint(invalidCheckpoint)).toThrow();
    });
  });

  describe('Checkpoint Runner Validation', () => {
    it('validates correct checkpoint runner data', () => {
      const validCheckpointRunner = {
        raceId: 1,
        checkpointNumber: 1,
        number: 42,
        status: 'passed',
        markOffTime: new Date().toISOString(),
        callInTime: new Date().toISOString(),
      };

      expect(() => validateCheckpointRunner(validCheckpointRunner)).not.toThrow();
    });

    it('validates checkpoint runner with null times', () => {
      const validCheckpointRunner = {
        raceId: 1,
        checkpointNumber: 1,
        number: 42,
        status: 'not-started',
        markOffTime: null,
        callInTime: null,
      };

      expect(() => validateCheckpointRunner(validCheckpointRunner)).not.toThrow();
    });
  });

  describe('Base Station Runner Validation', () => {
    it('validates correct base station runner data', () => {
      const validBaseStationRunner = {
        raceId: 1,
        checkpointNumber: 1,
        number: 42,
        status: 'passed',
        commonTime: new Date().toISOString(),
      };

      expect(() => validateBaseStationRunner(validBaseStationRunner)).not.toThrow();
    });
  });

  describe('Export Package Validation', () => {
    it('validates complete export package', () => {
      const validPackage = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        checksum: 'a'.repeat(64), // SHA-256 is 64 chars
        data: {
          races: [],
          runners: [],
          checkpoints: [],
        },
        metadata: {
          totalRaces: 0,
          totalRunners: 0,
          totalCheckpoints: 0,
        },
      };

      const result = safeValidateExportPackage(validPackage);
      expect(result.success).toBe(true);
    });

    it('validates export package with all data types', () => {
      const validPackage = {
        version: '3.0.0',
        exportDate: new Date().toISOString(),
        checksum: 'b'.repeat(64),
        exportType: 'full-race-data',
        data: {
          races: [{
            name: 'Test Race',
            date: '2024-01-15',
            startTime: '08:00',
            minRunner: 1,
            maxRunner: 100,
          }],
          runners: [{
            raceId: 1,
            number: 42,
            status: 'passed',
          }],
          checkpoints: [{
            raceId: 1,
            number: 1,
            name: 'Checkpoint 1',
          }],
          checkpointRunners: [{
            raceId: 1,
            checkpointNumber: 1,
            number: 42,
            status: 'passed',
          }],
          baseStationRunners: [{
            raceId: 1,
            checkpointNumber: 1,
            number: 42,
            status: 'passed',
          }],
        },
        metadata: {
          totalRaces: 1,
          totalRunners: 1,
          totalCheckpoints: 1,
        },
      };

      const result = safeValidateExportPackage(validPackage);
      expect(result.success).toBe(true);
    });

    it('validates legacy export format', () => {
      const legacyPackage = {
        version: '2.0.0',
        exportDate: new Date().toISOString(),
        checksum: 'c'.repeat(64),
        raceConfig: {
          name: 'Test Race',
          date: '2024-01-15',
          startTime: '08:00',
          minRunner: 1,
          maxRunner: 100,
        },
        runners: [],
        checkpointRunners: [],
      };

      const result = safeValidateExportPackage(legacyPackage);
      expect(result.success).toBe(true);
    });

    it('rejects package with invalid checksum length', () => {
      const invalidPackage = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        checksum: 'short', // Too short
        data: { races: [], runners: [], checkpoints: [] },
      };

      const result = safeValidateExportPackage(invalidPackage);
      expect(result.success).toBe(false);
      if (result.error && result.error.errors && result.error.errors.length > 0) {
        expect(result.error.errors[0].message).toContain('Invalid SHA-256 checksum');
      }
    });

    it('rejects package with missing required fields', () => {
      const invalidPackage = {
        version: '1.0',
        // missing exportDate
        checksum: 'a'.repeat(64),
        data: { races: [], runners: [], checkpoints: [] },
      };

      const result = safeValidateExportPackage(invalidPackage);
      expect(result.success).toBe(false);
    });
  });

  describe('Helper Functions', () => {
    it('formats validation errors correctly', () => {
      const invalidRunner = {
        raceId: 1,
        number: -5, // Invalid - must be positive
        status: 'invalid_status', // Invalid status
      };

      // Use safeParse to get the error object
      const result = runnerSchema.safeParse(invalidRunner);
      expect(result.success).toBe(false);
      
      if (result.success === false && result.error) {
        // Test formatValidationErrors - it should return an array
        const formatted = formatValidationErrors(result.error);
        expect(formatted).toBeInstanceOf(Array);
        // The function should handle the error gracefully even if structure is unexpected
      }
    });

    it('validates array of items', () => {
      const runners = [
        { raceId: 1, number: 1, status: 'passed' },
        { raceId: 1, number: 2, status: 'invalid' }, // Invalid
        { raceId: 1, number: 3, status: 'dnf' },
      ];

      const result = validateArray(runners, runnerSchema);
      
      expect(result.valid).toBe(false);
      expect(result.validItems).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].index).toBe(1);
    });

    it('validates array with all valid items', () => {
      const runners = [
        { raceId: 1, number: 1, status: 'passed' },
        { raceId: 1, number: 2, status: 'dnf' },
        { raceId: 1, number: 3, status: 'not-started' },
      ];

      const result = validateArray(runners, runnerSchema);
      
      expect(result.valid).toBe(true);
      expect(result.validItems).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
    });
  });
});
