**RaceTracker Pro - Solution Design Document**

**Version:** 1.0  
**Date:** November 21, 2025  
**Author:** Brandon Johnston  
**Document Type:** Technical Design Specification

**Executive Summary**

RaceTracker Pro is an offline-capable Progressive Web Application (PWA) designed to streamline race event management for volunteers and coordinators. The application supports multi-checkpoint tracking, real-time runner status management, and comprehensive data capture for race analytics. This document outlines the complete technical architecture, database design, data integrity mechanisms, and implementation approach for the system.

**Key Design Objectives**

- **Offline-First Architecture**: Complete functionality without internet connectivity
- **Data Integrity**: Robust export/import with validation and conflict resolution
- **Scalability**: Support for 1-2000+ runners across multiple checkpoints
- **Real-Time Analytics**: Live leaderboard calculations and progress tracking
- **Device Flexibility**: Seamless operation across desktop, tablet, and mobile platforms
- **Data Portability**: JSON-based export/import for cross-device synchronization

**System Architecture**

**High-Level Architecture Diagram**

┌─────────────────────────────────────────────────────────────┐  
│ Client Application (PWA) │  
│ ┌───────────────────────────────────────────────────────┐ │  
│ │ React UI Layer (Vite + React 18) │ │  
│ │ ┌──────────────┐ ┌──────────────┐ ┌────────────┐ │ │  
│ │ │ Checkpoint │ │ Base Station │ │ Race Setup │ │ │  
│ │ │ Mode │ │ Mode │ │ Module │ │ │  
│ │ └──────────────┘ └──────────────┘ └────────────┘ │ │  
│ └───────────────────────────────────────────────────────┘ │  
│ ┌───────────────────────────────────────────────────────┐ │  
│ │ State Management Layer (Zustand) │ │  
│ │ • Race Configuration • Runner Status │ │  
│ │ • Checkpoint Timings • Analytics Cache │ │  
│ └───────────────────────────────────────────────────────┘ │  
│ ┌───────────────────────────────────────────────────────┐ │  
│ │ Data Access Layer (Dexie.js) │ │  
│ │ • CRUD Operations • Validation • Transactions │ │  
│ └───────────────────────────────────────────────────────┘ │  
│ ┌───────────────────────────────────────────────────────┐ │  
│ │ Local Database (IndexedDB) │ │  
│ │ • Races • Runners • Checkpoints • Times │ │  
│ └───────────────────────────────────────────────────────┘ │  
│ ┌───────────────────────────────────────────────────────┐ │  
│ │ Service Worker (Workbox) │ │  
│ │ • Offline Caching • Asset Management │ │  
│ └───────────────────────────────────────────────────────┘ │  
└─────────────────────────────────────────────────────────────┘

**Technology Stack**

| Component | Technology | Justification |
| --- | --- | --- |
| **Frontend Framework** | React 18 with Hooks | Component reusability, efficient rendering, strong ecosystem |
| **Build Tool** | Vite | Fast HMR, optimized builds, modern ES modules |
| **Styling** | Tailwind CSS | Utility-first approach, responsive design, minimal bundle size |
| **State Management** | Zustand | Lightweight, simple API, no boilerplate, TypeScript-friendly |
| **Local Database** | IndexedDB (via Dexie.js) | Native browser storage, 50MB+ capacity, transaction support |
| **PWA Framework** | Vite PWA Plugin + Workbox | Offline capability, automatic caching strategies |
| **Date/Time Handling** | date-fns | Modular, lightweight, immutable date operations |
| **QR Code Generation** | qrcode.react | Simple integration, customizable output |
| **Validation** | Zod | Runtime type checking, schema validation, TypeScript inference |

**Database Design**

**Entity Relationship Diagram**

┌──────────────┐  
│ Races │  
├──────────────┤  
│ id (PK) │  
│ name │────┐  
│ date │ │  
│ start_time │ │ 1:N  
│ created_at │ │  
│ updated_at │ │  
└──────────────┘ │  
│  
├──────────────────────┐  
│ │  
▼ ▼  
┌──────────────────┐ ┌────────────────────┐  
│ Checkpoints │ │ Runners │  
├──────────────────┤ ├────────────────────┤  
│ id (PK) │ │ id (PK) │  
│ race_id (FK) │ │ race_id (FK) │  
│ checkpoint_number│ │ runner_number │  
│ checkpoint_name │ │ first_name │  
│ location │ │ last_name │  
│ order_sequence │ │ gender │  
│ created_at │ │ wave_batch │  
└──────────────────┘ │ status │  
│ │ created_at │  
│ │ updated_at │  
│ └────────────────────┘  
│ │  
│ N:N │  
│ │  
│ ┌───────────────┘  
│ │  
└──────┼────────────────────┐  
▼ │  
┌─────────────────┐ │  
│ CheckpointTimes │◄──────────┘  
├─────────────────┤  
│ id (PK) │  
│ checkpoint_id │  
│ runner_id │  
│ actual_time │  
│ common_time │  
│ call_in_time │  
│ time_group │  
│ called_in │  
│ created_at │  
│ updated_at │  
└─────────────────┘

**Database Schema Definitions**

**1\. Races Table**

interface Race {  
id: string; // UUID v4  
name: string; // "Mount Glorious 2025"  
date: string; // ISO 8601 date "2025-11-22"  
start_time: string; // ISO 8601 time "07:00:00"  
runner_range_start: number; // 1  
runner_range_end: number; // 128  
created_at: string; // ISO 8601 timestamp  
updated_at: string; // ISO 8601 timestamp  
metadata: { // Extensible metadata  
event_type?: string;  
distance?: string;  
organizer?: string;  
};  
}

**Indexes:**

- Primary: id
- Secondary: date, created_at

**2\. Checkpoints Table**

interface Checkpoint {  
id: string; // UUID v4  
race_id: string; // Foreign key to [Race.id](http://Race.id)  
checkpoint_number: number; // 1, 2, 3, 4  
checkpoint_name: string; // "CP1", "CP2", "Finish"  
location?: string; // GPS coordinates or description  
order_sequence: number; // Display order  
created_at: string;  
updated_at: string;  
}

**Indexes:**

- Primary: id
- Composite: \[race_id, checkpoint_number\] (unique)
- Secondary: race_id

**3\. Runners Table**

interface Runner {  
id: string; // UUID v4  
race_id: string; // Foreign key to [Race.id](http://Race.id)  
runner_number: number; // Bib number 1-128  
first_name?: string; // Optional for basic mode  
last_name?: string; // Optional for basic mode  
gender: 'M' | 'F' | 'X'; // Male, Female, Non-binary  
wave_batch: number; // Starting wave/batch number  
status: RunnerStatus; // See enum below  
created_at: string;  
updated_at: string;  
}

enum RunnerStatus {  
NOT_STARTED = 'not_started', // Pre-race  
IN_PROGRESS = 'in_progress', // Passed first checkpoint  
FINISHED = 'finished', // Completed race  
DNS = 'dns', // Did Not Start  
DNF = 'dnf', // Did Not Finish  
WITHDRAWN = 'withdrawn' // Withdrawn during race  
}

**Indexes:**

- Primary: id
- Composite: \[race_id, runner_number\] (unique)
- Secondary: race_id, status, wave_batch

**4\. CheckpointTimes Table**

interface CheckpointTime {  
id: string; // UUID v4  
checkpoint_id: string; // Foreign key to [Checkpoint.id](http://Checkpoint.id)  
runner_id: string; // Foreign key to [Runner.id](http://Runner.id)  
race_id: string; // Denormalized for query performance  
runner_number: number; // Denormalized for quick lookups

// Three timing types as per requirements  
actual_time: string; // ISO 8601: Exact entry time  
common_time: string; // ISO 8601: Rounded to 5-min interval  
call_in_time?: string; // ISO 8601: When reported to base

time_group: string; // "07:30-07:35" for grouping  
called_in: boolean; // Has this been reported to base?

created_at: string;  
updated_at: string;  
}

**Indexes:**

- Primary: id
- Composite: \[checkpoint_id, runner_id\] (unique)
- Secondary: checkpoint_id, runner_id, race_id, time_group, common_time

**5\. BaseStationCallIns Table (Supporting Table)**

interface BaseStationCallIn {  
id: string; // UUID v4  
checkpoint_id: string; // Which checkpoint reported  
common_time: string; // The grouped time block  
time_group: string; // "07:30-07:35"  
runner_numbers: number\[\]; // Array of runners in this group  
entered_by: string; // Device/user identifier  
entered_at: string; // When data was entered  
created_at: string;  
}

**Indexes:**

- Primary: id
- Composite: \[checkpoint_id, time_group\]
- Secondary: checkpoint_id, common_time

**Data Layer Implementation**

**Dexie.js Database Initialization**

import Dexie, { Table } from 'dexie';

export class RaceTrackerDatabase extends Dexie {  
races!: Table&lt;Race, string&gt;;  
checkpoints!: Table&lt;Checkpoint, string&gt;;  
runners!: Table&lt;Runner, string&gt;;  
checkpointTimes!: Table&lt;CheckpointTime, string&gt;;  
baseStationCallIns!: Table&lt;BaseStationCallIn, string&gt;;

constructor() {  
super('RaceTrackerDB');

this.version(1).stores({  
races: 'id, date, created_at',  
checkpoints: 'id, \[race_id+checkpoint_number\], race_id',  
runners: 'id, \[race_id+runner_number\], race_id, status, wave_batch',  
checkpointTimes: 'id, \[checkpoint_id+runner_id\], checkpoint_id, runner_id, race_id, time_group, common_time',  
baseStationCallIns: 'id, \[checkpoint_id+time_group\], checkpoint_id, common_time'  
});  

}  
}

export const db = new RaceTrackerDatabase();

**Data Access Layer (DAL) Pattern**

// Example: Runner Data Access Layer  
export class RunnerDAL {  
async createRunner(runner: Omit&lt;Runner, 'id' | 'created_at' | 'updated_at'&gt;): Promise&lt;Runner&gt; {  
const newRunner: Runner = {  
...runner,  
id: crypto.randomUUID(),  
created_at: new Date().toISOString(),  
updated_at: new Date().toISOString()  
};

await db.runners.add(newRunner);  
return newRunner;  

}

async updateRunnerStatus(runnerId: string, status: RunnerStatus): Promise&lt;void&gt; {  
await db.runners.update(runnerId, {  
status,  
updated_at: new Date().toISOString()  
});  
}

async getRunnersByRace(raceId: string): Promise&lt;Runner\[\]&gt; {  
return await db.runners  
.where('race_id')  
.equals(raceId)  
.sortBy('runner_number');  
}

async getRunnerWithTimes(runnerId: string): Promise&lt;RunnerWithTimes&gt; {  
const runner = await db.runners.get(runnerId);  
if (!runner) throw new Error('Runner not found');

const times = await db.checkpointTimes  
.where('runner_id')  
.equals(runnerId)  
.toArray();  
<br/>return { ...runner, checkpointTimes: times };  

}  
}

**Core Functional Requirements**

**1\. Time Tracking System**

The application tracks three distinct time types per runner per checkpoint:

**Actual Time**

- **Purpose**: Precise timestamp when runner physically enters checkpoint
- **Format**: ISO 8601 with millisecond precision (2025-11-22T07:43:12.456Z)
- **Captured**: Automatically on tap/mark in Checkpoint Mode
- **Use**: Performance analysis, official timing

**Common Time (5-Minute Grouped)**

- **Purpose**: Group runners into 5-minute intervals for efficient call-ins
- **Algorithm**:  
    function calculateCommonTime(actualTime: Date): string {  
    const minutes = actualTime.getMinutes();  
    const roundedMinutes = Math.floor(minutes / 5) \* 5;  
    const commonTime = new Date(actualTime);  
    commonTime.setMinutes(roundedMinutes, 0, 0);  
    return commonTime.toISOString();  
    }
- **Example**: Runner enters at 07:43:12 → Common time is 07:40:00
- **Time Groups**: "07:40-07:45", "07:45-07:50", etc.

**Call-In Time**

- **Purpose**: Timestamp when checkpoint reports runners to base station
- **Captured**: When checkpoint marks time group as "called in"
- **Use**: Communication tracking, delay analysis

**2\. Checkpoint Mode Operations**

**Tab 1: Runner Mark-Off**

interface MarkOffOperation {  
runnerId: string;  
checkpointId: string;  
actualTime: Date;

execute(): Promise&lt;void&gt; {  
const commonTime = calculateCommonTime(actualTime);  
const timeGroup = formatTimeGroup(commonTime);

await db.checkpointTimes.add({  
id: crypto.randomUUID(),  
runner_id: runnerId,  
checkpoint_id: checkpointId,  
actual_time: actualTime.toISOString(),  
common_time: commonTime.toISOString(),  
time_group: timeGroup,  
called_in: false,  
created_at: new Date().toISOString()  
});  
<br/>// Update runner status if first checkpoint  
await updateRunnerProgress(runnerId, checkpointId);  

}  
}

**UI Features:**

- Grid layout: 10x10 or configurable
- Search/filter by runner number
- Visual indicators: not started (gray), marked (green), DNS (red)
- Bulk number entry support

**Tab 2: Callout Sheet**

interface CalloutSheet {  
checkpointId: string;  
timeGroups: TimeGroup\[\];  
}

interface TimeGroup {  
groupLabel: string; // "07:40-07:45"  
commonTime: string; // "07:40:00"  
runnerNumbers: number\[\]; // \[22, 45, 67, 89\]  
calledIn: boolean;  
callInTime?: string;  
}

async function generateCalloutSheet(checkpointId: string): Promise&lt;CalloutSheet&gt; {  
const times = await db.checkpointTimes  
.where('checkpoint_id')  
.equals(checkpointId)  
.toArray();

// Group by common_time  
const grouped = groupBy(times, 'common_time');

// Sort chronologically  
const timeGroups = Object.entries(grouped)  
.sort((\[a\], \[b\]) => a.localeCompare(b))  
.map((\[commonTime, records\]) => ({  
groupLabel: formatTimeGroup(commonTime),  
commonTime,  
runnerNumbers: records.map(r => r.runner_number).sort((a, b) => a - b),  
calledIn: records.every(r => r.called_in),  
callInTime: records\[0\]?.call_in_time  
}));

return { checkpointId, timeGroups };  
}

**Tab 3: Overview**

interface RunnerOverview {  
runnerNumber: number;  
name: string;  
status: RunnerStatus;  
checkpointsPassed: CheckpointProgress\[\];  
lastSeen?: {  
checkpointName: string;  
actualTime: string;  
timeGroup: string;  
};  
}

interface CheckpointProgress {  
checkpointNumber: number;  
checkpointName: string;  
passed: boolean;  
actualTime?: string;  
commonTime?: string;  
}

**3\. Base Station Mode Operations**

**Tab 1: Data Entry**

interface BulkTimeEntry {  
checkpointId: string;  
commonTime: string; // "07:45:00"  
runnerInput: string; // "101, 105-107, 110"

async execute(): Promise&lt;void&gt; {  
const runnerNumbers = parseRunnerInput(this.runnerInput);  
const timeGroup = formatTimeGroup(this.commonTime);

await db.transaction('rw', db.checkpointTimes, db.baseStationCallIns, async () => {  
// Create checkpoint times for all runners  
for (const runnerNumber of runnerNumbers) {  
const runner = await db.runners  
.where('\[race_id+runner_number\]')  
.equals(\[raceId, runnerNumber\])  
.first();  
<br/>if (!runner) continue;  
<br/>await db.checkpointTimes.add({  
id: crypto.randomUUID(),  
runner_id: runner.id,  
checkpoint_id: this.checkpointId,  
actual_time: this.commonTime,  
common_time: this.commonTime,  
time_group: timeGroup,  
called_in: true,  
call_in_time: new Date().toISOString(),  
created_at: new Date().toISOString()  
});  
}  
<br/>// Record the bulk entry  
await db.baseStationCallIns.add({  
id: crypto.randomUUID(),  
checkpoint_id: this.checkpointId,  
common_time: this.commonTime,  
time_group: timeGroup,  
runner_numbers: runnerNumbers,  
entered_by: 'base_station',  
entered_at: new Date().toISOString(),  
created_at: new Date().toISOString()  
});  
});  

}  
}

function parseRunnerInput(input: string): number\[\] {  
const parts = input.split(',').map(s => s.trim());  
const numbers: number\[\] = \[\];

for (const part of parts) {  
if (part.includes('-')) {  
const \[start, end\] = part.split('-').map(Number);  
for (let i = start; i <= end; i++) {  
numbers.push(i);  
}  
} else {  
numbers.push(Number(part));  
}  
}

return \[...new Set(numbers)\].sort((a, b) => a - b);  
}

**Tab 2: Race Overview & Analytics**

**Live Leaderboard Calculation:**  
interface LeaderboardEntry {  
rank: number;  
runnerNumber: number;  
name: string;  
gender: 'M' | 'F' | 'X';  
waveBatch: number;  
lastCheckpoint: number;  
lastCheckpointTime: string;  
elapsedTime: number; // Milliseconds from start  
}

async function calculateLeaderboard(  
raceId: string,  
checkpointId: string,  
groupBy: 'gender' | 'wave' = 'gender'  
): Promise&lt;Map<string, LeaderboardEntry\[\]&gt;> {  
const race = await db.races.get(raceId);  
const raceStartTime = new Date(\${race.date}T\${race.start_time});

const times = await db.checkpointTimes  
.where('checkpoint_id')  
.equals(checkpointId)  
.toArray();

const runnerIds = \[...new Set(times.map(t => t.runner_id))\];  
const runners = await db.runners.bulkGet(runnerIds);

const entries: LeaderboardEntry\[\] = runners  
.filter(r => r !== undefined)  
.map(runner => {  
const runnerTimes = times.filter(t => t.runner_id === [runner.id](http://runner.id));  
const latestTime = runnerTimes\[runnerTimes.length - 1\];

return {  
rank: 0, // Calculated below  
runnerNumber: runner.runner_number,  
name: \`\${runner.first_name} \${runner.last_name}\`,  
gender: runner.gender,  
waveBatch: runner.wave_batch,  
lastCheckpoint: checkpoint.checkpoint_number,  
lastCheckpointTime: latestTime.actual_time,  
elapsedTime: new Date(latestTime.actual_time).getTime() - raceStartTime.getTime()  
};  
})  
.sort((a, b) => a.elapsedTime - b.elapsedTime);  

// Group and assign ranks  
const grouped = new Map&lt;string, LeaderboardEntry\[\]&gt;();  
entries.forEach(entry => {  
const key = groupBy === 'gender' ? entry.gender : entry.waveBatch.toString();  
if (!grouped.has(key)) grouped.set(key, \[\]);  
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

**Outstanding Runners (Not Yet Called In):**  
async function getOutstandingRunners(checkpointId: string): Promise<{  
total: number;  
byTimeGroup: Map&lt;string, number\[\]&gt;;  
}> {  
const times = await db.checkpointTimes  
.where('checkpoint_id')  
.equals(checkpointId)  
.and(t => !t.called_in)  
.toArray();

const byTimeGroup = new Map&lt;string, number\[\]&gt;();

times.forEach(time => {  
if (!byTimeGroup.has(time.time_group)) {  
byTimeGroup.set(time.time_group, \[\]);  
}  
byTimeGroup.get(time.time_group)!.push(time.runner_number);  
});

return {  
total: times.length,  
byTimeGroup  
};  
}

**Data Export/Import System**

**JSON Schema Specification**

interface RaceExportSchema {  
version: string; // Schema version "1.0.0"  
exportedAt: string; // ISO 8601 timestamp  
exportedBy: string; // Device identifier  
checksum: string; // SHA-256 hash for integrity

race: Race;  
checkpoints: Checkpoint\[\];  
runners: Runner\[\];  
checkpointTimes: CheckpointTime\[\];  
baseStationCallIns: BaseStationCallIn\[\];

metadata: {  
totalRunners: number;  
totalCheckpoints: number;  
totalTimes: number;  
raceStatus: 'setup' | 'in_progress' | 'completed';  
};  
}

**Export Implementation**

class DataExporter {  
async exportRace(raceId: string): Promise&lt;RaceExportSchema&gt; {  
const race = await db.races.get(raceId);  
if (!race) throw new Error('Race not found');

const \[checkpoints, runners, checkpointTimes, baseStationCallIns\] = await Promise.all(\[  
db.checkpoints.where('race_id').equals(raceId).toArray(),  
db.runners.where('race_id').equals(raceId).toArray(),  
db.checkpointTimes.where('race_id').equals(raceId).toArray(),  
db.baseStationCallIns.toArray() // Filter by checkpoint IDs  
\]);  
<br/>const exportData: RaceExportSchema = {  
version: '1.0.0',  
exportedAt: new Date().toISOString(),  
exportedBy: getDeviceIdentifier(),  
checksum: '', // Calculated below  
<br/>race,  
checkpoints,  
runners,  
checkpointTimes,  
baseStationCallIns,  
<br/>metadata: {  
totalRunners: runners.length,  
totalCheckpoints: checkpoints.length,  
totalTimes: checkpointTimes.length,  
raceStatus: determineRaceStatus(race, checkpointTimes)  
}  
};  
<br/>// Calculate checksum (excluding checksum field itself)  
const dataForChecksum = { ...exportData, checksum: '' };  
exportData.checksum = await calculateSHA256(JSON.stringify(dataForChecksum));  
<br/>return exportData;  

}

downloadAsJSON(data: RaceExportSchema, filename: string): void {  
const blob = new Blob(\[JSON.stringify(data, null, 2)\], {  
type: 'application/json'  
});  
const url = URL.createObjectURL(blob);  
const a = document.createElement('a');  
a.href = url;  
a.download = filename;  
a.click();  
URL.revokeObjectURL(url);  
}

generateQRCode(data: RaceExportSchema): string {  
// For large datasets, compress and encode  
const compressed = compressData(JSON.stringify(data));  
return base64Encode(compressed);  
}  
}

**Import Implementation with Validation**

class DataImporter {  
async importRace(jsonData: string): Promise&lt;ImportResult&gt; {  
// Parse and validate  
const data = JSON.parse(jsonData) as RaceExportSchema;  
const validation = await this.validateImport(data);

if (!validation.valid) {  
return {  
success: false,  
errors: validation.errors  
};  
}  
<br/>// Check for conflicts  
const conflicts = await this.detectConflicts(data);  
if (conflicts.length > 0) {  
return {  
success: false,  
conflicts,  
requiresUserDecision: true  
};  
}  
<br/>// Import data transactionally  
await db.transaction('rw',  
db.races,  
db.checkpoints,  
db.runners,  
db.checkpointTimes,  
db.baseStationCallIns,  
async () => {  
// Check if race exists  
const existingRace = await db.races.get(data.race.id);  
<br/>if (existingRace) {  
// Merge strategy: keep newer updated_at  
await this.mergeRaceData(existingRace, data);  
} else {  
// Fresh import  
await db.races.add(data.race);  
await db.checkpoints.bulkAdd(data.checkpoints);  
await db.runners.bulkAdd(data.runners);  
await db.checkpointTimes.bulkAdd(data.checkpointTimes);  
await db.baseStationCallIns.bulkAdd(data.baseStationCallIns);  
}  
}  
);  
<br/>return {  
success: true,  
imported: {  
runners: data.runners.length,  
checkpoints: data.checkpoints.length,  
times: data.checkpointTimes.length  
}  
};  

}

async validateImport(data: RaceExportSchema): Promise&lt;ValidationResult&gt; {  
const errors: string\[\] = \[\];

// Version compatibility  
if (!this.isVersionCompatible(data.version)) {  
errors.push(\`Unsupported schema version: \${data.version}\`);  
}  
<br/>// Checksum verification  
const calculatedChecksum = await calculateSHA256(  
JSON.stringify({ ...data, checksum: '' })  
);  
if (calculatedChecksum !== data.checksum) {  
errors.push('Data integrity check failed: checksum mismatch');  
}  
<br/>// Referential integrity  
const runnerIds = new Set(data.runners.map(r => r.id));  
const checkpointIds = new Set(data.checkpoints.map(c => c.id));  
<br/>for (const time of data.checkpointTimes) {  
if (!runnerIds.has(time.runner_id)) {  
errors.push(\`Invalid runner reference: \${time.runner_id}\`);  
}  
if (!checkpointIds.has(time.checkpoint_id)) {  
errors.push(\`Invalid checkpoint reference: \${time.checkpoint_id}\`);  
}  
}  
<br/>// Business logic validation  
if (data.runners.length === 0) {  
errors.push('Race must have at least one runner');  
}  
<br/>if (data.checkpoints.length === 0) {  
errors.push('Race must have at least one checkpoint');  
}  
<br/>return {  
valid: errors.length === 0,  
errors  
};  

}

async detectConflicts(data: RaceExportSchema): Promise&lt;Conflict\[\]&gt; {  
const conflicts: Conflict\[\] = \[\];

// Check if race already exists  
const existingRace = await db.races.get(data.race.id);  
if (existingRace) {  
// Compare updated_at timestamps  
const existingTime = new Date(existingRace.updated_at);  
const importTime = new Date(data.race.updated_at);  
<br/>if (existingTime.getTime() !== importTime.getTime()) {  
conflicts.push({  
type: 'race_exists',  
message: 'Race already exists with different data',  
existing: existingRace,  
incoming: data.race,  
resolution: 'user_choice' // or 'keep_newer', 'merge'  
});  
}  
}  
<br/>// Check for runner conflicts  
const existingRunners = await db.runners  
.where('race_id')  
.equals(data.race.id)  
.toArray();  
<br/>for (const incomingRunner of data.runners) {  
const existing = existingRunners.find(r => r.id === incomingRunner.id);  
if (existing && existing.updated_at !== incomingRunner.updated_at) {  
conflicts.push({  
type: 'runner_modified',  
message: \`Runner \${incomingRunner.runner_number} has conflicting data\`,  
existing,  
incoming: incomingRunner,  
resolution: 'keep_newer'  
});  
}  
}  
<br/>return conflicts;  

}

async mergeRaceData(existing: Race, imported: RaceExportSchema): Promise&lt;void&gt; {  
// Strategy: Keep newer records based on updated_at

// Merge runners  
for (const runner of imported.runners) {  
const existingRunner = await db.runners.get(runner.id);  
if (!existingRunner || new Date(runner.updated_at) > new Date(existingRunner.updated_at)) {  
await db.runners.put(runner);  
}  
}  
<br/>// Merge checkpoint times (additive - don't delete)  
for (const time of imported.checkpointTimes) {  
const existingTime = await db.checkpointTimes.get(time.id);  
if (!existingTime) {  
await db.checkpointTimes.add(time);  
} else if (new Date(time.updated_at) > new Date(existingTime.updated_at)) {  
await db.checkpointTimes.put(time);  
}  
}  
<br/>// Update race metadata  
if (new Date(imported.race.updated_at) > new Date(existing.updated_at)) {  
await db.races.put(imported.race);  
}  

}  
}

interface ImportResult {  
success: boolean;  
errors?: string\[\];  
conflicts?: Conflict\[\];  
requiresUserDecision?: boolean;  
imported?: {  
runners: number;  
checkpoints: number;  
times: number;  
};  
}

interface Conflict {  
type: string;  
message: string;  
existing: any;  
incoming: any;  
resolution: 'user_choice' | 'keep_newer' | 'merge';  
}

**Data Integrity Mechanisms**

**1\. Transaction Safety**

// All multi-table operations use transactions  
await db.transaction('rw', db.runners, db.checkpointTimes, async () => {  
await db.runners.add(runner);  
await db.checkpointTimes.add(time);  
// If either fails, both rollback  
});

**2\. Referential Integrity**

// Before deleting a race, cascade delete related records  
async function deleteRaceWithCascade(raceId: string): Promise&lt;void&gt; {  
await db.transaction('rw',  
db.races,  
db.checkpoints,  
db.runners,  
db.checkpointTimes,  
async () => {  
await db.checkpointTimes.where('race_id').equals(raceId).delete();  
await db.runners.where('race_id').equals(raceId).delete();  
await db.checkpoints.where('race_id').equals(raceId).delete();  
await db.races.delete(raceId);  
}  
);  
}

**3\. Data Validation Layer**

import { z } from 'zod';

const RunnerSchema = z.object({  
id: z.string().uuid(),  
race_id: z.string().uuid(),  
runner_number: z.number().int().positive(),  
first_name: z.string().optional(),  
last_name: z.string().optional(),  
gender: z.enum(\['M', 'F', 'X'\]),  
wave_batch: z.number().int().positive(),  
status: z.enum(\['not_started', 'in_progress', 'finished', 'dns', 'dnf', 'withdrawn'\]),  
created_at: z.string().datetime(),  
updated_at: z.string().datetime()  
});

// Validate before database operations  
function validateRunner(data: unknown): Runner {  
return RunnerSchema.parse(data);  
}

**Performance Optimization Strategies**

**1\. Indexing Strategy**

// Composite indexes for common queries  
'\[race_id+runner_number\]' // Fast runner lookup within race  
'\[checkpoint_id+runner_id\]' // Fast time lookup for runner at checkpoint  
'\[checkpoint_id+time_group\]' // Fast callout sheet generation

**2\. Denormalization for Read Performance**

// Store race_id and runner_number in CheckpointTimes  
// Avoids JOIN equivalent operations for leaderboard  
interface CheckpointTime {  
// ... other fields  
race_id: string; // Denormalized  
runner_number: number; // Denormalized  
}

**3\. Caching Layer with Zustand**

interface AppState {  
// Cache frequently accessed data  
currentRace: Race | null;  
runnersCache: Map&lt;string, Runner&gt;;  
leaderboardCache: Map&lt;string, LeaderboardEntry\[\]&gt;;  
lastLeaderboardUpdate: number;

// Actions  
setCurrentRace: (race: Race) => void;  
invalidateLeaderboard: () => void;  
getRunner: (id: string) => Promise&lt;Runner&gt;;  
}

const useStore = create&lt;AppState&gt;((set, get) => ({  
currentRace: null,  
runnersCache: new Map(),  
leaderboardCache: new Map(),  
lastLeaderboardUpdate: 0,

getRunner: async (id: string) => {  
const cached = get().runnersCache.get(id);  
if (cached) return cached;

const runner = await db.runners.get(id);  
if (runner) {  
set(state => ({  
runnersCache: new Map(state.runnersCache).set(id, runner)  
}));  
}  
return runner;  

},

invalidateLeaderboard: () => set({ leaderboardCache: new Map() })  
}));

**4\. Virtualization for Large Lists**

// Use react-window for rendering large runner lists  
import { FixedSizeGrid } from 'react-window';

function RunnerGrid({ runners }: { runners: Runner\[\] }) {  
return (  
<FixedSizeGrid  
columnCount={10}  
columnWidth={80}  
height={600}  
rowCount={Math.ceil(runners.length / 10)}  
rowHeight={80}  
width={800}  
\>  
{({ columnIndex, rowIndex, style }) => {  
const index = rowIndex \* 10 + columnIndex;  
const runner = runners\[index\];  
return runner ? (  
<br/>) : null;  
}}  
&lt;/FixedSizeGrid&gt;  
);  
}

**Security Considerations**

**1\. Data Sanitization**

function sanitizeRunnerInput(input: string): string {  
// Remove potentially harmful characters  
return input  
.replace(/\[<>"'\]/g, '')  
.trim()  
.slice(0, 100); // Limit length  
}

**2\. Import Validation**

// Reject imports exceeding reasonable limits  
const MAX_RUNNERS = 10000;  
const MAX_CHECKPOINTS = 50;  
const MAX_TIMES = 500000;

if (data.runners.length > MAX_RUNNERS) {  
throw new Error('Import exceeds maximum runner limit');  
}

**3\. Local Storage Encryption (Optional Enhancement)**

// For sensitive race data, encrypt before IndexedDB storage  
import { AES } from 'crypto-js';

const ENCRYPTION_KEY = await deriveKeyFromPassword(userPassword);

function encryptData(data: string): string {  
return AES.encrypt(data, ENCRYPTION_KEY).toString();  
}

function decryptData(encrypted: string): string {  
return AES.decrypt(encrypted, ENCRYPTION_KEY).toString();  
}

**Testing Strategy**

**Unit Tests**

describe('DataImporter', () => {  
let importer: DataImporter;

beforeEach(() => {  
importer = new DataImporter();  
});

it('should validate correct export schema', async () => {  
const mockData = createMockExportData();  
const result = await importer.validateImport(mockData);  
expect(result.valid).toBe(true);  
});

it('should detect checksum mismatch', async () => {  
const mockData = createMockExportData();  
mockData.checksum = 'invalid';  
const result = await importer.validateImport(mockData);  
expect(result.valid).toBe(false);  
expect(result.errors).toContain('checksum mismatch');  
});

it('should parse runner input correctly', () => {  
expect(parseRunnerInput('1, 5, 10-12')).toEqual(\[1, 5, 10, 11, 12\]);  
expect(parseRunnerInput('100-102, 105')).toEqual(\[100, 101, 102, 105\]);  
});  
});

**Integration Tests**

describe('Checkpoint Operations', () => {  
it('should mark runner and update leaderboard', async () => {  
const race = await createTestRace();  
const runner = await createTestRunner([race.id](http://race.id));  
const checkpoint = await createTestCheckpoint([race.id](http://race.id));

const markOff = new MarkOffOperation({  
runnerId: runner.id,  
checkpointId: checkpoint.id,  
actualTime: new Date()  
});  
<br/>await markOff.execute();  
<br/>const times = await db.checkpointTimes  
.where('runner_id')  
.equals(runner.id)  
.toArray();  
<br/>expect(times.length).toBe(1);  
expect(times\[0\].called_in).toBe(false);  

});  
});

**End-to-End Tests**

describe('Export/Import Workflow', () => {  
it('should export and reimport without data loss', async () => {  
// Create full race with data  
const race = await setupCompleteRace();

// Export  
const exporter = new DataExporter();  
const exported = await exporter.exportRace(race.id);  
<br/>// Clear database  
await db.delete();  
await db.open();  
<br/>// Import  
const importer = new DataImporter();  
const result = await importer.importRace(JSON.stringify(exported));  
<br/>expect(result.success).toBe(true);  
<br/>// Verify data integrity  
const importedRace = await db.races.get(race.id);  
expect(importedRace).toEqual(race);  

});  
});

**Deployment Architecture**

**PWA Configuration**

// vite.config.ts  
import { VitePWA } from 'vite-plugin-pwa';

export default {  
plugins: \[  
VitePWA({  
registerType: 'autoUpdate',  
includeAssets: \['favicon.ico', 'robots.txt', 'apple-touch-icon.png'\],  
manifest: {  
name: 'RaceTracker Pro',  
short_name: 'RaceTracker',  
description: 'Offline race tracking for volunteers',  
theme_color: '#ffffff',  
icons: \[  
{  
src: 'pwa-192x192.png',  
sizes: '192x192',  
type: 'image/png'  
},  
{  
src: 'pwa-512x512.png',  
sizes: '512x512',  
type: 'image/png',  
purpose: 'any maskable'  
}  
\]  
},  
workbox: {  
runtimeCaching: \[  
{  
urlPattern: /^<https://fonts.googleapis.com/.\*/i>,  
handler: 'CacheFirst',  
options: {  
cacheName: 'google-fonts-cache',  
expiration: {  
maxEntries: 10,  
maxAgeSeconds: 60 \* 60 \* 24 \* 365 // 1 year  
}  
}  
}  
\]  
}  
})  
\]  
};

**Service Worker Strategy**

// Offline-first caching strategy  
self.addEventListener('fetch', (event) => {  
event.respondWith(  
caches.match(event.request).then((response) => {  
// Return cached version or fetch  
return response || fetch(event.request);  
})  
);  
});

// Update service worker  
self.addEventListener('activate', (event) => {  
const cacheWhitelist = \['racetracker-v1'\];  
event.waitUntil(  
caches.keys().then((cacheNames) => {  
return Promise.all(  
cacheNames.map((cacheName) => {  
if (!cacheWhitelist.includes(cacheName)) {  
return caches.delete(cacheName);  
}  
})  
);  
})  
);  
});

**Future Enhancements**

**Phase 2 Features**

- **Multi-Device Synchronization**
  - WebRTC peer-to-peer sync between checkpoint devices
  - Conflict resolution UI for simultaneous edits
  - Real-time updates across devices
- **Advanced Analytics**
  - Pace prediction based on early checkpoints
  - Outlier detection (unusually fast/slow times)
  - Historical race comparison
  - Weather impact analysis
- **Integration Capabilities**
  - Timing chip integration (RFID readers)
  - GPS tracking integration
  - External timing system sync
  - Results publication to race websites
- **Enhanced Reporting**
  - PDF generation for official results
  - CSV export for spreadsheet analysis
  - Automated email reports
  - Real-time web dashboard for spectators
- **Accessibility Improvements**
  - Voice commands for hands-free operation
  - Screen reader optimizations
  - High contrast mode enhancements
  - Haptic feedback for mobile devices

**Implementation Timeline**

**Phase 1: Core Development (6-8 weeks)**

**Week 1-2: Foundation**

- Project setup (Vite, React, TypeScript)
- Database schema implementation
- Basic UI framework

**Week 3-4: Checkpoint Mode**

- Runner mark-off interface
- Callout sheet generation
- Overview dashboard

**Week 5-6: Base Station Mode**

- Bulk data entry
- Race overview
- Leaderboard calculations

**Week 7-8: Export/Import**

- JSON export/import
- QR code generation
- Data validation

**Phase 2: Testing & Refinement (2-3 weeks)**

**Week 9-10: Testing**

- Unit test coverage
- Integration testing
- Performance optimization

**Week 11: UAT**

- User acceptance testing with volunteers
- Bug fixes and refinements

**Phase 3: Deployment (1 week)**

**Week 12: Production**

- PWA deployment
- Documentation
- Training materials

**Appendix A: Sample Data Models**

**Example Race Configuration**

{  
"race": {  
"id": "550e8400-e29b-41d4-a716-446655440000",  
"name": "Mount Glorious Trail Run 2025",  
"date": "2025-11-22",  
"start_time": "07:00:00",  
"runner_range_start": 1,  
"runner_range_end": 128,  
"created_at": "2025-11-21T10:00:00.000Z",  
"updated_at": "2025-11-21T10:00:00.000Z",  
"metadata": {  
"event_type": "trail_run",  
"distance": "22km",  
"organizer": "WICEN Queensland"  
}  
},  
"checkpoints": \[  
{  
"id": "cp1-uuid",  
"race_id": "550e8400-e29b-41d4-a716-446655440000",  
"checkpoint_number": 1,  
"checkpoint_name": "CP1 - Start",  
"order_sequence": 1  
},  
{  
"id": "cp2-uuid",  
"race_id": "550e8400-e29b-41d4-a716-446655440000",  
"checkpoint_number": 2,  
"checkpoint_name": "CP2",  
"order_sequence": 2  
},  
{  
"id": "cp3-uuid",  
"race_id": "550e8400-e29b-41d4-a716-446655440000",  
"checkpoint_number": 3,  
"checkpoint_name": "CP3",  
"order_sequence": 3  
},  
{  
"id": "cp4-uuid",  
"race_id": "550e8400-e29b-41d4-a716-446655440000",  
"checkpoint_number": 4,  
"checkpoint_name": "Finish",  
"order_sequence": 4  
}  
\]  
}

**Example CheckpointTime Record**

{  
"id": "time-uuid-1",  
"checkpoint_id": "cp2-uuid",  
"runner_id": "runner-uuid-22",  
"race_id": "550e8400-e29b-41d4-a716-446655440000",  
"runner_number": 22,  
"actual_time": "2025-11-22T07:43:12.456Z",  
"common_time": "2025-11-22T07:40:00.000Z",  
"time_group": "07:40-07:45",  
"called_in": true,  
"call_in_time": "2025-11-22T07:46:30.000Z",  
"created_at": "2025-11-22T07:43:12.456Z",  
"updated_at": "2025-11-22T07:46:30.000Z"  
}

**Appendix B: API Reference**

**Database Operations**

// Races  
db.races.add(race: Race): Promise&lt;string&gt;  
db.races.get(id: string): Promise&lt;Race | undefined&gt;  
db.races.update(id: string, changes: Partial&lt;Race&gt;): Promise&lt;number&gt;  
db.races.delete(id: string): Promise&lt;void&gt;

// Runners  
db.runners.add(runner: Runner): Promise&lt;string&gt;  
db.runners.where('race_id').equals(raceId).toArray(): Promise&lt;Runner\[\]&gt;  
db.runners.where('\[race_id+runner_number\]').equals(\[raceId, number\]).first()

// CheckpointTimes  
db.checkpointTimes.add(time: CheckpointTime): Promise&lt;string&gt;  
db.checkpointTimes.where('checkpoint_id').equals(id).toArray()  
db.checkpointTimes.where('time_group').equals(group).toArray()

// Bulk Operations  
db.runners.bulkAdd(runners: Runner\[\]): Promise&lt;string\[\]&gt;  
db.runners.bulkUpdate(updates: Array&lt;{key: string, changes: Partial<Runner&gt;}>)

**Conclusion**

This solution design provides a comprehensive blueprint for implementing RaceTracker Pro as a robust, offline-capable race management system. The architecture prioritizes data integrity, performance, and user experience while maintaining flexibility for future enhancements.

Key strengths of this design:

- **Offline-First**: Complete functionality without internet dependency
- **Data Integrity**: Transactional operations, validation, and conflict resolution
- **Performance**: Optimized indexing, caching, and virtualization strategies
- **Scalability**: Supports races from 10 to 2000+ participants
- **Portability**: JSON export/import with checksums and validation
- **Maintainability**: Clean architecture with separation of concerns

The database schema is normalized yet optimized with strategic denormalization for read-heavy operations. The three-tier timing system (actual, common, call-in) elegantly balances precision with operational efficiency for volunteer-based tracking.

This design serves as both a technical specification and implementation guide for development teams, ensuring consistency and quality throughout the build process.