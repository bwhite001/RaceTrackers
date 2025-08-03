# Copilot Coding Agent Instructions for RaceTracker Pro

## Project Architecture
  - `src/components/` — UI components (Checkpoint, BaseStation, Shared, etc.)
  - `src/services/storage.js` — Dexie-based storage service, all race data ops
  - `src/store/useRaceStore.js` — Zustand store, app state/actions
  - `src/views/` — Top-level views for app modes

## Data Flow & Patterns

### Race Creation & Management
- Races are created via a form (see `RaceDetailsStep.jsx`), supporting flexible runner ranges (e.g., "100-200", "1-50").
- After creation, users select between Checkpoint and Base Station modes.
- All runner data is generated and stored locally in IndexedDB.

### Checkpoint Mode
- Runner tracking uses grid/list views for fast marking (see `SharedRunnerGrid.jsx`).
- Callout Sheet tab groups runners by 5-minute segments for radio callouts.
- Overview tab provides status dashboard and manual status updates (Passed, NS, DNF).

### Base Station Mode
- Data Entry tab allows batch assignment of finish times to runner groups.
- Flexible input supports individual numbers, ranges, and bulk entry.
- Overview tab mirrors checkpoint overview for final results.

### Settings & Customization
- Accessed via gear icon; supports dark/light mode, font size, status colors, view mode, and group size.
- Database can be cleared/reset via Settings modal (requires typing 'CLEAR').

### Export/Import
- Data sharing is local-only: export as JSON, QR code, or email (see `ImportExportModal.jsx`).
- No external API calls; all data remains on device.

### Manual Seeding
- Dexie/IndexedDB seeding must be done in browser console:
  ```js
  await window.StorageService.clearAllData();
  await window.StorageService.saveRace({ ... });
  ```

### Tabs & Navigation
- All major views use tabbed navigation for mode switching (see `CheckpointView.jsx`, `BaseStationView.jsx`).
- Runner grids, callout sheets, and overviews are separate tabs.

### Performance & Accessibility
- Large runner ranges are grouped for performance; use group size settings for optimization.
- App supports keyboard navigation, screen readers, and font scaling.

### Deployment
- Production deploys via GitHub Actions when a version tag is pushed to main (see `DEPLOYMENT.md`).
- Tests run but do not block deployment; see known issues in deployment guide.

### Troubleshooting
- IndexedDB errors only occur in browser; Node.js scripts cannot access Dexie storage.
- Use Settings modal or browser console for data reset/clear.

### Example Workflow
1. Create a race with name, date, start time, runner range.
2. Select mode (Checkpoint/Base Station).
3. Track runners via grid/list, callout segments, or batch data entry.
4. Export results via JSON/QR/email.
5. Reset/clear data via Settings if needed.

### Key Files for Patterns
- `src/components/Shared/SharedRunnerGrid.jsx` — Universal runner grid logic
- `src/components/Settings/SettingsModal.jsx` — Settings, clear/reset logic
- `src/components/ImportExport/ImportExportModal.jsx` — Data sharing
- `src/views/CheckpointView.jsx`, `src/views/BaseStationView.jsx` — Tabbed navigation and mode logic
- `src/services/storage.js` — Dexie schema, CRUD, export/import
- `src/store/useRaceStore.js` — Zustand store, all state/actions

## Developer Workflows
- **Dev Server:** `npm run dev` (Vite)
- **Build:** `npm run build`
- **Preview:** `npm run preview`
- **Tests:** `npm run test` (Vitest)
- **Manual Seeding:**
  - Dexie/IndexedDB only works in browser; use browser console for seeding
  - Example seeder:
    ```js
    await window.StorageService.clearAllData();
    await window.StorageService.saveRace({ ... });
    ```
- **Settings Reset/Clear:** Use Settings modal in-app for clearing all data

## Project-Specific Conventions
- **Offline-First:** No server calls; all data is local
- **Status Colors:** Customizable, see `SettingsModal.jsx`
- **Grouping:** Large runner ranges are grouped for performance
- **Tabs:** Views use tabbed navigation for mode switching
- **Export/Import:** Only via JSON/QR/email, no external API

## Integration Points
- **Dexie.js:** Only available in browser; do not use in Node.js scripts
- **Zustand:** All state and actions in `useRaceStore.js`
- **Tailwind:** Utility classes for all styling
- **PWA:** Service worker auto-registers; no manual config needed

## Examples
- **Add a runner grid:** Use `SharedRunnerGrid` and pass runners, mark handler, config, settings
- **Clear all data:** `await window.StorageService.clearAllData()` (browser only)
- **Export race:** `await window.StorageService.exportRaceConfig(raceId)`

## Key Files
- `src/services/storage.js` — Storage logic, Dexie schema, all CRUD
- `src/store/useRaceStore.js` — Zustand store, actions, computed getters
- `src/components/Shared/SharedRunnerGrid.jsx` — Universal runner grid
- `src/components/Settings/SettingsModal.jsx` — Settings, clear/reset logic
- `README.md` — Visuals, workflows, features

---
For browser-only Dexie operations, always run scripts in the browser context. For new features, follow the shared grid/component pattern and keep all state in Zustand.
