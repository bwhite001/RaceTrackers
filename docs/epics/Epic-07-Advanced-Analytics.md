# Epic 7: Advanced Analytics & Reporting

**Epic Owner:** Analytics Team Lead  
**Priority:** P2 (Medium)  
**Estimated Effort:** 2 Sprints (4 weeks)  
**Dependencies:** Epic 2 (Checkpoint Operations), Epic 3 (Base Station Operations)

## Epic Description

Implement advanced analytics, race insights, performance metrics, and comprehensive reporting capabilities. This epic provides race coordinators with detailed insights into race performance, runner statistics, and historical trends.

---

## User Stories

### Story 7.1: Real-Time Race Dashboard

**As a** race coordinator  
**I want** a comprehensive real-time dashboard  
**So that** I can monitor overall race progress at a glance

**Story Points:** 13  
**Sprint:** Sprint 9

#### Acceptance Criteria

- [ ] Live runner count by status (not started, in progress, finished, DNS, DNF)
- [ ] Checkpoint throughput visualization (runners per time period)
- [ ] Current pace statistics (average, median, fastest, slowest)
- [ ] Progress bars for each checkpoint
- [ ] Estimated completion time based on current pace
- [ ] Alert system for anomalies (unusually slow times, missing runners)
- [ ] Auto-refresh every 30 seconds
- [ ] Export dashboard snapshot as PDF/image

#### Technical Implementation

**File:** `src/features/analytics/services/DashboardService.ts`

```typescript
import { db } from '../../../database/schema';
import { runnerDAL } from '../../../database/dal/RunnerDAL';
import { checkpointTimeDAL } from '../../../database/dal/CheckpointTimeDAL';
import { checkpointDAL } from '../../../database/dal/CheckpointDAL';
import { raceDAL } from '../../../database/dal/RaceDAL';

// SOLID: Single Responsibility
export class DashboardService {
  
  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(raceId: string): Promise<DashboardData> {
    const [race, runners, checkpoints, times] = await Promise.all([
      raceDAL.getById(raceId),
      runnerDAL.getByRace(raceId),
      checkpointDAL.getByRace(raceId),
      this.getAllCheckpointTimes(raceId)
    ]);

    if (!race) throw new Error('Race not found');

    const stats = await runnerDAL.getRaceStatistics(raceId);
    const checkpointProgress = await this.getCheckpointProgress(raceId, checkpoints);
    const paceStats = this.calculatePaceStatistics(race, times);
    const throughput = this.calculateThroughput(times);
    const anomalies = this.detectAnomalies(times, runners);

    return {
      raceInfo: {
        id: race.id,
        name: race.name,
        date: race.date,
        startTime: race.start_time
      },
      runnerStats: stats,
      checkpointProgress,
      paceStats,
      throughput,
      anomalies,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get checkpoint progress summary
   */
  private async getCheckpointProgress(
    raceId: string,
    checkpoints: any[]
  ): Promise<CheckpointProgress[]> {
    const progress: CheckpointProgress[] = [];
    const totalRunners = await runnerDAL.countByRace(raceId);

    for (const checkpoint of checkpoints) {
      const times = await checkpointTimeDAL.getByCheckpoint(checkpoint.id);
      const passed = times.length;
      const remaining = totalRunners - passed;
      const percentage = (passed / totalRunners) * 100;

      progress.push({
        checkpointId: checkpoint.id,
        checkpointName: checkpoint.checkpoint_name,
        checkpointNumber: checkpoint.checkpoint_number,
        totalRunners,
        passed,
        remaining,
        percentage: Math.round(percentage * 10) / 10
      });
    }

    return progress;
  }

  /**
   * Calculate pace statistics
   */
  private calculatePaceStatistics(
    race: any,
    times: any[]
  ): PaceStatistics {
    if (times.length === 0) {
      return {
        averagePaceMinPerKm: 0,
        medianPaceMinPerKm: 0,
        fastestPaceMinPerKm: 0,
        slowestPaceMinPerKm: 0,
        estimatedFinishTime: null
      };
    }

    const raceStart = new Date(`${race.date}T${race.start_time}`);
    const paces: number[] = [];

    times.forEach(time => {
      const checkpointTime = new Date(time.actual_time);
      const elapsedMs = checkpointTime.getTime() - raceStart.getTime();
      const elapsedMin = elapsedMs / (1000 * 60);
      
      // Assuming 5km checkpoint distance (configurable in real implementation)
      const paceMinPerKm = elapsedMin / 5;
      paces.push(paceMinPerKm);
    });

    paces.sort((a, b) => a - b);

    return {
      averagePaceMinPerKm: this.average(paces),
      medianPaceMinPerKm: this.median(paces),
      fastestPaceMinPerKm: Math.min(...paces),
      slowestPaceMinPerKm: Math.max(...paces),
      estimatedFinishTime: this.estimateFinishTime(race, this.average(paces))
    };
  }

  /**
   * Calculate throughput (runners per time period)
   */
  private calculateThroughput(times: any[]): ThroughputData[] {
    const throughputMap = new Map<string, number>();

    times.forEach(time => {
      const timeGroup = time.time_group;
      throughputMap.set(timeGroup, (throughputMap.get(timeGroup) || 0) + 1);
    });

    return Array.from(throughputMap.entries())
      .map(([timeGroup, count]) => ({ timeGroup, count }))
      .sort((a, b) => a.timeGroup.localeCompare(b.timeGroup));
  }

  /**
   * Detect anomalies in runner times
   */
  private detectAnomalies(times: any[], runners: any[]): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // Example: Runners who haven't checked in after expected time
    // In real implementation, this would use more sophisticated logic

    return anomalies;
  }

  /**
   * Get all checkpoint times for race
   */
  private async getAllCheckpointTimes(raceId: string): Promise<any[]> {
    return await db.checkpointTimes
      .where('race_id')
      .equals(raceId)
      .toArray();
  }

  /**
   * Calculate average
   */
  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Calculate median
   */
  private median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
  }

  /**
   * Estimate finish time based on current pace
   */
  private estimateFinishTime(race: any, avgPaceMinPerKm: number): string | null {
    if (avgPaceMinPerKm === 0) return null;

    // Assuming 20km race (configurable)
    const totalDistance = 20;
    const estimatedTotalMin = avgPaceMinPerKm * totalDistance;

    const raceStart = new Date(`${race.date}T${race.start_time}`);
    const finishTime = new Date(raceStart.getTime() + estimatedTotalMin * 60 * 1000);

    return finishTime.toISOString();
  }
}

export interface DashboardData {
  raceInfo: RaceInfo;
  runnerStats: any;
  checkpointProgress: CheckpointProgress[];
  paceStats: PaceStatistics;
  throughput: ThroughputData[];
  anomalies: Anomaly[];
  lastUpdated: string;
}

export interface RaceInfo {
  id: string;
  name: string;
  date: string;
  startTime: string;
}

export interface CheckpointProgress {
  checkpointId: string;
  checkpointName: string;
  checkpointNumber: number;
  totalRunners: number;
  passed: number;
  remaining: number;
  percentage: number;
}

export interface PaceStatistics {
  averagePaceMinPerKm: number;
  medianPaceMinPerKm: number;
  fastestPaceMinPerKm: number;
  slowestPaceMinPerKm: number;
  estimatedFinishTime: string | null;
}

export interface ThroughputData {
  timeGroup: string;
  count: number;
}

export interface Anomaly {
  type: string;
  message: string;
  runnerId?: string;
  severity: 'low' | 'medium' | 'high';
}

export const dashboardService = new DashboardService();
```

---

### Story 7.2: Runner Performance Analysis

**As a** race coordinator  
**I want** detailed performance analysis for individual runners  
**So that** I can provide feedback and identify trends

**Story Points:** 8  
**Sprint:** Sprint 9

#### Acceptance Criteria

- [ ] Runner profile with complete checkpoint history
- [ ] Segment time breakdown between checkpoints
- [ ] Pace graph showing speed variations
- [ ] Rank progression through race
- [ ] Comparison with category averages (gender/wave)
- [ ] Historical performance (if multiple races)
- [ ] Export runner report as PDF

#### Technical Implementation

**File:** `src/features/analytics/services/RunnerAnalysisService.ts`

```typescript
import { db } from '../../../database/schema';
import { runnerDAL } from '../../../database/dal/RunnerDAL';
import { checkpointTimeDAL } from '../../../database/dal/CheckpointTimeDAL';
import { checkpointDAL } from '../../../database/dal/CheckpointDAL';
import { leaderboardService } from '../../baseStation/services/LeaderboardService';

export class RunnerAnalysisService {
  
  /**
   * Get comprehensive runner analysis
   */
  async analyzeRunner(
    raceId: string,
    runnerId: string
  ): Promise<RunnerAnalysis> {
    const runner = await runnerDAL.getById(runnerId);
    if (!runner) throw new Error('Runner not found');

    const checkpointTimes = await checkpointTimeDAL.getByRunner(runnerId);
    const segments = await leaderboardService.getCheckpointSegments(raceId, runnerId);
    const categoryRank = await this.getCategoryRank(raceId, runner);
    const paceProfile = this.buildPaceProfile(segments);

    return {
      runner: {
        id: runner.id,
        number: runner.runner_number,
        name: `${runner.first_name || ''} ${runner.last_name || ''}`.trim(),
        gender: runner.gender,
        wave: runner.wave_batch,
        status: runner.status
      },
      checkpointTimes: checkpointTimes.map(t => ({
        checkpointId: t.checkpoint_id,
        actualTime: t.actual_time,
        timeGroup: t.time_group
      })),
      segments,
      categoryRank,
      paceProfile
    };
  }

  /**
   * Get runner's rank in their category
   */
  private async getCategoryRank(
    raceId: string,
    runner: any
  ): Promise<CategoryRank> {
    // Get all runners in same gender
    const sameGender = await runnerDAL.getByRace(raceId);
    const genderRunners = sameGender.filter(r => r.gender === runner.gender);

    // Get all runners in same wave
    const waveRunners = sameGender.filter(r => r.wave_batch === runner.wave_batch);

    return {
      overallRank: 0, // Would calculate from leaderboard
      genderRank: 0,
      waveRank: 0,
      totalGenderRunners: genderRunners.length,
      totalWaveRunners: waveRunners.length
    };
  }

  /**
   * Build pace profile from segments
   */
  private buildPaceProfile(segments: any[]): PaceProfile {
    const paces = segments
      .filter(s => s.segmentTime > 0)
      .map(s => ({
        checkpoint: s.checkpointName,
        paceMinPerKm: s.segmentTime / (1000 * 60 * 5) // Assuming 5km segments
      }));

    return { paces };
  }
}

export interface RunnerAnalysis {
  runner: RunnerInfo;
  checkpointTimes: CheckpointTimeInfo[];
  segments: any[];
  categoryRank: CategoryRank;
  paceProfile: PaceProfile;
}

export interface RunnerInfo {
  id: string;
  number: number;
  name: string;
  gender: string;
  wave: number;
  status: string;
}

export interface CheckpointTimeInfo {
  checkpointId: string;
  actualTime: string;
  timeGroup: string;
}

export interface CategoryRank {
  overallRank: number;
  genderRank: number;
  waveRank: number;
  totalGenderRunners: number;
  totalWaveRunners: number;
}

export interface PaceProfile {
  paces: PacePoint[];
}

export interface PacePoint {
  checkpoint: string;
  paceMinPerKm: number;
}

export const runnerAnalysisService = new RunnerAnalysisService();
```

---

### Story 7.3: Race Report Generation

**As a** race coordinator  
**I want** to generate comprehensive race reports  
**So that** I can share results with stakeholders

**Story Points:** 13  
**Sprint:** Sprint 10

#### Acceptance Criteria

- [ ] Generate complete race report with all statistics
- [ ] Include leaderboards by gender and wave
- [ ] Checkpoint statistics and throughput
- [ ] DNS/DNF analysis
- [ ] Export as PDF with formatting
- [ ] Export as Excel spreadsheet
- [ ] Include race metadata (date, conditions, etc.)
- [ ] Customizable report sections

#### Technical Implementation

**File:** `src/features/analytics/services/ReportGenerationService.ts`

```typescript
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { dashboardService } from './DashboardService';
import { leaderboardService } from '../../baseStation/services/LeaderboardService';

export class ReportGenerationService {
  
  /**
   * Generate comprehensive race report
   */
  async generateReport(
    raceId: string,
    options: ReportOptions = {}
  ): Promise<RaceReport> {
    const dashboard = await dashboardService.getDashboardData(raceId);
    
    // Get latest checkpoint for final results
    const checkpoints = await db.checkpoints
      .where('race_id')
      .equals(raceId)
      .toArray();
    
    const lastCheckpoint = checkpoints.sort((a, b) => 
      b.order_sequence - a.order_sequence
    )[0];

    const leaderboards = await leaderboardService.calculateLeaderboard(
      raceId,
      lastCheckpoint.id,
      'gender'
    );

    return {
      metadata: {
        raceId,
        raceName: dashboard.raceInfo.name,
        raceDate: dashboard.raceInfo.date,
        generatedAt: new Date().toISOString()
      },
      summary: {
        totalRunners: dashboard.runnerStats.total,
        finishers: dashboard.runnerStats.finished,
        dns: dashboard.runnerStats.dns,
        dnf: dashboard.runnerStats.dnf
      },
      leaderboards,
      checkpointStats: dashboard.checkpointProgress,
      paceStats: dashboard.paceStats
    };
  }

  /**
   * Export report as PDF
   */
  async exportPDF(report: RaceReport): Promise<void> {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text(report.metadata.raceName, 20, 20);
    
    // Summary
    doc.setFontSize(12);
    doc.text(`Total Runners: ${report.summary.totalRunners}`, 20, 40);
    doc.text(`Finishers: ${report.summary.finishers}`, 20, 50);
    doc.text(`DNS: ${report.summary.dns}`, 20, 60);
    doc.text(`DNF: ${report.summary.dnf}`, 20, 70);

    // Leaderboards
    let yPos = 90;
    report.leaderboards.forEach(([category, entries]) => {
      doc.text(`${category} Results:`, 20, yPos);
      yPos += 10;
      
      entries.slice(0, 10).forEach(entry => {
        doc.text(
          `${entry.rank}. #${entry.runnerNumber} ${entry.name} - ${entry.elapsedFormatted}`,
          25,
          yPos
        );
        yPos += 7;
      });
      
      yPos += 10;
    });

    doc.save(`${report.metadata.raceName}-report.pdf`);
  }

  /**
   * Export report as Excel
   */
  async exportExcel(report: RaceReport): Promise<void> {
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Race Name', report.metadata.raceName],
      ['Date', report.metadata.raceDate],
      ['Total Runners', report.summary.totalRunners],
      ['Finishers', report.summary.finishers],
      ['DNS', report.summary.dns],
      ['DNF', report.summary.dnf]
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    // Leaderboard sheets
    report.leaderboards.forEach(([category, entries]) => {
      const data = entries.map(e => ({
        Rank: e.rank,
        Number: e.runnerNumber,
        Name: e.name,
        Gender: e.gender,
        Wave: e.waveBatch,
        Time: e.elapsedFormatted
      }));
      
      const sheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, sheet, category);
    });

    XLSX.writeFile(wb, `${report.metadata.raceName}-report.xlsx`);
  }
}

export interface ReportOptions {
  includeDNS?: boolean;
  includeDNF?: boolean;
  includeCheckpointStats?: boolean;
}

export interface RaceReport {
  metadata: ReportMetadata;
  summary: ReportSummary;
  leaderboards: Map<string, any[]>;
  checkpointStats: any[];
  paceStats: any;
}

export interface ReportMetadata {
  raceId: string;
  raceName: string;
  raceDate: string;
  generatedAt: string;
}

export interface ReportSummary {
  totalRunners: number;
  finishers: number;
  dns: number;
  dnf: number;
}

export const reportGenerationService = new ReportGenerationService();
```

---

## Sprint Planning

### Sprint 9: Real-Time Analytics (Weeks 18-19)

**Goal:** Deliver live dashboard and runner analysis

**Stories:**
- Story 7.1: Real-Time Race Dashboard (13 points)
- Story 7.2: Runner Performance Analysis (8 points)

**Total Story Points:** 21

### Sprint 10: Report Generation (Weeks 20-21)

**Goal:** Enable comprehensive race reporting

**Stories:**
- Story 7.3: Race Report Generation (13 points)

**Total Story Points:** 13

---

**This epic enhances the application with powerful analytics capabilities for deeper race insights!**
