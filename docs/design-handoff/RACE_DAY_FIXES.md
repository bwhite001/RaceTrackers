# RaceTracker — race-day fixes before Mt Glorious (prompt for Claude Code)

Paste into Claude Code in `bwhite001/RaceTrackers`, or save as
`docs/design-handoff/RACE_DAY_FIXES.md` and say "work through RACE_DAY_FIXES.md".

---

## Context

3.17.0 is live (`main` at `02c186f`, tag `v3.17.0`). These fixes come from Brandon's answers to the
open items after the validation fixes. Mt Glorious is Sun 8 Nov 2026, so they need to be ready to
deploy well before then.

## Rules

- Read `CLAUDE.md`. Work on `feature/vk4wip-ui` (fast-forward it to `main` first). **Don't push or
  tag** — Brandon deploys after a dry run.
- Everything in `IMPLEMENTATION_SPEC.md` §2 (G1–G11) and `VALIDATION_FIXES.md` Rules still applies:
  bibs individual, 5-min blocks, no future times, 24-hour en-AU, Undo on destructive/bulk actions,
  ≥44px targets, club palette, one gold primary per screen, no emoji, `timeUtils`, module isolation
  (`checkpoint_runners` ↔ `base_station_runners` never crossed; checkpoints never write the shared
  `runners` table).
- Data safety: additive Dexie changes only (v12 if you need new tables/indexes), supersede never
  delete, exact Undo, audit-log every base edit.
- Every item gets unit tests for changed logic and a Playwright test. New specs continue from `31-`.
  Register chapters in `generate-guide.js`.
- One commit per part (A–E). After each, run the unit suite
  (`NODE_OPTIONS=--max-old-space-size=6144 make test-run`), the full Playwright suite (retries off)
  and `make test-offline`. No regressions against 122 passed / 16 failed / 11 skipped (the same 16
  pre-existing failures).
- Log every judgement call in `DECISIONS.md` under a new heading "Race-day fixes". Items marked
  **DECISION** have a default: build it and log it.

---

## Part A — corrections by radio (replaces D1)

**How WICEN does it (Brandon, 22 Oct 2026):** no formal procedure. A correction is radioed by ear
as its own call, one runner at a time: *"Checkpoint 01 correction, runner X, time is now Y."*
So base never needs to guess: a correction is always announced as one. The gold "Had HH:MM" chip
in a normal call stays a skip (no tap-to-replace), because without the word "correction" it's a
mistake.

### A1. Checkpoint — Corrections card
- Runners with `correction = true` leave the normal block cards and go in a new **Corrections**
  card above "Next call", one row per runner: `101 · now 10:55 · was 11:00`.
  - "now" = the new common time (5-min block), or the exact time if one was typed.
  - "was" = the time base last had (the time when it was called in; store it as
    `calledInTime`/`calledInBlock` on call-in if not already kept).
- The card has its own button **Base copied — correction sent** (secondary style, so the gold
  primary stays "Base copied — mark sent" when both cards show; if only corrections are pending,
  it's the gold primary). It sets `calledIn = true`, clears `correction`, updates
  `calledInTime/Block`, and offers Undo.
- "Base copied — mark sent" and Read-out no longer include corrections.
- **Not passed after call-in:** unmarking a runner who was called in (Mark off sheet or Overview
  "Reset — not passed") puts them on the Corrections card as `142 · not passed · was 11:00`.
  Correction sent clears it. Restoring the runner before it's sent removes the row. This is only
  for a tile tapped by mistake and then called in — rare. A runner the checkpoint *missed* is a
  different case, handled from base (Part E).
- A Correction never triggers the Call-due banner on its own; the Callout tab badge counts it.

### A2. Base — Correction mode on Receive
- After tapping a checkpoint, a **Correction** button sits beside the block picker. It switches
  the receive panel to correction mode (the call draft is kept and restored on Back).
- Correction mode: bib input + NumberPad → shows what base has at that checkpoint
  (`Had 11:00`, or `No earlier time`) → choose the new time with the BlockPicker / Exact →
  gold **Apply correction**. A **Not passed** option supersedes base's time with no replacement.
- Apply:
  - old `base_station_runners` row → `status: 'superseded'`, `supersededAt`,
    `supersedeReason: 'correction'`;
  - new row with a `callId`;
  - `radio_calls` row with `kind: 'correction'` (`{number, from, to}`);
  - audit-logged; Undo restores the exact previous rows.
- A correction never moves "up to" (same rule as validation fix A2) and doesn't reset "last call"
  Due timing — count it as a call for Due purposes.
- Validation in correction mode: bib not in field → warning "Not in setup" (see Part B), DNF/DNS →
  warning with the status shown, still allowed (base decides).
- Reports › Call log shows corrections per checkpoint. Needs attention ignores superseded rows
  (already does — keep a test).

### A3. Radio procedure
Replace the placeholder in `docs/radio-procedure.md` › Corrections with:

> **Corrections.** Sent as a separate call, one runner at a time, never mixed into a Scores call:
> "Checkpoint [n] correction, runner [bib], time is now [HH:MM]." Give the new common time
> (5-minute block) unless an exact time was recorded.
> - Checkpoint: corrections appear in their own card on the Callout sheet. Tap **Base copied —
>   correction sent** once base has it.
> - Base: tap the checkpoint, tap **Correction**, type the bib, check what base had, pick the new
>   time and tap **Apply correction**. Undo is available.
> - A time edit inside the same 5-minute block is not a correction and nothing needs to be sent.
> - A runner called in by mistake who never passed: "Checkpoint [n] correction, runner [bib],
>   not passed." Base uses **Not passed** in Correction mode.

Replace the D1 entry in `DECISIONS.md` with the built design.

**Tests:** unit — correction apply/undo, up-to unchanged, not-passed supersede, "was" time kept.
Playwright `31-corrections.spec`:
1. Checkpoint: call in 101 at 11:04, edit to 10:58 → Corrections card shows `101 · now 10:55 · was
   11:00`; Next call doesn't include it; Correction sent → card empty; Undo → back.
2. Checkpoint: unmark a called-in runner → `not passed` row.
3. Base: CP3 → Correction → 101 → "Had 11:00" → 10:55 → Apply → Times by checkpoint shows 10:55,
   old row superseded, board "up to" unchanged; Undo restores 11:00.
4. Base: normal call with 101 still shows "Had" and skips it.

---

## Part B — bibs can change on the day

**Brandon, 22 Oct 2026:** bib ranges change per event and may be dynamic on the day. Today an
unknown bib can't be recorded anywhere (checkpoint quick entry refuses it; base Receive rejects it
as "Not in race"). Real runners would vanish. **DECISION N2:** build a safety net that works
whether it's a few late changes or bibs only known at registration. The full base → checkpoint
"Field changes" broadcast (sharing spec §4.1b) is **not** part of this.

### B1. Checkpoint accepts bibs not in the setup
- Quick entry: a number not in this checkpoint's field is marked passed at now, gets a tile in the
  right group (create the group if needed), and is flagged **Not in setup** (small gold corner tag +
  aria-label). Status line: "512 marked at 07:47 · not in setup".
- Store it in `checkpoint_runners` with `notInSetup: true` and log it in a checkpoint-side
  `checkpoint_field_changes` table (`++id, [raceId+checkpointNumber+number], raceId,
  checkpointNumber, number, kind, loggedAt`; kind `'late'`, source `'checkpoint'`) — never the
  shared `runners` table.
- Still reject obvious typos: a number with more digits than any bib in the field (or > 9999) asks
  "Mark 51212? It isn't in the setup" with a confirm. Ranges are still refused (G1).
- Callout and Read-out treat these like any other runner (read individually).
- Undo removes the tile and the field-change row exactly.

### B2. Base accepts bibs not in the setup
- Receive: a number outside the field becomes a **warning** chip (white, 2px gold border) "Not in
  setup — tap to record", not a rejection. Tapping it turns it into an ok chip noted "Late entry".
  Untapped ones are skipped and stay in `radio_calls.rejected` as now.
- Recording one adds the bib to base's field in a base-side `field_changes` table
  (`++id, [raceId+number], raceId, number, kind, source, createdAt, cancelledAt`; kind `'late'`,
  source `'receive'`) — aligned with sharing spec §7 so the later Field changes feature reuses it.
  Base's field = setup runners + uncancelled late entries. Every count, check and report uses it.
- Same in DNF / DNS bulk add: "Not in setup" is a warning that can be accepted, not a rejection.
- Reports › Needs attention › Unknown bibs: add **Add to field** beside Remove / Keep for review.
- Audit-log each addition; Undo removes the field change and any rows recorded with it.

### B3. Race setup without a bib range
- Runner setup step: add a choice **Bibs assigned on the day** (checkbox). When on, zero runners is
  allowed and Next is enabled; the race stores `bibsOnTheDay: true`.
- Such a race: checkpoint grid starts empty with a one-line hint ("Type each number as runners
  pass"); "Still to come" and base "Not seen yet" show "—" instead of a number until the field has
  bibs; overdue logic skips runners not yet in the field.
- **Mt Glorious template:** remove the fixed 1–128 range. The template keeps course, checkpoints,
  operators, distances and radio details; setup asks for bibs (range, CSV/WebScorer, or Bibs
  assigned on the day).

**Tests:** unit — field = setup + late entries; typo guard; counts with `bibsOnTheDay`.
Playwright `32-dynamic-bibs.spec`:
1. Checkpoint: quick entry 512 (not in setup) → tile with Not in setup, on callout; Undo removes it.
2. Base: CP1 call with 512 → gold "Not in setup" → tap → recorded as Late entry; Times by checkpoint
   has 512; untapped 999 still in Unknown bibs; Add to field from Needs attention works.
3. Setup: Bibs assigned on the day → race created with 0 runners → checkpoint grid empty, quick
   entry creates tiles; base tiles show "—".
4. Mt Glorious template has no bib range.

---

## Part C — remove vet-out from the UI

**Brandon:** vet-out is only for horse races and isn't part of this project yet.

- DNF / DNS tab link: "Withdraw runner with comments…" (drop "or vet-out details").
- Withdrawal sheet: the Medical reason no longer relabels comments "Comments / vet notes".
- Out list: the disabled Clear tooltip no longer mentions vet-outs ("Recorded at a checkpoint —
  clear it there").
- Remove any other user-facing vet-out text (search `vet`, case-insensitive, in mounted files and
  the user guide).
- Keep `VetOutDialog` and the old vet-out code paths unmounted; note in `DECISIONS.md` that they're
  kept for a possible horse-race mode.

**Test:** `33-housekeeping.spec` › `no vet-out wording` — DNF / DNS tab, withdrawal sheet with
Medical chosen and the out list contain no "vet" text.

---

## Part D — housekeeping

- Delete the uncommitted `docs/racetracker-validation-fixes.md` (same text as
  `docs/design-handoff/VALIDATION_FIXES.md`).
- `IMPLEMENTATION_REPORT.md`:
  - header: say it's merged to `main` and released as 3.16.0 / 3.17.0, not "Not pushed; no PR";
  - Phase E rows: commit `e870f1f`, not "Phase E";
  - validation pack event count: make it match `DECISIONS.md` (148 vs 152 — check the PDF and fix
    whichever is wrong);
  - add a "Race-day fixes" table (item → commit → test) and close the open items: D1 built,
    bibs dynamic (Part B), vet-out removed.
- C2 follow-up: after the green → navy remap, check no screen relied on green vs blue meaning two
  different states (e.g. an "OK"/success indicator next to blue "passed"). Fix any you find and
  list what you checked in `DECISIONS.md`. Test: `33-housekeeping.spec` › `success and passed look
  different` for any case found (skip the test if none, and say so).
- Update the user guide: Corrections (Part A3), "A number that isn't in the setup" (Part B) for
  checkpoint and base, Missed runners and Stand-down check (Part E), and remove vet-out mentions. Regenerate (`make guide`).
- Bump `package.json` to 3.18.0 but **don't tag or push**.

---

## Part E — runners a checkpoint missed (base tells the checkpoint)

**How it happens (Brandon, 22 Oct 2026):** a checkpoint can't know it missed a runner. It only
comes out when base hears the runner at a later checkpoint, when the sweep reaches the checkpoint,
or when the checkpoint asks to pack down because it thinks it has everyone. Base needs to be the
one to say "213 came through CP2 but you don't have them at CP1".

### E1. Base — automatic "Missed at CPx" reminders
- When Receive records a number with the "Not seen CPx" info chip (previous checkpoint has no
  record), create a reminder for that earlier checkpoint automatically on Complete — no extra tap.
  Reuse the "Ask about" reminder from validation fix E3: gold note on that checkpoint's Who's
  calling button and board row, e.g. `Missed: 213, 218 (seen CP2)`. Every bib listed individually
  (G1).
- Also raise it for runners found by Reports › Needs attention › Skipped a checkpoint (same
  `issueKey`, so one reminder per bib + checkpoint, never two).
- When base taps that checkpoint (normal call or a quiet moment), the receive panel shows the
  missed list at the top with one button per bib after asking:
  - **They have it** → opens the normal block picker / Exact for that bib, so base records the
    time the checkpoint gives (a normal base row with `callId`, kind `'missed'` on the call).
  - **Not seen there** → resolves the reminder as `missed-confirmed` (no row written; Times by
    checkpoint shows `missed` in that cell, muted, not `—`).
  - Both audit-logged, both with exact Undo. The reminder disappears once resolved.
- If the checkpoint calls the bib in normally later, the reminder clears itself.
- Needs attention › Skipped a checkpoint counts only unresolved reminders.

### E2. Base — stand-down check
- On the board row and the receive panel header for each checkpoint: **Stand-down check**
  (plain button). It lists every runner still in the race and not recorded at that checkpoint,
  split into:
  - **Seen further on** (missed here) — bibs + where seen; one tap adds them to the missed list
    (E1);
  - **Not seen past here** — bibs + last checkpoint seen. These are the ones to account for before
    the checkpoint packs down.
  - DNS / DNF runners are excluded; a "Bibs assigned on the day" race shows "field not known" in
    place of the second list.
- A **Stand down** button (two-tap confirm, red outline on first tap) marks the checkpoint
  `closedAt` on base, sets its pill to Closed and is audit-logged with Undo. It never hides runners
  still listed under "Not seen past here"; they stay on Overdue / Still on course.

### E3. Checkpoint — "Missed — base says passed"
- Overview › a To come row gets **Missed — passed earlier** (plain button) beside Passed now.
  It marks the runner passed with `missedReport: true` at a time the operator sets with the
  TimeStepper (it starts at now; the operator steps it back to the time base gives, or their best
  estimate). It goes on the Callout sheet's
  Corrections card as `213 · missed · now 08:40` (no "was").
- No radio wording on screen.

### E4. Radio procedure
Add to `docs/radio-procedure.md`:

> **Missed runners.** A checkpoint can't know it missed someone. Base finds out when the runner is
> called in at a later checkpoint. Base gold notes "Missed: 213 (seen CP2)" on that checkpoint.
> - Base: next time that checkpoint calls (or call them), ask about each number; tap **They have
>   it** and enter the time they give, or **Not seen there**.
> - Before a checkpoint stands down, base opens **Stand-down check** for it and reads back any
>   numbers "Not seen past here". Stand the checkpoint down only when they're accounted for.
> - Checkpoint: if base tells you a runner came through, use **Missed — passed earlier** in
>   Overview.
> - **Wording to be confirmed by Brandon** for base asking a checkpoint about a missed runner.

**Tests:** unit — reminder created from a "Not seen" record and from the Skipped check without
duplicates; resolves on later normal call-in; stand-down lists split correctly, excluding DNS/DNF.
Playwright `34-missed-runners.spec`:
1. Base: CP1 has 213 missing, CP2 call includes 213 → Complete → CP1 button shows `Missed: 213
   (seen CP2)`; tap CP1 → **They have it** → 08:35 → recorded; reminder gone; Undo brings it back.
2. Same, **Not seen there** → Times by checkpoint CP1 cell reads `missed`; Skipped check count 0.
3. Stand-down check on CP2 with one runner seen at CP3 and one not seen past CP1 → both lists
   correct; Stand down two-tap → Closed pill; Undo reopens.
4. Checkpoint: Overview → 213 → Missed — passed earlier → set 08:35 → Corrections card shows
   `213 · missed · now 08:35`.

---

## Done when

- Parts A–E committed separately on `feature/vk4wip-ui`; nothing pushed or tagged.
- Unit, full Playwright and offline suites green with no regressions; specs 31–34 pass.
- `DECISIONS.md` › "Race-day fixes" lists N1/N2 defaults and every judgement call.
- Report back with commits, test results and anything needing Brandon.

## Decisions for Brandon (defaults used)

| # | Question | Default |
|---|---|---|
| N1 | Wording for a runner called in by mistake | "Checkpoint [n] correction, runner [bib], not passed" (same shape as a time correction) |
| N3 | Wording for base asking a checkpoint about a missed runner | Guide says "wording to be confirmed" |
| N4 | Should missed reminders be raised automatically? | Yes, from every "Not seen CPx" record and the Skipped check |
| N2 | A few late bib changes, or bibs only known at registration? | Safety net covers both; full Field changes broadcast not built |
