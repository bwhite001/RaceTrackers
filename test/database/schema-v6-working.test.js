/**
 * Database Schema v6 Test Suite - Working Version
 * Comprehensive tests for schema validation, data integrity, and performance
 */

import { describe, it, expect } from 'vitest';
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

describe('Database Schema v6 - Validation & Testing', () => {
  describe('Schema Creation & Structure', () => {
    it('should be at schema version 6', () => {
      expect(db.verno).toBe(6);
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
        const tables = db.tables.map(t => t.name);
        expect(tables).toContain(tableName);
      });
    });

    it('should have correct primary keys on all tables', () => {
      const tables = [
        'races', 'runners', 'checkpoints', 'checkpoint_runners',
        'base_station_runners', 'settings', 'deleted_entries',
        'strapper_calls', 'audit_log', 'withdrawal_records', 'vet_out_records'
      ];

      tables.forEach(tableName => {
        const table = db.table(tableName);
        expect(table.schema.primKey.name).toBeDefined();
        expect(table.schema.primKey.auto).toBe(true);
      });
    });

    it('should have correct indexes on races table', () => {
      const table = db.table('races');
      const indexes = Object.keys(table.schema.indexes);
      expect(indexes).toContain('name');
      expect(indexes).toContain('date');
    });

    it('should have compound indexes on runners table', () => {
      const table = db.table('runners');
      const indexes = Object.keys(table.schema.indexes);
      expect(indexes).toContain('[raceId+number]');
    });

    it('should have compound indexes on checkpoint_runners table', () => {
      const table = db.table('checkpoint_runners');
      const indexes = Object.keys(table.schema.indexes);
      expect(indexes).toContain('[raceId+checkpointNumber+number]');
    });

    it('should have compound indexes on base_station_runners table', () => {
      const table = db.table('base_station_runners');
      const indexes = Object.keys(table.schema.indexes);
      expect(indexes).toContain('[raceId+checkpointNumber+number]');
    });

    it('should have compound indexes on withdrawal_records table', () => {
      const table = db.table('withdrawal_records');
      const indexes = Object.keys(table.schema.indexes);
      expect(indexes).toContain('[raceId+runnerNumber]');
    });

    it('should have compound indexes on vet_out_records table', () => {
      const table = db.table('vet_out_records');
      const indexes = Object.keys(table.schema.indexes);
      expect(indexes).toContain('[raceId+runnerNumber]');
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
      const race = createTestRace();
      const raceId = await db.races.add(race);

      const runners = Array.from({ length: 10 }, (_, i) =>
        createTestRunner(raceId, i + 1)
      );
      await db.runners.bulkAdd(runners);

      const checkpoints = Array.from({ length: 2 }, (_, i) =>
        createTestCheckpoint(raceId, i + 1, `Checkpoint ${i + 1}`)
      );
      await db.checkpoints.bulkAdd(checkpoints);

      const raceCount = await db.races.count();
      const runnerCount = await db.runners.count();
      const checkpointCount = await db.checkpoints.count();

      expect(raceCount).toBeGreaterThanOrEqual(1);
      expect(runnerCount).toBeGreaterThanOrEqual(10);
      expect(checkpointCount).toBeGreaterThanOrEqual(2);

      // Verify all runners reference the correct race
      const allRunners = await db.runners.toArray();
      allRunners.forEach(runner => {
        expect(runner.raceId).toBeDefined();
      });
    });

    it('should enforce unique compound index on runners [raceId+number]', async () => {
      const race = createTestRace();
      const raceId = await db.races.add(race);

      const runner1 = createTestRunner(raceId, 100);
      await db.runners.add(runner1);

      // Try to add duplicate runner with same raceId and number
      const runner2 = createTestRunner(raceId, 100);
      await expect(db.runners.add(runner2)).rejects.toThrow();
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

  describe('Performance - Small Dataset (10 runners)', () => {
    it('should create database in <100ms', async () => {
      const start = performance.now();

      const race = createTestRace();
      const raceId = await db.races.add(race);

      const runners = Array.from({ length: 10 }, (_, i) =>
        createTestRunner(raceId, i + 1)
      );
      await db.runners.bulkAdd(runners);

      const checkpoints = Array.from({ length: 2 }, (_, i) =>
        createTestCheckpoint(raceId, i + 1, `Checkpoint ${i + 1}`)
      );
      await db.checkpoints.bulkAdd(checkpoints);

      const end = performance.now();
      expect(end - start).toBeLessThan(100);
    });

    it('should query runners in <50ms', async () => {
      const race = createTestRace();
      const raceId = await db.races.add(race);

      const runners = Array.from({ length: 10 }, (_, i) =>
        createTestRunner(raceId, i + 1)
      );
      await db.runners.bulkAdd(runners);

      const start = performance.now();
      const result = await db.runners.where('raceId').equals(raceId).toArray();
      const end = performance.now();

      expect(result.length).toBeGreaterThanOrEqual(10);
      expect(end - start).toBeLessThan(50);
    });

    it('should count records in <25ms', async () => {
      const start = performance.now();
      const count = await db.runners.count();
      const end = performance.now();

      expect(end - start).toBeLessThan(25);
    });
  });

  describe('Performance - Medium Dataset (100 runners)', () => {
    it('should create database in <500ms', async () => {
