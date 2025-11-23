# RaceTracker Design Document

## 1. Product Overview

**Objective:**  
Build an offline-first, highly usable race tracking application supporting both checkpoint volunteers and base station operators. The app must operate efficiently in remote/rural race conditions, storing all data locally, and provide configuration sharing via QR code or email. It is designed to work on desktop and mobile devices.

---

## 2. Core User Flows

### 2.1 Race Setup Flow

1. User opens the app and lands on the Race Setup page.
2. Enters event name, date, and start time.
3. Inputs runner number range(s), e.g., `100-200, 1200-1400`.
4. Optionally imports a configuration via QR code or JSON.
5. Reviews configuration and confirms.
6. Advances to Role Selection.

### 2.2 Role Selection

- Device displays two large options:
    - **Checkpoint Mode**
    - **Base Station Mode**
- User selects a role; selection is shown in the header and can be changed from Settings.

### 2.3 Checkpoint Mode

#### Tab 1: Runner Mark-Off
- Grid or list view of bib numbers (toggle based on device or user preference).
- Search bar for quick filter.
- Tap/click to mark “passed” (auto timestamp).
- Keyboard quick-entry for fast number input.
- Supports grouping/pagination for large events.
- All data stored offline.

#### Tab 2: Callout Sheet
- 5-minute interval segments, automatically grouping “passed” runners.
- Visual indicator for “called in” status (checkbox/completed).
- Segments listed chronologically for race radio protocol.

#### Tab 3: Overview
- Status dashboard: color-coded for Not Started, Passed, Non-Starter, DNF.
- Ability to manually flag runners Non-Starter/DNF.
- Counts and time-of-passing displayed.

### 2.4 Base Station Mode

#### Tab 1: Data Entry
- Input finish time (choose or “Now”).
- Input runner numbers individually, in bulk, or as a range.
- Batch assign time to group; ability to undo recent batch.

#### Tab 2: Race Overview
- Dashboard mirrors Checkpoint Overview.
- Filtering by checkpoint.
- Global status and editing capabilities.

---

## 3. Feature Checklist

- [x] Offline-first operation using IndexedDB (Dexie.js)
- [x] Responsive: adjusts to desktop/mobile/tablet
- [x] Accessibility: keyboard navigation, screen reader support, text scaling, high-contrast mode
- [x] Mark runners passed via tap/click or keyboard
- [x] 5-minute callout grouping
- [x] Efficient bulk data entry at base
- [x] Comprehensive dashboard/status view
- [x] Manual override for non-starters/DNFs
- [x] Export/import configuration (QR/JSON)
- [x] Settings for theme, color, accessibility
- [x] Data never leaves device unless shared by user

---

## 4. UI Layout Sketch

### Race Setup Page
- **Header:** “Race Setup”
- **Fields:** Name, Date, Start time, Runner Range Input
- **Buttons:** Import Config, Export Config, Continue

### Role Selection
- **Cards:** “Checkpoint Mode” | “Base Station Mode”

### Checkpoint Mode
- **Tab 1:** Mark-Off (grid/list, search, grouping)
- **Tab 2:** Callout Sheet (interval segments, call-in, check-marks)
- **Tab 3:** Overview (status, DNF/NS assignment, progress)

### Base Station Mode
- **Tab 1:** Batch Data Entry (common time, runner input, batch confirm, undo)
- **Tab 2:** Dashboard Overview (filter by checkpoint, global status)

### Settings
- **Theme:** Dark/light/high-contrast toggle
- **Text:** Scaling slider
- **Colors:** Custom status color
- **Config:** Export/Import, Role Switch

---

## 5. Technology Stack

| Layer           | Tool/Library                  |
|-----------------|------------------------------|
| Platform        | PWA supported, React 18+     |
| UI Styling      | Tailwind CSS                 |
| Local Storage   | IndexedDB via Dexie.js       |
| State Mgmt      | Context or Zustand           |
| QR/Sharing      | qrcode.react (QR), file APIs |
| Accessibility   | ARIA roles, keyboard, scaling|
| Data Sync (future)| Meshtastic + Web Serial    |

---

## 6. User Instructions (Key Interactions)

- **Mark Passed:** Tap a bib in the grid/list, or type the number and press Enter.
- **Bulk Entry:** In base mode, input a range/comma list, select time, batch assign.
- **Call-In Group:** In callout tab, tap “Mark as Called In” after reporting a block.
- **Manual Update:** In overview tab, set a runner as Non-Starter or DNF by clicking status.
- **Switch Role:** Use Settings menu.
- **Share/Import Config:** In Settings, tap Export for QR/JSON; Import by scanning or pasting JSON.
- **Change Theme/Text:** Toggle theme, drag text size slider, pick custom status colors.

---

## 7. Accessibility Considerations

- All controls and navigation keyboard accessible (Tab, Enter, arrow keys).
- Large tap/click targets for mobile/touch use.
- Color palette meets WCAG AA contrast requirements.
- Alert/Live region ARIA notifications for state changes.
- Responsive layouts adapt to user’s device and OS scaling.

---

## 8. Extension / Future Work

- Optional off-grid synchronization via Meshtastic or amateur radio.
- Analytics: pace prediction, reporting.
- Multi-device event sync (beyond config sharing).
- Localization, multi-language support.

---

## 9. Acceptance Criteria

- App works fully offline and on all device sizes.
- Accurate, fast marking and data entry (even for large fields).
- Data not lost or corrupted under normal user workflows.
- Easy onboarding, intuitive navigation, instantly usable in event environment.
- All user settings (theme, role, accessibility, custom config) are respected and persist locally.

---

*End of Design Document*
