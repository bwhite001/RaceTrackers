# RaceTracker — VK4WIP UI: validation fixes (prompt for Claude Code)

Paste this whole file into Claude Code in the `bwhite001/RaceTrackers` repo, or save it as
`docs/design-handoff/VALIDATION_FIXES.md` and say "work through VALIDATION_FIXES.md".

---

## Context

You built the VK4WIP UI redesign on `feature/vk4wip-ui` (see `IMPLEMENTATION_REPORT.md`,
`DECISIONS.md`, `IMPLEMENTATION_SPEC.md`). A UI validation pack
(`docs/design-handoff/ui-validation/VK4WIP-UI-validation.pdf`, `events.json`) was reviewed
against the spec. This file lists the fixes. Event IDs (e.g. `RX-13`) refer to that pack.

## Rules

- Read `CLAUDE.md` first. Stay on `feature/vk4wip-ui`. Don't push, don't open a PR.
- Everything in `IMPLEMENTATION_SPEC.md` §2 (G1–G11) still applies: bibs individual, 5-min
  blocks, never future times, 24-hour en-AU, Undo on destructive/bulk actions, ≥44px targets,
  club palette only, one gold primary per screen, no emoji, `timeUtils` for time, module
  isolation (`checkpoint_runners` ↔ `base_station_runners` never crossed).
- Data safety as before: additive Dexie changes only, never delete user data (supersede or
  flag), every undo exact, audit-log base edits.
- **Every fix gets a Playwright test** (named below) and unit tests for any changed pure logic.
  New spec files continue the numbering from `24-`. Register new chapters in
  `generate-guide.js` (`SECTION_MAP` / `CHAPTERS`).
- One commit per phase. After each phase run the unit suite
  (`NODE_OPTIONS=--max-old-space-size=6144 make test-run`) and the full Playwright suite with
  retries off. **No regressions** against the current baseline (74 passed / 16 failed / 11
  skipped; the 16 failures are pre-existing and listed in the report).
- Log every judgement call in `DECISIONS.md` under a new heading "Validation fixes".
- Items marked **DECISION** have a default. Build the default unless the item says *stop*;
  log it so Brandon can overrule.

---

## Phase A — race-day risk (do first)

### A1. Overdue alert fires when a checkpoint is only behind on calls  (BO-01, RP-01)
**Problem.** 14 runners show "overdue at CP2" with expected 10:40–10:45, but CP2 has only
reported up to 10:40. Base gets a red safety banner every time a checkpoint is slow to call.

**Fix** (`services/reports.js` overdue logic, `BaseOverview`, `BaseReports`):
- For each runner, next checkpoint `cpN`, expected time `E` (last seen + median leg split, as now).
- `reportedUpTo(cpN)` = that checkpoint's last received block (same value the board shows, after A2).
- **Overdue** only when `reportedUpTo(cpN) >= E + graceMinutes` and the runner isn't recorded at `cpN`.
  `graceMinutes` default 10, overridable by `race.overdueGraceMinutes`. **DECISION** (D3): 10 min.
- Otherwise the runner is **awaiting report** — not overdue.
- Banner: red `role="alert"` only for truly overdue runners. If there are only "awaiting report"
  runners, show a gold info line instead ("CP2 hasn't reported past 10:40 · 14 expected").
- Overdue report: keep the table for overdue runners; add an "Awaiting report" group underneath,
  grouped by checkpoint, with "reported up to HH:MM". CSV gets a `Status` column.
- A checkpoint with no calls at all: its expected runners are "awaiting report"; the board's
  Due pill already covers a silent checkpoint.

**Unit:** overdue vs awaiting for E < upTo−grace, E = upTo, E > upTo; leg with no median skipped.
**Playwright:** `24-race-day-safety.spec` › `overdue waits for the checkpoint to report` —
seed CP1 10:10 for 10 bibs, CP2 up to 10:40 with median split 30 → gold note, no red alert;
receive a CP2 call up to 10:55 without those bibs → red alert lists them.

### A2. An exact time drags "up to" forward  (RX-13)
**Problem.** One bib at exact 10:53 made CP1 "Up to 10:50" though 10:25–10:45 were never
received. Next call defaults to 10:55 and the board says only 20 min behind.

**Fix** (`services/receive.js` `buildBoard`, default-block logic):
- `lastBlock` = max **block** among received numbers where `manualTime !== true`. Exact times
  never advance it.
- If a checkpoint has only exact-time numbers, `lastBlock` stays null (treated as never received).

**Unit:** board with blocks 10:15, 10:20 + exact 10:53 → `lastBlock` 10:20, next default 10:25.
**Playwright:** `24-race-day-safety.spec` › `exact time does not move up-to` — receive CP1 10:15
(2 bibs) + exact 10:53 (1 bib), Complete → board "Up to 10:15"; tap CP1 again → 10:20 selected.

### A3. Corrections raised when the common time hasn't changed  (CO-03 → CO-05)
**Problem.** 101 edited 11:04 → 11:03 stays in block 11:00, which base already has, yet it goes
back on the callout as a correction and sets off Call due.

**Fix** (`checkpointStore` time edit, edit sheet, `CheckpointOverview`):
- When a **called-in** runner's time changes and the new block equals the old block (and neither
  time is exact): update `actualTime`/`editedAt` only. Keep `calledIn: true`, no `correction`,
  no ✎.
- Edit sheet: show the warning box only when the block would change. Otherwise show a plain note:
  "Same common time (11:00) — base doesn't need a correction."
- Status line: "101 time changed — same common time, nothing to send".
- Same rule in Overview (see B6).

**Unit:** same-block edit keeps calledIn; cross-block edit sets correction; exact time always sets
correction.
**Playwright:** `24-race-day-safety.spec` › `same-block edit is not a correction` — call in 101
at 11:04, edit to 11:03 → no Correction on callout, Callout badge unchanged; edit to 10:58 →
Correction appears.

**DECISION D1 — base accepting a correction. *Stop: don't build.*** Today base shows the new time
as "Had HH:MM" and skips it (kept in `radio_calls.skipped`). Proposed design for Brandon to confirm
once WICEN's on-air wording is known: tapping a gold "Had 11:00" chip offers "Replace with 10:55
(correction)", which supersedes the old base row (never deletes), records the call, audit-logs it,
and Undo restores it exactly. Only write the proposal into `DECISIONS.md`.

### A4. "On course" means two things  (BO-01 vs RP-03)
**Problem.** Overview tile says On course 25; Reports › Still on course says 57 (32 not seen since
start).

**Fix.** **DECISION D2:** one definition everywhere — *On course = in the race (not DNS, not DNF,
not finished)* = 57. The tile gets a sub-label "32 not seen yet". Put the count in one shared
selector used by the tile, the report and the sidebar count.

**Playwright:** `24-race-day-safety.spec` › `on course count matches report` — tile number equals
the Still on course sidebar count; sub-label equals the "Not seen since start" tile.

### A5. Times by checkpoint hides sightings for DNS runners  (RP-04 vs RP-12)
**Problem.** 101 shows "DNS" at CP1 and "—" at CP2, but base has 10:10 at CP1 and 10:40 at CP2.

**Fix** (times matrix + CSV): never replace a recorded time. Add a `Status` column (DNS, DNF @CPx).
In a cell with no time, show DNF at the withdrawal checkpoint only. A time recorded while DNS
or after DNF gets a gold outline and title "Recorded after DNS/DNF" (it's also in Needs attention).

**Playwright:** `24-race-day-safety.spec` › `matrix keeps times for DNS runners` — 101 row shows
10:10 and 10:40 plus DNS in Status; CSV row matches.

### A6. Offline has never been tested
**Problem.** `playwright.config` blocks service workers, so offline start, precached fonts and
"reload mid-call" are untested — but the app must work with no signal.

**Fix.** Add `playwright.offline.config.js` (service workers allowed, runs against `vite preview`
of a production build). Add an npm script `test:e2e:offline` and a Makefile target.

**Playwright:** `25-offline.spec` (offline config):
1. Load `/`, wait until the service worker controls the page, reload.
2. `context.setOffline(true)`, reload → Home renders; `document.fonts.check('800 16px Montserrat')`
   and `('400 16px Inter')` are true.
3. Open CP3 Mark off offline, mark a runner, reload offline → still marked.
4. Base Receive offline: add 3 numbers to a CP1 call, reload → draft restored with the same numbers
   and block (covers the reload bug in DECISIONS "Found while building the UI validation pack").

### A7. Share race by email  (SHARE-01)
**Problem.** The config is 9,043 characters, so no QR. If the Email tile still puts the whole JSON
in a `mailto:` body it will be silently cut off at ~2,000 characters on many mail clients.

**Fix** (`ShareRaceModal`, existing email helpers) — interim only; the full `rtsetup` package is a
separate spec (`racetracker-race-setup-sharing-spec.md`), don't build it here:
- If `navigator.canShare({ files })`: share a `.json` file plus a short text body.
- Otherwise: download the `.json` file and open `mailto:` with a short body (instructions only,
  ≤ 1,800 characters total), telling the reader to attach the downloaded file.
- Confirm the share payload contains **no results** (no `checkpointRunners`, base runners,
  withdrawals, call-ins, audit). If it does, strip them in the share path only; full backups keep
  them.
- File import: accept by content, not `file.type` (`.json, application/json,
  application/octet-stream, text/plain, ''`).

**Unit:** share payload has no result keys; `mailto:` URL length ≤ 1,800.
**Playwright:** `26-share-race.spec` › `email share stays short` (stub `window.open`/`location`
to capture the mailto, assert length and that a download happened) and `import accepts
octet-stream` (set input file with that type → preview loads).

---

## Phase B — behaviour that doesn't match the spec

Playwright for this phase: `27-checkpoint-fixes.spec` and `28-base-fixes.spec`, one `test()` per item.

### Checkpoint
- **B1. Header shows callsign, nothing important truncated** (CP-01, CO-01, OV-01; spec §4.5,
  §4.6). Mark off subtitle: `England Creek Rd & Joyners Ridge Rd · VK4PMC` — allow two lines
  rather than an ellipsis. Callout: title "CP3 · Callout", subtitle `VK4PMC → VK4WIP · 147.225`.
  Overview: title "CP3 · Overview"; move "tap a runner…" hint into the list header. Test: callsign
  and frequency text are visible at 390px (`toBeInViewport`, not truncated — compare
  `scrollWidth <= clientWidth`).
- **B2. Share Batch pill covers tiles** (CP-01, CP-02, CP-13). Move it into the app bar as a
  labelled icon button with a count badge (`aria-label="Share batch, 5 runners"`). Test: tile 119
  is clickable at 390×844 with 5 runners passed.
- **B3. Status line scrolls out of view** (CP-16). Make the quick-entry bar and status line sticky
  under the app bar on Mark off. Test: scroll grid to bottom, tap a DNS tile → message visible.
- **B4. "Keep time" when the stepper returns to the original** (CP-09). Test: −5 then +5 → button
  reads "Keep time", "Was" note hidden.
- **B5. Overview bar colours** (OV-01; G8). Out segment: muted dashed for DNS, red only for DNF.
  aria-label: "20 called in, 0 passed not called in, 39 to come, 1 DNS, 0 DNF". Test: aria-label text.
- **B6. Overview stepper commits on every tap** (OV-06). Stepper changes a local value; a gold
  "Save HH:MM" appears in the open row when it differs (Passed now isn't shown in the same row, so
  still one gold). Save applies the A3 rule once. Test: −5 then +5 → nothing saved, no correction;
  −5, Save → saved, Undo restores exactly.

### Base
- **B7. Exact time input** (RX-02, RX-09, RX-10). Pin "Exact" outside the scrolling block row so
  it's always visible. Display the value as `HH:MM` even when typed `HHMM`. Invalid value → red
  border, error in the status line, field cleared, previous block stays selected (not shown as
  selected). Test: type `2359` → previous block still `aria-pressed="true"`, Exact not pressed.
- **B8. "Also in this call" count** (RX-06). Count only numbers that will be recorded (ok + info):
  `10:15 · 3`. Test: 6 chips incl. 3 flagged → pill shows 3.
- **B9. Complete with nothing recordable** (ST-11). Keep it enabled (rejected numbers must still be
  logged for the Unknown bibs check), but label it "Log call · 0" in the plain style, and the done
  card says "0 recorded · 2 skipped (flagged)". Test: label text and done card text.
- **B10. DNF / DNS chips and out list** (ST-04, ST-05). Rejected chips use `statusStyles` rejected
  (white, 2px red border, struck through) — same as Receive. Out-list rows go two-line on narrow
  panels so "CP1 · Medical · 11:15" is fully visible. Test: row detail not truncated at 1112×834.
- **B11. Withdrawal dialog restyle** (ST-12; G4). Design-system components, `BottomSheet`/dialog
  per §3.5, 24-hour en-AU date/time (no browser `datetime-local` in US format — use TimeStepper +
  date text), reasons = Injury, Self-withdrew, Cut-off, Medical, Other (map old values for existing
  records; log the mapping), comments and vet-out kept, red primary "Withdraw runner", plain Cancel.
  Replace the hidden `*` reverse syntax with the out-list Clear (keep the parser for existing
  users, but don't advertise it). Test: opens, shows `11:15` (not AM/PM), submits, appears in
  out list, Undo works.
- **B12. Reports Undo leaks across checks** (RP-11–RP-14). Clear the undo when switching sidebar
  items, and always label it ("Undo 106: Ask CP2"). Test: resolve in Out of order, switch to
  Skipped → no Undo button.
- **B13. Leaders with open data issues** (BO-01). Show a gold warning icon after the bib with
  `aria-label="Open data issue"` (out of order, impossible pace, seen after DNF/DNS, duplicate).
  Elapsed shows `HH:MM` (common times have no seconds). Test: 106 and 107 rows have the icon;
  after Mark checked on 107 the icon goes.

---

## Phase C — styling and palette

Playwright: `29-visual-checks.spec` (assertions on computed styles, plus screenshots for the guide).

- **C1. Disabled / locked buttons** use §3.4 locked style (band or white bg, dashed border, muted
  text, `disabled`, `cursor: not-allowed`) — Mark, Complete, Show full screen, At now, Add numbers
  to mark, read-out Next. Test: computed `border-style` is `dashed` on each.
- **C2. Off-palette colours.** Replace with club tokens:
  settings toggles (green → blue on / border off), race picker "Active" badge (green → blue tint),
  WebScorer template card (green border → blue), template tags (green/yellow → band/gold tint),
  import/scanner modal buttons (Tailwind blue → club blue `Button` variants), Exports report
  cards. Add a unit test that scans `src/**/*.jsx` for Tailwind `green-`, `emerald-`, `teal-`,
  `yellow-`, `amber-`, `indigo-` classes and fails (allow-list legacy unmounted files explicitly).
- **C3. Dark mode contrast** (SET-03; G6). "Reset to club colours" link, Called-in swatch (add a
  1px light outline on dark), muted labels and "Standard · 100%" ≥ 4.5:1. Test: axe-core
  (`@axe-core/playwright`) colour-contrast rule passes on Settings in Dark and on Mark off in Dark.
- **C4. Sunlight on the real screens.** Check Mark off, Callout, Read-out and Receive in Sunlight
  (white page, ink text, 2px borders). Fix anything that still uses paper backgrounds or 1px
  borders. Test: screenshots for the guide + computed `background-color` of `body` is white.
- **C5. Race setup at 390px** (SETUP-03, SETUP-02). Configured range row must not overflow
  (badge and delete button inside the card; delete has `aria-label`). Back/Next buttons: short
  labels ("Back", "Next: Waves") on one line. Test: `document.documentElement.scrollWidth <= 390`.
- **C6. Footer text.** "Ipswich & District Radio Club · VK4WIP" (not "VK4WIP Radio Club").
- **C7. Mt Glorious template** matches the WICEN brief: start 06:30, checkpoints/distances/
  operators from spec §10. Bib range: leave as is and note it — **DECISION**: Brandon to supply.

---

## Phase D — validation pack and test coverage

Update `scripts/ui-validation/build-validation-pdf.mjs`, then regenerate the PDF and `events.json`.

- **D1. Seed data.** The pack says 112 was seen at CP2, but it wasn't (RP-04), so "Seen later at
  CPx" was never shown. Seed a bib genuinely recorded at CP2 for ST-04. Seed a "skipped a
  checkpoint" runner whose bib isn't touched by the Receive events (RX-03 recorded 120 at CP1,
  which probably filled the seeded gap).
- **D2. Evidence, not page chrome.** "App showed" must capture the assertion relevant to the event
  (e.g. chip text and class, button label and `disabled`, computed border). Drop the generic
  modal text ("Settings… Clear database").
- **D3. Add events for everything not exercised:**
  - Receive: "Not seen CP2" info chip, Closed pill, exact time typed as `HH:MM`, draft survives
    tab switch.
  - DNF / DNS: "Already DNF", Clear on a DNS row, checkpoint-only DNF shows Clear disabled.
  - Data checks: Merge (identical duplicates), Remove CPx time, Clear DNS from a check, Keep for
    review, Print.
  - Read-out across two blocks (second block starts "Common time"), `overSize` 3.
  - Settings Cancel undoes the live theme preview; settings persist after reload.
  - Phone 390×844: Base Overview, DNF / DNS, Reports (stacked).
  - Accessibility: sheets trap focus and close on Escape; status lines are `aria-live="polite"`;
    overdue banner is `role="alert"`; Undo auto-dismisses after ~6 s.
  - All of Phase A–C.
- **D4.** Write each of D3 as a Playwright test too (`30-coverage-gaps.spec`), not just a PDF event.

---

## Phase E — radio procedure and user guide

Radio wording stays in `docs/radio-procedure.md`, never on screen.

- **E1. Corrections.** Add a "Corrections" section with a placeholder:
  "**Brandon to supply WICEN wording** for sending a corrected time and for base acknowledging it."
  Describe app behaviour only (same-block edits aren't corrections — A3).
- **E2. Official message fields** (CO-06). The WICEN brief requires sender, recipient, message
  number, date/time and the originator's signature. Add to the checkpoint sheet: Date (prefilled,
  en-AU), Originator (name/role, required), and "Signed by originator" checkbox. Keep it a local log.
  Add a read-only "Checkpoint log" list (currently only a count is shown — CO-08). Base-side log
  pad is out of scope; note it in DECISIONS.
- **E3. "Ask CPx" reminder** (RP-10). An "ask" resolution currently clears the issue with nothing
  to remind base. Show a gold note on that checkpoint's row in the Receive board and on its
  "Who's calling?" button ("Ask about 106"), cleared by a "Asked" button on the note (Undo). Add
  a user-guide line under "Base: receiving a call". Test in `28-base-fixes.spec` › `ask reminder`.
- Regenerate the guide (`make guide`) at the end.

---

## Done when

- Phases A–E committed separately on `feature/vk4wip-ui`.
- Unit and Playwright suites pass with no regressions; new specs 24–30 green; offline suite green.
- `DECISIONS.md` has a "Validation fixes" section, including D1 proposal and every default taken.
- `IMPLEMENTATION_REPORT.md` updated with a "Validation fixes" table (fix → commit → test).
- Validation PDF regenerated; guide regenerated.

## Decisions for Brandon (defaults used)

| # | Question | Default |
|---|---|---|
| D1 | How does base accept a checkpoint's corrected time, and what's the WICEN wording? | Not built — proposal only |
| D2 | What does "On course" mean on the Overview tile? | In the race, not finished (matches report), with "N not seen yet" |
| D3 | How long after a checkpoint's reported time before a runner counts as overdue? | 10 min |
| — | Mt Glorious template bib range | Unchanged until supplied |
