# Split-Role Checkpoint — Manual Testing Guide

This guide covers manual testing of the split-role checkpoint feature using Playwright or a real browser. Two operators share one physical checkpoint device-to-device via QR codes, with no internet required.

## Prerequisites

```bash
make build      # or make dev for live server
make seed       # seed a race with runners
```

Navigate to a checkpoint: `http://localhost:3000/checkpoint/1` (or the seeded checkpoint number).

---

## 1. Role Toggle Pill

**Location:** Thin pill below the page header, above the tab nav bar.

| What to verify | Expected |
|---|---|
| Default on load | **Marker** button highlighted (navy background), **Radio Operator** grey |
| Click **Radio Operator** | Button highlights; tab nav + runner grid disappear |
| Click **Marker** | Returns to full tab UI |
| Toggle is always visible | Pill persists in both modes |

---

## 2. Marker Mode

Default mode. Existing UI is unchanged — Mark Off / Callout Sheet / Overview tabs work as before.

### Share Batch FAB

A rounded button in the bottom-right corner:

| What to verify | Expected |
|---|---|
| FAB label | "Share Batch" with a QR code icon |
| No unshared runners | No red badge on the FAB |
| Mark off 1+ runners, revisit checkpoint | Red numeric badge appears (count of entries since last share) |
| Badge updates | Badge increments as more runners are marked |
| FAB position (mobile) | Above the bottom tab bar (`bottom-[110px]`) |
| FAB position (desktop) | Bottom-right of viewport (`bottom-6 right-6`) |

---

## 3. Batch Share Modal (Marker)

Tap **Share Batch** to open. Three phases:

### Phase 1 — Preview

| What to verify | Expected |
|---|---|
| Entry count shown | e.g. "5 entries to share" |
| Last share time shown | "Last share: HH:MM" or "First share this session" |
| Amber retry warning | Shows if a previous share was started but never confirmed (app restarted mid-share) |
| **Generate QR** button | Disabled when 0 entries or still loading |
| **Generate QR** button | Enabled once entry count > 0 |
| **Cancel** button | Closes modal, nothing saved |

### Phase 2 — QR Display

| What to verify | Expected |
|---|---|
| QR code displayed full-screen | Large scannable QR |
| "Done — receiver got it" button | Visible below QR |
| Tapping **Done** | Advances to Phase 3 |
| Tapping **Cancel** | Closes modal; `lastShareTimestamp` NOT updated; next open offers same batch |

### Phase 3 — Confirm Sent

| What to verify | Expected |
|---|---|
| Confirmation message | "Batch shared" or similar |
| **Confirm Sent** button | Saves `lastShareTimestamp`; closes modal; badge clears to 0 |
| **Cancel** button | Closes modal without saving timestamp; same batch re-offered next time |

---

## 4. Radio Operator Mode

Click **Radio Operator** toggle.

| What to verify | Expected |
|---|---|
| Tab nav hidden | Mark Off / Callout Sheet / Overview tabs not visible |
| Runner grid hidden | No runner grid or QuickEntryBar |
| Share Batch FAB hidden | FAB not visible |
| **Scan QR** button | Visible in top zone |
| **Callout Sheet** | Visible in bottom zone (same as the Callout Sheet tab in Marker mode) |

### Scanning a QR (with two devices)

On the **Marker device**: Share Batch → Generate QR → leave QR on screen.

On the **Radio Operator device**:

| Step | Expected |
|---|---|
| Tap **Scan QR** | Camera / scanner opens |
| Point at Marker's QR | Decode completes automatically |
| **Transfer Summary** modal appears | Shows "X entries to import" (dry-run preview) |
| **Import** button | Enabled when dry-run succeeded |
| **Import** button disabled | If dry-run failed (stats = null) |
| Tap **Import** | Imports runners; modal closes; Callout Sheet updates |
| Error toast | Shows if import fails (red, `role="alert"`, accessible) |
| Tap **Scan QR** after error | Error toast clears before scanner opens |

---

## 5. Automated Playwright Tests

The journey spec covers the above flows headlessly:

```bash
# Run just the split-role spec
npx playwright test test/e2e/playwright/17-split-role-checkpoint.journey.spec.js

# Run all journey specs
make test-e2e-ci
```

Tests and their coverage:

| Test name | Covers |
|---|---|
| `checkpoint opens in Marker mode by default` | Role toggle renders, Marker is default |
| `switching to Radio Operator mode replaces the runner grid with a scan zone` | Toggle hides grid, shows scan zone |
| `switching back to Marker mode restores the runner grid` | Toggle is bidirectional |
| `Share Batch button is visible in Marker mode with a QR icon` | FAB renders in Marker mode |
| `Share Batch button is hidden in Radio Operator mode` | FAB absent in Radio mode |
| `Share Batch opens the batch share modal` | FAB click opens modal |

---

## 6. Edge Cases to Test Manually

| Scenario | How to trigger | Expected |
|---|---|---|
| App restarted mid-share (Phase 2 cancel) | Open Share Batch → Generate QR → Cancel → reopen | Phase 1 shows amber "retry" warning |
| Dry-run fails on Radio Operator | Disconnect IndexedDB (devtools) before scan | Import button disabled in summary modal |
| 0 entries to share | Mark off no runners, open Share Batch | "Generate QR" button disabled |
| Toggle while modal is open | Not possible — modal blocks interaction | N/A |
| Multiple runners marked rapidly | Mark 5 runners quickly | Badge count correct; no race condition in unsharedCount effect |
