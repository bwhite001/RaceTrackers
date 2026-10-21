/**
 * Styling and palette (validation Phase C — C1, C3 to C7; C2 is a unit test).
 * Computed-style assertions plus screenshots for the guide.
 */
import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './fixtures.js';
import { seedRace } from '../../../scripts/ui-validation/seed.mjs';

const BASE = 'http://localhost:3000';
const PHONE = { width: 390, height: 844 };

const tab = (page, name) => page.getByRole('navigation', { name: 'Checkpoint tabs' }).getByRole('button', { name: new RegExp(`^${name}`) });
const dashed = (loc) => expect(loc).toHaveCSS('border-top-style', 'dashed');

const setTheme = async (page, theme) => {
  await page.goto(BASE);
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: theme, exact: true }).click();
  await page.getByRole('button', { name: /save changes/i }).click();
};

const contrastViolations = async (page) => {
  const { violations } = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
  return violations.flatMap(v => v.nodes.map(n => `${n.target.join(' ')} — ${n.any[0]?.message ?? ''}`));
};

test.describe('Visual checks', () => {
  test('locked buttons look locked', async ({ page, step }) => {
    await page.setViewportSize(PHONE);
    await seedRace(page, BASE);

    await step('Mark off — Mark is locked until a number is typed', async () => {
      await page.goto(`${BASE}/checkpoint/3`);
      const mark = page.getByRole('form', { name: 'Quick runner entry' }).getByRole('button');
      await expect(mark).toBeDisabled();
      await dashed(mark);
    });

    await step('Read-out — Next is locked until every number is ticked', async () => {
      await expect(page.getByRole('button', { name: /^Runner 100,/ })).toBeVisible();
      await page.fill('#quick-entry-input', '100, 101, 102');
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('markoff-status')).toContainText('3 runners marked');
      await tab(page, 'Callout').click();
      await page.getByRole('button', { name: 'Read out' }).click();
      const next = page.getByRole('button', { name: /^Tick each number as you read/ });
      await expect(next).toBeDisabled();
      await dashed(next);
    });

    await step('Share race — Show full screen is locked when the race is too big for one QR', async () => {
      await page.goto(BASE);
      await page.getByRole('button', { name: 'Settings' }).click();
      await page.getByRole('button', { name: /share or import race config/i }).click();
      const full = page.getByRole('button', { name: /full screen/i });
      await expect(full).toBeDisabled();
      await dashed(full);
    });

    await step('Base Receive — Complete and At now are locked with nothing to send', async () => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(`${BASE}/base-station/operations`);
      await page.getByRole('button', { name: /^CP1,/ }).click();
      await page.getByRole('group', { name: 'Common time block' }).getByRole('button').last().click();
      for (const name of [/^Complete · 0$/, /^At now$/]) {
        const b = page.getByRole('button', { name });
        await expect(b).toBeDisabled();
        await dashed(b);
      }
    });

    await step('DNF / DNS — "Add numbers to mark" is locked', async () => {
      await page.getByRole('button', { name: 'Cancel call' }).click();
      await page.getByRole('tab', { name: 'DNF / DNS' }).click();
      const b = page.getByRole('button', { name: 'Add numbers to mark' });
      await expect(b).toBeDisabled();
      await dashed(b);
    });
  });

  test('dark mode passes colour contrast', async ({ page, step }) => {
    await page.setViewportSize(PHONE);
    await seedRace(page, BASE);

    await step('Settings in Dark — no contrast failures (labels, links, swatches)', async () => {
      await page.goto(BASE);
      await page.getByRole('button', { name: 'Settings' }).click();
      await page.getByRole('button', { name: 'Dark', exact: true }).click();
      await expect(page.locator('html')).toHaveClass(/\bdark\b/);
      expect(await contrastViolations(page)).toEqual([]);
      await page.getByRole('button', { name: /save changes/i }).click();
    });

    await step('Mark off in Dark — no contrast failures', async () => {
      await page.goto(`${BASE}/checkpoint/3`);
      await expect(page.getByRole('button', { name: /^Runner 100,/ })).toBeVisible();
      await expect(page.locator('html')).toHaveClass(/\bdark\b/);
      expect(await contrastViolations(page)).toEqual([]);
    });
  });

  test('sunlight on the working screens', async ({ page, step }) => {
    await page.setViewportSize(PHONE);
    await seedRace(page, BASE);
    await setTheme(page, 'Sunlight');
    const white = async () => {
      await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
      await expect(page.locator('main[data-screenshot-target], [data-screenshot-target]').first()).toHaveCSS('background-color', /rgba?\((255, 255, 255|0, 0, 0, 0)/);
    };

    await step('Mark off in Sunlight — white page, 2px tile borders', async () => {
      await page.goto(`${BASE}/checkpoint/3`);
      await expect(page.getByRole('button', { name: /^Runner 100,/ })).toBeVisible();
      await page.fill('#quick-entry-input', '100, 101, 102');
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('markoff-status')).toContainText('3 runners marked');
      await white();
      await expect(page.getByRole('button', { name: /^Runner 110,/ })).toHaveCSS('border-top-width', '2px');
    });

    await step('Callout in Sunlight', async () => {
      await tab(page, 'Callout').click();
      await white();
    });

    await step('Read-out in Sunlight', async () => {
      await page.getByRole('button', { name: 'Read out' }).click();
      await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    });

    await step('Base Receive in Sunlight', async () => {
      await page.setViewportSize({ width: 1112, height: 834 });
      await page.goto(`${BASE}/base-station/operations`);
      await page.getByRole('button', { name: /^CP1,/ }).click();
      await white();
    });
  });

  test('race setup fits a phone', async ({ page, step }) => {
    await page.setViewportSize(PHONE);
    await page.goto(`${BASE}/race-maintenance/setup`);

    await step('Runner setup at 390 px — the range row fits; Back and Next on one line', async () => {
      await page.locator('button').filter({ hasText: 'Start from Scratch' }).first().click();
      await page.fill('#name', 'Phone Setup Race');
      await page.fill('#date', '2026-11-08');
      await page.fill('#startTime', '06:30');
      await page.getByRole('button', { name: /next/i }).click();
      await page.waitForSelector('#min');
      await page.fill('#min', '100');
      await page.fill('#max', '159');
      await page.getByRole('button', { name: /add range/i }).click();
      await expect(page.getByRole('button', { name: /^Remove range 100-159$/ })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
      for (const name of ['Back', 'Next: Waves']) {
        const box = await page.getByRole('button', { name, exact: true }).boundingBox();
        expect(box.height).toBeLessThan(60);
      }
    });
  });

  test('footer names the club', async ({ page, step }) => {
    await step('Footer — "Ipswich & District Radio Club · VK4WIP"', async () => {
      await page.goto(`${BASE}/race-maintenance/setup`);
      await expect(page.getByRole('contentinfo')).toContainText('Ipswich & District Radio Club · VK4WIP');
      await expect(page.getByRole('contentinfo')).not.toContainText('VK4WIP Radio Club');
    });
  });

  test('mt glorious template matches the brief', async ({ page, step }) => {
    await step('Template — Mt Glorious starts at 06:30 with four checkpoints; bibs 1–128 as before', async () => {
      await page.goto(`${BASE}/race-maintenance/setup`);
      const card = page.getByRole('button', { name: /Mt Glorious Mountain Trail/ });
      await expect(card).toContainText('Start 06:30');
      await expect(card).toContainText('4 checkpoints');
      await expect(card).toContainText('1–128');
      await card.click();
      await expect(page.locator('#startTime')).toHaveValue('06:30');
    });
  });
});
