// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e/playwright',
  fullyParallel: false, // journeys share IndexedDB state; run sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // 1 retry locally to handle timing flakiness
  workers: 1,
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
