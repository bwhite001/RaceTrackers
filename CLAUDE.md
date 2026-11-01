# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

RaceTracker Pro — offline-first React PWA for race timing and checkpoint management (50–1,000+ runners). Built with React 18, Zustand, Dexie/IndexedDB, Vite, and Tailwind CSS.

Repo: https://github.com/bwhite001/RaceTrackers — CI in `.github/workflows/`: `ci.yml`, `test-suites.yml` (+ `test-suites-smart.yml`), `generate-guides.yml`, `deploy.yml`.

## Commands

Prefer `make` for everyday tasks — run `make` or `make help` to list all targets.

```bash
# Development
make dev                 # Vite dev server (localhost:3000)
make build               # Production build
make preview             # Build then serve locally (localhost:4173)

# Testing
make test                # Watch mode
make test-run            # Single run with exit
make test-coverage       # Coverage report
npm run test:ui          # Vitest UI dashboard (no make target)

# Targeted test suites
make test-unit
make test-base
make test-db
make test-integration
make test-services
make test-components

# E2E tests (make auto-builds first)
make test-e2e            # Headed
make test-e2e-ci         # Headless
make test-confidence     # 00-full-confidence journey across all 3 operator roles

# Playwright directly (three configs)
npx playwright test                                        # playwright.config.js (default)
npx playwright test --config playwright.mobile.config.js   # mobile viewports
npx playwright test --config playwright.live.config.js     # 08-complete-race-simulation only

# Single file / pattern (no make target — use npx directly)
npx vitest run test/path/to/file.test.jsx
npx vitest run -t "test name pattern"

# Tests affected by uncommitted changes
make test-changed

# Test data
make seed                # Populate complete dataset in IndexedDB
make seed-minimal
make clear-data

# Docs generation (require a prior E2E run — see Playwright Screenshot Guide below)
make guide               # user-guide + annotated role journey docs
make guide-pdfs
make journey-pdfs

# Housekeeping
make install             # npm install
make dev-fixtures        # Copy sample XLSX into public/import/ for the dev file picker
make clean               # Remove dist/ and dev-dist/
```

There is no linter or formatter configured — no ESLint, no Prettier. Don't look for `make lint`.

## Architecture

### Three Isolated Modules

The app enforces strict module isolation to support concurrent operators without data conflicts:

| Module | Route prefix | Database tables | Purpose |
|--------|-------------|-----------------|---------|
| Race Maintenance | `/race-maintenance/*` | `races`, `runners`, `checkpoints` | Setup, runner ranges, checkpoint config |
| Checkpoint Operations | `/checkpoint/*` | `checkpoint_runners` | Per-checkpoint runner tracking |
| Base Station | `/base-station/*` | `base_station_runners`, `audit_log`, `deleted_entries`, `strapper_calls`, `withdrawal_records`, `vet_out_records` | Finish line, audit trails |

**Never cross-contaminate between `checkpoint_runners` and `base_station_runners`.** Each module has its own `components/`, `services/`, `store/`, and `views/` under `src/modules/`.

### Navigation Protection

`src/shared/store/navigationStore.js` + `src/shared/components/ProtectedRoute.jsx` block navigation during active operations:

```javascript
const { startOperation, endOperation, canNavigateTo } = useNavigationStore();
startOperation(MODULE_TYPES.CHECKPOINT); // locks navigation
// ... work ...
endOperation(); // unlocks
```

All routes must be wrapped in `<ProtectedRoute moduleType={MODULE_TYPES.X}>` (see `src/App.jsx`).

### State Management (Zustand — 3 global + 4 module stores)

Global:
1. **`useRaceStore`** (`src/store/useRaceStore.js`, 800+ lines) — global race data, persisted to localStorage. Key methods: `loadRaceData()`, `loadCheckpointRunners()`, `loadBaseStationRunners()`, `updateRunnerStatus()`.
2. **`useNavigationStore`** (`src/shared/store/navigationStore.js`) — operation locks, NOT persisted (resets on reload).
3. **`useSettingsStore`** (`src/shared/store/settingsStore.js`) — user preferences, persisted.

Per-module (each backed by its own Repository, not `StorageService`):
- `raceMaintenanceStore` → `RaceMaintenanceRepository`
- `checkpointStore` → `CheckpointRepository`
- `useDualCheckpointStore` → `CheckpointRepository` — operates two **linked checkpoints** at once (`primary`/`secondary` runner lists, `activeTab` decides which receives marks). Any mark/bulk op must go through `_activeCpNumber()`.
- `baseOperationsStore` → `BaseOperationsRepository`

### Data Flow

Two coexisting paths — check which one a component is on before adding DB calls:

```
legacy:  Components → useRaceStore → StorageService (src/services/storage.js) → Dexie
module:  Components → module store  → <Module>Repository                      → Dexie
```

New module work goes through the module's Repository. `StorageService` remains for `useRaceStore` and the shared import/export path.

### Database Schema (Dexie v10)

All runner tables use compound indexes that must be queried in exact order:

```javascript
// Correct query pattern
await db.checkpoint_runners
  .where(['raceId', 'checkpointNumber', 'number'])
  .equals([raceId, checkpointNumber, runnerNumber])
  .first();
```

Schema changes require `.version(N).stores({...})`. Provide an `.upgrade()` callback for data migrations — Dexie does not auto-migrate. Additive nullable *data* columns need no index and no `.upgrade()`; only indexed fields belong in the `.stores()` string.

Note: in `schema.js` the version blocks are not in numeric order (`version(10)` is declared above `version(9)`). Dexie doesn't care, but don't assume the last block is the newest.

- **v8:** Runners gain `firstName/lastName/gender/batchNumber`. Checkpoint runners gain the 3-time model: `actualTime/commonTime/commonTimeLabel/calledIn`. Base station runners gain `markOffEntryTime`. New tables: `race_batches`, `imported_checkpoint_results`.
- **v9:** GPS course data — `races.courseGpx/courseBounds`, `checkpoints.latitude/longitude` (data columns).
- **v10:** `checkpoints.allowedBatches` — nullable means all waves.

### Import / Export / Transfer

- `src/services/import-export/` — `ImportService`, `ExportService`, `ValidationSchemas` (Zod). Versioned JSON race export/import.
- `src/utils/xlsxImport.js` + `race-maintenance/components/WebScorerImportWizard.jsx` — create a race from a WebScorer `.xlsx` participant list.
- `checkpoint-operations/services/TransferService.js` + `components/transfer/` — offline checkpoint→base handoff via QR (`qram` chunked codes, `pako` compression, camera scan). Used when there is no network at all.
- `src/services/gpxUtils.js` — GPX course parsing for the Leaflet map views.

### Runner Range System

`runnerRanges` is a one-way transformation: `StorageService.saveRace()` expands `{min, max}` ranges into individual runner records at creation time. Never recompute ranges from runner numbers after creation.

## Key Files

- `src/App.jsx` — route definitions and ProtectedRoute patterns
- `src/store/useRaceStore.js` — primary state store (read carefully before modifying)
- `src/services/storage.js` — all database operations via StorageService
- `src/shared/services/database/schema.js` — Dexie schema v10 and migration history
- `src/shared/store/navigationStore.js` — operation lock enforcement
- `src/types/index.js` — constants, enums, JSDoc type definitions (`BASE_STATION_CP`, `RUNNER_STATUSES`, etc.)
- `src/modules/base-operations/views/BaseStationView.jsx` — base station entry view
- `src/modules/base-operations/store/baseOperationsStore.js` — base station Zustand store (uses Dexie)
- `src/modules/base-operations/services/BaseOperationsRepository.js` — base station DB queries
- `vite.config.js` — PWA config and service worker caching strategy
- `docs/guides/` — User guides, journey walkthroughs (HTML/PDF), race day operations
- `docs/RaceTrackerApp.md` — Architecture and design reference

## Testing Patterns

Tests use `fake-indexeddb` for in-memory IndexedDB — configured in `test/setup.js`. Mock `navigationStore` to simulate operation locks:

```javascript
vi.mock('../../shared/store/navigationStore');
useNavigationStore.mockImplementation(() => ({
  operationStatus: OPERATION_STATUS.IN_PROGRESS,
  canNavigateTo: (module) => module === MODULE_TYPES.CHECKPOINT
}));
```

Target coverage: >85% for new code.

## Design System

Use components from `src/design-system/components/` (Button, Card, Modal, Form inputs, Badge, Tabs) instead of raw Tailwind. Dark mode is class-based. Status colors are fixed (`RUNNER_STATUSES` in `src/types/index.js`): not-started (gray), passed (green), non-starter (red), DNF (orange/gold).

## Time Handling

Use `src/services/timeUtils.js` for all time/date operations — not raw `Date()`. Timestamps stored as ISO strings.

## PWA / Offline

After changes affecting offline behavior, increment the version in `vite.config.js` PWA config to force service worker cache update.

## Playwright Screenshot Guide (Required for All New Features)

Every new feature **must** include a Playwright journey spec that captures screenshots for the user guide. This is non-negotiable — the guide is auto-generated from test output.

### 1. Create a journey spec

Add a numbered file in `test/e2e/playwright/` (e.g. `16-my-feature.journey.spec.js`):

```javascript
import { test, expect } from './fixtures.js';

test.describe('My Feature Journey', () => {
  test('describes the user action in plain language', async ({ page, step }) => {
    await step('Screen label — becomes the screenshot caption', async () => {
      // navigate / interact
      await expect(page.getByRole('heading', { name: /my feature/i })).toBeVisible();
    });

    await step('Next meaningful state — another caption', async () => {
      // ...
    });
  });
});
```

- Use the `step(title, fn)` fixture from `fixtures.js` — it auto-captures a screenshot before and after each step.
- Step titles become captions in the generated guide.
- Test names (the string passed to `test(...)`) must be unique across all specs.

### 2. Register in `generate-guide.js`

Add an entry to `SECTION_MAP` in `test/e2e/playwright/generate-guide.js`:

```javascript
'describes the user action in plain language': 'my-section',
```

If this is a new section, also add to the `CHAPTERS` array:

```javascript
{ key: 'my-section', title: 'My Feature Title', intro: 'One sentence describing this section.' },
```

### 3. Regenerate the user guide

```bash
make build
npx playwright test test/e2e/playwright/16-my-feature.journey.spec.js
make guide   # generate:guide + generate:journeys
```

Commit the updated `docs/guides/user-guide.md`, `docs/guides/user-guide.html`, and `docs/guides/assets/*.png` alongside the feature code.

### Checklist for new features

- [ ] Journey spec created in `test/e2e/playwright/`
- [ ] Every user-visible step wrapped in `step(title, fn)`
- [ ] Test name registered in `SECTION_MAP` in `generate-guide.js`
- [ ] New chapter added to `CHAPTERS` if this is a new section
- [ ] `npm run generate:guide` run and output committed
