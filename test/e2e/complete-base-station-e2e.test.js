/**
 * Complete Base Station E2E Test
 * Tests the entire base station workflow from race setup to final reports
 */

import puppeteer from 'puppeteer';
import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { format } from 'date-fns';

describe('Complete Base Station E2E Workflow', () => {
  let browser;
  let page;
  const BASE_URL = 'http://localhost:5173';

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      slowMo: 50
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  test('complete base station workflow', async () => {
    page = await browser.newPage();

    // Step 1: Create Race
    await test.step('create race', async () => {
      await page.goto(BASE_URL);
      
      // Fill race details
      await page.type('input[name="raceName"]', 'Complete E2E Test Race');
      await page.type('input[name="raceDate"]', format(new Date(), 'yyyy-MM-dd'));
      await page.type('input[name="startTime"]', '06:00');

      // Add checkpoints
      await page.click('button[aria-label="Add Checkpoint"]');
      await page.type('input[name="checkpoints.0.name"]', 'Mile 10');
      await page.type('input[name="checkpoints.0.distance"]', '10');

      await page.click('button[aria-label="Add Checkpoint"]');
      await page.type('input[name="checkpoints.1.name"]', 'Mile 25');
      await page.type('input[name="checkpoints.1.distance"]', '25');

      // Add runner ranges
      await page.click('button[aria-label="Add Runner Range"]');
      await page.type('input[name="runnerRanges.0.start"]', '1');
      await page.type('input[name="runnerRanges.0.end"]', '50');

      // Create race
      await page.click('button[type="submit"]');
      await page.waitForNavigation();
      
      await page.screenshot({ path: 'screenshots/e2e-tests/01-race-created.png' });
    });

    // Step 2: Navigate to Base Station
    await test.step('navigate to base station', async () => {
      await page.click('button[aria-label="Base Station Operations"]');
      await page.waitForSelector('[data-testid="base-station-view"]');
      
      await page.screenshot({ path: 'screenshots/e2e-tests/02-base-station-view.png' });
    });

    // Step 3: Enter First Batch of Runners
    await test.step('enter first batch', async () => {
      // Set time
      const time1 = '07:05:00';
      await page.type('input[id="commonTime"]', time1);

      // Enter runners
      await page.type('textarea[id="runnerInput"]', '1-10');

      // Submit
      await page.click('button[type="submit"]');
      await page.waitForFunction(
        'document.querySelector("textarea[id=\'runnerInput\']").value === ""'
      );

      await page.screenshot({ path: 'screenshots/e2e-tests/03-first-batch-entered.png' });
    });

    // Step 4: Enter Second Batch
    await test.step('enter second batch', async () => {
      const time2 = '07:10:00';
      await page.type('input[id="commonTime"]', time2);
      await page.type('textarea[id="runnerInput"]', '11,12,13-15');
      await page.click('button[type="submit"]');
      await page.waitForFunction(
        'document.querySelector("textarea[id=\'runnerInput\']").value === ""'
      );

      await page.screenshot({ path: 'screenshots/e2e-tests/04-second-batch-entered.png' });
    });

    // Step 5: Mark DNF Runners
    await test.step('mark DNF runners', async () => {
      // Open DNF dialog with keyboard shortcut
      await page.keyboard.press('d');
      await page.waitForSelector('[data-testid="withdrawal-dialog"]');

      // Enter DNF data
      await page.type('textarea[id="runnerInput"]', '16,17,18');
      await page.type('input[id="reason"]', 'Injury - unable to continue');
      await page.click('button[type="submit"]');
      await page.waitForSelector('[data-testid="withdrawal-dialog"]', { hidden: true });

      await page.screenshot({ path: 'screenshots/e2e-tests/05-dnf-marked.png' });
    });

    // Step 6: Mark DNS Runners
    await test.step('mark DNS runners', async () => {
      // Open DNS dialog
      await page.keyboard.down('Shift');
      await page.keyboard.press('d');
      await page.keyboard.up('Shift');
      await page.waitForSelector('[data-testid="withdrawal-dialog"]');

      // Enter DNS data
      await page.type('textarea[id="runnerInput"]', '19,20');
      await page.type('input[id="reason"]', 'Did not start - no show');
      await page.click('button[type="submit"]');
      await page.waitForSelector('[data-testid="withdrawal-dialog"]', { hidden: true });

      await page.screenshot({ path: 'screenshots/e2e-tests/06-dns-marked.png' });
    });

    // Step 7: View Race Overview
    await test.step('view race overview', async () => {
      // Navigate to overview with keyboard
      await page.keyboard.press('o');
      await page.waitForSelector('[data-testid="race-overview"]');

      // Verify stats
      const stats = await page.$$eval(
        '[data-testid="stats-panel"] div',
        divs => ({
          total: parseInt(divs[0].textContent),
          finished: parseInt(divs[1].textContent),
          dnf: parseInt(divs[2].textContent),
          dns: parseInt(divs[3].textContent)
        })
      );

      expect(stats.total).toBe(50);
      expect(stats.finished).toBe(15);
      expect(stats.dnf).toBe(3);
      expect(stats.dns).toBe(2);

      await page.screenshot({ path: 'screenshots/e2e-tests/07-race-overview.png' });
    });

    // Step 8: Generate Quick Reports
    await test.step('generate quick reports', async () => {
      // Navigate to reports
      await page.keyboard.press('r');
      await page.waitForSelector('text/Reports & Exports');

      // Generate missing numbers report
      const buttons = await page.$$('button:has-text("Generate Report")');
      await buttons[0].click();
      await page.waitForSelector('text/Report generated successfully');

      await page.screenshot({ path: 'screenshots/e2e-tests/08-missing-numbers-report.png' });

      // Generate out list
      await buttons[1].click();
      await page.waitForSelector('text/Report generated successfully');

      await page.screenshot({ path: 'screenshots/e2e-tests/09-out-list-report.png' });
    });

    // Step 9: Create Custom Report
    await test.step('create custom report', async () => {
      // Open report builder
      await page.click('button:has-text("Create Custom Report")');
      await page.waitForSelector('text/Create Custom Report');

      // Configure report
      await page.type('input[id="reportName"]', 'Final Race Results');
      await page.select('select[id="template"]', 'detailed');
      await page.click('label:has-text("CSV")');

      // Generate report
      await page.click('button:has-text("Generate Report")');
      await page.waitForSelector('text/Report generated successfully');

      await page.screenshot({ path: 'screenshots/e2e-tests/10-custom-report.png' });
    });

    // Step 10: Test Keyboard Navigation
    await test.step('test keyboard navigation', async () => {
      // Navigate between tabs
      await page.keyboard.press('n'); // Data Entry
      await page.waitForSelector('[data-testid="data-entry"]');

      await page.keyboard.press('o'); // Overview
      await page.waitForSelector('[data-testid="race-overview"]');

      await page.keyboard.press('r'); // Reports
      await page.waitForSelector('text/Reports & Exports');

      await page.screenshot({ path: 'screenshots/e2e-tests/11-keyboard-navigation.png' });
    });

    // Step 11: Test Search and Filtering
    await test.step('test search and filtering', async () => {
      // Navigate to overview
      await page.keyboard.press('o');
      await page.waitForSelector('[data-testid="race-overview"]');

      // Search for specific runner
      await page.type('input[type="search"]', '15');
      await page.waitForFunction(
        'document.querySelectorAll("tbody tr").length === 1'
      );

      await page.screenshot({ path: 'screenshots/e2e-tests/12-search-filtering.png' });

      // Clear search
      await page.click('input[type="search"]');
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Backspace');

      // Filter by status
      await page.select('select[aria-label="Filter by status"]', 'finished');
      await page.waitForFunction(
        'document.querySelectorAll("tbody tr").length === 15'
      );

      await page.screenshot({ path: 'screenshots/e2e-tests/13-status-filtering.png' });
    });

    // Step 12: Test Accessibility
    await test.step('test accessibility', async () => {
      // Check ARIA attributes
      const hasAriaLabels = await page.evaluate(() => {
        const elements = document.querySelectorAll('[role]');
        return Array.from(elements).every(el => 
          el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby')
        );
      });
      expect(hasAriaLabels).toBe(true);

      // Check keyboard focus
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => 
        document.activeElement.getAttribute('aria-label')
      );
      expect(focusedElement).toBeTruthy();

      await page.screenshot({ path: 'screenshots/e2e-tests/14-accessibility-check.png' });
    });

    // Step 13: Test Dark Mode
    await test.step('test dark mode', async () => {
      // Toggle dark mode
      await page.click('button[aria-label="Toggle dark mode"]');
      await page.waitForFunction(
        'document.documentElement.classList.contains("dark")'
      );

      await page.screenshot({ path: 'screenshots/e2e-tests/15-dark-mode.png' });

      // Toggle back to light mode
      await page.click('button[aria-label="Toggle dark mode"]');
      await page.waitForFunction(
        '!document.documentElement.classList.contains("dark")'
      );
    });

    // Step 14: Final State Verification
    await test.step('verify final state', async () => {
      // Navigate to overview
      await page.keyboard.press('o');
      await page.waitForSelector('[data-testid="race-overview"]');

      // Verify final statistics
      const finalStats = await page.$$eval(
        '[data-testid="stats-panel"] div',
        divs => ({
          total: parseInt(divs[0].textContent),
          finished: parseInt(divs[1].textContent),
          active: parseInt(divs[2].textContent),
          dnf: parseInt(divs[3].textContent),
          dns: parseInt(divs[4].textContent)
        })
      );

      expect(finalStats.total).toBe(50);
      expect(finalStats.finished).toBe(15);
      expect(finalStats.active).toBe(30); // 50 - 15 - 3 - 2
      expect(finalStats.dnf).toBe(3);
      expect(finalStats.dns).toBe(2);

      await page.screenshot({ path: 'screenshots/e2e-tests/16-final-state.png' });
    });

    await page.close();
  }, 120000); // 2 minute timeout for complete workflow
});
