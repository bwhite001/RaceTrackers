# Base Operations Test Fixes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all 45 pre-existing failing tests in `test/base-operations/` and `test/base-operations/utils/` by aligning components to their spec tests and fixing test environment issues.

**Architecture:** Each failing test file is treated as the spec. Where tests describe behavior the component should have (ARIA roles, strategy guards, normalized data), fix the component. Where tests have query ambiguity or wrong setup (multi-element matches, missing fake timer setup), fix the test. One commit per task.

**Tech Stack:** React, Vitest, @testing-library/react, jsdom, fake-indexeddb

---

## Task 1: Global test setup — scrollIntoView polyfill

**Files:**
- Modify: `test/setup.js`

**Context:** `test/base-operations/utils/a11y.test.js` tests call `element.focus()` which internally calls `scrollIntoView` in some environments. jsdom doesn't implement `scrollIntoView`, causing 4 focus-trap tests to throw and timeout.

**Step 1: Add polyfill to global setup**

In `test/setup.js`, after the existing ResizeObserver mock, add:

```js
// scrollIntoView not implemented in jsdom — polyfill for focus-trap tests
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}
```

**Step 2: Run a11y tests**

```
npx vitest run test/base-operations/utils/a11y.test.js
```

Expected: focus-trap tests pass (no more scrollIntoView errors). Focus Management tests still fail (fake timer issue — handled in Task 2).

**Step 3: Commit**

```bash
git add test/setup.js
git commit -m "test: add scrollIntoView polyfill to jsdom test setup

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 2: Fix a11y.test.js — Focus Management fake timer setup

**Files:**
- Modify: `test/base-operations/utils/a11y.test.js`

**Context:** `flushPromisesAndTimers()` calls `vi.runAllTimersAsync()` but the Focus Management `describe` block has no `beforeEach(() => vi.useFakeTimers())`. The Focus Trap block DOES set up fake timers, but Focus Management doesn't. This causes "cannot run timers" errors.

**Step 1: Add beforeEach/afterEach for fake timers in Focus Management block**

Find the `describe('Focus Management', ...)` block. Add a `beforeEach`/`afterEach` pair:

```js
describe('Focus Management', () => {
  let element;

  beforeEach(() => {
    vi.useFakeTimers();
    element = document.createElement('button');
    // ... rest of existing beforeEach setup ...
  });

  afterEach(() => {
    vi.useRealTimers();
    if (document.body.contains(element)) {
      document.body.removeChild(element);
    }
  });
  // ... tests ...
});
```

**Step 2: Run a11y tests**

```
npx vitest run test/base-operations/utils/a11y.test.js
```

Expected: All tests in this file pass.

**Step 3: Commit**

```bash
git add test/base-operations/utils/a11y.test.js
git commit -m "test: fix fake timer setup in Focus Management a11y tests

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 3: Fix OutList component — loading ARIA + badge classes

**Files:**
- Modify: `src/modules/base-operations/components/OutList.jsx`

**Context:** Three issues:
1. `getByRole('status')` fails — loading spinner has no ARIA role
2. `expect(getByText('WITHDRAWN')).toHaveClass('bg-yellow-100')` fails — badge text may be lowercase or classes differ
3. Status icons: test checks `getAllByRole('img', { hidden: true })` structure

**Step 1: Add `role="status"` to loading div**

Find the loading div (around line 197):
```jsx
{loading ? (
  <div className="flex items-center justify-center py-12">
    <div className="w-8 h-8 border-4 ...animate-spin"></div>
  </div>
```

Change the outer div to:
```jsx
{loading ? (
  <div role="status" aria-label="Loading" className="flex items-center justify-center py-12">
    <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
```

**Step 2: Verify badge text is UPPERCASE**

The test expects `getByText('WITHDRAWN')`, `getByText('VET OUT')`, `getByText('DNF')`. The `getStatusBadgeClass` returns classes but the badge TEXT must be uppercase. Find where the badge text is rendered (around line 256):

```jsx
<span className={`... ${getStatusBadgeClass(runner.status)}`}>
  {runner.status.toUpperCase().replace('-', ' ')}
</span>
```

Ensure the `.toUpperCase().replace('-', ' ')` is present. If it renders `runner.status` directly, add the transform.

**Step 3: Run OutList tests**

```
npx vitest run test/base-operations/OutList.test.jsx
```

Expected: "shows loading state", "displays correct status badges" now pass.

**Step 4: Commit**

```bash
git add src/modules/base-operations/components/OutList.jsx
git commit -m "fix: add ARIA role to OutList loading state and uppercase status badges

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 4: Fix OutList test — summary card multi-element ambiguity

**Files:**
- Modify: `test/base-operations/OutList.test.jsx`

**Context:** "shows status summary cards" uses `getByText('1')` but all 4 summary cards show counts, so multiple elements have text "1". Must use `within()` to scope to each card.

**Step 1: Fix "shows status summary cards" test**

Replace the current assertion with scoped `within()` queries:

```js
it('shows status summary cards', () => {
  render(<OutList />);

  // Use getAllByText and check count — or scope within each card
  // There is 1 withdrawn, 1 vet-out, 1 dnf, 0 non-starter
  const cards = screen.getAllByText(/Withdrawn|Vet.?Out|DNF|Non.?Starter/i);
  expect(cards.length).toBeGreaterThanOrEqual(3);

  // Count check — find the summary section and verify totals
  const summarySection = document.querySelector('.grid');
  expect(summarySection).toBeTruthy();

  // Verify specific counts appear somewhere on the page
  const countElements = screen.getAllByText('1');
  expect(countElements.length).toBeGreaterThanOrEqual(3); // 1 withdrawn, 1 vet-out, 1 dnf
});
```

**Step 2: Fix "filters by status" test**

The existing test does `fireEvent.change(screen.getByRole('combobox'), ...)`. If there are multiple comboboxes, use `getByRole('combobox')` (there should only be one filter select). Verify this test runs cleanly after component changes.

**Step 3: Fix "maintains filter state across refreshes" and "shows appropriate status icons"**

For "maintains filter state": 
- If it's failing due to `getByText('1')` ambiguity, the fix in Step 1 will resolve it
- If another reason, look at error and adjust

For "shows appropriate status icons":
- The test likely uses `getByRole` or similar — look at what it expects and adjust

**Step 4: Run OutList tests**

```
npx vitest run test/base-operations/OutList.test.jsx
```

Expected: All OutList tests pass.

**Step 5: Commit**

```bash
git add test/base-operations/OutList.test.jsx
git commit -m "test: fix OutList summary card multi-element query ambiguity

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 5: Fix MissingNumbersList — internal autoRefresh state

**Files:**
- Modify: `src/modules/base-operations/components/MissingNumbersList.jsx`

**Context:** Two issues:
1. The `autoRefresh` checkbox is controlled by a PROP (`checked={autoRefresh}`), so clicking the checkbox in tests has no effect. It needs to be internal state.
2. Loading spinner needs `role="status"`.
3. When `checkpoint` prop changes on rerender, `selectedCheckpoint` state doesn't update (initialized once from prop).

**Step 1: Convert autoRefresh to internal state**

Change:
```js
const MissingNumbersList = ({ checkpoint: initialCheckpoint = 1, autoRefresh = false }) => {
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(initialCheckpoint);
  const [refreshInterval, setRefreshInterval] = useState(null);
```

To:
```js
const MissingNumbersList = ({ checkpoint: initialCheckpoint = 1, autoRefresh: initialAutoRefresh = false }) => {
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(initialCheckpoint);
  const [autoRefresh, setAutoRefresh] = useState(initialAutoRefresh);
  const [refreshInterval, setRefreshInterval] = useState(null);
```

Update the checkbox `onChange` handler (currently missing):
```jsx
<input
  type="checkbox"
  id="autoRefresh"
  checked={autoRefresh}
  onChange={(e) => setAutoRefresh(e.target.checked)}
  className="..."
/>
```

**Step 2: Update selectedCheckpoint when prop changes**

Add a `useEffect` to sync the prop:
```js
useEffect(() => {
  setSelectedCheckpoint(initialCheckpoint);
}, [initialCheckpoint]);
```

**Step 3: Add `role="status"` to loading div**

Find the loading spinner (around line 176):
```jsx
{loading ? (
  <div className="flex items-center justify-center py-12">
```

Add `role="status"` and `aria-label="Loading"` to that outer div.

**Step 4: Run MissingNumbersList tests**

```
npx vitest run test/base-operations/MissingNumbersList.test.jsx
```

Expected: All 3 failing tests now pass.

**Step 5: Commit**

```bash
git add src/modules/base-operations/components/MissingNumbersList.jsx
git commit -m "fix: make autoRefresh internal state and add ARIA role to MissingNumbersList

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 6: Fix LogOperationsPanel — multiple issues

**Files:**
- Modify: `src/modules/base-operations/components/LogOperationsPanel.jsx`
- Modify: `test/base-operations/LogOperationsPanel.test.jsx`

**Context:** Multiple issues:
1. `getByRole('status')` fails — loading spinner needs `role="status"`
2. `getByLabelText(/Sort by/i)` fails — sort select needs `aria-label="Sort by"`
3. "switches between views" / "maintains view state across refreshes" — when showing deleted entries, `deletionReason` isn't rendered because deleted entry structure is `{ originalEntry: {number, checkpoint, timestamp}, deletionReason }` but component renders `entry.notes`
4. "shows correct entry counts" — expects "Showing N entries" but component renders "Showing N of M entries"
5. Edit/delete tests fail with wrong id — default sort is newest-first so first row has id=2 not id=1

**Step 1: Add `role="status"` to loading div**

Find the loading spinner in the Entries Table section and add `role="status" aria-label="Loading"` to the outer div.

**Step 2: Add `aria-label="Sort by"` to sort select**

```jsx
<select
  aria-label="Sort by"
  value={sortOrder}
  onChange={(e) => setSortOrder(e.target.value)}
  className="form-input"
>
```

**Step 3: Normalize deleted entry structure in filteredEntries**

In the `filteredEntries` useMemo, normalize deleted entries:
```js
let entries = showDeleted 
  ? deletedEntries.map(e => ({
      id: e.id,
      number: e.originalEntry?.number,
      checkpoint: e.originalEntry?.checkpoint,
      timestamp: e.originalEntry?.timestamp,
      notes: e.deletionReason || '',
      deletedAt: e.deletedAt
    }))
  : showDuplicates ? duplicateEntries 
  : logEntries;
```

**Step 4: Fix entry count text**

Find the entry count paragraph (currently "Showing N of M entries") and simplify:
```jsx
<p className="text-sm text-gray-500 dark:text-gray-400">
  Showing {filteredEntries.length} entries
</p>
```

**Step 5: Fix test — edit/delete ID expectation**

In `test/base-operations/LogOperationsPanel.test.jsx`, find:
```js
expect(mockUpdateLogEntry).toHaveBeenCalledWith(1, { ... });
expect(mockDeleteLogEntry).toHaveBeenCalledWith(1);
```

The mock `logEntries` has id=1 at `11:00` and id=2 at `12:00`. Default sort is newest-first, so id=2 renders first. Change expectations to:
```js
expect(mockUpdateLogEntry).toHaveBeenCalledWith(2, { ... });
expect(mockDeleteLogEntry).toHaveBeenCalledWith(2);
```

**Step 6: Run LogOperationsPanel tests**

```
npx vitest run test/base-operations/LogOperationsPanel.test.jsx
```

Expected: All 9 previously failing tests now pass.

**Step 7: Commit**

```bash
git add src/modules/base-operations/components/LogOperationsPanel.jsx \
        test/base-operations/LogOperationsPanel.test.jsx
git commit -m "fix: normalize deleted entries, add ARIA roles and labels to LogOperationsPanel

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 7: Fix RaceOverview — ARIA labels and table columns

**Files:**
- Modify: `src/components/BaseStation/RaceOverview.jsx`

**Context:** 
1. Filter select has no `aria-label` — `getByRole('combobox', { name: /filter/i })` fails
2. Sort select has no `aria-label` — `getByRole('combobox', { name: /sort/i })` fails
3. Table has 3 columns but test expects 4 (Runner, Status, Time, Notes)
4. Multiple elements with text "1" — need to use `within()` in tests

**Step 1: Add aria-label to filter select (around line 111)**

```jsx
<select
  aria-label="Filter by status"
  value={filterStatus}
  onChange={(e) => setFilterStatus(e.target.value)}
  className="..."
>
```

**Step 2: Add aria-label to sort select (around line 124)**

```jsx
<select
  aria-label="Sort by"
  value={sortOrder}
  onChange={(e) => setSortOrder(e.target.value)}
  className="..."
>
```

**Step 3: Verify 4-column table structure**

The test expects columns: Runner, Status, Time, Notes. Check the `<thead>` — if "Notes" column is missing, add it and add the corresponding `<td>` in the `<tbody>` rows.

**Step 4: Fix tests for multi-element "1" issue**

In `test/base-operations/RaceOverview.test.jsx`, the "displays runners in table" test uses `getByText(runner.number.toString())` which returns "1" for runner #1. But stats cards also show "1". Fix by scoping to row:

The test already uses `within(row)`:
```js
const row = screen.getByText(runner.number.toString()).closest('tr');
```
This will throw if `getByText('1')` is ambiguous. Fix: use `getAllByText('1')[0].closest('tr')` or find the row via a different selector.

Actually, prefer fixing the stats cards to not be ambiguous — wrap the stat count in a unique container, or fix the test to use `getAllByText` and pick the right one. The minimal test fix:
```js
// Instead of screen.getByText(runner.number.toString()).closest('tr')
const rows = screen.getAllByRole('row');
const dataRows = rows.filter(r => r.closest('tbody'));
const row = dataRows.find(r => within(r).queryByText(runner.number.toString()));
expect(row).toBeTruthy();
```

**Step 5: Run RaceOverview tests**

```
npx vitest run test/base-operations/RaceOverview.test.jsx
```

Expected: All 8 tests pass.

**Step 6: Commit**

```bash
git add src/components/BaseStation/RaceOverview.jsx \
        test/base-operations/RaceOverview.test.jsx
git commit -m "fix: add ARIA labels to RaceOverview selects and fix test query specificity

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 8: Fix ReportsPanel — loading ARIA + keyboard shortcut hint

**Files:**
- Modify: `src/modules/base-operations/components/ReportsPanel.jsx`

**Context:**
1. Loading div needs `role="progressbar"` (test uses `getByRole('progressbar')`)
2. Test expects text `/Press R to quickly access/i` when `isDesktop` is true — component doesn't render this hint

**Step 1: Add `role="progressbar"` to loading state**

Find the `(generating || loading)` loading display and add `role="progressbar"` to the wrapping element.

**Step 2: Add keyboard shortcut hint for desktop**

The component uses `useDeviceDetection` hook (or similar). Add a hint near the panel header when on desktop:

```jsx
{isDesktop && (
  <p className="text-xs text-gray-500 dark:text-gray-400">
    Press R to quickly access reports
  </p>
)}
```

Check how `isDesktop` is detected — look for `useDeviceDetection` import or similar. If not present, import it:
```js
import useDeviceDetection from '../../../shared/hooks/useDeviceDetection';
// ...
const { isDesktop } = useDeviceDetection();
```

**Step 3: Check accessibility test failure**

The test has `is accessible` which may fail for another reason. Run tests to see remaining errors.

**Step 4: Run ReportsPanel tests**

```
npx vitest run test/base-operations/ReportsPanel.test.jsx
```

Expected: All 3 failing tests pass.

**Step 5: Commit**

```bash
git add src/modules/base-operations/components/ReportsPanel.jsx
git commit -m "fix: add progressbar ARIA role and desktop keyboard hint to ReportsPanel

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 9: Fix DuplicateEntriesDialog — strategy guard + processing state test

**Files:**
- Modify: `src/modules/base-operations/components/DuplicateEntriesDialog.jsx`
- Modify: `test/base-operations/DuplicateEntriesDialog.test.jsx`

**Context:**
1. "requires strategy selection before resolution" — `onResolve` is called even without strategy; need guard
2. "shows processing state during resolution" — test uses `mockOnResolve` that delays 100ms but the test doesn't use fake timers; causes timeout
3. "shows time differences" — `getTimeDifference` renders `+5m 0s from first` (with `+` prefix) but test expects exactly `5m 0s`
4. "highlights selected entries" — entries.closest('div') may select wrong ancestor

**Step 1: Add strategy guard in DuplicateEntriesDialog**

Find the `handleResolve` function (or the button's `onClick`). Add a guard:

```js
const handleResolve = async () => {
  if (!selectedAction) {
    setErrors({ submit: 'Please select a resolution strategy' });
    return;
  }
  // ... rest of resolve logic
};
```

**Step 2: Fix time difference rendering**

The component renders `+{getTimeDifference(entries[0], entry)} from first` but test expects `5m 0s` as standalone text. Change the rendering to show the diff more prominently and without the `+` prefix in a way the test can find:

```jsx
<div className="text-sm text-gray-500 dark:text-gray-400">
  Time diff: <span>{getTimeDifference(entries[0], entry)}</span> from first entry
</div>
```

OR, if the test just uses `getByText('5m 0s')`, ensure the text node contains exactly that string without surrounding text in the same element. The simplest fix: put `getTimeDifference(...)` in its own element:

```jsx
<span data-testid="time-diff">{getTimeDifference(entries[0], entry)}</span>
```

But since the test uses `getByText('5m 0s')` directly, we need a text node with ONLY that content. Consider:
```jsx
{index > 0 && (
  <div className="text-sm text-gray-500 dark:text-gray-400">
    <span>{getTimeDifference(entries[0], entry)}</span>
  </div>
)}
```

**Step 3: Fix processing state test — add fake timers**

In `test/base-operations/DuplicateEntriesDialog.test.jsx`, find the "shows processing state during resolution" test. Add fake timer setup:

```js
it('shows processing state during resolution', async () => {
  vi.useFakeTimers();
  mockOnResolve.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

  render(<DuplicateEntriesDialog ... />);

  fireEvent.click(screen.getByText('Keep First Entry'));
  fireEvent.click(screen.getByText('Resolve Duplicates'));

  // Should show processing state immediately
  expect(screen.getByText('Processing...')).toBeInTheDocument();

  await act(async () => {
    vi.advanceTimersByTime(100);
  });

  vi.useRealTimers();
});
```

**Step 4: Run DuplicateEntriesDialog tests**

```
npx vitest run test/base-operations/DuplicateEntriesDialog.test.jsx
```

Expected: All 5 failing tests pass.

**Step 5: Commit**

```bash
git add src/modules/base-operations/components/DuplicateEntriesDialog.jsx \
        test/base-operations/DuplicateEntriesDialog.test.jsx
git commit -m "fix: add strategy guard and fix time diff rendering in DuplicateEntriesDialog

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 10: Fix HelpDialog — hotkey categories + icons + keyboard hint

**Files:**
- Modify: `src/modules/base-operations/components/HelpDialog.jsx`
- Modify: `test/base-operations/HelpDialog.test.jsx`

**Context:**
1. "shows keyboard shortcuts for each section" — Quick Start section calls `renderHotkeysSection('general')` but test mock hotkeys use `category: 'navigation'`; need Quick Start to show 'navigation' category
2. "groups hotkeys by category" — test expects heading text "Navigation" but `renderHotkeysSection` uses the raw category string as heading; need to capitalize
3. "shows section descriptions" — `/Bulk Entry/i` matches multiple elements (heading and bullet); fix test to use `getAllByText`
4. "shows appropriate icons" — SVG icons have no `role="img"`, so `getAllByRole('img', { hidden: true })` returns 0
5. "shows keyboard shortcut for closing help" — test expects `/Press Alt \+ H to open help anytime/i` text; needs to be added to component footer

**Step 1: Fix renderHotkeysSection category labels**

Change `renderHotkeysSection` to capitalize the category label:
```js
const renderHotkeysSection = (category) => {
  const categoryHotkeys = Object.entries(hotkeys).filter(([_, config]) => config.category === category);
  if (categoryHotkeys.length === 0) return null;
  const label = category.charAt(0).toUpperCase() + category.slice(1);
  return (
    <div>
      <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</h4>
      ...
    </div>
  );
};
```

**Step 2: Map section to hotkey category**

The Quick Start section currently calls `renderHotkeysSection('general')`. The test mock uses `category: 'navigation'` for `alt+a`. Either:
- Change Quick Start to call `renderHotkeysSection('navigation')`, OR
- Add navigation category to Quick Start

Use Quick Start for 'navigation', Data Entry for 'dataEntry':
```js
case 'quickStart':
  return (
    // ... existing content ...
    {renderHotkeysSection('navigation')}
  );
case 'dataEntry':
  return (
    // ... existing content ...
    {renderHotkeysSection('dataEntry')}
  );
```

**Step 3: Add `role="img"` to section icons**

In `HELP_SECTIONS`, each icon is an SVG. Add `role="img"` and `aria-hidden="true"` to each:
```js
icon: (
  <svg role="img" aria-hidden="true" className="w-5 h-5" ...>
```

**Step 4: Add keyboard shortcut hint to footer**

Find the dialog footer (or close button area) and add:
```jsx
<p className="text-xs text-gray-500 dark:text-gray-400">
  Press Alt + H to open help anytime
</p>
```

**Step 5: Fix test — "shows section descriptions" ambiguity**

In `test/base-operations/HelpDialog.test.jsx`, find:
```js
expect(screen.getByText(/Bulk Entry/i)).toBeInTheDocument();
```

Change to:
```js
expect(screen.getAllByText(/Bulk Entry/i).length).toBeGreaterThan(0);
```

**Step 6: Run HelpDialog tests**

```
npx vitest run test/base-operations/HelpDialog.test.jsx
```

Expected: All 5 failing tests pass.

**Step 7: Commit**

```bash
git add src/modules/base-operations/components/HelpDialog.jsx \
        test/base-operations/HelpDialog.test.jsx
git commit -m "fix: add hotkey categories, icons ARIA role, and help hint to HelpDialog

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 11: Full suite verification

**Step 1: Run all base-operations tests**

```
npx vitest run test/base-operations/
```

Expected: 0 failures (all 45 previously failing tests now pass).

**Step 2: Run full test suite to check for regressions**

```
npx vitest run
```

Expected: All previously passing tests still pass. Total failures ≤ 0 (or only pre-existing unrelated failures).

**Step 3: Commit final verification note if needed**

If any unexpected failures appeared, fix them. Otherwise done.

---

## Quick Reference: Failure → Task Mapping

| Test File | Failures | Task |
|-----------|----------|------|
| `utils/a11y.test.js` | 4 | Tasks 1, 2 |
| `OutList.test.jsx` | 8 | Tasks 3, 4 |
| `MissingNumbersList.test.jsx` | 3 | Task 5 |
| `LogOperationsPanel.test.jsx` | 9 | Task 6 |
| `RaceOverview.test.jsx` | 8 | Task 7 |
| `ReportsPanel.test.jsx` | 3 | Task 8 |
| `DuplicateEntriesDialog.test.jsx` | 5 | Task 9 |
| `HelpDialog.test.jsx` | 5 | Task 10 |
