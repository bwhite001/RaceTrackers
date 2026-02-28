# Epic 4: Data Import/Export System

**Epic Owner:** Data Platform Team Lead  
**Priority:** P0 (Blocker)  
**Estimated Effort:** 2 Sprints (4 weeks)  
**Dependencies:** Epic 1 (Database Foundation)

## Epic Description

Implement robust data import/export functionality with JSON schema validation, checksums for data integrity, conflict resolution, and QR code generation for easy device-to-device transfer.

---

## User Stories

### Story 4.1: JSON Export with Integrity Validation

**As a** race coordinator  
**I want** to export complete race data as JSON with integrity checks  
**So that** I can backup data and share between devices

**Story Points:** 8  
**Sprint:** Sprint 6

#### Acceptance Criteria

- [ ] Export complete race dataset as single JSON file
- [ ] Include all tables: races, checkpoints, runners, times, call-ins
- [ ] Generate SHA-256 checksum for integrity validation
- [ ] Include schema version and metadata
- [ ] Compress large exports for performance
- [ ] Generate downloadable file with timestamp
- [ ] Support selective export (single race vs all races)

#### Technical Implementation

**File:** `src/features/dataManagement/services/ExportService.ts`

```typescript
import { db } from '../../../database/schema';
import type { Race, Checkpoint, Runner, CheckpointTime, BaseStationCallIn } from '../../../database/schema';

// SOLID: Single Responsibility - Only handles export operations
export class ExportService {
  
  /**
   * Export complete race data
   */
  async exportRace(raceId: string): Promise<RaceExportData> {
    const race = await db.races.get(raceId);
    if (!race) {
      throw new Error(`Race not found: ${raceId}`);
    }

    // Fetch all related data in parallel (DRY: reusable pattern)
    const [checkpoints, runners, checkpointTimes, baseStationCallIns] = await Promise.all([
      db.checkpoints.where('race_id').equals(raceId).toArray(),
      db.runners.where('race_id').equals(raceId).toArray(),
      db.checkpointTimes.where('race_id').equals(raceId).toArray(),
      this.getBaseStationCallInsForRace(checkpoints.map(c => c.id))
    ]);

    const exportData: RaceExportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      exportedBy: this.getDeviceIdentifier(),
      checksum: '',  // Calculated below
      
      race,
      checkpoints,
      runners,
      checkpointTimes,
      baseStationCallIns,
      
      metadata: {
        totalRunners: runners.length,
        totalCheckpoints: checkpoints.length,
        totalTimes: checkpointTimes.length,
        raceStatus: this.determineRaceStatus(race, checkpointTimes)
      }
    };

    // Calculate checksum (excluding checksum field itself)
    exportData.checksum = await this.calculateChecksum(exportData);

    return exportData;
  }

  /**
   * Export all races
   */
  async exportAllRaces(): Promise<AllRacesExportData> {
    const races = await db.races.toArray();
    const raceExports = await Promise.all(
      races.map(race => this.exportRace(race.id))
    );

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      races: raceExports,
      totalRaces: races.length
    };
  }

  /**
   * Download export as JSON file
   */
  downloadAsJSON(data: RaceExportData | AllRacesExportData, filename?: string): void {
    const defaultFilename = 'race_export' in data 
      ? `race_export_${new Date().toISOString().split('T')[0]}.json`
      : `all_races_${new Date().toISOString().split('T')[0]}.json`;

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || defaultFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Generate QR code data (compressed for size)
   */
  async generateQRData(exportData: RaceExportData): Promise<string> {
    const jsonStr = JSON.stringify(exportData);
    
    // For large datasets, use compression
    if (jsonStr.length > 2000) {
      return this.compressData(jsonStr);
    }
    
    return btoa(jsonStr);  // Base64 encode
  }

  /**
   * Calculate SHA-256 checksum
   * DRY: Centralized checksum calculation
   */
  private async calculateChecksum(data: RaceExportData): Promise<string> {
    const dataForChecksum = { ...data, checksum: '' };
    const jsonStr = JSON.stringify(dataForChecksum);
    
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonStr);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }

  /**
   * Get device identifier for tracking
   */
  private getDeviceIdentifier(): string {
    let deviceId = localStorage.getItem('deviceId');
    
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('deviceId', deviceId);
    }
    
    return deviceId;
  }

  /**
   * Determine race status based on data
   */
  private determineRaceStatus(
    race: Race,
    checkpointTimes: CheckpointTime[]
  ): RaceStatus {
    if (checkpointTimes.length === 0) {
      return 'setup';
    }
    
    const raceDate = new Date(race.date);
    const now = new Date();
    
    if (raceDate > now) {
      return 'setup';
    }
    
    // Check if race finished (arbitrary: >6 hours after start)
    const raceStart = new Date(`${race.date}T${race.start_time}`);
    const hoursSinceStart = (now.getTime() - raceStart.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceStart > 6) {
      return 'completed';
    }
    
    return 'in_progress';
  }

  /**
   * Get base station call-ins for specific checkpoints
   */
  private async getBaseStationCallInsForRace(
    checkpointIds: string[]
  ): Promise<BaseStationCallIn[]> {
    const allCallIns: BaseStationCallIn[] = [];
    
    for (const checkpointId of checkpointIds) {
      const callIns = await db.baseStationCallIns
        .where('checkpoint_id')
        .equals(checkpointId)
        .toArray();
      allCallIns.push(...callIns);
    }
    
    return allCallIns;
  }

  /**
   * Compress data using LZ-string or similar
   */
  private compressData(data: string): string {
    // Implementation would use a compression library
    // For now, return base64 encoded
    return btoa(data);
  }
}

export interface RaceExportData {
  version: string;
  exportedAt: string;
  exportedBy: string;
  checksum: string;
  
  race: Race;
  checkpoints: Checkpoint[];
  runners: Runner[];
  checkpointTimes: CheckpointTime[];
  baseStationCallIns: BaseStationCallIn[];
  
  metadata: ExportMetadata;
}

export interface ExportMetadata {
  totalRunners: number;
  totalCheckpoints: number;
  totalTimes: number;
  raceStatus: RaceStatus;
}

export type RaceStatus = 'setup' | 'in_progress' | 'completed';

export interface AllRacesExportData {
  version: string;
  exportedAt: string;
  races: RaceExportData[];
  totalRaces: number;
}

export const exportService = new ExportService();
```

---

### Story 4.2: JSON Import with Validation and Conflict Resolution

**As a** race coordinator  
**I want** to import race data with automatic conflict detection  
**So that** I can safely merge data from multiple devices

**Story Points:** 13  
**Sprint:** Sprint 6

#### Acceptance Criteria

- [ ] Validate JSON schema before import
- [ ] Verify checksum integrity
- [ ] Detect conflicts (duplicate data with different timestamps)
- [ ] Offer conflict resolution strategies (keep newer, keep older, merge)
- [ ] Validate referential integrity
- [ ] Provide detailed import report
- [ ] Rollback on critical errors
- [ ] Support QR code scanning for import

#### Technical Implementation

**File:** `src/features/dataManagement/services/ImportService.ts`

```typescript
import { db } from '../../../database/schema';
import type { RaceExportData } from './ExportService';
import { z } from 'zod';

// Schema validation using Zod (SOLID: Dependency Inversion)
const RunnerStatusSchema = z.enum(['not_started', 'in_progress', 'finished', 'dns', 'dnf', 'withdrawn']);
const GenderSchema = z.enum(['M', 'F', 'X']);

const RaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
  runner_range_start: z.number().int().positive(),
  runner_range_end: z.number().int().positive(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  metadata: z.object({
    event_type: z.string().optional(),
    distance: z.string().optional(),
    organizer: z.string().optional()
  }).optional()
});

const RunnerSchema = z.object({
  id: z.string().uuid(),
  race_id: z.string().uuid(),
  runner_number: z.number().int().positive(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  gender: GenderSchema,
  wave_batch: z.number().int().positive(),
  status: RunnerStatusSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

const ExportDataSchema = z.object({
  version: z.string(),
  exportedAt: z.string().datetime(),
  exportedBy: z.string(),
  checksum: z.string(),
  race: RaceSchema,
  checkpoints: z.array(z.any()),
  runners: z.array(RunnerSchema),
  checkpointTimes: z.array(z.any()),
  baseStationCallIns: z.array(z.any()),
  metadata: z.object({
    totalRunners: z.number(),
    totalCheckpoints: z.number(),
    totalTimes: z.number(),
    raceStatus: z.enum(['setup', 'in_progress', 'completed'])
  })
});

// SOLID: Single Responsibility
export class ImportService {
  
  /**
   * Import race data from JSON
   */
  async importRace(
    jsonData: string,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    try {
      // Parse JSON
      const data = JSON.parse(jsonData) as RaceExportData;
      
      // Validate schema
      const schemaValidation = this.validateSchema(data);
      if (!schemaValidation.valid) {
        return {
          success: false,
          errors: schemaValidation.errors
        };
      }

      // Verify checksum
      const checksumValid = await this.verifyChecksum(data);
      if (!checksumValid) {
        return {
          success: false,
          errors: ['Checksum verification failed - data may be corrupted']
        };
      }

      // Validate referential integrity
      const integrityCheck = this.validateReferentialIntegrity(data);
      if (!integrityCheck.valid) {
        return {
          success: false,
          errors: integrityCheck.errors
        };
      }

      // Detect conflicts
      const conflicts = await this.detectConflicts(data);
      
      if (conflicts.length > 0 && !options.autoResolve) {
        return {
          success: false,
          conflicts,
          requiresUserDecision: true
        };
      }

      // Perform import
      const importResult = await this.performImport(data, options.conflictResolution || 'keep_newer');

      return importResult;

    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error during import']
      };
    }
  }

  /**
   * Validate JSON schema
   */
  private validateSchema(data: any): ValidationResult {
    try {
      ExportDataSchema.parse(data);
      return { valid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        };
      }
      return {
        valid: false,
        errors: ['Schema validation failed']
      };
    }
  }

  /**
   * Verify checksum integrity
   */
  private async verifyChecksum(data: RaceExportData): Promise<boolean> {
    const dataForChecksum = { ...data, checksum: '' };
    const jsonStr = JSON.stringify(dataForChecksum);
    
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonStr);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const calculatedChecksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return calculatedChecksum === data.checksum;
  }

  /**
   * Validate referential integrity
   */
  private validateReferentialIntegrity(data: RaceExportData): ValidationResult {
    const errors: string[] = [];

    // Check runner references
    const runnerIds = new Set(data.runners.map(r => r.id));
    const checkpointIds = new Set(data.checkpoints.map(c => c.id));

    for (const time of data.checkpointTimes) {
      if (!runnerIds.has(time.runner_id)) {
        errors.push(`Invalid runner reference in checkpoint time: ${time.runner_id}`);
      }
      if (!checkpointIds.has(time.checkpoint_id)) {
        errors.push(`Invalid checkpoint reference in checkpoint time: ${time.checkpoint_id}`);
      }
    }

    // Validate all runners belong to the race
    const invalidRunners = data.runners.filter(r => r.race_id !== data.race.id);
    if (invalidRunners.length > 0) {
      errors.push(`${invalidRunners.length} runners have invalid race_id`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Detect conflicts with existing data
   */
  private async detectConflicts(data: RaceExportData): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    // Check if race exists
    const existingRace = await db.races.get(data.race.id);
    
    if (existingRace) {
      const existingTime = new Date(existingRace.updated_at);
      const importTime = new Date(data.race.updated_at);

      if (existingTime.getTime() !== importTime.getTime()) {
        conflicts.push({
          type: 'race_modified',
          entity: 'race',
          entityId: data.race.id,
          message: `Race "${data.race.name}" exists with different data`,
          existing: existingRace,
          incoming: data.race,
          resolution: 'user_choice'
        });
      }
    }

    // Check runner conflicts
    for (const runner of data.runners) {
      const existing = await db.runners.get(runner.id);
      
      if (existing && existing.updated_at !== runner.updated_at) {
        conflicts.push({
          type: 'runner_modified',
          entity: 'runner',
          entityId: runner.id,
          message: `Runner ${runner.runner_number} has conflicting data`,
          existing,
          incoming: runner,
          resolution: 'keep_newer'
        });
      }
    }

    return conflicts;
  }

  /**
   * Perform the actual import
   */
  private async performImport(
    data: RaceExportData,
    conflictResolution: ConflictResolution
  ): Promise<ImportResult> {
    const stats = {
      racesImported: 0,
      checkpointsImported: 0,
      runnersImported: 0,
      timesImported: 0,
      callInsImported: 0
    };

    try {
      await db.transaction('rw',
        db.races,
        db.checkpoints,
        db.runners,
        db.checkpointTimes,
        db.baseStationCallIns,
        async () => {
          // Import race
          const existingRace = await db.races.get(data.race.id);
          
          if (!existingRace) {
            await db.races.add(data.race);
            stats.racesImported++;
          } else if (conflictResolution === 'keep_newer') {
            const shouldUpdate = new Date(data.race.updated_at) > new Date(existingRace.updated_at);
            if (shouldUpdate) {
              await db.races.put(data.race);
            }
          } else if (conflictResolution === 'overwrite') {
            await db.races.put(data.race);
          }

          // Import checkpoints
          for (const checkpoint of data.checkpoints) {
            const exists = await db.checkpoints.get(checkpoint.id);
            if (!exists) {
              await db.checkpoints.add(checkpoint);
              stats.checkpointsImported++;
            }
          }

          // Import runners
          for (const runner of data.runners) {
            const existing = await db.runners.get(runner.id);
            
            if (!existing) {
              await db.runners.add(runner);
              stats.runnersImported++;
            } else if (this.shouldUpdate(existing, runner, conflictResolution)) {
              await db.runners.put(runner);
              stats.runnersImported++;
            }
          }

          // Import checkpoint times (additive - rarely conflict)
          for (const time of data.checkpointTimes) {
            const existing = await db.checkpointTimes.get(time.id);
            
            if (!existing) {
              await db.checkpointTimes.add(time);
              stats.timesImported++;
            }
          }

          // Import base station call-ins
          for (const callIn of data.baseStationCallIns) {
            const existing = await db.baseStationCallIns.get(callIn.id);
            
            if (!existing) {
              await db.baseStationCallIns.add(callIn);
              stats.callInsImported++;
            }
          }
        }
      );

      return {
        success: true,
        stats
      };

    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Import transaction failed']
      };
    }
  }

  /**
   * Determine if record should be updated based on conflict resolution
   */
  private shouldUpdate(
    existing: any,
    incoming: any,
    resolution: ConflictResolution
  ): boolean {
    switch (resolution) {
      case 'keep_newer':
        return new Date(incoming.updated_at) > new Date(existing.updated_at);
      case 'keep_older':
        return new Date(incoming.updated_at) < new Date(existing.updated_at);
      case 'overwrite':
        return true;
      case 'skip':
        return false;
      default:
        return false;
    }
  }

  /**
   * Import from QR code data
   */
  async importFromQR(qrData: string): Promise<ImportResult> {
    try {
      // Decode base64
      const jsonStr = atob(qrData);
      return await this.importRace(jsonStr);
    } catch (error) {
      return {
        success: false,
        errors: ['Invalid QR code data']
      };
    }
  }
}

export interface ImportOptions {
  autoResolve?: boolean;
  conflictResolution?: ConflictResolution;
}

export type ConflictResolution = 'keep_newer' | 'keep_older' | 'overwrite' | 'skip';

export interface ImportResult {
  success: boolean;
  stats?: ImportStats;
  errors?: string[];
  conflicts?: Conflict[];
  requiresUserDecision?: boolean;
}

export interface ImportStats {
  racesImported: number;
  checkpointsImported: number;
  runnersImported: number;
  timesImported: number;
  callInsImported: number;
}

export interface Conflict {
  type: string;
  entity: string;
  entityId: string;
  message: string;
  existing: any;
  incoming: any;
  resolution: 'user_choice' | 'keep_newer' | 'keep_older';
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export const importService = new ImportService();
```

---

## Testing Strategy

**File:** `src/features/dataManagement/services/__tests__/ImportExport.integration.test.ts`

```typescript
import { db } from '../../../../database/schema';
import { exportService } from '../ExportService';
import { importService } from '../ImportService';
import { raceDAL } from '../../../../database/dal/RaceDAL';
import { runnerDAL } from '../../../../database/dal/RunnerDAL';

describe('Import/Export Integration', () => {
  let raceId: string;

  beforeEach(async () => {
    await db.delete();
    await db.open();

    // Create test race with data
    const race = await raceDAL.create({
      name: 'Integration Test Race',
      date: '2025-11-22',
      start_time: '07:00:00',
      runner_range_start: 1,
      runner_range_end: 10
    });
    raceId = race.id;

    await runnerDAL.bulkCreate(
      Array.from({ length: 10 }, (_, i) => ({
        race_id: raceId,
        runner_number: i + 1,
        gender: (i % 2 === 0 ? 'M' : 'F') as 'M' | 'F',
        wave_batch: 1,
        status: 'not_started' as const
      }))
    );
  });

  test('export and reimport preserves all data', async () => {
    // Export
    const exported = await exportService.exportRace(raceId);

    // Clear database
    await db.delete();
    await db.open();

    // Import
    const result = await importService.importRace(JSON.stringify(exported));

    expect(result.success).toBe(true);
    expect(result.stats?.racesImported).toBe(1);
    expect(result.stats?.runnersImported).toBe(10);

    // Verify data integrity
    const reimportedRace = await db.races.get(raceId);
    expect(reimportedRace).toEqual(exported.race);
  });

  test('checksum detects corrupted data', async () => {
    const exported = await exportService.exportRace(raceId);

    // Corrupt the data
    exported.race.name = 'Corrupted Name';

    const result = await importService.importRace(JSON.stringify(exported));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Checksum verification failed - data may be corrupted');
  });

  test('conflict detection identifies modified records', async () => {
    const exported = await exportService.exportRace(raceId);

    // Modify existing data
    await raceDAL.update(raceId, { name: 'Modified Race' });

    const result = await importService.importRace(JSON.stringify(exported));

    expect(result.requiresUserDecision).toBe(true);
    expect(result.conflicts?.length).toBeGreaterThan(0);
  });

  test('auto-resolve with keep_newer strategy', async () => {
    const exported = await exportService.exportRace(raceId);

    // Modify with newer timestamp
    await new Promise(resolve => setTimeout(resolve, 100));
    await raceDAL.update(raceId, { name: 'Newer Version' });

    const result = await importService.importRace(
      JSON.stringify(exported),
      { autoResolve: true, conflictResolution: 'keep_newer' }
    );

    expect(result.success).toBe(true);

    // Should keep the newer local version
    const race = await db.races.get(raceId);
    expect(race?.name).toBe('Newer Version');
  });
});
```

---

## Sprint Planning

### Sprint 6: Data Import/Export (Weeks 11-12)

**Goal:** Enable data backup and cross-device synchronization

**Stories:**
- Story 4.1: JSON Export with Integrity Validation (8 points)
- Story 4.2: JSON Import with Validation and Conflict Resolution (13 points)

**Total Story Points:** 21

**Definition of Done:**
- [ ] Export generates valid JSON with checksum
- [ ] Import validates schema and checksum
- [ ] Conflict detection working correctly
- [ ] Round-trip data integrity verified
- [ ] QR code generation functional
- [ ] Error handling comprehensive
- [ ] Integration tests passing

---

Continue to Epic 5 for PWA deployment and final integration...
