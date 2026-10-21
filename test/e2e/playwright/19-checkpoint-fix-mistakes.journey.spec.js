/**
 * Customer Journey: Checkpoint volunteer fixes mistakes (VK4WIP redesign, Phase 2)
 *
 *   1. checkpoint-edit-time — mark, open the sheet, change the time, save;
 *      unmark + Undo; unmark, then later restore the original time
 *   2. checkpoint-correction — a called-in runner's time is edited and goes
 *      back on the callout sheet as a correction
 *   4. checkpoint-overview-fix — undo call-in, reset to not passed, mark DNS,
 *      clear DNS, each with Undo
 */

import { test, expect } from './fixtures.js';
import { seedRace } from './helpers.js';

const RACE = { name: 'Fix Mistakes Race', numCheckpoints: 1, runnerRange: { min: 100, max: 109 } };

const tile = (page, n) => page.getByRole('button', { name: new RegExp(`^Runner ${n}, `) });
const sheet = (page) => page.getByRole('dialog');

test.describe('Checkpoint — fix mistakes', () => {
  test.beforeEach(async ({ page }) => {
    await seedRace(page, RACE);
    await page.goto('/checkpoint/1');
    await expect(tile(page, 100)).toBeVisible({ timeout: 15000 });
  });

  test('mark off: change a time, unmark with undo, restore an unmarked runner', async ({ page, step }) => {
    await step('Mark off — tap 101 as the runner passes', async () => {
      await tile(page, 101).click();
      await expect(tile(page, 101)).toHaveAccessibleName(/^Runner 101, \d\d:\d\d$/);
    });

    let original;
    await step('Tap 101 again — the edit sheet opens (it never unmarks directly)', async () => {
      original = (await tile(page, 101).getAttribute('aria-label')).match(/(\d\d:\d\d)$/)[1];
      await tile(page, 101).click();
      await expect(sheet(page)).toBeVisible();
      await expect(sheet(page).getByText('Passed · not called in yet')).toBeVisible();
      await expect(sheet(page).getByRole('button', { name: 'Keep time' })).toBeVisible();
    });

    await step('Edit sheet — 5 minutes earlier, then Save', async () => {
      await sheet(page).getByLabel('5 minutes earlier').click();
      await expect(sheet(page).getByText(`Was ${original}`)).toBeVisible();
      await sheet(page).getByRole('button', { name: /^Save \d\d:\d\d$/ }).click();
      await expect(sheet(page)).toBeHidden();
      await expect(page.getByTestId('markoff-status')).toContainText('101 time changed to');
      await expect(tile(page, 101)).not.toHaveAccessibleName(new RegExp(original));
    });

    await step('Unmark 102 by mistake — Undo puts it straight back', async () => {
      await tile(page, 102).click();
      await expect(tile(page, 102)).toHaveAccessibleName(/^Runner 102, \d\d:\d\d$/);
      await tile(page, 102).click();
      await sheet(page).getByRole('button', { name: 'Unmark runner' }).click();
      await expect(tile(page, 102)).toHaveAccessibleName(/was \d\d:\d\d/);
      await expect(page.getByRole('status').filter({ hasText: '102 unmarked' })).toBeVisible();
      await page.getByRole('button', { name: 'Undo' }).click();
      await expect(tile(page, 102)).toHaveAccessibleName(/^Runner 102, \d\d:\d\d$/);
    });

    await step('Unmark 103, then later tap it to restore the original time', async () => {
      await tile(page, 103).click();
      await expect(tile(page, 103)).toHaveAccessibleName(/^Runner 103, \d\d:\d\d$/);
      const t103 = (await tile(page, 103).getAttribute('aria-label')).match(/(\d\d:\d\d)$/)[1];
      await tile(page, 103).click();
      await sheet(page).getByRole('button', { name: 'Unmark runner' }).click();
      await expect(tile(page, 103)).toHaveAccessibleName(`Runner 103, was ${t103}`);

      await tile(page, 103).click();
      await expect(sheet(page).getByText('Unmarked earlier')).toBeVisible();
      await expect(sheet(page).getByText(`It had been marked at ${t103}`)).toBeVisible();
      await sheet(page).getByRole('button', { name: `Mark at ${t103}` }).click();
      await expect(tile(page, 103)).toHaveAccessibleName(`Runner 103, ${t103}`);
    });
  });

  test('a changed time base already has goes back on the callout sheet as a correction', async ({ page, step }) => {
    await step('Mark 104 and send it to base from the callout sheet', async () => {
      await tile(page, 104).click();
      await page.getByRole('button', { name: /^Callout/ }).click();
      await page.getByRole('button', { name: /base copied — mark sent/i }).click();
      await expect(page.getByText('Nothing to call in')).toBeVisible();
    });

    await step('Mark off — 104 shows as called in (tick)', async () => {
      await page.getByRole('button', { name: /^Mark off/ }).click();
      await expect(tile(page, 104)).toHaveAccessibleName(/^Runner 104, ✓ \d\d:\d\d$/);
      await tile(page, 104).click();
      await expect(sheet(page).getByText('Called in to base')).toBeVisible();
    });

    await step('Edit sheet — changing a called-in time warns that base already has it', async () => {
      // −5 always crosses a 5-minute block (same-block edits aren't corrections — A3)
      await sheet(page).getByLabel('5 minutes earlier').click();
      await expect(sheet(page).getByText(/base already has/i)).toBeVisible();
      await expect(sheet(page).getByText(/goes back on the callout sheet as a correction/i)).toBeVisible();
      await sheet(page).getByRole('button', { name: /^Save / }).click();
      await expect(page.getByTestId('markoff-status')).toContainText('back on callout as a correction');
      await expect(tile(page, 104)).toHaveAccessibleName(/^Runner 104, ✎ \d\d:\d\d$/);
    });

    await step('Callout sheet — 104 is back in the next call, tagged Correction', async () => {
      await page.getByRole('button', { name: /^Callout/ }).click();
      const pending = page.getByTestId('pending-block');
      await expect(pending).toContainText('104');
      await expect(pending.getByText('Correction')).toBeVisible();
    });
  });

  test('overview: undo call-in, reset, mark and clear DNS — each with undo', async ({ page, step }) => {
    const rowBtn = (n) => page.locator('button[aria-expanded]').filter({ hasText: new RegExp(`^${n}`) });

    await step('Mark 105, open Overview and tap 105', async () => {
      await tile(page, 105).click();
      await page.getByRole('button', { name: /^Overview/ }).click();
      await rowBtn(105).click();
      await expect(rowBtn(105)).toHaveAttribute('aria-expanded', 'true');
      await expect(rowBtn(105)).toContainText('Not called');
    });

    await step('Mark called in, then Undo call-in — back on the callout sheet', async () => {
      await page.getByRole('button', { name: 'Mark called in' }).click();
      await expect(rowBtn(105)).toContainText('Called in');
      await page.getByRole('button', { name: 'Undo call-in' }).click();
      await expect(rowBtn(105)).toContainText('Not called');
      await page.getByRole('button', { name: 'Undo' }).click();
      await expect(rowBtn(105)).toContainText('Called in');
    });

    await step('Reset — not passed, then Undo', async () => {
      await page.getByRole('button', { name: 'Reset — not passed' }).click();
      await expect(rowBtn(105)).toContainText('To come');
      await page.getByRole('button', { name: 'Undo' }).click();
      await expect(rowBtn(105)).toContainText('Called in');
    });

    await step('Mark 106 DNS, Undo, then mark DNS again', async () => {
      await rowBtn(106).click();
      await page.getByRole('button', { name: 'Mark DNS' }).click();
      await expect(rowBtn(106)).toContainText('DNS');
      await page.getByRole('button', { name: 'Undo' }).click();
      await expect(rowBtn(106)).toContainText('To come');
      await page.getByRole('button', { name: 'Mark DNS' }).click();
      await expect(rowBtn(106)).toContainText('DNS');
    });

    await step('Clear DNS, then Undo — counts update live', async () => {
      await page.getByRole('button', { name: 'Clear DNS' }).click();
      await expect(rowBtn(106)).toContainText('To come');
      await page.getByRole('button', { name: 'Undo' }).click();
      await expect(rowBtn(106)).toContainText('DNS');
      await page.getByRole('button', { name: 'DNS / DNF' }).click();
      await expect(rowBtn(106)).toBeVisible();
      await expect(rowBtn(105)).toHaveCount(0);
    });
  });
});
