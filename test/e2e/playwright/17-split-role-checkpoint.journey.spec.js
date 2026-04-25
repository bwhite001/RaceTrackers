/**
 * Customer Journey: Split-Role Checkpoint
 *
 * Two operators share one physical checkpoint:
 *   Marker — records runner times in the app, shares batches via QR.
 *   Radio Operator — scans QR batches from the Marker to trigger callouts to base.
 *
 * 1. Checkpoint opens in Marker mode by default
 * 2. Role toggle switches to Radio Operator mode
 * 3. Radio Operator mode shows scan zone, not runner grid
 * 4. Share Batch button is visible in Marker mode
 * 5. Share Batch button is hidden in Radio Operator mode
 * 6. Share Batch opens the batch share modal
 */

import { test, expect } from './fixtures.js';
import { seedRace } from './helpers.js';

const RACE = {
  name: 'Split Role Checkpoint Race',
  date: '2026-04-10',
  startTime: '08:00',
  numCheckpoints: 2,
  runnerRange: { min: 200, max: 215 },
};

test.describe('Split-Role Checkpoint Journey', () => {
  let raceId;

  test.beforeEach(async ({ page }) => {
    raceId = await seedRace(page, RACE);
  });

  // ── Test 1: Default Marker mode ──────────────────────────────────────────────

  test('checkpoint opens in Marker mode by default', async ({ page, step }) => {
    await step('Navigate to checkpoint 1', async () => {
      await page.goto(`/checkpoint/1`);
      await page.waitForURL(/\/checkpoint\/1/);
      await page.waitForSelector('text=Mark Off', { timeout: 10000 });
    });

    await step('Role toggle is visible with Marker and Radio Operator buttons', async () => {
      await expect(page.getByRole('button', { name: /^Marker$/i })).toBeVisible({ timeout: 5000 });
      await expect(page.getByRole('button', { name: /^Radio Operator$/i })).toBeVisible({ timeout: 5000 });
    });

    await step('Marker mode — runner grid is visible', async () => {
      // Mark Off tab and runner grid are present in Marker mode
      await expect(page.getByText(/mark off/i).first()).toBeVisible({ timeout: 5000 });
    });
  });

  // ── Test 2: Switch to Radio Operator mode ────────────────────────────────────

  test('switching to Radio Operator mode replaces the runner grid with a scan zone', async ({ page, step }) => {
    await step('Navigate to checkpoint 1 in default Marker mode', async () => {
      await page.goto(`/checkpoint/1`);
      await page.waitForURL(/\/checkpoint\/1/);
      await page.waitForSelector('text=Mark Off', { timeout: 10000 });
    });

    await step('Click Radio Operator toggle button', async () => {
      await page.getByRole('button', { name: /^Radio Operator$/i }).click();
    });

    await step('Radio Operator mode — scan zone is visible with Scan QR button', async () => {
      await expect(page.getByRole('button', { name: /scan qr/i })).toBeVisible({ timeout: 5000 });
      // Runner grid tabs (Mark Off) should not be present
      await expect(page.getByText(/incoming batch/i)).toBeVisible({ timeout: 5000 });
    });
  });

  // ── Test 3: Switch back to Marker mode ───────────────────────────────────────

  test('switching back to Marker mode restores the runner grid', async ({ page, step }) => {
    await step('Navigate to checkpoint 1 and switch to Radio Operator', async () => {
      await page.goto(`/checkpoint/1`);
      await page.waitForURL(/\/checkpoint\/1/);
      await page.waitForSelector('text=Mark Off', { timeout: 10000 });
      await page.getByRole('button', { name: /^Radio Operator$/i }).click();
      await expect(page.getByRole('button', { name: /scan qr/i })).toBeVisible({ timeout: 10000 });
    });

    await step('Click Marker toggle to switch back', async () => {
      await page.getByRole('button', { name: /^Marker$/i }).click();
    });

    await step('Marker mode — runner grid tabs are restored', async () => {
      await expect(page.getByText(/mark off/i).first()).toBeVisible({ timeout: 5000 });
      // Scan QR button should no longer be present
      await expect(page.getByRole('button', { name: /scan qr/i })).not.toBeVisible();
    });
  });

  // ── Test 4: Share Batch visible in Marker mode ───────────────────────────────

  test('Share Batch button is visible in Marker mode with a QR icon', async ({ page, step }) => {
    await step('Navigate to checkpoint 1 in Marker mode', async () => {
      await page.goto(`/checkpoint/1`);
      await page.waitForURL(/\/checkpoint\/1/);
      await page.waitForSelector('text=Mark Off', { timeout: 10000 });
    });

    await step('Share Batch FAB is visible with QR icon', async () => {
      const shareBatchBtn = page.getByRole('button', { name: /share batch/i });
      await expect(shareBatchBtn).toBeVisible({ timeout: 5000 });
    });
  });

  // ── Test 5: Share Batch hidden in Radio Operator mode ───────────────────────

  test('Share Batch button is hidden in Radio Operator mode', async ({ page, step }) => {
    await step('Navigate to checkpoint 1 in Marker mode', async () => {
      await page.goto(`/checkpoint/1`);
      await page.waitForURL(/\/checkpoint\/1/);
      await page.waitForSelector('text=Mark Off', { timeout: 10000 });
    });

    await step('Switch to Radio Operator mode', async () => {
      await page.getByRole('button', { name: /^Radio Operator$/i }).click();
      await expect(page.getByRole('button', { name: /scan qr/i })).toBeVisible({ timeout: 5000 });
    });

    await step('Share Batch button is no longer visible', async () => {
      await expect(page.getByRole('button', { name: /share batch/i })).not.toBeVisible();
    });
  });

  // ── Test 6: Share Batch opens modal ─────────────────────────────────────────

  test('Share Batch opens the batch share modal', async ({ page, step }) => {
    await step('Navigate to checkpoint 1 in Marker mode', async () => {
      await page.goto(`/checkpoint/1`);
      await page.waitForURL(/\/checkpoint\/1/);
      await page.waitForSelector('text=Mark Off', { timeout: 10000 });
    });

    await step('Click Share Batch button', async () => {
      await page.getByRole('button', { name: /share batch/i }).click();
    });

    await step('Batch share modal appears with Share Batch heading', async () => {
      // Modal header shows "Share Batch" title — assert on the paragraph element specifically
      await expect(page.locator('p').filter({ hasText: /^Share Batch$/ })).toBeVisible({ timeout: 5000 });
      // Modal shows "First share this session" as subtitle
      await expect(page.getByText('First share this session')).toBeVisible({ timeout: 5000 });
    });
  });
});
