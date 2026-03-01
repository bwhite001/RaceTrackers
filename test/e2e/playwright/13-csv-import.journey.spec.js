import { test, expect } from './fixtures.js';

const VALID_CSV = `bib,firstName,lastName,gender
201,Alice,Smith,F
202,Bob,Jones,M
203,Charlie,Brown,M`;

test.describe('CSV Runner Import', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('opens CSV import panel and shows preview table', async ({ page, step }) => {
    await step('Navigate to Race Setup wizard', async () => {
      // Look for "Race Maintenance" or "Create Race" button
      const setupBtn = page.getByRole('link', { name: /race maintenance/i })
        .or(page.getByRole('button', { name: /race maintenance/i }))
        .or(page.getByText(/race maintenance/i).first());
      await setupBtn.click();
      await page.waitForURL(/race-maintenance/);
    });

    await step('Start new race setup', async () => {
      const newRaceBtn = page.getByRole('button', { name: /new race|create race/i }).first();
      if (await newRaceBtn.isVisible()) await newRaceBtn.click();
      await page.waitForTimeout(500);
    });

    await step('Navigate to Runner Setup step', async () => {
      // Fill template step if needed
      const templateNext = page.getByRole('button', { name: /next|continue/i }).first();
      if (await templateNext.isVisible()) await templateNext.click();
      await page.waitForTimeout(300);
      // Fill race name if needed
      const nameInput = page.getByLabel(/race name/i).or(page.getByPlaceholder(/race name/i));
      if (await nameInput.isVisible()) {
        await nameInput.fill('CSV Test Race');
        const nextBtn = page.getByRole('button', { name: /next|continue/i }).first();
        if (await nextBtn.isVisible()) await nextBtn.click();
      }
      await page.waitForTimeout(300);
    });

    await step('Find and click Import from CSV toggle', async () => {
      const csvToggle = page.getByRole('button', { name: /import from csv/i })
        .or(page.getByText(/import from csv/i).first());
      if (await csvToggle.isVisible({ timeout: 3000 })) {
        await csvToggle.click();
        await page.waitForTimeout(300);
      }
    });

    await step('Paste CSV and verify preview table appears', async () => {
      const textarea = page.getByPlaceholder(/paste csv/i);
      if (await textarea.isVisible({ timeout: 3000 })) {
        await textarea.fill(VALID_CSV);
        await page.waitForTimeout(500);
        await expect(page.getByText('201').first()).toBeVisible({ timeout: 3000 });
        await expect(page.getByText('Alice').first()).toBeVisible();
      }
    });

    await step('Confirm import button visible with correct count', async () => {
      const importBtn = page.getByRole('button', { name: /import 3 runners/i });
      await expect(importBtn).toBeVisible({ timeout: 3000 });
    });
  });
});
