# RaceTracker Pro - AI Coding Instructions

## Project Overview
Offline-first React PWA for race tracking with **strict module isolation**. Built for race directors, checkpoint volunteers, and base station operators managing 50-1000+ runners across multiple checkpoints. Uses IndexedDB (Dexie) for persistent offline storage and Zustand for state management.

## Core Architecture

### Module Isolation Pattern
The app enforces **strict module isolation** to prevent data conflicts during concurrent operations:

**Three Independent Modules:**
- **Race Maintenance** (`/race-maintenance/*`) - Race setup, runner ranges, checkpoint configuration
- **Checkpoint Operations** (`/checkpoint/*`) - Runner tracking at specific checkpoints with isolated data stores
- **Base Station** (`/base-station/*`) - Finish line operations, consolidated reporting, audit trails

**Critical:** Each module maintains isolated data in separate IndexedDB tables:
- `checkpoint_runners` - Checkpoint-specific runner tracking (markOffTime, callInTime)
- `base_station_runners` - Base station runner data (commonTime, finish data)
- Never cross-contaminate between tables—this enables multiple operators to work simultaneously without conflicts

### Navigation Protection System
`src/shared/store/navigationStore.js` + `src/shared/components/ProtectedRoute.jsx` enforce operation safety:

```javascript
// During active operations (OPERATION_STATUS.IN_PROGRESS):
// 1. Navigation to other modules is BLOCKED
// 2. ProtectedRoute components enforce this at route level
// 3. canNavigateTo() must return true before routing
// 4. Browser back/forward navigation is intercepted

// Example: Starting an operation locks the module
const { startOperation, endOperation, canNavigateTo } = useNavigationStore();
startOperation(MODULE_TYPES.CHECKPOINT); // Locks navigation
// ... do work ...
endOperation(); // Unlocks navigation
```

**When adding routes:** Always wrap in `<ProtectedRoute moduleType={MODULE_TYPES.X}>` (see `App.jsx` for pattern).

## State Management (Zustand)

### Store Hierarchy (3 Primary Stores)
1. **`useRaceStore`** (`src/store/useRaceStore.js`) - 800+ lines, global race data, shared runner lists
   - Persisted to localStorage via `persist()` middleware
   - Manages race config, checkpoints, and base runner data
   - **Critical Methods:**
     - `loadRaceData(raceId)` - Initialize race from IndexedDB
     - `updateRunnerStatus(raceId, runnerNumber, status)` - Update global runner state
     - `loadCheckpointRunners(checkpointNumber)` / `loadBaseStationRunners()` - Load module-isolated data

2. **`useNavigationStore`** (`src/shared/store/navigationStore.js`) - Module state, operation locks
   - `currentModule: MODULE_TYPES` - Tracks active module
   - `operationStatus: OPERATION_STATUS` - IDLE or IN_PROGRESS
   - `canNavigateTo(moduleType)` - Permission checker for routing
   - **NOT persisted** - resets on page reload

3. **`useSettingsStore`** (`src/shared/store/settingsStore.js`) - User preferences
   - Dark mode, font size, status color customization
   - Persisted to localStorage

### Module-Specific Data Isolation Pattern
```javascript
// Checkpoint store slice (in useRaceStore)
checkpointRunners: {}, // Structure: { [checkpointNumber]: [runner objects] }
loadCheckpointRunners: async (checkpointNumber) => {
  const runners = await db.checkpoint_runners
    .where(['raceId', 'checkpointNumber'])
    .equals([raceId, checkpointNumber])
    .toArray();
  set({ checkpointRunners: { ...get().checkpointRunners, [checkpointNumber]: runners }});
}

// Base station store slice (separate, never mixed)
baseStationRunners: [], // Flat array of all base station runners
loadBaseStationRunners: async () => {
  const runners = await db.base_station_runners.where('raceId').equals(raceId).toArray();
  set({ baseStationRunners: runners });
}
```

**When modifying stores:** Never mix checkpoint and base station runner mutations. Each has dedicated database tables and store slices.

## Database Layer (Dexie + IndexedDB)

### Schema (Current: Version 6 - see `src/shared/services/database/schema.js`)
```javascript
// Core tables (v5)
races: "++id, name, date, startTime, minRunner, maxRunner, createdAt"
runners: "++id, [raceId+number], raceId, number, status, recordedTime, notes"
checkpoints: "++id, [raceId+number], raceId, number, name"
checkpoint_runners: "++id, [raceId+checkpointNumber+number], raceId, checkpointNumber, number, markOffTime, callInTime, status, notes"
base_station_runners: "++id, [raceId+checkpointNumber+number], raceId, checkpointNumber, number, commonTime, status, notes"
settings: "key, value"

// Audit & operations tables (v6 - NEW)
deleted_entries: "++id, raceId, entryType, deletedAt, restorable"
strapper_calls: "++id, [raceId+checkpoint], raceId, checkpoint, status, priority, createdAt"
audit_log: "++id, raceId, entityType, action, performedAt"
withdrawal_records: "++id, [raceId+runnerNumber], raceId, runnerNumber, checkpoint, withdrawalTime, reversedAt"
vet_out_records: "++id, [raceId+runnerNumber], raceId, runnerNumber, checkpoint, vetOutTime"
```

**Compound Index Pattern:** All runner tables use `[raceId+checkpointNumber+number]` for efficient lookups:
```javascript
// Query pattern - MUST match index order exactly
await db.checkpoint_runners
  .where(['raceId', 'checkpointNumber', 'number'])
  .equals([raceId, checkpointNumber, runnerNumber])
  .first();
```

**Migration Strategy:**
- Schema changes use `.version(N).stores({...})` - Dexie auto-handles index changes
- Version 5 was a breaking change that cleared data
- Version 6 adds audit trail tables (non-breaking)
- Access db instance: `import db from 'src/shared/services/database/schema.js'`

## Testing Strategy

### Test Organization (`test/`)
Tests live under `test/` at the repo root (not `src/test/`):
- **Unit/component tests** - `test/*.test.jsx`, `test/base-operations/`, `test/checkpoint/`
- **Integration tests** - `test/integration/` - Cross-module workflows, data sync
- **E2E tests** - `test/e2e/` - Full user journeys with Puppeteer
- **Global setup** - `test/setup.js` (configures jsdom + `fake-indexeddb` + jest-dom)

### Key Test Patterns
**Module Isolation Testing:**
```javascript
// Mock navigation store to simulate operation locks
vi.mock('../../shared/store/navigationStore');
useNavigationStore.mockImplementation(() => ({
  operationStatus: OPERATION_STATUS.IN_PROGRESS,
  currentModule: MODULE_TYPES.CHECKPOINT,
  canNavigateTo: (module) => module === MODULE_TYPES.CHECKPOINT
}));
```

**Database Mocking:**
Tests use in-memory Dexie databases via `fake-indexeddb` (configured in `test/setup.js`). Direct IndexedDB access is shimmed automatically—no manual setup required per test.

**Vitest path aliases** (defined in `vitest.config.js` — use these in test `vi.mock()` calls):
- `modules` → `src/modules`
- `shared` → `src/shared`
- `services` → `src/services`
- `store` → `src/store`
- `types` → `src/types`

### Running Tests
```bash
make test                             # Watch mode
make test-run                         # Single run, then exit
make test-coverage                    # Coverage report

# Run a single test file
npx vitest run test/path/to/file.test.jsx

# Run tests matching a name pattern
npx vitest run -t "test name pattern"

# Run only tests affected by uncommitted changes
make test-changed

# Targeted test suites
make test-unit           # Unit tests only
make test-base           # test/base-operations/**
make test-db             # test/database/**
make test-integration    # test/integration/**
make test-components     # test/components/**
make test-services       # test/services/**

# Puppeteer E2E (make auto-builds first)
make test-e2e            # Headed
make test-e2e-ci         # Headless mode for CI

# Test data management
make seed                # Populate complete dataset in IndexedDB
make seed-minimal
make clear-data
```

## Runner Range System

**Flexible Input:** Runners defined via `runnerRanges` array supporting:
- **Ranges:** `{min: 100, max: 150}` creates 100-150
- **Individual numbers:** `{isIndividual: true, individualNumbers: [101, 105, 107]}`
- **Mixed:** Multiple ranges/individuals per race

**Storage Pattern:** `StorageService.saveRace()` expands ranges into individual runner records at creation time. **Never recompute ranges from runner numbers**—it's a one-way transformation.

## Design System

### Tailwind Configuration (`tailwind.config.js`)
- **Navy blue** primary (`navy-*` colors) - branding
- **Status colors** - Fixed palette for runner states (see `status.*` in theme)
- **Dark mode** - `class`-based toggle (not media query)

**Status Color Mapping:**
```javascript
RUNNER_STATUSES = {
  NOT_STARTED: 'not-started',  // gray
  PASSED: 'passed',            // green
  NON_STARTER: 'non-starter',  // red
  DNF: 'dnf'                   // orange/gold
}
```

**Design System Components:** `src/design-system/components/` has Button, Card, Modal, etc. **Use these instead of raw Tailwind** for consistency.

## Data Export/Import

### Export Types (see `StorageService.export*`)
1. **Race Config** - Setup only (for sharing with volunteers)
2. **Checkpoint Results** - Isolated per-checkpoint data
3. **Base Station Results** - Finish line data
4. **Full Race Data** - Everything (config + all runner data)

**QR Code Sharing:** Export JSON embedded in QR codes for device-to-device transfer. Format must match import expectations.

## Common Pitfalls

### 1. Breaking Module Isolation
**Wrong:**
```javascript
// Directly updating baseStationRunners from checkpoint component
set({ baseStationRunners: [...] })
```
**Right:**
```javascript
// Use proper isolation boundaries
await StorageService.markCheckpointRunner(raceId, checkpointNumber, ...)
await get().loadCheckpointRunners(checkpointNumber)
```

### 2. Navigation During Operations
**Always check:**
```javascript
const { canNavigateTo } = useNavigationStore();
if (!canNavigateTo(MODULE_TYPES.TARGET)) {
  // Show warning modal, prevent navigation
}
```

### 3. Schema Migrations
**Version changes require `.upgrade()` callback.** Dexie doesn't auto-migrate—you must handle data transformation explicitly.

### 4. Time Handling
Use `src/services/timeUtils.js` utilities, not raw `Date()`. Timestamps stored as ISO strings for timezone safety.

## Development Workflow

### Build & Run

Prefer `make` for everyday tasks — run `make` or `make help` to list all targets.

```bash
make install             # Install dependencies
make dev                 # Vite dev server (localhost:3000)
make build               # Production build
make preview             # Build then serve locally (localhost:4173)
make clean               # Remove dist/ and dev-dist/
```

### PWA Features
Service worker caches all assets for offline use. **After code changes affecting offline behavior**, increment version in `vite.config.js` PWA config to force cache update.

## Key Files Reference

- **`src/App.jsx`** - Route definitions + ProtectedRoute usage patterns
- **`src/store/useRaceStore.js`** - 800+ lines of state logic, read carefully before modifications
- **`src/services/storage.js`** - StorageService class with all database operations (858 lines)
- **`src/shared/services/database/schema.js`** - Dexie schema (v6), migration history
- **`src/shared/store/navigationStore.js`** - Operation lock enforcement, module state
- **`src/shared/components/ProtectedRoute.jsx`** - Route guard implementation
- **`src/types/index.js`** - TypeScript-style JSDoc definitions, constants, enums
- **`vite.config.js`** - PWA config, service worker settings, build configuration
- **`vitest.config.js`** - Test environment setup, coverage settings
- **`notes/TODO.md`** - Active development tasks, implementation plan
- **`notes/BASE_STATION_README.md`** - Base station refactoring documentation
- **`docs/guides/user-guide.md`** - End-user workflows and features

## Documentation Maintenance

When adding features:
1. Update relevant `notes/*.md` files (especially IMPLEMENTATION.md for architectural changes)
2. Add tests to appropriate `test/` directories
3. Update `src/types/index.js` if adding new constants/types
4. Document breaking changes in a VERSION_HISTORY file (create if needed)

### Plans and Design Docs

**Never commit plan or design documents to this repo.** Plans (brainstorming outputs, implementation plans, design docs) are local-only artefacts. Save them to `docs/plans/` — they are covered by `.gitignore` and must stay that way. Do not force-add them or modify `.gitignore` to track them.

---

## Active Development

Current focus is **Base Station Refactoring (Phase 5)**. See `notes/TODO.md` for detailed task list and `notes/BASE_STATION_README.md` for context. Implementation specs for all planned epics are in the `notes/` directory (`Epic-01` through `Epic-07` markdown files).
