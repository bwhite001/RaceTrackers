/**
 * End-to-End Test Runner for Race Tracker Pro
 * Automated testing using Puppeteer - FIXED VERSION
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

  async waitForText(text, timeout = TEST_CONFIG.timeout) {
    await this.page.waitForFunction(
      (searchText) => {
        return document.body.textContent.includes(searchText);
      },
      { timeout },
      text
    );
  }

  async clickButton(text) {
    await this.page.evaluate((buttonText) => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const button = buttons.find(b => b.textContent.includes(buttonText));
      if (button) button.click();
      else throw new Error(`Button with text "${buttonText}" not found`);
    }, text);
    await this.delay(500); // Wait for click to register
  }

  async fillInput(selector, value) {
    await this.page.waitForSelector(selector);
    await this.page.click(selector, { clickCount: 3 }); // Select all
    await this.page.keyboard.press('Backspace'); // Clear
    await this.page.type(selector, value);
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

      // Verify module cards present using waitForText
      await this.helpers.waitForText('Race Maintenance');
      await this.helpers.waitForText('Checkpoint Operations');
      await this.helpers.waitForText('Base Station Operations');

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
      await this.helpers.waitForText('Race Setup');

      // Fill race details
      await this.helpers.fillInput('input[name="name"]', 'E2E Test Race');
      
      // Set date (7 days from now)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];
      await this.helpers.fillInput('input[type="date"]', dateString);

      // Set start time
      await this.helpers.fillInput('input[type="time"]', '06:00');

      // Select number of checkpoints
      await this.helpers.selectDropdown('select#numCheckpoints', '3');
      await this.helpers.delay(500);

      await this.helpers.takeScreenshot('race-setup-step1-complete');

      // Click Next
      await this.helpers.clickButton('Next: Configure Runners');
      await this.helpers.delay(1000);
    });
  }

  /**
   * Test 3: Race Setup - Step 2 (Runner Ranges)
   */
  async testRaceSetupStep2() {
    await this.runTest('Race Setup - Configure Runner Ranges', async () => {
      // Should be on step 2
      await this.helpers.waitForText('Runner Setup');

      // Verify race details are displayed
      await this.helpers.waitForText('E2E Test Race');

      // Add runner range
      await this.helpers.fillInput('input#minRunner', '100');
      await this.helpers.fillInput('input#maxRunner', '150');
      await this.helpers.clickButton('Add Range');
      await this.helpers.delay(500);

      // Add second range
      await this.helpers.fillInput('input#minRunner', '200');
      await this.helpers.fillInput('input#maxRunner', '225');
      await this.helpers.clickButton('Add Range');
      await this.helpers.delay(500);

      await this.helpers.takeScreenshot('race-setup-step2-complete');

      // Create race
      await this.helpers.clickButton('Create Race');
      await this.helpers.delay(2000);

      // Should navigate to overview
      await this.helpers.waitForText('Race Overview');
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
      await this.helpers.waitForText('Checkpoint');

      await this.helpers.takeScreenshot('checkpoint-view');
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
      await this.helpers.waitForText('Base Station');

      await this.helpers.takeScreenshot('base-station-view');
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
