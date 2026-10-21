/**
 * Customer Journey: Base station bulk DNF / DNS (VK4WIP redesign, Phase 5)
 *
 *   8. base-bulk-dnf — paste a list, see the warnings, apply, clear one, Undo;
 *      DNS checks a runner already seen at a checkpoint and changes a DNF.
 *   Also: the Overview shows stat tiles, checkpoint progress and current leaders.
 */

import { test, expect } from './fixtures.js';
import { seedRace } from './helpers.js';

const RACE = { name: 'Bulk DNF Race', numCheckpoints: 2, runnerRange: { min: 100, max: 129 } };

const receive = async (page, cp, nums) => {
  await page.getByRole('button', { name: new RegExp(`^${cp},`) }).click();
  for (const n of nums) {
    await page.fill('#bib-heard', String(n));
    await page.keyboard.press('Enter');
  }
  await page.getByRole('button', { name: /^Complete/ }).click();
  await page.getByRole('button', { name: 'Next call' }).click();
};

const pending = (page, n) => page.getByTestId('bulk-pending').getByRole('button', { name: new RegExp(`^Remove ${n}\\b`) });
const outRow = (page, n) => page.getByTestId('out-list').locator('div').filter({ has: page.getByText(String(n), { exact: true }) }).first();

test.describe('Base — DNF / DNS and overview', () => {
  test.beforeEach(async ({ page }) => {
    await seedRace(page, RACE);
    await page.goto('/base-station/operations');
    await expect(page.getByRole('heading', { name: /who's calling/i })).toBeVisible({ timeout: 15000 });
    await receive(page, 'CP1', [111]);
    await receive(page, 'CP2', [110]);
  });

  test('base marks a pasted list DNF with checks, clears one and undoes', async ({ page, step }) => {
    await step('DNF / DNS tab — DNF at CP1, reason Injury', async () => {
      await page.getByRole('tab', { name: 'DNF / DNS' }).click();
      const mode = page.getByRole('group', { name: 'Status to apply' });
      await expect(mode.getByRole('button', { name: 'DNF' })).toHaveAttribute('aria-pressed', 'true');
      await page.getByRole('group', { name: 'Where' }).getByRole('button', { name: 'CP1' }).click();
      await page.getByRole('button', { name: 'Injury' }).click();
    });

    await step('Paste a list — each number is checked', async () => {
      await page.fill('#bulk-bibs', '110, 112 113; 999 112');
      await page.keyboard.press('Enter');
      await expect(pending(page, 110)).toHaveAccessibleName('Remove 110, Seen later at CP2');
      await expect(pending(page, 999)).toHaveAccessibleName('Remove 999, Not in race');
      await expect(pending(page, 112).nth(1)).toHaveAccessibleName('Remove 112, Listed twice');
      await expect(page.getByRole('button', { name: 'Mark 3 as DNF' })).toBeEnabled();
    });

    await step('Mark 3 as DNF — they appear in Out of the race', async () => {
      await page.getByRole('button', { name: 'Mark 3 as DNF' }).click();
      await expect(page.getByTestId('status-flash')).toHaveText('3 marked DNF');
      await expect(page.getByText('0 DNS · 3 DNF')).toBeVisible();
      await expect(outRow(page, 112)).toContainText(/CP1 · Injury · \d\d:\d\d/);
    });

    await step('Clear 112 — back in the race; Undo puts the DNF back', async () => {
      await page.getByRole('button', { name: 'Clear DNF for 112' }).click();
      await expect(page.getByTestId('status-flash')).toHaveText('112 back in the race');
      await expect(page.getByText('0 DNS · 2 DNF')).toBeVisible();
      await page.getByRole('button', { name: 'Undo' }).click();
      await expect(page.getByText('0 DNS · 3 DNF')).toBeVisible();
    });

    await step('DNS — a runner seen at CP1 is flagged; a DNF runner will change', async () => {
      await page.getByRole('group', { name: 'Status to apply' }).getByRole('button', { name: 'DNS' }).click();
      await page.fill('#bulk-bibs', '111 113');
      await page.keyboard.press('Enter');
      await expect(pending(page, 111)).toHaveAccessibleName('Remove 111, Seen CP1 — started');
      await expect(pending(page, 113)).toHaveAccessibleName('Remove 113, Was DNF — will change');
      await page.getByRole('button', { name: 'Mark 2 as DNS' }).click();
      await expect(page.getByText('2 DNS · 2 DNF')).toBeVisible();
    });

    await step('Receive rejects runners who are out', async () => {
      await page.getByRole('tab', { name: 'Receive' }).click();
      await page.getByRole('button', { name: /^CP2,/ }).click();
      await page.fill('#bib-heard', '112');
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('rx-numbers').getByRole('button', { name: 'Remove 112, DNF' })).toBeVisible();
    });
  });

  test('base overview shows tiles, checkpoint progress and current leaders', async ({ page, step }) => {
    await step('Overview — stat tiles and checkpoint progress', async () => {
      await page.getByRole('tab', { name: 'Overview' }).click();
      await expect(page.getByTestId('stats-grid')).toContainText('On course');
      await expect(page.getByRole('heading', { name: 'Checkpoint progress' })).toBeVisible();
      await expect(page.getByRole('img', { name: 'CP2: 1 of 30' })).toBeVisible();
    });

    await step('Current leaders — furthest along first, gold badge for #1', async () => {
      await expect(page.getByRole('heading', { name: 'Current leaders' })).toBeVisible();
      const first = page.locator('table tbody tr').first();
      await expect(first).toContainText('110');
      await expect(first).toContainText('CP2');
    });
  });
});
