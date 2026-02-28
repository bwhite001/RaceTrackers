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

---

## GAP-10 — baseOperationsStore Uses localStorage Instead of Dexie

**Requirement:** All persistent race data must be stored in IndexedDB (Dexie) to support offline-first operation and cross-module consistency.

**Current state:** `src/modules/base-operations/store/baseOperationsStore.js` reads and writes race config and runner data using `localStorage.getItem/setItem` directly:
- `loadRaceConfig()` — `localStorage.getItem('race_${raceId}_config')`
- `loadRunners()` — `localStorage.getItem('race_${raceId}_runners')`
- `initializeRunners()` — `localStorage.setItem('race_${raceId}_runners', ...)`
- `updateRunner()` — `localStorage.setItem('race_${raceId}_runners', ...)`
- `bulkUpdateRunners()` — `localStorage.setItem('race_${raceId}_runners', ...)`

The `base_station_runners` table exists in Dexie (schema v7) and `StorageService` already has `loadBaseStationRunners()`, `markBaseStationRunner()`, and `bulkMarkBaseStationRunners()` — the store just never calls them.

**Impact:** Base station runners are isolated from the shared Dexie database. Data entered at base station is invisible to any report, export, or cross-module query. 11 of 14 store tests are skipped.

**What's needed:**
- Replace `loadRaceConfig()` with `StorageService.getRace(raceId)` (returns from `db.races`)
- Replace `loadRunners()` with `StorageService.loadBaseStationRunners(raceId)` (returns from `db.base_station_runners`)
- Replace `initializeRunners()` with `StorageService.bulkMarkBaseStationRunners()` or runner init from `db.runners`
- Replace `updateRunner()` / `bulkUpdateRunners()` with `StorageService.markBaseStationRunner()` / `bulkMarkBaseStationRunners()`

**Affected files:**
- `src/modules/base-operations/store/baseOperationsStore.js` — primary target
- `test/base-operations/store/baseOperationsStore.test.js` — test setup must seed Dexie, not localStorage

---

## GAP-11 — CalloutSheet Calls Non-Existent Store Methods

**Requirement:** The callout sheet must group runners into 5-minute time windows and allow volunteers to mark a whole group as "called in" to base station.

**Current state:** `src/components/Checkpoint/CalloutSheet.jsx` calls two methods that do **not exist** in `useRaceStore`:
- `getTimeSegments(checkpointNumber)` — expected to return runner groups bucketed into 5-min windows
- `markSegmentCalled(checkpointNumber, segmentStart)` — expected to mark a window as called-in

`SEGMENT_DURATION_MINUTES = 5` exists in `src/types/index.js` but no grouping logic is in the store. The grouping currently happens inline in the component (re-computed on each render) and is not persisted.

**This gap is a consequence of GAP-03** — without a persisted `calledIn` field on `checkpoint_runners`, any "mark called" action is lost on reload.

**What's needed:**
- Add `getTimeSegments(checkpointNumber)` to `useRaceStore` — groups `checkpointRunners` by `floor(markOffTime / 5min)`
- Add `markSegmentCalled(checkpointNumber, segmentStart)` to `useRaceStore` — sets `calledIn = true` on all matching `checkpoint_runners` rows (requires GAP-03 `calledIn` field)
- Wire `useRaceStore` in `CalloutSheet.jsx` instead of inline computation

**Affected files:**
- `src/store/useRaceStore.js` — add two methods
- `src/services/timeUtils.js` — `getSegmentStart()` exists; add `getSegmentLabel()` helper
- `src/components/Checkpoint/CalloutSheet.jsx` — switch to store methods (no structural change)
- `src/shared/services/database/schema.js` — needs `calledIn` field (GAP-03)

**Blocked by:** GAP-03 (persisted `calledIn` field)

---

## GAP-12 — baseOperationsStore Tests Fail Due to Stale Store References

**Current state:** The 11 skipped tests in `test/base-operations/store/baseOperationsStore.test.js` have two issues:
1. **Stale store reference** — tests call `const store = useBaseOperationsStore.getState()` once, then mutate via `store.someAction()`, then assert on `store.someField`. After a Zustand `set()`, the captured `store` reference holds pre-mutation state. Must call `useBaseOperationsStore.getState()` again after each mutation.
2. **localStorage coupling** — test setup seeds data via `localStorage.setItem(...)`. Once GAP-10 is resolved and the store reads from Dexie, tests must seed via Dexie instead (fake-indexeddb is already configured in `src/test/setup.js`).

**Impact:** 11 tests are masked — the skip comment "store methods not implemented" is misleading; the methods exist but stale refs prevent assertions from seeing updated state.

**What's needed:**
- After resolving GAP-10, remove all `test.skip` markers
- Update test setup to seed data via `StorageService` or direct `db.*` writes
- Replace `store.someField` assertions with `useBaseOperationsStore.getState().someField` after mutations

**Affected files:**
- `test/base-operations/store/baseOperationsStore.test.js`

---

## Dependency Map

```
GAP-01 (gender/name)   ──────────────────────────────┐
                                                      ▼
GAP-02 (batches/waves) ──────────────────────────► GAP-06 (leaderboard)
                                                      ▲
GAP-03 (3 times / calledIn) ───────────────────► GAP-07 (pending call-ins)
         │                                            │
         └──────────────────────────────────────► GAP-11 (callout sheet methods)

GAP-01 + GAP-02 + GAP-03 ──────────────────────► GAP-05 (heads-up grid)

GAP-01 + GAP-02 ───────────────────────────────► GAP-09 (full export)

GAP-08 (CSV import) ─── depends on GAP-01 + GAP-02 fields existing first

GAP-10 (localStorage→Dexie) ───────────────────► GAP-12 (unskip store tests)
```

---

## Recommended Implementation Order

| Phase | Gaps | Rationale |
|---|---|---|
| 1 | GAP-01, GAP-02 | Foundation — unlock all downstream features |
| 2 | GAP-03, GAP-04 | Complete the time model; fix checkpoint data integrity |
| 3 | GAP-10 | Fix base station store to use Dexie; unblocks GAP-12 |
| 4 | GAP-12 | Unskip store tests after GAP-10 resolved |
| 5 | GAP-07, GAP-11 | Pending call-ins + callout sheet methods (depend on GAP-03) |
| 6 | GAP-05, GAP-06 | Dashboard + leaderboard (depends on phases 1–3) |
| 7 | GAP-08 | CSV roster import (depends on GAP-01+02 fields) |
| 8 | GAP-09 | Versioned export (add version + new fields) |
