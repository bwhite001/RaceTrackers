# RaceTracker Pro — User Guide

> This guide is auto-generated from the Playwright journey tests.
> Screenshots show the actual app at each key step.
> Regenerate with: `npm run generate:guide`

## Setting Up a Race

Use these steps to create and manage races. This section covers the full setup wizard, runner ranges, checkpoints, and the race overview.

### Creates a new race from scratch and verifies the overview

A race director fills in all the details needed to create a brand-new race — the race name, date, start time, how many checkpoints there are, and the range of runner bib numbers. Once saved, the race overview page should correctly display the race name, list every checkpoint, and show the right number of registered runners.

![Step 1](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-01.png)

![Step 2](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-02.png)

![Step 3](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-03.png)

![Step 4](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-04.png)

![Step 5](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-05.png)

![Step 6](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-06.png)

![Step 7](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-07.png)

![Step 8](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-08.png)

![Step 9](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-09.png)

![Step 10](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-10.png)

![Step 11](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-11.png)

![Step 12](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-12.png)

![Step 13](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-13.png)

![Step 14](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-14.png)

![Step 15](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-15.png)

![Step 16](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-16.png)

![Step 17](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-17.png)

![Step 18](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-18.png)

![Step 19](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-19.png)

![Step 20](assets/creates-a-new-race-from-scratch-and-verifies-the-overview-step-20.png)

### Step indicator advances correctly through setup wizard

The race creation form is split into two screens. This test checks that the progress indicator at the top of the form clearly updates when you move from the first screen (race details) to the second screen (runner numbers), so the race director always knows which step they are on.

![Step 1](assets/step-indicator-advances-correctly-through-setup-wizard-step-01.png)

![Step 2](assets/step-indicator-advances-correctly-through-setup-wizard-step-02.png)

![Step 3](assets/step-indicator-advances-correctly-through-setup-wizard-step-03.png)

![Step 4](assets/step-indicator-advances-correctly-through-setup-wizard-step-04.png)

### Back button on step 2 returns to race details with data preserved

If a race director fills in the race name and other details, moves on to the second screen, then clicks Back, all their work should still be there — the race name and other fields must not be wiped out. Nobody should have to retype information just because they went back a step.

![Step 1](assets/back-button-on-step-2-returns-to-race-details-with-data-preserved-step-01.png)

![Step 2](assets/back-button-on-step-2-returns-to-race-details-with-data-preserved-step-02.png)

![Step 3](assets/back-button-on-step-2-returns-to-race-details-with-data-preserved-step-03.png)

![Step 4](assets/back-button-on-step-2-returns-to-race-details-with-data-preserved-step-04.png)

### Race management page lists created races

The Race Management page is the race director's central hub where all races are listed. This test confirms that a race created earlier in the test suite appears on that page.

![Step 1](assets/race-management-page-lists-created-races-step-01.png)

![Step 2](assets/race-management-page-lists-created-races-step-02.png)

![Step 3](assets/race-management-page-lists-created-races-step-03.png)

![Step 4](assets/race-management-page-lists-created-races-step-04.png)

![Step 5](assets/race-management-page-lists-created-races-step-05.png)

![Step 6](assets/race-management-page-lists-created-races-step-06.png)

### Clicking a race opens its overview

When the race director clicks on a race in the management list, they should be taken to that race's overview page where they can see all the details. This test confirms that navigation works correctly.

![Step 1](assets/clicking-a-race-opens-its-overview-step-01.png)

![Step 2](assets/clicking-a-race-opens-its-overview-step-02.png)

![Step 3](assets/clicking-a-race-opens-its-overview-step-03.png)

![Step 4](assets/clicking-a-race-opens-its-overview-step-04.png)

![Step 5](assets/clicking-a-race-opens-its-overview-step-05.png)

![Step 6](assets/clicking-a-race-opens-its-overview-step-06.png)

### Creates a second race from the management page

A race director creates a second race directly from the management screen, going through the full two-step setup wizard (race details, then runner ranges) and landing on the new race's overview page.

![Step 1](assets/creates-a-second-race-from-the-management-page-step-01.png)

![Step 2](assets/creates-a-second-race-from-the-management-page-step-02.png)

![Step 3](assets/creates-a-second-race-from-the-management-page-step-03.png)

![Step 4](assets/creates-a-second-race-from-the-management-page-step-04.png)

![Step 5](assets/creates-a-second-race-from-the-management-page-step-05.png)

### Race overview shows correct runner and checkpoint counts

After creating a race with runner bib numbers 400 to 405 (6 runners) and 2 checkpoints, the race overview page should display "6" as the runner count and "2" as the checkpoint count — no more, no less.

![Step 1](assets/race-overview-shows-correct-runner-and-checkpoint-counts-step-01.png)

![Step 2](assets/race-overview-shows-correct-runner-and-checkpoint-counts-step-02.png)

![Step 3](assets/race-overview-shows-correct-runner-and-checkpoint-counts-step-03.png)

![Step 4](assets/race-overview-shows-correct-runner-and-checkpoint-counts-step-04.png)

## Running a Checkpoint

Steps for checkpoint volunteers. Covers opening a checkpoint, marking off runners individually and in bulk, reviewing counts, and exporting data.

### Navigates to checkpoint and sees runner grid

A checkpoint volunteer opens the app, taps "Checkpoint Operations", selects their race, and arrives at the correct checkpoint screen. This test confirms that the grid of runner bib numbers — the list of every runner they need to watch for — is visible and fully loaded.

![Step 1](assets/navigates-to-checkpoint-and-sees-runner-grid-step-01.png)

![Step 2](assets/navigates-to-checkpoint-and-sees-runner-grid-step-02.png)

![Step 3](assets/navigates-to-checkpoint-and-sees-runner-grid-step-03.png)

![Step 4](assets/navigates-to-checkpoint-and-sees-runner-grid-step-04.png)

![Step 5](assets/navigates-to-checkpoint-and-sees-runner-grid-step-05.png)

![Step 6](assets/navigates-to-checkpoint-and-sees-runner-grid-step-06.png)

![Step 7](assets/navigates-to-checkpoint-and-sees-runner-grid-step-07.png)

### Marks off a single runner via the runner grid

A checkpoint volunteer clicks on a single runner's bib number tile in the grid to record that the runner passed through. The tile should change colour or appearance to make it obvious that runner has been marked as "through".

![Step 1](assets/marks-off-a-single-runner-via-the-runner-grid-step-01.png)

![Step 2](assets/marks-off-a-single-runner-via-the-runner-grid-step-02.png)

![Step 3](assets/marks-off-a-single-runner-via-the-runner-grid-step-03.png)

![Step 4](assets/marks-off-a-single-runner-via-the-runner-grid-step-04.png)

![Step 5](assets/marks-off-a-single-runner-via-the-runner-grid-step-05.png)

![Step 6](assets/marks-off-a-single-runner-via-the-runner-grid-step-06.png)

![Step 7](assets/marks-off-a-single-runner-via-the-runner-grid-step-07.png)

### Marks off multiple runners via Quick Entry

Instead of finding runners in the grid, a volunteer can just type a bib number and press Enter to record it quickly. This test enters two bib numbers one after the other using the quick-entry shortcut and confirms both runners are marked off.

![Step 1](assets/marks-off-multiple-runners-via-quick-entry-step-01.png)

![Step 2](assets/marks-off-multiple-runners-via-quick-entry-step-02.png)

![Step 3](assets/marks-off-multiple-runners-via-quick-entry-step-03.png)

![Step 4](assets/marks-off-multiple-runners-via-quick-entry-step-04.png)

![Step 5](assets/marks-off-multiple-runners-via-quick-entry-step-05.png)

![Step 6](assets/marks-off-multiple-runners-via-quick-entry-step-06.png)

![Step 7](assets/marks-off-multiple-runners-via-quick-entry-step-07.png)

### Switches to Overview tab and shows runner counts

The Overview tab shows a summary — how many runners have been through, how many are still expected, and other totals. This test confirms those summary numbers appear correctly when the tab is selected.

![Step 1](assets/switches-to-overview-tab-and-shows-runner-counts-step-01.png)

![Step 2](assets/switches-to-overview-tab-and-shows-runner-counts-step-02.png)

![Step 3](assets/switches-to-overview-tab-and-shows-runner-counts-step-03.png)

![Step 4](assets/switches-to-overview-tab-and-shows-runner-counts-step-04.png)

![Step 5](assets/switches-to-overview-tab-and-shows-runner-counts-step-05.png)

![Step 6](assets/switches-to-overview-tab-and-shows-runner-counts-step-06.png)

![Step 7](assets/switches-to-overview-tab-and-shows-runner-counts-step-07.png)

### Can export checkpoint results

At the end of a checkpoint shift, a volunteer may need to export their recorded data to share with base station or keep as a backup. This test checks that the export option can be opened from the checkpoint screen.

![Step 1](assets/can-export-checkpoint-results-step-01.png)

![Step 2](assets/can-export-checkpoint-results-step-02.png)

![Step 3](assets/can-export-checkpoint-results-step-03.png)

![Step 4](assets/can-export-checkpoint-results-step-04.png)

![Step 5](assets/can-export-checkpoint-results-step-05.png)

![Step 6](assets/can-export-checkpoint-results-step-06.png)

### Navigates from race overview to a checkpoint

From the race overview, a race director can jump straight to any checkpoint's live mark-off screen. This test clicks the Checkpoint 1 link and confirms the checkpoint mark-off screen opens.

![Step 1](assets/navigates-from-race-overview-to-a-checkpoint-step-01.png)

![Step 2](assets/navigates-from-race-overview-to-a-checkpoint-step-02.png)

![Step 3](assets/navigates-from-race-overview-to-a-checkpoint-step-03.png)

![Step 4](assets/navigates-from-race-overview-to-a-checkpoint-step-04.png)

## Navigating the App

How to move between modules, what to expect on the home screen, and how the app protects active operations from accidental navigation.

### Navigates from race overview to base station

From the race overview, a race director can jump straight to the base station. This test clicks the Base Station button on the overview page and confirms the base station operations screen opens.

![Step 1](assets/navigates-from-race-overview-to-base-station-step-01.png)

![Step 2](assets/navigates-from-race-overview-to-base-station-step-02.png)

![Step 3](assets/navigates-from-race-overview-to-base-station-step-03.png)

![Step 4](assets/navigates-from-race-overview-to-base-station-step-04.png)

### Home page landing shows the race management module card

The Race Maintenance module card should always be visible on the home screen so race directors can always find it easily. This test simply confirms the card is present.

![Step 1](assets/home-page-landing-shows-the-race-management-module-card-step-01.png)

![Step 2](assets/home-page-landing-shows-the-race-management-module-card-step-02.png)

### Shows protection modal when leaving active checkpoint operation

While a checkpoint volunteer is actively recording runners, the app should warn them if they try to navigate away — for example by tapping the back button or going to a different module. This prevents accidentally losing all their recorded data. This test triggers that navigation and confirms the warning appears.

![Step 1](assets/shows-protection-modal-when-leaving-active-checkpoint-operation-step-01.png)

![Step 2](assets/shows-protection-modal-when-leaving-active-checkpoint-operation-step-02.png)

![Step 3](assets/shows-protection-modal-when-leaving-active-checkpoint-operation-step-03.png)

![Step 4](assets/shows-protection-modal-when-leaving-active-checkpoint-operation-step-04.png)

![Step 5](assets/shows-protection-modal-when-leaving-active-checkpoint-operation-step-05.png)

![Step 6](assets/shows-protection-modal-when-leaving-active-checkpoint-operation-step-06.png)

![Step 7](assets/shows-protection-modal-when-leaving-active-checkpoint-operation-step-07.png)

![Step 8](assets/shows-protection-modal-when-leaving-active-checkpoint-operation-step-08.png)

### Allows navigation after confirming exit from active operation

If a volunteer sees the "you're about to leave an active session" warning and confirms they want to leave anyway, the app should let them go and return them to the home screen. This test confirms that confirming the exit actually works.

![Step 1](assets/allows-navigation-after-confirming-exit-from-active-operation-step-01.png)

![Step 2](assets/allows-navigation-after-confirming-exit-from-active-operation-step-02.png)

![Step 3](assets/allows-navigation-after-confirming-exit-from-active-operation-step-03.png)

![Step 4](assets/allows-navigation-after-confirming-exit-from-active-operation-step-04.png)

![Step 5](assets/allows-navigation-after-confirming-exit-from-active-operation-step-05.png)

![Step 6](assets/allows-navigation-after-confirming-exit-from-active-operation-step-06.png)

![Step 7](assets/allows-navigation-after-confirming-exit-from-active-operation-step-07.png)

![Step 8](assets/allows-navigation-after-confirming-exit-from-active-operation-step-08.png)

### Home page module cards are all accessible when no operation is active

When the app is idle on the home screen and no operation is in progress, all three module cards — Checkpoint Operations, Base Station, and Race Maintenance — should be enabled and ready to tap. This test confirms none of them are accidentally disabled.

![Step 1](assets/home-page-module-cards-are-all-accessible-when-no-operation-is-active-step-01.png)

![Step 2](assets/home-page-module-cards-are-all-accessible-when-no-operation-is-active-step-02.png)

![Step 3](assets/home-page-module-cards-are-all-accessible-when-no-operation-is-active-step-03.png)

![Step 4](assets/home-page-module-cards-are-all-accessible-when-no-operation-is-active-step-04.png)

![Step 5](assets/home-page-module-cards-are-all-accessible-when-no-operation-is-active-step-05.png)

![Step 6](assets/home-page-module-cards-are-all-accessible-when-no-operation-is-active-step-06.png)

### Unknown routes redirect to home

If someone types a web address that doesn't exist in the app (perhaps a typo or an old bookmark), they should be automatically sent to the home page rather than seeing a blank or broken screen.

![Step 1](assets/unknown-routes-redirect-to-home-step-01.png)

![Step 2](assets/unknown-routes-redirect-to-home-step-02.png)

![Step 3](assets/unknown-routes-redirect-to-home-step-03.png)

![Step 4](assets/unknown-routes-redirect-to-home-step-04.png)

![Step 5](assets/unknown-routes-redirect-to-home-step-05.png)

![Step 6](assets/unknown-routes-redirect-to-home-step-06.png)

## Settings

Personalise the app. Toggle dark mode and understand how preferences are saved.

### Opens and closes the Settings modal

Tapping the settings cog in the top-right corner should open the settings panel. Pressing the Escape key (or tapping close) should dismiss it cleanly. This test confirms both actions work.

![Step 1](assets/opens-and-closes-the-settings-modal-step-01.png)

![Step 2](assets/opens-and-closes-the-settings-modal-step-02.png)

![Step 3](assets/opens-and-closes-the-settings-modal-step-03.png)

![Step 4](assets/opens-and-closes-the-settings-modal-step-04.png)

### Toggles dark mode on and off

The dark mode toggle in settings switches the app between a light colour scheme and a dark one. This test turns dark mode on, confirms the dark theme is applied, then turns it back off and confirms the light theme is restored.

![Step 1](assets/toggles-dark-mode-on-and-off-step-01.png)

![Step 2](assets/toggles-dark-mode-on-and-off-step-02.png)

![Step 3](assets/toggles-dark-mode-on-and-off-step-03.png)

![Step 4](assets/toggles-dark-mode-on-and-off-step-04.png)

### Settings persist after closing and reopening the modal

Changes made in settings should be saved and remembered. If dark mode is turned on and the settings panel is closed then reopened, dark mode should still be on — the preference should not reset.

![Step 1](assets/settings-persist-after-closing-and-reopening-the-modal-step-01.png)

![Step 2](assets/settings-persist-after-closing-and-reopening-the-modal-step-02.png)

![Step 3](assets/settings-persist-after-closing-and-reopening-the-modal-step-03.png)

![Step 4](assets/settings-persist-after-closing-and-reopening-the-modal-step-04.png)
