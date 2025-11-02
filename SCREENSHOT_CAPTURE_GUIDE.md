# Screenshot Capture Guide

This guide explains how to capture screenshots for documentation purposes in the Race Tracker Pro application.

## Available Screenshot Scripts

### 1. Base Station Screenshots
Captures 18 comprehensive screenshots of the Base Station Operations module.

**Command:**
```bash
npm run screenshots:base-station
```

**Output Location:** `screenshots/base-station-guide/`

**What's Captured:**
- Homepage with Base Station card
- All tabs (Runner Grid, Data Entry, Log Operations, Lists & Reports, Housekeeping, Overview)
- All dialogs (Withdrawal, Vet-Out, Duplicates, Deleted Entries, Backup, Help, About)
- All panels (Missing Numbers, Out List, Reports, Strapper Calls)

### 2. General Application Screenshots
Captures 10 screenshots covering the overall application workflow.

**Command:**
```bash
npm run screenshots:all
```

**Output Location:** `screenshots/`

**What's Captured:**
- Initial application launch
- Race creation process
- Mode selection
- Checkpoint and Base Station interfaces
- Settings and dark mode

## Prerequisites

### 1. Start the Development Server

The application must be running before capturing screenshots:

```bash
npm run dev
```

The server should be accessible at:
- General screenshots: `http://localhost:3000`
- Base Station screenshots: `http://localhost:3001`

### 2. Prepare Test Data

For best results, ensure:
- ✓ A race is created with appropriate runner ranges
- ✓ Some runner data exists (for realistic screenshots)
- ✓ Base Station mode is accessible
- ✓ Various states are available (withdrawn runners, duplicates, etc.)

**Optional:** Use the test seeder to populate data:
```bash
node test-seeder.js
```

## Running Screenshot Capture

### Quick Start

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **In a new terminal, capture screenshots:**
   ```bash
   # For Base Station screenshots
   npm run screenshots:base-station
   
   # OR for general application screenshots
   npm run screenshots:all
   ```

3. **Review the output:**
   - Check the screenshots directory
   - Review the generated `CAPTURE_SUMMARY.md` file

### Advanced Usage

#### Direct Script Execution

You can also run the scripts directly:

```bash
# Base Station screenshots
node capture-base-station-screenshots.js

# General screenshots
node final-screenshots.js
```

#### Customizing Screenshots

To modify what gets captured, edit the respective script file:

**For Base Station:** `capture-base-station-screenshots.js`
```javascript
const screenshots = [
  {
    name: 'custom-screenshot-name',
    description: 'Description of what this captures',
    url: 'http://localhost:3001/base-station',
    actions: [
      { type: 'click', selector: '[data-tab="overview"]' },
      { type: 'wait', duration: 500 }
    ]
  }
  // Add more screenshot configurations...
];
```

**Available Action Types:**
- `wait` - Wait for element or duration
  - `{ type: 'wait', selector: '[data-tab="grid"]' }` - Wait for element
  - `{ type: 'wait', duration: 500 }` - Wait for milliseconds
- `click` - Click an element
  - `{ type: 'click', selector: '[data-tab="overview"]' }` - Click by selector
  - `{ type: 'click', selector: 'button:contains("Help")' }` - Click by text content
- `scroll` - Scroll the page
  - `{ type: 'scroll', direction: 'down' }` - Scroll down
  - `{ type: 'scroll', direction: 'up' }` - Scroll up

## Output Structure

### Base Station Screenshots

```
screenshots/base-station-guide/
├── README.md                                    # Guide for this directory
├── CAPTURE_SUMMARY.md                          # Capture statistics and results
├── base-station-01-homepage.png
├── base-station-02-runner-grid-tab.png
├── base-station-03-data-entry-tab.png
├── base-station-04-withdrawal-dialog.png
├── base-station-05-vet-out-dialog.png
├── base-station-06-log-operations-tab.png
├── base-station-07-duplicates-dialog.png
├── base-station-08-deleted-entries-view.png
├── base-station-09-lists-reports-tab.png
├── base-station-10-missing-numbers-list.png
├── base-station-11-out-list.png
├── base-station-12-reports-panel.png
├── base-station-13-housekeeping-tab.png
├── base-station-14-strapper-calls-panel.png
├── base-station-15-backup-dialog.png
├── base-station-16-help-dialog.png
├── base-station-17-about-dialog.png
└── base-station-18-overview-tab.png
```

### General Application Screenshots

```
screenshots/
├── SCREENSHOTS_CAPTURE_SUMMARY.md
├── 01-initial-application-launch.png
├── 02-race-creation-form-empty.png
├── 03-race-form-with-data.png
├── 04-race-created-mode-selection.png
├── 05-checkpoint-mode-interface.png
├── 06-base-station-data-entry.png
├── 07-race-overview-statistics.png
├── 08-settings-modal-light.png
├── 09-dark-mode-interface.png
└── 10-final-interface-state.png
```

## Troubleshooting

### Common Issues

#### 1. Connection Refused Error
```
Error: net::ERR_CONNECTION_REFUSED at http://localhost:3001
```

**Solution:** Start the development server first:
```bash
npm run dev
```

#### 2. Element Not Found
```
Error: Waiting for selector failed: timeout 5000ms exceeded
```

**Possible Causes:**
- Element selector has changed in the UI
- Page hasn't fully loaded
- Required data doesn't exist

**Solutions:**
- Verify the element exists in the current UI
- Increase wait times in the script
- Ensure test data is properly set up

#### 3. Permission Denied
```
Error: EACCES: permission denied, mkdir 'screenshots'
```

**Solution:** Check directory permissions:
```bash
chmod 755 screenshots
```

#### 4. Puppeteer Installation Issues
```
Error: Could not find Chrome
```

**Solution:** Reinstall Puppeteer:
```bash
npm install puppeteer --force
```

### Debugging Tips

1. **Run in Non-Headless Mode:**
   Edit the script and change:
   ```javascript
   headless: false  // Instead of true
   ```

2. **Add More Delays:**
   Increase wait times if elements aren't loading:
   ```javascript
   { type: 'wait', duration: 2000 }  // Increase from 500ms
   ```

3. **Check Console Output:**
   The script provides detailed logging of each step

4. **Verify URLs:**
   Ensure the correct port is being used (3000 vs 3001)

## Screenshot Quality Guidelines

When reviewing captured screenshots, ensure:

- ✓ **Resolution:** 900x600 pixels (standard viewport)
- ✓ **Visibility:** All UI elements are clearly visible
- ✓ **Completeness:** No loading spinners or partial renders
- ✓ **Relevance:** Screenshot shows the intended feature/state
- ✓ **Clarity:** Text is readable and not blurred
- ✓ **Consistency:** Similar styling across all screenshots

## Integration with Documentation

These screenshots are referenced in:
- `BASE_STATION_USER_GUIDE.md` - Comprehensive Base Station documentation
- `README.md` - Project overview and quick start
- `HOW_TO_USE_README.md` - User instructions

To reference a screenshot in markdown:
```markdown
![Screenshot Description](./screenshots/base-station-guide/base-station-01-homepage.png)
```

## Maintenance

### When to Re-capture Screenshots

Re-run screenshot capture when:
- UI design changes significantly
- New features are added
- Layout or styling is updated
- Documentation needs to be refreshed

### Updating Screenshot Configurations

1. Edit the appropriate script file
2. Modify the `screenshots` array
3. Test the changes by running the script
4. Commit updated screenshots to version control

## Technical Details

### Browser Configuration

- **Browser:** Chromium (via Puppeteer)
- **Viewport:** 900x600 pixels
- **Mode:** Headless (no visible browser window)
- **Wait Strategy:** networkidle0 (waits for network to be idle)

### Performance

- **Average Time:** ~2-3 seconds per screenshot
- **Total Time (Base Station):** ~1-2 minutes for all 18 screenshots
- **Total Time (General):** ~30-45 seconds for all 10 screenshots

### Dependencies

- **puppeteer:** ^24.12.1 - Browser automation
- **Node.js:** ES Modules support required
- **File System:** Native fs module for file operations

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the script's console output for detailed error messages
3. Verify all prerequisites are met
4. Check that the application is running correctly in a browser first

## Future Enhancements

Potential improvements for the screenshot capture system:
- [ ] Parallel screenshot capture for faster execution
- [ ] Screenshot comparison to detect UI changes
- [ ] Automated screenshot validation
- [ ] Integration with CI/CD pipeline
- [ ] Support for different viewport sizes
- [ ] Video recording of user workflows
