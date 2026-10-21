/**
 * Customer Journey: VK4WIP home, settings and sharing a race (redesign Phase 1)
 *
 *   1. Home — choose your role (Checkpoint, Base station, Race setup), current race card,
 *      Scan race QR code
 *   2. Settings — Theme (Light / Dark / Sunlight), text size, status colours, reset to club colours
 *   3. Share race — QR / Download / Email / Copy, works device to device
 */

import { test, expect } from './fixtures.js';
import { seedRace, goHome } from './helpers.js';

const RACE = { name: 'Mt Glorious Mountain Trails', runnerRange: { min: 100, max: 109 }, numCheckpoints: 3 };

test.describe('VK4WIP home, settings and share', () => {
  test('home shows the three roles, the current race and Scan race QR code', async ({ page, step }) => {
    await seedRace(page, RACE);

    await step('Home — choose your role: Checkpoint, Base station or Race setup', async () => {
      await goHome(page);
      await expect(page.getByRole('heading', { name: /^racetracker$/i })).toBeVisible();
      await expect(page.getByRole('heading', { name: /what are you doing today/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /^checkpoint\b/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /^base station/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /^race setup/i })).toBeVisible();
    });

    await step('Current race card shows the race name, checkpoints and start time', async () => {
      await expect(page.getByText('Current race')).toBeVisible();
      await expect(page.getByText(RACE.name).first()).toBeVisible();
      await expect(page.getByText(/3 checkpoints \+ finish/)).toBeVisible();
    });

    await step('Scan race QR code opens the import screen', async () => {
      await page.getByRole('button', { name: /scan race qr code/i }).click();
      await expect(page.getByRole('heading', { name: 'Scan QR Code', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Close scanner' })).toBeVisible();
    });
  });

  test('settings switches theme to sunlight and resets status colours to club colours', async ({ page, step }) => {
    await goHome(page);
    const overlay = page.locator('.fixed.inset-0').first();

    await step('Settings — Display, Status colours and Race data sections', async () => {
      await page.getByRole('button', { name: 'Settings' }).click();
      await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Display' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Status colours' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Race data' })).toBeVisible();
    });

    await step('Theme — Sunlight gives a high-contrast white page', async () => {
      await overlay.getByRole('button', { name: 'Sunlight', exact: true }).click();
      await expect(overlay.getByRole('button', { name: 'Sunlight', exact: true })).toHaveAttribute('aria-pressed', 'true');
      expect(await page.evaluate(() => document.documentElement.classList.contains('sunlight-mode'))).toBe(true);
      expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(false);
    });

    await step('Status colours — change Passed, then Reset to club colours', async () => {
      await page.getByLabel('Passed colour').fill('#123456');
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-status-passed').trim())).toBe('18 52 86');
      await page.getByRole('button', { name: /reset to club colours/i }).click();
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-status-passed').trim())).toBe('30 92 179');
    });

    await step('Cancel — nothing is saved, Light theme is back', async () => {
      await page.getByRole('button', { name: 'Cancel' }).click();
      expect(await page.evaluate(() => document.documentElement.classList.contains('sunlight-mode'))).toBe(false);
    });
  });

  test('share race screen offers QR, download, email and copy', async ({ page, step }) => {
    await seedRace(page, RACE);
    await goHome(page);

    await step('Settings — Race data › Share or import race config', async () => {
      await page.getByRole('button', { name: 'Settings' }).click();
      await page.getByRole('button', { name: /share or import race config/i }).click();
    });

    await step('Share race — scan to load this race, or download, email or copy the file', async () => {
      await expect(page.getByRole('heading', { name: /scan to load this race/i })).toBeVisible();
      await expect(page.getByText(/10 runners · 3 checkpoints/)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Download' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Email' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Copy' })).toBeVisible();
      await expect(page.getByText(/works without internet/i)).toBeVisible();
    });

    await step('Back — returns to Settings', async () => {
      await page.getByRole('button', { name: /close share race/i }).click();
      await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
    });
  });
});
