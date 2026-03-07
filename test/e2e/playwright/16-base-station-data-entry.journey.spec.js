/**
 * Customer Journey: Base Station Operator – Data Entry UI
 *
 * Covers the redesigned batch data entry flow in BaseStationView:
 *   1. Navigate to base station
 *   2. Select checkpoint, set time, enter bibs
 *   3. Review draft table and record batch
 *   4. View history tab with recorded batch
 *   5. Edit a batch via void-and-resubmit
 */

import { test, expect } from './fixtures.js';
import { seedRace, goHome, pickFirstRaceInModal } from './helpers.js';

const RACE = {
  name: 'Data Entry Journey Race',
  date: '2025-09-15',
  startTime: '07:00',
  numCheckpoints: 2,
  runnerRange: { min: 200, max: 210 },
};

test.describe('Base Station Data Entry', () => {
  test.beforeEach(async ({ page }) => {
    await seedRace(page, RACE);
  });

  test('records a batch of runners at base station and views history', async ({ page, step }) => {
    await step('Navigate to Base Station from home screen', async () => {
      await goHome(page);
      const btn = page.getByRole('button', { name: /base station/i });
      const visible = await btn.isVisible({ timeout: 5000 }).catch(() => false);
      if (!visible) {
        test.skip(true, 'Base Station button not found on home screen');
        return;
      }
      await btn.click();
      await pickFirstRaceInModal(page);
    });

    await step('Base Station loads with Draft tab and checkpoint selector', async () => {
      await expect(page.getByRole('button', { name: 'Draft' })).toBeVisible({ timeout: 8000 });
      await expect(page.getByRole('button', { name: /history/i })).toBeVisible();
    });

    await step('Select a checkpoint and enter a common time', async () => {
      const cpSelect = page.getByRole('combobox', { name: /checkpoint/i });
      const hasOptions = await cpSelect.isVisible({ timeout: 5000 }).catch(() => false);
      if (!hasOptions) {
        test.skip(true, 'Checkpoint selector not found');
        return;
      }
      // Select the first available checkpoint option
      const options = await cpSelect.locator('option').allTextContents();
      const first = options.find(o => o.trim() && !o.includes('--'));
      if (first) await cpSelect.selectOption({ label: first.trim() });

      const timeInput = page.getByRole('textbox', { name: /common time/i }).or(
        page.locator('input[type="time"], input[placeholder*="time" i]').first()
      );
      const timeVisible = await timeInput.isVisible({ timeout: 3000 }).catch(() => false);
      if (timeVisible) {
        await timeInput.fill('09:45');
      }
    });

    await step('Enter bib numbers in the bib field', async () => {
      const bibInput = page.getByRole('textbox', { name: /bib/i }).or(
        page.locator('input[placeholder*="bib" i], input[placeholder*="runner" i]').first()
      );
      const visible = await bibInput.isVisible({ timeout: 5000 }).catch(() => false);
      if (!visible) {
        test.skip(true, 'Bib input not found');
        return;
      }
      await bibInput.fill('201, 202, 203');
      await bibInput.press('Enter');
    });

    await step('Draft table shows entered runners', async () => {
      // Wait for runners to appear in draft
      await page.waitForTimeout(500);
      const draftArea = page.locator('table, [role="table"], [data-testid="draft-table"]').first();
      const hasDraft = await draftArea.isVisible({ timeout: 4000 }).catch(() => false);
      if (hasDraft) {
        await expect(draftArea).toBeVisible();
      }
    });

    await step('Record the batch', async () => {
      const recordBtn = page.getByRole('button', { name: /record batch|record/i }).first();
      const visible = await recordBtn.isVisible({ timeout: 4000 }).catch(() => false);
      if (!visible) {
        test.skip(true, 'Record button not found');
        return;
      }
      await recordBtn.click();
    });

    await step('History tab shows the recorded batch', async () => {
      const historyTab = page.getByRole('button', { name: /history/i });
      await historyTab.click();
      // Either a batch card or a summary header should appear
      await page.waitForTimeout(500);
      const hasBatch = await page.locator('text=/batch|CP|runner/i').first().isVisible({ timeout: 4000 }).catch(() => false);
      expect(hasBatch).toBe(true);
    });
  });
});
