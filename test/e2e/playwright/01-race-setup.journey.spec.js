/**
 * Customer Journey: Race Director – Race Setup
 *
 * Covers the end-to-end flow a race director follows to create a new race:
 *   1. Land on the homepage
 *   2. Navigate to Race Maintenance → Setup
 *   3. Fill in race details (name, date, start time, checkpoints)
 *   4. Configure runner ranges
 *   5. Save and verify the Race Overview is populated correctly
 *   6. Navigate back to home and confirm the race appears
 */

import { test, expect } from './fixtures.js';
import { goHome, fillReactInput } from './helpers.js';

const RACE_NAME = 'Mountain Ultra 2025';
const RACE_DATE = '2025-09-20';
const START_TIME = '06:30';
const NUM_CHECKPOINTS = 3;
const RUNNER_MIN = 101;
const RUNNER_MAX = 115; // 15 runners

test.describe('Race Director – Race Setup Journey', () => {
  test('creates a new race from scratch and verifies the overview', async ({ page, step }) => {
    await step('open home page', async () => {
      await goHome(page);
      await expect(page.getByRole('heading', { name: /race tracker pro/i })).toBeVisible();
    });

    await step('navigate to race setup', async () => {
      const createRaceBtn = page.getByRole('button', { name: /create new race|race maintenance/i }).first();
      await createRaceBtn.click();
      if (page.url().includes('race-management')) {
        await page.getByRole('button', { name: /create new race/i }).first().click();
      }
      await page.waitForURL(/race-maintenance\/setup/);
      await expect(page.getByRole('heading', { name: /race setup|create race|new race/i })).toBeVisible();
    });

    await step('fill race details (step 1)', async () => {
      // Template step — click Start from Scratch to proceed to Race Details
      await page.locator('button').filter({ hasText: 'Start from Scratch' }).first().click();
      await page.waitForTimeout(300);
      await fillReactInput(page, '#name', RACE_NAME);
      await page.waitForTimeout(100);
      await page.fill('#date', RACE_DATE);
      await page.waitForTimeout(100);
      await page.fill('#startTime', START_TIME);
      await page.waitForTimeout(100);
      await page.selectOption('#numCheckpoints', String(NUM_CHECKPOINTS));
      await page.waitForTimeout(400);
      for (let i = 0; i < NUM_CHECKPOINTS; i++) {
        const cpSelector = `#checkpoint-${i}`;
        const cpInput = page.locator(cpSelector);
        await cpInput.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
        if (await cpInput.isVisible()) {
          await fillReactInput(page, cpSelector, `CP${i + 1}`);
          await page.waitForTimeout(100);
        }
      }
      await page.getByRole('button', { name: /next|continue/i }).click();
    });

    await step('configure runner range (step 2)', async () => {
      await page.waitForSelector('#min', { timeout: 5000 });
      // Delete the default pre-loaded range (100-200) before adding our own
      const removeBtn = page.getByRole('button', { name: /remove range/i }).first();
      if (await removeBtn.isVisible()) {
        await removeBtn.click();
        await page.waitForTimeout(200);
      }
      await page.fill('#min', String(RUNNER_MIN));
      await page.waitForTimeout(100);
      await page.fill('#max', String(RUNNER_MAX));
      await page.waitForTimeout(100);
      await page.getByRole('button', { name: /add range/i }).click();
      await page.waitForTimeout(200);
      // "Create Race" on Runner Ranges step moves to Batches step
      await page.getByRole('button', { name: /create race|save|finish/i }).click();
      // Batches step — click "Create Race" to actually save the race
      const batchesCreateBtn = page.getByRole('button', { name: /create race/i });
      if (await batchesCreateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await batchesCreateBtn.click();
      }
    });

    await step('verify race overview', async () => {
      await page.waitForURL(/race-maintenance\/overview/);
      // Wait for race data to load from IndexedDB (loading spinner disappears)
      await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 30000 });
      await expect(page.getByText(RACE_NAME)).toBeVisible();
      await expect(page.getByText(/CP1|Checkpoint 1/i)).toBeVisible();
      // Verify runner count shows 15 (RUNNER_MIN=101 to RUNNER_MAX=115 = 15 runners)
      await expect(page.getByText('15 runners')).toBeVisible();
    });

    await step('confirm race appears on home page', async () => {
      await page.goto('/');
      await page.waitForSelector('h1:has-text("Race Tracker Pro")', { timeout: 30000 });
      await expect(page.getByText(RACE_NAME)).toBeVisible();
    });
  });

  test('step indicator advances correctly through setup wizard', async ({ page }) => {
    await page.goto('/race-maintenance/setup');
    // Template step — click Start from Scratch to proceed to Race Details
    await page.locator('button').filter({ hasText: 'Start from Scratch' }).first().click();
    await page.waitForTimeout(300);
    await page.waitForSelector('#name');

    // Step 2 (Race Details) should be active
    const step2Label = page.getByText(/race details/i).first();
    await expect(step2Label).toBeVisible();

    await fillReactInput(page, '#name', 'Indicator Test Race');
    await page.waitForTimeout(100);
    await page.fill('#date', '2025-10-01');
    await page.waitForTimeout(100);
    await page.fill('#startTime', '08:00');
    await page.waitForTimeout(100);
    await page.selectOption('#numCheckpoints', '1');

    await page.getByRole('button', { name: /next|continue/i }).click();

    // Step 2 (runner ranges) should now be active
    await page.waitForSelector('#min');
    const step2Indicator = page.getByText(/runner|step 2/i).first();
    await expect(step2Indicator).toBeVisible();
  });

  test('back button on step 2 returns to race details with data preserved', async ({ page }) => {
    await page.goto('/race-maintenance/setup');
    // Template step — click Start from Scratch to proceed to Race Details
    await page.locator('button').filter({ hasText: 'Start from Scratch' }).first().click();
    await page.waitForTimeout(300);
    await page.waitForSelector('#name');
    await page.waitForTimeout(500); // Wait for React to finish mounting

    await fillReactInput(page, '#name', 'Back Button Race');
    await page.waitForTimeout(100);
    await page.fill('#date', '2025-11-10');
    await page.waitForTimeout(100);
    await page.fill('#startTime', '09:00');
    await page.waitForTimeout(100);
    await page.selectOption('#numCheckpoints', '1');
    await page.getByRole('button', { name: /next|continue/i }).click();

    await page.waitForSelector('#min');
    await page.getByRole('button', { name: /back|previous/i }).click();

    // Race name should still be filled
    await page.waitForSelector('#name');
    await expect(page.locator('#name')).toHaveValue('Back Button Race');
  });
});
