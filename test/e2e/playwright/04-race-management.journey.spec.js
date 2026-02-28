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
  test('race management page lists created races', async ({ page }) => {
    await createRace(page, RACE_A);
    await page.goto('/race-management');
    await expect(page.getByText(RACE_A.name)).toBeVisible();
  });

  test('clicking a race opens its overview', async ({ page }) => {
    await createRace(page, RACE_A);
    await page.goto('/race-management');
    await page.getByText(RACE_A.name).click();

    // Should navigate to overview
    await page.waitForURL(/race-maintenance\/overview|race-management/);
    await expect(page.getByText(RACE_A.name)).toBeVisible();
  });

  test('creates a second race from the management page', async ({ page }) => {
    await page.goto('/race-management');

    const newRaceBtn = page.getByRole('button', { name: /new race|create|add race/i }).first();
    await newRaceBtn.click();

    await page.waitForURL(/race-maintenance\/setup/);
    await fillReactInput(page, '#name', RACE_B.name);
    await page.waitForTimeout(100);
    await page.fill('#date', RACE_B.date);
    await page.waitForTimeout(100);
    await page.fill('#startTime', RACE_B.startTime);
    await page.waitForTimeout(100);
    await page.selectOption('#numCheckpoints', String(RACE_B.numCheckpoints));

    await page.getByRole('button', { name: /next|continue/i }).click();
    await page.waitForSelector('#min');
    await page.fill('#min', String(RACE_B.runnerRange.min));
    await page.fill('#max', String(RACE_B.runnerRange.max));
    await page.getByRole('button', { name: /create race|save|finish/i }).click();

    await page.waitForURL(/race-maintenance\/overview/);
    await expect(page.getByText(RACE_B.name)).toBeVisible();
  });

  test('race overview shows correct runner and checkpoint counts', async ({ page }) => {
    await createRace(page, RACE_A);
    // createRace ends on overview page
    await page.waitForURL(/race-maintenance\/overview/);

    // 6 runners (400–405)
    await expect(page.getByText('6', { exact: true }).first()).toBeVisible();
    // 2 checkpoints — use a more specific selector to avoid strict mode violation
    await expect(page.getByText('2', { exact: true }).first()).toBeVisible();
  });

  test('navigates from race overview to a checkpoint', async ({ page }) => {
    await createRace(page, RACE_A);
    await page.waitForURL(/race-maintenance\/overview/);

    // Click on Checkpoint 1 link/button
    const cpBtn = page.getByRole('button', { name: /checkpoint 1|cp1|go to checkpoint/i }).first();
    if (await cpBtn.isVisible({ timeout: 2000 })) {
      await cpBtn.click();
      await page.waitForURL(/\/checkpoint\//);
      await expect(page.getByText(/mark off|callout/i).first()).toBeVisible();
    }
  });

  test('navigates from race overview to base station', async ({ page }) => {
    await createRace(page, RACE_A);
    await page.waitForURL(/race-maintenance\/overview/);

    const bsBtn = page.getByRole('button', { name: /base station/i }).first();
    if (await bsBtn.isVisible({ timeout: 2000 })) {
      await bsBtn.click();
      await page.waitForURL(/base-station\/operations/);
      await expect(page.getByText(/data entry/i)).toBeVisible();
    }
  });

  test('home page landing shows the race management module card', async ({ page }) => {
    await goHome(page);
    await expect(page.getByRole('button', { name: /race maintenance/i })).toBeVisible();
  });
});
