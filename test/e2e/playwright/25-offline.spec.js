/**
 * Offline (A6) — runs with playwright.offline.config.js: service workers
 * allowed, production preview build. The app must work with no signal.
 *   1. The service worker takes control; reload.
 *   2. Offline reload → Home renders; Montserrat and Inter load from the precache.
 *   3. Checkpoint mark off offline survives an offline reload.
 *   4. Base Receive: a call in progress survives an offline reload.
 */
import { test, expect } from '@playwright/test';
import { seedRace } from '../../../scripts/ui-validation/seed.mjs';

const BASE = 'http://localhost:4175';

test.describe.configure({ mode: 'serial' });

test('the app starts, marks off and keeps a base call with no signal', async ({ page, context }) => {
  await test.step('Online first visit — service worker takes control', async () => {
    await seedRace(page, BASE, { withBaseData: true });
    await page.goto(BASE);
    await page.waitForFunction(() => !!navigator.serviceWorker?.controller, null, { timeout: 30000 });
    await page.reload();
    await page.waitForFunction(() => !!navigator.serviceWorker?.controller);
    await expect(page.getByRole('heading', { name: 'RaceTracker' })).toBeVisible();
  });

  await test.step('Offline reload — Home renders with the brand fonts from the precache', async () => {
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'RaceTracker' })).toBeVisible();
    const fonts = await page.evaluate(async () => {
      await Promise.all([document.fonts.load('800 16px Montserrat'), document.fonts.load('400 16px Inter')]);
      return [document.fonts.check('800 16px Montserrat'), document.fonts.check('400 16px Inter')];
    });
    expect(fonts).toEqual([true, true]);
  });

  await test.step('Offline — CP3 mark off, reload offline, still marked', async () => {
    await page.goto(`${BASE}/checkpoint/3`);
    const tile = page.getByRole('button', { name: /^Runner 101,/ });
    await tile.click();
    await expect(tile).toHaveAccessibleName(/^Runner 101, \d\d:\d\d$/);
    await page.reload();
    await expect(page.getByRole('button', { name: /^Runner 101,/ })).toHaveAccessibleName(/^Runner 101, \d\d:\d\d$/);
  });

  await test.step('Offline — Base Receive keeps a call in progress through a reload', async () => {
    await page.goto(`${BASE}/base-station/operations`);
    await page.getByRole('button', { name: /^CP2,/ }).click();
    for (const n of [110, 111, 112]) {
      await page.fill('#bib-heard', String(n));
      await page.keyboard.press('Enter');
    }
    const selected = (await page.getByRole('group', { name: 'Common time block' }).locator('[aria-pressed="true"]').innerText()).match(/\d\d:\d\d/)[0];
    await page.reload();
    const chips = page.getByTestId('rx-numbers').getByRole('button');
    await expect(chips).toHaveCount(3);
    await expect(page.getByRole('group', { name: 'Common time block' }).locator('[aria-pressed="true"]')).toContainText(selected);
  });
});
