# Screenshot Capture and Management Guide

## Overview
This guide provides instructions for capturing, organizing, and maintaining screenshots for the Race Tracker application.

## Screenshot Locations

### Base Station Guide Screenshots
Located in `/screenshots/base-station-guide/`:
- base-station-01-homepage.png
- base-station-16-help-dialog.png
- Additional operational screenshots

### Application Flow Screenshots
Located in `/screenshots/`:
1. Initial Application Launch (01-initial-application-launch.png)
2. Race Creation Form (02-race-creation-form-empty.png)
3. Race Form with Data (03-race-form-with-data.png)
4. Race Created Mode Selection (04-race-created-mode-selection.png)
5. Checkpoint Mode Interface (05-checkpoint-mode-interface.png)
6. Base Station Data Entry (06-base-station-data-entry.png)
7. Race Overview Statistics (07-race-overview-statistics.png)
8. Settings Modal Light (08-settings-modal-light.png)
9. Dark Mode Interface (09-dark-mode-interface.png)
10. Final Interface State (10-final-interface-state.png)

## Capture Guidelines

### Screenshot Requirements
- Resolution: 1920x1080 minimum
- Format: PNG
- Quality: High (no compression artifacts)
- Window: Full application window
- State: Clean test data

### Naming Convention
- Use descriptive, hyphenated names
- Include sequential numbers for order
- Example: `01-initial-application-launch.png`

### Required States to Capture
1. Initial States
   - Empty forms
   - Default views
   - Landing pages

2. Populated States
   - Filled forms
   - Active operations
   - Data displays

3. Modal States
   - Dialog boxes
   - Settings panels
   - Confirmation messages

4. Error States
   - Validation messages
   - Error dialogs
   - Warning states

## Automation

### Capture Script
Use `capture-base-station-screenshots.js` for automated capture:
```bash
node capture-base-station-screenshots.js
```

### Screenshot Verification
Use `final-screenshots.js` to verify all required screenshots exist:
```bash
node final-screenshots.js
```

## Maintenance

### Update Process
1. Identify outdated screenshots
2. Capture new versions
3. Update documentation references
4. Verify all paths

### Quality Checks
- Resolution matches requirements
- Clear and readable content
- Consistent styling
- Proper window focus
- Clean test data

## Usage in Documentation
- Reference screenshots by relative path
- Include descriptive alt text
- Provide context for each image
- Link to full-size versions when needed

## Best Practices
1. Keep screenshots up to date
2. Maintain consistent styling
3. Use clean test data
4. Capture full context
5. Follow naming conventions
6. Verify all paths
7. Include alt text
8. Document changes
