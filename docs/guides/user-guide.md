# RaceTracker Pro — User Guide

> This guide is auto-generated from the Playwright journey tests.
> Screenshots show the actual app at each key step.
> Regenerate with: `npm run generate:guide`

## Setting Up a Race

Use these steps to create and manage races. This section covers the full setup wizard, runner ranges, checkpoints, waves, and the race overview.

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

### Creates a second race from the management page

A race director creates a second race directly from the management screen, going through the full two-step setup wizard (race details, then runner ranges) and landing on the new race's overview page.

**Race Management — tap Create New Race button**

![Race Management — tap Create New Race button](assets/creates-a-second-race-from-the-management-page-step-01.jpg)

**Step 1 of 4 — Template: choose Start from Scratch**

![Step 1 of 4 — Template: choose Start from Scratch](assets/creates-a-second-race-from-the-management-page-step-02.jpg)

**Step 2 of 4 — Race Details: enter name, date, start time**

![Step 2 of 4 — Race Details: enter name, date, start time](assets/creates-a-second-race-from-the-management-page-step-03.jpg)

**Step 3 of 4 — Runner Setup: add bib range 500–503**

![Step 3 of 4 — Runner Setup: add bib range 500–503](assets/creates-a-second-race-from-the-management-page-step-04.jpg)

**Waves, course map and checkpoint links — accept the defaults to create the race**

![Waves, course map and checkpoint links — accept the defaults to create the race](assets/creates-a-second-race-from-the-management-page-step-05.jpg)

**Race overview — second race created successfully**

![Race overview — second race created successfully](assets/creates-a-second-race-from-the-management-page-step-06.jpg)

### Race overview shows correct runner and checkpoint counts

After creating a race with runner bib numbers 400 to 405 (6 runners) and 2 checkpoints, the race overview page should display "6" as the runner count and "2" as the checkpoint count — no more, no less.

**Race overview — runner count 6 and checkpoint count 2 shown**

![Race overview — runner count 6 and checkpoint count 2 shown](assets/race-overview-shows-correct-runner-and-checkpoint-counts-step-01.jpg)

### Creates a new race from scratch and verifies the overview

A race director fills in all the details needed to create a brand-new race — the race name, date, start time, how many checkpoints there are, and the range of runner bib numbers. Once saved, the race overview page should correctly display the race name, list every checkpoint, and show the right number of registered runners.

**Home — Welcome Back screen with 3 module cards**

![Home — Welcome Back screen with 3 module cards](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-01.jpg)

**Race Maintenance → Create New Race — setup wizard opens**

![Race Maintenance → Create New Race — setup wizard opens](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-02.jpg)

**Step 1 of 4 — Template: choose Start from Scratch**

![Step 1 of 4 — Template: choose Start from Scratch](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-03.jpg)

**Step 2 of 4 — Race Details: enter name, date, start time and checkpoints**

![Step 2 of 4 — Race Details: enter name, date, start time and checkpoints](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-04.jpg)

**Step 3 of 4 — Runner Setup: add bib number range 101–115**

![Step 3 of 4 — Runner Setup: add bib number range 101–115](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-05.jpg)

**Race overview — name, 3 checkpoints and 15 runners correct**

![Race overview — name, 3 checkpoints and 15 runners correct](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-06.jpg)

**Home — new race listed under module cards**

![Home — new race listed under module cards](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-07.jpg)

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

### Race setup fits a phone



**Runner setup at 390 px — the range row fits; Back and Next on one line**

![Runner setup at 390 px — the range row fits; Back and Next on one line](assets/race-setup-fits-a-phone-step-01.jpg)

### Mt glorious template matches the brief



**Template — Mt Glorious starts at 06:30 with four checkpoints; bibs are set at setup**

![Template — Mt Glorious starts at 06:30 with four checkpoints; bibs are set at setup](assets/mt-glorious-template-matches-the-brief-step-01.jpg)

### A race with bibs assigned on the day



**Setup — tick "Bibs assigned on the day": Next works with no runners**

![Setup — tick "Bibs assigned on the day": Next works with no runners](assets/a-race-with-bibs-assigned-on-the-day-step-01.jpg)

**Checkpoint — empty grid with a hint; Still to come "—"; quick entry creates tiles**

![Checkpoint — empty grid with a hint; Still to come "—"; quick entry creates tiles](assets/a-race-with-bibs-assigned-on-the-day-step-02.jpg)

**Base — On course and not seen yet show "—"**

![Base — On course and not seen yet show "—"](assets/a-race-with-bibs-assigned-on-the-day-step-03.jpg)

### The Mt Glorious template has no fixed bib range



**Template card — "Bibs set at setup"; choosing it starts the runner step empty**

![Template card — "Bibs set at setup"; choosing it starts the runner step empty](assets/the-mt-glorious-template-has-no-fixed-bib-range-step-01.jpg)

### Race edit changes frequency



**Edit race — set the frequency; there is no callsign field**

![Edit race — set the frequency; there is no callsign field](assets/race-edit-changes-frequency-step-01.jpg)

**Callout — the new frequency, and no callsigns anywhere on the checkpoint**

![Callout — the new frequency, and no callsigns anywhere on the checkpoint](assets/race-edit-changes-frequency-step-02.jpg)

**Base — the board names checkpoints without callsigns**

![Base — the board names checkpoints without callsigns](assets/race-edit-changes-frequency-step-03.jpg)

### An edited setup keeps marks already on a device



**Mark bib 100 at checkpoint 1**

![Mark bib 100 at checkpoint 1](assets/an-edited-setup-keeps-marks-already-on-a-device-step-01.jpg)

**Edit the frequency, then download the setup**

![Edit the frequency, then download the setup](assets/an-edited-setup-keeps-marks-already-on-a-device-step-02.jpg)

**Import the setup on the same device, updating the existing race**

![Import the setup on the same device, updating the existing race](assets/an-edited-setup-keeps-marks-already-on-a-device-step-03.jpg)

**Checkpoint 1 — runner 100 still shows its time**

![Checkpoint 1 — runner 100 still shows its time](assets/an-edited-setup-keeps-marks-already-on-a-device-step-04.jpg)

### An 11 km field seen only at CP4 is not missed at CP1 to CP3



**Import the entry list — Race No, Name and Wave are picked up on their own**

![Import the entry list — Race No, Name and Wave are picked up on their own](assets/an-11-km-field-seen-only-at-cp4-is-not-missed-at-cp1-to-cp3-step-01.jpg)

**Race details — four checkpoints**

![Race details — four checkpoints](assets/an-11-km-field-seen-only-at-cp4-is-not-missed-at-cp1-to-cp3-step-02.jpg)

**Edit race — CP1 to CP3 see the two 22 km waves only**

![Edit race — CP1 to CP3 see the two 22 km waves only](assets/an-11-km-field-seen-only-at-cp4-is-not-missed-at-cp1-to-cp3-step-03.jpg)

**Base hears CP4 — 11 km bib 150 is not "Not seen CP3"; 22 km bib 10 is**

![Base hears CP4 — 11 km bib 150 is not "Not seen CP3"; 22 km bib 10 is](assets/an-11-km-field-seen-only-at-cp4-is-not-missed-at-cp1-to-cp3-step-04.jpg)

**Board — CP1 to CP3 have nobody missed except the 22 km runner**

![Board — CP1 to CP3 have nobody missed except the 22 km runner](assets/an-11-km-field-seen-only-at-cp4-is-not-missed-at-cp1-to-cp3-step-05.jpg)

**Stand-down check CP1 — the 11 km runner is not on it**

![Stand-down check CP1 — the 11 km runner is not on it](assets/an-11-km-field-seen-only-at-cp4-is-not-missed-at-cp1-to-cp3-step-06.jpg)

**Overview — 22 km and 11 km leaders ranked apart, with the time at their last checkpoint**

![Overview — 22 km and 11 km leaders ranked apart, with the time at their last checkpoint](assets/an-11-km-field-seen-only-at-cp4-is-not-missed-at-cp1-to-cp3-step-07.jpg)

## Running a Checkpoint

Steps for checkpoint volunteers. Covers opening a checkpoint, marking off runners individually and in bulk, reviewing counts, exporting data, and transferring data to another device via QR code.

### Navigates to checkpoint and sees runner grid

A checkpoint volunteer opens the app, taps "Checkpoint Operations", selects their race, and arrives at the correct checkpoint screen. This test confirms that the grid of runner bib numbers — the list of every runner they need to watch for — is visible and fully loaded.

**Home — tap Checkpoint Operations module card**

![Home — tap Checkpoint Operations module card](assets/navigates-to-checkpoint-and-sees-runner-grid-step-01.jpg)

**Checkpoint view — runner grid loaded with bib numbers 200–210**

![Checkpoint view — runner grid loaded with bib numbers 200–210](assets/navigates-to-checkpoint-and-sees-runner-grid-step-02.jpg)

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

### Shows empty state warning when no runners are marked off



**Navigate to transfer route with no marked runners**

![Navigate to transfer route with no marked runners](assets/shows-empty-state-warning-when-no-runners-are-marked-off-step-01.jpg)

**Send tab — entry count shows 0 entries**

![Send tab — entry count shows 0 entries](assets/shows-empty-state-warning-when-no-runners-are-marked-off-step-02.jpg)

**Generate QR Code button is disabled with 0 entries**

![Generate QR Code button is disabled with 0 entries](assets/shows-empty-state-warning-when-no-runners-are-marked-off-step-03.jpg)

### Generates a QR code when marked runners are present



**Seed 8 marked runners into checkpoint 1**

![Seed 8 marked runners into checkpoint 1](assets/generates-a-qr-code-when-marked-runners-are-present-step-01.jpg)

**Navigate to transfer route**

![Navigate to transfer route](assets/generates-a-qr-code-when-marked-runners-are-present-step-02.jpg)

**Send tab — entry count preview shows 8 entries**

![Send tab — entry count preview shows 8 entries](assets/generates-a-qr-code-when-marked-runners-are-present-step-03.jpg)

**Click Generate QR Code button**

![Click Generate QR Code button](assets/generates-a-qr-code-when-marked-runners-are-present-step-04.jpg)

**QR display — full-screen QR code appears**

![QR display — full-screen QR code appears](assets/generates-a-qr-code-when-marked-runners-are-present-step-05.jpg)

**QR display — entry count label is shown**

![QR display — entry count label is shown](assets/generates-a-qr-code-when-marked-runners-are-present-step-06.jpg)

**QR display — "Done" and file share buttons are present**

![QR display — "Done" and file share buttons are present](assets/generates-a-qr-code-when-marked-runners-are-present-step-07.jpg)

### Delta scope shows only entries newer than last share timestamp



**Seed 5 marked runners and set a last-share timestamp after 3 of them**

![Seed 5 marked runners and set a last-share timestamp after 3 of them](assets/delta-scope-shows-only-entries-newer-than-last-share-timestamp-step-01.jpg)

**Navigate to transfer route**

![Navigate to transfer route](assets/delta-scope-shows-only-entries-newer-than-last-share-timestamp-step-02.jpg)

**Delta option selected — entry count shows 2 new entries**

![Delta option selected — entry count shows 2 new entries](assets/delta-scope-shows-only-entries-newer-than-last-share-timestamp-step-03.jpg)

**Switching to full history shows all 5 entries**

![Switching to full history shows all 5 entries](assets/delta-scope-shows-only-entries-newer-than-last-share-timestamp-step-04.jpg)

### Receive tab shows scanner and file import fallback



**Navigate to transfer route and open Receive tab**

![Navigate to transfer route and open Receive tab](assets/receive-tab-shows-scanner-and-file-import-fallback-step-01.jpg)

**Receive tab — description text is shown**

![Receive tab — description text is shown](assets/receive-tab-shows-scanner-and-file-import-fallback-step-02.jpg)

**Receive tab — Start Scanning button is visible**

![Receive tab — Start Scanning button is visible](assets/receive-tab-shows-scanner-and-file-import-fallback-step-03.jpg)

**Start Scanning — the file import fallback is offered under the camera**

![Start Scanning — the file import fallback is offered under the camera](assets/receive-tab-shows-scanner-and-file-import-fallback-step-04.jpg)

### Back button returns to the checkpoint view



**Navigate to transfer route**

![Navigate to transfer route](assets/back-button-returns-to-the-checkpoint-view-step-01.jpg)

**Tap back button — returns to /checkpoint/1**

![Tap back button — returns to /checkpoint/1](assets/back-button-returns-to-the-checkpoint-view-step-02.jpg)

### Header shows location and frequency in full



**Mark off — the location wraps rather than cut off; no callsign**

![Mark off — the location wraps rather than cut off; no callsign](assets/header-shows-location-and-frequency-in-full-step-01.jpg)

**Callout — "CP3 · Callout" and the frequency 147.225; no callsigns**

![Callout — "CP3 · Callout" and the frequency 147.225; no callsigns](assets/header-shows-location-and-frequency-in-full-step-02.jpg)

**Callout — tracking only: no message or stand-down log**

![Callout — tracking only: no message or stand-down log](assets/header-shows-location-and-frequency-in-full-step-03.jpg)

**Overview — "CP3 · Overview"; the tap hint heads the list**

![Overview — "CP3 · Overview"; the tap hint heads the list](assets/header-shows-location-and-frequency-in-full-step-04.jpg)

### Share batch lives in the app bar and covers no tiles



**Five runners passed — Share batch shows the count in the app bar**

![Five runners passed — Share batch shows the count in the app bar](assets/share-batch-lives-in-the-app-bar-and-covers-no-tiles-step-01.jpg)

**Bottom-right tile 119 is clickable at 390 × 844**

![Bottom-right tile 119 is clickable at 390 × 844](assets/share-batch-lives-in-the-app-bar-and-covers-no-tiles-step-02.jpg)

### Status line stays in view while the grid scrolls



**Scroll the grid to the bottom and tap a DNS runner — the message is on screen**

![Scroll the grid to the bottom and tap a DNS runner — the message is on screen](assets/status-line-stays-in-view-while-the-grid-scrolls-step-01.jpg)

### Checkpoint marks a bib not in the setup



**Quick entry 512 — marked, flagged "not in setup", in its own group**

![Quick entry 512 — marked, flagged "not in setup", in its own group](assets/checkpoint-marks-a-bib-not-in-the-setup-step-01.jpg)

**Callout — 512 is read like any other runner**

![Callout — 512 is read like any other runner](assets/checkpoint-marks-a-bib-not-in-the-setup-step-02.jpg)

**A five-digit number asks first; Undo removes 512**

![A five-digit number asks first; Undo removes 512](assets/checkpoint-marks-a-bib-not-in-the-setup-step-03.jpg)

## Operating the Base Station

Steps for the base station operator. Record finish times, mark DNF/DNS runners, and review race-wide status from the Overview and Reports tabs.

### Base station opens on Receive, ready for the first call



### Takes a call from CP1, then sees the runners on Overview



**Receive — CP1 calls in 300, 301, 302 and 303**

![Receive — CP1 calls in 300, 301, 302 and 303](assets/takes-a-call-from-cp1-then-sees-the-runners-on-overview-step-01.jpg)

**Overview — CP1 progress shows 4 and the leaders list has 300**

![Overview — CP1 progress shows 4 and the leaders list has 300](assets/takes-a-call-from-cp1-then-sees-the-runners-on-overview-step-02.jpg)

### Records a DNF via the withdrawal dialog

When a runner drops out of the race and does not finish (DNF), the base station operator needs to record this. This test opens the withdrawal dialog, enters a runner's bib number and a reason such as "Injured ankle", confirms the entry, and checks that the runner now shows a DNF status in the overview.

**Receive — press D to open the withdrawal dialog**

![Receive — press D to open the withdrawal dialog](assets/records-a-dnf-via-the-withdrawal-dialog-step-01.jpg)

**Withdrawal Dialog — enter runner 310 and reason, then submit**

![Withdrawal Dialog — enter runner 310 and reason, then submit](assets/records-a-dnf-via-the-withdrawal-dialog-step-02.jpg)

**DNF / DNS tab — runner 310 is out of the race**

![DNF / DNS tab — runner 310 is out of the race](assets/records-a-dnf-via-the-withdrawal-dialog-step-03.jpg)

### Opens Times by checkpoint in Reports



### Switches to Reports tab and renders a report

The Reports tab lets the operator generate a printed summary of race results. This test switches to the tab and checks that the report content — runner totals, times, and status counts — is visible.

### Exports base station data

The base station operator may need to export all their recorded data for backup or to share with the race director. This test checks that the import/export tool can be opened from the base station screen.

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

### Exact time does not move up-to



**CP1 call — two numbers at an earlier block and one at an exact recent time**

![CP1 call — two numbers at an earlier block and one at an exact recent time](assets/exact-time-does-not-move-up-to-step-01.jpg)

**Board says up to the earlier block; the next call opens on the block after it**

![Board says up to the earlier block; the next call opens on the block after it](assets/exact-time-does-not-move-up-to-step-02.jpg)

### Exact time is pinned and a bad time keeps the block



**Scroll the block row to the start — Exact stays in view**

![Scroll the block row to the start — Exact stays in view](assets/exact-time-is-pinned-and-a-bad-time-keeps-the-block-step-01.jpg)

**Type 2359 — rejected: red, cleared, the block stays selected, Exact not selected**

![Type 2359 — rejected: red, cleared, the block stays selected, Exact not selected](assets/exact-time-is-pinned-and-a-bad-time-keeps-the-block-step-02.jpg)

**Type a valid time as HHMM — shown as HH:MM and selected**

![Type a valid time as HHMM — shown as HH:MM and selected](assets/exact-time-is-pinned-and-a-bad-time-keeps-the-block-step-03.jpg)

### Also in this call counts numbers to record



**Six numbers in one block, three not in the race**

![Six numbers in one block, three not in the race](assets/also-in-this-call-counts-numbers-to-record-step-01.jpg)

**Next block — the pill for the first block shows 3**

![Next block — the pill for the first block shows 3](assets/also-in-this-call-counts-numbers-to-record-step-02.jpg)

### A call with nothing to record is logged plainly



**Only unknown numbers — "Log call · 0", not the gold Complete**

![Only unknown numbers — "Log call · 0", not the gold Complete](assets/a-call-with-nothing-to-record-is-logged-plainly-step-01.jpg)

**Log it — "0 recorded at CP2 · 2 skipped (flagged)"**

![Log it — "0 recorded at CP2 · 2 skipped (flagged)"](assets/a-call-with-nothing-to-record-is-logged-plainly-step-02.jpg)

### Ask reminder



**Reports › Out of order — "Ask CP2" about 106**

![Reports › Out of order — "Ask CP2" about 106](assets/ask-reminder-step-01.jpg)

**Receive — CP2 button and board row remind base to ask about 106**

![Receive — CP2 button and board row remind base to ask about 106](assets/ask-reminder-step-02.jpg)

**Asked — the reminder clears; Undo brings it back**

![Asked — the reminder clears; Undo brings it back](assets/ask-reminder-step-03.jpg)

### Receive flags a number not seen at the previous checkpoint



**CP2 call — 125 was never reported at CP1: blue info chip, still recorded**

![CP2 call — 125 was never reported at CP1: blue info chip, still recorded](assets/receive-flags-a-number-not-seen-at-the-previous-checkpoint-step-01.jpg)

### Receive shows Closed once everyone is through



**CP1 reports all five runners — its pill reads Closed**

![CP1 reports all five runners — its pill reads Closed](assets/receive-shows-closed-once-everyone-is-through-step-01.jpg)

### Receive takes an exact time typed as HH:MM



**Type the time with a colon — accepted and selected**

![Type the time with a colon — accepted and selected](assets/receive-takes-an-exact-time-typed-as-hh-mm-step-01.jpg)

### Receive draft survives a tab switch



**Overview and back — the call in progress is still there**

![Overview and back — the call in progress is still there](assets/receive-draft-survives-a-tab-switch-step-01.jpg)

### Base applies a correction



**CP2 → Correction → 101: base had the earlier call's time**

![CP2 → Correction → 101: base had the earlier call's time](assets/base-applies-a-correction-step-01.jpg)

**Pick the new time and Apply — the times table shows it; "up to" unchanged**

![Pick the new time and Apply — the times table shows it; "up to" unchanged](assets/base-applies-a-correction-step-02.jpg)

**Undo — base has the original time again**

![Undo — base has the original time again](assets/base-applies-a-correction-step-03.jpg)

### A normal call still skips a number base already has



**CP2 Scores call with 101 — gold "Had", skipped (no tap-to-replace)**

![CP2 Scores call with 101 — gold "Had", skipped (no tap-to-replace)](assets/a-normal-call-still-skips-a-number-base-already-has-step-01.jpg)

### Base records a late entry and adds an unknown bib to the field



**CP1 call with 512 and 999 — gold "Not in setup — tap to record"**

![CP1 call with 512 and 999 — gold "Not in setup — tap to record"](assets/base-records-a-late-entry-and-adds-an-unknown-bib-to-the-field-step-01.jpg)

**Tap 512 — recorded as a late entry; 999 left skipped**

![Tap 512 — recorded as a late entry; 999 left skipped](assets/base-records-a-late-entry-and-adds-an-unknown-bib-to-the-field-step-02.jpg)

**Needs attention › Unknown bibs — 999 › Add to field**

![Needs attention › Unknown bibs — 999 › Add to field](assets/base-records-a-late-entry-and-adds-an-unknown-bib-to-the-field-step-03.jpg)

### Base reminds a checkpoint of a runner it missed



**CP1 calls 100; CP2 calls 150 too — CP1 now shows "Missed: 150 (seen CP2)"**

![CP1 calls 100; CP2 calls 150 too — CP1 now shows "Missed: 150 (seen CP2)"](assets/base-reminds-a-checkpoint-of-a-runner-it-missed-step-01.jpg)

**Tap CP1 — "They have it", enter the time they give**

![Tap CP1 — "They have it", enter the time they give](assets/base-reminds-a-checkpoint-of-a-runner-it-missed-step-02.jpg)

**Undo — the reminder is back**

![Undo — the reminder is back](assets/base-reminds-a-checkpoint-of-a-runner-it-missed-step-03.jpg)

### Stand-down check before a checkpoint packs down



**Stand-down check on CP2 — 100 seen further on (CP3), 101 not seen past CP1**

![Stand-down check on CP2 — 100 seen further on (CP3), 101 not seen past CP1](assets/stand-down-check-before-a-checkpoint-packs-down-step-01.jpg)

**Stand down (two taps) — CP2 is Closed; Undo reopens it**

![Stand down (two taps) — CP2 is Closed; Undo reopens it](assets/stand-down-check-before-a-checkpoint-packs-down-step-02.jpg)

### Stand-down check puts a checked runner back on the missed list



**Reports › Skipped a checkpoint — Mark checked on 150: off CP1's missed list**

![Reports › Skipped a checkpoint — Mark checked on 150: off CP1's missed list](assets/stand-down-check-puts-a-checked-runner-back-on-the-missed-list-step-01.jpg)

**Stand-down check on CP1 — 150 seen further on; one tap adds it back; Undo**

![Stand-down check on CP1 — 150 seen further on; one tap adds it back; Undo](assets/stand-down-check-puts-a-checked-runner-back-on-the-missed-list-step-02.jpg)

## Base Station: DNF, DNS and Overview

Base keeps the race-wide out list. Mark runners DNF or DNS in bulk by typing or pasting numbers, check the warnings, and clear anyone who is back in. The Overview shows who is on course, overdue alerts, checkpoint progress and the current leaders.

### Overdue waits for the checkpoint to report



**Overview — CP2 is only behind on calls: gold note, no red alert**

![Overview — CP2 is only behind on calls: gold note, no red alert](assets/overdue-waits-for-the-checkpoint-to-report-step-01.jpg)

**CP2 calls in up to now without those runners — now they are overdue**

![CP2 calls in up to now without those runners — now they are overdue](assets/overdue-waits-for-the-checkpoint-to-report-step-02.jpg)

### On course count matches report



**Overview — On course tile with "not seen yet"**

![Overview — On course tile with "not seen yet"](assets/on-course-count-matches-report-step-01.jpg)

**Reports — Still on course shows the same numbers**

![Reports — Still on course shows the same numbers](assets/on-course-count-matches-report-step-02.jpg)

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

### Rejected chips match receive and out list rows are not cut off



**Paste a list with a number twice — the rejected chip: white, 2px red, struck through**

![Paste a list with a number twice — the rejected chip: white, 2px red, struck through](assets/rejected-chips-match-receive-and-out-list-rows-are-not-cut-off-step-01.jpg)

**Mark 112 and 113 DNF at CP1, Medical — the out list shows the whole detail**

![Mark 112 and 113 DNF at CP1, Medical — the out list shows the whole detail](assets/rejected-chips-match-receive-and-out-list-rows-are-not-cut-off-step-02.jpg)

### Withdrawal dialog uses 24-hour time and can be undone



**Open — where, 24-hour time with the date, five reasons, comments**

![Open — where, 24-hour time with the date, five reasons, comments](assets/withdrawal-dialog-uses-24-hour-time-and-can-be-undone-step-01.jpg)

**Withdraw 131 at CP2, Injury, with a comment — on the out list**

![Withdraw 131 at CP2, Injury, with a comment — on the out list](assets/withdrawal-dialog-uses-24-hour-time-and-can-be-undone-step-02.jpg)

**Undo — 131 is back in the race**

![Undo — 131 is back in the race](assets/withdrawal-dialog-uses-24-hour-time-and-can-be-undone-step-03.jpg)

### Leaders flag open data issues



**Overview — 106 (out of order) and 107 (impossible pace) carry the warning; time is HH:MM**

![Overview — 106 (out of order) and 107 (impossible pace) carry the warning; time is HH:MM](assets/leaders-flag-open-data-issues-step-01.jpg)

**Mark 107 checked in Reports — its warning goes**

![Mark 107 checked in Reports — its warning goes](assets/leaders-flag-open-data-issues-step-02.jpg)

### A runner already DNF is rejected



**Add 130 again as DNF — rejected "Already DNF", nothing to mark**

![Add 130 again as DNF — rejected "Already DNF", nothing to mark](assets/a-runner-already-dnf-is-rejected-step-01.jpg)

### A DNS row is cleared and undone



**Clear on the DNS row — back in the race; Undo puts it back**

![Clear on the DNS row — back in the race; Undo puts it back](assets/a-dns-row-is-cleared-and-undone-step-01.jpg)

### A DNF recorded at a checkpoint cannot be cleared at base



**145 was marked DNF at CP2 — its Clear is disabled with the reason**

![145 was marked DNF at CP2 — its Clear is disabled with the reason](assets/a-dnf-recorded-at-a-checkpoint-cannot-be-cleared-at-base-step-01.jpg)

### Base overview, DNF / DNS and reports fit a phone



**Overview at 390 px — no sideways page scroll (the leaders table scrolls in its box)**

![Overview at 390 px — no sideways page scroll (the leaders table scrolls in its box)](assets/base-overview-dnf-dns-and-reports-fit-a-phone-step-01.jpg)

**DNF / DNS at 390 px — bulk add above the out list**

![DNF / DNS at 390 px — bulk add above the out list](assets/base-overview-dnf-dns-and-reports-fit-a-phone-step-02.jpg)

**Reports at 390 px — the list of reports stacks above the report**

![Reports at 390 px — the list of reports stacks above the report](assets/base-overview-dnf-dns-and-reports-fit-a-phone-step-03.jpg)

### Overdue banner is an alert



**CP2 reports up to now — 110–119 are overdue: the banner has role="alert"**

![CP2 reports up to now — 110–119 are overdue: the banner has role="alert"](assets/overdue-banner-is-an-alert-step-01.jpg)

### Success and passed look different



**Finish receives 100 — heads-up grid: Passed (solid club blue) and Active (blue tint) differ**

![Finish receives 100 — heads-up grid: Passed (solid club blue) and Active (blue tint) differ](assets/success-and-passed-look-different-step-01.jpg)

## Base Station: Reports and Data Checks

Overdue runners, who is still on course, times by checkpoint and the call log — each as CSV or print. Needs attention lists duplicates, out-of-order times, skipped checkpoints, sightings after DNF / DNS, unknown bibs and impossible pace; resolve each in place, with Undo.

### Matrix keeps times for DNS runners



**Mark 101 DNS (it was seen — flagged, applied anyway)**

![Mark 101 DNS (it was seen — flagged, applied anyway)](assets/matrix-keeps-times-for-dns-runners-step-01.jpg)

**Times by checkpoint — times kept, DNS in the Status column, CSV matches**

![Times by checkpoint — times kept, DNS in the Status column, CSV matches](assets/matrix-keeps-times-for-dns-runners-step-02.jpg)

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

### Reports undo stays with its list and says what it undoes



**Out of order — Mark checked; Undo names the bib and action**

![Out of order — Mark checked; Undo names the bib and action](assets/reports-undo-stays-with-its-list-and-says-what-it-undoes-step-01.jpg)

**Switch to Skipped a checkpoint — no Undo carried over**

![Switch to Skipped a checkpoint — no Undo carried over](assets/reports-undo-stays-with-its-list-and-says-what-it-undoes-step-02.jpg)

### Identical duplicates merge



**115 at CP1 twice with the same time — Merge**

![115 at CP1 twice with the same time — Merge](assets/identical-duplicates-merge-step-01.jpg)

### A time seen after DNF is removed



**Mark 108 DNF at CP1, 45 minutes ago (it was reported at CP2 30 minutes ago)**

![Mark 108 DNF at CP1, 45 minutes ago (it was reported at CP2 30 minutes ago)](assets/a-time-seen-after-dnf-is-removed-step-01.jpg)

**Reports › Seen after DNF / DNS — Remove CP2 time**

![Reports › Seen after DNF / DNS — Remove CP2 time](assets/a-time-seen-after-dnf-is-removed-step-02.jpg)

### DNS is cleared from a check



**Reports › Seen after DNF / DNS — 101 was seen, so Clear DNS**

![Reports › Seen after DNF / DNS — 101 was seen, so Clear DNS](assets/dns-is-cleared-from-a-check-step-01.jpg)

### An unknown bib is kept for review



**Reports › Unknown bibs — Keep for review**

![Reports › Unknown bibs — Keep for review](assets/an-unknown-bib-is-kept-for-review-step-01.jpg)

### A report prints



**Print — opens the browser print dialog for the report**

![Print — opens the browser print dialog for the report](assets/a-report-prints-step-01.jpg)

### Not seen there shows missed in the times table



**CP1 › "Not seen there" for 150 — the reminder clears**

![CP1 › "Not seen there" for 150 — the reminder clears](assets/not-seen-there-shows-missed-in-the-times-table-step-01.jpg)

**Reports — Times by checkpoint reads "missed" at CP1; Skipped check is clear**

![Reports — Times by checkpoint reads "missed" at CP1; Skipped check is clear](assets/not-seen-there-shows-missed-in-the-times-table-step-02.jpg)

## Base Station: Fixing Recorded Numbers (Records)

Records shows every number base holds for one checkpoint, by block, by number or by call, with what needs checking: duplicates, missed runners, wrong numbers and other checks. Fix a time, a mistyped number or the checkpoint one at a time or as a batch. Each change asks why, keeps history and has Undo.

### Base fixes the numbers it recorded at a checkpoint



**CP2 header — Records shows how many need checking**

![CP2 header — Records shows how many need checking](assets/base-fixes-the-numbers-it-recorded-at-a-checkpoint-step-01.jpg)

**Needs attention at CP2 — counts match, each filter shows only its numbers**

![Needs attention at CP2 — counts match, each filter shows only its numbers](assets/base-fixes-the-numbers-it-recorded-at-a-checkpoint-step-02.jpg)

**Change a time — Save is locked until a reason is picked**

![Change a time — Save is locked until a reason is picked](assets/base-fixes-the-numbers-it-recorded-at-a-checkpoint-step-03.jpg)

**Undo restores the time exactly**

![Undo restores the time exactly](assets/base-fixes-the-numbers-it-recorded-at-a-checkpoint-step-04.jpg)

**Times by checkpoint and the call log show the correction**

![Times by checkpoint and the call log show the correction](assets/base-fixes-the-numbers-it-recorded-at-a-checkpoint-step-05.jpg)

**Wrong number — change 999 to 129 (base typing error); 999 stays in history**

![Wrong number — change 999 to 129 (base typing error); 999 stays in history](assets/base-fixes-the-numbers-it-recorded-at-a-checkpoint-step-06.jpg)

**Select a block — every bib listed on its own row, moved together, then Undo**

![Select a block — every bib listed on its own row, moved together, then Undo](assets/base-fixes-the-numbers-it-recorded-at-a-checkpoint-step-07.jpg)

**Move three numbers to CP3, then Undo**

![Move three numbers to CP3, then Undo](assets/base-fixes-the-numbers-it-recorded-at-a-checkpoint-step-08.jpg)

**Remove a number takes two taps, and Undo puts it back**

![Remove a number takes two taps, and Undo puts it back](assets/base-fixes-the-numbers-it-recorded-at-a-checkpoint-step-09.jpg)

**Missed runners — CP2 has 110; 111 not seen there**

![Missed runners — CP2 has 110; 111 not seen there](assets/base-fixes-the-numbers-it-recorded-at-a-checkpoint-step-10.jpg)

### Records fits the tablet with 150 numbers at one checkpoint



**150 numbers at CP2 — the list scrolls inside its panel, the page does not**

![150 numbers at CP2 — the list scrolls inside its panel, the page does not](assets/records-fits-the-tablet-with-150-numbers-at-one-checkpoint-step-01.jpg)

## Base Station: Crew & Vehicle Log

For insurance, base logs which car went to each checkpoint, who was in it, and when it left home and arrived. Arrived now is one tap when an operator radios in. The log stays on the base device and is never in the race setup sent to volunteers.

### Base logs the crews and vehicles going to each checkpoint



**Crews tab — a card per checkpoint, Base first, nothing logged yet**

![Crews tab — a card per checkpoint, Base first, nothing logged yet](assets/base-logs-the-crews-and-vehicles-going-to-each-checkpoint-step-01.jpg)

**Add a car to CP3 — rego, driver, passenger, left home 04:45 (before the start)**

![Add a car to CP3 — rego, driver, passenger, left home 04:45 (before the start)](assets/base-logs-the-crews-and-vehicles-going-to-each-checkpoint-step-02.jpg)

**Add a second car to CP3 — more than one car can go to a checkpoint**

![Add a second car to CP3 — more than one car can go to a checkpoint](assets/base-logs-the-crews-and-vehicles-going-to-each-checkpoint-step-03.jpg)

**Operator radios in — Arrived now, one tap**

![Operator radios in — Arrived now, one tap](assets/base-logs-the-crews-and-vehicles-going-to-each-checkpoint-step-04.jpg)

**Undo the last arrival — back on the way**

![Undo the last arrival — back on the way](assets/base-logs-the-crews-and-vehicles-going-to-each-checkpoint-step-05.jpg)

**Crews fit the tablet — no page scroll at 1112×834**

![Crews fit the tablet — no page scroll at 1112×834](assets/base-logs-the-crews-and-vehicles-going-to-each-checkpoint-step-06.jpg)

**From Receive, CP3 shows its crew on the way — Crew opens the same editor**

![From Receive, CP3 shows its crew on the way — Crew opens the same editor](assets/base-logs-the-crews-and-vehicles-going-to-each-checkpoint-step-07.jpg)

**Remove a vehicle takes two taps, and Undo brings it back**

![Remove a vehicle takes two taps, and Undo brings it back](assets/base-logs-the-crews-and-vehicles-going-to-each-checkpoint-step-08.jpg)

**Reports — Crew & vehicle log for insurance, CSV has every vehicle**

![Reports — Crew & vehicle log for insurance, CSV has every vehicle](assets/base-logs-the-crews-and-vehicles-going-to-each-checkpoint-step-09.jpg)

**The race setup shared with volunteers carries no crew or rego details**

![The race setup shared with volunteers carries no crew or rego details](assets/base-logs-the-crews-and-vehicles-going-to-each-checkpoint-step-10.jpg)

## Importing & Exporting Data

Transfer race configurations and results between devices. Export from the base station header or race management page; import to restore a race.

### Export modal opens from base station header

The base station screen has an import/export button in the header. This test confirms that tapping it opens the data portability dialog where the operator can choose what to export.

**Base Station — operations screen with created race**

![Base Station — operations screen with created race](assets/export-modal-opens-from-base-station-header-step-01.jpg)

**Base Station header — tap Import/Export button**

![Base Station header — tap Import/Export button](assets/export-modal-opens-from-base-station-header-step-02.jpg)

**Data portability dialog — export options visible**

![Data portability dialog — export options visible](assets/export-modal-opens-from-base-station-header-step-03.jpg)

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

### Email share stays short



**Email — the setup file downloads and a short email opens**

![Email — the setup file downloads and a short email opens](assets/email-share-stays-short-step-01.jpg)

### Import accepts octet-stream



**Import — a race file sent as application/octet-stream loads**

![Import — a race file sent as application/octet-stream loads](assets/import-accepts-octet-stream-step-01.jpg)

**Import — a file that isn't JSON is refused with a plain message**

![Import — a file that isn't JSON is refused with a plain message](assets/import-accepts-octet-stream-step-02.jpg)

### Base backs the race up to a folder and a new device restores it



**File backup off — choose a folder once**

![File backup off — choose a folder once](assets/base-backs-the-race-up-to-a-folder-and-a-new-device-restores-it-step-01.jpg)

**Take a CP1 call and a Finish call — 30 s later the file has both**

![Take a CP1 call and a Finish call — 30 s later the file has both](assets/base-backs-the-race-up-to-a-folder-and-a-new-device-restores-it-step-02.jpg)

**Withdraw a runner — the next backup has the DNF**

![Withdraw a runner — the next backup has the DNF](assets/base-backs-the-race-up-to-a-folder-and-a-new-device-restores-it-step-03.jpg)

**Reload base — the folder is remembered and backing up continues**

![Reload base — the folder is remembered and backing up continues](assets/base-backs-the-race-up-to-a-folder-and-a-new-device-restores-it-step-04.jpg)

**A new device restores the file — call log and DNF come back**

![A new device restores the file — call log and DNF come back](assets/base-backs-the-race-up-to-a-folder-and-a-new-device-restores-it-step-05.jpg)

## Navigating the App

How to move between modules, what to expect on the home screen, and how the app protects active operations from accidental navigation.

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

### Home shows the three roles, the current race and Scan race QR code



**Home — choose your role: Checkpoint, Base station or Race setup**

![Home — choose your role: Checkpoint, Base station or Race setup](assets/home-shows-the-three-roles-the-current-race-and-scan-race-qr-code-step-01.jpg)

**Current race card shows the race name, checkpoints and start time**

![Current race card shows the race name, checkpoints and start time](assets/home-shows-the-three-roles-the-current-race-and-scan-race-qr-code-step-02.jpg)

**Scan race QR code opens the import screen**

![Scan race QR code opens the import screen](assets/home-shows-the-three-roles-the-current-race-and-scan-race-qr-code-step-03.jpg)

### Sheets trap focus and close on Escape



**Tab around the edit sheet — focus never leaves it; Escape closes it**

![Tab around the edit sheet — focus never leaves it; Escape closes it](assets/sheets-trap-focus-and-close-on-escape-step-01.jpg)

### Status lines are polite live regions



**Mark off, Receive, DNF / DNS and Reports status lines use aria-live="polite"**

![Mark off, Receive, DNF / DNS and Reports status lines use aria-live="polite"](assets/status-lines-are-polite-live-regions-step-01.jpg)

### Undo bar clears itself after about six seconds



**Unmark — Undo shows, then goes by itself**

![Unmark — Undo shows, then goes by itself](assets/undo-bar-clears-itself-after-about-six-seconds-step-01.jpg)

### Footer names the club



**Footer — "Ipswich & District Radio Club · VK4WIP"**

![Footer — "Ipswich & District Radio Club · VK4WIP"](assets/footer-names-the-club-step-01.jpg)

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

### Settings cancel undoes the theme preview



**Pick Dark — the page previews it; Cancel puts Light back**

![Pick Dark — the page previews it; Cancel puts Light back](assets/settings-cancel-undoes-the-theme-preview-step-01.jpg)

### Settings persist after reload



**Reload — still Dark**

![Reload — still Dark](assets/settings-persist-after-reload-step-01.jpg)

### Locked buttons look locked



**Mark off — Mark is locked until a number is typed**

![Mark off — Mark is locked until a number is typed](assets/locked-buttons-look-locked-step-01.jpg)

**Read-out — Next is locked until every number is ticked**

![Read-out — Next is locked until every number is ticked](assets/locked-buttons-look-locked-step-02.jpg)

**Share race — Show full screen is locked when the race is too big for one QR**

![Share race — Show full screen is locked when the race is too big for one QR](assets/locked-buttons-look-locked-step-03.jpg)

**Base Receive — Complete and At now are locked with nothing to send**

![Base Receive — Complete and At now are locked with nothing to send](assets/locked-buttons-look-locked-step-04.jpg)

**DNF / DNS — "Add numbers to mark" is locked**

![DNF / DNS — "Add numbers to mark" is locked](assets/locked-buttons-look-locked-step-05.jpg)

### Dark mode passes colour contrast



**Settings in Dark — no contrast failures (labels, links, swatches)**

![Settings in Dark — no contrast failures (labels, links, swatches)](assets/dark-mode-passes-colour-contrast-step-01.jpg)

**Mark off in Dark — no contrast failures**

![Mark off in Dark — no contrast failures](assets/dark-mode-passes-colour-contrast-step-02.jpg)

### Sunlight on the working screens



**Mark off in Sunlight — white page, 2px tile borders**

![Mark off in Sunlight — white page, 2px tile borders](assets/sunlight-on-the-working-screens-step-01.jpg)

**Callout in Sunlight**

![Callout in Sunlight](assets/sunlight-on-the-working-screens-step-02.jpg)

**Read-out in Sunlight**

![Read-out in Sunlight](assets/sunlight-on-the-working-screens-step-03.jpg)

**Base Receive in Sunlight**

![Base Receive in Sunlight](assets/sunlight-on-the-working-screens-step-04.jpg)

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



## Linked Checkpoints (Turnaround Point)

How to operate two checkpoints at the same physical location — for example, an out-and-back turnaround where CP1 (outbound) and CP4 (return) are staffed by the same volunteers. Covers the checkpoint picker, dual view, tab switching, and cross-checkpoint overview.

### Volunteer operates linked turnaround checkpoints from one interface



**Home screen — navigate to Checkpoint Operations**

![Home screen — navigate to Checkpoint Operations](assets/volunteer-operates-linked-turnaround-checkpoints-from-one-interface-step-01.jpg)

**Race selection modal — select the Turnaround Ultra race**

![Race selection modal — select the Turnaround Ultra race](assets/volunteer-operates-linked-turnaround-checkpoints-from-one-interface-step-02.jpg)

**Checkpoint picker — linked pair shown as single card with link icon**

![Checkpoint picker — linked pair shown as single card with link icon](assets/volunteer-operates-linked-turnaround-checkpoints-from-one-interface-step-03.jpg)

**Select the linked pair — navigate to dual checkpoint view**

![Select the linked pair — navigate to dual checkpoint view](assets/volunteer-operates-linked-turnaround-checkpoints-from-one-interface-step-04.jpg)

**Dual view loads — CP tab switcher shows CP1 and CP4**

![Dual view loads — CP tab switcher shows CP1 and CP4](assets/volunteer-operates-linked-turnaround-checkpoints-from-one-interface-step-05.jpg)

**Mark runners 100 and 101 in CP1 (outbound) via quick entry**

![Mark runners 100 and 101 in CP1 (outbound) via quick entry](assets/volunteer-operates-linked-turnaround-checkpoints-from-one-interface-step-06.jpg)

**Switch to CP4 tab — stars appear on runners 100 and 101**

![Switch to CP4 tab — stars appear on runners 100 and 101](assets/volunteer-operates-linked-turnaround-checkpoints-from-one-interface-step-07.jpg)

**Mark runner 100 in CP4 (return) via quick entry**

![Mark runner 100 in CP4 (return) via quick entry](assets/volunteer-operates-linked-turnaround-checkpoints-from-one-interface-step-08.jpg)

**Overview tab — runner 100 shows Both, runner 101 shows CP1 Only**

![Overview tab — runner 100 shows Both, runner 101 shows CP1 Only](assets/volunteer-operates-linked-turnaround-checkpoints-from-one-interface-step-09.jpg)

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

**Callout sheet — 104 is on the Corrections card, sent as its own call**

![Callout sheet — 104 is on the Corrections card, sent as its own call](assets/a-changed-time-base-already-has-goes-back-on-the-callout-sheet-as-a-correction-step-04.jpg)

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

### Same-block edit is not a correction



**Mark 101, set it 10 minutes back, send it to base**

![Mark 101, set it 10 minutes back, send it to base](assets/same-block-edit-is-not-a-correction-step-01.jpg)

**Move the time by a minute inside the same block — no correction**

![Move the time by a minute inside the same block — no correction](assets/same-block-edit-is-not-a-correction-step-02.jpg)

**Move it into another block — now it is a correction**

![Move it into another block — now it is a correction](assets/same-block-edit-is-not-a-correction-step-03.jpg)

### Stepper back to the original time reads Keep time



**−5 then +5 — "Keep time", no "Was" note**

![−5 then +5 — "Keep time", no "Was" note](assets/stepper-back-to-the-original-time-reads-keep-time-step-01.jpg)

**+5 at now clamps to now in the same minute — still "Keep time"**

![+5 at now clamps to now in the same minute — still "Keep time"](assets/stepper-back-to-the-original-time-reads-keep-time-step-02.jpg)

### Overview bar keeps DNS muted and labels each part



**Overview — bar aria-label lists DNS and DNF separately; DNS is not red**

![Overview — bar aria-label lists DNS and DNF separately; DNS is not red](assets/overview-bar-keeps-dns-muted-and-labels-each-part-step-01.jpg)

### Overview stepper is a draft until Save



**−5 then +5 — nothing to save, still called in**

![−5 then +5 — nothing to save, still called in](assets/overview-stepper-is-a-draft-until-save-step-01.jpg)

**−5 and Save — saved once (a correction: new block); Undo restores it exactly**

![−5 and Save — saved once (a correction: new block); Undo restores it exactly](assets/overview-stepper-is-a-draft-until-save-step-02.jpg)

### Read-out runs across two blocks in overs of three



**Over 1 — "Common time" and three numbers**

![Over 1 — "Common time" and three numbers](assets/read-out-runs-across-two-blocks-in-overs-of-three-step-01.jpg)

**Over 2 — "Continuing" the same block, one number**

![Over 2 — "Continuing" the same block, one number](assets/read-out-runs-across-two-blocks-in-overs-of-three-step-02.jpg)

**Over 3 — the second block starts with "Common time" again**

![Over 3 — the second block starts with "Common time" again](assets/read-out-runs-across-two-blocks-in-overs-of-three-step-03.jpg)

### Checkpoint corrections card



**Move 101 into the block before — it goes on the Corrections card, not the next call**

![Move 101 into the block before — it goes on the Corrections card, not the next call](assets/checkpoint-corrections-card-step-01.jpg)

**Base copied — correction sent: the card empties; Undo brings it back**

![Base copied — correction sent: the card empties; Undo brings it back](assets/checkpoint-corrections-card-step-02.jpg)

### Unmarking a called-in runner is a not-passed correction



**Unmark 101 after it was called in — "not passed · was" on the Corrections card**

![Unmark 101 after it was called in — "not passed · was" on the Corrections card](assets/unmarking-a-called-in-runner-is-a-not-passed-correction-step-01.jpg)

### Checkpoint records a runner base says it missed



**Overview › 150 › "Missed — passed earlier", step back five minutes, save**

![Overview › 150 › "Missed — passed earlier", step back five minutes, save](assets/checkpoint-records-a-runner-base-says-it-missed-step-01.jpg)

**Callout — on the Corrections card as "150 · missed · now HH:MM"**

![Callout — on the Corrections card as "150 · missed · now HH:MM"](assets/checkpoint-records-a-runner-base-says-it-missed-step-02.jpg)

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

### Checkpoint: official message

Official messages are written on the paper message pad, not in the app.

1. Write the message on the pad: sender, recipient, message number, date / time and the message. The originator signs it.
2. Call base: "VK4WIP this is VK4[CALLSIGN] Official Message", wait for base to ready the log pad, then read the number, date / time, originator and message.

### Base: receiving a call

1. Listen for "VK4WIP this is VK4…, Scores Checkpoint?" and tap that checkpoint under **Who's calling?** (gold **Due** = no call for 8+ minutes with runners expected).
2. Acknowledge: "[CALLSIGN], VK4WIP — go ahead with scores."
3. The time row opens on that checkpoint's **next** block (base is often 45–60 min behind). Tap a different block if they give another time, or type an exact time.
4. Type each number as it's read (keyboard or keypad) and **Add**. Say "copied, go ahead" between overs.
5. They move to the next time: tap **Next →**. The numbers box clears; earlier blocks stay in the call ("Also in this call: 07:40 · 5").
6. Missed a number? Ask "say again after [last number]".
7. Tap **Complete**, then confirm on air: "Copied [N] competitors. VK4WIP."
8. **Clear [time]** wipes the current block; **Cancel call** (tap twice) drops the whole call. Both have Undo.
9. A gold **Ask about 106** on a checkpoint's button and board row is a reminder you set in **Reports › Needs attention** ("Ask CP2"). Ask them on this call, then tap **Asked** (Undo if you tapped it by mistake).

### Number checks at base

- Blue: fine to record.
- Blue with dark border: not seen at the previous checkpoint (possible missed runner) — still recorded.
- Gold: already logged at this checkpoint, or said twice — skipped.
- Red, struck through: not in the race, or DNF/DNS — skipped.

### Corrections

Sent as a separate call, one runner at a time, never mixed into a Scores call:
"Checkpoint [n] correction, runner [bib], time is now [HH:MM]." Give the new common time (5-minute block) unless an exact time was recorded.

- Checkpoint: corrections appear in their own card on the Callout sheet ("101 · now 10:55 · was 11:00"). Tap **Base copied — correction sent** once base has it.
- Base: tap the checkpoint, tap **Correction**, type the bib, check what base had, pick the new time and tap **Apply correction**. Undo is available.
- A time edit inside the same 5-minute block is not a correction and nothing needs to be sent.
- A runner called in by mistake who never passed: "Checkpoint [n] correction, runner [bib], not passed." The checkpoint's card shows "142 · not passed · was 11:00"; base taps **Not passed** before **Apply correction**.
- In a normal Scores call, a number base already has shows gold **Had HH:MM** and is skipped. Without the word "correction" it's treated as a mistake, not a new time.

### Missed runners

A checkpoint can't know it missed someone. Base finds out when the runner is called in at a later checkpoint. Base then shows a gold note on that checkpoint, e.g. "Missed: 213 (seen CP2)".

- Base: next time that checkpoint calls (or call them), ask about each number. Tap **They have it** and enter the time they give, or **Not seen there** (the times table then shows "missed" for that checkpoint). Both have Undo. If the checkpoint calls the number in normally, the note clears by itself.
- Before a checkpoint stands down, base opens **Stand-down check** for it. It lists runners "Seen further on" (missed there) and runners "Not seen past here". Read back any "Not seen past here" numbers, and stand the checkpoint down only when they're accounted for. **Stand down** (tap twice) marks it Closed; Undo reopens it. Runners still unaccounted for stay on Overdue / Still on course.
- Checkpoint: if base tells you a runner came through, open them in **Overview** and use **Missed — passed earlier**. Step the time back to the time base gives (or your best estimate) and save; it goes on the Corrections card as "213 · missed · now 08:35" to confirm with base.
- **Wording to be confirmed by Brandon** for base asking a checkpoint about a missed runner.

### A number that isn't in the setup

Bib ranges can change on the day, and some races only know bibs at registration. A runner whose number isn't in the setup is still recorded, never lost.

- Checkpoint: type the number in quick entry as usual. It's marked and its tile gets a small gold corner ("not in setup"). A number longer than any bib in the race (or over 9999) asks "Mark 51212? It isn't in the setup" first, in case it's a typo. Read it to base like any other number.
- Base: in a call, the number shows gold **Not in setup — tap to record**. Tap it if the checkpoint confirms the number; it's recorded as a **Late entry** and joins the field. Leave it untapped to skip it; it then appears in **Reports › Needs attention › Unknown bibs**, where **Add to field** records it later.
- DNF / DNS: a number outside the field shows **Not in setup — tap to add**.
- Race setup: tick **Bibs assigned on the day** for a race with no bib list yet. Counts that need the field show "—" until bibs are known.

### Fixing mistakes

Checkpoint:
- Tap a marked runner on **Mark off** to change its time (−5/−1/+1/+5) or unmark it. Unmarking shows Undo.
- An unmarked runner keeps "was HH:MM"; tapping it restores the original time or uses now.
- **Overview**: tap any runner to change time, undo call-in, reset to not passed, or mark DNS/DNF. Every change has Undo.
- Changing a time base already has into another 5-minute block puts it on the Corrections card (see Corrections).

Base:
- **DNF / DNS** tab: bulk add by typing or pasting numbers, choose where and why, apply; Clear any entry to put a runner back in the race.
- **Reports › Needs attention**: duplicates, out-of-order times, skipped checkpoints, sightings after DNF/DNS, unknown bibs, impossible pace — resolve each in place.

### Base: fixing recorded numbers (Records)

Records is base's own list of every number it holds for one checkpoint. On Receive, tap the checkpoint, then **Records** (a gold count shows how many need checking). Every checkpoint row on the board also has a small **Records** button. **Back to call** returns to the call you were taking, with nothing lost.

- View the numbers **By block**, **By number** or **By call**. **Find number** narrows the list to bibs starting with the digits typed. The filter pills show duplicates, missed runners, wrong numbers and other checks.
- Tap a number to change its **Time**, fix a mistyped **Number**, move it to the right **Checkpoint**, or **Remove** it (tap twice). For a duplicate, **Keep this one** removes the others. For a wrong number heard on a call, use **Change number** or **Record as late entry**.
- Every change asks **Why**: *Checkpoint correction*, *Base typing error* or *Other*. A checkpoint correction is logged as a correction call, so it shows in the call log, the same as Correction mode.
- **Select** fixes several numbers at once: tap them, or use **Select block** / **Select call**. Every bib is listed on its own line before you save.
- Nothing is deleted. **Show history** shows what each change replaced, and **Undo** reverses the last change exactly. An edit can lower a checkpoint's "up to"; the status line says so when it does.
- Records only changes base's own records. It never changes what a checkpoint holds, so ask the checkpoint for a correction if their sheet is wrong too.

### Crew & vehicle log

For insurance, base logs which car went to each checkpoint, who was in it, and when it left home and arrived. Use the **Crews** tab, or the **Crew** button on a checkpoint on Receive while you're taking its calls.

- **+ Vehicle** adds a car: rego, driver, anyone else in the car, and the times. Times are exact (not 5-minute blocks), can be before the race start, and are never in the future. More than one car can go to a checkpoint.
- When an operator radios that they've arrived, tap **Arrived now** on their car. Every save, arrival and removal has Undo.
- **Return trip (left site, home safe)** is optional.
- **Reports › Crew & vehicle log** prints or exports the log. It stays on the base device and is never included in the race setup or any shared file.
- **Wording to be supplied by Brandon (WICEN)** for an operator reporting that they have left home, and that they have arrived at their checkpoint.
