// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for testing the live deployed app.
 *
 * Detects whether a display is available:
 *   - If DISPLAY or WAYLAND_DISPLAY is set  → headed (visible browser)
 *   - Otherwise (CI / headless environment) → headless
 *
 * Run with: npm run test:playwright:live
 */

const hasDisplay = !!(process.env.DISPLAY || process.env.WAYLAND_DISPLAY);

export default defineConfig({
  testDir: './test/e2e/playwright',
  testMatch: '**/08-complete-race-simulation.journey.spec.js',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report/live', open: 'never' }],
  ],
  timeout: 90000,
  expect: { timeout: 20000 },
  use: {
    baseURL: 'https://racetrackers.bwhite.id.au',
    headless: !hasDisplay,
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'on-first-retry',
    actionTimeout: 20000,
    navigationTimeout: 45000,
    serviceWorkers: 'allow',
    viewport: { width: 1280, height: 900 },
  },
  projects: [
    {
      name: 'chromium-live',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // No webServer — tests run against the already-deployed app at baseURL
});
