# Mt Glorious dress rehearsal — bug report

Run 1 Nov 2026 on `feature/vk4wip-ui` (3.18.0, production build), for the race on Sun 8 Nov 2026.

**Verdict: race-day operation is sound; post-race reporting on the base device is not.** Setup,
checkpoint marking, radio calls, corrections, DNS/DNF and stand-down all worked, and base finished
with every time correct. But 6 of the 9 result outputs tested on base are empty, wrong or do
nothing, including the file a coordinator would most likely send to TRAQ.

**On race day, use Reports › Times by checkpoint › CSV.** It was checked cell by cell and is correct.

**Update, 3.18.1:** all 13 bugs are fixed (see "Status" below) and the rehearsal now fails on any
finding. It ends with 0 findings.

## How it was run

`test/e2e/playwright/35-mt-glorious-dress-rehearsal.spec.js`, about 2.5 minutes:

```bash
make build
npx playwright test test/e2e/playwright/35-mt-glorious-dress-rehearsal.spec.js --workers=1
```

- **Setup:** the real wizard and Mt Glorious template, 8 Nov 2026, 06:30 start, then the roster
  imported from `MGMT NOV25.xlsx`.
- **Stations:** five isolated browsers: base (tablet size) and CP1–4 (phone size). The setup file
  was the only thing passed between them. Each radio call was read off the checkpoint's Callout
  screen and typed into base, 45 calls in all.
- **Clock:** each device ran on a controlled race-day clock from 06:30 to 10:30.
- **Race data:** the real 2025 field and times: 128 bibs, 7 DNS, 1 withdrawal, 483 checkpoint passes.

Three things in the run are not 2025 fact:

| What | Why |
|---|---|
| All times moved 30 minutes earlier | 2025 started at 07:00, 2026 starts at 06:30 |
| Finish times are invented from each runner's CP3→CP4 pace | The sheet has no finish column |
| Bib 92 at CP2 corrected to 07:30 | Assumes the sheet's 8.40 was a typo for 8.00 |

The invoice PDF held no race data. Results are in `test-results/mt-glorious/` (gitignored):
`findings.json`, `board.json`, the exports and 40-odd screenshots.

## Status

All fixed on `feature/vk4wip-ui`, and re-checked by the rehearsal (`expect(findings).toEqual([])`).

| # | Status | Fix |
|---|---|---|
| 1 | Fixed | Race Summary reads base's records (`getRaceResults`) |
| 2 | Fixed | Missing Numbers reads base's records; DNS no longer listed as missing |
| 3 | Fixed | Finisher List, Full Officials and Split Times wired into the panel and corrected; failures now show |
| 4 | Fixed | Live Dashboard reads base's records (121/128 for CP1) |
| 5 | Fixed | Checkpoint coordinates kept from the Manual tab and the template (4 of 4, also on a CP device) |
| 6 | Fixed | Template course loads into the new race and parses |
| 7 | Fixed | Due starts only once a runner could have arrived |
| 8 | Fixed | Operators, frequency and base callsign editable after setup |
| 9 | Fixed | Share batch counts entries not yet called in (0 after the race) |
| 10 | Fixed | Stray `. ` removed from DNF notes |
| 11 | Fixed | Overview percentages use starters |
| 12 | Fixed | Out-of-order offers Ask for both checkpoints |
| 13 | Fixed | Times CSV Status says Finished |

## Bugs (as found)

### High: post-race results

**Root cause of bugs 1, 2 and 4, and part of 3:** base records radio calls in
`base_station_runners`, by design. These reports and the dashboard read `runners` or
`checkpoint_runners`, which never change on a base device. They worked when base imported
checkpoint data. They don't see what the radio workflow records.

| # | Where | What happens | Cause |
|---|---|---|---|
| 1 | Reports › Exports › Race Summary Report | All 128 runners read `not-started`, with no times. It downloads normally and looks fine until opened. | `BaseOperationsRepository.js:409` `generateRaceResults` reads `db.runners` |
| 2 | Reports › Exports › Missing Numbers Report | "Total Missing: 128" for CP1, where 121 passed. DNS runners are also listed as missing. | `BaseOperationsRepository.js:926` `getMissingRunners` reads `checkpoint_runners`; the DNS filter reads `runners.status` |
| 3 | Reports › Exports › Finisher List, Full Officials Report, Split Times | The button does nothing: no file, no message. Only the console shows `Unknown report type`. | `ReportsPanel.jsx:129` has its own switch that lacks all three; the store's copy has them |
| 4 | Live Dashboard | Shows 0/128 at every checkpoint after the race has finished. | `LiveDashboardView.jsx:25` reads `checkpoint_runners` |

**Fixing the switch in bug 3 is not enough.** A throwaway test called the three functions directly
on two runners, one of whom finished:

- **Finisher List:** lists every checkpoint record as a finish, giving 4 "finishers" from 2 runners.
- **Full Officials Report:** gives a CP1 time as the Finish Time of a runner who never finished,
  and leaves the checkpoint columns blank.
- **Split Times:** all blank, and every runner `not-started`.

### Medium: setup and base

| # | Where | What happens | Cause |
|---|---|---|---|
| 5 | Setup › Course Map › Manual | The four checkpoint coordinates typed in were silently lost: 0 of 4 saved. The base map then never appears. | `RaceMaintenanceRepository.js:20` `createRace` copies named fields only, not `latitude`/`longitude`. `normaliseTemplate` also drops the template's `location` coordinates |
| 6 | Mt Glorious template course | The template's course never reaches the race, and could not load if it did. | `RaceSetup.jsx` `handleTemplateSelect` doesn't copy `courseGpx`. The GPX is also invalid XML (a bare `&` in the CP3 name, so `parseGpx` returns null), and it is a 4-point placeholder, not the track |
| 7 | Base board | Checkpoints go gold "Due" before anyone can be there: CP1 06:40–06:55, CP2 07:05–07:15, CP3 07:25–07:30, CP4 07:40–07:45. Finish did too, from 07:55; the first finisher was 08:05. | `receive.js:186` treats one runner past the previous checkpoint as "expected here", ignoring distance. Gold on all day stops meaning anything |
| 8 | After creating a race | Operators, frequency and base callsign can't be edited in the app. If the allocation changes, the old callsigns stay on the checkpoint and base screens. | They are set only from the template; `RaceEditView` edits name, date, time, description and checkpoint names |

### Low

| # | Where | What happens |
|---|---|---|
| 9 | Checkpoint header | The gold Share batch badge stays at 121 after every runner was radioed in, so it looks like unsent work. It counts file shares, not calls. |
| 10 | Exports › Out List | A DNF with no reason exports a stray `. ` in Reason/Comments (`BaseOperationsRepository.js:1099`). The same pattern is at lines 632 and 643. |
| 11 | Overview › Checkpoint progress | Shows CP1 `121 · 95%` when every starter has passed, because the percentage includes the 7 DNS (`BaseOverview.jsx:122`). |
| 12 | Reports › Out of order | Always offers "Ask" for the later checkpoint. Bib 92 offered Ask CP3, but CP2's time was the odd one out. |
| 13 | Times by checkpoint CSV | The Status column is blank for finishers. Times are unaffected. |

## Worth checking outside the app

- **Base GPS in the 2026 brief looks wrong.** `-27.320035, 152.750278` is given for Base at Maiala
  Picnic Area, but the same brief, and the 2024 instructions, give that point as the **Lawton Road
  gate**. The template repeats it as `baseGPS`. Anyone navigating to base by GPS would arrive at
  the gate. TRAQ's map confirms it: georeferenced from CP1–4, the finish is about 1.9 km from that
  point.
- **The template's `baseOperationalBy` says 0630; the brief says 0530.** It is metadata only and
  the app doesn't display it.

## What worked

- **Results:** all 483 checkpoint passes and 120 finishes at base matched the source for their
  5-minute block. Final counts: 120 finished, 7 DNS, 1 DNF, 0 on course.
- **Setup:** template values match the 2026 brief. The roster import and the WebScorer wizard both
  accepted the real file (128 of 128). The setup file carried operators, frequency and distances.
- **Devices:** each one opened the race on its own, and marks survived a CP2 restart and a base
  reload mid-race.
- **Busy calls:** read-out handled calls of up to 27 bibs in a single block.
- **Radio outage (CP4 silent 08:40–09:05):** base showed "CP4 hasn't reported past 08:35 · 43
  expected" and no false overdue alarms. The 54-bib catch-up call across six blocks went in cleanly.
- **The app caught the sheet's real errors:**
  - Bib 92 raised Overdue at 07:50, "Not seen CP2", Missed: 92 and Out of order. Ask, the
    checkpoint edit and base's Correction then cleared it.
  - Bib 8 raised Impossible pace: 6 km in 15 minutes.
  - Bib 87 was correctly flagged overdue: it took about 50 minutes for 3.5 km.
- **Withdrawals and stand-down:** bib 20's official message and DNF at CP3 were recorded. All four
  stand-down checks ran and closed correctly.
- **Importing a checkpoint file at base:** CP3's file went in without creating duplicates.

## As designed, but worth knowing

- Checkpoints never learn about DNS from base, so CP1–3 finish on "7 Still to come" and CP4 on 8.
- Bib 127's fast CP1→CP2 split (22.5 km/h on exact times) isn't flagged, because rounding to
  5-minute blocks brings it under the 20 km/h limit.

## Not covered

- QR transfer between devices, and the camera-based Radio Operator role
- Offline behaviour: service workers were off, as in the standard config; `25-offline.spec.js`
  covers that separately
- Runner names, as the sheet has none, so no real start list has been through it
- Waves: the 2024 instructions mention four waves, the 2026 brief doesn't, so it ran as one
- Tile tapping at volume: marking used quick entry, and tiles only for edits
- Excel and HTML export formats
- Base device failure and recovery

The spec records problems as it goes rather than stopping the race, then asserts the list is empty,
so a green run means no findings. `findings.json` is written first so a red run can be read.
`fixtures/MGMT_NOV25.xlsx` is caught by the `*.xlsx`
gitignore rule and needs `git add -f` if the spec is committed.
