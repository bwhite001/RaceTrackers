# RaceTracker — VK4WIP UI redesign: Claude Code handoff

Copy this folder into the RaceTrackers repo root as `docs/design-handoff/` (or anywhere Claude Code can read it), then paste the prompt below into Claude Code.

## What's in this package

| Path | What it is |
|---|---|
| `IMPLEMENTATION_SPEC.md` | **The spec.** Every screen, behaviour, rule, data change, and acceptance criterion, mapped to the existing repo. |
| `design/screens/*.dc.html` | Interactive design sources for every screen (layout, exact styles, and working demo logic). Read them as the visual + behavioural reference. |
| `design/screens/README.md` | How to read the `.dc.html` files and which screen maps to which component. |
| `design-tokens/` | VK4WIP brand tokens: Tailwind colour config + CSS variables. |
| `design/assets/vk4wip-badge.png` | The club badge (same file as `public/pwa-512x512.png`). Never redraw it. |
| `docs/radio-procedure.md` | WICEN radio wording for the user guide (deliberately NOT shown in the UI). |
| `reference/WICEN_Mt_Glorious_Trails_2026.pdf` | Source brief: call procedure, checkpoints, operators. Used for seed/demo data. |

## Prompt for Claude Code

```
Read docs/design-handoff/START_HERE.md, then docs/design-handoff/IMPLEMENTATION_SPEC.md in full,
then CLAUDE.md. The design sources are in docs/design-handoff/design/screens/*.dc.html.

Implement the VK4WIP UI redesign described in the spec, phase by phase (Phase 0 → Phase 6).
Rules:
- Follow CLAUDE.md: module isolation, ProtectedRoute, Dexie migrations with a new version,
  timeUtils for all time, design-system components, and a Playwright journey spec + guide
  regeneration for every new feature.
- Treat the .dc.html files as the visual and behavioural reference. Match layout, colours,
  type, spacing and states; rebuild them as React + Tailwind using the tokens in
  design-tokens/. Do not copy the dc-runtime markup ({{holes}}, <sc-for>, <x-dc>) into the app.
- Demo values in the designs (fixed clock 07:47, Mt Glorious checkpoints, bib numbers) are
  sample data only — wire everything to real store data.
- Do not draw or regenerate the club logo; use public/pwa-512x512.png.
- After each phase: run make test-run and the relevant e2e journeys, then summarise what
  changed and anything you had to decide. Stop and ask if a spec rule conflicts with existing
  behaviour that tests depend on.
Start with Phase 0 and show me the plan for it before editing.
```

## Phase overview (details in the spec)

0. Tokens + shared shell (Tailwind palette, fonts, app bar, tab bar, status styles)
1. Home, Race setup, Share config, Settings restyle
2. Checkpoint: Mark off (edit sheet, undo, restore), Overview (fix anything)
3. Checkpoint: Callout sheet + Read-out mode (overs, ticks)
4. Base: Receive (one call at a time, time blocks, validation, actions)
5. Base: DNF / DNS bulk add, Overview restyle
6. Base: Reports + data checks (duplicates, out of order, skipped, after DNF, unknown, pace)
