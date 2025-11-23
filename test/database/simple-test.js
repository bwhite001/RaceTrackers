/**
 * Simple database test to debug setup
 */

import { describe, it, expect } from 'vitest';
import db from '../../src/shared/services/database/schema.js';

describe('Simple Database Test', () => {
  it('should have database instance', () => {
    expect(db).toBeDefined();
    expect(db.name).toBe('RaceTrackerDB');
  });

  it('should have tables', () => {
    expect(db.tables).toBeDefined();
    expect(db.tables.length).toBeGreaterThan(0);
  });

  it('should have schema version 6', () => {
    expect(db.verno).toBe(6);
  });

  it('should have all expected tables', () => {
    const expectedTables = [
      'races', 'runners', 'checkpoints', 'checkpoint_runners',
      'base_station_runners', 'settings', 'deleted_entries',
      'strapper_calls', 'audit_log', 'withdrawal_records', 'vet_out_records'
    ];

    const actualTables = db.tables.map(t => t.name);
    expectedTables.forEach(table => {
      expect(actualTables).toContain(table);
    });
  });
});
