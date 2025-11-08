# RaceTracker Pro - AI Coding Instructions

## Project Overview
Offline-first React PWA for race tracking with isolated module architecture. Built for race directors, checkpoint volunteers, and base station operators managing 50-1000+ runners across multiple checkpoints.

## Core Architecture

### Module Isolation Pattern
The app uses **strict module isolation** to prevent data conflicts during concurrent operations:

- **Race Maintenance** (`/race-maintenance/*`) - Race setup, runner ranges, checkpoint configuration
- **Checkpoint Operations** (`/checkpoint/*`) - Runner tracking at specific checkpoints with independent data stores
- **Base Station** (`/base-station/*`) - Finish line operations, consolidated reporting

**Critical:** Each module maintains isolated data in separate IndexedDB tables (`checkpoint_runners`, `base_station_runners`) preventing cross-contamination when multiple operators work simultaneously.

### Navigation Protection
`src/shared/store/navigationStore.js` enforces operation safety:
```javascript
// During active operations (OPERATION_STATUS.IN_PROGRESS):
// - Navigation to other modules is BLOCKED
// - ProtectedRoute components enforce this
// - canNavigateTo() must return true before routing
```

**When adding routes:** Wrap in `<ProtectedRoute moduleType={MODULE_TYPES.X}>` to inherit this protection.

## State Management (Zustand)

### Store Hierarchy
1. **`useRaceStore`** (`src/store/useRaceStore.js`) - Global race data, shared runner lists
2. **`useNavigationStore`** (`src/shared/store/navigationStore.js`) - Module state, operation locks
3. **`useSettingsStore`** (implied in code) - Dark mode, font size, status colors

**Key Pattern:** Module-specific data (checkpoint/base station runners) lives in separate store slices:
```javascript
// Checkpoint has isolated tracking
checkpointRunners: {}, // { [checkpointNumber]: [...runners] }
loadCheckpointRunners: async (checkpointNumber) => { /* ... */ }

// Base station has isolated tracking
baseStationRunners: [],
loadBaseStationRunners: async () => { /* ... */ }
```

**When modifying stores:** Never mix checkpoint and base station runner mutations—they're intentionally separated.

## Database Layer (Dexie + IndexedDB)

### Schema (Version 5 - see `src/services/storage.js`)
```javascript
races: "++id, name, date, startTime, minRunner, maxRunner"
runners: "++id, [raceId+number], raceId, number, status"
checkpoint_runners: "++id, [raceId+checkpointNumber+number], ..."
base_station_runners: "++id, [raceId+checkpointNumber+number], ..."
```

**Compound Index Pattern:** All runner tables use `[raceId+checkpointNumber+number]` for efficient lookups. When querying:
```javascript
await db.checkpoint_runners
  .where(['raceId', 'checkpointNumber', 'number'])
  .equals([raceId, checkpointNumber, runnerNumber])
  .first();
```

**Migration Strategy:** Schema changes use `.upgrade()` with clean migrations. Version 5 was a breaking change that wiped prior data.

## Testing Strategy

### Test Organization (`src/test/`)
- **Unit tests** - Component behavior (Header, Settings, etc.)
- **Integration tests** (`src/test/integration/`) - Cross-module workflows
- **E2E tests** (`src/test/e2e/`) - Full user journeys with Puppeteer

### Key Test Patterns
**Module Isolation Testing:**
```javascript
// Mock navigation store to simulate operation locks
useNavigationStore.mockImplementation(() => ({
  operationStatus: OPERATION_STATUS.IN_PROGRESS,
  currentModule: MODULE_TYPES.CHECKPOINT,
  canNavigateTo: (module) => module === MODULE_TYPES.CHECKPOINT
}));
```

**Database Mocking:**
Tests use in-memory Dexie databases. Setup in `src/test/setup.js` configures jsdom + IndexedDB shims.

### Running Tests
```bash
npm test                    # Vitest unit tests
npm run test:e2e           # Puppeteer E2E (requires build)
npm run test:seed          # Populate test data
npm run test:clear         # Clear all test data
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
```bash
npm run dev              # Vite dev server (localhost:5173)
npm run build            # Production build
npm run preview          # Test production build locally
```

### PWA Features
Service worker caches all assets for offline use. **After code changes affecting offline behavior**, increment version in `vite.config.js` PWA config to force cache update.

## Key Files Reference

- **`src/App.jsx`** - Route definitions + ProtectedRoute usage
- **`src/store/useRaceStore.js`** - 600+ lines of state logic, read carefully
- **`src/services/storage.js`** - All Dexie operations, schema definition
- **`src/shared/store/navigationStore.js`** - Operation lock enforcement
- **`src/types/index.js`** - TypeScript-style JSDoc definitions, constants
- **`notes/IMPLEMENTATION.md`** - Architecture decisions documentation
- **`notes/USER_WORKFLOWS.md`** - Complete operator workflows (read for UX context)

## Documentation Maintenance

When adding features:
1. Update relevant `notes/*.md` files (especially IMPLEMENTATION.md for architectural changes)
2. Add tests to appropriate `src/test/` directories
3. Update `src/types/index.js` if adding new constants/types
4. Document breaking changes in a VERSION_HISTORY file (create if needed)
