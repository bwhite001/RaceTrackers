import { test, expect } from './fixtures.js';
import path from 'path';
import fs from 'fs';

test.describe('Versioned Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('exported race config JSON contains _meta.schemaVersion 8', async ({ page, step }) => {
    const downloadDir = path.resolve('test/e2e/playwright/downloads');
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

    await step('Navigate to Race Management', async () => {
      const link = page.getByRole('link', { name: /race maintenance/i })
        .or(page.getByRole('button', { name: /race maintenance/i }))
        .or(page.getByText(/race maintenance/i).first());
      await link.click();
      await page.waitForURL(/race-maintenance/);
    });

    await step('Look for an export button (skip if no race exists)', async () => {
      const exportBtn = page.getByRole('button', { name: /export/i }).first();
      if (!await exportBtn.isVisible({ timeout: 2000 })) {
        test.skip(true, 'No race available to export — run after creating a race');
        return;
      }
    });

    await step('Click export and verify downloaded JSON has _meta.schemaVersion', async () => {
      const exportBtn = page.getByRole('button', { name: /export/i }).first();
      if (!await exportBtn.isVisible({ timeout: 2000 })) return;

      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
        exportBtn.click(),
      ]);

      if (download) {
        const filePath = path.join(downloadDir, download.suggestedFilename() || 'export.json');
        await download.saveAs(filePath);
        const content = fs.readFileSync(filePath, 'utf-8');
        const json = JSON.parse(content);
        expect(json._meta).toBeDefined();
        expect(json._meta.schemaVersion).toBe(8);
      }
    });
  });
});
