/**
 * Race-day fixes Part A — corrections by radio. A correction is its own call,
 * one runner at a time: the checkpoint keeps a Corrections card, base has a
 * Correction mode on Receive.
 */
import { test, expect } from './fixtures.js';
import { seedRace } from '../../../scripts/ui-validation/seed.mjs';

const BASE = 'http://localhost:3000';
const PHONE = { width: 390, height: 844 };

const tab = (page, name) => page.getByRole('navigation', { name: 'Checkpoint tabs' }).getByRole('button', { name: new RegExp(`^${name}`) });
const tile = (page, n) => page.getByRole('button', { name: new RegExp(`^Runner ${n},`) });
const sheet = (page) => page.getByRole('dialog');
const blockAgo = (page, m) => page.evaluate((m) => {
  const d = new Date(Date.now() - m * 60000);
  d.setMinutes(Math.floor(d.getMinutes() / 5) * 5, 0, 0);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}, m);

/** Mark 101 ten minutes back and call it in; returns base's block for it. */
const callIn101 = async (page) => {
  await page.setViewportSize(PHONE);
  await seedRace(page, BASE);
  await page.goto(`${BASE}/checkpoint/3`);
  await tile(page, 101).click();
  await tile(page, 101).click();
  await sheet(page).getByLabel('5 minutes earlier').click();
  await sheet(page).getByLabel('5 minutes earlier').click();
  await sheet(page).getByRole('button', { name: /^Save / }).click();
  await tab(page, 'Callout').click();
  await page.getByRole('button', { name: /base copied — mark sent/i }).click();
  await tab(page, 'Mark off').click();
  await expect(tile(page, 101)).toHaveAccessibleName(/^Runner 101, ✓ \d\d:\d\d$/);
  const t = (await tile(page, 101).getAttribute('aria-label')).match(/(\d\d):(\d\d)$/);
  return `${t[1]}:${String(Math.floor(Number(t[2]) / 5) * 5).padStart(2, '0')}`;
};

test.describe('Corrections', () => {
  test('checkpoint corrections card', async ({ page, step }) => {
    const was = await callIn101(page);
    let now;

    await step('Move 101 into the block before — it goes on the Corrections card, not the next call', async () => {
      await tile(page, 101).click();
      await sheet(page).getByLabel('5 minutes earlier').click();
      await sheet(page).getByRole('button', { name: /^Save / }).click();
      await expect(page.getByTestId('markoff-status')).toContainText('on the Corrections card');
      await page.fill('#quick-entry-input', '110');
      await page.keyboard.press('Enter');
      await tab(page, 'Callout').click();
      const row = page.getByTestId('correction-row');
      await expect(row).toHaveCount(1);
      now = (await row.innerText()).match(/now (\d\d:\d\d)/)[1];
      await expect(row).toHaveText(new RegExp(`^101\\s*now ${now} · was ${was}$`));
      await expect(page.getByTestId('pending-block')).not.toContainText('101');
    });

    await step('Base copied — correction sent: the card empties; Undo brings it back', async () => {
      const sent = page.getByRole('button', { name: 'Base copied — correction sent' });
      await expect(sent).toHaveCSS('border-top-style', 'solid');
      await expect(page.getByRole('button', { name: /base copied — mark sent/i })).toHaveCSS('background-color', 'rgb(212, 175, 55)');
      await sent.click();
      await expect(page.getByTestId('corrections-card')).toHaveCount(0);
      await page.getByRole('button', { name: 'Undo' }).click();
      await expect(page.getByTestId('correction-row')).toHaveText(new RegExp(`^101\\s*now ${now} · was ${was}$`));
    });
  });

  test('unmarking a called-in runner is a not-passed correction', async ({ page, step }) => {
    const was = await callIn101(page);
    await step('Unmark 101 after it was called in — "not passed · was" on the Corrections card', async () => {
      await tile(page, 101).click();
      await sheet(page).getByRole('button', { name: 'Unmark runner' }).click();
      await expect(page.getByTestId('markoff-status')).toContainText('not passed');
      await tab(page, 'Callout').click();
      await expect(page.getByTestId('correction-row')).toHaveText(new RegExp(`^101\\s*not passed · was ${was}$`));
      await expect(page.getByRole('button', { name: 'Base copied — correction sent' })).toHaveCSS('background-color', 'rgb(212, 175, 55)');
    });
  });

  test('base applies a correction', async ({ page, step }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await seedRace(page, BASE, { withBaseData: true });
    await page.goto(`${BASE}/base-station/operations`);
    await expect(page.getByRole('heading', { name: /who's calling/i })).toBeVisible({ timeout: 15000 });
    const had = await blockAgo(page, 30);
    const fixed = await blockAgo(page, 35);
    const upTo = (await page.getByTestId('board-CP2').innerText()).match(/Up to \d\d:\d\d/)[0];

    await step('CP2 → Correction → 101: base had the earlier call\'s time', async () => {
      await page.getByRole('button', { name: /^CP2,/ }).click();
      await page.getByRole('button', { name: 'Correction', exact: true }).click();
      await page.fill('#corr-bib', '101');
      await expect(page.getByTestId('corr-had')).toHaveText(`Had ${had}`);
    });

    await step('Pick the new time and Apply — the times table shows it; "up to" unchanged', async () => {
      await page.getByRole('group', { name: 'Common time block' }).getByRole('button', { name: new RegExp(`^${fixed}`) }).click();
      await page.getByRole('button', { name: `Apply correction · ${fixed}` }).click();
      await expect(page.getByTestId('rx-flash')).toHaveText(`Correction recorded — 101 at CP2: ${had} → ${fixed}`);
      await expect(page.getByTestId('board-CP2')).toContainText(upTo);
      await page.getByRole('tab', { name: 'Reports' }).click();
      await page.getByRole('button', { name: /^Times by checkpoint/ }).click();
      await expect(page.getByRole('row').filter({ hasText: /^101/ }).getByRole('cell').nth(3)).toHaveText(fixed);
    });

    await step('Undo — base has the original time again', async () => {
      await page.getByRole('tab', { name: 'Receive' }).click();
      await page.getByRole('button', { name: 'Undo', exact: true }).click();
      await expect(page.getByTestId('corr-had')).toHaveCount(1);
      await page.fill('#corr-bib', '101');
      await expect(page.getByTestId('corr-had')).toHaveText(`Had ${had}`);
    });
  });

  test('a normal call still skips a number base already has', async ({ page, step }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await seedRace(page, BASE, { withBaseData: true });
    await page.goto(`${BASE}/base-station/operations`);
    await expect(page.getByRole('heading', { name: /who's calling/i })).toBeVisible({ timeout: 15000 });
    await step('CP2 Scores call with 101 — gold "Had", skipped (no tap-to-replace)', async () => {
      await page.getByRole('button', { name: /^CP2,/ }).click();
      await page.fill('#bib-heard', '101');
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('rx-numbers').getByRole('button', { name: /^Remove 101, Had \d\d:\d\d$/ })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Log call · 0' })).toBeVisible();
    });
  });
});
