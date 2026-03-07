/**
 * Customer Journey: Transfer Data — QR-based device-to-device sync
 *
 * Tests the full Transfer Data workflow available to checkpoint volunteers:
 *   1. Transfer Data button is visible in the checkpoint header
 *   2. Navigating to the transfer route shows Send and Receive tabs
 *   3. Send tab — scope picker (delta / full) with entry count preview
 *   4. Send tab — empty state warning when no runners are marked off
 *   5. Send tab — generates a static QR code when runners are present
 *   6. Receive tab — Start Scanning button and file import fallback are present
 *   7. Back button returns to the checkpoint view
 */

import { test, expect } from './fixtures.js';
import { seedRace, seedCheckpointRunners } from './helpers.js';

const RACE = {
  name: 'Transfer Data Journey Race',
  date: '2026-03-06',
  startTime: '07:00',
  numCheckpoints: 2,
  runnerRange: { min: 300, max: 315 },
};

// Fixed times for deterministic assertions
const BASE_TIME = '2026-03-06T07:43:00.000Z';

test.describe('Checkpoint Volunteer — Transfer Data Journey', () => {
  let raceId;

  test.beforeEach(async ({ page }) => {
    raceId = await seedRace(page, RACE);
  });

  // ── Test 1: Transfer button visible in checkpoint header ──────────────────

  test('Transfer Data button appears in checkpoint header', async ({ page, step }) => {
    await step('Navigate to checkpoint 1', async () => {
      await page.goto(`/checkpoint/1`);
      await page.waitForURL(/\/checkpoint\/1/);
      // Wait for runner grid or header to be visible
      await page.waitForSelector('text=Mark Off', { timeout: 10000 });
    });

    await step('Checkpoint header — Transfer Data button is visible', async () => {
      const transferBtn = page.getByRole('button', { name: /transfer data/i })
        .or(page.locator('[aria-label*="Transfer"]'))
        .or(page.locator('button').filter({ hasText: /transfer/i }));
      await expect(transferBtn.first()).toBeVisible({ timeout: 8000 });
    });
  });

  // ── Test 2: Transfer view renders with Send and Receive tabs ──────────────

  test('navigates to transfer view and shows Send and Receive tabs', async ({ page, step }) => {
    await step('Navigate directly to the transfer route', async () => {
      await page.goto(`/checkpoint/1`);
      await page.waitForURL(/\/checkpoint\/1/);
      await page.waitForSelector('text=Mark Off', { timeout: 10000 });
    });

    await step('Transfer view — click Transfer Data button', async () => {
      const transferBtn = page.getByRole('button', { name: /transfer data/i })
        .or(page.locator('button').filter({ hasText: /transfer/i }));
      await transferBtn.first().click();
      await page.waitForURL(/\/checkpoint\/1\/transfer/, { timeout: 8000 });
    });

    await step('Transfer view — Send and Receive tabs visible', async () => {
      await expect(page.getByRole('button', { name: /^Send$/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /^Receive$/i })).toBeVisible();
    });

    await step('Transfer view — Send tab is active by default', async () => {
      // The "What to include" heading is shown on the Send tab
      await expect(page.getByText(/what to include/i)).toBeVisible();
    });

    await step('Transfer view — scope options are visible', async () => {
      await expect(page.getByText(/new entries since|new entries \(first share\)/i)).toBeVisible();
      await expect(page.getByText(/full checkpoint history/i)).toBeVisible();
    });
  });

  // ── Test 3: Empty state — no runners marked off yet ───────────────────────

  test('shows empty state warning when no runners are marked off', async ({ page, step }) => {
    await step('Navigate to transfer route with no marked runners', async () => {
      await page.goto(`/checkpoint/1/transfer`);
      await page.waitForURL(/\/checkpoint\/1\/transfer/);
      await page.waitForSelector('text=What to include', { timeout: 10000 });
    });

    await step('Send tab — entry count shows 0 entries', async () => {
      // Entry count preview should show "No entries to share"
      await expect(
        page.getByText(/no entries to share|0 entr/i)
      ).toBeVisible({ timeout: 5000 });
    });

    await step('Generate QR Code button is disabled with 0 entries', async () => {
      const generateBtn = page.getByRole('button', { name: /generate qr/i });
      await expect(generateBtn).toBeVisible();
      await expect(generateBtn).toBeDisabled();
    });
  });

  // ── Test 4: QR code generates when runners are present ───────────────────

  test('generates a QR code when marked runners are present', async ({ page, step }) => {
    await step('Seed 8 marked runners into checkpoint 1', async () => {
      const entries = Array.from({ length: 8 }, (_, i) => ({
        number: 300 + i,
        actualTime: new Date(Date.parse(BASE_TIME) + i * 30000).toISOString(),
        status: 'passed',
        calledIn: false,
      }));
      await seedCheckpointRunners(page, raceId, 1, entries);
    });

    await step('Navigate to transfer route', async () => {
      await page.goto(`/checkpoint/1/transfer`);
      await page.waitForURL(/\/checkpoint\/1\/transfer/);
      await page.waitForSelector('text=What to include', { timeout: 10000 });
    });

    await step('Send tab — entry count preview shows 8 entries', async () => {
      // Select "Full checkpoint history" to ensure all entries are counted
      await page.getByText(/full checkpoint history/i).click();
      await expect(page.getByText(/8 entr/i)).toBeVisible({ timeout: 5000 });
    });

    await step('Click Generate QR Code button', async () => {
      const generateBtn = page.getByRole('button', { name: /generate qr/i });
      await expect(generateBtn).toBeEnabled();
      await generateBtn.click();
    });

    await step('QR display — full-screen QR code appears', async () => {
      // QRCodeCanvas renders a <canvas> element
      await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    });

    await step('QR display — entry count label is shown', async () => {
      await expect(page.getByText(/8 entr/i)).toBeVisible();
    });

    await step('QR display — "Done" and file share buttons are present', async () => {
      await expect(page.getByRole('button', { name: /done.*receiver got it/i })).toBeVisible();
      await expect(
        page.getByRole('button', { name: /can't scan.*share file|share file/i })
      ).toBeVisible();
    });
  });

  // ── Test 5: Delta scope shows correct count ───────────────────────────────

  test('delta scope shows only entries newer than last share timestamp', async ({ page, step }) => {
    await step('Seed 5 marked runners and set a last-share timestamp after 3 of them', async () => {
      const entries = [
        { number: 300, actualTime: '2026-03-06T07:30:00.000Z', status: 'passed' },
        { number: 301, actualTime: '2026-03-06T07:31:00.000Z', status: 'passed' },
        { number: 302, actualTime: '2026-03-06T07:32:00.000Z', status: 'passed' },
        { number: 303, actualTime: '2026-03-06T07:45:00.000Z', status: 'passed' },
        { number: 304, actualTime: '2026-03-06T07:46:00.000Z', status: 'passed' },
      ];
      await seedCheckpointRunners(page, raceId, 1, entries);

      // Seed a lastShareTimestamp between entry 302 and 303
      await page.evaluate(async (raceId) => {
        const db = await new Promise((res, rej) => {
          const req = indexedDB.open('RaceTrackerDB');
          req.onsuccess = e => res(e.target.result);
          req.onerror = () => rej(req.error);
        });
        // We need to know the deviceId — set a fixed one for testing
        await new Promise((res, rej) => {
          const tx = db.transaction('settings', 'readwrite');
          tx.objectStore('settings').put({ key: 'device.id', value: 'test-device-e2e' });
          tx.objectStore('settings').put({
            key: `transfer.lastShare.${raceId}.cp1.test-device-e2e`,
            value: '2026-03-06T07:40:00.000Z',
          });
          tx.oncomplete = res;
          tx.onerror = () => rej(tx.error);
        });
      }, raceId);
    });

    await step('Navigate to transfer route', async () => {
      await page.goto(`/checkpoint/1/transfer`);
      await page.waitForURL(/\/checkpoint\/1\/transfer/);
      await page.waitForSelector('text=What to include', { timeout: 10000 });
    });

    await step('Delta option selected — entry count shows 2 new entries', async () => {
      // The "New entries since..." option should be visible and selected by default
      await expect(page.getByText(/new entries since/i)).toBeVisible();
      // Count should be 2 (entries at 07:45 and 07:46, after last share at 07:40)
      await expect(page.getByText(/2 entr/i)).toBeVisible({ timeout: 5000 });
    });

    await step('Switching to full history shows all 5 entries', async () => {
      await page.getByText(/full checkpoint history/i).click();
      await expect(page.getByText(/5 entr/i)).toBeVisible({ timeout: 5000 });
    });
  });

  // ── Test 6: Receive tab UI ────────────────────────────────────────────────

  test('Receive tab shows scanner and file import fallback', async ({ page, step }) => {
    await step('Navigate to transfer route and open Receive tab', async () => {
      await page.goto(`/checkpoint/1/transfer`);
      await page.waitForURL(/\/checkpoint\/1\/transfer/);
      await page.waitForSelector('text=Receive', { timeout: 10000 });
      await page.getByRole('button', { name: /^Receive$/i }).click();
    });

    await step('Receive tab — description text is shown', async () => {
      await expect(page.getByText(/scan incoming data/i)).toBeVisible();
    });

    await step('Receive tab — Start Scanning button is visible', async () => {
      await expect(page.getByRole('button', { name: /start scanning/i })).toBeVisible();
    });

    await step('Receive tab — file import fallback is visible', async () => {
      await expect(page.getByText(/import from file instead/i)).toBeVisible();
    });
  });

  // ── Test 7: Back navigation ───────────────────────────────────────────────

  test('back button returns to the checkpoint view', async ({ page, step }) => {
    await step('Navigate to transfer route', async () => {
      await page.goto(`/checkpoint/1/transfer`);
      await page.waitForURL(/\/checkpoint\/1\/transfer/);
      await page.waitForSelector('text=Transfer Data', { timeout: 10000 });
    });

    await step('Tap back button — returns to /checkpoint/1', async () => {
      const backBtn = page.getByRole('button', { name: /back to checkpoint/i })
        .or(page.locator('button[aria-label="Back to checkpoint"]'));
      await backBtn.first().click();
      await page.waitForURL(/\/checkpoint\/1$/, { timeout: 8000 });
      await expect(page.getByText(/mark off/i).first()).toBeVisible({ timeout: 8000 });
    });
  });
});
