# RaceTracker Pro — User Guide

> This guide is auto-generated from the Playwright journey tests.
> Screenshots show the actual app at each key step.
> Regenerate with: `npm run generate:guide`

## Setting Up a Race

Use these steps to create and manage races. This section covers the full setup wizard, runner ranges, checkpoints, waves, and the race overview.

### Step indicator advances correctly through setup wizard

The race creation wizard has four steps: Template, Race Details, Runner Setup, and Waves. This test checks that the progress indicator at the top updates as you advance through each step, so the race director always knows where they are in the setup process.

**Step 1 of 4 — Template: setup wizard opens**

![Step 1 of 4 — Template: setup wizard opens](assets/step-indicator-advances-correctly-through-setup-wizard-step-01.png)

**Step 2 of 4 — Race Details: step indicator shows step 2**

![Step 2 of 4 — Race Details: step indicator shows step 2](assets/step-indicator-advances-correctly-through-setup-wizard-step-02.png)

**Step 3 of 4 — Runner Setup: step indicator advances to step 3**

![Step 3 of 4 — Runner Setup: step indicator advances to step 3](assets/step-indicator-advances-correctly-through-setup-wizard-step-03.png)

### Back button on step 2 returns to race details with data preserved

If a race director fills in the race name and other details on Step 2 of 4 (Race Details), moves on to Step 3 of 4 (Runner Setup), then clicks Back, all their work should still be there — the race name and other fields must not be wiped out. Nobody should have to retype information just because they went back a step.

**Step 1 of 4 — Template: choose Start from Scratch**

![Step 1 of 4 — Template: choose Start from Scratch](assets/back-button-on-step-2-returns-to-race-details-with-data-preserved-step-01.png)

**Step 2 of 4 — Race Details: fill in race name and details**

![Step 2 of 4 — Race Details: fill in race name and details](assets/back-button-on-step-2-returns-to-race-details-with-data-preserved-step-02.png)

**Step 3 of 4 — Runner Setup: navigate forward then press Back**

![Step 3 of 4 — Runner Setup: navigate forward then press Back](assets/back-button-on-step-2-returns-to-race-details-with-data-preserved-step-03.png)

**Step 2 of 4 — Race Details: data preserved after Back**

![Step 2 of 4 — Race Details: data preserved after Back](assets/back-button-on-step-2-returns-to-race-details-with-data-preserved-step-04.png)

### Race management page lists created races

The Race Management page is the race director's central hub where all races are listed. This test confirms that a race created earlier in the test suite appears on that page.

**Race Management — page lists all created races**

![Race Management — page lists all created races](assets/race-management-page-lists-created-races-step-01.png)

### Clicking a race opens its overview

When the race director clicks on a race in the management list, they should be taken to that race's overview page where they can see all the details. This test confirms that navigation works correctly.

**Race Management — page with race listed**

![Race Management — page with race listed](assets/clicking-a-race-opens-its-overview-step-01.png)

**Race card — click race name to open overview**

![Race card — click race name to open overview](assets/clicking-a-race-opens-its-overview-step-02.png)

**Race overview — name and details visible**

![Race overview — name and details visible](assets/clicking-a-race-opens-its-overview-step-03.png)

### Runner name/gender section appears after adding a range

After a race director adds a bib number range on Step 3 of the setup wizard, an optional section appears for entering runner first names, last names, and gender. This is purely optional — races can be tracked without personal data.

**Navigate to race setup wizard**

![Navigate to race setup wizard](assets/runner-name-gender-section-appears-after-adding-a-range-step-01.png)

**Fill in Race Details and advance to Step 3**

![Fill in Race Details and advance to Step 3](assets/runner-name-gender-section-appears-after-adding-a-range-step-02.png)

**Remove default range and add range 200-205**

![Remove default range and add range 200-205](assets/runner-name-gender-section-appears-after-adding-a-range-step-03.png)

**Check that optional names section toggle is visible**

![Check that optional names section toggle is visible](assets/runner-name-gender-section-appears-after-adding-a-range-step-04.png)

### Waves step shows default wave and allows adding more

Step 4 of the race setup wizard is the Waves step, which groups runners into separate start batches. By default one wave is provided. A race director can add a second wave using the Add Wave button.

**Navigate through setup wizard to the Waves step**

![Navigate through setup wizard to the Waves step](assets/waves-step-shows-default-wave-and-allows-adding-more-step-01.png)

**Confirm Waves step heading and at least one wave row**

![Confirm Waves step heading and at least one wave row](assets/waves-step-shows-default-wave-and-allows-adding-more-step-02.png)

**Click "+ Add Wave" to add a second wave**

![Click "+ Add Wave" to add a second wave](assets/waves-step-shows-default-wave-and-allows-adding-more-step-03.png)

### Wave name and time fields are editable and save

A race director can give each wave a custom name (e.g. "Wave B") and a specific start time (e.g. "07:30"). These are saved to the database so checkpoint volunteers know when each wave started.

**Navigate through setup wizard to the Waves step**

![Navigate through setup wizard to the Waves step](assets/wave-name-and-time-fields-are-editable-and-save-step-01.png)

**Confirm "+ Add Wave" button is available**

![Confirm "+ Add Wave" button is available](assets/wave-name-and-time-fields-are-editable-and-save-step-02.png)

**Add a second wave**

![Add a second wave](assets/wave-name-and-time-fields-are-editable-and-save-step-03.png)

**Set second wave name to "Wave B" and start time to "07:30"**

![Set second wave name to "Wave B" and start time to "07:30"](assets/wave-name-and-time-fields-are-editable-and-save-step-04.png)

**Verify "Wave B" appears in the wave name input**

![Verify "Wave B" appears in the wave name input](assets/wave-name-and-time-fields-are-editable-and-save-step-05.png)

## Running a Checkpoint

Steps for checkpoint volunteers. Covers opening a checkpoint, marking off runners individually and in bulk, reviewing counts, exporting data, and transferring data to another device via QR code.

### Marks off a single runner via the runner grid

A checkpoint volunteer clicks on a single runner's bib number tile in the grid to record that the runner passed through. The tile should change colour or appearance to make it obvious that runner has been marked as "through".

**Checkpoint view — runner grid visible**

![Checkpoint view — runner grid visible](assets/marks-off-a-single-runner-via-the-runner-grid-step-01.png)

**Runner grid — tap first runner tile (200s range)**

![Runner grid — tap first runner tile (200s range)](assets/marks-off-a-single-runner-via-the-runner-grid-step-02.png)

**Runner tile — marked state applied**

![Runner tile — marked state applied](assets/marks-off-a-single-runner-via-the-runner-grid-step-03.png)

### Marks off multiple runners via Quick Entry

Instead of finding runners in the grid, a volunteer can just type a bib number and press Enter to record it quickly. This test enters two bib numbers one after the other using the quick-entry shortcut and confirms both runners are marked off.

**Quick Entry — type first bib number and press Enter**

![Quick Entry — type first bib number and press Enter](assets/marks-off-multiple-runners-via-quick-entry-step-01.png)

**Quick Entry — type second bib number and press Enter**

![Quick Entry — type second bib number and press Enter](assets/marks-off-multiple-runners-via-quick-entry-step-02.png)

**Runner grid — both runners marked off**

![Runner grid — both runners marked off](assets/marks-off-multiple-runners-via-quick-entry-step-03.png)

### Switches to Callout Sheet tab

The Callout Sheet tab shows the list of runners who have not yet been recorded at this checkpoint. Volunteers read these numbers out over the radio to base station. This test checks the tab loads correctly and the list is visible.

**Checkpoint view — Mark Off tab active**

![Checkpoint view — Mark Off tab active](assets/switches-to-callout-sheet-tab-step-01.png)

**Callout Sheet tab — tap to switch**

![Callout Sheet tab — tap to switch](assets/switches-to-callout-sheet-tab-step-02.png)

**Callout Sheet — unrecorded runners listed**

![Callout Sheet — unrecorded runners listed](assets/switches-to-callout-sheet-tab-step-03.png)

### Switches to Overview tab and shows runner counts

The Overview tab shows a summary — how many runners have been through, how many are still expected, and other totals. This test confirms those summary numbers appear correctly when the tab is selected.

**Checkpoint view — navigate to checkpoint**

![Checkpoint view — navigate to checkpoint](assets/switches-to-overview-tab-and-shows-runner-counts-step-01.png)

**Overview tab — tap to switch**

![Overview tab — tap to switch](assets/switches-to-overview-tab-and-shows-runner-counts-step-02.png)

**Overview — runner count summary visible**

![Overview — runner count summary visible](assets/switches-to-overview-tab-and-shows-runner-counts-step-03.png)

### Can export checkpoint results

At the end of a checkpoint shift, a volunteer may need to export their recorded data to share with base station or keep as a backup. This test checks that the export option can be opened from the checkpoint screen.

**Checkpoint view — navigate to checkpoint**

![Checkpoint view — navigate to checkpoint](assets/can-export-checkpoint-results-step-01.png)

**Export option — triggers JSON download**

![Export option — triggers JSON download](assets/can-export-checkpoint-results-step-02.png)

### Navigates from race overview to a checkpoint

From the race overview, a race director can jump straight to any checkpoint's live mark-off screen. This test clicks the Checkpoint 1 link and confirms the checkpoint mark-off screen opens.

**Checkpoint view — mark-off screen for CP1 open**

![Checkpoint view — mark-off screen for CP1 open](assets/navigates-from-race-overview-to-a-checkpoint-step-01.png)

### Callout sheet tab shows runners who passed but not called in

The Callout Sheet tab lists all runners who have been marked as passed at the checkpoint but have not yet been confirmed as called in to base station. Checkpoint volunteers use this list to make radio calls.

**Mark Off tab — mark two runners as passed**

![Mark Off tab — mark two runners as passed](assets/callout-sheet-tab-shows-runners-who-passed-but-not-called-in-step-01.png)

**Callout Sheet tab — click to switch**

![Callout Sheet tab — click to switch](assets/callout-sheet-tab-shows-runners-who-passed-but-not-called-in-step-02.png)

**Callout Sheet — verify content is visible**

![Callout Sheet — verify content is visible](assets/callout-sheet-tab-shows-runners-who-passed-but-not-called-in-step-03.png)

### Pending count badge decrements when runner is called in

When a checkpoint volunteer marks a runner as called in, the pending count badge on the Callout Sheet tab decreases by one. If all runners have been called in the badge disappears.

**Mark Off tab — mark a runner to create a callout segment**

![Mark Off tab — mark a runner to create a callout segment](assets/pending-count-badge-decrements-when-runner-is-called-in-step-01.png)

**Tab bar — check for pending count badge**

![Tab bar — check for pending count badge](assets/pending-count-badge-decrements-when-runner-is-called-in-step-02.png)

**Callout Sheet — click Mark Called if a pending segment exists**

![Callout Sheet — click Mark Called if a pending segment exists](assets/pending-count-badge-decrements-when-runner-is-called-in-step-03.png)

### Transfer Data button appears in checkpoint header



**Checkpoint header — Transfer Data button is visible**

![Checkpoint header — Transfer Data button is visible](assets/transfer-data-button-appears-in-checkpoint-header-step-01.png)

### Navigates to transfer view and shows Send and Receive tabs



**Transfer view — click Transfer Data button**

![Transfer view — click Transfer Data button](assets/navigates-to-transfer-view-and-shows-send-and-receive-tabs-step-01.png)

**Transfer view — Send and Receive tabs visible**

![Transfer view — Send and Receive tabs visible](assets/navigates-to-transfer-view-and-shows-send-and-receive-tabs-step-02.png)

**Transfer view — Send tab is active by default**

![Transfer view — Send tab is active by default](assets/navigates-to-transfer-view-and-shows-send-and-receive-tabs-step-03.png)

**Transfer view — scope options are visible**

![Transfer view — scope options are visible](assets/navigates-to-transfer-view-and-shows-send-and-receive-tabs-step-04.png)

### Back button returns to the checkpoint view



**Navigate to transfer route**

![Navigate to transfer route](assets/back-button-returns-to-the-checkpoint-view-step-01.png)

## Importing & Exporting Data

Transfer race configurations and results between devices. Export from the base station header or race management page; import to restore a race.

### Downloads a race configuration JSON file

This test triggers the export function and confirms that a JSON file is actually downloaded to the device. The file should contain the race configuration — name, checkpoints, runner numbers — that can be used to restore the race on another device.

**Race Management — page with created race listed**

![Race Management — page with created race listed](assets/downloads-a-race-configuration-json-file-step-01.png)

**Race card — open dropdown then click Export**

![Race card — open dropdown then click Export](assets/downloads-a-race-configuration-json-file-step-02.png)

**Download triggered — JSON file confirmed in temp folder**

![Download triggered — JSON file confirmed in temp folder](assets/downloads-a-race-configuration-json-file-step-03.png)

### Imports a race configuration and restores data

After wiping all data from the app, this test uploads a previously exported race file and confirms the race is fully restored — the race name, checkpoints, and runner numbers all come back exactly as they were before the data was cleared.

## Navigating the App

How to move between modules, what to expect on the home screen, and how the app protects active operations from accidental navigation.

### Navigates from race overview to base station

From the race overview, a race director can jump straight to the base station. This test clicks the Base Station button on the overview page and confirms the base station operations screen opens.

**Navigate directly to base station operations**

![Navigate directly to base station operations](assets/navigates-from-race-overview-to-base-station-step-01.png)

**Base Station — operations screen open**

![Base Station — operations screen open](assets/navigates-from-race-overview-to-base-station-step-02.png)

### Home page landing shows the race management module card

The Race Maintenance module card should always be visible on the home screen so race directors can always find it easily. This test simply confirms the card is present.

**Home — Race Maintenance module card visible**

![Home — Race Maintenance module card visible](assets/home-page-landing-shows-the-race-management-module-card-step-01.png)

### Shows protection modal when leaving active checkpoint operation

While a checkpoint volunteer is actively recording runners, the app should warn them if they try to navigate away — for example by tapping the back button or going to a different module. This prevents accidentally losing all their recorded data. This test triggers that navigation and confirms the warning appears.

**Attempt navigation away — go to home /**

![Attempt navigation away — go to home /](assets/shows-protection-modal-when-leaving-active-checkpoint-operation-step-01.png)

**Protection modal — operation warning or graceful fallback**

![Protection modal — operation warning or graceful fallback](assets/shows-protection-modal-when-leaving-active-checkpoint-operation-step-02.png)

### Allows navigation after confirming exit from active operation

If a volunteer sees the "you're about to leave an active session" warning and confirms they want to leave anyway, the app should let them go and return them to the home screen. This test confirms that confirming the exit actually works.

**Confirm exit — trigger exit and accept confirmation**

![Confirm exit — trigger exit and accept confirmation](assets/allows-navigation-after-confirming-exit-from-active-operation-step-01.png)

**Navigation complete — landed on non-checkpoint route**

![Navigation complete — landed on non-checkpoint route](assets/allows-navigation-after-confirming-exit-from-active-operation-step-02.png)

### Home page module cards are all accessible when no operation is active

When the app is idle on the home screen and no operation is in progress, all three module cards — Checkpoint Operations, Base Station, and Race Maintenance — should be enabled and ready to tap. This test confirms none of them are accidentally disabled.

**Home page — all module cards visible and enabled**

![Home page — all module cards visible and enabled](assets/home-page-module-cards-are-all-accessible-when-no-operation-is-active-step-01.png)

### Unknown routes redirect to home

If someone types a web address that doesn't exist in the app (perhaps a typo or an old bookmark), they should be automatically sent to the home page rather than seeing a blank or broken screen.

**Unknown route — redirects to home page**

![Unknown route — redirects to home page](assets/unknown-routes-redirect-to-home-step-01.png)

## Settings

Personalise the app. Toggle dark mode and understand how preferences are saved.

### Opens and closes the Settings modal

Tapping the settings cog in the top-right corner should open the settings panel. Pressing the Escape key (or tapping close) should dismiss it cleanly. This test confirms both actions work.

**Home — tap Settings cog button (aria-label Settings)**

![Home — tap Settings cog button (aria-label Settings)](assets/opens-and-closes-the-settings-modal-step-01.png)

**Settings modal — panel open with customisation options**

![Settings modal — panel open with customisation options](assets/opens-and-closes-the-settings-modal-step-02.png)

**Settings modal — closed after pressing X button**

![Settings modal — closed after pressing X button](assets/opens-and-closes-the-settings-modal-step-03.png)

### Toggles dark mode on and off

The dark mode toggle in settings switches the app between a light colour scheme and a dark one. This test turns dark mode on, confirms the dark theme is applied, then turns it back off and confirms the light theme is restored.

**Home — open Settings modal**

![Home — open Settings modal](assets/toggles-dark-mode-on-and-off-step-01.png)

**Settings modal — locate Dark Mode toggle switch**

![Settings modal — locate Dark Mode toggle switch](assets/toggles-dark-mode-on-and-off-step-02.png)

**Dark mode ON — html element gains "dark" class**

![Dark mode ON — html element gains "dark" class](assets/toggles-dark-mode-on-and-off-step-03.png)

**Dark mode OFF — "dark" class removed from html element**

![Dark mode OFF — "dark" class removed from html element](assets/toggles-dark-mode-on-and-off-step-04.png)

### Settings persist after closing and reopening the modal

Changes made in settings should be saved and remembered. If dark mode is turned on and the settings panel is closed then reopened, dark mode should still be on — the preference should not reset.

**Home — open Settings modal**

![Home — open Settings modal](assets/settings-persist-after-closing-and-reopening-the-modal-step-01.png)

**Settings modal — enable dark mode and save**

![Settings modal — enable dark mode and save](assets/settings-persist-after-closing-and-reopening-the-modal-step-02.png)

**Home — reopen Settings modal**

![Home — reopen Settings modal](assets/settings-persist-after-closing-and-reopening-the-modal-step-03.png)

**Settings modal — dark mode toggle persists as checked**

![Settings modal — dark mode toggle persists as checked](assets/settings-persist-after-closing-and-reopening-the-modal-step-04.png)
