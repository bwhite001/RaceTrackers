# RaceTracker Pro — Comprehensive TODO

_Based on RaceTrackerApp.txt requirements vs. current codebase state._

---

## Legend
- ✅ Complete
- ⚠️ Partial / Needs work
- ❌ Not implemented

---

## 1. Race Setup

| Feature | Status | Notes |
|---------|--------|-------|
| Race creation (name, date, start time) | ✅ | `RaceDetailsStep.jsx` |
| Checkpoint count + individual naming | ✅ | `RaceDetailsStep.jsx` — 1–10 checkpoints |
| Flexible runner ranges (min/max, overlaps, duplicates) | ✅ | `RunnerRangesStep.jsx` |
| Local data storage (IndexedDB/Dexie) | ✅ | Schema v6 |
| Import race config from JSON file | ✅ | `ImportService.js` with conflict resolution |
| Export race config to JSON file | ✅ | `ExportService.js` with checksum |
| Import via QR code scan | ❌ | No QR scan/camera input implemented |
| Export config as QR code | ❌ | `qrcode.react` is a dependency but no QR generation UI exists in setup/sharing flow |
| Share config via email | ❌ | Not implemented |
| Race management (list, edit, duplicate, delete) | ✅ | `RaceManagementView.jsx` |

---

## 2. Role Selection / Home

| Feature | Status | Notes |
|---------|--------|-------|
| Homepage with role selection | ✅ | `Homepage.jsx` → `LandingPage.jsx` |
| Navigate to Checkpoint mode | ✅ | Route `/checkpoint/:checkpointId` |
| Navigate to Base Station mode | ✅ | Route `/base-station/operations` |
| Select which checkpoint to operate | ⚠️ | Checkpoint selected via `RaceOverview.jsx` cards — needs verification that all configured checkpoints appear and are selectable |

---

## 3. Checkpoint Mode

### Tab 1 — Runner Mark-Off

| Feature | Status | Notes |
|---------|--------|-------|
| Grid view of all runner numbers | ✅ | `RunnerGrid.jsx` via `SharedRunnerGrid` |
| List view of all runner numbers | ✅ | Toggle in settings |
| Search/filter by runner number | ✅ | |
| Tap to mark runner as "passed" with auto-timestamp | ✅ | `markRunner()` in `checkpointStore.js` |
| Unmark / undo mark-off | ✅ | |
| Grouping by 10s / 25s / 50s / 100s | ✅ | Settings — group size selector |
| Pagination for large runner ranges | ⚠️ | Group sizes exist but full pagination with quick-jump not confirmed |
| **[AJ] Quick keyboard number entry as runners pass** | ❌ | DataEntry has batch input for base station but no dedicated rapid-entry input on the Checkpoint mark-off tab (type a number, hit Enter → instantly marks) |

### Tab 2 — Callout Sheet

| Feature | Status | Notes |
|---------|--------|-------|
| Group runners into 5-minute time segments | ✅ | `CalloutSheet.jsx` — configurable duration |
| Display segments from earliest to latest | ✅ | |
| Mark segment as "called in" | ✅ | |
| Visual indicator for called-in segments | ✅ | |
| Runner number range formatting (e.g. "1–5, 7, 9–10") | ✅ | |
| Elapsed race time display | ✅ | |

### Tab 3 — Overview

| Feature | Status | Notes |
|---------|--------|-------|
| All runners with colour-coded status | ✅ | `RunnerGrid.jsx` / `RaceOverview.jsx` |
| Statuses: Not Started, Passed, Non-Starter, DNF | ✅ | `RUNNER_STATUSES` constants |
| Manually mark runner as Non-Starter | ✅ | |
| Manually mark runner as DNF | ✅ | |
| Counts: runners left, passed, DNF, DNS | ✅ | Stats summary panel |
| Show runner's recorded pass time | ✅ | |
| Show whether runner's time segment was called in | ⚠️ | Checkpoint overview shows time but callout-segment "called in" status may not surface here |

---

## 4. Base Station Mode

### Tab 1 — Data Entry

| Feature | Status | Notes |
|---------|--------|-------|
| Set a common time for a group | ✅ | `DataEntry.jsx` — time input + "Now" button |
| Enter runner numbers individually | ✅ | |
| Enter runner numbers in bulk (ranges like "1, 2, 3–5") | ✅ | |
| Real-time number parsing and preview | ✅ | |
| Batch assign timestamp to group | ✅ | |
| Keyboard shortcuts (hotkeys) for data entry | ⚠️ | Framework in `BaseStationView.jsx` (Alt+A, Alt+B etc.) but not all hotkeys wired up |
| **[AJ] Rapid number key-in as radio calls come in** | ⚠️ | Batch input exists but lacks a dedicated "radio call" flow: set time → keep focus in number field → Enter submits and clears for next group without mouse |

### Tab 2 — Race Overview

| Feature | Status | Notes |
|---------|--------|-------|
| All runners with colour-coded status | ✅ | `RaceOverview.jsx` |
| Sort by runner number, status, time | ✅ | |
| Filter by status | ✅ | |
| Search by runner number | ✅ | |
| Manually mark Non-Starter / DNF / DNS | ✅ | `WithdrawalDialog.jsx` |
| Progress stats (finished, active, DNF, DNS counts) | ✅ | Stats cards |
| **[AJ] Per-checkpoint grouped view** | ❌ | No view showing "at checkpoint X: passed / not yet passed" — base station can only see global status, not a breakdown by which checkpoint each runner last passed through |

### Reports (Tab 3)

| Feature | Status | Notes |
|---------|--------|-------|
| Reports panel UI | ✅ | `ReportsPanel.jsx` |
| Report builder (template + column selection) | ✅ | `ReportBuilder.jsx` |
| Missing Numbers report | ⚠️ | UI button exists but actual generation logic needs verification |
| Out List (runners still on course) | ⚠️ | UI button exists but actual generation logic needs verification |
| Checkpoint Log report | ⚠️ | UI button exists but actual generation logic needs verification |
| Export report as CSV | ⚠️ | Format selector in ReportBuilder — download logic needs verification |
| Export report as JSON | ⚠️ | As above |

---

## 5. Settings

| Feature | Status | Notes |
|---------|--------|-------|
| Dark / light mode toggle | ✅ | `SettingsModal.jsx` |
| High contrast mode | ✅ | |
| Reduced motion toggle | ✅ | |
| Adjustable font size | ✅ | Percentage-based slider |
| Customise status colours | ✅ | Per-status colour pickers |
| Touch optimisation toggle | ✅ | |
| Compact mode toggle | ✅ | |
| Grid / list view preference | ✅ | |
| Group size preference | ✅ | |
| Clear all data (with "CLEAR" confirmation) | ✅ | Danger zone |
| Reset settings to defaults | ✅ | |
| Export race config from Settings | ⚠️ | Export exists in race management view — not wired into Settings modal |
| Import race config from Settings | ⚠️ | As above |
| Export / share via QR code from Settings | ❌ | |
| Export / share via email from Settings | ❌ | |

---

## 6. Design & Accessibility

| Feature | Status | Notes |
|---------|--------|-------|
| Offline-first (all features work without internet) | ✅ | PWA + IndexedDB |
| Service worker / PWA install | ✅ | Vite PWA plugin + Workbox |
| Responsive layout (desktop, tablet, mobile) | ✅ | Tailwind responsive classes |
| Screen reader support | ⚠️ | Semantic HTML used but full ARIA audit not confirmed |
| Keyboard navigation for all operations | ⚠️ | Partial — hotkeys in base station, but checkpoint and setup not fully keyboard-navigable |
| Touch targets ≥ 44×44px | ⚠️ | Design system buttons sized correctly but grid squares for large runner ranges may be small |
| Colour contrast ≥ 4.5:1 | ⚠️ | High contrast mode exists but default theme not fully audited |
| Network status indicator | ✅ | `NetworkStatusIndicator.jsx` |

---

## 7. [AJ] Specific Requests (from spec annotations)

| Request | Status | Notes |
|---------|--------|-------|
| Quick type-in of runner numbers at checkpoints | ❌ | Needs a dedicated rapid-entry input on Checkpoint Tab 1: focus stays in field, Enter marks and clears |
| Quick type-in of runner numbers at base station | ⚠️ | Bulk input exists but UX not optimised for continuous radio-call entry |
| Per-checkpoint view in base station (global + per-checkpoint who has/hasn't passed) | ❌ | Major missing feature — base station has no drill-down by checkpoint |

---

## 8. Priority Order for Missing Work

### P0 — Core gaps blocking intended workflow
1. **[AJ] Rapid number entry at Checkpoint Tab 1** — type number → Enter → marked, focus stays. This is the primary volunteer workflow.
2. **[AJ] Per-checkpoint report view in Base Station** — organiser needs to see "CP2: 45 passed, 12 not yet through" at a glance.
3. **QR code export UI** — dependency (`qrcode.react`) is installed but no generation UI exists in the sharing flow.

### P1 — Important but workarounds exist
4. **Report generation logic** — verify/complete Missing Numbers, Out List, Checkpoint Log downloads.
5. **Export/Import accessible from Settings modal** — currently only in Race Management view.
6. **Callout-segment "called in" status on Checkpoint Overview tab** — runners should show if their segment has been called in.
7. **Base station rapid-entry UX** — optimise DataEntry for continuous keyboard-only use (time → numbers → Enter → next group).

### P2 — Polish and completeness
8. **QR code import (scan)** — scan a QR code to import race config on a new device.
9. **Email sharing** — generate a mailto link with JSON payload or share via Web Share API.
10. **Full keyboard navigation audit** — checkpoint mark-off, setup wizard, all dialogs.
11. **ARIA / screen reader audit** — add missing roles, labels, live regions for status changes.
12. **Touch target size audit** — especially runner grid squares at high runner counts.
13. **Colour contrast audit** — default theme against WCAG 2.1 AA.
14. **Checkpoint pagination** — quick-jump to number group (e.g. "200–250") for large races.

### P3 — Optional enhancements (from spec)
15. **Advanced analytics** — pace predictions, outlier detection (Epic 7 scope).
16. **RFID / timing chip integration** — future.
17. **CSV/Excel runner import** — bulk upload from spreadsheet (Epic 6 scope).
