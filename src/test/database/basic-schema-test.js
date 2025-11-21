/**
 * Basic schema validation test
 */

import { describe, it, expect } from 'vitest';
import db from '../../shared/services/database/schema.js';

describe('Database Schema v6 - Basic Validation', () => {
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
