# Bug Fixes & Feature Improvements Design
**Date:** 2026-03-08  
**Stories:** RS-101, RS-102, RS-103, RS-201, RS-202, RS-203, RS-204, RS-301, RS-302, RS-401, RS-402, RS-501  

---

## Overview

Ten operator-reported issues grouped into five implementation areas. All changes are surgical — no new modules, no cross-module dependencies introduced.

---

## 1. Race Edit Stepper (RS-101)

### Problem
`RaceEditView.jsx` uses a `<Tabs>` component. The only exit is "Save & Return" (navigates away) or "Cancel". There is no way to move between steps without leaving the page.

### Design
Replace the `<Tabs>` with a 4-step linear stepper rendered on the same URL (`/race-maintenance/edit?raceId=X`).

**Steps:**
1. Race Details (`coreForm` — name, date, start time, description)
2. Checkpoints (rename, add, wave assignment — see RS-102)
3. Runners (roster table, range summary, roster import)
4. Review (read-only summary of all settings, "Save & Close" button)

**State:**
- Add `const [currentStep, setCurrentStep] = useState(0)` in `RaceEditView`.
- Each step renders its existing panel; Back/Next buttons replace the per-section Save buttons.
- **Next:** validate required fields for the current step, then call the relevant save action (`updateRace` / `updateCheckpoint`), then `setCurrentStep(s => s + 1)`.
- **Back:** `setCurrentStep(s => s - 1)` — no validation, no data discard.
- Step 4 "Save & Close" navigates to `/race-maintenance/overview?raceId=X`.

**Step indicator:** A simple `StepIndicator` component above the panel showing step names and current index (matching the pattern used in the Setup Wizard).

**No route changes required** — the URL stays the same throughout.

### Files changed
- `src/modules/race-maintenance/views/RaceEditView.jsx` — replace Tabs with stepper state + Back/Next wiring
- Reuse or create `src/modules/race-maintenance/components/StepIndicator.jsx` if no shared one exists

---

## 2. Waves Per Checkpoint (RS-102, RS-201, RS-202)

### Problem
- Checkpoints have no concept of which waves are expected at them.
- The CP overview counts do not break down by wave.
- DNS runners are not excluded from "through CP" counts.

### Schema change
Add `allowedBatches` (nullable JSON array of integers) to the `checkpoints` Dexie table.

```js
// In schema.js — new version
checkpoints: "++id, [raceId+number], raceId, number, name, allowedBatches"
// Migration: backfill null (all waves) for existing checkpoints
tx.table('checkpoints').toCollection().modify(cp => {
  if (cp.allowedBatches === undefined) cp.allowedBatches = null;
});
```

`null` / `undefined` = all waves allowed. `[1, 3]` = only waves 1 and 3.

### Race Edit — Checkpoint step (RS-102)
In RaceEditView Step 2 (Checkpoints), each checkpoint row adds a "Waves" control:
- If `race_batches` for this race has only 1 wave → hide the control (no point configuring).
- If multiple waves exist → show a multi-select or pill toggle: "All waves" (default) or individual wave numbers.
- On change, call `updateCheckpoint(cp.id, { allowedBatches: selectedBatches })` immediately (same pattern as renaming).

### Runtime filtering (RS-102)
In `BaseOperationsRepository.js`, wherever runners are loaded for a checkpoint, filter by `allowedBatches`:

```js
// Pseudo-code — in getMissingRunners / getCheckpointSummary
const cp = await db.checkpoints.where('[raceId+number]').equals([raceId, cpNumber]).first();
const allowed = cp?.allowedBatches ?? null;
const runners = await db.runners.where('raceId').equals(raceId).toArray();
const eligible = allowed ? runners.filter(r => allowed.includes(r.batchNumber)) : runners;
```

Apply the same filter in the checkpoint overview counts and missing runner calculation.

### CP overview by wave (RS-201)
Extend `RaceOverview.jsx` to show a wave-breakdown section below the per-CP counts:
- For each wave: runners through all CPs, pending (not yet passed, not DNS), DNS count.
- Compute from `groupedRunners` already in the store.

### Exclude DNS from "through CP" (RS-202)
In `RaceOverview.jsx`, the per-CP count already uses `expected = total - dnf - dns`. Fix the checkpoint-level counts: only count `checkpoint_runners` records with `status === 'passed'` where the runner's master status is not `non-starter`.

---

## 3. DNS / Non-Starters (RS-103, RS-203, RS-204, RS-302)

### RS-103 — Bulk DNS text input
**Problem:** `BulkDnsModal` is a search/checkbox list — slow for marking many runners.

**Design:** Replace the modal body with a textarea accepting comma/range syntax (`101, 105-110, 120`). On submit:
1. Parse using a shared `parseRunnerInput(text)` utility (extract to `src/shared/utils/runnerInputParser.js` if not already shared with base station).
2. Call `StorageService.bulkUpdateRunners(raceId, numbers, { status: 'non-starter', lastUpdate: now })`.
3. Show summary: "X runners marked DNS. Y not found."

Keep the modal title and open/close behaviour identical to current.

### RS-203 — DNS warning on time entry
**Problem:** No warning when an operator enters a time for a DNS runner.

**Where:** `BibChipInput.jsx` — this is where individual bibs are submitted at base station entry.

**Design:** After the bib number is confirmed but before calling the mark action:
1. Look up the runner in the `runners` store slice (already loaded in memory).
2. If `status === 'non-starter'`, intercept and show a confirmation modal:
   - "Runner [N] is marked DNS. Record their time anyway?"
   - **Record time** → proceeds with normal mark action.
   - **Cancel** → clears the input, no action.

The modal is local state in `BibChipInput` (or its parent `DataEntry`). No service-layer changes needed.

### RS-204 — Edit/remove non-starters in OutList
**Problem:** No way to undo a DNS marking.

**Design:** In `OutList.jsx`, add an action column to the `non-starter` filter view:
- Each non-starter row gets an "Undo DNS" button.
- On click: `StorageService.updateRunner(raceId, runnerNumber, { status: 'not-started', lastUpdate: now })`.
- Row disappears from list after success (re-load `loadOutList()`).

No new service methods needed — `StorageService.updateRunner` already exists.

### RS-302 — Withdraw after start
**Problem:** `WithdrawalDialog` is only accessible via the `HOTKEYS.DROPOUT` keyboard shortcut. The DNS tab shows `OutList` (already-withdrawn runners) with no way to initiate a new withdrawal for active runners.

**Fix:** Add a "Withdraw Runner" button to the DNS tab header in `BaseStationView.jsx` (next to "Bulk Mark DNS"):

```jsx
<button onClick={() => handleWithdrawal('withdrawal')}>
  Withdraw Runner
</button>
```

`WithdrawalDialog` accepts a bib number as text input and works for any runner regardless of status — no logic changes needed. The button simply makes it discoverable.

---

## 4. Status Labels, Missing & Withdrawn Visibility (RS-301, RS-401, RS-402)

### RS-301 — "Not Started" → "Pending" after race start
**Problem:** Runners who haven't reached a checkpoint yet show "Not Started" even when the race has begun.

**Design:** Add a helper to `src/types/index.js`:

```js
export function getRunnerStatusLabel(status, { raceStarted = false } = {}) {
  if (status === RUNNER_STATUSES.NOT_STARTED && raceStarted) return 'Pending';
  // ... other mappings, fall through to default
  return status;
}
```

Determine `raceStarted` in `RaceOverview.jsx` and the base station overview by comparing `currentRace.startTime` to `Date.now()` (already available in `useBaseOperationsStore`).

Apply the helper to the "Not Started" stat card label and the per-row status display in the overview table.

### RS-401 — Missing list with expected-runners button
**Problem:** `MissingNumbersList.jsx` shows missing runner numbers but no context about who was expected.

**Design:** Add a "Show expected at CP [N]" button that opens a modal listing:
- Bib number, first/last name (if populated), wave number, last CP seen and time.
- Runners expected = eligible runners (after `allowedBatches` filter) who have no `checkpoint_runners` record at this CP and are not DNS/withdrawn.

The modal reads from data already available in the store (`missingRunners` + `runners` for names). No new store action needed — join in component.

### RS-402 — Withdrawn at-a-glance modal
**Design:** Add a "Withdrawn" button on the DNS tab header. Opens a read-only modal built from `outList` (already loaded) filtered to `status === 'withdrawn'`:
- Columns: Bib, Name, Last CP, Reason, Time.
- "Close" button only.

No new store or service methods needed.

---

## 5. Runner Names in Base Station List (RS-501)

### Problem
Base station runner lists show bib numbers only. Operators can't identify runners by name.

### Design
Add a "Show Names" toggle (checkbox or icon button) in the `BatchEntryLayout` header.

When enabled:
- Each runner row renders `runner.firstName runner.lastName` (or "—" if not set) below the bib number.
- The `groupedRunners` object passed to `BatchCard` already includes full runner records from the `runners` table (which has `firstName`/`lastName`). No new data fetching needed.

Toggle state is `useState(false)` in `BatchEntryLayout` — not persisted.

---

## Implementation Order

| Priority | Story | File(s) | Complexity |
|----------|--------|---------|------------|
| 1 | RS-302 Withdraw button | `BaseStationView.jsx` | XS — 3 lines |
| 2 | RS-204 Undo DNS in OutList | `OutList.jsx` | S |
| 3 | RS-101 Race edit stepper | `RaceEditView.jsx` | M |
| 4 | RS-103 Bulk DNS text input | `BulkDnsModal.jsx` | S |
| 5 | RS-203 DNS warning on entry | `BibChipInput.jsx` / `DataEntry.jsx` | S |
| 6 | RS-301 Pending status label | `types/index.js`, `RaceOverview.jsx` | S |
| 7 | RS-102 Waves per checkpoint | `schema.js`, `RaceEditView.jsx`, `BaseOperationsRepository.js` | L |
| 8 | RS-201/202 CP overview by wave | `RaceOverview.jsx` | M |
| 9 | RS-401/402 Missing/withdrawn modal | `MissingNumbersList.jsx`, `BaseStationView.jsx` | M |
| 10 | RS-501 Runner names toggle | `BatchEntryLayout.jsx`, `BatchCard.jsx` | S |

---

## Testing Notes

- **RS-101:** Manual test — open race edit, fill step 1, click Next, click Back, confirm values persisted, complete to step 4.
- **RS-102:** Unit test `parseAllowedBatches` filter; E2E — create race with 2 waves, assign CP1 to Wave 1 only, confirm Wave 2 runners absent from CP1 missing list.
- **RS-103:** Unit test `parseRunnerInput` ranges; E2E — bulk mark, confirm DNS count updates.
- **RS-203:** Unit test status-check logic; E2E — enter bib for DNS runner, see warning, confirm proceed/cancel both work.
- **RS-302:** E2E — start a runner, open DNS tab, click Withdraw Runner, enter bib, confirm withdrawal recorded.
- **RS-501:** Snapshot/visual test — toggle names on, confirm name rows render.
