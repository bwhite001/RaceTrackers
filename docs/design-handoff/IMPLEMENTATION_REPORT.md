# VK4WIP UI redesign — implementation report

Branch: `feature/vk4wip-ui` (from `main` at `541e690`). Not pushed; no PR.
Spec: `IMPLEMENTATION_SPEC.md`. Every judgement call is in `DECISIONS.md`, and the summary at the end points to it.

## What was built, by phase

| Phase | Commit | What |
|---|---|---|
| 0 | `201c421` | Club tokens in Tailwind and CSS. Existing `navy-*`, `primary-*`, `gold-*`, `accent-*` and `red-*` classes now render club colours. Self-hosted Montserrat and Inter (precached offline). `statusStyles.js` as the single source of runner and check states, built on the `--color-status-*` variables Settings writes. Persisted old default colours are upgraded to the club palette. Shell components in `src/design-system/components/VK/`: AppBar, CheckpointTabBar, BaseAppBar with tabs, StatTile, UndoBar + `useUndo`, BottomSheet, TimeStepper, BlockPicker, NumberPad, BibChip. `services/blocks.js` for 5-minute blocks. Brand Button variants. Full-bleed app shell. Pictographic emoji removed. |
| 1 | `41b57b3` | **Home** (navy header, badge, current race card, three role cards, "Scan race QR code" opens the import scanner). **Race setup** header with step and gold progress, plus the live runner count and first/last bib chips. **Share race** screen (QR, Download / Email / Copy, full screen). **Settings** (Light / Dark / Sunlight theme, text size, status colour rows, Reset to club colours, Race data, existing options under "More"). |
| 2 | `92da18c` | **Dexie v11** (additive). **Mark off:**<br>• Quick entry of several individual bibs; groups of 20; state tiles.<br>• Tapping a passed tile opens the edit sheet (TimeStepper, save, unmark).<br>• An unmarked runner keeps "was HH:MM" and can be restored.<br>• Undo after every change.<br>**Corrections:** a time edited after call-in goes back on the callout sheet.<br>**Callout:**<br>• Call-due banner; compact sent rows.<br>• Next call grouped by common time, with individual numbers.<br>• Base copied — mark sent.<br>• Official message / stand-down log.<br>**Overview:** progress bar, tiles, filters, and expandable rows to fix time, call-in, reset and DNS/DNF, each with Undo.<br>**Fix:** duplicate checkpoint rows from concurrent seeding. |
| 3 | `450accd` | **Read-out:**<br>• Overs of up to `overSize` (default 5); one row per bib with a checkbox.<br>• "Base copied — next" is locked until every number is ticked.<br>• Reset, Previous over.<br>• Progress persists and resumes; finishing marks the call sent. |
| 4 | `2710ab3` | **Base Receive**, one responsive component:<br>• "Who's calling?" grid and the checkpoint board (count, up to, behind, last call, Due / OK / Closed).<br>• Block picker opens on the checkpoint's next unreceived block; Exact time.<br>• The numbers box shows only the current block, plus "Also in this call".<br>• Input + keypad; live chip checks.<br>• Clear block / remove with Undo; two-tap Cancel call; Next block.<br>• Complete writes `base_station_runners` (with `callId`) and `radio_calls`; Undo reverts the call exactly.<br>New base header and tabs. |
| 5 | `42bbe89` | **DNF / DNS:**<br>• Bulk add (type or paste), DNF where / reason / time.<br>• All five checks.<br>• Apply / Clear with Undo; out-of-race list.<br>**Overview:** overdue alert, tiles, checkpoint progress, current leaders with filters; map, grid and imports kept.<br>**Fix:** DNS / DNF could overwrite or delete recorded sightings. |
| 6 | `8d802b2` | **Reports:** overdue, still on course, times by checkpoint, call log — each with CSV / Print. The old exports are kept as "Exports".<br>**Needs attention:** duplicates, out of order, skipped, seen after DNF/DNS, unknown bibs, impossible pace.<br>• Resolve in place with Undo; resolutions persist.<br>• Rows set aside are marked `superseded`, never deleted.<br>**Fix:** the broken `08-complete-race-simulation` spec. |
| Review | `06444b5` | Fixes from an independent code review: data-safe DNS/DNF reversal, consistent overview tiles, ISO times for withdrawals, seeding always runs, clear keeps the pass time, read-out error recovery. The radio procedure was added to the user guide. App version 3.16.0. |
| Guide | (final commit) | Regenerated `docs/guides/` from the final Playwright run. |

### New Playwright journeys

All are registered in `generate-guide.js` (new chapters added).

| Spec | Covers (spec §8) |
|---|---|
| `18-vk4wip-home-settings` | Home roles, theme + colour reset, share race |
| `19-checkpoint-fix-mistakes` | journeys 1, 2, 4 |
| `20-checkpoint-readout` | journey 3 |
| `21-base-receive` | journeys 5, 6, 7; journey 5 at 1112×834 (asserts no vertical page scroll) and 390×844 (journey 10) |
| `22-base-dnf-dns` | journey 8, overview |
| `23-base-reports-checks` | journey 9, the four reports |

## Test results

### Unit (Vitest)

`make test-run` with `NODE_OPTIONS=--max-old-space-size=6144`: **106 files, 1,157 tests, all pass** (baseline 94 / 1,074).

Without the heap flag, `make test-run` crashes on this machine with "Channel closed" (the Node worker runs out of memory), exactly as it did on `main` before any change (DECISIONS H5).

New unit tests cover:
- blocks
- receive validation and the board
- status validation
- every data check
- `splitIntoOvers` (asserts no ranges)
- call-due logic
- restore-after-unmark and the correction flag
- exact undo snapshots
- idempotent seeding
- record/undo call
- DNF/DNS never destroying sightings
- the v10 → v11 migration
- the shell components

### E2E (Playwright, all specs, retries off)

`npx playwright test` (all 24 spec files, `--retries=0`, 3 workers):

| | Passed | Failed | Skipped |
|---|---|---|---|
| Baseline on `main` (the `08-complete` file excluded because it couldn't load) | 47 | 19 | 10 |
| This branch (all files) | **74** | 16 | 11 |

- **No regressions.** Every one of the 16 failures also failed on the baseline.
- **Improvements:**
  - 18 new redesign tests pass.
  - The 10 phases of `08-complete-race-simulation` (unloadable before) pass.
  - `03 › switches to Reports tab`, which was failing, now passes.
  - `15-smoke › Phase 5`, which was skipped, now passes.
- **Two tests moved from failed to skipped** (`11-heads-up-grid` and `15-smoke › Phase 6`). They look for the old Data Entry form, so they now skip instead of failing.
- **Still failing (pre-existing):**
  - `01` create race
  - `02` navigation
  - `03` ×5 (old Data Entry)
  - `04` ×2
  - `07` base export
  - `16-base-station-data-entry`
  - `16-linked-checkpoints`
  - `16-transfer-data` ×4

New-journey stability: `19` and `20` were also run with `--repeat-each=2` and passed both times.

### `make test-e2e-ci`

This runs the legacy Puppeteer runner (`test/e2e/e2e-test-runner.js`), not the Playwright suite.

- **As invoked:** it ignores `--headless` (`TEST_CONFIG.headless` is hard-coded `false`). With no display it can't launch a browser: **0 tests ran, exit code 0**.
- **Under `xvfb-run`, with `dist` served on the port it expects (3001):** 0 of 5 passed. It looks for "Race Maintenance" / "Checkpoint Operations" buttons and a homepage title.
- **The same run against a build of `main`:** also 0 of 5 passed, with identical messages. The runner was already stale, so this is not a regression from the redesign. The Playwright suite is the maintained E2E suite.

### Guide

`npm run generate:guide` (and `make guide`) was run after the final Playwright run. `docs/guides/user-guide.{md,html}` and the assets were regenerated, and the guide now ends with a **Radio Procedure (WICEN)** chapter built from `docs/radio-procedure.md`. Radio wording appears only there, never in the UI.

## Incomplete or deferred

- **QR sharing of a full race.** The Share race screen uses the same plain-JSON QR as the existing export, so the Home scanner can read it. Real races exceed reliable QR size (a 60-runner race is about 6,400 characters); the screen says so and offers Download / Email / Copy. A compressed or animated QR needs a matching change to the import scanner.
- **Base can't accept a checkpoint correction in one tap.** A corrected time is heard as "Had HH:MM" and skipped, as spec §4.9 says. It is kept in `radio_calls.skipped`.
- **Checkpoint Overview "Undo call-in" button** drops the correction flag (the Undo bar is exact).
- **"Clearing a status base already has will be flagged on the callout sheet"** (design note) isn't implemented. The checkpoint has no record of base's DNF/DNS, so the note tells the operator to tell base.
- **No Start row on the base board.** The app has no Start checkpoint (H4).
- **Old base components are no longer mounted but kept:** Data Entry / BatchEntryLayout / DraftView / HistoryView, OutList, BulkDnsView, RaceOverview stats, CourseLeadersCard, and the legacy checkpoint RunnerOverview / SharedRunnerGrid. Their unit tests still run. Removing them is a separate tidy-up.
- **Pre-existing failing journeys not rewritten:** all of `03-base-station` except Reports, `16-base-station-data-entry`, `11-heads-up-grid` (one test), and `15-smoke` Phase 6. They drive the old Data Entry form and were failing before this work; the same behaviour is covered by `21–23`. Also `16-transfer-data` (4 tests), `01` create race, `02` navigation, `04` (2 tests), and `07` base export were failing on `main` and are unrelated to this redesign.
- **Per-wave elapsed times** on the leaders table use race start, as the design states, not each wave's start.

## Decisions log — summary

The full entries, with files, are in `DECISIONS.md`.

- **Handoff vs repo (H1–H7):**
  - No PWA version field in `vite.config.js` (bumped `package.json`).
  - Sunlight mode already existed.
  - The "Race setup" card keeps opening race management.
  - No Start checkpoint.
  - `make test-run` needs a bigger heap on this machine.
  - `08-complete` was broken on `main`.
  - The setup wizard has 5–6 steps, not 4.
- **Data safety:**
  - Dexie v11 is additive only.
  - Duplicate checkpoint rows are ignored, never deleted.
  - DNF/DNS no longer overwrites or deletes sightings, and their reversal restores converted rows.
  - Duplicates and wrong sightings are `superseded`, not deleted.
  - Every undo is an exact snapshot or a recorded reverse step.
  - Base writes only `base_station_runners` for calls. The pre-existing DNF/DNS methods that write `checkpoint_runners` were kept so the out list and reports keep working.
- **Behaviour the spec replaced** (tests updated and noted):
  - Tap-again-to-unmark became the edit sheet.
  - Single-number quick entry became several numbers.
  - Per-block "Mark Called" became "Base copied — mark sent".
  - Data Entry became Receive.
  - The dark-mode switch became the Theme control.
  - Home labels changed ("Checkpoint", "Base station", "Race setup", "RaceTracker").
  - The back button is now "Leave checkpoint".
- **Kept rather than removed:**
  - Marker / Radio Operator, Transfer, Export, Share Batch.
  - The detailed withdrawal dialog.
  - The old report exports.
  - The race list on Home.
  - The setup wizard's From/To inputs.
  - Extra settings.

## Validation fixes

From the review of the validation pack (`VALIDATION_FIXES.md`). Judgement calls and the defaults taken are in `DECISIONS.md` › "Validation fixes". Nothing pushed.

| Fix | What changed | Commit | Test |
|---|---|---|---|
| A1 | Overdue only once the next checkpoint has reported past expected + 10 min; otherwise "awaiting report" (gold) | f817c4b | `24-race-day-safety` › overdue waits for the checkpoint to report |
| A2 | Exact times never advance "up to" | f817c4b | `24` › exact time does not move up-to |
| A3 | Same-block edit of a called-in time is not a correction | f817c4b | `24` › same-block edit is not a correction |
| A4 | One "On course" definition, "N not seen yet" | f817c4b | `24` › on course count matches report |
| A5 | Times matrix keeps times for DNS/DNF runners; Status column | f817c4b | `24` › matrix keeps times for DNS runners |
| A6 | Offline suite (service workers, production preview) | f817c4b | `25-offline` (`make test-offline`) |
| A7 | Email shares a setup file + short mailto; import by content; import schema accepts app-created races | f817c4b | `26-share-race` › email share stays short, import accepts octet-stream |
| B1 | Callsign / frequency never cut off | 791d99a | `27-checkpoint-fixes` › header shows callsign and frequency in full |
| B2 | Share batch in the app bar with count | 791d99a | `27` › share batch lives in the app bar and covers no tiles |
| B3 | Sticky quick entry + status line | 791d99a | `27` › status line stays in view while the grid scrolls |
| B4 | "Keep time" back at the original minute | 791d99a | `27` › stepper back to the original time reads Keep time |
| B5 | Overview bar DNS muted, DNF red, full aria-label | 791d99a | `27` › overview bar keeps DNS muted and labels each part |
| B6 | Overview stepper is a draft with Save | 791d99a | `27` › overview stepper is a draft until Save |
| B7 | Exact pinned, HH:MM, bad value rejected without selecting | 791d99a | `28-base-fixes` › exact time is pinned and a bad time keeps the block |
| B8 | "Also in this call" counts recordable only | 791d99a | `28` › also in this call counts numbers to record |
| B9 | "Log call · 0" plain; done card skipped count | 791d99a | `28` › a call with nothing to record is logged plainly |
| B10 | Rejected chips shared style; two-line out list | 791d99a | `28` › rejected chips match receive and out list rows are not cut off |
| B11 | Withdrawal dialog: sheet, 24-hour stepper, reasons mapped, exact Undo | 791d99a | `28` › withdrawal dialog uses 24-hour time and can be undone |
| B12 | Reports Undo labelled and dropped on switch | 791d99a | `28` › reports undo stays with its list and says what it undoes |
| B13 | Leaders flag open data issues; elapsed HH:MM | 791d99a | `28` › leaders flag open data issues |
| C1 | Disabled buttons use the locked style | cd5fb4c | `29-visual-checks` › locked buttons look locked |
| C2 | Off-palette colours mapped to club scales; guard test | cd5fb4c | `test/components/palette.test.js` |
| C3 | Dark-mode contrast (axe) | cd5fb4c | `29` › dark mode passes colour contrast |
| C4 | Sunlight on the working screens | cd5fb4c | `29` › sunlight on the working screens |
| C5 | Race setup fits 390 px | cd5fb4c | `29` › race setup fits a phone |
| C6 | Footer "Ipswich & District Radio Club · VK4WIP" | cd5fb4c | `29` › footer names the club |
| C7 | Mt Glorious template per spec §10 (bibs unchanged) | cd5fb4c | `29` › mt glorious template matches the brief; `normaliseTemplate.test.js` |
| D1 | Seed data: 108 at CP2, skip moved to 128, Merge and checkpoint-DNF cases | b437688 | validation pack ST-04, RP-10, RP-13, ST-14 |
| D2 | "App showed" = per-event evidence; status lines separate | b437688 | validation pack (152 events, all completed) |
| D3/D4 | Events + tests for every gap listed | b437688 | `30-coverage-gaps` (20 tests) |
| E1 | Corrections section with WICEN placeholder | Phase E | `radio-procedure.md` (in the guide) |
| E2 | Official message: date, originator, signed; checkpoint log list | Phase E | `27` › official message has the WICEN fields and a log |
| E3 | "Ask CPx" reminder on Receive, "Asked" with Undo | Phase E | `28` › ask reminder; `reports.test.js` › ask reminders |

**Still open (for Brandon):**
1. D1: how base accepts a corrected time, and the WICEN wording. A proposal is in DECISIONS.md.
2. The Mt Glorious bib range.
3. Whether base needs separate vet-out records again (B11 note).

### Test results after the validation fixes

- **Unit:** 1,169 tests in 108 files, all passing (`NODE_OPTIONS=--max-old-space-size=6144 make test-run`).
- **Playwright** (all specs, retries off): 122 passed, 16 failed, 11 skipped, against a baseline of 74 / 16 / 11. The 16 failures are the pre-existing ones from the baseline, unchanged, and nothing that passed before now fails or skips. Every new spec, 24–30, passes.
- **Offline suite:** passes.

