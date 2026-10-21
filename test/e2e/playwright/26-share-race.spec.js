/**
 * Share race by email (validation Phase A — A7): the setup travels as a file,
 * the email stays short, and import judges the file by its content.
 */
import fs from 'fs';
import { test, expect } from './fixtures.js';
import { seedRace, goHome, clearAppData } from './helpers.js';

const RACE = { name: 'Share Race', numCheckpoints: 3, runnerRange: { min: 100, max: 109 } };

const openShare = async (page) => {
  await goHome(page);
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: /share or import race config/i }).click();
  await expect(page.getByRole('heading', { name: /scan to load this race/i })).toBeVisible();
};

/** Tap Email with no Web Share: returns the downloaded file's text and the mailto: opened. */
const shareByEmail = async (page) => {
  await page.evaluate(() => {
    navigator.canShare = undefined;
    window.__opened = [];
    window.open = (url) => { window.__opened.push(url); return null; };
  });
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Email' }).click()]);
  return { name: dl.suggestedFilename(), text: fs.readFileSync(await dl.path(), 'utf8'), mailto: (await page.evaluate(() => window.__opened))[0] };
};

test.describe('Share race', () => {
  test('email share stays short', async ({ page, step }) => {
    await seedRace(page, RACE);
    await openShare(page);

    await step('Email — the setup file downloads and a short email opens', async () => {
      const { name, text, mailto } = await shareByEmail(page);
      expect(name).toBe('race-setup-Share-Race.json');
      expect(mailto.startsWith('mailto:')).toBe(true);
      expect(mailto.length).toBeLessThanOrEqual(1800);
      expect(decodeURIComponent(mailto)).toContain(name);
      const pkg = JSON.parse(text);
      expect(pkg.exportType).toBe('race-config');
      expect(Object.keys(pkg.data).sort()).toEqual(['checkpoints', 'races', 'runners']);
    });
  });

  test('import accepts octet-stream', async ({ page, step }) => {
    await seedRace(page, RACE);
    await openShare(page);
    const { text } = await shareByEmail(page);
    await clearAppData(page);

    await step('Import — a race file sent as application/octet-stream loads', async () => {
      await page.goto('/race-management');
      await page.getByRole('button', { name: /import race/i }).first().click();
      const dialog = page.getByRole('dialog', { name: /import.*export/i });
      await dialog.getByRole('button', { name: /import configuration/i }).click();
      await dialog.locator('input[type="file"]').setInputFiles({ name: 'race-setup-Share-Race.json', mimeType: 'application/octet-stream', buffer: Buffer.from(text) });
      await expect(dialog.getByText(/file loaded successfully/i)).toBeVisible();
      await dialog.locator('button.btn-primary').click();
      await expect(dialog).toBeHidden({ timeout: 10000 });
      await expect(page.getByText(RACE.name)).toBeVisible();
    });

    await step('Import — a file that isn\'t JSON is refused with a plain message', async () => {
      await page.getByRole('button', { name: /import race/i }).first().click();
      const dialog = page.getByRole('dialog', { name: /import.*export/i });
      await dialog.getByRole('button', { name: /import configuration/i }).click();
      await dialog.locator('input[type="file"]').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not a race') });
      await expect(dialog.getByText('That file isn\'t a race file (it should contain JSON).')).toBeVisible();
    });
  });
});
