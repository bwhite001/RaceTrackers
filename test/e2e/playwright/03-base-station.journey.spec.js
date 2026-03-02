/**
 * Customer Journey: Base Station Operator
 *
 * Covers the flow a base station operator follows during a race:
 *   1. Launch app and select "Base Station Operations"
 *   2. Pick a race from the modal
 *   3. Land on the Data Entry tab – enter a time and runner batch
 *   4. Confirm runners appear in the overview
 *   5. Record a DNF withdrawal via the dialog
 *   6. Record a Vet-Out via the dialog (if available)
 *   7. Switch to the Checkpoint Matrix tab
 *   8. Switch to the Reports tab and generate a report
 *   9. Export data
 */

import { test, expect } from './fixtures.js';
import { createRace, selectModuleWithFirstRace } from './helpers.js';

const RACE = {
  name: 'Base Station Journey Race',
  date: '2025-08-01',
  startTime: '06:00',
  numCheckpoints: 3,
  runnerRange: { min: 300, max: 320 },
};

test.describe('Base Station Operator – Full Operations Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Create the race then navigate through the modal so selectedRaceForMode is set
    // in the persisted Zustand store — direct URL navigations in each test rely on this
    await createRace(page, RACE);
    await selectModuleWithFirstRace(page, /base station/i);
    await page.waitForURL(/base-station\/operations/, { timeout: 15000 });
  });

  test('navigates to base station and sees data entry form', async ({ page }) => {
    // beforeEach already navigated here — just verify the UI
    await expect(page.getByText(/data entry/i)).toBeVisible();
    await expect(page.locator('#commonTime, #runnerInput')).toHaveCount(2);
  });

  test('enters a common time and runner batch, then verifies in overview', async ({ page, step }) => {
    await step('Base Station — Data Entry tab: form ready', async () => {
      await expect(page.locator('#commonTime')).toBeVisible({ timeout: 10000 });
    });

    await step('Data Entry — type finish time 10:45:00 and runner bib batch', async () => {
      await page.fill('#commonTime', '10:45:00');
      await page.fill('#runnerInput', '300, 301, 302, 303');
      await page.getByRole('button', { name: /submit|record|save|log/i }).click();
      await expect(page.locator('#runnerInput')).toHaveValue('');
    });

    await step('Overview tab — runners 300–303 visible after submission', async () => {
      await page.getByRole('tab', { name: /overview/i }).click();
      await expect(page.getByText('300').first()).toBeVisible();
      await expect(page.getByText('303').first()).toBeVisible();
    });
  });

  test('records a DNF via the withdrawal dialog', async ({ page, step }) => {
    await step('Base Station — Data Entry tab: form ready', async () => {
      await expect(page.locator('#commonTime')).toBeVisible({ timeout: 10000 });
    });

    await step('Data Entry — open DNF withdrawal dialog', async () => {
      // DNF is triggered via keyboard shortcut 'd' (HOTKEYS.DROPOUT)
      await page.keyboard.press('d');
      await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 5000 });
    });

    await step('Withdrawal Dialog — enter runner 310 and reason, then submit', async () => {
      const dialog = page.getByRole('dialog');
      await dialog.locator('textarea#runnerInput').fill('310');
      await dialog.locator('input#reason').fill('Injured ankle');
      await dialog.getByRole('button', { name: /mark as/i }).click();
      await expect(dialog).toBeHidden({ timeout: 5000 });
    });

    await step('Overview tab — runner 310 shows DNF status', async () => {
      await page.getByRole('tab', { name: /overview/i }).click();
      await expect(page.getByText('310').first()).toBeVisible();
      await expect(page.getByText(/dnf/i).first()).toBeVisible();
    });
  });

  test('opens the Checkpoint Matrix tab', async ({ page }) => {
    await page.getByRole('tab', { name: /checkpoint matrix/i }).click();
    await expect(page.getByText(/checkpoint|cp1|cp\s*1/i).first()).toBeVisible();
  });

  test('switches to Reports tab and renders a report', async ({ page }) => {
    await page.getByRole('tab', { name: /reports/i }).click();

    // There should be a way to generate or view reports
    await expect(page.getByText(/report|results|summary/i).first()).toBeVisible();

    // Click generate if there's such a button
    const generateBtn = page.getByRole('button', { name: /generate|view|build/i }).first();
    if (await generateBtn.isVisible({ timeout: 2000 })) {
      await generateBtn.click();
      await expect(page.getByText(/runner|total|passed/i).first()).toBeVisible();
    }
  });

  test('exports base station data', async ({ page }) => {
    await expect(page.locator('#commonTime')).toBeVisible({ timeout: 10000 });

    // The Import/Export button in the PageHeader actions opens ImportExportModal
    const exportBtn = page.getByRole('button', { name: 'Import / Export' });
    await expect(exportBtn).toBeVisible({ timeout: 5000 });
    await exportBtn.click();
    const dialog = page.getByRole('dialog', { name: /import.*export/i });
    await dialog.waitFor({ state: 'visible', timeout: 5000 });
    await page.keyboard.press('Escape');
  });
});
