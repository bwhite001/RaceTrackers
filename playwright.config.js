// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e/playwright',
  // Tests within a file run sequentially (required by 08-complete-race-simulation
  // which shares _page across tests). Files run in parallel — each worker gets
  // its own Chromium context with isolated IndexedDB.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : 4,
  reporter: [
    ['list'],
    ['./test/e2e/playwright/reporter.js', { outputFile: 'playwright-report/journey-report.html' }],
  ],
  timeout: 60000,
  expect: { timeout: 15000 },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'off', // screenshots handled by fixtures.js
    video: 'on-first-retry',
    actionTimeout: 15000,
    navigationTimeout: 30000,
    serviceWorkers: 'block', // prevent SW auto-reload from resetting React state mid-test
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Optionally start the dev server automatically
  webServer: {
    command: 'npx serve dist -p 3000 --single',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
