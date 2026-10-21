# RaceTracker Pro — User Guide

> This guide is auto-generated from the Playwright journey tests.
> Screenshots show the actual app at each key step.
> Regenerate with: `npm run generate:guide`

## Setting Up a Race

Use these steps to create and manage races. This section covers the full setup wizard, runner ranges, checkpoints, waves, and the race overview.

### Step indicator advances correctly through setup wizard

The race creation wizard has four steps: Template, Race Details, Runner Setup, and Waves. This test checks that the progress indicator at the top updates as you advance through each step, so the race director always knows where they are in the setup process.

**Step 1 of 4 — Template: setup wizard opens**

![Step 1 of 4 — Template: setup wizard opens](assets/step-indicator-advances-correctly-through-setup-wizard-step-01.jpg)

**Step 2 of 4 — Race Details: step indicator shows step 2**

![Step 2 of 4 — Race Details: step indicator shows step 2](assets/step-indicator-advances-correctly-through-setup-wizard-step-02.jpg)

**Step 3 of 4 — Runner Setup: step indicator advances to step 3**

![Step 3 of 4 — Runner Setup: step indicator advances to step 3](assets/step-indicator-advances-correctly-through-setup-wizard-step-03.jpg)

### Back button on step 2 returns to race details with data preserved

If a race director fills in the race name and other details on Step 2 of 4 (Race Details), moves on to Step 3 of 4 (Runner Setup), then clicks Back, all their work should still be there — the race name and other fields must not be wiped out. Nobody should have to retype information just because they went back a step.

**Step 1 of 4 — Template: choose Start from Scratch**

![Step 1 of 4 — Template: choose Start from Scratch](assets/back-button-on-step-2-returns-to-race-details-with-data-preserved-step-01.jpg)

**Step 2 of 4 — Race Details: fill in race name and details**

![Step 2 of 4 — Race Details: fill in race name and details](assets/back-button-on-step-2-returns-to-race-details-with-data-preserved-step-02.jpg)

**Step 3 of 4 — Runner Setup: navigate forward then press Back**

![Step 3 of 4 — Runner Setup: navigate forward then press Back](assets/back-button-on-step-2-returns-to-race-details-with-data-preserved-step-03.jpg)

**Step 2 of 4 — Race Details: data preserved after Back**

![Step 2 of 4 — Race Details: data preserved after Back](assets/back-button-on-step-2-returns-to-race-details-with-data-preserved-step-04.jpg)

### Race management page lists created races

The Race Management page is the race director's central hub where all races are listed. This test confirms that a race created earlier in the test suite appears on that page.

**Race Management — page lists all created races**

![Race Management — page lists all created races](assets/race-management-page-lists-created-races-step-01.jpg)

### Clicking a race opens its overview

When the race director clicks on a race in the management list, they should be taken to that race's overview page where they can see all the details. This test confirms that navigation works correctly.

**Race Management — page with race listed**

![Race Management — page with race listed](assets/clicking-a-race-opens-its-overview-step-01.jpg)

**Race card — click race name to open overview**

![Race card — click race name to open overview](assets/clicking-a-race-opens-its-overview-step-02.jpg)

**Race overview — name and details visible**

![Race overview — name and details visible](assets/clicking-a-race-opens-its-overview-step-03.jpg)

### Runner name/gender section appears after adding a range

After a race director adds a bib number range on Step 3 of the setup wizard, an optional section appears for entering runner first names, last names, and gender. This is purely optional — races can be tracked without personal data.

**Navigate to race setup wizard**

![Navigate to race setup wizard](assets/runner-name-gender-section-appears-after-adding-a-range-step-01.jpg)

**Fill in Race Details and advance to Step 3**

![Fill in Race Details and advance to Step 3](assets/runner-name-gender-section-appears-after-adding-a-range-step-02.jpg)

**Remove default range and add range 200-205**

![Remove default range and add range 200-205](assets/runner-name-gender-section-appears-after-adding-a-range-step-03.jpg)

**Check that optional names section toggle is visible**

![Check that optional names section toggle is visible](assets/runner-name-gender-section-appears-after-adding-a-range-step-04.jpg)

### Waves step shows default wave and allows adding more

Step 4 of the race setup wizard is the Waves step, which groups runners into separate start batches. By default one wave is provided. A race director can add a second wave using the Add Wave button.

**Navigate through setup wizard to the Waves step**

![Navigate through setup wizard to the Waves step](assets/waves-step-shows-default-wave-and-allows-adding-more-step-01.jpg)

**Confirm Waves step heading and at least one wave row**

![Confirm Waves step heading and at least one wave row](assets/waves-step-shows-default-wave-and-allows-adding-more-step-02.jpg)

**Click "+ Add Wave" to add a second wave**

![Click "+ Add Wave" to add a second wave](assets/waves-step-shows-default-wave-and-allows-adding-more-step-03.jpg)

### Wave name and time fields are editable and save

A race director can give each wave a custom name (e.g. "Wave B") and a specific start time (e.g. "07:30"). These are saved to the database so checkpoint volunteers know when each wave started.

**Navigate through setup wizard to the Waves step**

![Navigate through setup wizard to the Waves step](assets/wave-name-and-time-fields-are-editable-and-save-step-01.jpg)

**Confirm "+ Add Wave" button is available**

![Confirm "+ Add Wave" button is available](assets/wave-name-and-time-fields-are-editable-and-save-step-02.jpg)

**Add a second wave**

![Add a second wave](assets/wave-name-and-time-fields-are-editable-and-save-step-03.jpg)

**Set second wave name to "Wave B" and start time to "07:30"**

![Set second wave name to "Wave B" and start time to "07:30"](assets/wave-name-and-time-fields-are-editable-and-save-step-04.jpg)

**Verify "Wave B" appears in the wave name input**

![Verify "Wave B" appears in the wave name input](assets/wave-name-and-time-fields-are-editable-and-save-step-05.jpg)

## Running a Checkpoint

Steps for checkpoint volunteers. Covers opening a checkpoint, marking off runners individually and in bulk, reviewing counts, exporting data, and transferring data to another device via QR code.

### Marks off a single runner via the runner grid

A checkpoint volunteer clicks on a single runner's bib number tile in the grid to record that the runner passed through. The tile should change colour or appearance to make it obvious that runner has been marked as "through".

**Checkpoint view — runner grid visible**

![Checkpoint view — runner grid visible](assets/marks-off-a-single-runner-via-the-runner-grid-step-01.jpg)

**Runner grid — tap first runner tile (200s range)**

![Runner grid — tap first runner tile (200s range)](assets/marks-off-a-single-runner-via-the-runner-grid-step-02.jpg)

**Runner tile — marked state applied**

![Runner tile — marked state applied](assets/marks-off-a-single-runner-via-the-runner-grid-step-03.jpg)

### Marks off multiple runners via Quick Entry

Instead of finding runners in the grid, a volunteer can just type a bib number and press Enter to record it quickly. This test enters two bib numbers one after the other using the quick-entry shortcut and confirms both runners are marked off.

**Checkpoint view — Quick Entry bar visible**

![Checkpoint view — Quick Entry bar visible](assets/marks-off-multiple-runners-via-quick-entry-step-01.jpg)

**Quick Entry — type first bib number and press Enter**

![Quick Entry — type first bib number and press Enter](assets/marks-off-multiple-runners-via-quick-entry-step-02.jpg)

**Quick Entry — type second bib number and press Enter**

![Quick Entry — type second bib number and press Enter](assets/marks-off-multiple-runners-via-quick-entry-step-03.jpg)

**Runner grid — both runners marked off**

![Runner grid — both runners marked off](assets/marks-off-multiple-runners-via-quick-entry-step-04.jpg)

### Switches to Callout Sheet tab

The Callout Sheet tab shows the list of runners who have not yet been recorded at this checkpoint. Volunteers read these numbers out over the radio to base station. This test checks the tab loads correctly and the list is visible.

**Checkpoint view — Mark Off tab active**

![Checkpoint view — Mark Off tab active](assets/switches-to-callout-sheet-tab-step-01.jpg)

**Callout Sheet tab — tap to switch**

![Callout Sheet tab — tap to switch](assets/switches-to-callout-sheet-tab-step-02.jpg)

**Callout Sheet — unrecorded runners listed**

![Callout Sheet — unrecorded runners listed](assets/switches-to-callout-sheet-tab-step-03.jpg)

### Switches to Overview tab and shows runner counts

The Overview tab shows a summary — how many runners have been through, how many are still expected, and other totals. This test confirms those summary numbers appear correctly when the tab is selected.

**Checkpoint view — navigate to checkpoint**

![Checkpoint view — navigate to checkpoint](assets/switches-to-overview-tab-and-shows-runner-counts-step-01.jpg)

**Overview tab — tap to switch**

![Overview tab — tap to switch](assets/switches-to-overview-tab-and-shows-runner-counts-step-02.jpg)

**Overview — runner count summary visible**

![Overview — runner count summary visible](assets/switches-to-overview-tab-and-shows-runner-counts-step-03.jpg)

### Can export checkpoint results

At the end of a checkpoint shift, a volunteer may need to export their recorded data to share with base station or keep as a backup. This test checks that the export option can be opened from the checkpoint screen.

**Checkpoint view — navigate to checkpoint**

![Checkpoint view — navigate to checkpoint](assets/can-export-checkpoint-results-step-01.jpg)

**Export option — triggers JSON download**

![Export option — triggers JSON download](assets/can-export-checkpoint-results-step-02.jpg)

### Navigates from race overview to a checkpoint

From the race overview, a race director can jump straight to any checkpoint's live mark-off screen. This test clicks the Checkpoint 1 link and confirms the checkpoint mark-off screen opens.

**Checkpoint view — mark-off screen for CP1 open**

![Checkpoint view — mark-off screen for CP1 open](assets/navigates-from-race-overview-to-a-checkpoint-step-01.jpg)

### Callout sheet tab shows runners who passed but not called in

The Callout Sheet tab lists all runners who have been marked as passed at the checkpoint but have not yet been confirmed as called in to base station. Checkpoint volunteers use this list to make radio calls.

**Mark Off tab — mark two runners as passed**

![Mark Off tab — mark two runners as passed](assets/callout-sheet-tab-shows-runners-who-passed-but-not-called-in-step-01.jpg)

**Callout Sheet tab — click to switch**

![Callout Sheet tab — click to switch](assets/callout-sheet-tab-shows-runners-who-passed-but-not-called-in-step-02.jpg)

**Callout Sheet — verify content is visible**

![Callout Sheet — verify content is visible](assets/callout-sheet-tab-shows-runners-who-passed-but-not-called-in-step-03.jpg)

### Pending count badge decrements when runner is called in

When a checkpoint volunteer marks a runner as called in, the pending count badge on the Callout Sheet tab decreases by one. If all runners have been called in the badge disappears.

**Mark Off tab — mark a runner to create a callout segment**

![Mark Off tab — mark a runner to create a callout segment](assets/pending-count-badge-decrements-when-runner-is-called-in-step-01.jpg)

**Tab bar — check for pending count badge**

![Tab bar — check for pending count badge](assets/pending-count-badge-decrements-when-runner-is-called-in-step-02.jpg)

**Callout Sheet — Base copied — mark sent clears the pending call**

![Callout Sheet — Base copied — mark sent clears the pending call](assets/pending-count-badge-decrements-when-runner-is-called-in-step-03.jpg)

### Transfer Data button appears in checkpoint header



**Navigate to checkpoint 1**

![Navigate to checkpoint 1](assets/transfer-data-button-appears-in-checkpoint-header-step-01.jpg)

**Checkpoint header — Transfer Data button is visible**

![Checkpoint header — Transfer Data button is visible](assets/transfer-data-button-appears-in-checkpoint-header-step-02.jpg)

### Navigates to transfer view and shows Send and Receive tabs



**Navigate directly to the transfer route**

![Navigate directly to the transfer route](assets/navigates-to-transfer-view-and-shows-send-and-receive-tabs-step-01.jpg)

**Transfer view — click Transfer Data button**

![Transfer view — click Transfer Data button](assets/navigates-to-transfer-view-and-shows-send-and-receive-tabs-step-02.jpg)

**Transfer view — Send and Receive tabs visible**

![Transfer view — Send and Receive tabs visible](assets/navigates-to-transfer-view-and-shows-send-and-receive-tabs-step-03.jpg)

**Transfer view — Send tab is active by default**

![Transfer view — Send tab is active by default](assets/navigates-to-transfer-view-and-shows-send-and-receive-tabs-step-04.jpg)

**Transfer view — scope options are visible**

![Transfer view — scope options are visible](assets/navigates-to-transfer-view-and-shows-send-and-receive-tabs-step-05.jpg)

### Back button returns to the checkpoint view



**Navigate to transfer route**

![Navigate to transfer route](assets/back-button-returns-to-the-checkpoint-view-step-01.jpg)

**Tap back button — returns to /checkpoint/1**

![Tap back button — returns to /checkpoint/1](assets/back-button-returns-to-the-checkpoint-view-step-02.jpg)

## Operating the Base Station

Steps for the base station operator. Record finish times, mark DNF/DNS runners, and review race-wide status from the Overview and Reports tabs.

### Switches to Reports tab and renders a report

The Reports tab lets the operator generate a printed summary of race results. This test switches to the tab and checks that the report content — runner totals, times, and status counts — is visible.

## Base Station: Receiving Calls

Take a Scores Checkpoint call one checkpoint at a time: pick who is calling, take each number as it is read in its 5-minute block, check the coloured chips, and Complete. Undo, Clear and Cancel fix mistakes.

### Base receives a call in two blocks on a tablet without page scroll



**Who's calling? — CP1 calls; take its 5 numbers at an earlier block**

![Who's calling? — CP1 calls; take its 5 numbers at an earlier block](assets/base-receives-a-call-in-two-blocks-on-a-tablet-without-page-scroll-step-01.jpg)

**CP1 calls again — receiving opens on its next unreceived block**

![CP1 calls again — receiving opens on its next unreceived block](assets/base-receives-a-call-in-two-blocks-on-a-tablet-without-page-scroll-step-02.jpg)

**Add 5 numbers, Next block, add 5 more — the box shows only the current block**

![Add 5 numbers, Next block, add 5 more — the box shows only the current block](assets/base-receives-a-call-in-two-blocks-on-a-tablet-without-page-scroll-step-03.jpg)

**Also in this call — tap the earlier block to see its numbers again**

![Also in this call — tap the earlier block to see its numbers again](assets/base-receives-a-call-in-two-blocks-on-a-tablet-without-page-scroll-step-04.jpg)

**Complete — 10 recorded across two blocks; the board updates**

![Complete — 10 recorded across two blocks; the board updates](assets/base-receives-a-call-in-two-blocks-on-a-tablet-without-page-scroll-step-05.jpg)

**Undo — the call reopens and its records are removed**

![Undo — the call reopens and its records are removed](assets/base-receives-a-call-in-two-blocks-on-a-tablet-without-page-scroll-step-06.jpg)

### Base receives a call in two blocks on a phone



**Who's calling? — CP1 calls; take its 5 numbers at an earlier block**

![Who's calling? — CP1 calls; take its 5 numbers at an earlier block](assets/base-receives-a-call-in-two-blocks-on-a-phone-step-01.jpg)

**CP1 calls again — receiving opens on its next unreceived block**

![CP1 calls again — receiving opens on its next unreceived block](assets/base-receives-a-call-in-two-blocks-on-a-phone-step-02.jpg)

**Add 5 numbers, Next block, add 5 more — the box shows only the current block**

![Add 5 numbers, Next block, add 5 more — the box shows only the current block](assets/base-receives-a-call-in-two-blocks-on-a-phone-step-03.jpg)

**Also in this call — tap the earlier block to see its numbers again**

![Also in this call — tap the earlier block to see its numbers again](assets/base-receives-a-call-in-two-blocks-on-a-phone-step-04.jpg)

**Complete — 10 recorded across two blocks; the board updates**

![Complete — 10 recorded across two blocks; the board updates](assets/base-receives-a-call-in-two-blocks-on-a-phone-step-05.jpg)

**Undo — the call reopens and its records are removed**

![Undo — the call reopens and its records are removed](assets/base-receives-a-call-in-two-blocks-on-a-phone-step-06.jpg)

### Base receive flags unknown, repeated, already-logged and unseen numbers



**CP1 sends 100 and 101 — recorded**

![CP1 sends 100 and 101 — recorded](assets/base-receive-flags-unknown-repeated-already-logged-and-unseen-numbers-step-01.jpg)

**CP2 call — each number is checked as it is added**

![CP2 call — each number is checked as it is added](assets/base-receive-flags-unknown-repeated-already-logged-and-unseen-numbers-step-02.jpg)

**Complete — only the valid and not-seen numbers are recorded**

![Complete — only the valid and not-seen numbers are recorded](assets/base-receive-flags-unknown-repeated-already-logged-and-unseen-numbers-step-03.jpg)

**CP1 repeats 101 — already logged at this checkpoint**

![CP1 repeats 101 — already logged at this checkpoint](assets/base-receive-flags-unknown-repeated-already-logged-and-unseen-numbers-step-04.jpg)

### Base clears a block with undo and cancels a call with two taps



**CP2 call — four numbers in the current block**

![CP2 call — four numbers in the current block](assets/base-clears-a-block-with-undo-and-cancels-a-call-with-two-taps-step-01.jpg)

**Clear the block — then Undo brings the numbers back**

![Clear the block — then Undo brings the numbers back](assets/base-clears-a-block-with-undo-and-cancels-a-call-with-two-taps-step-02.jpg)

**Cancel call — the first tap asks to confirm**

![Cancel call — the first tap asks to confirm](assets/base-clears-a-block-with-undo-and-cancels-a-call-with-two-taps-step-03.jpg)

**Second tap — the call is dropped, nothing recorded**

![Second tap — the call is dropped, nothing recorded](assets/base-clears-a-block-with-undo-and-cancels-a-call-with-two-taps-step-04.jpg)

## Base Station: DNF, DNS and Overview

Base keeps the race-wide out list. Mark runners DNF or DNS in bulk by typing or pasting numbers, check the warnings, and clear anyone who is back in. The Overview shows who is on course, overdue alerts, checkpoint progress and the current leaders.

### Base marks a pasted list DNF with checks, clears one and undoes



**DNF / DNS tab — DNF at CP1, reason Injury**

![DNF / DNS tab — DNF at CP1, reason Injury](assets/base-marks-a-pasted-list-dnf-with-checks-clears-one-and-undoes-step-01.jpg)

**Paste a list — each number is checked**

![Paste a list — each number is checked](assets/base-marks-a-pasted-list-dnf-with-checks-clears-one-and-undoes-step-02.jpg)

**Mark 3 as DNF — they appear in Out of the race**

![Mark 3 as DNF — they appear in Out of the race](assets/base-marks-a-pasted-list-dnf-with-checks-clears-one-and-undoes-step-03.jpg)

**Clear 112 — back in the race; Undo puts the DNF back**

![Clear 112 — back in the race; Undo puts the DNF back](assets/base-marks-a-pasted-list-dnf-with-checks-clears-one-and-undoes-step-04.jpg)

**DNS — a runner seen at CP1 is flagged; a DNF runner will change**

![DNS — a runner seen at CP1 is flagged; a DNF runner will change](assets/base-marks-a-pasted-list-dnf-with-checks-clears-one-and-undoes-step-05.jpg)

**Receive rejects runners who are out**

![Receive rejects runners who are out](assets/base-marks-a-pasted-list-dnf-with-checks-clears-one-and-undoes-step-06.jpg)

### Base overview shows tiles, checkpoint progress and current leaders



**Overview — stat tiles and checkpoint progress**

![Overview — stat tiles and checkpoint progress](assets/base-overview-shows-tiles-checkpoint-progress-and-current-leaders-step-01.jpg)

**Current leaders — furthest along first, gold badge for #1**

![Current leaders — furthest along first, gold badge for #1](assets/base-overview-shows-tiles-checkpoint-progress-and-current-leaders-step-02.jpg)

## Base Station: Reports and Data Checks

Overdue runners, who is still on course, times by checkpoint and the call log — each as CSV or print. Needs attention lists duplicates, out-of-order times, skipped checkpoints, sightings after DNF / DNS, unknown bibs and impossible pace; resolve each in place, with Undo.

### Base resolves a duplicate and an out-of-order time until checks are clear



**Receive — CP1 now, then CP2 reports the same runner at an earlier block**

![Receive — CP1 now, then CP2 reports the same runner at an earlier block](assets/base-resolves-a-duplicate-and-an-out-of-order-time-until-checks-are-clear-step-01.jpg)

**Reports — Needs attention shows a duplicate and an out-of-order time**

![Reports — Needs attention shows a duplicate and an out-of-order time](assets/base-resolves-a-duplicate-and-an-out-of-order-time-until-checks-are-clear-step-02.jpg)

**Duplicates — keep the first time; Undo brings it back; keep again**

![Duplicates — keep the first time; Undo brings it back; keep again](assets/base-resolves-a-duplicate-and-an-out-of-order-time-until-checks-are-clear-step-03.jpg)

**Out of order — Mark checked; the check clears**

![Out of order — Mark checked; the check clears](assets/base-resolves-a-duplicate-and-an-out-of-order-time-until-checks-are-clear-step-04.jpg)

**Reload — resolved checks stay resolved**

![Reload — resolved checks stay resolved](assets/base-resolves-a-duplicate-and-an-out-of-order-time-until-checks-are-clear-step-05.jpg)

### Base reports show still on course, times by checkpoint and the call log



**Still on course — grouped by last checkpoint passed**

![Still on course — grouped by last checkpoint passed](assets/base-reports-show-still-on-course-times-by-checkpoint-and-the-call-log-step-01.jpg)

**Times by checkpoint — one row per bib, CP1 … Finish**

![Times by checkpoint — one row per bib, CP1 … Finish](assets/base-reports-show-still-on-course-times-by-checkpoint-and-the-call-log-step-02.jpg)

**Call log — calls and numbers per checkpoint; CSV available**

![Call log — calls and numbers per checkpoint; CSV available](assets/base-reports-show-still-on-course-times-by-checkpoint-and-the-call-log-step-03.jpg)

## Importing & Exporting Data

Transfer race configurations and results between devices. Export from the base station header or race management page; import to restore a race.

### Downloads a race configuration JSON file

This test triggers the export function and confirms that a JSON file is actually downloaded to the device. The file should contain the race configuration — name, checkpoints, runner numbers — that can be used to restore the race on another device.

**Race Management — page with created race listed**

![Race Management — page with created race listed](assets/downloads-a-race-configuration-json-file-step-01.jpg)

**Race card — open dropdown then click Export**

![Race card — open dropdown then click Export](assets/downloads-a-race-configuration-json-file-step-02.jpg)

**Download triggered — JSON file confirmed in temp folder**

![Download triggered — JSON file confirmed in temp folder](assets/downloads-a-race-configuration-json-file-step-03.jpg)

### Imports a race configuration and restores data

After wiping all data from the app, this test uploads a previously exported race file and confirms the race is fully restored — the race name, checkpoints, and runner numbers all come back exactly as they were before the data was cleared.

## Navigating the App

How to move between modules, what to expect on the home screen, and how the app protects active operations from accidental navigation.

### Navigates from race overview to base station

From the race overview, a race director can jump straight to the base station. This test clicks the Base Station button on the overview page and confirms the base station operations screen opens.

**Navigate directly to base station operations**

![Navigate directly to base station operations](assets/navigates-from-race-overview-to-base-station-step-01.jpg)

**Base Station — operations screen open**

![Base Station — operations screen open](assets/navigates-from-race-overview-to-base-station-step-02.jpg)

### Home page landing shows the race management module card

The Race Maintenance module card should always be visible on the home screen so race directors can always find it easily. This test simply confirms the card is present.

**Home — Race Maintenance module card visible**

![Home — Race Maintenance module card visible](assets/home-page-landing-shows-the-race-management-module-card-step-01.jpg)

### Shows protection modal when leaving active checkpoint operation

While a checkpoint volunteer is actively recording runners, the app should warn them if they try to navigate away — for example by tapping the back button or going to a different module. This prevents accidentally losing all their recorded data. This test triggers that navigation and confirms the warning appears.

**Attempt navigation away — go to home /**

![Attempt navigation away — go to home /](assets/shows-protection-modal-when-leaving-active-checkpoint-operation-step-01.jpg)

**Protection modal — operation warning or graceful fallback**

![Protection modal — operation warning or graceful fallback](assets/shows-protection-modal-when-leaving-active-checkpoint-operation-step-02.jpg)

### Allows navigation after confirming exit from active operation

If a volunteer sees the "you're about to leave an active session" warning and confirms they want to leave anyway, the app should let them go and return them to the home screen. This test confirms that confirming the exit actually works.

**Confirm exit — trigger exit and accept confirmation**

![Confirm exit — trigger exit and accept confirmation](assets/allows-navigation-after-confirming-exit-from-active-operation-step-01.jpg)

**Navigation complete — landed on non-checkpoint route**

![Navigation complete — landed on non-checkpoint route](assets/allows-navigation-after-confirming-exit-from-active-operation-step-02.jpg)

### Home page module cards are all accessible when no operation is active

When the app is idle on the home screen and no operation is in progress, all three module cards — Checkpoint Operations, Base Station, and Race Maintenance — should be enabled and ready to tap. This test confirms none of them are accidentally disabled.

**Home page — all module cards visible and enabled**

![Home page — all module cards visible and enabled](assets/home-page-module-cards-are-all-accessible-when-no-operation-is-active-step-01.jpg)

### Unknown routes redirect to home

If someone types a web address that doesn't exist in the app (perhaps a typo or an old bookmark), they should be automatically sent to the home page rather than seeing a blank or broken screen.

**Unknown route — redirects to home page**

![Unknown route — redirects to home page](assets/unknown-routes-redirect-to-home-step-01.jpg)

### Home shows the three roles, the current race and Scan race QR code



**Home — choose your role: Checkpoint, Base station or Race setup**

![Home — choose your role: Checkpoint, Base station or Race setup](assets/home-shows-the-three-roles-the-current-race-and-scan-race-qr-code-step-01.jpg)

**Current race card shows the race name, checkpoints and start time**

![Current race card shows the race name, checkpoints and start time](assets/home-shows-the-three-roles-the-current-race-and-scan-race-qr-code-step-02.jpg)

**Scan race QR code opens the import screen**

![Scan race QR code opens the import screen](assets/home-shows-the-three-roles-the-current-race-and-scan-race-qr-code-step-03.jpg)

## Settings

Personalise the app. Toggle dark mode and understand how preferences are saved.

### Opens and closes the Settings modal

Tapping the settings cog in the top-right corner should open the settings panel. Pressing the Escape key (or tapping close) should dismiss it cleanly. This test confirms both actions work.

**Home — tap Settings cog button (aria-label Settings)**

![Home — tap Settings cog button (aria-label Settings)](assets/opens-and-closes-the-settings-modal-step-01.jpg)

**Settings modal — panel open with customisation options**

![Settings modal — panel open with customisation options](assets/opens-and-closes-the-settings-modal-step-02.jpg)

**Settings modal — closed after pressing X button**

![Settings modal — closed after pressing X button](assets/opens-and-closes-the-settings-modal-step-03.jpg)

### Toggles dark mode on and off

The dark mode toggle in settings switches the app between a light colour scheme and a dark one. This test turns dark mode on, confirms the dark theme is applied, then turns it back off and confirms the light theme is restored.

**Home — open Settings modal**

![Home — open Settings modal](assets/toggles-dark-mode-on-and-off-step-01.jpg)

**Settings modal — Theme control shows Light, Dark and Sunlight**

![Settings modal — Theme control shows Light, Dark and Sunlight](assets/toggles-dark-mode-on-and-off-step-02.jpg)

**Dark mode ON — html element gains "dark" class**

![Dark mode ON — html element gains "dark" class](assets/toggles-dark-mode-on-and-off-step-03.jpg)

**Dark mode OFF — "dark" class removed from html element**

![Dark mode OFF — "dark" class removed from html element](assets/toggles-dark-mode-on-and-off-step-04.jpg)

### Settings persist after closing and reopening the modal

Changes made in settings should be saved and remembered. If dark mode is turned on and the settings panel is closed then reopened, dark mode should still be on — the preference should not reset.

**Home — open Settings modal**

![Home — open Settings modal](assets/settings-persist-after-closing-and-reopening-the-modal-step-01.jpg)

**Settings modal — choose Dark theme and save**

![Settings modal — choose Dark theme and save](assets/settings-persist-after-closing-and-reopening-the-modal-step-02.jpg)

**Home — reopen Settings modal**

![Home — reopen Settings modal](assets/settings-persist-after-closing-and-reopening-the-modal-step-03.jpg)

**Settings modal — Dark theme is still selected**

![Settings modal — Dark theme is still selected](assets/settings-persist-after-closing-and-reopening-the-modal-step-04.jpg)

### Settings switches theme to sunlight and resets status colours to club colours



**Settings — Display, Status colours and Race data sections**

![Settings — Display, Status colours and Race data sections](assets/settings-switches-theme-to-sunlight-and-resets-status-colours-to-club-colours-step-01.jpg)

**Theme — Sunlight gives a high-contrast white page**

![Theme — Sunlight gives a high-contrast white page](assets/settings-switches-theme-to-sunlight-and-resets-status-colours-to-club-colours-step-02.jpg)

**Status colours — change Passed, then Reset to club colours**

![Status colours — change Passed, then Reset to club colours](assets/settings-switches-theme-to-sunlight-and-resets-status-colours-to-club-colours-step-03.jpg)

**Cancel — nothing is saved, Light theme is back**

![Cancel — nothing is saved, Light theme is back](assets/settings-switches-theme-to-sunlight-and-resets-status-colours-to-club-colours-step-04.jpg)

### Share race screen offers QR, download, email and copy



**Settings — Race data › Share or import race config**

![Settings — Race data › Share or import race config](assets/share-race-screen-offers-qr-download-email-and-copy-step-01.jpg)

**Share race — scan to load this race, or download, email or copy the file**

![Share race — scan to load this race, or download, email or copy the file](assets/share-race-screen-offers-qr-download-email-and-copy-step-02.jpg)

**Back — returns to Settings**

![Back — returns to Settings](assets/share-race-screen-offers-qr-download-email-and-copy-step-03.jpg)

## Complete Race Walkthrough

A full end-to-end race simulation: race director creates the race, checkpoint volunteers mark off runners, and the base station records finish times and statuses.

### Phase 1 — Race Director creates race with 10 runners and 2 checkpoints



### Phase 2 — CP1 Volunteer marks runners 101–109 passed via quick entry



### Phase 3 — CP2 Volunteer marks runners 101, 103–109 passed (102 absent)



### Phase 4a — Base Station initialises and runner list loads (10 runners)



### Phase 4b — Records finish time 10:45:00 for batch 103–108



### Phase 4c — Records DNF for runner 102 (heat exhaustion)



### Phase 4d — Marks runner 110 as DNS (non-starter)



### Phase 4e — Records DNF for runner 101 (injured knee)



### Phase 4f — Overview tab shows correct runner statuses



## Checkpoint: Fixing Mistakes and Reading Out

Change a time, unmark and restore a runner, send corrections to base, fix anything from Overview, and read a busy block to base one over at a time. Every change has Undo.

### Mark off: change a time, unmark with undo, restore an unmarked runner



**Mark off — tap 101 as the runner passes**

![Mark off — tap 101 as the runner passes](assets/mark-off-change-a-time-unmark-with-undo-restore-an-unmarked-runner-step-01.jpg)

**Tap 101 again — the edit sheet opens (it never unmarks directly)**

![Tap 101 again — the edit sheet opens (it never unmarks directly)](assets/mark-off-change-a-time-unmark-with-undo-restore-an-unmarked-runner-step-02.jpg)

**Edit sheet — 5 minutes earlier, then Save**

![Edit sheet — 5 minutes earlier, then Save](assets/mark-off-change-a-time-unmark-with-undo-restore-an-unmarked-runner-step-03.jpg)

**Unmark 102 by mistake — Undo puts it straight back**

![Unmark 102 by mistake — Undo puts it straight back](assets/mark-off-change-a-time-unmark-with-undo-restore-an-unmarked-runner-step-04.jpg)

**Unmark 103, then later tap it to restore the original time**

![Unmark 103, then later tap it to restore the original time](assets/mark-off-change-a-time-unmark-with-undo-restore-an-unmarked-runner-step-05.jpg)

### A changed time base already has goes back on the callout sheet as a correction



**Mark 104 and send it to base from the callout sheet**

![Mark 104 and send it to base from the callout sheet](assets/a-changed-time-base-already-has-goes-back-on-the-callout-sheet-as-a-correction-step-01.jpg)

**Mark off — 104 shows as called in (tick)**

![Mark off — 104 shows as called in (tick)](assets/a-changed-time-base-already-has-goes-back-on-the-callout-sheet-as-a-correction-step-02.jpg)

**Edit sheet — changing a called-in time warns that base already has it**

![Edit sheet — changing a called-in time warns that base already has it](assets/a-changed-time-base-already-has-goes-back-on-the-callout-sheet-as-a-correction-step-03.jpg)

**Callout sheet — 104 is back in the next call, tagged Correction**

![Callout sheet — 104 is back in the next call, tagged Correction](assets/a-changed-time-base-already-has-goes-back-on-the-callout-sheet-as-a-correction-step-04.jpg)

### Overview: undo call-in, reset, mark and clear DNS — each with undo



**Mark 105, open Overview and tap 105**

![Mark 105, open Overview and tap 105](assets/overview-undo-call-in-reset-mark-and-clear-dns-each-with-undo-step-01.jpg)

**Mark called in, then Undo call-in — back on the callout sheet**

![Mark called in, then Undo call-in — back on the callout sheet](assets/overview-undo-call-in-reset-mark-and-clear-dns-each-with-undo-step-02.jpg)

**Reset — not passed, then Undo**

![Reset — not passed, then Undo](assets/overview-undo-call-in-reset-mark-and-clear-dns-each-with-undo-step-03.jpg)

**Mark 106 DNS, Undo, then mark DNS again**

![Mark 106 DNS, Undo, then mark DNS again](assets/overview-undo-call-in-reset-mark-and-clear-dns-each-with-undo-step-04.jpg)

**Clear DNS, then Undo — counts update live**

![Clear DNS, then Undo — counts update live](assets/overview-undo-call-in-reset-mark-and-clear-dns-each-with-undo-step-05.jpg)

### Busy block is read out in overs of five, each number ticked



**Mark off — 12 runners arrive together**

![Mark off — 12 runners arrive together](assets/busy-block-is-read-out-in-overs-of-five-each-number-ticked-step-01.jpg)

**Callout sheet — call due, Read out**

![Callout sheet — call due, Read out](assets/busy-block-is-read-out-in-overs-of-five-each-number-ticked-step-02.jpg)

**Over 1 of 3 — five numbers, one row each; Next is locked**

![Over 1 of 3 — five numbers, one row each; Next is locked](assets/busy-block-is-read-out-in-overs-of-five-each-number-ticked-step-03.jpg)

**Tick two, then Reset — ticks cleared for this over**

![Tick two, then Reset — ticks cleared for this over](assets/busy-block-is-read-out-in-overs-of-five-each-number-ticked-step-04.jpg)

**Tick all five — Base copied — next unlocks**

![Tick all five — Base copied — next unlocks](assets/busy-block-is-read-out-in-overs-of-five-each-number-ticked-step-05.jpg)

**Interrupted — leave and come back, the read resumes at over 2**

![Interrupted — leave and come back, the read resumes at over 2](assets/busy-block-is-read-out-in-overs-of-five-each-number-ticked-step-06.jpg)

**Finish overs 2 and 3 — all 12 copied, call marked sent**

![Finish overs 2 and 3 — all 12 copied, call marked sent](assets/busy-block-is-read-out-in-overs-of-five-each-number-ticked-step-07.jpg)

## Split-Role Checkpoint Operations

How two operators can share one checkpoint — a Marker records runner times and shares batches via QR code, while a Radio Operator scans the QR and calls runners in to base.

### Checkpoint opens in Marker mode by default



**Navigate to checkpoint 1**

![Navigate to checkpoint 1](assets/checkpoint-opens-in-marker-mode-by-default-step-01.jpg)

**Role toggle is visible with Marker and Radio Operator buttons**

![Role toggle is visible with Marker and Radio Operator buttons](assets/checkpoint-opens-in-marker-mode-by-default-step-02.jpg)

**Marker mode — runner grid is visible**

![Marker mode — runner grid is visible](assets/checkpoint-opens-in-marker-mode-by-default-step-03.jpg)

### Switching to Radio Operator mode replaces the runner grid with a scan zone



**Navigate to checkpoint 1 in default Marker mode**

![Navigate to checkpoint 1 in default Marker mode](assets/switching-to-radio-operator-mode-replaces-the-runner-grid-with-a-scan-zone-step-01.jpg)

**Click Radio Operator toggle button**

![Click Radio Operator toggle button](assets/switching-to-radio-operator-mode-replaces-the-runner-grid-with-a-scan-zone-step-02.jpg)

**Radio Operator mode — scan zone is visible with Scan QR button**

![Radio Operator mode — scan zone is visible with Scan QR button](assets/switching-to-radio-operator-mode-replaces-the-runner-grid-with-a-scan-zone-step-03.jpg)

### Switching back to Marker mode restores the runner grid



**Navigate to checkpoint 1 and switch to Radio Operator**

![Navigate to checkpoint 1 and switch to Radio Operator](assets/switching-back-to-marker-mode-restores-the-runner-grid-step-01.jpg)

**Click Marker toggle to switch back**

![Click Marker toggle to switch back](assets/switching-back-to-marker-mode-restores-the-runner-grid-step-02.jpg)

**Marker mode — runner grid tabs are restored**

![Marker mode — runner grid tabs are restored](assets/switching-back-to-marker-mode-restores-the-runner-grid-step-03.jpg)

### Share Batch button is visible in Marker mode with a QR icon



**Navigate to checkpoint 1 in Marker mode**

![Navigate to checkpoint 1 in Marker mode](assets/share-batch-button-is-visible-in-marker-mode-with-a-qr-icon-step-01.jpg)

**Share Batch FAB is visible with QR icon**

![Share Batch FAB is visible with QR icon](assets/share-batch-button-is-visible-in-marker-mode-with-a-qr-icon-step-02.jpg)

### Share Batch button is hidden in Radio Operator mode



**Navigate to checkpoint 1 in Marker mode**

![Navigate to checkpoint 1 in Marker mode](assets/share-batch-button-is-hidden-in-radio-operator-mode-step-01.jpg)

**Switch to Radio Operator mode**

![Switch to Radio Operator mode](assets/share-batch-button-is-hidden-in-radio-operator-mode-step-02.jpg)

**Share Batch button is no longer visible**

![Share Batch button is no longer visible](assets/share-batch-button-is-hidden-in-radio-operator-mode-step-03.jpg)

### Share Batch opens the batch share modal



**Navigate to checkpoint 1 in Marker mode**

![Navigate to checkpoint 1 in Marker mode](assets/share-batch-opens-the-batch-share-modal-step-01.jpg)

**Click Share Batch button**

![Click Share Batch button](assets/share-batch-opens-the-batch-share-modal-step-02.jpg)

**Batch share modal appears with Share Batch heading**

![Batch share modal appears with Share Batch heading](assets/share-batch-opens-the-batch-share-modal-step-03.jpg)

## Radio Procedure (WICEN)

What to say on air. The app never shows radio wording — use these notes alongside the Callout sheet, Read-out and base Receive screens.

### Call types (WICEN brief)

- **Unofficial message:** "VK4WIP this is VK4[CALLSIGN]" — general contact, no log entry.
- **Scores Checkpoint:** "VK4WIP this is VK4[CALLSIGN] Scores Checkpoint?" — base acknowledges, then the checkpoint sends common time + competitor numbers.
- **Official written message:** "VK4WIP this is VK4[CALLSIGN] Official Message" — base readies the log pad. Must include sender, recipient, message number, date/time and the originator's signature.
- **Stand down:** call base for permission once the sweep vehicle has passed.

### Reporting rules

- Send grouped times every 5 to 10 competitors, no more than ~5 minutes delay.
- Times are approximate — grouped into 5-minute blocks (common times).
- Read every bib number individually. Never read ranges ("144 to 148").

### Checkpoint: sending a Scores Checkpoint call

1. The Callout sheet shows a gold **Call due** banner when the 5–10 competitor / ~5 minute rule is reached.
2. Call base: "VK4WIP this is VK4[CALLSIGN], Scores Checkpoint?" and wait for base to acknowledge.
3. For each block, give the common time, then the numbers.
4. Busy block: tap **Read out**. Numbers are split into overs of up to 5. Tick each number as you read it; **Base copied — next** unlocks when all are ticked. End each over with "more to follow, over" and the last with "that completes [time], over". **Reset** clears the ticks on the current over if base needs it again.
5. When base has copied everything, tap **Base copied — mark sent**.

### Base: receiving a call

1. Listen for "VK4WIP this is VK4…, Scores Checkpoint?" and tap that checkpoint under **Who's calling?** (gold **Due** = no call for 8+ minutes with runners expected).
2. Acknowledge: "[CALLSIGN], VK4WIP — go ahead with scores."
3. The time row opens on that checkpoint's **next** block (base is often 45–60 min behind). Tap a different block if they give another time, or type an exact time.
4. Type each number as it's read (keyboard or keypad) and **Add**. Say "copied, go ahead" between overs.
5. They move to the next time: tap **Next →**. The numbers box clears; earlier blocks stay in the call ("Also in this call: 07:40 · 5").
6. Missed a number? Ask "say again after [last number]".
7. Tap **Complete**, then confirm on air: "Copied [N] competitors. VK4WIP."
8. **Clear [time]** wipes the current block; **Cancel call** (tap twice) drops the whole call. Both have Undo.

### Number checks at base

- Blue: fine to record.
- Blue with dark border: not seen at the previous checkpoint (possible missed runner) — still recorded.
- Gold: already logged at this checkpoint, or said twice — skipped.
- Red, struck through: not in the race, or DNF/DNS — skipped.

### Fixing mistakes

Checkpoint:
- Tap a marked runner on **Mark off** to change its time (−5/−1/+1/+5) or unmark it. Unmarking shows Undo.
- An unmarked runner keeps "was HH:MM"; tapping it restores the original time or uses now.
- **Overview**: tap any runner to change time, undo call-in, reset to not passed, or mark DNS/DNF. Every change has Undo.
- Changing a time base already has sends it back to the callout sheet as a correction.

Base:
- **DNF / DNS** tab: bulk add by typing or pasting numbers, choose where and why, apply; Clear any entry to put a runner back in the race.
- **Reports › Needs attention**: duplicates, out-of-order times, skipped checkpoints, sightings after DNF/DNS, unknown bibs, impossible pace — resolve each in place.
