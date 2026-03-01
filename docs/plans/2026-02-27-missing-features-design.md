# Missing Features Design — RaceTracker Pro

**Date:** 2026-02-27  
**Status:** Approved

---

## Problem

The current implementation has several gaps against `RaceTrackerApp.txt`. The core architectural intent — three fully isolated, independently-operated modes — is also not properly expressed in the UX. Checkpoint devices and Base Station devices should be able to operate completely independently, with explicit data hand-off between them.

## Approach

Module-by-module implementation in this order:
1. Race Config — QR code sharing
2. Checkpoint — 3-tab restructure + quick entry + export
3. Base Station — settings/help wiring + checkpoint import + grouping view

---

## Architecture: Data Flow

```
Race Config device
  → Create race, define runner ranges and checkpoints
  → Export config as QR code → other devices scan to load config

Checkpoint devices (one per checkpoint, offline)
  → Mark runners as passed throughout the event
  → End of event: export checkpoint results as JSON file
  → File sent to base station coordinator (email/USB/AirDrop)

Base Station device
  → Independent data entry (batch time + runner numbers from radio calls)
  → Imports JSON files from checkpoint devices
  → Consolidated view: own data + imported checkpoint data
```

No live sync between devices. All data stays local until explicitly exported.

---

## Module 1: Race Config

**Goal:** QR code export/import for sharing race configuration between devices.

**QR Export:**
- "Share as QR Code" button on the race config view
- Generates QR image from the existing JSON export payload (no new schema)
- Displayed as a modal the organiser can hold up for other devices to scan
- Library: `qrcode.react` (already installed)

**QR Import:**
- "Scan QR Code" button on the import screen
- Uses device camera via `jsQR` library (new dependency)
- Decodes the JSON payload, feeds into existing `ImportService` conflict resolution flow
- Fallback: paste JSON text still available

**Files touched:**
- `src/components/RaceMaintenance/ImportExportPanel.jsx` (or equivalent) — add QR buttons
- New `src/components/Shared/QRCodeModal.jsx` — displays QR for export
- New `src/components/Shared/QRScannerModal.jsx` — camera + jsQR decode for import

---

## Module 2: Checkpoint Operations

### 2a. Three-Tab Restructure

`CheckpointView.jsx` refactored to render three tabs:

| Tab | Component | Changes |
|-----|-----------|---------|
| Mark-Off | `RunnerGrid` | None — existing component unchanged |
| Callout Sheet | `CalloutSheet` | Moved from modal to tab panel; `showCalloutSheet` state removed |
| Overview | `RunnerOverview` | Wired in; already supports checkpoint-mode restrictions |

**Tab state:** `activeTab` ∈ `{ 'mark-off', 'callout', 'overview' }`, default `'mark-off'`.

### 2b. Quick Keyboard Entry Bar

New component: `src/components/Checkpoint/QuickEntryBar.jsx`

- Auto-focused text input (`inputMode="numeric"`) rendered above `RunnerGrid` on the Mark-Off tab
- User types a runner number and presses Enter
- Calls `checkpointStore.markRunner(number)` immediately
- Inline feedback below the input:
  - `✓ 342 marked` — green, auto-clears after 1.5 s
  - `342 not found` — amber
  - `342 already marked` — amber
- Input clears and refocuses after each submission
- Grid tap-to-mark continues to work alongside

### 2c. Checkpoint Results Export

"Export Results" button in the checkpoint view header:

- Downloads `checkpoint-{N}-results.json`
- Payload: `{ raceId, checkpointNumber, exportedAt, runners: [...checkpoint_runners rows] }`
- Uses existing `ExportService` pattern (checksum included)
- Available at any time during or after the session

**Files touched:**
- `src/views/CheckpointView.jsx` — tab state, tab bar, render all three panels, remove modal logic, add export button
- `src/components/Checkpoint/QuickEntryBar.jsx` — new file
- `src/services/ExportService.js` — add `exportCheckpointResults(raceId, checkpointNumber)`

---

## Module 3: Base Station

### 3a. Settings + Help Wire-Up

Two stubs in `BaseStationView.jsx` connected to real components:

```js
// Before (stubs):
const handleOpenSettings = () => console.log('Open settings');
const handleOpenHelp = () => console.log('Open help');

// After:
const [showSettings, setShowSettings] = useState(false);
const [showHelp, setShowHelp] = useState(false);
```

`SettingsModal` and `HelpDialog` already exist and are fully functional — just imported and rendered conditionally.

**Files touched:** `src/views/BaseStationView.jsx` only (~15 lines)

### 3b. Checkpoint Results Import

New "Import Checkpoint Results" button on the Overview tab.

- Accepts one or more `.json` files (standard file input, `multiple`)
- Validates payload shape and `raceId` match
- Stores data in new IndexedDB table `imported_checkpoint_results` (schema v7)
- Schema: `"++id, [raceId+checkpointNumber], raceId, checkpointNumber, importedAt, runners"`
- Re-importing the same checkpoint overwrites previous data (no duplicates)
- Visual confirmation: "Checkpoint 3 results imported (47 runners)"

**Schema change:** `src/shared/services/database/schema.js` — version 7, non-breaking addition.

### 3c. Checkpoint Grouping View (new "Checkpoints" tab)

New fourth tab in `BaseStationView`: **Checkpoints**, inserted between Overview and Reports.

**Matrix view** (default):
- Rows = runner numbers, Columns = checkpoints
- Cell content = time the runner passed that checkpoint (from imported data)
- Empty cell = not yet seen at that checkpoint
- Color coding: passed = green cell, not seen = gray
- Sticky header row (checkpoint names) and first column (runner numbers)

**Per-checkpoint drilldown**:
- Toggle button to switch from matrix to drilldown view
- Dropdown: select a checkpoint
- Two lists side by side: "Passed" (with time) | "Not yet seen"
- Runner counts shown above each list

Both views are **read-only** — no status mutations.

**Files touched:**
- `src/views/BaseStationView.jsx` — add Checkpoints tab to `TABS` array, render panel
- New `src/components/BaseStation/CheckpointGroupingView.jsx` — matrix + drilldown
- `src/shared/services/database/schema.js` — v7 schema addition
- `src/modules/base-operations/store/baseOperationsStore.js` — load `imported_checkpoint_results`
- `src/services/ImportService.js` — add `importCheckpointResults(file)`

---

## Database Changes

**Version 7** (non-breaking, additive only):

```js
imported_checkpoint_results: "++id, [raceId+checkpointNumber], raceId, checkpointNumber, importedAt"
```

Runners are stored as a JSON blob on each row (not normalized) since this data is imported/read-only and never queried by individual runner.

---

## New Dependencies

| Package | Purpose |
|---------|---------|
| `jsQR` | QR code decoding from camera frame |

`qrcode.react` is already installed.

---

## Out of Scope

- Email sharing (can be added later as a share-sheet wrapper around the JSON download)
- Advanced analytics / pace predictions
- Timing chip integration
- Cloud sync
