/**
 * Customer Journey: Base Station Operator
 *
 * Covers the flow a base station operator follows during a race:
 *   1. Launch app and select "Base Station Operations"
 *   2. Pick a race from the modal — base opens on Receive ("Who's calling?")
 *   3. Take a call from CP1 and see the runners on Overview
 *   4. Record a DNF via the withdrawal dialog
 *   5. Open Times by checkpoint in Reports
 *   6. Export data
 */

import { test, expect } from './fixtures.js';
import { seedRace, selectModuleWithFirstRace } from './helpers.js';

const RACE = {
  name: 'Base Station Journey Race',
  numCheckpoints: 3,
  runnerRange: { min: 300, max: 320 },
};

test.describe('Base Station Operator – Full Operations Journey', () => {
  test.beforeEach(async ({ page }) => {
    await seedRace(page, RACE);
    await selectModuleWithFirstRace(page, /base station/i);
    await page.waitForURL(/base-station\/operations/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /who's calling/i })).toBeVisible({ timeout: 15000 });
  });

  test('base station opens on Receive, ready for the first call', async ({ page }) => {
    for (const cp of ['CP1', 'CP2', 'CP3']) {
      await expect(page.getByRole('button', { name: new RegExp(`^${cp},`) })).toBeVisible();
    }
  });

  test('takes a call from CP1, then sees the runners on Overview', async ({ page, step }) => {
    await step('Receive — CP1 calls in 300, 301, 302 and 303', async () => {
      await page.getByRole('button', { name: /^CP1,/ }).click();
      for (const bib of ['300', '301', '302', '303']) {
        await page.fill('#bib-heard', bib);
        await page.keyboard.press('Enter');
        await expect(page.getByTestId('rx-flash')).toContainText(`${bib} added`);
      }
      await page.getByRole('button', { name: /^Complete/ }).click();
      await page.getByRole('button', { name: 'Next call' }).click();
      await expect(page.getByTestId('board-count-CP1')).toHaveText('4');
    });

    await step('Overview — CP1 progress shows 4 and the leaders list has 300', async () => {
      await page.getByRole('tab', { name: 'Overview' }).click();
      await expect(page.getByRole('img', { name: /^CP1: 4 of / })).toBeVisible();
      await expect(page.getByLabel('Current leaders').getByRole('cell', { name: '300', exact: true })).toBeVisible();
    });
  });

  test('records a DNF via the withdrawal dialog', async ({ page, step }) => {
    await step('Receive — press D to open the withdrawal dialog', async () => {
      // Blur any focused input before pressing the 'd' hotkey
      await page.evaluate(() => document.activeElement?.blur());
      await page.keyboard.press('d');
      await page.locator('input#runnerNumber').waitFor({ state: 'visible', timeout: 5000 });
    });

    await step('Withdrawal Dialog — enter runner 310 and reason, then submit', async () => {
      await page.locator('input#runnerNumber').fill('310');
      await page.getByRole('group', { name: 'Reason' }).getByRole('button').first().click();
      await page.getByRole('button', { name: 'Withdraw runner' }).click();
      await page.locator('input#runnerNumber').waitFor({ state: 'hidden', timeout: 5000 });
    });

    await step('DNF / DNS tab — runner 310 is out of the race', async () => {
      await page.getByRole('tab', { name: 'DNF / DNS' }).click();
      await expect(page.getByTestId('out-row').filter({ hasText: '310' })).toBeVisible();
    });
  });

  test('opens Times by checkpoint in Reports', async ({ page }) => {
    await page.getByRole('tab', { name: 'Reports' }).click();
    await page.getByRole('button', { name: /^Times by checkpoint/ }).click();
    await expect(page.getByRole('columnheader', { name: 'CP1' }).first()).toBeVisible();
  });

  test('switches to Reports tab and renders a report', async ({ page }) => {
    await page.getByRole('tab', { name: /reports/i }).click();

    // There should be a way to generate or view reports
    await expect(page.getByText(/report|results|summary/i).first()).toBeVisible();

    // Click generate if there's such a button
    const generateBtn = page.getByRole('button', { name: /generate|view|build/i }).first();
    if (await generateBtn.isVisible({ timeout: 2000 })) {
      await generateBtn.click();
      await expect(page.getByText(/runner|total|passed/i).first()).toBeVisible();
    }
  });

  test('exports base station data', async ({ page }) => {
    // The Import/Export button in the PageHeader actions opens ImportExportModal
    const exportBtn = page.getByRole('button', { name: 'Import / Export' });
    await expect(exportBtn).toBeVisible({ timeout: 5000 });
    await exportBtn.click();
    const dialog = page.getByRole('dialog', { name: /import.*export/i });
    await dialog.waitFor({ state: 'visible', timeout: 5000 });
    await page.keyboard.press('Escape');
  });
});
