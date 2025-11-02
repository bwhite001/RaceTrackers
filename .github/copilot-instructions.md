# Copilot Coding Agent Instructions for RaceTracker Pro

## Project Architecture
  - `src/components/` — UI components (Checkpoint, BaseStation, Shared, etc.)
  - `src/services/storage.js` — Dexie-based storage service, all race data ops
  - `src/store/useRaceStore.js` — Zustand store, app state/actions
  - `src/views/` — Top-level views for app modes

## Data Flow & Patterns

### Race Creation & Management

### Checkpoint Mode

### Base Station Mode

### Settings & Customization

### Export/Import

### Manual Seeding
  ```js
  await window.StorageService.clearAllData();
  await window.StorageService.saveRace({ ... });
  ```

### Tabs & Navigation

### Performance & Accessibility

### Deployment

### Troubleshooting

### Example Workflow
1. Create a race with name, date, start time, runner range.
2. Select mode (Checkpoint/Base Station).
3. Track runners via grid/list, callout segments, or batch data entry.
4. Export results via JSON/QR/email.
5. Reset/clear data via Settings if needed.

### Key Files for Patterns

## Developer Workflows
  - Dexie/IndexedDB only works in browser; use browser console for seeding
  - Example seeder:
    ```js
    await window.StorageService.clearAllData();
    await window.StorageService.saveRace({ ... });
    ```

## Project-Specific Conventions

## Integration Points

## Examples

## Key Files

For browser-only Dexie operations, always run scripts in the browser context. For new features, follow the shared grid/component pattern and keep all state in Zustand.
