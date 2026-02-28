# RaceTracker Pro — Feature Gaps Document

> Tests are excluded — handled by separate dev.  
> This document covers every feature/data gap between the current codebase and the stated requirements.

---

## GAP-01 — Runner Personal Data (Name, Gender) Missing

**Requirement:** Racers store their name, gender, and number.  
**Current state:** The `runners` table and `_createRunnerObject()` only persist:
- `raceId`, `number`, `status`, `recordedTime`, `notes`

**Missing fields:**
- `firstName` (string)
- `lastName` (string)
- `gender` ('M' | 'F' | 'X')

**Affected files:**
- `src/shared/services/database/schema.js` — schema definition
- `src/modules/race-maintenance/services/RaceMaintenanceRepository.js` — `_createRunnerObject()`
- `src/services/storage.js` — `saveRace()` runner init loop
- `src/types/index.js` — Runner typedef
- Race setup UI — no fields to collect name/gender

**Impact:** Leaderboard by gender (GAP-06) is impossible without gender. Runner identity is bib-number-only throughout the app.

---

## GAP-02 — Race Batches / Waves Not Implemented

**Requirement:** Race information includes starting batches and when each batch starts.  
Runners belong to a batch. Leaderboard is calculated relative to batch start time.

**Current state:** The `races` table has a single `startTime`. There is no concept of waves or batches. `runners` has no `batchNumber` field.

**Missing entirely:**
- `race_batches` table: `raceId`, `batchNumber`, `batchName`, `startTime`
- `batchNumber` field on `runners`
- Batch configuration step in race setup UI
- Batch assignment when initialising runners

**Affected files:**
- `src/shared/services/database/schema.js` — no `race_batches` table
- `src/modules/race-maintenance/services/RaceMaintenanceRepository.js` — no batch creation
- `src/modules/race-maintenance/store/raceMaintenanceStore.js` — no batch state
- `src/components/Setup/RaceSetup.jsx` / `RaceDetailsStep.jsx` — no batch UI
- `src/types/index.js` — no batch typedef

**Impact:** GAP-06 (leaderboard) depends on this. Without batch start times there is no elapsed time calculation. This is the root dependency for the most-requested head-up dashboard feature.

---

## GAP-03 — Checkpoint Only Stores 2 Times, Not 3

**Requirement:**  
Per checkpoint per runner — **3 distinct times**:
1. **Actual time** — exact moment runner entered the checkpoint (tap time)
2. **Common time** — grouped to the nearest 5-minute interval
3. **Call-in time** — when the checkpoint volunteer called the group through to base

**Current state:**  
`checkpoint_runners` schema has `markOffTime` and `callInTime` only. In `markRunner()` in `CheckpointRepository.js`:
```js
const timestamp = markOffTime || callInTime || new Date().toISOString();
callInTime: callInTime || timestamp,
markOffTime: markOffTime || timestamp   // both default to the same value
```
The `commonTime` (5-min interval) is computed on-the-fly in `useRaceStore` for display but **never stored** on the record. There is no `calledIn` boolean flag, no `commonTimeLabel` string.

**Missing fields on `checkpoint_runners`:**
- `actualTime` — rename/clarify from `markOffTime`; exact tap timestamp, always recorded
- `commonTime` — ISO string, floor to 5-min interval; currently only computed in memory, not persisted
- `commonTimeLabel` — e.g. `"07:40–07:45"`, stored string to avoid re-computation
- `calledIn` — boolean, set true when a group is marked called in the callout sheet

**Currently missing behaviour:**
- `markRunner()` does not compute or persist `commonTime`
- `CalloutSheet.jsx` calls `getTimeSegments()` which groups in memory at render time; this grouping is lost on reload if not persisted
- "Mark called in" (`markSegmentCalled`) sets a store-level flag but there is no `calledIn` field written back to `checkpoint_runners` rows

**Affected files:**
- `src/shared/services/database/schema.js`
- `src/modules/checkpoint-operations/services/CheckpointRepository.js`
- `src/services/storage.js` — `markCheckpointRunner()`, `bulkMarkCheckpointRunners()`
- `src/store/useRaceStore.js` — `markCheckpointRunner()`, `getTimeSegments()`
- `src/services/timeUtils.js` — `getSegmentStart()` exists but result not stored

**Impact:** If the page reloads mid-race the callout sheet loses its called-in state. Base station has no reliable `calledIn` source to display pending call-in counts (GAP-07).

---

## GAP-04 — Base Station Mark-Off Entry Time Not Recorded

**Requirement:** Base station tracks the common time runners entered a checkpoint, **plus** the time the operator entered that data into the base station system.

**Current state:** `base_station_runners` stores only `commonTime` (the time from the checkpoint). There is no field recording when the base station operator actually keyed that entry in.

**Missing field:**
- `markOffEntryTime` — ISO string, set to `Date.now()` when operator submits the form

**Affected files:**
- `src/shared/services/database/schema.js`
- `src/services/storage.js` — `markBaseStationRunner()`, `bulkMarkBaseStationRunners()`
- `src/modules/base-operations/services/BaseOperationsRepository.js` — `updateRunner()`
- `src/components/BaseStation/DataEntry.jsx` — form submit handler

**Impact:** Audit trail for base station is incomplete. No way to know the lag between checkpoint common time and when it was recorded at base.

---

## GAP-05 — No Cross-Checkpoint Progress View (Heads-Up Grid)

**Requirement:** Base station should have an overview showing all racers as they enter each checkpoint — a matrix of runner × checkpoint.

**Current state:** `RaceOverview` shows runner status per race but is a flat list for a single checkpoint context. There is no view that shows runner 101's progress across CP1 → CP2 → CP3 in a single table.

**Missing:**
- A "Live Dashboard" or "Heads-Up" tab in Base Station module
- A progress grid component: rows = runners, columns = checkpoints, cells = `commonTime` if passed or `—`
- Colour coding: green = passed, yellow = in-progress window, red = overdue (configurable)
- Sortable by bib, batch, or time of last seen checkpoint

**Affected files / new files needed:**
- New component: `src/modules/base-operations/components/LiveDashboard.jsx` (does not exist)
- New store selector: `selectProgressMatrix()` in base operations store or `useRaceStore`
- Query pattern: join `checkpoint_runners` across all checkpoints for a race

**Impact:** The primary "command overview" feature requested is entirely absent.

---

## GAP-06 — Fastest Runners Leaderboard Not Implemented

**Requirement:** Base station heads-up view shows fastest runners calculated by gender and batch, updating live as runners pass checkpoints.

**Current state:** Nothing exists. No leaderboard, no elapsed time calculation, no gender or batch grouping.

**What's needed:**
- Elapsed time formula: `elapsed = checkpointCommonTime − batchStartTime` (requires GAP-02 resolved)
- Leaderboard sorted by elapsed time ascending, per checkpoint
- Filtered by gender (requires GAP-01 resolved) and batch (requires GAP-02)
- Live recalculation as new checkpoint data arrives
- UI: tab or dropdown to switch gender/batch filter

**Blocked by:** GAP-01 (no gender), GAP-02 (no batch start times)

**Affected files / new files needed:**
- New component: `src/modules/base-operations/components/Leaderboard.jsx` (does not exist)
- New store selector: `selectLeaderboard(gender, batchNumber)` 
- `src/services/timeUtils.js` — needs `calculateElapsed(checkpointTime, batchStartTime)` helper

---

## GAP-07 — Pending Call-In Counts Not Surfaced

**Requirement:** Base station can see how many runners are still pending a call-in at each checkpoint (i.e., have been marked at checkpoint but not yet called through to base).

**Current state:** There is no `calledIn` field on `checkpoint_runners` (see GAP-03). The callout sheet in `CalloutSheet.jsx` tracks "called in" state in Zustand memory only — it is not persisted and not visible at base station at all.

**Missing:**
- `calledIn` + `callInTime` persisted on `checkpoint_runners` rows (part of GAP-03)
- Query: `checkpoint_runners WHERE raceId=X AND calledIn=false AND status='passed'` grouped by `commonTimeLabel`
- UI panel in base station showing per-checkpoint pending groups with runner numbers

**Blocked by:** GAP-03 (calledIn field not stored)

**Affected files / new files needed:**
- New component: `src/modules/base-operations/components/PendingCallIns.jsx` (does not exist)
- New store selector: `selectPendingCallIns(checkpointNumber)`
- `src/modules/checkpoint-operations/services/CheckpointRepository.js` — needs `markGroupCalledIn()`

---

## GAP-08 — CSV Runner Roster Import Not Implemented

**Requirement:** Ability to import runner data (name, gender, number, batch) from a CSV file. The design requires this to populate the runners table after race creation.

**Current state:** CSV **export** of results exists (`StorageService.generateCSV()`). There is zero CSV **import** capability anywhere in the codebase.

**Missing:**
- CSV parsing utility (column mapping: `number`, `firstName`, `lastName`, `gender`, `batchNumber`)
- File upload UI in Race Maintenance module
- Upsert logic: match on bib `number`, update name/gender/batch, never delete rows
- Validation: report unrecognised bibs, duplicate numbers, missing required columns

**Affected files / new files needed:**
- New util: `src/utils/csvImport.js` (does not exist)
- New component: `src/modules/race-maintenance/components/RosterImport.jsx` (does not exist)
- `src/modules/race-maintenance/services/RaceMaintenanceRepository.js` — `bulkUpsertRunnerDetails()`

---

## GAP-09 — Export JSON Has No Schema Version

**Requirement:** Import/export must preserve data integrity. Imports should be validated and conflicts resolved safely.

**Current state:**  
`StorageService.exportRaceConfig()` produces a JSON blob with `exportType` and `exportedAt` but **no `schemaVersion`**. Import in `importRaceConfig()` validates fields by hand but has no version check — if the schema changes it will silently import stale or incompatible data.

**Partial implementation exists:**
- `ConflictResolutionDialog.jsx` UI component exists
- `mergeRaceData()` exists in `StorageService`
- But neither is connected to a version-aware import flow

**Missing:**
- `schemaVersion` field (e.g. `8`) on all exported JSON
- Version validation gate on import: reject or warn if `schemaVersion` is too old
- Dry-run preview mode before committing import (the dialog exists but is not wired to a dry-run)
- `batches` array in export payload (once GAP-02 is resolved)
- Runner `firstName`, `lastName`, `gender`, `batchNumber` in export payload (once GAP-01 is resolved)

**Affected files:**
- `src/services/storage.js` — `exportRaceConfig()`, `importRaceConfig()`
- `src/components/ImportExport/ImportExportModal.jsx` — needs version display + dry-run trigger
- `src/components/ImportExport/ConflictResolutionDialog.jsx` — needs wiring to dry-run result

---

## Dependency Map

```
GAP-01 (gender/name)   ──────────────────────────────┐
                                                      ▼
GAP-02 (batches/waves) ──────────────────────────► GAP-06 (leaderboard)
                                                      ▲
GAP-03 (3 times / calledIn) ───────────────────► GAP-07 (pending call-ins)

GAP-01 + GAP-02 + GAP-03 ──────────────────────► GAP-05 (heads-up grid)

GAP-01 + GAP-02 ───────────────────────────────► GAP-09 (full export)

GAP-08 (CSV import) ─── depends on GAP-01 + GAP-02 fields existing first
```

---

## Recommended Implementation Order

| Phase | Gaps | Rationale |
|---|---|---|
| 1 | GAP-01, GAP-02 | Foundation — unlock all downstream features |
| 2 | GAP-03, GAP-04 | Complete the time model; fix checkpoint data integrity |
| 3 | GAP-07 | Pending call-ins (depends on GAP-03) |
| 4 | GAP-05, GAP-06 | Dashboard + leaderboard (depends on 1+2+3) |
| 5 | GAP-08 | CSV roster import (depends on GAP-01+02 fields) |
| 6 | GAP-09 | Versioned export (add version + new fields) |
