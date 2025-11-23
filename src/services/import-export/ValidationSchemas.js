import { z } from 'zod';

/**
 * Zod validation schemas for all database entities
 * Ensures data integrity during import/export operations
 * 
 * This module provides:
 * 1. Schema definitions for all database entities
 * 2. Validation functions for individual entities
 * 3. Safe validation wrappers that return success/error objects
 * 4. Helper functions for array validation and error formatting
 * 
 * @module ValidationSchemas
 */

/**
 * Race schema - Validates race entity data
 * @type {import('zod').ZodObject}
 */
export const raceSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string().min(1, 'Race name is required'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  minRunner: z.number().int().positive('Min runner must be positive'),
  maxRunner: z.number().int().positive('Max runner must be positive'),
  createdAt: z.string().optional(),
  // Optional fields
  description: z.string().optional(),
  location: z.string().optional(),
  runnerRanges: z.array(z.object({
    min: z.number().int().optional(),
    max: z.number().int().optional(),
    isIndividual: z.boolean().optional(),
    individualNumbers: z.array(z.number().int()).optional(),
  })).optional(),
});

/**
 * Runner schema - Validates runner entity data
 * @type {import('zod').ZodObject}
 */
export const runnerSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  raceId: z.union([z.string(), z.number()]),
  number: z.number().int().positive('Runner number must be positive'),
  status: z.enum(['not-started', 'passed', 'dnf', 'non-starter', 'withdrawn', 'vet-out']),
  recordedTime: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  // Optional fields for extended runner data
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  gender: z.enum(['M', 'F', 'Other']).optional(),
  wave: z.number().int().positive().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  emergencyContact: z.string().optional(),
});

/**
 * Checkpoint schema - Validates checkpoint entity data
 * @type {import('zod').ZodObject}
 */
export const checkpointSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  raceId: z.union([z.string(), z.number()]),
  number: z.number().int().positive('Checkpoint number must be positive'),
  name: z.string().min(1, 'Checkpoint name is required'),
  // Optional fields
  description: z.string().optional(),
  distance: z.number().positive().optional(),
  order: z.number().int().positive().optional(),
  cutoffTime: z.string().optional(),
});

/**
 * Checkpoint runner schema - Validates checkpoint runner entity data
 * @type {import('zod').ZodObject}
 */
export const checkpointRunnerSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  raceId: z.union([z.string(), z.number()]),
  checkpointNumber: z.number().int().positive(),
  number: z.number().int().positive('Runner number must be positive'),
  status: z.enum(['not-started', 'passed', 'dnf', 'non-starter', 'withdrawn', 'vet-out']),
  markOffTime: z.string().nullable().optional(),
  callInTime: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

/**
 * Base station runner schema - Validates base station runner entity data
 * @type {import('zod').ZodObject}
 */
export const baseStationRunnerSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  raceId: z.union([z.string(), z.number()]),
  checkpointNumber: z.number().int().positive(),
  number: z.number().int().positive('Runner number must be positive'),
  status: z.enum(['not-started', 'passed', 'dnf', 'non-starter', 'withdrawn', 'vet-out']),
  commonTime: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

/**
 * Deleted entry schema - Validates deleted entry entity data
 * @type {import('zod').ZodObject}
 */
export const deletedEntrySchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  raceId: z.union([z.string(), z.number()]),
  entryType: z.string(),
  deletedAt: z.string(),
  restorable: z.boolean(),
  data: z.any().optional(),
});

/**
 * Strapper call schema - Validates strapper call entity data
 * @type {import('zod').ZodObject}
 */
export const strapperCallSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  raceId: z.union([z.string(), z.number()]),
  checkpoint: z.number().int().positive(),
  status: z.enum(['pending', 'in-progress', 'completed', 'cancelled']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  createdAt: z.string(),
  completedAt: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Audit log schema - Validates audit log entity data
 * @type {import('zod').ZodObject}
 */
export const auditLogSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  raceId: z.union([z.string(), z.number()]),
  entityType: z.string(),
  action: z.enum(['create', 'update', 'delete', 'restore']),
  performedAt: z.string(),
  performedBy: z.string().optional(),
  changes: z.any().optional(),
});

/**
 * Withdrawal record schema - Validates withdrawal record entity data
 * @type {import('zod').ZodObject}
 */
export const withdrawalRecordSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  raceId: z.union([z.string(), z.number()]),
  runnerNumber: z.number().int().positive(),
  checkpoint: z.number().int().positive(),
  withdrawalTime: z.string(),
  reversedAt: z.string().nullable().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Vet out record schema - Validates vet out record entity data
 * @type {import('zod').ZodObject}
 */
export const vetOutRecordSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  raceId: z.union([z.string(), z.number()]),
  runnerNumber: z.number().int().positive(),
  checkpoint: z.number().int().positive(),
  vetOutTime: z.string(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Export package schema - Validates complete export package
 * Includes metadata, checksum, and all entity data
 * @type {import('zod').ZodObject}
 */
export const exportPackageSchema = z.object({
  version: z.string().min(1, 'Version is required'),
  exportDate: z.string().min(1, 'Export date is required'),
  checksum: z.string().length(64, 'Invalid SHA-256 checksum'),
  deviceId: z.string().optional(),
  exportType: z.enum(['full-race-data', 'race-config', 'checkpoint-results', 'isolated-checkpoint-results', 'isolated-base-station-results']).optional(),
  data: z.object({
    races: z.array(raceSchema).optional(),
    runners: z.array(runnerSchema).optional(),
    checkpoints: z.array(checkpointSchema).optional(),
    checkpointRunners: z.array(checkpointRunnerSchema).optional(),
    baseStationRunners: z.array(baseStationRunnerSchema).optional(),
    deletedEntries: z.array(deletedEntrySchema).optional(),
    strapperCalls: z.array(strapperCallSchema).optional(),
    auditLog: z.array(auditLogSchema).optional(),
    withdrawalRecords: z.array(withdrawalRecordSchema).optional(),
    vetOutRecords: z.array(vetOutRecordSchema).optional(),
  }).optional(),
  // Legacy support for old export format
  raceConfig: z.object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string(),
    date: z.string(),
    startTime: z.string(),
    minRunner: z.number(),
    maxRunner: z.number(),
    runnerRanges: z.array(z.any()).optional(),
    checkpoints: z.array(z.any()).optional(),
  }).optional(),
  metadata: z.object({
    totalRaces: z.number().int().nonnegative().optional(),
    totalRunners: z.number().int().nonnegative().optional(),
    totalCheckpoints: z.number().int().nonnegative().optional(),
    totalCheckpointRunners: z.number().int().nonnegative().optional(),
    totalBaseStationRunners: z.number().int().nonnegative().optional(),
    exportedBy: z.string().optional(),
  }).optional(),
});

/**
 * Validation helper functions
 * These functions validate data against schemas and throw errors if invalid
 */

/**
 * Validate race data
 * @param {Object} data - Race data to validate
 * @returns {Object} Validated race data
 * @throws {import('zod').ZodError} If validation fails
 */
export const validateRace = (data) => raceSchema.parse(data);

/**
 * Validate runner data
 * @param {Object} data - Runner data to validate
 * @returns {Object} Validated runner data
 * @throws {import('zod').ZodError} If validation fails
 */
export const validateRunner = (data) => runnerSchema.parse(data);

/**
 * Validate checkpoint data
 * @param {Object} data - Checkpoint data to validate
 * @returns {Object} Validated checkpoint data
 * @throws {import('zod').ZodError} If validation fails
 */
export const validateCheckpoint = (data) => checkpointSchema.parse(data);

/**
 * Validate checkpoint runner data
 * @param {Object} data - Checkpoint runner data to validate
 * @returns {Object} Validated checkpoint runner data
 * @throws {import('zod').ZodError} If validation fails
 */
export const validateCheckpointRunner = (data) => checkpointRunnerSchema.parse(data);

/**
 * Validate base station runner data
 * @param {Object} data - Base station runner data to validate
 * @returns {Object} Validated base station runner data
 * @throws {import('zod').ZodError} If validation fails
 */
export const validateBaseStationRunner = (data) => baseStationRunnerSchema.parse(data);

/**
 * Validate export package data
 * @param {Object} data - Export package data to validate
 * @returns {Object} Validated export package data
 * @throws {import('zod').ZodError} If validation fails
 */
export const validateExportPackage = (data) => exportPackageSchema.parse(data);

/**
 * Safe validation functions
 * These functions validate data against schemas and return a result object
 * instead of throwing errors
 * @returns {Object} Object with success, data, and error properties
 */

/**
 * Safely validate race data
 * @param {Object} data - Race data to validate
 * @returns {Object} { success: boolean, data?: Object, error?: ZodError }
 */
export const safeValidateRace = (data) => raceSchema.safeParse(data);

/**
 * Safely validate runner data
 * @param {Object} data - Runner data to validate
 * @returns {Object} { success: boolean, data?: Object, error?: ZodError }
 */
export const safeValidateRunner = (data) => runnerSchema.safeParse(data);

/**
 * Safely validate checkpoint data
 * @param {Object} data - Checkpoint data to validate
 * @returns {Object} { success: boolean, data?: Object, error?: ZodError }
 */
export const safeValidateCheckpoint = (data) => checkpointSchema.safeParse(data);

/**
 * Safely validate checkpoint runner data
 * @param {Object} data - Checkpoint runner data to validate
 * @returns {Object} { success: boolean, data?: Object, error?: ZodError }
 */
export const safeValidateCheckpointRunner = (data) => checkpointRunnerSchema.safeParse(data);

/**
 * Safely validate base station runner data
 * @param {Object} data - Base station runner data to validate
 * @returns {Object} { success: boolean, data?: Object, error?: ZodError }
 */
export const safeValidateBaseStationRunner = (data) => baseStationRunnerSchema.safeParse(data);

/**
 * Safely validate export package data
 * @param {Object} data - Export package data to validate
 * @returns {Object} { success: boolean, data?: Object, error?: ZodError }
 */
export const safeValidateExportPackage = (data) => exportPackageSchema.safeParse(data);

/**
 * Format Zod validation errors into user-friendly messages
 * Converts complex ZodError structure into a simple array of path/message objects
 * 
 * @param {import('zod').ZodError} error - The Zod error object
 * @returns {Array<{path: string, message: string}>} Formatted error messages
 */
export const formatValidationErrors = (error) => {
  if (!error || !error.errors) {
    return [];
  }
  return error.errors.map(e => ({
    path: e.path.join('.'),
    message: e.message,
  }));
};

/**
 * Validate an array of items with a schema
 * Useful for validating collections of entities
 * Returns both valid items and detailed error information
 * 
 * @param {Array} items - Items to validate
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @returns {{valid: boolean, errors: Array, validItems: Array}} Validation result
 */
export const validateArray = (items, schema) => {
  const errors = [];
  const validItems = [];

  items.forEach((item, index) => {
    const result = schema.safeParse(item);
    if (result.success) {
      validItems.push(result.data);
    } else {
      errors.push({
        index,
        errors: formatValidationErrors(result.error),
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    validItems,
  };
};
