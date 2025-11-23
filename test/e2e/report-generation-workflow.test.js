import puppeteer from 'puppeteer';
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { format } from 'date-fns';
import { REPORT_TYPES, REPORT_FORMATS } from '../../src/utils/reportUtils';

describe('Report Generation E2E Tests', () => {
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
      await page.type('input[name="raceName"]', 'Report Test Race');
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

    // Navigate to reports tab
    await page.keyboard.press('r');
    await page.waitForSelector('text/Reports & Exports');
  });

  test('quick report generation', async () => {
    // 1. Generate missing numbers report
    await test.step('generate missing numbers report', async () => {
      const buttons = await page.$$('button:has-text("Generate Report")');
      await buttons[0].click(); // First report is Missing Numbers
      await page.waitForSelector('text/Report generated successfully');
    });

    // 2. Generate out list
    await test.step('generate out list', async () => {
      const buttons = await page.$$('button:has-text("Generate Report")');
      await buttons[1].click(); // Second report is Out List
      await page.waitForSelector('text/Report generated successfully');
    });

    // 3. Generate checkpoint log
    await test.step('generate checkpoint log', async () => {
      const buttons = await page.$$('button:has-text("Generate Report")');
      await buttons[2].click(); // Third report is Checkpoint Log
      await page.waitForSelector('text/Report generated successfully');
    });
  });

  test('custom report builder workflow', async () => {
    // 1. Open report builder
    await test.step('open report builder', async () => {
      await page.click('button:has-text("Create Custom Report")');
      await page.waitForSelector('text/Create Custom Report');
    });

    // 2. Fill report configuration
    await test.step('fill report configuration', async () => {
      // Enter report name
      await page.type('input[id="reportName"]', 'Test Custom Report');

      // Select template
      await page.select('select[id="template"]', 'basic');

      // Select additional columns
      await page.click('text/Notes');

      // Select format
      await page.click('label:has-text("JSON")');
    });

    // 3. Generate report
    await test.step('generate report', async () => {
      await page.click('button:has-text("Generate Report")');
      await page.waitForSelector('text/Report generated successfully');
    });
  });

  test('validation and error handling', async () => {
    // 1. Open report builder
    await test.step('open report builder', async () => {
      await page.click('button:has-text("Create Custom Report")');
      await page.waitForSelector('text/Create Custom Report');
    });

    // 2. Test empty submission
    await test.step('test empty submission', async () => {
      await page.click('button:has-text("Generate Report")');
      await page.waitForSelector('text/Report name is required');
      await page.waitForSelector('text/At least one column must be selected');
    });

    // 3. Test invalid format
    await test.step('test invalid format', async () => {
      // Enter name but leave format invalid
      await page.type('input[id="reportName"]', 'Test Report');
      await page.click('button:has-text("Generate Report")');
      await page.waitForSelector('text/Invalid report format');
    });
  });

  test('keyboard navigation', async () => {
    // 1. Open report builder with keyboard
    await test.step('keyboard open', async () => {
      await page.keyboard.press('c');
      await page.waitForSelector('text/Create Custom Report');
    });

    // 2. Test tab navigation
    await test.step('tab navigation', async () => {
      await page.keyboard.press('Tab');
      const activeElement = await page.evaluate(() => document.activeElement.id);
      expect(activeElement).toBe('reportName');

      // Tab to template select
      await page.keyboard.press('Tab');
      const nextElement = await page.evaluate(() => document.activeElement.id);
      expect(nextElement).toBe('template');
    });

    // 3. Close with escape
    await test.step('escape to close', async () => {
      await page.keyboard.press('Escape');
      await page.waitForSelector('text/Create Custom Report', { hidden: true });
    });
  });

  test('accessibility', async () => {
    // 1. Check quick reports accessibility
    await test.step('quick reports accessibility', async () => {
      const headings = await page.$$('h3');
      expect(headings.length).toBeGreaterThan(0);

      const buttons = await page.$$('button[aria-label]');
      expect(buttons.length).toBeGreaterThan(0);
    });

    // 2. Check report builder accessibility
    await test.step('report builder accessibility', async () => {
      await page.click('button:has-text("Create Custom Report")');

      // Check dialog attributes
      const dialog = await page.$('[role="dialog"]');
      expect(await dialog.evaluate(el => el.getAttribute('aria-labelledby'))).toBeTruthy();

      // Check form labels
      const labels = await page.$$('label[for]');
      expect(labels.length).toBeGreaterThan(0);
    });

    // 3. Check focus management
    await test.step('focus management', async () => {
      // Focus should be on first input
      const activeElement = await page.evaluate(() => document.activeElement.id);
      expect(activeElement).toBe('reportName');

      // Close dialog
      await page.keyboard.press('Escape');

      // Focus should return to trigger button
      const focusedButton = await page.evaluate(() => 
        document.activeElement.textContent.includes('Create Custom Report')
      );
      expect(focusedButton).toBe(true);
    });
  });
});
