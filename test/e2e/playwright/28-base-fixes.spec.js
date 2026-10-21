/**
 * Base station fixes from the UI validation (Phase B — B7 to B13).
 * Uses the validation pack's Mt Glorious race (bibs 100–159). With base data:
 * CP1 100–119 an hour ago, CP2 100–109 half an hour ago, plus a duplicate
 * (105), an out-of-order time (106), an impossible pace (107) and a skip (120).
 */
import { test, expect } from './fixtures.js';
import { seedRace } from '../../../scripts/ui-validation/seed.mjs';

const BASE = 'http://localhost:3000';

const openBase = async (page, { withBaseData = false, viewport = { width: 1280, height: 900 } } = {}) => {
  await page.setViewportSize(viewport);
  await seedRace(page, BASE, { withBaseData });
  await page.goto(`${BASE}/base-station/operations`);
  await expect(page.getByRole('heading', { name: /who's calling/i })).toBeVisible({ timeout: 15000 });
};
const add = async (page, nums) => { for (const n of nums) { await page.fill('#bib-heard', String(n)); await page.keyboard.press('Enter'); } };
const blocks = (page) => page.getByRole('group', { name: 'Common time block' });
const leaderRow = (page, n) => page.locator('section[aria-labelledby="lbhd"]').getByRole('row').filter({ hasText: new RegExp(`\\b${n}\\b`) });

test.describe('Base fixes', () => {
  test('exact time is pinned and a bad time keeps the block', async ({ page, step }) => {
    await openBase(page);
    await page.getByRole('button', { name: /^CP1,/ }).click();
    const selected = blocks(page).locator('[aria-pressed="true"]');
    const before = (await selected.innerText()).match(/\d\d:\d\d/)[0];

    await step('Scroll the block row to the start — Exact stays in view', async () => {
      await blocks(page).evaluate(el => { el.scrollLeft = 0; });
      await expect(page.locator('#exact-time')).toBeInViewport();
    });

    await step('Type 2359 — rejected: red, cleared, the block stays selected, Exact not selected', async () => {
      await page.locator('#exact-time').fill('2359');
      await expect(page.locator('#exact-time')).toHaveValue('');
      await expect(page.locator('#exact-time')).toHaveAttribute('aria-invalid', 'true');
      await expect(page.locator('#exact-time')).toHaveAttribute('data-active', 'false');
      await expect(selected).toContainText(before);
      await expect(page.getByTestId('rx-flash')).toContainText(/Time must be between \d\d:\d\d and now/);
    });

    await step('Type a valid time as HHMM — shown as HH:MM and selected', async () => {
      const t = await page.evaluate(() => { const d = new Date(Date.now() - 3 * 60000); return [d.getHours(), d.getMinutes()].map(v => String(v).padStart(2, '0')); });
      await page.locator('#exact-time').fill(t.join(''));
      await expect(page.locator('#exact-time')).toHaveValue(t.join(':'));
      await expect(page.locator('#exact-time')).toHaveAttribute('data-active', 'true');
      await expect(blocks(page).locator('[aria-pressed="true"]')).toHaveCount(0);
    });
  });

  test('also in this call counts numbers to record', async ({ page, step }) => {
    await openBase(page);
    await page.getByRole('button', { name: /^CP1,/ }).click();
    await blocks(page).getByRole('button').nth(0).click();
    const first = (await blocks(page).locator('[aria-pressed="true"]').innerText()).match(/\d\d:\d\d/)[0];

    await step('Six numbers in one block, three not in the race', async () => {
      await add(page, [140, 141, 142, 997, 998, 999]);
      await expect(page.getByTestId('rx-numbers').getByRole('button')).toHaveCount(6);
    });

    await step('Next block — the pill for the first block shows 3', async () => {
      await page.getByRole('button', { name: /^Next \d\d:\d\d/ }).click();
      const pill = page.getByRole('button', { name: `Show the numbers at ${first}, 3 to record` });
      await expect(pill).toHaveText(`${first} · 3`);
    });
  });

  test('a call with nothing to record is logged plainly', async ({ page, step }) => {
    await openBase(page);
    await page.getByRole('button', { name: /^CP2,/ }).click();
    await add(page, [998, 999]);

    await step('Only unknown numbers — "Log call · 0", not the gold Complete', async () => {
      const btn = page.getByRole('button', { name: 'Log call · 0' });
      await expect(btn).toBeEnabled();
      await expect(btn).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    });

    await step('Log it — "0 recorded at CP2 · 2 skipped (flagged)"', async () => {
      await page.getByRole('button', { name: 'Log call · 0' }).click();
      await expect(page.getByRole('status').getByText('0 recorded at CP2 · 2 skipped (flagged)')).toBeVisible();
    });
  });

  test('rejected chips match receive and out list rows are not cut off', async ({ page, step }) => {
    await openBase(page, { viewport: { width: 1112, height: 834 } });
    await page.getByRole('tab', { name: 'DNF / DNS' }).click();

    await step('Paste a list with a bib not in the race — rejected chip: white, 2px red, struck through', async () => {
      await page.fill('#bulk-bibs', '112, 999');
      await page.keyboard.press('Enter');
      const bad = page.getByTestId('bulk-pending').getByRole('button', { name: /^Remove 999/ });
      await expect(bad).toHaveCSS('border-top-width', '2px');
      await expect(bad).toHaveCSS('background-color', 'rgb(255, 255, 255)');
      await expect(bad).toHaveCSS('text-decoration-line', 'line-through');
    });

    await step('Mark 112 DNF at CP1, Medical — the out list shows the whole detail', async () => {
      await page.getByRole('group', { name: 'Where' }).getByRole('button', { name: 'CP1' }).click();
      await page.getByRole('group', { name: 'Reason' }).getByRole('button', { name: 'Medical' }).click();
      await page.getByRole('button', { name: 'Mark 1 as DNF' }).click();
      const detail = page.getByTestId('out-detail').first();
      await expect(detail).toHaveText(/^CP1 · Medical · \d\d:\d\d$/);
      expect(await detail.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    });
  });

  test('withdrawal dialog uses 24-hour time and can be undone', async ({ page, step }) => {
    await openBase(page);
    await page.getByRole('tab', { name: 'DNF / DNS' }).click();
    const dialog = page.getByRole('dialog', { name: 'Withdraw runner' });

    await step('Open — where, 24-hour time with the date, five reasons, comments', async () => {
      await page.getByRole('button', { name: /withdraw runner with comments/i }).click();
      await expect(dialog).toBeVisible();
      await expect(dialog.locator('[aria-live="polite"]')).toHaveText(/^\d\d:\d\d$/);
      await expect(dialog).not.toContainText(/\b(AM|PM)\b/);
      await expect(dialog.getByTestId('withdraw-date')).toHaveText(/^\w{3} \d{1,2} \w{3} \d{4}$/);
      await expect(dialog.getByRole('group', { name: 'Reason' }).getByRole('button')).toHaveText(['Injury', 'Self-withdrew', 'Cut-off', 'Medical', 'Other']);
    });

    await step('Withdraw 131 at CP2, Injury, with a comment — on the out list', async () => {
      await dialog.getByLabel('Runner number').fill('131');
      await dialog.getByRole('group', { name: 'Where' }).getByRole('button', { name: 'CP2' }).click();
      await dialog.getByRole('group', { name: 'Reason' }).getByRole('button', { name: 'Injury' }).click();
      await dialog.getByLabel(/Comments/).fill('Rolled ankle');
      await expect(dialog.getByRole('button', { name: 'Withdraw runner' })).toHaveCSS('background-color', 'rgb(204, 0, 0)');
      await dialog.getByRole('button', { name: 'Withdraw runner' }).click();
      await expect(dialog).toBeHidden();
      await expect(page.getByTestId('out-row').filter({ hasText: '131' })).toContainText(/CP2 · Injury · \d\d:\d\d/);
    });

    await step('Undo — 131 is back in the race', async () => {
      await page.getByRole('status').getByRole('button', { name: 'Undo' }).click();
      await expect(page.getByTestId('out-row').filter({ hasText: '131' })).toHaveCount(0);
    });
  });

  test('reports undo stays with its list and says what it undoes', async ({ page, step }) => {
    await openBase(page, { withBaseData: true });
    await page.getByRole('tab', { name: 'Reports' }).click();

    await step('Out of order — Mark checked; Undo names the bib and action', async () => {
      await page.getByRole('button', { name: /^Out of order/ }).click();
      await page.getByTestId('issue-row').filter({ hasText: '106' }).getByRole('button', { name: 'Mark checked' }).click();
      await expect(page.getByRole('button', { name: 'Undo 106: Mark checked' })).toBeVisible();
    });

    await step('Switch to Skipped a checkpoint — no Undo carried over', async () => {
      await page.getByRole('button', { name: /^Skipped a checkpoint/ }).click();
      await expect(page.getByRole('button', { name: /^Undo/ })).toHaveCount(0);
    });
  });

  test('leaders flag open data issues', async ({ page, step }) => {
    await openBase(page, { withBaseData: true });

    await step('Overview — 106 (out of order) and 107 (impossible pace) carry the warning; elapsed is HH:MM', async () => {
      await page.getByRole('tab', { name: 'Overview' }).click();
      await expect(leaderRow(page, 106).getByRole('img', { name: 'Open data issue' })).toBeVisible();
      await expect(leaderRow(page, 107).getByRole('img', { name: 'Open data issue' })).toBeVisible();
      await expect(leaderRow(page, 107).getByRole('cell').nth(4)).toHaveText(/^\d\d:\d\d$/);
    });

    await step('Mark 107 checked in Reports — its warning goes', async () => {
      await page.getByRole('tab', { name: 'Reports' }).click();
      await page.getByRole('button', { name: /^Impossible pace/ }).click();
      await page.getByTestId('issue-row').filter({ hasText: '107' }).getByRole('button', { name: 'Mark checked' }).click();
      await page.getByRole('tab', { name: 'Overview' }).click();
      await expect(leaderRow(page, 107).getByRole('img', { name: 'Open data issue' })).toHaveCount(0);
      await expect(leaderRow(page, 106).getByRole('img', { name: 'Open data issue' })).toBeVisible();
    });
  });
});
