# RaceTracker App — Design Overview

> Offline-capable race tracking for checkpoint volunteers and base station operators.  
> All features work without internet connectivity; data is stored locally on the device.

---

## Key Features

### 1. Race Setup
- **Race Creation** — enter event name, date, and start time
- **Flexible Runner Ranges** — supports any combination of ranges (e.g. 100–200, 1200–1400) or individual numbers
- **Local Storage** — all race data persisted to IndexedDB; no server required
- **Config Sharing** — export/import race configuration via QR code or email (JSON)

### 2. Checkpoint Mode

Designed for volunteers stationed at race checkpoints. Three tabs:

#### Tab 1 — Runner Mark-Off
- Grid or list view of all runner numbers
- Search bar for instant filtering by number
- Tap to mark a runner as "passed" — timestamp recorded automatically
- Grouping/pagination for large ranges (by 10s, 25s, 50s, or 100s)
- Quick keyboard entry for numbers as runners pass

#### Tab 2 — Callout Sheet
- Runners who have passed are automatically grouped into 5-minute time intervals
- Each segment can be marked as "called in" once reported to base
- Segments sorted chronologically (earliest → latest)

#### Tab 3 — Overview
- Colour-coded status for every runner in the configured range:
  - **Not Started** · **Passed** · **Non-Starter** · **DNF**
- Manual status updates (non-starter, DNF)
- Live counts: runners left, passed, and per-status totals
- Timing info: when each runner passed and whether their segment has been called in

### 3. Base Station Mode

Tailored for central race operations. Two tabs:

#### Tab 1 — Data Entry
- Enter a common time (e.g. when a radio call comes in) then assign it to multiple runner numbers
- Runners can be entered individually or in bulk, in any order
- Efficient batch processing for large groups arriving together

#### Tab 2 — Race Overview
- Full status dashboard mirroring Checkpoint Tab 3
- Manual non-starter and DNF updates
- Real-time progress tracking across all racers
- Checkpoint grouping view — see reports per checkpoint (who has/hasn't passed each one)

### 4. Settings
- Dark / light mode toggle
- Adjustable text size
- Customisable status colours (passed, DNF, non-starter, not started)
- Export / import race config via QR code or email

---

## Pages & Navigation

| Page / Mode | Key Functions |
|---|---|
| **Race Setup** | Configure race details, runner ranges, import/export config |
| **Role Selection** | Choose Checkpoint or Base Station mode |
| **Checkpoint — Mark-Off** | Mark runners as passed (grid/list, search, grouping) |
| **Checkpoint — Callout Sheet** | Group by 5-min intervals, mark segments as called in |
| **Checkpoint — Overview** | All-runner status, progress counts, timing info |
| **Base Station — Data Entry** | Common time entry, bulk runner assignment |
| **Base Station — Overview** | All-runner status, progress tracking, per-checkpoint view |
| **Settings** | Theme, font size, status colours, config sharing |

---

## Technical Architecture

| Component | Technology |
|---|---|
| Platform | Progressive Web App (PWA) |
| UI Framework | React 18 (hooks) |
| Local Storage | IndexedDB via Dexie.js |
| Styling | Tailwind CSS |
| State Management | Zustand |
| QR Code | qrcode.react + jsQR |
| Validation | Zod |
| Build Tool | Vite |

---

## Workflow

1. **Setup** — organiser configures race (date, time, runner ranges) and shares config to volunteer devices via QR code
2. **Role Selection** — each device is placed into Checkpoint or Base Station mode
3. **Checkpoint Operations** — volunteers mark runners as they pass; group times are called in to base
4. **Base Station Operations** — operator enters group finish times, updates statuses, monitors overall progress
5. **Reporting** — overview dashboards show live progress; config can be re-exported at any time

---

## Design Principles

- **Offline-First** — no internet required; ideal for remote locations
- **Responsive** — works on desktop, tablet, and mobile
- **Accessible** — adjustable text size, high-contrast support, screen reader friendly
- **Fast** — quick mark-off and batch entry for high-volume events
- **Data Safe** — local storage prevents loss from connectivity issues
- **Easy to Share** — QR code / email config transfer between devices

---

## Planned Enhancements

- [ ] Grouping/pagination for very large runner ranges (1 000+)
- [ ] Advanced analytics — pace prediction, outlier detection
- [ ] Timing chip (RFID) integration
- [ ] Real-time sync between devices (optional, when connectivity is available)
- [ ] High-contrast and screen reader accessibility upgrades
