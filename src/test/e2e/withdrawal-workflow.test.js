import puppeteer from 'puppeteer';
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { format } from 'date-fns';
import { RUNNER_STATUSES } from '../../types';

describe('Withdrawal Workflow E2E Tests', () => {
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

    // Set up test race
    await test.step('setup test race', async () => {
      // Fill race details
      await page.type('input[name="raceName"]', 'Withdrawal Test Race');
      await page.type('input[name="raceDate"]', format(new Date(), 'yyyy-MM-dd'));
      await page.type('input[name="startTime"]', '06:00');

      // Add checkpoints
      await page.click('button[aria-label="Add Checkpoint"]');
      await page.type('input[name="checkpoints.0.name"]', 'Checkpoint 1');
      await page.type('input[name="checkpoints.0.distance"]', '10');

      // Add runner ranges
      await page.click('button[aria-label="Add Runner Range"]');
      await page.type('input[name="runnerRanges.0.start"]', '1');
      await page.type('input[name="runnerRanges.0.end"]', '20');

      // Create race
      await page.click('button[type="submit"]');
      await page.waitForNavigation();
    });

    // Navigate to base station
    await page.click('button[aria-label="Base Station Operations"]');
    await page.waitForSelector('[data-testid="base-station-view"]');
  });

  test('DNF workflow', async () => {
    // 1. Mark some runners as finished first
    await test.step('mark runners as finished', async () => {
      // Enter batch of finished runners
      await page.type('input[id="commonTime"]', format(new Date(), 'HH:mm:ss'));
      await page.type('textarea[id="runnerInput"]', '1,2,3,4,5');
      await page.click('button[type="submit"]');
      await page.waitForFunction(
        'document.querySelector("textarea[id=\'runnerInput\']").value === ""'
      );
    });

    // 2. Open DNF dialog with keyboard shortcut
    await test.step('open DNF dialog', async () => {
      await page.keyboard.press('d');
      await page.waitForSelector('[data-testid="withdrawal-dialog"]');
    });

    // 3. Enter DNF runners and reason
    await test.step('enter DNF data', async () => {
      await page.type('textarea[id="runnerInput"]', '6,7,8');
      await page.type('input[id="reason"]', 'Test DNF reason');
      await page.click('button[type="submit"]');
      await page.waitForSelector('[data-testid="withdrawal-dialog"]', { hidden: true });
    });

    // 4. Verify in overview
    await test.step('verify DNF in overview', async () => {
      await page.click('button[aria-label="Race Overview"]');
      
      // Check status badges
      const dnfBadges = await page.$$eval(
        'td span[class*="bg-red"]',
        badges => badges.length
      );
      expect(dnfBadges).toBe(3); // Three runners marked as DNF
    });
  });

  test('DNS workflow', async () => {
    // 1. Open DNS dialog with keyboard shortcut
    await test.step('open DNS dialog', async () => {
      await page.keyboard.down('Shift');
      await page.keyboard.press('d');
      await page.keyboard.up('Shift');
      await page.waitForSelector('[data-testid="withdrawal-dialog"]');
    });

    // 2. Enter DNS runners and reason
    await test.step('enter DNS data', async () => {
      await page.type('textarea[id="runnerInput"]', '15,16,17');
      await page.type('input[id="reason"]', 'Test DNS reason');
      await page.click('button[type="submit"]');
      await page.waitForSelector('[data-testid="withdrawal-dialog"]', { hidden: true });
    });

    // 3. Verify in overview
    await test.step('verify DNS in overview', async () => {
      await page.click('button[aria-label="Race Overview"]');
      
      // Check status badges
      const dnsBadges = await page.$$eval(
        'td span[class*="bg-yellow"]',
        badges => badges.length
      );
      expect(dnsBadges).toBe(3); // Three runners marked as DNS
    });
  });

  test('validation and error handling', async () => {
    // 1. Open DNF dialog
    await test.step('open DNF dialog', async () => {
      await page.keyboard.press('d');
      await page.waitForSelector('[data-testid="withdrawal-dialog"]');
    });

    // 2. Test empty submission
    await test.step('test empty submission', async () => {
      await page.click('button[type="submit"]');
      await page.waitForSelector('text/At least one valid runner number is required');
      await page.waitForSelector('text/DNF reason is required');
    });

    // 3. Test invalid runner numbers
    await test.step('test invalid numbers', async () => {
      await page.type('textarea[id="runnerInput"]', 'abc,123');
      await page.type('input[id="reason"]', 'Test reason');
      await page.click('button[type="submit"]');
      await page.waitForSelector('text/Invalid runner number format');
    });

    // 4. Test already withdrawn runners
    await test.step('test duplicate withdrawal', async () => {
      // First withdrawal
      await page.type('textarea[id="runnerInput"]', '18,19,20');
      await page.type('input[id="reason"]', 'First withdrawal');
      await page.click('button[type="submit"]');
      await page.waitForSelector('[data-testid="withdrawal-dialog"]', { hidden: true });

      // Try to withdraw same runners
      await page.keyboard.press('d');
      await page.waitForSelector('[data-testid="withdrawal-dialog"]');
      await page.type('textarea[id="runnerInput"]', '18,19,20');
      await page.type('input[id="reason"]', 'Second withdrawal');
      await page.click('button[type="submit"]');
      await page.waitForSelector('text/Runners already withdrawn');
    });
  });

  test('keyboard navigation', async () => {
    // 1. Open dialog with keyboard
    await test.step('keyboard open', async () => {
      await page.keyboard.press('d');
      await page.waitForSelector('[data-testid="withdrawal-dialog"]');
    });

    // 2. Test tab navigation
    await test.step('tab navigation', async () => {
      await page.keyboard.press('Tab');
      const activeElement = await page.evaluate(() => document.activeElement.id);
      expect(activeElement).toBe('runnerInput');

      // Tab to reason field
      await page.keyboard.press('Tab');
      const nextElement = await page.evaluate(() => document.activeElement.id);
      expect(nextElement).toBe('reason');
    });

    // 3. Close with escape
    await test.step('escape to close', async () => {
      await page.keyboard.press('Escape');
      await page.waitForSelector('[data-testid="withdrawal-dialog"]', { hidden: true });
    });
  });

  test('accessibility', async () => {
    // 1. Check dialog accessibility
    await test.step('dialog accessibility', async () => {
      await page.keyboard.press('d');
      await page.waitForSelector('[data-testid="withdrawal-dialog"]');

      // Check ARIA attributes
      const dialogRole = await page.$eval('[data-testid="withdrawal-dialog"]', 
        el => el.getAttribute('role')
      );
      expect(dialogRole).toBe('dialog');

      const dialogLabel = await page.$eval('[data-testid="withdrawal-dialog"]', 
        el => el.getAttribute('aria-labelledby')
      );
      expect(dialogLabel).toBeTruthy();
    });

    // 2. Check form field labels
    await test.step('form accessibility', async () => {
      const runnerLabel = await page.$eval('label[for="runnerInput"]', 
        el => el.textContent
      );
      expect(runnerLabel).toContain('Runner Numbers');

      const reasonLabel = await page.$eval('label[for="reason"]', 
        el => el.textContent
      );
      expect(reasonLabel).toContain('Reason');
    });

    // 3. Check button accessibility
    await test.step('button accessibility', async () => {
      const submitButton = await page.$eval('button[type="submit"]', 
        el => ({
          type: el.getAttribute('type'),
          disabled: el.hasAttribute('disabled')
        })
      );
      expect(submitButton.type).toBe('submit');
      expect(submitButton.disabled).toBe(false);
    });
  });
});
