# End-to-End Testing Guide

## Overview

This directory contains comprehensive end-to-end (E2E) testing resources for Race Tracker Pro, including:

- **E2E_TEST_PLAN.md** - Detailed manual testing plan with 14 complete workflows
- **test-data-seeder.js** - Automated test data generation
- **e2e-test-runner.js** - Automated E2E tests using Puppeteer
- **USER_WORKFLOWS.md** - Complete user workflow documentation (in project root)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The application should be running at `http://localhost:5173`

### 3. Run Automated E2E Tests

In a new terminal:

```bash
npm run test:e2e
```

This will:
- Launch Puppeteer browser
- Run 10 automated test scenarios
- Generate screenshots in `screenshots/e2e-tests/`
- Display test results summary

### 4. Seed Test Data (Optional)

To populate the database with realistic test data:

```bash
npm run test:seed
```

Or from browser console:
```javascript
import seeder from './src/test/e2e/test-data-seeder.js';
await seeder.seedCompleteTestDataset();
```

## Manual Testing

### Prerequisites

1. **Clear Browser Data**
   - Open DevTools (F12)
   - Go to Application tab
   - Clear Storage → Clear site data
   - Refresh page

2. **Prepare Test Environment**
   - Ensure dev server running
   - Have test data ready (see E2E_TEST_PLAN.md)
   - Open browser console for error monitoring

### Running Manual Tests

Follow the detailed workflows in **E2E_TEST_PLAN.md**:

1. **Workflow 1**: Race Setup and Configuration
2. **Workflow 2**: Share Race Configuration
3. **Workflow 3**: Checkpoint Operations - Runner Tracking
4. **Workflow 4**: Checkpoint Operations - Callout Sheet
5. **Workflow 5**: Base Station Operations - Data Entry
6. **Workflow 6**: Base Station Operations - Status Management
7. **Workflow 7**: Base Station Operations - Lists and Reports
8. **Workflow 8**: Base Station Operations - Log Operations
9. **Workflow 9**: Base Station Operations - Housekeeping
10. **Workflow 10**: Keyboard Shortcuts
11. **Workflow 11**: Dark Mode and Settings
12. **Workflow 12**: Multi-Module Integration
13. **Workflow 13**: Offline Operation
14. **Workflow 14**: Accessibility Testing

### Test Data

Use the test data provided in E2E_TEST_PLAN.md:

**Race Configuration:**
```
Name: Mountain Trail 100K
Date: [Current Date + 7 days]
Start Time: 06:00
Checkpoints: Mile 10, Mile 25, Mile 40
Runner Ranges: 100-150, 200-225, 300-310
Total Runners: 88
```

## Automated Testing

### Test Data Seeder

The test data seeder creates realistic race scenarios for testing.

#### Complete Dataset

```javascript
import seeder from './src/test/e2e/test-data-seeder.js';

// Seed complete test dataset
const result = await seeder.seedCompleteTestDataset();

// Result includes:
// - Race with 88 runners
// - 3 checkpoints with marked runners
// - 30 finishers with times
// - Status changes (withdrawals, vet outs, DNFs)
// - Audit log entries
// - Strapper calls
// - Deleted entries
```

#### Minimal Dataset

```javascript
// Seed minimal dataset for quick testing
const result = await seeder.seedMinimalTestDataset();

// Result includes:
// - Race with 88 runners
// - 10 runners marked at checkpoint 1
// - 5 finishers
```

#### Custom Seeding

```javascript
// Seed specific data types
await seeder.seedRaceConfiguration();
await seeder.seedCheckpointData(raceId, checkpointNumber, runnerCount);
await seeder.seedBaseStationData(raceId, finisherCount);
await seeder.seedStatusChanges(raceId);
await seeder.seedAuditLog(raceId, entryCount);
await seeder.seedStrapperCalls(raceId);
await seeder.seedDeletedEntries(raceId);

// Clear all data
await seeder.clearAllTestData();
```

### E2E Test Runner

The automated test runner uses Puppeteer to simulate user interactions.

#### Run All Tests

```bash
npm run test:e2e
```

#### Run Specific Tests

```javascript
import E2ETestSuite from './src/test/e2e/e2e-test-runner.js';

const suite = new E2ETestSuite();
await suite.setup();

// Run individual tests
await suite.testHomepageLoad();
await suite.testRaceSetupStep1();
await suite.testCheckpointOperations();

await suite.teardown();
```

#### Test Configuration

Edit `e2e-test-runner.js` to customize:

```javascript
const TEST_CONFIG = {
  baseUrl: 'http://localhost:5173',
  headless: false,        // Set true for CI/CD
  slowMo: 50,            // Slow down for visibility
  timeout: 30000,        // 30 second timeout
  screenshotDir: '...',  // Screenshot directory
  viewport: {
    width: 1920,
    height: 1080
  }
};
```

### Available Automated Tests

1. **Homepage Load and Navigation** - Verify homepage loads correctly
2. **Race Setup Step 1** - Test race details entry
3. **Race Setup Step 2** - Test runner range configuration
4. **Checkpoint Operations** - Test runner marking
5. **Base Station Data Entry** - Test finish time entry
6. **Keyboard Shortcuts** - Test hotkey functionality
7. **Dark Mode Toggle** - Test theme switching
8. **Responsive Design** - Test mobile/tablet layouts
9. **Navigation Protection** - Test operation locks
10. **Error Handling** - Test validation and errors

## Test Results

### Automated Test Output

```
═══════════════════════════════════════════════════════
           E2E TEST EXECUTION REPORT
═══════════════════════════════════════════════════════

Total Tests:    10
✅ Passed:      9
❌ Failed:      1
⏭️  Skipped:     0
⏱️  Duration:    45.23s

───────────────────────────────────────────────────────
                  TEST DETAILS
───────────────────────────────────────────────────────

✅ Test 1: Homepage Load and Navigation
   Status: PASS
   Duration: 2341ms

❌ Test 2: Race Setup - Enter Race Details
   Status: FAIL
   Duration: 5123ms
   Error: Button with text "Next" not found
   Screenshot: error-race-setup-enter-race-details-1234567890.png

...
```

### Screenshots

All test screenshots are saved to:
```
screenshots/e2e-tests/
├── homepage-loaded-1234567890.png
├── race-setup-step1-complete-1234567891.png
├── checkpoint-runner-marked-1234567892.png
├── error-race-setup-1234567893.png
└── ...
```

### Manual Test Results

Document manual test results using the template in E2E_TEST_PLAN.md:

```markdown
### Test Execution Report

**Date**: 2024-12-20
**Tester**: John Doe
**Environment**: Chrome 120 / Windows 11
**Build**: v1.0.0

## Summary
- Total Workflows: 14
- Workflows Passed: 13
- Workflows Failed: 1
- Workflows Blocked: 0

## Issues Found
1. [Critical] Data loss when navigating during operation
2. [High] Search not working in checkpoint view
...
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build application
        run: npm run build
      
      - name: Start server
        run: npm run preview &
        
      - name: Wait for server
        run: npx wait-on http://localhost:4173
      
      - name: Run E2E tests
        run: npm run test:e2e:ci
      
      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v2
        with:
          name: e2e-screenshots
          path: screenshots/e2e-tests/
```

## Best Practices

### Before Testing

1. **Clear Data**: Always start with clean state
2. **Check Console**: Monitor for errors during testing
3. **Document Issues**: Take screenshots and note steps
4. **Test Systematically**: Follow workflows in order
5. **Verify Data**: Check database after operations

### During Testing

1. **One Change at a Time**: Test individual features
2. **Wait for Feedback**: Allow UI to update
3. **Check All States**: Test success and error cases
4. **Use Real Data**: Test with realistic scenarios
5. **Test Edge Cases**: Try boundary conditions

### After Testing

1. **Document Results**: Record all findings
2. **Report Bugs**: Use bug template from E2E_TEST_PLAN.md
3. **Verify Fixes**: Retest after bug fixes
4. **Update Tests**: Keep test cases current
5. **Share Findings**: Communicate with team

## Troubleshooting

### Common Issues

**Issue**: Tests fail with "Element not found"
- **Solution**: Increase timeout or add explicit waits
- **Check**: Ensure dev server is running
- **Verify**: Element selectors are correct

**Issue**: Screenshots not saving
- **Solution**: Check directory permissions
- **Verify**: Screenshot directory exists
- **Check**: Disk space available

**Issue**: Browser doesn't launch
- **Solution**: Install Chrome/Chromium
- **Check**: Puppeteer installation
- **Try**: Run with `headless: false`

**Issue**: Tests timeout
- **Solution**: Increase timeout in config
- **Check**: Network speed
- **Verify**: Application performance

**Issue**: Data not persisting
- **Solution**: Check IndexedDB in DevTools
- **Verify**: Database schema version
- **Clear**: Browser storage and retry

### Debug Mode

Run tests with debug output:

```bash
DEBUG=puppeteer:* npm run test:e2e
```

Or modify test runner:

```javascript
const TEST_CONFIG = {
  headless: false,  // See browser
  slowMo: 250,      // Slow down significantly
  devtools: true    // Open DevTools
};
```

### Manual Debugging

1. **Open DevTools** (F12)
2. **Check Console** for errors
3. **Inspect Network** tab for failed requests
4. **View Application** tab for storage
5. **Use Sources** tab for breakpoints

## Resources

### Documentation

- **E2E_TEST_PLAN.md** - Complete manual testing guide
- **USER_WORKFLOWS.md** - User workflow documentation
- **README.md** (this file) - Testing guide

### Tools

- **Puppeteer** - Browser automation
- **Vitest** - Unit/integration testing
- **Testing Library** - Component testing
- **Chrome DevTools** - Debugging

### External Resources

- [Puppeteer Documentation](https://pptr.dev/)
- [Testing Best Practices](https://testingjavascript.com/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web Performance](https://web.dev/performance/)

## Contributing

### Adding New Tests

1. **Manual Tests**: Add to E2E_TEST_PLAN.md
2. **Automated Tests**: Add to e2e-test-runner.js
3. **Test Data**: Update test-data-seeder.js
4. **Documentation**: Update this README

### Test Template

```javascript
async testNewFeature() {
  await this.runTest('New Feature Test', async () => {
    // Setup
    await this.page.goto(TEST_CONFIG.baseUrl);
    
    // Action
    await this.helpers.clickButton('New Feature');
    
    // Assertion
    await this.helpers.waitForSelector('.success-message');
    
    // Screenshot
    await this.helpers.takeScreenshot('new-feature-success');
  });
}
```

## Support

For issues or questions:

1. Check this README
2. Review E2E_TEST_PLAN.md
3. Check existing test files
4. Consult team documentation
5. Create issue with details

## License

This testing suite is part of Race Tracker Pro and follows the same license.
