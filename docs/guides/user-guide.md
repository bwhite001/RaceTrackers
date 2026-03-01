# RaceTracker Pro — User Guide

> This guide is auto-generated from the Playwright journey tests.
> Screenshots show the actual app at each key step.
> Regenerate with: `npm run generate:guide`

## Setting Up a Race

Use these steps to create and manage races. This section covers the full setup wizard, runner ranges, checkpoints, and the race overview.

### Creates a new race from scratch and verifies the overview

A race director fills in all the details needed to create a brand-new race — the race name, date, start time, how many checkpoints there are, and the range of runner bib numbers. Once saved, the race overview page should correctly display the race name, list every checkpoint, and show the right number of registered runners.

**Home — Welcome Back screen with 3 module cards**

![Home — Welcome Back screen with 3 module cards](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-01.png)

**Race Maintenance → Create New Race — setup wizard opens**

![Race Maintenance → Create New Race — setup wizard opens](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-02.png)

**Step 1 of 4 — Template: choose Start from Scratch**

![Step 1 of 4 — Template: choose Start from Scratch](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-03.png)

**Step 2 of 4 — Race Details: enter name, date, start time and checkpoints**

![Step 2 of 4 — Race Details: enter name, date, start time and checkpoints](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-04.png)

**Step 3 of 4 — Runner Setup: add bib number range 101–115**

![Step 3 of 4 — Runner Setup: add bib number range 101–115](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-05.png)

**Step 4 of 4 — Waves: confirm wave and save race**

![Step 4 of 4 — Waves: confirm wave and save race](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-06.png)

**Race overview — name, 3 checkpoints and 15 runners correct**

![Race overview — name, 3 checkpoints and 15 runners correct](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-07.png)

**Home — new race listed under module cards**

![Home — new race listed under module cards](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-08.png)

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

### Creates a second race from the management page

A race director creates a second race directly from the management screen, going through the full two-step setup wizard (race details, then runner ranges) and landing on the new race's overview page.

**Race Management — tap Create New Race button**

![Race Management — tap Create New Race button](assets/creates-a-second-race-from-the-management-page-step-01.png)

**Step 1 of 4 — Template: choose Start from Scratch**

![Step 1 of 4 — Template: choose Start from Scratch](assets/creates-a-second-race-from-the-management-page-step-02.png)

**Step 2 of 4 — Race Details: enter name, date, start time**

![Step 2 of 4 — Race Details: enter name, date, start time](assets/creates-a-second-race-from-the-management-page-step-03.png)

**Step 3 of 4 — Runner Setup: add bib range 500–503**

![Step 3 of 4 — Runner Setup: add bib range 500–503](assets/creates-a-second-race-from-the-management-page-step-04.png)

**Step 4 of 4 — Waves: confirm and save**

![Step 4 of 4 — Waves: confirm and save](assets/creates-a-second-race-from-the-management-page-step-05.png)

**Race overview — second race created successfully**

![Race overview — second race created successfully](assets/creates-a-second-race-from-the-management-page-step-06.png)

### Race overview shows correct runner and checkpoint counts

After creating a race with runner bib numbers 400 to 405 (6 runners) and 2 checkpoints, the race overview page should display "6" as the runner count and "2" as the checkpoint count — no more, no less.

**Race overview — runner count 6 and checkpoint count 2 shown**

![Race overview — runner count 6 and checkpoint count 2 shown](assets/race-overview-shows-correct-runner-and-checkpoint-counts-step-01.png)

## Running a Checkpoint

Steps for checkpoint volunteers. Covers opening a checkpoint, marking off runners individually and in bulk, reviewing counts, and exporting data.

### Navigates to checkpoint and sees runner grid

A checkpoint volunteer opens the app, taps "Checkpoint Operations", selects their race, and arrives at the correct checkpoint screen. This test confirms that the grid of runner bib numbers — the list of every runner they need to watch for — is visible and fully loaded.

**Home — tap Checkpoint Operations module card**

![Home — tap Checkpoint Operations module card](assets/navigates-to-checkpoint-and-sees-runner-grid-step-01.png)

**Select Race modal — choose race from list**

![Select Race modal — choose race from list](assets/navigates-to-checkpoint-and-sees-runner-grid-step-02.png)

**Checkpoint view — runner grid loaded with bib numbers 200–210**

![Checkpoint view — runner grid loaded with bib numbers 200–210](assets/navigates-to-checkpoint-and-sees-runner-grid-step-03.png)

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

**Checkpoint view — Quick Entry bar visible**

![Checkpoint view — Quick Entry bar visible](assets/marks-off-multiple-runners-via-quick-entry-step-01.png)

**Quick Entry — type first bib number and press Enter**

![Quick Entry — type first bib number and press Enter](assets/marks-off-multiple-runners-via-quick-entry-step-02.png)

**Quick Entry — type second bib number and press Enter**

![Quick Entry — type second bib number and press Enter](assets/marks-off-multiple-runners-via-quick-entry-step-03.png)

**Runner grid — both runners marked off**

![Runner grid — both runners marked off](assets/marks-off-multiple-runners-via-quick-entry-step-04.png)

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

**Export dialog — checkpoint results export options shown**

![Export dialog — checkpoint results export options shown](assets/can-export-checkpoint-results-step-02.png)

**Export option — open export dialog**

![Export option — open export dialog](assets/can-export-checkpoint-results-step-03.png)

### Navigates from race overview to a checkpoint

From the race overview, a race director can jump straight to any checkpoint's live mark-off screen. This test clicks the Checkpoint 1 link and confirms the checkpoint mark-off screen opens.

## Navigating the App

How to move between modules, what to expect on the home screen, and how the app protects active operations from accidental navigation.

### Navigates from race overview to base station

From the race overview, a race director can jump straight to the base station. This test clicks the Base Station button on the overview page and confirms the base station operations screen opens.

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
