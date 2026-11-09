/**
 * WICEN2 Missing, Out List and Tally (WICEN2_PARITY.md Phase 2).
 * Seeded race: 60 runners (100–159); base has CP1 100–119 and 11 at CP2;
 * 145 is DNF at CP2 (recorded by the checkpoint).
 */
import { test, expect } from './fixtures.js';
import { seedRace } from '../../../scripts/ui-validation/seed.mjs';

const BASE = 'http://localhost:3000';

test.describe('WICEN2 Missing, Out List and Tally', () => {
  test('base lists who is missing at a checkpoint and who is out', async ({ page, step }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 1112, height: 834 });
    await seedRace(page, BASE, { withBaseData: true });
    await page.goto(`${BASE}/base-station/operations`);
    await expect(page.getByRole('heading', { name: /who's calling/i })).toBeVisible({ timeout: 15000 });

    await step('The board shows how many are still to come at each checkpoint', async () => {
      await expect(page.getByTestId('board-text-CP1')).toContainText('40 to come');
      await expect(page.getByTestId('board-text-CP2')).toContainText('49 to come');
      await expect(page.getByTestId('board-text-CP3')).toContainText('59 to come');
    });

    await step('Alt+G with CP2 open — Missing at CP2, every bib on its own row', async () => {
      await page.keyboard.type('2');
      await page.keyboard.press('Enter');
      await expect(page.getByRole('heading', { name: 'CP2', exact: true })).toBeVisible();
      await page.keyboard.press('Alt+G');
      await expect(page.getByRole('heading', { name: 'Missing at a checkpoint' })).toBeVisible();
      await expect(page.getByRole('group', { name: 'Checkpoint' }).getByRole('button', { name: 'CP2' })).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByTestId('missing-row')).toHaveCount(49);
      await expect(page.getByTestId('missing-total')).toHaveText('49 missing at CP2');
      await expect(page.getByTestId('missing-row').first()).toContainText('110');
      await expect(page.getByTestId('missing-row').first()).toContainText('CP1');
    });

    await step('Print view — race, checkpoint and the time printed', async () => {
      await page.emulateMedia({ media: 'print' });
      await expect(page.getByTestId('print-line')).toBeVisible();
      await expect(page.getByTestId('print-line')).toContainText('Mt Glorious Mountain Trails · CP2 · Printed');
      await page.emulateMedia({ media: 'screen' });
    });

    await step('Alt+S — Out of the race matches the DNF / DNS tab', async () => {
      await page.keyboard.press('Alt+S');
      await expect(page.getByRole('heading', { name: 'Out of the race' })).toBeVisible();
      const reportRows = await page.getByTestId('out-report-row').count();
      await expect(page.getByTestId('out-report-row').filter({ hasText: '145' })).toContainText('CP2');
      await page.getByRole('tab', { name: /DNF/ }).click();
      await expect(page.getByTestId('out-row')).toHaveCount(reportRows);
    });

    await step('A DNF at CP2 lowers "to come" at CP3 and Finish only', async () => {
      await page.getByRole('tab', { name: 'Overview' }).click();
      await expect(page.getByTestId('tally-CP2')).toContainText('49 to come');
      await expect(page.getByTestId('tally-CP3')).toContainText('59 to come');
      await page.keyboard.press('Alt+W');
      await page.keyboard.type('130 CP2');
      await expect(page.getByTestId('quickwd-preview')).toContainText('DNF 130 · CP2');
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('tally-CP3')).toContainText('58 to come');
      await expect(page.getByTestId('tally-Finish')).toContainText('58 to come');
      await expect(page.getByTestId('tally-CP2')).toContainText('49 to come');
      await expect(page.getByTestId('tally-CP1')).toContainText('40 to come');
    });
  });
});
