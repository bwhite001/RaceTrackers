/**
 * annotations.js
 *
 * Per-step annotation metadata for the role journey documents.
 * Used by generate-journey-docs.js to add "what to do / why" callouts
 * alongside each screenshot in the generated HTML.
 *
 * Structure:
 *   STEP_ANNOTATIONS[testTitle][stepLabel] = {
 *     action : 'click' | 'fill' | 'select' | 'type+enter' | 'observe',
 *     target : Human-readable description of the element to interact with.
 *     value  : (optional) What to type or select.
 *     why    : Why this step matters — shown to the reader as context.
 *   }
 *
 * 'action' controls the colour-coded icon in the rendered callout:
 *   click       → blue cursor icon
 *   fill        → green pencil icon
 *   select      → purple dropdown icon
 *   type+enter  → orange keyboard icon (type and press Enter)
 *   observe     → grey eye icon (nothing to do — just read the screen)
 */

export const STEP_ANNOTATIONS = {

  // ─── Race Setup ──────────────────────────────────────────────────────────

  'creates a new race from scratch and verifies the overview': {
    'Home — Welcome Back screen with 3 module cards': {
      action: 'observe',
      target: 'The three module cards on the home screen',
      why: 'The home screen shows the three roles available. As a race director, you will use Race Maintenance to set up the race.',
    },
    'Race Maintenance → Create New Race — setup wizard opens': {
      action: 'click',
      target: '"Race Maintenance" card → "Get Started" link',
      why: 'Opens the Race Management screen where all your races are listed and new ones can be created.',
    },
    'Step 1 of 4 — Template: choose Start from Scratch': {
      action: 'click',
      target: '"Start from Scratch" card at the top of the template list',
      why: 'Start from Scratch gives you a blank race. Choose a pre-built template only if the course and runner ranges already match your event.',
    },
    'Step 2 of 4 — Race Details: enter name, date, start time and checkpoints': {
      action: 'fill',
      target: 'Race Name field, Race Date field, Start Time field, Number of Checkpoints dropdown',
      value: 'e.g. Mountain Ultra 2025 / 2025-09-20 / 06:30 / 3 checkpoints',
      why: 'These details appear on the race overview and are used to calculate elapsed times. The checkpoint count determines how many mark-off screens are created.',
    },
    'Step 3 of 4 — Runner Setup: add bib number range 101–115': {
      action: 'fill',
      target: '"Start Number" field and "End Number" field, then click "Add Range"',
      value: 'Start: 101 — End: 115',
      why: 'Runner ranges define which bib numbers are registered. Every number in the range gets its own tile in the checkpoint grid. You can add multiple ranges if bib numbers are not sequential.',
    },
    'Step 4 of 4 — Waves: confirm wave and save race': {
      action: 'click',
      target: '"Create Race" button (bottom-right)',
      why: 'Waves set the official start time used to calculate elapsed times per runner. Once you click Create Race the race is saved and you land on the Race Overview.',
    },
    'Race overview — name, 3 checkpoints and 15 runners correct': {
      action: 'observe',
      target: 'The race summary panel at the top of the overview',
      why: 'Verify that the checkpoint count and total runner count match what you entered. If they are wrong, edit the race before handing devices to volunteers.',
    },
    'Home — new race listed under module cards': {
      action: 'observe',
      target: 'The race card below the module cards on the home screen',
      why: 'The home screen now shows your race so any volunteer who opens the app can find it immediately.',
    },
  },

  'step indicator advances correctly through setup wizard': {
    'Step 1 of 4 — Template: setup wizard opens': {
      action: 'observe',
      target: 'The step progress indicator at the top of the wizard',
      why: 'The indicator shows you exactly where you are in the four-step process. Step 1 (Template) should be highlighted.',
    },
    'Step 2 of 4 — Race Details: step indicator shows step 2': {
      action: 'observe',
      target: 'Step indicator — step 2 now active',
      why: 'After choosing a template the indicator advances to Step 2. If you need to go back, your data is saved.',
    },
    'Step 3 of 4 — Runner Setup: step indicator advances to step 3': {
      action: 'observe',
      target: 'Step indicator — step 3 now active',
      why: 'Confirms you are on the Runner Setup step. Add bib ranges here before moving on to Waves.',
    },
  },

  'back button on step 2 returns to race details with data preserved': {
    'Step 1 of 4 — Template: choose Start from Scratch': {
      action: 'click',
      target: '"Start from Scratch" card',
      why: 'Begin the wizard to demonstrate that going back does not wipe your work.',
    },
    'Step 2 of 4 — Race Details: fill in race name and details': {
      action: 'fill',
      target: 'Race Name, Race Date, Start Time fields',
      value: 'Any values — these should survive a Back navigation',
      why: 'Fill in the details to prove they are preserved when you navigate back from Step 3.',
    },
    'Step 3 of 4 — Runner Setup: navigate forward then press Back': {
      action: 'click',
      target: '"Back: Race Details" button (bottom-left)',
      why: 'Simulates a race director who wants to correct a detail after moving forward.',
    },
    'Step 2 of 4 — Race Details: data preserved after Back': {
      action: 'observe',
      target: 'Race Name, Race Date, Start Time fields',
      why: 'All the values entered in Step 2 must still be there. Nothing should be lost by navigating back.',
    },
  },

  // ─── Race Management ─────────────────────────────────────────────────────

  'race management page lists created races': {
    'Race Management — page lists all created races': {
      action: 'observe',
      target: 'The list of race cards on the Race Management page',
      why: 'Every race you have created appears here. Tap a race name to open its overview, or tap "Create New Race" to add another.',
    },
  },

  'clicking a race opens its overview': {
    'Race Management — page with race listed': {
      action: 'observe',
      target: 'The race card in the list',
      why: 'Identify the race you want to manage.',
    },
    'Race card — click race name to open overview': {
      action: 'click',
      target: 'The race name or the "›" arrow on the race card',
      why: 'Opens the Race Overview for that race — shows checkpoints, runner counts, and quick-launch buttons for each module.',
    },
    'Race overview — name and details visible': {
      action: 'observe',
      target: 'Race name, date, start time, and the checkpoint / runner summary',
      why: 'Confirm all details are correct before race day. This is also where you launch Checkpoint or Base Station operations.',
    },
  },

  'creates a second race from the management page': {
    'Race Management — tap Create New Race button': {
      action: 'click',
      target: '"Create New Race" button at the top of the Race Management screen',
      why: 'You can run multiple races in the same app instance. Each race is fully independent.',
    },
    'Step 1 of 4 — Template: choose Start from Scratch': {
      action: 'click',
      target: '"Start from Scratch" card',
      why: 'Begin a fresh race configuration.',
    },
    'Step 2 of 4 — Race Details: enter name, date, start time': {
      action: 'fill',
      target: 'Race Name, Race Date, Start Time fields',
      value: 'e.g. Valley Sprint 2025 / 2025-10-05 / 07:00',
      why: 'Each race needs its own name so volunteers and the race director can distinguish them at a glance.',
    },
    'Step 3 of 4 — Runner Setup: add bib range 500–503': {
      action: 'fill',
      target: '"Start Number" and "End Number" fields, then "Add Range"',
      value: 'Start: 500 — End: 503',
      why: 'This race uses a different bib range so there is no overlap with the first race.',
    },
    'Step 4 of 4 — Waves: confirm and save': {
      action: 'click',
      target: '"Create Race" button (bottom-right)',
      why: 'Saves the second race. The app supports as many races as needed.',
    },
    'Race overview — second race created successfully': {
      action: 'observe',
      target: 'The race summary panel',
      why: 'Confirm the new race is set up correctly before distributing devices.',
    },
  },

  'race overview shows correct runner and checkpoint counts': {
    'Race overview — runner count 6 and checkpoint count 2 shown': {
      action: 'observe',
      target: 'The "Total Runners" and "Checkpoints" counters in the race summary',
      why: 'These must match your entry. If a runner range was wrong, the count will be off — fix it here before race day.',
    },
  },

  'navigates from race overview to a checkpoint': {
    'Race overview — tap Checkpoint 1 link': {
      action: 'click',
      target: '"Go to Checkpoint" button under the CP1 card in the Checkpoint Operations section',
      why: 'Launches the live mark-off screen for Checkpoint 1 — useful for handing off to a volunteer or checking the setup yourself.',
    },
    'Checkpoint view — mark-off screen for CP1 open': {
      action: 'observe',
      target: 'The runner grid and the "Checkpoint 1" label in the header',
      why: 'Confirms the correct checkpoint is open. The volunteer at this checkpoint will use this screen to mark off runners.',
    },
  },

  'navigates from race overview to base station': {
    'Race overview — tap Base Station button': {
      action: 'click',
      target: '"Go to Base Station" button in the Base Station Operations section',
      why: 'Opens the Base Station operations screen — used by the finish-line operator to record finish times and call-ins.',
    },
    'Base Station — operations screen open': {
      action: 'observe',
      target: 'The Base Station data entry form',
      why: 'The base station operator uses this screen for the entire race. Confirm it loads before handing the device over.',
    },
  },

  // ─── Checkpoint Operations ────────────────────────────────────────────────

  'navigates to checkpoint and sees runner grid': {
    'Home — tap Checkpoint Operations module card': {
      action: 'click',
      target: '"Checkpoint Operations" card → "Get Started" link',
      why: 'Takes you to the race selector. The app shows all available races so the volunteer can pick the correct one.',
    },
    'Select Race modal — choose race from list': {
      action: 'click',
      target: 'The correct race in the race selection list, then choose your checkpoint',
      why: 'Each volunteer must select both the race and their specific checkpoint. This ensures their mark-offs go into the right data bucket.',
    },
    'Checkpoint view — runner grid loaded with bib numbers 200–210': {
      action: 'observe',
      target: 'The runner grid tiles and the stats bar at the top (Not Started / Called In / Passed / Total)',
      why: 'Confirm the correct runner range is loaded. The "Not Started" count should equal the total number of runners at the start of the session.',
    },
  },

  'marks off a single runner via the runner grid': {
    'Checkpoint view — runner grid visible': {
      action: 'observe',
      target: 'The grid of bib number tiles',
      why: 'Each tile represents one runner. Tiles are white (not yet recorded) or coloured (marked off). Find the runner you need to mark.',
    },
    'Runner grid — tap first runner tile (200s range)': {
      action: 'click',
      target: 'The bib number tile for the runner who just passed (e.g. tile "200")',
      why: 'A single tap marks the runner as "Passed" and records the current time automatically. The tile colour changes to confirm the mark.',
    },
    'Runner tile — marked state applied': {
      action: 'observe',
      target: 'The tile for the marked runner and the "Passed" counter in the stats bar',
      why: 'The tile should now appear highlighted/coloured and the Passed count should increase by 1. Double-tap a tile to undo a mark if you made an error.',
    },
  },

  'marks off multiple runners via Quick Entry': {
    'Checkpoint view — Quick Entry bar visible': {
      action: 'observe',
      target: 'The search/quick-entry bar at the top of the runner grid',
      why: 'Quick Entry is faster than finding tiles in the grid — ideal when runners arrive in groups. Tap the search bar to start typing.',
    },
    'Quick Entry — type first bib number and press Enter': {
      action: 'type+enter',
      target: 'The search bar at the top of the screen',
      value: 'Type the bib number (e.g. 201), then press Enter',
      why: 'Pressing Enter immediately marks the runner and clears the field, so you can type the next number without lifting your eyes from the paper list.',
    },
    'Quick Entry — type second bib number and press Enter': {
      action: 'type+enter',
      target: 'The search bar (still focused after the first entry)',
      value: 'Type the next bib number (e.g. 202), then press Enter',
      why: 'You can mark as many runners as needed in rapid succession — just keep typing numbers and pressing Enter.',
    },
    'Runner grid — both runners marked off': {
      action: 'observe',
      target: 'The tiles for the runners you just entered and the updated "Passed" counter',
      why: 'Both tiles should now be highlighted. The Passed counter should have increased by 2.',
    },
  },

  'switches to Callout Sheet tab': {
    'Checkpoint view — Mark Off tab active': {
      action: 'observe',
      target: 'The three tabs: Mark Off | Callout Sheet | Overview',
      why: 'The default view is Mark Off. When you need to read out missing runners to base station, switch to the Callout Sheet tab.',
    },
    'Callout Sheet tab — tap to switch': {
      action: 'click',
      target: '"Callout Sheet" tab in the navigation bar',
      why: 'The Callout Sheet lists every runner who has NOT yet been recorded at this checkpoint — these are the numbers to read over the radio.',
    },
    'Callout Sheet — unrecorded runners listed': {
      action: 'observe',
      target: 'The list of outstanding runner bib numbers',
      why: 'Read these numbers out to base station so they can flag missing runners. The list updates in real time as you mark off more runners on the Mark Off tab.',
    },
  },

  'switches to Overview tab and shows runner counts': {
    'Checkpoint view — navigate to checkpoint': {
      action: 'observe',
      target: 'The checkpoint screen header showing the race and checkpoint name',
      why: 'Confirm you are on the right checkpoint before reading summary figures.',
    },
    'Overview tab — tap to switch': {
      action: 'click',
      target: '"Overview" tab in the navigation bar',
      why: 'The Overview tab shows totals — how many runners have passed, how many are still outstanding, and any DNFs or non-starters recorded at this point.',
    },
    'Overview — runner count summary visible': {
      action: 'observe',
      target: 'The summary statistics (Passed, Not Started, Total)',
      why: 'Use these totals to confirm your call-out numbers before radioing base station. If Passed + Not Started does not equal Total, a record may be missing.',
    },
  },

  'can export checkpoint results': {
    'Checkpoint view — navigate to checkpoint': {
      action: 'observe',
      target: 'The checkpoint screen',
      why: 'Make sure all runners have been recorded before exporting — exports capture the current state.',
    },
    'Export option — open export dialog': {
      action: 'click',
      target: 'The download icon (↓) in the top-right corner of the checkpoint header',
      why: 'Opens the export dialog so you can save or share your checkpoint data.',
    },
    'Export dialog — checkpoint results export options shown': {
      action: 'observe',
      target: 'The export format options in the dialog',
      why: 'Choose the format you need — JSON for sharing with base station digitally, or use the print option for a paper record. Tap the format button to trigger the download.',
    },
  },

  // ─── Settings ─────────────────────────────────────────────────────────────

  'opens and closes the Settings modal': {
    'Home — tap Settings cog button (aria-label Settings)': {
      action: 'click',
      target: 'The cog (⚙) icon in the top-right corner of the screen',
      why: 'Opens the Settings panel where you can personalise the display — dark mode, font size, and status colours.',
    },
    'Settings modal — panel open with customisation options': {
      action: 'observe',
      target: 'The settings options: Dark Mode toggle, font size slider, and colour pickers',
      why: 'All preferences are saved automatically. Changes take effect immediately so you can preview them before closing.',
    },
    'Settings modal — closed after pressing X button': {
      action: 'click',
      target: 'The × (close) button at the top-right of the Settings panel, or press Escape',
      why: 'Closes the panel. Your preferences are already saved — there is no separate Save button.',
    },
  },

  'toggles dark mode on and off': {
    'Home — open Settings modal': {
      action: 'click',
      target: 'The cog (⚙) icon in the top-right corner',
      why: 'Open settings to access the Dark Mode toggle.',
    },
    'Settings modal — locate Dark Mode toggle switch': {
      action: 'observe',
      target: 'The "Dark Mode" toggle switch in the Settings panel',
      why: 'Dark mode reduces screen glare in low-light conditions — useful for early-morning race starts or indoor briefings.',
    },
    'Dark mode ON — html element gains "dark" class': {
      action: 'click',
      target: 'The Dark Mode toggle switch to enable it',
      why: 'The app immediately switches to the dark colour scheme. All screens — not just the home screen — use the dark theme.',
    },
    'Dark mode OFF — "dark" class removed from html element': {
      action: 'click',
      target: 'The Dark Mode toggle again to disable it',
      why: 'Switches back to the light theme. Toggle at any time — the preference is saved between sessions.',
    },
  },

  'settings persist after closing and reopening the modal': {
    'Home — open Settings modal': {
      action: 'click',
      target: 'The cog (⚙) icon',
      why: 'Open settings to make a change that should persist.',
    },
    'Settings modal — enable dark mode and save': {
      action: 'click',
      target: 'The Dark Mode toggle to enable it',
      why: 'Setting a preference here should survive closing and reopening the modal — preferences are written to local storage immediately.',
    },
    'Home — reopen Settings modal': {
      action: 'click',
      target: 'The cog (⚙) icon again',
      why: 'Reopen settings to verify the preference was not lost when the panel closed.',
    },
    'Settings modal — dark mode toggle persists as checked': {
      action: 'observe',
      target: 'The Dark Mode toggle — it should still be ON',
      why: 'Confirms preferences are stored correctly. If the toggle reset, settings are not being saved — contact support.',
    },
  },

};
