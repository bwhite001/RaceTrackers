/**
 * Complete E2E Test: Race Setup → Export → Delete → Import Workflow
 * 
 * This test covers the complete workflow:
 * 1. Race Setup (Race Details + Runner Configuration)
 * 2. Export Configuration
 * 3. Database Clear
 * 4. Import Configuration
 * 5. Verification
 * 
 * Run with: node src/test/e2e/complete-workflow-test.js
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3004';
const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots', 'e2e-tests', 'complete-workflow');
const RESULTS_FILE = path.join(process.cwd(), 'E2E-TEST-RESULTS.json');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Test results tracking
const testResults = {
  testName: 'Complete E2E Workflow Test',
  timestamp: new Date().toISOString(),
  steps: [],
  bugs: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    duration: 0
  }
};

let browser;
let page;
let exportedConfig = null;

// Helper function to take screenshot
async function takeScreenshot(name, description) {
  const filename = `${String(testResults.steps.length + 1).padStart(2, '0')}-${name}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot saved: ${filename}`);
  return { filename, description };
}

// Helper function to wait for element
async function waitForElement(selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    console.error(`❌ Element not found: ${selector}`);
    return false;
  }
}

// Helper function to add test step
function addTestStep(stepNumber, name, status, details = {}) {
  const step = {
    stepNumber,
    name,
    status,
    timestamp: new Date().toISOString(),
    ...details
  };
  testResults.steps.push(step);
  testResults.summary.total++;
  if (status === 'passed') {
    testResults.summary.passed++;
    console.log(`✅ Step ${stepNumber}: ${name} - PASSED`);
  } else {
    testResults.summary.failed++;
    console.log(`❌ Step ${stepNumber}: ${name} - FAILED`);
  }
  return step;
}

// Test Steps
async function step1_launchBrowser() {
  console.log('\n🚀 Step 1: Launch Browser and Navigate to Homepage');
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--window-size=1920,1080']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await page.waitForSelector('h1', { timeout: 5000 });
    
    const screenshot = await takeScreenshot('homepage-loaded', 'Homepage successfully loaded');
    addTestStep(1, 'Launch Browser and Navigate to Homepage', 'passed', { screenshot });
  } catch (error) {
    addTestStep(1, 'Launch Browser and Navigate to Homepage', 'failed', { error: error.message });
    throw error;
  }
}

async function step2_navigateToRaceMaintenance() {
  console.log('\n📋 Step 2: Navigate to Race Maintenance');
  try {
    await page.click('button:has-text("Race Maintenance")');
    await page.waitForSelector('h1:has-text("Race Setup")', { timeout: 5000 });
    
    const screenshot = await takeScreenshot('race-maintenance-opened', 'Race Maintenance module opened');
    addTestStep(2, 'Navigate to Race Maintenance', 'passed', { screenshot });
  } catch (error) {
    addTestStep(2, 'Navigate to Race Maintenance', 'failed', { error: error.message });
    throw error;
  }
}

async function step3_fillRaceDetails() {
  console.log('\n📝 Step 3: Fill Race Details Form');
  try {
    // Fill race name
    await page.type('input[name="name"]', 'E2E Test Race Complete');
    
    // Fill race date (today)
    const today = new Date().toISOString().split('T')[0];
    await page.type('input[name="date"]', today);
    
    // Fill start time
    await page.type('input[name="startTime"]', '08:00');
    
    // Fill location
    await page.type('input[name="location"]', 'E2E Test Location');
    
    const screenshot = await takeScreenshot('race-details-filled', 'Race details form completed');
    addTestStep(3, 'Fill Race Details Form', 'passed', { screenshot });
  } catch (error) {
    addTestStep(3, 'Fill Race Details Form', 'failed', { error: error.message });
    throw error;
  }
}

async function step4_configureRunners() {
  console.log('\n🏃 Step 4: Configure Runner Ranges');
  try {
    // Click Next to go to runner configuration
    await page.click('button:has-text("Next")');
    await page.waitForSelector('h2:has-text("Runner Configuration")', { timeout: 5000 });
    
    // Use default range (100-200, 101 runners)
    const screenshot = await takeScreenshot('runner-config-default', 'Runner configuration with default range');
    addTestStep(4, 'Configure Runner Ranges', 'passed', { 
      screenshot,
      runnerCount: 101,
      range: '100-200'
    });
  } catch (error) {
    addTestStep(4, 'Configure Runner Ranges', 'failed', { error: error.message });
    throw error;
  }
}

async function step5_createRace() {
  console.log('\n✨ Step 5: Create Race');
  try {
    // Click Create Race button
    await page.click('button:has-text("Create Race")');
    
    // Wait for race overview page
    await page.waitForSelector('h1:has-text("Overview")', { timeout: 10000 });
    
    // Verify runner count is displayed correctly
    await page.waitForSelector('.card:has-text("Total Runners")', { timeout: 5000 });
    const runnerCountText = await page.$eval('.card:has-text("Total Runners") .text-2xl', el => el.textContent);
    
    const screenshot = await takeScreenshot('race-created-overview', 'Race created and overview page loaded');
    
    if (runnerCountText === '101') {
      addTestStep(5, 'Create Race', 'passed', { 
        screenshot,
        runnerCount: runnerCountText,
        bugFixed: 'Bug #13 - Runner count now displays correctly'
      });
    } else {
      addTestStep(5, 'Create Race', 'failed', { 
        screenshot,
        runnerCount: runnerCountText,
        expected: '101',
        bug: 'Bug #13 still present - Runner count incorrect'
      });
      testResults.bugs.push({
        bugNumber: 13,
        status: 'NOT FIXED',
        description: 'Runner Status Overview showing incorrect count',
        expected: '101',
        actual: runnerCountText
      });
    }
  } catch (error) {
    addTestStep(5, 'Create Race', 'failed', { error: error.message });
    throw error;
  }
}

async function step6_openImportExportModal() {
  console.log('\n📤 Step 6: Open Import/Export Modal');
  try {
    // Click on header settings/menu to find Import/Export
    await page.click('button[aria-label="Settings"]');
    await page.waitForTimeout(500);
    
    // Look for Import/Export button
    await page.click('button:has-text("Import / Export")');
    await page.waitForSelector('h2:has-text("Import / Export Race Configuration")', { timeout: 5000 });
    
    const screenshot = await takeScreenshot('import-export-modal-opened', 'Import/Export modal opened');
    addTestStep(6, 'Open Import/Export Modal', 'passed', { screenshot });
  } catch (error) {
    addTestStep(6, 'Open Import/Export Modal', 'failed', { error: error.message });
    throw error;
  }
}

async function step7_exportConfiguration() {
  console.log('\n💾 Step 7: Export Race Configuration');
  try {
    // Ensure we're on Export tab
    await page.click('button:has-text("Export Configuration")');
    await page.waitForTimeout(500);
    
    // Click Export Race Configuration button
    await page.click('button:has-text("Export Race Configuration")');
    await page.waitForTimeout(2000);
    
    // Get the exported configuration from the textarea
    const configText = await page.$eval('textarea[readonly]', el => el.value);
    exportedConfig = JSON.parse(configText);
    
    const screenshot = await takeScreenshot('configuration-exported', 'Race configuration exported successfully');
    addTestStep(7, 'Export Race Configuration', 'passed', { 
      screenshot,
      configSize: configText.length,
      exportType: exportedConfig.exportType
    });
    
    // Save exported config to file for reference
    fs.writeFileSync(
      path.join(SCREENSHOT_DIR, 'exported-config.json'),
      JSON.stringify(exportedConfig, null, 2)
    );
    console.log('📄 Exported configuration saved to exported-config.json');
  } catch (error) {
    addTestStep(7, 'Export Race Configuration', 'failed', { error: error.message });
    throw error;
  }
}

async function step8_closeExportModal() {
  console.log('\n❌ Step 8: Close Import/Export Modal');
  try {
    // Click close button
    await page.click('button[aria-label="Close"]');
    await page.waitForTimeout(500);
    
    const screenshot = await takeScreenshot('export-modal-closed', 'Import/Export modal closed');
    addTestStep(8, 'Close Import/Export Modal', 'passed', { screenshot });
  } catch (error) {
    addTestStep(8, 'Close Import/Export Modal', 'failed', { error: error.message });
    throw error;
  }
}

async function step9_openSettingsModal() {
  console.log('\n⚙️ Step 9: Open Settings Modal');
  try {
    // Click settings button
    await page.click('button[aria-label="Settings"]');
    await page.waitForSelector('h2:has-text("Settings")', { timeout: 5000 });
    
    const screenshot = await takeScreenshot('settings-modal-opened', 'Settings modal opened');
    addTestStep(9, 'Open Settings Modal', 'passed', { screenshot });
  } catch (error) {
    addTestStep(9, 'Open Settings Modal', 'failed', { error: error.message });
    throw error;
  }
}

async function step10_clearDatabase() {
  console.log('\n🗑️ Step 10: Clear Database');
  try {
    // Scroll to Danger Zone
    await page.evaluate(() => {
      const dangerZone = document.querySelector('h3:has-text("Danger Zone")');
      if (dangerZone) dangerZone.scrollIntoView();
    });
    await page.waitForTimeout(500);
    
    // Click Clear Database button
    await page.click('button:has-text("Clear Database")');
    await page.waitForTimeout(500);
    
    const screenshot1 = await takeScreenshot('clear-database-confirmation', 'Clear database confirmation shown');
    
    // Type CLEAR in confirmation input
    await page.type('input[placeholder="CLEAR"]', 'CLEAR');
    await page.waitForTimeout(500);
    
    const screenshot2 = await takeScreenshot('clear-confirmation-typed', 'CLEAR typed in confirmation');
    
    // Click Confirm Clear Database button
    await page.click('button:has-text("Confirm Clear Database")');
    
    // Wait for page reload
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    
    const screenshot3 = await takeScreenshot('database-cleared', 'Database cleared and page reloaded');
    
    addTestStep(10, 'Clear Database', 'passed', { 
      screenshots: [screenshot1, screenshot2, screenshot3],
      confirmationRequired: 'CLEAR'
    });
  } catch (error) {
    addTestStep(10, 'Clear Database', 'failed', { error: error.message });
    throw error;
  }
}

async function step11_openImportModal() {
  console.log('\n📥 Step 11: Open Import/Export Modal for Import');
  try {
    // Navigate back to homepage if needed
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    
    // Open Import/Export modal
    await page.click('button[aria-label="Settings"]');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Import / Export")');
    await page.waitForSelector('h2:has-text("Import / Export Race Configuration")', { timeout: 5000 });
    
    // Switch to Import tab
    await page.click('button:has-text("Import Configuration")');
    await page.waitForTimeout(500);
    
    const screenshot = await takeScreenshot('import-tab-opened', 'Import Configuration tab opened');
    addTestStep(11, 'Open Import/Export Modal for Import', 'passed', { screenshot });
  } catch (error) {
    addTestStep(11, 'Open Import/Export Modal for Import', 'failed', { error: error.message });
    throw error;
  }
}

async function step12_importConfiguration() {
  console.log('\n📦 Step 12: Import Race Configuration');
  try {
    if (!exportedConfig) {
      throw new Error('No exported configuration available');
    }
    
    // Paste configuration into textarea
    await page.type('textarea[placeholder*="Paste race configuration"]', JSON.stringify(exportedConfig));
    await page.waitForTimeout(1000);
    
    const screenshot1 = await takeScreenshot('config-pasted', 'Configuration pasted into import field');
    
    // Click Import Configuration button
    await page.click('button:has-text("Import Configuration")');
    
    // Wait for success message
    await page.waitForSelector('.bg-green-50:has-text("successfully")', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    const screenshot2 = await takeScreenshot('config-imported', 'Configuration imported successfully');
    
    addTestStep(12, 'Import Race Configuration', 'passed', { 
      screenshots: [screenshot1, screenshot2],
      configSize: JSON.stringify(exportedConfig).length
    });
  } catch (error) {
    addTestStep(12, 'Import Race Configuration', 'failed', { error: error.message });
    throw error;
  }
}

async function step13_verifyImportedRace() {
  console.log('\n✅ Step 13: Verify Imported Race Data');
  try {
    // Wait for modal to close and navigate to race overview
    await page.waitForTimeout(3000);
    
    // Check if we're on race overview page
    const isOnOverview = await page.$('h1:has-text("Overview")');
    if (!isOnOverview) {
      // Navigate to race overview
      await page.click('button:has-text("Race Maintenance")');
      await page.waitForTimeout(1000);
    }
    
    // Verify race name
    const raceName = await page.$eval('h1', el => el.textContent);
    
    // Verify runner count
    const runnerCountText = await page.$eval('.card:has-text("Total Runners") .text-2xl', el => el.textContent);
    
    // Verify checkpoints
    const checkpointButtons = await page.$$('button:has-text("Checkpoint")');
    
    const screenshot = await takeScreenshot('imported-race-verified', 'Imported race data verified');
    
    const verificationResults = {
      raceName: raceName.includes('E2E Test Race Complete'),
      runnerCount: runnerCountText === '101',
      checkpointsPresent: checkpointButtons.length > 0
    };
    
    const allVerified = Object.values(verificationResults).every(v => v === true);
    
    addTestStep(13, 'Verify Imported Race Data', allVerified ? 'passed' : 'failed', { 
      screenshot,
      verification: verificationResults,
      details: {
        raceName,
        runnerCount: runnerCountText,
        checkpointCount: checkpointButtons.length
      }
    });
  } catch (error) {
    addTestStep(13, 'Verify Imported Race Data', 'failed', { error: error.message });
    throw error;
  }
}

async function step14_testImportedRaceFunctionality() {
  console.log('\n🧪 Step 14: Test Imported Race Functionality');
  try {
    // Test checkpoint navigation
    await page.click('button:has-text("Checkpoint 1")');
    await page.waitForSelector('h1:has-text("Checkpoint")', { timeout: 5000 });
    
    const screenshot1 = await takeScreenshot('checkpoint-accessible', 'Checkpoint page accessible');
    
    // Go back to overview
    await page.click('button:has-text("Back")');
    await page.waitForTimeout(1000);
    
    // Test base station navigation
    await page.click('button:has-text("Go to Basestation")');
    await page.waitForSelector('h1:has-text("Base Station")', { timeout: 5000 });
    
    const screenshot2 = await takeScreenshot('basestation-accessible', 'Base Station page accessible');
    
    addTestStep(14, 'Test Imported Race Functionality', 'passed', { 
      screenshots: [screenshot1, screenshot2],
      functionalityTested: ['Checkpoint Navigation', 'Base Station Navigation']
    });
  } catch (error) {
    addTestStep(14, 'Test Imported Race Functionality', 'failed', { error: error.message });
    throw error;
  }
}

// Main test execution
async function runCompleteE2ETest() {
  const startTime = Date.now();
  
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  E2E Test: Complete Race Setup → Export → Delete → Import     ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  try {
    await step1_launchBrowser();
    await step2_navigateToRaceMaintenance();
    await step3_fillRaceDetails();
    await step4_configureRunners();
    await step5_createRace();
    await step6_openImportExportModal();
    await step7_exportConfiguration();
    await step8_closeExportModal();
    await step9_openSettingsModal();
    await step10_clearDatabase();
    await step11_openImportModal();
    await step12_importConfiguration();
    await step13_verifyImportedRace();
    await step14_testImportedRaceFunctionality();
    
    console.log('\n✅ All test steps completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    const endTime = Date.now();
    testResults.summary.duration = endTime - startTime;
    
    // Save test results
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(testResults, null, 2));
    console.log(`\n📊 Test results saved to: ${RESULTS_FILE}`);
    
    // Print summary
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                        TEST SUMMARY                            ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log(`Total Steps: ${testResults.summary.total}`);
    console.log(`Passed: ${testResults.summary.passed} ✅`);
    console.log(`Failed: ${testResults.summary.failed} ❌`);
    console.log(`Duration: ${(testResults.summary.duration / 1000).toFixed(2)}s`);
    console.log(`Coverage: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);
    
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
runCompleteE2ETest().catch(console.error);
