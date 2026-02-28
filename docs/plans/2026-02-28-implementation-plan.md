# RaceTracker Pro — Implementation Plan
**Date:** 2026-02-28  
**Status:** Approved for implementation  
**Approach:** Incremental layers — data layer first, views built on top  
**Source documents:** `RaceTrackerProCompleteUserJourneyGuide.md`, `docs/GAPS.md`

---

## Overview

This plan addresses all 9 feature gaps identified in `docs/GAPS.md` and aligns the application with the complete user journey described in `RaceTrackerProCompleteUserJourneyGuide.md`. It covers three user roles:

- **Race Director (Jennifer)** — setup, templates, batch configuration, CSV roster import
- **Checkpoint Volunteer (Sarah)** — 3-time marking, callout sheet persistence
- **Base Station Coordinator (Mike)** — live dashboard, leaderboard, pending call-ins

### Key decisions
- Race templates are **static JSON files committed to the codebase** (`src/data/templates/`) — no database records, available offline to all users
- New Base Station screens use **dedicated routes** (not additional tabs)
- Missing data (names/gender/batch) shows **graceful placeholders** rather than blocking access
- Template carries over: checkpoints, runner ranges, batch structure — **not** runner personal data or statuses

---

## Phase 1 — Database Schema v8 + Data Layer

> Resolves: GAP-01, GAP-02, GAP-03, GAP-04

### 1.1 Schema changes
**File:** `src/shared/services/database/schema.js`

**New table — `race_batches`**
```
race_batches: "++id, [raceId+batchNumber], raceId, batchNumber, batchName, startTime"
```

**Modified `runners`** — add fields:
- `firstName` (string, optional)
- `lastName` (string, optional)
- `gender` ('M' | 'F' | 'X', default 'X')
- `batchNumber` (int, default 1)

**Modified `checkpoint_runners`** — add/rename fields:
- `actualTime` (ISO string — exact tap timestamp, replaces ambiguous `markOffTime`)
- `commonTime` (ISO string — floored to nearest 5-min interval, **persisted**)
- `commonTimeLabel` (string — e.g. `"10:45–10:50"`, **persisted**)
- `calledIn` (boolean, default false)
- `callInTime` (ISO string | null — when group was called to base)

**Modified `base_station_runners`** — add field:
- `markOffEntryTime` (ISO string — when operator keyed this entry in)

**Migration `.version(8).upgrade()`** defaults:
- `runners`: `gender = 'X'`, `batchNumber = 1`
- `checkpoint_runners`: `actualTime = markOffTime`, `commonTime = null`, `calledIn = false`
- `base_station_runners`: `markOffEntryTime = null`

### 1.2 Repository updates

**`RaceMaintenanceRepository`** (`src/modules/race-maintenance/services/RaceMaintenanceRepository.js`)
- `createBatch(raceId, batchData)` — add a wave to a race
- `getBatches(raceId)` — returns all batches sorted by startTime
- `updateBatch(batchId, updates)` — edit name or startTime
- `deleteBatch(batchId)` — remove a batch
- `bulkUpsertRunnerDetails(raceId, runners)` — upsert name/gender/batchNumber by bib number (for CSV import)

**`CheckpointRepository`** (`src/modules/checkpoint-operations/services/CheckpointRepository.js`)
- Update `markRunner()` — on mark, compute and persist `actualTime`, `commonTime`, `commonTimeLabel`
- Add `markGroupCalledIn(raceId, checkpointNumber, commonTimeLabel)` — sets `calledIn=true` + `callInTime=now()` on all matching rows

**`BaseOperationsRepository`** (`src/modules/base-operations/services/BaseOperationsRepository.js`)
- Update `updateRunner()` — set `markOffEntryTime = Date.now()` when status is being set

### 1.3 New utilities

**`src/utils/csvImport.js`**
- `parseCSV(fileContent)` — returns array of row objects
- `mapRunnerColumns(rows, columnMap)` — maps CSV columns to `{ number, firstName, lastName, gender, batchNumber }`
- `validateRunnerRows(rows)` — validates required `number` column, gender values, returns `{ valid, errors }`

**`src/services/timeUtils.js`** — add:
- `calculateElapsed(checkpointTime, batchStartTime)` — returns `{ hours, minutes, seconds, formatted: "H:MM:SS" }`
- `getCommonTimeLabel(actualTime)` — returns `"HH:MM–HH:MM"` string for the 5-min window

### 1.4 Type definitions
**`src/types/index.js`** — update:
- `Runner` typedef — add `firstName`, `lastName`, `gender`, `batchNumber`
- New `RaceBatch` typedef: `{ id, raceId, batchNumber, batchName, startTime }`

---

## Phase 2 — Race Templates (static data)

> Resolves: new feature — Race Director journey Stage 1

### 2.1 Template file structure
**Directory:** `src/data/templates/`

Each template is a JSON file. Schema:
```json
{
  "id": "mountain-trail-100k",
  "name": "Mountain Trail 100K",
  "description": "Annual 100km trail race across 5 checkpoints",
  "checkpoints": [
    { "number": 1, "name": "Aid Station 1" },
    { "number": 2, "name": "Summit Pass" },
    { "number": 3, "name": "Valley Aid" },
    { "number": 4, "name": "Final Climb" },
    { "number": 5, "name": "Finish Line" }
  ],
  "runnerRanges": [
    { "min": 100, "max": 349 }
  ],
  "defaultBatches": [
    { "batchNumber": 1, "batchName": "Elite Wave", "startOffsetMinutes": 0 },
    { "batchNumber": 2, "batchName": "Wave A", "startOffsetMinutes": 15 },
    { "batchNumber": 3, "batchName": "Wave B", "startOffsetMinutes": 30 }
  ]
}
```

**`src/data/templates/index.js`** — exports all templates as named array:
```js
export const RACE_TEMPLATES = [ ... ];
export const getTemplateById = (id) => RACE_TEMPLATES.find(t => t.id === id);
```

### 2.2 Template selection screen
**New file:** `src/components/Setup/TemplateSelectionStep.jsx`

- Full-screen grid of template cards
- Each card shows: name, description, checkpoint count, runner count
- "Start from scratch" card always first (no pre-fill)
- Selecting a template sets `formData` and advances to Step 1
- Accessed from the homepage "Create New Race" button — replaces going directly to the setup form

### 2.3 Updated setup wizard
**Modified:** `src/components/Setup/RaceSetup.jsx`

Current 2-step → new 4-step wizard:

| Step | Component | What it collects |
|---|---|---|
| 0 | `TemplateSelectionStep` *(new)* | Choose template or start fresh |
| 1 | `RaceDetailsStep` *(modified)* | Name, date, startTime, checkpoints — pre-filled from template |
| 2 | `RunnerRangesStep` *(modified)* | Runner number ranges — pre-filled from template |
| 3 | `BatchConfigStep` *(new)* | Wave names and start times — pre-filled from template `defaultBatches` |

`StepIndicator` updated to reflect 4 steps.

**Pre-fill behaviour:** When a template is selected, `formData` is initialised from the template. The user can freely edit everything — the template is a starting point only.

### 2.4 Batch configuration step
**New file:** `src/components/Setup/BatchConfigStep.jsx`

- List of editable batch rows: Batch Name (text input) + Start Time (time picker)
- "Add Batch" button to add more waves
- "Remove" button on each row (minimum 1 batch always required)
- Default when no template: single batch named "Wave 1" using the race `startTime`
- Validation: all start times must be valid, no two batches can share the same start time
- Summary below: "3 waves configured, first start at 07:00"

---

## Phase 3 — Race Maintenance Enhancements

> Resolves: GAP-01, GAP-08 (CSV import)

### 3.1 CSV Roster Import
**New file:** `src/modules/race-maintenance/components/RosterImport.jsx`

Placed on the `/race-maintenance/overview` page as a secondary action button ("Import Runner Roster").

**Flow:**
1. User clicks "Import Runner Roster"
2. File picker opens — accepts `.csv`
3. First 5 rows shown as preview with column-mapping dropdowns
4. User confirms column mapping
5. Validation runs — shows error count and examples
6. User confirms → `bulkUpsertRunnerDetails()` runs
7. Result toast: "248 runners updated, 2 added, 0 errors"

**CSV format (expected columns):**
```
number, firstName, lastName, gender, batchNumber
101, Jane, Smith, F, 1
102, John, Doe, M, 2
```
- Only `number` is required
- Unknown columns are ignored
- Runners in CSV but not in race are skipped with a warning
- Runners in race but not in CSV are left unchanged

### 3.2 Edit Runner Details (inline)
**Modified:** `src/views/RaceOverview.jsx`

- Runner rows in the table become clickable
- Clicking opens an inline edit row or small modal: first name, last name, gender, batch assignment
- Saves via `bulkUpsertRunnerDetails()` (single row)

---

## Phase 4 — Checkpoint Operations (3-time model)

> Resolves: GAP-03

### 4.1 Fix mark runner persistence
**Modified:** `src/modules/checkpoint-operations/services/CheckpointRepository.js` — `markRunner()`

```
On tap:
  actualTime    = new Date().toISOString()         // exact tap time
  commonTime    = getCommonTimeStart(actualTime)   // floor to 5-min interval ISO
  commonTimeLabel = getCommonTimeLabel(actualTime) // "10:45–10:50"
  calledIn      = false
  callInTime    = null
  status        = 'passed'
```

All 5 fields persisted to `checkpoint_runners` row.

### 4.2 Fix callout sheet call-in persistence
**Modified:** `src/components/Checkpoint/CalloutSheet.jsx`

"Mark Called In" button must:
1. Call `CheckpointRepository.markGroupCalledIn(raceId, checkpointNumber, commonTimeLabel)`
2. This sets `calledIn=true` + `callInTime=now()` on ALL rows with that `commonTimeLabel`
3. Reload the segment list from DB (not just toggle in-memory state)

Currently this only mutates Zustand state — the fix makes it persist so the called-in status survives page reload.

---

## Phase 5 — Base Station Dashboard (new routes)

> Resolves: GAP-05, GAP-06, GAP-07

### 5.1 New routes
**Modified:** `src/App.jsx`

```jsx
<Route path="/base-station/dashboard"   element={<LiveDashboardView />} />
<Route path="/base-station/leaderboard" element={<LeaderboardView />} />
<Route path="/base-station/pending"     element={<PendingCallInsView />} />
```

All wrapped in `<ProtectedRoute moduleType={MODULE_TYPES.BASE_STATION}>`.

Navigation links added to the `BaseStationView` header tab bar alongside existing tabs.

### 5.2 Live Dashboard
**New file:** `src/views/LiveDashboardView.jsx`

**Panel A — Runner Progress Grid (main content)**

| Bib | Name | Gender | Batch | CP1 | CP2 | CP3 | CP4 | Status |
|---|---|---|---|---|---|---|---|---|
| 101 | Jane Smith | F | Wave A | 08:15 | 10:22 | — | — | Active |
| 102 | — | — | Wave B | 08:18 | — | — | — | Active |

- Cells show `commonTime` formatted as `HH:mm` (green background) or `—` (gray)
- Name/gender/batch show `—` when not set (graceful)
- Filter bar: batch dropdown, gender toggle (All / M / F), status filter (All / Active / DNF / DNS)
- Sort: bib number | batch | last seen checkpoint (most recent first)

**Panel B — Checkpoint Summary Strip (top bar)**

```
CP1: 250/250 ✓  |  CP2: 245/250  |  CP3: 142/250  |  CP4: 68/250  |  Finish: 12/250
```

Each pill is clickable — navigates to `/base-station/pending?cp=N`.

### 5.3 Leaderboard
**New file:** `src/views/LeaderboardView.jsx`

- Gender filter tabs: All | Male | Female
- Batch filter dropdown: All Batches | Batch 1 | Batch 2...
- Table columns: Rank | Bib | Name | Gender | Batch | Elapsed | Last CP
- `elapsed = latestCheckpointCommonTime − batch.startTime` (uses `calculateElapsed()`)
- Falls back to `race.startTime` if no batch data
- Falls back to `Runner #N` if no name data
- Auto-refreshes every 30 seconds; manual refresh button
- Expandable: default top 10, "Show all" button

**Example row:**
```
1 | #142 | Jane Smith | F | Wave A | 3:45:22 | CP4
```

### 5.4 Pending Call-Ins
**New file:** `src/views/PendingCallInsView.jsx`

- Checkpoint tabs across top: CP1 | CP2 | CP3...
- For the selected checkpoint, lists groups by `commonTimeLabel`
- Each group card:
  ```
  10:35–10:40  ·  5 runners: 110, 112, 115, 120, 122  ·  [PENDING]  [Mark Called In]
  10:40–10:45  ·  4 runners: 130, 135, 140, 142        ·  ✓ Called In at 10:47
  ```
- "Mark Called In" calls `CheckpointRepository.markGroupCalledIn()` → persists to DB
- Source query: `checkpoint_runners WHERE raceId=X AND checkpointNumber=N` grouped by `commonTimeLabel`
- Empty state: "All groups called in ✓" with green checkmark

---

## Phase 6 — Export / Import Integrity

> Resolves: GAP-09

### 6.1 Versioned export
**Modified:** `src/services/storage.js` — `exportRaceConfig()`

Add to all export payloads:
```json
{
  "schemaVersion": 8,
  "exportedAt": "...",
  "exportType": "full-race-data",
  "race": { ... },
  "batches": [ ... ],
  "checkpoints": [ ... ],
  "runners": [
    { "number": 101, "firstName": "Jane", "lastName": "Smith", "gender": "F", "batchNumber": 1, "status": "..." }
  ],
  "checkpointRunners": [
    { "number": 101, "checkpointNumber": 1, "actualTime": "...", "commonTime": "...", "commonTimeLabel": "...", "calledIn": true, "callInTime": "..." }
  ],
  "baseStationRunners": [ ... ],
  "withdrawalRecords": [ ... ]
}
```

### 6.2 Import validation gate
**Modified:** `src/services/storage.js` — `importRaceConfig()`

```
if (!exportData.schemaVersion)         → warn "Legacy export, some fields may be missing"
if (exportData.schemaVersion < 6)      → reject "Export too old to import safely"
if (exportData.schemaVersion 6 or 7)   → import with defaults for missing fields
if (exportData.schemaVersion === 8)    → full import including batches + personal data
```

### 6.3 Wire ConflictResolutionDialog to dry-run
**Modified:** `src/components/ImportExport/ImportExportModal.jsx`

- Before committing import, run a dry-run pass that collects conflicts
- If conflicts found → show `ConflictResolutionDialog` (already exists, just needs wiring)
- User resolves conflicts → full import commits in single Dexie transaction

---

## New Files

| File | Purpose |
|---|---|
| `src/data/templates/index.js` | Template registry + `getTemplateById()` |
| `src/data/templates/*.json` | One JSON file per committed race template |
| `src/components/Setup/TemplateSelectionStep.jsx` | Step 0 — pick a template |
| `src/components/Setup/BatchConfigStep.jsx` | Step 3 — configure waves/batches |
| `src/modules/race-maintenance/components/RosterImport.jsx` | CSV roster import UI |
| `src/utils/csvImport.js` | CSV parser + column mapper + validator |
| `src/views/LiveDashboardView.jsx` | Runner × checkpoint progress grid |
| `src/views/LeaderboardView.jsx` | Leaderboard filtered by gender + batch |
| `src/views/PendingCallInsView.jsx` | Pending call-in groups per checkpoint |

---

## Modified Files

| File | Change |
|---|---|
| `src/shared/services/database/schema.js` | Version 8 schema + migration |
| `src/modules/race-maintenance/services/RaceMaintenanceRepository.js` | Batch CRUD + CSV upsert |
| `src/modules/checkpoint-operations/services/CheckpointRepository.js` | 3-time mark + `markGroupCalledIn()` |
| `src/modules/base-operations/services/BaseOperationsRepository.js` | `markOffEntryTime` on write |
| `src/components/Setup/RaceSetup.jsx` | 4-step wizard |
| `src/components/Setup/RaceDetailsStep.jsx` | Accept template pre-fill props |
| `src/components/Setup/RunnerRangesStep.jsx` | Accept template pre-fill props |
| `src/components/Setup/StepIndicator.jsx` | 4-step indicator |
| `src/components/Checkpoint/CalloutSheet.jsx` | Persist `calledIn` to DB on call-in |
| `src/services/storage.js` | Versioned export + import validation |
| `src/services/timeUtils.js` | `calculateElapsed()` + `getCommonTimeLabel()` |
| `src/views/RaceOverview.jsx` | Inline runner edit (name/gender/batch) |
| `src/App.jsx` | 3 new base station routes |
| `src/types/index.js` | Runner + RaceBatch typedefs |

---

## Implementation Order (dependency-safe)

```
Phase 1 (schema + repos + utils)
    ↓
Phase 2 (templates + 4-step wizard)   ← parallel with Phase 3
Phase 3 (CSV import + runner edit)    ← parallel with Phase 2
    ↓
Phase 4 (checkpoint 3-time model)
    ↓
Phase 5 (base station dashboard routes)
    ↓
Phase 6 (versioned export/import)
```

Phases 2 and 3 can be worked in parallel once Phase 1 is complete.  
Phase 5 depends on Phase 1 (for batch/gender data) and Phase 4 (for persisted `calledIn`).

---

## Gap Coverage

| Gap | Resolved in Phase |
|---|---|
| GAP-01 Runner personal data (name, gender) | 1, 3 |
| GAP-02 Race batches / waves | 1, 2 |
| GAP-03 Checkpoint 3-time model | 1, 4 |
| GAP-04 Base station mark-off entry time | 1 |
| GAP-05 Cross-checkpoint progress grid | 5 |
| GAP-06 Fastest runners leaderboard | 5 |
| GAP-07 Pending call-in counts | 4, 5 |
| GAP-08 CSV runner roster import | 1, 3 |
| GAP-09 Versioned export + import integrity | 6 |
| Race templates (new) | 2 |
