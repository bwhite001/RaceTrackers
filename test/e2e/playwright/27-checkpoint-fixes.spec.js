/**
 * Checkpoint fixes from the UI validation (Phase B — B1 to B6).
 * Uses the validation pack's Mt Glorious race: CP3 England Creek Rd & Joyners
 * Ridge Rd, VK4PMC, base VK4WIP on 147.225, bibs 100–159.
 */
import { test, expect } from './fixtures.js';
import { seedRace } from '../../../scripts/ui-validation/seed.mjs';

const BASE = 'http://localhost:3000';
const PHONE = { width: 390, height: 844 };

const tabs = (page) => page.getByRole('navigation', { name: 'Checkpoint tabs' });
const tab = (page, name) => tabs(page).getByRole('button', { name: new RegExp(`^${name}`) });
const tile = (page, n) => page.getByRole('button', { name: new RegExp(`^Runner ${n},`) });
const sheet = (page) => page.getByRole('dialog');
const fits = (loc) => loc.evaluate(el => el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight);

const openCp3 = async (page) => {
  await page.setViewportSize(PHONE);
  await seedRace(page, BASE);
  await page.goto(`${BASE}/checkpoint/3`);
  await expect(tile(page, 100)).toBeVisible({ timeout: 15000 });
};

const markDnsInOverview = async (page, n) => {
  await tab(page, 'Overview').click();
  await page.getByRole('button', { name: new RegExp(`^${n} `) }).click();
  await page.getByRole('button', { name: 'Mark DNS' }).click();
  await tab(page, 'Mark off').click();
};

test.describe('Checkpoint fixes', () => {
  test('header shows callsign and frequency in full', async ({ page, step }) => {
    await openCp3(page);

    await step('Mark off — location and callsign wrap to two lines rather than cut off', async () => {
      const sub = page.getByText('England Creek Rd & Joyners Ridge Rd · VK4PMC');
      await expect(sub).toBeInViewport();
      expect(await fits(sub)).toBe(true);
    });

    await step('Callout — "CP3 · Callout", VK4PMC → VK4WIP · 147.225', async () => {
      await tab(page, 'Callout').click();
      await expect(page.getByRole('heading', { name: 'CP3 · Callout' })).toBeVisible();
      const sub = page.getByText('VK4PMC → VK4WIP · 147.225');
      await expect(sub).toBeInViewport();
      expect(await fits(sub)).toBe(true);
    });

    await step('Overview — "CP3 · Overview"; the tap hint heads the list', async () => {
      await tab(page, 'Overview').click();
      await expect(page.getByRole('heading', { name: 'CP3 · Overview' })).toBeVisible();
      await expect(page.getByText('Tap a runner to fix it')).toBeVisible();
    });
  });

  test('share batch lives in the app bar and covers no tiles', async ({ page, step }) => {
    await openCp3(page);

    await step('Five runners passed — Share batch shows the count in the app bar', async () => {
      for (const n of [100, 101, 102, 103, 104]) await tile(page, n).click();
      await expect(page.getByRole('button', { name: 'Share batch, 5 runners' })).toBeVisible();
    });

    await step('Bottom-right tile 119 is clickable at 390 × 844', async () => {
      await tile(page, 119).click();
      await expect(tile(page, 119)).toHaveAccessibleName(/^Runner 119, \d\d:\d\d$/);
    });
  });

  test('status line stays in view while the grid scrolls', async ({ page, step }) => {
    await openCp3(page);
    await markDnsInOverview(page, 119);

    await step('Scroll the grid to the bottom and tap a DNS runner — the message is on screen', async () => {
      await page.locator("main[data-screenshot-target]").evaluate(el => { el.scrollTop = el.scrollHeight; });
      await tile(page, 119).click();
      await expect(page.getByTestId('markoff-status')).toHaveText('119 is DNS — change it in Overview');
      await expect(page.getByTestId('markoff-status')).toBeInViewport();
      await expect(page.locator('#quick-entry-input')).toBeInViewport();
    });
  });

  test('stepper back to the original time reads Keep time', async ({ page, step }) => {
    await openCp3(page);
    // Mark early in a minute: the clamp-to-now step must land in the same minute
    await page.waitForFunction(() => new Date().getSeconds() < 30, null, { timeout: 35000, polling: 500 });
    await tile(page, 101).click();
    await tile(page, 101).click();

    await step('−5 then +5 — "Keep time", no "Was" note', async () => {
      await sheet(page).getByLabel('5 minutes earlier').click();
      await expect(sheet(page).getByText(/^Was /)).toBeVisible();
      await sheet(page).getByLabel('5 minutes later').click();
      await expect(sheet(page).getByRole('button', { name: 'Keep time' })).toBeVisible();
      await expect(sheet(page).getByText(/^Was /)).toHaveCount(0);
    });

    await step('+5 at now clamps to now in the same minute — still "Keep time"', async () => {
      await sheet(page).getByLabel('5 minutes later').click();
      await expect(sheet(page).getByRole('button', { name: 'Keep time' })).toBeVisible();
    });
  });

  test('overview bar keeps DNS muted and labels each part', async ({ page, step }) => {
    await openCp3(page);
    await markDnsInOverview(page, 150);

    await step('Overview — bar aria-label lists DNS and DNF separately; DNS is not red', async () => {
      await tab(page, 'Overview').click();
      await expect(page.getByRole('img', { name: /called in, / })).toHaveAccessibleName('0 called in, 0 passed not called in, 59 to come, 1 DNS, 0 DNF');
      const dnsBg = await page.getByTestId('bar-dns').evaluate(el => getComputedStyle(el).backgroundColor);
      expect(dnsBg).toBe('rgba(0, 0, 0, 0)');
      await expect(page.getByTestId('bar-dns')).toHaveCSS('border-top-style', 'dashed');
    });
  });

  test('official message has the WICEN fields and a log', async ({ page, step }) => {
    await openCp3(page);
    await tab(page, 'Callout').click();
    const dialog = page.getByRole('dialog');

    await step('Official message — date prefilled (en-AU); Log is locked until originator and message are in', async () => {
      await page.getByRole('button', { name: 'Official message' }).click();
      await expect(dialog.getByLabel('Date')).toHaveValue(/^\d\d\/\d\d\/\d{4}$/);
      await dialog.getByLabel('Message').fill('Request extra water at CP3');
      await expect(dialog.getByRole('button', { name: 'Log message' })).toBeDisabled();
      await dialog.getByLabel(/^Originator/).fill('Sue Smith, CP3 marshal');
      await dialog.getByLabel('Signed by originator').check();
      await dialog.getByRole('button', { name: 'Log message' }).click();
      await expect(page.getByText(/^Message 1 logged at \d\d:\d\d$/)).toBeVisible();
    });

    await step('Open it again — the checkpoint log lists the message with its fields', async () => {
      await page.getByRole('button', { name: 'Official message' }).click();
      await expect(dialog.getByRole('heading', { name: 'Official message 2' })).toBeVisible();
      const log = dialog.getByTestId('checkpoint-log');
      await expect(log).toContainText(/Message 1 · \d\d:\d\d · to VK4WIP/);
      await expect(log).toContainText('Sue Smith, CP3 marshal · signed');
      await expect(log).toContainText('Request extra water at CP3');
    });
  });

  test('overview stepper is a draft until Save', async ({ page, step }) => {
    await openCp3(page);
    await tile(page, 101).click();
    await tab(page, 'Callout').click();
    await page.getByRole('button', { name: /base copied — mark sent/i }).click();
    await tab(page, 'Overview').click();
    const row = page.getByRole('button', { name: /^101 / });
    const before = (await row.innerText()).match(/\d\d:\d\d/)[0];

    await step('−5 then +5 — nothing to save, still called in', async () => {
      await row.click();
      await page.getByLabel('5 minutes earlier').click();
      await expect(page.getByRole('button', { name: /^Save \d\d:\d\d$/ })).toBeVisible();
      await page.getByLabel('5 minutes later').click();
      await expect(page.getByRole('button', { name: /^Save / })).toHaveCount(0);
      await expect(row).toContainText('Called in');
      await expect(row).toContainText(before);
    });

    await step('−5 and Save — saved once (a correction: new block); Undo restores it exactly', async () => {
      await page.getByLabel('5 minutes earlier').click();
      await page.getByRole('button', { name: /^Save \d\d:\d\d$/ }).click();
      await expect(row).toContainText('Correction');
      await expect(row).not.toContainText(before);
      await page.getByRole('button', { name: 'Undo' }).click();
      await expect(row).toContainText('Called in');
      await expect(row).toContainText(before);
      await expect(row).not.toContainText('Correction');
    });
  });
});
