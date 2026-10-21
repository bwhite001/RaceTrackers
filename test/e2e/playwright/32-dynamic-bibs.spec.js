/**
 * Race-day fixes Part B — bibs can change on the day. A number not in the
 * setup is recorded (flagged) instead of vanishing.
 */
import { test, expect } from './fixtures.js';
import { seedRace } from '../../../scripts/ui-validation/seed.mjs';

const BASE = 'http://localhost:3000';
const PHONE = { width: 390, height: 844 };
const tab = (page, name) => page.getByRole('navigation', { name: 'Checkpoint tabs' }).getByRole('button', { name: new RegExp(`^${name}`) });
/** Home → role card → choose the race (as an operator would). */
const pickRace = async (page, role) => {
  await page.goto(BASE);
  await page.getByRole('button', { name: role }).click();
  await page.getByRole('dialog').locator('button').filter({ hasText: 'On The Day Race' }).first().click();
};
const add = async (page, nums) => { for (const n of nums) { await page.fill('#bib-heard', String(n)); await page.keyboard.press('Enter'); } };

test.describe('Dynamic bibs', () => {
  test('checkpoint marks a bib not in the setup', async ({ page, step }) => {
    await page.setViewportSize(PHONE);
    await seedRace(page, BASE);
    await page.goto(`${BASE}/checkpoint/3`);
    await expect(page.getByRole('button', { name: /^Runner 100,/ })).toBeVisible({ timeout: 15000 });

    await step('Quick entry 512 — marked, flagged "not in setup", in its own group', async () => {
      await page.fill('#quick-entry-input', '512');
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('markoff-status')).toHaveText(/^512 marked at \d\d:\d\d · not in setup$/);
      await expect(page.getByRole('button', { name: /^Runner 512, \d\d:\d\d, not in setup$/ })).toBeVisible();
      await expect(page.getByRole('button', { name: '512–512' })).toBeVisible();
    });

    await step('Callout — 512 is read like any other runner', async () => {
      await tab(page, 'Callout').click();
      await expect(page.getByTestId('pending-block')).toContainText('512');
    });

    await step('A five-digit number asks first; Undo removes 512', async () => {
      await tab(page, 'Mark off').click();
      await page.fill('#quick-entry-input', '51212');
      await page.keyboard.press('Enter');
      await expect(page.getByRole('alertdialog', { name: 'Check the number' })).toContainText('Mark 51212? It isn\'t in the setup.');
      await page.getByRole('button', { name: 'Cancel' }).click();
      await page.fill('#quick-entry-input', '513');
      await page.keyboard.press('Enter');
      await page.getByRole('button', { name: 'Undo' }).click();
      await expect(page.getByRole('button', { name: /^Runner 513,/ })).toHaveCount(0);
      await expect(page.getByRole('button', { name: /^Runner 512,/ })).toBeVisible();
    });
  });

  test('base records a late entry and adds an unknown bib to the field', async ({ page, step }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await seedRace(page, BASE);
    await page.goto(`${BASE}/base-station/operations`);
    await expect(page.getByRole('heading', { name: /who's calling/i })).toBeVisible({ timeout: 15000 });

    await step('CP1 call with 512 and 999 — gold "Not in setup — tap to record"', async () => {
      await page.getByRole('button', { name: /^CP1,/ }).click();
      await add(page, [512, 999]);
      const chip = page.getByRole('button', { name: 'Record 512, not in setup' });
      await expect(chip).toHaveCSS('border-top-color', 'rgb(212, 175, 55)');
      await expect(page.getByRole('button', { name: 'Log call · 0' })).toBeVisible();
    });

    await step('Tap 512 — recorded as a late entry; 999 left skipped', async () => {
      await page.getByRole('button', { name: 'Record 512, not in setup' }).click();
      await expect(page.getByRole('button', { name: 'Remove 512, Late entry' })).toBeVisible();
      await page.getByRole('button', { name: 'Complete · 1' }).click();
      await page.getByRole('button', { name: 'Next call' }).click();
      await page.getByRole('tab', { name: 'Reports' }).click();
      await page.getByRole('button', { name: /^Times by checkpoint/ }).click();
      await expect(page.getByRole('row').filter({ hasText: /^512/ })).toContainText(/\d\d:\d\d/);
    });

    await step('Needs attention › Unknown bibs — 999 › Add to field', async () => {
      await page.getByRole('button', { name: /^Unknown bibs/ }).click();
      const row = page.getByTestId('issue-row').filter({ hasText: /^999/ });
      await expect(row).toContainText('Not in setup');
      await row.getByRole('button', { name: 'Add to field' }).click();
      await expect(page.getByText('All sorted')).toBeVisible();
      await page.getByRole('button', { name: /^Times by checkpoint/ }).click();
      await expect(page.getByRole('row').filter({ hasText: /^999/ })).toContainText(/\d\d:\d\d/);
    });
  });

  test('a race with bibs assigned on the day', async ({ page, step }) => {
    await page.setViewportSize(PHONE);
    await page.goto(`${BASE}/race-maintenance/setup`);

    await step('Setup — tick "Bibs assigned on the day": Next works with no runners', async () => {
      await page.locator('button').filter({ hasText: 'Start from Scratch' }).first().click();
      await page.fill('#name', 'On The Day Race');
      await page.fill('#date', '2026-11-08');
      await page.fill('#startTime', '06:30');
      await page.getByRole('button', { name: /next/i }).click();
      await expect(page.getByRole('button', { name: 'Next: Waves' })).toBeDisabled();
      await page.getByLabel(/Bibs assigned on the day/).check();
      await page.getByRole('button', { name: 'Next: Waves' }).click();
      await page.getByRole('button', { name: /^Next: Course Map/ }).click();
      await page.getByRole('button', { name: 'Skip for now' }).click();
      await page.waitForURL(/race-maintenance\/overview/);
      const race = await page.evaluate(async () => {
        const db = await new Promise((res) => { const r = indexedDB.open('RaceTrackerDB'); r.onsuccess = e => res(e.target.result); });
        const get = (store) => new Promise((res) => { const q = db.transaction(store).objectStore(store).getAll(); q.onsuccess = () => res(q.result); });
        const races = await get('races');
        const r = races.find(x => x.name === 'On The Day Race');
        return { id: r.id, bibsOnTheDay: r.bibsOnTheDay, runners: (await get('runners')).filter(x => x.raceId === r.id).length };
      });
      expect(race).toMatchObject({ bibsOnTheDay: true, runners: 0 });
    });

    await step('Checkpoint — empty grid with a hint; Still to come "—"; quick entry creates tiles', async () => {
      await pickRace(page, /^checkpoint\b/i);
      await expect(page.getByTestId('empty-field-hint')).toHaveText('Type each number as runners pass.');
      await expect(page.locator('header').getByText('Still to come').locator('..')).toContainText('—');
      await page.fill('#quick-entry-input', '7, 23');
      await page.keyboard.press('Enter');
      await expect(page.getByRole('button', { name: /^Runner 7, \d\d:\d\d, not in setup$/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /^Runner 23,/ })).toBeVisible();
    });

    await step('Base — On course and not seen yet show "—"', async () => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await pickRace(page, /^base station\b/i);
      await page.getByRole('tab', { name: 'Overview' }).click();
      await expect(page.getByTestId('tile-on-course')).toContainText('—');
      await expect(page.getByTestId('tile-on-course')).toContainText('— not seen yet');
    });
  });

  test('the Mt Glorious template has no fixed bib range', async ({ page, step }) => {
    await step('Template card — "Bibs set at setup"; choosing it starts the runner step empty', async () => {
      await page.goto(`${BASE}/race-maintenance/setup`);
      const card = page.getByRole('button', { name: /Mt Glorious Mountain Trail/ });
      await expect(card).toContainText('Bibs set at setup');
      await card.click();
      await page.fill('#date', '2026-11-08');
      await page.getByRole('button', { name: /next/i }).click();
      await expect(page.getByRole('button', { name: /^Remove range/ })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Next: Waves' })).toBeDisabled();
    });
  });
});
