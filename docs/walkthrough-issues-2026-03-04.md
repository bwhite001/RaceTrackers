# RaceTracker Pro — Manual Walkthrough Issues Report

**Date:** 2026-03-04  
**Race used:** Hinterland Ultra 2026 (101 runners, 100–200; 3 checkpoints: Ridgeline, Valley Crossing, Summit)  
**Scope:** Full workflow — Setup Wizard → Race Overview → Checkpoint Operations → Base Station → Reports  

**Summary:** 62 issues found — 21 bugs · 11 UX · 30 style  
**Bugs fixed during walkthrough:** 3 (committed to main)

---

## 🐛 Bugs (21)

### Setup Wizard

| # | Screen | Description |
|---|--------|-------------|
| 7 | Setup Step 3 - Runner Setup | "Back: Race Details" navigation renders as plain text with no button styling — should match the styled Back button in other steps |
| 8 | Setup Step 3 - Runner Setup | Wizard shows 4 steps (Template → Race Details → Runner Setup → Waves) but Step 3 footer jumps straight to "Create Race" — Step 4 Waves is completely skipped. Step counter still says Step 3 of 4 |
| 10 | Setup Step 3 - Runner Setup | "Create Race" button on Step 3 actually navigates to Step 4 (Waves) — button label is wrong, should say "Next: Waves". Misleads user into thinking the race is being created |

### Home

| # | Screen | Description |
|---|--------|-------------|
| 18 | Home - Race card | Race progress shows "0 not started" despite 101 runners all having Not Started status — should show "101 not started" |

### Race Overview

| # | Screen | Description |
|---|--------|-------------|
| 12 | Race Overview | "Configured Runner Ranges" displays all 101 individual runner numbers inline (100, 101, 102 ... 200) — should show compact range "100–200 (101 runners)" |
| 16 | Race Overview - Checkpoint cards | "Go to Checkpoint" buttons redirect to home page (`/`) instead of the checkpoint view — broken navigation |

### Checkpoint Operations

| # | Screen | Description |
|---|--------|-------------|
| 20 | Checkpoint View | **✅ FIXED** — `GROUP_SIZES.map()` crash. `GROUP_SIZES` is an object `{SMALL:10,...}` not an array, causing `TypeError: Zt.map is not a function` and white screen on load. Fixed with `Object.values(GROUP_SIZES).map()` |
| 23 | Checkpoint View - Header | Header shows "Checkpoint 1" badge instead of configured name "Ridgeline" — should show "Ridgeline" or "CP1 – Ridgeline" |
| 24 | Checkpoint View - Runner Grid | **✅ FIXED** — Passed runner tiles had no colour; appeared identical to not-started tiles. Root cause: `applyStatusColorsToDOM()` set CSS variables to hex values but `index.css` uses `rgb(var(...)/alpha)` which needs space-separated RGB channels. Added `hexToChannels()` helper in `settingsDOM.js` |
| 30 | Checkpoint Overview Tab | **CRITICAL** — Overview shows 0 Passed / 101 Not Started even though 4 runners were marked passed. Reads from stale `useRaceStore.runners` instead of live `checkpointStore` data — the two are never synced |

### Base Station

| # | Screen | Description |
|---|--------|-------------|
| 39 | Base Station - Status Bar | "Finished: 0" and "Last update: Never" after recording a batch of 5 runners — stats do not refresh after `submitRadioBatch` |
| 44 | Base Station Overview - CP Columns | Ridgeline column shows "—" for runners 120–125 entered via batch entry at 08:45 — checkpoint-specific time not displaying |
| 56 | Base Station Leaderboard | TIME column shows raw ISO timestamp `"2026-03-04T11:10:00.000Z"` instead of formatted time like "11:10 AM" |
| 58 | Base Station Leaderboard | Only runner 110 appears as "Finished" — the 5 batch-recorded runners (120, 121, 122, 125, 150) all appear in "Still Racing". Batch entry does not promote runners to Finished |
| 59 | Base Station Leaderboard | Stats bar shows "Finished: 0" but Leaderboard shows runner 110 as "Finished" — stats bar is stale/inconsistent |
| 61 | Checkpoint Matrix | Requires imported external data files — does not read from live `checkpoint_runners`/`base_station_runners` already in the DB. Completely unusable in single-device setup |

### Reports

| # | Screen | Description |
|---|--------|-------------|
| 51 | Reports - Missing Numbers | Report shows all 101 runners as missing despite runners 100/101/105/110 being marked as passed — reading from wrong data source |
| 52 | Reports - Missing Numbers | Report header shows "Checkpoint: 1" (number, not name) — should say "Ridgeline" |
| 53 | Reports - Missing Numbers | Downloads as `.txt` despite "CSV" being selected as export format — format selection has no effect for this report |
| 54 | Reports - Report Options | Checkpoint dropdown lists "Checkpoint 1" through "Checkpoint 5" but race only has 3 checkpoints — Checkpoints 4 and 5 should not appear |
| 55 | Reports - Race Summary | All 101 runners shown as "not-started" — report reads from base `runners` table, not the live `checkpoint_runners`/`base_station_runners` data |

---

## 🔧 UX Issues (11)

### Setup / Race

| # | Screen | Description |
|---|--------|-------------|
| 22 | Checkpoint View - Runner Groups | All runner groups start collapsed — user must expand each group manually. Consider auto-expanding first group or all when range is small |

### Checkpoint Operations

| # | Screen | Description |
|---|--------|-------------|
| 26 | Callout Sheet | Grid-clicked runners (100, 101, 105) do not appear in Callout Sheet — only Quick Entry runner (110) does. If both methods mark runners as passed, both should generate callout entries |
| 27 | Callout Sheet | "Pending Callouts (1)" heading is not visible on load — page jumps straight to the first time slot with no section header in viewport |
| 28 | Callout Sheet - Empty State | "No pending callouts" empty-state icon appears above the "Called Segments" section — awkward when called segments exist. Should be omitted or made inline when there is content below |
| 32 | Checkpoint Overview Tab | Table rows ~70–80px tall for minimal content — 101 runners requires excessive scrolling. Needs compact row height or pagination/virtualisation |

### Base Station

| # | Screen | Description |
|---|--------|-------------|
| 38 | Base Station - Status Bar | Thin strip at bottom of viewport — on mobile would be partially hidden by OS navigation bar |
| 40 | Base Station - Session History | Shows "entered 11:19 AM" (wall-clock) next to "08:45" (race common time) with no labels — confusing. Should label: "Common: 08:45 · Recorded: 11:19 AM" |
| 42 | Base Station Overview | Checkpoint columns show "—" for runners 100/101/105/110 already marked as Passed at checkpoints — time data not propagating from `checkpoint_runners` |
| 43 | Base Station Overview | Table rows ~50px tall, low-density — 101 runners = ~5,000px scroll. Should use compact row height |
| 60 | Checkpoint Matrix | Empty state says "Use the Import Checkpoint Results panel above" — but there is NO such panel on this tab. Import panel is on the Overview tab. Wrong navigation guidance |
| 50 | Reports - Report Options | Large empty whitespace gap between "Generate Report" button and "About Reports" card — layout feels unfinished |

---

## 🎨 Style Issues (30)

### Setup Wizard

| # | Screen | Description |
|---|--------|-------------|
| 4 | Setup Wizard Step 1 | Template cards use 2-column grid — 3 templates gives an asymmetric layout (2 left, 1 right). Better as 3-column grid or full-width list |
| 5 | Setup Wizard Step 1 | Step indicator numbers 2–4 are very faint/small compared to highlighted step 1 — hard to read at a glance |
| 6 | Setup Step 2 - Race Details | Checkpoint name fields use 2-column grid — odd number of checkpoints leaves last field alone in left column, asymmetric |
| 9 | Setup Step 3 - Runner Setup | Runner range pre-populated with "100–200 (101 runners)" when starting from scratch — unexpected default, better to start empty |
| 11 | Setup Step 3 - Runner Setup | "Back: Race Details" renders as unstyled plain text while "Create Race" is a styled navy button — inconsistent nav button treatment |

### Race Management

| # | Screen | Description |
|---|--------|-------------|
| 2 | Race Management | No top nav bar — home has navy header with logo/help/settings but Race Management drops straight to page title |
| 3 | Race Management | "Back to Home" button floats top-right — inconsistent with other navigation patterns across the app |

### Race Overview

| # | Screen | Description |
|---|--------|-------------|
| 13 | Race Overview | Date shows ISO format "2026-03-04 • 06:00" — should be locale format "04/03/2026 • 6:00 AM" for Australian context |
| 14 | Race Overview | "Exit to Homepage" button is lightly styled (gray outline) and positioned inline next to a heading — easy to miss |
| 15 | Race Overview | "Race Created Successfully!" success banner has no dismiss/close button — persists indefinitely |

### Home

| # | Screen | Description |
|---|--------|-------------|
| 17 | Home - Race card | Inconsistent date formatting: Race Overview shows ISO "2026-03-04", Home card shows "Wed, Mar 4, 2026" |
| 19 | Home - Race card | Progress bar shows 0% and counters show "0 completed / 0 active / 0 not started" — none sum to 101, inconsistent with "Total Runners: 101" |

### Checkpoint Operations

| # | Screen | Description |
|---|--------|-------------|
| 21 | Checkpoint View - Runner Groups | Last group shows "Runners 200–200" with 0/1 — single-runner group looks odd. Consider suppressing or merging with previous group |
| 25 | Callout Sheet | "Mark Called" action renders as plain text with no button styling — every other action in the app uses a styled button |
| 29 | Callout Sheet | "5-minute segments" subtitle is right-aligned against "Callout Sheet" heading — should be below as a subtitle or styled as a badge |
| 31 | Checkpoint Overview Tab | "NS + DNF" counter is red even when 0 — red implies a problem; should be neutral/gray when 0 |
| 33 | Checkpoint Overview Tab | "Actions" column header present but no action buttons rendered for any row — add actions (mark DNF, edit time) or remove the column |
| 34 | Checkpoint Overview Tab | Time placeholder "--:--:--" for not-started runners is verbose — a simple "—" or empty cell would be cleaner |

### Base Station

| # | Screen | Description |
|---|--------|-------------|
| 35 | Base Station - Header | "Base Station" badge is green while Checkpoint badge was navy — inconsistent module badge colours |
| 36 | Base Station - Data Entry | "SESSION HISTORY" heading in ALL CAPS — app uses title case everywhere else |
| 37 | Base Station - Status Bar | "DNF:" and "DNS:" labels coloured orange/red even when count is 0 — should only activate colour when value > 0 |
| 41 | Base Station Overview | Table column headers ALL CAPS ("BIB #", "OVERALL", "RIDGELINE") — should be title case |
| 57 | Base Station Leaderboard | Table column headers ALL CAPS ("POSITION", "BIB #", "TIME", "STATUS") — inconsistent with rest of app |
| 62 | Checkpoint Matrix | Empty state is plain small text with no icon, no hierarchy, no call-to-action — looks unfinished |

### Reports

| # | Screen | Description |
|---|--------|-------------|
| 45 | Reports Tab | Non-selected report cards have grayed-out icons and muted text — look disabled rather than selectable. Needs clearer selection state |
| 46 | Reports Tab | "Split Times" report card alone in left column (7 cards in 2-col grid) — asymmetric; same issue as wizard templates and checkpoint name fields |
| 47 | Reports - Report Options | "Generate Report" has no button styling — plain icon + text, no background, border, or hover state. Should be a primary button |
| 48 | Reports - Report Options | Two checkboxes have different styles: "Include notes" uses large custom navy checkbox; "Show preview" uses native browser checkbox — inconsistent |
| 49 | Reports - Report Options | "About Reports" bullet text styled in teal/link colour but items are not clickable — misleading, should be plain body text |

---

## Recurring Patterns to Address

1. **ALL CAPS table headers** — appears on Overview, Leaderboard, Base Station Overview. Should be title case throughout.
2. **Asymmetric 2-column grids** — wizard templates (3 items), checkpoint name fields (3 items), report cards (7 items). Use auto-fit grids or single-column for odd counts.
3. **Missing button styling** — "Mark Called", "Generate Report", "Back: Race Details" all render as plain text/links.
4. **Status colours on zero counts** — NS+DNF, DNF:, DNS: all show alert colours even at 0. Should be neutral until value > 0.
5. **Data sync — reports and overview tabs read stale data** — Checkpoint Overview, Reports (all types), and Home progress counters all read from `useRaceStore.runners` which is not updated when runners are marked passed via checkpoint or base station operations. This is the most impactful systemic bug.
6. **Checkpoint names not used** — "Checkpoint 1" appears in the checkpoint header, report options dropdown, and report file headers. Configured names (Ridgeline, Valley Crossing, Summit) should propagate everywhere.
