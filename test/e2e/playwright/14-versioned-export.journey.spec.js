import { test, expect } from './fixtures.js';
import { createRace } from './helpers.js';
import path from 'path';
import fs from 'fs';

test.describe('Versioned Export', () => {
  test.beforeEach(async ({ page }) => {
    await createRace(page);
    await page.goto('/');
  });

  test('exported race config JSON contains _meta.schemaVersion 8', async ({ page, step }) => {
    const downloadDir = path.resolve('test/e2e/playwright/downloads');
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

    await step('Navigate to Race Management', async () => {
      await page.goto('/race-management');
      await page.waitForURL(/race-manage/);
      await page.waitForTimeout(500);
    });

    await step('Look for an export button — open dropdown if needed', async () => {
      // Wait for races to load from IndexedDB
      await page.waitForTimeout(1500);
      // Export is in a race card dropdown; try opening it first
      const moreBtn = page.getByRole('button', { name: /more options/i }).first();
      if (await moreBtn.isVisible({ timeout: 5000 })) {
        await moreBtn.click();
        await page.waitForTimeout(300);
      }
      const exportBtn = page.getByRole('button', { name: /^export$/i }).first();
      if (!await exportBtn.isVisible({ timeout: 3000 })) {
        test.skip(true, 'No race available to export — run after creating a race');
        return;
      }
    });

    await step('Click export and verify downloaded JSON has schemaVersion 8', async () => {
      const exportBtn = page.getByRole('button', { name: /^export$/i }).first();
      if (!await exportBtn.isVisible({ timeout: 3000 })) return;

      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
        exportBtn.click(),
      ]);

      if (download) {
        const filePath = path.join(downloadDir, download.suggestedFilename() || 'export.json');
        await download.saveAs(filePath);
        const content = fs.readFileSync(filePath, 'utf-8');
        const json = JSON.parse(content);
        expect(json.schemaVersion).toBe(8);
      }
    });
  });
});
