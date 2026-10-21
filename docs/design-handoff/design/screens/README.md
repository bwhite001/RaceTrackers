# Design sources

Each `*.dc.html` file is one screen from the approved design canvas. They are **reference**, not app code:

- Markup and inline `style="…"` = exact layout, colours, sizes and spacing to reproduce in React + Tailwind.
- `{{name}}` = a value computed in the `<script type="text/x-dc">` block at the bottom (`renderVals()`).
- `<sc-for list="{{items}}" as="x">` = a loop; `<sc-if value="{{cond}}">` = conditional; `<dc-import name="X">` = embeds `X.dc.html`.
- The script block contains working demo logic (state, handlers, validation) — read it for **behaviour**. It uses a fixed demo clock (07:47) and hard-coded sample data; the app must use real stores and `timeUtils`.
- `support.js`, `/_blob/…` image URLs and the Google Fonts `<link>` belong to the design tool. In the app use `public/pwa-512x512.png` for the badge and self-hosted/precached fonts.
- `canvas.json` is the canvas layout (positions only).

## Screen → repo mapping

| Design file | Screen | Implement in | Interactive demo |
|---|---|---|---|
| `Main.dc.html` | Brand & components sheet | `src/design-system/`, `statusStyles.js`, tokens | — |
| `Home.dc.html` | Home / role picker | `src/components/Home/Homepage.jsx` | — |
| `RaceSetup.dc.html` | Race setup (runners step) | `src/components/Setup/RaceSetup.jsx` | — |
| `ShareConfig.dc.html` | Share config via QR | existing QR export + `QRDisplayFullscreen` | — |
| `Settings.dc.html` | Settings | `src/components/Settings/SettingsModal.jsx` | — |
| `CpMarkOff.dc.html` | Checkpoint — Mark off + edit sheet + undo + restore | `src/views/CheckpointView.jsx`, `components/Checkpoint/RunnerGrid.jsx`, `QuickEntryBar.jsx` | yes |
| `CpCallout.dc.html` | Checkpoint — Callout sheet | `components/Checkpoint/CalloutSheet.jsx` | — |
| `CpReadout.dc.html` | Checkpoint — Read-out (overs + ticks) | new `modules/checkpoint-operations/components/ReadOutView.jsx` | yes |
| `CpOverview.dc.html` | Checkpoint — Overview (fix anything) | checkpoint overview tab | yes |
| `BaseEntry.dc.html` | Base — Receive (responsive) | `modules/base-operations` (replaces DataEntry / BatchEntryLayout UI) | yes |
| `BaseEntryTablet.dc.html` | Receive at 1112×834 | same component — viewport check only | yes |
| `BaseEntryPhone.dc.html` | Receive at 390×844 | same component — viewport check only | yes |
| `BaseOverview.dc.html` | Base — Race overview | base overview tab, `RaceOverview.jsx`, Leaderboard | — |
| `BaseStatus.dc.html` | Base — DNF / DNS bulk add | `BulkDnsView.jsx`, `WithdrawalDialog.jsx` | yes |
| `BaseReports.dc.html` | Base — Reports & data checks | `ReportsPanel.jsx`, `ReportBuilder.jsx`, `DuplicateEntriesDialog.jsx`, `MissingNumbersList.jsx` | yes |

Viewing them: the files need the design tool's runtime to render. The live canvas is private to Brandon — ask him for access or screenshots if you need to see them rendered. Everything needed to build is in the markup, the script blocks and `IMPLEMENTATION_SPEC.md`.
