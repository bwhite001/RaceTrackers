/**
 * Own time per runner (WICEN2 Auto Time, WICEN2_PARITY.md Phase 3): optional,
 * set per checkpoint in race setup. Base types each runner's time of day or
 * elapsed time, then the number. The seeded race started two hours ago.
 */
import { test, expect } from './fixtures.js';
import { seedRace } from '../../../scripts/ui-validation/seed.mjs';

const BASE = 'http://localhost:3000';
const pad = (n) => String(n).padStart(2, '0');
const clock = (d, sec = false) => `${pad(d.getHours())}:${pad(d.getMinutes())}${sec ? `:${pad(d.getSeconds())}` : ''}`;
const minsAgo = (m) => new Date(Date.now() - m * 60000);

test.describe('Own time per runner', () => {
  test('base records a stopwatch finish, one time per runner', async ({ page, step }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 1112, height: 834 });
    const raceId = await seedRace(page, BASE);
    // The seeded wave starts at the race start, to the minute
    const start = minsAgo(120); start.setSeconds(0, 0);

    await step('Race setup — Own time per runner at the Finish (off by default)', async () => {
      await page.goto(`${BASE}/race-maintenance/edit?raceId=${raceId}`);
      await page.getByRole('button', { name: /Next/ }).click();
      const finish = page.getByRole('checkbox', { name: 'Own time per runner at Finish' });
      await expect(finish).not.toBeChecked();
      await expect(page.getByRole('checkbox', { name: 'Own time per runner at CP1' })).not.toBeChecked();
      await finish.click();
      await expect(finish).toBeChecked();
    });

    await page.goto(`${BASE}/base-station/operations`);
    await expect(page.getByRole('heading', { name: /who's calling/i })).toBeVisible({ timeout: 15000 });
    await page.waitForFunction(() => new Date().getSeconds() < 40, null, { timeout: 35000 });
    const t1 = minsAgo(20); const t2 = minsAgo(19);

    await step('F ⏎ time ⏎ number ⏎ — focus goes back to Time for the next runner', async () => {
      await page.keyboard.type('F');
      await page.keyboard.press('Enter');
      await expect(page.getByRole('heading', { name: 'Finish', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Own times' })).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByRole('group', { name: 'Common time block' }).getByRole('button')).toHaveCount(0);
      await page.keyboard.type(clock(t1).replace(':', ''));
      await page.keyboard.press('Enter');
      await page.keyboard.type('101');
      await page.keyboard.press('Enter');
      await expect(page.locator('#exact-time')).toBeFocused();
      await page.keyboard.type(`${clock(t2).replace(':', '')}30`);
      await page.keyboard.press('Enter');
      await page.keyboard.type('102');
      await page.keyboard.press('Enter');
      const numbers = page.getByTestId('rx-numbers');
      await expect(numbers.getByRole('button', { name: /^Remove 101,/ })).toContainText(clock(t1));
      await expect(numbers.getByRole('button', { name: /^Remove 102,/ })).toContainText(`${clock(t2)}:30`);
    });

    await step('Elapsed time +1:30:15 — counted from the runner\'s wave start', async () => {
      const expected = new Date(start.getTime() + (90 * 60 + 15) * 1000);
      await page.keyboard.type('+1:30:15');
      await page.keyboard.press('Enter');
      await expect(page.locator('#bib-heard')).toBeFocused();
      await page.keyboard.type('103');
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('rx-numbers').getByRole('button', { name: /^Remove 103,/ })).toContainText(`${clock(expected, true)} · 1:30:15`);
      await page.keyboard.press('Alt+U');
      await expect(page.getByRole('status').filter({ hasText: '3 recorded at Finish' })).toBeVisible();
    });

    await step('Times by checkpoint shows the exact finish times, with seconds', async () => {
      const expected = new Date(start.getTime() + (90 * 60 + 15) * 1000);
      await page.getByRole('tab', { name: 'Reports' }).click();
      await page.getByRole('button', { name: /Times by checkpoint/ }).click();
      await expect(page.getByRole('row', { name: /^103 / })).toContainText(clock(expected, true));
      await expect(page.getByRole('row', { name: /^102 / })).toContainText(`${clock(t2)}:30`);
    });

    await step('Own times off for this call — back to 5-minute blocks', async () => {
      await page.getByRole('tab', { name: 'Receive' }).click();
      await page.getByRole('button', { name: 'Next call' }).click();
      await page.getByRole('button', { name: /^Finish,/ }).click();
      await page.getByRole('button', { name: 'Own times' }).click();
      await expect(page.getByRole('button', { name: 'Own times' })).toHaveAttribute('aria-pressed', 'false');
      await expect(page.getByRole('group', { name: 'Common time block' }).getByRole('button').first()).toBeVisible();
    });
  });
});
