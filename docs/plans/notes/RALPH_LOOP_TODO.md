# RaceTracker Pro — Ralph Loop Implementation TODO

Generated: 2026-02-19
Baseline: **219 failing** tests · 109 passing · 15 skipped (343 total)

**Completion criteria:** All items ✅ · `npm run test:run` exits 0 · `npm run build && npm run test:e2e` exits 0

> ⚠️ **Do not start Tier 1+ feature work until all T0 items are green.**
> T0 fixes unblock ~150 of the 219 failing tests and clarify which feature
> tests are genuinely missing vs. just misconfigured.

---

## Progress Table

| ID    | Title                                      | Priority    | Status |
|-------|--------------------------------------------|-------------|--------|
| T0-1  | Fix Vitest config (@headlessui/react)      | T0 blocker  | ❌     |
| T0-2  | Normalise vi.mock paths (16 files)         | T0 blocker  | ❌     |
| T0-3  | Align schema tests to actual schema v6     | T0 blocker  | ❌     |
| T0-4  | Update AboutDialog tests                   | T0 blocker  | ❌     |
| T0-5  | Fix ReportBuilder tests (API drift)        | T0 blocker  | ❌     |
| T0-6  | Fix HotkeysProvider tests                  | T0 blocker  | ❌     |
| T0-7  | Exclude E2E tests from Vitest run          | T0 blocker  | ❌     |
| E2-1  | QuickEntryBar — keyboard runner entry      | [MVP]       | ❌     |
| E2-2  | Checkpoint 3-tab navigation                | [MVP]       | ❌     |
| E2-3  | Checkpoint module unit tests               | [MVP]       | ❌     |
| E3-1  | BaseStation visible tab bar                | [MVP]       | ❌     |
| E3-2  | Wire Settings + Help modals                | [MVP]       | ❌     |
| E3-3  | CheckpointGroupingView                     | [MVP]       | ❌     |
| E4-1  | QR code export UI                          | [Post-MVP]  | ❌     |
| E4-2  | Verify report generation + CSV download    | [MVP]       | ⚠️     |
| E4-3  | Export/Import from Settings modal          | [Post-MVP]  | ⚠️     |
| E6-1  | CSV/Excel runner import                    | [Post-MVP]  | ❌     |
| TC-1  | Race Maintenance module tests              | [MVP]       | ❌     |
| TC-2  | Shared infrastructure tests                | [MVP]       | ❌     |
| TC-3  | Settings component tests                   | [Post-MVP]  | ❌     |

**MVP-blocking items:** T0-1 through T0-7, E2-1, E2-2, E2-3, E3-1, E3-2,
E3-3, E4-2, TC-1, TC-2. These must be complete before the app is usable
at an actual race.

---

## TIER 0 — Test Infrastructure

> Fix these in order. Each one unblocks a batch of downstream failures.

---

### T0-1 · Fix Vitest config (React + @headlessui/react resolution) ❌

**Root cause:** `vitest.config.js` uses deprecated `deps.inline` (should be
`server.deps.inline`) and is missing `@headlessui/react`. Integration tests
fail at collection time:
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

**Checklist:**
- [ ] `deps.inline` replaced with `server.deps.inline`
- [ ] `@headlessui/react` added to inline list
- [ ] `npm run test:run -- test/integration` no longer fails at collection

**Expected recovery:** 2 integration test files stop erroring at collection.

---

### T0-2 · Normalise vi.mock paths across test suite ❌

**Root cause:** All `test/base-operations/` and `test/integration/` test files
call `vi.mock('../../modules/...')`, `vi.mock('../../shared/...')`, etc.

From `test/base-operations/`, `../../modules/` resolves to the non-existent
root-level `modules/` directory. Source lives under `src/`, so correct paths
are `../../src/modules/...`, `../../src/shared/...`, etc.

Because the mock resolves to nothing, Vitest loads the real Zustand store.
Calling `.mockImplementation()` on a real store throws:
> `TypeError: default.mockImplementation is not a function`

**This one root cause accounts for ≈150 of the 219 failing tests.**

**Files affected:**
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
- **A (preferred):** Add `resolve.alias` to `vitest.config.js` so
  `modules/`, `shared/`, `components/`, `services/` resolve to their `src/`
  equivalents without touching any test file.
- **B:** Bulk-replace mock paths in all 16 files
  (`vi.mock('../../modules/` → `vi.mock('../../src/modules/`, etc.).

**Checklist:**
- [ ] Fix chosen and applied (A or B)
- [ ] `npm run test:run -- test/base-operations` failing count drops by ~150
- [ ] No new `mockImplementation is not a function` errors

---

### T0-3 · Align database schema tests to actual schema v6 ❌

**Root cause:** `test/database/schema-v6.test.js` hardcodes expected index
strings that have drifted from `src/shared/services/database/schema.js`.
8 of 44 tests fail:
> `AssertionError: expected false to be true`

`test/database/schema-v6-working.test.js` passes (3 tests), confirming the
schema works — only the expectation values are stale.

See **MISSING_FEATURES.md §Epic 1** for schema background.

**Fix:** Read the live schema, extract actual index definitions, update
hardcoded expectations. Optionally drive expectations from the schema object
itself to prevent future drift.

**Files:** `test/database/schema-v6.test.js`, `src/shared/services/database/schema.js`

**Checklist:**
- [ ] Read `schema.js` — note actual primary keys and compound indexes
- [ ] Update all 8 failing expectation blocks in `schema-v6.test.js`
- [ ] `npm run test:run -- test/database` exits with 0 failures

**Expected recovery:** 8 failing schema tests.

---

### T0-4 · Update AboutDialog tests to match current component ❌

**Root cause:** 6 of 16 `AboutDialog.test.jsx` tests expect text strings
(e.g. "Real-time runner tracking", specific credits, icon assertions) that
no longer appear in the current `AboutDialog.jsx`.

**Fix:** Read current `AboutDialog.jsx`, update test expectations to match
what the component actually renders today.

**Files:** `test/base-operations/AboutDialog.test.jsx`

**Checklist:**
- [ ] Read `src/modules/base-operations/components/AboutDialog.jsx`
- [ ] Update 6 failing test expectations
- [ ] `npm run test:run -- test/base-operations/AboutDialog` exits 0

**Expected recovery:** 6 failing tests.

---

### T0-5 · Fix ReportBuilder tests (template/form API drift) ❌

**Root cause:** 7 of 12 `ReportBuilder.test.jsx` tests fail. The component's
template selection API, form validation flow, and state management have drifted
from test expectations. Some failures also compound with T0-2.

**Fix:** Read current `ReportBuilder.jsx`, update tests to match actual prop
names, template object shape, and event flow.

**Files:** `test/base-operations/ReportBuilder.test.jsx`, `src/components/BaseStation/ReportBuilder.jsx`

**Checklist:**
- [ ] T0-2 fixed first (removes compound failures)
- [ ] Read `ReportBuilder.jsx` — note current props/template shape
- [ ] Update 7 failing test cases
- [ ] `npm run test:run -- test/base-operations/ReportBuilder` exits 0

**Expected recovery:** 7 failing tests.

---

### T0-6 · Fix HotkeysProvider tests (enableInForms + error boundary) ❌

**Root cause:** 2 of 11 `HotkeysProvider.test.jsx` tests fail:
- `enableInForms` option behaviour doesn't match implementation.
- Error-boundary test for `useHotkeysContext` outside provider doesn't match
  how the provider actually throws.

**Fix:** Align tests to current `HotkeysProvider.jsx` API.

**Files:** `test/base-operations/HotkeysProvider.test.jsx`, `src/shared/components/HotkeysProvider.jsx`

**Checklist:**
- [ ] Read `HotkeysProvider.jsx` — note `enableInForms` and context error behaviour
- [ ] Update 2 failing test cases
- [ ] `npm run test:run -- test/base-operations/HotkeysProvider` exits 0

**Expected recovery:** 2 failing tests.

---

### T0-7 · Exclude Puppeteer E2E tests from Vitest run ❌

**Root cause:** `include: ['test/**/*.{test,spec}.{js,jsx}']` in
`vitest.config.js` picks up `test/e2e/` Puppeteer tests. They require a
running dev server and appear as "skipped", masking real failures.

**Fix:**
```js
// vitest.config.js
exclude: ['node_modules', 'test/e2e/**'],
```

E2E tests continue to run via `npm run test:e2e` (requires `npm run build`
first, as documented in CLAUDE.md).

**Files:** `vitest.config.js`

**Checklist:**
- [ ] `exclude` added to vitest config
- [ ] `npm run test:run` output shows 0 skipped (E2E tests no longer appear)
- [ ] `npm run test:e2e` still runs the Puppeteer suite correctly

---

## TIER 1 — Missing Features (Epic-aligned)

> Start here only after all T0 items are ✅.

---

### Epic 2 — Checkpoint Operations

**Definition of done:** All E2 unit tests pass in `npm run test:run`;
tab navigation verified manually in browser with a seeded race
(`npm run test:seed`).

---

#### E2-1 · QuickEntryBar — keyboard-first runner entry at Checkpoint [MVP] ❌

See **MISSING_FEATURES.md §1** for detailed UX expectations and spec source.

**What:** Auto-focused number input at top of Tab 1. Volunteer types a runner
number → Enter → runner marked `passed` with current timestamp → input clears
and refocuses. Inline feedback for unknown/already-marked runners. Coexists
with the existing tap-the-tile grid.

**New files:** `src/components/Checkpoint/QuickEntryBar.jsx`

**Modified files:**
- `src/views/CheckpointView.jsx` — add `<QuickEntryBar>` above `<RunnerGrid>`
- `src/modules/checkpoint-operations/store/checkpointStore.js` — verify
  `markRunner(raceId, checkpointId, runnerNumber)` exists; add if missing

**Tests:** `test/checkpoint-operations/QuickEntryBar.test.jsx`

**Checklist:**
- [ ] `QuickEntryBar.jsx` created; input auto-focuses on mount
- [ ] Enter with valid number → runner marked, input cleared, refocused
- [ ] Enter with unknown number → inline error shown, input not cleared
- [ ] Enter with already-marked number → "already passed" message
- [ ] All QuickEntryBar unit tests passing

---

#### E2-2 · Checkpoint 3-tab navigation (Mark-Off / Callout / Overview) [MVP] ❌

See **MISSING_FEATURES.md §2** for full spec and current state details.

**What:** Add 3-tab nav bar to `CheckpointView.jsx`:
- Tab 1 (default): `RunnerGrid` + `QuickEntryBar`
- Tab 2: `CalloutSheet` inline (remove the modal trigger button)
- Tab 3: `RunnerOverview` in checkpoint mode (NS/DNF actions only; lines
  117–136 of `RunnerOverview` already handle this correctly)

**Modified files:** `src/views/CheckpointView.jsx`

**Tests:** `test/checkpoint-operations/CheckpointView.test.jsx`

**Checklist:**
- [ ] 3 tab buttons visible in CheckpointView header
- [ ] Tab 1 renders RunnerGrid (default on load)
- [ ] Tab 2 renders CalloutSheet inline (not as modal)
- [ ] Tab 3 renders RunnerOverview in checkpoint mode
- [ ] All CheckpointView tab tests passing

---

#### E2-3 · Unit test coverage for Checkpoint module [MVP] ❌

**Current state:** Zero test files exist for `checkpoint-operations`.

**New test files:**

`test/checkpoint-operations/checkpointStore.test.js`
- `initializeCheckpoint()` creates runners from race runner ranges
- `markRunner()` sets `passed` status + current timestamp
- `loadCheckpointData()` returns previously saved runners
- No cross-contamination: checkpoint store never reads/writes `base_station_runners`

`test/checkpoint-operations/RunnerGrid.test.jsx`
- Renders all runners as tiles
- Tapping a tile calls `markRunner` with correct number
- Passed runners display green; not-started display gray
- Search input hides non-matching tiles

`test/checkpoint-operations/CalloutSheet.test.jsx`
- Runners grouped into 5-minute time segments
- "Mark as called in" updates segment state and shows visual indicator
- Segments display in chronological order

`test/checkpoint-operations/CheckpointView.test.jsx`
- (covered by E2-2 checklist)

**Checklist:**
- [ ] `test/checkpoint-operations/` directory created
- [ ] checkpointStore tests written and passing
- [ ] RunnerGrid tests written and passing
- [ ] CalloutSheet tests written and passing
- [ ] CheckpointView tab tests written and passing (see E2-2)

---

### Epic 3 — Base Station Operations

**Definition of done:** All E3 unit tests pass in `npm run test:run`;
tab switching, settings modal, and checkpoint grouping verified manually
with a seeded race.

---

#### E3-1 · Add visible tab navigation bar to BaseStationView [MVP] ❌

**Current state:** `activeTab` state and conditional renders exist, but
**no tab buttons are rendered**. Switching tabs requires knowing hotkeys
(Alt+A, Alt+B, Escape) — invisible to unfamiliar users.

**What:** Add a 3-button tab bar (Data Entry | Overview | Reports) to the
JSX. ~10–15 lines. Hotkeys continue to work alongside.

**Modified files:** `src/views/BaseStationView.jsx`

**Checklist:**
- [ ] Tab bar renders 3 buttons
- [ ] Clicking each button switches `activeTab` and renders correct content
- [ ] Active tab button has visual active state
- [ ] Hotkeys still switch tabs (regression check)
- [ ] `BaseStationView.test.jsx` updated to assert tab buttons and switching

---

#### E3-2 · Wire Settings and Help modals in BaseStationView [MVP] ❌

**Current state:** `handleOpenSettings` and `handleOpenHelp` are `console.log`
stubs. `SettingsModal` and `HelpDialog` are fully implemented elsewhere.

**What:**
```js
const [showSettings, setShowSettings] = useState(false);
const [showHelp, setShowHelp] = useState(false);
// handleOpenSettings → setShowSettings(true)
// handleOpenHelp → setShowHelp(true)
// render <SettingsModal isOpen={showSettings} onClose={...} />
// render <HelpDialog isOpen={showHelp} onClose={...} />
```

**Modified files:** `src/views/BaseStationView.jsx` (~15 lines)

**Checklist:**
- [ ] Settings button opens SettingsModal
- [ ] Help button opens HelpDialog
- [ ] Both modals close on Escape / close button
- [ ] `BaseStationView.test.jsx` updated to assert modal behaviour

---

#### E3-3 · CheckpointGroupingView — per-checkpoint runner breakdown [MVP] ❌

See **MISSING_FEATURES.md §3** for detailed spec, impact, and UX expectations.

**What:** New read-only component with two sub-views:
1. **Global matrix** — runners (rows) × checkpoints (columns) showing ✓/✗
2. **Per-checkpoint drill-down** — select a checkpoint; see who passed and
   who hasn't been seen yet

Reads `checkpoint_runners` via `StorageService` (not `base_station_runners`).
Add as a new tab or embed within the Overview tab in Base Station.

**New files:** `src/components/BaseStation/CheckpointGroupingView.jsx`

**Modified files:**
- `src/views/BaseStationView.jsx` — new tab or sub-view
- `src/services/storage.js` — add `getCheckpointRunnersByRace(raceId)` if
  not already present (verify first)

**Tests:** `test/base-operations/CheckpointGroupingView.test.jsx`

**Checklist:**
- [ ] `getCheckpointRunnersByRace` exists in StorageService (add if missing)
- [ ] Global matrix renders correct columns (one per checkpoint)
- [ ] Per-checkpoint filter switches the visible runner list
- [ ] No write actions available (read-only; no mark/status buttons)
- [ ] All CheckpointGroupingView unit tests passing

---

### Epic 4 — Data Import / Export

**Definition of done:** All E4 unit tests pass; report downloads verified
manually from the Reports tab.

---

#### E4-1 · QR code export UI [Post-MVP] ❌

**Current state:** `qrcode.react` is in `package.json` but no UI renders a
QR code anywhere.

**What:** "Share via QR Code" option in race management view and/or Settings
modal. Generate QR from JSON export payload via `<QRCodeSVG>` from
`qrcode.react`.

**New files:** `src/components/ImportExport/QRCodeExportModal.jsx`

**Checklist:**
- [ ] QRCodeExportModal renders `<QRCodeSVG>` with race JSON payload
- [ ] Accessible from Race Management view
- [ ] `test/components/QRCodeExportModal.test.jsx` written and passing

---

#### E4-2 · Verify and complete report generation + CSV download [MVP] ⚠️

**Current state:** `ReportsPanel.jsx` has UI buttons; download logic
unverified. `reportUtils.test.js` may have coverage gaps.

**What:**
1. Trigger each report type (Missing Numbers, Out List, Checkpoint Log)
   and confirm file downloads work end-to-end.
2. Fix any broken generation logic in `ReportBuilder.jsx` / `ReportsPanel.jsx`.
3. Ensure `reportUtils.test.js` covers all three report types and CSV format.

**Files to verify:** `src/components/BaseStation/ReportsPanel.jsx`,
`src/components/BaseStation/ReportBuilder.jsx`,
`test/base-operations/utils/reportUtils.test.js`

**Checklist:**
- [ ] Missing Numbers report downloads a valid CSV
- [ ] Out List report downloads a valid CSV
- [ ] Checkpoint Log report downloads a valid CSV
- [ ] `reportUtils.test.js` covers all three types and verifies column headers

---

#### E4-3 · Export/Import accessible from Settings modal [Post-MVP] ⚠️

**Current state:** Export/import only accessible from Race Management view.

**What:** Add Import/Export section to `SettingsModal.jsx` calling the
existing `ExportService` / `ImportService`.

**Modified files:** `src/components/Settings/SettingsModal.jsx`

**Checklist:**
- [ ] Export race button visible in Settings modal
- [ ] Import race file picker visible in Settings modal
- [ ] Both call existing service methods (no new business logic)
- [ ] `SettingsModal.test.jsx` updated to cover export/import buttons

---

### Epic 6 — Race Setup / Configuration

**Definition of done:** CSV import unit tests pass; manual test with a
sample CSV file produces correct runner records.

---

#### E6-1 · CSV/Excel runner number import [Post-MVP] ❌

**Spec:** "bulk upload from spreadsheet"

**What:** File input accepting `.csv` (and optionally `.xlsx`). Parse a
column of runner numbers, map to runner ranges, add to the race. Show
conflict resolution dialog if numbers overlap existing ranges.

**New files:** `src/services/CSVImportService.js`

**Checklist:**
- [ ] CSVImportService parses a column of runner numbers from CSV input
- [ ] Numbers are mapped to `{min, max}` ranges correctly
- [ ] Overlapping numbers trigger the existing conflict resolution dialog
- [ ] `test/services/CSVImport.test.js` written and passing

---

## TIER 2 — Missing Test Coverage

> These add tests for existing working code. No feature changes needed.

---

### TC-1 · Race Maintenance module — zero test coverage [MVP] ❌

**New test files:**

`test/race-maintenance/raceMaintenanceStore.test.js`
- `createRace()` persists race to IndexedDB
- `updateRace()` updates fields without destroying runner data
- `deleteRace()` removes race and all associated runners/checkpoints
- `duplicateRace()` creates independent copy with new ID
- Runner range expansion: `{min: 1, max: 10}` → 10 individual runner records

`test/race-maintenance/RaceManagementView.test.jsx`
- Race list renders with name, date, runner count
- Delete action with confirmation dialog
- Duplicate action creates new entry in list

`test/race-maintenance/RaceDetailsStep.test.jsx`
- Required fields validated (name, date, start time)
- Checkpoint count enforced between 1 and 10

`test/race-maintenance/RunnerRangesStep.test.jsx`
- Valid range input accepted and expanded
- Overlapping ranges detected and rejected
- Non-numeric input rejected

**Checklist:**
- [ ] `test/race-maintenance/` directory created
- [ ] All 4 test files written and passing

---

### TC-2 · Shared infrastructure — partial coverage [MVP] ❌

**New test files:**

`test/shared/navigationStore.test.js`
- `startOperation(MODULE)` sets operation lock
- `endOperation()` clears lock
- `canNavigateTo(module)` returns `false` for other module types while locked
- Resets on store initialisation (not persisted)

`test/shared/ProtectedRoute.test.jsx`
- Renders children when no active operation
- Shows block/warning UI when navigation is locked to a different module

**Checklist:**
- [ ] `test/shared/` directory created
- [ ] Both test files written and passing

---

### TC-3 · Settings component [Post-MVP] ❌

**New test files:**

`test/components/SettingsModal.test.jsx`
- Dark/light mode toggle updates `settingsStore`
- Font size slider updates value and persists
- "Clear all data" requires typing "CLEAR" before button enables
- Reset to defaults restores all settings to initial values

**Checklist:**
- [ ] `SettingsModal.test.jsx` written and passing

---

## TIER 3 — Polish / Accessibility (non-blocking)

These do not block the loop completion promise. Address after all MVP items
are green.

- [ ] Full keyboard navigation audit (checkpoint mark-off, setup wizard, all dialogs)
- [ ] ARIA / screen reader audit — missing `role`, `aria-label`, live regions for status changes
- [ ] Touch target audit — runner grid tiles at high runner counts (>500 runners)
- [ ] Colour contrast audit — default light theme vs WCAG 2.1 AA (4.5:1 ratio)
- [ ] Checkpoint pagination — quick-jump to number group (e.g. "200–250") for large races

---

## Test Discipline (enforce going forward)

Once T0 is green, these rules prevent regression:

1. **New feature PRs must not increase the failing test count.** Run
   `npm run test:run` before and after; if the failure count increases,
   fix before merging.

2. **Schema changes require updating `test/database/schema-v6.test.js`.**
   Add a migration version test for every `.version(N).stores({...})` added
   to `src/shared/services/database/schema.js`.

3. **New Zustand stores must be mocked correctly in tests.** Mock path must
   include `src/` prefix relative to the test file location (see T0-2).
   Pattern: `vi.mock('../../src/modules/<module>/store/<store>')`.

4. **New components that use `@headlessui/react` or other external UI libs**
   must have those packages listed in `server.deps.inline` in
   `vitest.config.js` if they're used in test-rendered components.

---

## Progress Snapshot

| Category                    | Items | Done | Remaining |
|-----------------------------|-------|------|-----------|
| T0 · Test infra root causes | 7     | 0    | 7         |
| E2 · Checkpoint features    | 3     | 0    | 3         |
| E3 · Base station features  | 3     | 0    | 3         |
| E4 · Import/Export          | 3     | 0    | 3         |
| E6 · Race setup             | 1     | 0    | 1         |
| TC · Missing test files     | 3     | 0    | 3         |
| **Tests passing**           | 343   | 109  | **219 failing** |

_Update this table and per-item checklists as work completes._
_Ralph loop reads this file each iteration to determine remaining work._
