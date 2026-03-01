# Epic 3: Base Station Operations Module

**Epic Owner:** Frontend Team Lead  
**Priority:** P0 (Blocker)  
**Estimated Effort:** 2 Sprints (4 weeks)  
**Dependencies:** Epic 1 (Database Foundation), Epic 2 (Checkpoint Operations)

## Epic Description

Implement base station operations for bulk data entry, race overview, and live leaderboard calculations. This epic enables central command to efficiently process checkpoint call-ins and monitor overall race progress.

---

## User Stories

### Story 3.1: Bulk Time Entry Interface

**As a** base station operator  
**I want** to enter finish times for groups of runners efficiently  
**So that** I can quickly process checkpoint call-ins

**Story Points:** 13  
**Sprint:** Sprint 4

#### Acceptance Criteria

- [ ] Support for common time entry (single time for multiple runners)
- [ ] Flexible runner input: individual numbers, ranges, and combinations
- [ ] Input validation and error handling
- [ ] Visual confirmation of successful entry
- [ ] Batch processing with transaction safety
- [ ] Support for formats: "101, 105-107, 110, 115-120"
- [ ] Duplicate detection and warnings
- [ ] Ability to undo last entry

#### Technical Implementation

**File:** `src/features/baseStation/services/BulkEntryService.ts`

```typescript
import { db } from '../../../database/schema';
import { checkpointTimeDAL } from '../../../database/dal/CheckpointTimeDAL';
import { runnerDAL } from '../../../database/dal/RunnerDAL';
import { baseStationCallInDAL } from '../../../database/dal/BaseStationCallInDAL';

// SOLID: Single Responsibility
export class BulkEntryService {
  
  /**
   * Parse runner input string into array of numbers
   * DRY: Centralized parsing logic
   * 
   * Examples:
   *   "1, 5, 10" => [1, 5, 10]
   *   "100-102, 105" => [100, 101, 102, 105]
   *   "1-3, 5, 10-12" => [1, 2, 3, 5, 10, 11, 12]
   */
  parseRunnerInput(input: string): number[] {
    const parts = input.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const numbers: number[] = [];
    
    for (const part of parts) {
      if (part.includes('-')) {
        // Range: "100-102"
        const [startStr, endStr] = part.split('-').map(s => s.trim());
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        
        if (isNaN(start) || isNaN(end)) {
          throw new Error(`Invalid range: ${part}`);
        }
        
        if (start > end) {
          throw new Error(`Invalid range (start > end): ${part}`);
        }
        
        for (let i = start; i <= end; i++) {
          numbers.push(i);
        }
      } else {
        // Single number: "105"
        const num = parseInt(part, 10);
        if (isNaN(num)) {
          throw new Error(`Invalid number: ${part}`);
        }
        numbers.push(num);
      }
    }
    
    // Remove duplicates and sort
    return [...new Set(numbers)].sort((a, b) => a - b);
  }

  /**
   * Calculate time group from common time
   */
  private calculateTimeGroup(commonTime: Date): string {
    const endTime = new Date(commonTime);
    endTime.setMinutes(endTime.getMinutes() + 5);
    
    const format = (date: Date) => {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    };
    
    return `${format(commonTime)}-${format(endTime)}`;
  }

  /**
   * Bulk entry of checkpoint times
   */
  async bulkEntry(
    checkpointId: string,
    raceId: string,
    commonTimeStr: string,
    runnerInput: string
  ): Promise<BulkEntryResult> {
    try {
      // Parse inputs
      const runnerNumbers = this.parseRunnerInput(runnerInput);
      const commonTime = new Date(commonTimeStr);
      const timeGroup = this.calculateTimeGroup(commonTime);
      
      if (runnerNumbers.length === 0) {
        return {
          success: false,
          error: 'No valid runner numbers provided'
        };
      }

      // Validate common time
      if (isNaN(commonTime.getTime())) {
        return {
          success: false,
          error: 'Invalid time format'
        };
      }

      const results: RunnerEntryResult[] = [];
      const now = new Date().toISOString();

      // Process in transaction
      await db.transaction('rw', 
        db.checkpointTimes, 
        db.baseStationCallIns,
        db.runners,
        async () => {
          for (const runnerNumber of runnerNumbers) {
            // Get runner
            const runner = await runnerDAL.getByRunnerNumber(raceId, runnerNumber);
            
            if (!runner) {
              results.push({
                runnerNumber,
                success: false,
                error: `Runner ${runnerNumber} not found`
              });
              continue;
            }

            // Check for existing entry
            const existing = await checkpointTimeDAL.getByRunnerAndCheckpoint(
              runner.id,
              checkpointId
            );

            if (existing) {
              results.push({
                runnerNumber,
                success: false,
                error: `Runner ${runnerNumber} already recorded`,
                duplicate: true
              });
              continue;
            }

            // Create checkpoint time
            const checkpointTime = await checkpointTimeDAL.create({
              checkpoint_id: checkpointId,
              runner_id: runner.id,
              race_id: raceId,
              runner_number: runnerNumber,
              actual_time: commonTimeStr,  // Use common time as actual
              common_time: commonTimeStr,
              time_group: timeGroup,
              called_in: true,
              call_in_time: now
            });

            results.push({
              runnerNumber,
              success: true,
              checkpointTimeId: checkpointTime.id
            });
          }

          // Record the bulk entry
          await baseStationCallInDAL.create({
            checkpoint_id: checkpointId,
            common_time: commonTimeStr,
            time_group: timeGroup,
            runner_numbers: runnerNumbers,
            entered_by: 'base_station',
            entered_at: now
          });
        }
      );

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      return {
        success: true,
        total: runnerNumbers.length,
        successful: successful.length,
        failed: failed.length,
        duplicates: failed.filter(r => r.duplicate).length,
        results
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get recent bulk entries for checkpoint
   */
  async getRecentEntries(
    checkpointId: string,
    limit: number = 10
  ): Promise<BulkEntryHistory[]> {
    const callIns = await baseStationCallInDAL.getByCheckpoint(checkpointId);
    
    return callIns
      .sort((a, b) => b.entered_at.localeCompare(a.entered_at))
      .slice(0, limit)
      .map(callIn => ({
        id: callIn.id,
        timeGroup: callIn.time_group,
        runnerNumbers: callIn.runner_numbers,
        enteredAt: callIn.entered_at,
        count: callIn.runner_numbers.length
      }));
  }

  /**
   * Undo last bulk entry
   */
  async undoEntry(callInId: string): Promise<UndoResult> {
    try {
      const callIn = await baseStationCallInDAL.getById(callInId);
      
      if (!callIn) {
        return {
          success: false,
          error: 'Entry not found'
        };
      }

      await db.transaction('rw', db.checkpointTimes, db.baseStationCallIns, async () => {
        // Delete checkpoint times for this bulk entry
        const times = await checkpointTimeDAL.getByTimeGroup(
          callIn.checkpoint_id,
          callIn.time_group
        );

        for (const time of times) {
          if (callIn.runner_numbers.includes(time.runner_number)) {
            await checkpointTimeDAL.delete(time.id);
          }
        }

        // Delete the call-in record
        await baseStationCallInDAL.delete(callInId);
      });

      return {
        success: true,
        deletedCount: callIn.runner_numbers.length
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export interface BulkEntryResult {
  success: boolean;
  total?: number;
  successful?: number;
  failed?: number;
  duplicates?: number;
  results?: RunnerEntryResult[];
  error?: string;
}

export interface RunnerEntryResult {
  runnerNumber: number;
  success: boolean;
  checkpointTimeId?: string;
  error?: string;
  duplicate?: boolean;
}

export interface BulkEntryHistory {
  id: string;
  timeGroup: string;
  runnerNumbers: number[];
  enteredAt: string;
  count: number;
}

export interface UndoResult {
  success: boolean;
  deletedCount?: number;
  error?: string;
}

export const bulkEntryService = new BulkEntryService();
```

#### Testing Strategy

**File:** `src/features/baseStation/services/__tests__/BulkEntryService.test.ts`

```typescript
import { db } from '../../../../database/schema';
import { bulkEntryService } from '../BulkEntryService';
import { raceDAL } from '../../../../database/dal/RaceDAL';
import { checkpointDAL } from '../../../../database/dal/CheckpointDAL';
import { runnerDAL } from '../../../../database/dal/RunnerDAL';

describe('BulkEntryService', () => {
  let raceId: string;
  let checkpointId: string;

  beforeEach(async () => {
    await db.delete();
    await db.open();

    // Setup test data
    const race = await raceDAL.create({
      name: 'Test Race',
      date: '2025-11-22',
      start_time: '07:00:00',
      runner_range_start: 1,
      runner_range_end: 150
    });
    raceId = race.id;

    const checkpoint = await checkpointDAL.create({
      race_id: raceId,
      checkpoint_number: 1,
      checkpoint_name: 'Finish',
      order_sequence: 1
    });
    checkpointId = checkpoint.id;

    // Create test runners
    const runners = Array.from({ length: 20 }, (_, i) => ({
      race_id: raceId,
      runner_number: i + 100,
      gender: (i % 2 === 0 ? 'M' : 'F') as 'M' | 'F',
      wave_batch: 1,
      status: 'in_progress' as const
    }));
    await runnerDAL.bulkCreate(runners);
  });

  describe('parseRunnerInput', () => {
    test('parses single numbers', () => {
      const result = bulkEntryService.parseRunnerInput('1, 5, 10');
      expect(result).toEqual([1, 5, 10]);
    });

    test('parses ranges', () => {
      const result = bulkEntryService.parseRunnerInput('100-102, 105');
      expect(result).toEqual([100, 101, 102, 105]);
    });

    test('parses mixed format', () => {
      const result = bulkEntryService.parseRunnerInput('1-3, 5, 10-12');
      expect(result).toEqual([1, 2, 3, 5, 10, 11, 12]);
    });

    test('handles whitespace', () => {
      const result = bulkEntryService.parseRunnerInput('  1  ,  5  ,  10-12  ');
      expect(result).toEqual([1, 5, 10, 11, 12]);
    });

    test('removes duplicates', () => {
      const result = bulkEntryService.parseRunnerInput('1, 2, 1, 3, 2');
      expect(result).toEqual([1, 2, 3]);
    });

    test('sorts numbers', () => {
      const result = bulkEntryService.parseRunnerInput('10, 5, 1, 3');
      expect(result).toEqual([1, 3, 5, 10]);
    });

    test('throws error for invalid range', () => {
      expect(() => bulkEntryService.parseRunnerInput('10-5')).toThrow('Invalid range');
    });

    test('throws error for invalid number', () => {
      expect(() => bulkEntryService.parseRunnerInput('1, abc, 5')).toThrow('Invalid number');
    });
  });

  describe('bulkEntry', () => {
    test('creates checkpoint times for all runners', async () => {
      const result = await bulkEntryService.bulkEntry(
        checkpointId,
        raceId,
        '2025-11-22T08:00:00.000Z',
        '100-102, 105'
      );

      expect(result.success).toBe(true);
      expect(result.successful).toBe(4);
      expect(result.failed).toBe(0);
    });

    test('handles non-existent runners', async () => {
      const result = await bulkEntryService.bulkEntry(
        checkpointId,
        raceId,
        '2025-11-22T08:00:00.000Z',
        '100, 999'  // 999 doesn't exist
      );

      expect(result.success).toBe(true);
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.results?.find(r => r.runnerNumber === 999)?.error).toContain('not found');
    });

    test('detects duplicates', async () => {
      // First entry
      await bulkEntryService.bulkEntry(
        checkpointId,
        raceId,
        '2025-11-22T08:00:00.000Z',
        '100'
      );

      // Duplicate entry
      const result = await bulkEntryService.bulkEntry(
        checkpointId,
        raceId,
        '2025-11-22T08:05:00.000Z',
        '100'
      );

      expect(result.success).toBe(true);
      expect(result.duplicates).toBe(1);
      expect(result.results?.[0].duplicate).toBe(true);
    });

    test('creates base station call-in record', async () => {
      await bulkEntryService.bulkEntry(
        checkpointId,
        raceId,
        '2025-11-22T08:00:00.000Z',
        '100-102'
      );

      const callIns = await db.baseStationCallIns
        .where('checkpoint_id')
        .equals(checkpointId)
        .toArray();

      expect(callIns).toHaveLength(1);
      expect(callIns[0].runner_numbers).toEqual([100, 101, 102]);
      expect(callIns[0].time_group).toBe('08:00-08:05');
    });

    test('processes in transaction (all or nothing)', async () => {
      // This would test transaction rollback if implemented
      // For now, just verify all records are created together
      
      const result = await bulkEntryService.bulkEntry(
        checkpointId,
        raceId,
        '2025-11-22T08:00:00.000Z',
        '100-110'
      );

      const times = await db.checkpointTimes
        .where('checkpoint_id')
        .equals(checkpointId)
        .toArray();

      expect(times.length).toBe(result.successful);
    });
  });

  describe('undoEntry', () => {
    test('removes checkpoint times and call-in record', async () => {
      const entryResult = await bulkEntryService.bulkEntry(
        checkpointId,
        raceId,
        '2025-11-22T08:00:00.000Z',
        '100-102'
      );

      const callIns = await db.baseStationCallIns
        .where('checkpoint_id')
        .equals(checkpointId)
        .toArray();

      const undoResult = await bulkEntryService.undoEntry(callIns[0].id);

      expect(undoResult.success).toBe(true);
      expect(undoResult.deletedCount).toBe(3);

      const remainingTimes = await db.checkpointTimes
        .where('checkpoint_id')
        .equals(checkpointId)
        .toArray();

      expect(remainingTimes).toHaveLength(0);
    });
  });
});
```

---

### Story 3.2: Live Leaderboard Calculation

**As a** base station operator  
**I want** to see live leaderboards by gender and wave  
**So that** I can track race leaders and performance

**Story Points:** 13  
**Sprint:** Sprint 5

#### Acceptance Criteria

- [ ] Calculate elapsed time from race start for each runner
- [ ] Group leaderboards by gender and wave batch
- [ ] Display rank, runner number, name, last checkpoint, and time
- [ ] Auto-refresh as new data arrives
- [ ] Filter by checkpoint to see standings at each point
- [ ] Show top 10 by default with option to expand
- [ ] Calculate pace per checkpoint segment

#### Technical Implementation

**File:** `src/features/baseStation/services/LeaderboardService.ts`

```typescript
import { db } from '../../../database/schema';
import { raceDAL } from '../../../database/dal/RaceDAL';
import { runnerDAL } from '../../../database/dal/RunnerDAL';
import { checkpointTimeDAL } from '../../../database/dal/CheckpointTimeDAL';
import { checkpointDAL } from '../../../database/dal/CheckpointDAL';

// SOLID: Single Responsibility
export class LeaderboardService {
  
  /**
   * Calculate leaderboard for specific checkpoint
   */
  async calculateLeaderboard(
    raceId: string,
    checkpointId: string,
    groupBy: 'gender' | 'wave' = 'gender'
  ): Promise<Map<string, LeaderboardEntry[]>> {
    const race = await raceDAL.getById(raceId);
    if (!race) throw new Error('Race not found');

    const raceStartTime = new Date(`${race.date}T${race.start_time}`);
    
    // Get all runners who passed this checkpoint
    const times = await checkpointTimeDAL.getByCheckpoint(checkpointId);
    
    if (times.length === 0) {
      return new Map();
    }

    // Get runner details
    const runnerIds = [...new Set(times.map(t => t.runner_id))];
    const runners = await db.runners.bulkGet(runnerIds);
    
    // Build leaderboard entries
    const entries: LeaderboardEntry[] = runners
      .filter((r): r is NonNullable<typeof r> => r !== undefined)
      .map(runner => {
        const runnerTime = times.find(t => t.runner_id === runner.id);
        if (!runnerTime) return null;

        const checkpointTime = new Date(runnerTime.actual_time);
        const elapsedMs = checkpointTime.getTime() - raceStartTime.getTime();

        return {
          rank: 0,  // Assigned below
          runnerId: runner.id,
          runnerNumber: runner.runner_number,
          name: `${runner.first_name || ''} ${runner.last_name || ''}`.trim() || `Runner ${runner.runner_number}`,
          gender: runner.gender,
          waveBatch: runner.wave_batch,
          checkpointTime: runnerTime.actual_time,
          elapsedTime: elapsedMs,
          elapsedFormatted: this.formatElapsedTime(elapsedMs)
        };
      })
      .filter((e): e is LeaderboardEntry => e !== null)
      .sort((a, b) => a.elapsedTime - b.elapsedTime);

    // Group by gender or wave
    const grouped = new Map<string, LeaderboardEntry[]>();
    
    entries.forEach(entry => {
      const key = groupBy === 'gender' ? entry.gender : entry.waveBatch.toString();
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(entry);
    });

    // Assign ranks within each group
    grouped.forEach(group => {
      group.forEach((entry, index) => {
        entry.rank = index + 1;
      });
    });

    return grouped;
  }

  /**
   * Get overall race leaders (top N across all categories)
   */
  async getOverallLeaders(
    raceId: string,
    checkpointId: string,
    limit: number = 10
  ): Promise<LeaderboardEntry[]> {
    const leaderboard = await this.calculateLeaderboard(raceId, checkpointId, 'gender');
    
    // Flatten all groups and sort by elapsed time
    const allEntries: LeaderboardEntry[] = [];
    leaderboard.forEach(group => allEntries.push(...group));
    
    allEntries.sort((a, b) => a.elapsedTime - b.elapsedTime);
    
    // Re-rank for overall
    allEntries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return allEntries.slice(0, limit);
  }

  /**
   * Calculate checkpoint segment times
   */
  async getCheckpointSegments(
    raceId: string,
    runnerId: string
  ): Promise<CheckpointSegment[]> {
    const checkpoints = await checkpointDAL.getByRace(raceId);
    const times = await checkpointTimeDAL.getByRunner(runnerId);
    
    const segments: CheckpointSegment[] = [];
    let previousTime: Date | null = null;

    checkpoints
      .sort((a, b) => a.order_sequence - b.order_sequence)
      .forEach(checkpoint => {
        const time = times.find(t => t.checkpoint_id === checkpoint.id);
        
        if (time) {
          const currentTime = new Date(time.actual_time);
          const segmentTime = previousTime 
            ? currentTime.getTime() - previousTime.getTime()
            : 0;

          segments.push({
            checkpointNumber: checkpoint.checkpoint_number,
            checkpointName: checkpoint.checkpoint_name,
            arrivalTime: time.actual_time,
            segmentTime: segmentTime,
            segmentFormatted: this.formatElapsedTime(segmentTime)
          });

          previousTime = currentTime;
        }
      });

    return segments;
  }

  /**
   * Format elapsed time as HH:MM:SS
   */
  private formatElapsedTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get leaderboard statistics
   */
  async getLeaderboardStats(
    raceId: string,
    checkpointId: string
  ): Promise<LeaderboardStats> {
    const leaderboard = await this.calculateLeaderboard(raceId, checkpointId, 'gender');
    
    const totalRunners = Array.from(leaderboard.values()).reduce(
      (sum, group) => sum + group.length,
      0
    );

    const categoryStats = Array.from(leaderboard.entries()).map(([category, entries]) => ({
      category,
      count: entries.length,
      leader: entries[0],
      averageTime: entries.reduce((sum, e) => sum + e.elapsedTime, 0) / entries.length
    }));

    return {
      totalRunners,
      categoryStats
    };
  }
}

export interface LeaderboardEntry {
  rank: number;
  runnerId: string;
  runnerNumber: number;
  name: string;
  gender: 'M' | 'F' | 'X';
  waveBatch: number;
  checkpointTime: string;
  elapsedTime: number;
  elapsedFormatted: string;
}

export interface CheckpointSegment {
  checkpointNumber: number;
  checkpointName: string;
  arrivalTime: string;
  segmentTime: number;
  segmentFormatted: string;
}

export interface LeaderboardStats {
  totalRunners: number;
  categoryStats: CategoryStats[];
}

export interface CategoryStats {
  category: string;
  count: number;
  leader: LeaderboardEntry;
  averageTime: number;
}

export const leaderboardService = new LeaderboardService();
```

---

## Sprint Planning

### Sprint 4: Base Station - Bulk Entry (Weeks 7-8)

**Goal:** Enable efficient bulk data entry for finish times

**Stories:**
- Story 3.1: Bulk Time Entry Interface (13 points)

**Total Story Points:** 13

### Sprint 5: Base Station - Leaderboard & Analytics (Weeks 9-10)

**Goal:** Deliver real-time race analytics and leaderboards

**Stories:**
- Story 3.2: Live Leaderboard Calculation (13 points)

**Total Story Points:** 13

---

Continue to Epic 4 for Export/Import functionality...
