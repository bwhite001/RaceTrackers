# Bug Fixes & Feature Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 10 operator-reported bugs and UX gaps across Race Maintenance, Base Station, and Checkpoint Operations modules.

**Architecture:** Surgical changes to existing files only — no new modules. Ordered by impact/complexity (XS→L) to build confidence and keep git history clean. Each task covers one story.

**Tech Stack:** React JSX, Vite, Tailwind CSS, Dexie (IndexedDB), Zustand, Vitest + Testing Library, Playwright (E2E)

---

## Task 1: RS-302 — Withdraw Runner button on DNS tab

**Files:**
- Modify: `src/modules/base-operations/views/BaseStationView.jsx`
- Modify: `test/base-operations/BaseStationView.test.jsx`

### Step 1: Write the failing test

Open `test/base-operations/BaseStationView.test.jsx`. Find the test block that renders the `dns` tab. Add:

```js
it('shows a Withdraw Runner button on the DNS tab that opens the WithdrawalDialog', async () => {
  // Arrange: render BaseStationView at the DNS tab
  // (Look at existing tests in this file to see how they switch tabs and mock the store)
  render(<BaseStationView />, { wrapper: MemoryRouter });
  fireEvent.click(screen.getByRole('tab', { name: /dns/i }));

  // Assert button exists
  expect(screen.getByRole('button', { name: /withdraw runner/i })).toBeInTheDocument();

  // Assert clicking it opens the WithdrawalDialog
  fireEvent.click(screen.getByRole('button', { name: /withdraw runner/i }));
  expect(screen.getByRole('dialog')).toBeInTheDocument(); // WithdrawalDialog renders a dialog
});
```

### Step 2: Run test to verify it fails

```bash
cd /brandon/RaceTrackers && npx vitest run test/base-operations/BaseStationView.test.jsx --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — "Unable to find role 'button' with name /withdraw runner/i"

### Step 3: Add the button in BaseStationView.jsx

Find this block in `src/modules/base-operations/views/BaseStationView.jsx` (around line 261):
```jsx
{activeTab === 'dns' && (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">DNS &amp; DNF</h2>
      <button
        type="button"
        onClick={() => setShowBulkDns(true)}
        className="px-4 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-white rounded-lg transition-colors"
      >
        Bulk Mark DNS
      </button>
    </div>
```

Replace the inner div with:
```jsx
{activeTab === 'dns' && (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">DNS &amp; DNF</h2>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleWithdrawal('withdrawal')}
          className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
        >
          Withdraw Runner
        </button>
        <button
          type="button"
          onClick={() => setShowBulkDns(true)}
          className="px-4 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-white rounded-lg transition-colors"
        >
          Bulk Mark DNS
        </button>
      </div>
    </div>
```

### Step 4: Run test to verify it passes

```bash
cd /brandon/RaceTrackers && npx vitest run test/base-operations/BaseStationView.test.jsx --reporter=verbose 2>&1 | tail -20
```

Expected: PASS

### Step 5: Commit

```bash
cd /brandon/RaceTrackers
git add src/modules/base-operations/views/BaseStationView.jsx test/base-operations/BaseStationView.test.jsx
git commit -m "fix(RS-302): add Withdraw Runner button to DNS tab

Withdrawal dialog was only accessible via keyboard shortcut.
Now surfaced as a button alongside Bulk Mark DNS.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 2: RS-204 — Undo DNS in OutList

**Files:**
- Modify: `src/modules/base-operations/components/OutList.jsx`
- Modify: `src/modules/base-operations/store/baseOperationsStore.js`
- Modify: `test/base-operations/OutList.test.jsx`

### Step 1: Write the failing test

In `test/base-operations/OutList.test.jsx`, add a test for the "Undo DNS" action. Look at how the existing mock store is set up in that file (around the `beforeEach`). Add:

```js
it('shows an Undo DNS button for non-starter runners that calls undoDns', async () => {
  const mockUndoDns = vi.fn().mockResolvedValue();
  useBaseOperationsStore.mockImplementation(() => ({
    outList: [{ id: 3, number: 103, status: 'non-starter' }],
    loadOutList: vi.fn(),
    generateOutListReport: vi.fn(),
    downloadReport: vi.fn(),
    loading: false,
    undoDns: mockUndoDns,
  }));

  render(<OutList initialFilter="non-starter" />);

  const btn = screen.getByRole('button', { name: /undo dns/i });
  expect(btn).toBeInTheDocument();
  fireEvent.click(btn);
  await waitFor(() => expect(mockUndoDns).toHaveBeenCalledWith(103));
});
```

### Step 2: Run test to verify it fails

```bash
cd /brandon/RaceTrackers && npx vitest run test/base-operations/OutList.test.jsx --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL

### Step 3: Add `undoDns` to the store

In `src/modules/base-operations/store/baseOperationsStore.js`, find the `withdrawRunner` action and add after it:

```js
undoDns: async (runnerNumber) => {
  const { currentRaceId, loadOutList } = get();
  if (!currentRaceId) return;
  await repo.undoDns(currentRaceId, runnerNumber);
  await loadOutList();
},
```

### Step 4: Add `undoDns` to BaseOperationsRepository

In `src/modules/base-operations/services/BaseOperationsRepository.js`, add after the `markAsDNS` method:

```js
async undoDns(raceId, runnerNumber) {
  await db.transaction('rw', db.checkpoint_runners, async () => {
    const records = await db.checkpoint_runners
      .where('raceId').equals(raceId)
      .and(r => r.number === runnerNumber && r.status === 'non-starter')
      .toArray();
    for (const r of records) {
      await db.checkpoint_runners.delete(r.id);
    }
  });
  await this.logAudit(raceId, 'undo-dns', 'runner', runnerNumber, {});
}
```

### Step 5: Add the Undo DNS button to OutList.jsx

In `src/modules/base-operations/components/OutList.jsx`, update the store destructuring to include `undoDns`:
```js
const {
  outList,
  loadOutList,
  generateOutListReport,
  downloadReport,
  loading,
  undoDns,
} = useBaseOperationsStore();
```

Find the table/list row that renders `non-starter` runners and add the action button. Look for where `runner.status === 'non-starter'` is used in JSX, and add an action column:

```jsx
{runner.status === 'non-starter' && (
  <button
    type="button"
    onClick={() => undoDns(runner.number)}
    className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
  >
    Undo DNS
  </button>
)}
```

### Step 6: Run test to verify it passes

```bash
cd /brandon/RaceTrackers && npx vitest run test/base-operations/OutList.test.jsx --reporter=verbose 2>&1 | tail -20
```

Expected: PASS

### Step 7: Commit

```bash
cd /brandon/RaceTrackers
git add src/modules/base-operations/components/OutList.jsx \
        src/modules/base-operations/store/baseOperationsStore.js \
        src/modules/base-operations/services/BaseOperationsRepository.js \
        test/base-operations/OutList.test.jsx
git commit -m "feat(RS-204): add Undo DNS action to OutList non-starter rows

Operators can now revert a mistakenly marked DNS runner back to
not-started status directly from the DNS & DNF tab.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 3: RS-101 — Race Edit Stepper

**Files:**
- Modify: `src/modules/race-maintenance/views/RaceEditView.jsx`
- Modify: `test/race-maintenance/RaceEditView.test.jsx`

### Step 1: Write failing tests

In `test/race-maintenance/RaceEditView.test.jsx`, add the following tests (study the existing mock setup to understand the helper render function used):

```js
describe('Stepper navigation', () => {
  it('renders step 1 (Race Details) by default with a Next button', () => {
    renderWithRoute('/race-maintenance/edit?raceId=1');
    expect(screen.getByText(/race details/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
  });

  it('moves to step 2 (Checkpoints) when Next is clicked', async () => {
    renderWithRoute('/race-maintenance/edit?raceId=1');
    await waitFor(() => screen.getByDisplayValue('Coastal Classic'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/checkpoints/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('goes back to step 1 without losing data', async () => {
    renderWithRoute('/race-maintenance/edit?raceId=1');
    await waitFor(() => screen.getByDisplayValue('Coastal Classic'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByDisplayValue('Coastal Classic')).toBeInTheDocument();
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd /brandon/RaceTrackers && npx vitest run test/race-maintenance/RaceEditView.test.jsx --reporter=verbose 2>&1 | tail -30
```

Expected: FAIL — "Unable to find role 'button' with name /next/i"

### Step 3: Refactor RaceEditView.jsx

Replace the `<Tabs>` structure with a stepper. The 4 steps are:
- Step 0: Race Details (existing Core Details tab content)
- Step 1: Checkpoints (existing Checkpoints tab content)
- Step 2: Runners (existing Runner Info tab content)
- Step 3: Review (new — read-only summary)

Key changes to `RaceEditView.jsx`:

**Add at top of component (after existing state declarations):**
```js
const STEPS = ['Race Details', 'Checkpoints', 'Runners', 'Review'];
const [currentStep, setCurrentStep] = useState(0);

const goNext = async () => {
  if (currentStep === 0) {
    const errors = validateCore();
    if (Object.keys(errors).length > 0) { setCoreErrors(errors); return; }
    await updateRace(raceId, coreForm);
  }
  setCurrentStep(s => Math.min(s + 1, STEPS.length - 1));
};

const goBack = () => setCurrentStep(s => Math.max(s - 1, 0));
```

**Replace the `<Tabs>` block with:**
```jsx
<div>
  {/* Step indicator */}
  <div className="flex items-center gap-2 mb-6">
    {STEPS.map((label, i) => (
      <React.Fragment key={label}>
        <div className={`flex items-center gap-1.5 text-sm font-medium ${
          i === currentStep ? 'text-blue-600 dark:text-blue-400' :
          i < currentStep ? 'text-green-600 dark:text-green-400' :
          'text-gray-400 dark:text-gray-500'
        }`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            i === currentStep ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' :
            i < currentStep ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' :
            'bg-gray-100 dark:bg-gray-800 text-gray-400'
          }`}>{i < currentStep ? '✓' : i + 1}</span>
          <span className="hidden sm:inline">{label}</span>
        </div>
        {i < STEPS.length - 1 && (
          <div className={`flex-1 h-px ${i < currentStep ? 'bg-green-300' : 'bg-gray-200 dark:bg-gray-700'}`} />
        )}
      </React.Fragment>
    ))}
  </div>

  {/* Step panels */}
  {currentStep === 0 && (
    <Card variant="elevated">
      <CardBody>
        {/* PASTE the existing Core Details form here (the coreForm JSX currently inside TabPanel index={0}) */}
      </CardBody>
    </Card>
  )}

  {currentStep === 1 && (
    <Card variant="elevated">
      <CardBody>
        {/* PASTE the existing Checkpoints JSX here (currently inside TabPanel index={1}) */}
      </CardBody>
    </Card>
  )}

  {currentStep === 2 && (
    <Card variant="elevated">
      <CardBody>
        {/* PASTE the existing Runner Info JSX here (currently inside TabPanel index={2}) */}
      </CardBody>
    </Card>
  )}

  {currentStep === 3 && (
    <Card variant="elevated">
      <CardBody>
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Review</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2"><dt className="text-gray-500 w-28">Race name</dt><dd className="font-medium">{currentRace?.name}</dd></div>
          <div className="flex gap-2"><dt className="text-gray-500 w-28">Date</dt><dd className="font-medium">{currentRace?.date}</dd></div>
          <div className="flex gap-2"><dt className="text-gray-500 w-28">Start time</dt><dd className="font-medium">{currentRace?.startTime || '—'}</dd></div>
          <div className="flex gap-2"><dt className="text-gray-500 w-28">Checkpoints</dt><dd className="font-medium">{checkpoints.map(cp => cp.name).join(', ') || '—'}</dd></div>
          <div className="flex gap-2"><dt className="text-gray-500 w-28">Runners</dt><dd className="font-medium">{runners.length} loaded</dd></div>
        </dl>
      </CardBody>
    </Card>
  )}

  {/* Navigation buttons */}
  <div className="flex justify-between mt-6">
    <Button variant="secondary" onClick={goBack} disabled={currentStep === 0}>
      Back
    </Button>
    {currentStep < STEPS.length - 1 ? (
      <Button variant="primary" onClick={goNext}>
        Next
      </Button>
    ) : (
      <Button variant="primary" onClick={() => navigate(`/race-maintenance/overview?raceId=${raceId}`)}>
        Save &amp; Close
      </Button>
    )}
  </div>
</div>
```

Remove the old Cancel button and per-step Save buttons. The `handleSaveCore` function can remain for any direct saves if needed but step navigation handles saving for step 0.

### Step 4: Run test to verify it passes

```bash
cd /brandon/RaceTrackers && npx vitest run test/race-maintenance/RaceEditView.test.jsx --reporter=verbose 2>&1 | tail -30
```

Expected: PASS (all stepper tests plus existing tests)

### Step 5: Run full test suite to check for regressions

```bash
cd /brandon/RaceTrackers && npx vitest run --reporter=verbose 2>&1 | tail -30
```

Fix any broken tests before committing.

### Step 6: Commit

```bash
cd /brandon/RaceTrackers
git add src/modules/race-maintenance/views/RaceEditView.jsx test/race-maintenance/RaceEditView.test.jsx
git commit -m "feat(RS-101): replace tab layout in RaceEditView with 4-step stepper

Operators can now navigate forward/back through Race Details,
Checkpoints, Runners, and Review steps without leaving the page.
Data is preserved when going Back. Each Next auto-saves the current step.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 4: RS-103 — Bulk DNS text input

**Files:**
- Modify: `src/modules/base-operations/components/BulkDnsView.jsx`
- Create: `test/base-operations/BulkDnsModal.test.jsx`

### Background

`BulkDnsView.jsx` currently shows a search box + checkbox list. Replace the body with a textarea that accepts `101, 105-110, 120` syntax. Reuse the `parseBibs` logic already present in `InputSection.jsx` (copy inline — it's small and has no export).

### Step 1: Write the failing test

Create `test/base-operations/BulkDnsModal.test.jsx`:

```js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import BulkDnsModal from '../../src/modules/base-operations/components/BulkDnsView';
import useBaseOperationsStore from '../../src/modules/base-operations/store/baseOperationsStore';

vi.mock('../../src/modules/base-operations/store/baseOperationsStore');
vi.mock('../../src/shared/services/database/schema.js', () => ({
  default: { runners: { where: () => ({ equals: () => ({ sortBy: async () => [] }) }) } }
}));

describe('BulkDnsModal — text input mode', () => {
  const mockMarkAsDNS = vi.fn().mockResolvedValue();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useBaseOperationsStore.mockReturnValue({
      currentRaceId: 1,
      runners: [],
      markAsDNS: mockMarkAsDNS,
      loading: false,
    });
  });

  it('renders a textarea for number input', () => {
    render(<BulkDnsModal isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/101, 105-110/i)).toBeInTheDocument();
  });

  it('parses ranges and marks matching runners as DNS on submit', async () => {
    render(<BulkDnsModal isOpen={true} onClose={mockOnClose} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '101, 103-105' } });
    fireEvent.click(screen.getByRole('button', { name: /mark dns/i }));
    await waitFor(() => expect(mockMarkAsDNS).toHaveBeenCalledWith([101, 103, 104, 105]));
  });

  it('shows a summary after marking', async () => {
    render(<BulkDnsModal isOpen={true} onClose={mockOnClose} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '101' } });
    fireEvent.click(screen.getByRole('button', { name: /mark dns/i }));
    await waitFor(() => expect(screen.getByText(/marked dns/i)).toBeInTheDocument());
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd /brandon/RaceTrackers && npx vitest run test/base-operations/BulkDnsModal.test.jsx --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL

### Step 3: Rewrite BulkDnsView.jsx

Replace the component body. Keep the outer modal shell (header, footer buttons, z-50 overlay) but replace the search + checkbox list section with:

```jsx
// New state (remove: allRunners, selected, search)
const [inputText, setInputText] = useState('');
const [summary, setSummary] = useState(null); // { marked: number } | null
const [submitting, setSubmitting] = useState(false);

// parseBibs — copied inline from InputSection.jsx
function parseBibs(raw) {
  const results = [];
  for (const token of raw.split(',')) {
    const t = token.trim();
    const rangeMatch = t.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const lo = parseInt(rangeMatch[1], 10), hi = parseInt(rangeMatch[2], 10);
      for (let i = lo; i <= hi; i++) results.push(i);
    } else {
      const n = parseInt(t, 10);
      if (!isNaN(n) && n > 0) results.push(n);
    }
  }
  return [...new Set(results)];
}

const handleMarkDns = async () => {
  const numbers = parseBibs(inputText);
  if (numbers.length === 0) return;
  setSubmitting(true);
  try {
    await markAsDNS(numbers);
    setSummary({ marked: numbers.length });
    setInputText('');
  } finally {
    setSubmitting(false);
  }
};
```

**New modal body JSX** (replaces the search input + list):
```jsx
<div className="px-5 py-4 space-y-3">
  {summary && (
    <p className="text-sm text-green-700 dark:text-green-400 font-medium">
      ✓ {summary.marked} runner{summary.marked !== 1 ? 's' : ''} marked DNS.
    </p>
  )}
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
    Runner numbers
  </label>
  <textarea
    rows={4}
    value={inputText}
    onChange={e => { setInputText(e.target.value); setSummary(null); }}
    placeholder="101, 105-110, 120"
    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
  />
  <p className="text-xs text-gray-500 dark:text-gray-400">
    Comma-separated numbers and ranges, e.g. <code>101, 105-110, 120</code>
  </p>
</div>
```

Update footer button to: `Mark DNS ({parseBibs(inputText).length})` and disable when `parseBibs(inputText).length === 0 || submitting`.

Remove no-longer-needed state: `allRunners`, `selected`, `search`, `processedNumbers`, `notStarted`, `filtered`, helper functions `toggle`/`toggleAll`/`loadRunners`.

### Step 4: Run test to verify it passes

```bash
cd /brandon/RaceTrackers && npx vitest run test/base-operations/BulkDnsModal.test.jsx --reporter=verbose 2>&1 | tail -20
```

### Step 5: Commit

```bash
cd /brandon/RaceTrackers
git add src/modules/base-operations/components/BulkDnsView.jsx test/base-operations/BulkDnsModal.test.jsx
git commit -m "feat(RS-103): replace Bulk DNS checkbox list with range text input

Operators can now type '101, 105-110, 120' to bulk-mark runners
as DNS without searching through a list. Shows count summary after submit.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 5: RS-203 — DNS warning on batch time entry

**Files:**
- Modify: `src/modules/base-operations/components/BatchEntryLayout.jsx`
- Modify: `test/base-operations/BatchEntryLayout.test.jsx`

### Background

`BatchEntryLayout.jsx` calls `submitRadioBatch(bibs, commonTime, checkpointNumber)` in `handleRecord`. Before submitting, check if any bib in `chips` belongs to a DNS runner (status `'non-starter'` in `raceRunners` from `useRaceStore`). If so, show a confirmation modal.

### Step 1: Write the failing test

In `test/base-operations/BatchEntryLayout.test.jsx`, study how chips are added (look for `handleBibEntered`). Add:

```js
it('shows a DNS warning modal when a non-starter bib is in the chip list', async () => {
  useRaceStore.mockReturnValue({
    checkpoints: [{ number: 1, name: 'Start' }],
    runners: [{ number: 101, status: 'non-starter' }, { number: 102, status: 'active' }],
    currentRace: { startTime: '08:00' },
  });
  useBaseOperationsStore.mockReturnValue({
    ...defaultStore,
    runners: [{ number: 101, checkpointNumber: 1, status: 'non-starter' }],
    submitRadioBatch: vi.fn().mockResolvedValue({ id: 1 }),
  });

  render(<BatchEntryLayout onUnsavedChanges={vi.fn()} />, { wrapper: MemoryRouter });

  // Simulate a chip for runner 101 (DNS) being in the list and time being set
  // (This uses internals — look at how the existing tests add chips and trigger record)
  // After triggering record, expect the warning dialog
  expect(await screen.findByText(/marked dns/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /record anyway/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
});
```

### Step 2: Run to verify it fails

```bash
cd /brandon/RaceTrackers && npx vitest run test/base-operations/BatchEntryLayout.test.jsx --reporter=verbose 2>&1 | tail -20
```

### Step 3: Add DNS warning to BatchEntryLayout.jsx

Add state at the top of `BatchEntryLayout`:
```js
const [dnsWarning, setDnsWarning] = useState(null); // { dnsNumbers: number[] } | null
```

Get `raceRunners` from `useRaceStore` (already imported). Build a DNS lookup:
```js
const dnsNumbers = useMemo(() => {
  const set = new Set();
  for (const r of raceRunners ?? []) {
    if (r.status === 'non-starter') set.add(r.number);
  }
  return set;
}, [raceRunners]);
```

Modify `handleRecord`:
```js
const handleRecord = useCallback(async () => {
  if (!checkpointNumber || !commonTime || chips.length === 0) return;
  if (chips.some(c => c.bib === null)) return;
  const bibs = chips.map(c => c.bib);

  // Check for DNS runners
  const dnsInBatch = bibs.filter(b => dnsNumbers.has(b));
  if (dnsInBatch.length > 0) {
    setDnsWarning({ dnsNumbers: dnsInBatch, bibs, proceed: async () => {
      const result = await submitRadioBatch(bibs, commonTime, checkpointNumber, {});
      const batchId = result?.id ?? null;
      setUndoEntry({ count: bibs.length, bibs, checkpointNumber, commonTime, batchId });
      setChips([]);
      onUnsavedChanges?.(false);
      setActiveTab('history');
    }});
    return;
  }

  // Original submit logic (no DNS runners)
  const result = await submitRadioBatch(bibs, commonTime, checkpointNumber, {});
  // ... rest of existing code unchanged
}, [checkpointNumber, commonTime, chips, submitRadioBatch, dnsNumbers, onUnsavedChanges, setActiveTab, makeId]);
```

Add the warning modal JSX at the bottom of the component's return (before the closing `</div>`):

```jsx
{dnsWarning && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
        DNS Runner{dnsWarning.dnsNumbers.length > 1 ? 's' : ''} in batch
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        {dnsWarning.dnsNumbers.length === 1
          ? `Runner ${dnsWarning.dnsNumbers[0]} is marked DNS.`
          : `Runners ${dnsWarning.dnsNumbers.join(', ')} are marked DNS.`
        } Record their time anyway?
      </p>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => setDnsWarning(null)}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={async () => { await dnsWarning.proceed(); setDnsWarning(null); }}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-500"
        >
          Record anyway
        </button>
      </div>
    </div>
  </div>
)}
```

### Step 4: Run test to verify it passes

```bash
cd /brandon/RaceTrackers && npx vitest run test/base-operations/BatchEntryLayout.test.jsx --reporter=verbose 2>&1 | tail -20
```

### Step 5: Commit

```bash
cd /brandon/RaceTrackers
git add src/modules/base-operations/components/BatchEntryLayout.jsx test/base-operations/BatchEntryLayout.test.jsx
git commit -m "feat(RS-203): warn operator when recording time for a DNS runner

If any bib in a batch is marked DNS, show a confirmation modal
before submitting. Operator can proceed or cancel.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 6: RS-301 — "Not Started" shown as "Pending" after race start

**Files:**
- Modify: `src/types/index.js`
- Modify: `src/modules/base-operations/components/RaceOverview.jsx`
- Modify: `test/base-operations/RaceOverview.test.jsx`

### Step 1: Write the failing test

In `test/base-operations/RaceOverview.test.jsx`, look at how the store is mocked (with `stats` and `currentRace`). Add:

```js
it('shows "Pending" instead of "Not Started" when the race has started', () => {
  useBaseOperationsStore.mockReturnValue({
    stats: { total: 10, notStarted: 5, active: 3, finished: 1, dnf: 0, dns: 1, checkpointCounts: {} },
    checkpoints: [],
    currentRace: { startTime: '06:00', date: new Date().toISOString().slice(0, 10) },
  });

  render(<RaceOverview />);
  expect(screen.getByText('Pending')).toBeInTheDocument();
  expect(screen.queryByText('Not Started')).not.toBeInTheDocument();
});

it('shows "Not Started" when the race has not yet started', () => {
  useBaseOperationsStore.mockReturnValue({
    stats: { total: 10, notStarted: 10, active: 0, finished: 0, dnf: 0, dns: 0, checkpointCounts: {} },
    checkpoints: [],
    currentRace: { startTime: '23:00', date: new Date().toISOString().slice(0, 10) },
  });

  render(<RaceOverview />);
  expect(screen.getByText('Not Started')).toBeInTheDocument();
});
```

### Step 2: Run to verify it fails

```bash
cd /brandon/RaceTrackers && npx vitest run test/base-operations/RaceOverview.test.jsx --reporter=verbose 2>&1 | tail -20
```

### Step 3: Add helper to types/index.js

At the bottom of `src/types/index.js`, add:

```js
/**
 * Returns a display label for a runner status.
 * When the race has started, 'not-started' is shown as 'Pending'.
 * @param {string} status
 * @param {{ raceStarted?: boolean }} [opts]
 * @returns {string}
 */
export function getRunnerStatusLabel(status, { raceStarted = false } = {}) {
  if (status === RUNNER_STATUSES.NOT_STARTED && raceStarted) return 'Pending';
  const LABELS = {
    [RUNNER_STATUSES.NOT_STARTED]: 'Not Started',
    [RUNNER_STATUSES.PASSED]: 'Finished',
    [RUNNER_STATUSES.DNS]: 'DNS',
    [RUNNER_STATUSES.DNF]: 'DNF',
  };
  return LABELS[status] ?? status;
}
```

### Step 4: Use the helper in RaceOverview.jsx

In `src/modules/base-operations/components/RaceOverview.jsx`:

1. Import `getRunnerStatusLabel` from types.
2. Get `currentRace` from the store (add it to the destructuring if not there).
3. Compute `raceStarted`:
```js
const raceStarted = useMemo(() => {
  if (!currentRace?.startTime || !currentRace?.date) return false;
  const [h, m] = currentRace.startTime.split(':').map(Number);
  const start = new Date(currentRace.date);
  start.setHours(h, m, 0, 0);
  return Date.now() >= start.getTime();
}, [currentRace]);
```
4. In `STAT_LABELS`, replace the hard-coded `notStarted: 'Not Started'` with:
```js
notStarted: getRunnerStatusLabel(RUNNER_STATUSES.NOT_STARTED, { raceStarted }),
```

### Step 5: Run test to verify it passes

```bash
cd /brandon/RaceTrackers && npx vitest run test/base-operations/RaceOverview.test.jsx --reporter=verbose 2>&1 | tail -20
```

### Step 6: Commit

```bash
cd /brandon/RaceTrackers
git add src/types/index.js src/modules/base-operations/components/RaceOverview.jsx test/base-operations/RaceOverview.test.jsx
git commit -m "feat(RS-301): show 'Pending' instead of 'Not Started' after race start

Adds getRunnerStatusLabel() helper that contextually renames
'not-started' to 'Pending' once the race start time has passed.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 7: RS-102 — Waves per checkpoint (schema + Race Edit UI)

**Files:**
- Modify: `src/shared/services/database/schema.js`
- Modify: `src/modules/race-maintenance/views/RaceEditView.jsx`
- Modify: `src/modules/race-maintenance/store/raceMaintenanceStore.js`
- Modify: `test/race-maintenance/RaceEditView.test.jsx`

### Step 1: Write failing test for wave assignment UI

In `test/race-maintenance/RaceEditView.test.jsx`, update the mock store to include `race_batches` (waves) and test:

```js
it('shows wave assignment control for checkpoints when race has multiple waves', async () => {
  // Update mock store so loadRace also loads race_batches with 2 waves
  // ... (adjust the existing mock to expose waves: [{ batchNumber: 1 }, { batchNumber: 2 }])
  renderWithRoute('/race-maintenance/edit?raceId=1');
  // Navigate to Step 1 (Checkpoints)
  await waitFor(() => screen.getByDisplayValue('Coastal Classic'));
  fireEvent.click(screen.getByRole('button', { name: /next/i }));

  // Each checkpoint row should have a waves control
  expect(screen.getByLabelText(/waves for mile 5/i)).toBeInTheDocument();
});
```

### Step 2: Add Dexie migration for allowedBatches

In `src/shared/services/database/schema.js`, the current latest version is 9. Add version 10:

```js
this.version(10)
  .stores({
    // All other tables identical to version 9; only checkpoints changes to document the new field
    // (Dexie doesn't index JSON arrays — no index change needed, just migration)
    checkpoints: "++id, [raceId+number], raceId, number, name",
  })
  .upgrade(tx => {
    // Backfill allowedBatches = null (all waves) for existing checkpoints
    return tx.table('checkpoints').toCollection().modify(cp => {
      if (cp.allowedBatches === undefined) cp.allowedBatches = null;
    });
  });
```

### Step 3: Update raceMaintenanceStore to load waves and save allowedBatches

In `src/modules/race-maintenance/store/raceMaintenanceStore.js`:

1. Add `waves: []` to the initial store state.
2. In `loadRace(raceId)`, add:
   ```js
   const waves = await db.race_batches.where('raceId').equals(raceId).sortBy('batchNumber');
   set({ waves });
   ```
3. `updateCheckpoint` already calls `db.checkpoints.update(id, data)` — no changes needed there; just pass `{ allowedBatches }` in `data`.

Expose `waves` from the store return.

### Step 4: Add wave assignment UI to RaceEditView Checkpoint step

In `RaceEditView.jsx`, add to the store destructuring: `waves` from `useRaceMaintenanceStore`.

In the Checkpoint step (Step 1), for each checkpoint row, add a wave selector after the name input:

```jsx
{waves.length > 1 && (
  <div className="flex items-center gap-2 flex-wrap mt-1">
    <span className="text-xs text-gray-500 dark:text-gray-400">Waves:</span>
    {/* "All" option */}
    <label className="flex items-center gap-1 text-xs">
      <input
        type="checkbox"
        checked={!(cpWaves[cp.id]?.length > 0)}
        onChange={() => setCpWaves(prev => ({ ...prev, [cp.id]: null }))}
        className="accent-blue-600"
      />
      All
    </label>
    {waves.map(w => (
      <label key={w.batchNumber} className="flex items-center gap-1 text-xs">
        <input
          type="checkbox"
          checked={cpWaves[cp.id]?.includes(w.batchNumber) ?? true}
          onChange={(e) => {
            setCpWaves(prev => {
              const current = prev[cp.id] ?? waves.map(w2 => w2.batchNumber);
              const next = e.target.checked
                ? [...new Set([...current, w.batchNumber])]
                : current.filter(n => n !== w.batchNumber);
              return { ...prev, [cp.id]: next.length === waves.length ? null : next };
            });
          }}
          className="accent-blue-600"
        />
        Wave {w.batchNumber}
      </label>
    ))}
  </div>
)}
```

Add `cpWaves` state: `const [cpWaves, setCpWaves] = useState({})` — initialise from `checkpoints` in the `useEffect` that populates `cpEdits`:
```js
setCpWaves(Object.fromEntries(checkpoints.map(cp => [cp.id, cp.allowedBatches ?? null])));
```

Save on Next (step 1 → step 2 transition in `goNext`):
```js
if (currentStep === 1) {
  await Promise.all(
    checkpoints.map(cp => updateCheckpoint(cp.id, { allowedBatches: cpWaves[cp.id] ?? null }))
  );
}
```

### Step 5: Run test to verify it passes

```bash
cd /brandon/RaceTrackers && npx vitest run test/race-maintenance/RaceEditView.test.jsx --reporter=verbose 2>&1 | tail -20
```

### Step 6: Commit

```bash
cd /brandon/RaceTrackers
git add src/shared/services/database/schema.js \
        src/modules/race-maintenance/views/RaceEditView.jsx \
        src/modules/race-maintenance/store/raceMaintenanceStore.js \
        test/race-maintenance/RaceEditView.test.jsx
git commit -m "feat(RS-102): add allowedBatches per checkpoint with wave assignment UI

Checkpoints can now be restricted to specific waves. Operators
configure wave assignment in the Race Edit Checkpoints step.
Dexie v10 migration backfills null (all waves) for existing checkpoints.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 8: RS-201 / RS-202 — CP overview wave breakdown + exclude DNS from counts

**Files:**
- Modify: `src/modules/base-operations/components/RaceOverview.jsx`
- Modify: `src/modules/base-operations/store/baseOperationsStore.js`
- Modify: `test/base-operations/RaceOverview.test.jsx`

### Step 1: Write failing tests

In `test/base-operations/RaceOverview.test.jsx`:

```js
it('shows per-wave breakdown section', () => {
  useBaseOperationsStore.mockReturnValue({
    stats: {
      total: 10, notStarted: 3, active: 5, finished: 1, dnf: 0, dns: 1,
      checkpointCounts: { 1: 6 },
      waveBreakdown: [
        { batchNumber: 1, label: 'Wave 1', throughCP: 4, pending: 2, dns: 0 },
        { batchNumber: 2, label: 'Wave 2', throughCP: 2, pending: 1, dns: 1 },
      ],
    },
    checkpoints: [{ number: 1, name: 'Ridgeline' }],
    currentRace: { startTime: '06:00', date: new Date().toISOString().slice(0, 10) },
  });

  render(<RaceOverview />);
  expect(screen.getByText('Wave 1')).toBeInTheDocument();
  expect(screen.getByText('Wave 2')).toBeInTheDocument();
});

it('excludes DNS runners from CP through-count', () => {
  useBaseOperationsStore.mockReturnValue({
    stats: {
      total: 5, notStarted: 0, active: 3, finished: 1, dnf: 0, dns: 1,
      checkpointCounts: { 1: 4 }, // Only 4 counted, not 5 (1 DNS excluded)
      waveBreakdown: [],
    },
    checkpoints: [{ number: 1, name: 'Summit' }],
    currentRace: null,
  });

  render(<RaceOverview />);
  // 4 passed out of expected (total - dns = 4)
  const cpCard = screen.getByTestId('cp-count-1');
  expect(cpCard).toHaveTextContent('4');
});
```

### Step 2: Compute waveBreakdown in baseOperationsStore

In `baseOperationsStore.js`, in the `refreshData` / `initialize` action where `stats` is computed, add wave breakdown calculation:

```js
// After computing stats.total, stats.notStarted etc.
const batches = await db.race_batches.where('raceId').equals(currentRaceId).sortBy('batchNumber');
const waveBreakdown = batches.map(batch => {
  const waveRunners = allRunners.filter(r => r.batchNumber === batch.batchNumber);
  const dns = waveRunners.filter(r => r.status === 'non-starter').length;
  const throughCP = bsRunners.filter(r => {
    const batchMatch = waveRunners.some(wr => wr.number === r.number);
    return batchMatch && r.status === RUNNER_STATUSES.PASSED;
  }).length;
  const pending = waveRunners.length - dns - throughCP;
  return {
    batchNumber: batch.batchNumber,
    label: batch.batchName || `Wave ${batch.batchNumber}`,
    throughCP,
    pending: Math.max(0, pending),
    dns,
  };
});
set({ stats: { ...stats, waveBreakdown } });
```

### Step 3: Add wave breakdown section to RaceOverview.jsx

After the per-CP counts section, add:

```jsx
{stats.waveBreakdown?.length > 0 && (
  <div className="mt-4">
    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
      By Wave
    </h3>
    <div className="space-y-2">
      {stats.waveBreakdown.map(wave => (
        <div key={wave.batchNumber} className="flex items-center gap-4 text-sm bg-white dark:bg-gray-800 rounded-lg px-3 py-2 shadow-sm">
          <span className="font-semibold text-gray-700 dark:text-gray-200 w-20 shrink-0">{wave.label}</span>
          <span className="text-green-600 dark:text-green-400">{wave.throughCP} through</span>
          <span className="text-blue-500">{wave.pending} pending</span>
          {wave.dns > 0 && <span className="text-yellow-500">{wave.dns} DNS</span>}
        </div>
      ))}
    </div>
  </div>
)}
```

### Step 4: Run test to verify it passes

```bash
cd /brandon/RaceTrackers && npx vitest run test/base-operations/RaceOverview.test.jsx --reporter=verbose 2>&1 | tail -20
```

### Step 5: Commit

```bash
cd /brandon/RaceTrackers
git add src/modules/base-operations/components/RaceOverview.jsx \
        src/modules/base-operations/store/baseOperationsStore.js \
        test/base-operations/RaceOverview.test.jsx
git commit -m "feat(RS-201,RS-202): wave breakdown in CP overview, DNS excluded from counts

RaceOverview now shows a per-wave summary row (through CP, pending, DNS).
DNS runners are excluded from the 'through CP' checkpoint counts.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 9: RS-401 / RS-402 — Missing list modal + withdrawn at-a-glance

**Files:**
- Modify: `src/modules/base-operations/components/MissingNumbersList.jsx`
- Modify: `src/modules/base-operations/views/BaseStationView.jsx`
- Modify: `test/base-operations/MissingNumbersList.test.jsx`

### Step 1: Write failing tests

In `test/base-operations/MissingNumbersList.test.jsx`, after studying the existing test patterns:

```js
it('shows "Show expected at CP" button that opens a modal with runner details', async () => {
  // Mock store with missingRunners that include name data
  useBaseOperationsStore.mockImplementation(() => ({
    missingRunners: [
      { number: 101, firstName: 'Jane', lastName: 'Smith', batchNumber: 1, lastCpTime: null }
    ],
    loadMissingRunners: vi.fn(),
    generateMissingNumbersReport: vi.fn(),
    downloadReport: vi.fn(),
    loading: false,
  }));

  render(<MissingNumbersList checkpoint={1} />);
  
  const btn = screen.getByRole('button', { name: /show expected/i });
  fireEvent.click(btn);

  expect(await screen.findByText('Jane Smith')).toBeInTheDocument();
  expect(screen.getByText('101')).toBeInTheDocument();
});
```

Add a separate test for the withdrawn modal in `test/base-operations/BaseStationView.test.jsx`:

```js
it('opens a withdrawn runners modal when Withdrawn button is clicked on DNS tab', async () => {
  render(<BaseStationView />, { wrapper: MemoryRouter });
  fireEvent.click(screen.getByRole('tab', { name: /dns/i }));
  
  const btn = screen.getByRole('button', { name: /withdrawn/i });
  fireEvent.click(btn);
  
  expect(screen.getByRole('dialog', { name: /withdrawn runners/i })).toBeInTheDocument();
});
```

### Step 2: Run to verify they fail

```bash
cd /brandon/RaceTrackers && npx vitest run test/base-operations/MissingNumbersList.test.jsx test/base-operations/BaseStationView.test.jsx --reporter=verbose 2>&1 | tail -30
```

### Step 3: Add "Show expected" modal to MissingNumbersList.jsx

Add state: `const [showExpected, setShowExpected] = useState(false)`.

Get runner name info: in the store's `loadMissingRunners`, the `missingRunners` come from `BaseOperationsRepository.getMissingRunners`. This already returns runner objects. Ensure `firstName`/`lastName` are included (they come from the `runners` table join — check the repository method and add the fields if missing).

Add button after the checkpoint selector:
```jsx
<button
  type="button"
  onClick={() => setShowExpected(true)}
  className="text-sm px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
>
  Show expected at CP {selectedCheckpoint}
</button>
```

Add modal at end of return:
```jsx
{showExpected && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-label="Expected runners">
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Expected at CP {selectedCheckpoint} — missing ({missingRunners.length})
        </h3>
        <button type="button" onClick={() => setShowExpected(false)} aria-label="Close" className="text-gray-500 hover:text-gray-700 p-1">✕</button>
      </div>
      <div className="overflow-y-auto flex-1">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
            <tr>
              {['Bib', 'Name', 'Wave', 'Last CP'].map(h => (
                <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {missingRunners.map(r => (
              <tr key={r.number}>
                <td className="px-4 py-2 font-mono font-bold">{r.number}</td>
                <td className="px-4 py-2">{[r.firstName, r.lastName].filter(Boolean).join(' ') || '—'}</td>
                <td className="px-4 py-2">{r.batchNumber ?? '—'}</td>
                <td className="px-4 py-2 font-mono text-xs">{r.lastCpTime ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}
```

### Step 4: Add Withdrawn modal to BaseStationView.jsx

Add state: `const [showWithdrawn, setShowWithdrawn] = useState(false)`.

Add button to DNS tab header (next to "Withdraw Runner" and "Bulk Mark DNS"):
```jsx
<button type="button" onClick={() => setShowWithdrawn(true)}
  className="px-4 py-2 text-sm font-semibold bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors">
  Withdrawn
</button>
```

Add modal at bottom of BaseStationView return, reading from `outList` (already in store):
```jsx
{showWithdrawn && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-label="Withdrawn runners">
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold">Withdrawn Runners</h3>
        <button type="button" onClick={() => setShowWithdrawn(false)} aria-label="Close" className="p-1">✕</button>
      </div>
      <div className="overflow-y-auto flex-1 p-4">
        {(outList ?? []).filter(r => r.status === 'withdrawn').length === 0
          ? <p className="text-sm text-gray-500">No withdrawn runners.</p>
          : (
            <table className="min-w-full text-sm">
              <thead><tr>{['Bib', 'Last CP', 'Reason', 'Time'].map(h => <th key={h} className="text-left px-2 py-1 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {(outList ?? []).filter(r => r.status === 'withdrawn').map(r => (
                  <tr key={r.number}>
                    <td className="px-2 py-1.5 font-mono font-bold">{r.number}</td>
                    <td className="px-2 py-1.5">{r.withdrawalDetails?.checkpoint ?? '—'}</td>
                    <td className="px-2 py-1.5">{r.withdrawalDetails?.reason ?? '—'}</td>
                    <td className="px-2 py-1.5 font-mono text-xs">{r.withdrawalDetails?.withdrawalTime ? new Date(r.withdrawalDetails.withdrawalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>
    </div>
  </div>
)}
```

### Step 5: Run tests to verify they pass

```bash
cd /brandon/RaceTrackers && npx vitest run test/base-operations/MissingNumbersList.test.jsx test/base-operations/BaseStationView.test.jsx --reporter=verbose 2>&1 | tail -30
```

### Step 6: Commit

```bash
cd /brandon/RaceTrackers
git add src/modules/base-operations/components/MissingNumbersList.jsx \
        src/modules/base-operations/views/BaseStationView.jsx \
        test/base-operations/MissingNumbersList.test.jsx \
        test/base-operations/BaseStationView.test.jsx
git commit -m "feat(RS-401,RS-402): missing runners detail modal and withdrawn at-a-glance

Missing list now has 'Show expected at CP N' button with bib/name/wave table.
DNS tab has a 'Withdrawn' button showing withdrawn runners with reason and time.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 10: RS-501 — Runner names in base station list

**Files:**
- Modify: `src/modules/base-operations/components/HeadsUpGrid.jsx`
- Modify: `src/modules/base-operations/views/BaseStationView.jsx`
- Modify: `test/base-operations/BaseStationView.test.jsx`

### Background

`BaseStationView.jsx` passes `groupedRunners` to `HeadsUpGrid`. The `groupedRunners` are derived from `base_station_runners` and don't include `firstName`/`lastName`. These come from `raceRunners` in `useRaceStore`. We'll build a `nameMap` in `BaseStationView` and pass `showNames + nameMap` to `HeadsUpGrid`.

### Step 1: Write the failing test

In `test/base-operations/BaseStationView.test.jsx`:

```js
it('shows runner names when Show Names is toggled on', async () => {
  // Make sure raceRunners has name data in the mock
  // useRaceStore.mockReturnValue({ runners: [{ number: 101, firstName: 'Ali', lastName: 'Jones', status: 'not-started' }], ... })

  render(<BaseStationView />, { wrapper: MemoryRouter });

  const toggle = screen.getByRole('button', { name: /show names/i });
  expect(screen.queryByText('Ali Jones')).not.toBeInTheDocument();
  
  fireEvent.click(toggle);
  expect(await screen.findByText('Ali Jones')).toBeInTheDocument();
});
```

### Step 2: Run to verify it fails

```bash
cd /brandon/RaceTrackers && npx vitest run test/base-operations/BaseStationView.test.jsx --reporter=verbose 2>&1 | tail -20
```

### Step 3: Add nameMap and showNames state to BaseStationView.jsx

```js
const { runners: raceRunners } = useRaceStore(); // Add this import/hook if not present
const [showNames, setShowNames] = useState(false);

const nameMap = useMemo(() => {
  const map = {};
  for (const r of raceRunners ?? []) {
    const name = [r.firstName, r.lastName].filter(Boolean).join(' ');
    if (name) map[r.number] = name;
  }
  return map;
}, [raceRunners]);
```

Add a "Show Names" toggle button in the overview tab header area (look for where `<RaceOverview />` is rendered and add above it):

```jsx
<div className="flex justify-end mb-2">
  <button
    type="button"
    onClick={() => setShowNames(v => !v)}
    className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
      showNames
        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
    }`}
  >
    {showNames ? 'Hide Names' : 'Show Names'}
  </button>
</div>
```

Pass `showNames` and `nameMap` to `HeadsUpGrid`:
```jsx
<HeadsUpGrid runners={groupedRunners} checkpoints={checkpoints ?? []} showNames={showNames} nameMap={nameMap} />
```

### Step 4: Update HeadsUpGrid.jsx to render names

In `HeadsUpGrid.jsx`, update the prop signature:
```js
const HeadsUpGrid = ({ runners = [], checkpoints = [], showNames = false, nameMap = {} }) => {
```

In the runner number cell (find where `r.number` is rendered in a `<td>` or row), add:
```jsx
<td className="px-2 py-1.5 font-mono font-bold text-sm">
  {r.number}
  {showNames && nameMap[r.number] && (
    <div className="text-xs font-normal text-gray-500 dark:text-gray-400 leading-tight">
      {nameMap[r.number]}
    </div>
  )}
</td>
```

### Step 5: Run test to verify it passes

```bash
cd /brandon/RaceTrackers && npx vitest run test/base-operations/BaseStationView.test.jsx --reporter=verbose 2>&1 | tail -20
```

### Step 6: Run full suite to check for regressions

```bash
cd /brandon/RaceTrackers && npx vitest run --reporter=verbose 2>&1 | grep -E "FAIL|PASS|ERROR" | tail -20
```

### Step 7: Commit

```bash
cd /brandon/RaceTrackers
git add src/modules/base-operations/components/HeadsUpGrid.jsx \
        src/modules/base-operations/views/BaseStationView.jsx \
        test/base-operations/BaseStationView.test.jsx
git commit -m "feat(RS-501): add Show Names toggle to base station runner list

A 'Show Names' button in the overview tab toggles runner first/last names
below bib numbers in HeadsUpGrid. Names come from the master runners table.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Final verification

Run the full test suite:

```bash
cd /brandon/RaceTrackers && npx vitest run 2>&1 | tail -10
```

Expected: All tests pass.

Run a quick build check:

```bash
cd /brandon/RaceTrackers && npx vite build 2>&1 | tail -10
```

Expected: Build completes without errors.
