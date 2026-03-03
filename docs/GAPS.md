# RaceTracker Pro — Feature Gaps Document

> Tests are excluded — handled by separate dev.  
> This document covers every feature/data gap between the current codebase and the stated requirements.

---

## ✅ GAP-01 — RESOLVED

Schema v8 adds optional `firstName`, `lastName`, `gender`, `batchNumber` on `runners` table. `RosterImport` component handles CSV population. Fields default to null/X/1.

---

## ✅ GAP-02 — RESOLVED

`race_batches` table added in schema v8. `BatchConfigStep` component in race setup wizard. `raceMaintenanceStore` has batch CRUD. `RaceMaintenanceRepository` has batch methods.

---

## ✅ GAP-03 — RESOLVED

`CheckpointRepository.markRunner()` computes and persists `commonTime`, `commonTimeLabel`, `calledIn: false`. `markGroupCalledIn()` sets `calledIn: true` and persists to Dexie.

---

## ✅ GAP-04 — RESOLVED

`BaseOperationsRepository.updateRunner()` sets `markOffEntryTime: new Date().toISOString()` on every base station entry.

---

## ✅ GAP-05 — RESOLVED

`LiveDashboardView` (`src/views/LiveDashboardView.jsx`) — cross-checkpoint runner × checkpoint matrix with `commonTime` cells.

---

## ✅ GAP-06 — RESOLVED

`LeaderboardView` (`src/views/LeaderboardView.jsx`) — elapsed time = `commonTime − batchStartTime`, filterable by gender/batch.

---

## ✅ GAP-07 — RESOLVED

`PendingCallInsView` (`src/views/PendingCallInsView.jsx`) — groups uncalled `checkpoint_runners` by checkpoint + `commonTimeLabel`, with mark-called-in button.

---

## ✅ GAP-08 — RESOLVED

`src/utils/csvImport.js` + `RosterImport` component (`src/modules/race-maintenance/components/RosterImport.jsx`), wired in `RaceOverview`. Upserts via `RaceMaintenanceRepository.bulkUpsertRunnerDetails()`.

---

## ✅ GAP-09 — RESOLVED

`StorageService` exports include `schemaVersion: 8`. Import validates version. `ConflictResolutionDialog` is wired in `ImportExportModal`.

---

---

## ✅ GAP-10 — RESOLVED: baseOperationsStore Now Uses Dexie

**Resolved in:** `feature/base-ops-consolidation` (merged to main 2026-03-03)

`baseOperationsStore.js` was migrated from `localStorage` to Dexie. All runner reads/writes now go through `BaseOperationsRepository` which queries `db.base_station_runners` using the correct compound-index `between()` pattern. `initialize()` fetches the full race object from `db.races` and stores it as `currentRace`. Persist state was cleaned up to only include `sortOrder` and `filterStatus`.

Additionally, a compound-index bug in `BaseOperationsRepository.js` and `StorageService.getBaseStationRunners()` was fixed — Dexie does not support 2-column prefix queries on a 3-column index; the query now uses `.between([raceId, cp, -Infinity], [raceId, cp, Infinity])`.

---

## ✅ GAP-11 — RESOLVED

`checkpointStore.getTimeSegments()` + `markSegmentCalledIn()` implemented in `src/modules/checkpoint-operations/store/checkpointStore.js`. `CalloutSheet` uses them.

---

## ✅ GAP-12 — RESOLVED: baseOperationsStore Tests Fully Passing

**Resolved in:** `feature/base-ops-consolidation` (merged to main 2026-03-03)

`test/base-operations/store/baseOperationsStore.test.js` was completely rewritten to:
- Seed `db.races` and `db.runners` via direct Dexie writes (using `fake-indexeddb`)
- Always re-read state via `useBaseOperationsStore.getState()` after mutations
- Remove all `test.skip` markers — all 14 tests now pass

All 605 vitest tests pass on `main`.

---

## All Gaps Resolved ✅

All gaps (GAP-01 through GAP-12) have been resolved as of 2026-03-03. See individual gap sections above for resolution details and the commits on `main`.
