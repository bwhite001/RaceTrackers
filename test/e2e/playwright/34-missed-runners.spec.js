/**
 * Race-day fixes Part E — runners a checkpoint missed. Base finds out when a
 * runner is reported further on, reminds that checkpoint, and checks who is
 * unaccounted for before it stands down.
 */
import { test, expect } from './fixtures.js';
import { seedRace } from '../../../scripts/ui-validation/seed.mjs';

const BASE = 'http://localhost:3000';
const add = async (page, nums) => { for (const n of nums) { await page.fill('#bib-heard', String(n)); await page.keyboard.press('Enter'); } };
const call = async (page, cp, nums) => {
  await page.getByRole('button', { name: new RegExp(`^${cp},`) }).click();
  await page.getByRole('group', { name: 'Common time block' }).getByRole('button').last().click();
  await add(page, nums);
  await page.getByRole('button', { name: /^Complete · \d+$/ }).click();
  await page.getByRole('button', { name: 'Next call' }).click();
};
const openBase = async (page) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await seedRace(page, BASE);
  await page.goto(`${BASE}/base-station/operations`);
  await expect(page.getByRole('heading', { name: /who's calling/i })).toBeVisible({ timeout: 15000 });
};

test.describe('Missed runners', () => {
  test('base reminds a checkpoint of a runner it missed', async ({ page, step }) => {
    await openBase(page);

    await step('CP1 calls 100; CP2 calls 150 too — CP1 now shows "Missed: 150 (seen CP2)"', async () => {
      await call(page, 'CP1', [100]);
      await call(page, 'CP2', [100, 150]);
      await expect(page.getByRole('button', { name: /^CP1, \w+, missed 150$/ })).toContainText('Missed: 150 (seen CP2)');
      await expect(page.getByTestId('missed-CP1')).toHaveText('Missed: 150 (seen CP2)');
    });

    await step('Tap CP1 — "They have it", enter the time they give', async () => {
      await page.getByRole('button', { name: /^CP1,/ }).click();
      await page.getByTestId('missed-row').filter({ hasText: '150' }).getByRole('button', { name: 'They have it' }).click();
      await expect(page.getByRole('heading', { name: 'CP1 · Missed runner' })).toBeVisible();
      await page.getByRole('group', { name: 'Common time block' }).getByRole('button').first().click();
      await page.getByRole('button', { name: /^Record missed · \d\d:\d\d$/ }).click();
      await expect(page.getByTestId('missed-CP1')).toHaveCount(0);
      await expect(page.getByTestId('missed-panel')).toContainText(/150 recorded at CP1 \d\d:\d\d/);
    });

    await step('Undo — the reminder is back', async () => {
      await page.getByTestId('missed-panel').getByRole('button', { name: 'Undo' }).click();
      await expect(page.getByTestId('missed-CP1')).toHaveText('Missed: 150 (seen CP2)');
    });
  });

  test('not seen there shows missed in the times table', async ({ page, step }) => {
    await openBase(page);
    await call(page, 'CP1', [100]);
    await call(page, 'CP2', [100, 150]);

    await step('CP1 › "Not seen there" for 150 — the reminder clears', async () => {
      await page.getByRole('button', { name: /^CP1,/ }).click();
      await page.getByTestId('missed-row').filter({ hasText: '150' }).getByRole('button', { name: 'Not seen there' }).click();
      await expect(page.getByTestId('missed-row')).toHaveCount(0);
      await page.getByRole('button', { name: 'Cancel call' }).click();
    });

    await step('Reports — Times by checkpoint reads "missed" at CP1; Skipped check is clear', async () => {
      await page.getByRole('tab', { name: 'Reports' }).click();
      await expect(page.getByTestId('check-count-skip')).toHaveText('✓');
      await page.getByRole('button', { name: /^Times by checkpoint/ }).click();
      await expect(page.getByRole('row').filter({ hasText: /^150/ }).getByRole('cell').nth(2)).toHaveText('missed');
    });
  });

  test('stand-down check before a checkpoint packs down', async ({ page, step }) => {
    await openBase(page);
    await call(page, 'CP1', [100, 101]);
    await call(page, 'CP3', [100]);

    await step('Stand-down check on CP2 — 100 seen further on (CP3), 101 not seen past CP1', async () => {
      await page.getByRole('button', { name: 'Stand-down check CP2' }).click();
      const sheet = page.getByRole('dialog', { name: 'Stand-down check · CP2' });
      await expect(sheet.getByTestId('seen-further')).toContainText('100 · CP3');
      await expect(sheet.getByTestId('not-seen-past')).toContainText('101 · last CP1');
      await expect(sheet.getByTestId('not-seen-past')).toContainText('102 · not seen');
    });

    await step('Stand down (two taps) — CP2 is Closed; Undo reopens it', async () => {
      const sheet = page.getByRole('dialog', { name: 'Stand-down check · CP2' });
      await sheet.getByRole('button', { name: 'Stand down' }).click();
      await sheet.getByRole('button', { name: 'Tap again to stand down' }).click();
      await expect(sheet.getByRole('status')).toHaveText(/CP2 stood down/);
      await expect(page.getByTestId('board-CP2')).toContainText('Closed');
      await sheet.getByRole('button', { name: 'Undo' }).click();
      await expect(page.getByTestId('board-CP2')).not.toContainText('Closed');
    });
  });

  test('checkpoint records a runner base says it missed', async ({ page, step }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedRace(page, BASE);
    await page.goto(`${BASE}/checkpoint/3`);
    await expect(page.getByRole('button', { name: /^Runner 100,/ })).toBeVisible({ timeout: 15000 });

    await step('Overview › 150 › "Missed — passed earlier", step back five minutes, save', async () => {
      await page.getByRole('navigation', { name: 'Checkpoint tabs' }).getByRole('button', { name: /^Overview/ }).click();
      await page.getByRole('button', { name: /^150 / }).click();
      await page.getByRole('button', { name: 'Missed — passed earlier' }).click();
      await expect(page.getByRole('button', { name: /^Passed now/ })).toHaveCount(0);
      await page.getByTestId('missed-editor').getByLabel('5 minutes earlier').click();
      await page.getByRole('button', { name: /^Save missed · \d\d:\d\d$/ }).click();
    });

    await step('Callout — on the Corrections card as "150 · missed · now HH:MM"', async () => {
      await page.getByRole('navigation', { name: 'Checkpoint tabs' }).getByRole('button', { name: /^Callout/ }).click();
      await expect(page.getByTestId('correction-row')).toHaveText(/^150\s*missed · now \d\d:\d\d$/);
    });
  });
});
