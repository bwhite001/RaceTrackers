# RaceTracker Pro — Ralph Loop Implementation TODO

Generated: 2026-02-19
Baseline: 219 failing tests, 109 passing, 15 skipped (343 total)

**Completion criteria:** All items ✅ · `npm run test:run` exits 0 · `npm run build && npm run test:e2e` exits 0

---

## TIER 0 — Test Infrastructure (fix first — unblocks everything else)

These are root causes, not individual test failures. Fixing each root cause
will resolve a batch of downstream failures.

---

### T0-1 · Fix Vitest config (React + @headlessui/react resolution)  ❌

**Root cause:** `vitest.config.js` uses the deprecated `deps.inline` key (should
be `server.deps.inline`) and is missing `@headlessui/react`, which is a
production dependency used in `Toggle.jsx` and other shared UI components.
Integration tests in `test/integration/` fail with:
> `Error: Failed to resolve import "@headlessui/react"`

**Fix:**
```js
// vitest.config.js — replace `deps:` block with:
server: {
  deps: {
    inline: [
      '@testing-library/react',
      '@testing-library/user-event',
      '@testing-library/jest-dom',
      '@headlessui/react',
    ],
  },
},
```

**Files:** `vitest.config.js`
**Expected recovery:** 2 integration test files stop erroring at collection.

---

### T0-2 · Normalise vi.mock paths across test suite  ❌

**Root cause:** Every test file in `test/base-operations/` and
`test/integration/` calls `vi.mock('../../modules/...')`,
`vi.mock('../../shared/...')`, `vi.mock('../../components/...')`, etc.

From `test/base-operations/`, `../../modules/` resolves to
`/brandon/RaceTrackers/modules/` — a directory that does **not exist**.
The source lives under `src/`, so the correct paths are
`../../src/modules/...`, `../../src/shared/...`, etc.

Because the mock path resolves to nothing, Vitest falls back to the
real (un-mocked) module. Zustand stores are not Jest-style mock functions,
so calling `.mockImplementation()` on them throws:
> `TypeError: default.mockImplementation is not a function`

This one root cause accounts for **≈150 of the 219 failing tests**.

**Files affected (all mock paths need `src/` inserted):**
- `test/base-operations/BackupRestoreDialog.test.jsx`
- `test/base-operations/BaseStationView.test.jsx`
- `test/base-operations/DataEntry.test.jsx`
- `test/base-operations/DeletedEntriesView.test.jsx`
- `test/base-operations/DuplicateEntriesDialog.test.jsx`
- `test/base-operations/HelpDialog.test.jsx`
- `test/base-operations/LogOperationsPanel.test.jsx`
- `test/base-operations/MissingNumbersList.test.jsx`
- `test/base-operations/OutList.test.jsx`
- `test/base-operations/RaceOverview.test.jsx`
- `test/base-operations/ReportsPanel.test.jsx`
- `test/base-operations/StrapperCallsPanel.test.jsx`
- `test/base-operations/VetOutDialog.test.jsx`
- `test/base-operations/WithdrawalDialog.test.jsx`
- `test/integration/DataSync.test.jsx`
- `test/integration/ModuleWorkflow.test.jsx`

**Fix options (pick one):**
- **A (preferred):** Add `resolve.alias` to `vitest.config.js` mapping bare
  `modules/`, `shared/`, `components/`, `services/` paths to their `src/`
  equivalents, so existing mock strings resolve correctly.
- **B:** Sed-replace all `vi.mock('../../modules/` → `vi.mock('../../src/modules/`
  etc. across all 16 files.

---

### T0-3 · Align database schema tests to actual schema v6  ❌

**Root cause:** `test/database/schema-v6.test.js` hard-codes expected index
strings (primary keys, compound indexes) that have drifted from the live
schema in `src/shared/services/database/schema.js`. 8 of 44 tests fail with:
> `AssertionError: expected false to be true`

The secondary test file `test/database/schema-v6-working.test.js` appears to
pass (3 tests), confirming the schema itself works — only the expectation
values are wrong.

**Fix:** Read `src/shared/services/database/schema.js`, extract the actual
index definitions, update the hardcoded expectations in `schema-v6.test.js`
to match. Alternatively, drive the test from the live schema object.

**Files:** `test/database/schema-v6.test.js`, `src/shared/services/database/schema.js`
**Expected recovery:** 8 failing schema tests.

---

### T0-4 · Update AboutDialog tests to match current component  ❌

**Root cause:** `test/base-operations/AboutDialog.test.jsx` expects text that
no longer appears in `AboutDialog.jsx` — e.g. "Real-time runner tracking",
specific credits, icon assertions. 6 of 16 tests fail.

**Fix:** Read the current `AboutDialog.jsx`, update test text expectations to
match what the component actually renders.

**Files:** `test/base-operations/AboutDialog.test.jsx`
**Expected recovery:** 6 failing tests.

---

### T0-5 · Fix ReportBuilder tests (template/form API drift)  ❌

**Root cause:** 7 of 12 `ReportBuilder.test.jsx` tests fail. The component's
template selection API, form validation flow, and state management have drifted
from the test expectations (and some failures compound with the mock-path
issue from T0-2).

**Fix:** Read current `src/components/BaseStation/ReportBuilder.jsx`, update
tests to match actual prop names, template object shape, and event flow.

**Files:** `test/base-operations/ReportBuilder.test.jsx`, `src/components/BaseStation/ReportBuilder.jsx`
**Expected recovery:** 7 failing tests.

---

### T0-6 · Fix HotkeysProvider tests (enableInForms + error boundary)  ❌

**Root cause:** 2 of 11 `HotkeysProvider.test.jsx` tests fail:
- `enableInForms` option behaviour doesn't match implementation.
- Error-boundary test for `useHotkeysContext` outside provider doesn't
  match how the provider actually throws.

**Fix:** Align tests to `src/shared/components/HotkeysProvider.jsx` API.

**Files:** `test/base-operations/HotkeysProvider.test.jsx`, `src/shared/components/HotkeysProvider.jsx`
**Expected recovery:** 2 failing tests.

---

### T0-7 · Exclude Puppeteer E2E tests from Vitest run  ❌

**Root cause:** `vitest.config.js` uses `include: ['test/**/*.{test,spec}.{js,jsx}']`
which picks up `test/e2e/` Puppeteer tests. Those require a running server
(`http://localhost:5173`) and appear as "skipped" in the vitest output,
masking real failures and polluting CI results.

**Fix:** Add to vitest config:
```js
exclude: ['test/e2e/**'],
```
E2E tests continue to run via `npm run test:e2e` (separate Puppeteer script).

**Files:** `vitest.config.js`

---

## TIER 1 — Missing Features (Epic-aligned)

### Epic 2 — Checkpoint Operations

---

#### E2-1 · QuickEntryBar — keyboard-first runner entry at Checkpoint  ❌

**Spec:** `[AJ]` "Add ability to quickly type in runner numbers as they pass"

**What:**
Auto-focused number input at the top of Tab 1 in `CheckpointView`. Workflow:
type a runner number → press Enter → runner instantly marked `passed` with
current timestamp → input clears and refocuses → ready for next number.
Display brief inline feedback for unknown numbers or already-marked runners.
Must coexist with the existing tap-the-tile grid below it.

**New files:**
- `src/components/Checkpoint/QuickEntryBar.jsx`

**Modified files:**
- `src/views/CheckpointView.jsx` — add `<QuickEntryBar>` above `<RunnerGrid>`
- `src/modules/checkpoint-operations/store/checkpointStore.js` — verify
  `markRunner(raceId, checkpointId, runnerNumber)` is callable; add if missing

**Tests to write:**
- `test/checkpoint-operations/QuickEntryBar.test.jsx`
  - renders auto-focused input
  - Enter with valid number marks runner and clears input
  - Enter with unknown number shows error message
  - Enter with already-marked number shows "already passed" message
  - Enter refocuses input after marking

---

#### E2-2 · Checkpoint 3-tab navigation (Mark-Off / Callout / Overview)  ❌

**Spec:** "Tab 1: Mark-Off, Tab 2: Callout Sheet, Tab 3: Overview"

**Current state:** `CheckpointView.jsx` shows only `RunnerGrid` directly, with
`CalloutSheet` as a modal triggered by a button. There are no visible tabs.
`RunnerOverview` component exists and fully supports checkpoint mode (lines
117–136) but is never rendered in an active checkpoint session.

**What:**
Add 3-tab navigation bar to `CheckpointView.jsx`:
- Tab 1 (default): `RunnerGrid` + `QuickEntryBar`
- Tab 2: `CalloutSheet` rendered inline (not as a modal)
- Tab 3: `RunnerOverview` in checkpoint mode (NS/DNF actions only)

**Modified files:**
- `src/views/CheckpointView.jsx`

**Tests to write:**
- `test/checkpoint-operations/CheckpointView.test.jsx`
  - Tab 1 renders RunnerGrid
  - Tab 2 renders CalloutSheet
  - Tab 3 renders RunnerOverview
  - Tab buttons are visible and switch content

---

#### E2-3 · Unit test coverage for Checkpoint module  ❌

**Current state:** Zero test files exist for `checkpoint-operations`.

**New test files:**
- `test/checkpoint-operations/checkpointStore.test.js`
  - `initializeCheckpoint()` creates runners from race ranges
  - `markRunner()` sets `passed` status + timestamp
  - `loadCheckpointData()` returns saved runners
  - prevents cross-contamination with `base_station_runners`
- `test/checkpoint-operations/RunnerGrid.test.jsx`
  - renders all runners as tiles
  - tapping a tile calls `markRunner`
  - passed runners show green; not-started show gray
  - search/filter hides non-matching runners
- `test/checkpoint-operations/CalloutSheet.test.jsx`
  - groups runners into 5-minute segments
  - "Mark as called in" updates segment state
  - segments display in chronological order
- `test/checkpoint-operations/CheckpointView.test.jsx` (see E2-2)

---

### Epic 3 — Base Station Operations

---

#### E3-1 · Add visible tab navigation bar to BaseStationView  ❌

**Spec:** "Tab 1 Data Entry, Tab 2 Race Overview"

**Current state:** `BaseStationView.jsx` has `activeTab` state and renders the
correct tab content conditionally, but **renders no tab buttons**. Tab
switching is only possible via hotkeys (Alt+A, Alt+B, Escape), which are
invisible to users unfamiliar with them.

**What:** Add a 3-button tab bar (Data Entry | Overview | Reports) in the JSX.
~10–15 lines of change. Hotkeys continue to work alongside.

**Modified files:**
- `src/views/BaseStationView.jsx`

**Tests:** Update `test/base-operations/BaseStationView.test.jsx` to assert
tab buttons render and clicking them switches `activeTab`.

---

#### E3-2 · Wire Settings and Help modals in BaseStationView  ❌

**Spec:** "Settings accessible from any page"

**Current state:** `handleOpenSettings` and `handleOpenHelp` are stubs that
`console.log` and do nothing. `SettingsModal` and `HelpDialog` components
already exist and are fully implemented.

**What:**
```js
// BaseStationView.jsx — add state + import + render
const [showSettings, setShowSettings] = useState(false);
const [showHelp, setShowHelp] = useState(false);
// wire handleOpenSettings → setShowSettings(true), etc.
// render <SettingsModal> and <HelpDialog> conditionally
```

**Modified files:**
- `src/views/BaseStationView.jsx` (~15 lines)

**Tests:** Update `test/base-operations/BaseStationView.test.jsx`.

---

#### E3-3 · CheckpointGroupingView — per-checkpoint runner breakdown  ❌

**Spec:** `[AJ]` "View to group checkpoints so you can see reports back from
specific checkpoints (global view + per-checkpoint: who has/hasn't passed
through yet)"

**Current state:** Base station overview shows only finish-line status. There
is no view showing checkpoint-level data from the `checkpoint_runners` table.

**What:** New component with two sub-views:
1. **Global matrix** — runners (rows) × checkpoints (columns) showing ✓/✗
2. **Per-checkpoint drill-down** — select a checkpoint; see who passed and
   who hasn't been seen yet

Read-only. Reads from `checkpoint_runners` via `StorageService` (not
`base_station_runners`). Add as a new tab in Base Station (or sub-view
within Overview).

**New files:**
- `src/components/BaseStation/CheckpointGroupingView.jsx`

**Modified files:**
- `src/views/BaseStationView.jsx` — add tab or embed in Overview tab
- `src/services/storage.js` — add `getCheckpointRunnersByRace(raceId)` if not
  present (verify first)

**Tests to write:**
- `test/base-operations/CheckpointGroupingView.test.jsx`
  - renders global matrix with correct columns
  - per-checkpoint filter shows correct runners
  - read-only (no mark/edit actions)

---

### Epic 4 — Data Import / Export

---

#### E4-1 · QR code export UI  ❌

**Spec:** "Export config as QR code"

**Current state:** `qrcode.react` is listed in `package.json` dependencies but
no UI component renders a QR code anywhere in the app.

**What:** Add a "Share via QR Code" option in the race management view (and/or
Settings modal → Import/Export section). Generate a QR code from the JSON
export payload using `<QRCodeSVG>` from `qrcode.react`.

**Modified files:**
- `src/components/ImportExport/` (new `QRCodeExportModal.jsx`) or inline in
  `src/views/RaceManagementView.jsx`

**Tests to write:**
- `test/components/QRCodeExportModal.test.jsx`

---

#### E4-2 · Verify and complete report generation + CSV download  ⚠️

**Spec:** "Missing Numbers report, Out List, Checkpoint Log — exportable as CSV"

**Current state:** `ReportsPanel.jsx` has UI buttons; actual generation/download
logic status is unverified. `test/base-operations/utils/reportUtils.test.js`
exists but may have coverage gaps.

**What:**
1. Run the app and trigger each report type — confirm file downloads.
2. If generation is broken, fix in `ReportBuilder.jsx` / `ReportsPanel.jsx`.
3. Ensure `reportUtils.test.js` covers all three report types + CSV format.

**Files to verify:**
- `src/components/BaseStation/ReportsPanel.jsx`
- `src/components/BaseStation/ReportBuilder.jsx`
- `test/base-operations/utils/reportUtils.test.js`

---

#### E4-3 · Export/Import accessible from Settings modal  ⚠️

**Spec:** "export/import race configuration" from Settings

**Current state:** Export/import is only accessible from Race Management view.

**What:** Add an Import/Export section to `SettingsModal.jsx` (or an "Export
race" button) that calls the existing `ExportService` / `ImportService`.

**Modified files:**
- `src/components/Settings/SettingsModal.jsx`

---

### Epic 6 — Race Setup / Configuration

---

#### E6-1 · CSV/Excel runner number import  ❌

**Spec:** "bulk upload from spreadsheet"

**What:** File input (accept `.csv`, `.xlsx`). Parse a column of runner
numbers. Map to runner ranges and add to the race. Conflict resolution if
numbers overlap existing ranges.

**New files:**
- `src/services/CSVImportService.js` (extend `ImportService.js` if appropriate)

**Tests to write:**
- `test/services/CSVImport.test.js`

---

## TIER 2 — Missing Test Coverage (no new features, just tests)

### TC-1 · Race Maintenance module — zero test coverage  ❌

**New test files:**
- `test/race-maintenance/raceMaintenanceStore.test.js`
  - createRace, updateRace, deleteRace, duplicateRace
  - runner range expansion (min/max → individual records)
- `test/race-maintenance/RaceManagementView.test.jsx`
  - list of races renders, delete/duplicate actions
- `test/race-maintenance/RaceDetailsStep.test.jsx`
  - form validation, checkpoint count 1–10
- `test/race-maintenance/RunnerRangesStep.test.jsx`
  - range parsing, overlap detection

---

### TC-2 · Shared infrastructure — partial coverage  ❌

**New/updated test files:**
- `test/shared/navigationStore.test.js`
  - startOperation locks navigation, endOperation unlocks
  - `canNavigateTo` returns false for other module types
- `test/shared/ProtectedRoute.test.jsx`
  - blocks navigation during active operation
  - renders children when allowed

---

### TC-3 · Settings component  ❌

**New test files:**
- `test/components/SettingsModal.test.jsx`
  - dark/light mode toggle changes setting
  - font size slider updates value
  - clear data requires "CLEAR" confirmation text

---

## TIER 3 — Polish / Accessibility (P2, non-blocking)

- Full keyboard navigation audit (checkpoint mark-off, setup wizard, all dialogs)
- ARIA / screen reader audit — add missing `role`, `aria-label`, live regions
  for status changes
- Touch target audit — runner grid tiles at high runner counts (>500 runners)
- Colour contrast audit — default light theme vs WCAG 2.1 AA (4.5:1)
- Checkpoint pagination — quick-jump to number group (e.g. "200–250") for
  large races

---

## Progress Snapshot

| Category                   | Items | Done | Remaining |
|----------------------------|-------|------|-----------|
| T0 · Test infra root causes | 7     | 0    | 7         |
| E2 · Checkpoint features   | 3     | 0    | 3         |
| E3 · Base station features | 3     | 0    | 3         |
| E4 · Import/Export         | 3     | 0    | 3         |
| E6 · Race setup            | 1     | 0    | 1         |
| TC · Missing test files    | 3     | 0    | 3         |
| **Tests passing**          | 343   | 109  | **219 failing** |

_Update this table as work completes. Ralph loop reads this file each iteration._
