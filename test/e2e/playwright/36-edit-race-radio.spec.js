/**
 * Rehearsal fix 8: operators, frequency and base callsign can be edited after
 * setup, and re-importing the edited setup on a device holding marks keeps them.
 */
import fs from 'fs';
import { test, expect } from './fixtures.js';
import { seedRace } from '../../../scripts/ui-validation/seed.mjs';

const BASE = 'http://localhost:3000';
const PHONE = { width: 390, height: 844 };

const tab = (page, name) => page.getByRole('navigation', { name: 'Checkpoint tabs' }).getByRole('button', { name: new RegExp(`^${name}`) });
const tile = (page, n) => page.getByRole('button', { name: new RegExp(`^Runner ${n},`) });

const editRadio = async (page, raceId, { frequency, operators }) => {
  await page.goto(`${BASE}/race-maintenance/edit?raceId=${raceId}`);
  await page.locator('#frequency').fill(frequency);
  await page.getByRole('button', { name: /next/i }).click();
  if (operators) {
    await page.getByLabel('Operators for CP1').fill(operators);
    await page.getByRole('button', { name: 'Save operators CP1' }).click();
    // saved when the field reads back, normalised, after a reload
    await page.reload();
    await page.getByRole('button', { name: /next/i }).click();
    await expect(page.getByLabel('Operators for CP1')).toHaveValue(operators.toUpperCase());
  }
};

test.describe('Edit race radio details', () => {
  test('race edit changes operators and frequency', async ({ page, step }) => {
    await page.setViewportSize(PHONE);
    const raceId = await seedRace(page, BASE);

    await step('Edit race — set the frequency, then the operators for CP1', async () => {
      await editRadio(page, raceId, { frequency: '147.175', operators: 'vk4abc, vk4def' });
      await expect(page.getByLabel('Operators for CP1')).toHaveValue('VK4ABC, VK4DEF');
    });

    await step('Checkpoint 1 — the new operator shows in the header', async () => {
      await page.goto(`${BASE}/checkpoint/1`);
      await expect(page.getByText('VK4ABC').first()).toBeVisible({ timeout: 15000 });
    });

    await step('Callout — "VK4ABC → VK4WIP · 147.175"', async () => {
      await tab(page, 'Callout').click();
      await expect(page.getByText('VK4ABC → VK4WIP · 147.175')).toBeVisible();
    });
  });

  test('unsaved operators survive saving another row and Next', async ({ page, step }) => {
    await page.setViewportSize(PHONE);
    const raceId = await seedRace(page, BASE);
    const ops = (n) => page.getByLabel(`Operators for CP${n}`);

    await step('Type operators into CP1 and CP2, save only CP1 — CP2 keeps its text', async () => {
      await page.goto(`${BASE}/race-maintenance/edit?raceId=${raceId}`);
      await page.getByRole('button', { name: /next/i }).click();
      await ops(1).fill('vk4aaa');
      await ops(2).fill('vk4bbb vk4ccc');
      await page.getByRole('button', { name: 'Save operators CP1' }).click();
      await expect(ops(1)).toHaveValue('VK4AAA');
      await expect(ops(2)).toHaveValue('vk4bbb vk4ccc');
    });

    await step('A typed checkpoint name survives saving operators on another row', async () => {
      await page.getByLabel('Checkpoint 2 name').fill('Renamed Two');
      await ops(1).fill('vk4ddd');
      await page.getByRole('button', { name: 'Save operators CP1' }).click();
      await expect(ops(1)).toHaveValue('VK4DDD');
      await expect(page.getByLabel('Checkpoint 2 name')).toHaveValue('Renamed Two');
    });

    await step('Next saves CP2 too — both survive a reload', async () => {
      await page.getByRole('button', { name: /next/i }).click();
      await expect(page.getByRole('heading', { name: 'Runner Roster', exact: true })).toBeVisible();
      await page.reload();
      await page.getByRole('button', { name: /next/i }).click();
      await expect(ops(1)).toHaveValue('VK4DDD');
      await expect(ops(2)).toHaveValue('VK4BBB, VK4CCC');
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
      await editRadio(page, raceId, { frequency: '147.175' });
      await page.goto(BASE);
      await page.getByRole('button', { name: 'Settings' }).click();
      await page.getByRole('button', { name: /share or import race config/i }).click();
      await page.evaluate(() => { navigator.canShare = undefined; window.open = () => null; });
      const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Email' }).click()]);
      setup = fs.readFileSync(await dl.path(), 'utf8');
      expect(JSON.parse(setup).data.races[0].frequency).toBe('147.175');
    });

    await step('Import the setup on the same device, updating the existing race', async () => {
      await editRadio(page, raceId, { frequency: '146.500' }); // so we can see the import apply
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
      await expect(page.getByText(/→ VK4WIP · 147\.175/)).toBeVisible(); // the imported setup did apply
    });
  });
});
