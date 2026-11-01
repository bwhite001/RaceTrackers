# VK4WIP UI redesign — decisions log

Calls made while implementing `IMPLEMENTATION_SPEC.md` where the spec was unclear,
conflicted with existing behaviour, or didn't match the repo. Each entry: what, why, files.

## Handoff vs repo — mismatches found before building

| # | Spec / handoff said | Repo actually has | Call |
|---|---|---|---|
| H1 | "Bump the PWA version in `vite.config.js`" | No PWA version field. The app version comes from the latest git tag, falling back to `package.json` `version`. Workbox already revisions every precached file by content hash. | Bumped `package.json` version (3.15.0 → 3.16.0). Files: `package.json`. |
| H2 | Sunlight theme is "optional for v1" | A `sunlightMode` setting and `.sunlight-mode` CSS already exist (green/amber overrides). | Kept the setting, rewrote the CSS to the spec's version (white page, ink text, 2px borders, club palette only). Files: `src/index.css`. |
| H3 | Home "Race setup" card opens `RaceSetup` | The existing "Race Maintenance" card opens `/race-management` (race list, create, edit, import). | Card is labelled "Race setup" but still opens race management, where "Create race" starts the wizard. Losing the race list would hide edit/import/delete. Files: `LandingPage.jsx`. |
| H4 | Receive board lists Start, CP1–CP4, Finish | Races have no Start checkpoint. Base station "finish" records are `base_station_runners` at `checkpointNumber 0` (`BASE_STATION_CP`). | Board = the race's checkpoints + Finish (cp 0). No Start row. |
| H5 | `make test-run` runs the unit suite | On this machine the full run crashes ("Channel closed", Node worker out of memory), with no summary. Each file passes on its own. | Ran the suite with `NODE_OPTIONS=--max-old-space-size=6144`. Baseline: 94 files / 1,074 tests pass. |
| H6 | Playwright journeys can be run with `npx playwright test` | Pre-existing: `08-complete-race-simulation` imports `pickFirstCheckpointIfModal`, which `helpers.js` doesn't export, so the whole run aborts at load. The Chromium build for the installed Playwright wasn't downloaded. | Installed Chromium. Baseline (retries off, excluding that file, `/tmp` JSON reporter): 47 passed, 19 failed, 10 skipped. The 19 failures are on main before any change (01 create-race, 02 runner grid, all of 03 base station, 04, 07 base export, 11, 15 phase 6, 16 base data entry, 16 linked, 16 transfer ×4). |

## Phase 0 — tokens and shell

- **Token aliasing.** Club scales replace the Tailwind-default `navy`, `primary`, `gold`, `accent-gold`, `accent-red` and also `red`, so existing `red-*` classes render club red. Flat `vk-*` tokens were added for new code. Files: `tailwind.config.js`.
- **Status colours stay recolourable.** Runner states are built from the `--color-status-*` CSS variables (which Settings writes), not fixed hexes. Defaults are now the club palette. `called-in` was added as a new key. Files: `src/design-system/statusStyles.js`, `src/index.css`, `src/types/index.js`.
- **Persisted colours.** Users' saved settings still hold the old green/amber defaults, which would override the club palette. `upgradeStatusColors()` swaps them only when they exactly equal the old defaults. Customised colours are kept. Runs on store rehydrate and on `loadSettings`. Files: `src/types/index.js`, `src/store/useRaceStore.js`.
- **Fonts self-hosted** via `@fontsource/montserrat` (600/700/800) and `@fontsource/inter` (400–700), latin subset only. Vite bundles the woff2 files, and the existing workbox `globPatterns` precache them. New dependencies, because the spec requires offline fonts. Files: `package.json`, `src/main.jsx`.
- **Brand buttons** are new variants on the existing design-system `Button` (`gold`, `blueOutline`, `blue`, `plain`, `red`, `redOutline`, `locked`) plus sizes `action` (48px) and `primary` (52px). Existing variants still work, and `primary` renders club navy through the alias. Files: `Button.jsx`.
- **Shell components** live in `src/design-system/components/VK/`.
- **App shell.** `<main>` lost its padded `container` so the new app bars can be full-bleed. Screens not redesigned in this work (race management, race overview/edit, dual checkpoint, transfer, live dashboard) are wrapped in the old container (`Padded`) so their layout is unchanged. The footer is hidden on the operational checkpoint and base screens. Files: `src/App.jsx`.
- **Emoji (G9).** Pictographic emoji were replaced with text or Heroicons. Plain text marks the spec itself uses (✓ ✎ ✗) were kept. Medals became the design's rank badges (gold circle for 1st), with the aria-labels unchanged. Tests updated to match: `test/base-operations/AboutDialog.test.jsx` (heart removed from the credit line) and `16-linked-checkpoints` (the "Both ✅" filter is now "Both").
- **Theme colour** for the PWA manifest and meta tag changed from teal `#21808D` to club navy. Files: `index.html`, `public/manifest.json`, `vite.config.js`, `settingsDOM.js`.

## Phase 1 — Home, Race setup, Share config, Settings

- **H7: the setup wizard has 5–6 steps, not 4.** The steps are Template, Race Details, Runner Setup, Waves, Course Map, and Link Checkpoints (when there are 2+ checkpoints). The spec says "keep the 4-step wizard". All existing steps were kept. The new header shows "Step N of M · label" with M gold segments, and the old StepIndicator is no longer used. Files: `RaceSetup.jsx`.
- **Runner ranges step keeps the From/To inputs** (`#min` / `#max`) instead of the design's single free-text field, because several e2e flows and the validation logic depend on them. The design's live count ("N runners will be created" plus first five … last five chips), the "Have a start list? Import a CSV or WebScorer file" link (opens the existing WebScorer wizard), and the brand buttons were added. Files: `RunnerRangesStep.jsx`.
- **Home keeps the race list.** The design is a single phone screen, but the existing Home also listed current, upcoming and recent races. That list now sits under the main actions as "Races on this device" (shown only when there's more than one race), so race switching isn't lost. The header's "Current race" is the first current, else upcoming, else recent race. Settings and Help are icon buttons in the navy header, since the old PageHeader that held them is gone from Home.
- **Scan race QR code** opens the existing Import/Export modal on the Import tab with the camera started. `initialTab` and `startScanner` props were added. Files: `ImportExportModal.jsx`, `LandingPage.jsx`.
- **Share race** is a new full-screen `ShareRaceModal`, opened from Settings › Race data. It uses the same plain-JSON QR as the existing export so the Home scanner can read it. **Deferred:** a full race export goes over the reliable QR size very quickly (a 60-runner race is about 6,400 characters). When that happens the screen says so and offers Download / Email / Copy, which matches the old export tab. A compressed or animated (qram) QR would also need the import scanner to decode it, which is a separate change. "Show full screen" shows the same plain QR enlarged, not `QRDisplayFullscreen` (that component encodes checkpoint transfer packets the race importer can't read). Files: `ShareRaceModal.jsx`, `SettingsModal.jsx`.
- **Settings.** Theme is a Light / Dark / Sunlight segmented control that maps onto the existing `darkMode` and `sunlightMode` settings, so no new setting was added. Status colours are rows with a native colour picker behind each swatch, plus "Reset to club colours". The existing extra options (high contrast, reduced motion, touch, compact, runner view, group size, clear database) moved under "More options" and "Danger zone" rather than being removed. Dialog footer primary buttons are now gold (one gold primary per screen). Files: `SettingsModal.jsx`, `DialogFooter.jsx`.
- **Tests updated for renamed UI (old behaviour replaced by the spec):**
  - Home heading "Race Tracker Pro" → "RaceTracker": `01-race-setup`, `05-navigation-protection`, `helpers.clearAppData`, `00-full-confidence`.
  - Role buttons "Checkpoint Operations" / "Race Maintenance" → "Checkpoint" / "Race setup": `00`, `01`, `02`, `04`, `05`, `08-complete`, `13`, `16-linked`.
  - The dark-mode switch is now the Theme control (`aria-pressed`): `06-settings`.
- **New journey:** `18-vk4wip-home-settings` (home roles, theme + colour reset, share race). Registered in `generate-guide.js`.

## Phase 2 — Checkpoint Mark off, Overview, Callout; Dexie v11

- **Dexie v11 is one additive block.** It adds every v11 table and index from spec §5 (`radio_calls`, `data_issue_resolutions`, `readout_progress`, plus the `correction` and `callId` indexes). There is no `.upgrade()`: new fields are nullable data columns, so existing rows are untouched. A migration test opens a v10 database with data, reopens it at v11, and checks every row survives. `basic-schema-test.js` and `simple-test.js` asserted `verno === 10`. They were bumped to 11, but they don't match the vitest include pattern so they never ran. Files: `schema.js`, `test/database/schemaV11.test.js`.
- **Bug found and fixed: duplicate checkpoint rows.** Opening a checkpoint could seed `checkpoint_runners` twice. The init effect re-runs when the race finishes loading, and the module seeder and the legacy `StorageService.initializeCheckpointRunners` both seed (the legacy one used `bulkPut` without ids, which simply inserts). Each runner then had two rows, and updates hit one while the UI showed the other.
  - Both seeders now run in one read-write transaction and only add bibs with no row yet.
  - Reads (`CheckpointRepository.getCheckpointRunners`, `StorageService.getCheckpointRunners`) keep the first row per bib, which is the row every update targets, and ignore the rest.
  - Existing duplicates are **not deleted** (never rewrite user data). They're just ignored.
  - `test/checkpoint-operations/CheckpointRepository.test.js`'s DB mock gained `transaction` and `between()` so it can run the transactional seeder. Its assertions are unchanged.
- **Mark off and the Callout move to the module store.** Mark off now uses `checkpointStore` → `CheckpointRepository` (CLAUDE.md: new module work goes through the Repository) instead of the legacy `useRaceStore` → `StorageService` path. Both write the same `checkpoint_runners` rows, so data from older builds still shows. The legacy store is still loaded for the radio operator and transfer views.
- **Called in = `calledIn: true`.** The old grid set `callInTime` at mark-off, so "called in" was unreliable. The new screens use `calledIn` (already in v8) as the source of truth. `callInTime` is set when base copies the call.
- **Corrections only after call-in.** Editing a time base hasn't received is just a time change. Editing a called-in time sets `calledIn: false, correction: true` (spec §3.3 and §4.5.3). The design's demo marks every edit with ✎; the spec's state table only marks corrections, and the spec was followed.
- **Undo** is an exact snapshot of the affected rows, put back on Undo (`snapshot` / `restoreSnapshot`). Rows that didn't exist before are deleted on Undo. Single-level per screen (spec §6). Tapping a tile to mark it shows a status line rather than an Undo bar (as in the design). Bulk quick entry, time edits, unmark, mark-sent and every Overview action offer Undo.
- **The new store actions don't toggle `loading`.** CheckpointView swaps to a full-screen spinner while `loading` is true, which would flash on every tap.
- **Header controls kept.** The Marker / Radio Operator toggle, Transfer Data, Export Results and Share Batch are existing features with journeys (16-transfer, 17-split-role). The toggle is a segmented control in the navy header, Transfer and Export are labelled icon buttons in the app bar, and Share Batch is a navy pill shown on the Mark off tab only (it covered content on Callout and Overview).
- **Quick entry takes individual numbers only** (`parseBibList`): commas, spaces, semicolons. A range like `100-105` is refused with "type each number on its own" (G1). The old `parseBibs` (which expands ranges) is unchanged for the legacy base components still using it.
- **Group chips** chunk the checkpoint's sorted bibs into groups of 20 and label them "first–last". That's a navigation label, not a call, so G1 doesn't apply.
- **Overview DNS/DNF note.** The design says clearing a status base already has "will be flagged on the callout sheet". There's no checkpoint-side record of what base has for DNS/DNF, so the note tells the operator to tell base instead. A runner marked "Passed now" after clearing does go on the callout sheet as normal.
- **Callout "Official message" / "Request stand down"** open a sheet that saves an entry (from, to, message number, time, text) to an on-device checkpoint log in the `settings` table (`checkpointLog:<race>:<cp>`). Spec v1 option: "simple notes modal / log entry". No radio wording is pre-filled.
- **`isCallDue`** lives in `checkpointStats.js` with the other pure checkpoint derivations, rather than a separate `services/callout.js`.
- **Tests updated for replaced behaviour:**
  - `QuickEntryBar.test.jsx`: the bar now takes several numbers and hands the text to Mark off. The old one-number validation messages are gone.
  - `CheckpointView.tabs.test.jsx`: tab labels "Mark off" / "Callout", back button "Leave checkpoint" (was "Exit operation"), and the Overview mock now points at `CheckpointOverview`.
  - `02-checkpoint-operations`: the single-tile test re-located the tile by text, which changes once the time label appears. It now pins the tile by its aria-label.
  - `10-callout-sheet`: the per-block "Mark Called" button became "Base copied — mark sent" (spec §4.6).

## Phase 3 — Read-out

- **Read-out covers every pending block in one session**, block by block. An over never mixes two common times, and the first over of each block says "Common time", later ones "Continuing". The list is frozen when read-out opens, so runners marked meanwhile don't reshuffle the overs; they appear on the callout sheet afterwards.
- **Base copied is recorded at the end** (spec: "Finishing the last over … marks the block called in"). Leaving mid-read saves the ticks and the current over to `readout_progress`, keyed by the first block's time, and reopening resumes there. Finishing clears the saved progress.
- **`overSize`** comes from race config (default 5), clamped to 3–10.

## Phase 4 — Base Receive

- **Receive writes `base_station_runners` per checkpoint**, as spec §4.9 says: `checkpointNumber` = the calling checkpoint, Finish = cp 0, with `commonTime` = the block (or exact time), `markOffEntryTime` = now, `manualTime`, and `callId`. The old Data Entry wrote base radio batches into `checkpoint_runners`, which crosses module isolation. That component is no longer mounted, but its file and unit tests are kept. Existing base readers (`loadRunners`, overview, stats, heads-up grid) already merge both tables by `checkpointNumber`, so they show received calls without changes.
- **Base reads both tables, writes one.** "Already logged" and "Not seen at previous checkpoint" read base's own records plus any checkpoint data imported onto the device. Nothing in Receive writes `checkpoint_runners` (a unit test asserts this).
- **Pre-existing deviation, not changed:** the DNF/DNS repository methods (`withdrawRunner`, `markAsNonStarter`) write `checkpoint_runners`, and the out list reads from there. Changing that would hide existing withdrawals from the out list and reports, so Phase 5 reuses them as they are.
- **No duplicates of base's own making.** An empty placeholder row at the same checkpoint and bib (no time, not passed) is reused instead of adding a second row. The call stores the original row, and Undo puts it back exactly. Undo deletes the call's added rows by `callId` and sets `radio_calls.undoneAt`. The call row itself is kept for the log.
- **Validation lives in `services/receive.js`** (`checkBaseNumber`, `checkCall`) together with the board logic (`buildBoard`), not a separate `receiveValidation.js`.
- **Board rules.**
  - The board lists the race's checkpoints then Finish (H4, no Start row).
  - **Due** = runners are expected (the previous checkpoint has more sightings than this one; for the first checkpoint, the race has started) and no call for 8 or more minutes. The threshold is `CALL_DUE_MINUTES`, overridable by `race.baseCallDueMinutes`.
  - **Closed** = every runner still in the race has been recorded there.
  - "N min behind" shows from 15 minutes.
- **Default block** = the checkpoint's last received block + 5, capped at now. For a checkpoint never received yet: the current block, with the picker showing the last hour (base is usually behind; the checkpoint states the time anyway). The selected chip scrolls into view.
- **Undo inside a call** (remove a chip, Clear block) is single-level and inline, as in the design. Complete's Undo reopens the call with its numbers.
- **The full-screen spinner only shows on first load.** Base refreshes used to swap the whole view for a spinner, which would wipe a call mid-entry. `refreshData({ silent: true })` is used after recording or undoing a call. The bib, call and out-list lookups for validation warn and fall back to empty if they fail, so the rest of the refresh still works. String race ids (some unit tests use `'r1'`) are passed to Dexie unchanged.
- **The base header is the new `BaseAppBar`**: badge, "Base · VK4WIP", frequency and clock, inline tabs. Import/Export, Live Dashboard, Settings and Help are labelled icon buttons on the right. The fixed bottom StatusStrip was removed from the base view: it covered the Receive panel, and its totals are on the Overview tiles.
- **Tabs.**
  - The tabs are Receive · Overview · DNF / DNS · Reports.
  - Reports shows the existing `ReportsPanel` until Phase 6 replaces it. This made the pre-existing failing `03 › switches to Reports tab and renders a report` pass.
  - Hotkeys: N → Receive, R → Reports, D → DNF dialog, Shift+D → DNF / DNS.
- **Tests updated for replaced behaviour:**
  - `BaseStationView.test.jsx`: the "Data Entry" tab is now "Receive" (mocked as `BaseReceive`), and the race name is the tab panel's accessible name rather than header text.
  - `00-full-confidence` Phase 4: the batch is received as a CP1 call on Receive instead of through the old common-time form.
  - `BaseStationView.settings.test.jsx` gained a `BaseReceive` mock. No assertion changed.
- **Not updated (failing before this work, now skipping):** `11-heads-up-grid › grid shows runner status indicators`, `15-smoke › Phase 6` and `16-base-station-data-entry` drive the removed Data Entry form. They failed on the baseline and now skip because they can't find that form. The behaviour they covered is in `21-base-receive`.

## Phase 5 — DNF / DNS bulk add, Base Overview

- **Bulk DNF / DNS reuses the existing repository methods** (`withdrawRunner`, `markAsNonStarter`, `reverseWithdrawal`, `reverseNonStarter`). The out list and existing reports keep working, and every change is audit-logged by those methods. New store actions apply a whole list with one silent refresh (`applyOutStatus`) and undo it in reverse order, restoring what was there before (`undoOutStatus`). Changing DNS→DNF reverses the DNS first, and DNF→DNS reverses the withdrawal first. Files: `baseOperationsStore.js`, `services/statusValidation.js`, `components/BaseStatusView.jsx`.
- **Bug found and fixed (data safety): DNF/DNS could destroy recorded sightings.**
  - `markAsNonStarter` overwrote a runner's `passed` row at every checkpoint with `non-starter`, and `reverseNonStarter` then deleted those rows, so DNS + Undo erased real sightings.
  - `withdrawRunner` likewise overwrote a `passed` row at the withdrawal checkpoint, and `reverseWithdrawal` deleted it.
  - Both now leave sighting rows (`passed`, `called-in`, `marked-off`) alone. The withdrawal record or the other checkpoints carry the status. Tests added: "DNF / DNS never destroy recorded sightings".
- **"On course" DNF** stores `checkpoint: null` on the withdrawal record and writes no checkpoint row. The repository now handles a null checkpoint (it used to build an invalid compound key).
- **Clear on the out list** works for base-entered DNS and DNF (withdrawal records). DNFs that came only from a checkpoint's own data, and vet-outs, show Clear disabled with a tooltip ("Recorded at a checkpoint — clear it there"). Base has no record of its own to reverse for those.
- **Default "Where" is "On course"** rather than a guessed checkpoint. Reason is optional and tapping it again unsets it, as in the design. Time follows the clock until −5 / +5 is used, clamped to race start and now.
- **The detailed withdrawal dialog is kept** (comments, vet-out) behind a link, "Withdraw runner with comments or vet-out details…", on the DNF / DNS tab. The old "Bulk Mark DNS" modal and OutList are no longer mounted; their files and tests are kept.
- **Overview** is a new `BaseOverview`:
  - Overdue alert (red, `role="alert"`). "View runners" opens Reports › Overdue.
  - Four stat tiles; the grid keeps `data-testid="stats-grid"` for the existing journey.
  - Checkpoint progress bars: navy = closed out (everyone still racing has been recorded), blue = arriving, gold = finish.
  - Current leaders table with All / Female / Male / Wave filters and a gold #1 badge. Overflow scrolls on phone.
  - The course map, heads-up grid and checkpoint import panel stay below.
  - The old `RaceOverview` stats block and `CourseLeadersCard` are replaced by the tiles and the leaders table; their files are kept.
- **Overdue** (`services/reports.js`): last seen + the median split for that leg, from runners recorded at both ends of the leg. Legs nobody has completed yet are skipped rather than guessed. Elapsed in the leaders table is from race start, as the design states; per-wave start times are not applied.
- **Tests updated for replaced behaviour:**
  - `BaseStationView.test.jsx`: the Overview tab is mocked as `BaseOverview`.
  - `04-race-management › navigates from race overview to base station` looked for "Data Entry" text and now checks Receive's "Who's calling?".

## Phase 6 — Reports and data checks

- **Reports tab = new `BaseReports`.** A sidebar lists the four reports (Overdue runners, Still on course, Times by checkpoint, Call log) and the six "Needs attention" checks. Each check shows a red count, or ✓ when clear, with a gold total. Each report has CSV (via the existing `downloadReport`) and Print (`window.print()`). The previous `ReportsPanel` (finisher list, results, split times, officials' report) is kept as a fifth sidebar entry, **Exports**, so no existing report was removed.
- **Checks** (`services/dataChecks.js`, one function each, stable `issueKey`s):
  - Duplicates: same bib, same checkpoint, more than one live base record.
  - Out of order: consecutive recorded checkpoints in course order.
  - Skipped: a checkpoint missing before the furthest one seen.
  - Seen after DNF / DNS: sighting time later than the withdrawal time, or any sighting while DNS.
  - Unknown bibs: `radio_calls.rejected` entries with reason "Not in race", on calls that weren't undone.
  - Impossible pace: over 20 km/h between checkpoints with `distanceKm` set. Finish uses `race.distanceKm`. The limit is overridable by `race.paceLimitKmh`. Legs without distances are skipped.
- **Resolving never deletes data.**
  - "Keep A / Keep B", "Merge" and "Remove CPx time" set the other base rows to `status: 'superseded'` (with `supersededAt` and a reason) instead of deleting them. Those rows stop counting everywhere (the store drops them from `runners`) and Undo puts them back exactly.
  - "Clear DNF / DNS" uses the Phase 5 clear (Undo restores it).
  - Acknowledgements ("Ask CPx", "Mark checked", "Remove" / "Keep for review" for unknown bibs) are rows in `data_issue_resolutions`, so they stay resolved after a reload. Undo deletes the resolution.
  - Data-changing resolutions don't need a resolution row: once the data is fixed the issue is gone. All of these are audit-logged.
- **"Remove CPx time"** is only offered when base has its own record at that checkpoint. A sighting that exists only in imported checkpoint data offers "Mark checked" instead (base doesn't edit checkpoint data).
- **"Ask CPx"** records that a radio check was asked for and clears the item, as the design does. There's no separate queue of pending radio checks; the resolution row says "ask CPx".
- **Overdue → "View runners"** on the Overview opens Reports with Overdue runners selected.
- **Bug fix: `08-complete-race-simulation` couldn't load** (`pickFirstCheckpointIfModal` was missing from `helpers.js`; H6). The helper was added (it picks the first checkpoint when the picker dialog appears). The spec was updated for the new UI: tiles pinned by aria-label, the base batch received as a Finish call, the DNF count read from the DNF / DNS tab, and the overview checked via the leaders table and progress bars instead of the removed StatusStrip. All 10 phases pass.
- **New journey:** `23-base-reports-checks` (spec journey 9, plus the four reports).

## Post-implementation review fixes

An independent code review of the branch found these. Each was checked against the code before fixing, and each has a regression test.

1. **Overview tiles disagreed with the out list.** After Phase 5 stopped overwriting sightings, the tiles (from `calculateStats`) counted a DNF runner seen at a checkpoint as "On course". The tiles are now computed in `BaseOverview` from the same race-wide out list and sightings that Reports use. `calculateStats` is unchanged for its other callers.
2. **Reversing DNS / DNF deleted rows it hadn't created.**
   - `markAsNonStarter` and `withdrawRunner` now record a converted row's previous state (`dnsPrev` / `dnfPrev`). `reverseNonStarter` and `reverseWithdrawal` restore that row (e.g. a not-started placeholder) instead of deleting it; only rows they added are deleted.
   - DNS no longer overwrites a checkpoint's own DNF row. Bulk DNS now refuses DNF runners that base can't change ("DNF at checkpoint", i.e. checkpoint DNFs and vet-outs).
   - The checkpoint seeder used to run only when the checkpoint had zero rows, so one DNS row recorded by base on the same device stopped the whole field from being seeded. `checkpointStore.initializeCheckpoint` now always calls the idempotent seeder.
3. **Clearing a checkpoint DNF / DNS lost the pass time.** `clearOut` now returns a runner who had a time to passed with that time (to be called in again), and only resets to not passed when there was no time.
4. **`withdrawRunner` / `vetOutRunner` wrote UTC "HH:mm" strings** into `markOffTime` / `callInTime` (pre-existing). The officials report then showed "Invalid Date", and the hour was UTC, not local. They now store the full ISO timestamp, like every other time.
5. **Clear → Undo on the out list dropped withdrawal comments.** Comments are now carried through and restored.
6. **Read-out could lock after a failed save.** If marking the call sent throws, the read-out now shows an error and can be retried.

**Raised but not changed (logged for follow-up):**
- **Base can't accept a checkpoint's correction.** A corrected time from a checkpoint is heard at base as "Had HH:MM" and skipped (spec §4.9 says already-logged numbers are skipped). The skipped number is kept on the call (`radio_calls.skipped`), but there's no one-tap "accept correction" yet.
- **The checkpoint Overview's "Undo call-in" button loses the correction flag.** It returns the runner to the callout sheet as a plain pending runner. The Undo bar after any Overview action is exact.

## Found while building the UI validation pack

- **A call being received was lost if the page reloaded.** `main.jsx` reloads the page when a new service worker takes control. That happens on the first visit and on every app update. The Receive draft lived only in memory, so an update mid-call dropped the numbers already taken. The Playwright config blocks service workers, so no test saw it. The draft is now persisted with the base store, tagged with its race, and a draft for another race is ignored. Files: `baseOperationsStore.js`, `BaseReceive.jsx`.
- **Withdrawals and vet-outs were never audit-logged (pre-existing).** `withdrawRunner`, `reverseWithdrawal` and `vetOutRunner` wrote their audit row inside a transaction that didn't include `audit_log`. The write failed and the error was swallowed ("Error logging audit"). `audit_log` is now in those transactions, with a test.
- **Validation pack:** `scripts/ui-validation/build-validation-pdf.mjs` (run with `npm run validation:pdf` while `dist` is served on port 4173). It drives the built app through 109 events and writes `docs/design-handoff/ui-validation/VK4WIP-UI-validation.pdf` and `events.json`.

## Validation fixes

Brief: `VALIDATION_FIXES.md` (the full prompt from the review of the validation pack). Defaults used where the brief left a decision open:

- **D1 — base accepting a checkpoint's corrected time: superseded by Race-day fixes Part A (built).** Corrections are their own radio call, so base never has to guess from a "Had HH:MM" chip; see "Race-day fixes" below.
- **D2 — "On course" means in the race and not finished.** That is everyone not DNS, DNF or finished, including runners not seen at any checkpoint yet. The Overview tile shows "N not seen yet" under the count. The tile and Reports › Still on course use one shared selector (`raceCounts` in `reports.js`).
- **D3 — overdue grace is 10 minutes** (`OVERDUE_GRACE_MINUTES`). A runner is overdue only when their next checkpoint has reported up to at least 10 minutes past their expected time. Before that the runner shows as "awaiting report" in gold, with no red alert. A race can override it with `race.overdueGraceMinutes`. Nothing in the UI sets that yet, so in practice it is always 10.

Phase A notes:
- **A2: "up to" ignores exact times.** A number logged with a typed exact time is a one-off. Only block times count towards where a checkpoint has reported up to. Checkpoint records never set `manualTime`, so on the base board every checkpoint row counts.
- **A3: correction only when the 5-minute block changes.** Base only ever hears the block, so a minute's change inside the same block stays called in. The older unit test that edited 07:31 → 07:33 and expected a correction now edits 07:31 → 07:36. Journey 19 moves the time 5 minutes earlier for the same reason.
- **A5: the times matrix never hides a recorded time.** DNF is written only into an empty cell at the checkpoint where the runner withdrew. A time recorded while DNS, or after the DNF time, keeps its value and gets a gold outline ("Recorded after DNS/DNF"). DNS / DNF goes in a new Status column, which is also in the CSV.
- **A7: email shares the race setup as a file.** The setup is races, runners and checkpoints only, with no results, in `race-setup-<name>.json`. Where Web Share can share files it does. Otherwise the file downloads and a short `mailto:` (instructions only, well under 1,800 characters) asks for it to be attached. Import now checks the file's content, not its type, because mail apps hand a `.json` over as `application/octet-stream`, `text/plain` or with no type.
- **Found while testing A7 (pre-existing): exports of app-created races failed to import.** The Zod runner schema didn't allow `firstName` / `lastName` to be `null`, or `gender` `'X'`. Those are exactly what race setup, the v8 migration and the CSV / XLSX imports store, so "Validation failed" came up for every such file. The schema now accepts them, with a unit test.
- **A6: the offline suite runs separately.** The main Playwright config blocks service workers, so it can't test offline. `playwright.offline.config.js` serves the production build with service workers allowed (`make test-offline`). The main config ignores `25-offline.spec.js`.

Phase B notes:
- **B1/B2: checkpoint header.** At 390 px the title row had room for only 128 px of title once Share batch, Transfer and Export sat beside it. So the action icons now share the Marker / Radio Operator row, and the title row holds only back, title and the Saved dot. App bar subtitles wrap to two lines everywhere (base too) instead of ending in an ellipsis. Share batch is an icon button whose name carries the count ("Share batch, 5 runners"). The floating pill is gone.
- **B4: why "Save 11:14" appeared for an unchanged time.** A runner marked at now has seconds. +5 clamps to the current moment, a few seconds later in the same minute, so the times differed though they looked the same. The sheet now snaps the draft back to the original whenever it shows the same minute (`sameMinute` in `blocks.js`). The Overview stepper (B6) uses the same rule.
- **B6:** the Overview stepper keeps a draft. "Save HH:MM" (gold) appears only when it differs. Called-in and passed rows have no other gold button, so there is still one gold per row. The A3 note (same block → no correction) shows live while adjusting.
- **B7:** Exact commits only once a whole time is typed (`HHMM` or `H:MM`), so a half-typed value never selects a wrong time. A rejected time clears the field and turns its border red. The status line says why, and the previous block stays selected. `data-active` on the input tells tests whether Exact is the selected time.
- **B8:** the "Also in this call" pill counts numbers that will be recorded. Its accessible name is now "Show the numbers at HH:MM, N to record" (it was "Show the N numbers at …", which miscounted once flagged numbers were in). Journey 21 and the validation script were updated.
- **B9:** the done card's headline now carries the skipped count ("0 recorded at CP2 · 2 skipped (flagged)"); the block summary moved to the second line. Journey 21 was updated.
- **B11: withdrawal dialog.**
  - It is now a bottom sheet with checkpoint pills, a 24-hour stepper with the date as text, the five reasons, comments, a red primary and a plain Cancel.
  - It records through the same store path as bulk DNF (`applyOutStatus`, which now takes `comments`), so the Undo bar after it is exact.
  - Old reasons are mapped for display only; stored values are never rewritten (`reasonLabel`). The mapping:
    - Personal Emergency → Other
    - Illness → Medical
    - Equipment Failure → Other
    - Weather Conditions → Other
    - Time Cutoff → Cut-off
    - Voluntary Withdrawal → Self-withdrew
  - "105*" still reverses a withdrawal, but the dialog no longer mentions it. The out list's Clear is the advertised way.
  - **Vet-out, for Brandon:** vet-out was already unreachable before this change. `VetOutDialog` isn't mounted anywhere, and the store has no `vetOutRunner`. The dialog keeps comments, and choosing Medical relabels them "Comments / vet notes". A separate vet-out record (`vet_out_records`) was not built back in. Say if base needs it.
- **B12:** the Reports Undo reads "Undo 106: Mark checked" and is dropped when another list is opened. Journey 23 and the validation script were updated.
- **B13:** a leader gets a gold warning icon (accessible name "Open data issue") when they have an unresolved duplicate, out-of-order time, sighting after DNF / DNS or impossible pace. These are the checks that can put a runner in the wrong place. Skipped checkpoints and unknown bibs don't move a leader, so they aren't flagged. Elapsed shows HH:MM.
- **Validation script:** OV-06 taps the Overview stepper and expects an immediate save. It now needs a Save tap and is reworked with the pack in Phase D.

Phase C notes:
- **C1: any disabled design-system `Button` now shows the locked style** (white, dashed border, muted text, not-allowed cursor). This is done in the component, so every disabled button gets it, not just the six the brief names. The raw `<button>`s on base screens use the shared `LOCKED` classes in `statusStyles.js`.
- **C2: off-palette colours.**
  - In every file a screen imports, Tailwind green / emerald / teal / indigo / blue now map shade-for-shade to the `navy` scale, and yellow / amber to the `gold` scale. Both scales are re-anchored on the club colours, so navy-600 is club blue and gold-500 is club gold. This kept light/dark structure and dark-mode variants intact without restyling each screen by hand.
  - Template tags use band and gold tint, and settings toggles use club blue on and the border colour off.
  - `test/components/palette.test.js` fails on any of those hues in a mounted file. Its allow-list is the 27 legacy files that no screen imports: they were checked by walking imports from `src/main.jsx`, then confirmed by searching for importers.
  - The few purple / violet / orange uses (wave badges, the live dashboard's DNF colour, the page-header badge) are outside the brief's list and were left alone.
- **C3: dark-mode contrast.** Club muted grey (#5A6579) and club blue (#1E5CB3) are only 2.5–3:1 on the dark surfaces. In dark mode, `text-vk-muted` becomes navy-300 and `text-vk-blue` becomes navy-400, both from the club scale. This is one rule in `index.css`, and an explicit `dark:text-*` still wins. The Called-in swatch gets a light outline in dark mode. axe's colour-contrast rule passes on Settings and Mark off in Dark. `@axe-core/playwright` was added as a dev dependency.
- **C4: Sunlight needed no code change.** The existing overrides already make the page white and borders 2 px on Mark off, Callout, Read-out and Receive. Spec 29 asserts that and captures the screens.
- **C5:** on the runner setup step the range badges wrap inside the card. Delete is labelled "Remove range 100-159", and the buttons read "Back" and "Next: Waves" on one line.
- **C7: Mt Glorious template.**
  - It now follows spec §10: start 06:30, CP1–CP4 operators and distances (5 / 11 / 14.5 / 17.5 km), base VK4WIP on 147.225 (+0.6, CTCSS 91.5), race distance 22 km.
  - The template normaliser now keeps checkpoint callsigns, location and distance (it used to strip them). Race setup copies them, and the race's base callsign / frequency / distance, into the new race.
  - **Bib range left at 1–128 until Brandon supplies it.**

Phase D notes:
- **D1: seed data.**
  - "Seen later at CPx" is now shown with 108, which really was reported at CP2. The DNF list in the pack sets the time 45 minutes back, so the same runner also produces the "DNF, then seen at CP2" check for "Remove CP2 time".
  - The skipped-checkpoint runner moved from 120 to 128, because RX-03 records 120 at CP1 and filled the gap.
  - The seed also adds an identical duplicate (115, for Merge) and a DNF recorded by CP2 itself (145, for the disabled Clear).
  - `seedRace` takes `cpPasses` and `overSize` for the two-block read-out.
- **D2: "App showed" is evidence, not page chrome.** Each event reads the element it is about: text, accessible name, pressed / disabled / invalid state, and the computed colour or border where the plan names one. Measured values (page width, axe result, CSV first lines, mailto length) are labelled. A separate "Status line" row keeps live status and alert text, capped at 160 characters, so the generic modal text has gone. At Phase D the pack had 148 events (was 109), every one completed, and none had an empty or missing piece of evidence. Phase E added four Ask-reminder events (152).
- **D3/D4:** every gap the brief lists is a pack event and a test in `30-coverage-gaps.spec.js`. There are 20 tests: Receive, DNF / DNS, data checks, the two-block read-out, Settings Cancel and persistence, phone layouts and accessibility. Phase A–C fixes have their own events, marked "Fixes A1 …" in the Plan column.
- **The overdue alert in the pack:** the seeded calls leave CP2 only behind on calls. So BO-01 now shows the gold "hasn't reported past" note (A1), and BO-04 has CP2 report up to now before the red alert appears.

Phase E notes:
- **E1:** the radio procedure has a "Corrections" section with the placeholder "**Brandon to supply WICEN wording** …". It describes app behaviour only: same-block edits aren't corrections, and base skips "Had HH:MM" until D1 is decided. The "Fixing mistakes" line now says a correction means a different 5-minute block.
- **E2: official message.**
  - The sheet adds Date (prefilled dd/mm/yyyy, editable), Originator (name / role, required: Log message stays locked without it) and a "Signed by originator" checkbox.
  - Signing isn't required, because the paper copy may be signed after the call. The log records whether it was.
  - The checkpoint log is now a read-only list (newest first) of every message and stand-down request on that device, replacing the bare count.
  - **The base-side log pad is out of scope.** Base still writes official messages on paper.
- **E3: "Ask CPx" reminder.**
  - An "Ask CPx" resolution in Reports › Needs attention puts a gold "Ask about 106" on that checkpoint's Who's calling button and board row.
  - "Asked" sets `askedAt` on the resolution, an additive data column with no index or schema change, and is audit-logged. Undo clears it.
  - The issue stays resolved in Reports either way; the reminder is only about the radio call.
  - The user guide has a line under "Base: receiving a call".

## Race-day fixes

Brief: `RACE_DAY_FIXES.md` (from Brandon's answers after 3.17.0). Branch `feature/vk4wip-ui`; not pushed or tagged.

Part A — corrections by radio:
- **How it works on air (Brandon):** a correction is its own call, one runner at a time: "Checkpoint [n] correction, runner [bib], time is now [HH:MM]". So the gold "Had HH:MM" chip in a normal Scores call stays a skip, with no tap-to-replace.
- **Checkpoint data:** call-in now stores the block base was given (`calledInBlock`), which is the "was" on the Corrections card. It also means an edit back into that block cancels the pending correction, because base already has it. A runner unmarked after being called in gets `notPassedCorrection`, and marking them again at base's block cancels that. Corrections are excluded from `pendingRunners`, so they are never in "Base copied — mark sent" or Read-out, and never make a call due on their own. The Callout badge and the "To call in" tile count them.
- **"Correction sent" button:** gold only when there's no normal call waiting; otherwise blue outline, so there's still one gold primary.
- **Base data:** a correction is a `radio_calls` row with `kind: 'correction'` and `corrections: [{ number, from, to, notPassed }]`. It reuses the call's `replaced` list, so `undoCall` restores the exact previous rows. Old rows are superseded (`supersededReason: 'correction'`, `supersededBy`), never deleted.
- **"Up to" never moves:** the new row carries `correction: true` and `upToBlock`, the block it replaced, and `reportedUpTo` counts that instead of the new time. So a correction can't move "up to" earlier or later. "Not passed" writes no new row, so its correction call keeps the removed block (`upToBlock`), and `reportedUpTo` reads it from the calls. "Up to" holds exactly then too (completed after Part E).
- **Due timing:** the brief's two phrases point different ways ("doesn't reset last call" / "count it as a call"). A correction is a radio contact, so it counts as the checkpoint's last call. The Call log shows Scores calls and corrections in separate columns.
- **Correction mode:**
  - The correction draft and its Undo live in the persisted Receive draft, alongside the call in progress, so a tab switch or reload keeps both.
  - Typing a bib moves the picker to the block base had.
  - Validation warns but allows: a number not in the field shows "Not in race — check the number" until Part B, and DNF / DNS shows the status.
- **N1 wording:** the decisions table gives it ("Checkpoint [n] correction, runner [bib], not passed"), so the radio procedure uses it. The brief's A3 placeholder text was older.


Part B — bibs can change on the day (N2: a safety net for both late changes and bibs only known at registration; the full Field changes broadcast isn't built):
- **Schema v12 (additive):** `checkpoint_field_changes` is a checkpoint's own log and `field_changes` is base's additions. Races gain `bibsOnTheDay` and checkpoint rows gain `notInSetup`, both data columns.
- **Base's field = setup runners + uncancelled late entries.** It's computed once in the store's refresh (`fieldNumbers`), so every count, check and report that reads `raceRunnerNumbers` includes late entries without per-screen changes. Undo cancels a field change (`cancelledAt`) and never deletes it. "Sharing spec §7" isn't in this repo, so the table follows the brief's field list.
- **Receive:** a number outside the field is still stored as rejected if left untapped, now with reason "Not in setup" (older calls' "Not in race" still counts for Unknown bibs). Tapping it marks the entry `late`; it records as ok "Late entry", and `recordCall` adds the field change in the same transaction with the call's id, so undoing the call cancels it.
- **DNF / DNS bulk add:** the same gold, tappable "Not in setup". Accepted numbers join the field before the status is applied, and the bulk Undo cancels them.
- **Unknown bibs › Add to field:** it also records the time the bib was heard on that call (the checkpoint and block from the rejected entry). Otherwise the runner would join the field but still be missing from that checkpoint. Undo deletes only the row this action created, cancels the field change and reopens the issue. A bib that's since joined the field drops off Unknown bibs on every call that heard it.
- **Checkpoint:** a quick-entry number outside the setup is marked at now with `notInSetup` and logged in `checkpoint_field_changes`. Undo removes both, because the snapshot treats a bib that had no row as new.
- **Mark off groups:** groups are built from the setup's bibs only. A late bib joins the group whose range covers it, or a new group after the rest, so the setup's chips never shift. The grid jumps to the new group once it exists.
- **Typo guard:** a number with more digits than any setup bib, or over 9999, asks "Mark 51212? It isn't in the setup" (inline confirm, Mark / Cancel). Ranges are still refused.
- **Bibs assigned on the day:** a checkbox on the runner step allows zero runners. In such a race with no setup bibs, the checkpoint shows a hint and "Still to come —", and base shows "On course —" and "— not seen yet" until the field has bibs.
- **Mt Glorious template:** the fixed 1–128 range is removed. The card says "Bibs set at setup", and the runner step starts empty.
- **Validation script:** chip locators accept the new "Record …" / "Add …" names, and RX-05 now shows tap-to-record.

Part C — vet-out removed from the UI:
- Vet-out is for horse races and isn't part of this project yet (Brandon). The DNF / DNS link reads "Withdraw runner with comments…", the withdrawal sheet always says "Comments", and the Help dialog no longer lists "Vet Out". The out list's disabled-Clear tooltip already read "Recorded at a checkpoint — clear it there".
- **Kept unmounted for a possible horse-race mode:** `VetOutDialog`, `vetOutRunner`, the `vet_out_records` table and its import / export paths. An old vet-out record (for example from an imported file) shows on the out list as "Medical", so no vet wording reaches the screen.

Part D — housekeeping:
- **C2 follow-up, green vs blue meaning two states.** I checked the 21 mounted files where both a green and a blue class were remapped to navy. Real collisions, fixed:
  - **HeadsUpGrid** on base Overview: "Active" and "Passed" badges were identical. Passed is now solid club blue and Active a blue tint. DNF / DNS also used orange / red, the reverse of the club states, so they're now red outline / muted dashed.
  - **WarningBox:** success and info were identical. Success is band with a navy border; info stays blue tint.
  - **Badge:** success and info were identical. Success is navy and info club blue.
  - **Toast:** success and info bars were near-identical. The icons and labels already differed; the success bar is now navy.
  - **Home race card:** current and upcoming borders were identical. Current is gold and upcoming blue.
  - **LiveDashboardView:** the same finished / active clash in `STATUS_STYLES`. The map is unused (no element reads it), but it was fixed anyway so it's right if it's ever wired up.
- **Checked, no clash:** the import / export modals, the transfer panels, the setup steps, DualRunnerGrid and DualCalloutSheet. In each, green and blue were on unrelated elements, not two states side by side.
- **Gap in the C2 guard, fixed:** the guard missed side-specific classes, so `border-l-green-500` in DualCalloutSheet got through. The guard now also matches `border-l/r/t/b/x/y-`, `ring-offset-` and similar. Called-in segments use club navy.
- **Corrections to `IMPLEMENTATION_REPORT.md`:** the header now says the work was merged and released as 3.16.0 / 3.17.0, the Phase E rows show commit `e870f1f`, and the event count reads 148 at Phase D and 152 after Phase E. The `DECISIONS.md` note is dated to match.
- **Version 3.18.0** in `package.json` and both `package-lock.json` fields; not tagged. The 3.17.0 bump had missed the lock file's second field, which still said 3.16.0.
- **User guide:** the "A number that isn't in the setup" section is added to the radio procedure. The guide is regenerated once, with Part E, because Part E adds the Missed runners and Stand-down sections the brief also asks for.
- `docs/racetracker-validation-fixes.md` had already been deleted (21 Oct).

Part E — runners a checkpoint missed (N4: reminders raised automatically):
- **One source for the "Missed" list:** it is the Skipped-a-checkpoint check itself (`missedReminders`), not a separate stored reminder.
  - Recording a "Not seen CPx" number creates it with no extra tap, because the later sighting is what the check looks for.
  - It can never list a bib twice; the issue key is per bib and checkpoint.
  - It clears itself when the checkpoint calls the bib in, and Needs attention › Skipped counts only unresolved entries.
  - An "Ask CPx" or "Mark checked" in Reports also takes a bib off the list, and the Ask reminder (validation E3) shows instead.
- **They have it:** reuses the correction panel (bib fixed, block picker / Exact, gold "Record missed · HH:MM") and writes one base row on a `radio_calls` row with `kind: 'missed'`. The row carries `missedReport`, so the old time never moves the board's "up to". Undo is `undoCall`.
- **Not seen there:** a `missed-confirmed` resolution on the skip issue. Times by checkpoint then shows "missed" (muted) in that cell instead of "—". Undo removes the resolution.
- **Both Undos** live in the persisted Receive draft, like the other Receive Undos.
- **Stand-down check:** a sheet listing runners in the field, not DNS / DNF, with no record at that checkpoint.
  - Runners seen further on are already on the missed list (it is derived), so the sheet says so rather than offering an "add" tap. This is a deliberate simplification of the brief's "one tap adds them".
  - A "bibs assigned on the day" race with no field shows "Field not known" in place of the second list.
- **Stand down:** a `radio_calls` row with `kind: 'stand-down'`; it's a radio contact, and audit-logged. `buildBoard` shows the checkpoint Closed while it stands, and Undo reopens it. Nothing is written to the shared `checkpoints` table, so module isolation holds; this is my reading of the brief's "closedAt on base". Runners still unaccounted for stay on Overdue / Still on course.
- **Call log** counts Scores calls only: corrections, missed-runner records and stand-downs are excluded. Corrections have their own column.
- **Checkpoint, "Missed — passed earlier":** a plain button on a To come row in Overview. It opens a stepper starting at now. While it's open, its gold "Save missed · HH:MM" replaces "Passed now", so the row keeps one gold button. The runner is marked passed with `missedReport` and appears on the Corrections card as "150 · missed · now HH:MM". "Correction sent" clears it.
- **N3:** the wording for base asking a checkpoint about a missed runner is still to be confirmed; the radio procedure says so.
- **The guide is regenerated here, once,** with Parts A–E text (Corrections, A number that isn't in the setup, Missed runners), as the Part D note explains.
- **Correction / missed-runner block picker:** an earlier time for an older runner wasn't selectable, because the picker only reached back to the checkpoint's last block. The validation pack found this. In those two modes it now offers the whole window (race start, capped at the last four hours).
- **Offline suite flake:** after a rebuild, the first-visit step reloaded the page at the same moment as the app's own reload when the service worker took control (`main.jsx`), giving `ERR_ABORTED` or "interrupted by another navigation". The step now waits for the app's reload instead of racing it. It passes 5 out of 5 on fresh builds.
- **Validation pack** regenerated: 159 events (corrections, late entries, missed runners and stand-down added), all completed, none with missing evidence.
- **Guide:** the "no vet-out wording" test is a regression check, not a user task, so it isn't a guide section. Its heading would have put "vet" back into the guide.

Completed after Part E (the two simplifications from the first pass):
- **"Not passed" and "up to":** the correction call stores the block it removed, so "up to" no longer drops (see Part A).
- **Stand-down check, "Add to missed list":** a runner seen further on can be off the missed list only because base resolved it earlier (Asked, or Mark checked). The sheet now offers "Add 150 to the missed list", which reopens those resolutions, with Undo.
- **Bug found by the validation pack:** in DNF / DNS bulk add, "Mark N as …" cleared the whole list when the save finished, so numbers typed while it saved were lost. It now removes only what it applied. There's a component test that fails without the fix.
- **Still not built:** the base → checkpoint "Field changes" broadcast. The brief excluded it, and it depends on the sharing spec, which isn't in this repo.
- **Validation pack:** regenerated with 162 events, all completed, with no gaps in the evidence.


## Rehearsal fixes

- **Mt Glorious course (task 6):** the track is traced from TRAQ's map for the base map only, and the map itself isn't in the repo.
  - **Cateng Break:** the map draws this as a hairpin with a separate line each way, so each dot is used once and nothing is retraced.
  - **Finish:** the dots form three parallel chains. The track runs out along the green track, back up one brown track, then down the other to the Finish star. The map doesn't show the direction through this section, so the order is a best reading.
  - **Length:** 20.8 km against the 22 km course, because straight lines between dots cut the corners.
- **Due timing (task 7):** a checkpoint's Due clock starts at the later of the last call and the earliest possible arrival, the leader's time at the previous checkpoint (race start for the first) plus the leg at 15 km/h (`DUE_LEADER_KMH`). With no distance for either end it behaves as before.
- **Edit operators, frequency, base callsign (task 8):** Frequency and base callsign sit on the Core Details step and save with Next. Operators are one text field per checkpoint with its own Save, like the rename.
  - **Re-import keeps marks:** `ImportService` writes by id with `put` and never touches `checkpoint_runners`, and the setup file doesn't carry them, so marks survive (spec 36 proves it).
  - **Conflict dialog:** a re-imported setup raises one conflict per runner (64 for the demo race) and each needed its own tap. Added "Use incoming for all" and "Keep existing for all".
  - **Known gap, not fixed:** conflicts are keyed by bare id, so a race, runner and checkpoint with the same id share one choice. The all-or-nothing buttons avoid it; picking mixed choices by hand could still cross over.
- **Small screen fixes (task 10):** the share badge counts entries not yet called in; overview percentages use starters (field minus DNS, capped at 100); an out-of-order issue offers Ask for both checkpoints.
  - **Spec 08 label left at "6 of 10":** the plan expected "6 of 9", but the journey's runner 110 withdrawal is recorded as DNF, so DNS is 0 and starters stay 10.
- **Rehearsal as regression test (task 11):** spec 35 now asserts `findings` is empty after writing `findings.json`, so a green run means no bugs. It checks GPS 4 of 4 on base and on CP1 after the setup-file import, the exports (Finisher List 120 rows, no `not-started` in Race Summary, CP1 Total Missing 0, Split Times equal to the Times CSV), Live Dashboard `121/128` and CP1 `Share batch, 0 runners`. The version is 3.18.1, which also forces the service worker to update.
