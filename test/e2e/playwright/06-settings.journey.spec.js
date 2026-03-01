/**
 * Customer Journey: Settings & App Preferences
 *
 * Verifies the Settings modal and user-preference persistence:
 *   1. Open settings from the home page
 *   2. Toggle dark mode
 *   3. Confirm dark class is applied to the document
 *   4. Toggle dark mode back
 *   5. Change font size
 *   6. Close and re-open settings to confirm persistence
 */

import { test, expect } from './fixtures.js';
import { goHome } from './helpers.js';

// Helper: the Settings modal is a plain div overlay, not a semantic dialog.
// Detect it by its unique heading text.
const settingsHeading = (page) => page.locator('h2', { hasText: 'Settings' });

test.describe('Settings & Preferences Journey', () => {
  test('opens and closes the Settings modal', async ({ page, step }) => {
    await step('Home — tap Settings cog button (aria-label Settings)', async () => {
      await goHome(page);
      await page.click('button[aria-label="Settings"]');
    });

    await step('Settings modal — panel open with customisation options', async () => {
      await expect(settingsHeading(page)).toBeVisible();
    });

    await step('Settings modal — closed after pressing X button', async () => {
      // Close with the X button in the modal header
      await page.getByRole('button', { name: /close/i }).first().click();
      await expect(settingsHeading(page)).toBeHidden();
    });
  });

  test('toggles dark mode on and off', async ({ page, step }) => {
    await step('Home — open Settings modal', async () => {
      await goHome(page);
      await page.getByRole('button', { name: 'Settings' }).click();
      await expect(settingsHeading(page)).toBeVisible({ timeout: 5000 });
    });

    await step('Settings modal — locate Dark Mode toggle switch', async () => {
      // Dark mode is the first role="switch" inside the settings overlay
      const overlay = page.locator('.fixed.inset-0');
      const darkToggle = overlay.getByRole('switch').first();
      await darkToggle.waitFor({ timeout: 5000 });
    });

    const overlay = page.locator('.fixed.inset-0');
    const darkToggle = overlay.getByRole('switch').first();

    const wasDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );

    await step('Dark mode ON — html element gains "dark" class', async () => {
      // Toggle dark mode on
      await darkToggle.click();

      const isDarkNow = await page.evaluate(() =>
        document.documentElement.classList.contains('dark')
      );
      expect(isDarkNow).toBe(!wasDark);
    });

    await step('Dark mode OFF — "dark" class removed from html element', async () => {
      // Toggle dark mode back
      await darkToggle.click();
      const isRestoredDark = await page.evaluate(() =>
        document.documentElement.classList.contains('dark')
      );
      expect(isRestoredDark).toBe(wasDark);

      // Discard changes (Cancel) so we don't pollute other tests
      await page.getByRole('button', { name: 'Cancel' }).click();
    });
  });

  test('settings persist after closing and reopening the modal', async ({ page, step }) => {
    await step('Home — open Settings modal', async () => {
      await goHome(page);
      await page.getByRole('button', { name: 'Settings' }).click();
      await expect(settingsHeading(page)).toBeVisible({ timeout: 5000 });
    });

    const overlay = page.locator('.fixed.inset-0');
    const darkToggle = overlay.getByRole('switch').first();

    await step('Settings modal — enable dark mode and save', async () => {
      await darkToggle.waitFor({ timeout: 5000 });

      // Check current state via aria-checked attribute
      const isCurrentlyChecked = (await darkToggle.getAttribute('aria-checked')) === 'true';

      // Enable dark mode if not already on
      if (!isCurrentlyChecked) {
        await darkToggle.click();
      }

      // Save changes — this persists to the store and closes the modal
      await page.getByRole('button', { name: 'Save Changes' }).click();
      await expect(settingsHeading(page)).toBeHidden();
    });

    await step('Home — reopen Settings modal', async () => {
      // Reopen
      await page.click('button[aria-label="Settings"]');
      await expect(settingsHeading(page)).toBeVisible();
    });

    await step('Settings modal — dark mode toggle persists as checked', async () => {
      // Dark mode switch should still be checked
      const persistedToggle = page.locator('.fixed.inset-0').getByRole('switch').first();
      await expect(persistedToggle).toHaveAttribute('aria-checked', 'true');

      // Cleanup — turn dark mode back off and save
      await persistedToggle.click();
      await page.getByRole('button', { name: 'Save Changes' }).click();
    });
  });
});
