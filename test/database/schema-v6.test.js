/**
 * Database Schema v6 Test Suite
 * Comprehensive tests for schema validation, data integrity, and performance
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import db from '../../src/shared/services/database/schema.js';
import { 
  generateTestDataset, 
  createEdgeCaseData,
  generateRealisticScenario,
  createTestRace,
  createTestRunner,
  createTestCheckpoint,
  createTestCheckpointRunner,
  createTestBaseStationRunner,
  createTestDeletedEntry,
  createTestStrapperCall,
  createTestAuditLog,
  createTestWithdrawalRecord,
  createTestVetOutRecord,
} from './test-data-factory.js';
import { 
  clearDatabase, 
  seedDatabase, 
  verifyTableExists,
  countRecords,
  measurePerformance,
  verifyIndexes,
  getAllRecords,
  getDatabaseStats,
  getSchemaVersion,
  isDatabaseEmpty,
  queryRecords,
  getTableSchema,
  verifyUniqueConstraint,
} from './database-helpers.js';

describe('Database Schema v6 - Validation & Testing', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  afterEach(async () => {
    // Cleanup after each test
    await clearDatabase();
  });

  describe('Schema Creation & Structure', () => {
    it('should be at schema version 6', () => {
      const version = getSchemaVersion();
      expect(version).toBe(6);
    });

    it('should create all 11 required tables', () => {
      const expectedTables = [
        'races',
        'runners',
        'checkpoints',
        'checkpoint_runners',
        'base_station_runners',
        'settings',
        'deleted_entries',
        'strapper_calls',
        'audit_log',
        'withdrawal_records',
        'vet_out_records'
      ];

      expectedTables.forEach(tableName => {
        expect(verifyTableExists(tableName)).toBe(true);
      });
    });

    it('should have correct primary keys on all tables', () => {
      // All tables except 'settings' use ++id (auto-increment primary key)
      const autoIncTables = [
        'races', 'runners', 'checkpoints', 'checkpoint_runners',
        'base_station_runners', 'deleted_entries',
        'strapper_calls', 'audit_log', 'withdrawal_records', 'vet_out_records'
      ];
      const manualKeyTables = ['settings']; // uses 'key' as primary key

      autoIncTables.forEach(tableName => {
        const schema = getTableSchema(tableName);
        expect(schema.primaryKey).toBeDefined();
        expect(schema.autoIncrement).toBe(true);
      });

      manualKeyTables.forEach(tableName => {
        const schema = getTableSchema(tableName);
        expect(schema.primaryKey).toBe('key');
        expect(schema.autoIncrement).toBe(false);
      });
    });

    it('should have correct indexes on races table', () => {
      const expectedIndexes = ['id', 'name', 'date'];
      expect(verifyIndexes('races', expectedIndexes)).toBe(true);
    });

    it('should have compound indexes on runners table', () => {
      const expectedIndexes = ['raceId', 'number'];
      expect(verifyIndexes('runners', expectedIndexes)).toBe(true);
    });

    it('should have compound indexes on checkpoint_runners table', () => {
      const expectedIndexes = ['raceId', 'checkpointNumber', 'number'];
      expect(verifyIndexes('checkpoint_runners', expectedIndexes)).toBe(true);
    });

    it('should have compound indexes on base_station_runners table', () => {
      const expectedIndexes = ['raceId', 'checkpointNumber', 'number'];
      expect(verifyIndexes('base_station_runners', expectedIndexes)).toBe(true);
    });

    it('should have compound indexes on withdrawal_records table', () => {
      const expectedIndexes = ['raceId', 'runnerNumber'];
      expect(verifyIndexes('withdrawal_records', expectedIndexes)).toBe(true);
    });

    it('should have compound indexes on vet_out_records table', () => {
      const expectedIndexes = ['raceId', 'runnerNumber'];
      expect(verifyIndexes('vet_out_records', expectedIndexes)).toBe(true);
    });
  });

  describe('Data Integrity - Core Tables', () => {
    it('should insert and retrieve race data correctly', async () => {
      const race = createTestRace();
      const raceId = await db.races.add(race);
      
      const retrieved = await db.races.get(raceId);
      expect(retrieved).toBeDefined();
      expect(retrieved.name).toBe(race.name);
      expect(retrieved.date).toBe(race.date);
    });

    it('should handle foreign key relationships correctly', async () => {
      const data = generateTestDataset('small');
      const { raceId } = await seedDatabase(data);

      const raceCount = await countRecords('races');
      const runnerCount = await countRecords('runners');
      const checkpointCount = await countRecords('checkpoints');

      expect(raceCount).toBe(1);
      expect(runnerCount).toBe(10);
      expect(checkpointCount).toBe(2);

      // Verify all runners reference the correct race
      const runners = await queryRecords('runners', 'raceId', raceId);
      expect(runners.length).toBe(10);
      runners.forEach(runner => {
        expect(runner.raceId).toBe(raceId);
      });
    });

    it('should have compound index on runners [raceId+number] for fast lookups', async () => {
      // The schema uses a non-unique compound index [raceId+number] for lookup performance.
      // Uniqueness is enforced at the application layer (StorageService).
      const race = createTestRace();
      const raceId = await db.races.add(race);

      const runner1 = createTestRunner(raceId, 100);
      const id1 = await db.runners.add(runner1);
      expect(id1).toBeDefined();

      // Compound index allows efficient range queries
      const found = await db.runners
        .where('[raceId+number]')
        .equals([raceId, 100])
        .first();
      expect(found).toBeDefined();
      expect(found.number).toBe(100);
    });

    it('should allow same runner number in different races', async () => {
      const race1 = createTestRace({ name: 'Race 1' });
      const race2 = createTestRace({ name: 'Race 2' });
      
      const raceId1 = await db.races.add(race1);
      const raceId2 = await db.races.add(race2);

      const runner1 = createTestRunner(raceId1, 100);
      const runner2 = createTestRunner(raceId2, 100);

      await expect(db.runners.add(runner1)).resolves.toBeDefined();
      await expect(db.runners.add(runner2)).resolves.toBeDefined();
    });
  });

  describe('Data Integrity - Audit Tables', () => {
    it('should insert deleted entries correctly', async () => {
      const race = createTestRace();
      const raceId = await db.races.add(race);

      const deletedEntry = createTestDeletedEntry(raceId, 'runner');
      const entryId = await db.deleted_entries.add(deletedEntry);

      const retrieved = await db.deleted_entries.get(entryId);
      expect(retrieved).toBeDefined();
      expect(retrieved.raceId).toBe(raceId);
      expect(retrieved.entryType).toBe('runner');
    });

    it('should insert strapper calls correctly', async () => {
      const race = createTestRace();
      const raceId = await db.races.add(race);

      const strapperCall = createTestStrapperCall(raceId, 1);
      const callId = await db.strapper_calls.add(strapperCall);

      const retrieved = await db.strapper_calls.get(callId);
      expect(retrieved).toBeDefined();
      expect(retrieved.checkpoint).toBe(1);
      expect(retrieved.status).toBe('pending');
    });

    it('should insert audit log entries correctly', async () => {
      const race = createTestRace();
      const raceId = await db.races.add(race);

      const auditLog = createTestAuditLog(raceId, 'runner', 'create');
      const logId = await db.audit_log.add(auditLog);

      const retrieved = await db.audit_log.get(logId);
      expect(retrieved).toBeDefined();
      expect(retrieved.action).toBe('create');
    });

    it('should insert withdrawal records correctly', async () => {
      const race = createTestRace();
      const raceId = await db.races.add(race);

      const withdrawal = createTestWithdrawalRecord(raceId, 100, 2);
      const withdrawalId = await db.withdrawal_records.add(withdrawal);

      const retrieved = await db.withdrawal_records.get(withdrawalId);
      expect(retrieved).toBeDefined();
      expect(retrieved.runnerNumber).toBe(100);
      expect(retrieved.checkpoint).toBe(2);
    });

    it('should insert vet out records correctly', async () => {
      const race = createTestRace();
      const raceId = await db.races.add(race);

      const vetOut = createTestVetOutRecord(raceId, 100, 3);
      const vetOutId = await db.vet_out_records.add(vetOut);

      const retrieved = await db.vet_out_records.get(vetOutId);
      expect(retrieved).toBeDefined();
      expect(retrieved.runnerNumber).toBe(100);
      expect(retrieved.checkpoint).toBe(3);
    });
  });

  describe('Performance - Tiny Dataset (5 runners)', () => {
    it('should create database in <50ms', async () => {
      const data = generateTestDataset('tiny');
      
      const time = await measurePerformance(async () => {
        await seedDatabase(data);
      });

      expect(time).toBeLessThan(50);
    });

    it('should query runners in <25ms', async () => {
      const data = generateTestDataset('tiny');
      const { raceId } = await seedDatabase(data);

      const time = await measurePerformance(async () => {
        await queryRecords('runners', 'raceId', raceId);
      });

      expect(time).toBeLessThan(25);
    });
  });

  describe('Performance - Small Dataset (10 runners)', () => {
    it('should create database in <100ms', async () => {
      const data = generateTestDataset('small');
      
      const time = await measurePerformance(async () => {
        await seedDatabase(data);
      });

      expect(time).toBeLessThan(100);
    });

    it('should query runners in <50ms', async () => {
      const data = generateTestDataset('small');
      const { raceId } = await seedDatabase(data);

      const time = await measurePerformance(async () => {
        await queryRecords('runners', 'raceId', raceId);
      });

      expect(time).toBeLessThan(50);
    });

    it('should count records in <25ms', async () => {
      const data = generateTestDataset('small');
      await seedDatabase(data);

      const time = await measurePerformance(async () => {
        await countRecords('runners');
      });

      expect(time).toBeLessThan(25);
    });
  });

  describe('Performance - Medium Dataset (100 runners)', () => {
    it('should create database in <500ms', async () => {
      const data = generateTestDataset('medium');
      
      const time = await measurePerformance(async () => {
        await seedDatabase(data);
      });

      expect(time).toBeLessThan(500);
    });

    it('should query runners in <100ms', async () => {
      const data = generateTestDataset('medium');
      const { raceId } = await seedDatabase(data);

      const time = await measurePerformance(async () => {
        await queryRecords('runners', 'raceId', raceId);
      });

      expect(time).toBeLessThan(100);
    });

    it('should handle bulk operations efficiently', async () => {
      const data = generateTestDataset('medium');
      const { raceId } = await seedDatabase(data);

      const checkpointRunners = Array.from({ length: 100 }, (_, i) =>
        createTestCheckpointRunner(raceId, 1, i + 1)
      );

      const time = await measurePerformance(async () => {
        await db.checkpoint_runners.bulkAdd(checkpointRunners);
      });

      expect(time).toBeLessThan(200);
    });
  });

  describe('Performance - Large Dataset (1000 runners)', () => {
    it('should create database in <2 seconds', async () => {
      const data = generateTestDataset('large');
      
      const time = await measurePerformance(async () => {
        await seedDatabase(data);
      });

      expect(time).toBeLessThan(2000);
    });

    it('should query runners efficiently with compound index', async () => {
      const data = generateTestDataset('large');
      const { raceId } = await seedDatabase(data);

      const time = await measurePerformance(async () => {
        await db.runners
          .where('[raceId+number]')
          .equals([raceId, 500])
          .toArray();
      });

      expect(time).toBeLessThan(50);
    });
  });

  describe('Performance - XLarge Dataset (2000 runners)', () => {
    it('should create database in <5 seconds', async () => {
      const data = generateTestDataset('xlarge');
      
      const time = await measurePerformance(async () => {
        await seedDatabase(data);
      });

      expect(time).toBeLessThan(5000);
    });

    it('should maintain query performance at scale', async () => {
      const data = generateTestDataset('xlarge');
      const { raceId } = await seedDatabase(data);

      const time = await measurePerformance(async () => {
        await queryRecords('runners', 'raceId', raceId);
      });

      expect(time).toBeLessThan(500);
    });
  });

  describe('Edge Cases - Data Validation', () => {
    it('should handle empty database', async () => {
      const isEmpty = await isDatabaseEmpty();
      expect(isEmpty).toBe(true);

      const stats = await getDatabaseStats();
      Object.values(stats).forEach(count => {
        expect(count).toBe(0);
      });
    });

    it('should handle special characters in data', async () => {
      const race = createTestRace();
      const raceId = await db.races.add(race);

      const edgeCases = createEdgeCaseData();
      const runner = { ...edgeCases.specialChars, raceId };

      await expect(db.runners.add(runner)).resolves.toBeDefined();
      
      const retrieved = await db.runners.get({ raceId, number: runner.number });
      expect(retrieved.notes).toBe(runner.notes);
    });

    it('should handle unicode characters', async () => {
      const race = createTestRace();
      const raceId = await db.races.add(race);

      const edgeCases = createEdgeCaseData();
      const runner = { ...edgeCases.unicode, raceId };

      await expect(db.runners.add(runner)).resolves.toBeDefined();
      
      const retrieved = await db.runners.get({ raceId, number: runner.number });
      expect(retrieved.notes).toContain('🏃‍♂️');
    });

    it('should handle null values correctly', async () => {
      const race = createTestRace();
      const raceId = await db.races.add(race);

      const edgeCases = createEdgeCaseData();
      const runner = { ...edgeCases.nullValues, raceId };

      await expect(db.runners.add(runner)).resolves.toBeDefined();
      
      const retrieved = await db.runners.get({ raceId, number: runner.number });
      expect(retrieved.recordedTime).toBeNull();
    });

    it('should handle maximum length strings', async () => {
      const race = createTestRace();
      const raceId = await db.races.add(race);

      const edgeCases = createEdgeCaseData();
      const runner = { ...edgeCases.maxLength, raceId };

      await expect(db.runners.add(runner)).resolves.toBeDefined();
      
      const retrieved = await db.runners.get({ raceId, number: runner.number });
      expect(retrieved.notes.length).toBe(1000);
    });

    it('should handle boundary runner numbers', async () => {
      const race = createTestRace();
      const raceId = await db.races.add(race);

      const edgeCases = createEdgeCaseData();
      const minRunner = { ...edgeCases.boundaryNumbers.minRunner, raceId };
      const maxRunner = { ...edgeCases.boundaryNumbers.maxRunner, raceId };

      await expect(db.runners.add(minRunner)).resolves.toBeDefined();
      await expect(db.runners.add(maxRunner)).resolves.toBeDefined();
    });
  });

  describe('Edge Cases - Date Handling', () => {
    it('should handle past dates', async () => {
      const edgeCases = createEdgeCaseData();
      const race = edgeCases.timestamps.past;

      await expect(db.races.add(race)).resolves.toBeDefined();
    });

    it('should handle future dates', async () => {
      const edgeCases = createEdgeCaseData();
      const race = edgeCases.timestamps.future;

      await expect(db.races.add(race)).resolves.toBeDefined();
    });

    it('should handle today\'s date', async () => {
      const edgeCases = createEdgeCaseData();
      const race = edgeCases.timestamps.today;

      await expect(db.races.add(race)).resolves.toBeDefined();
    });
  });

  describe('Realistic Scenarios', () => {
    it('should handle complete race scenario with mixed statuses', async () => {
      const race = createTestRace();
      const raceId = await db.races.add(race);

      const scenario = generateRealisticScenario(raceId);
      
      await db.runners.bulkAdd(scenario.runners);
      await db.checkpoints.bulkAdd(scenario.checkpoints);

      const runnerCount = await countRecords('runners');
      expect(runnerCount).toBe(100);

      const passedRunners = await db.runners
        .where('status')
        .equals('passed')
        .count();
      expect(passedRunners).toBe(50);

      const dnfRunners = await db.runners
        .where('status')
        .equals('dnf')
        .count();
      expect(dnfRunners).toBe(10);
    });

    it('should handle checkpoint operations workflow', async () => {
      const race = createTestRace();
      const raceId = await db.races.add(race);

      const checkpoint = createTestCheckpoint(raceId, 1, 'Mile 10');
      await db.checkpoints.add(checkpoint);

      // Add checkpoint runners
      const checkpointRunners = Array.from({ length: 50 }, (_, i) =>
        createTestCheckpointRunner(raceId, 1, i + 1, {
          markOffTime: new Date().toISOString(),
          status: 'passed'
        })
      );

      await db.checkpoint_runners.bulkAdd(checkpointRunners);

      const count = await db.checkpoint_runners
        .where('[raceId+checkpointNumber]')
        .equals([raceId, 1])
        .count();

      expect(count).toBe(50);
    });

    it('should handle base station operations workflow', async () => {
      const race = createTestRace();
      const raceId = await db.races.add(race);

      // Add base station runners
      const baseStationRunners = Array.from({ length: 30 }, (_, i) =>
        createTestBaseStationRunner(raceId, 4, i + 1, {
          commonTime: new Date().toISOString(),
          status: 'passed'
        })
      );

      await db.base_station_runners.bulkAdd(baseStationRunners);

      const count = await db.base_station_runners
        .where('[raceId+checkpointNumber]')
        .equals([raceId, 4])
        .count();

      expect(count).toBe(30);
    });
  });

  describe('Database Statistics', () => {
    it('should provide accurate database statistics', async () => {
      const data = generateTestDataset('medium');
      await seedDatabase(data);

      const stats = await getDatabaseStats();

      expect(stats.races).toBe(1);
      expect(stats.runners).toBe(100);
      expect(stats.checkpoints).toBe(4);
      expect(stats.checkpoint_runners).toBe(0);
      expect(stats.base_station_runners).toBe(0);
    });

    it('should track multiple races independently', async () => {
      const race1 = createTestRace({ name: 'Race 1' });
      const race2 = createTestRace({ name: 'Race 2' });

      const raceId1 = await db.races.add(race1);
      const raceId2 = await db.races.add(race2);

      const runners1 = Array.from({ length: 50 }, (_, i) =>
        createTestRunner(raceId1, i + 1)
      );
      const runners2 = Array.from({ length: 75 }, (_, i) =>
        createTestRunner(raceId2, i + 1)
      );

      await db.runners.bulkAdd([...runners1, ...runners2]);

      const race1Runners = await queryRecords('runners', 'raceId', raceId1);
      const race2Runners = await queryRecords('runners', 'raceId', raceId2);

      expect(race1Runners.length).toBe(50);
      expect(race2Runners.length).toBe(75);
    });
  });
});
