# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

RaceTracker Pro — offline-first React PWA for race timing and checkpoint management (50–1,000+ runners). Built with React 18, Zustand, Dexie/IndexedDB, Vite, and Tailwind CSS.

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

# Single file / pattern (no make target — use npx directly)
npx vitest run test/path/to/file.test.jsx
npx vitest run -t "test name pattern"

# Tests affected by uncommitted changes
make test-changed

# Test data
make seed                # Populate complete dataset in IndexedDB
make seed-minimal
make clear-data

# Housekeeping
make install             # npm install
make clean               # Remove dist/ and dev-dist/
```

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

### State Management (Zustand — 3 stores)

1. **`useRaceStore`** (`src/store/useRaceStore.js`, 800+ lines) — global race data, persisted to localStorage. Key methods: `loadRaceData()`, `loadCheckpointRunners()`, `loadBaseStationRunners()`, `updateRunnerStatus()`.
2. **`useNavigationStore`** (`src/shared/store/navigationStore.js`) — operation locks, NOT persisted (resets on reload).
3. **`useSettingsStore`** (`src/shared/store/settingsStore.js`) — user preferences, persisted.

### Data Flow

```
Components → Zustand stores → StorageService → Dexie/IndexedDB
```

`src/services/storage.js` (858 lines) is the **only** place for database operations. Never access Dexie directly from components or stores — go through `StorageService`.

### Database Schema (Dexie v6)

All runner tables use compound indexes that must be queried in exact order:

```javascript
// Correct query pattern
await db.checkpoint_runners
  .where(['raceId', 'checkpointNumber', 'number'])
  .equals([raceId, checkpointNumber, runnerNumber])
  .first();
```

Schema changes require `.version(N).stores({...})`. Provide an `.upgrade()` callback for data migrations — Dexie does not auto-migrate.

### Runner Range System

`runnerRanges` is a one-way transformation: `StorageService.saveRace()` expands `{min, max}` ranges into individual runner records at creation time. Never recompute ranges from runner numbers after creation.

## Key Files

- `src/App.jsx` — route definitions and ProtectedRoute patterns
- `src/store/useRaceStore.js` — primary state store (read carefully before modifying)
- `src/services/storage.js` — all database operations via StorageService
- `src/shared/services/database/schema.js` — Dexie schema v6 and migration history
- `src/shared/store/navigationStore.js` — operation lock enforcement
- `src/types/index.js` — constants, enums, JSDoc type definitions
- `vite.config.js` — PWA config and service worker caching strategy
- `notes/` — Epic specs (01–07), implementation guides, active TODO

## Testing Patterns

Tests use `fake-indexeddb` for in-memory IndexedDB — configured in `src/test/setup.js`. Mock `navigationStore` to simulate operation locks:

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
