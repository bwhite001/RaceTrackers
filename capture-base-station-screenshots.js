/**
 * Screenshot Capture Script for Base Station User Guide
 * 
 * This script captures screenshots for all user stories and workflows
 * in the Base Station Operations module.
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure screenshots directory exists
const screenshotsDir = path.join(__dirname, 'screenshots', 'base-station-guide');
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Click a button containing specific text
 */
async function clickButtonByText(page, text) {
    await page.evaluate((buttonText) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const button = buttons.find(btn => btn.textContent.includes(buttonText));
        if (button) {
            button.click();
            return true;
        }
        return false;
    }, text);
}

/**
 * Execute a single action on the page
 */
async function executeAction(page, action) {
    switch (action.type) {
        case 'wait':
            if (action.selector) {
                // Wait for element to be visible
                await page.waitForSelector(action.selector, { visible: true, timeout: 5000 });
            } else if (action.duration) {
                // Simple delay
                await delay(action.duration);
            }
            break;

        case 'click':
            if (action.selector.includes(':contains(')) {
                // Handle text-based button selection
                const text = action.selector.match(/contains\("([^"]+)"\)/)[1];
                await clickButtonByText(page, text);
                await delay(500); // Small delay after click
            } else {
                // Handle regular selector
                await page.waitForSelector(action.selector, { visible: true, timeout: 5000 });
                await page.click(action.selector);
                await delay(500); // Small delay after click
            }
            break;

        case 'scroll':
            if (action.direction === 'down') {
                await page.evaluate(() => {
                    window.scrollBy(0, window.innerHeight);
                });
            } else if (action.direction === 'up') {
                await page.evaluate(() => {
                    window.scrollBy(0, -window.innerHeight);
                });
            }
            await delay(300); // Small delay after scroll
            break;

        default:
            console.warn(`Unknown action type: ${action.type}`);
    }
}

const screenshots = [
  {
    name: 'base-station-01-homepage',
    description: 'Homepage with Base Station Operations card',
    url: 'http://localhost:3000',
    actions: []
  },
  {
    name: 'base-station-02-runner-grid-tab',
    description: 'Runner Grid tab - main tracking interface',
    url: 'http://localhost:3000/base-station',
    actions: [
      { type: 'wait', selector: '[data-tab="grid"]' }
    ]
  },
  {
    name: 'base-station-03-data-entry-tab',
    description: 'Data Entry tab with quick actions',
    url: 'http://localhost:3000/base-station',
    actions: [
      { type: 'click', selector: '[data-tab="data-entry"]' },
      { type: 'wait', duration: 500 }
    ]
  },
  {
    name: 'base-station-04-withdrawal-dialog',
    description: 'Withdrawal Dialog for marking runners as withdrawn',
    url: 'http://localhost:3000/base-station',
    actions: [
      { type: 'click', selector: '[data-tab="data-entry"]' },
      { type: 'click', selector: 'button:contains("Withdraw Runner")' },
      { type: 'wait', duration: 500 }
    ]
  },
  {
    name: 'base-station-05-vet-out-dialog',
    description: 'Vet-Out Dialog for marking runners as vetted out',
    url: 'http://localhost:3000/base-station',
    actions: [
      { type: 'click', selector: '[data-tab="data-entry"]' },
      { type: 'click', selector: 'button:contains("Vet Out Runner")' },
      { type: 'wait', duration: 500 }
    ]
  },
  {
    name: 'base-station-06-log-operations-tab',
    description: 'Log Operations tab for entry management',
    url: 'http://localhost:3000/base-station',
    actions: [
      { type: 'click', selector: '[data-tab="log-ops"]' },
      { type: 'wait', duration: 500 }
    ]
  },
  {
    name: 'base-station-07-duplicates-dialog',
    description: 'Duplicate Entries Dialog showing side-by-side comparison',
    url: 'http://localhost:3000/base-station',
    actions: [
      { type: 'click', selector: '[data-tab="log-ops"]' },
      { type: 'click', selector: 'button:contains("View Duplicates")' },
      { type: 'wait', duration: 500 }
    ]
  },
  {
    name: 'base-station-08-deleted-entries-view',
    description: 'Deleted Entries View showing audit trail',
    url: 'http://localhost:3000/base-station',
    actions: [
      { type: 'click', selector: '[data-tab="log-ops"]' },
      { type: 'click', selector: 'button:contains("View Deleted")' },
      { type: 'wait', duration: 500 }
    ]
  },
  {
    name: 'base-station-09-lists-reports-tab',
    description: 'Lists & Reports tab with missing numbers',
    url: 'http://localhost:3000/base-station',
    actions: [
      { type: 'click', selector: '[data-tab="lists"]' },
      { type: 'wait', duration: 500 }
    ]
  },
  {
    name: 'base-station-10-missing-numbers-list',
    description: 'Missing Numbers List showing runners not at checkpoint',
    url: 'http://localhost:3000/base-station',
    actions: [
      { type: 'click', selector: '[data-tab="lists"]' },
      { type: 'wait', duration: 500 },
      { type: 'scroll', direction: 'down' }
    ]
  },
  {
    name: 'base-station-11-out-list',
    description: 'Out List showing withdrawn and vetted out runners',
    url: 'http://localhost:3000/base-station',
    actions: [
      { type: 'click', selector: '[data-tab="lists"]' },
      { type: 'click', selector: 'button:contains("Out List")' },
      { type: 'wait', duration: 500 }
    ]
  },
  {
    name: 'base-station-12-reports-panel',
    description: 'Reports Panel with generation and export options',
    url: 'http://localhost:3000/base-station',
    actions: [
      { type: 'click', selector: '[data-tab="lists"]' },
      { type: 'scroll', direction: 'down' },
      { type: 'wait', duration: 500 }
    ]
  },
  {
    name: 'base-station-13-housekeeping-tab',
    description: 'Housekeeping tab with strapper calls and backup',
    url: 'http://localhost:3000/base-station',
    actions: [
      { type: 'click', selector: '[data-tab="housekeeping"]' },
      { type: 'wait', duration: 500 }
    ]
  },
  {
    name: 'base-station-14-strapper-calls-panel',
    description: 'Strapper Calls Panel for resource management',
    url: 'http://localhost:3000/base-station',
    actions: [
      { type: 'click', selector: '[data-tab="housekeeping"]' },
      { type: 'wait', duration: 500 }
    ]
  },
  {
    name: 'base-station-15-backup-dialog',
    description: 'Backup & Restore Dialog',
    url: 'http://localhost:3000/base-station',
    actions: [
      { type: 'click', selector: '[data-tab="housekeeping"]' },
      { type: 'click', selector: 'button:contains("Backup Now")' },
      { type: 'wait', duration: 500 }
    ]
  },
  {
    name: 'base-station-16-help-dialog',
    description: 'Help Dialog with comprehensive documentation',
    url: 'http://localhost:3000/base-station',
    actions: [
      { type: 'click', selector: 'button:contains("Help")' },
      { type: 'wait', duration: 500 }
    ]
  },
  {
    name: 'base-station-17-about-dialog',
    description: 'About Dialog with system information',
    url: 'http://localhost:3000/base-station',
    actions: [
      { type: 'click', selector: '[data-tab="housekeeping"]' },
      { type: 'click', selector: 'button:contains("About")' },
      { type: 'wait', duration: 500 }
    ]
  },
  {
    name: 'base-station-18-overview-tab',
    description: 'Overview tab with status management',
    url: 'http://localhost:3000/base-station',
    actions: [
      { type: 'click', selector: '[data-tab="overview"]' },
      { type: 'wait', duration: 500 }
    ]
  }
];

/**
 * Main function to capture all screenshots
 */
async function captureAllScreenshots() {
    console.log('='.repeat(60));
    console.log('Base Station Screenshot Capture');
    console.log('='.repeat(60));
    console.log(`Total screenshots to capture: ${screenshots.length}`);
    console.log(`Output directory: ${screenshotsDir}`);
    console.log('='.repeat(60));
    console.log('');

    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: { width: 900, height: 600 }
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 900, height: 600 });

    const results = {
        success: [],
        failed: []
    };

    try {
        for (let i = 0; i < screenshots.length; i++) {
            const screenshot = screenshots[i];
            const screenshotNumber = i + 1;
            
            console.log(`[${screenshotNumber}/${screenshots.length}] Capturing: ${screenshot.name}`);
            console.log(`    Description: ${screenshot.description}`);
            console.log(`    URL: ${screenshot.url}`);

            try {
                // Navigate to URL
                await page.goto(screenshot.url, { 
                    waitUntil: 'networkidle0',
                    timeout: 10000 
                });
                await delay(1000); // Wait for page to stabilize

                // Execute all actions
                if (screenshot.actions && screenshot.actions.length > 0) {
                    console.log(`    Executing ${screenshot.actions.length} action(s)...`);
                    for (const action of screenshot.actions) {
                        await executeAction(page, action);
                    }
                }

                // Capture screenshot
                const screenshotPath = path.join(screenshotsDir, `${screenshot.name}.png`);
                await page.screenshot({ path: screenshotPath });
                
                console.log(`    ✓ Screenshot saved: ${screenshot.name}.png`);
                console.log('');
                
                results.success.push(screenshot.name);

            } catch (error) {
                console.error(`    ✗ Error capturing screenshot: ${error.message}`);
                console.log('');
                results.failed.push({
                    name: screenshot.name,
                    error: error.message
                });
            }
        }

    } catch (error) {
        console.error('Fatal error during screenshot capture:', error);
    } finally {
        await browser.close();
    }

    // Print summary
    console.log('='.repeat(60));
    console.log('CAPTURE SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total screenshots: ${screenshots.length}`);
    console.log(`Successful: ${results.success.length}`);
    console.log(`Failed: ${results.failed.length}`);
    console.log('');

    if (results.success.length > 0) {
        console.log('✓ Successfully captured:');
        results.success.forEach(name => console.log(`  - ${name}`));
        console.log('');
    }

    if (results.failed.length > 0) {
        console.log('✗ Failed to capture:');
        results.failed.forEach(item => {
            console.log(`  - ${item.name}`);
            console.log(`    Error: ${item.error}`);
        });
        console.log('');
    }

    console.log(`Screenshots saved to: ${screenshotsDir}`);
    console.log('='.repeat(60));

    // Create a summary file
    const summaryPath = path.join(screenshotsDir, 'CAPTURE_SUMMARY.md');
    const summaryContent = `# Base Station Screenshot Capture Summary

**Date:** ${new Date().toISOString()}

## Statistics
- Total Screenshots: ${screenshots.length}
- Successful: ${results.success.length}
- Failed: ${results.failed.length}

## Screenshots Captured

${screenshots.map((shot, idx) => {
    const status = results.success.includes(shot.name) ? '✓' : '✗';
    return `${idx + 1}. ${status} **${shot.name}**
   - Description: ${shot.description}
   - URL: ${shot.url}`;
}).join('\n\n')}

${results.failed.length > 0 ? `
## Failed Screenshots

${results.failed.map(item => `- **${item.name}**
  - Error: ${item.error}`).join('\n\n')}
` : ''}

## Output Directory
\`${screenshotsDir}\`
`;

    fs.writeFileSync(summaryPath, summaryContent);
    console.log(`Summary report saved to: ${summaryPath}`);
}

// Execute the capture
captureAllScreenshots().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
