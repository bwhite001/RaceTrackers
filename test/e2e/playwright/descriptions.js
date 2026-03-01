/**
 * Plain-English descriptions for every Playwright journey test.
 * Keyed by the exact test title string.
 * Used by the custom HTML reporter to add context for non-technical readers.
 */

export const JOURNEY_DESCRIPTIONS = {

  // ─── 01 Race Setup ────────────────────────────────────────────────────────

  'creates a new race from scratch and verifies the overview':
    'A race director fills in all the details needed to create a brand-new race — the race name, date, start time, how many checkpoints there are, and the range of runner bib numbers. Once saved, the race overview page should correctly display the race name, list every checkpoint, and show the right number of registered runners.',

  'step indicator advances correctly through setup wizard':
    'The race creation wizard has four steps: Template, Race Details, Runner Setup, and Waves. This test checks that the progress indicator at the top updates as you advance through each step, so the race director always knows where they are in the setup process.',

  'back button on step 2 returns to race details with data preserved':
    'If a race director fills in the race name and other details on Step 2 of 4 (Race Details), moves on to Step 3 of 4 (Runner Setup), then clicks Back, all their work should still be there — the race name and other fields must not be wiped out. Nobody should have to retype information just because they went back a step.',

  // ─── 02 Checkpoint Operations ─────────────────────────────────────────────

  'navigates to checkpoint and sees runner grid':
    'A checkpoint volunteer opens the app, taps "Checkpoint Operations", selects their race, and arrives at the correct checkpoint screen. This test confirms that the grid of runner bib numbers — the list of every runner they need to watch for — is visible and fully loaded.',

  'marks off a single runner via the runner grid':
    'A checkpoint volunteer clicks on a single runner\'s bib number tile in the grid to record that the runner passed through. The tile should change colour or appearance to make it obvious that runner has been marked as "through".',

  'marks off multiple runners via Quick Entry':
    'Instead of finding runners in the grid, a volunteer can just type a bib number and press Enter to record it quickly. This test enters two bib numbers one after the other using the quick-entry shortcut and confirms both runners are marked off.',

  'switches to Callout Sheet tab':
    'The Callout Sheet tab shows the list of runners who have not yet been recorded at this checkpoint. Volunteers read these numbers out over the radio to base station. This test checks the tab loads correctly and the list is visible.',

  'switches to Overview tab and shows runner counts':
    'The Overview tab shows a summary — how many runners have been through, how many are still expected, and other totals. This test confirms those summary numbers appear correctly when the tab is selected.',

  'can export checkpoint results':
    'At the end of a checkpoint shift, a volunteer may need to export their recorded data to share with base station or keep as a backup. This test checks that the export option can be opened from the checkpoint screen.',

  // ─── 03 Base Station ──────────────────────────────────────────────────────

  'navigates to base station and sees data entry form':
    'A base station operator opens the app, taps "Base Station Operations", selects their race, and lands on the data entry screen. This test confirms the form for entering finish times and runner bib numbers is ready to use.',

  'enters a common time and runner batch, then verifies in overview':
    'The most common base station task: the operator types in a finish time (for example 10:45:00) then lists all the runner bib numbers who crossed the finish line at that time. After submitting, those runners should appear in the overview with their recorded finish time.',

  'records a DNF via the withdrawal dialog':
    'When a runner drops out of the race and does not finish (DNF), the base station operator needs to record this. This test opens the withdrawal dialog, enters a runner\'s bib number and a reason such as "Injured ankle", confirms the entry, and checks that the runner now shows a DNF status in the overview.',

  'opens the Checkpoint Matrix tab':
    'The Checkpoint Matrix gives a bird\'s-eye view of where all runners are across every checkpoint in the race. This test checks that switching to the Checkpoint Matrix tab loads and displays checkpoint information correctly.',

  'switches to Reports tab and renders a report':
    'The Reports tab lets the operator generate a printed summary of race results. This test switches to the tab and checks that the report content — runner totals, times, and status counts — is visible.',

  'exports base station data':
    'The base station operator may need to export all their recorded data for backup or to share with the race director. This test checks that the import/export tool can be opened from the base station screen.',

  // ─── 04 Race Management ───────────────────────────────────────────────────

  'race management page lists created races':
    'The Race Management page is the race director\'s central hub where all races are listed. This test confirms that a race created earlier in the test suite appears on that page.',

  'clicking a race opens its overview':
    'When the race director clicks on a race in the management list, they should be taken to that race\'s overview page where they can see all the details. This test confirms that navigation works correctly.',

  'creates a second race from the management page':
    'A race director creates a second race directly from the management screen, going through the full two-step setup wizard (race details, then runner ranges) and landing on the new race\'s overview page.',

  'race overview shows correct runner and checkpoint counts':
    'After creating a race with runner bib numbers 400 to 405 (6 runners) and 2 checkpoints, the race overview page should display "6" as the runner count and "2" as the checkpoint count — no more, no less.',

  'navigates from race overview to a checkpoint':
    'From the race overview, a race director can jump straight to any checkpoint\'s live mark-off screen. This test clicks the Checkpoint 1 link and confirms the checkpoint mark-off screen opens.',

  'navigates from race overview to base station':
    'From the race overview, a race director can jump straight to the base station. This test clicks the Base Station button on the overview page and confirms the base station operations screen opens.',

  'home page landing shows the race management module card':
    'The Race Maintenance module card should always be visible on the home screen so race directors can always find it easily. This test simply confirms the card is present.',

  // ─── 05 Navigation Protection ─────────────────────────────────────────────

  'shows protection modal when leaving active checkpoint operation':
    'While a checkpoint volunteer is actively recording runners, the app should warn them if they try to navigate away — for example by tapping the back button or going to a different module. This prevents accidentally losing all their recorded data. This test triggers that navigation and confirms the warning appears.',

  'allows navigation after confirming exit from active operation':
    'If a volunteer sees the "you\'re about to leave an active session" warning and confirms they want to leave anyway, the app should let them go and return them to the home screen. This test confirms that confirming the exit actually works.',

  'home page module cards are all accessible when no operation is active':
    'When the app is idle on the home screen and no operation is in progress, all three module cards — Checkpoint Operations, Base Station, and Race Maintenance — should be enabled and ready to tap. This test confirms none of them are accidentally disabled.',

  'unknown routes redirect to home':
    'If someone types a web address that doesn\'t exist in the app (perhaps a typo or an old bookmark), they should be automatically sent to the home page rather than seeing a blank or broken screen.',

  // ─── 06 Settings ──────────────────────────────────────────────────────────

  'opens and closes the Settings modal':
    'Tapping the settings cog in the top-right corner should open the settings panel. Pressing the Escape key (or tapping close) should dismiss it cleanly. This test confirms both actions work.',

  'toggles dark mode on and off':
    'The dark mode toggle in settings switches the app between a light colour scheme and a dark one. This test turns dark mode on, confirms the dark theme is applied, then turns it back off and confirms the light theme is restored.',

  'settings persist after closing and reopening the modal':
    'Changes made in settings should be saved and remembered. If dark mode is turned on and the settings panel is closed then reopened, dark mode should still be on — the preference should not reset.',

  // ─── 07 Import / Export ───────────────────────────────────────────────────

  'export modal opens from base station header':
    'The base station screen has an import/export button in the header. This test confirms that tapping it opens the data portability dialog where the operator can choose what to export.',

  'downloads a race configuration JSON file':
    'This test triggers the export function and confirms that a JSON file is actually downloaded to the device. The file should contain the race configuration — name, checkpoints, runner numbers — that can be used to restore the race on another device.',

  'imports a race configuration and restores data':
    'After wiping all data from the app, this test uploads a previously exported race file and confirms the race is fully restored — the race name, checkpoints, and runner numbers all come back exactly as they were before the data was cleared.',
};
