/**
 * Bottom sheets (VK BottomSheet): the cursor stays where the operator put it
 * while the screen re-renders on its clock, and a tall sheet scrolls instead of
 * losing its title.
 */
import { test, expect } from './fixtures.js';
import { seedRace } from '../../../scripts/ui-validation/seed.mjs';

const BASE = 'http://localhost:3000';

test.describe('Bottom sheets', () => {
  test('withdrawal comment never changes the runner number', async ({ page, step }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.clock.install();
    await seedRace(page, BASE);
    await page.goto(`${BASE}/base-station/operations`);
    await expect(page.getByRole('heading', { name: /who's calling/i })).toBeVisible({ timeout: 15000 });

    await step('Withdraw runner — type 12, then a comment across a screen refresh', async () => {
      await page.evaluate(() => document.activeElement?.blur());
      await page.keyboard.press('d');
      await page.locator('input#runnerNumber').fill('12');
      await page.locator('#comments').click();
      await page.keyboard.type('fell at');
      // Base re-renders every 15 s; jump past one refresh mid-comment
      await page.clock.fastForward(16000);
      await page.keyboard.type(' the 3 km mark');
      await expect(page.locator('input#runnerNumber')).toHaveValue('12');
      await expect(page.locator('#comments')).toHaveValue('fell at the 3 km mark');
    });
  });
});
