# RaceTracker Pro — VK4WIP UI redesign: implementation spec

Status: approved design, ready to build. Design sources: `design/screens/*.dc.html`.
Target repo: `bwhite001/RaceTrackers` (React 18, Vite, Tailwind, Zustand, Dexie v10, PWA).
Owner: Brandon White VK4BRW. Club: Ipswich & District Radio Club, Inc. (VK4WIP).

---

## 1. Goals

1. Restyle the whole app on the VK4WIP brand (navy / blue / gold / red, Montserrat + Inter).
2. Make checkpoint work safe and fast on a **phone**, one-handed, in sunlight.
3. Rebuild base station as a **receive** workflow — the inverse of a checkpoint read-out — that works on **tablet (primary), phone and desktop** without being tall.
4. Follow the WICEN radio procedure (see `reference/` PDF): Scores Checkpoint calls, common times in 5-minute blocks, every number read individually.
5. Let anyone fix mistakes: undo everywhere, edit times, restore accidental unmarks, base-controlled DNF/DNS, and data-check reports.

Non-goals: real-time device sync, RFID, new auth. Radio phrases are **not** shown in the UI (they live in `docs/radio-procedure.md` for the user guide).

---

## 2. Global rules (apply everywhere)

| # | Rule |
|---|---|
| G1 | **Every bib is handled individually.** Never collapse numbers into ranges ("144 to 148") in call-out, read-out, base receive, or previews. Ranges are only accepted in *Race setup* to define the field. |
| G2 | **Common times are 5-minute blocks** (07:40, 07:45 …) unless an operator types an exact time. Block = `floor(minutes / 5) * 5`. |
| G3 | **Times are never in the future** and never before race start. Base is often 45–60 min behind, so past blocks must be one tap away. |
| G4 | **24-hour times** (`07:45`), Australian English, en-AU dates. |
| G5 | **Undo** after every destructive or bulk action (snackbar/inline Undo). Two-tap confirm for "Cancel call" when it would discard data. |
| G6 | Touch targets ≥ 44px (primary actions 48–56px). Real `<button>`/`<input>`/`<label>`; icon-only buttons need `aria-label`. Text contrast ≥ 4.5:1. |
| G7 | **Status colours stay inside the club palette and differ by lightness/border, not hue alone** (see §3.3). Users may still recolour in Settings. |
| G8 | One gold primary action per screen. Red only for DNF / destructive / safety alerts. |
| G9 | No emoji in UI (replace existing ones, e.g. 📝 📋 🏃 in base views). Use line icons (Heroicons outline is already a dependency). |
| G10 | Use `src/services/timeUtils.js` for all time maths; store ISO strings. The designs use a fixed demo clock of 07:47 — replace with real now. |
| G11 | Respect module isolation (CLAUDE.md): checkpoint code only touches `checkpoint_runners`; base only `base_station_runners` + base tables. |

---

## 3. Design system

### 3.1 Tokens (`design-tokens/`)

Replace the Tailwind-default navy/red/gold in `tailwind.config.js` and the CSS variables in `src/index.css` with the values in `design-tokens/tailwind.vk4wip.js` and `design-tokens/tokens.css`. Keep existing class names working by aliasing (`primary-*`, `navy-*`, `accent-red-*`, `accent-gold-*`, `gold-*`) — see the comments in that file.

| Token | Hex | Use |
|---|---|---|
| navy | `#0B2D53` | App bars, headings, "called in" state, selected chips |
| blue | `#1E5CB3` | "Passed" state, links, focus rings, secondary buttons, info |
| gold | `#D4AF37` | Primary button (ink text), "call due", pending/needs-attention, active-tab underline |
| red | `#CC0000` | DNF, destructive actions, overdue/safety alerts only |
| ink | `#222A35` | Body text; text on gold |
| muted | `#5A6579` | Secondary text (do **not** lighten — contrast) |
| paper | `#F7F8FB` | Page background |
| band | `#EEF3FA` | Panels, selected rows, segmented-control track |
| border | `#E0E6F0` | Card / divider borders |
| surface-alt | `#E9F2FF` | Light text on navy |
| Tints | `rgba(30,92,179,.1)` blue · `rgba(212,175,55,.1)` gold · `rgba(204,0,0,.1)` red | Backgrounds for states |

Radii: 6 (chips), 10 (buttons, inputs, tiles), 12 (cards), 14 (sheets), 9999 (pills/badges). Shadows: `0 2px 10px rgba(0,0,0,.08)` (buttons/cards), `0 10px 30px rgba(0,0,0,.18)` (sheets/toasts).

### 3.2 Typography

- **Montserrat** 600/700/800 — headings, bib numbers, button labels, big times. Bib numbers use `font-variant-numeric: tabular-nums`.
- **Inter** 400–700 — body, labels, tables.
- Load both via the PWA (self-host or Google Fonts with `display=swap`; precache in the service worker so they work offline — bump the PWA version per CLAUDE.md).
- Keep the existing `--font-scale` setting; all sizes scale with it.

### 3.3 Runner state styles (single source of truth — put in a `statusStyles.js` helper)

| State | Tile / chip | Label |
|---|---|---|
| Not passed | white, 1px border `#E0E6F0` | — |
| Passed (not called in) | solid blue, white text | time `07:44` |
| Passed, edited after call-in | solid blue + `✎` prefix on time | "Correction" chip in lists |
| Called in | solid navy, white text | `✓ 07:31` (gold tick) |
| Unmarked earlier (restorable) | white, **2px dashed blue** | `was 07:37` |
| DNS | paper bg, **1px dashed muted**, number struck through | `DNS` |
| DNF | red tint, **2px red border**, red text | `DNF` |
| Base check: OK | solid blue | — |
| Base check: info (e.g. not seen at previous CP) | solid blue + 2px navy border | note |
| Base check: warning (duplicate / already logged) | white, 2px gold border | note |
| Base check: rejected (not in race / out) | white, 2px red border, struck through | note |

### 3.4 Buttons

Montserrat 800, uppercase, letter-spacing .6px, radius 10, min-height 48.
- **Primary**: gold bg, ink text, shadow. One per screen.
- **Secondary**: transparent, 2px blue border, blue text.
- **Neutral solid**: blue bg, white text (Add, Next block).
- **Plain**: white, 1px muted border, ink text.
- **Destructive**: red bg white text (Mark DNF) or red outline (Cancel call, first tap).
- **Disabled/locked**: white or band bg, dashed border, muted text, `cursor: not-allowed`, `disabled` attribute.

### 3.5 Shared shell components (build first, Phase 0)

| Component | Spec | Design ref |
|---|---|---|
| `AppBar` | Navy bar. Phone: back button (44px), title (Montserrat 700 18px), subtitle (12px `#E9F2FF`), right "Saved" status (8px gold dot). Base: badge (32px white circle with `public/pwa-512x512.png`), "Base · VK4WIP", "147.225 · now HH:MM", inline tabs, single row on tablet. | all |
| `CheckpointTabBar` | Bottom nav, 72px, 3 tabs (Mark off, Callout, Overview), line icons, active = navy text + 3px gold top border, `aria-current="page"`. Callout tab shows a gold count badge = runners passed but not called in. | `CpMarkOff` |
| `BaseTabs` | Inline in AppBar: Receive · Overview · DNF / DNS · Reports. Active = white bold + 3px gold underline. Horizontally scrollable on phone. | `BaseEntry` |
| `StatTile` | Small tiles with Montserrat 800 number + 11px label. Gold variant for "To call in". | `CpMarkOff` |
| `UndoBar` | Dark ink pill above tab bar or inline status line with an Undo button (gold or ink). Auto-dismiss ~6s, cleared by the next action. | `CpMarkOff`, `BaseEntry` |
| `BottomSheet` | Navy 55% scrim, white sheet radius 14 top, `role="dialog"`, closes on scrim tap / Cancel. | `CpMarkOff` |
| `TimeStepper` | −5 / −1 / big time / +1 / +5. Clamp to [race start, now]. | `CpMarkOff`, `CpOverview` |
| `BlockPicker` | Horizontally scrolling row of 5-minute block buttons (64×48), labels `done` / `next` / `this call`, selected = navy; plus an "Exact" time input at the end (dashed when unused, navy when set). | `BaseEntry` |
| `NumberPad` | 3×4 grid: 1–9, ⌫, 0, Add (blue). 46–52px keys. Always paired with a real numeric `<input>` that also accepts keyboard + Enter. | `BaseEntry` |
| `BibChip` | Number (Montserrat 800 18–20px) + optional 10–11px note; style per §3.3; tap = remove (with Undo). | `BaseEntry` |

---

## 4. Screens

Each section: route → component(s) → layout → behaviour → data. Design file in brackets.

### 4.1 Home / role picker  [`Home.dc.html`]
Route `/` → `components/Home/Homepage.jsx`.
- Navy header: badge, "RaceTracker", "Ipswich & District Radio Club · VK4WIP", "Offline ready" status. Current race card (name, date, checkpoint count, start time).
- Three role cards (≥76px): **Checkpoint**, **Base station**, **Race setup** — icon tile, title, one-line description, chevron. Navigation protection unchanged.
- Primary button at bottom: **Scan race QR code** (existing import flow).
- Footer lockup: "Ipswich & District Radio Club · VK4WIP".

### 4.2 Race setup  [`RaceSetup.dc.html`]
Route `/race-maintenance/setup` → `components/Setup/RaceSetup.jsx`. Restyle only; keep the 4-step wizard.
- Navy header with step "Step 3 of 4 · Runners" and a 4-segment gold progress bar.
- Runner ranges input (ranges allowed **here only**), live count ("250 runners will be created") and first/last preview chips.
- Link to CSV / WebScorer import. Back (secondary) + Next (primary).

### 4.3 Share config  [`ShareConfig.dc.html`]
Existing QR export: large QR in a white card with shadow, runner/checkpoint count; Download / Email / Copy tiles; primary "Show full screen" (`QRDisplayFullscreen`). Note "Works without internet — device to device".

### 4.4 Settings  [`Settings.dc.html`]
`components/Settings/SettingsModal.jsx` (may become a page on phone). Sections: Display (Theme segmented: Light / Dark / Sunlight; text-size slider), Status colours (rows with swatch, name, description; "Reset to club colours"), Race data (Share or import race config).
- **Sunlight** = new high-contrast theme option (pure white bg, ink text, thicker borders). Optional for v1 — if skipped, show Light/Dark only.

### 4.5 Checkpoint — Mark off  [`CpMarkOff.dc.html`] (interactive)
Route `/checkpoint/:checkpointId` → `views/CheckpointView.jsx` + `components/Checkpoint/RunnerGrid.jsx`, `QuickEntryBar.jsx`.

Layout (390px phone): AppBar (checkpoint number, location + operator callsign) with 3 StatTiles (Passed, Still to come, **To call in** gold) → quick-entry input + gold **Mark** → status line (aria-live) → group chips (20 per group: 100–119 …, horizontally scrolling) → 4-column tile grid (64px rows) → CheckpointTabBar.

Behaviour:
1. **Tap a not-passed tile** → mark passed at now (actualTime = now, commonTime = block).
2. **Tap a passed or called-in tile** → opens the **Edit sheet** (never unmarks directly — this replaces the current tap-again-to-unmark / double-click behaviour).
3. **Edit sheet**: bib, status line ("Passed · not called in yet" / "Called in to base"), "Marked at HH:MM". TimeStepper (clamped). Primary **Save HH:MM** (or "Keep time" if unchanged). Secondary **Unmark runner**. Cancel.
   - If the runner was **called in** and the time changes → warning box "Base already has 07:31. A changed time goes back on the callout sheet as a correction." Saving sets status back to passed with `correction = true` so it reappears on the callout sheet; tile shows `✎`.
4. **Unmark** → tile becomes "unmarked earlier" (dashed blue, `was HH:MM`) and an UndoBar "142 unmarked · Undo" appears. Undo restores the original record exactly.
5. **Tap an unmarked-earlier tile** → sheet in restore mode: "Unmarked earlier · It had been marked at 07:37", TimeStepper preset to the original, primary **Mark at 07:37**, secondary **Use now (HH:MM)**.
6. Quick entry accepts multiple numbers separated by commas/spaces (individual numbers only), marks each at now, jumps the grid to the group of the first number, message "3 runners marked at 07:47".
7. DNS/DNF tiles are not editable here (use Overview).

Data (`checkpoint_runners`): add `originalTime` (first mark), `editedAt`, `correction` (bool), `unmarkedAt` + `unmarkedTime` (for restore). See §5.

### 4.6 Checkpoint — Callout sheet  [`CpCallout.dc.html`]
`components/Checkpoint/CalloutSheet.jsx`.
- AppBar subtitle: `CP3 · VK4PMC → VK4WIP · 147.225` (checkpoint, operator callsign, base callsign, frequency — from race config; hide pieces that aren't configured).
- **Call-due banner** (gold) when either: ≥ 5 runners waiting, or the oldest uncalled runner is ≥ 5 min old (configurable; WICEN brief: every 5–10 competitors, ≤ ~5 min delay). Text: "Call due — 9 waiting, oldest 6 min".
- Called-in blocks collapse to one compact row (navy tick, `07:30 – 07:35 · 4`, numbers, "Sent 07:36").
- **Next call card** (gold border, gold tint): heading "Next call · 2 blocks", badge "9 competitors", then one white card per pending block: `Common time 07:40 · 5` + the numbers in Montserrat 800 22px separated by ` · `.
- Buttons: **Read out** (secondary, opens 4.7) + **Base copied — mark sent** (primary) → marks every runner in the pending blocks `calledIn = true`, `callInTime = now`.
- Below: **Official message** and **Request stand down** (plain buttons; v1 can open a simple notes modal / log entry).
- Corrections (runners with `correction = true`) appear in the pending list tagged "Correction".
- **No radio phrases on screen.**

### 4.7 Checkpoint — Read-out mode (busy blocks)  [`CpReadout.dc.html`] (interactive)
New view, e.g. `modules/checkpoint-operations/components/ReadOutView.jsx`, opened from Callout.
- Header: "Read-out", `CP3 · block 07:45–07:50 · 27 competitors`, progress "X of N copied by base", segmented progress bar (one segment per over: gold = done, white = current, faint = to come).
- Numbers are split into **overs of up to 5 numbers** (`overSize` setting, default 5, range 3–10). **Each bib is its own row** (G1).
- Current over card: lead line `Common time 07:45` (first over) / `Continuing 07:45` (later overs); one row per number with a **checkbox** (28px, whole row is the label, ≥56px tall). The **next unticked** row is highlighted (band bg + 2px blue border + "Read next"); ticked rows go muted with strike-through.
- Primary **Base copied — next** is **locked until every number in the over is ticked** (shows "Tick each number as you read · 2 of 5").
- **Reset** (secondary) clears ticks on the current over. **Previous over** steps back.
- Finishing the last over → done state "All 27 copied", which marks the block called in.
- Persist read-out progress so an interrupted read resumes at the same over.

### 4.8 Checkpoint — Overview (fix anything)  [`CpOverview.dc.html`] (interactive)
Existing overview tab.
- Header: % through, "142 of 250 through", stacked bar (called in / passed not called / to come / out), `role="img"` with aria-label.
- 4 StatTiles: Passed, To come, DNS, DNF. Filter pills: All · Passed · To come · DNS / DNF.
- Scrollable runner list; **tap a row to expand** (one open at a time, `aria-expanded`). Actions by status:

| Status | Actions |
|---|---|
| Called in | TimeStepper, **Undo call-in**, **Reset — not passed**, **Mark DNF** (+ note "Base already has HH:MM. Changing the time sends a correction.") |
| Passed | TimeStepper, **Mark called in**, **Reset — not passed**, **Mark DNF** |
| To come | **Passed now (HH:MM)** (gold), **Mark DNS**, **Mark DNF** |
| DNS / DNF | **Clear DNS/DNF**, **Passed now** (+ note that base is flagged) |

- Changing the time of a called-in runner → status passed + `correction = true`.
- Every action shows UndoBar; totals, bar and the Callout badge update live.

### 4.9 Base — Receive  [`BaseEntry.dc.html`, tablet `BaseEntryTablet.dc.html`, phone `BaseEntryPhone.dc.html`] (interactive)
Route `/base-station/operations`, tab **Receive** → replaces `DataEntry` / `BatchEntryLayout` UI in `modules/base-operations`. **One responsive component** — no separate tablet/phone builds.

Layout: AppBar + BaseTabs (single row on tablet). Main = flex-wrap: receive panel (`flex: 999 1 480px`) + checkpoint board (`flex: 1 1 260px`). Tablet landscape (1112×834) and desktop: side by side, **must fit in 834px height without page scroll**. Phone: stacks, receive panel first.

**Idle — "Who's calling?"**: grid (`auto-fill, minmax(140px,1fr)`) of compact buttons (≥64px) for Start, CP1–CP4, Finish: short name, status pill (Due gold / OK / Closed), `VK4PMC · up to 07:15`. "Due" = runners expected and no call for ≥ 8 min (constant `CALL_DUE_MINUTES = 8`, configurable).

**Tap a checkpoint → straight into receiving** (no separate acknowledge step):
- Header row: CP short name, operator · location, "N to record".
- **BlockPicker** from `lastBlock − 5` to the current block. Default selection = **that checkpoint's next unreceived block** (`lastBlock + 5`, capped at now) — base is usually behind. Chips: `done` (≤ lastBlock, muted), `next`, `this call` (has numbers in this call, blue border), selected = navy. "Exact" input accepts `HH:MM` or `HHMM` between race start and now; sets a non-block time and shows it selected.
- **Numbers box** (scrolls internally, max ~210px): shows **only the current block's numbers**. Switching block clears the box and the typed number (nothing is lost). Other blocks in the call show underneath as pills: "Also in this call: 07:40 · 5" — tap to switch back.
- Input + **Add** + NumberPad side by side (pad `flex: 0 1 220px`). Enter adds. Each added number becomes a BibChip validated live:

| Check | Kind | Note |
|---|---|---|
| Not in race range | rejected (red) | "Not in race" |
| Marked DNF / DNS | rejected | "DNF" / "DNS" |
| Same bib earlier in this call | warning (gold) | "Said twice" |
| Already logged at this checkpoint | warning | "Had 07:40" |
| Not logged at previous checkpoint | info (navy border) | "Not seen CP2" |
| Otherwise | ok (blue) | — |

  Only **ok + info** are recorded. Tap a chip to remove (Undo).
- Status line (aria-live) + inline **Undo** when available.
- **Action row** (`repeat(auto-fit, minmax(110px,1fr))`):
  - **Cancel call** — red outline; if numbers exist, first tap turns solid red "Tap again to cancel" and says how many will be dropped.
  - **Clear 07:40** — clears all numbers in the current block (Undo).
  - **Next 07:45 →** — move to the next 5-minute block, clear the box; disabled "At now" at the current block.
  - **Complete · N** — gold primary; records the call.
- **Complete** → writes base_station_runners (`commonTime` = each number's block, `markOffEntryTime` = now, `checkpointNumber`), writes a `radio_calls` record, updates the board (count, last call = now, `lastBlock` = max block received). Done card: "N recorded at CP3", "Blocks 07:40, 07:45 · 2 skipped (flagged)", **Undo** (reopens the call, reverts writes) and **Next call**.
- **Checkpoint board**: rows with short name, "Up to 07:15 · 30 min behind · call 11m ago", count, Due/OK/Closed pill; active checkpoint row gold-tinted. "behind" shown when ≥ 15 min.

### 4.10 Base — Overview  [`BaseOverview.dc.html`]
Existing overview tab restyled: red overdue alert banner (`role="alert"`, "View runners" → Reports › Overdue), stat tiles (On course, Finished, DNS, DNF), checkpoint progress bars (navy = closed out, blue = arriving, gold = finish), leaderboard table with filter pills (All, Female, Male, Wave 1…), gold rank badge for #1, overflow-x box on phone.

### 4.11 Base — DNF / DNS  [`BaseStatus.dc.html`] (interactive)
Tab **DNF / DNS** → evolves `BulkDnsView.jsx` + `WithdrawalDialog.jsx`. Base is the authority for race-wide DNF/DNS.
- **Bulk add** panel: DNF/DNS segmented toggle (DNF active = red). DNF shows **Where** pills (CP1–CP4, On course), **Reason** pills (Injury, Self-withdrew, Cut-off, Medical, Other — optional, tap again to unset), **Time** (−5/+5, clamped). DNS shows a one-line explainer.
- Input accepts **one number or a pasted list** (`212, 218 224` — commas, spaces, semicolons, newlines). Chips validated:

| Check | Kind | Note |
|---|---|---|
| Not in race / listed twice | rejected | "Not in race" / "Listed twice" |
| Already this status | rejected | "Already DNF" |
| Currently the other status | warning | "Was DNS — will change" |
| DNS but recorded at a checkpoint | warning | "Seen CP2 — started" |
| DNF at CPx but seen at a later CP | warning | "Seen later at CP3" |

- **Clear list** + primary **Mark 6 as DNF** (red for DNF, gold for DNS; disabled when 0). Undo.
- **Out of the race** panel: totals "3 DNS · 3 DNF", filter pills, rows (bib, status chip, "CP2 · Injury · 07:12" / "Did not start", **Clear** → back in race, Undo).
- DNF writes `withdrawal_records` (checkpoint, withdrawalTime, reason) + runner status; DNS sets runner status `non-starter`. Audit-log every change.
- Open question for Brandon (default shown): checkpoint-marked DNFs count immediately; a future "confirm" queue is out of scope.

### 4.12 Base — Reports & data checks  [`BaseReports.dc.html`] (interactive)
Tab **Reports** → evolves `ReportsPanel.jsx`, `ReportBuilder.jsx`, `DuplicateEntriesDialog.jsx`, `MissingNumbersList.jsx`.
Layout: sidebar (`flex: 1 1 250px`) + report panel (`flex: 999 1 520px`); stacks on phone.

**Reports** (CSV + Print buttons; reuse existing export utilities):
| Report | Content |
|---|---|
| Overdue runners | Bib, last seen (CP + time), expected at, overdue minutes (gold badge; red ≥ 60). Expected time = last seen + typical split for that leg (median of recorded splits). |
| Still on course | Not finished and not out, grouped by last checkpoint passed (tiles). For sweep / stand-down. |
| Times by checkpoint | Matrix bib × CP1…Finish (common times; DNF/DNS shown in place). |
| Call log | Per checkpoint: calls received, numbers, last call time, up to (lastBlock). From `radio_calls`. |

**Needs attention** (sidebar group with total gold badge; each item red count badge or ✓). Each issue row: bib, headline, detail, 1–2 action buttons; resolving removes it (Undo).

| Check | Detection | Actions |
|---|---|---|
| Duplicates | same bib, same checkpoint, >1 base record (different or same time) | Keep A / Keep B (or Merge if identical) |
| Out of order | time at CP(n+1) < time at CP(n) | Ask CPx (flag for radio check) / Mark checked |
| Skipped a checkpoint | has later CP time, missing an earlier CP | Ask CPx / Mark checked |
| Seen after DNF / DNS | checkpoint time after DNF time, or any time while DNS | Clear DNF/DNS / Remove that time |
| Unknown bibs | numbers outside the race reported in calls (keep them in `radio_calls.rejected`) | Remove / Keep for review |
| Impossible pace | split speed above a threshold (default > 20 km/h; checkpoint distances from race config, e.g. CP1 5 km, CP2 11 km, CP3 14.5 km, CP4 17.5 km) | Ask CPx / Mark checked |

Resolutions persist in a new `data_issue_resolutions` table so resolved items don't reappear; "Mark checked" = acknowledged, data unchanged.

---

## 5. Data model changes (Dexie v11 — additive)

Add `this.version(11).stores({...})`, keeping v10 tables. New indexed fields only where queried; others are data columns.

```js
this.version(11).stores({
  checkpoint_runners: "++id, [raceId+checkpointNumber+number], raceId, checkpointNumber, number, actualTime, commonTime, calledIn, markOffTime, callInTime, status, notes, correction",
  base_station_runners: "++id, [raceId+checkpointNumber+number], raceId, checkpointNumber, number, commonTime, markOffEntryTime, status, notes, callId",
  radio_calls: "++id, [raceId+checkpointNumber], raceId, checkpointNumber, receivedAt, undoneAt",
  data_issue_resolutions: "++id, [raceId+issueKey], raceId, issueKey, resolvedAt",
  readout_progress: "++id, [raceId+checkpointNumber+blockTime], raceId, checkpointNumber, blockTime",
});
```

| Table / field | Purpose |
|---|---|
| `checkpoint_runners.originalTime` | first marked time (restore) |
| `.editedAt`, `.correction` | time changed after call-in → resend |
| `.unmarkedAt`, `.unmarkedTime` | "was HH:MM" restore after accidental unmark |
| `base_station_runners.callId` | link to `radio_calls`; Undo call deletes by callId |
| `.manualTime` (bool) | exact time, not a 5-min block |
| `radio_calls` | `{raceId, checkpointNumber, receivedAt, blocks:[{time, numbers[]}], recorded, skipped:[{number, reason}], rejected:[…], undoneAt}` |
| `checkpoints` data columns | `operatorCallsigns[]`, `distanceKm`, `locationName` (Receive board, pace check) |
| `races` data columns | `baseCallsign` (VK4WIP), `frequency` (147.225), `callDueMinutes`, `overSize` |
| `withdrawal_records.reason` | DNF reason (Injury, Self-withdrew, Cut-off, Medical, Other) |
| `data_issue_resolutions` | `{issueKey: "dup:142:3", resolution, resolvedAt}` |
| `readout_progress` | `{tickedNumbers[], overIndex}` for resuming a read-out |

Never cross `checkpoint_runners` ↔ `base_station_runners` (G11). Audit-log all base edits (`audit_log`).

---

## 6. State & logic notes

- Put pure logic in testable services:
  - `services/blocks.js`: `toBlock(t)`, `blocksBetween(from, to)`, `nextBlock(t, now)`, `clampTime(t, raceStart, now)`.
  - `services/receiveValidation.js`: `checkBaseNumber(num, ctx)` → `{kind: ok|info|warn|bad, note}` per §4.9 table.
  - `services/statusValidation.js`: DNF/DNS checks per §4.11.
  - `services/dataChecks.js`: one function per check in §4.12, each returning issues with stable `issueKey`s.
  - `services/readout.js`: `splitIntoOvers(numbers, overSize)` — **no range collapsing**.
  - `services/callout.js`: `isCallDue({waiting, oldestMinutes}, settings)`.
- Base receive call state can live in `baseOperationsStore` as a draft (survives tab switches, cleared on Complete/Cancel).
- Undo: keep a single-level snapshot per screen (`undoSnapshot`), cleared by the next action.

---

## 7. Accessibility checklist

- All interactive elements are native buttons/inputs; tab bar uses `nav` + `aria-current`.
- Sheets: `role="dialog"`, labelled, focus trapped, Escape closes.
- Live regions for status lines (`aria-live="polite"`) and alerts (`role="alert"`).
- Checkbox rows in Read-out are `<label>` wrapping a real checkbox.
- Progress bars expose an aria-label with the counts.
- States never rely on colour alone (borders, strike-through, text labels).

---

## 8. Testing (required by CLAUDE.md)

Unit (Vitest): blocks, receive validation, status validation, each data check, `splitIntoOvers` (assert never produces ranges), call-due logic, restore-after-unmark, correction flag.

Playwright journeys (add to `test/e2e/playwright/`, register in `generate-guide.js` `SECTION_MAP` / `CHAPTERS`, regenerate the guide):
1. `checkpoint-edit-time` — mark, open sheet, change time, save; unmark + Undo; unmark, later restore original time.
2. `checkpoint-correction` — called-in runner time edited → appears on callout as correction.
3. `checkpoint-readout` — 12 waiting runners → read-out with 3 overs; next locked until all ticked; Reset clears ticks.
4. `checkpoint-overview-fix` — undo call-in, reset to not passed, mark DNS, clear DNS, each with Undo.
5. `base-receive-blocks` — pick behind checkpoint, default block = next unreceived; add 5, Next block, add 5; switch back via "Also in this call"; Complete; board updates; Undo call.
6. `base-receive-validation` — unknown bib, duplicate, already logged, not seen at previous CP → correct chip states and only valid numbers recorded.
7. `base-receive-actions` — Clear block + Undo; Cancel call two-tap.
8. `base-bulk-dnf` — paste list, warnings shown, apply, clear one, Undo.
9. `base-reports-checks` — seed a duplicate and an out-of-order time; resolve both; counts reach ✓.
10. Viewports: run 5 at 1112×834 (tablet landscape — assert no vertical page scroll on Receive) and 390×844.

---

## 9. Phases

| Phase | Scope | Done when |
|---|---|---|
| 0 | Tokens (`design-tokens/`), fonts, `statusStyles.js`, AppBar, CheckpointTabBar, BaseTabs, UndoBar, BottomSheet, TimeStepper, BlockPicker, NumberPad, BibChip; remove emoji | Existing screens render in new palette; tests green |
| 1 | Home, Race setup, Share config, Settings restyle | Matches designs |
| 2 | Mark off (edit sheet, undo, restore) + Overview (fix anything); v11 checkpoint fields | Journeys 1, 2, 4 |
| 3 | Callout sheet + Read-out | Journey 3 |
| 4 | Base Receive + `radio_calls` + board | Journeys 5–7, tablet height check |
| 5 | DNF / DNS bulk + Base overview restyle | Journey 8 |
| 6 | Reports + data checks + resolutions | Journey 9; user guide regenerated |

---

## 10. Sample data (for seeds / demos only)

From the WICEN brief (`reference/`): Mt Glorious Mountain Trails, Sun 8 Nov 2026, start 06:30, base VK4WIP on 147.225 MHz (+0.6, CTCSS 91.5), simplex fallback 147.500.
| CP | Location | Operators | Distance |
|---|---|---|---|
| Start | White Cedar Picnic Area | VK4BRW | 0 km |
| CP1 | Northbrook Bush Camp | VK4MUD, VK4MKD, VK4EAR | 5 km |
| CP2 | England Creek Bush Camp | VK4IE, VK4TBA | 11 km |
| CP3 | England Creek Rd & Joyners Ridge Rd | VK4PMC, VK4JBX | 14.5 km |
| CP4 | Near Apiary Site, Joyners Ridge Rd | VK4AJG, VK4DTB | 17.5 km |
| Finish | Maiala Picnic Area | VK4GJW, VK4ENE, VK4NNA | 22 km |

Runner counts and bib numbers in the designs are illustrative.
