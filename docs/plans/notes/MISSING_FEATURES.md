# Missing Features — Gaps vs. Original Spec

> Audited against `RaceTrackerApp.txt` on 2026-02-19.
> Each item maps to a specific requirement in the original proposal.

---

## 1. Checkpoint: Quick Keyboard Number Entry `[AJ]`

**Spec requirement:**
> "Add ability to quickly type in runner numbers (base and checkpoints)"
> "Ability to quickly key in numbers as they pass"

**Current state:**
`SharedRunnerGrid.jsx` only supports tapping/clicking runner tiles from a grid, or using the search bar to filter the grid. There is **no input where a volunteer can type a runner number and press Enter to mark them passed**.

The search bar (`SearchInput`) filters the visible grid but does not mark anyone. There is no keyboard-first entry path.

**Impact:** High. At a busy checkpoint runners arrive quickly and in groups. Tapping individual tiles in a grid is slow. The intended workflow is to call out numbers and keyboard-enter them as they pass.

**What needs building:**
A number entry bar at the top of the checkpoint view:
- Text input, auto-focused
- Volunteer types a runner number (e.g. `342`) and presses Enter
- Runner is immediately marked `passed` with current timestamp
- Input clears and refocuses, ready for the next number
- If number is not found or already marked, show brief inline feedback
- Should work alongside the existing grid (both entry methods coexist)

**Files to touch:**
- `src/views/CheckpointView.jsx` — add the input bar above RunnerGrid
- `src/modules/checkpoint-operations/store/checkpointStore.js` — confirm `markRunner` is callable by number alone
- Optionally extract as `src/components/Checkpoint/QuickEntryBar.jsx`

---

## 2. Checkpoint: Tab 3 Overview Not Wired Up

**Spec requirement:**
> "Tab 3: Overview — Status Dashboard showing all runners with color-coded statuses (Passed, Not started, Non-starter, DNF). Manual Status Updates: mark runners as non-starter or DNF. Counts and progress. Timing information."

**Current state:**
`CheckpointView.jsx` renders only two things:
1. `<RunnerGrid>` (Tab 1 mark-off)
2. `<CalloutSheet>` as a modal (Tab 2)

**There is no Tab 3.** The `RunnerOverview` component (`src/components/Shared/RunnerOverview.jsx`) exists and is fully implemented with status filters, sort, manual NS/DNF actions, and elapsed time — but it is never rendered inside `CheckpointView`. It is only used in `src/views/RaceOverview.jsx` (the pre-race role selection screen), not inside the active checkpoint session.

**Impact:** Medium. Volunteers at a checkpoint currently have no way to see overall runner counts, mark runners as non-starters or DNF, or review who has/hasn't passed — without leaving the checkpoint session.

**What needs building:**
- Add tab navigation to `CheckpointView.jsx` (Tab 1: Mark-Off, Tab 2: Callout Sheet as a tab not a modal, Tab 3: Overview)
- Render `RunnerOverview` (or `SharedRunnerGrid` in overview mode) as Tab 3
- `RunnerOverview` already supports checkpoint mode correctly (restricts actions to NS/DNF only at line 117–136)

**Files to touch:**
- `src/views/CheckpointView.jsx` — add tab state and render all three tabs
- `CalloutSheet` may need to move from a modal to a tab panel

---

## 3. Base Station: Checkpoint Grouping View `[AJ]`

**Spec requirement:**
> "[AJ] View to group checkpoints so you can see reports back from specific checkpoints (ie so we can see based on reports back a global view and a view of each checkpoint about who has passed/not passed through yet)"

**Current state:**
The Base Station overview (`src/components/BaseStation/RaceOverview.jsx`) shows a flat list of all runners with their base station finish status only. There is **no view that shows checkpoint-level data** — i.e. which checkpoint each runner last reported from, which runners have been seen at checkpoint 1 vs checkpoint 2, etc.

The `checkpoint_runners` table in IndexedDB stores all checkpoint mark-off data, and `StorageService` has the queries to read it, but no component reads cross-checkpoint data and presents it at the base station.

**Impact:** High for race coordinators. Base station operators need to know "checkpoint 3 hasn't reported back yet — which runners are still out there?" This is a core coordination tool, not an analytics extra.

**What needs building:**
A "Checkpoint Reports" tab or panel in Base Station with two views:
1. **Global view** — for each runner, show which checkpoints they have passed and which they haven't (a matrix/grid: runners × checkpoints)
2. **Per-checkpoint view** — select a checkpoint and see: who has passed through, who hasn't been seen yet
- Reads from `checkpoint_runners` table via `StorageService` (not `base_station_runners`)
- Read-only — no status changes from this view

**Files to touch:**
- New component: `src/components/BaseStation/CheckpointGroupingView.jsx`
- `src/views/BaseStationView.jsx` — add as a new tab
- `src/services/storage.js` — may need a `getRunnersByCheckpoint(raceId)` query
- `src/modules/base-operations/store/baseOperationsStore.js` — may need checkpoint data loaded

---

## 4. Base Station: No Visible Tab Navigation UI

**Spec requirement:**
> Base Station has two main tabs: Tab 1 Data Entry, Tab 2 Race Overview

**Current state:**
`BaseStationView.jsx` has `activeTab` state and conditionally renders `DataEntry`, `RaceOverview`, or `ReportsPanel` — but **renders no tab buttons whatsoever**. The only way to switch tabs is via hotkeys:
- `HOTKEYS.NEW_ENTRY` → data-entry tab
- `HOTKEYS.REPORTS` → reports tab
- `Escape` (from data-entry) → overview tab

A user unfamiliar with hotkeys will be stuck on the data-entry tab with no visible way to access the overview or reports.

**Impact:** High. This is a navigation regression — the two required tabs from the spec are present in code but invisible to the user.

**What needs building:**
A tab bar at the top of `BaseStationView` with three buttons: Data Entry, Overview, Reports. The hotkeys should continue to work alongside the visible tabs.

**Files to touch:**
- `src/views/BaseStationView.jsx` — add tab navigation bar in the JSX (the logic already exists)

---

## 5. Base Station: Settings and Help Modals Not Implemented

**Spec requirement:**
> Settings accessible from any page. Features: toggle dark/light mode, adjust text size, customize status colors, export/import race configuration.

**Current state:**
`BaseStationView.jsx` has `handleOpenSettings` and `handleOpenHelp` callbacks wired to the `Header` component, but both are stubs:

```javascript
// Line 56-58
const handleOpenSettings = useCallback(() => {
  // TODO: Implement settings modal
  console.log('Open settings');
}, []);

// Line 61-64
const handleOpenHelp = useCallback(() => {
  // TODO: Implement help dialog
  console.log('Open help');
}, []);
```

The `SettingsModal` component exists at `src/components/Settings/SettingsModal.jsx` and is fully implemented. The `HelpDialog` component exists at `src/modules/base-operations/components/HelpDialog.jsx`. Neither is connected.

**Impact:** Medium. Settings (dark mode, text size, colors) are accessible from other parts of the app, but not from within an active base station session. A volunteer who needs to change settings mid-race has no access point.

**What needs building:**
- Import `SettingsModal` into `BaseStationView.jsx` and wire `handleOpenSettings` to show it
- Import `HelpDialog` into `BaseStationView.jsx` and wire `handleOpenHelp` to show it
- Add `showSettings` and `showHelp` boolean state

**Files to touch:**
- `src/views/BaseStationView.jsx` — 10-15 lines of changes

---

## Summary Table

| # | Feature | Spec Source | Impact | Effort |
|---|---------|-------------|--------|--------|
| 1 | Checkpoint keyboard number entry | `[AJ]` annotation | High | Medium |
| 2 | Checkpoint Tab 3: Overview | Tab 3 spec section | Medium | Small |
| 3 | Base station checkpoint grouping view | `[AJ]` annotation | High | Large |
| 4 | Base station tab navigation UI | Tab spec, UX | High | Small |
| 5 | Base station settings/help modals | Settings spec | Medium | Small |

**Items 2, 4, and 5 are small fixes** (wiring up already-built components).
**Items 1 and 3 require new component work.**

---

## Out of Scope (not in original spec)

These are explicitly listed as "Optional Enhancements / Future versions" in `RaceTrackerApp.txt` and should not block the above:

- Advanced analytics (pace predictions, outlier detection)
- Timing chip integration
- API backend
- Export to Excel/PDF
