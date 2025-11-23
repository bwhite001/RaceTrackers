# E2E Testing Guide

This directory contains End-to-End (E2E) tests for the RaceTracker application.

## 📋 Available Tests

### 1. Complete Workflow Test
**File:** `complete-workflow-test.js`  
**Coverage:** 100% (14 steps)  
**Duration:** ~5-7 minutes

Tests the complete race management workflow:
- Race Setup (creation, configuration)
- Export Configuration
- Database Clear
- Import Configuration
- Data Verification

## 🚀 Running Tests

### Prerequisites
```bash
# Install dependencies
npm install

# Ensure dev server is running
npm run dev
```

### Run Complete Workflow Test
```bash
# From project root
node src/test/e2e/complete-workflow-test.js
```

### Expected Output
```
╔════════════════════════════════════════════════════════════════╗
║  E2E Test: Complete Race Setup → Export → Delete → Import     ║
╚════════════════════════════════════════════════════════════════╝

🚀 Step 1: Launch Browser and Navigate to Homepage
📸 Screenshot saved: 01-homepage-loaded.png
✅ Step 1: Launch Browser and Navigate to Homepage - PASSED

📋 Step 2: Navigate to Race Maintenance
📸 Screenshot saved: 02-race-maintenance-opened.png
✅ Step 2: Navigate to Race Maintenance - PASSED

... (continues for all 14 steps)

✅ All test steps completed successfully!

╔════════════════════════════════════════════════════════════════╗
║                        TEST SUMMARY                            ║
╚════════════════════════════════════════════════════════════════╝
Total Steps: 14
Passed: 14 ✅
Failed: 0 ❌
Duration: 342.56s
Coverage: 100.0%
```

## 📸 Test Artifacts

### Screenshots
Location: `screenshots/e2e-tests/complete-workflow/`

All test steps are captured with screenshots:
- `01-homepage-loaded.png`
- `02-race-maintenance-opened.png`
- `03-race-details-filled.png`
- ... (20+ screenshots total)

### Test Results
Location: `E2E-TEST-RESULTS.json`

JSON file containing:
- Test execution details
- Step-by-step results
- Bug findings
- Performance metrics
- Timestamps

### Exported Configuration
Location: `screenshots/e2e-tests/complete-workflow/exported-config.json`

Sample exported race configuration for reference.

## 🐛 Bug Tracking

The test automatically tracks and reports bugs:

```json
{
  "bugs": [
    {
      "bugNumber": 13,
      "status": "FIXED",
      "description": "Runner Status Overview showing incorrect count",
      "expected": "101",
      "actual": "101"
    }
  ]
}
```

## 📊 Test Coverage

### Phase 1: Race Setup (5 steps)
- [x] Browser launch and navigation
- [x] Race Maintenance access
- [x] Race details form completion
- [x] Runner configuration
- [x] Race creation

### Phase 2: Export (3 steps)
- [x] Import/Export modal access
- [x] Configuration export
- [x] Export verification

### Phase 3: Database Clear (2 steps)
- [x] Settings modal access
- [x] Database clear with confirmation

### Phase 4: Import & Verification (4 steps)
- [x] Import modal access
- [x] Configuration import
- [x] Data verification
- [x] Functionality testing

**Total Coverage: 100% (14/14 steps)**

## 🔧 Configuration

### Test Settings
Edit `complete-workflow-test.js` to modify:

```javascript
const BASE_URL = 'http://localhost:5173';  // Dev server URL
const SCREENSHOT_DIR = 'screenshots/e2e-tests/complete-workflow';
const RESULTS_FILE = 'E2E-TEST-RESULTS.json';
```

### Browser Options
```javascript
browser = await puppeteer.launch({
  headless: false,  // Set to true for CI/CD
  args: ['--window-size=1920,1080']
});
```

## 🎯 Test Scenarios

### Scenario 1: Fresh Installation
Tests the complete workflow on a clean database:
1. Create new race
2. Export configuration
3. Clear database
4. Import configuration
5. Verify data integrity

### Scenario 2: Bug Verification
Specifically tests Bug #13 fix:
- Verifies runner count displays correctly (101)
- Checks before and after import
- Validates data persistence

## 📝 Writing New Tests

### Test Structure
```javascript
async function stepN_testName() {
  console.log('\n🎯 Step N: Test Description');
  try {
    // Test actions
    await page.click('button');
    await page.waitForSelector('element');
    
    // Screenshot
    const screenshot = await takeScreenshot('name', 'description');
    
    // Record result
    addTestStep(N, 'Test Name', 'passed', { screenshot });
  } catch (error) {
    addTestStep(N, 'Test Name', 'failed', { error: error.message });
    throw error;
  }
}
```

### Helper Functions
- `takeScreenshot(name, description)` - Capture screenshot
- `waitForElement(selector, timeout)` - Wait for element
- `addTestStep(number, name, status, details)` - Record step

## 🚨 Troubleshooting

### Test Fails to Start
```bash
# Check if dev server is running
npm run dev

# Check if port 5173 is available
lsof -i :5173
```

### Browser Doesn't Launch
```bash
# Install Chromium
npx puppeteer browsers install chrome
```

### Screenshots Not Saving
```bash
# Check directory permissions
ls -la screenshots/e2e-tests/

# Create directory if missing
mkdir -p screenshots/e2e-tests/complete-workflow
```

### Test Timeout
- Increase timeout in `waitForSelector` calls
- Check network speed
- Verify dev server performance

## 📚 Documentation

### Related Documents
- `E2E-TEST-FINAL-COMPLETE-REPORT.md` - Complete test report
- `E2E-COMPLETION-COMMIT-SUMMARY.md` - Commit documentation
- `E2E-TEST-COMPLETE-DOCUMENTATION.md` - Previous test docs

### Bug Reports
All 13 bugs documented in final report:
- Bug #1-12: Export/Import issues (FIXED)
- Bug #13: Runner count display (FIXED)

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run dev &
      - run: sleep 10
      - run: node src/test/e2e/complete-workflow-test.js
      - uses: actions/upload-artifact@v2
        with:
          name: test-results
          path: |
            E2E-TEST-RESULTS.json
            screenshots/
```

## ✅ Success Criteria

A successful test run should have:
- ✅ All 14 steps passed
- ✅ 0 failed steps
- ✅ 20+ screenshots captured
- ✅ JSON results file generated
- ✅ No console errors
- ✅ Runner count displays "101"
- ✅ Import/Export working correctly

## 📞 Support

### Issues?
1. Check dev server is running
2. Review test output for specific errors
3. Check screenshots for visual debugging
4. Review `E2E-TEST-RESULTS.json` for details

### Questions?
- Review main documentation
- Check test code comments
- Examine screenshot artifacts

---

**Last Updated:** December 2024  
**Test Coverage:** 100%  
**Status:** ✅ All Tests Passing
