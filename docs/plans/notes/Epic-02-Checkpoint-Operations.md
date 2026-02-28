# Epic 2: Checkpoint Operations Module

**Epic Owner:** Frontend Team Lead  
**Priority:** P0 (Blocker)  
**Estimated Effort:** 3 Sprints (6 weeks)  
**Dependencies:** Epic 1 (Database Foundation Layer)

## Epic Description

Implement the complete checkpoint operations module, enabling volunteers to mark off runners, generate callout sheets, and view real-time race progress. This epic delivers the core field operations capability for race tracking.

---

## User Stories

### Story 2.1: Runner Mark-Off Interface

**As a** checkpoint volunteer  
**I want** to quickly mark runners as they pass through  
**So that** I can accurately record checkpoint passage times

**Story Points:** 13  
**Sprint:** Sprint 3

#### Acceptance Criteria

- [ ] Grid layout displays all runner numbers for the race
- [ ] Tapping a runner number records actual timestamp
- [ ] Common time (5-minute grouped) is calculated automatically
- [ ] Time group label is generated (e.g., "07:40-07:45")
- [ ] Visual feedback confirms successful mark-off
- [ ] Search/filter functionality allows quick runner lookup
- [ ] Marked runners change visual state (color/icon)
- [ ] Bulk number entry is supported
- [ ] Works offline without any network dependency

#### Technical Implementation

**File:** `src/features/checkpoint/services/MarkOffService.ts`

```typescript
import { db } from '../../../database/schema';
import { checkpointTimeDAL } from '../../../database/dal/CheckpointTimeDAL';
import { runnerDAL } from '../../../database/dal/RunnerDAL';
import type { CheckpointTime } from '../../../database/schema';

// SOLID: Single Responsibility - Only handles mark-off logic
export class MarkOffService {
  
  /**
   * Calculate common time (rounded to 5-minute interval)
   * DRY: Centralized time calculation logic
   */
  private calculateCommonTime(actualTime: Date): Date {
    const minutes = actualTime.getMinutes();
    const roundedMinutes = Math.floor(minutes / 5) * 5;
    const commonTime = new Date(actualTime);
    commonTime.setMinutes(roundedMinutes, 0, 0);
    return commonTime;
  }

  /**
   * Format time group label
   * DRY: Consistent time group formatting
   */
  private formatTimeGroup(commonTime: Date): string {
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
   * Mark runner at checkpoint
   */
  async markRunner(
    runnerId: string,
    checkpointId: string,
    raceId: string,
    runnerNumber: number,
    actualTime: Date = new Date()
  ): Promise<MarkOffResult> {
    try {
      // Check if already marked
      const existing = await checkpointTimeDAL.getByRunnerAndCheckpoint(
        runnerId,
        checkpointId
      );

      if (existing) {
        return {
          success: false,
          error: 'Runner already marked at this checkpoint',
          existingTime: existing
        };
      }

      // Calculate times
      const commonTime = this.calculateCommonTime(actualTime);
      const timeGroup = this.formatTimeGroup(commonTime);

      // Create checkpoint time record
      const checkpointTime = await checkpointTimeDAL.create({
        checkpoint_id: checkpointId,
        runner_id: runnerId,
        race_id: raceId,
        runner_number: runnerNumber,
        actual_time: actualTime.toISOString(),
        common_time: commonTime.toISOString(),
        time_group: timeGroup,
        called_in: false
      });

      // Update runner status if first checkpoint
      await this.updateRunnerProgress(runnerId, checkpointId);

      return {
        success: true,
        checkpointTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Bulk mark runners (e.g., if entry missed initially)
   */
  async bulkMarkRunners(
    runnerIds: string[],
    checkpointId: string,
    raceId: string,
    commonTime: Date
  ): Promise<BulkMarkOffResult> {
    const results: MarkOffResult[] = [];
    const timeGroup = this.formatTimeGroup(commonTime);

    await db.transaction('rw', db.checkpointTimes, db.runners, async () => {
      for (const runnerId of runnerIds) {
        const runner = await runnerDAL.getById(runnerId);
        if (!runner) continue;

        const result = await this.markRunner(
          runnerId,
          checkpointId,
          raceId,
          runner.runner_number,
          commonTime
        );
        results.push(result);
      }
    });

    return {
      total: runnerIds.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Update runner status based on checkpoint progress
   */
  private async updateRunnerProgress(
    runnerId: string,
    checkpointId: string
  ): Promise<void> {
    const runner = await runnerDAL.getById(runnerId);
    if (!runner) return;

    // If currently not_started, move to in_progress
    if (runner.status === 'not_started') {
      await runnerDAL.updateStatus(runnerId, 'in_progress');
    }

    // Check if this is the finish checkpoint
    const checkpoint = await db.checkpoints.get(checkpointId);
    if (checkpoint?.checkpoint_name.toLowerCase().includes('finish')) {
      await runnerDAL.updateStatus(runnerId, 'finished');
    }
  }

  /**
   * Get mark-off status for all runners at checkpoint
   */
  async getMarkOffStatus(
    raceId: string,
    checkpointId: string
  ): Promise<RunnerMarkOffStatus[]> {
    const runners = await runnerDAL.getByRace(raceId);
    const times = await checkpointTimeDAL.getByCheckpoint(checkpointId);

    const timeMap = new Map(times.map(t => [t.runner_id, t]));

    return runners.map(runner => ({
      runnerId: runner.id,
      runnerNumber: runner.runner_number,
      name: `${runner.first_name || ''} ${runner.last_name || ''}`.trim(),
      gender: runner.gender,
      waveBatch: runner.wave_batch,
      status: runner.status,
      marked: timeMap.has(runner.id),
      checkpointTime: timeMap.get(runner.id)
    }));
  }
}

export interface MarkOffResult {
  success: boolean;
  checkpointTime?: CheckpointTime;
  existingTime?: CheckpointTime;
  error?: string;
}

export interface BulkMarkOffResult {
  total: number;
  successful: number;
  failed: number;
  results: MarkOffResult[];
}

export interface RunnerMarkOffStatus {
  runnerId: string;
  runnerNumber: number;
  name: string;
  gender: 'M' | 'F' | 'X';
  waveBatch: number;
  status: string;
  marked: boolean;
  checkpointTime?: CheckpointTime;
}

export const markOffService = new MarkOffService();
```

#### React Component Implementation

**File:** `src/features/checkpoint/components/RunnerMarkOff.tsx`

```typescript
import React, { useState, useEffect, useMemo } from 'react';
import { markOffService, RunnerMarkOffStatus } from '../services/MarkOffService';
import { useCheckpointStore } from '../stores/checkpointStore';

export const RunnerMarkOff: React.FC = () => {
  const { currentRaceId, currentCheckpointId } = useCheckpointStore();
  const [runners, setRunners] = useState<RunnerMarkOffStatus[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(false);

  // Load runner status
  useEffect(() => {
    if (!currentRaceId || !currentCheckpointId) return;

    const loadRunners = async () => {
      setLoading(true);
      try {
        const status = await markOffService.getMarkOffStatus(
          currentRaceId,
          currentCheckpointId
        );
        setRunners(status);
      } catch (error) {
        console.error('Failed to load runners:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRunners();
  }, [currentRaceId, currentCheckpointId]);

  // Filter runners based on search
  const filteredRunners = useMemo(() => {
    if (!searchTerm) return runners;
    
    const term = searchTerm.toLowerCase();
    return runners.filter(r =>
      r.runnerNumber.toString().includes(term) ||
      r.name.toLowerCase().includes(term)
    );
  }, [runners, searchTerm]);

  // Handle runner mark-off
  const handleMarkOff = async (runner: RunnerMarkOffStatus) => {
    if (!currentCheckpointId || !currentRaceId) return;

    const result = await markOffService.markRunner(
      runner.runnerId,
      currentCheckpointId,
      currentRaceId,
      runner.runnerNumber
    );

    if (result.success) {
      // Update local state
      setRunners(prev =>
        prev.map(r =>
          r.runnerId === runner.runnerId
            ? { ...r, marked: true, checkpointTime: result.checkpointTime }
            : r
        )
      );
    } else {
      alert(result.error || 'Failed to mark runner');
    }
  };

  if (loading) {
    return <div className="loading">Loading runners...</div>;
  }

  return (
    <div className="runner-mark-off">
      <div className="controls">
        <input
          type="text"
          placeholder="Search by number or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <div className="view-toggle">
          <button
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'active' : ''}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'active' : ''}
          >
            List
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <RunnerGrid runners={filteredRunners} onMarkOff={handleMarkOff} />
      ) : (
        <RunnerList runners={filteredRunners} onMarkOff={handleMarkOff} />
      )}

      <div className="summary">
        <span>Total: {runners.length}</span>
        <span>Marked: {runners.filter(r => r.marked).length}</span>
        <span>Remaining: {runners.filter(r => !r.marked).length}</span>
      </div>
    </div>
  );
};

// Grid View Component
const RunnerGrid: React.FC<{
  runners: RunnerMarkOffStatus[];
  onMarkOff: (runner: RunnerMarkOffStatus) => void;
}> = ({ runners, onMarkOff }) => {
  return (
    <div className="runner-grid">
      {runners.map(runner => (
        <button
          key={runner.runnerId}
          onClick={() => onMarkOff(runner)}
          disabled={runner.marked}
          className={`runner-cell ${runner.marked ? 'marked' : ''} ${
            runner.status === 'dns' ? 'dns' : ''
          }`}
        >
          <div className="runner-number">{runner.runnerNumber}</div>
          {runner.marked && (
            <div className="mark-time">
              {new Date(runner.checkpointTime!.actual_time).toLocaleTimeString()}
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

// List View Component
const RunnerList: React.FC<{
  runners: RunnerMarkOffStatus[];
  onMarkOff: (runner: RunnerMarkOffStatus) => void;
}> = ({ runners, onMarkOff }) => {
  return (
    <div className="runner-list">
      {runners.map(runner => (
        <div
          key={runner.runnerId}
          className={`runner-row ${runner.marked ? 'marked' : ''}`}
        >
          <span className="number">{runner.runnerNumber}</span>
          <span className="name">{runner.name || 'N/A'}</span>
          <span className="gender">{runner.gender}</span>
          <span className="wave">Wave {runner.waveBatch}</span>
          <span className="status">{runner.status}</span>
          {runner.marked ? (
            <span className="time">
              {new Date(runner.checkpointTime!.actual_time).toLocaleTimeString()}
            </span>
          ) : (
            <button onClick={() => onMarkOff(runner)} className="mark-btn">
              Mark
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
```

#### Testing Strategy

**File:** `src/features/checkpoint/services/__tests__/MarkOffService.test.ts`

```typescript
import { db } from '../../../../database/schema';
import { markOffService } from '../MarkOffService';
import { raceDAL } from '../../../../database/dal/RaceDAL';
import { checkpointDAL } from '../../../../database/dal/CheckpointDAL';
import { runnerDAL } from '../../../../database/dal/RunnerDAL';

describe('MarkOffService', () => {
  let raceId: string;
  let checkpointId: string;
  let runnerId: string;

  beforeEach(async () => {
    await db.delete();
    await db.open();

    // Setup test data
    const race = await raceDAL.create({
      name: 'Test Race',
      date: '2025-11-22',
      start_time: '07:00:00',
      runner_range_start: 1,
      runner_range_end: 10
    });
    raceId = race.id;

    const checkpoint = await checkpointDAL.create({
      race_id: raceId,
      checkpoint_number: 1,
      checkpoint_name: 'CP1',
      order_sequence: 1
    });
    checkpointId = checkpoint.id;

    const runner = await runnerDAL.create({
      race_id: raceId,
      runner_number: 1,
      gender: 'M',
      wave_batch: 1,
      status: 'not_started'
    });
    runnerId = runner.id;
  });

  describe('markRunner', () => {
    test('creates checkpoint time with correct data', async () => {
      const actualTime = new Date('2025-11-22T07:43:12.456Z');
      
      const result = await markOffService.markRunner(
        runnerId,
        checkpointId,
        raceId,
        1,
        actualTime
      );

      expect(result.success).toBe(true);
      expect(result.checkpointTime).toBeDefined();
      expect(result.checkpointTime?.actual_time).toBe(actualTime.toISOString());
      expect(result.checkpointTime?.time_group).toBe('07:40-07:45');
    });

    test('calculates common time correctly', async () => {
      const testCases = [
        { actual: '2025-11-22T07:43:12Z', expected: '2025-11-22T07:40:00.000Z' },
        { actual: '2025-11-22T07:47:30Z', expected: '2025-11-22T07:45:00.000Z' },
        { actual: '2025-11-22T08:02:15Z', expected: '2025-11-22T08:00:00.000Z' },
        { actual: '2025-11-22T08:59:59Z', expected: '2025-11-22T08:55:00.000Z' }
      ];

      for (const testCase of testCases) {
        const actualTime = new Date(testCase.actual);
        const result = await markOffService.markRunner(
          runnerId,
          checkpointId,
          raceId,
          1,
          actualTime
        );

        expect(result.checkpointTime?.common_time).toBe(testCase.expected);
        
        // Clean up for next iteration
        if (result.checkpointTime) {
          await db.checkpointTimes.delete(result.checkpointTime.id);
        }
      }
    });

    test('prevents duplicate marks', async () => {
      const actualTime = new Date('2025-11-22T07:43:12Z');
      
      // First mark
      const result1 = await markOffService.markRunner(
        runnerId,
        checkpointId,
        raceId,
        1,
        actualTime
      );
      expect(result1.success).toBe(true);

      // Second mark (should fail)
      const result2 = await markOffService.markRunner(
        runnerId,
        checkpointId,
        raceId,
        1,
        actualTime
      );
      expect(result2.success).toBe(false);
      expect(result2.error).toContain('already marked');
    });

    test('updates runner status to in_progress', async () => {
      await markOffService.markRunner(
        runnerId,
        checkpointId,
        raceId,
        1,
        new Date()
      );

      const runner = await runnerDAL.getById(runnerId);
      expect(runner?.status).toBe('in_progress');
    });
  });

  describe('getMarkOffStatus', () => {
    test('returns correct status for all runners', async () => {
      // Create multiple runners
      const runner2 = await runnerDAL.create({
        race_id: raceId,
        runner_number: 2,
        gender: 'F',
        wave_batch: 1,
        status: 'not_started'
      });

      // Mark only first runner
      await markOffService.markRunner(
        runnerId,
        checkpointId,
        raceId,
        1,
        new Date()
      );

      const status = await markOffService.getMarkOffStatus(raceId, checkpointId);

      expect(status).toHaveLength(2);
      expect(status.find(s => s.runnerNumber === 1)?.marked).toBe(true);
      expect(status.find(s => s.runnerNumber === 2)?.marked).toBe(false);
    });
  });
});
```

---

### Story 2.2: Callout Sheet Generation

**As a** checkpoint volunteer  
**I want** to see runners grouped by 5-minute time intervals  
**So that** I can efficiently call in groups to base station

**Story Points:** 8  
**Sprint:** Sprint 3

#### Acceptance Criteria

- [ ] Runners automatically grouped into 5-minute time intervals
- [ ] Time groups displayed chronologically (earliest first)
- [ ] Each group shows runner numbers in ascending order
- [ ] Ability to mark entire group as "called in"
- [ ] Visual distinction between called and pending groups
- [ ] Outstanding call-ins highlighted
- [ ] Real-time updates as runners are marked off

#### Technical Implementation

**File:** `src/features/checkpoint/services/CalloutSheetService.ts`

```typescript
import { checkpointTimeDAL } from '../../../database/dal/CheckpointTimeDAL';
import type { CheckpointTime } from '../../../database/schema';

// SOLID: Single Responsibility
export class CalloutSheetService {
  
  /**
   * Generate callout sheet for checkpoint
   */
  async generateCalloutSheet(checkpointId: string): Promise<CalloutSheet> {
    const times = await checkpointTimeDAL.getByCheckpoint(checkpointId);
    
    // Group by time_group
    const grouped = this.groupByTimeInterval(times);
    
    // Sort chronologically
    const timeGroups = Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([timeGroup, records]) => ({
        timeGroup,
        commonTime: records[0].common_time,
        runnerNumbers: records
          .map(r => r.runner_number)
          .sort((a, b) => a - b),
        calledIn: records.every(r => r.called_in),
        callInTime: this.getCallInTime(records),
        count: records.length
      }));

    return {
      checkpointId,
      timeGroups,
      totalGroups: timeGroups.length,
      totalRunners: times.length,
      outstandingGroups: timeGroups.filter(g => !g.calledIn).length
    };
  }

  /**
   * Group checkpoint times by time interval
   */
  private groupByTimeInterval(
    times: CheckpointTime[]
  ): Map<string, CheckpointTime[]> {
    const grouped = new Map<string, CheckpointTime[]>();
    
    for (const time of times) {
      if (!grouped.has(time.time_group)) {
        grouped.set(time.time_group, []);
      }
      grouped.get(time.time_group)!.push(time);
    }
    
    return grouped;
  }

  /**
   * Get call-in time for a group (if all called in)
   */
  private getCallInTime(records: CheckpointTime[]): string | undefined {
    if (!records.every(r => r.called_in)) return undefined;
    
    // Return the latest call_in_time
    const callInTimes = records
      .map(r => r.call_in_time)
      .filter((t): t is string => t !== undefined);
    
    if (callInTimes.length === 0) return undefined;
    
    return callInTimes.sort().reverse()[0];
  }

  /**
   * Mark time group as called in
   */
  async markGroupCalledIn(
    checkpointId: string,
    timeGroup: string
  ): Promise<MarkGroupResult> {
    const times = await checkpointTimeDAL.getByTimeGroup(checkpointId, timeGroup);
    
    if (times.length === 0) {
      return {
        success: false,
        error: 'No runners in this time group'
      };
    }

    const callInTime = new Date().toISOString();
    const updatedIds: string[] = [];

    for (const time of times) {
      await checkpointTimeDAL.update(time.id, {
        called_in: true,
        call_in_time: callInTime
      });
      updatedIds.push(time.id);
    }

    return {
      success: true,
      updatedCount: updatedIds.length,
      callInTime
    };
  }

  /**
   * Get outstanding (not called in) groups
   */
  async getOutstandingGroups(checkpointId: string): Promise<TimeGroupSummary[]> {
    const sheet = await this.generateCalloutSheet(checkpointId);
    return sheet.timeGroups.filter(g => !g.calledIn);
  }
}

export interface CalloutSheet {
  checkpointId: string;
  timeGroups: TimeGroupSummary[];
  totalGroups: number;
  totalRunners: number;
  outstandingGroups: number;
}

export interface TimeGroupSummary {
  timeGroup: string;
  commonTime: string;
  runnerNumbers: number[];
  calledIn: boolean;
  callInTime?: string;
  count: number;
}

export interface MarkGroupResult {
  success: boolean;
  updatedCount?: number;
  callInTime?: string;
  error?: string;
}

export const calloutSheetService = new CalloutSheetService();
```

#### React Component

**File:** `src/features/checkpoint/components/CalloutSheet.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { calloutSheetService, CalloutSheet as CalloutSheetData } from '../services/CalloutSheetService';
import { useCheckpointStore } from '../stores/checkpointStore';

export const CalloutSheet: React.FC = () => {
  const { currentCheckpointId } = useCheckpointStore();
  const [calloutData, setCalloutData] = useState<CalloutSheetData | null>(null);
  const [loading, setLoading] = useState(false);

  // Load callout sheet
  const loadCalloutSheet = async () => {
    if (!currentCheckpointId) return;

    setLoading(true);
    try {
      const data = await calloutSheetService.generateCalloutSheet(currentCheckpointId);
      setCalloutData(data);
    } catch (error) {
      console.error('Failed to load callout sheet:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalloutSheet();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadCalloutSheet, 30000);
    return () => clearInterval(interval);
  }, [currentCheckpointId]);

  // Handle marking group as called in
  const handleMarkCalled = async (timeGroup: string) => {
    if (!currentCheckpointId) return;

    const result = await calloutSheetService.markGroupCalledIn(
      currentCheckpointId,
      timeGroup
    );

    if (result.success) {
      // Refresh data
      await loadCalloutSheet();
    } else {
      alert(result.error || 'Failed to mark group');
    }
  };

  if (loading && !calloutData) {
    return <div className="loading">Loading callout sheet...</div>;
  }

  if (!calloutData) {
    return <div>No data available</div>;
  }

  return (
    <div className="callout-sheet">
      <div className="header">
        <h2>Callout Sheet</h2>
        <div className="summary">
          <span>Total: {calloutData.totalRunners} runners</span>
          <span>Groups: {calloutData.totalGroups}</span>
          <span className="outstanding">
            Outstanding: {calloutData.outstandingGroups}
          </span>
        </div>
        <button onClick={loadCalloutSheet} className="refresh-btn">
          Refresh
        </button>
      </div>

      <div className="time-groups">
        {calloutData.timeGroups.map(group => (
          <div
            key={group.timeGroup}
            className={`time-group ${group.calledIn ? 'called' : 'pending'}`}
          >
            <div className="group-header">
              <span className="time">{group.timeGroup}</span>
              <span className="count">{group.count} runners</span>
              {group.calledIn && group.callInTime && (
                <span className="call-time">
                  Called: {new Date(group.callInTime).toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="runners">
              {group.runnerNumbers.join(', ')}
            </div>
            {!group.calledIn && (
              <button
                onClick={() => handleMarkCalled(group.timeGroup)}
                className="call-btn"
              >
                Mark as Called In
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## Sprint Planning

### Sprint 3: Checkpoint Mode - Mark Off & Callout (Weeks 5-6)

**Goal:** Deliver core checkpoint functionality for runner tracking

**Stories:**
- Story 2.1: Runner Mark-Off Interface (13 points)
- Story 2.2: Callout Sheet Generation (8 points)

**Total Story Points:** 21

**Definition of Done:**
- [ ] All acceptance criteria met
- [ ] Unit tests passing (>85% coverage)
- [ ] Integration tests passing
- [ ] UI/UX reviewed and approved
- [ ] Offline functionality verified
- [ ] Performance tested with 500+ runners
- [ ] Code reviewed and merged

---

## SOLID & DRY Applications

### Single Responsibility
- MarkOffService handles only mark-off logic
- CalloutSheetService handles only callout operations
- Separate components for Grid/List views

### Open/Closed
- Services extensible without modification
- Component props interfaces allow customization

### DRY
- Time calculation logic centralized
- Time group formatting reused across services
- Database transaction patterns consistent

---

Continue to next epic files for remaining implementation details...
