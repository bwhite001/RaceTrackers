/**
 * End-to-End Test Runner for Race Tracker Pro
 * Automated testing using Puppeteer
 */

import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3001',
  headless: false, // Set to true for CI/CD
  slowMo: 50, // Slow down by 50ms for visibility
  timeout: 30000,
  screenshotDir: join(__dirname, '../../../screenshots/e2e-tests'),
  viewport: {
    width: 1920,
    height: 1080
  }
};

// Ensure screenshot directory exists
if (!fs.existsSync(TEST_CONFIG.screenshotDir)) {
  fs.mkdirSync(TEST_CONFIG.screenshotDir, { recursive: true });
}

/**
 * Test Results Tracker
 */
class TestResults {
  constructor() {
    this.tests = [];
    this.startTime = Date.now();
  }

  addTest(name, status, duration, error = null, screenshot = null) {
    this.tests.push({
      name,
      status, // 'pass', 'fail', 'skip'
      duration,
      error,
      screenshot,
      timestamp: new Date().toISOString()
    });
  }

  getSummary() {
    const passed = this.tests.filter(t => t.status === 'pass').length;
    const failed = this.tests.filter(t => t.status === 'fail').length;
    const skipped = this.tests.filter(t => t.status === 'skip').length;
    const totalDuration = Date.now() - this.startTime;

    return {
      total: this.tests.length,
      passed,
      failed,
      skipped,
      duration: totalDuration,
      tests: this.tests
    };
  }

  generateReport() {
    const summary = this.getSummary();
    const report = [];

    report.push('═══════════════════════════════════════════════════════');
    report.push('           E2E TEST EXECUTION REPORT');
    report.push('═══════════════════════════════════════════════════════');
    report.push('');
    report.push(`Total Tests:    ${summary.total}`);
    report.push(`✅ Passed:      ${summary.passed}`);
    report.push(`❌ Failed:      ${summary.failed}`);
    report.push(`⏭️  Skipped:     ${summary.skipped}`);
    report.push(`⏱️  Duration:    ${(summary.duration / 1000).toFixed(2)}s`);
    report.push('');
    report.push('───────────────────────────────────────────────────────');
    report.push('                  TEST DETAILS');
    report.push('───────────────────────────────────────────────────────');
    report.push('');

    summary.tests.forEach((test, index) => {
      const icon = test.status === 'pass' ? '✅' : test.status === 'fail' ? '❌' : '⏭️';
      report.push(`${icon} Test ${index + 1}: ${test.name}`);
      report.push(`   Status: ${test.status.toUpperCase()}`);
      report.push(`   Duration: ${test.duration}ms`);
      if (test.error) {
        report.push(`   Error: ${test.error}`);
      }
      if (test.screenshot) {
        report.push(`   Screenshot: ${test.screenshot}`);
      }
      report.push('');
    });

    report.push('═══════════════════════════════════════════════════════');

    return report.join('\n');
  }
}

/**
 * Test Helper Functions
 */
class TestHelpers {
  constructor(page) {
    this.page = page;
  }

  async takeScreenshot(name) {
    const filename = `${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;
    const filepath = join(TEST_CONFIG.screenshotDir, filename);
    await this.page.screenshot({ path: filepath, fullPage: true });
    return filename;
  }

  async waitForSelector(selector, timeout = TEST_CONFIG.timeout) {
    await this.page.waitForSelector(selector, { timeout });
  }

  async clickButton(text) {
    await this.page.evaluate((buttonText) => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const button = buttons.find(b => b.textContent.includes(buttonText));
      if (button) button.click();
      else throw new Error(`Button with text "${buttonText}" not found`);
    }, text);
  }

  async fillInput(selector, value) {
    await this.page.waitForSelector(selector);
    await this.page.click(selector);
    await this.page.keyboard.type(value);
  }

  async selectDropdown(selector, value) {
    await this.page.waitForSelector(selector);
    await this.page.select(selector, value);
  }

  async getText(selector) {
    await this.page.waitForSelector(selector);
    return await this.page.$eval(selector, el => el.textContent);
  }

  async waitForNavigation() {
    await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
  }

  async delay(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * E2E Test Suite
 */
class E2ETestSuite {
  constructor() {
    this.browser = null;
    this.page = null;
    this.helpers = null;
    this.results = new TestResults();
  }

  async setup() {
    console.log('🚀 Starting E2E Test Suite...\n');
    
    this.browser = await puppeteer.launch({
      headless: TEST_CONFIG.headless,
      slowMo: TEST_CONFIG.slowMo,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport(TEST_CONFIG.viewport);
    this.helpers = new TestHelpers(this.page);

    // Listen for console messages
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Browser Console Error:', msg.text());
      }
    });

    // Listen for page errors
    this.page.on('pageerror', error => {
      console.log('❌ Page Error:', error.message);
    });
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
    console.log('\n' + this.results.generateReport());
  }

  async runTest(name, testFn) {
    console.log(`\n🧪 Running: ${name}`);
    const startTime = Date.now();
    let screenshot = null;

    try {
      await testFn();
      const duration = Date.now() - startTime;
      this.results.addTest(name, 'pass', duration);
      console.log(`✅ PASSED (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      screenshot = await this.helpers.takeScreenshot(`error-${name}`);
      this.results.addTest(name, 'fail', duration, error.message, screenshot);
      console.log(`❌ FAILED (${duration}ms): ${error.message}`);
      if (screenshot) {
        console.log(`   Screenshot saved: ${screenshot}`);
      }
    }
  }

  /**
   * Test 1: Homepage Load and Navigation
   */
  async testHomepageLoad() {
    await this.runTest('Homepage Load and Navigation', async () => {
      await this.page.goto(TEST_CONFIG.baseUrl);
      await this.helpers.waitForSelector('h1');
      
      const title = await this.helpers.getText('h1');
      if (!title.includes('Race Tracking System')) {
        throw new Error('Homepage title not found');
      }

      // Verify module cards present
      await this.helpers.waitForSelector('button:has-text("Race Maintenance")');
      await this.helpers.waitForSelector('button:has-text("Checkpoint Operations")');
      await this.helpers.waitForSelector('button:has-text("Base Station Operations")');

      await this.helpers.takeScreenshot('homepage-loaded');
    });
  }

  /**
   * Test 2: Race Setup - Step 1 (Race Details)
   */
  async testRaceSetupStep1() {
    await this.runTest('Race Setup - Enter Race Details', async () => {
      // Navigate to Race Maintenance
      await this.helpers.clickButton('Race Maintenance');
      await this.helpers.delay(1000);

      // Verify on setup page
      await this.helpers.waitForSelector('h1:has-text("Race Setup")');

      // Fill race details
      await this.helpers.fillInput('input[name="name"]', 'E2E Test Race');
      
      // Set date (7 days from now)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];
      await this.helpers.fillInput('input[type="date"]', dateString);

      // Set start time
      await this.helpers.fillInput('input[type="time"]', '06:00');

      // Add checkpoints
      await this.helpers.clickButton('Add Checkpoint');
      await this.helpers.fillInput('input[placeholder*="checkpoint"]', 'Mile 10');
      
      await this.helpers.clickButton('Add Checkpoint');
      const checkpointInputs = await this.page.$$('input[placeholder*="checkpoint"]');
      await checkpointInputs[1].type('Mile 25');

      await this.helpers.takeScreenshot('race-setup-step1-complete');

      // Click Next
      await this.helpers.clickButton('Next');
      await this.helpers.delay(1000);
    });
  }

  /**
   * Test 3: Race Setup - Step 2 (Runner Ranges)
   */
  async testRaceSetupStep2() {
    await this.runTest('Race Setup - Configure Runner Ranges', async () => {
      // Should be on step 2
      await this.helpers.waitForSelector('h2:has-text("Runner Setup")');

      // Add runner range
      await this.helpers.fillInput('input[placeholder*="start"]', '100');
      await this.helpers.fillInput('input[placeholder*="end"]', '150');
      await this.helpers.clickButton('Add Range');
      await this.helpers.delay(500);

      // Add second range
      await this.helpers.fillInput('input[placeholder*="start"]', '200');
      await this.helpers.fillInput('input[placeholder*="end"]', '225');
      await this.helpers.clickButton('Add Range');
      await this.helpers.delay(500);

      await this.helpers.takeScreenshot('race-setup-step2-complete');

      // Create race
      await this.helpers.clickButton('Create Race');
      await this.helpers.delay(2000);

      // Should navigate to overview
      await this.helpers.waitForSelector('h1:has-text("Race Overview")');
      await this.helpers.takeScreenshot('race-created-overview');
    });
  }

  /**
   * Test 4: Checkpoint Operations - Mark Runners
   */
  async testCheckpointOperations() {
    await this.runTest('Checkpoint Operations - Mark Runners', async () => {
      // Navigate to home
      await this.page.goto(TEST_CONFIG.baseUrl);
      await this.helpers.delay(1000);

      // Click Checkpoint Operations
      await this.helpers.clickButton('Checkpoint Operations');
      await this.helpers.delay(2000);

      // Should be on checkpoint view
      await this.helpers.waitForSelector('h1:has-text("Checkpoint")');

      // Mark some runners
      const runnerButtons = await this.page.$$('button:has-text("100")');
      if (runnerButtons.length > 0) {
        await runnerButtons[0].click();
        await this.helpers.delay(500);
      }

      await this.helpers.takeScreenshot('checkpoint-runner-marked');

      // Try search
      const searchInput = await this.page.$('input[placeholder*="search"]');
      if (searchInput) {
        await searchInput.type('110');
        await this.helpers.delay(500);
        await this.helpers.takeScreenshot('checkpoint-search');
      }
    });
  }

  /**
   * Test 5: Base Station Operations - Data Entry
   */
  async testBaseStationDataEntry() {
    await this.runTest('Base Station - Data Entry', async () => {
      // Navigate to home
      await this.page.goto(TEST_CONFIG.baseUrl);
      await this.helpers.delay(1000);

      // Click Base Station Operations
      await this.helpers.clickButton('Base Station Operations');
      await this.helpers.delay(2000);

      // Should be on base station view
      await this.helpers.waitForSelector('h1:has-text("Base Station")');

      // Navigate to Data Entry tab
      await this.helpers.clickButton('Data Entry');
      await this.helpers.delay(1000);

      await this.helpers.takeScreenshot('base-station-data-entry');

      // Try entering a finish time
      const runnerInput = await this.page.$('input[placeholder*="runner"]');
      if (runnerInput) {
        await runnerInput.type('100');
      }

      const timeInput = await this.page.$('input[type="time"]');
      if (timeInput) {
        await timeInput.type('08:30:45');
      }

      await this.helpers.takeScreenshot('base-station-data-entered');
    });
  }

  /**
   * Test 6: Keyboard Shortcuts
   */
  async testKeyboardShortcuts() {
    await this.runTest('Keyboard Shortcuts', async () => {
      // Should be on base station
      await this.helpers.waitForSelector('h1:has-text("Base Station")');

      // Test Alt+H for help
      await this.page.keyboard.down('Alt');
      await this.page.keyboard.press('h');
      await this.page.keyboard.up('Alt');
      await this.helpers.delay(1000);

      // Check if help dialog opened
      const helpDialog = await this.page.$('div:has-text("Keyboard Shortcuts")');
      if (!helpDialog) {
        throw new Error('Help dialog did not open');
      }

      await this.helpers.takeScreenshot('help-dialog-opened');

      // Close dialog with Escape
      await this.page.keyboard.press('Escape');
      await this.helpers.delay(500);
    });
  }

  /**
   * Test 7: Dark Mode Toggle
   */
  async testDarkMode() {
    await this.runTest('Dark Mode Toggle', async () => {
      // Find and click settings/theme toggle
      const themeToggle = await this.page.$('button[aria-label*="theme"]');
      if (themeToggle) {
        await themeToggle.click();
        await this.helpers.delay(1000);
        await this.helpers.takeScreenshot('dark-mode-enabled');

        // Toggle back
        await themeToggle.click();
        await this.helpers.delay(1000);
        await this.helpers.takeScreenshot('light-mode-restored');
      }
    });
  }

  /**
   * Test 8: Responsive Design
   */
  async testResponsiveDesign() {
    await this.runTest('Responsive Design', async () => {
      // Test mobile viewport
      await this.page.setViewport({ width: 375, height: 667 });
      await this.helpers.delay(1000);
      await this.helpers.takeScreenshot('mobile-viewport');

      // Test tablet viewport
      await this.page.setViewport({ width: 768, height: 1024 });
      await this.helpers.delay(1000);
      await this.helpers.takeScreenshot('tablet-viewport');

      // Restore desktop viewport
      await this.page.setViewport(TEST_CONFIG.viewport);
      await this.helpers.delay(1000);
    });
  }

  /**
   * Test 9: Navigation Protection
   */
  async testNavigationProtection() {
    await this.runTest('Navigation Protection During Operation', async () => {
      // Should be in base station
      await this.helpers.waitForSelector('h1:has-text("Base Station")');

      // Try to navigate away
      await this.page.goto(TEST_CONFIG.baseUrl);
      await this.helpers.delay(1000);

      // Check if warning dialog appears
      const dialog = await this.page.$('div:has-text("operation")');
      if (dialog) {
        await this.helpers.takeScreenshot('navigation-warning');
      }
    });
  }

  /**
   * Test 10: Error Handling
   */
  async testErrorHandling() {
    await this.runTest('Error Handling', async () => {
      // Navigate to base station data entry
      await this.page.goto(`${TEST_CONFIG.baseUrl}/base-station/operations`);
      await this.helpers.delay(2000);

      // Try to enter invalid data
      const runnerInput = await this.page.$('input[placeholder*="runner"]');
      if (runnerInput) {
        await runnerInput.click();
        await runnerInput.type('999'); // Invalid runner number
        
        const submitButton = await this.page.$('button:has-text("Submit")');
        if (submitButton) {
          await submitButton.click();
          await this.helpers.delay(1000);

          // Check for error message
          const errorMessage = await this.page.$('div:has-text("not found")');
          if (errorMessage) {
            await this.helpers.takeScreenshot('error-message-displayed');
          }
        }
      }
    });
  }

  /**
   * Run All Tests
   */
  async runAll() {
    try {
      await this.setup();

      // Run tests in sequence
      await this.testHomepageLoad();
      await this.testRaceSetupStep1();
      await this.testRaceSetupStep2();
      await this.testCheckpointOperations();
      await this.testBaseStationDataEntry();
      await this.testKeyboardShortcuts();
      await this.testDarkMode();
      await this.testResponsiveDesign();
      await this.testNavigationProtection();
      await this.testErrorHandling();

    } catch (error) {
      console.error('❌ Test suite error:', error);
    } finally {
      await this.teardown();
    }
  }
}

/**
 * Main Execution
 */
async function main() {
  const suite = new E2ETestSuite();
  await suite.runAll();
  
  // Exit with appropriate code
  const summary = suite.results.getSummary();
  process.exit(summary.failed > 0 ? 1 : 0);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default E2ETestSuite;
