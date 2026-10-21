/**
 * Race-day fixes Parts C and D — housekeeping checks.
 */
import { test, expect } from './fixtures.js';
import { seedRace } from '../../../scripts/ui-validation/seed.mjs';

const BASE = 'http://localhost:3000';

test.describe('Housekeeping', () => {
  test('no vet-out wording', async ({ page, step }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await seedRace(page, BASE, { withBaseData: true });
    await page.goto(`${BASE}/base-station/operations`);
    await expect(page.getByRole('heading', { name: /who's calling/i })).toBeVisible({ timeout: 15000 });
    const noVet = async (loc) => expect(await loc.innerText()).not.toMatch(/\bvet/i);

    await step('DNF / DNS tab and the out list — no "vet"', async () => {
      await page.getByRole('tab', { name: 'DNF / DNS' }).click();
      await expect(page.getByRole('button', { name: 'Withdraw runner with comments…' })).toBeVisible();
      await noVet(page.locator('[data-screenshot-target]').first());
      await expect(page.getByRole('button', { name: 'Clear DNF for 145' })).toHaveAttribute('title', 'Recorded at a checkpoint — clear it there');
    });

    await step('Withdrawal sheet with Medical chosen — still just "Comments"', async () => {
      await page.getByRole('button', { name: 'Withdraw runner with comments…' }).click();
      const dialog = page.getByRole('dialog', { name: 'Withdraw runner' });
      await dialog.getByRole('group', { name: 'Reason' }).getByRole('button', { name: 'Medical' }).click();
      await expect(dialog.getByText('Comments', { exact: true })).toBeVisible();
      await noVet(dialog);
    });
  });
});
