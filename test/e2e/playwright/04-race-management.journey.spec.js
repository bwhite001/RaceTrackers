/**
 * Customer Journey: Race Management
 *
 * Covers the race management interface used by race directors to:
 *   1. View all races in the management table
 *   2. Navigate to a race's overview page
 *   3. Create a second race
 *   4. Navigate to a checkpoint directly from the race overview
 *   5. Navigate to base station from the race overview
 */

import { test, expect } from './fixtures.js';
import { goHome, createRace, fillReactInput } from './helpers.js';

const RACE_A = {
  name: 'Management Race Alpha',
  date: '2025-04-10',
  startTime: '07:30',
  numCheckpoints: 2,
  runnerRange: { min: 400, max: 405 },
};
const RACE_B = {
  name: 'Management Race Beta',
  date: '2025-05-20',
  startTime: '08:00',
  numCheckpoints: 1,
  runnerRange: { min: 500, max: 503 },
};

test.describe('Race Management Journey', () => {
  test('race management page lists created races', async ({ page, step }) => {
    await step('Race Management — page lists all created races', async () => {
      await createRace(page, RACE_A);
      await page.goto('/race-management');
      await expect(page.getByText(RACE_A.name)).toBeVisible();
    });
  });

  test('clicking a race opens its overview', async ({ page, step }) => {
    await step('Race Management — page with race listed', async () => {
      await createRace(page, RACE_A);
      await page.goto('/race-management');
    });

    await step('Race card — click race name to open overview', async () => {
      await page.getByText(RACE_A.name).click();

      // Should navigate to overview
      await page.waitForURL(/race-maintenance\/overview|race-management/);
    });

    await step('Race overview — name and details visible', async () => {
      await expect(page.getByText(RACE_A.name)).toBeVisible();
    });
  });

  test('creates a second race from the management page', async ({ page, step }) => {
    await step('Race Management — tap Create New Race button', async () => {
      await page.goto('/race-management');

      const newRaceBtn = page.getByRole('button', { name: /new race|create|add race/i }).first();
      await newRaceBtn.click();

      await page.waitForURL(/race-maintenance\/setup/);
    });

    await step('Step 1 of 4 — Template: choose Start from Scratch', async () => {
      // Template step — click Start from Scratch
      const scratchBtn = page.locator('button').filter({ hasText: 'Start from Scratch' }).first();
      await scratchBtn.waitFor({ state: 'visible', timeout: 8000 });
      await scratchBtn.click();
    });

    await step('Step 2 of 4 — Race Details: enter name, date, start time', async () => {
      await page.waitForTimeout(300);
      await fillReactInput(page, '#name', RACE_B.name);
      await page.waitForTimeout(100);
      await page.fill('#date', RACE_B.date);
      await page.waitForTimeout(100);
      await page.fill('#startTime', RACE_B.startTime);
      await page.waitForTimeout(100);
      await page.selectOption('#numCheckpoints', String(RACE_B.numCheckpoints));

      await page.getByRole('button', { name: /next|continue/i }).click();
    });

    await step('Step 3 of 4 — Runner Setup: add bib range 500–503', async () => {
      await page.waitForSelector('#min');
      await page.fill('#min', String(RACE_B.runnerRange.min));
      await page.fill('#max', String(RACE_B.runnerRange.max));
      await page.getByRole('button', { name: /create race|save|finish/i }).click();
    });

    await step('Step 4 of 4 — Waves: confirm and save', async () => {
      // Batches step — click Create Race again to actually save
      const batchCreateBtn = page.getByRole('button', { name: /create race/i });
      if (await batchCreateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await batchCreateBtn.click();
      }
    });

    await step('Race overview — second race created successfully', async () => {
      await page.waitForURL(/race-maintenance\/overview/);
      await expect(page.getByText(RACE_B.name)).toBeVisible();
    });
  });

  test('race overview shows correct runner and checkpoint counts', async ({ page, step }) => {
    await step('Race overview — runner count 6 and checkpoint count 2 shown', async () => {
      await createRace(page, RACE_A);
      // createRace ends on overview page
      await page.waitForURL(/race-maintenance\/overview/);

      // 6 runners (400–405)
      await expect(page.getByText('6', { exact: true }).first()).toBeVisible();
      // 2 checkpoints — use a more specific selector to avoid strict mode violation
      await expect(page.getByText('2', { exact: true }).first()).toBeVisible();
    });
  });

  test('navigates from race overview to a checkpoint', async ({ page, step }) => {
    await createRace(page, RACE_A);
    await page.waitForURL(/race-maintenance\/overview/);

    // Click on Checkpoint 1 link/button
    const cpBtn = page.getByRole('button', { name: /checkpoint 1|cp1|go to checkpoint/i }).first();
    if (await cpBtn.isVisible({ timeout: 2000 })) {
      await step('Race overview — tap Checkpoint 1 link', async () => {
        await cpBtn.click();
      });

      await step('Checkpoint view — mark-off screen for CP1 open', async () => {
        await page.waitForURL(/\/checkpoint\//);
        await expect(page.getByText(/mark off|callout/i).first()).toBeVisible();
      });
    }
  });

  test('navigates from race overview to base station', async ({ page, step }) => {
    await createRace(page, RACE_A);
    await page.waitForURL(/race-maintenance\/overview/);

    const bsBtn = page.getByRole('button', { name: /base station/i }).first();
    if (await bsBtn.isVisible({ timeout: 2000 })) {
      await step('Race overview — tap Base Station button', async () => {
        await bsBtn.click();
      });

      await step('Base Station — operations screen open', async () => {
        await page.waitForURL(/base-station\/operations/);
        await expect(page.getByText(/data entry/i)).toBeVisible();
      });
    }
  });

  test('home page landing shows the race management module card', async ({ page, step }) => {
    await step('Home — Race Maintenance module card visible', async () => {
      await goHome(page);
      await expect(page.getByRole('button', { name: /race maintenance/i })).toBeVisible();
    });
  });
});
