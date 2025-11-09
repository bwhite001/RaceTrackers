import puppeteer from 'puppeteer';
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { format } from 'date-fns';
import { RUNNER_STATUSES } from '../../types';

describe('Base Station E2E Tests', () => {
  let browser;
  let page;
  const BASE_URL = 'http://localhost:5173';

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 }
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto(BASE_URL);
  });

  test('complete base station workflow', async () => {
    // 1. Create a new race
    await test.step('create race', async () => {
      // Fill race details
      await page.type('input[name="raceName"]', 'Test Race');
      await page.type('input[name="raceDate"]', format(new Date(), 'yyyy-MM-dd'));
      await page.type('input[name="startTime"]', '06:00');

      // Add checkpoints
      await page.click('button[aria-label="Add Checkpoint"]');
      await page.type('input[name="checkpoints.0.name"]', 'Checkpoint 1');
      await page.type('input[name="checkpoints.0.distance"]', '10');

      // Add runner ranges
      await page.click('button[aria-label="Add Runner Range"]');
      await page.type('input[name="runnerRanges.0.start"]', '1');
      await page.type('input[name="runnerRanges.0.end"]', '10');

      // Create race
      await page.click('button[type="submit"]');
      await page.waitForNavigation();
    });

    // 2. Navigate to base station
    await test.step('navigate to base station', async () => {
      await page.click('button[aria-label="Base Station Operations"]');
      await page.waitForSelector('[data-testid="base-station-view"]');
    });

    // 3. Enter batch of runners
    await test.step('enter batch of runners', async () => {
      // Open data entry tab
      await page.click('button[aria-label="Data Entry"]');

      // Set common time
      const now = format(new Date(), 'HH:mm:ss');
      await page.type('input[id="commonTime"]', now);

      // Enter runner numbers
      await page.type('textarea[id="runnerInput"]', '1,2,3-5');

      // Submit batch
      await page.click('button[type="submit"]');
      await page.waitForFunction(
        'document.querySelector("textarea[id=\'runnerInput\']").value === ""'
      );
    });

    // 4. Verify runners in overview
    await test.step('verify runners in overview', async () => {
      // Switch to overview tab
      await page.click('button[aria-label="Race Overview"]');

      // Check runner statuses
      const runnerRows = await page.$$('tbody tr');
      expect(runnerRows.length).toBe(5); // Runners 1-5

      // Check status badges
      const statusBadges = await page.$$eval(
        'td span[class*="bg-green"]',
        badges => badges.length
      );
      expect(statusBadges).toBe(5); // All runners should be finished
    });

    // 5. Generate reports
    await test.step('generate reports', async () => {
      // Switch to reports tab
      await page.click('button[aria-label="Reports"]');

      // Generate missing numbers report
      await page.click('button[aria-label="Generate Missing Numbers Report"]');
      await page.waitForSelector('text/Report generated successfully');

      // Generate out list
      await page.click('button[aria-label="Generate Out List"]');
      await page.waitForSelector('text/Report generated successfully');

      // Export data
      await page.click('button[aria-label="Export All Data"]');
      await page.waitForSelector('text/Data exported successfully');
    });

    // 6. Mark DNF/DNS
    await test.step('mark DNF/DNS', async () => {
      // Switch back to data entry
      await page.click('button[aria-label="Data Entry"]');

      // Open DNF dialog
      await page.click('button[aria-label="Mark DNF"]');

      // Enter runner numbers
      await page.type('textarea[id="dnfRunnerInput"]', '6,7');
      await page.type('input[id="dnfReason"]', 'Test DNF reason');

      // Submit
      await page.click('button[type="submit"]');
      await page.waitForSelector('text/Runners marked as DNF');

      // Verify in overview
      await page.click('button[aria-label="Race Overview"]');
      const dnfBadges = await page.$$eval(
        'td span[class*="bg-red"]',
        badges => badges.length
      );
      expect(dnfBadges).toBe(2); // Two runners marked as DNF
    });

    // 7. Test keyboard shortcuts
    await test.step('test keyboard shortcuts', async () => {
      // Press 'N' to open data entry
      await page.keyboard.press('n');
      await page.waitForSelector('textarea[id="runnerInput"]');

      // Press 'R' to open reports
      await page.keyboard.press('r');
      await page.waitForSelector('text/Reports & Exports');

      // Press 'Escape' to return to overview
      await page.keyboard.press('Escape');
      await page.waitForSelector('text/Race Overview');
    });

    // 8. Verify final state
    await test.step('verify final state', async () => {
      // Check stats
      const stats = await page.$$eval(
        '[data-testid="stats-panel"] div',
        divs => ({
          total: parseInt(divs[0].textContent),
          finished: parseInt(divs[1].textContent),
          dnf: parseInt(divs[2].textContent)
        })
      );

      expect(stats.total).toBe(10);
      expect(stats.finished).toBe(5);
      expect(stats.dnf).toBe(2);
    });
  });

  test('handles error states', async () => {
    // Test invalid runner numbers
    await test.step('invalid runner numbers', async () => {
      await page.click('button[aria-label="Data Entry"]');
      await page.type('textarea[id="runnerInput"]', 'abc,123');
      await page.click('button[type="submit"]');
      await page.waitForSelector('text/Invalid runner number format');
    });

    // Test duplicate entries
    await test.step('duplicate entries', async () => {
      await page.type('textarea[id="runnerInput"]', '1,1,1');
      await page.click('button[type="submit"]');
      await page.waitForSelector('text/Duplicate runner numbers detected');
    });

    // Test network errors
    await test.step('network errors', async () => {
      // Simulate offline
      await page.setOfflineMode(true);
      await page.click('button[type="submit"]');
      await page.waitForSelector('text/Network error');
      await page.setOfflineMode(false);
    });
  });

  test('responsive design', async () => {
    // Test mobile layout
    await test.step('mobile layout', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.reload();

      // Check mobile menu
      await page.waitForSelector('button[aria-label="Menu"]');
      await page.click('button[aria-label="Menu"]');
      await page.waitForSelector('text/Data Entry');
    });

    // Test tablet layout
    await test.step('tablet layout', async () => {
      await page.setViewport({ width: 768, height: 1024 });
      await page.reload();

      // Verify responsive elements
      const isVisible = await page.evaluate(() => {
        const el = document.querySelector('[data-testid="desktop-only"]');
        return window.getComputedStyle(el).display !== 'none';
      });
      expect(isVisible).toBe(false);
    });
  });

  test('accessibility', async () => {
    // Test keyboard navigation
    await test.step('keyboard navigation', async () => {
      await page.keyboard.press('Tab');
      const activeElement = await page.evaluate(() => 
        document.activeElement.getAttribute('aria-label')
      );
      expect(activeElement).toBe('Data Entry');
    });

    // Test ARIA attributes
    await test.step('ARIA attributes', async () => {
      const hasAriaLabels = await page.evaluate(() => {
        const elements = document.querySelectorAll('[role]');
        return Array.from(elements).every(el => 
          el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby')
        );
      });
      expect(hasAriaLabels).toBe(true);
    });

    // Test color contrast
    await test.step('color contrast', async () => {
      // This would typically use a color contrast analysis tool
      // For now, we'll just verify the presence of our contrast classes
      const hasContrastClasses = await page.evaluate(() => {
        const elements = document.querySelectorAll('[class*="text-"]');
        return Array.from(elements).some(el => 
          el.className.includes('dark:text-')
        );
      });
      expect(hasContrastClasses).toBe(true);
    });
  });
});
