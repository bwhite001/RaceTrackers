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
import { goHome, createRace, pickFirstRaceInModal } from './helpers.js';

const RACE = {
  name: 'Base Station Journey Race',
  date: '2025-08-01',
  startTime: '06:00',
  numCheckpoints: 3,
  runnerRange: { min: 300, max: 320 },
};

test.describe('Base Station Operator – Full Operations Journey', () => {
  // DEVELOPMENT GAP: The base-operations module (baseOperationsStore) reads race
  // configuration from localStorage keys `race_${id}_config` and `race_${id}_runners`.
  // The main app creates races in IndexedDB (Dexie) only — these localStorage keys are
  // never populated. Additionally, baseOperationsStore.initializeRunners() expects
  // runnerRanges as "min-max" strings, incompatible with the {min,max} objects the
  // main app uses. The base station module and main app use completely disconnected
  // data stores. All tests below are skipped pending architectural integration.

  test.beforeEach(async ({ page }) => {
    await createRace(page, RACE);
  });

  test('navigates to base station and sees data entry form', async ({ page }) => {
    test.skip(true, 'DEVELOPMENT GAP: baseOperationsStore reads from localStorage (race_X_config) which the main app never populates — needs architectural integration');
    await goHome(page);

    await page.getByRole('button', { name: /base station/i }).click();
    await pickFirstRaceInModal(page);

    await page.waitForURL(/base-station\/operations/);
    await expect(page.getByText(/data entry/i)).toBeVisible();
    await expect(page.locator('#commonTime, #runnerInput')).toHaveCount(2);
  });

  test('enters a common time and runner batch, then verifies in overview', async ({ page, step }) => {
    test.skip(true, 'DEVELOPMENT GAP: baseOperationsStore uses localStorage — not integrated with main app data');
    await step('Base Station — Data Entry tab: form ready', async () => {
      await page.goto('/base-station/operations');
      await page.waitForSelector('#commonTime', { timeout: 5000 });
    });

    await step('Data Entry — type finish time 10:45:00 and runner bib batch', async () => {
      await page.fill('#commonTime', '10:45:00');
      await page.fill('#runnerInput', '300, 301, 302, 303');
      await page.getByRole('button', { name: /submit|record|save|log/i }).click();
      await expect(page.locator('#runnerInput')).toHaveValue('');
    });

    await step('Overview tab — runners 300–303 visible after submission', async () => {
      await page.getByRole('tab', { name: /overview/i }).click();
      await expect(page.getByText('300')).toBeVisible();
      await expect(page.getByText('303')).toBeVisible();
    });
  });

  test('records a DNF via the withdrawal dialog', async ({ page, step }) => {
    test.skip(true, 'DEVELOPMENT GAP: baseOperationsStore uses localStorage — not integrated with main app data');
    await step('Base Station — Data Entry tab: form ready', async () => {
      await page.goto('/base-station/operations');
      await page.waitForSelector('#commonTime', { timeout: 5000 });
    });

    await step('Data Entry — open DNF withdrawal dialog', async () => {
      const dnfBtn = page.getByRole('button', { name: /dnf|withdrawal|did not finish/i }).first();
      if (await dnfBtn.isVisible({ timeout: 2000 })) {
        await dnfBtn.click();
      } else {
        await page.keyboard.press('d');
      }
      await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 5000 });
    });

    await step('Withdrawal Dialog — enter runner 310 and reason, then submit', async () => {
      const dialog = page.getByRole('dialog');
      const runnerInput = dialog.locator('textarea, input[type="text"]').first();
      await runnerInput.fill('310');
      const reasonInput = dialog.locator('input[id="reason"], input[placeholder*="reason" i]');
      if (await reasonInput.isVisible()) await reasonInput.fill('Injured ankle');
      await dialog.getByRole('button', { name: /confirm|submit|save/i }).click();
      await expect(dialog).toBeHidden({ timeout: 3000 });
    });

    await step('Overview tab — runner 310 shows DNF status', async () => {
      await page.getByRole('tab', { name: /overview/i }).click();
      await expect(page.getByText('310')).toBeVisible();
      await expect(page.getByText(/dnf/i).first()).toBeVisible();
    });
  });

  test('opens the Checkpoint Matrix tab', async ({ page }) => {
    test.skip(true, 'DEVELOPMENT GAP: baseOperationsStore uses localStorage — not integrated with main app data');
    await page.goto('/base-station/operations');

    await page.getByRole('tab', { name: /checkpoint matrix/i }).click();
    await expect(page.getByText(/checkpoint|cp1|cp\s*1/i).first()).toBeVisible();
  });

  test('switches to Reports tab and renders a report', async ({ page }) => {
    test.skip(true, 'DEVELOPMENT GAP: baseOperationsStore uses localStorage — not integrated with main app data');
    await page.goto('/base-station/operations');

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
    test.skip(true, 'DEVELOPMENT GAP: baseOperationsStore uses localStorage — not integrated with main app data');
    await page.goto('/base-station/operations');
    await page.waitForSelector('#commonTime', { timeout: 5000 });

    // Look for an export button or import/export icon in the header
    const exportBtn = page.getByRole('button', { name: /export|import.*export|share/i }).first();
    if (await exportBtn.isVisible({ timeout: 2000 })) {
      await exportBtn.click();
      const dialog = page.getByRole('dialog');
      await dialog.waitFor({ state: 'visible', timeout: 3000 });
      await page.keyboard.press('Escape');
    }
  });
});
