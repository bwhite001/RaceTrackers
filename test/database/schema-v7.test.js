/**
 * Database Schema v7 Test Suite
 * Tests for the imported_checkpoint_results table added in v7
 */

import { describe, it, expect } from 'vitest';
import db from '../../src/shared/services/database/schema.js';

describe('Database Schema v7 - imported_checkpoint_results', () => {
  describe('Schema version', () => {
    it('should be at schema version 7', () => {
      expect(db.verno).toBe(7);
    });

    it('should contain the imported_checkpoint_results table', () => {
      const tableNames = db.tables.map(t => t.name);
      expect(tableNames).toContain('imported_checkpoint_results');
    });

    it('should retain all v6 tables', () => {
      const expected = [
        'races', 'runners', 'checkpoints', 'checkpoint_runners',
        'base_station_runners', 'settings', 'deleted_entries',
        'strapper_calls', 'audit_log', 'withdrawal_records', 'vet_out_records',
      ];
      const tableNames = db.tables.map(t => t.name);
      expected.forEach(name => expect(tableNames).toContain(name));
    });
  });

  describe('imported_checkpoint_results table structure', () => {
    it('should have auto-increment primary key', () => {
      const table = db.table('imported_checkpoint_results');
      expect(table.schema.primKey.auto).toBe(true);
    });

    it('should have compound index [raceId+checkpointNumber]', () => {
      const table = db.table('imported_checkpoint_results');
      const indexNames = table.schema.indexes.map(i => i.name);
      expect(indexNames).toContain('[raceId+checkpointNumber]');
    });

    it('should have raceId and checkpointNumber indexes', () => {
      const table = db.table('imported_checkpoint_results');
      const indexNames = table.schema.indexes.map(i => i.name);
      expect(indexNames).toContain('raceId');
      expect(indexNames).toContain('checkpointNumber');
    });
  });

  describe('imported_checkpoint_results data operations', () => {
    it('should insert and retrieve an imported checkpoint result', async () => {
      const record = {
        raceId: 1,
        checkpointNumber: 2,
        importedAt: new Date().toISOString(),
        runners: JSON.stringify([
          { number: 101, markOffTime: '2026-01-01T10:05:00Z', status: 'passed' },
          { number: 102, markOffTime: '2026-01-01T10:07:00Z', status: 'passed' },
        ]),
      };

      const id = await db.imported_checkpoint_results.add(record);
      const retrieved = await db.imported_checkpoint_results.get(id);

      expect(retrieved).toBeDefined();
      expect(retrieved.raceId).toBe(1);
      expect(retrieved.checkpointNumber).toBe(2);
      expect(JSON.parse(retrieved.runners)).toHaveLength(2);
    });

    it('should overwrite (put) an existing record for same raceId+checkpointNumber', async () => {
      const raceId = 99;
      const checkpointNumber = 3;

      // First import
      await db.imported_checkpoint_results
        .where(['raceId', 'checkpointNumber'])
        .equals([raceId, checkpointNumber])
        .delete();

      const first = {
        raceId,
        checkpointNumber,
        importedAt: new Date().toISOString(),
        runners: JSON.stringify([{ number: 200, status: 'passed' }]),
      };
      await db.imported_checkpoint_results.add(first);

      // Delete and re-import (simulates overwrite)
      await db.imported_checkpoint_results
        .where(['raceId', 'checkpointNumber'])
        .equals([raceId, checkpointNumber])
        .delete();

      const second = {
        raceId,
        checkpointNumber,
        importedAt: new Date().toISOString(),
        runners: JSON.stringify([
          { number: 200, status: 'passed' },
          { number: 201, status: 'passed' },
        ]),
      };
      const id = await db.imported_checkpoint_results.add(second);

      const all = await db.imported_checkpoint_results
        .where(['raceId', 'checkpointNumber'])
        .equals([raceId, checkpointNumber])
        .toArray();

      expect(all).toHaveLength(1);
      expect(JSON.parse(all[0].runners)).toHaveLength(2);
    });

    it('should query by raceId', async () => {
      const raceId = 42;
      await db.imported_checkpoint_results.where('raceId').equals(raceId).delete();

      await db.imported_checkpoint_results.bulkAdd([
        { raceId, checkpointNumber: 1, importedAt: new Date().toISOString(), runners: '[]' },
        { raceId, checkpointNumber: 2, importedAt: new Date().toISOString(), runners: '[]' },
      ]);

      const results = await db.imported_checkpoint_results
        .where('raceId').equals(raceId).toArray();

      expect(results).toHaveLength(2);
    });
  });
});
