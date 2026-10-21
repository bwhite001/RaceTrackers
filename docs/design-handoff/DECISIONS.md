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
