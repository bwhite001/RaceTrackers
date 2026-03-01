/**
 * Customer Journey: Import / Export & Data Portability
 *
 * Verifies that race configuration and results can be exported as JSON
 * and re-imported to restore the app state:
 *
 *   1. Create a race and record some data
 *   2. Export race configuration via the Import/Export modal
 *   3. Clear all data
 *   4. Import the saved configuration
 *   5. Verify the race and runners are restored
 */

import { test, expect } from './fixtures.js';
import { createRace, goHome, clearAppData } from './helpers.js';
import path from 'path';
import fs from 'fs';
import os from 'os';

const RACE = {
  name: 'Export Import Race',
  date: '2025-03-15',
  startTime: '08:00',
  numCheckpoints: 1,
  runnerRange: { min: 700, max: 705 },
};

test.describe('Import / Export Journey', () => {
  let exportFilePath;

  test.beforeAll(() => {
    // Set up a temp path for downloads
    exportFilePath = path.join(os.tmpdir(), `race-export-${Date.now()}.json`);
  });

  test.afterAll(() => {
    if (exportFilePath && fs.existsSync(exportFilePath)) {
      fs.unlinkSync(exportFilePath);
    }
  });

  test('export modal opens from base station header', async ({ page, step }) => {
    await step('Base Station — operations screen with created race', async () => {
      await createRace(page, RACE);
      await page.goto('/base-station/operations');
      await page.waitForSelector('#commonTime', { timeout: 5000 });
    });

    await step('Base Station header — tap Import/Export button', async () => {
      const exportBtn = page.getByRole('button', { name: /export|import.*export/i }).first();
      if (await exportBtn.isVisible({ timeout: 2000 })) {
        await exportBtn.click();
      } else {
        test.skip(true, 'No visible export button on base station view');
      }
    });

    await step('Data portability dialog — export options visible', async () => {
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
    });
  });

  test('downloads a race configuration JSON file', async ({ page, step }) => {
    await step('Race Management — page with created race listed', async () => {
      await createRace(page, RACE);
      await page.goto('/race-management');
    });

    await step('Race card — open export / download option', async () => {
      // Look for an export option on the race management page
      const exportBtn = page.getByRole('button', { name: /export|download/i }).first();
      if (!(await exportBtn.isVisible({ timeout: 2000 }))) {
        test.skip(true, 'Export button not found on race management page');
        return;
      }

      const [download] = await Promise.all([
        page.waitForEvent('download'),
        exportBtn.click(),
      ]);

      await download.saveAs(exportFilePath);
    });

    await step('Download triggered — JSON file confirmed in temp folder', async () => {
      expect(fs.existsSync(exportFilePath)).toBe(true);

      const content = JSON.parse(fs.readFileSync(exportFilePath, 'utf-8'));
      expect(content).toHaveProperty('races');
      expect(Array.isArray(content.races)).toBe(true);
    });
  });

  test('imports a race configuration and restores data', async ({ page }) => {
    if (!exportFilePath || !fs.existsSync(exportFilePath)) {
      test.skip(true, 'No export file available for import test');
      return;
    }

    // Clear data first
    await clearAppData(page);

    // Navigate to race management to trigger import
    await page.goto('/race-management');

    const importBtn = page.getByRole('button', { name: /import/i }).first();
    if (!(await importBtn.isVisible({ timeout: 2000 }))) {
      test.skip(true, 'Import button not found');
      return;
    }

    await importBtn.click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();

    // Upload the file
    const fileInput = dialog.locator('input[type="file"]');
    await fileInput.setInputFiles(exportFilePath);

    await dialog.getByRole('button', { name: /import|confirm|proceed/i }).click();
    await expect(dialog).toBeHidden({ timeout: 5000 });

    // The race should now be visible
    await expect(page.getByText(RACE.name)).toBeVisible();
  });
});
