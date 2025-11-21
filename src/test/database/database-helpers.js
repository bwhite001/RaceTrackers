/**
 * Database Test Helpers
 * Utility functions for database testing
 */

import db from '../../shared/services/database/schema.js';

/**
 * Clear all data from the database
 * @returns {Promise<void>}
 */
export const clearDatabase = async () => {
  try {
    // Clear all tables instead of deleting the database
    const tables = [
      'races', 'runners', 'checkpoints', 'checkpoint_runners',
      'base_station_runners', 'settings', 'deleted_entries',
      'strapper_calls', 'audit_log', 'withdrawal_records', 'vet_out_records'
    ];

    for (const tableName of tables) {
      await db.table(tableName).clear();
    }
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
};

/**
 * Seed the database with test data
 * @param {Object} data - Test data containing race, runners, checkpoints, etc.
 * @returns {Promise<Object>} Object with created IDs
 */
export const seedDatabase = async (data) => {
  const { race, runners, checkpoints } = data;
  
  try {
    // Add race first
    const raceId = await db.races.add(race);
    
    // Update runners with raceId and add them
    const runnersWithRaceId = runners.map(runner => ({
      ...runner,
      raceId,
    }));
    await db.runners.bulkAdd(runnersWithRaceId);
    
    // Update checkpoints with raceId and add them
    if (checkpoints && checkpoints.length > 0) {
      const checkpointsWithRaceId = checkpoints.map(checkpoint => ({
        ...checkpoint,
        raceId,
      }));
      await db.checkpoints.bulkAdd(checkpointsWithRaceId);
    }
    
    return { raceId };
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

/**
 * Verify that a table exists in the database
 * @param {string} tableName - Name of the table to check
 * @returns {boolean} True if table exists
 */
export const verifyTableExists = (tableName) => {
  const tables = db.tables.map(t => t.name);
  return tables.includes(tableName);
};

/**
 * Count records in a table
 * @param {string} tableName - Name of the table
 * @returns {Promise<number>} Number of records
 */
export const countRecords = async (tableName) => {
  try {
    return await db.table(tableName).count();
  } catch (error) {
    console.error(`Error counting records in ${tableName}:`, error);
    throw error;
  }
};

/**
 * Measure performance of an async function
 * @param {Function} fn - Async function to measure
 * @returns {Promise<number>} Execution time in milliseconds
 */
export const measurePerformance = async (fn) => {
  const start = performance.now();
  await fn();
  const end = performance.now();
  return end - start;
};

/**
 * Verify that expected indexes exist on a table
 * @param {string} tableName - Name of the table
 * @param {Array<string>} expectedIndexes - Array of expected index names
 * @returns {boolean} True if all expected indexes exist
 */
export const verifyIndexes = (tableName, expectedIndexes) => {
  try {
    const table = db.table(tableName);
    const schema = table.schema;
    
    // Get all index names (including primary key and compound indexes)
    const actualIndexes = [
      schema.primKey.name,
      ...Object.keys(schema.indexes)
    ];
    
    // Check if all expected indexes are present
    return expectedIndexes.every(idx => 
      actualIndexes.some(actual => 
        actual === idx || actual.includes(idx)
      )
    );
  } catch (error) {
    console.error(`Error verifying indexes for ${tableName}:`, error);
    return false;
  }
};

/**
 * Get all records from a table
 * @param {string} tableName - Name of the table
 * @returns {Promise<Array>} Array of records
 */
export const getAllRecords = async (tableName) => {
  try {
    return await db.table(tableName).toArray();
  } catch (error) {
    console.error(`Error getting records from ${tableName}:`, error);
    throw error;
  }
};

/**
 * Verify compound index functionality
 * @param {string} tableName - Name of the table
 * @param {Object} queryParams - Parameters for compound index query
 * @returns {Promise<boolean>} True if compound index works correctly
 */
export const verifyCompoundIndex = async (tableName, queryParams) => {
  try {
    const table = db.table(tableName);
    const keys = Object.keys(queryParams);
    
    // Build compound key array
    const compoundKey = keys.map(key => queryParams[key]);
    
    // Try to query using compound index
    const results = await table.where(keys).equals(compoundKey).toArray();
    
    return true; // If no error, compound index works
  } catch (error) {
    console.error(`Error verifying compound index for ${tableName}:`, error);
    return false;
  }
};

/**
 * Verify foreign key relationship (logical, not enforced by IndexedDB)
 * @param {string} parentTable - Parent table name
 * @param {string} childTable - Child table name
 * @param {string} foreignKey - Foreign key field name
 * @returns {Promise<boolean>} True if all child records have valid parent references
 */
export const verifyForeignKeyRelationship = async (parentTable, childTable, foreignKey) => {
  try {
    const parentRecords = await db.table(parentTable).toArray();
    const childRecords = await db.table(childTable).toArray();
    
    const parentIds = new Set(parentRecords.map(r => r.id));
    
    // Check if all child records reference existing parent records
    const allValid = childRecords.every(child => 
      parentIds.has(child[foreignKey])
    );
    
    return allValid;
  } catch (error) {
    console.error(`Error verifying foreign key relationship:`, error);
    return false;
  }
};

/**
 * Get database statistics
 * @returns {Promise<Object>} Database statistics
 */
export const getDatabaseStats = async () => {
  try {
    const stats = {};
    
    for (const table of db.tables) {
      stats[table.name] = await table.count();
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting database stats:', error);
    throw error;
  }
};

/**
 * Verify database schema version
 * @returns {number} Current schema version
 */
export const getSchemaVersion = () => {
  return db.verno;
};

/**
 * Check if database is empty
 * @returns {Promise<boolean>} True if database has no records
 */
export const isDatabaseEmpty = async () => {
  try {
    const stats = await getDatabaseStats();
    return Object.values(stats).every(count => count === 0);
  } catch (error) {
    console.error('Error checking if database is empty:', error);
    throw error;
  }
};

/**
 * Bulk insert records into a table
 * @param {string} tableName - Name of the table
 * @param {Array} records - Array of records to insert
 * @returns {Promise<void>}
 */
export const bulkInsert = async (tableName, records) => {
  try {
    await db.table(tableName).bulkAdd(records);
  } catch (error) {
    console.error(`Error bulk inserting into ${tableName}:`, error);
    throw error;
  }
};

/**
 * Query records with a where clause
 * @param {string} tableName - Name of the table
 * @param {string} field - Field to query
 * @param {*} value - Value to match
 * @returns {Promise<Array>} Matching records
 */
export const queryRecords = async (tableName, field, value) => {
  try {
    return await db.table(tableName).where(field).equals(value).toArray();
  } catch (error) {
    console.error(`Error querying ${tableName}:`, error);
    throw error;
  }
};

/**
 * Test transaction rollback
 * @param {Function} transactionFn - Function that performs transaction operations
 * @returns {Promise<boolean>} True if rollback worked correctly
 */
export const testTransactionRollback = async (transactionFn) => {
  try {
    const beforeCount = await countRecords('races');
    
    try {
      await db.transaction('rw', db.races, async () => {
        await transactionFn();
        throw new Error('Intentional rollback');
      });
    } catch (error) {
      // Expected error
    }
    
    const afterCount = await countRecords('races');
    
    // If rollback worked, counts should be the same
    return beforeCount === afterCount;
  } catch (error) {
    console.error('Error testing transaction rollback:', error);
    return false;
  }
};

/**
 * Verify unique constraint
 * @param {string} tableName - Name of the table
 * @param {Object} record1 - First record
 * @param {Object} record2 - Duplicate record
 * @returns {Promise<boolean>} True if unique constraint is enforced
 */
export const verifyUniqueConstraint = async (tableName, record1, record2) => {
  try {
    await db.table(tableName).add(record1);
    
    try {
      await db.table(tableName).add(record2);
      return false; // Should have thrown an error
    } catch (error) {
      return true; // Unique constraint enforced
    }
  } catch (error) {
    console.error('Error verifying unique constraint:', error);
    return false;
  }
};

/**
 * Get table schema information
 * @param {string} tableName - Name of the table
 * @returns {Object} Schema information
 */
export const getTableSchema = (tableName) => {
  try {
    const table = db.table(tableName);
    return {
      name: table.name,
      primaryKey: table.schema.primKey.name,
      indexes: Object.keys(table.schema.indexes),
      autoIncrement: table.schema.primKey.auto,
    };
  } catch (error) {
    console.error(`Error getting schema for ${tableName}:`, error);
    throw error;
  }
};
