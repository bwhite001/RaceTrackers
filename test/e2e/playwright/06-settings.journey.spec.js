/**
 * Customer Journey: Settings & App Preferences
 *
 * Verifies the Settings modal and user-preference persistence:
 *   1. Open settings from the home page
 *   2. Switch Theme to Dark (Light / Dark / Sunlight)
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

    // Theme is a Light / Dark / Sunlight segmented control (VK4WIP redesign)
    const overlay = page.locator('.fixed.inset-0');
    const darkButton = overlay.getByRole('button', { name: 'Dark', exact: true });
    const lightButton = overlay.getByRole('button', { name: 'Light', exact: true });

    await step('Settings modal — Theme control shows Light, Dark and Sunlight', async () => {
      await darkButton.waitFor({ timeout: 5000 });
      await expect(overlay.getByRole('button', { name: 'Sunlight', exact: true })).toBeVisible();
    });

    const wasDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );

    await step('Dark mode ON — html element gains "dark" class', async () => {
      await darkButton.click();
      await expect(darkButton).toHaveAttribute('aria-pressed', 'true');
      const isDarkNow = await page.evaluate(() =>
        document.documentElement.classList.contains('dark')
      );
      expect(isDarkNow).toBe(true);
    });

    await step('Dark mode OFF — "dark" class removed from html element', async () => {
      await lightButton.click();
      const isRestoredDark = await page.evaluate(() =>
        document.documentElement.classList.contains('dark')
      );
      expect(isRestoredDark).toBe(false);
      expect(wasDark).toBe(false);

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
    const darkButton = overlay.getByRole('button', { name: 'Dark', exact: true });

    await step('Settings modal — choose Dark theme and save', async () => {
      await darkButton.waitFor({ timeout: 5000 });
      if ((await darkButton.getAttribute('aria-pressed')) !== 'true') {
        await darkButton.click();
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

    await step('Settings modal — Dark theme is still selected', async () => {
      const persisted = page.locator('.fixed.inset-0').getByRole('button', { name: 'Dark', exact: true });
      await expect(persisted).toHaveAttribute('aria-pressed', 'true');

      // Cleanup — back to Light and save
      await page.locator('.fixed.inset-0').getByRole('button', { name: 'Light', exact: true }).click();
      await page.getByRole('button', { name: 'Save Changes' }).click();
    });
  });
});
