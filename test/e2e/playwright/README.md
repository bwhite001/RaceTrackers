# Playwright Customer Journey Tests

End-to-end tests that simulate real operator workflows using [Playwright](https://playwright.dev).

## Journeys Covered

| File | Journey | Who | Status |
|------|---------|-----|--------|
| `01-race-setup.journey.spec.js` | Create a race, configure checkpoints & runner ranges, verify overview | Race Director | ✅ All pass |
| `02-checkpoint-operations.journey.spec.js` | Navigate to checkpoint, mark off runners (grid + quick entry), view callout sheet & overview | Checkpoint Volunteer | ✅ Pass / 2 skipped (see gaps) |
| `03-base-station.journey.spec.js` | Enter runner times, record DNFs, view checkpoint matrix & reports | Base Station Operator | ⏭ All skipped (see gaps) |
| `04-race-management.journey.spec.js` | View race list, create a second race, navigate to checkpoint/base-station from overview | Race Director | ✅ All pass |
| `05-navigation-protection.journey.spec.js` | Verify operation locks block mid-operation navigation, confirm exit works | All roles | ✅ All pass |
| `06-settings.journey.spec.js` | Toggle dark mode, change preferences, verify persistence | Any user | ✅ All pass |
| `07-import-export.journey.spec.js` | Export race config JSON, clear data, re-import and verify restoration | Race Director | ⏭ Skipped (see gaps) |

## Prerequisites

```bash
# Install Playwright browsers (first time only)
npx playwright install chromium
```

The dev server must be running before starting the tests:

```bash
npm run dev
```

## Running Tests

```bash
# Run all journeys (headless)
npm run test:playwright

# Run with a visible browser window
npm run test:playwright:headed

# Interactive Playwright UI mode
npm run test:playwright:ui

# Debug a single test with step-through
npm run test:playwright:debug

# Open the HTML report after a run
npm run test:playwright:report
```

### Run a single journey file

```bash
npx playwright test test/e2e/playwright/01-race-setup.journey.spec.js
```

### Run a single test by name

```bash
npx playwright test -g "creates a new race from scratch"
```

## Configuration

See `playwright.config.js` at the project root. Key settings:

| Setting | Value | Notes |
|---------|-------|-------|
| `baseURL` | `http://localhost:3000` | Vite dev server |
| `workers` | `1` | Tests run sequentially (shared IndexedDB) |
| `reporter` | custom HTML + list | Reports in `playwright-report/journey-report.html` |
| `retries` | `1` in CI, `0` locally | |

## Test Data Strategy

- **`helpers.js`** provides `createRace()`, `clearAppData()`, `goHome()`, and `pickFirstRaceInModal()`.
- Each test suite seeds its own race in `beforeEach` to avoid inter-test dependencies.
- `clearAppData()` uses IndexedDB deletion to reset state.

## Known Gaps Requiring Development Intervention

### 🔴 CRITICAL: Base Station Module Disconnected from Main App Data

**Affected:** All spec 03 tests + spec 07 export-from-base-station test

**Root cause:** `baseOperationsStore` (the store used by `BaseStationView`, `DataEntry`, `RaceOverview`, etc.) reads race configuration from localStorage keys `race_${id}_config` and `race_${id}_runners`. The main app creates races in **IndexedDB (Dexie only)** — these localStorage keys are **never populated** by any part of the main app.

**Additional incompatibility:** `baseOperationsStore.initializeRunners()` expects `runnerRanges` as strings in `"min-max"` format (e.g., `"100-200"`), but the main app stores ranges as objects `{ min, max }`.

**Impact:** When navigating to Base Station via the modal, `initialize(raceId)` is called but `loadRaceConfig` returns null → "Race configuration not found" error → redirects to home. The base station module effectively cannot be used via the normal app flow.

**To fix:**
1. Update `baseOperationsStore.loadRaceConfig()` to read from Dexie `races` table instead of localStorage
2. Update `baseOperationsStore.loadRunners()` to read from Dexie `base_station_runners` table
3. Update `baseOperationsStore.initializeRunners()` to accept `{ min, max }` range objects
4. Remove the parallel localStorage data store and consolidate on Dexie

### 🟡 Callout Sheet Component Broken

**Affected:** Spec 02 test "switches to Callout Sheet tab"

**Root cause:** `CalloutSheet.jsx` destructures `getTimeSegments` and `markSegmentCalled` from `useRaceStore()`, but neither function exists in `useRaceStore`. Calling `getTimeSegments()` throws `TypeError: getTimeSegments is not a function`, crashing the component.

**To fix:** Implement `getTimeSegments` and `markSegmentCalled` in `useRaceStore`, or update `CalloutSheet` to use a different data source for time segments.

### 🟡 Export Button Does Not Open Dialog

**Affected:** Spec 02 test "can export checkpoint results"

**Behavior:** The "Export Results" button in `CheckpointView` triggers a direct file download (via `ExportService.downloadExport()`), not a modal dialog. The test was updated to handle this — it accepts either a download event or a dialog.

### 🟡 Race Management Export/Import Not Implemented

**Affected:** Spec 07 tests "downloads a race configuration JSON file" and "imports a race configuration"

**Behavior:** No export/import button found on the `/race-management` page. The `exportRaceConfig` and `exportRaceResults` functions exist in `useRaceStore` and `StorageService`, but are not wired to a visible UI control on the race management page.

## App Bugs Fixed During Test Development

The following real bugs were discovered and fixed while developing these tests:

1. **`RUNNER_STATUSES` constants used wrong separator** — `src/types/index.js` used underscore (`not_started`) but the DB stores hyphen (`not-started`). Added all missing statuses (`PASSED`, `CALLED_IN`, `MARKED_OFF`, `NON_STARTER`, `PENDING`) with correct hyphen values.

2. **`raceStatistics.getRunnerRange()` returned raw object** — Caused React "Objects are not valid as React children" crash on RaceOverview. Fixed to return formatted string.

3. **`RaceSetup.handleSubmit` missing `minRunner`/`maxRunner`** — The new wizard path didn't compute these fields, causing `SharedRunnerGrid` to render empty groups (NaN arithmetic). Fixed to compute from `runnerRanges`.

4. **Dexie compound index prefix query** — `getCheckpointRunners` used `where(['raceId', 'checkpointNumber']).equals([...])` which requires an exact 2-column index. Only a 3-column `[raceId+checkpointNumber+number]` index exists. Fixed to use `between` on the 3-column index in both `CheckpointRepository` and `StorageService`.

5. **`CheckpointView` stale closure** — `currentRace` read from closure after async `loadCurrentRace()` returns stale value. Fixed to read from `useRaceMaintenanceStore.getState()` directly.

6. **`RaceOverview` infinite render loop** — `raceConfig` in `useEffect` dependency array caused infinite re-renders. Removed from dep array.

7. **`BaseStationView` never calls `initialize()`** — View only redirected to `/` if `currentRaceId` was null, but nothing ever called `baseOperationsStore.initialize()`. Fixed to read `selectedRaceForMode` from `useRaceStore` and call `initialize()`.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `net::ERR_CONNECTION_REFUSED` | Start the dev server: `npm run dev` |
| Browser not found | Run `npx playwright install chromium` |
| Tests fail after app UI changes | Update role/text selectors in the relevant spec file |
| Flaky timing failures | Increase `timeout` in the failing `waitFor` call |
| Spec 03 all skip | Known gap — base station module not integrated with Dexie |
