# Epic 1: Database Foundation Layer

**Epic Owner:** Backend Team Lead  
**Priority:** P0 (Blocker)  
**Estimated Effort:** 2 Sprints (4 weeks)  
**Dependencies:** None

## Epic Description

Establish the foundational database layer using IndexedDB and Dexie.js, implementing the complete schema, data access patterns, and transaction management system. This epic provides the critical data persistence layer for all application features.

---

## User Stories

### Story 1.1: Database Schema Initialization

**As a** developer  
**I want** a well-defined database schema with proper indexing  
**So that** I can efficiently store and retrieve race data offline

**Story Points:** 5  
**Sprint:** Sprint 1

#### Acceptance Criteria

- [ ] IndexedDB database named "RaceTrackerDB" is created with version 1
- [ ] All 5 tables are defined: races, checkpoints, runners, checkpointTimes, baseStationCallIns
- [ ] Primary and composite indexes are created for all tables
- [ ] Database opens successfully on first application load
- [ ] Schema migrations are handled gracefully for future versions
- [ ] TypeScript interfaces match database schema exactly

#### Technical Implementation

**File:** `src/database/schema.ts`

```typescript
import Dexie, { Table } from 'dexie';

// Type Definitions (SOLID: Interface Segregation)
export interface Race {
  id: string;
  name: string;
  date: string;
  start_time: string;
  runner_range_start: number;
  runner_range_end: number;
  created_at: string;
  updated_at: string;
  metadata?: RaceMetadata;
}

export interface RaceMetadata {
  event_type?: string;
  distance?: string;
  organizer?: string;
}

export interface Checkpoint {
  id: string;
  race_id: string;
  checkpoint_number: number;
  checkpoint_name: string;
  location?: string;
  order_sequence: number;
  created_at: string;
  updated_at: string;
}

export interface Runner {
  id: string;
  race_id: string;
  runner_number: number;
  first_name?: string;
  last_name?: string;
  gender: 'M' | 'F' | 'X';
  wave_batch: number;
  status: RunnerStatus;
  created_at: string;
  updated_at: string;
}

export enum RunnerStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished',
  DNS = 'dns',
  DNF = 'dnf',
  WITHDRAWN = 'withdrawn'
}

export interface CheckpointTime {
  id: string;
  checkpoint_id: string;
  runner_id: string;
  race_id: string;
  runner_number: number;
  actual_time: string;
  common_time: string;
  call_in_time?: string;
  time_group: string;
  called_in: boolean;
  created_at: string;
  updated_at: string;
}

export interface BaseStationCallIn {
  id: string;
  checkpoint_id: string;
  common_time: string;
  time_group: string;
  runner_numbers: number[];
  entered_by: string;
  entered_at: string;
  created_at: string;
}

// Database Class (SOLID: Single Responsibility)
export class RaceTrackerDatabase extends Dexie {
  races!: Table<Race, string>;
  checkpoints!: Table<Checkpoint, string>;
  runners!: Table<Runner, string>;
  checkpointTimes!: Table<CheckpointTime, string>;
  baseStationCallIns!: Table<BaseStationCallIn, string>;

  constructor() {
    super('RaceTrackerDB');
    
    this.version(1).stores({
      races: 'id, date, created_at',
      checkpoints: 'id, [race_id+checkpoint_number], race_id',
      runners: 'id, [race_id+runner_number], race_id, status, wave_batch',
      checkpointTimes: 'id, [checkpoint_id+runner_id], checkpoint_id, runner_id, race_id, time_group, common_time',
      baseStationCallIns: 'id, [checkpoint_id+time_group], checkpoint_id, common_time'
    });
  }
}

export const db = new RaceTrackerDatabase();
```

#### Testing Strategy

**File:** `src/database/__tests__/schema.test.ts`

```typescript
import { db, RaceTrackerDatabase } from '../schema';
import Dexie from 'dexie';

describe('Database Schema', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  afterAll(async () => {
    await db.delete();
  });

  test('database initializes with correct name', () => {
    expect(db.name).toBe('RaceTrackerDB');
  });

  test('all tables are created', () => {
    expect(db.tables.length).toBe(5);
    expect(db.table('races')).toBeDefined();
    expect(db.table('checkpoints')).toBeDefined();
    expect(db.table('runners')).toBeDefined();
    expect(db.table('checkpointTimes')).toBeDefined();
    expect(db.table('baseStationCallIns')).toBeDefined();
  });

  test('races table has correct indexes', () => {
    const racesTable = db.table('races');
    expect(racesTable.schema.primKey.name).toBe('id');
    expect(racesTable.schema.indexes.map(i => i.name)).toContain('date');
    expect(racesTable.schema.indexes.map(i => i.name)).toContain('created_at');
  });

  test('composite indexes are created correctly', async () => {
    const checkpointsTable = db.table('checkpoints');
    const compositeIndex = checkpointsTable.schema.indexes.find(
      i => i.name === '[race_id+checkpoint_number]'
    );
    expect(compositeIndex).toBeDefined();
    expect(compositeIndex?.compound).toBe(true);
  });
});
```

---

### Story 1.2: Data Access Layer - Race Operations

**As a** developer  
**I want** a clean API for race CRUD operations  
**So that** I can manage races without writing raw database queries

**Story Points:** 8  
**Sprint:** Sprint 1

#### Acceptance Criteria

- [ ] RaceDAL class implements all CRUD operations
- [ ] All operations use TypeScript interfaces for type safety
- [ ] UUID generation is handled automatically
- [ ] Timestamps (created_at, updated_at) are managed automatically
- [ ] Operations return properly typed results
- [ ] Error handling includes specific error types

#### Technical Implementation

**File:** `src/database/dal/RaceDAL.ts`

```typescript
import { db } from '../schema';
import type { Race } from '../schema';
import { v4 as uuidv4 } from 'uuid';

// SOLID: Single Responsibility - Only handles Race operations
export class RaceDAL {
  
  /**
   * Create a new race
   * DRY: Timestamp and ID generation centralized
   */
  async create(raceData: Omit<Race, 'id' | 'created_at' | 'updated_at'>): Promise<Race> {
    const now = new Date().toISOString();
    const race: Race = {
      ...raceData,
      id: uuidv4(),
      created_at: now,
      updated_at: now
    };
    
    await db.races.add(race);
    return race;
  }

  /**
   * Get race by ID
   */
  async getById(id: string): Promise<Race | undefined> {
    return await db.races.get(id);
  }

  /**
   * Get all races ordered by date (newest first)
   */
  async getAll(): Promise<Race[]> {
    return await db.races
      .orderBy('date')
      .reverse()
      .toArray();
  }

  /**
   * Update race
   * DRY: updated_at timestamp automatically managed
   */
  async update(id: string, updates: Partial<Omit<Race, 'id' | 'created_at'>>): Promise<void> {
    await db.races.update(id, {
      ...updates,
      updated_at: new Date().toISOString()
    });
  }

  /**
   * Delete race and all related data (cascade)
   * SOLID: Open/Closed - delegates to other DALs for related data
   */
  async delete(id: string): Promise<void> {
    await db.transaction('rw', 
      db.races, 
      db.checkpoints, 
      db.runners, 
      db.checkpointTimes,
      db.baseStationCallIns,
      async () => {
        // Delete in correct order to maintain referential integrity
        await db.checkpointTimes.where('race_id').equals(id).delete();
        await db.runners.where('race_id').equals(id).delete();
        await db.checkpoints.where('race_id').equals(id).delete();
        await db.races.delete(id);
      }
    );
  }

  /**
   * Get races within date range
   */
  async getByDateRange(startDate: string, endDate: string): Promise<Race[]> {
    return await db.races
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();
  }

  /**
   * Check if race exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await db.races.where('id').equals(id).count();
    return count > 0;
  }
}

// Export singleton instance (DRY: single instance across app)
export const raceDAL = new RaceDAL();
```

#### Testing Strategy

**File:** `src/database/dal/__tests__/RaceDAL.test.ts`

```typescript
import { db } from '../../schema';
import { raceDAL } from '../RaceDAL';
import type { Race } from '../../schema';

describe('RaceDAL', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  afterAll(async () => {
    await db.delete();
  });

  describe('create', () => {
    test('creates race with auto-generated id and timestamps', async () => {
      const raceData = {
        name: 'Test Race',
        date: '2025-11-22',
        start_time: '07:00:00',
        runner_range_start: 1,
        runner_range_end: 100
      };

      const race = await raceDAL.create(raceData);

      expect(race.id).toBeDefined();
      expect(race.created_at).toBeDefined();
      expect(race.updated_at).toBeDefined();
      expect(race.name).toBe('Test Race');
    });

    test('stores race in database', async () => {
      const race = await raceDAL.create({
        name: 'Test Race',
        date: '2025-11-22',
        start_time: '07:00:00',
        runner_range_start: 1,
        runner_range_end: 100
      });

      const retrieved = await db.races.get(race.id);
      expect(retrieved).toEqual(race);
    });
  });

  describe('getById', () => {
    test('retrieves existing race', async () => {
      const race = await raceDAL.create({
        name: 'Test Race',
        date: '2025-11-22',
        start_time: '07:00:00',
        runner_range_start: 1,
        runner_range_end: 100
      });

      const retrieved = await raceDAL.getById(race.id);
      expect(retrieved).toEqual(race);
    });

    test('returns undefined for non-existent race', async () => {
      const retrieved = await raceDAL.getById('non-existent-id');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('update', () => {
    test('updates race and modifies updated_at timestamp', async () => {
      const race = await raceDAL.create({
        name: 'Original Name',
        date: '2025-11-22',
        start_time: '07:00:00',
        runner_range_start: 1,
        runner_range_end: 100
      });

      const originalUpdatedAt = race.updated_at;
      
      // Wait 10ms to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await raceDAL.update(race.id, { name: 'Updated Name' });

      const updated = await raceDAL.getById(race.id);
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.updated_at).not.toBe(originalUpdatedAt);
      expect(updated?.created_at).toBe(race.created_at);
    });
  });

  describe('delete', () => {
    test('deletes race and cascades to related data', async () => {
      const race = await raceDAL.create({
        name: 'Test Race',
        date: '2025-11-22',
        start_time: '07:00:00',
        runner_range_start: 1,
        runner_range_end: 100
      });

      // Add related data
      await db.checkpoints.add({
        id: 'cp1',
        race_id: race.id,
        checkpoint_number: 1,
        checkpoint_name: 'CP1',
        order_sequence: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      await raceDAL.delete(race.id);

      const deletedRace = await raceDAL.getById(race.id);
      const checkpoints = await db.checkpoints.where('race_id').equals(race.id).toArray();

      expect(deletedRace).toBeUndefined();
      expect(checkpoints).toHaveLength(0);
    });
  });

  describe('getAll', () => {
    test('returns races ordered by date (newest first)', async () => {
      await raceDAL.create({
        name: 'Race 1',
        date: '2025-11-20',
        start_time: '07:00:00',
        runner_range_start: 1,
        runner_range_end: 100
      });

      await raceDAL.create({
        name: 'Race 2',
        date: '2025-11-22',
        start_time: '07:00:00',
        runner_range_start: 1,
        runner_range_end: 100
      });

      await raceDAL.create({
        name: 'Race 3',
        date: '2025-11-21',
        start_time: '07:00:00',
        runner_range_start: 1,
        runner_range_end: 100
      });

      const races = await raceDAL.getAll();

      expect(races).toHaveLength(3);
      expect(races[0].name).toBe('Race 2'); // Newest
      expect(races[1].name).toBe('Race 3');
      expect(races[2].name).toBe('Race 1'); // Oldest
    });
  });

  describe('exists', () => {
    test('returns true for existing race', async () => {
      const race = await raceDAL.create({
        name: 'Test Race',
        date: '2025-11-22',
        start_time: '07:00:00',
        runner_range_start: 1,
        runner_range_end: 100
      });

      const exists = await raceDAL.exists(race.id);
      expect(exists).toBe(true);
    });

    test('returns false for non-existent race', async () => {
      const exists = await raceDAL.exists('non-existent-id');
      expect(exists).toBe(false);
    });
  });
});
```

---

### Story 1.3: Data Access Layer - Runner Operations

**As a** developer  
**I want** comprehensive runner management operations  
**So that** I can efficiently handle runner data and status updates

**Story Points:** 8  
**Sprint:** Sprint 1

#### Acceptance Criteria

- [ ] RunnerDAL implements all CRUD operations
- [ ] Bulk operations support batch processing
- [ ] Status transitions are validated
- [ ] Query operations support filtering by race, status, and wave
- [ ] Runner number uniqueness is enforced within race
- [ ] Operations include proper error handling

#### Technical Implementation

**File:** `src/database/dal/RunnerDAL.ts`

```typescript
import { db } from '../schema';
import type { Runner, RunnerStatus } from '../schema';
import { v4 as uuidv4 } from 'uuid';

// SOLID: Single Responsibility
export class RunnerDAL {
  
  /**
   * Create single runner
   */
  async create(runnerData: Omit<Runner, 'id' | 'created_at' | 'updated_at'>): Promise<Runner> {
    // Validate runner number uniqueness
    const existing = await this.getByRunnerNumber(runnerData.race_id, runnerData.runner_number);
    if (existing) {
      throw new Error(`Runner number ${runnerData.runner_number} already exists in this race`);
    }

    const now = new Date().toISOString();
    const runner: Runner = {
      ...runnerData,
      id: uuidv4(),
      created_at: now,
      updated_at: now
    };
    
    await db.runners.add(runner);
    return runner;
  }

  /**
   * Bulk create runners (DRY: reduces duplicate code)
   */
  async bulkCreate(runnersData: Omit<Runner, 'id' | 'created_at' | 'updated_at'>[]): Promise<Runner[]> {
    const now = new Date().toISOString();
    const runners: Runner[] = runnersData.map(data => ({
      ...data,
      id: uuidv4(),
      created_at: now,
      updated_at: now
    }));
    
    await db.runners.bulkAdd(runners);
    return runners;
  }

  /**
   * Get runner by ID
   */
  async getById(id: string): Promise<Runner | undefined> {
    return await db.runners.get(id);
  }

  /**
   * Get runner by race and runner number
   */
  async getByRunnerNumber(raceId: string, runnerNumber: number): Promise<Runner | undefined> {
    return await db.runners
      .where('[race_id+runner_number]')
      .equals([raceId, runnerNumber])
      .first();
  }

  /**
   * Get all runners for a race
   */
  async getByRace(raceId: string): Promise<Runner[]> {
    return await db.runners
      .where('race_id')
      .equals(raceId)
      .sortBy('runner_number');
  }

  /**
   * Get runners by status
   */
  async getByStatus(raceId: string, status: RunnerStatus): Promise<Runner[]> {
    return await db.runners
      .where({ race_id: raceId, status })
      .sortBy('runner_number');
  }

  /**
   * Get runners by wave batch
   */
  async getByWave(raceId: string, waveBatch: number): Promise<Runner[]> {
    return await db.runners
      .where({ race_id: raceId, wave_batch: waveBatch })
      .sortBy('runner_number');
  }

  /**
   * Update runner status
   */
  async updateStatus(runnerId: string, status: RunnerStatus): Promise<void> {
    await db.runners.update(runnerId, {
      status,
      updated_at: new Date().toISOString()
    });
  }

  /**
   * Update runner details
   */
  async update(id: string, updates: Partial<Omit<Runner, 'id' | 'created_at'>>): Promise<void> {
    await db.runners.update(id, {
      ...updates,
      updated_at: new Date().toISOString()
    });
  }

  /**
   * Delete runner
   */
  async delete(id: string): Promise<void> {
    await db.transaction('rw', db.runners, db.checkpointTimes, async () => {
      // Delete related checkpoint times
      await db.checkpointTimes.where('runner_id').equals(id).delete();
      await db.runners.delete(id);
    });
  }

  /**
   * Get runner count by race
   */
  async countByRace(raceId: string): Promise<number> {
    return await db.runners.where('race_id').equals(raceId).count();
  }

  /**
   * Get runner statistics for race
   */
  async getRaceStatistics(raceId: string): Promise<RunnerStatistics> {
    const runners = await this.getByRace(raceId);
    
    return {
      total: runners.length,
      notStarted: runners.filter(r => r.status === 'not_started').length,
      inProgress: runners.filter(r => r.status === 'in_progress').length,
      finished: runners.filter(r => r.status === 'finished').length,
      dns: runners.filter(r => r.status === 'dns').length,
      dnf: runners.filter(r => r.status === 'dnf').length,
      withdrawn: runners.filter(r => r.status === 'withdrawn').length,
      byGender: {
        M: runners.filter(r => r.gender === 'M').length,
        F: runners.filter(r => r.gender === 'F').length,
        X: runners.filter(r => r.gender === 'X').length
      }
    };
  }
}

export interface RunnerStatistics {
  total: number;
  notStarted: number;
  inProgress: number;
  finished: number;
  dns: number;
  dnf: number;
  withdrawn: number;
  byGender: {
    M: number;
    F: number;
    X: number;
  };
}

export const runnerDAL = new RunnerDAL();
```

#### Testing Strategy

**File:** `src/database/dal/__tests__/RunnerDAL.test.ts`

```typescript
import { db } from '../../schema';
import { runnerDAL } from '../RunnerDAL';
import { raceDAL } from '../RaceDAL';
import type { Runner } from '../../schema';

describe('RunnerDAL', () => {
  let testRaceId: string;

  beforeEach(async () => {
    await db.delete();
    await db.open();
    
    // Create test race
    const race = await raceDAL.create({
      name: 'Test Race',
      date: '2025-11-22',
      start_time: '07:00:00',
      runner_range_start: 1,
      runner_range_end: 100
    });
    testRaceId = race.id;
  });

  afterAll(async () => {
    await db.delete();
  });

  describe('create', () => {
    test('creates runner with auto-generated fields', async () => {
      const runner = await runnerDAL.create({
        race_id: testRaceId,
        runner_number: 1,
        first_name: 'John',
        last_name: 'Doe',
        gender: 'M',
        wave_batch: 1,
        status: 'not_started'
      });

      expect(runner.id).toBeDefined();
      expect(runner.created_at).toBeDefined();
      expect(runner.updated_at).toBeDefined();
    });

    test('throws error for duplicate runner number in same race', async () => {
      await runnerDAL.create({
        race_id: testRaceId,
        runner_number: 1,
        gender: 'M',
        wave_batch: 1,
        status: 'not_started'
      });

      await expect(runnerDAL.create({
        race_id: testRaceId,
        runner_number: 1,
        gender: 'F',
        wave_batch: 1,
        status: 'not_started'
      })).rejects.toThrow('Runner number 1 already exists');
    });
  });

  describe('bulkCreate', () => {
    test('creates multiple runners efficiently', async () => {
      const runnersData = Array.from({ length: 50 }, (_, i) => ({
        race_id: testRaceId,
        runner_number: i + 1,
        gender: (i % 2 === 0 ? 'M' : 'F') as 'M' | 'F',
        wave_batch: Math.floor(i / 25) + 1,
        status: 'not_started' as const
      }));

      const runners = await runnerDAL.bulkCreate(runnersData);

      expect(runners).toHaveLength(50);
      expect(runners.every(r => r.id)).toBe(true);
    });
  });

  describe('getByRunnerNumber', () => {
    test('retrieves runner by race and number', async () => {
      await runnerDAL.create({
        race_id: testRaceId,
        runner_number: 42,
        gender: 'M',
        wave_batch: 1,
        status: 'not_started'
      });

      const runner = await runnerDAL.getByRunnerNumber(testRaceId, 42);

      expect(runner).toBeDefined();
      expect(runner?.runner_number).toBe(42);
    });
  });

  describe('getByStatus', () => {
    test('filters runners by status', async () => {
      await runnerDAL.bulkCreate([
        {
          race_id: testRaceId,
          runner_number: 1,
          gender: 'M',
          wave_batch: 1,
          status: 'not_started'
        },
        {
          race_id: testRaceId,
          runner_number: 2,
          gender: 'F',
          wave_batch: 1,
          status: 'in_progress'
        },
        {
          race_id: testRaceId,
          runner_number: 3,
          gender: 'M',
          wave_batch: 1,
          status: 'in_progress'
        }
      ]);

      const inProgress = await runnerDAL.getByStatus(testRaceId, 'in_progress');

      expect(inProgress).toHaveLength(2);
      expect(inProgress.every(r => r.status === 'in_progress')).toBe(true);
    });
  });

  describe('getRaceStatistics', () => {
    test('calculates correct statistics', async () => {
      await runnerDAL.bulkCreate([
        { race_id: testRaceId, runner_number: 1, gender: 'M', wave_batch: 1, status: 'not_started' },
        { race_id: testRaceId, runner_number: 2, gender: 'M', wave_batch: 1, status: 'in_progress' },
        { race_id: testRaceId, runner_number: 3, gender: 'F', wave_batch: 1, status: 'finished' },
        { race_id: testRaceId, runner_number: 4, gender: 'F', wave_batch: 1, status: 'dns' },
        { race_id: testRaceId, runner_number: 5, gender: 'M', wave_batch: 1, status: 'dnf' }
      ]);

      const stats = await runnerDAL.getRaceStatistics(testRaceId);

      expect(stats.total).toBe(5);
      expect(stats.notStarted).toBe(1);
      expect(stats.inProgress).toBe(1);
      expect(stats.finished).toBe(1);
      expect(stats.dns).toBe(1);
      expect(stats.dnf).toBe(1);
      expect(stats.byGender.M).toBe(3);
      expect(stats.byGender.F).toBe(2);
    });
  });
});
```

---

## Sprint Planning

### Sprint 1: Database Core (Weeks 1-2)

**Goal:** Establish database foundation with schema and basic DAL operations

**Stories:**
- Story 1.1: Database Schema Initialization (5 points)
- Story 1.2: Race DAL (8 points)
- Story 1.3: Runner DAL (8 points)

**Total Story Points:** 21

**Definition of Done:**
- [ ] All unit tests passing (>90% coverage)
- [ ] TypeScript compiles without errors
- [ ] Database initializes successfully across all browsers
- [ ] Code reviewed and approved
- [ ] Documentation updated

### Sprint 2: Remaining DAL Layers (Weeks 3-4)

**Goal:** Complete remaining database access layers

**Stories:** (To be detailed in remaining epics)
- Story 1.4: Checkpoint DAL (5 points)
- Story 1.5: CheckpointTime DAL (8 points)
- Story 1.6: BaseStationCallIn DAL (5 points)
- Story 1.7: Transaction Management (8 points)

**Total Story Points:** 26

---

## SOLID Principles Applied

### Single Responsibility Principle (SRP)
- Each DAL class handles only one entity type
- Database schema separated from business logic
- Timestamp management centralized

### Open/Closed Principle (OCP)
- DAL methods can be extended without modification
- Generic interfaces allow new implementations

### Liskov Substitution Principle (LSP)
- All DAL classes follow consistent interface patterns
- Return types are predictable and consistent

### Interface Segregation Principle (ISP)
- Type interfaces are focused and minimal
- No unnecessary properties forced on clients

### Dependency Inversion Principle (DIP)
- Business logic depends on DAL abstractions, not concrete implementations
- Database can be swapped without affecting upper layers

## DRY Principles Applied

- Timestamp generation centralized in each DAL method
- UUID generation uses single import
- Transaction patterns reusable across operations
- Test setup/teardown shared across test suites
- Common query patterns extracted to methods

---

## Next Steps

Continue to Epic 2: Checkpoint Operations for user-facing features built on this foundation.
