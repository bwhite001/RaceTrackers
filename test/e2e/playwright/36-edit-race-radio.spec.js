/**
 * The race frequency can be edited after setup, and re-importing an edited
 * setup on a device holding marks keeps them. Callsigns aren't tracked: a race
 * saved with them (the seed has some) shows none.
 */
import fs from 'fs';
import { test, expect } from './fixtures.js';
import { seedRace } from '../../../scripts/ui-validation/seed.mjs';

const BASE = 'http://localhost:3000';
const PHONE = { width: 390, height: 844 };

const tab = (page, name) => page.getByRole('navigation', { name: 'Checkpoint tabs' }).getByRole('button', { name: new RegExp(`^${name}`) });
const tile = (page, n) => page.getByRole('button', { name: new RegExp(`^Runner ${n},`) });

const editFrequency = async (page, raceId, frequency) => {
  await page.goto(`${BASE}/race-maintenance/edit?raceId=${raceId}`);
  // Wait for the race to load into the form, or the load overwrites what we type (slow CI)
  await expect(page.getByRole('textbox', { name: /race name/i })).not.toHaveValue('');
  await page.locator('#frequency').fill(frequency);
  await page.getByRole('button', { name: /next/i }).click();
  // Next saves, then shows the checkpoints: don't navigate away mid-save
  await expect(page.getByRole('textbox', { name: 'Checkpoint 1 name' })).toBeVisible();
};

test.describe('Edit race radio details', () => {
  test('race edit changes frequency', async ({ page, step }) => {
    await page.setViewportSize(PHONE);
    const raceId = await seedRace(page, BASE);

    await step('Edit race — set the frequency; there is no callsign field', async () => {
      await editFrequency(page, raceId, '147.175');
      await expect(page.getByLabel(/operators/i)).toHaveCount(0);
      await page.getByRole('button', { name: /back/i }).first().click();
      await expect(page.locator('#baseCallsign')).toHaveCount(0);
    });

    await step('Callout — the new frequency, and no callsigns anywhere on the checkpoint', async () => {
      await page.goto(`${BASE}/checkpoint/1`);
      await expect(tile(page, 100)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(/VK4/)).toHaveCount(0);
      await tab(page, 'Callout').click();
      await expect(page.getByText('147.175', { exact: true })).toBeVisible();
      await expect(page.getByText(/VK4/)).toHaveCount(0);
    });

    await step('Base — the board names checkpoints without callsigns', async () => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(`${BASE}/base-station/operations`);
      await expect(page.getByRole('heading', { name: /who's calling/i })).toBeVisible({ timeout: 15000 });
      await expect(page.getByRole('button', { name: /^CP1,/ })).not.toContainText('VK4');
      await expect(page.getByTestId('board-CP1')).not.toContainText('VK4');
    });
  });

  test('an edited setup keeps marks already on a device', async ({ page, step }) => {
    await page.setViewportSize(PHONE);
    const raceId = await seedRace(page, BASE);
    let setup;

    await step('Mark bib 100 at checkpoint 1', async () => {
      await page.goto(`${BASE}/checkpoint/1`);
      await tile(page, 100).click();
      await expect(tile(page, 100)).toHaveAccessibleName(/^Runner 100, \d\d:\d\d$/);
    });

    await step('Edit the frequency, then download the setup', async () => {
      await editFrequency(page, raceId, '147.175');
      await page.goto(BASE);
      await page.getByRole('button', { name: 'Settings' }).click();
      await page.getByRole('button', { name: /share or import race config/i }).click();
      await page.evaluate(() => { navigator.canShare = undefined; window.open = () => null; });
      const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Email' }).click()]);
      setup = fs.readFileSync(await dl.path(), 'utf8');
      expect(JSON.parse(setup).data.races[0].frequency).toBe('147.175');
    });

    await step('Import the setup on the same device, updating the existing race', async () => {
      await editFrequency(page, raceId, '146.500'); // so we can see the import apply
      await page.goto(`${BASE}/race-management`);
      await page.getByRole('button', { name: /import race/i }).first().click();
      const dialog = page.getByRole('dialog', { name: /import.*export/i });
      await dialog.getByRole('button', { name: /import configuration/i }).click();
      await dialog.locator('input[type="file"]').setInputFiles({ name: 'race-setup.json', mimeType: 'application/json', buffer: Buffer.from(setup) });
      await expect(dialog.getByText(/file loaded successfully/i)).toBeVisible();
      await dialog.locator('button.btn-primary').click();
      await expect(page.getByRole('heading', { name: 'Resolve Import Conflicts' })).toBeVisible();
      await page.getByRole('button', { name: 'Use incoming for all' }).click();
      await page.getByRole('button', { name: /^Import \(/ }).click();
      await expect(dialog).toBeHidden({ timeout: 15000 });
    });

    await step('Checkpoint 1 — runner 100 still shows its time', async () => {
      await page.goto(`${BASE}/checkpoint/1`);
      await expect(tile(page, 100)).toHaveAccessibleName(/^Runner 100, \d\d:\d\d$/, { timeout: 15000 });
      await tab(page, 'Callout').click();
      await expect(page.getByText('147.175', { exact: true })).toBeVisible(); // the imported setup did apply
      await expect(page.getByText(/VK4/)).toHaveCount(0); // its callsigns aren't shown
    });
  });
});
