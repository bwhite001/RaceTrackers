/**
 * Coverage gaps from the UI validation (Phase D — D3 / D4): behaviour the
 * first validation pack never exercised, each as its own test.
 */
import { test, expect } from './fixtures.js';
import { seedRace as seedSmall } from './helpers.js';
import { seedRace } from '../../../scripts/ui-validation/seed.mjs';

const BASE = 'http://localhost:3000';
const PHONE = { width: 390, height: 844 };
const DESK = { width: 1280, height: 900 };

const openBase = async (page, opts = {}) => {
  await page.setViewportSize(opts.viewport ?? DESK);
  await seedRace(page, BASE, opts);
  await page.goto(`${BASE}/base-station/operations`);
  await expect(page.getByRole('heading', { name: /who's calling/i })).toBeVisible({ timeout: 15000 });
};
const add = async (page, nums) => { for (const n of nums) { await page.fill('#bib-heard', String(n)); await page.keyboard.press('Enter'); } };
const chip = (page, n) => page.getByTestId('rx-numbers').getByRole('button', { name: new RegExp(`^Remove ${n}\\b`) });
const pending = (page, n) => page.getByTestId('bulk-pending').getByRole('button', { name: new RegExp(`^Remove ${n}\\b`) });
const statusTab = (page) => page.getByRole('tab', { name: 'DNF / DNS' }).click();
const bulk = async (page, mode, text) => {
  await page.getByRole('group', { name: 'Status to apply' }).getByRole('button', { name: mode }).click();
  await page.fill('#bulk-bibs', text);
  await page.keyboard.press('Enter');
};
const issue = (page, n) => page.getByTestId('issue-row').filter({ hasText: new RegExp(`^${n}`) });
const cpTab = (page, name) => page.getByRole('navigation', { name: 'Checkpoint tabs' }).getByRole('button', { name: new RegExp(`^${name}`) });

test.describe('Coverage gaps — Receive', () => {
  test('receive flags a number not seen at the previous checkpoint', async ({ page, step }) => {
    await openBase(page, { withBaseData: true });
    await step('CP2 call — 125 was never reported at CP1: blue info chip, still recorded', async () => {
      await page.getByRole('button', { name: /^CP2,/ }).click();
      await add(page, [125]);
      await expect(chip(page, 125)).toHaveAccessibleName('Remove 125, Not seen CP1');
      await expect(page.getByRole('button', { name: 'Complete · 1' })).toBeVisible();
    });
  });

  test('receive shows Closed once everyone is through', async ({ page, step }) => {
    await page.setViewportSize(DESK);
    await seedSmall(page, { name: 'Small Field', numCheckpoints: 2, runnerRange: { min: 100, max: 104 } });
    await page.goto('/base-station/operations');
    await expect(page.getByRole('heading', { name: /who's calling/i })).toBeVisible({ timeout: 15000 });
    await step('CP1 reports all five runners — its pill reads Closed', async () => {
      await page.getByRole('button', { name: /^CP1,/ }).click();
      await add(page, [100, 101, 102, 103, 104]);
      await page.getByRole('button', { name: 'Complete · 5' }).click();
      await page.getByRole('button', { name: 'Next call' }).click();
      await expect(page.getByRole('button', { name: 'CP1, Closed' })).toBeVisible();
      await expect(page.getByTestId('board-CP1')).toContainText('Closed');
    });
  });

  test('receive takes an exact time typed as HH:MM', async ({ page, step }) => {
    await openBase(page);
    await step('Type the time with a colon — accepted and selected', async () => {
      await page.getByRole('button', { name: /^CP1,/ }).click();
      const t = await page.evaluate(() => { const d = new Date(Date.now() - 4 * 60000); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; });
      await page.locator('#exact-time').fill(t);
      await expect(page.locator('#exact-time')).toHaveValue(t);
      await expect(page.locator('#exact-time')).toHaveAttribute('data-active', 'true');
      await add(page, [140]);
      await expect(page.getByTestId('rx-flash')).toHaveText(`140 added at ${t}`);
    });
  });

  test('receive draft survives a tab switch', async ({ page, step }) => {
    await openBase(page);
    await page.getByRole('button', { name: /^CP1,/ }).click();
    await add(page, [140, 141]);
    const block = (await page.getByRole('group', { name: 'Common time block' }).locator('[aria-pressed="true"]').innerText()).match(/\d\d:\d\d/)[0];
    await step('Overview and back — the call in progress is still there', async () => {
      await page.getByRole('tab', { name: 'Overview' }).click();
      await page.getByRole('tab', { name: 'Receive' }).click();
      await expect(page.getByTestId('rx-numbers').getByRole('button')).toHaveCount(2);
      await expect(page.getByRole('group', { name: 'Common time block' }).locator('[aria-pressed="true"]')).toContainText(block);
    });
  });
});

test.describe('Coverage gaps — DNF / DNS', () => {
  test('a runner already DNF is rejected', async ({ page, step }) => {
    await openBase(page);
    await statusTab(page);
    await bulk(page, 'DNF', '130');
    await page.getByRole('button', { name: 'Mark 1 as DNF' }).click();
    await step('Add 130 again as DNF — rejected "Already DNF", nothing to mark', async () => {
      await bulk(page, 'DNF', '130');
      await expect(pending(page, 130)).toHaveAccessibleName('Remove 130, Already DNF');
      await expect(page.getByRole('button', { name: 'Add numbers to mark' })).toBeDisabled();
    });
  });

  test('a DNS row is cleared and undone', async ({ page, step }) => {
    await openBase(page);
    await statusTab(page);
    await bulk(page, 'DNS', '150');
    await page.getByRole('button', { name: 'Mark 1 as DNS' }).click();
    await step('Clear on the DNS row — back in the race; Undo puts it back', async () => {
      await page.getByRole('button', { name: 'Clear DNS for 150' }).click();
      await expect(page.getByTestId('out-row').filter({ hasText: '150' })).toHaveCount(0);
      await page.getByRole('button', { name: 'Undo', exact: true }).click();
      await expect(page.getByTestId('out-row').filter({ hasText: '150' })).toContainText('Did not start');
    });
  });

  test('a DNF recorded at a checkpoint cannot be cleared at base', async ({ page, step }) => {
    await openBase(page, { withBaseData: true });
    await statusTab(page);
    await step('145 was marked DNF at CP2 — its Clear is disabled with the reason', async () => {
      const clear = page.getByRole('button', { name: 'Clear DNF for 145' });
      await expect(clear).toBeDisabled();
      await expect(clear).toHaveAttribute('title', 'Recorded at a checkpoint — clear it there');
    });
  });
});

test.describe('Coverage gaps — data checks', () => {
  test('identical duplicates merge', async ({ page, step }) => {
    await openBase(page, { withBaseData: true });
    await page.getByRole('tab', { name: 'Reports' }).click();
    await page.getByRole('button', { name: /^Duplicates/ }).click();
    await step('115 at CP1 twice with the same time — Merge', async () => {
      await expect(issue(page, 115)).toContainText('CP1 — same time twice');
      await issue(page, 115).getByRole('button', { name: 'Merge' }).click();
      await expect(issue(page, 115)).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Undo 115: Merge' })).toBeVisible();
    });
  });

  test('a time seen after DNF is removed', async ({ page, step }) => {
    await openBase(page, { withBaseData: true });
    await statusTab(page);
    await step('Mark 108 DNF at CP1, 45 minutes ago (it was reported at CP2 30 minutes ago)', async () => {
      await page.getByRole('group', { name: 'Where' }).getByRole('button', { name: 'CP1' }).click();
      for (let i = 0; i < 9; i++) await page.getByLabel('5 minutes earlier').click();
      await bulk(page, 'DNF', '108');
      await expect(pending(page, 108)).toHaveAccessibleName('Remove 108, Seen later at CP2');
      await page.getByRole('button', { name: 'Mark 1 as DNF' }).click();
    });
    await step('Reports › Seen after DNF / DNS — Remove CP2 time', async () => {
      await page.getByRole('tab', { name: 'Reports' }).click();
      await page.getByRole('button', { name: /^Seen after DNF/ }).click();
      await expect(issue(page, 108)).toContainText('DNF, then seen at CP2');
      await issue(page, 108).getByRole('button', { name: 'Remove CP2 time' }).click();
      await expect(issue(page, 108)).toHaveCount(0);
    });
  });

  test('DNS is cleared from a check', async ({ page, step }) => {
    await openBase(page, { withBaseData: true });
    await statusTab(page);
    await bulk(page, 'DNS', '101');
    await page.getByRole('button', { name: 'Mark 1 as DNS' }).click();
    await step('Reports › Seen after DNF / DNS — 101 was seen, so Clear DNS', async () => {
      await page.getByRole('tab', { name: 'Reports' }).click();
      await page.getByRole('button', { name: /^Seen after DNF/ }).click();
      await issue(page, 101).first().getByRole('button', { name: 'Clear DNS' }).click();
      await expect(issue(page, 101)).toHaveCount(0);
      await statusTab(page);
      await expect(page.getByTestId('out-row').filter({ hasText: '101' })).toHaveCount(0);
    });
  });

  test('an unknown bib is kept for review', async ({ page, step }) => {
    await openBase(page);
    await page.getByRole('button', { name: /^CP1,/ }).click();
    await add(page, [999]);
    await page.getByRole('button', { name: 'Log call · 0' }).click();
    await page.getByRole('button', { name: 'Next call' }).click();
    await step('Reports › Unknown bibs — Keep for review', async () => {
      await page.getByRole('tab', { name: 'Reports' }).click();
      await page.getByRole('button', { name: /^Unknown bibs/ }).click();
      await expect(issue(page, 999)).toContainText('Not in race');
      await issue(page, 999).getByRole('button', { name: 'Keep for review' }).click();
      await expect(issue(page, 999)).toHaveCount(0);
      await expect(page.getByText('All sorted')).toBeVisible();
    });
  });

  test('a report prints', async ({ page, step }) => {
    await openBase(page, { withBaseData: true });
    await page.getByRole('tab', { name: 'Reports' }).click();
    await step('Print — opens the browser print dialog for the report', async () => {
      await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed += 1; }; });
      await page.getByRole('button', { name: 'Print' }).click();
      expect(await page.evaluate(() => window.__printed)).toBe(1);
    });
  });
});

test.describe('Coverage gaps — read-out, settings, phone, accessibility', () => {
  test('read-out runs across two blocks in overs of three', async ({ page, step }) => {
    await page.setViewportSize(PHONE);
    const cpPasses = [140, 141, 142, 143].map(number => ({ cp: 3, number, minutesAgo: 22 }))
      .concat([150, 151].map(number => ({ cp: 3, number, minutesAgo: 8 })));
    await seedRace(page, BASE, { cpPasses, overSize: 3 });
    await page.goto(`${BASE}/checkpoint/3`);
    await cpTab(page, 'Callout').click();
    await page.getByRole('button', { name: 'Read out' }).click();
    const lead = page.getByText(/^(Common time|Continuing) \d\d:\d\d$/);
    const tickAll = async () => { const b = page.getByRole('checkbox'); for (let i = 0; i < await b.count(); i++) await b.nth(i).check(); };

    await step('Over 1 — "Common time" and three numbers', async () => {
      await expect(lead).toHaveText(/^Common time/);
      await expect(page.getByRole('checkbox')).toHaveCount(3);
    });
    await step('Over 2 — "Continuing" the same block, one number', async () => {
      await tickAll();
      await page.getByRole('button', { name: /base copied — next/i }).click();
      await expect(lead).toHaveText(/^Continuing/);
      await expect(page.getByRole('checkbox')).toHaveCount(1);
    });
    await step('Over 3 — the second block starts with "Common time" again', async () => {
      await tickAll();
      await page.getByRole('button', { name: /base copied — next/i }).click();
      await expect(lead).toHaveText(/^Common time/);
      await expect(page.getByRole('checkbox')).toHaveCount(2);
    });
  });

  test('settings cancel undoes the theme preview', async ({ page, step }) => {
    await page.goto(BASE);
    await page.getByRole('button', { name: 'Settings' }).click();
    await step('Pick Dark — the page previews it; Cancel puts Light back', async () => {
      await page.getByRole('button', { name: 'Dark', exact: true }).click();
      await expect(page.locator('html')).toHaveClass(/\bdark\b/);
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
    });
  });

  test('settings persist after reload', async ({ page, step }) => {
    await page.goto(BASE);
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'Dark', exact: true }).click();
    await page.getByRole('button', { name: /save changes/i }).click();
    await step('Reload — still Dark', async () => {
      await page.reload();
      await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    });
  });

  test('base overview, DNF / DNS and reports fit a phone', async ({ page, step }) => {
    await openBase(page, { withBaseData: true, viewport: PHONE });
    const noSideScroll = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

    await step('Overview at 390 px — no sideways page scroll (the leaders table scrolls in its box)', async () => {
      await page.getByRole('tab', { name: 'Overview' }).click();
      await expect(page.getByRole('heading', { name: 'Current leaders' })).toBeVisible();
      await noSideScroll();
    });
    await step('DNF / DNS at 390 px — bulk add above the out list', async () => {
      await statusTab(page);
      await noSideScroll();
      const bulkBox = await page.getByRole('heading', { name: 'Bulk add' }).boundingBox();
      const outBox = await page.getByRole('heading', { name: 'Out of the race' }).boundingBox();
      expect(outBox.y).toBeGreaterThan(bulkBox.y);
    });
    await step('Reports at 390 px — the list of reports stacks above the report', async () => {
      await page.getByRole('tab', { name: 'Reports' }).click();
      await noSideScroll();
      const nav = await page.getByRole('navigation', { name: 'Reports' }).boundingBox();
      const panel = await page.locator('section[aria-labelledby="rephd"]').boundingBox();
      expect(panel.y).toBeGreaterThanOrEqual(nav.y + nav.height);
    });
  });

  test('sheets trap focus and close on Escape', async ({ page, step }) => {
    await page.setViewportSize(PHONE);
    await seedRace(page, BASE);
    await page.goto(`${BASE}/checkpoint/3`);
    const tile = page.getByRole('button', { name: /^Runner 101,/ });
    await tile.click();
    await tile.click();
    const sheet = page.getByRole('dialog');
    await step('Tab around the edit sheet — focus never leaves it; Escape closes it', async () => {
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press('Tab');
        expect(await sheet.evaluate(el => el.contains(document.activeElement))).toBe(true);
      }
      await page.keyboard.press('Escape');
      await expect(sheet).toHaveCount(0);
    });
  });

  test('status lines are polite live regions', async ({ page, step }) => {
    await openBase(page);
    await step('Mark off, Receive, DNF / DNS and Reports status lines use aria-live="polite"', async () => {
      await page.getByRole('button', { name: /^CP1,/ }).click();
      await expect(page.getByTestId('rx-flash')).toHaveAttribute('aria-live', 'polite');
      await page.getByRole('button', { name: 'Cancel call' }).click();
      await statusTab(page);
      await expect(page.getByTestId('status-flash')).toHaveAttribute('aria-live', 'polite');
      await page.getByRole('tab', { name: 'Reports' }).click();
      await expect(page.getByTestId('reports-flash')).toHaveAttribute('aria-live', 'polite');
      await page.goto(`${BASE}/checkpoint/3`);
      await expect(page.getByTestId('markoff-status')).toHaveAttribute('aria-live', 'polite');
    });
  });

  test('overdue banner is an alert', async ({ page, step }) => {
    await openBase(page, { withBaseData: true });
    await step('CP2 reports up to now — 110–119 are overdue: the banner has role="alert"', async () => {
      await page.getByRole('button', { name: /^CP2,/ }).click();
      await page.getByRole('group', { name: 'Common time block' }).getByRole('button').last().click();
      await add(page, [150]);
      await page.getByRole('button', { name: 'Complete · 1' }).click();
      await page.getByRole('button', { name: 'Next call' }).click();
      await page.getByRole('tab', { name: 'Overview' }).click();
      await expect(page.getByRole('alert')).toContainText(/runners overdue at CP2/);
    });
  });

  test('undo bar clears itself after about six seconds', async ({ page, step }) => {
    await page.setViewportSize(PHONE);
    await seedRace(page, BASE);
    await page.goto(`${BASE}/checkpoint/3`);
    const tile = page.getByRole('button', { name: /^Runner 101,/ });
    await tile.click();
    await tile.click();
    await page.getByRole('button', { name: 'Unmark runner' }).click();
    await step('Unmark — Undo shows, then goes by itself', async () => {
      const undo = page.getByRole('button', { name: 'Undo' });
      await expect(undo).toBeVisible();
      await page.waitForTimeout(5000);
      await expect(undo).toBeVisible();
      await expect(undo).toBeHidden({ timeout: 2500 });
    });
  });
});
