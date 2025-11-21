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

### Test Organization (`src/test/`)
- **Unit tests** - Component behavior (Header.test.jsx, Settings, DarkMode.test.jsx)
- **Integration tests** (`src/test/integration/`) - Cross-module workflows, data sync
- **E2E tests** (`src/test/e2e/`) - Full user journeys with Puppeteer

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
Tests use in-memory Dexie databases. Setup in `src/test/setup.js` configures:
- jsdom environment with IndexedDB shims (`fake-indexeddb`)
- React Testing Library globals
- @testing-library/jest-dom matchers

**Test Utilities:**
- `src/test/setup.js` - Global config for all tests
- `src/test/e2e/test-data-seeder.js` - Populate test races and runners
- `vitest.config.js` - Test runner configuration

### Running Tests
```bash
npm test                      # Vitest unit tests (watch mode)
npm run test:run             # Single run with exit
npm run test:coverage        # Generate coverage report
npm run test:e2e             # Puppeteer E2E (requires build first)
npm run test:e2e:ci          # Headless E2E for CI
npm run test:seed            # Populate complete test dataset
npm run test:seed:minimal    # Minimal test data
npm run test:clear           # Clear all test data from IndexedDB
```

**Before running E2E tests:** Must run `npm run build` first—E2E tests use production build via `npm run preview`.

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
2. Add tests to appropriate `src/test/` directories
3. Update `src/types/index.js` if adding new constants/types
4. Document breaking changes in a VERSION_HISTORY file (create if needed)

---

## Future Roadmap & Enhancement Plan

### Current Status: MVP Complete + Base Station Refactoring
The application has completed the core MVP (Epics 1-5) and is currently implementing enhanced base station operations. See `notes/TODO.md` for active development tasks.

### Planned Enhancements (Post-MVP)

#### Epic 6: Race Setup & Configuration (Weeks 15-17) 📋
**Status:** Planned | **Points:** 21 | **Priority:** High

**Key Features:**
- **CSV/Excel Runner Import** - Bulk upload runner lists from spreadsheets
  - Support `.csv` and `.xlsx` formats
  - Flexible column mapping (Number, Name, Gender, Wave)
  - Data validation and preview before import
  - Handle name splitting (First/Last name)
- **Checkpoint Configuration UI** - Visual checkpoint management
  - Drag-and-drop checkpoint reordering
  - Assign names, locations, and sequences
  - Mark finish line checkpoint
- **Race Templates** - Save and reuse race configurations

**Implementation Notes:**
- Use `xlsx` library for Excel parsing
- Zod schemas for import validation (`RunnerImportSchema`)
- Store in `src/features/raceSetup/services/RunnerImportService.ts`
- When implementing: Follow patterns in `Epic-06-Race-Setup-Configuration.md`

#### Epic 7: Advanced Analytics & Reporting (Weeks 18-21) 📊
**Status:** Planned | **Points:** 34 | **Priority:** Medium

**Key Features:**
- **Real-Time Dashboard** - Live race monitoring
  - Runner counts by status (not started, active, finished, DNS, DNF)
  - Checkpoint throughput visualization (runners per time period)
  - Pace statistics (average, median, fastest, slowest)
  - Anomaly detection (slow times, missing runners)
  - Auto-refresh every 30 seconds
- **Runner Performance Analysis** - Individual analytics
  - Complete checkpoint history per runner
  - Segment time breakdown between checkpoints
  - Pace graphs showing speed variations
  - Rank progression through race
  - Comparison with category averages (gender/wave)
- **Report Generation** - Export comprehensive reports
  - PDF generation with `jsPDF`
  - Excel exports with `xlsx`
  - Leaderboards by gender and wave
  - DNS/DNF analysis
  - Customizable report sections

**Implementation Notes:**
- Services: `DashboardService`, `RunnerAnalysisService`, `ReportGenerationService`
- Store in `src/features/analytics/services/`
- Chart.js for pace visualizations
- Statistical algorithms for pace/anomaly detection

#### Future Enhancements (Weeks 22+) 💡
**Status:** Conceptual | **Priority:** Low

**Potential Features:**
- **Mobile App** - React Native version for native capabilities
- **RFID Chip Integration** - Automated runner detection at checkpoints
- **GPS Tracking** - Real-time runner location on course
- **Multi-Race Management** - Manage multiple concurrent events
- **Cloud Sync** (Optional) - Backup to cloud storage (maintains offline-first)
- **AI Predictions** - Finish time predictions based on checkpoint paces
- **Social Media Integration** - Share results and live updates

**When considering these:**
- Maintain offline-first architecture as core principle
- All cloud features must be optional enhancements
- Preserve data privacy and local control
- Ensure backward compatibility with existing exports

### Active Development: Base Station Refactoring

**Current Focus** (See `notes/TODO.md` for details):
- ✅ Phase 1-4 Complete: Database schema v6, repository layer, store enhancement
- 🔄 Phase 5: Component creation (13 new components)
  - Withdrawal/Vet-Out dialogs with reversal support
  - Missing numbers list and Out list views
  - Strapper calls management panel
  - Log operations panel (update/delete/view deleted/duplicates)
  - Report generation panel
  - Backup/restore functionality
  - Hotkey support via HotkeysProvider

**New Schema v6 Tables:**
```javascript
deleted_entries    // Audit trail for deleted items
strapper_calls     // Resource call tracking
audit_log          // Complete operation history
withdrawal_records // Runner withdrawals (reversible)
vet_out_records    // Veterinary outs
```

**Legacy Feature Parity Goal:**
The base station refactor aims to match functionality from a legacy VB6 application including hotkey support (Alt+A, Alt+B, etc.), missing numbers tracking, and comprehensive logging.

### Development Priorities

**Immediate (Current Sprint):**
1. Complete base station component creation (Phase 5)
2. Integration and testing (Phase 6)
3. Documentation updates (Phase 7)

**Next Sprint:**
1. Begin Epic 6 (Race Setup & Configuration)
2. CSV/Excel import implementation
3. Checkpoint drag-and-drop UI

**Quarter 2:**
1. Epic 7 (Advanced Analytics)
2. Real-time dashboard
3. Report generation

### Architecture Evolution Notes

**When building future enhancements:**

1. **Maintain Module Isolation** - New features should respect checkpoint/base station/race maintenance boundaries
2. **Extend DAL Pattern** - Add new DAL classes for new entities (follow `src/database/dal/` patterns)
3. **Schema Versioning** - Increment database version, provide migration in `schema.js`
4. **Service Layer** - Business logic in `src/features/*/services/*.ts` (SOLID: Single Responsibility)
5. **Store Integration** - Extend Zustand stores carefully, avoid state bloat
6. **PWA Considerations** - Update service worker cache strategies when adding large assets
7. **Testing Requirements** - Maintain >85% coverage, add E2E tests for new workflows

**Performance Targets:**
- Support 1000-2000+ runners without degradation
- Database operations <100ms for single records
- Bulk operations <500ms for 100 runners
- UI interactions <50ms response time
- Initial load <3 seconds on 3G

**Accessibility Requirements:**
- WCAG 2.1 AA compliance for all new UI
- Keyboard navigation for all operations
- Screen reader support
- Touch target sizes ≥44x44px
- Color contrast ratios ≥4.5:1

### Reference Documentation

**Implementation Guides:**
- `Epic-01-Database-Foundation.md` through `Epic-07-Advanced-Analytics.md` - Complete feature specifications
- `00-README-Implementation-Guide.md` - Master index and quick start
- `Sprint-Planning-Timeline.md` - 7-sprint MVP + enhancement roadmap
- `SolutionDesign.md` - Original technical design document
- `Extended-Roadmap-Summary.md` - Complete epic collection overview

**When implementing new features:** Always reference the corresponding Epic document for detailed user stories, acceptance criteria, and technical implementation patterns.
