import { z } from 'zod';

/**
 * Zod validation schemas for all database entities
 * Ensures data integrity during import/export
 */

// Race schema
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

// Runner schema
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

// Checkpoint schema
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

// Checkpoint runner schema
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

// Base station runner schema
export const baseStationRunnerSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  raceId: z.union([z.string(), z.number()]),
  checkpointNumber: z.number().int().positive(),
  number: z.number().int().positive('Runner number must be positive'),
  status: z.enum(['not-started', 'passed', 'dnf', 'non-starter', 'withdrawn', 'vet-out']),
  commonTime: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// Deleted entry schema
export const deletedEntrySchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  raceId: z.union([z.string(), z.number()]),
  entryType: z.string(),
  deletedAt: z.string(),
  restorable: z.boolean(),
  data: z.any().optional(),
});

// Strapper call schema
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

// Audit log schema
export const auditLogSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  raceId: z.union([z.string(), z.number()]),
  entityType: z.string(),
  action: z.enum(['create', 'update', 'delete', 'restore']),
  performedAt: z.string(),
  performedBy: z.string().optional(),
  changes: z.any().optional(),
});

// Withdrawal record schema
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

// Vet out record schema
export const vetOutRecordSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  raceId: z.union([z.string(), z.number()]),
  runnerNumber: z.number().int().positive(),
  checkpoint: z.number().int().positive(),
  vetOutTime: z.string(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

// Export package schema (complete export)
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

// Validation helper functions
export const validateRace = (data) => raceSchema.parse(data);
export const validateRunner = (data) => runnerSchema.parse(data);
export const validateCheckpoint = (data) => checkpointSchema.parse(data);
export const validateCheckpointRunner = (data) => checkpointRunnerSchema.parse(data);
export const validateBaseStationRunner = (data) => baseStationRunnerSchema.parse(data);
export const validateExportPackage = (data) => exportPackageSchema.parse(data);

// Safe validation (returns { success, data, error })
export const safeValidateRace = (data) => raceSchema.safeParse(data);
export const safeValidateRunner = (data) => runnerSchema.safeParse(data);
export const safeValidateCheckpoint = (data) => checkpointSchema.safeParse(data);
export const safeValidateCheckpointRunner = (data) => checkpointRunnerSchema.safeParse(data);
export const safeValidateBaseStationRunner = (data) => baseStationRunnerSchema.safeParse(data);
export const safeValidateExportPackage = (data) => exportPackageSchema.safeParse(data);

/**
 * Format Zod validation errors into user-friendly messages
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
